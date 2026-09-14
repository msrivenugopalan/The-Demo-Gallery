import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { createEvent, readStore } from "@/lib/store";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const store = await readStore();
  const events = store.events.filter((event) => {
    if (user.role === "admin") {
      return event.adminId === user.id;
    }

    return event.adminId === user.id || event.memberIds.includes(user.id);
  });

  return NextResponse.json({ events });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const body = await request.json();

  if (!body.name || !body.description) {
    return NextResponse.json({ error: "Name and description are required." }, { status: 400 });
  }

  const event = await createEvent({ name: body.name, description: body.description, adminId: user.id });

  return NextResponse.json({ event }, { status: 201 });
}
