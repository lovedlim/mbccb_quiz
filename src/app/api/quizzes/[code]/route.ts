import { db } from "@/lib/db";
import { normalizeCode } from "@/lib/code";
import type { Quiz } from "@/lib/types";

export const dynamic = "force-dynamic";

type QuestionRow = {
  idx: number;
  prompt: string;
  choices: string[];
  answer: number;
  explanation: string;
};

async function loadQuiz(code: string) {
  const sql = db();
  const [quiz] = await sql`
    select id, code, title, topic, difficulty, author, published, created_at,
           extract(epoch from thumbnail_updated_at)::bigint as thumbnail_version
    from quizzes where code = ${code}
  `;
  return (quiz as Quiz | undefined) ?? null;
}

/**
 * GET /api/quizzes/:code           → 공개 퀴즈. 정답·해설은 제거된다.
 * GET /api/quizzes/:code?author=닉 → 본인이 만든 퀴즈면 정답·해설 포함.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code: rawCode } = await params;
  const code = normalizeCode(rawCode);
  const viewer = new URL(req.url).searchParams.get("author")?.trim() ?? "";

  const quiz = await loadQuiz(code);
  if (!quiz) {
    return Response.json({ error: "그런 코드의 퀴즈가 없습니다." }, { status: 404 });
  }

  const isOwner = viewer !== "" && viewer === quiz.author;
  if (!quiz.published && !isOwner) {
    return Response.json({ error: "아직 공개되지 않은 퀴즈입니다." }, { status: 403 });
  }

  const sql = db();
  const rows = (await sql`
    select idx, prompt, choices, answer, explanation
    from questions where quiz_id = ${quiz.id} order by idx
  `) as QuestionRow[];

  return Response.json({
    quiz,
    isOwner,
    questions: isOwner
      ? rows
      : rows.map(({ idx, prompt, choices }) => ({ idx, prompt, choices })),
  });
}

/** PATCH /api/quizzes/:code — 공개 여부 변경 (작성자만) */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code: rawCode } = await params;
  const code = normalizeCode(rawCode);

  let body: { author?: string; published?: boolean };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const author = (body.author ?? "").trim();
  const published = Boolean(body.published);

  const quiz = await loadQuiz(code);
  if (!quiz) return Response.json({ error: "퀴즈를 찾을 수 없습니다." }, { status: 404 });
  if (quiz.author !== author) {
    return Response.json({ error: "본인이 만든 퀴즈만 변경할 수 있습니다." }, { status: 403 });
  }

  const sql = db();
  await sql`update quizzes set published = ${published} where id = ${quiz.id}`;
  return Response.json({ ...quiz, published });
}

/** DELETE /api/quizzes/:code — 작성자만 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code: rawCode } = await params;
  const code = normalizeCode(rawCode);
  const author = new URL(req.url).searchParams.get("author")?.trim() ?? "";

  const quiz = await loadQuiz(code);
  if (!quiz) return Response.json({ error: "퀴즈를 찾을 수 없습니다." }, { status: 404 });
  if (quiz.author !== author) {
    return Response.json({ error: "본인이 만든 퀴즈만 삭제할 수 있습니다." }, { status: 403 });
  }

  const sql = db();
  await sql`delete from quizzes where id = ${quiz.id}`;
  return Response.json({ ok: true });
}
