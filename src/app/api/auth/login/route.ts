import { NextResponse } from "next/server";

import { getUserByEmail } from "@/lib/store";

export async function POST(request: Request) {
  const body = await request.json();

  const user = await getUserByEmail(body.email);

  if (!user || user.password !== body.password) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true, user: { id: user.id, role: user.role } });
  response.cookies.set("photo_session", user.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  return response;
}
