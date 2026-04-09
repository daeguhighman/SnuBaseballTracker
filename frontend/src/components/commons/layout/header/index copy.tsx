// import styled from "@emotion/styled";
// import Link from "next/link";

// // ─── 헤더 영역 (배경 + 날짜 영역 포함) ─────────────────────────────
// export const Background = styled.div`
//   width: 100%;
//   background-color: #ffffff;
//   position: fixed;

//   border-bottom: 1px solid black;
//   top: 0;
//   left: 0;
//   z-index: 1000;
//   height: 120px; /* 고정 높이 */
//   display: flex;
//   flex-direction: row;
//   justify-content: center;
//   align-items: center;
//   box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.3); /* drop shadow 효과 */
// `;

// export const PageHeader = styled.div`
//   /* margin-top: 20px; */
//   text-align: center;
//   display: flex;
//   flex-direction: row;
//   align-items: center;
//   justify-content: center;
//   /* background-color: red; */
//   /*
//   padding-top: 30px; */

//   /* 480px 이하 */
//   @media only screen and (max-width: 480px) {
//     /* padding-top: 30px; */
//   }
//   /* 481px ~ 768px */
//   @media only screen and (min-width: 481px) and (max-width: 768px) {
//     /* padding-top: 35px; */
//   }
//   /* 769px ~ 1024px */
//   @media only screen and (min-width: 769px) and (max-width: 1024px) {
//     /* padding-top: 40px; */
//   }
//   /* 1025px 이상 */
//   @media only screen and (min-width: 1025px) {
//     /* padding-top: 45px; */
//   }
// `;

// export const SideBar = styled.div`
//   width: 1.5rem;
//   height: 1.5rem;
//   margin-left: 2rem;

//   /* 아이콘 정중앙 배치 */
//   display: flex;
//   align-items: center;
//   justify-content: center;

//   /* background-color: #000; */
// `;
// export const SideBarNone = styled.div`
//   width: 1.5rem;
//   height: 1.5rem;
//   /* background-color: red; */
//   margin-right: 2rem;
//   visibility: hidden;
//   pointer-events: none;
// `;

// export const PageTitle = styled.h1`
//   font-weight: 600;
//   color: #0f0f70;
//   font-size: 35px;
//   font-family: "KBO-Dia-Gothic_bold";

//   /* 480px 이하 */
//   @media only screen and (max-width: 480px) {
//     font-size: 24px;
//   }
//   /* 481px ~ 768px */
//   @media only screen and (min-width: 481px) and (max-width: 768px) {
//     font-size: 28px;
//   }
//   /* 769px ~ 1024px */
//   @media only screen and (min-width: 769px) and (max-width: 1024px) {
//     font-size: 32px;
//   }
//   /* 1025px 이상 */
//   @media only screen and (min-width: 1025px) {
//     font-size: 36px;
//   }
// `;

// export default function LayoutHeader() {
//   return (
//     <Background>
//       <PageHeader>
//         {/* <SideBarNone /> */}
//         <Link href="/" passHref>
//           <PageTitle as="a">SNU BASEBALL</PageTitle>
//         </Link>
//         {/* <SideBar></SideBar> */}
//       </PageHeader>
//     </Background>
//   );
// }
