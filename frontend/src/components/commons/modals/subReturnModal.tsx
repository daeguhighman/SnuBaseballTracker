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

import {
  LoadingIcon,
  LoadingOverlay,
} from "../../../commons/libraries/loadingOverlay";

interface ISubReturnModalProps {
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function SubReturnModal({ setIsOpen }: ISubReturnModalProps) {
  const router = useRouter();

  const handleTypeSelect = (type: "예" | "아니오") => {
    if (type === "예") {
      router.push(`/matches/${router.query.recordId}/records`);
    } else {
      setIsOpen(false);
    }
  };

  return (
    <ModalOverlay>
      <ModalContainer>
        <ModalTitleSmall>
          라인업에 변화가 없습니다.
          <br />
          경기기록으로 돌아가시겠습니까?
        </ModalTitleSmall>
        <ModalButton onClick={() => handleTypeSelect("예")}>예</ModalButton>
        <ModalCancleButton onClick={() => handleTypeSelect("아니오")}>
          아니오
        </ModalCancleButton>
      </ModalContainer>
      <LoadingOverlay>
        <LoadingIcon spin fontSize={48} />
      </LoadingOverlay>
    </ModalOverlay>
  );
}
