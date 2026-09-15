import { interpolate, useCurrentFrame } from "remotion";
import quiz from "../data/quiz.json";
import { C, FONT, alpha } from "../theme";
import { BubbleRow, Display, Label, Sheet, SheetBody, SheetHead, Split, clamp, progress } from "../ui";
import { PICKS } from "./Play";

// 진배·ebs 는 실제 리더보드 기록, 민지는 시연용 응시
const BOARD = [
  { nickname: "민지", me: true, time: "2:14", score: 4 },
  { nickname: "진배", me: false, time: "0:03", score: 1 },
  { nickname: "ebs", me: false, time: "0:20", score: 1 },
];

const REVIEW_AT = 168;
const WRONG = 2;

export const Result = () => {
  const frame = useCurrentFrame();
  const total = quiz.questions.length;
  const score = PICKS.filter((p, i) => p === quiz.questions[i].answer).length;

  const shown = Math.round(interpolate(frame, [18, 48], [0, score], clamp));
  const rank = progress(frame, 50, 12);
  const time = progress(frame, 60, 12);
  const highlight = progress(frame, 128, 12);

  const swap = progress(frame, REVIEW_AT, 26);
  const q = quiz.questions[WRONG];

  return (
    <Split
      step="04 · 결과"
      title={"채점은 서버가,\n순위는 실시간으로"}
      sub={"점수·순위·문항별 해설까지\n제출하자마자 돌아옵니다."}
    >
      <div style={{ position: "relative", height: "100%", overflow: "hidden" }}>
        {/* 점수와 리더보드 */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            transform: `translateY(${-swap * 920}px)`,
          }}
        >
          <Sheet>
            <SheetHead style={{ padding: "44px 60px 26px" }}>
              <Label>채점 결과</Label>
              <Display size={52} style={{ marginTop: 12 }}>
                {quiz.title}
              </Display>
            </SheetHead>
            <SheetBody style={{ display: "flex", alignItems: "flex-end", gap: 80 }}>
              <div>
                <Label>점수</Label>
                <Display size={150} color={C.mark} style={{ lineHeight: 1 }}>
                  {shown}
                  <span style={{ fontSize: 76, color: C.ruleFaint }}>/{total}</span>
                </Display>
              </div>
              <div style={{ opacity: rank }}>
                <Label>순위</Label>
                <Display size={96} color={C.rule} style={{ lineHeight: 1 }}>
                  1<span style={{ fontSize: 50, color: C.ruleFaint }}>/{BOARD.length}</span>
                </Display>
              </div>
              <div style={{ opacity: time, paddingBottom: 10 }}>
                <Label>걸린 시간</Label>
                <div style={{ marginTop: 10, fontFamily: FONT.mono, fontSize: 40 }}>2분 14초</div>
              </div>
            </SheetBody>
          </Sheet>

          <Label style={{ marginTop: 44 }}>리더보드</Label>
          <div style={{ marginTop: 14, borderTop: `1.5px solid ${C.ruleFaint}` }}>
            {BOARD.map((row, i) => {
              const p = progress(frame, 78 + i * 10, 14);
              return (
                <div
                  key={row.nickname}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    height: 84,
                    padding: "0 26px",
                    borderBottom: `1.5px solid ${C.ruleFaint}`,
                    background: row.me ? alpha(C.mark, 0.1 * highlight) : "transparent",
                    opacity: p,
                    transform: `translateX(${(1 - p) * 40}px)`,
                  }}
                >
                  <Display size={38} color={C.mark} style={{ width: 70 }}>
                    {i + 1}
                  </Display>
                  <div style={{ fontSize: 32, fontWeight: 600 }}>{row.nickname}</div>
                  {row.me && (
                    <span style={{ marginLeft: 12, fontSize: 22, color: C.mark, opacity: highlight }}>
                      나
                    </span>
                  )}
                  <div
                    style={{ marginLeft: "auto", fontFamily: FONT.mono, fontSize: 28, color: C.inkSoft }}
                  >
                    {row.time}
                  </div>
                  <div style={{ marginLeft: 36, fontFamily: FONT.mono, fontSize: 30, fontWeight: 600 }}>
                    {row.score}/{total}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 문항별 리뷰 */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            transform: `translateY(${(1 - swap) * 920}px)`,
          }}
        >
          <Label>문항별 리뷰</Label>
          <Sheet style={{ marginTop: 16, padding: "44px 50px 48px" }}>
            <div style={{ display: "flex", gap: 26 }}>
              <Display size={50} color={C.mark} style={{ width: 34, lineHeight: 1 }}>
                {WRONG + 1}
              </Display>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 32, fontWeight: 600, marginBottom: 18 }}>{q.prompt}</div>
                {q.choices.map((choice, c) => (
                  <div key={c} style={{ marginBottom: 8 }}>
                    <BubbleRow
                      n={c + 1}
                      text={choice}
                      fontSize={27}
                      state={c === q.answer ? "correct" : c === PICKS[WRONG] ? "wrong" : "idle"}
                      t={progress(frame, c === q.answer ? REVIEW_AT + 30 : REVIEW_AT + 42, 10)}
                      note={c === PICKS[WRONG] ? "내가 고른 답" : undefined}
                    />
                  </div>
                ))}
                <div
                  style={{
                    marginTop: 22,
                    paddingLeft: 22,
                    borderLeft: `4px solid ${C.rule}`,
                    fontSize: 25,
                    lineHeight: 1.6,
                    color: C.inkSoft,
                    opacity: progress(frame, REVIEW_AT + 58, 14),
                  }}
                >
                  {q.explanation}
                </div>
              </div>
            </div>
          </Sheet>
        </div>
      </div>
    </Split>
  );
};
