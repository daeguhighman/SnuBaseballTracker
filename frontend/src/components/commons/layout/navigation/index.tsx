import { Global, css } from "@emotion/react";
import styled from "@emotion/styled";
import Link from "next/link";
import { useEffect } from "react";
import { getAccessToken } from "../../../../commons/libraries/token";
import { useRouter } from "next/router";
import { useRecoilValue } from "recoil";
import { accessTokenState, authCheckedState } from "../../../../commons/stores";

// Global 스타일로 @font-face 정의 및 적용 클래스 생성
const navGlobalStyles = css`
  @font-face {
    font-family: "KBO Dia Gothic Light";
    src: url("/fonts/KBO-Dia-Gothic_light.woff") format("woff");
    font-weight: 300;
    font-style: normal;
  }
  .kbo-font {
    font-family: "KBO Dia Gothic Light", sans-serif !important;
  }
`;

// ─── 하단 네비게이션 ─────────────────────────────
export const BottomNavWrapper = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  display: flex;
  flex-direction: row;
  margin-top: 0;
  z-index: 1000;

  @media only screen and (max-width: 480px) {
    /* Small: 480px 이하 */
  }
  @media only screen and (min-width: 481px) and (max-width: 768px) {
    /* Medium: 481px ~ 768px */
  }
  @media only screen and (min-width: 769px) and (max-width: 1024px) {
    /* Large: 769px ~ 1024px */
  }
  @media only screen and (min-width: 1025px) {
    /* Extra Large: 1025px 이상 */
  }
`;

export const BottomNav = styled.div`
  background: #0f0f70;
  display: flex;
  color: #ffffff;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  box-sizing: border-box;
  height: 10vh;
  width: 33%;
  border: none;
`;

export const NavIcon = styled.img`
  width: 24px;
  height: 24px;
  font-family: "Pretendard";
  font-weight: 400;
  /* 검정색을 흰색으로 변경하는 필터 */
  filter: brightness(0) invert(1);
`;

export const NavItem = styled.div`
  margin-top: 10px;
  font-weight: 300;
  color: #ffffff;
  text-align: center;
  font-size: 1.25rem;
`;

export default function LayoutNavigation() {
  const router = useRouter();

  useEffect(() => {
    const token = getAccessToken();
    console.log("현재 inMemoryAccessToken:", token);
  }, []);
  const token = useRecoilValue(accessTokenState);
  const checked = useRecoilValue(authCheckedState);
  const targetHref = "/mypage";
  // const handleSettingsClick = () => {
  //   if (!checked) return; // 아직 토큰 체크 안끝났으면 클릭 무시 또는 로딩
  //   router.push(token ? "/mypage" : "/login");
  // };

  return (
    <>
      <Global styles={navGlobalStyles} />
      {/* 최상위 요소에 kbo-font 클래스를 적용하여 이 컴포넌트 내 폰트를 지정 */}
      <div>
        <BottomNavWrapper>
          <Link href="/mainCalendar" passHref>
            <BottomNav as="a">
              <NavIcon src="/images/calendar-new.png" />
              <NavItem>일정</NavItem>
            </BottomNav>
          </Link>
          <Link href="/ranking" passHref>
            <BottomNav as="a">
              <NavIcon src="/images/trophy.png" />
              <NavItem>대진</NavItem>
            </BottomNav>
          </Link>
          <Link href="/playerStats" passHref>
            <BottomNav as="a">
              <NavIcon src="/images/stat.png" />
              <NavItem>기록</NavItem>
            </BottomNav>
          </Link>
          <Link href="mypage" passHref>
            <BottomNav as="a">
              <NavIcon src="/images/profile.png" />
              <NavItem>설정</NavItem>
            </BottomNav>
          </Link>
        </BottomNavWrapper>
      </div>
    </>
  );
}
