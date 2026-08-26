"use client";

import { getFirebaseAuth } from "@/lib/firebase/client";

/** 呼叫本專案 /api/* route 的 fetch 包裝,自動帶入 Firebase ID token。 */
export async function apiFetch<T>(input: string, init?: RequestInit): Promise<T> {
  const currentUser = getFirebaseAuth().currentUser;
  if (!currentUser) throw new Error("尚未登入");
  const idToken = await currentUser.getIdToken();

  const res = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
      ...(init?.headers ?? {}),
    },
  });

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const message = (body && typeof body === "object" && "error" in body && String(body.error)) || res.statusText;
    throw new Error(message);
  }
  return body as T;
}
