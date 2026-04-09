// src/commons/apis/api2.ts
import axios from "axios";

// 1) API2 인스턴스 생성
const API2 = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// 2) Request 인터셉터 설정: GET /auth/me 요청만 withCredentials=false
API2.interceptors.request.use(
  (config) => {
    const method = config.method?.toLowerCase();
    const url = config.url ?? "";

    if (method === "get" && url.includes("/auth/me")) {
      config.withCredentials = true;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default API2;
