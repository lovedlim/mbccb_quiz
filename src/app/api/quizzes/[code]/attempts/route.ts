import { db } from "@/lib/db";
import { normalizeCode } from "@/lib/code";
import type { GradedAnswer, LeaderboardRow, Quiz } from "@/lib/types";

export const dynamic = "force-dynamic";

type QuestionRow = {
  idx: number;
  prompt: string;
  choices: string[];
  answer: number;
  explanation: string;
};

/**
 * 닉네임당 최고 기록 1개만 순위에 올린다.
 * 동점이면 더 빨리 푼 사람이, 그마저 같으면 먼저 푼 사람이 위로 간다.
 */
async function leaderboard(quizId: string): Promise<LeaderboardRow[]> {
  const sql = db();
  const rows = (await sql`
    select distinct on (nickname)
           nickname, score, total, elapsed_ms, created_at
    from attempts
    where quiz_id = ${quizId}
    order by nickname, score desc, elapsed_ms asc, created_at asc
  `) as Omit<LeaderboardRow, "rank">[];

  return rows
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.elapsed_ms - b.elapsed_ms ||
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    )
    .map((row, i) => ({ ...row, rank: i + 1 }));
}

async function loadQuiz(code: string) {
  const sql = db();
  const [quiz] = await sql`
    select id, code, title, topic, difficulty, author, published, created_at,
           extract(epoch from thumbnail_updated_at)::bigint as thumbnail_version
    from quizzes where code = ${code}
  `;
  return (quiz as Quiz | undefined) ?? null;
}

/** GET /api/quizzes/:code/attempts — 리더보드 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code: rawCode } = await params;
  const quiz = await loadQuiz(normalizeCode(rawCode));
  if (!quiz) return Response.json({ error: "퀴즈를 찾을 수 없습니다." }, { status: 404 });

  return Response.json({ quiz, leaderboard: await leaderboard(quiz.id) });
}

/** POST /api/quizzes/:code/attempts — 응시 제출. 채점은 전적으로 서버에서 한다. */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code: rawCode } = await params;
  const code = normalizeCode(rawCode);

  let body: { nickname?: string; answers?: unknown; elapsedMs?: number };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const nickname = (body.nickname ?? "").trim();
  if (!nickname) return Response.json({ error: "닉네임이 필요합니다." }, { status: 400 });
  if (!Array.isArray(body.answers)) {
    return Response.json({ error: "답안 형식이 올바르지 않습니다." }, { status: 400 });
  }

  const quiz = await loadQuiz(code);
  if (!quiz) return Response.json({ error: "퀴즈를 찾을 수 없습니다." }, { status: 404 });
  if (!quiz.published && quiz.author !== nickname) {
    return Response.json({ error: "아직 공개되지 않은 퀴즈입니다." }, { status: 403 });
  }

  const sql = db();
  const questions = (await sql`
    select idx, prompt, choices, answer, explanation
    from questions where quiz_id = ${quiz.id} order by idx
  `) as QuestionRow[];

  const picks = body.answers as unknown[];
  const graded: GradedAnswer[] = questions.map((q) => {
    const raw = picks[q.idx];
    const picked =
      typeof raw === "number" && Number.isInteger(raw) && raw >= 0 && raw < q.choices.length
        ? raw
        : null;
    return {
      idx: q.idx,
      prompt: q.prompt,
      choices: q.choices,
      answer: q.answer,
      picked,
      correct: picked === q.answer,
      explanation: q.explanation,
    };
  });

  const score = graded.filter((g) => g.correct).length;
  const total = graded.length;
  // 클라이언트가 보낸 시간은 신뢰하지 않고 상식적인 범위로 자른다.
  const elapsedMs = Math.min(
    1000 * 60 * 60 * 6,
    Math.max(0, Math.round(Number(body.elapsedMs) || 0)),
  );

  await sql`
    insert into attempts (quiz_id, nickname, score, total, elapsed_ms, answers)
    values (${quiz.id}, ${nickname}, ${score}, ${total}, ${elapsedMs},
            ${JSON.stringify(graded.map((g) => g.picked))}::jsonb)
  `;

  return Response.json({
    quiz,
    score,
    total,
    elapsedMs,
    graded,
    leaderboard: await leaderboard(quiz.id),
  });
}
