import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, FONT, alpha } from "../theme";
import { Desk, Display, Label, Sheet, SheetBody, SheetHead, progress, usePop } from "../ui";

// OMR 5문항 × 4지선다. 행마다 칠해질 칸
const MARKS = [0, 1, 2, 3, 0];

const OmrRow = ({ q, marked, start }: { q: number; marked: number; start: number }) => {
  const pop = usePop(start);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <div style={{ width: 34, fontFamily: FONT.display, fontSize: 32, color: C.rule }}>{q + 1}</div>
      {[0, 1, 2, 3].map((i) => {
        const on = i === marked ? pop : 0;
        return (
          <div
            key={i}
            style={{
              width: 42,
              height: 42,
              borderRadius: 999,
              border: `3px solid ${on > 0.05 ? C.mark : C.ruleFaint}`,
              background: alpha(C.mark, Math.min(1, on)),
              display: "grid",
              placeItems: "center",
              fontFamily: FONT.mono,
              fontSize: 18,
              fontWeight: 600,
              color: on > 0.5 ? C.paper : C.inkSoft,
              transform: `scale(${1 + 0.1 * on})`,
            }}
          >
            {i + 1}
          </div>
        );
      })}
    </div>
  );
};

export const Opening = () => {
  const frame = useCurrentFrame();
  const drop = usePop(4, { damping: 18, stiffness: 90, mass: 1 });
  const copy = progress(frame, 78, 20);
  const sub = progress(frame, 96, 20);

  return (
    <Desk>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ opacity: Math.min(1, drop * 1.4), transform: `translateY(${(1 - drop) * -140}px)` }}>
          <Sheet style={{ width: 1320 }}>
            <SheetHead style={{ padding: "76px 96px 56px", display: "flex", alignItems: "center" }}>
              <div style={{ flex: 1 }}>
                <Label style={{ fontSize: 26, letterSpacing: "0.16em" }}>QUIZ ANSWER SHEET</Label>
                <Display size={210} style={{ marginTop: 16 }}>
                  퀴즈팡
                </Display>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {MARKS.map((m, q) => (
                  <OmrRow key={q} q={q} marked={m} start={30 + q * 8} />
                ))}
              </div>
            </SheetHead>
            <SheetBody style={{ padding: "52px 96px 64px" }}>
              <Display
                size={70}
                style={{ opacity: copy, transform: `translateY(${(1 - copy) * 18}px)` }}
              >
                주제만 적으면, <span style={{ color: C.mark }}>AI가 문제</span>를 냅니다
              </Display>
              <div
                style={{
                  marginTop: 22,
                  fontSize: 34,
                  color: C.inkSoft,
                  opacity: sub,
                  transform: `translateY(${(1 - sub) * 12}px)`,
                }}
              >
                가입 없이, 닉네임 하나로 교실에서 바로 쓰는 퀴즈
              </div>
            </SheetBody>
          </Sheet>
        </div>
      </AbsoluteFill>
    </Desk>
  );
};
