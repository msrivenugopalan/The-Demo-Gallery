"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface GalleryItem {
  id: string;
  eventId: string;
  title: string;
  pin: string;
  selectedPhotoIds: string[];
  createdAt: string;
}

interface PhotoItem {
  id: string;
  eventId: string;
  uploadedBy: string;
  filename: string;
  storageUrl: string;
  fileSize: number;
  createdAt: string;
}

export default function GalleryPage() {
  const params = useParams();
  const [gallery, setGallery] = useState<GalleryItem | null>(null);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [pin, setPin] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [error, setError] = useState("");;

  useEffect(() => {
    async function loadGallery() {
      const response = await fetch(`/api/galleries/${params.galleryId}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Gallery not available.");
        return;
      }

      setGallery(data.gallery);
      setPhotos(data.photos || []);
    }

    if (params.galleryId) {
      void loadGallery();
    }
  }, [params.galleryId]);

  function handleUnlock() {
    if (!gallery) {
      return;
    }

    if (pin === gallery.pin) {
      setIsUnlocked(true);
      setError("");
      return;
    }

    setError("Incorrect PIN. Please try again.");
  }

  if (!gallery) {
    return <div className="p-10 text-center text-slate-600">Loading gallery...</div>;
  }

  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="rounded-3xl bg-slate-900 p-8 text-white">
        <p className="text-sm uppercase tracking-[0.2em] text-sky-300">Customer gallery</p>
        <h1 className="mt-3 text-4xl font-bold">{gallery.title}</h1>
      </div>

      {!isUnlocked ? (
        <div className="mt-8 max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Enter gallery PIN</h2>
          <input
            value={pin}
            onChange={(event) => setPin(event.target.value)}
            placeholder="PIN"
            className="mt-4 w-full rounded-xl border border-slate-300 px-3 py-2.5"
          />
          {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
          <button
            type="button"
            onClick={handleUnlock}
            className="mt-4 w-full rounded-xl bg-sky-600 px-4 py-3 font-semibold text-white"
          >
            Unlock gallery
          </button>
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((photo) => (
            <div key={photo.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <Image
                src={photo.storageUrl}
                alt={photo.filename}
                width={600}
                height={400}
                className="h-60 w-full object-cover"
              />
              <div className="space-y-3 p-4">
                <p className="font-medium text-slate-900">{photo.filename}</p>
                <a
                  href={photo.storageUrl}
                  download={photo.filename}
                  className="inline-flex rounded-full bg-sky-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-sky-500"
                >
                  Download image
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
