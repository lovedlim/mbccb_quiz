import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 같은 네트워크의 다른 기기(휴대폰 등)에서 dev 서버에 접속할 수 있게 허용
  allowedDevOrigins: ["10.103.180.74"],
};

export default nextConfig;
