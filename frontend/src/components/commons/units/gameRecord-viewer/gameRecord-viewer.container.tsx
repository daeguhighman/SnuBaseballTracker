// src/components/pages/GameRecordViewerPage.jsx
import {
  useState,
  useEffect,
  useCallback,
  useRef,
  Fragment,
  useMemo,
  useLayoutEffect,
} from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { useRouter } from "next/router";
import API from "../../../../commons/apis/api";

import {
  GameRecordContainer,
  InningHeader,
  InningCell,
  TeamRow,
  TeamNameCell,
  TeamScoreCell,
  ScoreBoardWrapper,
  GraphicWrapper,
  OutCount,
  Ellipse,
  DiamondSvg,
  NameBadge,
  PlayersRow,
  HomeWrapper,
  LineWrapper,
  HomeBaseWrapper,
  Ground,
  OutZoneWrapper,
  CustomBoundaryWrapper,
  SideWrapper,
  LeftSideWrapper,
  InningBoard,
  InningNumber,
  LittleScoreBoardWrapper,
  AwayTeamWrapper,
  AwayTeamName,
  AwayTeamScore,
  HomeTeamWrapper,
  HomeTeamName,
  HomeTeamScore,
  BatterPlayerBox,
  PitcherPlayerBox,
  BatterPlayerSingleBox,
  BatterGroup,
  BatterRow,
  OrderCircle,
  WhoContainer,
  PlayerName,
  AvgFrame,
  AvgText,
  AvgLabel,
  AvgValue,
  TodayContainer,
  TodayFrame,
  TodayLabel,
  TodayValue,
  PitcherGroup,
  PitcherWho,
  PitcherName,
  PitcherToday,
  StatFrame,
  StatText,
  StatLabel,
  StatValue,
  PitcherStatsGrid,
  StatCell,
  StatName,
  StatNumber,
  Divider,
  BattingOrderLabel,
  StatFrame2,
  ResultBox,
  DividerForPitcher,
  NameAvgContainer,
  ResultOrderContainer,
  InningRow,
  InningItem,
  OpponentPitcherFrame,
  OpponentPitcherLabel,
  OpponentPitcherName,
  InningDividerContainer,
  InningDividerLine,
  InningDividerText,
  InningDividerReal,
  InningFullContainer,
} from "./gameRecord-viewer.style";

import {
  LoadingIcon,
  LoadingOverlay,
} from "../../../../commons/libraries/loadingOverlay";
import ErrorAlert from "../../../../commons/libraries/showErrorCode";
import {
  OnDeckNameWrapper,
  OnDeckWrapper,
} from "../gameRecord-v2/gameRecord-v2.style";
import { ArrowUp } from "../../../../commons/libraries/arrow";
import ArrowDown from "../../../../commons/libraries/arrowDown";
import { getAccessToken } from "../../../../commons/libraries/token";
import { authCheckedState } from "../../../../commons/stores";
import { useRecoilValue } from "recoil";

// 타자 주자 초기 세팅

// ── BASE IDS / 타입 ──
const BASE_IDS = [
  "first-base",
  "second-base",
  "third-base",
  "home-base",
] as const;
type BaseId = (typeof BASE_IDS)[number];

// ── 베이스/래퍼 DOMRect 캐시 훅 ──
function useRectsCache(
  wrapperRef: React.RefObject<HTMLDivElement>,
  baseRefs: React.MutableRefObject<Record<BaseId, SVGPolygonElement | null>>
) {
  const wrapperRectRef = useRef<DOMRect | null>(null);
  const baseRectsRef = useRef<Partial<Record<BaseId, DOMRect>>>({});

  const refreshRects = useCallback(() => {
    if (wrapperRef.current)
      wrapperRectRef.current = wrapperRef.current.getBoundingClientRect();
    BASE_IDS.forEach((b) => {
      const poly = baseRefs.current[b];
      if (poly) baseRectsRef.current[b] = poly.getBoundingClientRect();
    });
  }, [wrapperRef, baseRefs]);

  useLayoutEffect(() => {
    refreshRects();
    let rafId: number | null = null;
    const schedule = () => {
      if (rafId != null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        refreshRects();
      });
    };
    const ro = new ResizeObserver(() => schedule());
    if (wrapperRef.current) ro.observe(wrapperRef.current);
    BASE_IDS.forEach(
      (b) => baseRefs.current[b] && ro.observe(baseRefs.current[b]!)
    );

    const onResize = () => schedule();
    const onScroll = () => schedule();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, true);

    return () => {
      ro.disconnect();
      if (rafId != null) cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [refreshRects]);

  return { wrapperRectRef, baseRectsRef, refreshRects };
}

