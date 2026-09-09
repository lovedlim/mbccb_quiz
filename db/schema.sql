-- 퀴즈팡 스키마
create extension if not exists pgcrypto;

create table if not exists quizzes (
  id          uuid primary key default gen_random_uuid(),
  code        text unique not null,
  title       text not null,
  topic       text not null,
  difficulty  text not null default 'medium',
  author      text not null,
  published   boolean not null default false,
  created_at  timestamptz not null default now()
);

create table if not exists questions (
  id           uuid primary key default gen_random_uuid(),
  quiz_id      uuid not null references quizzes(id) on delete cascade,
  idx          int not null,
  prompt       text not null,
  choices      jsonb not null,
  answer       int not null,
  explanation  text not null default '',
  unique (quiz_id, idx)
);

create table if not exists attempts (
  id          uuid primary key default gen_random_uuid(),
  quiz_id     uuid not null references quizzes(id) on delete cascade,
  nickname    text not null,
  score       int not null,
  total       int not null,
  elapsed_ms  int not null default 0,
  answers     jsonb not null default '[]'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists attempts_rank_idx on attempts (quiz_id, score desc, elapsed_ms asc, created_at asc);
create index if not exists quizzes_author_idx on quizzes (author, created_at desc);
create index if not exists questions_quiz_idx on questions (quiz_id, idx);

-- 퀴즈 썸네일. base64 로 넣는다 (256x256 webp, 보통 10KB 안팎).
-- 별도 스토리지 없이 무료 Postgres 안에서 끝내기 위한 선택.
alter table quizzes add column if not exists thumbnail text;
alter table quizzes add column if not exists thumbnail_mime text not null default 'image/webp';

-- 썸네일을 다시 그렸을 때 브라우저 캐시를 확실히 갈아끼우기 위한 값.
-- 이미지 URL 에 ?v=<epoch> 로 붙는다.
alter table quizzes add column if not exists thumbnail_updated_at timestamptz;

-- 위 컬럼을 추가하기 전에 만들어진 썸네일에도 버전을 채워준다.
update quizzes set thumbnail_updated_at = now()
where thumbnail is not null and thumbnail_updated_at is null;
