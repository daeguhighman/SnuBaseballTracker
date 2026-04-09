const withPWA = require("next-pwa")({
  dest: "public", // PWA 리소스 저장 위치
  register: true, // 서비스 워커 자동 등록
  skipWaiting: true, // 새로운 서비스 워커 즉시 적용
  // disable: process.env.NODE_ENV === "development", // 개발 환경에서는 PWA 비활성화

  disable: false, // 개발 환경에서도 활성화
});

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  devIndicators: {
    buildActivity: false, // 로딩 스피너 끔
    // buildActivityPosition: "bottom-right" // 위치 바꾸고 싶으면
  },

  // 매니페스트 파일에 대한 헤더 설정 추가
  async headers() {
    return [
      {
        source: "/manifest.json",
        headers: [
          {
            key: "Content-Type",
            value: "application/json",
          },
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
          {
            key: "Cache-Control",
            value: "public, max-age=3600",
          },
        ],
      },
    ];
  },

  // ── 여기에만 추가했습니다 ──
  async redirects() {
    return [
      {
        source: "/:path*",
        destination: "/tournament-end.html",
        permanent: false,
      },
    ];
  },
  // ────────────────────────

  // API 프록시 설정: /api/* 경로를 환경변수로 지정된 백엔드 주소로 리다이렉트
  rewrites: async () => [
    {
      source: "/api/:path*",
      destination: `${process.env.NEXT_PUBLIC_API_URL}/:path*`,
    },
  ],

  webpack: (config, { isServer }) => {
    if (isServer) {
      console.log("🔄 Compiling sw.ts to sw.js...");
      try {
        execSync("tsc src/service-worker/sw.ts --outDir public", {
          stdio: "inherit",
        });
        console.log("✅ sw.ts successfully compiled to sw.js");
      } catch (error) {
        console.error("❌ Error compiling sw.ts:", error);
      }
    }
    return config;
  },
};

// HTTPS 환경 설정 (개발 환경에서만 적용)
if (process.env.NODE_ENV === "development") {
  console.log("🚀 Enabling HTTPS for development mode...");

  const keyPath = path.resolve(__dirname, "cert.key");
  const certPath = path.resolve(__dirname, "cert.crt");
  const caPath = path.resolve(__dirname, "ca.crt");

  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    nextConfig.devServer = {
      https: {
        key: fs.readFileSync(keyPath), // 인증서 개인 키 적용
        cert: fs.readFileSync(certPath), // 인증서 파일 적용
        ca: fs.existsSync(caPath) ? fs.readFileSync(caPath) : undefined, // CA 인증서가 있으면 적용
      },
    };
    console.log("✅ HTTPS successfully enabled!");
    console.log("🔍 현재 환경 변수 확인:", process.env);
  } else {
    console.warn("⚠️ HTTPS 인증서(cert.key, cert.crt)가 존재하지 않습니다.");
  }
}

module.exports = withPWA(nextConfig);