export default function GameRecordPageViewer() {
  // 스냅샷 받아오기

  // ⬇️ 컴포넌트 내부에 추가 (A안의 esRef/useEffect 대신 사용)
  const controllerRef = useRef<AbortController | null>(null);
  const router = useRouter();
  const recordId = router.query.recordId;

  // ⬇️ 컴포넌트 내부에 추가
  const [sseData, setSseData] = useState<any>(null);
  // const esRef = useRef<EventSource | null>(null);
  // console.log("sseData", sseData);
  // snapshot → 화면 상태 반영
  // 3) applySnapshot 한 곳에서만 세팅
  const applySnapshot = useCallback((snap: any) => {
    if (!snap) return;

    // 팀명
    setTeamAName(snap?.gameSummary?.awayTeam?.name ?? "");
    setTeamBName(snap?.gameSummary?.homeTeam?.name ?? "");

    // 스코어보드
    const newA = Array(9).fill("");
    const newB = Array(9).fill("");
    const innings = snap?.gameSummary?.scoreboard?.innings ?? [];
    for (const inn of innings) {
      const idx = (inn?.inning ?? 0) - 1;
      if (idx >= 0 && idx < 7) {
        newA[idx] = inn?.away ?? "";
        newB[idx] = inn?.home ?? "";
      }
    }
    const totals = snap?.gameSummary?.scoreboard?.totals;
    if (totals) {
      newA[7] = totals?.away?.R ?? "";
      newA[8] = totals?.away?.H ?? "";
      newB[7] = totals?.home?.R ?? "";
      newB[8] = totals?.home?.H ?? "";
    }
    setTeamAScores(newA);
    setTeamBScores(newB);

    // ✅ 아웃카운트: 여기서만
    setOuts(deriveOuts(snap));

    // 공격 팀(필요 시)
    const half = snap?.gameSummary?.inningHalf;
    setAttackVal(half === "TOP" ? "away" : "home");
  }, []);

  const authChecked = useRecoilValue(authCheckedState);
  useEffect(() => {
    if (!router.isReady || !recordId || !authChecked) return;

    const token = getAccessToken();
    if (!token) {
      console.log("토큰이 없어서 스트림을 시작하지 않습니다");
      return;
    }

    const base = process.env.NEXT_PUBLIC_API_URL ?? "";
    const url = `${base}/games/${recordId}/snapshot/stream`;

    const controller = new AbortController();
    controllerRef.current = controller;

    (async () => {
      const res = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "text/event-stream",
        },
        signal: controller.signal,
        credentials: "include",
      });

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // SSE는 "\n\n"으로 이벤트 구분
        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() ?? "";

        for (const chunk of chunks) {
          // 여러 줄 중 data: 만 모아서 이어붙임
          const dataLines = chunk
            .split("\n")
            .filter((l) => l.startsWith("data:"))
            .map((l) => l.slice(5).trim());
          if (!dataLines.length) continue;

          const dataStr = dataLines.join("\n");
          try {
            const payload = JSON.parse(dataStr);
            console.log("payload", payload);

            // 게임 종료 체크
            if (payload.type === "GAME_ENDED") {
              console.log("게임이 종료되었습니다");
              // 스트림 종료
              controller.abort();
              controllerRef.current = null;

              // 게임 종료 상태 설정
              setGameEnded(true);

              // alert로 게임 종료 메시지 표시
              alert("경기가 종료되었습니다");
              router.push(`/matches/${recordId}/result`);
              // UI 업데이트를 위한 상태 설정
              return; // while 루프 종료
            }

            // 일반적인 스냅샷 데이터 처리
            const snap = payload?.data ?? payload;
            setSseData(snap);
            applySnapshot(snap);
            console.log("sseData 수신완료");
            console.log("sseData", sseData);
          } catch (e) {
            console.warn("[SSE/fetch] invalid JSON:", dataStr);
          }
        }
      }
    })().catch((e) => {
      if (e.name === "AbortError") {
        console.log("스트림이 정상적으로 종료되었습니다");
      } else {
        console.warn("[SSE/fetch] error:", e);
      }
    });

    return () => {
      controller.abort();
      controllerRef.current = null;
    };
  }, [router.isReady, authChecked, recordId, applySnapshot]);

  // 연결용 GET
  // StrictMode에서 useEffect가 2번 도는 것을 방지
  const fetchedOnceRef = useRef(false);

  // ✅ 화면 로드시 한 번만: GET /games/{gameId}/snapshot/umpire → localStorage('snapshot') 저장 + 화면 반영
  // 나중에 지우기
  // useEffect(() => {
  //   if (!router.isReady || !recordId) return;
  //   if (fetchedOnceRef.current) return;
  //   fetchedOnceRef.current = true;

  //   (async () => {
  //     try {
  //       const base = process.env.NEXT_PUBLIC_API_URL ?? "";
  //       const url = `${base}/games/${recordId}/snapshot/stream`;

  //       const res = await fetch(url, {
  //         method: "GET",
  //         headers: {
  //           Authorization: `Bearer ${getAccessToken?.() || ""}`,
  //           Accept: "application/json",
  //         },
  //         // credentials: "include", // 쿠키 기반이면 주석 해제
  //       });

  //       if (!res.ok) {
  //         throw new Error(`GET snapshot/stream failed: ${res.status}`);
  //       }

  //       const json = await res.json();
  //       // 응답 래핑 형태 유연 처리
  //       const snap = json?.data ?? json;
  //       console.log("snap", snap);
  //       setSseData(snap);
  //       // 1) localStorage 저장
  //       try {
  //         localStorage.setItem("snapshot", JSON.stringify(snap));
  //       } catch (e) {
  //         console.warn("localStorage(snapshot) 저장 실패:", e);
  //       }
  //       console.log("연결용 GET /snapshot/stream 저장완료");
  //       // 2) 화면 상태 반영
  //       applySnapshot(snap);
  //     } catch (err) {
  //       console.error("GET /snapshot/stream error:", err);
  //       setError(err);
  //     }
  //   })();
  // }, [router.isReady, recordId, applySnapshot]);

  // console.log("sseData", sseData);

  const [error, setError] = useState(null);

  const [outs, setOuts] = useState<boolean[]>([false, false, false]);

  // 이닝 헤더 (1~7, R, H)
  const inningHeaders = ["", "1", "2", "3", "4", "5", "6", "7", "R", "H"];

  // 팀 이름
  const [teamAName, setTeamAName] = useState("");
  const [teamBName, setTeamBName] = useState("");

  // 이닝별 점수 (9칸: 7이닝 + R, H)
  const [teamAScores, setTeamAScores] = useState(Array(9).fill(""));
  const [teamBScores, setTeamBScores] = useState(Array(9).fill(""));

  /* 🔄 actual out-count만 반영 */
  const deriveOuts = (snap: any): boolean[] => {
    const outCnt: number = snap.outs;

    return Array(3)
      .fill(false)
      .map((_, i) => i < outCnt);
  };

  // // 아웃카운트
  // useEffect(() => {
  //   if (!sseData) {
  //     setOuts([false, false, false]);
  //     return;
  //   }
  //   setOuts(deriveOuts(sseData));
  // }, []);

  // 현재 타자/투수

  // 로딩 상태
  const [isSubmitting, setIsSubmitting] = useState(false);
  // attack 쿼리 동기화를 위한 state
  const [attackVal, setAttackVal] = useState("");

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

  const awayExample = {
    batters: [
      {
        battingOrder: 1,
        playerId: 121,
        playerName: "송성문",
        position: "CF",
        isWC: false,
      },
      {
        battingOrder: 2,
        playerId: 122,
        playerName: "임지열",
        position: "LF",
        isWC: false,
      },
      {
        battingOrder: 3,
        playerId: 123,
        playerName: "이주형",
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

  // 대기타석
  const half = sseData?.gameSummary?.inningHalf?.toUpperCase?.();
  const isHomeAttack = half === "BOT";
  const lineupExample = isHomeAttack ? homeExample : awayExample;
  const [onDeckPlayers, setOnDeckPlayers] = useState<
    { playerId: number; playerName: string; battingOrder: number }[]
  >([]);

  useEffect(() => {
    setOnDeckPlayers(
      (sseData?.waitingBatters ?? []).map((b) => ({
        playerId: b.id,
        playerName: b.name,
        battingOrder: b.battingOrder,
      }))
    );
  }, [sseData]);

  console.log("isHomeAttack", isHomeAttack);

  // -------------------- 드래그앤드롭 ------------------------//
  // 드래그 앤 드롭 관련
  // 베이스 아이디 목록
  // const baseIds = [
  //   "first-base",
  //   "second-base",
  //   "third-base",
  //   "home-base",
  // ] as const;
  // type BaseId = (typeof baseIds)[number];

  // 베이스 <polygon> ref 저장
  const baseRefs = useRef<Record<BaseId, SVGPolygonElement | null>>({
    "first-base": null,
    "second-base": null,
    "third-base": null,
    "home-base": null,
  });
  const droppableSetters = BASE_IDS.reduce((acc, id) => {
    acc[id] = useDroppable({ id }).setNodeRef;
    return acc;
  }, {} as Record<BaseId, (el: HTMLElement | null) => void>);

  // wrapper ref (배지·베이스 좌표 계산용)
  const wrapperRef = useRef<HTMLDivElement>(null);

  // 배지 설정
  interface BadgeConfig {
    id: string;
    label: string;
    initialLeft: string; // e.g. '55%'
    initialTop: string; // e.g. '85%'
  }
  const badgeConfigs: BadgeConfig[] = [
    { id: "badge-1", label: "", initialLeft: "60%", initialTop: "80%" },
    { id: "badge-2", label: "", initialLeft: "80%", initialTop: "75%" },
    { id: "badge-3", label: "", initialLeft: "80%", initialTop: "85%" },
    { id: "badge-4", label: "", initialLeft: "80%", initialTop: "95%" },
  ];

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
      label: "",
      initialLeft: "50%",
      initialTop: "55%",
      sportPosition: "P",
    },
    {
      id: "black-badge-2",
      label: "",
      initialLeft: "50%",
      initialTop: "93%",
      sportPosition: "C",
    },
    {
      id: "black-badge-3",
      label: "",
      initialLeft: "80%",
      initialTop: "50%",
      sportPosition: "1B",
    },
    {
      id: "black-badge-4",
      label: "",
      initialLeft: "70%",
      initialTop: "40%",
      sportPosition: "2B",
    },
    {
      id: "black-badge-5",
      label: "",
      initialLeft: "20%",
      initialTop: "50%",
      sportPosition: "3B",
    },
    {
      id: "black-badge-6",
      label: "",
      initialLeft: "30%",
      initialTop: "40%",
      sportPosition: "SS",
    },
    {
      id: "black-badge-7",
      label: "",
      initialLeft: "20%",
      initialTop: "25%",
      sportPosition: "LF",
    },
    {
      id: "black-badge-8",
      label: "",
      initialLeft: "50%",
      initialTop: "15%",
      sportPosition: "CF",
    },
    {
      id: "black-badge-9",
      label: "",
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

  console.log("blackBadgeConfigs", blackBadgeConfigs);
  useEffect(() => {
    // 스냅샷 구조가 중첩/평면 두 타입을 모두 케어
    const snap = sseData;
    if (!snap) return;

    const lineup = isHomeAttack ? snap?.lineup?.away : snap?.lineup?.home;
    if (!lineup) return;

    const posToName: Record<string, string> = {};

    // 투수
    if (lineup.pitcher?.name) posToName["P"] = lineup.pitcher.name;

    // 야수들
    (lineup.batters ?? []).forEach((b: any) => {
      if (b?.position && b?.name) posToName[b.position] = b.name;
    });

    // ✅ 좌표(initialLeft/Top)와 sportPosition(스왑 결과)을 유지한 채 라벨만 업데이트
    setBlackBadgeConfigs((prev) =>
      prev.map((cfg) => ({
        ...cfg,
        label: posToName[cfg.sportPosition] ?? "", // 포지션→이름 매핑
      }))
    );

    // 선택: 라벨만 바꾸는 거라면 blackPositions 초기화는 필요 없음
  }, [
    isHomeAttack,
    sseData,
    // 스냅샷이 평면형이면 ↓ 이렇게 넓게 걸어도 됨
    // snapshotData,
  ]);

  const diamondSvgRef = useRef<SVGSVGElement | null>(null);
  const diamondPolyRef = useRef<SVGPolygonElement | null>(null);
  type PassedMap = Record<BaseId, boolean>;
  const [isOutside, setIsOutside] = useState(false);
  // ② useRef 에 제네릭을 명시하고, reduce에도 초기값 타입을 단언
  const passedBasesRef = useRef<Record<string, PassedMap>>(
    badgeConfigs.reduce<Record<string, PassedMap>>((acc, { id }) => {
      // 각 베이스를 false 로 초기화
      const map = {} as PassedMap;
      BASE_IDS.forEach((base) => {
        map[base] = false;
      });
      acc[id] = map;
      return acc;
    }, {}) // {} 가 Record<string, PassedMap> 임을 TS에게 알려줌
  );

  const lastPassedRef = useRef<Record<string, BaseId | null>>(
    badgeConfigs.reduce((acc, cfg) => {
      acc[cfg.id] = null;
      return acc;
    }, {} as Record<string, BaseId | null>)
  );
  // 3) 통과한 베이스 중 최대 순서
  const maxReachedRef = useRef<Record<string, number>>(
    badgeConfigs.reduce((acc, cfg) => {
      acc[cfg.id] = 0;
      return acc;
    }, {} as Record<string, number>)
  );

  function DraggableBadge({
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
  }) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
      id,
    });
    const combinedRef = (el: HTMLElement | null) => {
      setNodeRef(el);
      badgeRefs.current[id] = el;
    };

    const left = snapInfo ? `${snapInfo.pos.xPct}%` : initialLeft;
    const top = snapInfo ? `${snapInfo.pos.yPct}%` : initialTop;

    const dx = transform?.x ?? 0;
    const dy = transform?.y ?? 0;

    return (
      <NameBadge
        ref={combinedRef}
        style={{
          position: "absolute",
          left,
          top,
          transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`,
        }}
        {...attributes}
        {...listeners}
      >
        {label}
      </NameBadge>
    );
  }

  // 타자 이름 결정
  // const currentBatterName = useMemo(() => {
  //   const arr = sseData?.playerRecords?.batters;
  //   if (!Array.isArray(arr) || arr.length === 0) return null;
  //   return arr[arr.length - 1]?.name ?? null;
  // }, [sseData?.playerRecords?.batters]);
  // const currentBatterName = useMemo(() => {
  //   const arr = sseData?.playerRecords?.batters;
  //   if (!Array.isArray(arr) || arr.length === 0) return null;
  //   return arr[0]?.name ?? null; // arr[arr.length - 1]에서 arr[0]으로 변경
  // }, [sseData?.playerRecords?.batters]);

  // console.log("currentBatterName", currentBatterName);

  // 상단에 state 추가 (이미 있음)
  const [selectedInning, setSelectedInning] = useState<number | null>(null);
  const [opponentPitcherName, setOpponentPitcherName] =
    useState<string>("최원태");
  const RESULT_LABELS: Record<string, string> = {
    "1B": "안타",
    "2B": "2루타",
    "3B": "3루타",
    HR: "홈런",
    BB: "볼넷",
    SF: "희생타",
    SH: "희생타",
    SO: "삼진",
    O: "아웃",
    SO_DROP: "낫아웃",
    FC: "ETC",
    IF: "ETC",
    E: "실책",
  };

  const getResultLabel = (code?: string) =>
    RESULT_LABELS[
      String(code ?? "")
        .trim()
        .toUpperCase()
    ] ?? String(code ?? "");

  // batters 원본 → UI에서 쓰기 좋은 형태로 매핑
  const battersForUI = useMemo(() => {
    const innings = sseData?.playerRecords?.innings ?? [];

    // 선택된 이닝이 없으면 빈 객체 반환 (일관된 타입 유지)
    if (selectedInning === null) return { top: [], bot: [] };

    // 선택된 이닝의 TOP과 BOT 데이터 가져오기
    const topData = innings.find(
      (inn) => inn.inning === selectedInning && inn.inningHalf === "TOP"
    );
    const botData = innings.find(
      (inn) => inn.inning === selectedInning && inn.inningHalf === "BOT"
    );

    // TOP과 BOT의 타자들을 가져오기 (역순 정렬 제거)
    const topBatters = topData?.batters ?? [];
    const botBatters = botData?.batters ?? [];

    // TOP과 BOT를 분리해서 반환
    return {
      top: topBatters.map((b) => ({
        id: b.id,
        name: b.name,
        battingOrder: b.battingOrder,
        avg: b.battingAverage ?? 0,
        battingResult: b.battingResult ?? "",
        inningHalf: b.inningHalf,
        today: {
          PA: b.todayStats?.PA ?? 0,
          AB: b.todayStats?.AB ?? 0,
          H: b.todayStats?.H ?? 0,
          BB: 0,
          R: b.todayStats?.R ?? 0,
        },
        opponentPitcher: b.opposingPitcher?.name ?? "-",
      })),
      bot: botBatters.map((b) => ({
        id: b.id,
        name: b.name,
        battingOrder: b.battingOrder,
        avg: b.battingAverage ?? 0,
        battingResult: b.battingResult ?? "",
        inningHalf: b.inningHalf,
        today: {
          PA: b.todayStats?.PA ?? 0,
          AB: b.todayStats?.AB ?? 0,
          H: b.todayStats?.H ?? 0,
          BB: 0,
          R: b.todayStats?.R ?? 0,
        },
        opponentPitcher: b.opposingPitcher?.name ?? "-",
      })),
    };
  }, [sseData?.playerRecords?.innings, selectedInning]);
  // currentBatterName을 다음과 같이 수정
  const currentBatterName = useMemo(() => {
    const innings = sseData?.playerRecords?.innings ?? [];
    const currentInning = sseData?.gameSummary?.inning;
    const currentHalf = sseData?.gameSummary?.inningHalf;

    const currentInningData = innings.find(
      (inn) => inn.inning === currentInning && inn.inningHalf === currentHalf
    );

    const batters = currentInningData?.batters ?? [];

    // battingResult가 null인 타자 = 현재 타석 중인 타자
    const currentBatter = batters.find((b) => b.battingResult === null);

    // 없으면 waitingBatters에서 가져오기
    if (!currentBatter) {
      const waiting = sseData?.waitingBatters ?? [];
      return waiting[0]?.name ?? null;
    }

    return currentBatter.name;
  }, [
    sseData?.playerRecords?.innings,
    sseData?.gameSummary?.inning,
    sseData?.gameSummary?.inningHalf,
    sseData?.waitingBatters,
  ]);

  console.log("currentBatterName", currentBatterName);

  // const isCompact = (battersForUI?.length ?? 0) < 3;
  const OUT_CODES = new Set(["SO", "O", "SF", "SH"]);
  const isOutResult = (code) => OUT_CODES.has(String(code).toUpperCase());

  // 타자 주자 위치 결정
  // ── 배지 스냅 상태 (좌표는 %로 관리) ──
  type SnapInfo = { base: BaseId; pos: { xPct: number; yPct: number } };
  const initialBadgeSnaps = badgeConfigs.reduce((acc, cfg) => {
    acc[cfg.id] = null as SnapInfo | null;
    return acc;
  }, {} as Record<string, SnapInfo | null>);
  const [badgeSnaps, setBadgeSnaps] =
    useState<Record<string, SnapInfo | null>>(initialBadgeSnaps);

  // ── 배지 라벨/활성/런너 매핑 ──
  const badgeRefs = useRef<Record<string, HTMLElement | null>>({});
  const [activeBadges, setActiveBadges] = useState(
    badgeConfigs.map((c) => c.id)
  );
  const [runnerInfoByBadge, setRunnerInfoByBadge] = useState<
    Record<string, { runnerId: number; name: string }>
  >({});
  const EXCLUDED_RUNNER_ID = -1;

  // 흰 배지만 추출 → 첫 번째를 타자 배지로 사용
  const allWhiteBadges = useMemo(
    () => badgeConfigs.filter((c) => !c.id.startsWith("black-badge")),
    [badgeConfigs]
  );
  const batterWhiteBadgeId = useMemo(
    () => allWhiteBadges[0]?.id ?? null,
    [allWhiteBadges]
  );

  // 현재 타자 이름/ID (sseData로 동기화 되어 있음)

  // 루/래퍼 좌표 캐시 훅 사용
  const { wrapperRectRef, baseRectsRef, refreshRects } = useRectsCache(
    wrapperRef,
    baseRefs
  );

  // 숫자 베이스 → BaseId
  const baseNumToId: Record<number, BaseId> = {
    1: "first-base",
    2: "second-base",
    3: "third-base",
    4: "home-base", // 필요시
  };

  const syncRunnersOnBase = useCallback(() => {
    // const runners = sseData?.inningStats?.actual?.runnersOnBase ?? [];

    // 주자 정보는 top-level runnersOnBase 를 우선 사용 (없으면 구버전 경로 fallback)
    const runners =
      sseData?.runnersOnBase ??
      sseData?.inningStats?.actual?.runnersOnBase ??
      []; // [{id, name, base}, ...]

    if (!wrapperRef.current) return;

    // 타자 배지를 제외한 나머지 흰 배지들 중에서 주자에게 할당
    const candidateBadges = allWhiteBadges
      .map((c) => c.id)
      .filter((id) => id !== batterWhiteBadgeId);

    const used = new Set<string>();
    const nextBadgeSnaps: Record<string, SnapInfo | null> = { ...badgeSnaps };
    const nextRunnerMap: Record<string, { runnerId: number; name: string }> = {
      ...runnerInfoByBadge,
    };

    // 초기화: 일단 모두 null/제외로 만들고 다시 채움
    candidateBadges.forEach((id) => {
      nextBadgeSnaps[id] = null;
      nextRunnerMap[id] = { runnerId: EXCLUDED_RUNNER_ID, name: "할당 제외" };
    });

    const wrapperRect = wrapperRectRef.current!;
    const pickBadge = () => candidateBadges.find((id) => !used.has(id));

    runners.forEach((r: any) => {
      const baseId = baseNumToId[r.base as number];
      const rect = baseRectsRef.current[baseId];
      const badgeId = pickBadge();

      if (!baseId || !rect || !badgeId) return;

      const cx = rect.left + rect.width / 2 - wrapperRect.left;
      const cy = rect.top + rect.height / 2 - wrapperRect.top;

      nextBadgeSnaps[badgeId] = {
        base: baseId,
        pos: {
          xPct: (cx / wrapperRect.width) * 100,
          yPct: (cy / wrapperRect.height) * 100,
        },
      };
      nextRunnerMap[badgeId] = { runnerId: r.id, name: r.name };
      used.add(badgeId);
    });

    // 동일 내용이면 setState 생략하여 렌더 폭주 방지
    if (JSON.stringify(badgeSnaps) !== JSON.stringify(nextBadgeSnaps)) {
      setBadgeSnaps(nextBadgeSnaps);
    }
    if (JSON.stringify(runnerInfoByBadge) !== JSON.stringify(nextRunnerMap)) {
      setRunnerInfoByBadge(nextRunnerMap);
    }
  }, [
    sseData,
    allWhiteBadges,
    batterWhiteBadgeId,

    wrapperRectRef,
    baseRectsRef,
  ]);

  // sseData가 바뀌면 한 번 스냅 동기화
  useEffect(() => {
    if (!sseData) return;
    // DOMRect가 먼저 준비되도록 한 프레임 뒤에 실행
    requestAnimationFrame(() => {
      refreshRects();
      requestAnimationFrame(() => syncRunnersOnBase());
    });
  }, [sseData, refreshRects, syncRunnersOnBase]);

  const lastItem = (v) => (Array.isArray(v) ? v[v.length - 1] : v ?? undefined);

  // memo로 파생값 생성
  const lastPitcher = useMemo(
    () => lastItem(sseData?.playerRecords?.pitcher),
    [sseData?.playerRecords?.pitcher]
  );

  // batterRows3도 수정
  const batterRows3 = useMemo(() => {
    // TOP과 BOT를 합쳐서 반환
    return [...battersForUI.top, ...battersForUI.bot];
  }, [battersForUI]);

  // SSE 데이터 수신 후 모든 배지 상태 완전 업데이트
  // useEffect(() => {
  //   if (!sseData) return;

  //   // 1. 타자 배지 업데이트
  //   const currentBatter = sseData?.playerRecords?.batters?.at(-1);
  //   if (currentBatter && batterWhiteBadgeId) {
  //     // 타자 배지 활성화 및 라벨 업데이트
  //   }

  //   // 2. 주자 배지 완전 업데이트
  //   const runners = sseData?.runnersOnBase ?? [];

  //   // 3. 수비수 배지 업데이트 (이미 구현됨)

  //   // 4. 배지 활성화/비활성화 상태 업데이트
  //   const activeBadgeIds = [];
  //   if (currentBatter) activeBadgeIds.push(batterWhiteBadgeId);
  //   runners.forEach((_, index) => {
  //     if (allWhiteBadges[index + 1]) {
  //       activeBadgeIds.push(allWhiteBadges[index + 1].id);
  //     }
  //   });
  //   setActiveBadges(activeBadgeIds);
  // }, [sseData]);
  useEffect(() => {
    if (!sseData) return;

    const activeBadgeIds = [];

    // 1. 타자 배지는 항상 활성화 (currentBatterName 있으면)
    if (currentBatterName && batterWhiteBadgeId) {
      activeBadgeIds.push(batterWhiteBadgeId);
    }

    // 2. 주자 배지 활성화
    const runners = sseData?.runnersOnBase ?? [];
    runners.forEach((_, index) => {
      if (allWhiteBadges[index + 1]) {
        activeBadgeIds.push(allWhiteBadges[index + 1].id);
      }
    });

    setActiveBadges(activeBadgeIds);
  }, [sseData]);

  // 초기 이닝 선택 (현재 이닝이 바뀌면 항상 업데이트)
  useEffect(() => {
    if (!sseData) return;

    const currentInning = sseData?.gameSummary?.inning;

    if (currentInning) {
      setSelectedInning(currentInning);
    }
  }, [sseData?.gameSummary?.inning]);

  const formatInnings = (ip: number): string => {
    if (!ip || ip === 0) return "0";

    const fullInnings = Math.floor(ip / 3);
    const outs = ip % 3;

    if (outs === 0) {
      return fullInnings.toString();
    } else {
      return `${fullInnings} ${outs}/3`;
    }
  };

  // 게임 종료 상태 추가
  const [gameEnded, setGameEnded] = useState(false);
  const [gameEndedMessage, setGameEndedMessage] = useState("");

  const hasInningData = useCallback(
    (inning: number) => {
      const innings = sseData?.playerRecords?.innings ?? [];
      return innings.some((inn) => inn.inning === inning);
    },
    [sseData?.playerRecords?.innings]
  );

  return (
    <GameRecordContainer>
      <ScoreBoardWrapper>
        <InningHeader>
          {inningHeaders.map((inn, i) => (
            <InningCell key={i}>{inn}</InningCell>
          ))}
        </InningHeader>

        {/* Team A */}
        <TeamRow>
          <TeamNameCell>
            {sseData?.gameSummary?.awayTeam?.name?.slice(0, 3)}
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
            {sseData?.gameSummary?.homeTeam?.name?.slice(0, 3)}
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

      <GraphicWrapper
        // as="svg"
        ref={wrapperRef}
        // viewBox="0 0 110 110"
        // preserveAspectRatio="xMidYMid meet"

        // outside={isOutside}
      >
        <HomeWrapper />
        <LineWrapper />
        <HomeBaseWrapper />
        <Ground />

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
            points="55,97 61.5,103.5 55,110 48.5,103.5"
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
                <div></div>
              )}
            </OnDeckNameWrapper>
          </OnDeckWrapper>
        </SideWrapper>
        <LeftSideWrapper>
          <InningBoard>
            <ArrowUp color={!isHomeAttack ? "red" : "#B8B8B8"} />
            <InningNumber> {sseData?.gameSummary.inning}</InningNumber>
            <ArrowDown color={isHomeAttack ? "red" : "#B8B8B8"} />
          </InningBoard>
          <LittleScoreBoardWrapper>
            <AwayTeamWrapper>
              <AwayTeamName>
                {" "}
                {sseData?.gameSummary?.awayTeam?.name?.slice(0, 3)}
              </AwayTeamName>
              <AwayTeamScore>
                {sseData?.gameSummary?.scoreboard.totals.away.R}
              </AwayTeamScore>
            </AwayTeamWrapper>
            <HomeTeamWrapper>
              <HomeTeamName>
                {" "}
                {sseData?.gameSummary?.homeTeam?.name?.slice(0, 3)}
              </HomeTeamName>
              <HomeTeamScore>
                {sseData?.gameSummary?.scoreboard.totals.home.R}
              </HomeTeamScore>
            </HomeTeamWrapper>
          </LittleScoreBoardWrapper>
        </LeftSideWrapper>

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
        {badgeConfigs
          .filter((cfg) => {
            if (!activeBadges.includes(cfg.id)) return false;

            // 타자 배지: 현재 타자 ID가 있어야 표시
            if (cfg.id === batterWhiteBadgeId) return true;

            // 주자 배지: runnerInfo가 있고 excluded(-1) 아니어야 표시
            const info = runnerInfoByBadge[cfg.id];
            if (!info) return false;
            if (info.runnerId === EXCLUDED_RUNNER_ID) return false;
            return info.runnerId != null;
          })
          .map((cfg) => {
            // 라벨 덮어쓰기: 타자는 currentBatterName, 주자는 runnerInfo 이름
            let label = cfg.label;
            if (cfg.id === batterWhiteBadgeId && currentBatterName) {
              label = currentBatterName;
              console.log("타자 배지 렌더링:", label);
            } else if (runnerInfoByBadge[cfg.id]) {
              label = runnerInfoByBadge[cfg.id].name;
            }
            return (
              <DraggableBadge
                key={cfg.id}
                id={cfg.id}
                label={label}
                initialLeft={cfg.initialLeft}
                initialTop={cfg.initialTop}
                snapInfo={badgeSnaps[cfg.id]}
              />
            );
          })}
      </GraphicWrapper>
      <InningRow>
        {[1, 2, 3, 4, 5, 6, 7].map((inning) => (
          <InningItem
            key={inning}
            $isSelected={selectedInning === inning}
            $hasData={hasInningData(inning)}
            onClick={() => {
              // 데이터가 있는 이닝만 클릭 가능
              if (hasInningData(inning)) {
                setSelectedInning(inning);
                console.log(`${inning}회 클릭됨`);
              }
            }}
          >
            {inning}회
          </InningItem>
        ))}
      </InningRow>
      <PlayersRow>
        <BatterPlayerBox $compact={(batterRows3?.length ?? 0) < 3}>
          {/* BOT 이닝 렌더링 */}
          {battersForUI.bot.length > 0 && (
            <>
              <InningDividerContainer>
                <InningDividerText>{selectedInning}회말</InningDividerText>
                <InningDividerLine>
                  <InningDividerReal />
                </InningDividerLine>
              </InningDividerContainer>
              {[...battersForUI.bot].reverse().map((b, index, array) => (
                <BatterPlayerSingleBox
                  key={b.id}
                  id="batter-player-single-box"
                  $isLast={index === array.length - 1}
                >
                  <BatterGroup>
                    <BatterRow>
                      <WhoContainer>
                        <NameAvgContainer>
                          <PlayerName $nameLength={b.name?.length}>
                            {b.name?.slice(0, 4)}
                          </PlayerName>
                          <AvgText>
                            <AvgLabel>타율</AvgLabel>
                            <AvgValue>{Number(b.avg).toFixed(3)}</AvgValue>
                          </AvgText>
                        </NameAvgContainer>
                        <ResultOrderContainer>
                          <ResultBox
                            $isOut={isOutResult(b.battingResult)}
                            style={{
                              visibility: b.battingResult
                                ? "visible"
                                : "hidden",
                            }}
                          >
                            {b.battingResult
                              ? getResultLabel(b.battingResult)
                              : ""}
                          </ResultBox>
                          <BattingOrderLabel>
                            {b.battingOrder}번타자
                          </BattingOrderLabel>
                        </ResultOrderContainer>
                      </WhoContainer>
                      <TodayContainer>
                        <TodayFrame>
                          <TodayLabel>타석</TodayLabel>
                          <TodayValue>{b.today.PA}</TodayValue>
                        </TodayFrame>
                        <TodayFrame>
                          <TodayLabel>타수</TodayLabel>
                          <TodayValue>{b.today.AB}</TodayValue>
                        </TodayFrame>
                        <TodayFrame>
                          <TodayLabel>안타</TodayLabel>
                          <TodayValue>{b.today.H}</TodayValue>
                        </TodayFrame>
                        <TodayFrame>
                          <TodayLabel>볼넷</TodayLabel>
                          <TodayValue>{b.today.BB}</TodayValue>
                        </TodayFrame>
                        <TodayFrame>
                          <TodayLabel>득점</TodayLabel>
                          <TodayValue>{b.today.R}</TodayValue>
                        </TodayFrame>
                      </TodayContainer>
                      <OpponentPitcherFrame>
                        <OpponentPitcherLabel>상대투수</OpponentPitcherLabel>
                        <OpponentPitcherName>
                          {b.opponentPitcher}
                        </OpponentPitcherName>
                      </OpponentPitcherFrame>
                    </BatterRow>
                  </BatterGroup>
                </BatterPlayerSingleBox>
              ))}
            </>
          )}

          {/* TOP 이닝 렌더링 */}
          {battersForUI.top.length > 0 && (
            <>
              <InningDividerContainer $isTop={battersForUI.bot.length > 0}>
                <InningDividerText>{selectedInning}회초</InningDividerText>
                <InningDividerLine>
                  <InningDividerReal />
                </InningDividerLine>
              </InningDividerContainer>
              {[...battersForUI.top].reverse().map((b, index, array) => (
                <BatterPlayerSingleBox
                  key={b.id}
                  id="batter-player-single-box"
                  $isLast={index === array.length - 1}
                >
                  <BatterGroup>
                    <BatterRow>
                      <WhoContainer>
                        <NameAvgContainer>
                          <PlayerName $nameLength={b.name?.length}>
                            {b.name?.slice(0, 4)}
                          </PlayerName>
                          <AvgText>
                            <AvgLabel>타율</AvgLabel>
                            <AvgValue>{Number(b.avg).toFixed(3)}</AvgValue>
                          </AvgText>
                        </NameAvgContainer>
                        <ResultOrderContainer>
                          <ResultBox
                            $isOut={isOutResult(b.battingResult)}
                            style={{
                              visibility: b.battingResult
                                ? "visible"
                                : "hidden",
                            }}
                          >
                            {b.battingResult
                              ? getResultLabel(b.battingResult)
                              : ""}
                          </ResultBox>
                          <BattingOrderLabel>
                            {b.battingOrder}번타자
                          </BattingOrderLabel>
                        </ResultOrderContainer>
                      </WhoContainer>
                      <TodayContainer>
                        <TodayFrame>
                          <TodayLabel>타석</TodayLabel>
                          <TodayValue>{b.today.PA}</TodayValue>
                        </TodayFrame>
                        <TodayFrame>
                          <TodayLabel>타수</TodayLabel>
                          <TodayValue>{b.today.AB}</TodayValue>
                        </TodayFrame>
                        <TodayFrame>
                          <TodayLabel>안타</TodayLabel>
                          <TodayValue>{b.today.H}</TodayValue>
                        </TodayFrame>
                        <TodayFrame>
                          <TodayLabel>볼넷</TodayLabel>
                          <TodayValue>{b.today.BB}</TodayValue>
                        </TodayFrame>
                        <TodayFrame>
                          <TodayLabel>득점</TodayLabel>
                          <TodayValue>{b.today.R}</TodayValue>
                        </TodayFrame>
                      </TodayContainer>
                      <OpponentPitcherFrame>
                        <OpponentPitcherLabel>상대투수</OpponentPitcherLabel>
                        <OpponentPitcherName>
                          {b.opponentPitcher}
                        </OpponentPitcherName>
                      </OpponentPitcherFrame>
                    </BatterRow>
                  </BatterGroup>
                </BatterPlayerSingleBox>
              ))}
            </>
          )}
        </BatterPlayerBox>
      </PlayersRow>

      <LoadingOverlay visible={isSubmitting}>
        <LoadingIcon spin fontSize={48} />
      </LoadingOverlay>
      <ErrorAlert error={error} />
    </GameRecordContainer>
  );
}
