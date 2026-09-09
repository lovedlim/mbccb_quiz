import { db } from "@/lib/db";
import type { Quiz } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * GET /api/quizzes            → 공개된 퀴즈 목록 (학습자용)
 * GET /api/quizzes?author=닉  → 해당 교수자가 만든 퀴즈 전체 (미공개 포함)
 */
export async function GET(req: Request) {
  const author = new URL(req.url).searchParams.get("author")?.trim();
  const sql = db();

  const rows = author
    ? await sql`
        select q.id, q.code, q.title, q.topic, q.difficulty, q.author,
               q.published, q.created_at, extract(epoch from q.thumbnail_updated_at)::bigint as thumbnail_version,
               (select count(*) from questions x where x.quiz_id = q.id)::int as question_count,
               (select count(distinct a.nickname) from attempts a where a.quiz_id = q.id)::int as player_count
        from quizzes q
        where q.author = ${author}
        order by q.created_at desc
      `
    : await sql`
        select q.id, q.code, q.title, q.topic, q.difficulty, q.author,
               q.published, q.created_at, extract(epoch from q.thumbnail_updated_at)::bigint as thumbnail_version,
               (select count(*) from questions x where x.quiz_id = q.id)::int as question_count,
               (select count(distinct a.nickname) from attempts a where a.quiz_id = q.id)::int as player_count
        from quizzes q
        where q.published = true
        order by q.created_at desc
        limit 100
      `;

  return Response.json({
    quizzes: rows as (Quiz & { question_count: number; player_count: number })[],
  });
}
