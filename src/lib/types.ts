export type UserRole = "admin" | "team";

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  createdAt: string;
}

export interface EventItem {
  id: string;
  name: string;
  description: string;
  adminId: string;
  memberIds: string[];
  createdAt: string;
}

export interface PhotoItem {
  id: string;
  eventId: string;
  uploadedBy: string;
  filename: string;
  storageUrl: string;
  storageKey?: string;
  fileSize: number;
  createdAt: string;
}

export interface GalleryItem {
  id: string;
  eventId: string;
  title: string;
  pin: string;
  selectedPhotoIds: string[];
  createdAt: string;
}

export interface Store {
  users: User[];
  events: EventItem[];
  photos: PhotoItem[];
  galleries: GalleryItem[];
}
