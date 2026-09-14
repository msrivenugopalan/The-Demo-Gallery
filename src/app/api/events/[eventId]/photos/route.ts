import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { getEventById, readStore, uploadPhoto } from "@/lib/store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ eventId: string }> },
) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { eventId } = await params;
  const event = await getEventById(eventId);

  if (!event) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  const store = await readStore();
  const photos = store.photos.filter((photo) => photo.eventId === eventId);

  if (user.role === "admin" && event.adminId === user.id) {
    return NextResponse.json({ photos });
  }

  if (event.memberIds.includes(user.id) || event.adminId === user.id) {
    return NextResponse.json({ photos });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> },
) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { eventId } = await params;
  const event = await getEventById(eventId);

  if (!event) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  const isAuthorized = event.adminId === user.id || event.memberIds.includes(user.id);

  if (!isAuthorized) {
    return NextResponse.json({ error: "You do not have permission to upload to this event." }, { status: 403 });
  }

  const formData = await request.formData();
  const files = formData.getAll("photo").filter((entry): entry is File => entry instanceof File);

  if (files.length === 0) {
    return NextResponse.json({ error: "At least one photo file is required." }, { status: 400 });
  }

  try {
    const uploadedPhotos = [] as Awaited<ReturnType<typeof uploadPhoto>>[];

    for (const file of files) {
      const photo = await uploadPhoto({ eventId, uploadedBy: user.id, file });
      uploadedPhotos.push(photo);
    }

    return NextResponse.json({ photos: uploadedPhotos }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed." },
      { status: 400 },
    );
  }
}
