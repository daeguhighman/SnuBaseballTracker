import Head from "next/head";
import EndPage from "../src/components/commons/units/endPage/endPage.container";
import MainCalendarPage from "../src/components/commons/units/mainCalendar.container";

export default function Home() {
  console.log("버전관리테스트 feature브랜치");
  console.log("버전관리테스트 feature브랜치1");
  return (
    <>
      <div>
        <MainCalendarPage />

        {/* <EndPage /> */}
      </div>
    </>
  );
}
