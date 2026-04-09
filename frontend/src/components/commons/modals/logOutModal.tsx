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

import {
  LoadingIcon,
  LoadingOverlay,
} from "../../../commons/libraries/loadingOverlay";

interface IModalProps {
  setIsLogOutModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  inningScore: number;
}

export default function LogOutModal(props: IModalProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTypeSelect = async (type: string) => {
    if (isSubmitting) return;
    if (type === "예") {
      setIsSubmitting(true);
      try {
        await API.post(`/auth/logout`);

        props.setIsLogOutModalOpen(false);
        router.push(`/login`);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      props.setIsLogOutModalOpen(false);
    }
  };

  return (
    <ModalOverlay>
      <ModalContainer>
        <ModalTitleSmall>로그아웃 하시겠습니까?</ModalTitleSmall>
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
