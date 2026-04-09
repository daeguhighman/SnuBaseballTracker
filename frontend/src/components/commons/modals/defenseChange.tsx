// src/components/modals/defenseChangeModal.tsx
import {
  ModalButton,
  ModalCancleButton,
  ModalContainer,
  ModalOverlay,
  ModalTitleSmall,
} from "./modal.style";

interface IModalProps {
  setIsChangeModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onSuccess: () => Promise<void>;
}

export default function DefenseChangeModal(props: IModalProps) {
  const handleConfirm = async () => {
    await props.onSuccess();
    // 모달 닫기는 부모 handleDefenseChange 의 finally 에서 처리됩니다.
  };

  return (
    <ModalOverlay>
      <ModalContainer>
        <ModalTitleSmall>공수를 교대하시겠습니까?</ModalTitleSmall>
        <ModalButton onClick={handleConfirm}>예</ModalButton>
        <ModalCancleButton onClick={() => props.setIsChangeModalOpen(false)}>
          아니오
        </ModalCancleButton>
      </ModalContainer>
    </ModalOverlay>
  );
}
