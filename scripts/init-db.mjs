// db/schema.sql 을 Neon 에 적용한다.
//   node --env-file=.env.local scripts/init-db.mjs
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error(
    "DATABASE_URL 이 없습니다.\n" +
      "  vercel env pull .env.local --yes\n" +
      "를 먼저 실행한 뒤 다시 시도하세요.",
  );
  process.exit(1);
}

const sql = neon(url);
const schema = readFileSync(new URL("../db/schema.sql", import.meta.url), "utf8");

// neon HTTP 드라이버는 한 번에 한 문장씩 받는다.
const statements = schema
  .split(";")
  .map((s) => s.trim())
  .filter((s) => s && !s.split("\n").every((line) => line.trim().startsWith("--")));

for (const statement of statements) {
  const label = statement.replace(/\s+/g, " ").slice(0, 70);
  await sql.query(statement);
  console.log("✓", label);
}

console.log(`\n스키마 적용 완료 (${statements.length}개 문장).`);
