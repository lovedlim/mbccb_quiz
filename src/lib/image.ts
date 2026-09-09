import OpenAI from "openai";
import sharp from "sharp";

/** 목록에 뜨는 크기. 이보다 크게 저장할 이유가 없다. */
const THUMB_PX = 256;

// OPENAI_IMAGE_MODEL 로 교체 가능. 더 싸게 가려면 gpt-image-1-mini.
const IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-2";

// QUIZ_IMAGE_STYLE=flat 으로 두면 답안지 톤에 맞춘 평면 일러스트로 돌아간다.
const STYLE = process.env.QUIZ_IMAGE_STYLE === "flat" ? "flat" : "3d";

export type Thumbnail = { base64: string; mime: string; bytes: number };

/**
 * 퀴즈 주제에 맞는 썸네일 한 장을 만든다.
 *
 * 답안지 화면에 얹히는 그림이라 앱 팔레트(종이 흰색·인쇄 남색·주홍)로 묶었고,
 * 글자는 넣지 말라고 못박았다 — 이미지 모델이 한글을 제대로 못 쓴다.
 */
export async function generateThumbnail(opts: {
  topic: string;
  title: string;
}): Promise<Thumbnail> {
  const client = new OpenAI();

  // 두 스타일 모두 앱 팔레트(미색 종이·남색·주홍)에 묶어둔다.
  // 그래야 답안지 화면 위에 얹혀도 남의 그림처럼 보이지 않는다.
  const STYLE_LINES: Record<typeof STYLE, string[]> = {
    "3d": [
      "부드러운 스튜디오 조명의 3D 렌더로 그려주세요.",
      "- 정사각형 구도, 주제를 상징하는 사물 하나를 가운데에 크게",
      "- 매끈한 점토·플라스틱 같은 질감, 둥글린 모서리",
      "- 살짝 위에서 내려다보는 시점, 바닥에 부드러운 그림자",
      "- 배경은 아주 옅은 미색(#FBFAF7) 단색",
      "- 진한 남색(#1B3A8F)과 주홍(#E8452E)을 주된 색으로, 명암은 부드럽게",
    ],
    flat: [
      "단순한 플랫 일러스트로 그려주세요.",
      "- 정사각형 구도, 주제를 상징하는 사물 하나를 가운데에 크게",
      "- 배경은 아주 옅은 미색 종이(#FBFAF7)",
      "- 색은 진한 남색(#1B3A8F)과 주홍(#E8452E) 두 가지에 회색조만 더해 사용",
      "- 평면적인 면과 굵은 윤곽선. 사진처럼 사실적으로 그리지 말 것",
    ],
  };

  const prompt = [
    `주제: ${opts.topic}`,
    "",
    "위 주제를 한눈에 알아볼 수 있는 그림이 필요합니다.",
    ...STYLE_LINES[STYLE],
    "- 글자, 숫자, 문자, 로고는 절대 넣지 말 것.",
    "  글자처럼 보이는 구불구불한 획이나 기호 흉내도 넣지 마세요.",
    "  문서·책·간판을 그릴 때는 표면을 비워두세요.",
    "- 아주 작게(256px) 축소해도 알아볼 수 있게 형태를 단순하게",
  ].join("\n");

  const result = await client.images.generate({
    model: IMAGE_MODEL,
    prompt,
    n: 1,
    size: "1024x1024",
    quality: STYLE === "3d" ? "medium" : "low",
    output_format: "webp",
  });

  const b64 = result.data?.[0]?.b64_json;
  if (!b64) throw new Error("이미지 응답에 데이터가 없습니다.");

  // 이미지 모델의 최소 크기가 1024 이므로 받아서 직접 줄인다.
  const thumb = await sharp(Buffer.from(b64, "base64"))
    .resize(THUMB_PX, THUMB_PX, { fit: "cover" })
    .webp({ quality: 72 })
    .toBuffer();

  return {
    base64: thumb.toString("base64"),
    mime: "image/webp",
    bytes: thumb.length,
  };
}
