import { useRouter } from "next/router";
import { useState } from "react";

import {
  ModalButton,
  ModalCancleButton,
  ModalContainer,
  ModalOverlay,
  ModalTitleSmall,
} from "./modal.style";
import ScorePatchInputModal from "./scorePatchInputModal";
import { useModalBack } from "../../../commons/hooks/useModalBack";

interface IModalProps {
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  cellValue: string;
  team: "A" | "B";
  cellIndex: number; // 배열 내 순서 (0 기반)
}

export default function StatPatchModal({
  setIsModalOpen,
  cellValue,
  team,
  cellIndex,
}: IModalProps) {
  // useModalBack(() => setIsModalOpen(false));
  const router = useRouter();

  const [showScoreInputModal, setShowScoreInputModal] =
    useState<boolean>(false);

  // 모달에 넘겨줄 값들을 담아둘 상태
  const [suffix, setSuffix] = useState<string>("");
  const [order, setOrder] = useState<number>(0);

  const handleTypeSelect = (type: string) => {
    if (type === "예") {
      // 팀에 따라 "TOP" 또는 "BOT"을 결정
      const selectedSuffix = team === "A" ? "TOP" : "BOT";
      // 0 기반을 1부터 시작하는 숫자로 변환
      const selectedOrder = cellIndex + 1;

      // 콘솔 출력
      console.log(
        `선택된 점수: ${cellValue}점, 이닝: ${selectedSuffix}, 순서: ${selectedOrder}회`
      );

      // ScorePatchInputModal에서 사용할 값들 상태에 저장
      setSuffix(selectedSuffix);
      setOrder(selectedOrder);

      // ScorePatchInputModal을 표시
      setShowScoreInputModal(true);
    } else {
      setIsModalOpen(false);
    }
  };

  return (
    <>
      <ModalOverlay>
        <ModalContainer>
          <ModalTitleSmall>스탯을 수정하시겠습니까?</ModalTitleSmall>
          <ModalButton onClick={() => handleTypeSelect("예")}>예</ModalButton>
          <ModalCancleButton onClick={() => handleTypeSelect("아니오")}>
            아니오
          </ModalCancleButton>
        </ModalContainer>
      </ModalOverlay>

      {showScoreInputModal && (
        <ScorePatchInputModal
          setIsModalOpen={setIsModalOpen}
          suffix={suffix}
          order={order}
          cellValue={cellValue}
        />
      )}
    </>
  );
}
