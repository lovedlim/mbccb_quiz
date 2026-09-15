import { Img, staticFile, useCurrentFrame } from "remotion";
import quiz from "../data/quiz.json";
import { C } from "../theme";
import { Button, CodeBox, Display, Label, Sheet, SheetBody, SheetHead, Split, progress, usePop } from "../ui";

const Stamp = ({ ch, start }: { ch: string; start: number }) => {
  const p = usePop(start, { damping: 12, stiffness: 180, mass: 0.7 });
  return (
    <CodeBox
      ch={ch}
      style={{ opacity: Math.min(1, p * 2), transform: `scale(${1.6 - 0.6 * p})` }}
    />
  );
};

export const ShareCode = () => {
  const frame = useCurrentFrame();
  const after = progress(frame, 92, 16);
  const copied = progress(frame, 128, 8);

  return (
    <Split
      step="02 · 공유 코드"
      title={"코드 여섯 자리,\n소리 내어\n불러주세요"}
      sub={"헷갈리는 글자(0/O, 1/I/L)는\n처음부터 뺐습니다."}
    >
      <Sheet>
        <SheetHead style={{ display: "flex", alignItems: "center", gap: 30 }}>
          <div style={{ flex: 1 }}>
            <Label>5문항 · 쉬움</Label>
            <Display size={60} style={{ marginTop: 14 }}>
              {quiz.title}
            </Display>
          </div>
          <Img
            src={staticFile("thumb.webp")}
            style={{ width: 132, height: 132, border: `1.5px solid ${C.ruleFaint}` }}
          />
        </SheetHead>
        <SheetBody style={{ padding: "48px 60px 56px" }}>
          <Label>공유 코드</Label>
          <div style={{ marginTop: 20, display: "flex", gap: 14 }}>
            {quiz.code.split("").map((ch, i) => (
              <Stamp key={i} ch={ch} start={18 + i * 9} />
            ))}
          </div>

          <div
            style={{
              marginTop: 44,
              paddingTop: 40,
              borderTop: `1.5px solid ${C.ruleFaint}`,
              display: "flex",
              alignItems: "center",
              gap: 20,
              opacity: after,
              transform: `translateY(${(1 - after) * 14}px)`,
            }}
          >
            <Button variant={copied > 0.5 ? "rule" : "ghost"}>
              {copied > 0.5 ? "복사했습니다" : "코드 복사"}
            </Button>
            <div
              style={{
                padding: "10px 18px",
                border: `2px solid ${C.go}`,
                color: C.go,
                fontSize: 24,
                fontWeight: 600,
              }}
            >
              공개
            </div>
            <div style={{ fontSize: 26, color: C.inkSoft }}>학습자 목록에도 바로 보입니다</div>
          </div>
        </SheetBody>
      </Sheet>
    </Split>
  );
};
