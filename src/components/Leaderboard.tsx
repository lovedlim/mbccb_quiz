import type { LeaderboardRow } from "@/lib/types";

function formatElapsed(ms: number) {
  const total = Math.round(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function Leaderboard({
  rows,
  highlight,
}: {
  rows: LeaderboardRow[];
  highlight?: string;
}) {
  if (rows.length === 0) {
    return (
      <p className="border border-dashed border-rule-faint px-4 py-8 text-center text-sm text-ink-soft">
        아직 응시한 사람이 없습니다. 코드를 공유해보세요.
      </p>
    );
  }

  return (
    <ol className="divide-y divide-rule-faint border-y border-rule-faint">
      {rows.map((row) => {
        const isMe = highlight != null && row.nickname === highlight;
        return (
          <li
            key={row.nickname}
            className={`flex items-center gap-4 px-2 py-3 ${isMe ? "bg-mark/6" : ""}`}
          >
            <span
              className={`display w-8 shrink-0 text-center text-xl ${
                row.rank <= 3 ? "text-mark" : "text-rule-faint"
              }`}
            >
              {row.rank}
            </span>
            <span className="min-w-0 flex-1 truncate font-semibold">
              {row.nickname}
              {isMe && <span className="ml-2 text-xs font-normal text-mark">나</span>}
            </span>
            <span className="shrink-0 font-mono text-sm text-ink-soft">
              {formatElapsed(row.elapsed_ms)}
            </span>
            <span className="shrink-0 font-mono text-sm font-semibold">
              {row.score}
              <span className="text-ink-soft">/{row.total}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
