// pages/_app.tsx
import { Global, css } from "@emotion/react";
import { RecoilRoot } from "recoil";
import Layout from "../src/components/commons/layout";
import "../styles/globals.css";
import Head from "next/head";
import { Router, useRouter } from "next/router";
import { useEffect, useState } from "react";
import Script from "next/script"; // ✅ 추가

import TokenInitializer from "../src/commons/libraries/TokenInitializer";
import {
  LoadingIcon,
  LoadingOverlay,
} from "../src/commons/libraries/loadingOverlay";
import AuthGate from "../src/commons/hooks/authGate";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "";

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const isResultPage = router.pathname === "/result";

  /* --------- Service Worker 등록 --------- */
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      const onLoad = () =>
        navigator.serviceWorker.register("/sw.js").catch(console.error);
      window.addEventListener("load", onLoad);
      return () => window.removeEventListener("load", onLoad);
    }
  }, []);
  /* ---------------------------------------- */

  // viewport height CSS 변수 세팅
  useEffect(() => {
    function setRealVh() {
      const h = window.visualViewport
        ? window.visualViewport.height
        : window.innerHeight;
      document.documentElement.style.setProperty("--vh", `${h * 0.01}px`);
    }
    setRealVh();
    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener("resize", setRealVh);
      vv.addEventListener("scroll", setRealVh);
      return () => {
        vv.removeEventListener("resize", setRealVh);
        vv.removeEventListener("scroll", setRealVh);
      };
    } else {
      window.addEventListener("resize", setRealVh);
      return () => window.removeEventListener("resize", setRealVh);
    }
  }, []);

  const pretendardStyles = css`
    /* 폰트 선언들 생략 없이 그대로 유지 */
    @font-face {
      font-family: "Pretendard";
      src: url("/fonts/Pretendard-Thin.otf") format("opentype");
      font-weight: 100;
      font-style: normal;
      font-display: swap;
    }
    @font-face {
      font-family: "Pretendard";
      src: url("/fonts/Pretendard-ExtraLight.otf") format("opentype");
      font-weight: 200;
      font-style: normal;
      font-display: swap;
    }
    @font-face {
      font-family: "Pretendard";
      src: url("/fonts/Pretendard-Light.otf") format("opentype");
      font-weight: 300;
      font-style: normal;
      font-display: swap;
    }
    @font-face {
      font-family: "Pretendard";
      src: url("/fonts/Pretendard-Regular.otf") format("opentype");
      font-weight: 400;
      font-style: normal;
      font-display: swap;
    }
    @font-face {
      font-family: "Pretendard";
      src: url("/fonts/Pretendard-Medium.otf") format("opentype");
      font-weight: 500;
      font-style: normal;
      font-display: swap;
    }
    @font-face {
      font-family: "Pretendard";
      src: url("/fonts/Pretendard-SemiBold.otf") format("opentype");
      font-weight: 600;
      font-style: normal;
      font-display: swap;
    }
    @font-face {
      font-family: "Pretendard";
      src: url("/fonts/Pretendard-Bold.otf") format("opentype");
      font-weight: 700;
      font-style: normal;
      font-display: swap;
    }
    @font-face {
      font-family: "Pretendard";
      src: url("/fonts/Pretendard-ExtraBold.otf") format("opentype");
      font-weight: 800;
      font-style: normal;
      font-display: swap;
    }
    @font-face {
      font-family: "Pretendard";
      src: url("/fonts/Pretendard-Black.otf") format("opentype");
      font-weight: 900;
      font-style: normal;
      font-display: swap;
    }
    html,
    body,
    #__next {
      font-family: "Pretendard", sans-serif;
    }
  `;

  // 라우팅 로딩 오버레이
  const [loadingRoute, setLoadingRoute] = useState(false);
  useEffect(() => {
    const handleStart = () => setLoadingRoute(true);
    const handleComplete = () => setLoadingRoute(false);
    Router.events.on("routeChangeStart", handleStart);
    Router.events.on("routeChangeComplete", handleComplete);
    Router.events.on("routeChangeError", handleComplete);
    return () => {
      Router.events.off("routeChangeStart", handleStart);
      Router.events.off("routeChangeComplete", handleComplete);
      Router.events.off("routeChangeError", handleComplete);
    };
  }, []);

  // ✅ GA4: page_path(실제 URL) + screen_name(그룹 차원) 동시 전송
  useEffect(() => {
    const trackPageView = () => {
      const pagePath = router.asPath; // 예: /games/123?tab=box
      const routePattern = router.pathname; // 예: /games/[id]  ← 그룹 차원

      // @ts-ignore
      window.gtag?.("event", "page_view", {
        page_path: pagePath,
        page_title: document.title,
        page_location: window.location.href,
        screen_name: routePattern, // ← GA4 맞춤 차원으로 등록해서 사용
      });
    };

    // 최초 1회
    trackPageView();
    // 라우트 변경마다
    router.events.on("routeChangeComplete", trackPageView);
    return () => router.events.off("routeChangeComplete", trackPageView);
  }, [router.events, router.asPath, router.pathname]);

  return (
    <>
      {/* GA 스크립트 로드 + 자동 page_view 비활성화 */}
      {GA_ID && (
        <>
          <Script
            id="ga-src"
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_ID}', { send_page_view: false });
            `}
          </Script>
        </>
      )}

      <Head>
        <title>SNU Baseball</title>
        <meta
          name="description"
          content="서울대학교 야구 동아리 통합 플랫폼입니다. 실시간 경기 중계, 일정, 선수 정보, 랭킹을 확인하세요."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/icons/app-logo-round.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        {/* Open Graph */}
        <meta property="og:title" content="SNU baseball" />
        <meta
          property="og:description"
          content="서울대학교 야구 동아리 통합 플랫폼입니다. 실시간 경기 중계, 일정, 선수 정보, 랭킹을 확인하세요."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://snubaseball.site/" />
        <meta
          property="og:image"
          content="https://snubaseball.site/images/og-logo.png"
        />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
      </Head>

      <Global styles={pretendardStyles} />
      <RecoilRoot>
        <TokenInitializer />

        <LoadingOverlay visible={loadingRoute}>
          <LoadingIcon spin fontSize={48} />
        </LoadingOverlay>

        <Layout>
          <Component {...pageProps} />
        </Layout>
      </RecoilRoot>
    </>
  );
}

export default MyApp;
