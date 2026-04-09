import {
  useState,
  useEffect,
  useCallback,
  CSSProperties,
  useRef,
  useMemo,
  useLayoutEffect,
  memo,
  useImperativeHandle,
} from "react";
import {
  DndContext,
  useDraggable,
  useDroppable,
  DragEndEvent,
  useSensors,
  PointerSensor,
  TouchSensor,
  useSensor,
  CollisionDetection,
  DragOverEvent,
  Modifier,
  MeasuringStrategy,
  DragMoveEvent,
  rectIntersection,
  DragStartEvent,
} from "@dnd-kit/core";

// import GroundPng from "/images/ground-without-home.png";

import { useRouter } from "next/router";
import API from "../../../../commons/apis/api";
import {
  GameRecordContainer,
  InningHeader,
  InningCell,
  TeamRow,
  TeamNameCell,
  TeamScoreCell,
  ControlButtonsRow,
  ControlButtonsWrapper,
  ControlButton,
  RecordActionsRow,
  RecordActionButton,
  ScoreBoardWrapper,
  GraphicWrapper,
  FullImage,
  OutCount,
  Ellipse,
  // OverlaySvg,
  ResetDot,
  Rotator,
  DiamondSvg,
  NameBadge,
  NameText,
  PlayersRow,
  PlayerBox,
  OrderBadge,
  PlayerWrapper,
  PlayerPosition,
  PlayerInfo,
  ReconstructionWrapper,
  ReconstructionTitle,
  ReconstructionButtonWrapper,
  ReconstructionSwitch,
  PlayerChangeButton,
  EliteBox,
  WildCardBox,
  PlayerExWrapper,
  WildCardBoxNone,
  OnDeckWrapper,
  OutZoneWrapper,
  CustomBoundaryWrapper,
  Ground,
  HomeWrapper,
  LineWrapper,
  HomePlateOverlay,
  HomeBaseWrapper,
  SideWrapper,
  LeftSideWrapper,
  InningBoard,
  LittleScoreBoardWrapper,
  ControlButtonWhite,
  VsText,
  LeftArrow,
  RightArrow,
  Dot,
  InningNumber,
  AwayTeamName,
  HomeTeamName,
  AwayTeamWrapper,
  HomeTeamWrapper,
  AwayTeamScore,
  HomeTeamScore,
  OnDeckNameWrapper,
} from "./gameRecord-v2.style";
import HitModal from "../../modals/recordModal/hitModal";
import OutModal from "../../modals/recordModal/outModal";
import EtcModal from "../../modals/recordModal/etcModal";
import DefenseChangeModal from "../../modals/defenseChange";
import GameOverModal from "../../modals/gameOverModal";
import ScorePatchModal from "../../modals/scorePatchModal";
import {
  awayBatterNumberState,
  homeBatterNumberState,
  snapshotState,
  substitutionSwappedState,
} from "../../../../commons/stores";
import { useRecoilState } from "recoil";
import {
  LoadingIcon,
  LoadingOverlay,
} from "../../../../commons/libraries/loadingOverlay";
import ErrorAlert from "../../../../commons/libraries/showErrorCode";
import {
  ModalButton,
  ModalContainer,
  ModalOverlay,
  ModalTitleSmaller,
} from "../../modals/modal.style";
import GroundRecordModal, {
  GroundRecordModalHandle,
} from "../../modals/groudRecordModal/groundRecordModal";
import { ArrowUp } from "../../../../commons/libraries/arrow";
import ArrowDown from "../../../../commons/libraries/arrowDown";
import { badgeConfigs } from "./gameRecord.variables";
import RightPolygon from "../../../../commons/libraries/rightPolygon";
import LeftPolygon from "../../../../commons/libraries/leftPolygon";

import { unstable_batchedUpdates } from "react-dom";
import PortalSwitch from "./reconstructionSwitch";

// 1) 먼저 BaseId / BASE_IDS를 선언
export const BASE_IDS = [
  "first-base",
  "second-base",
  "third-base",
  "home-base",
] as const;

export type BaseId = (typeof BASE_IDS)[number];

export const useRectsCache = (
  wrapperRef: React.RefObject<HTMLDivElement>,
  outZoneRef: React.RefObject<HTMLDivElement>,
  baseRefs: React.MutableRefObject<Record<BaseId, SVGPolygonElement | null>>,
  BASE_IDS: readonly BaseId[]
) => {
  const wrapperRectRef = useRef<DOMRect | null>(null);
  const zoneRectRef = useRef<DOMRect | null>(null);
  const baseRectsRef = useRef<Partial<Record<BaseId, DOMRect>>>({});

  const refreshRects = useCallback(() => {
    const wrapEl = wrapperRef.current;
    const zoneEl = outZoneRef.current;

    if (wrapEl) wrapperRectRef.current = wrapEl.getBoundingClientRect();
    if (zoneEl) zoneRectRef.current = zoneEl.getBoundingClientRect();

    BASE_IDS.forEach((b) => {
      const poly = baseRefs.current[b];
      if (poly) baseRectsRef.current[b] = poly.getBoundingClientRect();
    });
  }, [wrapperRef, outZoneRef, baseRefs, BASE_IDS]);

  useLayoutEffect(() => {
    // 최초 1회
    refreshRects();

    let rafId: number | null = null;
    const schedule = () => {
      if (rafId != null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        refreshRects();
      });
    };

    const ro = new ResizeObserver(() => {
      schedule();
    });

    if (wrapperRef.current) ro.observe(wrapperRef.current);
    if (outZoneRef.current) ro.observe(outZoneRef.current);
    BASE_IDS.forEach((b) => {
      const el = baseRefs.current[b];
      if (el) ro.observe(el);
    });

    const onResize = () => schedule();
    const onOrientation = () => schedule();
    const onScroll = () => schedule();

    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onOrientation);
    window.addEventListener("scroll", onScroll, true);

    return () => {
      ro.disconnect();
      if (rafId != null) cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onOrientation);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [refreshRects, BASE_IDS]);

  return { wrapperRectRef, zoneRectRef, baseRectsRef, refreshRects };
};

