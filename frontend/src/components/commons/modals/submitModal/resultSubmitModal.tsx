import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import API from "../../../../commons/apis/api";
import {
  ModalButton,
  ModalCancleButton,
  ModalContainer,
  ModalOverlay,
  ModalTitleSmall,
} from "../modal.style";
import { useModalBack } from "../../../../commons/hooks/useModalBack";
import {
  LoadingIcon,
  LoadingOverlay,
} from "../../../../commons/libraries/loadingOverlay";
import ErrorAlert from "../../../../commons/libraries/showErrorCode";

interface IModalProps {
  setIsResultSubmitModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function ResultSubmitModal(props: IModalProps) {
  // useModalBack(() => props.setIsResultSubmitModalOpen(false));
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const handleSubmit = async () => {
    if (isSubmitting) return; // 이미 요청 중이면 무시
    setIsSubmitting(true);

    try {
      const response = await API.post(
        `/games/${router.query.recordId}/results/finalize`
        // { withCredentials: true }
      );
      console.log(
        `/games/${router.query.recordId}/results/finalize`,
        "응답 상태:",
        response.status
      );

      if (response.status === 201 || 200) {
        // alert("경기 종료 및 확정 성공");
        localStorage.removeItem("selectedMatch");
        localStorage.removeItem("lineup_away");
        localStorage.removeItem("lineup_home");
        setIsSubmitted(true);
      }
    } catch (error: any) {
      setError(error);
      // if (error.response) {
      //   console.error("오류 응답 상태:", error.response.status);
      //   if (error.response.status === 400) {
      //     const errorCode = error?.response?.data?.errorCode; // 에러코드 추출
      //     console.error(error, "errorCode:", errorCode);
      //     alert("이미 종료된 경기, 또는 정합성 오류");
      //   } else if (error.response.status === 404) {
      //     const errorCode = error?.response?.data?.errorCode; // 에러코드 추출
      //     console.error(error, "errorCode:", errorCode);
      //     alert("경기(gameId) 없음");
      //   } else {
      //     const errorCode = error?.response?.data?.errorCode; // 에러코드 추출
      //     console.error(error, "errorCode:", errorCode);
      //     alert("알 수 없는 오류가 발생했습니다.");
      //   }
      // } else {
      //   const errorCode = error?.response?.data?.errorCode; // 에러코드 추출
      //   console.error(error, "errorCode:", errorCode);
      //   console.error("네트워크 오류 또는 알 수 없는 에러:", error);
      //   alert("네트워크 오류가 발생했습니다.");
      // }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <ModalOverlay>
        <ModalContainer>
          <ModalTitleSmall>제출이 완료되었습니다!</ModalTitleSmall>
          <Link href="/" passHref>
            <ModalButton as="a">홈으로</ModalButton>
          </Link>
        </ModalContainer>
      </ModalOverlay>
    );
  }

  return (
    <ModalOverlay>
      <ModalContainer>
        <ModalTitleSmall>경기기록을 제출하시겠습니까?</ModalTitleSmall>
        <ModalButton onClick={handleSubmit} disabled={isSubmitting}>
          예
        </ModalButton>
        <ModalCancleButton
          onClick={() => props.setIsResultSubmitModalOpen(false)}
          disabled={isSubmitting}
        >
          아니오
        </ModalCancleButton>
        <LoadingOverlay visible={isSubmitting}>
          <LoadingIcon spin fontSize={48} />
        </LoadingOverlay>
      </ModalContainer>
      <ErrorAlert error={error} />
    </ModalOverlay>
  );
}
