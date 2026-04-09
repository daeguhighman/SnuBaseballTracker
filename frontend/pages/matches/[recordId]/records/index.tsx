import Head from "next/head";
import GameRecordPageV2 from "../../../../src/components/commons/units/gameRecord-v2/gameRecord-v2.container";

export default function Record() {
  return (
    <>
      <Head>
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
      </Head>
      <div>
        <GameRecordPageV2 />
      </div>
    </>
  );
}
