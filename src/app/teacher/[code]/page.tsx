"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shell } from "@/components/Shell";
import { CodeBoxes } from "@/components/CodeBoxes";
import { QuizThumb } from "@/components/QuizThumb";
import { Leaderboard } from "@/components/Leaderboard";
import { useSession } from "@/lib/session";
import { DIFFICULTY_LABEL, type FullQuestion, type LeaderboardRow, type Quiz } from "@/lib/types";

export default function TeacherQuizPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const router = useRouter();
  const { session, loading } = useSession();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<FullQuestion[]>([]);
  const [board, setBoard] = useState<LeaderboardRow[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [redrawing, setRedrawing] = useState(false);

  useEffect(() => {
    if (!loading && !session) router.replace("/");
  }, [loading, session, router]);

  const loadBoard = useCallback(async () => {
    const res = await fetch(`/api/quizzes/${code}/attempts`);
    if (res.ok) setBoard((await res.json()).leaderboard);
  }, [code]);

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
    })();

    return () => {
      cancelled = true;
    };
  }, [code, session]);

  // 강의 중에 리더보드가 살아 움직여야 한다.
  useEffect(() => {
    if (!quiz) return;
    void loadBoard();
    const timer = window.setInterval(loadBoard, 5000);
    return () => window.clearInterval(timer);
  }, [quiz, loadBoard]);

  async function togglePublish() {
    if (!quiz || !session) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/quizzes/${code}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ author: session.nickname, published: !quiz.published }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error ?? "변경하지 못했습니다.");
      setQuiz(data);
    } finally {
      setBusy(false);
    }
  }

  async function redrawThumbnail() {
    if (!quiz || !session) return;
    setRedrawing(true);
    setError("");
    try {
      const res = await fetch(`/api/quizzes/${code}/thumbnail`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ author: session.nickname }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error ?? "이미지를 만들지 못했습니다.");
      // 서버가 준 새 버전으로 갈아끼우면 이미지 URL 이 바뀌어 캐시가 갈린다.
      setQuiz({ ...quiz, thumbnail_version: data.version });
    } finally {
      setRedrawing(false);
    }
  }

  if (loading || !session) return null;

  if (error) {
    return (
      <Shell session={session}>
        <div className="sheet">
          <div className="sheet-body space-y-4 text-center">
            <p className="font-semibold text-mark">{error}</p>
            <Link href="/teacher" className="btn btn-ghost">
              출제 화면으로
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

  return (
    <Shell session={session}>
      <div className="mx-auto w-full max-w-(--sheet-max) space-y-10">
        <div className="sheet">
          <div className="sheet-head flex items-start gap-5">
            <div className="min-w-0 flex-1">
              <p className="field-label">
                {questions.length}문항 · {DIFFICULTY_LABEL[quiz.difficulty]}
              </p>
              <h1 className="display mt-3 text-3xl text-ink sm:text-4xl">{quiz.title}</h1>
              {quiz.topic !== quiz.title && (
                <p className="mt-2 text-sm text-ink-soft">{quiz.topic}</p>
              )}
            </div>
            <QuizThumb
              code={quiz.code}
              version={quiz.thumbnail_version}
              title={quiz.title}
              size={88}
            />
          </div>

          <div className="sheet-body space-y-6">
            <div>
              <p className="field-label">공유 코드</p>
              <div className="mt-2">
                <CodeBoxes code={quiz.code} />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 border-t border-rule-faint pt-6">
              <button
                type="button"
                className={quiz.published ? "btn btn-ghost" : "btn btn-mark"}
                onClick={togglePublish}
                disabled={busy}
              >
                {quiz.published ? "공개 중단" : "퀴즈 공개"}
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={redrawThumbnail}
                disabled={redrawing}
              >
                {redrawing
                  ? "그리는 중…"
                  : quiz.thumbnail_version != null
                    ? "그림 다시 그리기"
                    : "그림 만들기"}
              </button>
              <p className="text-sm text-ink-soft">
                {quiz.published
                  ? "학습자 목록에 보입니다. 코드로도 들어올 수 있습니다."
                  : "공개하기 전에는 나만 볼 수 있습니다."}
              </p>
            </div>
          </div>
        </div>

        <section>
          <h2 className="field-label">리더보드</h2>
          <div className="mt-3">
            <Leaderboard rows={board} />
          </div>
        </section>

        <section>
          <h2 className="field-label">문항과 정답</h2>
          <div className="mt-3 space-y-4">
            {questions.map((q) => (
              <article key={q.idx} className="border border-rule-faint bg-paper p-4 sm:p-6">
                <div className="flex gap-4">
                  <span className="q-no shrink-0">{q.idx + 1}</span>
                  <div className="min-w-0 flex-1 space-y-4">
                    <p className="font-semibold leading-relaxed whitespace-pre-line">{q.prompt}</p>
                    <ul className="space-y-1">
                      {q.choices.map((choice, i) => (
                        <li
                          key={i}
                          className="bubble-row"
                          data-state={i === q.answer ? "correct" : undefined}
                        >
                          <span className="bubble" aria-hidden>
                            {i + 1}
                          </span>
                          <span className="bubble-text">{choice}</span>
                        </li>
                      ))}
                    </ul>
                    {q.explanation && (
                      <p className="border-l-2 border-rule pl-3 text-sm leading-relaxed text-ink-soft">
                        {q.explanation}
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
