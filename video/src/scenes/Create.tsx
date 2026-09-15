import { Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import quiz from "../data/quiz.json";
import { C, FONT } from "../theme";
import { Button, Display, Label, Sheet, SheetBody, SheetHead, Split, clamp, progress, usePop } from "../ui";

const TYPE_START = 18;
const TYPE_END = 72;
const PICK_EASY = 102;
const PRESS = 128;
const GENERATE = 150;

const Choice = ({ label, on }: { label: string; on: boolean }) => (
  <div
    style={{
      flex: 1,
      height: 76,
      display: "grid",
      placeItems: "center",
      border: `2px solid ${on ? C.rule : C.ruleFaint}`,
      background: on ? C.rule : "transparent",
      color: on ? C.paper : C.inkSoft,
      fontFamily: `${FONT.mono}, ${FONT.body}`,
      fontSize: 28,
      fontWeight: 600,
    }}
  >
    {label}
  </div>
);

export const Create = () => {
  const frame = useCurrentFrame();

  const typed = Math.floor(
    interpolate(frame, [TYPE_START, TYPE_END], [0, quiz.title.length], clamp),
  );
  const caretOn = frame < PRESS && Math.floor(frame / 15) % 2 === 0;
  const easy = frame >= PICK_EASY;
  const press = interpolate(frame, [PRESS, PRESS + 4, PRESS + 10], [1, 0.96, 1], clamp);
  const busy = frame >= PRESS + 6;
  const dots = ".".repeat(1 + (Math.floor(frame / 8) % 3));

  const form = 1 - progress(frame, GENERATE, 12);
  const made = progress(frame, GENERATE + 6, 14);
  const thumb = usePop(GENERATE + 50);

  return (
    <Split
      step="01 · 출제"
      title={"한 줄이면\n충분합니다"}
      sub={"주제, 문항 수, 난이도.\n입력은 이 셋이 전부입니다."}
    >
      <Sheet style={{ height: 840 }}>
        {/* 입력 폼 */}
        <div style={{ position: "absolute", inset: 0, opacity: form }}>
          <SheetHead>
            <Label>출제</Label>
            <Display size={64} style={{ marginTop: 14 }}>
              무엇을 물어볼까요?
            </Display>
          </SheetHead>
          <SheetBody>
            <Label>주제</Label>
            <div
              style={{
                marginTop: 14,
                height: 92,
                display: "flex",
                alignItems: "center",
                padding: "0 26px",
                border: `2px solid ${frame > 10 ? C.rule : C.ruleFaint}`,
                fontSize: 36,
              }}
            >
              {quiz.title.slice(0, typed)}
              <span
                style={{
                  display: "inline-block",
                  width: 3,
                  height: 42,
                  marginLeft: 3,
                  background: caretOn ? C.ink : "transparent",
                }}
              />
            </div>

            <div style={{ marginTop: 40, display: "flex", gap: 40 }}>
              <div style={{ flex: 1 }}>
                <Label>문항 수</Label>
                <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
                  <Choice label="5" on />
                  <Choice label="10" on={false} />
                  <Choice label="15" on={false} />
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <Label>난이도</Label>
                <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
                  <Choice label="쉬움" on={easy} />
                  <Choice label="보통" on={!easy} />
                  <Choice label="어려움" on={false} />
                </div>
              </div>
            </div>

            <Button
              variant="mark"
              style={{ marginTop: 52, height: 96, fontSize: 32, transform: `scale(${press})` }}
            >
              {busy ? `AI가 출제하는 중${dots}` : "퀴즈 만들기"}
            </Button>
          </SheetBody>
        </div>

        {/* 출제 결과 */}
        <div style={{ position: "absolute", inset: 0, opacity: made }}>
          <SheetHead style={{ display: "flex", alignItems: "center", gap: 30 }}>
            <div style={{ flex: 1 }}>
              <Label>5문항 · 쉬움 · 공유 코드 {quiz.code}</Label>
              <Display size={60} style={{ marginTop: 14 }}>
                {quiz.title}
              </Display>
            </div>
            <Img
              src={staticFile("thumb.webp")}
              style={{
                width: 132,
                height: 132,
                border: `1.5px solid ${C.ruleFaint}`,
                transform: `scale(${thumb})`,
              }}
            />
          </SheetHead>
          <SheetBody style={{ paddingTop: 16 }}>
            {quiz.questions.map((q, i) => {
              const p = progress(frame, GENERATE + 14 + i * 12, 14);
              return (
                <div
                  key={q.idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 26,
                    padding: "24px 0",
                    borderBottom: `1.5px solid ${C.ruleFaint}`,
                    opacity: p,
                    transform: `translateY(${(1 - p) * 20}px)`,
                  }}
                >
                  <Display size={40} color={C.rule} style={{ width: 34 }}>
                    {i + 1}
                  </Display>
                  <div style={{ flex: 1, fontSize: 29, fontWeight: 600 }}>{q.prompt}</div>
                </div>
              );
            })}
          </SheetBody>
        </div>
      </Sheet>
    </Split>
  );
};
