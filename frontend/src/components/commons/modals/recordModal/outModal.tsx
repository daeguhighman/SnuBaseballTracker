import { useRouter } from "next/router";
import API from "../../../../commons/apis/api";
import {
  ModalButton,
  ModalContainer,
  ModalOverlay,
  ModalTitle,
} from "../modal.style";
import { useState } from "react";
import { useModalBack } from "../../../../commons/hooks/useModalBack";
import {
  LoadingIcon,
  LoadingOverlay,
} from "../../../../commons/libraries/loadingOverlay";
import ErrorAlert from "../../../../commons/libraries/showErrorCode";

interface IModalProps {
  setIsOutModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  playerId: number;
  onSuccess?: () => Promise<void>;
  onTypeSelect?: () => void;
}

export default function OutModal(props: IModalProps) {
  // useModalBack(() => props.setIsOutModalOpen(false));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [error, setError] = useState(null);
  const router = useRouter();
  const mapping: { [key: string]: string } = {
    삼진: "SO",
    희생번트: "SH",
    희생플라이: "SF",
    그외아웃: "O",
  };

  // 아웃 종류 선택 시 실행될 비동기 함수
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
      // const res = await API.post(
      //   endpoint,
      //   requestBody
      //   //   , {
      //   //   withCredentials: true,
      //   // }
      // );

      // 성공 메시지

      // console.log(endpoint, requestBody, res.data);

      // 부모 onSuccess 콜백 실행
      if (props.onSuccess) {
        await props.onSuccess();
      }
      // alert(`기록 전송 완료\n${Type}`);
      // 모달 닫기
      // props.setIsOutModalOpen(false);
    } catch (error) {
      console.error("아웃 기록 전송 오류:", error);
      // alert("아웃 기록 전송 오류");
      setError(error);
    } finally {
      // ① 로딩 해제
      setIsSubmitting(false);
      // ② 모달 닫기
      props.setIsOutModalOpen(false);
      props.onTypeSelect?.();
    }
  };
  return (
    <ModalOverlay onClick={() => props.setIsOutModalOpen(false)}>
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        <ModalTitle>종류를 선택해주세요</ModalTitle>
        <ModalButton
          onClick={() => handleTypeSelect("삼진")}
          disabled={isSubmitting}
        >
          삼진
        </ModalButton>
        <ModalButton
          onClick={() => handleTypeSelect("희생플라이")}
          disabled={isSubmitting}
        >
          희생플라이
        </ModalButton>
        <ModalButton
          onClick={() => handleTypeSelect("희생번트")}
          disabled={isSubmitting}
        >
          희생번트
        </ModalButton>
        <ModalButton
          onClick={() => handleTypeSelect("그외아웃")}
          disabled={isSubmitting}
        >
          그 외 아웃
        </ModalButton>
      </ModalContainer>
      <LoadingOverlay visible={isSubmitting}>
        <LoadingIcon spin fontSize={48} />
      </LoadingOverlay>
      <ErrorAlert error={error} />
    </ModalOverlay>
  );
}
