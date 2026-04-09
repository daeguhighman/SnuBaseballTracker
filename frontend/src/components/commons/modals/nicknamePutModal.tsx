import { useRouter } from "next/router";
import { useState } from "react";

import {
  ModalButton,
  ModalCancleButton,
  ModalCancleButtonEx,
  ModalContainer,
  ModalOverlay,
  ModalTitleSmall,
} from "./modal.style";
import ScorePatchInputModal from "./scorePatchInputModal";
import { useModalBack } from "../../../commons/hooks/useModalBack";
import NickNamePutInputModal from "./nicknamePutInputModal";

interface IModalProps {
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  cellValue: string;
  onSuccess?: () => Promise<void>;
}

export default function NickNamePutModal({
  setIsModalOpen,
  cellValue,
  onSuccess,
}: IModalProps) {
  // useModalBack(() => setIsModalOpen(false));
  const router = useRouter();

  const [showInputModal, setShowInputModal] = useState(false);
  const handleYes = () => {
    setShowInputModal(true);
  };

  const handleNo = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <ModalOverlay>
        <ModalContainer>
          <ModalTitleSmall>닉네임을 수정하시겠습니까?</ModalTitleSmall>
          <ModalButton onClick={handleYes}>예</ModalButton>
          <ModalCancleButtonEx onClick={handleNo}>아니오</ModalCancleButtonEx>
        </ModalContainer>
      </ModalOverlay>

      {showInputModal && (
        <NickNamePutInputModal
          setIsModalOpen={setIsModalOpen}
          cellValue={cellValue}
          onSuccess={onSuccess}
        />
      )}
    </>
  );
}
