import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";

import type { EventItem, GalleryItem, PhotoItem, Store, User } from "./types";

const DATA_DIRECTORY = path.join(process.cwd(), "data");
const STORE_FILE = path.join(DATA_DIRECTORY, "store.json");
const UPLOAD_DIRECTORY = path.join(process.cwd(), "public", "uploads");

const defaultStore: Store = {
  users: [
    {
      id: "admin-user",
      name: "Demo Admin",
      email: "admin@demo.com",
      password: "admin123",
      role: "admin",
      createdAt: new Date().toISOString(),
    },
    {
      id: "team-user",
      name: "Demo Team Member",
      email: "team@demo.com",
      password: "team123",
      role: "team",
      createdAt: new Date().toISOString(),
    },
  ],
  events: [
    {
      id: "event-wedding",
      name: "Arjun & Priya Wedding",
      description: "A collaborative event gallery for the team and customers.",
      adminId: "admin-user",
      memberIds: ["team-user"],
      createdAt: new Date().toISOString(),
    },
  ],
  photos: [
    {
      id: "photo-1",
      eventId: "event-wedding",
      uploadedBy: "team-user",
      filename: "wedding-sample-1.jpg",
      storageUrl:
        "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=900&q=80",
      fileSize: 146000,
      createdAt: new Date().toISOString(),
    },
    {
      id: "photo-2",
      eventId: "event-wedding",
      uploadedBy: "team-user",
      filename: "wedding-sample-2.jpg",
      storageUrl:
        "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80",
      fileSize: 176000,
      createdAt: new Date().toISOString(),
    },
  ],
  galleries: [],
};

export async function ensureStore() {
  await fs.mkdir(DATA_DIRECTORY, { recursive: true });
  await fs.mkdir(UPLOAD_DIRECTORY, { recursive: true });

  try {
    await fs.access(STORE_FILE);
  } catch {
    await fs.writeFile(STORE_FILE, JSON.stringify(defaultStore, null, 2), "utf-8");
  }
}

export async function readStore(): Promise<Store> {
  await ensureStore();

  const content = await fs.readFile(STORE_FILE, "utf-8");
  return JSON.parse(content) as Store;
}

export async function writeStore(store: Store) {
  await fs.mkdir(DATA_DIRECTORY, { recursive: true });
  await fs.writeFile(STORE_FILE, JSON.stringify(store, null, 2), "utf-8");
}

export async function getEventById(eventId: string) {
  const store = await readStore();
  return store.events.find((event) => event.id === eventId) ?? null;
}

export async function getUserByEmail(email: string) {
  const store = await readStore();
  return store.users.find((user) => user.email.toLowerCase() === email.toLowerCase()) ?? null;
}

export async function getUserById(userId: string) {
  const store = await readStore();
  return store.users.find((user) => user.id === userId) ?? null;
}

export async function createUser(input: {
  name: string;
  email: string;
  password: string;
}): Promise<User> {
  const store = await readStore();

  const existingUser = store.users.find(
    (user) => user.email.toLowerCase() === input.email.toLowerCase(),
  );

  if (existingUser) {
    throw new Error("User already exists.");
  }

  const user: User = {
    id: randomUUID(),
    name: input.name,
    email: input.email,
    password: input.password,
    role: "admin",
    createdAt: new Date().toISOString(),
  };

  store.users.push(user);
  await writeStore(store);

  return user;
}

export async function createEvent(input: { name: string; description: string; adminId: string }) {
  const store = await readStore();

  const event: EventItem = {
    id: randomUUID(),
    name: input.name,
    description: input.description,
    adminId: input.adminId,
    memberIds: [],
    createdAt: new Date().toISOString(),
  };

  store.events.push(event);
  await writeStore(store);

  return event;
}

export async function addTeamMember(eventId: string, memberEmail: string) {
  const store = await readStore();
  const event = store.events.find((item) => item.id === eventId);

  if (!event) {
    throw new Error("Event not found.");
  }

  const user = store.users.find(
    (entry) => entry.email.toLowerCase() === memberEmail.toLowerCase(),
  );

  if (!user) {
    throw new Error("Team member not found.");
  }

  if (user.role !== "team") {
    throw new Error("Only team-member accounts can be added to an event.");
  }

  if (!event.memberIds.includes(user.id)) {
    event.memberIds.push(user.id);
    await writeStore(store);
  }

  return user;
}

