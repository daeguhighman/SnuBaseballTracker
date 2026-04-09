// 날짜 바꿀때는 밖에서 함수를 따로 만들어서 해준다
// dateString라는 매개변수를 통해서 presenter의 el.createAt을 받아온거임

import moment from "moment";
import "moment/locale/ko";

export const formatDate = (dateString: any) => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  // getMonth만 0부터 시작한다
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// export const formatDate2 = (dateString: any) => {
//   const date = new Date(dateString);
//   const year = date.getFullYear();
//   const month = String(date.getMonth() + 1).padStart(2, "0");
//   const day = String(date.getDate()).padStart(2, "0");
//   const daysOfWeek = ["일", "월", "화", "수", "목", "금", "토"];
//   const dayOfWeek = daysOfWeek[date.getDay()];
//   return `${year}. ${month}. ${day} (${dayOfWeek})`;
// };

// // commons/libraries/utils.ts
// export const formatDateToYMD = (date: Date): string => {
//   return date.toISOString().split("T")[0];
// };

// 애플리케이션 구동 시 단 한 번만 기본 타임존을 KST로 고정
moment.tz.setDefault("Asia/Seoul");
moment.locale("ko");

/** YYYY‑MM‑DD 포맷 (KST) */
export const formatDateToYMD = (date: Date | string) =>
  moment(date).format("YYYY-MM-DD");

/** YYYY‑MM‑DD(요일) 포맷 등 원하는 다른 포맷도 동일하게… */
export const formatDate2 = (date: Date | string) =>
  moment(date).format("YYYY. MM. DD (ddd)");

/** HH:mm */
export const formatHM = (date: Date | string) => moment(date).format("HH:mm");
