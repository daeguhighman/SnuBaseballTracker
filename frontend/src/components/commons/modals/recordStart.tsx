import { useRouter } from "next/router";
import {
  ModalButton,
  ModalCancleButton,
  ModalContainer,
  ModalOverlay,
  ModalTitle,
  ModalTitleSmall,
} from "./modal.style";
import { useModalBack } from "../../../commons/hooks/useModalBack";

interface IModalProps {
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function RecordStartModal(props: IModalProps) {
  // useModalBack(() => props.setIsModalOpen(false));
  const router = useRouter();

  const handleTypeSelect = (type: string) => {
    if (type === "예") {
      props.setIsModalOpen(false);
      router.push(`/matches/${router.query.recordId}/records`);
    } else {
      props.setIsModalOpen(false);
    }
  };
  return (
    <ModalOverlay>
      <ModalContainer>
        <ModalTitleSmall>
          경기 기록을 <br />
          시작하시겠습니까?
        </ModalTitleSmall>
        <ModalButton onClick={() => handleTypeSelect("예")}>예</ModalButton>
        <ModalCancleButton onClick={() => handleTypeSelect("아니오")}>
          아니오
        </ModalCancleButton>
      </ModalContainer>
    </ModalOverlay>
  );
}
