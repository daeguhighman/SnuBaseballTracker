import styled from "@emotion/styled";

export const PageWrapper = styled.div`
  max-width: 480px;
  margin: 120px auto 0; /* 헤더 높이와 동일 */
  padding: 8px 16px 15vh;
  min-height: calc(100vh - 120px);
  box-sizing: border-box;
  background: #ffffff;
  font-family: "KBO-Dia-Gothic_medium";
`;

export const Notice = styled.p`
  margin-top: 20vh;
  text-align: center;
  color: #757575;
`;

export const Tabs = styled.div`
  display: flex;
  border-bottom: 1px solid #e8e8e8;
  margin-bottom: 16px;
`;

export const Tab = styled.button<{ active: boolean; disabled?: boolean }>`
  flex: 1;
  padding: 12px 0;
  background: none;
  border: none;
  border-bottom: 2px solid
    ${({ active }) => (active ? "#0f0f70" : "transparent")};
  color: ${({ active, disabled }) =>
    disabled ? "#bdbdbd" : active ? "#0f0f70" : "#757575"};
  font-family: inherit;
  font-size: 15px;
  cursor: ${({ disabled }) => (disabled ? "default" : "pointer")};
`;

export const DateNav = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;

  button {
    background: none;
    border: none;
    font-size: 20px;
    padding: 4px 12px;
    cursor: pointer;
  }

  input {
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 8px;
    font-size: 15px;
    font-family: inherit;
  }
`;

export const Hint = styled.p`
  margin: 0 0 8px;
  color: #9e9e9e;
  font-size: 12px;
  text-align: center;
`;

export const GameRow = styled.button<{ disabled?: boolean }>`
  display: flex;
  align-items: center;
  width: 100%;
  gap: 12px;
  padding: 14px 4px;
  background: none;
  border: none;
  border-bottom: 1px solid #e8e8e8;
  font-family: inherit;
  text-align: left;
  color: ${({ disabled }) => (disabled ? "#9e9e9e" : "#000")};
  cursor: ${({ disabled }) => (disabled ? "default" : "pointer")};
`;

export const GameTime = styled.span`
  width: 44px;
  font-size: 14px;
`;

export const GameTeams = styled.span`
  flex: 1;
  font-size: 15px;
`;

export const StatusBadge = styled.span<{ status: string }>`
  min-width: 56px;
  padding: 3px 8px;
  border-radius: 12px;
  text-align: center;
  font-size: 12px;
  color: #fff;
  background-color: ${({ status }) =>
    status === "SCHEDULED"
      ? "#F3A231"
      : status === "IN_PROGRESS"
      ? "#37DC21"
      : status === "CANCELLED"
      ? "#9E9E9E"
      : "#000000"};
`;

export const Chevron = styled.span`
  width: 12px;
  color: #bdbdbd;
`;

export const Empty = styled.p`
  margin-top: 40px;
  text-align: center;
  color: #9e9e9e;
`;
