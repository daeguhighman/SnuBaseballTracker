import Icon from "@ant-design/icons";
import type { CustomIconComponentProps } from "@ant-design/icons/lib/components/Icon";

// 1. 뼈대 SVG 컴포넌트 정의
const RoundCloseSvg: React.FC = () => (
  <svg
    viewBox="0 0 1024 1024"
    width="1em"
    height="1em"
    fill="none"
    stroke="currentColor"
    strokeWidth={64}
    strokeLinecap="round" /* 끝단 둥글게 */
    strokeLinejoin="round" /* 교차점 둥글게 */
  >
    <line x1="256" y1="256" x2="768" y2="768" />
    <line x1="768" y1="256" x2="256" y2="768" />
  </svg>
);

// 2. Icon 컴포넌트 래핑
export const RoundCloseOutlined = (props: CustomIconComponentProps) => (
  <Icon component={RoundCloseSvg} {...props} />
);
