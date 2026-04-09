// ScorePatchModal.tsx
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
import StatPatchInputModal from "./statPatchInputModal"; // ★ 추가
import { useModalBack } from "../../../commons/hooks/useModalBack";

interface IModalProps {
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  cellValue: string; // 스코어보드 셀에서 가져온 값
  team: "A" | "B"; // 팀 구분
  cellIndex: number; // 이닝 인덱스(0‑based)
  mode?: "score" | "batter" | "pitcher";
  alertMessage?: string; // batter/pitcher 모드에서 보여줄 alert
  statId?: number | null;
  onSuccess?: () => Promise<void>;
  isSubmitting?: boolean;
  setIsSubmitting?: React.Dispatch<React.SetStateAction<boolean>>;
  // setError: React.Dispatch<any>;
}

export default function ScorePatchModal({
  setIsModalOpen,
  cellValue,
  team,
  cellIndex,
  mode = "score",
  alertMessage,
  statId,
  onSuccess,
  isSubmitting,
  setIsSubmitting,
}: // setError,
IModalProps) {
  const router = useRouter();

  // useModalBack(() => setIsModalOpen(false));
  /* 다음 단계 모달 플래그 */
  const [showScoreInputModal, setShowScoreInputModal] = useState(false);
  const [showStatInputModal, setShowStatInputModal] = useState(false);

  /* score 모드에서만 사용하는 상태 */
  const [suffix, setSuffix] = useState("");
  const [order, setOrder] = useState(0);

  const handleTypeSelect = (type: string) => {
    if (type !== "예") {
      setIsModalOpen(false);
      return;
    }

    /* ────────────────────────── score 모드 ────────────────────────── */
    if (mode === "score") {
      const selectedSuffix = team === "A" ? "TOP" : "BOT";
      const selectedOrder = cellIndex + 1;

      console.log(
        `선택된 점수: ${cellValue}점, 이닝: ${selectedSuffix}, 순서: ${selectedOrder}회`
      );

      setSuffix(selectedSuffix);
      setOrder(selectedOrder);
      setShowScoreInputModal(true);
      return;
    }

    /* ───────────────────── batter / pitcher 모드 ──────────────────── */
    // if (alertMessage) alert(alertMessage);
    setShowStatInputModal(true);
  };

  /* 모달 제목 */
  const titleText =
    mode === "score" ? "점수를 수정하시겠습니까?" : "스탯을 수정하시겠습니까?";

  return (
    <>
      <ModalOverlay>
        <ModalContainer>
          <ModalTitleSmall>{titleText}</ModalTitleSmall>
          <ModalButton onClick={() => handleTypeSelect("예")}>예</ModalButton>
          <ModalCancleButton onClick={() => handleTypeSelect("아니오")}>
            아니오
          </ModalCancleButton>
        </ModalContainer>
      </ModalOverlay>

      {/* ──────────────────── Score 입력 모달 ──────────────────── */}
      {showScoreInputModal && (
        <ScorePatchInputModal
          setIsModalOpen={setIsModalOpen}
          suffix={suffix}
          order={order}
          cellValue={cellValue}
          onSuccess={onSuccess}
          isSubmitting={isSubmitting}
          setIsSubmitting={setIsSubmitting}
          // setError={setError}
        />
      )}

      {showStatInputModal && (
        <StatPatchInputModal
          // setError={setError}
          key={statId}
          setIsModalOpen={setIsModalOpen}
          mode={mode as "batter" | "pitcher"}
          alertMessage={alertMessage}
          onSuccess={onSuccess}
          // isSubmitting={isSubmitting}
          // setIsSubmitting={setIsSubmitting}
        />
      )}
    </>
  );
}
