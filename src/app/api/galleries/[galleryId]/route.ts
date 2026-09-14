import { NextResponse } from "next/server";

import { getGalleryById, readStore } from "@/lib/store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ galleryId: string }> },
) {
  const { galleryId } = await params;
  const gallery = await getGalleryById(galleryId);

  if (!gallery) {
    return NextResponse.json({ error: "Gallery not found." }, { status: 404 });
  }

  const store = await readStore();
  const selectedPhotos = store.photos.filter((photo) => gallery.selectedPhotoIds.includes(photo.id));

  return NextResponse.json({
    gallery,
    photos: selectedPhotos,
  });
}