const STORAGE_PROVIDER = (process.env.PHOTO_STORAGE_PROVIDER ?? "local").toLowerCase();
const AWS_REGION = process.env.AWS_REGION ?? "us-east-1";
const AWS_S3_BUCKET = process.env.AWS_S3_BUCKET;
const AWS_S3_PREFIX = (process.env.AWS_S3_PREFIX ?? "").replace(/^\/+|\/+$/g, "");
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const AWS_ENDPOINT_URL = process.env.AWS_ENDPOINT_URL;
const AWS_S3_FORCE_PATH_STYLE = process.env.AWS_S3_FORCE_PATH_STYLE === "true";
const GCS_BUCKET = process.env.GCS_BUCKET;
const GCS_PROJECT_ID = process.env.GCS_PROJECT_ID;
const GCS_PREFIX = (process.env.GCS_PREFIX ?? "").replace(/^\/+|\/+$/g, "");
const GCS_KEYFILE_JSON = process.env.GCS_KEYFILE_JSON;

function getStorageDirectoryKey(filename: string) {
  return [GCS_PREFIX, filename].filter(Boolean).join("/");
}

function getS3ObjectKey(filename: string) {
  return [AWS_S3_PREFIX, filename].filter(Boolean).join("/");
}

function getLocalStorageUrl(filename: string) {
  return `/uploads/${filename}`;
}

async function storePhotoFile(input: { file: File; filename: string }) {
  const buffer = Buffer.from(await input.file.arrayBuffer());

  if (STORAGE_PROVIDER === "s3") {
    if (!AWS_S3_BUCKET) {
      throw new Error("AWS_S3_BUCKET is required when PHOTO_STORAGE_PROVIDER=s3.");
    }

    const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
    const client = new S3Client({
      region: AWS_REGION,
      endpoint: AWS_ENDPOINT_URL || undefined,
      forcePathStyle: AWS_S3_FORCE_PATH_STYLE || !!AWS_ENDPOINT_URL,
      credentials:
        AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY
          ? {
              accessKeyId: AWS_ACCESS_KEY_ID,
              secretAccessKey: AWS_SECRET_ACCESS_KEY,
            }
          : undefined,
    });

    const key = getS3ObjectKey(input.filename);

    await client.send(
      new PutObjectCommand({
        Bucket: AWS_S3_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: input.file.type || "application/octet-stream",
      }),
    );

    const endpoint = AWS_ENDPOINT_URL ? AWS_ENDPOINT_URL.replace(/\/+$/, "") : undefined;
    const storageUrl = endpoint
      ? `${endpoint}/${AWS_S3_BUCKET}/${key}`
      : `https://${AWS_S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${key}`;

    return {
      storageUrl,
      storageKey: key,
      filename: input.filename,
    };
  }

  if (STORAGE_PROVIDER === "gcs") {
    if (!GCS_BUCKET) {
      throw new Error("GCS_BUCKET is required when PHOTO_STORAGE_PROVIDER=gcs.");
    }

    const { Storage } = await import("@google-cloud/storage");
    const storage = new Storage({
      projectId: GCS_PROJECT_ID,
      credentials: GCS_KEYFILE_JSON ? JSON.parse(GCS_KEYFILE_JSON) : undefined,
    });

    const key = getStorageDirectoryKey(input.filename);
    const bucket = storage.bucket(GCS_BUCKET);
    const object = bucket.file(key);

    await object.save(buffer, {
      metadata: {
        contentType: input.file.type || "application/octet-stream",
      },
    });

    await object.makePublic();

    return {
      storageUrl: `https://storage.googleapis.com/${GCS_BUCKET}/${key}`,
      storageKey: key,
      filename: input.filename,
    };
  }

  const uploadPath = path.join(UPLOAD_DIRECTORY, input.filename);
  await fs.writeFile(uploadPath, buffer);

  return {
    storageUrl: getLocalStorageUrl(input.filename),
    storageKey: input.filename,
    filename: input.filename,
  };
}

