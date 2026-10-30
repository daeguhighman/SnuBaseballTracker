import { useRouter } from "next/router";
import { useState } from "react";
import {
  ModalButton,
  ModalCancleButton,
  ModalContainer,
  ModalOverlay,
  ModalTitleSmall,
} from "./modal.style";
import API from "../../../commons/apis/api";
import {
  LoadingIcon,
  LoadingOverlay,
} from "../../../commons/libraries/loadingOverlay";

interface IModalProps {
  setIsNoGameModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function NoGameModal(props: IModalProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTypeSelect = async (type: string) => {
    if (isSubmitting) return;
    if (type === "예") {
      setIsSubmitting(true);
      try {
        await API.post(`/games/${router.query.recordId}/no-game`);
        props.setIsNoGameModalOpen(false);
        router.push("/");
      } finally {
        setIsSubmitting(false);
      }
    } else {
      props.setIsNoGameModalOpen(false);
    }
  };

  return (
    <ModalOverlay>
      <ModalContainer>
        <ModalTitleSmall>
          노게임 처리하시겠습니까?
          <br />
          지금까지의 기록은 순위와 개인 기록에 반영되지 않습니다.
        </ModalTitleSmall>
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
