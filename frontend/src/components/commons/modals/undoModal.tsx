import { useEffect, useState } from "react";
import API from "../../../commons/apis/api";
import {
  LoadingIcon,
  LoadingOverlay,
} from "../../../commons/libraries/loadingOverlay";
import {
  ModalButton,
  ModalCancleButton,
  ModalContainer,
  ModalOverlay,
  ModalTitleSmall,
} from "./modal.style";

interface IProps {
  gameId: number;
  onClose: () => void;
  /** 되돌린 뒤의 심판용 스냅샷 */
  onDone: (snapshot: any) => void;
}

/** 기록 화면의 직전 기록 취소: 최근 기록 종류를 보여 주고 한 번 더 확인한다. */
export default function UndoModal({ gameId, onClose, onDone }: IProps) {
  const [status, setStatus] = useState<{
    count: number;
    lastLabel: string | null;
  } | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    API.get(`/games/${gameId}/undo`)
      .then((res) => setStatus(res.data))
      .catch(() => setLoadFailed(true));
  }, [gameId]);

  const undo = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await API.post(`/games/${gameId}/undo`);
      onDone(res.data.snapshot);
    } catch (err: any) {
      alert(
        err?.response?.data?.message ??
          "되돌리지 못했습니다. 다시 시도해 주세요."
      );
      setIsSubmitting(false);
    }
  };

  return (
    <ModalOverlay>
      <ModalContainer>
        {loadFailed ? (
          <>
            <ModalTitleSmall>
              {"되돌릴 기록을 확인하지 못했습니다.\n잠시 후 다시 시도해 주세요."}
            </ModalTitleSmall>
            <ModalCancleButton onClick={onClose}>닫기</ModalCancleButton>
          </>
        ) : status === null ? (
          <ModalTitleSmall>확인 중…</ModalTitleSmall>
        ) : status.count === 0 ? (
          <>
            <ModalTitleSmall>되돌릴 기록이 없습니다.</ModalTitleSmall>
            <ModalCancleButton onClick={onClose}>닫기</ModalCancleButton>
          </>
        ) : (
          <>
            <ModalTitleSmall>
              {`직전 기록(${status.lastLabel})을\n취소할까요?`}
            </ModalTitleSmall>
            <ModalButton onClick={undo} disabled={isSubmitting}>
              {isSubmitting ? "되돌리는 중…" : "되돌리기"}
            </ModalButton>
            <ModalCancleButton onClick={onClose}>취소</ModalCancleButton>
          </>
        )}
      </ModalContainer>
      <LoadingOverlay visible={isSubmitting}>
        <LoadingIcon spin fontSize={48} />
      </LoadingOverlay>
    </ModalOverlay>
  );
}
