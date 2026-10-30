import { useCallback, useEffect, useState } from "react";
import moment from "moment-timezone";
import API from "../../../../commons/apis/api";
import GameAdminModal, { AdminGame } from "../../modals/gameAdminModal";
import {
  Chevron,
  DateNav,
  Empty,
  GameRow,
  GameTeams,
  GameTime,
  Hint,
  Notice,
  PageWrapper,
  StatusBadge,
  Tab,
  Tabs,
} from "./admin.style";

interface ScheduleGame {
  id: number;
  time: string;
  status: string;
  isForfeit: boolean;
  homeTeam: { id: number; name: string; score: number | null };
  awayTeam: { id: number; name: string; score: number | null };
}

const statusLabel = (game: ScheduleGame) => {
  if (game.isForfeit) return "몰수승";
  switch (game.status) {
    case "SCHEDULED":
      return "예정";
    case "IN_PROGRESS":
      return "진행 중";
    case "CANCELLED":
      return "노게임";
    default:
      return "종료";
  }
};

const isOpenGame = (game: ScheduleGame) =>
  game.status === "SCHEDULED" || game.status === "IN_PROGRESS";

/** admin 계정 전용 관리 페이지. 지금은 경기 관리 탭만 있고, 대진표 탭은 자리만 잡아 둔다. */
export default function AdminPageComponent() {
  const [role, setRole] = useState<string | null>(null);
  const [date, setDate] = useState(moment().format("YYYY-MM-DD"));
  const [games, setGames] = useState<ScheduleGame[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [target, setTarget] = useState<AdminGame | null>(null);

  useEffect(() => {
    API.get("/profile/me")
      .then((res) => setRole(res.data.role ?? ""))
      .catch(() => setRole(""));
  }, []);

  const loadGames = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await API.get(`/games?from=${date}&to=${date}`);
      setGames(res.data.days?.[0]?.games ?? []);
    } catch {
      setGames([]);
    } finally {
      setIsLoading(false);
    }
  }, [date]);

  useEffect(() => {
    if (role === "ADMIN") loadGames();
  }, [role, loadGames]);

  const moveDate = (days: number) =>
    setDate(moment(date).add(days, "day").format("YYYY-MM-DD"));

  if (role === null) return <PageWrapper />;
  if (role !== "ADMIN") {
    return (
      <PageWrapper>
        <Notice>관리자 계정만 이용할 수 있습니다.</Notice>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <Tabs>
        <Tab active>경기 관리</Tab>
        <Tab active={false} disabled>
          대진표 (준비 중)
        </Tab>
      </Tabs>

      <DateNav>
        <button onClick={() => moveDate(-1)} aria-label="이전 날짜">
          &lt;
        </button>
        <input
          type="date"
          value={date}
          onChange={(e) => e.target.value && setDate(e.target.value)}
        />
        <button onClick={() => moveDate(1)} aria-label="다음 날짜">
          &gt;
        </button>
      </DateNav>
      <Hint>
        경기를 누르면 일정 변경 · 몰수승 · 노게임을 처리할 수 있습니다.
      </Hint>

      {isLoading ? (
        <Empty>불러오는 중…</Empty>
      ) : games.length === 0 ? (
        <Empty>이 날짜에는 경기가 없습니다.</Empty>
      ) : (
        games.map((game) => (
          <GameRow
            key={game.id}
            disabled={!isOpenGame(game)}
            onClick={() =>
              isOpenGame(game) &&
              setTarget({
                id: game.id,
                status: game.status,
                date,
                time: game.time,
                homeTeam: game.homeTeam,
                awayTeam: game.awayTeam,
              })
            }
          >
            <GameTime>{game.time}</GameTime>
            <GameTeams>
              {game.awayTeam.name} vs {game.homeTeam.name}
            </GameTeams>
            <StatusBadge status={game.isForfeit ? "FINALIZED" : game.status}>
              {statusLabel(game)}
            </StatusBadge>
            <Chevron>{isOpenGame(game) ? "›" : ""}</Chevron>
          </GameRow>
        ))
      )}

      {target && (
        <GameAdminModal
          game={target}
          onClose={() => setTarget(null)}
          onDone={() => {
            setTarget(null);
            loadGames();
          }}
        />
      )}
    </PageWrapper>
  );
}
