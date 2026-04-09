// src/components/modals/scorePatchInputModal.tsx
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  InningScoreContainer,
  ModalButton,
  ModalCancleButton,
  ModalContainer,
  ModalOverlay,
  ModalTitleSmall,
  NickNamePatchInput,
  StatPatchInput,
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
  cellValue: string;
  onSuccess?: () => Promise<void>;
}

export default function NickNamePutInputModal({
  setIsModalOpen,
  cellValue,
  onSuccess,
}: IScoreEditModalProps) {
  // ① 입력 폼 모달을 제어할 로컬 상태
  const [showFormModal, setShowFormModal] = useState(true);

  const router = useRouter();
  // 1) alert 가로채기 로직

  const [validationError, setValidationError] = useState<string | null>(null);
  useEffect(() => {
    const original = window.alert;
    window.alert = (msg: string) => setValidationError(msg);
    return () => {
      window.alert = original;
    };
  }, []);

  // ① 초기값을 빈 문자열로
  const [nickname, setNickname] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useRecoilState(errorGlobal);

  const handleSubmit = async () => {
    if (!nickname.trim()) {
      alert("닉네임을 입력해주세요.");
      return;
    }
    if (nickname === cellValue) {
      alert("기존 닉네임과 같습니다.");
      return;
    }

    try {
      setIsSubmitting(true);
      await API.put(`/profile/me`, { nickname });
      // → 이 alert가 validationError에 담깁니다
      alert("닉네임이 성공적으로 수정되었습니다.");
      if (onSuccess) await onSuccess();

      // ③ 입력 폼 모달만 먼저 닫고
      setShowFormModal(false);
      // 부모의 setIsModalOpen(false)는 알림 모달 닫을 때 실행
    } catch (err) {
      setError(err);
      alert("수정 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <ModalOverlay>
        <ModalContainer>
          <ModalTitleSmall>새 닉네임을 입력하세요</ModalTitleSmall>
          <InningScoreContainer>
            <NickNamePatchInput
              type="text"
              value={nickname}
              // ② 기존 닉네임을 placeholder 로
              placeholder={cellValue}
              onChange={(e) => setNickname(e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                fontSize: "1rem",
              }}
            />
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
      {/* 2) validationError 가 있으면 alert 메시지를 모달로 보여주기 */}
      {/* 2) 알림(성공/실패) 모달 */}
      {validationError && !showFormModal && (
        <ModalOverlay>
          <ModalContainer>
            <ModalTitleSmall>{validationError}</ModalTitleSmall>
            <ModalButton
              onClick={() => {
                // 알림 모달 닫고, 부모 모달도 닫기
                setValidationError(null);
                setIsModalOpen(false);
              }}
            >
              확인
            </ModalButton>
          </ModalContainer>
        </ModalOverlay>
      )}
    </>
  );
}
