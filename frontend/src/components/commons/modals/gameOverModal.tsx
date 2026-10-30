import { useRouter } from "next/router";
import GameAdminModal, { AdminAction, AdminGame } from "./gameAdminModal";

interface IModalProps {
  setIsGameEndModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  inningScore: number;
}

// 일정 화면에서 경기에 들어올 때 저장한 경기 정보 (팀 이름·ID)
const readSelectedMatch = (gameId: number): AdminGame | null => {
  try {
    const match = JSON.parse(localStorage.getItem("selectedMatch") ?? "null");
    if (!match || Number(match.gameId) !== gameId) return null;
    return {
      id: gameId,
      status: "IN_PROGRESS",
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
    };
  } catch {
    return null;
  }
};

/** 기록 화면의 경기종료: 정상 종료 / 몰수승 / 노게임 중에서 고른다. */
export default function GameOverModal(props: IModalProps) {
  const router = useRouter();
  const gameId = Number(router.query.recordId);
  const game: AdminGame = readSelectedMatch(gameId) ?? {
    // 팀 정보가 없으면 몰수승 선택지는 숨겨진다
    id: gameId,
    status: "IN_PROGRESS",
    homeTeam: { id: 0, name: "" },
    awayTeam: { id: 0, name: "" },
  };

  const onDone = (action: AdminAction) => {
    props.setIsGameEndModalOpen(false);
    router.push(action === "finalize" ? `/matches/${gameId}/result` : "/");
  };

  return (
    <GameAdminModal
      game={game}
      finalize={{ inningScore: props.inningScore }}
      onClose={() => props.setIsGameEndModalOpen(false)}
      onDone={onDone}
    />
  );
}
