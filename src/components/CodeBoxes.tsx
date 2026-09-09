"use client";

import { useState } from "react";

/** 공유 코드를 수험번호 칸처럼 한 글자씩 보여준다. */
export function CodeBoxes({ code, copyable = true }: { code: string; copyable?: boolean }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // 클립보드를 못 쓰는 브라우저에서는 조용히 넘어간다. 코드는 화면에 있다.
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="code-boxes">
        {code.split("").map((ch, i) => (
          <span key={i} className="code-box">
            {ch}
          </span>
        ))}
      </div>
      {copyable && (
        <button
          type="button"
          onClick={copy}
          className="text-sm font-semibold text-rule underline-offset-4 hover:underline"
        >
          {copied ? "복사했습니다" : "코드 복사"}
        </button>
      )}
    </div>
  );
}
