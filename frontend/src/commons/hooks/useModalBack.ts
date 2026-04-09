import { useEffect } from "react";

export function useModalBack(close: () => void) {
  useEffect(() => {
    // 모달 열릴 때 스택에 한 단계 추가
    window.history.pushState({ modal: true }, "");

    const onPopState = () => {
      close();
    };
    window.addEventListener("popstate", onPopState);

    return () => {
      window.removeEventListener("popstate", onPopState);
      // cleanup 시점에 남은 modal 스택이 있으면 다시 뒤로가기 해서 스택 정리
      if (window.history.state && (window.history.state as any).modal) {
        window.history.back();
      }
    };
  }, [close]);
}
