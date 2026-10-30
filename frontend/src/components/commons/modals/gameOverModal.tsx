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
  setIsGameEndModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  inningScore: number;
}

// 경기종료 → 종료 방식 선택(정상 종료 / 노게임) → 노게임은 한 번 더 확인
type Step = "choose" | "confirmNoGame";

export default function GameOverModal(props: IModalProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<Step>("choose");

  const close = () => props.setIsGameEndModalOpen(false);

  const submit = async (request: () => Promise<unknown>, next: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await request();
      close();
      router.push(next);
    } finally {
      setIsSubmitting(false);
    }
  };

  const finalizeGame = () =>
    submit(
      () =>
        API.post(`/games/${router.query.recordId}/result`, {
          runs: props.inningScore,
        }),
      `/matches/${router.query.recordId}/result`
    );

  const declareNoGame = () =>
    submit(() => API.post(`/games/${router.query.recordId}/no-game`), "/");

  return (
    <ModalOverlay>
      <ModalContainer>
        {step === "choose" ? (
          <>
            <ModalTitleSmall>경기를 어떻게 종료할까요?</ModalTitleSmall>
            <ModalButton onClick={finalizeGame} disabled={isSubmitting}>
              {isSubmitting ? "전송 중…" : "정상 종료 (기록 확정)"}
            </ModalButton>
            <ModalButton
              onClick={() => setStep("confirmNoGame")}
              disabled={isSubmitting}
              style={{ backgroundColor: "#9E9E9E" }}
            >
              노게임 (기록 미반영)
            </ModalButton>
            <ModalCancleButton onClick={close}>취소</ModalCancleButton>
          </>
        ) : (
          <>
            <ModalTitleSmall>
              {
                "노게임으로 처리할까요?\n지금까지의 기록은 순위와 개인 기록에\n반영되지 않으며, 되돌릴 수 없습니다."
              }
            </ModalTitleSmall>
            <ModalButton onClick={declareNoGame} disabled={isSubmitting}>
              {isSubmitting ? "전송 중…" : "노게임 확정"}
            </ModalButton>
            <ModalCancleButton onClick={() => setStep("choose")}>
              뒤로
            </ModalCancleButton>
          </>
        )}
      </ModalContainer>
      <LoadingOverlay visible={isSubmitting}>
        <LoadingIcon spin fontSize={48} />
      </LoadingOverlay>
    </ModalOverlay>
  );
}
