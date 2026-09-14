import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { addTeamMember, getEventById } from "@/lib/store";

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
    return NextResponse.json({ error: "You can only manage your own events." }, { status: 403 });
  }

  const body = await request.json();

  if (!body.memberEmail) {
    return NextResponse.json({ error: "Member email is required." }, { status: 400 });
  }

  try {
    const member = await addTeamMember(eventId, body.memberEmail);
    return NextResponse.json({ member }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to add member." },
      { status: 400 },
    );
  }
}
