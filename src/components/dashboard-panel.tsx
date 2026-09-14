"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "team";
}

interface EventItem {
  id: string;
  name: string;
  description: string;
  adminId: string;
  memberIds: string[];
  createdAt: string;
}

interface PhotoItem {
  id: string;
  eventId: string;
  uploadedBy: string;
  filename: string;
  storageUrl: string;
  storageKey?: string;
  fileSize: number;
  createdAt: string;
}

type DashboardView = "home" | "events" | "upload" | "gallery";

export function DashboardPanel() {
  const router = useRouter();
  const [session, setSession] = useState<SessionUser | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [galleryDetails, setGalleryDetails] = useState<{
    id: string;
    title: string;
    pin: string;
    createdAt: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [eventName, setEventName] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [galleryTitle, setGalleryTitle] = useState("");
  const [galleryPin, setGalleryPin] = useState("");
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([]);
  const [activeView, setActiveView] = useState<DashboardView>("home");
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);

  const loadGalleryDetails = useCallback(async (eventId: string) => {
    if (!eventId) {
      setGalleryDetails(null);
      return;
    }

    try {
      const response = await fetch(`/api/events/${eventId}/gallery`);
      if (!response.ok) {
        setGalleryDetails(null);
        return;
      }

      const data = await response.json();
      setGalleryDetails(data.gallery ?? null);
    } catch {
      setGalleryDetails(null);
    }
  }, []);

  const loadDashboard = useCallback(async () => {
    try {
      const sessionResponse = await fetch("/api/auth/session");
      if (!sessionResponse.ok) {
        router.push("/login");
        return;
      }

      const sessionData = await sessionResponse.json();
      setSession(sessionData.user);

      const eventsResponse = await fetch("/api/events");
      const eventsData = await eventsResponse.json();
      setEvents(eventsData.events || []);

      const eventId = eventsData.events?.[0]?.id ?? "";
      setSelectedEventId(eventId);

      if (eventId) {
        await Promise.all([loadPhotos(eventId), loadGalleryDetails(eventId)]);
      }
    } catch {
      setMessage("Unable to load your dashboard right now.");
    } finally {
      setLoading(false);
    }
  }, [loadGalleryDetails, router]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  async function loadPhotos(eventId: string) {
    const response = await fetch(`/api/events/${eventId}/photos`);
    const data = await response.json();
    setPhotos(data.photos || []);
  }

  async function handleCreateEvent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const response = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: eventName,
        description: eventDescription,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error || "Unable to create the event.");
      return;
    }

    setMessage("Event created successfully.");
    setEventName("");
    setEventDescription("");
    await loadDashboard();
  }

  async function handleAddMember(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const response = await fetch(`/api/events/${selectedEventId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberEmail }),
    });

    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error || "Unable to add the team member.");
      return;
    }

    setMessage(`Added ${result.member.name} to the event.`);
    setMemberEmail("");
    await loadDashboard();
  }

  async function handleUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fileInput = form.elements.namedItem("photo") as HTMLInputElement;
    const files = Array.from(fileInput.files ?? []);

    if (files.length === 0 || !selectedEventId) {
      setMessage("Please choose at least one photo and select an event.");
      return;
    }

    const formData = new FormData();
    files.forEach((file) => formData.append("photo", file));

    const response = await fetch(`/api/events/${selectedEventId}/photos`, {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error || "Photo upload failed.");
      return;
    }

    const uploadedCount = Array.isArray(result.photos) ? result.photos.length : 1;
    setMessage(`Uploaded ${uploadedCount} photo(s) successfully.`);
    form.reset();
    await loadPhotos(selectedEventId);
  }

  async function handlePublishGallery(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const response = await fetch(`/api/events/${selectedEventId}/gallery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: galleryTitle,
        pin: galleryPin,
        selectedPhotoIds,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error || "Unable to publish gallery.");
      return;
    }

    setMessage(
      `Gallery published. Share the link: ${window.location.origin}/gallery/${result.gallery.id} with PIN ${result.gallery.pin}`,
    );
    setGalleryTitle("");
    setGalleryPin("");
    setSelectedPhotoIds([]);
    await loadDashboard();
  }

  async function handleCopyGalleryLink() {
    if (!galleryDetails) {
      return;
    }

    const shareUrl = `${window.location.origin}/gallery/${galleryDetails.id}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setMessage("Gallery link copied to clipboard.");
    } catch {
      setMessage(`Unable to copy automatically. Copy this link manually: ${shareUrl}`);
    }
  }

  async function handleCopyGalleryPin() {
    if (!galleryDetails) {
      return;
    }

    try {
      await navigator.clipboard.writeText(galleryDetails.pin);
      setMessage("Gallery PIN copied to clipboard.");
    } catch {
      setMessage(`Unable to copy automatically. Use this PIN manually: ${galleryDetails.pin}`);
    }
  }

  async function handleDeletePhoto(photoId: string) {
    if (!selectedEventId) {
      return;
    }

    setDeletingPhotoId(photoId);

    try {
      const response = await fetch(`/api/events/${selectedEventId}/photos/${photoId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error || "Unable to delete photo.");
        return;
      }

      setMessage("Photo deleted successfully.");
      await loadPhotos(selectedEventId);
    } catch {
      setMessage("Unable to delete this photo right now.");
    } finally {
      setDeletingPhotoId(null);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  const eventPhotos = useMemo(
    () => photos.filter((photo) => photo.eventId === selectedEventId),
    [photos, selectedEventId],
  );

  const currentEvent = useMemo(
    () => events.find((event) => event.id === selectedEventId) ?? null,
    [events, selectedEventId],
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#05070b] px-4 text-base text-slate-300">
        Loading dashboard...
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const navItems: Array<{ key: DashboardView; label: string; icon: string }> = [
    { key: "home", label: "Home", icon: "⌂" },
    { key: "events", label: "Events", icon: "◫" },
    { key: "upload", label: "Upload", icon: "+" },
    { key: "gallery", label: "Gallery", icon: "◌" },
  ];

  return (
    <div className="min-h-screen bg-[#05070b] px-3 py-4 text-white sm:px-5 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="rounded-[28px] border border-white/10 bg-[#0d1117] p-4 shadow-[0_20px_60px_rgba(15,23,42,0.8)] sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-sky-300">The Dream Gallery</p>
              <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Welcome, {session.name}</h1>
            </div>

            <div className="flex items-center gap-3 self-start lg:self-auto">
              <div className="rounded-full border border-sky-500/40 bg-sky-500/10 px-3 py-1.5 text-xs font-medium text-sky-200">
                {session.role === "admin" ? "Admin" : "Team Member"}
              </div>
              <button
                onClick={handleLogout}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-white/10"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        <nav className="mt-4 rounded-[24px] border border-white/10 bg-[#0d1117] p-2 shadow-[0_10px_30px_rgba(15,23,42,0.6)]">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {navItems.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setActiveView(item.key)}
                className={`flex min-w-[120px] items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                  activeView === item.key
                    ? "bg-white text-slate-900"
                    : "bg-transparent text-slate-300 hover:bg-white/5"
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        </nav>

        {message ? (
          <div className="mt-4 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
            {message}
          </div>
        ) : null}

        <main className="mt-5 space-y-5">
          {activeView === "home" ? (
            <>
              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1.3fr_0.7fr]">
                <div className="rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top,_#1e293b,_#0d1117_45%,_#090d12)] p-5 sm:p-6">
                  <p className="text-sm uppercase tracking-[0.28em] text-sky-300">Explore</p>
                  <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Curate event moments with ease.</h2>
                  <p className="mt-3 max-w-lg text-sm text-slate-300 sm:text-base">
                    Review uploads, invite team members, create galleries, and make your event stories ready for customers.
                  </p>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveView("upload")}
                      className="rounded-full bg-sky-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
                    >
                      Upload Photos
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveView("events")}
                      className="rounded-full border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
                    >
                      Create Event
                    </button>
                  </div>
                </div>

                <div className="rounded-[28px] border border-white/10 bg-[#0d1117] p-5">
                  <p className="text-sm text-slate-400">Selected Event</p>
                  <h3 className="mt-2 text-2xl font-bold">{currentEvent?.name ?? "No event selected"}</h3>
                  <p className="mt-2 text-sm text-slate-300">
                    {currentEvent?.description ?? "Choose an event to begin managing photos."}
                  </p>

                  <div className="mt-5 space-y-3">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Role</p>
                      <p className="mt-1 text-lg font-semibold capitalize">{session.role}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Team Members</p>
                      <p className="mt-1 text-lg font-semibold">{currentEvent?.memberIds.length ?? 0}</p>
                    </div>
                    {session.role === "admin" ? (
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Published Gallery</p>
                        {galleryDetails ? (
                          <div className="mt-2 space-y-3">
                            <a
                              href={`/gallery/${galleryDetails.id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="block truncate text-sm font-semibold text-sky-300 underline decoration-sky-400/60 underline-offset-4"
                            >
                              {window.location.origin}/gallery/{galleryDetails.id}
                            </a>
                            <p className="text-sm text-slate-300">PIN: {galleryDetails.pin}</p>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => void handleCopyGalleryLink()}
                                className="rounded-full border border-sky-400/40 bg-sky-500/10 px-3 py-1.5 text-xs font-medium text-sky-100 transition hover:bg-sky-500/20"
                              >
                                Copy link
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleCopyGalleryPin()}
                                className="rounded-full border border-violet-400/40 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-100 transition hover:bg-violet-500/20"
                              >
                                Copy PIN
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="mt-2 text-sm text-slate-400">No gallery published yet.</p>
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>
              </section>

              <section className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-[24px] border border-white/10 bg-[#0d1117] p-4">
                  <p className="text-sm text-slate-400">Assigned Events</p>
                  <p className="mt-3 text-3xl font-bold">{events.length}</p>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-[#0d1117] p-4">
                  <p className="text-sm text-slate-400">Uploaded Photos</p>
                  <p className="mt-3 text-3xl font-bold">{photos.length}</p>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-[#0d1117] p-4">
                  <p className="text-sm text-slate-400">Gallery Picks</p>
                  <p className="mt-3 text-3xl font-bold">{selectedPhotoIds.length}</p>
                </div>
              </section>

              <section className="rounded-[28px] border border-white/10 bg-[#0d1117] p-4 sm:p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="text-xl font-semibold">Recent Photos</h3>
                  <button
                    type="button"
                    onClick={() => setActiveView("upload")}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-100 transition hover:bg-white/10"
                  >
                    Upload More
                  </button>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {eventPhotos.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-8 text-center text-sm text-slate-400">
                      No photos uploaded yet for this event.
                    </div>
                  ) : (
                    eventPhotos.slice(0, 6).map((photo) => (
                      <div key={photo.id} className="overflow-hidden rounded-[24px] border border-white/10 bg-black">
                        <div className="relative h-52">
                          <Image
                            src={photo.storageUrl}
                            alt={photo.filename}
                            fill
                            className="object-cover"
                          />
                          {session.role === "admin" || photo.uploadedBy === session.id ? (
                            <button
                              type="button"
                              onClick={() => void handleDeletePhoto(photo.id)}
                              disabled={deletingPhotoId === photo.id}
                              className="absolute right-3 top-3 rounded-full bg-black/60 px-2.5 py-1.5 text-[10px] font-medium text-white transition hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {deletingPhotoId === photo.id ? "Deleting..." : "Delete"}
                            </button>
                          ) : null}
                        </div>
                        <div className="p-3">
                          <p className="truncate text-sm font-medium text-slate-100">{photo.filename}</p>
                          <p className="mt-1 text-xs text-slate-400">{photo.fileSize} bytes</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </>
          ) : null}

          {activeView === "events" ? (
            <section className="grid gap-5 xl:grid-cols-[1fr_1fr]">
              <div className="rounded-[28px] border border-white/10 bg-[#0d1117] p-5">
                <h3 className="text-xl font-semibold">Create Event</h3>
                <form onSubmit={handleCreateEvent} className="mt-4 space-y-4">
                  <input
                    value={eventName}
                    onChange={(event) => setEventName(event.target.value)}
                    placeholder="Event name"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white placeholder:text-slate-400"
                  />
                  <textarea
                    value={eventDescription}
                    onChange={(event) => setEventDescription(event.target.value)}
                    placeholder="Event description"
                    className="min-h-28 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white placeholder:text-slate-400"
                  />
                  <button
                    type="submit"
                    className="rounded-full bg-sky-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
                  >
                    Create Event
                  </button>
                </form>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-[#0d1117] p-5">
                <h3 className="text-xl font-semibold">Event Overview</h3>

                <div className="mt-4 space-y-3">
                  {events.map((event) => (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => {
                        setSelectedEventId(event.id);
                        void loadPhotos(event.id);
                        void loadGalleryDetails(event.id);
                        setActiveView("upload");
                      }}
                      className={`w-full rounded-2xl border p-4 text-left transition ${
                        selectedEventId === event.id
                          ? "border-sky-400 bg-sky-500/10"
                          : "border-white/10 bg-white/5 hover:bg-white/10"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-50">{event.name}</p>
                          <p className="mt-1 text-xs text-slate-400">{event.description}</p>
                        </div>
                        <span className="rounded-full bg-white/5 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-300">
                          {event.memberIds.length} members
                        </span>
                      </div>
                    </button>
                  ))}
                </div>

                <form onSubmit={handleAddMember} className="mt-5 space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <h4 className="text-base font-semibold">Add Team Member</h4>
                  <input
                    value={memberEmail}
                    onChange={(event) => setMemberEmail(event.target.value)}
                    placeholder="Enter team member email"
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-3 py-3 text-sm text-white placeholder:text-slate-400"
                  />
                  <button
                    type="submit"
                    className="rounded-full bg-violet-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-400"
                  >
                    Add Member
                  </button>
                </form>
              </div>
            </section>
          ) : null}

          {activeView === "upload" ? (
            <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-[28px] border border-white/10 bg-[#0d1117] p-5">
                <h3 className="text-xl font-semibold">Upload Photos</h3>
                <form onSubmit={handleUpload} className="mt-4 space-y-4">
                  <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-4">
                    <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-500/50 bg-slate-950/40 p-8 text-center">
                      <span className="text-2xl">＋</span>
                      <span className="text-sm text-slate-300">Choose images to upload</span>
                      <input type="file" name="photo" accept="image/*" multiple className="hidden" />
                    </label>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Event</p>
                    <select
                      value={selectedEventId}
                      onChange={(event) => {
                        const nextEventId = event.target.value;
                        setSelectedEventId(nextEventId);
                        void loadPhotos(nextEventId);
                      }}
                      className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-3 text-sm text-white"
                    >
                      {events.map((event) => (
                        <option key={event.id} value={event.id}>
                          {event.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="rounded-full bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-400"
                  >
                    Upload
                  </button>
                </form>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-[#0d1117] p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="text-xl font-semibold">Uploaded Files</h3>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300">
                    {eventPhotos.length} items
                  </span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {eventPhotos.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-8 text-center text-sm text-slate-400 sm:col-span-2">
                      No images in this event yet.
                    </div>
                  ) : (
                    eventPhotos.map((photo) => (
                      <div key={photo.id} className="overflow-hidden rounded-[22px] border border-white/10 bg-black">
                        <div className="relative h-40">
                          <Image
                            src={photo.storageUrl}
                            alt={photo.filename}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex items-center justify-between gap-2 p-3">
                          <div>
                            <p className="truncate text-sm font-medium text-slate-100">{photo.filename}</p>
                            <p className="text-xs text-slate-400">{photo.fileSize} bytes</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => void handleDeletePhoto(photo.id)}
                            disabled={deletingPhotoId === photo.id}
                            className="rounded-full border border-red-500/40 bg-red-500/10 px-2 py-1 text-[10px] font-medium text-red-200 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {deletingPhotoId === photo.id ? "..." : "Delete"}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>
          ) : null}

          {activeView === "gallery" ? (
            <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
              <div className="rounded-[28px] border border-white/10 bg-[#0d1117] p-5">
                <h3 className="text-xl font-semibold">Publish Gallery</h3>
                <form onSubmit={handlePublishGallery} className="mt-4 space-y-4">
                  <input
                    value={galleryTitle}
                    onChange={(event) => setGalleryTitle(event.target.value)}
                    placeholder="Gallery title"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white placeholder:text-slate-400"
                  />
                  <input
                    value={galleryPin}
                    onChange={(event) => setGalleryPin(event.target.value)}
                    placeholder="Gallery PIN"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white placeholder:text-slate-400"
                  />

                  <div className="space-y-3">
                    {eventPhotos.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-4 text-sm text-slate-400">
                        Add photos first before publishing.
                      </div>
                    ) : (
                      eventPhotos.map((photo) => (
                        <label
                          key={photo.id}
                          className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 text-sm"
                        >
                          <input
                            type="checkbox"
                            checked={selectedPhotoIds.includes(photo.id)}
                            onChange={() => {
                              setSelectedPhotoIds((current) =>
                                current.includes(photo.id)
                                  ? current.filter((item) => item !== photo.id)
                                  : [...current, photo.id],
                              );
                            }}
                          />
                          <span>{photo.filename}</span>
                        </label>
                      ))
                    )}
                  </div>

                  <button
                    type="submit"
                    className="rounded-full bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
                  >
                    Publish Gallery
                  </button>
                </form>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-[#0d1117] p-5">
                <h3 className="text-xl font-semibold">Selected Photos</h3>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {selectedPhotoIds.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-8 text-center text-sm text-slate-400 sm:col-span-2">
                      No photos selected yet.
                    </div>
                  ) : (
                    eventPhotos
                      .filter((photo) => selectedPhotoIds.includes(photo.id))
                      .map((photo) => (
                        <div key={photo.id} className="overflow-hidden rounded-[22px] border border-white/10 bg-black">
                          <div className="relative h-40">
                            <Image
                              src={photo.storageUrl}
                              alt={photo.filename}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="p-3">
                            <p className="truncate text-sm font-medium text-slate-100">{photo.filename}</p>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </section>
          ) : null}
        </main>
      </div>
    </div>
  );
}
