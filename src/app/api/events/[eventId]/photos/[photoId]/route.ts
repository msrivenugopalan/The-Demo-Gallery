import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { deletePhoto, getEventById, readStore } from "@/lib/store";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ eventId: string; photoId: string }> },
) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { eventId, photoId } = await params;
  const event = await getEventById(eventId);

  if (!event) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  const isAuthorized = event.adminId === user.id || event.memberIds.includes(user.id);

  if (!isAuthorized) {
    return NextResponse.json({ error: "You do not have permission to delete this photo." }, { status: 403 });
  }

  const store = await readStore();
  const photo = store.photos.find((item) => item.id === photoId && item.eventId === eventId);

  if (!photo) {
    return NextResponse.json({ error: "Photo not found." }, { status: 404 });
  }

  if (user.role !== "admin" && photo.uploadedBy !== user.id) {
    return NextResponse.json({ error: "You can only delete your own uploaded photos." }, { status: 403 });
  }

  try {
    await deletePhoto(photoId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete photo." },
      { status: 400 },
    );
  }
}
