import type { EventItem, User } from "./types";

export function canAccessEvent(user: User, event: EventItem) {
  return event.adminId === user.id || event.memberIds.includes(user.id);
}

export function canUploadToEvent(user: User, event: EventItem) {
  return event.adminId === user.id || event.memberIds.includes(user.id);
}

export function canPublishGallery(user: User, event: EventItem) {
  return user.role === "admin" && event.adminId === user.id;
}
