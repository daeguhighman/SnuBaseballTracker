import styled from "@emotion/styled";
import { ModalButton, ModalContainer } from "./modal.style";

/** 입력칸이 많은 관리자 모달: 화면보다 길어지면 안에서 스크롤 */
export const FormModalContainer = styled(ModalContainer)`
  max-height: 85vh;
  overflow-y: auto;
  box-sizing: border-box;
`;

export const FormFields = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 80%;
  margin-bottom: 20px;
  text-align: left;
`;

export const Field = styled.label`
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: #616161;

  input,
  select {
    width: 100%;
    box-sizing: border-box;
    height: 44px;
    padding: 0 8px;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    background: #fff;
    color: #000;
    font-size: 14px;
    font-family: inherit;
  }
`;

export const CheckRow = styled.div`
  display: flex;
  gap: 20px;
  font-size: 14px;

  label {
    display: flex;
    align-items: center;
    gap: 6px;
  }
`;

export const SubmitButton = styled(ModalButton)`
  margin-bottom: 12px;

  &:disabled {
    opacity: 0.5;
    cursor: default;
  }
`;

export const ResultList = styled.ul`
  width: 80%;
  margin: 0 0 16px;
  padding: 0;
  list-style: none;
  text-align: left;
`;

export const ResultItem = styled.li`
  button {
    width: 100%;
    padding: 12px 8px;
    border: none;
    border-bottom: 1px solid #eeeeee;
    background: none;
    text-align: left;
    font-family: inherit;
    cursor: pointer;
  }

  button:disabled {
    cursor: default;
    opacity: 0.5;
  }

  strong {
    display: block;
    font-size: 15px;
    font-weight: 400;
    color: #000;
  }

  span {
    font-size: 12px;
    color: #757575;
  }

  span + span {
    display: block;
  }
`;

export const Hint = styled.p`
  width: 80%;
  margin: -8px 0 16px;
  font-size: 12px;
  color: #757575;
  white-space: pre-line;
`;
