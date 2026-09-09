"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { clearSession, ROLE_LABEL, type Session } from "@/lib/session";

export function Shell({
  session,
  children,
}: {
  session: Session | null;
  children: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-rule/15 bg-paper/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-(--sheet-max) items-center justify-between gap-4 px-4 py-3 sm:px-0">
          <Link href="/" className="display text-xl text-rule">
            퀴즈팡
          </Link>
          {session && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-ink-soft">
                <span className="font-semibold text-ink">{session.nickname}</span>
                <span className="mx-1.5 text-rule-faint">·</span>
                {ROLE_LABEL[session.role]}
              </span>
              <button
                type="button"
                className="text-sm font-semibold text-rule underline-offset-4 hover:underline"
                onClick={() => {
                  clearSession();
                  router.push("/");
                }}
              >
                나가기
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 px-4 py-8 sm:py-12">{children}</main>

      <footer className="px-4 pb-8 text-center text-xs text-ink-soft">
        문제는 AI가 출제합니다. 사실관계는 한 번 확인해주세요.
      </footer>
    </div>
  );
}
