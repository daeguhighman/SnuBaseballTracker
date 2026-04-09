import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="ko">
      {/* <Head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />

        <link rel="preload" as="image" href="/images/ground-without-home.png" />
        <link rel="preload" as="image" href="/images/home.png" />
        <link rel="preload" as="image" href="/images/line.png" />
        <link
          rel="preload"
          as="image"
          href="/images/home-base-white-1.png"
          crossOrigin="anonymous"
        />
        <link rel="preload" as="image" href="/images/diamond.png" />
        <link rel="preload" as="image" href="/images/reset.png" />
      </Head> */}
      <Head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        {/* ✅ GA 네트워크 최적화 */}
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link
          rel="preconnect"
          href="https://www.google-analytics.com"
          crossOrigin=""
        />
        <link
          rel="prefetch"
          as="image"
          href="/images/ground-without-home.png"
        />
        <link rel="prefetch" as="image" href="/images/home.png" />
        <link rel="prefetch" as="image" href="/images/line.png" />
        <link
          rel="prefetch"
          as="image"
          href="/images/home-base-white-1.png"
          crossOrigin="anonymous"
        />
        <link rel="prefetch" as="image" href="/images/diamond.png" />
        <link rel="prefetch" as="image" href="/images/reset.png" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
