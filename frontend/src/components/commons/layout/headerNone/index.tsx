import styled from "@emotion/styled";
import Link from "next/link";

// ─── 헤더 영역 (배경 + 날짜 영역 포함) ─────────────────────────────
export const Background = styled.div`
  width: 100%;
  background-color: none;
  position: fixed;

  top: 0;
  left: 0;
  z-index: 1000;
  height: 120px; /* 고정 높이 */
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
`;

export const PageHeader = styled.div`
  text-align: center;
  /* 
  padding-top: 30px; */

  /* 480px 이하 */
  @media only screen and (max-width: 480px) {
    /* padding-top: 30px; */
  }
  /* 481px ~ 768px */
  @media only screen and (min-width: 481px) and (max-width: 768px) {
    /* padding-top: 35px; */
  }
  /* 769px ~ 1024px */
  @media only screen and (min-width: 769px) and (max-width: 1024px) {
    /* padding-top: 40px; */
  }
  /* 1025px 이상 */
  @media only screen and (min-width: 1025px) {
    /* padding-top: 45px; */
  }
`;

export const PageTitle = styled.h1`
  font-weight: 600;
  color: #ffffff;
  margin: 0;
  font-size: 30px;

  /* 480px 이하 */
  @media only screen and (max-width: 480px) {
    font-size: 24px;
  }
  /* 481px ~ 768px */
  @media only screen and (min-width: 481px) and (max-width: 768px) {
    font-size: 28px;
  }
  /* 769px ~ 1024px */
  @media only screen and (min-width: 769px) and (max-width: 1024px) {
    font-size: 32px;
  }
  /* 1025px 이상 */
  @media only screen and (min-width: 1025px) {
    font-size: 36px;
  }
`;

// // ─── 최종 버튼 (예: 심판등록) ─────────────────────────────
// // Background 내부에서 절대 위치를 사용하여 우하단에 고정
// export const ButtonWrapper = styled.div`
//   position: absolute;
//   bottom: 10px;
//   right: 30px; /* 기존 10px에서 30px로 수정하여 왼쪽으로 이동 */
// `;

// export const FinalButton = styled.button`
//   background: #bdbdbd;
//   border: none;
//   text-align: center;
//   border-radius: 4px;
//   padding: 8px 16px;
//   font-family: "Inter-Regular", sans-serif;
//   font-size: 12px;
//   cursor: pointer;

//   /* 480px 이하 */
//   @media only screen and (max-width: 480px) {
//     padding: 6px 12px;
//     font-size: 10px;
//   }
//   /* 481px ~ 768px */
//   @media only screen and (min-width: 481px) and (max-width: 768px) {
//     padding: 7px 14px;
//     font-size: 11px;
//   }
//   /* 769px ~ 1024px */
//   @media only screen and (min-width: 769px) and (max-width: 1024px) {
//     padding: 8px 16px;
//     font-size: 12px;
//   }
//   /* 1025px 이상 */
//   @media only screen and (min-width: 1025px) {
//     padding: 9px 18px;
//     font-size: 13px;
//   }
// `;

export default function LayoutHeaderNone() {
  return (
    <Background>
      <PageHeader>
        <PageTitle></PageTitle>
      </PageHeader>
    </Background>
  );
}
