// components/UndoPolygon.tsx
import React from "react";
import styled from "@emotion/styled";

const Svg = styled.svg`
  /* 모든 요소에 box‑sizing 적용 */
  &,
  & * {
    box-sizing: border-box;
  }

  border-radius: 0;
  width: 1.4rem;
  height: 1.4rem;
`;

const LeftPolygon: React.FC = () => (
  <Svg viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g filter="url(#filter0_dddd_4904_227)">
      <path
        d="M1.5 11.866C0.833335 11.4811 0.833333 10.5189 1.5 10.134L15 2.33975C15.6667 1.95485 16.5 2.43597 16.5 3.20577V18.7942C16.5 19.564 15.6667 20.0452 15 19.6603L1.5 11.866Z"
        fill="#101070"
      />
    </g>
    <defs>
      <filter
        id="filter0_dddd_4904_227"
        x="-2"
        y="1.20508"
        width="21.5"
        height="28.5898"
        filterUnits="userSpaceOnUse"
        colorInterpolationFilters="sRGB"
      >
        <feFlood floodOpacity="0" result="BackgroundImageFix" />
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feOffset />
        <feGaussianBlur stdDeviation="0.5" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.05 0"
        />
        <feBlend
          mode="normal"
          in2="BackgroundImageFix"
          result="effect1_dropShadow_4904_227"
        />
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feOffset dy="2" />
        <feGaussianBlur stdDeviation="1" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.04 0"
        />
        <feBlend
          mode="normal"
          in2="effect1_dropShadow_4904_227"
          result="effect2_dropShadow_4904_227"
        />
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feOffset dy="4" />
        <feGaussianBlur stdDeviation="1.5" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.03 0"
        />
        <feBlend
          mode="normal"
          in2="effect2_dropShadow_4904_227"
          result="effect3_dropShadow_4904_227"
        />
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feOffset dy="7" />
        <feGaussianBlur stdDeviation="1.5" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.01 0"
        />
        <feBlend
          mode="normal"
          in2="effect3_dropShadow_4904_227"
          result="effect4_dropShadow_4904_227"
        />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="effect4_dropShadow_4904_227"
          result="shape"
        />
      </filter>
    </defs>
  </Svg>
);

export default LeftPolygon;
