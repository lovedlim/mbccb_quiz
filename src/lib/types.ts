export type Difficulty = "easy" | "medium" | "hard";

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: "쉬움",
  medium: "보통",
  hard: "어려움",
};

export type Quiz = {
  id: string;
  code: string;
  title: string;
  topic: string;
  difficulty: Difficulty;
  author: string;
  published: boolean;
  created_at: string;
  /**
   * 썸네일이 마지막으로 바뀐 시각(epoch 초). 없으면 그림이 없다는 뜻.
   * 이미지 URL 에 ?v= 로 붙여 다시 그렸을 때 캐시가 갈리게 한다.
   */
  thumbnail_version: number | null;
};

/** 학습자에게 내려가는 문항 — 정답/해설 제외 */
export type PublicQuestion = {
  idx: number;
  prompt: string;
  choices: string[];
};

/** 교수자·채점 결과에만 포함되는 문항 */
export type FullQuestion = PublicQuestion & {
  answer: number;
  explanation: string;
};

export type LeaderboardRow = {
  rank: number;
  nickname: string;
  score: number;
  total: number;
  elapsed_ms: number;
  created_at: string;
};

export type GradedAnswer = {
  idx: number;
  prompt: string;
  choices: string[];
  answer: number;
  picked: number | null;
  correct: boolean;
  explanation: string;
};
