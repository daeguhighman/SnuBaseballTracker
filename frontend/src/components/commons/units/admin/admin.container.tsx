import { useCallback, useEffect, useState } from "react";
import moment from "moment-timezone";
import API from "../../../../commons/apis/api";
import { getCurrentTournament } from "../../../../commons/apis/currentTournament";
import GameAdminModal, { AdminGame } from "../../modals/gameAdminModal";
import CreateGameModal, {
  AdminTeamOption,
} from "../../modals/createGameModal";
import AddPlayerModal from "../../modals/addPlayerModal";
import {
  AddButton,
  Chevron,
  DateNav,
  Empty,
  GameRow,
  GameTeams,
  GameTime,
  Hint,
  Notice,
  PageWrapper,
  PlayerMeta,
  PlayerName,
  PlayerRow,
  StatusBadge,
  Tab,
  Tabs,
  TeamSelect,
} from "./admin.style";

interface ScheduleGame {
  id: number;
  time: string;
  status: string;
  isForfeit: boolean;
  homeTeam: { id: number; name: string; score: number | null };
  awayTeam: { id: number; name: string; score: number | null };
}

interface RosterPlayer {
  id: number;
  name: string;
  department: string | null;
  isElite: boolean;
  isWc: boolean;
}

type TabKey = "games" | "players";

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

/** admin 계정 전용 관리 페이지: 경기 관리, 선수 관리. 대진표 탭은 자리만 잡아 둔다. */
export default function AdminPageComponent() {
  const [role, setRole] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>("games");
  const [tournamentId, setTournamentId] = useState<number | null>(null);
  const [teams, setTeams] = useState<AdminTeamOption[]>([]);

  useEffect(() => {
    API.get("/profile/me")
      .then((res) => setRole(res.data.role ?? ""))
      .catch(() => setRole(""));
  }, []);

  useEffect(() => {
    if (role !== "ADMIN") return;
    getCurrentTournament()
      .then(async ({ id }) => {
        setTournamentId(id);
        const res = await API.get(`/tournaments/${id}/teams/grouped`);
        const grouped: Record<string, { id: number; name: string }[]> =
          res.data;
        setTeams(
          Object.entries(grouped).flatMap(([group, list]) =>
            list.map((team) => ({ id: team.id, name: team.name, group }))
          )
        );
      })
      .catch(() => setTeams([]));
  }, [role]);

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
        <Tab active={tab === "games"} onClick={() => setTab("games")}>
          경기 관리
        </Tab>
        <Tab active={tab === "players"} onClick={() => setTab("players")}>
          선수
        </Tab>
        <Tab active={false} disabled>
          대진표 (준비 중)
        </Tab>
      </Tabs>

      {tab === "games" ? (
        <GamesTab tournamentId={tournamentId} teams={teams} />
      ) : (
        <PlayersTab tournamentId={tournamentId} teams={teams} />
      )}
    </PageWrapper>
  );
}

interface ITabProps {
  tournamentId: number | null;
  teams: AdminTeamOption[];
}

function GamesTab({ tournamentId, teams }: ITabProps) {
  const [date, setDate] = useState(moment().format("YYYY-MM-DD"));
  const [games, setGames] = useState<ScheduleGame[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [target, setTarget] = useState<AdminGame | null>(null);
  const [isCreating, setIsCreating] = useState(false);

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
    loadGames();
  }, [loadGames]);

  const moveDate = (days: number) =>
    setDate(moment(date).add(days, "day").format("YYYY-MM-DD"));

  return (
    <>
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

      <AddButton
        onClick={() => setIsCreating(true)}
        disabled={!tournamentId || teams.length === 0}
      >
        + 경기 등록
      </AddButton>

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
      {isCreating && tournamentId && (
        <CreateGameModal
          tournamentId={tournamentId}
          teams={teams}
          defaultDate={date}
          onClose={() => setIsCreating(false)}
          onDone={() => {
            setIsCreating(false);
            loadGames();
          }}
        />
      )}
    </>
  );
}

function PlayersTab({ tournamentId, teams }: ITabProps) {
  const [teamId, setTeamId] = useState("");
  const [players, setPlayers] = useState<RosterPlayer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const team = teams.find((t) => String(t.id) === teamId);

  const loadPlayers = useCallback(async () => {
    if (!tournamentId || !teamId) return;
    setIsLoading(true);
    try {
      const res = await API.get(
        `/tournaments/${tournamentId}/teams/${teamId}/players`
      );
      setPlayers(res.data.players ?? []);
    } catch {
      setPlayers([]);
    } finally {
      setIsLoading(false);
    }
  }, [tournamentId, teamId]);

  useEffect(() => {
    loadPlayers();
  }, [loadPlayers]);

  return (
    <>
      <TeamSelect value={teamId} onChange={(e) => setTeamId(e.target.value)}>
        <option value="">팀 선택</option>
        {teams.map((t) => (
          <option key={t.id} value={t.id}>
            {t.group ? `${t.group}조 ` : ""}
            {t.name}
          </option>
        ))}
      </TeamSelect>

      {!team ? (
        <Empty>팀을 고르면 등록된 선수가 보입니다.</Empty>
      ) : (
        <>
          <Hint>{`${team.name} · ${players.length}명`}</Hint>
          {isLoading ? (
            <Empty>불러오는 중…</Empty>
          ) : (
            players.map((p) => (
              <PlayerRow key={p.id}>
                <PlayerName>{p.name}</PlayerName>
                <PlayerMeta>
                  {[p.department, p.isElite && "선출", p.isWc && "WC"]
                    .filter(Boolean)
                    .join(" · ")}
                </PlayerMeta>
              </PlayerRow>
            ))
          )}
          <AddButton onClick={() => setIsAdding(true)}>+ 선수 추가</AddButton>
        </>
      )}

      {isAdding && team && tournamentId && (
        <AddPlayerModal
          tournamentId={tournamentId}
          team={team}
          onClose={() => setIsAdding(false)}
          onDone={() => {
            setIsAdding(false);
            loadPlayers();
          }}
        />
      )}
    </>
  );
}
