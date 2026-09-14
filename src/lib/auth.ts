import { cookies } from "next/headers";

import { readStore } from "./store";

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("photo_session")?.value;

  if (!sessionId) {
    return null;
  }

  const store = await readStore();
  return store.users.find((user) => user.id === sessionId) ?? null;
}
