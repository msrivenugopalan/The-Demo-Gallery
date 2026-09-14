import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { createGallery, getEventById, readStore } from "@/lib/store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ eventId: string }> },
) {
  const { eventId } = await params;
  const store = await readStore();
  const gallery = store.galleries.find((item) => item.eventId === eventId);

  if (!gallery) {
    return NextResponse.json({ error: "Gallery not found." }, { status: 404 });
  }

  return NextResponse.json({ gallery });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> },
) {
  const user = await getCurrentUser();

  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const { eventId } = await params;
  const event = await getEventById(eventId);

  if (!event || event.adminId !== user.id) {
    return NextResponse.json({ error: "You can only publish galleries for your own events." }, { status: 403 });
  }

  const body = await request.json();

  if (!body.title || !body.pin || !Array.isArray(body.selectedPhotoIds)) {
    return NextResponse.json(
      { error: "Gallery title, PIN, and selected photo IDs are required." },
      { status: 400 },
    );
  }

  const store = await readStore();
  const existing = store.galleries.find((item) => item.eventId === eventId);

  if (existing) {
    return NextResponse.json({ error: "A gallery already exists for this event." }, { status: 409 });
  }

  const gallery = await createGallery({
    eventId,
    title: body.title,
    pin: body.pin,
    selectedPhotoIds: body.selectedPhotoIds,
  });

  return NextResponse.json({ gallery }, { status: 201 });
}
