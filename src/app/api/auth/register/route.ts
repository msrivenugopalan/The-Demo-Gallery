import { NextResponse } from "next/server";

import { createUser, getUserByEmail } from "@/lib/store";

export async function POST(request: Request) {
  const body = await request.json();

  if (!body.name || !body.email || !body.password) {
    return NextResponse.json({ error: "Name, email, and password are required." }, { status: 400 });
  }

  const existingUser = await getUserByEmail(body.email);

  if (existingUser) {
    return NextResponse.json({ error: "User already exists." }, { status: 409 });
  }

  const user = await createUser({
    name: body.name,
    email: body.email,
    password: body.password,
  });

  const response = NextResponse.json({ ok: true, user: { id: user.id, role: user.role } });
  response.cookies.set("photo_session", user.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  return response;
}
