import styled from "@emotion/styled";
import { useState } from "react";
import {
  LoadingIcon,
  LoadingOverlay,
} from "../../../commons/libraries/loadingOverlay";
import {
  ModalButton,
  ModalCancleButton,
  ModalContainer,
  ModalOverlay,
  ModalTitleSmall,
} from "./modal.style";

const Stepper = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 28px;

  button {
    width: 48px;
    height: 48px;
    border: 1px solid #e0e0e0;
    border-radius: 50%;
    background: #fff;
    font-size: 24px;
    cursor: pointer;
  }

  span {
    min-width: 48px;
    font-size: 32px;
    text-align: center;
  }
`;

const Notice = styled.p`
  margin: -12px 0 20px;
  font-size: 12px;
  color: #757575;
  white-space: pre-line;
`;

interface IProps {
  /** 예: "로스쿨 3회초 점수" */
  title: string;
  initialValue: number;
  notice?: string;
  onSave: (value: number) => Promise<void>;
  onClose: () => void;
}

/** 결과 화면에서 이닝 점수·팀 안타 수를 정정하는 숫자 입력 모달 */
export default function ScoreCorrectionModal({
  title,
  initialValue,
  notice,
  onSave,
  onClose,
}: IProps) {
  const [value, setValue] = useState(initialValue);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const save = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSave(value);
    } catch (err: any) {
      alert(
        err?.response?.data?.message ?? "정정하지 못했습니다. 다시 시도해 주세요."
      );
      setIsSubmitting(false);
    }
  };

  return (
    <ModalOverlay>
      <ModalContainer>
        <ModalTitleSmall>{title}</ModalTitleSmall>
        {notice && <Notice>{notice}</Notice>}
        <Stepper>
          <button
            aria-label="1 빼기"
            onClick={() => setValue((v) => Math.max(0, v - 1))}
          >
            −
          </button>
          <span>{value}</span>
          <button aria-label="1 더하기" onClick={() => setValue((v) => v + 1)}>
            +
          </button>
        </Stepper>
        <ModalButton
          onClick={save}
          disabled={isSubmitting || value === initialValue}
        >
          {isSubmitting ? "저장 중…" : "정정하기"}
        </ModalButton>
        <ModalCancleButton onClick={onClose}>취소</ModalCancleButton>
      </ModalContainer>
      <LoadingOverlay visible={isSubmitting}>
        <LoadingIcon spin fontSize={48} />
      </LoadingOverlay>
    </ModalOverlay>
  );
}
