import { useRouter } from "next/router";
import LayoutHeader from "./header";
import LayoutNavigation from "./navigation";
import LayoutHeaderNone from "./headerNone";
import styled from "@emotion/styled";
// 여기서만 보여주게 하자
const SHOW_NAV = [
  "/playerStats",
  "/ranking",
  "/",
  "/mainCalendar",
  // "/login",
  // "/login/findPassword",
  // "/signUp",
  "/playerStats/playerStatsBatterDetail",
  "/playerStats/playerStatsPitcherDetail",
  "/refreeRegistration",
  "/mypage",
  "/login/findPassword/resetPassword",
  "/matches/[recordId]/view",
];

const HIDE_HEADER = [
  // "/",
  "/matches/[recordId]/records",
  "/matches/[recordId]/view",
  "/matches/[recordId]/result",
  "/login",
  "/signUp",
  "/login/findPassword",
  "/login/findPassword/resetPassword",
  // "/mypage",
  "/changePassword",
];

interface ILayoutProps {
  children: JSX.Element;
}

// 화면 전체를 감싸는 컨테이너
// const Container = styled.div`
//   /* width: 100%; */
//   max-width: 480px; /* 원하시는 모바일 최대 너비(px 단위) */
//   margin: 0 auto; /* 큰 화면일 때 중앙 정렬 */
//   box-sizing: border-box;
//   padding: 0 16px; /* 양쪽에 약간 여백을 줄 수도 있습니다 */
// `;

export default function Layout(props: ILayoutProps): JSX.Element {
  const router = useRouter();
  const { pathname } = useRouter();

  console.log(router.asPath);

  const isShowNav = SHOW_NAV.includes(router.pathname);
  const isHideHead =
    HIDE_HEADER.includes(pathname) || pathname.includes("/records");

  return (
    <>
      {!isHideHead && <LayoutHeader />}
      <div style={{ backgroundColor: "white" }}>{props.children}</div>
      {isShowNav && <LayoutNavigation />}
    </>
  );
}
// _app.tsx에서 <Component/>가 {props.children}으로 쏙들어오고 LayOut컴포넌트 전체를 땡겨온다(_app.tsx쪽으로)
