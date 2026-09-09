"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { readSession, writeSession, type Role } from "@/lib/session";

const ROLES: { value: Role; label: string; hint: string }[] = [
  { value: "teacher", label: "교수자", hint: "주제를 정하면 AI가 문제를 냅니다" },
  { value: "student", label: "학습자", hint: "코드를 받아 퀴즈를 풉니다" },
];

export default function LoginPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [role, setRole] = useState<Role | null>(null);
  const [error, setError] = useState("");

  // 이미 들어와 있던 사람은 바로 자기 자리로.
  useEffect(() => {
    const existing = readSession();
    if (existing) router.replace(existing.role === "teacher" ? "/teacher" : "/student");
  }, [router]);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const name = nickname.trim();

    if (name.length < 2) return setError("닉네임을 2자 이상 적어주세요.");
    if (name.length > 20) return setError("닉네임은 20자까지 쓸 수 있습니다.");
    if (!role) return setError("교수자와 학습자 중 하나를 골라주세요.");

    writeSession({ nickname: name, role });
    router.push(role === "teacher" ? "/teacher" : "/student");
  }

  return (
    <div className="flex min-h-full flex-col px-4 py-10 sm:py-16">
      <form onSubmit={submit} className="sheet stagger">
        <div className="sheet-head" style={{ animationDelay: "0ms" }}>
          <p className="field-label field-label-en">Quiz Answer Sheet</p>
          <h1 className="display mt-3 text-5xl text-ink sm:text-6xl">퀴즈팡</h1>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-soft">
            가입은 없습니다. 닉네임만 적으면 바로 시작합니다.
          </p>
        </div>

        <div className="sheet-body space-y-8" style={{ animationDelay: "70ms" }}>
          <div>
            <label htmlFor="nickname" className="field-label">
              닉네임
            </label>
            <input
              id="nickname"
              className="input mt-2"
              value={nickname}
              onChange={(e) => {
                setNickname(e.target.value);
                setError("");
              }}
              placeholder="리더보드에 이 이름이 뜹니다"
              maxLength={20}
              autoFocus
              autoComplete="off"
            />
          </div>

          <fieldset>
            <legend className="field-label">역할</legend>
            <div className="mt-2 space-y-1">
              {ROLES.map((option, i) => (
                <button
                  key={option.value}
                  type="button"
                  className="bubble-row"
                  data-marked={role === option.value}
                  aria-pressed={role === option.value}
                  onClick={() => {
                    setRole(option.value);
                    setError("");
                  }}
                >
                  <span className="bubble" aria-hidden>
                    {i + 1}
                  </span>
                  <span className="bubble-text">
                    <span className="font-semibold">{option.label}</span>
                    <span className="ml-2 text-ink-soft">{option.hint}</span>
                  </span>
                </button>
              ))}
            </div>
          </fieldset>

          {error && (
            <p role="alert" className="text-sm font-semibold text-mark">
              {error}
            </p>
          )}

          <button type="submit" className="btn btn-mark w-full">
            시작하기
          </button>
        </div>
      </form>
    </div>
  );
}
