import styled from "@emotion/styled";

/** 화살표 색상을 props로 받을 타입 */
type ArrowProps = { color?: string };

const Svg = styled.svg`
  display: block; // 인라인 요소의 기본 동작 방지
  width: 0.5rem;
  height: 0.5rem;
  overflow: visible;
  /* 중앙 정렬을 위한 추가 스타일 */
  // margin: auto;
  flex-shrink: 0; // flex 컨테이너에서 크기 고정
`;

export const ArrowUp: React.FC<ArrowProps> = ({ color = "#B8B8B8" }) => (
  <Svg
    width={8}
    height={8}
    viewBox="0 0 8 8"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g filter="url(#filter0_dddd_4860_2690)">
      <path
        d="M3.56699 0.75C3.75944 0.416666 4.24056 0.416667 4.43301 0.75L7.03109 5.25C7.22354 5.58333 6.98298 6 6.59808 6L1.40192 6C1.01702 6 0.776461 5.58333 0.968911 5.25L3.56699 0.75Z"
        fill={color}
      />
    </g>
    <defs>
      <filter
        id="filter0_dddd_4860_2690"
        x="-2.09863"
        y="-0.5"
        width="12.1973"
        height="16.5"
        filterUnits="objectBoundingBox"
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
          result="effect1_dropShadow_4860_2690"
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
          in2="effect1_dropShadow_4860_2690"
          result="effect2_dropShadow_4860_2690"
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
          in2="effect2_dropShadow_4860_2690"
          result="effect3_dropShadow_4860_2690"
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
          in2="effect3_dropShadow_4860_2690"
          result="effect4_dropShadow_4860_2690"
        />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="effect4_dropShadow_4860_2690"
          result="shape"
        />
      </filter>
    </defs>
  </Svg>
);
