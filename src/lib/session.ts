"use client";

import { useEffect, useState } from "react";

export type Role = "teacher" | "student";

export type Session = { nickname: string; role: Role };

const KEY = "quizpang.session";

export const ROLE_LABEL: Record<Role, string> = {
  teacher: "교수자",
  student: "학습자",
};

export function readSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Session>;
    if (!parsed.nickname || (parsed.role !== "teacher" && parsed.role !== "student")) {
      return null;
    }
    return { nickname: parsed.nickname, role: parsed.role };
  } catch {
    return null;
  }
}

export function writeSession(session: Session) {
  window.localStorage.setItem(KEY, JSON.stringify(session));
}

export function clearSession() {
  window.localStorage.removeItem(KEY);
}

/**
 * 세션은 브라우저에만 있으므로 첫 렌더에서는 알 수 없다.
 * `loading` 이 true 인 동안은 화면을 판단하지 말 것.
 */
export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSession(readSession());
    setLoading(false);
  }, []);

  return { session, loading };
}
