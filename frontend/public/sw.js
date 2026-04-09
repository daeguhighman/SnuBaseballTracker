/* public/sw.js */

/* 캐시 이름은 버전 태그까지 포함해서 구분 */
const CACHE_NAME = "offline-v1";
const OFFLINE_URL = "/offline.html";

/* ---------- 1. install 단계: offline.html만 캐시 ---------- */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.add(OFFLINE_URL))
      .then(() => self.skipWaiting()) // 설치되면 즉시 활성화
  );
});

/* ---------- 2. activate 단계: 낡은 캐시 정리 ---------- */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim()) // 열린 탭에 새 SW 적용
  );
});

/* ---------- 3. fetch 가로채기 ---------- */
self.addEventListener("fetch", (event) => {
  /* navigation 요청(=HTML 문서)만 처리 ― JS/CSS 등은 신경 끄기 */
  if (event.request.mode !== "navigate") return;

  event.respondWith(
    fetch(event.request).catch(() => caches.match(OFFLINE_URL))
  );
});
