"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shell } from "@/components/Shell";
import { QuizThumb } from "@/components/QuizThumb";
import { useSession } from "@/lib/session";
import { DIFFICULTY_LABEL, type Difficulty, type Quiz } from "@/lib/types";

type QuizRow = Quiz & { question_count: number; player_count: number };

const COUNTS = [5, 10, 15];
const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

export default function TeacherPage() {
  const router = useRouter();
  const { session, loading } = useSession();

  const [topic, setTopic] = useState("");
  const [count, setCount] = useState(5);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const [quizzes, setQuizzes] = useState<QuizRow[]>([]);
  const [listLoading, setListLoading] = useState(true);

  useEffect(() => {
    if (!loading && !session) router.replace("/");
  }, [loading, session, router]);

  const loadQuizzes = useCallback(async (author: string) => {
    setListLoading(true);
    try {
      const res = await fetch(`/api/quizzes?author=${encodeURIComponent(author)}`);
      const data = await res.json();
      setQuizzes(res.ok ? data.quizzes : []);
    } catch {
      setQuizzes([]);
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session) void loadQuizzes(session.nickname);
  }, [session, loadQuizzes]);

  async function generate(event: React.FormEvent) {
    event.preventDefault();
    if (!session) return;

    const trimmed = topic.trim();
    if (trimmed.length < 2) return setError("주제를 조금 더 구체적으로 적어주세요.");

    setGenerating(true);
    setError("");
    try {
      const res = await fetch("/api/quizzes/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ topic: trimmed, count, difficulty, author: session.nickname }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "퀴즈를 만들지 못했습니다.");
        return;
      }
      router.push(`/teacher/${data.code}`);
    } catch {
      setError("네트워크 오류입니다. 다시 시도해주세요.");
    } finally {
      setGenerating(false);
    }
  }

  if (loading || !session) return null;

  return (
    <Shell session={session}>
      <div className="mx-auto w-full max-w-(--sheet-max) space-y-10">
        <form onSubmit={generate} className="sheet">
          <div className="sheet-head">
            <p className="field-label">출제</p>
            <h1 className="display mt-3 text-3xl text-ink sm:text-4xl">
              무엇을 물어볼까요?
            </h1>
          </div>

          <div className="sheet-body space-y-8">
            <div>
              <label htmlFor="topic" className="field-label">
                주제
              </label>
              <input
                id="topic"
                className="input mt-2"
                value={topic}
                onChange={(e) => {
                  setTopic(e.target.value);
                  setError("");
                }}
                placeholder="예: 조선 후기 실학, 광합성의 명반응, 파이썬 리스트 컴프리헨션"
                maxLength={200}
                disabled={generating}
                autoComplete="off"
              />
            </div>

            <div className="grid gap-8 sm:grid-cols-2">
              <fieldset>
                <legend className="field-label">문항 수</legend>
                <div className="mt-2 flex gap-2">
                  {COUNTS.map((n) => (
                    <button
                      key={n}
                      type="button"
                      disabled={generating}
                      onClick={() => setCount(n)}
                      className={`flex-1 border px-3 py-2.5 font-mono text-sm font-semibold transition-colors ${
                        count === n
                          ? "border-rule bg-rule text-paper"
                          : "border-rule-faint text-ink-soft hover:border-rule"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend className="field-label">난이도</legend>
                <div className="mt-2 flex gap-2">
                  {DIFFICULTIES.map((d) => (
                    <button
                      key={d}
                      type="button"
                      disabled={generating}
                      onClick={() => setDifficulty(d)}
                      className={`flex-1 border px-3 py-2.5 text-sm font-semibold transition-colors ${
                        difficulty === d
                          ? "border-rule bg-rule text-paper"
                          : "border-rule-faint text-ink-soft hover:border-rule"
                      }`}
                    >
                      {DIFFICULTY_LABEL[d]}
                    </button>
                  ))}
                </div>
              </fieldset>
            </div>

            {error && (
              <p role="alert" className="text-sm font-semibold text-mark">
                {error}
              </p>
            )}

            <button type="submit" className="btn btn-mark w-full" disabled={generating}>
              {generating ? "문제와 그림을 만드는 중… 1~2분 걸립니다" : "퀴즈 만들기"}
            </button>
          </div>
        </form>

        <section className="mx-auto w-full max-w-(--sheet-max)">
          <h2 className="field-label">내가 낸 퀴즈</h2>

          {listLoading ? (
            <p className="mt-3 text-sm text-ink-soft">불러오는 중…</p>
          ) : quizzes.length === 0 ? (
            <p className="mt-3 border border-dashed border-rule-faint bg-paper px-4 py-8 text-center text-sm text-ink-soft">
              아직 만든 퀴즈가 없습니다. 위에서 주제를 적어보세요.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {quizzes.map((quiz) => (
                <li key={quiz.id}>
                  <Link
                    href={`/teacher/${quiz.code}`}
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
                        {quiz.question_count}문항 · {DIFFICULTY_LABEL[quiz.difficulty]} ·
                        응시 {quiz.player_count}명
                      </span>
                    </span>
                    <span className="shrink-0 font-mono text-sm font-semibold text-rule">
                      {quiz.code}
                    </span>
                    <span
                      className={`shrink-0 border px-2 py-1 text-xs font-semibold ${
                        quiz.published
                          ? "border-go text-go"
                          : "border-rule-faint text-ink-soft"
                      }`}
                    >
                      {quiz.published ? "공개" : "비공개"}
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