function getStorageKeyFromStorageUrl(storageUrl: string) {
  try {
    const url = new URL(storageUrl);

    if (url.hostname === "storage.googleapis.com") {
      return url.pathname.replace(/^\/+[^/]+\//, "");
    }

    if (url.hostname.includes("amazonaws.com")) {
      return url.pathname.replace(/^\/+/, "");
    }

    if (url.pathname.startsWith("/uploads/")) {
      return url.pathname.replace(/^\/+/, "");
    }

    return url.pathname.replace(/^\/+/, "");
  } catch {
    return storageUrl.replace(/^\/+/, "");
  }
}

async function deletePhotoFile(input: { storageUrl: string; storageKey?: string }) {
  const storageKey = input.storageKey ?? getStorageKeyFromStorageUrl(input.storageUrl);
  const normalizedStorageKey = storageKey.replace(/^uploads\//, "");

  if (STORAGE_PROVIDER === "s3") {
    if (!AWS_S3_BUCKET) {
      throw new Error("AWS_S3_BUCKET is required when PHOTO_STORAGE_PROVIDER=s3.");
    }

    const { S3Client, DeleteObjectCommand } = await import("@aws-sdk/client-s3");
    const client = new S3Client({
      region: AWS_REGION,
      endpoint: AWS_ENDPOINT_URL || undefined,
      forcePathStyle: AWS_S3_FORCE_PATH_STYLE || !!AWS_ENDPOINT_URL,
      credentials:
        AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY
          ? {
              accessKeyId: AWS_ACCESS_KEY_ID,
              secretAccessKey: AWS_SECRET_ACCESS_KEY,
            }
          : undefined,
    });

    await client.send(
      new DeleteObjectCommand({
        Bucket: AWS_S3_BUCKET,
        Key: storageKey,
      }),
    );

    return;
  }

  if (STORAGE_PROVIDER === "gcs") {
    if (!GCS_BUCKET) {
      throw new Error("GCS_BUCKET is required when PHOTO_STORAGE_PROVIDER=gcs.");
    }

    const { Storage } = await import("@google-cloud/storage");
    const storage = new Storage({
      projectId: GCS_PROJECT_ID,
      credentials: GCS_KEYFILE_JSON ? JSON.parse(GCS_KEYFILE_JSON) : undefined,
    });

    await storage.bucket(GCS_BUCKET).file(storageKey).delete();
    return;
  }

  const uploadPath = path.join(process.cwd(), "public", "uploads", normalizedStorageKey);

  try {
    await fs.access(uploadPath);
    await fs.unlink(uploadPath);
  } catch {
    // Ignore missing local files.
  }
}

export async function uploadPhoto(input: {
  eventId: string;
  uploadedBy: string;
  file: File;
}) {
  const store = await readStore();

  const event = store.events.find((item) => item.id === input.eventId);
  if (!event) {
    throw new Error("Event not found.");
  }

  const allowedUser =
    event.adminId === input.uploadedBy || event.memberIds.includes(input.uploadedBy);

  if (!allowedUser) {
    throw new Error("You do not have permission to upload to this event.");
  }

  const originalName = input.file.name.replace(/[^a-zA-Z0-9.-]/g, "-");
  const filename = `${randomUUID()}-${originalName}`;

  const storedFile = await storePhotoFile({ file: input.file, filename });

  const photo: PhotoItem = {
    id: randomUUID(),
    eventId: input.eventId,
    uploadedBy: input.uploadedBy,
    filename: originalName,
    storageUrl: storedFile.storageUrl,
    storageKey: storedFile.storageKey,
    fileSize: input.file.size,
    createdAt: new Date().toISOString(),
  };

  store.photos.push(photo);
  await writeStore(store);

  return photo;
}

export async function createGallery(input: {
  eventId: string;
  title: string;
  pin: string;
  selectedPhotoIds: string[];
}) {
  const store = await readStore();

  const event = store.events.find((item) => item.id === input.eventId);

  if (!event) {
    throw new Error("Event not found.");
  }

  const gallery: GalleryItem = {
    id: randomUUID(),
    eventId: input.eventId,
    title: input.title,
    pin: input.pin,
    selectedPhotoIds: input.selectedPhotoIds,
    createdAt: new Date().toISOString(),
  };

  store.galleries.push(gallery);
  await writeStore(store);

  return gallery;
}

export async function deletePhoto(photoId: string) {
  const store = await readStore();
  const photoIndex = store.photos.findIndex((photo) => photo.id === photoId);

  if (photoIndex === -1) {
    throw new Error("Photo not found.");
  }

  const [photo] = store.photos.splice(photoIndex, 1);
  await deletePhotoFile({ storageUrl: photo.storageUrl, storageKey: photo.storageKey });
  await writeStore(store);

  return photo;
}

export async function getGalleryById(galleryId: string) {
  const store = await readStore();
  return store.galleries.find((gallery) => gallery.id === galleryId) ?? null;
}
