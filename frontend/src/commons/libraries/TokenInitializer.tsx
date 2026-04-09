import { useEffect } from "react";
import { useRouter } from "next/router";
import API from "../apis/api";
import { useSetRecoilState } from "recoil";
import { accessTokenState, authCheckedState } from "../stores";
import {
  registerAccessTokenSetter,
  setAccessToken,
  clearAccessToken,
} from "../libraries/token";

export default function TokenInitializer() {
  const setToken = useSetRecoilState(accessTokenState);

  // setChecked는 인증 상태(액세스 토큰 유무/리프레시) 확인이 끝났다” 라는 플래그를 앱 전역에 알려주는 역할을 합니다.
  const setChecked = useSetRecoilState(authCheckedState);
  const router = useRouter();
  // console.log("분기 합침 테스트");

  // ① RecoilRoot 안에서만 registerAccessTokenSetter를 호출
  useEffect(() => {
    registerAccessTokenSetter(setToken);
    return () => {
      // 언마운트 시 클리어(선택)
      clearAccessToken();
    };
  }, [setToken]);

  // ② "새로고침"일 때만 refresh 요청
  // ② 새로고침일 때만 refresh
  useEffect(() => {
    if (typeof window === "undefined") return;

    // 인증이 필요하지 않은 페이지들에서는 토큰 갱신을 시도하지 않음
    const authNotRequiredPaths = ["/login/findPassword/resetPassword"];

    const currentPath = router.pathname;
    if (authNotRequiredPaths.some((path) => currentPath.startsWith(path))) {
      setChecked(true);
      return;
    }

    const navEntry = performance.getEntriesByType("navigation")[0] as
      | PerformanceNavigationTiming
      | undefined;
    const isReload =
      navEntry?.type === "reload" ||
      (performance as any)?.navigation?.type === 1;

    // if (!isReload) {
    //   // 새로고침이 아니면 그냥 체크 완료 표시만
    //   setChecked(true);
    //   return;
    // }

    API.post("/auth/refresh")
      .then((res) => {
        setAccessToken(res.data.accessToken);
        console.log("리프레시 성공");
      })
      .catch(() => {
        console.log("리프레시 실패");
        router.push("/login");
        // 여기서 바로 router.push("/login")는 UX에 따라 선택
        // 실패했다고 해서 매번 login으로 강제 이동할 필요가 없으면 주석 유지
      })
      .finally(() => {
        setChecked(true); // 무조건 초기화 완료
      });
  }, [setChecked]);

  return null;
}
