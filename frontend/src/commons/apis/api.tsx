// libs/api.ts
import axios, {
  AxiosError,
  AxiosHeaders,
  // AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from "axios";
import {
  clearAccessToken,
  getAccessToken,
  setAccessToken,
} from "../libraries/token";

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };

const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  // withCredentials: false,
  headers: { "Content-Type": "application/json" },
});

/* ── Refresh 중복 방지용 ─────────────────────── */
let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;
type Resolver = (token: string) => void;
const requestQueue: Resolver[] = [];

const subscribeTokenRefresh = (cb: Resolver) => requestQueue.push(cb);
const onRefreshed = (token: string) => {
  requestQueue.forEach((cb) => cb(token));
  requestQueue.length = 0;
};

/* ── Request 인터셉터 ───────────────────────── */
API.interceptors.request.use(
  (config) => {
    // /games 관련 withCredentials 커스텀
    const method = config.method?.toLowerCase();
    const url = config.url ?? "";
    if (url.includes("/games")) {
      const isGet = method === "get";
      const isResultEndpoint = url.endsWith("/result");
      if (!(isGet && isResultEndpoint)) {
        config.withCredentials = false;
      }
    }

    const token = getAccessToken();
    if (token) {
      // Axios v1: headers는 AxiosHeaders 객체일 수 있음
      if (!config.headers) config.headers = new AxiosHeaders();
      (config.headers as AxiosHeaders).set("Authorization", `Bearer ${token}`);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/* ── Response 인터셉터 ──────────────────────── */
API.interceptors.response.use(
  (res) => res,
  async (
    error: AxiosError & {
      config?: RetryConfig;
    }
  ) => {
    const originalReq = error.config as RetryConfig | undefined;
    if (!originalReq) return Promise.reject(error);

    const url = originalReq.url ?? "";
    // ←– **NEW**: if this is login or signup, just bubble up the error
    if (
      url.endsWith("/auth/login") ||
      url.endsWith("/auth/signup") ||
      url.endsWith("/auth/email/request") ||
      url.endsWith("/auth/email/verify")
    ) {
      return Promise.reject(error);
    }

    // refresh 자체가 실패하면 끝
    if (url.endsWith("/auth/refresh")) {
      clearAccessToken();
      return Promise.reject(error);
    }

    // 401 처리
    if (error.response?.status === 401 && !originalReq._retry) {
      originalReq._retry = true;

      // 첫 번째 401 처리자
      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = API.post("/auth/refresh")
          .then(({ data }) => {
            const newToken: string = data.accessToken;
            setAccessToken(newToken);
            onRefreshed(newToken);
            return newToken;
          })
          // 이거때매 401을 받으면 계속 login으로 갔던거임
          // .catch(() => {
          //   clearAccessToken();
          //   // window.location.href = "/login";

          //   throw error;
          // })
          .catch((err: unknown) => {
            clearAccessToken();
            // ⚠️ 화면 알림은 여기서 하지 않습니다.
            throw err;
          })
          .finally(() => {
            isRefreshing = false;
            refreshPromise = null;
          });
      }

      // 나머지는 refreshPromise 완료까지 대기 후 재시도
      return new Promise((resolve, reject) => {
        subscribeTokenRefresh((newToken) => {
          if (!originalReq.headers) originalReq.headers = new AxiosHeaders();
          (originalReq.headers as AxiosHeaders).set(
            "Authorization",
            `Bearer ${newToken}`
          );
          API(originalReq).then(resolve).catch(reject);
        });
      });
    }

    return Promise.reject(error);
  }
);

export default API;
