// 사람이 불러주기 쉬운 공유 코드. 헷갈리는 글자(0/O, 1/I/L) 제외.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function makeShareCode(length = 6): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  let out = "";
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length];
  return out;
}

export function normalizeCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}
