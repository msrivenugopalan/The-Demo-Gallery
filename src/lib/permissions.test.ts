import { describe, expect, it } from "vitest";

import { canAccessEvent, canPublishGallery, canUploadToEvent } from "./permissions";
import type { EventItem, User } from "./types";

const adminUser: User = {
  id: "admin-1",
  name: "Demo Admin",
  email: "admin@demo.com",
  password: "admin123",
  role: "admin",
  createdAt: "2026-01-01T00:00:00.000Z",
};

const teamUser: User = {
  id: "team-1",
  name: "Demo Team",
  email: "team@demo.com",
  password: "team123",
  role: "team",
  createdAt: "2026-01-01T00:00:00.000Z",
};

const guestUser: User = {
  id: "guest-1",
  name: "Another User",
  email: "guest@example.com",
  password: "guest123",
  role: "team",
  createdAt: "2026-01-01T00:00:00.000Z",
};

const event: EventItem = {
  id: "event-1",
  name: "Wedding Event",
  description: "Sample event",
  adminId: adminUser.id,
  memberIds: [teamUser.id],
  createdAt: "2026-01-01T00:00:00.000Z",
};

describe("permission checks", () => {
  it("allows the admin and assigned team members to access the event", () => {
    expect(canAccessEvent(adminUser, event)).toBe(true);
    expect(canAccessEvent(teamUser, event)).toBe(true);
  });

  it("blocks unassigned users from accessing the event", () => {
    expect(canAccessEvent(guestUser, event)).toBe(false);
  });

  it("allows team members to upload photos for assigned events", () => {
    expect(canUploadToEvent(teamUser, event)).toBe(true);
  });

  it("blocks team members from publishing galleries", () => {
    expect(canPublishGallery(teamUser, event)).toBe(false);
  });

  it("allows only the admin owner to publish a gallery", () => {
    expect(canPublishGallery(adminUser, event)).toBe(true);
  });
});
