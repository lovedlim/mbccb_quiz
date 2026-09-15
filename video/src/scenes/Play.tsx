import { interpolate, useCurrentFrame } from "remotion";
import quiz from "../data/quiz.json";
import { C, FONT } from "../theme";
import { BubbleRow, Button, Display, Label, Sheet, Split, clamp, progress } from "../ui";

// 3번(컴백)만 틀리게 고른다. 결과 장면과 맞춘다.
export const PICKS = quiz.questions.map((q) => (q.idx === 2 ? 3 : q.answer));

const BLOCK = 366; // 문항 한 덩어리 높이(px)
const GAP = 42; // 문항 사이 프레임 간격
const markAt = (i: number) => 26 + GAP * i;
const SUBMIT = 222;

export const Play = () => {
  const frame = useCurrentFrame();

  // 다음 문항을 칠하기 직전에 한 칸씩 스크롤
  const scroll = quiz.questions.reduce((y, _, i) => {
    if (i === 0) return y;
    const at = markAt(i) - 18;
    return y + BLOCK * progress(frame, at, 14);
  }, 0);

  const marked = quiz.questions.filter((_, i) => frame >= markAt(i)).length;
  const press = interpolate(frame, [SUBMIT, SUBMIT + 4, SUBMIT + 10], [1, 0.95, 1], clamp);
  const grading = frame >= SUBMIT + 6;

  return (
    <Split
      step="03 · 응시"
      title={"가입 없이,\n닉네임만 적고\n풉니다"}
      sub={"한 화면에 전 문항.\n빈 문항은 오답 처리됩니다."}
    >
      <Sheet style={{ height: 880, display: "flex", flexDirection: "column" }}>
        <div style={{ borderBottom: `2px solid ${C.rule}`, padding: "44px 60px 26px" }}>
          <Label>5문항 · 쉬움 · 출제 퇴근후딴짓</Label>
          <Display size={50} style={{ marginTop: 12 }}>
            {quiz.title}
          </Display>
        </div>

        <div style={{ position: "relative", flex: 1, overflow: "hidden" }}>
          <div style={{ padding: "34px 60px", transform: `translateY(${-scroll}px)` }}>
            {quiz.questions.map((q, i) => (
              <div key={q.idx} style={{ height: BLOCK, display: "flex", gap: 26 }}>
                <Display size={46} color={C.rule} style={{ width: 34, lineHeight: 1 }}>
                  {i + 1}
                </Display>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 30, fontWeight: 600, marginBottom: 14 }}>{q.prompt}</div>
                  {q.choices.map((choice, c) => (
                    <BubbleRow
                      key={c}
                      n={c + 1}
                      text={choice}
                      fontSize={26}
                      state={c === PICKS[i] ? "marked" : "idle"}
                      t={progress(frame, markAt(i), 7)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 마킹 현황 바 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 26,
            padding: "20px 30px",
            borderTop: `2px solid ${C.rule}`,
            background: C.paper,
          }}
        >
          <div style={{ fontFamily: FONT.mono, fontSize: 32, fontWeight: 600 }}>
            {marked}
            <span style={{ color: C.inkSoft }}>/{quiz.questions.length}</span>
          </div>
          <div style={{ fontSize: 26, color: C.inkSoft }}>
            {marked === quiz.questions.length ? "다 풀었습니다." : "빈 문항은 오답 처리됩니다."}
          </div>
          <Button
            variant="mark"
            style={{ marginLeft: "auto", minWidth: 200, transform: `scale(${press})` }}
          >
            {grading ? "채점 중…" : "제출하기"}
          </Button>
        </div>
      </Sheet>
    </Split>
  );
};
