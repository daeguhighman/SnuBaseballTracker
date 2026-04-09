// // libs/api.tsx
// import axios, { AxiosError, AxiosRequestConfig } from "axios";
// import {
//   clearAccessToken,
//   getAccessToken,
//   setAccessToken,
// } from "../libraries/token";

// const API = axios.create({
//   baseURL: process.env.NEXT_PUBLIC_API_URL,
//   withCredentials: false,
//   headers: { "Content-Type": "application/json" },
// });

// // console.log("분기 합침 테스트");
// // ── 전역 플래그: refresh를 한 번이라도 했는지 ──
// let hasRefreshed = false;

// API.interceptors.request.use(
//   (config) => {
//     // ── 1) games 관련 withCredentials 로직 유지 ──
//     const method = config.method?.toLowerCase();
//     const url = config.url ?? "";
//     if (url.includes("/games")) {
//       const isGet = method === "get";
//       const isResultEndpoint = url.endsWith("/result");
//       if (!(isGet && isResultEndpoint)) {
//         config.withCredentials = false;
//       }
//     }
//     const token = getAccessToken();
//     if (token && config.headers) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// // API.interceptors.response.use(
// //   (res) => res,
// //   async (
// //     error: AxiosError & { config?: AxiosRequestConfig & { _retry?: boolean } }
// //   ) => {
// //     const originalReq = error.config!;
// //     const url = originalReq.url ?? "";

// //     // ── 1) 리프레시 엔드포인트 자체는 재시도하지 않고 로그인으로 ──
// //     if (url.endsWith("/auth/refresh")) {
// //       clearAccessToken();
// //       // window.location.href = "/login";
// //       return Promise.reject(error);
// //     }

// //     // ── 2) 401 에러 && 아직 이 요청에서 _retry=false && 한번도 리프레시하지 않았다면 ──
// //     if (
// //       error.response?.status === 401 &&
// //       !originalReq._retry &&
// //       !hasRefreshed
// //     ) {
// //       originalReq._retry = true;
// //       hasRefreshed = true; // **여기서 플래그를 true로**
// //       try {
// //         // refreshToken 쿠키로 새 accessToken 요청
// //         const { data } = await API.post("/auth/refresh");
// //         setAccessToken(data.accessToken);

// //         // 원래 요청 헤더에 새 토큰 세팅 후 재시도
// //         if (originalReq.headers) {
// //           originalReq.headers.Authorization = `Bearer ${data.accessToken}`;
// //         }
// //         return API(originalReq);
// //       } catch {
// //         // 리프레시 실패 시 토큰 초기화 & 로그인 페이지로
// //         clearAccessToken();
// //         window.location.href = "/login";
// //       }
// //     }

// //     return Promise.reject(error);
// //   }
// // );

// API.interceptors.response.use(
//   (res) => res,
//   async (
//     error: AxiosError & { config?: AxiosRequestConfig & { _retry?: boolean } }
//   ) => {
//     const originalReq = error.config;
//     if (!originalReq) {
//       // config조차 없으면 재시도 로직을 탈 수 없으니  그냥 reject
//       return Promise.reject(error);
//     }

//     const url = originalReq.url ?? "";

//     // 1) refresh 자체는 재시도 X
//     if (url.endsWith("/auth/refresh")) {
//       clearAccessToken();
//       return Promise.reject(error);
//     }

//     // 2) 401이고, 아직 retry 안했고, 전역에서 한번도 refresh 안했다면
//     if (
//       error.response?.status === 401 &&
//       !originalReq._retry &&
//       !hasRefreshed
//     ) {
//       originalReq._retry = true;
//       hasRefreshed = true;
//       try {
//         const { data } = await API.post("/auth/refresh");
//         setAccessToken(data.accessToken);

//         if (originalReq.headers) {
//           originalReq.headers.Authorization = `Bearer ${data.accessToken}`;
//         }
//         return API(originalReq);
//       } catch {
//         clearAccessToken();
//         window.location.href = "/login";
//       }
//     }

//     return Promise.reject(error);
//   }
// );

// export default API;

// import axios from "axios";

// const APIpre = axios.create({
//   baseURL: process.env.NEXT_PUBLIC_API_URL,
//   headers: {
//     "Content-Type": "application/json",
//     // "ngrok-skip-browser-warning": "69420",
//   },
// });

// APIpre.interceptors.request.use(
//   (config) => {
//     const method = config.method?.toLowerCase();
//     const url = config.url ?? "";

//     // games 관련 요청은 기존 로직 유지
//     if (url.includes("/games")) {
//       const isGet = method === "get";
//       const isResultEndpoint = url.endsWith("/result");
//       if (!(isGet && isResultEndpoint)) {
//         config.withCredentials = false;
//       }
//     }

//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// export default API;
