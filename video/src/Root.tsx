import { Composition } from "remotion";
import { Intro, TOTAL_FRAMES } from "./Intro";
import { FPS } from "./theme";

export const Root = () => (
  <Composition
    id="QuizpangIntro"
    component={Intro}
    durationInFrames={TOTAL_FRAMES}
    fps={FPS}
    width={1920}
    height={1080}
  />
);
