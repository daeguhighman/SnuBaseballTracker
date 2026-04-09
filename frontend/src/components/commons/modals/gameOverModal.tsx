import { useRouter } from "next/router";
import { useState } from "react";
import {
  ModalButton,
  ModalCancleButton,
  ModalContainer,
  ModalOverlay,
  ModalTitle,
  ModalTitleSmall,
} from "./modal.style";
import API from "../../../commons/apis/api";
import { useModalBack } from "../../../commons/hooks/useModalBack";
import {
  LoadingIcon,
  LoadingOverlay,
} from "../../../commons/libraries/loadingOverlay";

interface IModalProps {
  setIsGameEndModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  inningScore: number;
}

export default function GameOverModal(props: IModalProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTypeSelect = async (type: string) => {
    if (isSubmitting) return;
    if (type === "예") {
      setIsSubmitting(true);
      try {
        const requestBody = { runs: props.inningScore };
        console.log("경기종료 요청 바디:", requestBody);
        const response = await API.post(
          `/games/${router.query.recordId}/result`,
          requestBody
        );
        console.log(
          `/games/${router.query.recordId}/result`,
          "응답 상태:",
          response.status
        );
        props.setIsGameEndModalOpen(false);
        router.push(`/matches/${router.query.recordId}/result`);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      props.setIsGameEndModalOpen(false);
    }
  };

  return (
    <ModalOverlay>
      <ModalContainer>
        <ModalTitleSmall>경기를 종료하시겠습니까?</ModalTitleSmall>
        <ModalButton
          onClick={() => handleTypeSelect("예")}
          disabled={isSubmitting}
        >
          {isSubmitting ? "전송 중…" : "예"}
        </ModalButton>
        <ModalCancleButton onClick={() => handleTypeSelect("아니오")}>
          아니오
        </ModalCancleButton>
      </ModalContainer>
      <LoadingOverlay visible={isSubmitting}>
        <LoadingIcon spin fontSize={48} />
      </LoadingOverlay>
    </ModalOverlay>
  );
}
