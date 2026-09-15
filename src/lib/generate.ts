import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import type { Difficulty, FullQuestion } from "./types";
import { DIFFICULTY_LABEL } from "./types";

const QuestionSchema = z.object({
  prompt: z.string().describe("문제 본문. 한국어. 보기 내용을 미리 노출하지 말 것."),
  choices: z
    .array(z.string())
    .describe("정확히 4개의 선택지. 접두 번호(1., A. 등)를 붙이지 말고 내용만."),
  answer: z.number().int().describe("정답인 선택지의 0-based 인덱스 (0~3)."),
  explanation: z
    .string()
    .describe("정답 해설. 2~3문장. 왜 정답인지와 흔한 오답 이유를 함께."),
});

const QuizSchema = z.object({
  title: z.string().describe("퀴즈 제목. 15자 내외의 한국어."),
  questions: z.array(QuestionSchema),
});

export type GeneratedQuiz = {
  title: string;
  questions: FullQuestion[];
};

export class QuizGenerationError extends Error {}

/**
 * 모델이 가끔 진짜 줄바꿈 대신 역슬래시+n 두 글자를 그대로 뱉는다.
 * 그대로 저장하면 화면에 "\n" 이 글자로 보인다.
 */
function cleanText(raw: string, { singleLine = false } = {}): string {
  const unescaped = raw.replace(/\\r\\n|\\n|\\r/g, "\n");
  if (singleLine) return unescaped.replace(/\s+/g, " ").trim();
  return unescaped.replace(/\n{3,}/g, "\n\n").trim();
}

// gpt-6-astra 가 기본. 문항 품질을 우선한다.
// 비용을 줄이려면 OPENAI_MODEL 로 gpt-5.6-luna 를 지정한다.
const MODEL = process.env.OPENAI_MODEL ?? "gpt-6-astra";

const DIFFICULTY_GUIDE: Record<Difficulty, string> = {
  easy: "해당 주제를 처음 접한 학습자도 강의를 들었다면 풀 수 있는 수준. 용어의 정의와 기본 개념 위주.",
  medium:
    "핵심 개념을 이해했는지 확인하는 수준. 단순 암기보다 개념 간 관계나 적용 사례를 묻는다.",
  hard: "개념을 실제 상황에 적용하거나, 비슷해 보이는 개념을 구분해야 풀리는 수준. 함정 선택지를 포함한다.",
};

const INSTRUCTIONS = [
  "당신은 한국어 교육 콘텐츠를 만드는 출제 전문가입니다.",
  "주어진 주제로 4지선다 객관식 문제를 출제합니다.",
  "",
  "규칙:",
  "- 모든 문항은 한국어로 작성합니다.",
  "- 각 문항의 선택지는 정확히 4개이며, 정답은 1개입니다.",
  "- 오답 선택지도 그럴듯해야 합니다. 명백히 말이 안 되는 선택지는 만들지 마세요.",
  "- 정답이 특정 위치에 몰리지 않도록 정답 인덱스를 문항마다 고르게 분산시키세요.",
  "- '위의 모든 것', '정답 없음' 같은 선택지는 쓰지 마세요.",
  "- 문항끼리 내용이 겹치지 않게 주제의 서로 다른 측면을 다루세요.",
  "- 사실관계가 확실하지 않은 내용은 출제하지 마세요.",
].join("\n");

/**
 * OpenAI Responses API 로 객관식 퀴즈를 생성한다.
 * 구조화 출력(structured outputs)을 써서 스키마에 맞는 JSON 을 보장받는다.
 */
export async function generateQuiz(opts: {
  topic: string;
  count: number;
  difficulty: Difficulty;
}): Promise<GeneratedQuiz> {
  const { topic, count, difficulty } = opts;

  if (!process.env.OPENAI_API_KEY) {
    throw new QuizGenerationError(
      "OPENAI_API_KEY 가 설정되지 않았습니다. `vercel env add OPENAI_API_KEY` 로 등록한 뒤 다시 시도해주세요.",
    );
  }

  const client = new OpenAI();

  const input = [
    `주제: ${topic}`,
    `문항 수: ${count}개 (정확히 ${count}개를 만들어주세요)`,
    `난이도: ${DIFFICULTY_LABEL[difficulty]} — ${DIFFICULTY_GUIDE[difficulty]}`,
  ].join("\n");

  let response;
  try {
    response = await client.responses.parse({
      model: MODEL,
      instructions: INSTRUCTIONS,
      input,
      max_output_tokens: 16000,
      text: { format: zodTextFormat(QuizSchema, "quiz") },
    });
  } catch (err) {
    if (err instanceof OpenAI.APIError) {
      if (err.status === 401) {
        throw new QuizGenerationError("OPENAI_API_KEY 가 올바르지 않습니다.");
      }
      if (err.status === 404) {
        throw new QuizGenerationError(
          `이 계정에서 '${MODEL}' 모델을 쓸 수 없습니다. OPENAI_MODEL 환경변수로 다른 모델을 지정해주세요.`,
        );
      }
      if (err.status === 429) {
        throw new QuizGenerationError(
          "OpenAI 사용량 한도에 걸렸습니다. 잠시 후 다시 시도해주세요.",
        );
      }
      throw new QuizGenerationError(`OpenAI 오류 (${err.status}): ${err.message}`);
    }
    throw err;
  }

  if (response.status === "incomplete") {
    throw new QuizGenerationError(
      "응답이 중간에 끊겼습니다. 문항 수를 줄이고 다시 시도해주세요.",
    );
  }

  const parsed = response.output_parsed;
  if (!parsed) {
    throw new QuizGenerationError(
      "퀴즈 생성 결과를 해석하지 못했습니다. 잠시 후 다시 시도해주세요.",
    );
  }

  const questions: FullQuestion[] = [];
  for (const q of parsed.questions) {
    // 스키마가 개수·범위까지 보장하지는 않으므로 여기서 걸러낸다.
    if (q.choices.length !== 4) continue;
    if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer > 3) continue;
    const prompt = cleanText(q.prompt);
    if (!prompt) continue;
    questions.push({
      idx: questions.length,
      prompt,
      // 선택지는 한 줄이어야 목록에서 깨지지 않는다.
      choices: q.choices.map((c) => cleanText(c, { singleLine: true })),
      answer: q.answer,
      explanation: cleanText(q.explanation),
    });
  }

  if (questions.length === 0) {
    throw new QuizGenerationError(
      "유효한 문항이 하나도 생성되지 않았습니다. 주제를 조금 더 구체적으로 적어주세요.",
    );
  }

  return { title: cleanText(parsed.title, { singleLine: true }) || topic, questions };
}
