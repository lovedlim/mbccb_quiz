/**
 * 답안지에 붙인 사진처럼 보이는 퀴즈 썸네일.
 * 그림이 없으면(생성 실패·구 퀴즈) 마킹 전 버블 모양으로 자리를 지킨다.
 */
export function QuizThumb({
  code,
  version,
  size = 56,
  title,
}: {
  code: string;
  /** 썸네일이 바뀐 시각. null 이면 그림이 없다. URL 에 붙어 캐시를 가른다. */
  version: number | null;
  size?: number;
  title: string;
}) {
  if (version == null) {
    return (
      <span
        className="thumb thumb-empty"
        style={{ width: size, height: size }}
        aria-hidden
      >
        <span className="thumb-dot" />
      </span>
    );
  }

  return (
    // 동적 API 라우트에서 오는 작은 이미지라 next/image 최적화가 필요 없다.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className="thumb"
      src={`/api/quizzes/${code}/thumbnail?v=${version}`}
      alt={`${title} 썸네일`}
      width={size}
      height={size}
      style={{ width: size, height: size }}
      loading="lazy"
      decoding="async"
    />
  );
}