export default function GameRecordPageV2() {
  const [error, setError] = useState(null);
  const router = useRouter();
  const recordId = router.query.recordId;
  // const [outs, setOuts] = useState<boolean[]>([false, false, false]);

  // 이닝 헤더 (1~7, R, H)
  const inningHeaders = ["", "1", "2", "3", "4", "5", "6", "7", "R", "H"];

  // 팀 이름
  const [teamAName, setTeamAName] = useState("");
  const [teamBName, setTeamBName] = useState("");

  // 이닝별 점수 (9칸: 7이닝 + R, H)
  // const [teamAScores, setTeamAScores] = useState(Array(9).fill(""));
  // const [teamBScores, setTeamBScores] = useState(Array(9).fill(""));

  // 이번 이닝 득점
  const [thisInningScore, setThisInningScore] = useState(0);

  // 현재 타자/투수
  // const [batter, setBatter] = useState({
  //   battingOrder: 0,
  //   playerId: 0,
  //   playerName: "-",
  //   isElite: false,
  //   isWc: false,
  //   position: "-",
  // });
  // const [pitcher, setPitcher] = useState({
  //   battingOrder: 0,
  //   playerId: 0,
  //   playerName: "-",
  //   isElite: false,
  //   isWc: false,
  //   position: "P",
  // });

  // 대기타석 표시용 라인업
  const awayExample = {
    batters: [
      {
        battingOrder: 1,
        playerId: 121,
        playerName: "박민재",
        position: "CF",
        isWC: false,
      },
      {
        battingOrder: 2,
        playerId: 122,
        playerName: "박용준",
        position: "LF",
        isWC: false,
      },
      {
        battingOrder: 3,
        playerId: 123,
        playerName: "박지호",
        position: "RF",
        isWC: true,
      },
      {
        battingOrder: 4,
        playerId: 124,
        playerName: "박준혁",
        position: "SS",
        isWC: true,
      },
      {
        battingOrder: 5,
        playerId: 125,
        playerName: "김지찬",
        position: "1B",
        isWC: false,
      },
      {
        battingOrder: 6,
        playerId: 126,
        playerName: "이재현",
        position: "2B",
        isWC: false,
      },
      {
        battingOrder: 7,
        playerId: 127,
        playerName: "디아즈",
        position: "3B",
        isWC: false,
      },
      {
        battingOrder: 8,
        playerId: 128,
        playerName: "구자욱",
        position: "C",
        isWC: false,
      },
      {
        battingOrder: 9,
        playerId: 129,
        playerName: "김헌곤",
        position: "DH",
        isWC: true,
      },
    ],
    pitcher: {
      playerId: 134,
      playerName: "원태인",
      isWC: false,
    },
  };

  const homeExample = {
    batters: [
      {
        battingOrder: 1,
        playerId: 101,
        playerName: "강하윤",
        position: "CF",
        isWC: false,
      },
      {
        battingOrder: 2,
        playerId: 102,
        playerName: "김준기",
        position: "LF",
        isWC: false,
      },
      {
        battingOrder: 3,
        playerId: 103,
        playerName: "윤동현",
        position: "RF",
        isWC: false,
      },
      {
        battingOrder: 4,
        playerId: 104,
        playerName: "박진우",
        position: "SS",
        isWC: true,
      },
      {
        battingOrder: 5,
        playerId: 105,
        playerName: "박성민",
        position: "1B",
        isWC: true,
      },
      {
        battingOrder: 6,
        playerId: 106,
        playerName: "박민수",
        position: "2B",
        isWC: true,
      },
      {
        battingOrder: 7,
        playerId: 107,
        playerName: "박영수",
        position: "3B",
        isWC: false,
      },
      {
        battingOrder: 8,
        playerId: 108,
        playerName: "박지훈",
        position: "C",
        isWC: false,
      },
      {
        battingOrder: 9,
        playerId: 121,
        playerName: "정현우",
        position: "P",
        isWC: false,
      },
    ],
    pitcher: {
      playerId: 121,
      playerName: "정현우",
      isWC: false,
    },
  };

  // 초기 스냅샷 GET
  const didFetchUmpireRef = useRef(false);
  // const persistSnapshot = (data: any) => {
  //   try {
  //     localStorage.setItem("snapshot", JSON.stringify(data));
  //     setSnapshotData(data); // recoil 상태도 함께 갱신
  //   } catch {}
  // };
  // const persistSnapshot = (data: any) => {
  //   const boxed = data?.snapshot ? data : { snapshot: data };
  //   try {
  //     localStorage.setItem("snapshot", JSON.stringify(boxed));
  //   } catch {}
  //   setSnapshotData(boxed);
  // };
  const persistSnapshot = (data: any) => updateSnapshot(data);
  // 컴포넌트 상단 어딘가
  const shouldFetchOnThisLoadRef = useRef(false);

  // 마운트 시 이번 로드가 reload인지 판별
  useEffect(() => {
    if (typeof window === "undefined") return;
    const nav = performance.getEntriesByType("navigation")[0] as
      | PerformanceNavigationTiming
      | undefined;

    // reload이면 true, 그 외(navigate/back_forward)는 false
    const isReload =
      nav?.type === "reload" ||
      // 구형 브라우저 fallback (deprecated API)
      // @ts-ignore
      performance?.navigation?.type === 1;

    shouldFetchOnThisLoadRef.current = !!isReload;
  }, []);

  useEffect(() => {
    if (!router.isReady) return;
    const gameId = router.query.recordId;
    if (!gameId) return;
    if (!shouldFetchOnThisLoadRef.current) return;
    (async () => {
      try {
        const res = await API.get(`/games/${gameId}/snapshot/umpire`);
        const data =
          typeof res.data === "string" ? JSON.parse(res.data) : res.data;
        persistSnapshot(data); // → localStorage('snapshot') 저장 + recoil 반영
        updateSnapshot(res.data);
        console.log("GET snapshot/umpire 저장완료");
      } catch (err) {
        console.error("GET snapshot/umpire 실패:", err);
        setError(err as any); // ErrorAlert로 노출
      }
    })();
  }, [router.isReady, router.query.recordId]);

  // 초기 타자 및 주자의 위치
  const [snapshotData, setSnapshotData] = useRecoilState(snapshotState);

  // 읽어오기 경로
  // 공통 뷰(항상 이걸로 접근)
  // const snap = useMemo(
  //   () => (snapshotData?.snapshot ?? snapshotData ?? null) as any,
  //   [snapshotData]
  // );
  // 매 렌더마다 즉시 언랩해서 씀 (메모 안 함)
  const snap = (snapshotData as any)?.snapshot ?? snapshotData ?? null;

  // 공격/수비 판정 (값 없을 땐 안전하게 false)
  const half = snap?.gameSummary?.inningHalf?.toUpperCase?.();

  // 팀/스코어 보드 편의 변수
  const scoreboard = snap?.gameSummary?.scoreboard;
  const awayName = snap?.gameSummary?.awayTeam?.name ?? "";
  const homeName = snap?.gameSummary?.homeTeam?.name ?? "";

  // 현재 타석
  const curAtBat = snap?.currentAtBat;
  const curBatter = curAtBat?.batter;
  const curPitcher = curAtBat?.pitcher;

  // const applySnapshot = useCallback((nextSnap: any) => {
  //   localStorage.setItem("snapshot", JSON.stringify(nextSnap));
  //   setSnapshotData(nextSnap); // ← 이게 ‘단일 진실 소스’
  // }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("snapshot");
      setSnapshotData(raw ? JSON.parse(raw) : null);
    } catch {
      setSnapshotData(null);
    }
  }, []);

  // {snapshotData?.snapshot?.gameSummary?.inningHalf}

  // const half = snap?.gameSummary?.inningHalf?.toUpperCase?.();
  const isHomeAttack = half === "BOT";
  const lineupExample = isHomeAttack ? homeExample : awayExample;

  const [batterPlayerId, setBatterPlayerId] = useState(0);

  // Recoil 상태들

  const [isSubstitutionSwapped, setIsSubstitutionSwapped] = useRecoilState(
    substitutionSwappedState
  );

  // 로딩 상태
  const [isSubmitting, setIsSubmitting] = useState(false);
  // attack 쿼리 동기화를 위한 state
  // const [attackVal, setAttackVal] = useState("");

  // 예시 데이터 객체
  const exampleScores = {
    scoreboard: [
      { inning: 1, inningHalf: "TOP", runs: 1 },
      { inning: 1, inningHalf: "BOT", runs: 1 },
      { inning: 2, inningHalf: "TOP", runs: 2 },
      { inning: 2, inningHalf: "BOT", runs: 1 },
      // { inning: 3, inningHalf: "TOP", runs: 2 },
      // … 3~7 이닝까지 필요하면 추가
    ],
    teamSummary: {
      away: { runs: 3, hits: 5 },
      home: { runs: 1, hits: 4 },
    },
  };

  // 대기타석

  // const onDeckPlayers = lineupExample.batters.filter((b) =>
  //   [1, 2, 3].includes(b.battingOrder)
  // );

  /** waitingBatters → onDeckPlayers */
  const [onDeckPlayers, setOnDeckPlayers] = useState<
    { playerId: number; playerName: string; battingOrder: number }[]
  >([]);

  // useEffect(() => {
  //   setOnDeckPlayers(
  //     (snapshotData?.snapshot?.waitingBatters ?? []).map((b) => ({
  //       playerId: b.id,
  //       playerName: b.name,
  //       battingOrder: b.battingOrder,
  //     }))
  //   );
  // }, [snapshotData]);
  useEffect(() => {
    const wait = (snap?.waitingBatters ?? []) as any[];
    setOnDeckPlayers(
      wait.map((b) => ({
        playerId: b.id, // 서버가 id로 내려줌
        playerName: b.name,
        battingOrder: b.battingOrder,
      }))
    );
  }, [snap?.waitingBatters]);

  // 스코어보드 표시
  const { A: initA, B: initB, nextAttack: initAttack } = getInitialScores();

  const [teamAScores, setTeamAScores] = useState(initA);
  const [teamBScores, setTeamBScores] = useState(initB);
  const [attackVal, setAttackVal] = useState(initAttack);

  /** snapshot.scoreboard → UI 배열 9칸(7이닝 + R/H)으로 변환 */
  /** snapshot.scoreboard → 9칸(7이닝 + R/H) */
  function parseScoreboard(scoreboard: any) {
    const A = Array(9).fill("");
    const B = Array(9).fill("");

    // ⬅️ 1~7 이닝
    scoreboard?.innings?.forEach((inn: any) => {
      const i = inn.inning - 1; // 0-based
      if (i >= 0 && i < 7) {
        A[i] = inn.away ?? "";
        B[i] = inn.home ?? "";
      }
    });

    // ⬅️ 마지막 두 칸(R, H)
    A[7] = scoreboard?.totals?.away?.R ?? "";
    A[8] = scoreboard?.totals?.away?.H ?? "";
    B[7] = scoreboard?.totals?.home?.R ?? "";
    B[8] = scoreboard?.totals?.home?.H ?? "";

    /* 다음 공격 팀 추정용(선택) */
    let nextAttack: "home" | "away" = "away";
    const last = scoreboard?.innings?.[scoreboard.innings.length - 1];
    if (last) nextAttack = last.inningHalf === "TOP" ? "home" : "away";

    return { A, B, nextAttack };
  }

  /* 🚀 snapshot 기반 초기값 생성 함수 */
  // function getInitialScores() {
  //   if (typeof window === "undefined") {
  //     // SSR 경우
  //     return { A: Array(9).fill(""), B: Array(9).fill(""), nextAttack: "away" };
  //   }
  //   try {
  //     const raw = localStorage.getItem("snapshot");

  //     const snap = raw ? JSON.parse(raw) : null;
  //     const sb = snap?.snapshot?.gameSummary?.scoreboard;
  //     if (!sb) throw new Error("scoreboard 없음");
  //     return parseScoreboard(sb);
  //   } catch {
  //     return { A: Array(9).fill(""), B: Array(9).fill(""), nextAttack: "away" };
  //   }
  // }

  // useEffect(() => {
  //   const sb = snapshotData?.snapshot?.gameSummary?.scoreboard;
  //   if (!sb) return;
  //   const { A, B } = parseScoreboard(sb);
  //   setTeamAScores(A);
  //   setTeamBScores(B);
  // }, [snapshotData?.snapshot?.gameSummary?.scoreboard]);
  function getInitialScores() {
    if (typeof window === "undefined") {
      return { A: Array(9).fill(""), B: Array(9).fill(""), nextAttack: "away" };
    }
    try {
      const raw = localStorage.getItem("snapshot");
      const parsed = raw ? JSON.parse(raw) : null;
      const v = parsed?.snapshot ?? parsed;
      const sb = v?.gameSummary?.scoreboard;
      if (!sb) throw new Error("scoreboard 없음");
      return parseScoreboard(sb);
    } catch {
      return { A: Array(9).fill(""), B: Array(9).fill(""), nextAttack: "away" };
    }
  }

  useEffect(() => {
    if (!scoreboard) return;
    const { A, B } = parseScoreboard(scoreboard); // parseScoreboard는 지금 코드 그대로 OK
    setTeamAScores(A);
    setTeamBScores(B);
  }, [scoreboard]);

  // const [attackVal, setAttackVal] = useState(initAttack);

  // ── 마운트 및 의존성 변경 시 호출 ──
  // useEffect(() => {
  //   // 팀 이름 로컬스토리지에서
  //   const matchStr = localStorage.getItem("selectedMatch");
  //   if (matchStr) {
  //     try {
  //       const { awayTeam, homeTeam } = JSON.parse(matchStr);
  //       setTeamAName(awayTeam.name);
  //       setTeamBName(homeTeam.name);
  //     } catch {
  //       // console.error("selectedMatch 파싱 실패");
  //     }
  //   }
  //   fetchInningScores();
  // }, [fetchInningScores]);

  // ── 4) attack 쿼리 실제 동기화 ──
  // useEffect(() => {
  //   if (!recordId) return;
  //   if (router.query.attack !== attackVal) {
  //     router.replace({
  //       pathname: router.pathname,
  //       query: { ...router.query, attack: attackVal },
  //     });
  //   }
  // }, [recordId, attackVal, router.query.attack, router]);

  // 저장 전 배지 이동이 있었는지 (startBase ≠ endBase가 하나라도 있나)
  const [actualRequest, setActualRequest] = useState<RunnerLogEntry[]>([]);
  const [virtualRequest, setVirtualRequest] = useState<RunnerLogEntry[]>([]);
  const [reconstructMode, setReconstructMode] = useState(false);
  const hasAnyMovement = useMemo(() => {
    const entries = reconstructMode
      ? [...actualRequest, ...virtualRequest] // 재구성 모드면 둘 다 체크
      : actualRequest; // 아니면 actual만 체크

    if (entries.length === 0) return false;
    return entries.some((e) => e.startBase !== e.endBase);
  }, [actualRequest, virtualRequest, reconstructMode]);

  const modalMessage = "저장하기를 먼저 눌러주세요";
  // ── 기록 액션 ──
  const handleRecordAction = async (action: string) => {
    if (isSubmitting) return;

    switch (action) {
      case "안타":
        if (hasAnyMovement) {
          alert(modalMessage);
          return;
        }
        setIsHitModalOpen(true);
        break;

      case "사사구":
        if (hasAnyMovement) {
          alert(modalMessage);
          return;
        }
        setIsSubmitting(true);
        try {
          const resultCode = "BB";
          if (!resultCode) {
            console.warn("알 수 없는 종류입니다");
          } else {
            const payload = { resultCode };
            try {
              localStorage.setItem(
                "plateAppearanceResult",
                JSON.stringify(payload)
              );
            } catch (e) {
              console.warn("로컬스토리지 저장 실패:", e);
            }
          }
          // 1) POST 요청

          // [배포 시 다시 켜기]
          // await API.post(
          //   `/games/${recordId}/plate-appearance`,
          //   {
          //     result: "BB",
          //   }

          // );

          // 스코어 재조회
          // await fetchInningScores();

          // 모달 열기 (기존 setIsGroundRecordModalOpen 대신)
          groundModalRef.current?.open();
        } catch (e) {
          // console.error("볼넷/사구 오류:", e);
          setError(e);
          // alert("볼넷/사구 오류");
        } finally {
          setIsSubmitting(false);
        }
        break;

      case "아웃":
        if (hasAnyMovement) {
          alert(modalMessage);
          return;
        }
        setIsOutModalOpen(true);
        break;

      case "etc":
        if (hasAnyMovement) {
          alert(modalMessage);
          return;
        }
        setIsEtcModalOpen(true);
        break;

      default:
        break;
    }
  };

  // ── 교체/공수교대/경기종료 ──
  const handleSubstitutionHome = () => {
    router.push({
      pathname: `/matches/${recordId}/substitution`,
      query: { isHomeTeam: true },
    });
  };

  const handleSubstitutionAway = () => {
    router.push({
      pathname: `/matches/${recordId}/substitution`,
      query: { isHomeTeam: false },
    });
  };

  // ── 모달 상태 ──
  const [isHitModalOpen, setIsHitModalOpen] = useState(false);
  const [isOutModalOpen, setIsOutModalOpen] = useState(false);
  const [isEtcModalOpen, setIsEtcModalOpen] = useState(false);

  const [isGameEndModalOpen, setIsGameEndModalOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState(null);

  // 에러 상태
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    const originalAlert = window.alert;
    window.alert = (msg: string) => {
      setValidationError(msg);
    };
    return () => {
      window.alert = originalAlert;
    };
  }, []);

  // console.log("isHomeAttack", isHomeAttack);

  // -------------------- 드래그앤드롭 ------------------------//
  // 드래그 앤 드롭 관련
  // 베이스 아이디 목록

  // 베이스 <polygon> ref 저장

  const { setNodeRef: set1st } = useDroppable({ id: "first-base" });
  const { setNodeRef: set2nd } = useDroppable({ id: "second-base" });
  const { setNodeRef: set3rd } = useDroppable({ id: "third-base" });
  const { setNodeRef: setHome } = useDroppable({ id: "home-base" });

  // map
  const droppableSetters = {
    "first-base": set1st,
    "second-base": set2nd,
    "third-base": set3rd,
    "home-base": setHome,
  };

  // 수비 배지 설정

  /** 0) 좌표 매핑 (앞서 만든 그대로) */
  const POSITION_COORDS = {
    P: { initialLeft: "50%", initialTop: "55%" },
    C: { initialLeft: "50%", initialTop: "93%" },
    "1B": { initialLeft: "80%", initialTop: "50%" },
    "2B": { initialLeft: "70%", initialTop: "40%" },
    "3B": { initialLeft: "20%", initialTop: "50%" },
    SS: { initialLeft: "30%", initialTop: "40%" },
    LF: { initialLeft: "20%", initialTop: "25%" },
    CF: { initialLeft: "50%", initialTop: "15%" },
    RF: { initialLeft: "80%", initialTop: "25%" },
    DH: { initialLeft: "10%", initialTop: "10%" }, // ⛑ 필요하면 더 추가
  } as const;

  /** 1) 공통 타입 */
  interface Batter {
    id: number;
    name: string;
    position: keyof typeof POSITION_COORDS;
    battingOrder: number;
  }

  // 맨 위 중첩된 POSITION_COORDS 선언부 바로 아래쯤에 추가해주세요
  const POSITION_ORDER = [
    "P",
    "C",
    "1B",
    "2B",
    "3B",
    "SS",
    "LF",
    "CF",
    "RF",
  ] as const;

  // useEffect(() => {
  //   const raw = localStorage.getItem("snapshot");
  //   if (!raw) return;

  //   try {
  //     const { snapshot } = JSON.parse(raw);

  //     // isHomeAttack 이 true 면 away, 아니면 home 라인업 사용
  //     const lineup = isHomeAttack ? snapshot.lineup.away : snapshot.lineup.home;

  //     const { batters, pitcher } = lineup;

  //     const newConfigs: BlackBadgeConfig[] = POSITION_ORDER.map((pos, idx) => {
  //       const player =
  //         pos === "P" ? pitcher : batters.find((b: any) => b.position === pos);

  //       if (!player) {
  //         console.warn(`포지션 ${pos} 선수 찾기 실패.`);
  //         return {
  //           id: `black-badge-${idx + 1}`,
  //           label: "",
  //           initialLeft: POSITION_COORDS[pos].initialLeft,
  //           initialTop: POSITION_COORDS[pos].initialTop,
  //           sportPosition: pos,
  //         };
  //       }

  //       return {
  //         id: `black-badge-${idx + 1}`,
  //         label: player.name,
  //         initialLeft: POSITION_COORDS[pos].initialLeft,
  //         initialTop: POSITION_COORDS[pos].initialTop,
  //         sportPosition: pos,
  //       };
  //     });

  //     setBlackBadgeConfigs(newConfigs);
  //   } catch (e) {
  //     console.error("snapshot 파싱 실패:", e);
  //   }
  // }, [isHomeAttack]);

  // useEffect(() => {
  //   // 스냅샷 구조가 중첩/평면 두 타입을 모두 케어
  //   const snap = snapshotData?.snapshot ?? snapshotData;
  //   if (!snap) return;

  //   const lineup = isHomeAttack ? snap?.lineup?.away : snap?.lineup?.home;
  //   if (!lineup) return;

  //   const posToName: Record<string, string> = {};

  //   // 투수
  //   if (lineup.pitcher?.name) posToName["P"] = lineup.pitcher.name;

  //   // 야수들
  //   (lineup.batters ?? []).forEach((b: any) => {
  //     if (b?.position && b?.name) posToName[b.position] = b.name;
  //   });

  //   // ✅ 좌표(initialLeft/Top)와 sportPosition(스왑 결과)을 유지한 채 라벨만 업데이트
  //   setBlackBadgeConfigs((prev) =>
  //     prev.map((cfg) => ({
  //       ...cfg,
  //       label: posToName[cfg.sportPosition] ?? "", // 포지션→이름 매핑
  //     }))
  //   );

  //   // 선택: 라벨만 바꾸는 거라면 blackPositions 초기화는 필요 없음
  // }, [
  //   isHomeAttack,
  //   snapshotData?.snapshot?.lineup?.home,
  //   snapshotData?.snapshot?.lineup?.away,
  //   // 스냅샷이 평면형이면 ↓ 이렇게 넓게 걸어도 됨
  //   snapshotData,
  // ]);
  useEffect(() => {
    const lineup = isHomeAttack ? snap?.lineup?.away : snap?.lineup?.home;
    if (!lineup) return;

    const posToName: Record<string, string> = {};
    if (lineup.pitcher?.name) posToName["P"] = lineup.pitcher.name;
    (lineup.batters ?? []).forEach((b: any) => {
      if (b?.position && b?.name) posToName[b.position] = b.name;
    });

    setBlackBadgeConfigs((prev) =>
      prev.map((cfg) => ({ ...cfg, label: posToName[cfg.sportPosition] ?? "" }))
    );
  }, [isHomeAttack, snap?.lineup?.home, snap?.lineup?.away]);

  interface BlackBadgeConfig {
    id: string;
    label: string;
    initialLeft: string;
    initialTop: string;
    sportPosition: string; // 스포츠 포지션 (string)
  }
  // ▶️ 1) config 를 state 로

  const [blackBadgeConfigs, setBlackBadgeConfigs] = useState<
    BlackBadgeConfig[]
  >([
    {
      id: "black-badge-1",
      label: "원태인",
      initialLeft: "50%",
      initialTop: "55%",
      sportPosition: "P",
    },
    {
      id: "black-badge-2",
      label: "강민호",
      initialLeft: "50%",
      initialTop: "93%",
      sportPosition: "C",
    },
    {
      id: "black-badge-3",
      label: "박병호",
      initialLeft: "80%",
      initialTop: "50%",
      sportPosition: "1B",
    },
    {
      id: "black-badge-4",
      label: "류지혁",
      initialLeft: "70%",
      initialTop: "40%",
      sportPosition: "2B",
    },
    {
      id: "black-badge-5",
      label: "김영웅",
      initialLeft: "20%",
      initialTop: "50%",
      sportPosition: "3B",
    },
    {
      id: "black-badge-6",
      label: "이재현",
      initialLeft: "30%",
      initialTop: "40%",
      sportPosition: "SS",
    },
    {
      id: "black-badge-7",
      label: "구자욱",
      initialLeft: "20%",
      initialTop: "25%",
      sportPosition: "LF",
    },
    {
      id: "black-badge-8",
      label: "김지찬",
      initialLeft: "50%",
      initialTop: "15%",
      sportPosition: "CF",
    },
    {
      id: "black-badge-9",
      label: "김성윤",
      initialLeft: "80%",
      initialTop: "25%",
      sportPosition: "RF",
    },
  ]);

  // 수비 교체 로직
  // 검정 배지 위치 누적량 관리
  // 컴포넌트 최상단에

  const blackBadgeRefs = useRef<Record<string, HTMLElement | null>>({});
  const initialAnchors = useRef<Record<string, { x: number; y: number }>>({});
  const initialBlackPositions = blackBadgeConfigs.reduce(
    (acc, { id }) => ({ ...acc, [id]: { x: 0, y: 0 } }),
    {} as Record<string, { x: number; y: number }>
  );

  const [blackPositions, setBlackPositions] = useState(initialBlackPositions);

  // ── 2️⃣ 마운트 직후 wrapper 크기 얻어서 초기 anchor 계산 ──
  useLayoutEffect(() => {
    const wrapEl = wrapperRef.current;
    if (!wrapEl) return;
    const { left, top, width, height } = wrapEl.getBoundingClientRect();
    blackBadgeConfigs.forEach(({ id, initialLeft, initialTop }) => {
      const pctX = parseFloat(initialLeft) / 100;
      const pctY = parseFloat(initialTop) / 100;
      initialAnchors.current[id] = {
        x: left + width * pctX,
        y: top + height * pctY,
      };
    });
    // initialize blackPositions to zero-offsets
    setBlackPositions(
      blackBadgeConfigs.reduce((acc, { id }) => {
        acc[id] = { x: 0, y: 0 };
        return acc;
      }, {} as Record<string, { x: number; y: number }>)
    );
  }, [blackBadgeConfigs]);

  function BlackDraggableBadge({
    cfg,
    pos,
  }: {
    cfg: BlackBadgeConfig;
    pos: { x: number; y: number };
  }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } =
      useDraggable({
        id: cfg.id,
      });

    // dnd-kit nodeRef + our ref 동시 설정
    const combinedRef = (el: HTMLElement | null) => {
      setNodeRef(el);
      blackBadgeRefs.current[cfg.id] = el;
    };
    // 누적 + 현재 드래그 중인 오프셋
    const dx = pos.x + (transform?.x ?? 0);
    const dy = pos.y + (transform?.y ?? 0);

    return (
      <NameBadge
        ref={combinedRef}
        {...attributes}
        {...listeners}
        style={{
          position: "absolute",
          left: cfg.initialLeft,
          top: cfg.initialTop,

          transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`,
          background: "#000000",
          color: "#fff",
          border: "0.3px solid #ffffff",
          cursor: "grab",
        }}
      >
        {cfg.label}
        {/* ({cfg.sportPosition}) */}
      </NameBadge>
    );
  }
  // ▶️ 3) handleBlackDragEnd: swap 로직 수정
  // ▶️ 3) swap 포함 drag end 핸들러
  function handleBlackDragEnd(event: DragEndEvent) {
    const id = event.active.id as string;
    const prevOff = blackPositions[id];
    const dx = event.delta?.x ?? 0;
    const dy = event.delta?.y ?? 0;
    const newOff = { x: prevOff.x + dx, y: prevOff.y + dy };
    const el = blackBadgeRefs.current[id];
    if (el) {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      for (const otherId of Object.keys(blackBadgeRefs.current)) {
        if (otherId === id) continue;
        const otherRect =
          blackBadgeRefs.current[otherId]!.getBoundingClientRect();
        if (
          cx >= otherRect.left &&
          cx <= otherRect.right &&
          cy >= otherRect.top &&
          cy <= otherRect.bottom
        ) {
          // swap both configs and their sportPosition
          setBlackBadgeConfigs((prev) => {
            const a = prev.findIndex((c) => c.id === id);
            const b = prev.findIndex((c) => c.id === otherId);
            const copy = [...prev];
            [copy[a].initialLeft, copy[b].initialLeft] = [
              copy[b].initialLeft,
              copy[a].initialLeft,
            ];
            [copy[a].initialTop, copy[b].initialTop] = [
              copy[b].initialTop,
              copy[a].initialTop,
            ];
            [copy[a].sportPosition, copy[b].sportPosition] = [
              copy[b].sportPosition,
              copy[a].sportPosition,
            ];
            return copy;
          });
          // reset offsets to zero so new anchors apply
          setBlackPositions((prev) => ({
            ...prev,
            [id]: { x: 0, y: 0 },
            [otherId]: { x: 0, y: 0 },
          }));
          return;
        }
      }
    }
    // ── swap 없을 때: offset을 (0,0)으로 초기화하여 초기 위치로 복귀
    setBlackPositions((prev) => ({
      ...prev,
      [id]: { x: 0, y: 0 },
    }));
  }

  // console.log("blackBadgeConfigs", blackBadgeConfigs);

  const diamondSvgRef = useRef<SVGSVGElement | null>(null);
  const diamondPolyRef = useRef<SVGPolygonElement | null>(null);

  // const [isOutside, setIsOutside] = useState(false);

  // 배지별 스냅 정보 관리
  type SnapInfo = { base: BaseId; pos: { xPct: number; yPct: number } };
  // 1) 초기 스냅 상태를 미리 저장해 두고…
  const initialBadgeSnaps = badgeConfigs.reduce((acc, cfg) => {
    acc[cfg.id] = null;
    return acc;
  }, {} as Record<string, SnapInfo | null>);

  // 2) useState 초기값에 사용
  const [badgeSnaps, setBadgeSnaps] =
    useState<Record<string, SnapInfo | null>>(initialBadgeSnaps);

  // console.log("badgeSnaps", badgeSnaps);

  // 2) badgeSnaps 상태가 바뀔 때마다 각 베이스가 채워졌는지 체크하는 useEffect
  // useEffect(() => {
  //   // badgeSnaps: Record<badgeId, { base: BaseId; pos: { x, y } } | null>
  //   const occupancy: Record<BaseId, boolean> = BASE_IDS.reduce((acc, base) => {
  //     // badgeSnaps 중에 baseId === base 인 항목이 하나라도 있으면 true
  //     acc[base] = Object.values(badgeSnaps).some((snap) => snap?.base === base);
  //     return acc;
  //   }, {} as Record<BaseId, boolean>);

  //   console.log("Base occupancy:", occupancy);
  //   // 예: { "first-base": true, "second-base": false, ... }
  // }, [badgeSnaps]);
  // 센서 정의
  const sensors = useSensors(useSensor(PointerSensor));

  const badgeRefs = useRef<Record<string, HTMLElement | null>>({});
  const [activeBadges, setActiveBadges] = useState(
    badgeConfigs.map((cfg) => cfg.id)
  );

  // 드래그 종료 시 스냅 처리

  // -------------------- 성능 최적화용 refs --------------------

  const DraggableBadge = ({
    id,
    label,
    initialLeft,
    initialTop,
    snapInfo,
  }: {
    id: string;
    label: string;
    initialLeft: string;
    initialTop: string;
    snapInfo: SnapInfo | null;
  }) => {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
      id,
    });
    // console.log("main badge render");
    const combinedRef = (el: HTMLElement | null) => {
      setNodeRef(el);
      badgeRefs.current[id] = el;
    };

    const isWhite = !id.startsWith("black-badge");
    const dragging = !!transform;

    // 1) 스냅 좌표
    const left = snapInfo && isWhite ? `${snapInfo.pos.xPct}%` : initialLeft;
    const top = snapInfo && isWhite ? `${snapInfo.pos.yPct}%` : initialTop;

    // 2) transform: 드래그 중일 때만 델타 적용
    const styleTransform = dragging
      ? `translate(-50%, -50%) translate3d(${transform!.x}px, ${
          transform!.y
        }px, 0)`
      : `translate(-50%, -50%)`;

    return (
      <NameBadge
        id={id}
        ref={combinedRef}
        style={{
          position: "absolute",
          left,
          top,
          transform: styleTransform,
        }}
        {...attributes}
        {...listeners}
      >
        {label}
      </NameBadge>
    );
  };

  const onAnyDragEnd = (e: DragEndEvent) => {
    handleDrop(e);
    // 드래그가 끝날 때 (항상) Ground 강조 해제
    groundRef.current?.classList.remove("out-zone-active");
    // 깔끔하게 리셋
    prevOutsideRef.current = false;
    // setIsOutside(false);
  };

  const [applyResetSnapshot, setApplyResetSnapshot] = useState(false);

  // 주자 모달 창
  // const [isGroundRecordModalOpen, setIsGroundRecordModalOpen] = useState(false);

  // 아웃존 설정
  // 1) ref 선언
  const originCenters = useRef<Record<string, { x: number; y: number }>>({});
  // ① Ground용 ref 선언
  const groundRef = useRef<HTMLDivElement | null>(null);

  // const [isOutside, setIsOutside] = useState(false);
  const prevOutsideRef = useRef(false);
  const rafIdRef = useRef<number | null>(null);

  function handleDragStart(event: DragStartEvent) {
    const id = String(event.active.id);
    const el = badgeRefs.current[id];
    if (!el) return;

    // 여기서만 한 번만 읽어 온다!
    const rect = el.getBoundingClientRect();
    originCenters.current[id] = {
      x: rect.left + rect.width / 2, // 요소의 화면상 중앙 X
      y: rect.top + rect.height / 2, // 요소의 화면상 중앙 Y
    };
  }

  const customBoundsRef = useRef<HTMLDivElement>(null);

  const restrictToCustomBoundsFn = useCallback<Modifier>((args) => {
    const { transform, draggingNodeRect } = args;
    if (!draggingNodeRect) return transform;
    const boundsEl = customBoundsRef.current;
    if (!boundsEl) return transform;

    const { width: nodeW, height: nodeH } = draggingNodeRect;
    const bounds = boundsEl.getBoundingClientRect();

    const newLeft = draggingNodeRect.left + transform.x;
    const newTop = draggingNodeRect.top + transform.y;

    const minX = bounds.left;
    const maxX = bounds.right - nodeW;
    const minY = bounds.top;
    const maxY = bounds.bottom - nodeH;

    const clampedX = Math.min(Math.max(newLeft, minX), maxX);
    const clampedY = Math.min(Math.max(newTop, minY), maxY);

    return {
      ...transform,
      x: transform.x + (clampedX - newLeft),
      y: transform.y + (clampedY - newTop),
    };
  }, []);
  const dynamicBoundary = useMemo<Modifier>(() => {
    return (args) => {
      if (!args.active) return args.transform;
      return restrictToCustomBoundsFn(args);
    };
  }, [restrictToCustomBoundsFn]);

  const modifiers = useMemo(() => [dynamicBoundary], [dynamicBoundary]);

  const [isHomeBaseActive, setIsHomeBaseActive] = useState(false);

  // const RUN_SEQUENCE: BaseId[] = [
  //   "first-base",
  //   "second-base",
  //   "third-base",
  //   "home-base",
  // ];

  // 배지별로 지금까지 "순서대로" 스냅된 베이스 목록을 저장 (삭제하지 않고 유지)
  const snappedSeqRef = useRef<Record<string, BaseId[]>>(
    badgeConfigs.reduce((acc, { id }) => {
      acc[id] = [];
      return acc;
    }, {} as Record<string, BaseId[]>)
  );

  // 다음에 가야 할(스냅해야 할) 베이스
  // const nextRequiredBase = (badgeId: string): BaseId => {
  //   const seq = snappedSeqRef.current[badgeId];
  //   return RUN_SEQUENCE[Math.min(seq.length, RUN_SEQUENCE.length - 1)];
  // };

  // ─────────────────────────────────────────────
  // 1) 좌표 자동 캐싱 훅 (ResizeObserver + window 이벤트) //
  // 한번만 하면 되니까 성능에 좋다
  // ─────────────────────────────────────────────
  const wrapperRef = useRef<HTMLDivElement>(null);
  const outZoneRef = useRef<HTMLDivElement>(null);
  const baseRefs = useRef<Record<BaseId, SVGPolygonElement | null>>({
    "first-base": null,
    "second-base": null,
    "third-base": null,
    "home-base": null,
  });

  // ✅ 여기서 훅 호출
  const { wrapperRectRef, zoneRectRef, baseRectsRef, refreshRects } =
    useRectsCache(wrapperRef, outZoneRef, baseRefs, BASE_IDS);

  // ─────────────────────────────────────────────
  // 2) 드롭 순간만 검사/스냅
  // ─────────────────────────────────────────────

  const [runnerInfoByBadgeActual, setRunnerInfoByBadgeActual] = useState<
    Record<string, { runnerId: number; name: string }>
  >({});
  const [runnerInfoByBadgeVirtual, setRunnerInfoByBadgeVirtual] = useState<
    Record<string, { runnerId: number; name: string }>
  >({});

  const runnerInfoByBadge = reconstructMode
    ? runnerInfoByBadgeVirtual
    : runnerInfoByBadgeActual;
  const [baseToBadgeIdActual, setBaseToBadgeIdActual] = useState<
    Record<number, string>
  >({});
  const [baseToBadgeIdVirtual, setBaseToBadgeIdVirtual] = useState<
    Record<number, string>
  >({});
  const baseToBadgeId = reconstructMode
    ? baseToBadgeIdVirtual
    : baseToBadgeIdActual;

  const setRunnerInfoByBadgeCurrent = reconstructMode
    ? setRunnerInfoByBadgeVirtual
    : setRunnerInfoByBadgeActual;
  const setBaseToBadgeIdCurrent = reconstructMode
    ? setBaseToBadgeIdVirtual
    : setBaseToBadgeIdActual;

  // 베이스 아이디 목록
  // const [isOpen, setIsOpen] = useState(false);
  const [currentBatterName, setCurrentBatterName] = useState<string | null>(
    null
  );

  const [currentBatterId, setCurrentBatterId] = useState<number | null>(null);
  const EXCLUDED_RUNNER_ID = -1;
  const EXCLUDED_BASE_CODE = "0";
  const isExcludedBadge = (badgeId: string) => {
    const info = reconstructMode
      ? runnerInfoByBadgeVirtual[badgeId]
      : runnerInfoByBadgeActual[badgeId];
    return info?.runnerId === EXCLUDED_RUNNER_ID;
  };

  // 초기 타자 및 주자의 위치

  const initialSnapsRef = useRef<Record<string, SnapInfo | null>>({});

  // 스냅샷 로딩하기
  // useEffect(() => {
  //   // if (!isOpen) return;

  //   try {
  //     const raw = localStorage.getItem("snapshot");
  //     const parsed = raw ? JSON.parse(raw) : null;
  //     setSnapshotData(parsed);
  //     console.log("loaded snapshot from localStorage:", parsed);

  //     const batterName =
  //       parsed?.snapshot?.currentAtBat?.batter?.name ??
  //       parsed?.currentAtBat?.batter?.name ??
  //       null;
  //     const batterId =
  //       parsed?.snapshot?.currentAtBat?.batter?.id ??
  //       parsed?.currentAtBat?.batter?.id ??
  //       null;
  //     setCurrentBatterName(batterName);
  //     setCurrentBatterId(batterId);
  //   } catch (e) {
  //     console.warn("snapshot 파싱 에러:", e);
  //     setCurrentBatterName(null);
  //     setCurrentBatterId(null);
  //     setSnapshotData(null);
  //   }
  // }, []);
  // useEffect(() => {
  //   const s = snapshotData?.snapshot ?? snapshotData;
  //   setCurrentBatterName(s?.currentAtBat?.batter?.name ?? null);
  //   setCurrentBatterId(s?.currentAtBat?.batter?.id ?? null);
  // }, [
  //   snapshotData?.snapshot?.currentAtBat?.batter?.id,
  //   snapshotData?.snapshot?.currentAtBat?.batter?.name,
  //   snapshotData,
  // ]);

  // ✅ 부팅용 하이드레이션: 이거 하나만 남기기
  useEffect(() => {
    try {
      const raw = localStorage.getItem("snapshot");
      if (!raw) return; // 없으면 굳이 null로 덮지 말고 그대로 둠
      setSnapshotData(JSON.parse(raw));
    } catch (e) {
      console.warn("snapshot parse failed", e);
    }
  }, [setSnapshotData]);

  // ✅ 서버/모달 등에서 새 스냅샷 받으면 이 함수로만 업데이트
  // const updateSnapshot = useCallback(
  //   (next: any) => {
  //     setSnapshotData(next);
  //     try {
  //       localStorage.setItem("snapshot", JSON.stringify(next));
  //     } catch {}
  //   },
  //   [setSnapshotData]
  // );

  const updateSnapshot = useCallback((next: any) => {
    const boxed = next?.snapshot ? next : { snapshot: next };
    setSnapshotData((prev) => (prev === boxed ? { ...boxed } : boxed)); // 새 레퍼런스 보장
    try {
      localStorage.setItem("snapshot", JSON.stringify(boxed));
    } catch {}
  }, []);

  // 타자 이름 바꾸기
  // useEffect(() => {
  //   const s = snapshotData?.snapshot ?? snapshotData;
  //   setCurrentBatterName(s?.currentAtBat?.batter?.name ?? null);
  //   setCurrentBatterId(s?.currentAtBat?.batter?.id ?? null);
  // }, [
  //   snapshotData?.snapshot?.currentAtBat?.batter?.id,
  //   snapshotData?.snapshot?.currentAtBat?.batter?.name,
  //   snapshotData,
  // ]);
  // 현재 타자
  useEffect(() => {
    setCurrentBatterName(snap?.currentAtBat?.batter?.name ?? null);
    setCurrentBatterId(snap?.currentAtBat?.batter?.id ?? null);
  }, [snap?.currentAtBat?.batter?.id, snap?.currentAtBat?.batter?.name]);

  // 베이스 코드 변환

  type BaseId = "first-base" | "second-base" | "third-base" | "home-base";

  // 확장된 변환 함수: SnapInfo, 숫자, null 모두 처리
  const getBaseCode = (
    input: { base: BaseId } | number | null | undefined
  ): string => {
    let baseId: BaseId | null = null;

    if (input == null) {
      return "B";
    }

    if (typeof input === "number") {
      switch (input) {
        case 1:
          baseId = "first-base";
          break;
        case 2:
          baseId = "second-base";
          break;
        case 3:
          baseId = "third-base";
          break;
        case 4:
          baseId = "home-base";
          break;
        default:
          baseId = null;
      }
    } else if ("base" in input) {
      baseId = input.base;
    }

    if (!baseId) return "B";

    switch (baseId) {
      case "first-base":
        return "1";
      case "second-base":
        return "2";
      case "third-base":
        return "3";
      case "home-base":
        return "H";
      default:
        return "B";
    }
  };

  const [outBadges, setOutBadges] = useState<Set<string>>(new Set());
  const [outBadgesActual, setOutBadgesActual] = useState<Set<string>>(
    new Set()
  );
  const [outBadgesVirtual, setOutBadgesVirtual] = useState<Set<string>>(
    new Set()
  );

  const [homeSnappedBadgesActual, setHomeSnappedBadgesActual] = useState<
    Set<string>
  >(new Set());
  const [homeSnappedBadgesVirtual, setHomeSnappedBadgesVirtual] = useState<
    Set<string>
  >(new Set());
  const homeSnappedBadges = reconstructMode
    ? homeSnappedBadgesVirtual
    : homeSnappedBadgesActual;
  const setHomeSnappedBadgesCurrent = reconstructMode
    ? setHomeSnappedBadgesVirtual
    : setHomeSnappedBadgesActual;

  function computeBaseOccupancy(
    badgeSnaps: Record<string, { base: BaseId } | null>
  ): Record<BaseId, boolean> {
    const BASE_IDS: readonly BaseId[] = [
      "first-base",
      "second-base",
      "third-base",
      "home-base",
    ];
    return BASE_IDS.reduce((acc, base) => {
      acc[base] = Object.values(badgeSnaps).some((snap) => snap?.base === base);
      return acc;
    }, {} as Record<BaseId, boolean>);
  }

  const getRunnersOnBase = useCallback(() => {
    const actual = snap?.inningStats?.actual?.runnersOnBase ?? [];
    const virtual = snap?.inningStats?.virtual?.runnersOnBase ?? [];
    return reconstructMode ? virtual : actual;
  }, [snap, reconstructMode]);

  const badgeSnapsRef = useRef<typeof badgeSnaps>(badgeSnaps);

  // useEffect(() => {
  //   badgeSnapsRef.current = badgeSnaps;
  // }, [badgeSnaps]);
  const scheduleOccupancyLog = () => {
    requestAnimationFrame(() => {
      const occ = computeBaseOccupancy(badgeSnapsRef.current);
      // console.log("Base occupancy after handleDrop:", occ);
    });
  };

  const outBadgesCurrent = reconstructMode ? outBadgesVirtual : outBadgesActual;
  const allWhiteBadges = useMemo(
    () =>
      badgeConfigs.filter(
        (cfg) =>
          !cfg.id.startsWith("black-badge") &&
          (activeBadges.includes(cfg.id) ||
            outBadgesCurrent.has(cfg.id) ||
            homeSnappedBadges.has(cfg.id))
      ),
    [activeBadges, outBadgesCurrent, homeSnappedBadges]
  );
  const batterWhiteBadgeId = useMemo(
    () => allWhiteBadges[0]?.id ?? null,
    [allWhiteBadges]
  );

  const [finishedBadgesActual, setFinishedBadgesActual] = useState<Set<string>>(
    new Set()
  );
  const [finishedBadgesVirtual, setFinishedBadgesVirtual] = useState<
    Set<string>
  >(new Set());

  const finishedBadges = reconstructMode
    ? finishedBadgesVirtual
    : finishedBadgesActual;
  const setFinishedBadgesCurrent = reconstructMode
    ? setFinishedBadgesVirtual
    : setFinishedBadgesActual;

  // 실제 / 재구성 기준으로 배지 매핑 및 스냅 초기화
  const syncRunnersOnBase = useCallback(() => {
    // 1. 원본 runners 가져오기 (actual / virtual 구분은 getRunnersOnBase가 처리)
    const rawRunners = getRunnersOnBase();
    if (rawRunners.length === 0) {
      // 주자 전부 숨김 + 스냅 해제
      setRunnerInfoByBadgeCurrent({});
      setBadgeSnaps((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((id) => {
          next[id] = null;
        });
        return next;
      });
      return; // ← 여기서 끝내되, "정리"는 반드시 수행
    }

    // 2. 홈에 완료된 배지들에 대응하는 runnerId들을 수집 → 제외 대상
    const homeSnappedSet = reconstructMode
      ? homeSnappedBadgesVirtual
      : homeSnappedBadgesActual;
    const runnerInfoMap = reconstructMode
      ? runnerInfoByBadgeVirtual
      : runnerInfoByBadgeActual;

    const finishedRunnerIds = Array.from(homeSnappedSet)
      .map((badgeId) => runnerInfoMap[badgeId]?.runnerId)
      .filter((id): id is number => id != null && id !== EXCLUDED_RUNNER_ID);

    // 3. 홈 완료된 주자들을 제거한 실제 sync 대상 runners
    const runners = (rawRunners as any[]).filter(
      (r) => !finishedRunnerIds.includes(r.id)
    );
    if (runners.length === 0) return;

    const baseMap: Record<number, BaseId> = {
      1: "first-base",
      2: "second-base",
      3: "third-base",
    };

    // 4. 타자/주자 후보 (finishedBadges는 mode-aware)
    const whiteBadgeCandidates = badgeConfigs
      .filter(
        (cfg) =>
          !cfg.id.startsWith("black-badge") &&
          activeBadges.includes(cfg.id) &&
          !finishedBadges.has(cfg.id)
      )
      .map((cfg) => cfg.id);
    const availableRunnerBadges = whiteBadgeCandidates.filter(
      (id) => id !== batterWhiteBadgeId
    );

    // 5. baseToBadgeId 갱신
    const newMap: Record<number, string> = { ...baseToBadgeId };
    const usedBadges = new Set(Object.values(newMap));

    runners.forEach((runner: any) => {
      if (!newMap[runner.base]) {
        const candidate = availableRunnerBadges.find((b) => !usedBadges.has(b));
        if (candidate) {
          newMap[runner.base] = candidate;
          usedBadges.add(candidate);
        }
      }
    });

    if (JSON.stringify(newMap) !== JSON.stringify(baseToBadgeId)) {
      setBaseToBadgeIdCurrent(newMap);
    }

    // 6. 스냅 초기화 및 runnerInfo 설정
    runners.forEach((runner: any) => {
      const baseId = baseMap[runner.base];
      if (!baseId) return;
      const badgeId = newMap[runner.base];
      if (!badgeId) return;

      const tryInit = () => {
        const wrapperEl = wrapperRef.current;
        const baseRect = baseRectsRef.current[baseId];
        if (!wrapperEl || !baseRect) {
          requestAnimationFrame(tryInit);
          return;
        }

        const wrapperRect = wrapperEl.getBoundingClientRect();
        const x = baseRect.left + baseRect.width / 2 - wrapperRect.left;
        const y = baseRect.top + baseRect.height / 2 - wrapperRect.top;

        const snap: SnapInfo = {
          base: baseId,
          pos: {
            xPct: (x / wrapperRect.width) * 100,
            yPct: (y / wrapperRect.height) * 100,
          },
        };

        initialSnapsRef.current[badgeId] = snap;
        setBadgeSnaps((prev) => ({ ...prev, [badgeId]: snap }));
        setRunnerInfoByBadgeCurrent((prev) => ({
          ...prev,
          [badgeId]: { runnerId: runner.id, name: runner.name },
        }));
      };
      tryInit();
    });

    // 7. 할당 상황 로그용 객체 구성
    const baseAssignment: Record<
      BaseId,
      { runnerId: number; name: string; badgeId: string } | null
    > = {
      "first-base": null,
      "second-base": null,
      "third-base": null,
      "home-base": null,
    };

    runners.forEach((runner: any) => {
      const baseId = baseMap[runner.base];
      if (!baseId) return;
      const badgeId = newMap[runner.base];
      if (!badgeId) return;
      baseAssignment[baseId] = {
        runnerId: runner.id,
        name: runner.name,
        badgeId,
      };
    });

    // 8. 매핑되지 않은 후보 배지들은 excluded 처리
    const mappedBadges = new Set(Object.values(newMap));
    whiteBadgeCandidates
      .filter((id) => id !== batterWhiteBadgeId)
      .forEach((badgeId) => {
        if (!mappedBadges.has(badgeId)) {
          setRunnerInfoByBadgeCurrent((prev) => {
            const existing = prev[badgeId];
            if (existing && existing.runnerId === EXCLUDED_RUNNER_ID)
              return prev;
            return {
              ...prev,
              [badgeId]: { runnerId: EXCLUDED_RUNNER_ID, name: "할당 제외" },
            };
          });
        }
      });

    // console.log(
    //   `runner assignment (${reconstructMode ? "virtual" : "actual"}):`,
    //   baseAssignment
    // );
  }, [
    getRunnersOnBase,
    activeBadges,
    batterWhiteBadgeId,
    baseToBadgeId,
    refreshRects,
    reconstructMode,
    homeSnappedBadgesActual,
    homeSnappedBadgesVirtual,
    runnerInfoByBadgeActual,
    runnerInfoByBadgeVirtual,
    finishedBadges,
    badgeConfigs,
  ]);

  const loadSnapshot = useCallback(() => {
    try {
      const raw = localStorage.getItem("snapshot");
      const parsed = raw ? JSON.parse(raw) : null;
      setSnapshotData(parsed);

      const batterName =
        parsed?.snapshot?.currentAtBat?.batter?.name ??
        parsed?.currentAtBat?.batter?.name ??
        null;
      const batterId =
        parsed?.snapshot?.currentAtBat?.batter?.id ??
        parsed?.currentAtBat?.batter?.id ??
        null;
      setCurrentBatterName(batterName);
      setCurrentBatterId(batterId);
    } catch (e) {
      console.warn("snapshot 파싱 에러:", e);
      setSnapshotData(null);
      setCurrentBatterName(null);
      setCurrentBatterId(null);
    }
  }, []);

  const resetWhiteBadges = useCallback(() => {
    unstable_batchedUpdates(() => {
      loadSnapshot();

      // refs 초기화 (이전 스냅/순서 제거)
      initialSnapsRef.current = badgeConfigs.reduce((acc, c) => {
        acc[c.id] = null;
        return acc;
      }, {} as Record<string, SnapInfo | null>);
      snappedSeqRef.current = badgeConfigs.reduce((acc, c) => {
        acc[c.id] = [];
        return acc;
      }, {} as Record<string, BaseId[]>);

      // 상태 초기화
      setBadgeSnaps(
        badgeConfigs.reduce((acc, c) => {
          acc[c.id] = null;
          return acc;
        }, {} as Record<string, SnapInfo | null>)
      );
      setActiveBadges(badgeConfigs.map((c) => c.id));
      setOutBadgesActual(new Set());
      setOutBadgesVirtual(new Set());
      setRunnerInfoByBadgeActual({});
      setRunnerInfoByBadgeVirtual({});
      setBaseToBadgeIdActual({});
      setBaseToBadgeIdVirtual({});
      setFinishedBadgesActual(new Set());
      setFinishedBadgesVirtual(new Set());
      setHomeSnappedBadgesActual(new Set());
      setHomeSnappedBadgesVirtual(new Set());
    });

    // 초기 로딩과 동일하게 snapshot 기반 sync 한 번만 수행
    requestAnimationFrame(() => {
      syncRunnersOnBase();

      // sync 결과가 반영된 badgeSnaps를 기준으로 initialSnaps / snappedSeq도 갱신
      initialSnapsRef.current = { ...badgeSnapsRef.current };
      badgeConfigs.forEach(({ id }) => {
        const snap = badgeSnapsRef.current[id];
        snappedSeqRef.current[id] = snap ? [snap.base] : [];
      });
    });
  }, [loadSnapshot, badgeConfigs, syncRunnersOnBase]);

  useEffect(() => {
    // 두 번의 requestAnimationFrame을 써서 setState → 커밋 → 렌더 → 다음 paint 이후에 정확히 측정
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const occ = computeBaseOccupancy(badgeSnapsRef.current);
        // console.log(
        //   `Base occupancy after reconstructMode=${reconstructMode}:`,
        //   occ
        // );
      });
    });
  }, [reconstructMode]);

  const runnersSig = useMemo(
    () =>
      JSON.stringify({
        a: snap?.inningStats?.actual?.runnersOnBase ?? [],
        v: snap?.inningStats?.virtual?.runnersOnBase ?? [],
      }),
    [
      snap?.inningStats?.actual?.runnersOnBase,
      snap?.inningStats?.virtual?.runnersOnBase,
    ]
  );

  useEffect(() => {
    if (!snapshotData) return;
    syncRunnersOnBase();
  }, [runnersSig, snapshotData, reconstructMode]);

  // useEffect(() => {
  //   if (!snapshotData) return;
  //   syncRunnersOnBase();
  // }, [snapshotData]);

  const handleDrop = (e: DragEndEvent) => {
    const badgeId = e.active.id as string;

    // 검정 배지: 기존 자리 스왑 로직
    if (badgeId.startsWith("black-badge")) {
      handleBlackDragEnd(e);
      return;
    }
    const badgeEl = badgeRefs.current[badgeId];
    const wrapperRect = wrapperRectRef.current;
    const zoneRect = zoneRectRef.current;
    if (!badgeEl || !wrapperRect) return;

    const { left, top, width, height } = badgeEl.getBoundingClientRect();
    const cx = left + width / 2;
    const cy = top + height / 2;

    // 아웃존 바깥 드롭 시: O 처리
    if (
      zoneRect &&
      (cx < zoneRect.left ||
        cx > zoneRect.right ||
        cy < zoneRect.top ||
        cy > zoneRect.bottom)
    ) {
      if (reconstructMode) {
        setOutBadgesVirtual((prev) => {
          const next = new Set(prev);
          next.add(badgeId);
          return next;
        });
      } else {
        setOutBadgesActual((prev) => {
          const next = new Set(prev);
          next.add(badgeId);
          return next;
        });
      }
      setActiveBadges((prev) => {
        const next = prev.filter((id) => id !== badgeId);
        const whiteLeft = next.filter(
          (id) => !id.startsWith("black-badge")
        ).length;
        return whiteLeft > 0 ? next : prev;
      });
      setBadgeSnaps((prev) => ({ ...prev, [badgeId]: null }));
      groundRef.current?.classList.remove("out-zone-active");
      scheduleOccupancyLog();
      return;
    }

    let dropBase: BaseId | null = null;
    let baseRect: DOMRect | undefined;

    // helper: 두 사각형의 겹친 면적 계산
    const computeOverlapArea = (
      a: { left: number; top: number; right: number; bottom: number },
      b: { left: number; top: number; right: number; bottom: number }
    ) => {
      const xOverlap = Math.max(
        0,
        Math.min(a.right, b.right) - Math.max(a.left, b.left)
      );
      const yOverlap = Math.max(
        0,
        Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)
      );
      return xOverlap * yOverlap;
    };
    // helper: 점이 사각형 안에 있는지
    const pointInRect = (
      point: { x: number; y: number },
      rect: { left: number; top: number; right: number; bottom: number }
    ) => {
      return (
        point.x >= rect.left &&
        point.x <= rect.right &&
        point.y >= rect.top &&
        point.y <= rect.bottom
      );
    };

    const SNAP_PADDING = 8; // 주변 여유
    const MAX_CENTER_DISTANCE = 40; // 중심 거리 허용치

    const badgeRect = badgeEl.getBoundingClientRect();
    const badgeBox = {
      left: badgeRect.left,
      top: badgeRect.top,
      right: badgeRect.right,
      bottom: badgeRect.bottom,
    };
    const badgeCenter = {
      x: badgeRect.left + badgeRect.width / 2,
      y: badgeRect.top + badgeRect.height / 2,
    };

    type Candidate = {
      base: BaseId;
      baseRect: DOMRect;
      overlap: number;
      centerDist: number;
    };
    const candidates: Candidate[] = [];

    for (const b of BASE_IDS) {
      const rect = baseRectsRef.current[b];
      if (!rect) continue;

      const baseBox = {
        left: rect.left,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
      };
      const expandedBaseBox = {
        left: rect.left - SNAP_PADDING,
        top: rect.top - SNAP_PADDING,
        right: rect.right + SNAP_PADDING,
        bottom: rect.bottom + SNAP_PADDING,
      };

      const overlapArea = computeOverlapArea(badgeBox, baseBox);
      const baseCenter = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
      const centerDist = Math.hypot(
        badgeCenter.x - baseCenter.x,
        badgeCenter.y - baseCenter.y
      );

      const qualifies =
        overlapArea > 0 || // 실제 겹쳐졌거나
        pointInRect(badgeCenter, expandedBaseBox) || // 중심이 확장 영역 안에 있거나
        centerDist <= MAX_CENTER_DISTANCE; // 중심 거리 기준

      if (qualifies) {
        candidates.push({
          base: b,
          baseRect: rect,
          overlap: overlapArea,
          centerDist,
        });
      }
    }

    if (candidates.length > 0) {
      candidates.sort((a, b) => {
        if (b.overlap !== a.overlap) return b.overlap - a.overlap;
        return a.centerDist - b.centerDist;
      });
      dropBase = candidates[0].base;
      baseRect = candidates[0].baseRect;
    }
    if (!dropBase || !baseRect) return;

    // excluded 배지는 스냅 불가
    if (isExcludedBadge(badgeId)) {
      scheduleOccupancyLog();
      return;
    }

    // 이미 점유된 베이스인지 확인
    if (isBaseOccupied(dropBase, badgeId, badgeSnaps)) {
      scheduleOccupancyLog();
      return;
    }

    // 홈베이스에 스냅된 경우: H 처리 + 정리
    if (dropBase === "home-base") {
      // 1) 홈베이스 완료 배지로 표시해서 endBase="H"로 로그에 남기게
      setHomeSnappedBadgesCurrent((prev) => {
        const next = new Set(prev);
        next.add(badgeId);
        return next;
      });

      // 2) 기존 baseToBadgeId 매핑에서 제거
      setBaseToBadgeIdCurrent((prev) => {
        const next = { ...prev };
        Object.entries(prev).forEach(([baseNum, bId]) => {
          if (bId === badgeId) {
            delete next[Number(baseNum) as any];
          }
        });
        return next;
      });

      // 3) finished 표시 (기존 로직과 연동)
      setFinishedBadgesCurrent((prev) => {
        const next = new Set(prev);
        next.add(badgeId);
        return next;
      });

      // 4) UI/스냅 정리
      if (!badgeId.startsWith("black-badge")) {
        setActiveBadges((prev) => prev.filter((id) => id !== badgeId));
      }
      setBadgeSnaps((prev) => ({ ...prev, [badgeId]: null }));

      scheduleOccupancyLog();
      return;
    }

    // 일반 베이스 스냅 (1,2,3루)
    const x = baseRect.left + baseRect.width / 2 - wrapperRect.left;
    const y = baseRect.top + baseRect.height / 2 - wrapperRect.top;

    setBadgeSnaps((prev) => ({
      ...prev,
      [badgeId]: {
        base: dropBase,
        pos: {
          xPct: (x / wrapperRect.width) * 100,
          yPct: (y / wrapperRect.height) * 100,
        },
      },
    }));

    // 진행 순서 기록 업데이트
    const seq = snappedSeqRef.current[badgeId];
    if (seq[seq.length - 1] !== dropBase) {
      seq.push(dropBase);
    }

    scheduleOccupancyLog();
  };

  // 모달 성능 최적화 (렌더링 최소화)
  const groundModalRef = useRef<GroundRecordModalHandle>(null);
  // onSuccess 콜백 예시
  const afterRecord = async () => {
    // const newAttack = await fetchInningScores();
    // …추가 fetch…
  };
  // 콘솔에 다시 찍히지 않는다면 부모 컴포넌트는 리렌더링되지 않은 것!
  console.log("▶ GameRecordPageV2 render");

  // 이닝의 재구성 성능 올리기
  // ① 컨테이너와 흰 배지를 감쌀 ref
  const reconstructModeRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const whiteBadgesRef = useRef<HTMLDivElement>(null);

  const switchAnchorRefForMain = useRef<HTMLDivElement>(null);

  const handleReconstructToggle = useCallback(
    (checked: boolean) => {
      if (containerRef.current) {
        containerRef.current.classList.toggle("reconstruct-mode", checked);
      }
      setReconstructMode(checked);
      setActiveBadges(badgeConfigs.map((c) => c.id));
      setOutBadges(new Set());
      if (!batterWhiteBadgeId) return;

      // 타자 배지를 무조건 B (초기 위치)로 리셋
      setBadgeSnaps((prev) => {
        const next = { ...prev };
        next[batterWhiteBadgeId] = null;
        return next;
      });

      // 순서 기록에서도 타자 초기화
      snappedSeqRef.current[batterWhiteBadgeId] = [];

      // initial 스냅에도 반영해서 이후 리셋/비교 로직에서 B로 인식되게
      initialSnapsRef.current[batterWhiteBadgeId] = null;
      // badgeSnaps 업데이트가 비동기라 다음 프레임에 occupancy 계산
      requestAnimationFrame(() => {
        const occ = computeBaseOccupancy(badgeSnapsRef.current);
        // console.log("Base occupancy after reconstruct toggle:", occ);
      });
    },

    [batterWhiteBadgeId, badgeConfigs]
  );

  const buildArrayForMode = (
    runnerMap: Record<string, { runnerId: number; name: string }>,
    outBadgesForMode: Set<string>,
    homeSnappedForMode: Set<string>
  ): Array<{
    runnerId: number | null;
    startBase: string;
    endBase: string;
  }> => {
    const entries: Array<{
      runnerId: number | null;
      startBase: string;
      endBase: string;
    }> = [];
    const whiteBadgeIds = allWhiteBadges.map((cfg) => cfg.id);

    whiteBadgeIds.forEach((badgeId) => {
      let startBase: string;
      let endBase: string;

      // runnerId 결정: 타자 / 매핑된 주자 / 없으면 excluded
      let runnerId: number | null = null;
      if (badgeId === batterWhiteBadgeId) {
        runnerId =
          currentBatterId != null ? currentBatterId : EXCLUDED_RUNNER_ID;
      } else if (runnerMap[badgeId]) {
        runnerId = runnerMap[badgeId].runnerId;
      } else {
        runnerId = EXCLUDED_RUNNER_ID;
      }

      const isExcluded = runnerId === EXCLUDED_RUNNER_ID;

      if (isExcluded) {
        startBase = EXCLUDED_BASE_CODE; // "0"
        endBase = EXCLUDED_BASE_CODE; // "0"
      } else {
        startBase = getBaseCode(initialSnapsRef.current[badgeId] ?? null);

        if (outBadgesForMode.has(badgeId)) {
          endBase = "O";
        } else if (homeSnappedForMode.has(badgeId)) {
          endBase = "H";
        } else {
          let effectiveCurrentSnap: SnapInfo | null = badgeSnaps[badgeId];
          const seq = snappedSeqRef.current[badgeId] || [];
          if (!effectiveCurrentSnap && seq.length > 0) {
            const lastBase = seq[seq.length - 1];
            if (lastBase === "home-base") {
              effectiveCurrentSnap = {
                base: "home-base",
                pos: { xPct: 0, yPct: 0 },
              };
            }
          }
          endBase = getBaseCode(effectiveCurrentSnap);
        }
      }

      // 특별히 이동 없는 (B→B) 비타자 항목은 생략
      if (
        badgeId !== batterWhiteBadgeId &&
        startBase === "B" &&
        endBase === "B"
      )
        return;

      entries.push({
        runnerId,
        startBase,
        endBase,
      });
    });

    // ==== 병합: 실제 runnerId (>=0)만 병합, excluded/-1과 null은 그대로 둠 ====
    const priority: Record<string, number> = {
      H: 6,
      O: 5,
      "3": 4,
      "2": 3,
      "1": 2,
      B: 1,
      "0": 0,
    };

    const realByRunner = new Map<
      number,
      { runnerId: number | null; startBase: string; endBase: string }
    >();
    const specialEntries: typeof entries = [];

    entries.forEach((entry) => {
      if (entry.runnerId == null || entry.runnerId === EXCLUDED_RUNNER_ID) {
        specialEntries.push(entry);
        return;
      }
      const rid = entry.runnerId;
      const existing = realByRunner.get(rid);
      if (!existing) {
        realByRunner.set(rid, entry);
        return;
      }
      const existingScore = priority[existing.endBase] ?? 0;
      const newScore = priority[entry.endBase] ?? 0;
      if (newScore > existingScore) {
        realByRunner.set(rid, entry);
      }
    });

    return [...Array.from(realByRunner.values()), ...specialEntries];
  };

  type RunnerLogEntry = {
    runnerId: number | null;
    startBase: string;
    endBase: string;
  };

  type CombinedRequest = {
    phase: "PREV";
    actual: RunnerLogEntry[];
    virtual?: RunnerLogEntry[];
  };
  const prevActualLogRef = useRef<string | null>(null);
  const prevVirtualLogRef = useRef<string | null>(null);

  const [combinedRequest, setCombinedRequest] =
    useState<CombinedRequest | null>(null);

  // reconstructMode 켤 때 이전 actual을 보존하기 위한 ref
  const actualBeforeReconstructRef = useRef<RunnerLogEntry[] | null>(null);

  useEffect(() => {
    if (reconstructMode) {
      if (actualBeforeReconstructRef.current === null) {
        actualBeforeReconstructRef.current = actualRequest;
      }
    } else {
      actualBeforeReconstructRef.current = null;
    }
  }, [reconstructMode, actualRequest]);

  // actual 전용 로그 (reconstructMode=false일 때)
  useEffect(() => {
    // if (!isOpen) return;
    if (!batterWhiteBadgeId) return;
    if (reconstructMode) return; // reconstruct 모드면 skip

    const actualArray = buildArrayForMode(
      runnerInfoByBadgeActual,
      outBadgesActual,
      homeSnappedBadgesActual
    );
    const filteredActualArray = actualArray.filter(
      (entry) =>
        entry.runnerId !== null && entry.runnerId !== EXCLUDED_RUNNER_ID
    );
    const serializedActual = JSON.stringify(filteredActualArray);

    if (
      filteredActualArray.length > 0 &&
      prevActualLogRef.current !== serializedActual
    ) {
      setActualRequest(filteredActualArray); // 추가된 저장
      prevActualLogRef.current = serializedActual;
      // console.log("filteredActualArray", filteredActualArray);
      // actual만 있는 경우 combinedRequest 구성
      const single: CombinedRequest = {
        phase: "PREV",
        actual: filteredActualArray,
      };
      setCombinedRequest(single);
      // console.log("actual only", JSON.stringify(single, null, 2));
    }
  }, [
    badgeSnaps,
    activeBadges,
    currentBatterId,
    runnerInfoByBadgeActual,
    batterWhiteBadgeId,
    // isOpen,
    outBadgesActual,
    allWhiteBadges,
    // reconstructMode,
  ]);

  // virtual 전용 로그 (reconstructMode=true일 때)
  useEffect(() => {
    // if (!isOpen) return;
    if (!batterWhiteBadgeId) return;
    if (!reconstructMode) return;

    const virtualArray = buildArrayForMode(
      runnerInfoByBadgeVirtual,
      outBadgesVirtual,
      homeSnappedBadgesVirtual
    );
    const filteredVirtualArray = virtualArray.filter(
      (entry) =>
        entry.runnerId !== null && entry.runnerId !== EXCLUDED_RUNNER_ID
    );
    const serializedVirtual = JSON.stringify(filteredVirtualArray);

    if (
      filteredVirtualArray.length > 0 &&
      prevVirtualLogRef.current !== serializedVirtual
    ) {
      setVirtualRequest(filteredVirtualArray); // 추가된 저장
      prevVirtualLogRef.current = serializedVirtual;
    }
  }, [
    badgeSnaps,
    activeBadges,
    currentBatterId,
    runnerInfoByBadgeVirtual,
    batterWhiteBadgeId,
    // isOpen,
    outBadgesVirtual,
    allWhiteBadges,
    reconstructMode,
  ]);

  // actual (재구성 모드 켜기 직전 스냅) + virtual 합쳐서 최종 객체 생성
  useEffect(() => {
    if (!reconstructMode) return;
    if (virtualRequest.length === 0) return;

    const actualToUse = actualBeforeReconstructRef.current ?? actualRequest;

    const combined: CombinedRequest = {
      phase: "PREV",
      actual: actualToUse,
      virtual: virtualRequest,
    };
    setCombinedRequest(combined);
    // console.log("최종입니다", JSON.stringify(combined, null, 2));
  }, [virtualRequest, reconstructMode, actualRequest]);

  // console.log("combinedRequest", combinedRequest);

  function isBaseOccupied(
    targetBase: BaseId,
    badgeId: string,
    badgeSnaps: Record<string, { base: BaseId } | null>
  ): boolean {
    return Object.entries(badgeSnaps).some(
      ([otherId, snap]) => otherId !== badgeId && snap?.base === targetBase
    );
  }

  const occupancy = useMemo(
    () => computeBaseOccupancy(badgeSnaps),
    [badgeSnaps]
  );

  useEffect(() => {
    const occupiedEntries = Object.entries(badgeSnaps)
      .filter(([, snap]) => snap != null)
      .map(([id, snap]) => `${id} → ${snap!.base}`);
    // console.log("badgeSnaps contents:", occupiedEntries);
    // console.log("computed occupancy from badgeSnaps:", occupancy);
  }, [badgeSnaps, occupancy]);
  useEffect(() => {
    // console.log("Base occupancy:", occupancy);
  }, [occupancy]);
  // 마운트 시 snapshot 먼저 불러오기
  useEffect(() => {
    loadSnapshot();
  }, []);

  // snapshotData가 생기면 applyResetSnapshot 켜서 sync 로직 실행
  useEffect(() => {
    if (!snapshotData) return;
    setApplyResetSnapshot(true);
  }, [snapshotData]);

  // 기록 전송
  const clearAllSnapsAndExitReconstructMode = useCallback(() => {
    // reconstruct-mode 스타일 제거
    containerRef.current?.classList.remove("reconstruct-mode");

    unstable_batchedUpdates(() => {
      setReconstructMode(false);
      setBadgeSnaps(
        badgeConfigs.reduce((acc, c) => {
          acc[c.id] = null; // SnapInfo|null 이어야 하므로 null로 초기화
          return acc;
        }, {} as Record<string, SnapInfo | null>)
      );
      setActiveBadges(badgeConfigs.map((c) => c.id));
      setOutBadgesActual(new Set());
      setOutBadgesVirtual(new Set());
      setRunnerInfoByBadgeActual({});
      setRunnerInfoByBadgeVirtual({});
      setBaseToBadgeIdActual({});
      setBaseToBadgeIdVirtual({});
      setFinishedBadgesActual(new Set());
      setFinishedBadgesVirtual(new Set());
      setHomeSnappedBadgesActual(new Set());
      setHomeSnappedBadgesVirtual(new Set());
      softResetWhiteBadges();
    });
  }, [badgeConfigs]);

  // const saveAndReloadSnapshot = useCallback(
  //   (next: any) => {
  //     const boxed = next?.snapshot ? next : { snapshot: next };
  //     localStorage.setItem("snapshot", JSON.stringify(boxed));
  //     loadSnapshot();
  //   },
  //   [loadSnapshot]
  // );

  const saveAndReloadSnapshot = useCallback(
    (next: any) => {
      const boxed = next?.snapshot ? next : { snapshot: next };
      localStorage.setItem("snapshot", JSON.stringify(boxed));
      loadSnapshot();
    },
    [loadSnapshot]
  );

  // const sendRunnerEvents = useCallback(async () => {
  //   if (!combinedRequest) {
  //     console.warn("combinedRequest이 없어서 전송을 스킵합니다.");
  //     return;
  //   }

  //   // snapshot에서 playId만 꺼냄 (절대 다른 키로 대체하지 않음)
  //   const rawSnapshot = localStorage.getItem("snapshot");
  //   if (!rawSnapshot) {
  //     const msg =
  //       "localStorage에 snapshot이 없어 runner-events 요청을 보낼 수 없습니다.";
  //     console.error(msg);
  //     throw new Error(msg);
  //   }

  //   let errorFlag = false;
  //   let playIdValue: unknown = null;
  //   try {
  //     const parsed = JSON.parse(rawSnapshot);
  //     const core = parsed?.snapshot ?? parsed;
  //     // errorFlag = !!parsed?.snapshot?.inningStats?.errorFlag;
  //     // playIdValue = parsed.snapshot?.playId ?? null;
  //     errorFlag = !!core?.inningStats?.errorFlag;
  //     playIdValue = core?.playId ?? null;
  //   } catch (e) {
  //     console.warn("snapshot JSON 파싱 실패:", e);
  //   }

  //   // ⛔️ 여기서 preflight: PATCH 전에 차단
  //   if (errorFlag) {
  //     // const hasBB = (arr?: RunnerLogEntry[]) =>
  //     //   (arr ?? []).some((e) => e.startBase === "B" && e.endBase === "B");

  //     const virtualExists =
  //       Array.isArray(combinedRequest.virtual) &&
  //       combinedRequest.virtual.length > 0;

  //     if (
  //       !virtualExists
  //       // hasBB(combinedRequest.actual) ||
  //       // hasBB(combinedRequest.virtual)
  //     ) {
  //       alert("이닝의 재구성을 해주세요");
  //       const err: any = new Error("PRE_FLIGHT_BLOCK");
  //       err.code = "PRE_FLIGHT_BLOCK"; // 식별용 코드
  //       throw err; // 🚫 여기서 흐름 중단 (PATCH/POST 안 나감)
  //     }
  //   }
  //   // ⛔️ preflight 끝 — 이 아래로 내려오면 유효하므로 PATCH/POST 진행
  //   if (playIdValue == null) {
  //     const msg =
  //       "localStorage의 snapshot에서 snapshot.playId를 찾을 수 없어 runner-events 요청을 보낼 수 없습니다.";
  //     console.error(msg);
  //     throw new Error(msg);
  //   }

  //   const encodedPlayId = encodeURIComponent(String(playIdValue));
  //   softResetWhiteBadges();
  //   // 2. POST runner-events
  //   const postUrl = `/plays/${encodedPlayId}/runner-events`;
  //   let postRes;
  //   try {
  //     // 전송 직전에만 startBase === endBase인 entry 제거
  //     const sanitizeCombinedRequest = (
  //       req: CombinedRequest
  //     ): CombinedRequest => {
  //       // B→B만 제거, 나머지(예: 1→1, 2→2 등)는 유지
  //       const filter = (entries: RunnerLogEntry[] = []) =>
  //         entries.filter((e) => !(e.startBase === "B" && e.endBase === "B"));
  //       const actual = filter(req.actual);
  //       const virtual =
  //         req.virtual && req.virtual.length > 0
  //           ? filter(req.virtual)
  //           : undefined;

  //       return {
  //         phase: req.phase,
  //         actual,
  //         ...(virtual ? { virtual } : {}),
  //       };
  //     };

  //     const finalRequest = sanitizeCombinedRequest(combinedRequest);
  //     // console.log("finalRequest", finalRequest);

  //     console.log(
  //       "runner-events POST 요청:",
  //       postUrl,
  //       JSON.stringify(finalRequest, null, 2)
  //     );
  //     postRes = await API.post(postUrl, finalRequest);
  //     // ⬇️ 먼저 화면 상태를 싹 비움 (스냅샷 읽지 않음)

  //     console.log("runner-events POST 응답:", {
  //       status: (postRes as any)?.status,
  //       data:
  //         typeof (postRes as any)?.data !== "undefined"
  //           ? (postRes as any).data
  //           : postRes,
  //     });

  //     // localStorage.setItem(`snapshot`, JSON.stringify(postRes.data));
  //     // // ② 상태도 즉시 갱신 (이 한 줄이 포인트!)
  //     // setSnapshotData(postRes.data);
  //     // saveAndReloadSnapshot(postRes.data);
  //     updateSnapshot(postRes.data);
  //   } catch (err) {
  //     console.error("runner-events 전송 실패:", err);
  //     alert("runner-events 전송 실패");
  //     throw err;
  //   }

  //   return { postRes };
  // }, [combinedRequest]);
  // 하드 리마운트 트리거
  // const bumpBadgesVersion = useCallback(() => {
  //   setBadgesVersion(v => v + 1);
  // }, []);

  const sendRunnerEvents = useCallback(async () => {
    if (!combinedRequest) {
      console.warn("combinedRequest이 없어서 전송을 스킵합니다.");
      return;
    }
  
    // snapshot에서 playId만 꺼냄 (절대 다른 키로 대체하지 않음)
    const rawSnapshot = localStorage.getItem("snapshot");
    if (!rawSnapshot) {
      const msg =
        "localStorage에 snapshot이 없어 runner-events 요청을 보낼 수 없습니다.";
      console.error(msg);
      throw new Error(msg);
    }
  
    let errorFlag = false;
    let playIdValue: unknown = null;
    try {
      const parsed = JSON.parse(rawSnapshot);
      errorFlag = !!parsed?.snapshot?.inningStats?.errorFlag;
      playIdValue = parsed.snapshot?.playId ?? null;
    } catch (e) {
      console.warn("snapshot JSON 파싱 실패:", e);
    }
  
    // ⛔️ 여기서 preflight: PATCH 전에 차단
    if (errorFlag) {
      // const hasBB = (arr?: RunnerLogEntry[]) =>
      //   (arr ?? []).some((e) => e.startBase === "B" && e.endBase === "B");
  
      const virtualExists =
        Array.isArray(combinedRequest.virtual) &&
        combinedRequest.virtual.length > 0;
  
      if (
        !virtualExists
        // hasBB(combinedRequest.actual) ||
        // hasBB(combinedRequest.virtual)
      ) {
        alert("이닝의 재구성을 해주세요");
        const err: any = new Error("PRE_FLIGHT_BLOCK");
        err.code = "PRE_FLIGHT_BLOCK"; // 식별용 코드
        throw err; // �� 여기서 흐름 중단 (PATCH/POST 안 나감)
      }
    }
    // ⛔️ preflight 끝 — 이 아래로 내려오면 유효하므로 PATCH/POST 진행
    if (playIdValue == null) {
      const msg =
        "localStorage의 snapshot에서 snapshot.playId를 찾을 수 없어 runner-events 요청을 보낼 수 없습니다.";
      console.error(msg);
      throw new Error(msg);
    }
  
    const encodedPlayId = encodeURIComponent(String(playIdValue));
    softResetWhiteBadges();
    // 2. POST runner-events
    const postUrl = `/plays/${encodedPlayId}/runner-events`;
    let postRes;
    try {
      // 전송 직전에만 startBase === endBase인 entry 제거
      const sanitizeCombinedRequest = (
        req: CombinedRequest
      ): CombinedRequest => {
        // B→B만 제거, 나머지(예: 1→1, 2→2 등)는 유지
        const filter = (entries: RunnerLogEntry[] = []) =>
          entries.filter((e) => !(e.startBase === "B" && e.endBase === "B"));
        const actual = filter(req.actual);
        const virtual =
          req.virtual && req.virtual.length > 0
            ? filter(req.virtual)
            : undefined;
  
        return {
          phase: req.phase,
          actual,
          ...(virtual ? { virtual } : {}),
        };
      };
  
      const finalRequest = sanitizeCombinedRequest(combinedRequest);
      // console.log("finalRequest", finalRequest);
  
      console.log(
        "runner-events POST 요청:",
        postUrl,
        JSON.stringify(finalRequest, null, 2)
      );
      postRes = await API.post(postUrl, finalRequest);
      // ⬇️ 먼저 화면 상태를 싹 비움 (스냅샷 읽지 않음)
  
      console.log("runner-events POST 응답:", {
        status: (postRes as any)?.status,
        data:
          typeof (postRes as any)?.data !== "undefined"
            ? (postRes as any).data
            : postRes,
      });
  
      // �� 새로운 데이터를 Recoil 상태에 반영
      const newSnapshotData = postRes.data;
      setSnapshotData(newSnapshotData);
      
      // �� localStorage에도 저장
      localStorage.setItem("snapshot", JSON.stringify(newSnapshotData));
      
      // 🆕 새로운 데이터로 syncRunnersOnBase 실행
      // 다음 프레임에서 실행하여 상태 업데이트가 완료된 후 동작하도록 함
      requestAnimationFrame(() => {
        syncRunnersOnBase();
      });
  
      // 부모 컴포넌트에도 알림
      updateSnapshot(newSnapshotData);
    } catch (err) {
      console.error("runner-events 전송 실패:", err);
      alert("runner-events 전송 실패");
      throw err;
    }
  
    return { postRes };
  }, [combinedRequest, syncRunnersOnBase, updateSnapshot, setSnapshotData]);

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    try {
      await sendRunnerEvents();
      setReconstructMode(false);
      clearAllSnapsAndExitReconstructMode();
      // bumpBadgesVersion();
      resetWhiteBadges();
      // 
    } catch (e) {
      // ✋ preflight 차단 에러는 그냥 삼켜서 모달 유지
      if (e?.code !== "PRE_FLIGHT_BLOCK") {
        setError(e as Error); // 진짜 오류만 ErrorAlert로 노출
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [sendRunnerEvents]);

  // console.log(snapshotData.snapshot);

  // 아웃카운트 표시

  // ① 최초 값은 전부 false(0아웃)
  const [outs, setOuts] = useState<boolean[]>([false, false, false]);

  /* 🔄 actual out-count만 반영 */
  // const deriveOuts = (snap: any): boolean[] => {
  //   const outCnt: number =
  //     snap?.snapshot?.inningStats?.actual?.outs ??
  //     snap?.inningStats?.actual?.outs ??
  //     0;

  //   return Array(3)
  //     .fill(false)
  //     .map((_, i) => i < outCnt);
  // };

  // useEffect(() => {
  //   if (!snapshotData) {
  //     setOuts([false, false, false]);
  //     return;
  //   }
  //   setOuts(deriveOuts(snapshotData));
  // }, [snapshotData]);

  // 타자 주자 위치 업데이트

  const deriveOuts = (v: any): boolean[] => {
    const outCnt: number = v?.inningStats?.actual?.outs ?? 0;
    return Array(3)
      .fill(false)
      .map((_, i) => i < outCnt);
  };
  useEffect(() => {
    setOuts(deriveOuts(snap));
  }, [snap?.inningStats?.actual?.outs]);

  useEffect(() => {
    const snap = snapshotData?.snapshot;
    if (!snap) return;

    // 1) 렌더 가드/표식들을 리셋
    setActiveBadges(badgeConfigs.map((c) => c.id));
    setOutBadgesActual(new Set());
    setOutBadgesVirtual(new Set());
    setHomeSnappedBadgesActual(new Set());
    setHomeSnappedBadgesVirtual(new Set());
    setFinishedBadgesActual(new Set());
    setFinishedBadgesVirtual(new Set());
    setBaseToBadgeIdActual({});
    setBaseToBadgeIdVirtual({});

    // 2) 스냅 좌표 초기화
    setBadgeSnaps(
      badgeConfigs.reduce((acc, c) => {
        acc[c.id] = null;
        return acc;
      }, {} as Record<string, SnapInfo | null>)
    );

    // 3) 새 스냅샷으로 주자/좌표 다시 매핑
    syncRunnersOnBase();
  }, [snapshotData?.snapshot?.playId, reconstructMode]); // playId 등 "한 플레이" 단위 키를 의존성으로

  // 주자 새로 불러오기
  // 최신 runnersOnBase (actual/virtual 중 모드에 따라 선택)
  const freshRunners = useMemo(() => {
    const v = reconstructMode
      ? snap?.inningStats?.virtual?.runnersOnBase
      : snap?.inningStats?.actual?.runnersOnBase;
    return Array.isArray(v) ? v : [];
  }, [
    reconstructMode,
    snap?.inningStats?.actual?.runnersOnBase,
    snap?.inningStats?.virtual?.runnersOnBase,
  ]);

  const freshRunnerByBadge = useMemo(() => {
    // 배터 배지 제외한 흰 배지 후보
    const candidates = badgeConfigs
      .filter(
        (c) => !c.id.startsWith("black-badge") && c.id !== batterWhiteBadgeId
      )
      .map((c) => c.id);

    const byBadge: Record<string, { runnerId: number; name: string }> = {};

    // 베이스 오름차순 → 배지 할당
    freshRunners
      .slice()
      .sort((a, b) => (a.base ?? 0) - (b.base ?? 0))
      .forEach((r, i) => {
        const preferred = baseToBadgeId[r.base]; // 이미 매핑돼 있으면 그거 그대로
        const badgeId = preferred ?? candidates[i];
        if (badgeId) byBadge[badgeId] = { runnerId: r.id, name: r.name };
      });

    return byBadge;
  }, [freshRunners, baseToBadgeId, batterWhiteBadgeId, badgeConfigs]);
  const [badgesVersion, setBadgesVersion] = useState(0);

  const softResetWhiteBadges = useCallback(() => {
    // 스냅샷을 다시 읽지 않고, 화면/메모리의 배지 관련 상태만 싹 비움
    initialSnapsRef.current = badgeConfigs.reduce((acc, c) => {
      acc[c.id] = null;
      return acc;
    }, {} as Record<string, SnapInfo | null>);
    snappedSeqRef.current = badgeConfigs.reduce((acc, c) => {
      acc[c.id] = [];
      return acc;
    }, {} as Record<string, BaseId[]>);

    unstable_batchedUpdates(() => {
      setBadgeSnaps(
        badgeConfigs.reduce((acc, c) => {
          acc[c.id] = null;
          return acc;
        }, {} as Record<string, SnapInfo | null>)
      );
      setActiveBadges(badgeConfigs.map((c) => c.id));

      setOutBadgesActual(new Set());
      setOutBadgesVirtual(new Set());

      setRunnerInfoByBadgeActual({});
      setRunnerInfoByBadgeVirtual({});

      setBaseToBadgeIdActual({});
      setBaseToBadgeIdVirtual({});

      setFinishedBadgesActual(new Set());
      setFinishedBadgesVirtual(new Set());
      setHomeSnappedBadgesActual(new Set());
      setHomeSnappedBadgesVirtual(new Set());

      setReconstructMode(false);
    });

    // playId가 그대로일 때도 강제 리마운트
    setBadgesVersion((v) => v + 1);
  }, [badgeConfigs]);

  // 새 플레이로 넘어가면 0으로
  useEffect(() => {
    setBadgesVersion(0);
  }, [snap?.playId]);
  useEffect(() => {
    badgeSnapsRef.current = badgeSnaps;
  }, [badgeSnaps]);

  return (
    <GameRecordContainer ref={containerRef}>
      <ScoreBoardWrapper>
        <InningHeader>
          {inningHeaders.map((inn, i) => (
            <InningCell key={i}>{inn}</InningCell>
          ))}
        </InningHeader>

        {/* Team A */}
        <TeamRow>
          <TeamNameCell>
            {/* {snapshotData?.snapshot?.gameSummary?.awayTeam?.name?.slice(0, 3)} */}
            {awayName.slice(0, 3)}
          </TeamNameCell>
          {teamAScores.map((s, i) => (
            <TeamScoreCell
              key={i}
              // onClick={() => handleScoreCellClick(s, "A", i)}
            >
              {s}
            </TeamScoreCell>
          ))}
        </TeamRow>

        {/* Team B */}
        <TeamRow>
          <TeamNameCell>
            {/* {snapshotData?.snapshot?.gameSummary?.homeTeam?.name?.slice(0, 3)} */}
            {homeName.slice(0, 3)}
          </TeamNameCell>
          {teamBScores.map((s, i) => (
            <TeamScoreCell
              key={i}
              // onClick={() => handleScoreCellClick(s, "B", i)}
            >
              {s}
            </TeamScoreCell>
          ))}
        </TeamRow>
      </ScoreBoardWrapper>

      <ControlButtonsRow>
        <ControlButtonsWrapper>
          <ReconstructionWrapper>
            <ReconstructionTitle>이닝의 재구성</ReconstructionTitle>
            <ReconstructionButtonWrapper>
              <div
                ref={switchAnchorRefForMain}
                style={{
                  width: "11vw",
                  height: "3vh",
                  position: "relative",
                  zIndex: 0,
                  // (기본 자리 표시용; 실제 스위치는 포털로 올라감)
                }}
              />

              <PortalSwitch
                anchorRef={switchAnchorRefForMain}
                checked={reconstructMode}
                onChange={handleReconstructToggle}
              />
              {/* </div> */}
            </ReconstructionButtonWrapper>
          </ReconstructionWrapper>
          <ControlButtonWhite onClick={handleSubmit}>
            저장하기
          </ControlButtonWhite>
          <ControlButton onClick={() => setIsGameEndModalOpen(true)}>
            경기종료
          </ControlButton>
        </ControlButtonsWrapper>
      </ControlButtonsRow>

      <DndContext
        id="game-record-dnd" // ← 여기에 고정된 string ID를 넣어줍니다
        sensors={sensors}
        // collisionDetection={rectIntersection}
        modifiers={modifiers}
        // measuring={{
        //   droppable: {
        //     // or AlwaysExceptInitialPlacement
        //     strategy: MeasuringStrategy.Always,

        //   },
        // }}
        onDragStart={handleDragStart}
        onDragEnd={onAnyDragEnd}
      >
        <GraphicWrapper ref={wrapperRef}>
          <HomeWrapper />
          <LineWrapper />
          <HomeBaseWrapper active={isHomeBaseActive} />
          <Ground ref={groundRef} />

          <OutZoneWrapper ref={outZoneRef}></OutZoneWrapper>
          <CustomBoundaryWrapper
            ref={(el) => {
              customBoundsRef.current = el; // ★ 이 한 줄 추가
            }}
          ></CustomBoundaryWrapper>
          <DiamondSvg
            viewBox="0 0 110 110"
            ref={(el) => {
              diamondSvgRef.current = el;
              // svgRef.current = el;
            }}
          >
            <polygon
              id="ground"
              points="55,0 110,55 55,110 0,55"
              // style={{ border: "1px solid black" }}
              ref={(el) => {
                diamondPolyRef.current = el;
                // groundRef.current = el;
              }}
            />
            {/* 디버그용: 계산된 screenPoints로 다시 그린 폴리곤 */}
            {/* {overlayPoints && (
              <polygon points={overlayPoints} stroke="red" strokeWidth={0.5} />
            )} */}
            {/* 1루 */}
            <polygon
              className="inner"
              id="1st"
              // transform="translate(-5, 10)"
              ref={(el) => {
                droppableSetters["first-base"](el as any);
                baseRefs.current["first-base"] = el;
              }}
              points="103.5,48.5 110,55 103.5,61.5 97,55"
            />
            {/* 2루 */}
            <polygon
              className="inner"
              id="2nd"
              ref={(el) => {
                droppableSetters["second-base"](el as any);
                baseRefs.current["second-base"] = el;
              }}
              points="55,0 61.5,6.5 55,13 48.5,6.5"
            />
            {/* 3루 */}
            <polygon
              className="inner"
              id="3rd"
              ref={(el) => {
                droppableSetters["third-base"](el as any);
                baseRefs.current["third-base"] = el;
              }}
              points="6.5,48.5 13,55 6.5,61.5 0,55"
            />{" "}
            {/* 홈 */}
            <polygon
              className="inner"
              id="Home"
              ref={(el) => {
                droppableSetters["home-base"](el as any);
                baseRefs.current["home-base"] = el;
              }}
              points="55,100 61.5,103.5 55,130 48.5,103.5"
            />
          </DiamondSvg>
          <SideWrapper>
            <OutCount>
              {outs.map((isActive, idx) => (
                <Ellipse key={idx} active={isActive} />
              ))}
            </OutCount>
            <OnDeckWrapper>
              <OnDeckNameWrapper>
                {onDeckPlayers.length > 0 ? (
                  onDeckPlayers.map((p) => (
                    <div key={p.playerId}>
                      {p.battingOrder} {p.playerName}
                    </div>
                  ))
                ) : (
                  <div>대기타석입니다</div>
                )}
              </OnDeckNameWrapper>
            </OnDeckWrapper>
          </SideWrapper>
          <LeftSideWrapper>
            <InningBoard>
              <ArrowUp color={!isHomeAttack ? "red" : "#B8B8B8"} />
              <InningNumber> {snap?.gameSummary?.inning}</InningNumber>
              <ArrowDown color={isHomeAttack ? "red" : "#B8B8B8"} />
            </InningBoard>
            <LittleScoreBoardWrapper>
              <AwayTeamWrapper>
                <AwayTeamName>
                  {" "}
                  {/* {snapshotData?.snapshot?.gameSummary?.awayTeam?.name?.slice(
                    0,
                    3
                  )} */}
                  {awayName.slice(0, 3)}
                </AwayTeamName>
                <AwayTeamScore>
                  {/* {
                    snapshotData?.snapshot?.gameSummary?.scoreboard.totals.away
                      .R
                  } */}
                  {scoreboard?.totals?.away?.R ?? 0}
                </AwayTeamScore>
              </AwayTeamWrapper>
              <HomeTeamWrapper>
                <HomeTeamName>
                  {" "}
                  {/* {snapshotData?.snapshot?.gameSummary?.homeTeam?.name?.slice(
                    0,
                    3
                  )} */}
                  {homeName.slice(0, 3)}
                </HomeTeamName>
                <HomeTeamScore>
                  {/* {
                    snapshotData?.snapshot?.gameSummary?.scoreboard.totals.home
                      .R
                  } */}
                  {scoreboard?.totals?.home?.R ?? 0}
                </HomeTeamScore>
              </HomeTeamWrapper>
            </LittleScoreBoardWrapper>
          </LeftSideWrapper>
          <ResetDot
            style={{ left: "75vw", top: "2vh" }}
            onClick={resetWhiteBadges}
          />
          {blackBadgeConfigs.map((cfg) => (
            <BlackDraggableBadge
              key={cfg.id}
              cfg={cfg}
              pos={blackPositions[cfg.id]}
            />
          ))}
          {/* NameBadge */}
          {/* 4) 드롭 후 스냅 or 드래그 상태에 따라 렌더 */}
          {/* ③ activeBadges에 든 것만 렌더 */}
          <div
            ref={whiteBadgesRef}
            key={`${snap?.playId ?? "same"}-${badgesVersion}`}
          >
            {badgeConfigs
              .filter((cfg) => {
                if (!activeBadges.includes(cfg.id)) return false;

                // 타자 배지는 기존 로직 그대로
                if (cfg.id === batterWhiteBadgeId) {
                  return currentBatterId != null;
                }

                // ⬇️ 스냅샷에서 바로 파생한 freshRunnerByBadge 사용
                const info = freshRunnerByBadge[cfg.id];
                if (!info) return false; // 스냅샷에 주자가 없으면 안 그리기
                return info.runnerId != null; // (여기선 EXCLUDED 같은 캐시 상태에 안 묶임)
              })
              .map((cfg) => {
                let overriddenLabel = cfg.label;

                // 타자 이름은 여전히 snap 기반
                if (cfg.id === batterWhiteBadgeId && currentBatterName) {
                  overriddenLabel = currentBatterName;
                  // ⬇️ 주자 이름도 스냅샷 기반으로 즉시 반영
                } else if (freshRunnerByBadge[cfg.id]) {
                  overriddenLabel = freshRunnerByBadge[cfg.id].name;
                }

                return (
                  <DraggableBadge
                    key={cfg.id}
                    id={cfg.id}
                    label={overriddenLabel}
                    initialLeft={cfg.initialLeft}
                    initialTop={cfg.initialTop}
                    snapInfo={badgeSnaps[cfg.id]}
                  />
                );
              })}
          </div>
        </GraphicWrapper>
      </DndContext>
      <PlayersRow>
        <LeftPolygon />
        <PlayerBox>
          <PlayerWrapper>
            <PlayerPosition>
              {!isHomeAttack
                ? `${curBatter?.battingOrder ?? "-"}번타자 `
                : "투수"}
              <Dot />
              {/* {!isHomeAttack ? "AWAY" : "HOME"} */}
              AWAY
            </PlayerPosition>
            <PlayerInfo>
              {/* {snapshotData?.snapshot?.currentAtBat.pitcher.name} */}
              {!isHomeAttack ? curBatter?.name : curPitcher?.name}
            </PlayerInfo>
            <PlayerChangeButton onClick={() => handleSubstitutionAway()}>
              선수교체
            </PlayerChangeButton>
          </PlayerWrapper>
        </PlayerBox>
        <VsText>VS</VsText>
        <PlayerBox>
          <PlayerWrapper>
            <PlayerPosition>
              {!isHomeAttack
                ? "투수"
                : `${curBatter?.battingOrder ?? "-"}번타자 `}
              <Dot />
              {/* {isHomeAttack ? "AWAY" : "HOME"} */}
              HOME
            </PlayerPosition>
            <PlayerInfo>
              {!isHomeAttack ? curPitcher?.name : curBatter?.name}
            </PlayerInfo>
            <PlayerChangeButton onClick={() => handleSubstitutionHome()}>
              선수교체
            </PlayerChangeButton>
          </PlayerWrapper>
        </PlayerBox>
        <RightPolygon />
      </PlayersRow>

      <RecordActionsRow>
        <RecordActionButton onClick={() => handleRecordAction("안타")}>
          안타
        </RecordActionButton>
        <RecordActionButton
          onClick={() => handleRecordAction("사사구")}
          disabled={isSubmitting}
        >
          사사구
        </RecordActionButton>
        <RecordActionButton onClick={() => handleRecordAction("아웃")}>
          아웃
        </RecordActionButton>
        <RecordActionButton onClick={() => handleRecordAction("etc")}>
          etc
        </RecordActionButton>
      </RecordActionsRow>

      {isHitModalOpen && (
        <HitModal
          setIsHitModalOpen={setIsHitModalOpen}
          playerId={batterPlayerId}
          onSuccess={afterRecord}
          // 🔑 여기만 바꿔줍니다
          onTypeSelect={() => groundModalRef.current?.open()}
        />
      )}
      {isOutModalOpen && (
        <OutModal
          setIsOutModalOpen={setIsOutModalOpen}
          playerId={batterPlayerId}
          onSuccess={afterRecord}
          // 🔑 여기만 바꿔줍니다
          onTypeSelect={() => groundModalRef.current?.open()}
        />
      )}
      {isEtcModalOpen && (
        <EtcModal
          setIsEtcModalOpen={setIsEtcModalOpen}
          playerId={batterPlayerId}
          onSuccess={afterRecord}
          // 🔑 여기만 바꿔줍니다
          onTypeSelect={() => groundModalRef.current?.open()}
        />
      )}

      {isGameEndModalOpen && (
        <GameOverModal
          inningScore={thisInningScore}
          setIsGameEndModalOpen={setIsGameEndModalOpen}
        />
      )}

      {/* ⚠️ 꼭 마지막에 항상 렌더, 내부에서만 isOpen 제어 */}
      <GroundRecordModal
        ref={groundModalRef}
        onSuccess={afterRecord}
        updateSnapshot={updateSnapshot}
      />

      {!isSubmitting && validationError && (
        <ModalOverlay>
          <ModalContainer>
            <ModalTitleSmaller>{validationError}</ModalTitleSmaller>

            <ModalButton onClick={() => setValidationError(null)}>
              확인
            </ModalButton>
          </ModalContainer>
        </ModalOverlay>
      )}

      <LoadingOverlay visible={isSubmitting}>
        <LoadingIcon spin fontSize={48} />
      </LoadingOverlay>
      <ErrorAlert error={error} />
    </GameRecordContainer>
  );
}
