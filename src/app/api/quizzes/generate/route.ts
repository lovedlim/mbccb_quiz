import { db } from "@/lib/db";
import { makeShareCode } from "@/lib/code";
import { generateQuiz, QuizGenerationError } from "@/lib/generate";
import { generateThumbnail } from "@/lib/image";
import type { Difficulty } from "@/lib/types";

// AI 생성은 오래 걸릴 수 있다.
export const maxDuration = 300;

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

export async function POST(req: Request) {
  let body: { topic?: string; count?: number; difficulty?: string; author?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const topic = (body.topic ?? "").trim();
  const author = (body.author ?? "").trim();
  const count = Math.min(20, Math.max(3, Number(body.count) || 5));
  const difficulty = (
    DIFFICULTIES.includes(body.difficulty as Difficulty) ? body.difficulty : "medium"
  ) as Difficulty;

  if (!topic) return Response.json({ error: "주제를 입력해주세요." }, { status: 400 });
  if (topic.length > 200)
    return Response.json({ error: "주제가 너무 깁니다. (200자 이내)" }, { status: 400 });
  if (!author) return Response.json({ error: "닉네임이 필요합니다." }, { status: 400 });

  let generated;
  try {
    generated = await generateQuiz({ topic, count, difficulty });
  } catch (err) {
    if (err instanceof QuizGenerationError) {
      return Response.json({ error: err.message }, { status: 502 });
    }
    console.error("[generate] 실패", err);
    return Response.json(
      { error: "퀴즈 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." },
      { status: 502 },
    );
  }

  const sql = db();

  // 공유 코드는 유니크해야 하므로 충돌 시 몇 번 재시도한다.
  let quizId: string | null = null;
  let code = "";
  for (let attempt = 0; attempt < 5 && !quizId; attempt++) {
    code = makeShareCode();
    try {
      const [row] = await sql`
        insert into quizzes (code, title, topic, difficulty, author)
        values (${code}, ${generated.title}, ${topic}, ${difficulty}, ${author})
        returning id
      `;
      quizId = (row as { id: string }).id;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (!message.includes("quizzes_code_key")) throw err;
      // 코드 충돌 → 다시 뽑는다
    }
  }

  if (!quizId) {
    return Response.json(
      { error: "공유 코드를 발급하지 못했습니다. 다시 시도해주세요." },
      { status: 500 },
    );
  }

  await sql.transaction(
    generated.questions.map(
      (q) => sql`
        insert into questions (quiz_id, idx, prompt, choices, answer, explanation)
        values (${quizId}, ${q.idx}, ${q.prompt}, ${JSON.stringify(q.choices)}::jsonb,
                ${q.answer}, ${q.explanation})
      `,
    ),
  );

  // 문항을 먼저 저장한 뒤에 썸네일을 만든다.
  // 이미지가 실패해도 퀴즈 자체는 멀쩡해야 하므로 여기서 삼킨다.
  let thumbnailBytes: number | null = null;
  try {
    const thumb = await generateThumbnail({ topic, title: generated.title });
    await sql`
      update quizzes
      set thumbnail = ${thumb.base64}, thumbnail_mime = ${thumb.mime},
          thumbnail_updated_at = now()
      where id = ${quizId}
    `;
    thumbnailBytes = thumb.bytes;
  } catch (err) {
    console.error("[generate] 썸네일 생성 실패 — 퀴즈는 그대로 둡니다", err);
  }

  return Response.json({
    code,
    title: generated.title,
    questionCount: generated.questions.length,
    thumbnailBytes,
  });
}
