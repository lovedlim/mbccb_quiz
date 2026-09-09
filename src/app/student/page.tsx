"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shell } from "@/components/Shell";
import { QuizThumb } from "@/components/QuizThumb";
import { useSession } from "@/lib/session";
import { normalizeCode } from "@/lib/code";
import { DIFFICULTY_LABEL, type Quiz } from "@/lib/types";

type QuizRow = Quiz & { question_count: number; player_count: number };

export default function StudentPage() {
  const router = useRouter();
  const { session, loading } = useSession();

  const [code, setCode] = useState("");
  const [quizzes, setQuizzes] = useState<QuizRow[]>([]);
  const [listLoading, setListLoading] = useState(true);

  useEffect(() => {
    if (!loading && !session) router.replace("/");
  }, [loading, session, router]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/quizzes");
        const data = await res.json();
        setQuizzes(res.ok ? data.quizzes : []);
      } catch {
        setQuizzes([]);
      } finally {
        setListLoading(false);
      }
    })();
  }, []);

  function enterByCode(event: React.FormEvent) {
    event.preventDefault();
    const normalized = normalizeCode(code);
    if (normalized) router.push(`/play/${normalized}`);
  }

  if (loading || !session) return null;

  return (
    <Shell session={session}>
      <div className="mx-auto w-full max-w-(--sheet-max) space-y-10">
        <form onSubmit={enterByCode} className="sheet">
          <div className="sheet-head">
            <p className="field-label">응시</p>
            <h1 className="display mt-3 text-3xl text-ink sm:text-4xl">
              코드를 받았나요?
            </h1>
          </div>
          <div className="sheet-body">
            <label htmlFor="code" className="field-label">
              공유 코드
            </label>
            <div className="mt-2 flex gap-2">
              <input
                id="code"
                className="input font-mono text-lg tracking-[0.3em] uppercase"
                value={code}
                onChange={(e) => setCode(normalizeCode(e.target.value))}
                placeholder="ABC123"
                maxLength={10}
                autoComplete="off"
                autoCapitalize="characters"
              />
              <button type="submit" className="btn btn-mark shrink-0" disabled={!code}>
                입장
              </button>
            </div>
          </div>
        </form>

        <section>
          <h2 className="field-label">공개된 퀴즈</h2>

          {listLoading ? (
            <p className="mt-3 text-sm text-ink-soft">불러오는 중…</p>
          ) : quizzes.length === 0 ? (
            <p className="mt-3 border border-dashed border-rule-faint bg-paper px-4 py-8 text-center text-sm text-ink-soft">
              아직 공개된 퀴즈가 없습니다. 교수자가 공개하면 여기에 뜹니다.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {quizzes.map((quiz) => (
                <li key={quiz.id}>
                  <Link
                    href={`/play/${quiz.code}`}
                    className="flex items-center gap-4 border border-rule-faint bg-paper px-4 py-3.5 transition-colors hover:border-rule"
                  >
                    <QuizThumb
                      code={quiz.code}
                      version={quiz.thumbnail_version}
                      title={quiz.title}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{quiz.title}</span>
                      <span className="block text-xs text-ink-soft">
                        {quiz.author} · {quiz.question_count}문항 ·{" "}
                        {DIFFICULTY_LABEL[quiz.difficulty]} · 응시 {quiz.player_count}명
                      </span>
                    </span>
                    <span className="shrink-0 font-mono text-sm font-semibold text-rule">
                      {quiz.code}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </Shell>
  );
}
