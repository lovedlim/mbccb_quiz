import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

let cached: NeonQueryFunction<false, false> | null = null;

/**
 * Neon 커넥션. DATABASE_URL 이 없으면 여기서 명확히 실패시킨다
 * (모듈 로드 시점이 아니라 첫 쿼리 시점에).
 */
export function db(): NeonQueryFunction<false, false> {
  if (cached) return cached;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL 이 없습니다. `vercel env pull .env.local` 을 실행하거나 Neon 연동을 마쳐주세요.",
    );
  }
  cached = neon(url);
  return cached;
}
