"use client";

import { use, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shell } from "@/components/Shell";
import { Leaderboard } from "@/components/Leaderboard";
import { QuizThumb } from "@/components/QuizThumb";
import { useSession } from "@/lib/session";
import { DIFFICULTY_LABEL, type GradedAnswer, type LeaderboardRow, type PublicQuestion, type Quiz } from "@/lib/types";

type Result = {
  score: number;
  total: number;
  elapsedMs: number;
  graded: GradedAnswer[];
  leaderboard: LeaderboardRow[];
};

function formatElapsed(ms: number) {
  const total = Math.round(ms / 1000);
  return `${Math.floor(total / 60)}분 ${total % 60}초`;
}

export default function PlayPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const router = useRouter();
  const { session, loading } = useSession();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<PublicQuestion[]>([]);
  const [picks, setPicks] = useState<(number | null)[]>([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const startedAt = useRef<number>(0);

  useEffect(() => {
    if (!loading && !session) router.replace("/");
  }, [loading, session, router]);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;

    (async () => {
      const res = await fetch(
        `/api/quizzes/${code}?author=${encodeURIComponent(session.nickname)}`,
      );
      const data = await res.json();
      if (cancelled) return;
      if (!res.ok) return setError(data.error ?? "퀴즈를 불러오지 못했습니다.");
      setQuiz(data.quiz);
      setQuestions(data.questions);
      setPicks(new Array(data.questions.length).fill(null));
      startedAt.current = Date.now();
    })();

    return () => {
      cancelled = true;
    };
  }, [code, session]);

  const markedCount = useMemo(() => picks.filter((p) => p !== null).length, [picks]);
  const allMarked = questions.length > 0 && markedCount === questions.length;

  async function submit() {
    if (!session || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/quizzes/${code}/attempts`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          nickname: session.nickname,
          answers: picks,
          elapsedMs: Date.now() - startedAt.current,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "제출하지 못했습니다.");
        return;
      }
      setResult(data);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("네트워크 오류입니다. 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !session) return null;

  if (error) {
    return (
      <Shell session={session}>
        <div className="sheet">
          <div className="sheet-body space-y-4 text-center">
            <p className="font-semibold text-mark">{error}</p>
            <Link href="/student" className="btn btn-ghost">
              퀴즈 목록으로
            </Link>
          </div>
        </div>
      </Shell>
    );
  }

  if (!quiz) {
    return (
      <Shell session={session}>
        <p className="text-center text-sm text-ink-soft">불러오는 중…</p>
      </Shell>
    );
  }

  // ── 채점 결과 ─────────────────────────────────────────────
  if (result) {
    const myRank = result.leaderboard.find((r) => r.nickname === session.nickname)?.rank;

    return (
      <Shell session={session}>
        <div className="mx-auto w-full max-w-(--sheet-max) space-y-10">
          <div className="sheet">
            <div className="sheet-head">
              <p className="field-label">채점 결과</p>
              <h1 className="display mt-3 text-3xl text-ink sm:text-4xl">{quiz.title}</h1>
            </div>
            <div className="sheet-body">
              <div className="flex flex-wrap items-end gap-x-10 gap-y-6">
                <div>
                  <p className="field-label">점수</p>
                  <p className="display mt-1 text-6xl text-mark">
                    {result.score}
                    <span className="text-3xl text-rule-faint">/{result.total}</span>
                  </p>
                </div>
                <div>
                  <p className="field-label">순위</p>
                  <p className="display mt-1 text-4xl text-rule">
                    {myRank ?? "-"}
                    <span className="text-xl text-rule-faint">
                      /{result.leaderboard.length}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="field-label">걸린 시간</p>
                  <p className="mt-2 font-mono text-lg">{formatElapsed(result.elapsedMs)}</p>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-3 border-t border-rule-faint pt-6">
                <Link href="/student" className="btn btn-ghost">
                  다른 퀴즈 풀기
                </Link>
              </div>
            </div>
          </div>

          <section>
            <h2 className="field-label">리더보드</h2>
            <div className="mt-3">
              <Leaderboard rows={result.leaderboard} highlight={session.nickname} />
            </div>
          </section>

          <section>
            <h2 className="field-label">문항별 리뷰</h2>
            <div className="mt-3 space-y-4">
              {result.graded.map((g) => (
                <article key={g.idx} className="border border-rule-faint bg-paper p-4 sm:p-6">
                  <div className="flex gap-4">
                    <span className="q-no shrink-0" data-wrong={!g.correct}>
                      {g.idx + 1}
                    </span>
                    <div className="min-w-0 flex-1 space-y-4">
                      <p className="font-semibold leading-relaxed whitespace-pre-line">{g.prompt}</p>
                      <ul className="space-y-1">
                        {g.choices.map((choice, i) => (
                          <li
                            key={i}
                            className="bubble-row"
                            data-state={
                              i === g.answer
                                ? "correct"
                                : i === g.picked
                                  ? "wrong"
                                  : undefined
                            }
                          >
                            <span className="bubble" aria-hidden>
                              {i + 1}
                            </span>
                            <span className="bubble-text">
                              {choice}
                              {i === g.picked && (
                                <span className="ml-2 text-xs text-ink-soft">내가 고른 답</span>
                              )}
                            </span>
                          </li>
                        ))}
                      </ul>
                      {g.explanation && (
                        <p className="border-l-2 border-rule pl-3 text-sm leading-relaxed text-ink-soft">
                          {g.explanation}
                        </p>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </Shell>
    );
  }

  // ── 응시 ──────────────────────────────────────────────────
  return (
    <Shell session={session}>
      <div className="mx-auto w-full max-w-(--sheet-max) space-y-6">
        <div className="sheet">
          <div className="sheet-head">
            <div className="flex items-start gap-5">
              <div className="min-w-0 flex-1">
                <p className="field-label">
                  {questions.length}문항 · {DIFFICULTY_LABEL[quiz.difficulty]} · 출제{" "}
                  {quiz.author}
                </p>
                <h1 className="display mt-3 text-3xl text-ink sm:text-4xl">{quiz.title}</h1>
              </div>
              <QuizThumb
                code={quiz.code}
                version={quiz.thumbnail_version}
                title={quiz.title}
                size={88}
              />
            </div>
            {!quiz.published && (
              <p className="mt-3 border border-mark px-3 py-2 text-sm font-semibold text-mark">
                아직 공개 전인 퀴즈입니다. 작성자 본인만 미리 볼 수 있습니다.
              </p>
            )}
          </div>

          <div className="sheet-body space-y-8">
            {questions.map((q) => (
              <div key={q.idx} className="flex gap-4">
                <span className="q-no shrink-0">{q.idx + 1}</span>
                <div className="min-w-0 flex-1 space-y-3">
                  <p className="font-semibold leading-relaxed whitespace-pre-line">{q.prompt}</p>
                  <div className="space-y-1">
                    {q.choices.map((choice, i) => (
                      <button
                        key={i}
                        type="button"
                        className="bubble-row"
                        data-marked={picks[q.idx] === i}
                        aria-pressed={picks[q.idx] === i}
                        onClick={() =>
                          setPicks((prev) => {
                            const next = [...prev];
                            next[q.idx] = i;
                            return next;
                          })
                        }
                      >
                        <span className="bubble" aria-hidden>
                          {i + 1}
                        </span>
                        <span className="bubble-text">{choice}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 마킹 현황 — 답안지를 걷기 전에 확인하는 자리 */}
        <div className="sticky bottom-4 z-10">
          <div className="mx-auto flex max-w-(--sheet-max) items-center gap-4 border border-rule bg-paper px-4 py-3 shadow-[0_10px_30px_-14px_rgb(20_22_31/0.5)]">
            <span className="font-mono text-sm font-semibold">
              {markedCount}
              <span className="text-ink-soft">/{questions.length}</span>
            </span>
            <span className="hidden text-sm text-ink-soft sm:block">
              {allMarked ? "다 풀었습니다." : "빈 문항은 오답 처리됩니다."}
            </span>
            <button
              type="button"
              className="btn btn-mark ml-auto"
              onClick={submit}
              disabled={submitting || markedCount === 0}
            >
              {submitting ? "채점 중…" : "제출하기"}
            </button>
          </div>
        </div>
      </div>
    </Shell>
  );
}
