import styled from "@emotion/styled";
import { Global, css } from "@emotion/react";

// Global styles and design tokens
const GlobalStyles = () => (
  <Global
    styles={css`
      /* ───── 색상 토큰 ───── */
      :root {
        --fg: #000000;
        --bg: #ffffff;
        --accent: #e63946;
      }

      /* ───── 전역 리셋 ───── */
      *,
      *::before,
      *::after {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }

      html,
      body {
        width: 100%;
        height: 100%;
      }

      body {
        background: var(--bg);
        color: var(--fg);
        font-family: "KBO Dia Gothic", sans-serif;
        text-align: center;
        line-height: 1.5;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
      }
    `}
  />
);

// Container for the end page content
const EndWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 2rem;
`;

// Paragraph text
const Message = styled.p`
  opacity: 0.8;
  margin-bottom: 1.5rem;
`;

// Optional action button
const ActionButton = styled.button`
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  background: var(--accent);
  color: #fff;

  &:active {
    transform: scale(0.97);
  }
`;

export default function EndPage() {
  return (
    <>
      <GlobalStyles />
      <EndWrapper>
        <Message>2025 스누나래 야구대회가 종료되었습니다</Message>
        <Message>다음 대회에서 만나요!</Message>
      </EndWrapper>
    </>
  );
}
