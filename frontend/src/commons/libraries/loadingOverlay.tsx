import { LoadingOutlined } from "@ant-design/icons";
import styled from "@emotion/styled";

export const LoadingOverlay = styled.div<{ visible?: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.6);
  display: ${({ visible }) => (visible ? "flex" : "none")};
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

export const LoadingOverlayNoOpacity = styled.div<{ visible?: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255);
  display: ${({ visible }) => (visible ? "flex" : "none")};
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

// 로딩 아이콘
export const LoadingIcon = styled(LoadingOutlined)<{
  fontSize?: number;
  iconColor?: string;
}>`
  font-size: ${({ fontSize = 40 }) => fontSize}px;
  color: ${({ iconColor = "black" }) => iconColor};
`;
