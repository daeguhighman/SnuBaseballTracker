// src/components/modals/etcModal.tsx
import { useRouter } from "next/router";
import API from "../../../../commons/apis/api";
import {
  ModalButton,
  ModalContainer,
  ModalOverlay,
  ModalTitle,
} from "./../modal.style";
import { useEffect, useState } from "react";
import {
  LoadingIcon,
  LoadingOverlay,
} from "../../../../commons/libraries/loadingOverlay";
import ErrorAlert from "../../../../commons/libraries/showErrorCode";

interface IModalProps {
  setIsEtcModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  playerId: number;
  onSuccess?: () => Promise<void>;
  onTypeSelect?: () => void;
}

const mapping: Record<string, string> = {
  낫아웃: "SO_DROP",
  야수선택: "FC",
  인터페어: "IF",
};
// const [error, setError] = useState(null);

export default function EtcModal(props: IModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  // const [validationError, setValidationError] = useState<string | null>(null);
  const router = useRouter();

  const handleTypeSelect = async (Type: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const resultCode = mapping[Type];
      if (!resultCode) {
        console.warn("알 수 없는 종류입니다:", Type);
      } else {
        const payload = { resultCode };
        try {
          localStorage.setItem(
            "plateAppearanceResult",
            JSON.stringify(payload)
          );
        } catch (e) {
          console.warn("로컬스토리지 저장 실패:", e);
        }
      }
      // const endpoint = `/games/${router.query.recordId}/plate-appearance`;
      // const requestBody = { result: mapping[Type] };
      // const { data } = await API.post(endpoint, requestBody);

      // console.log(endpoint, requestBody, data);

      // 부모가 넘겨준 onSuccess 콜백 실행
      if (props.onSuccess) {
        await props.onSuccess();
      }
      // alert(`기록 전송 완료\n${Type}`);
      // 모달 닫기
      // props.setIsEtcModalOpen(false);
    } catch (error) {
      console.error("etc 기록 전송 오류:", error);
      // setError(error);
      // alert("etc 기록 전송 오류");
    } finally {
      // ① 로딩 해제
      setIsSubmitting(false);
      // ② 모달 닫기
      props.setIsEtcModalOpen(false);
      props.onTypeSelect?.();
    }
  };

  return (
    <ModalOverlay onClick={() => props.setIsEtcModalOpen(false)}>
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        <ModalTitle>종류를 선택해주세요</ModalTitle>

        <ModalButton
          onClick={() => handleTypeSelect("낫아웃")}
          disabled={isSubmitting}
        >
          낫아웃
        </ModalButton>
        <ModalButton
          onClick={() => handleTypeSelect("야수선택")}
          disabled={isSubmitting}
        >
          야수선택
        </ModalButton>

        <ModalButton
          onClick={() => handleTypeSelect("인터페어")}
          disabled={isSubmitting}
        >
          인터페어
        </ModalButton>
      </ModalContainer>

      <LoadingOverlay visible={isSubmitting}>
        <LoadingIcon spin fontSize={48} />
      </LoadingOverlay>
      {/* <ErrorAlert error={error} /> */}
    </ModalOverlay>
  );
}
