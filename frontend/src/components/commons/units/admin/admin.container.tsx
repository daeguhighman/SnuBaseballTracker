import { useCallback, useEffect, useState } from "react";
import moment from "moment-timezone";
import API from "../../../../commons/apis/api";
import { getCurrentTournament } from "../../../../commons/apis/currentTournament";
import GameAdminModal, { AdminGame } from "../../modals/gameAdminModal";
import CreateGameModal, {
  AdminTeamOption,
} from "../../modals/createGameModal";
import AddPlayerModal from "../../modals/addPlayerModal";
import BracketGameModal, { BracketGame } from "../../modals/bracketGameModal";
import {
  AddButton,
  Chevron,
  DateNav,
  Empty,
  EmptySlot,
  GameRow,
  GameTeams,
  GameTime,
  Hint,
  Notice,
  PageWrapper,
  PlayerMeta,
  PlayerName,
  PlayerRow,
  RoundTitle,
  SlotCard,
  SlotHeader,
  SlotMeta,
  SlotTeams,
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

type TabKey = "games" | "players" | "bracket";

/** 대진 위치별 이름과, 승자(4강은 패자도)가 들어가는 다음 자리. 백엔드 advanceBracket과 같은 규칙 */
const BRACKET_ROUNDS: {
  title: string;
  slots: { position: string; label: string; next?: string }[];
}[] = [
  {
    title: "8강",
    slots: [
      { position: "QF_1", label: "8강 1경기", next: "승자 → 4강 1경기 원정" },
      { position: "QF_2", label: "8강 2경기", next: "승자 → 4강 1경기 홈" },
      { position: "QF_3", label: "8강 3경기", next: "승자 → 4강 2경기 원정" },
      { position: "QF_4", label: "8강 4경기", next: "승자 → 4강 2경기 홈" },
    ],
  },
  {
    title: "4강",
    slots: [
      {
        position: "SF_1",
        label: "4강 1경기",
        next: "승자 → 결승 원정 · 패자 → 3·4위전 원정",
      },
      {
        position: "SF_2",
        label: "4강 2경기",
        next: "승자 → 결승 홈 · 패자 → 3·4위전 홈",
      },
    ],
  },
  {
    title: "결승 · 3·4위전",
    slots: [
      { position: "F", label: "결승" },
      { position: "THIRD_PLACE", label: "3·4위전" },
    ],
  },
];

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

/** admin 계정 전용 관리 페이지: 경기 관리, 선수 관리, 대진표. */
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
        <Tab active={tab === "bracket"} onClick={() => setTab("bracket")}>
          대진표
        </Tab>
      </Tabs>

      {tab === "games" ? (
        <GamesTab tournamentId={tournamentId} teams={teams} />
      ) : tab === "players" ? (
        <PlayersTab tournamentId={tournamentId} teams={teams} />
      ) : (
        <BracketTab tournamentId={tournamentId} teams={teams} />
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

const bracketStatusLabel = (game: BracketGame) => {
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

function BracketTab({ tournamentId, teams }: ITabProps) {
  const [games, setGames] = useState<BracketGame[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [target, setTarget] = useState<{
    game: BracketGame;
    label: string;
  } | null>(null);

  const loadGames = useCallback(async () => {
    if (!tournamentId) return;
    setIsLoading(true);
    try {
      const res = await API.get(`/admin/tournaments/${tournamentId}/games`);
      setGames(
        (res.data as BracketGame[]).filter((game) => game.bracketPosition)
      );
    } catch {
      setGames([]);
    } finally {
      setIsLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    loadGames();
  }, [loadGames]);

  const byPosition = new Map(games.map((g) => [g.bracketPosition, g]));
  const missingCount = BRACKET_ROUNDS.flatMap((r) => r.slots).filter(
    (slot) => !byPosition.has(slot.position)
  ).length;

  const createSlots = async () => {
    if (!tournamentId) return;
    setIsCreating(true);
    try {
      await API.post(`/admin/tournaments/${tournamentId}/bracket`);
      await loadGames();
    } catch (err: any) {
      alert(
        err?.response?.data?.message ??
          "대진표를 만들지 못했습니다. 다시 시도해 주세요."
      );
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading && games.length === 0) return <Empty>불러오는 중…</Empty>;

  return (
    <>
      <Hint>
        경기를 누르면 팀과 일정을 정할 수 있습니다. 경기가 확정되면 승자가 다음
        자리에 자동으로 들어갑니다.
      </Hint>

      {BRACKET_ROUNDS.map((round) => (
        <div key={round.title}>
          <RoundTitle>{round.title}</RoundTitle>
          {round.slots.map((slot) => {
            const game = byPosition.get(slot.position);
            if (!game) {
              return (
                <EmptySlot key={slot.position}>
                  {slot.label} · 아직 만들어지지 않았습니다
                </EmptySlot>
              );
            }
            // 노게임 경기는 재경기 일정을 잡을 수 있다
            const editable =
              game.status === "SCHEDULED" || game.status === "CANCELLED";
            const hasTeams = game.away.name || game.home.name;
            return (
              <SlotCard
                key={slot.position}
                disabled={!editable}
                onClick={() =>
                  editable && setTarget({ game, label: slot.label })
                }
              >
                <SlotHeader>
                  <span>{slot.label}</span>
                  <StatusBadge status={game.status}>
                    {bracketStatusLabel(game)}
                  </StatusBadge>
                </SlotHeader>
                <SlotTeams muted={!hasTeams}>
                  {`${game.away.name ?? "미정"} vs ${game.home.name ?? "미정"}`}
                </SlotTeams>
                <SlotMeta>
                  {game.startTime
                    ? moment(game.startTime)
                        .tz("Asia/Seoul")
                        .format("M월 D일 HH:mm")
                    : "일정 미정"}
                </SlotMeta>
                {slot.next && <SlotMeta>{slot.next}</SlotMeta>}
              </SlotCard>
            );
          })}
        </div>
      ))}

      {missingCount > 0 && (
        <AddButton onClick={createSlots} disabled={isCreating || !tournamentId}>
          {isCreating
            ? "만드는 중…"
            : `+ 빈 대진 ${missingCount}경기 만들기`}
        </AddButton>
      )}

      {target && (
        <BracketGameModal
          game={target.game}
          label={target.label}
          teams={teams}
          onClose={() => setTarget(null)}
          onDone={() => {
            setTarget(null);
            loadGames();
          }}
        />
      )}
    </>
  );
}
