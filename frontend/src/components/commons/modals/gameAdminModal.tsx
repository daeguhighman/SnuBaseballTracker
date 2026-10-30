import styled from "@emotion/styled";
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

interface AdminTeam {
  id: number;
  name: string;
}

export interface AdminGame {
  id: number;
  status: string;
  /** YYYY-MM-DD (KST) */
  date?: string;
  /** HH:mm (KST) */
  time?: string;
  homeTeam: AdminTeam;
  awayTeam: AdminTeam;
}

export type AdminAction = "finalize" | "noGame" | "forfeit" | "schedule";

interface IProps {
  game: AdminGame;
  /** 기록 화면의 경기종료에서 열 때: 정상 종료 선택지와 마지막 이닝 점수 */
  finalize?: { inningScore: number };
  onClose: () => void;
  onDone: (action: AdminAction) => void;
}

type Step =
  | "menu"
  | "schedule"
  | "forfeitPick"
  | "forfeitConfirm"
  | "noGameConfirm";

const ActionButton = styled(ModalButton)`
  margin-bottom: 12px;
`;

const MutedActionButton = styled(ActionButton)`
  background-color: #9e9e9e;
`;

const Notice = styled.p`
  margin: -16px 0 20px;
  color: #757575;
  font-size: 12px;
  white-space: pre-line;
`;

const ScheduleInputs = styled.div`
  display: flex;
  gap: 8px;
  width: 80%;
  margin-bottom: 20px;

  input {
    flex: 1;
    min-width: 0;
    height: 40px;
    padding: 0 8px;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    font-size: 14px;
  }
`;

/**
 * 관리자(admin 계정)용 경기 처리 모달.
 * 일정 화면에서는 일정 변경·몰수승·노게임, 기록 화면의 경기종료에서는 정상 종료·노게임·몰수승을 고른다.
 * 되돌릴 수 없는 처리는 한 번 더 확인한다.
 */
export default function GameAdminModal({
  game,
  finalize,
  onClose,
  onDone,
}: IProps) {
  const [step, setStep] = useState<Step>("menu");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [winner, setWinner] = useState<AdminTeam | null>(null);
  const [date, setDate] = useState(game.date ?? "");
  const [time, setTime] = useState(game.time ?? "");

  const isOpenGame =
    game.status === "SCHEDULED" || game.status === "IN_PROGRESS";
  const canReschedule = !finalize && game.status === "SCHEDULED";
  const hasTeams = Boolean(game.homeTeam.id && game.awayTeam.id);

  const run = async (action: AdminAction, request: () => Promise<unknown>) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await request();
      onDone(action);
    } catch (err: any) {
      alert(
        err?.response?.data?.message ??
          "처리에 실패했습니다. 다시 시도해 주세요."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const finalizeGame = () =>
    run("finalize", () =>
      API.post(`/games/${game.id}/result`, { runs: finalize?.inningScore })
    );

  const declareNoGame = () =>
    run("noGame", () => API.post(`/games/${game.id}/no-game`));

  const forfeitGame = () =>
    winner &&
    run("forfeit", () =>
      API.patch(`/admin/forfeit-game`, {
        gameId: game.id,
        winnerTeamId: winner.id,
      })
    );

  const updateSchedule = () => {
    if (!date || !time) {
      alert("날짜와 시간을 모두 입력해 주세요.");
      return;
    }
    run("schedule", () =>
      API.patch(`/admin/update-schedule`, {
        gameId: game.id,
        startTime: `${date}T${time}:00+09:00`,
      })
    );
  };

  const matchLabel = `${game.awayTeam.name} vs ${game.homeTeam.name}`;

  const renderStep = () => {
    switch (step) {
      case "menu":
        return (
          <>
            <ModalTitleSmall>
              {finalize ? "경기를 어떻게 종료할까요?" : matchLabel}
            </ModalTitleSmall>
            {finalize && (
              <ActionButton onClick={finalizeGame} disabled={isSubmitting}>
                정상 종료 (기록 확정)
              </ActionButton>
            )}
            {canReschedule && (
              <ActionButton onClick={() => setStep("schedule")}>
                일정 변경
              </ActionButton>
            )}
            {isOpenGame && hasTeams && (
              <MutedActionButton onClick={() => setStep("forfeitPick")}>
                몰수승
              </MutedActionButton>
            )}
            {isOpenGame && (
              <MutedActionButton onClick={() => setStep("noGameConfirm")}>
                노게임 (기록 미반영)
              </MutedActionButton>
            )}
            {!finalize && !isOpenGame && (
              <Notice>
                {"확정되었거나 노게임 처리된 경기는\n변경할 수 없습니다."}
              </Notice>
            )}
            <ModalCancleButton onClick={onClose}>취소</ModalCancleButton>
          </>
        );

      case "schedule":
        return (
          <>
            <ModalTitleSmall>{`${matchLabel}\n새 경기 일정`}</ModalTitleSmall>
            <ScheduleInputs>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </ScheduleInputs>
            <ActionButton onClick={updateSchedule} disabled={isSubmitting}>
              {isSubmitting ? "전송 중…" : "일정 변경"}
            </ActionButton>
            <ModalCancleButton onClick={() => setStep("menu")}>
              뒤로
            </ModalCancleButton>
          </>
        );

      case "forfeitPick":
        return (
          <>
            <ModalTitleSmall>어느 팀의 몰수승인가요?</ModalTitleSmall>
            {[game.awayTeam, game.homeTeam].map((team) => (
              <ActionButton
                key={team.id}
                onClick={() => {
                  setWinner(team);
                  setStep("forfeitConfirm");
                }}
              >
                {team.name}
              </ActionButton>
            ))}
            <ModalCancleButton onClick={() => setStep("menu")}>
              뒤로
            </ModalCancleButton>
          </>
        );

      case "forfeitConfirm":
        return (
          <>
            <ModalTitleSmall>{`${winner?.name} 몰수승으로 처리할까요?`}</ModalTitleSmall>
            <Notice>
              {
                "지금까지의 기록은 반영되지 않고 승패만 기록되며,\n되돌릴 수 없습니다."
              }
            </Notice>
            <ActionButton onClick={forfeitGame} disabled={isSubmitting}>
              {isSubmitting ? "전송 중…" : "몰수승 확정"}
            </ActionButton>
            <ModalCancleButton onClick={() => setStep("forfeitPick")}>
              뒤로
            </ModalCancleButton>
          </>
        );

      case "noGameConfirm":
        return (
          <>
            <ModalTitleSmall>노게임으로 처리할까요?</ModalTitleSmall>
            <Notice>
              {
                "지금까지의 기록은 순위와 개인 기록에\n반영되지 않으며, 되돌릴 수 없습니다."
              }
            </Notice>
            <ActionButton onClick={declareNoGame} disabled={isSubmitting}>
              {isSubmitting ? "전송 중…" : "노게임 확정"}
            </ActionButton>
            <ModalCancleButton onClick={() => setStep("menu")}>
              뒤로
            </ModalCancleButton>
          </>
        );
    }
  };

  return (
    <ModalOverlay>
      <ModalContainer>{renderStep()}</ModalContainer>
      <LoadingOverlay visible={isSubmitting}>
        <LoadingIcon spin fontSize={48} />
      </LoadingOverlay>
    </ModalOverlay>
  );
}
