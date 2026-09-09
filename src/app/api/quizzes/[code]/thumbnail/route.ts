import { db } from "@/lib/db";
import { normalizeCode } from "@/lib/code";
import { generateThumbnail } from "@/lib/image";

// 이미지 생성은 오래 걸릴 수 있다.
export const maxDuration = 300;

/** GET /api/quizzes/:code/thumbnail — 퀴즈 썸네일 이미지 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code: rawCode } = await params;
  const sql = db();

  const [row] = await sql`
    select thumbnail, thumbnail_mime
    from quizzes where code = ${normalizeCode(rawCode)}
  `;

  const record = row as { thumbnail: string | null; thumbnail_mime: string } | undefined;
  if (!record?.thumbnail) {
    return new Response(null, { status: 404 });
  }

  return new Response(new Uint8Array(Buffer.from(record.thumbnail, "base64")), {
    headers: {
      "content-type": record.thumbnail_mime,
      // URL 에 ?v=<갱신시각> 이 붙으므로 다시 그리면 주소가 바뀐다.
      // 따라서 같은 주소의 내용은 영원히 같다고 봐도 된다.
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}

/**
 * POST /api/quizzes/:code/thumbnail — 썸네일 생성·재생성 (작성자만)
 * 생성 실패로 그림이 빠진 퀴즈를 채우거나, 마음에 안 드는 그림을 다시 그릴 때 쓴다.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code: rawCode } = await params;
  const code = normalizeCode(rawCode);

  let body: { author?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }
  const author = (body.author ?? "").trim();

  const sql = db();
  const [row] = await sql`
    select id, title, topic, author from quizzes where code = ${code}
  `;
  const quiz = row as
    | { id: string; title: string; topic: string; author: string }
    | undefined;

  if (!quiz) return Response.json({ error: "퀴즈를 찾을 수 없습니다." }, { status: 404 });
  if (quiz.author !== author) {
    return Response.json(
      { error: "본인이 만든 퀴즈만 바꿀 수 있습니다." },
      { status: 403 },
    );
  }

  try {
    const thumb = await generateThumbnail({ topic: quiz.topic, title: quiz.title });
    await sql`
      update quizzes
      set thumbnail = ${thumb.base64}, thumbnail_mime = ${thumb.mime},
          thumbnail_updated_at = now()
      where id = ${quiz.id}
    `;
    const [updated] = await sql`
      select extract(epoch from thumbnail_updated_at)::bigint as version
      from quizzes where id = ${quiz.id}
    `;
    return Response.json({
      ok: true,
      bytes: thumb.bytes,
      version: (updated as { version: number }).version,
    });
  } catch (err) {
    console.error("[thumbnail] 생성 실패", err);
    return Response.json(
      { error: "이미지를 만들지 못했습니다. 잠시 후 다시 시도해주세요." },
      { status: 502 },
    );
  }
}
