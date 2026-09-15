import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, FONT } from "../theme";
import { BubbleRow, Desk, Display, Label, Sheet, SheetBody, SheetHead, progress, usePop } from "../ui";

const FEATURES = [
  "주제 한 줄이면 AI가 문제를 냅니다",
  "여섯 자리 코드로 가입 없이 입장합니다",
  "서버가 채점하고, 순위는 실시간으로 갱신됩니다",
];

export const Ending = () => {
  const frame = useCurrentFrame();
  const enter = usePop(0, { damping: 18, stiffness: 100, mass: 1 });
  const link = progress(frame, 104, 18);

  return (
    <Desk>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ opacity: Math.min(1, enter * 1.4), transform: `translateY(${(1 - enter) * 60}px)` }}>
          <Sheet style={{ width: 1240 }}>
            <SheetHead style={{ padding: "64px 90px 40px" }}>
              <Label style={{ fontSize: 26, letterSpacing: "0.16em" }}>QUIZ ANSWER SHEET</Label>
              <Display size={160} style={{ marginTop: 12 }}>
                퀴즈팡
              </Display>
            </SheetHead>
            <SheetBody style={{ padding: "40px 76px 30px" }}>
              {FEATURES.map((text, i) => (
                <div key={i} style={{ marginBottom: 10 }}>
                  <BubbleRow
                    n={i + 1}
                    text={text}
                    fontSize={38}
                    state="marked"
                    t={progress(frame, 30 + i * 18, 8)}
                  />
                </div>
              ))}
            </SheetBody>
            <div
              style={{
                margin: "10px 90px 0",
                padding: "30px 0 48px",
                borderTop: `1.5px solid ${C.ruleFaint}`,
                display: "flex",
                alignItems: "center",
                gap: 22,
                opacity: link,
              }}
            >
              <Label style={{ fontSize: 24 }}>GITHUB</Label>
              <div style={{ fontFamily: FONT.mono, fontSize: 34, fontWeight: 600, color: C.rule }}>
                github.com/lovedlim/mbccb_quiz
              </div>
            </div>
          </Sheet>
        </div>
      </AbsoluteFill>
    </Desk>
  );
};
