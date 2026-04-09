// src/components/modals/scorePatchInputModal.tsx
import { useState } from "react";
import { useRouter } from "next/router";
import {
  InningScoreContainer,
  InningScoreControls,
  InningScoreTitle,
  ModalButton,
  ModalCancleButton,
  ModalContainer,
  ModalOverlay,
  ModalTitleSmall,
  ScoreButton,
  ScoreDisplay,
} from "./modal.style";
import API from "../../../commons/apis/api";
import {
  LoadingIcon,
  LoadingOverlay,
} from "../../../commons/libraries/loadingOverlay";
import ErrorAlert from "../../../commons/libraries/showErrorCode";
import { errorGlobal } from "../../../commons/stores";
import { useRecoilState } from "recoil";

interface IScoreEditModalProps {
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  suffix: string;
  order: number;
  cellValue: string;
  onSuccess?: () => Promise<void>;
  isSubmitting?: boolean;
  setIsSubmitting?: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function ScorePatchInputModal({
  setIsModalOpen,
  suffix,
  order,
  cellValue,
  onSuccess,
}: // isSubmitting,
// setIsSubmitting,
IScoreEditModalProps) {
  const router = useRouter();
  const [score, setScore] = useState<number>(Number(cellValue));
  const [isSubmitting, setIsSubmitting] = useState(false);
  // const [error, setError] = useState(null);
  const [error, setError] = useRecoilState(errorGlobal);
  const handleSubmit = async () => {
    if (!score && score !== 0) {
      alert("점수가 입력되지 않았습니다.");
      return;
    }

    // 변경 여부 확인
    const originalScore = Number(cellValue);
    if (score === originalScore) {
      alert("점수가 수정되지 않았습니다.");
      return;
    }

    try {
      setIsSubmitting(true);
      const requestBody = { runs: score };
      const res = await API.patch(
        `/games/${router.query.recordId}/scores/${order}/${suffix}`,
        requestBody
        // { withCredentials: true }
      );
      console.log(res);
      if (onSuccess) {
        await onSuccess();
      }

      alert("점수가 성공적으로 수정되었습니다.");
    } catch (error) {
      console.error(error);
      // alert("점수 수정 중 오류가 발생했습니다.");
      setError(error);
    } finally {
      setIsSubmitting(false);
      setIsModalOpen(false);
    }
  };

  return (
    <ModalOverlay>
      <ModalContainer>
        <ModalTitleSmall>점수를 입력해주세요</ModalTitleSmall>
        <InningScoreContainer>
          <InningScoreControls>
            <ScoreButton onClick={() => setScore((p) => Math.max(0, p - 1))}>
              -
            </ScoreButton>
            <ScoreDisplay>{score}</ScoreDisplay>
            <ScoreButton onClick={() => setScore((p) => p + 1)}>+</ScoreButton>
          </InningScoreControls>
        </InningScoreContainer>
        <ModalButton onClick={handleSubmit} disabled={isSubmitting}>
          수정하기
        </ModalButton>
        <ModalCancleButton
          onClick={() => setIsModalOpen(false)}
          disabled={isSubmitting}
        >
          닫기
        </ModalCancleButton>
      </ModalContainer>
      <LoadingOverlay visible={isSubmitting}>
        <LoadingIcon spin fontSize={48} />
      </LoadingOverlay>
      <ErrorAlert error={error} />
    </ModalOverlay>
  );
}
