// import {
//   useState,
//   useEffect,
//   useCallback,
//   CSSProperties,
//   useRef,
//   useMemo,
//   useLayoutEffect,
//   memo,
// } from "react";
// import {
//   DndContext,
//   useDraggable,
//   useDroppable,
//   DragEndEvent,
//   useSensors,
//   PointerSensor,
//   TouchSensor,
//   useSensor,
//   CollisionDetection,
//   DragOverEvent,
//   Modifier,
//   MeasuringStrategy,
// } from "@dnd-kit/core";
// import { restrictToParentElement } from "@dnd-kit/modifiers";

// // import GroundPng from "/images/ground-without-home.png";

// import { useRouter } from "next/router";
// import API from "../../../../commons/apis/api";
// import {
//   GameRecordContainer,
//   InningHeader,
//   InningCell,
//   TeamRow,
//   TeamNameCell,
//   TeamScoreCell,
//   ControlButtonsRow,
//   ControlButtonsWrapper,
//   ControlButton,
//   RecordActionsRow,
//   RecordActionButton,
//   ScoreBoardWrapper,
//   GraphicWrapper,
//   FullImage,
//   OutCount,
//   Ellipse,
//   // OverlaySvg,
//   ResetDot,
//   Rotator,
//   DiamondSvg,
//   NameBadge,
//   NameText,
//   PlayersRow,
//   PlayerBox,
//   OrderBadge,
//   PlayerWrapper,
//   PlayerPosition,
//   PlayerInfo,
//   ReconstructionWrapper,
//   ReconstructionTitle,
//   ReconstructionButtonWrapper,
//   ReconstructionSwitch,
//   PlayerChangeButton,
//   EliteBox,
//   WildCardBox,
//   PlayerExWrapper,
//   WildCardBoxNone,
//   OnDeckWrapper,
//   OutZoneWrapper,
//   CustomBoundaryWrapper,
//   Ground,
//   HomeWrapper,
//   LineWrapper,
//   HomePlateOverlay,
//   HomeBaseWrapper,
//   SideWrapper,
//   LeftSideWrapper,
//   InningBoard,
//   LittleScoreBoardWrapper,
//   ControlButtonWhite,
//   VsText,
//   LeftArrow,
//   RightArrow,
//   Dot,
//   InningNumber,
//   AwayTeamName,
//   HomeTeamName,
//   AwayTeamWrapper,
//   HomeTeamWrapper,
//   AwayTeamScore,
//   HomeTeamScore,
// } from "./gameRecord-v2.style";
// import HitModal from "../../modals/recordModal/hitModal";
// import OutModal from "../../modals/recordModal/outModal";
// import EtcModal from "../../modals/recordModal/etcModal";
// import DefenseChangeModal from "../../modals/defenseChange";
// import GameOverModal from "../../modals/gameOverModal";
// import ScorePatchModal from "../../modals/scorePatchModal";
// import {
//   awayBatterNumberState,
//   homeBatterNumberState,
//   substitutionSwappedState,
// } from "../../../../commons/stores";
// import { useRecoilState } from "recoil";
// import {
//   LoadingIcon,
//   LoadingOverlay,
// } from "../../../../commons/libraries/loadingOverlay";
// import ErrorAlert from "../../../../commons/libraries/showErrorCode";
// import {
//   ModalButton,
//   ModalContainer,
//   ModalOverlay,
//   ModalTitleSmaller,
// } from "../../modals/modal.style";
// import GroundRecordModal from "../../modals/groudRecordModal/groundRecordModal";
// import { ArrowUp } from "../../../../commons/libraries/arrow";
// import ArrowDown from "../../../../commons/libraries/arrowDown";
// import { badgeConfigs } from "./gameRecord.variables";
// import RightPolygon from "../../../../commons/libraries/rightPolygon";
// import LeftPolygon from "../../../../commons/libraries/leftPolygon";

// export default function GameRecordPageV2() {
//   const [error, setError] = useState(null);
//   const router = useRouter();
//   const recordId = router.query.recordId;
//   const [outs, setOuts] = useState<boolean[]>([false, false, false]);

//   // 이닝 헤더 (1~7, R, H)
//   const inningHeaders = ["", "1", "2", "3", "4", "5", "6", "7", "R", "H"];

//   // 팀 이름
//   const [teamAName, setTeamAName] = useState("");
//   const [teamBName, setTeamBName] = useState("");

//   // 이닝별 점수 (9칸: 7이닝 + R, H)
//   const [teamAScores, setTeamAScores] = useState(Array(9).fill(""));
//   const [teamBScores, setTeamBScores] = useState(Array(9).fill(""));

//   // 이번 이닝 득점
//   const [thisInningScore, setThisInningScore] = useState(0);

//   // 현재 타자/투수
//   const [batter, setBatter] = useState({
//     battingOrder: 0,
//     playerId: 0,
//     playerName: "-",
//     isElite: false,
//     isWc: false,
//     position: "-",
//   });
//   const [pitcher, setPitcher] = useState({
//     battingOrder: 0,
//     playerId: 0,
//     playerName: "-",
//     isElite: false,
//     isWc: false,
//     position: "P",
//   });

//   // 대기타석 표시용 라인업
//   const awayExample = {
//     batters: [
//       {
//         battingOrder: 1,
//         playerId: 121,
//         playerName: "박민재",
//         position: "CF",
//         isWC: false,
//       },
//       {
//         battingOrder: 2,
//         playerId: 122,
//         playerName: "박용준",
//         position: "LF",
//         isWC: false,
//       },
//       {
//         battingOrder: 3,
//         playerId: 123,
//         playerName: "박지호",
//         position: "RF",
//         isWC: true,
//       },
//       {
//         battingOrder: 4,
//         playerId: 124,
//         playerName: "박준혁",
//         position: "SS",
//         isWC: true,
//       },
//       {
//         battingOrder: 5,
//         playerId: 125,
//         playerName: "김지찬",
//         position: "1B",
//         isWC: false,
//       },
//       {
//         battingOrder: 6,
//         playerId: 126,
//         playerName: "이재현",
//         position: "2B",
//         isWC: false,
//       },
//       {
//         battingOrder: 7,
//         playerId: 127,
//         playerName: "디아즈",
//         position: "3B",
//         isWC: false,
//       },
//       {
//         battingOrder: 8,
//         playerId: 128,
//         playerName: "구자욱",
//         position: "C",
//         isWC: false,
//       },
//       {
//         battingOrder: 9,
//         playerId: 129,
//         playerName: "김헌곤",
//         position: "DH",
//         isWC: true,
//       },
//     ],
//     pitcher: {
//       playerId: 134,
//       playerName: "원태인",
//       isWC: false,
//     },
//   };

//   const homeExample = {
//     batters: [
//       {
//         battingOrder: 1,
//         playerId: 101,
//         playerName: "강하윤",
//         position: "CF",
//         isWC: false,
//       },
//       {
//         battingOrder: 2,
//         playerId: 102,
//         playerName: "김준기",
//         position: "LF",
//         isWC: false,
//       },
//       {
//         battingOrder: 3,
//         playerId: 103,
//         playerName: "윤동현",
//         position: "RF",
//         isWC: false,
//       },
//       {
//         battingOrder: 4,
//         playerId: 104,
//         playerName: "박진우",
//         position: "SS",
//         isWC: true,
//       },
//       {
//         battingOrder: 5,
//         playerId: 105,
//         playerName: "박성민",
//         position: "1B",
//         isWC: true,
//       },
//       {
//         battingOrder: 6,
//         playerId: 106,
//         playerName: "박민수",
//         position: "2B",
//         isWC: true,
//       },
//       {
//         battingOrder: 7,
//         playerId: 107,
//         playerName: "박영수",
//         position: "3B",
//         isWC: false,
//       },
//       {
//         battingOrder: 8,
//         playerId: 108,
//         playerName: "박지훈",
//         position: "C",
//         isWC: false,
//       },
//       {
//         battingOrder: 9,
//         playerId: 121,
//         playerName: "정현우",
//         position: "P",
//         isWC: false,
//       },
//     ],
//     pitcher: {
//       playerId: 121,
//       playerName: "정현우",
//       isWC: false,
//     },
//   };

//   const isHomeAttack = router.query.attack === "home";
//   const lineupExample = isHomeAttack ? homeExample : awayExample;
//   // ── 0) 예시로 batter/pitcher 세팅 ──
//   useEffect(() => {
//     if (!lineupExample) return;

//     // 첫 번째 타자 예시
//     const firstBatter = lineupExample.batters[0]!;
//     setBatter({
//       battingOrder: firstBatter.battingOrder,
//       playerId: firstBatter.playerId,
//       playerName: firstBatter.playerName,
//       isElite: !firstBatter.isWC,
//       isWc: firstBatter.isWC,
//       position: firstBatter.position,
//     });

//     // 투수 예시
//     const exP = lineupExample.pitcher;
//     setPitcher({
//       battingOrder: 0, // 투수니까 굳이 order 필요 없으면 0
//       playerId: exP.playerId,
//       playerName: exP.playerName,
//       isElite: !exP.isWC,
//       isWc: exP.isWC,
//       position: "P",
//     });
//   }, []);

//   const [batterPlayerId, setBatterPlayerId] = useState(0);

//   // Recoil 상태들

//   const [isSubstitutionSwapped, setIsSubstitutionSwapped] = useRecoilState(
//     substitutionSwappedState
//   );

//   // 로딩 상태
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   // attack 쿼리 동기화를 위한 state
//   const [attackVal, setAttackVal] = useState("");

//   // 예시 데이터 객체
//   const exampleScores = {
//     scoreboard: [
//       { inning: 1, inningHalf: "TOP", runs: 1 },
//       { inning: 1, inningHalf: "BOT", runs: 1 },
//       { inning: 2, inningHalf: "TOP", runs: 2 },
//       { inning: 2, inningHalf: "BOT", runs: 1 },
//       { inning: 3, inningHalf: "TOP", runs: 2 },
//       // … 3~7 이닝까지 필요하면 추가
//     ],
//     teamSummary: {
//       away: { runs: 3, hits: 5 },
//       home: { runs: 1, hits: 4 },
//     },
//   };

//   // 대기타석

//   const onDeckPlayers = lineupExample.batters.filter((b) =>
//     [1, 2, 3].includes(b.battingOrder)
//   );

//   // ── 1) 이닝 점수 GET ──
//   const fetchInningScores = useCallback(async () => {
//     if (!recordId) return;
//     try {
//       // 실제 호출은 잠시 주석 처리
//       // const res = await API.get(`/games/${recordId}/scores`);
//       // const response = res.data;

//       const response = exampleScores;
//       // console.log("스코어보드 응답도착");
//       const newA = Array(9).fill("");
//       const newB = Array(9).fill("");

//       if (Array.isArray(response.scoreboard)) {
//         response.scoreboard.forEach((entry) => {
//           const idx = entry.inning - 1;
//           if (idx >= 0 && idx < 7) {
//             if (entry.inningHalf === "TOP") newA[idx] = entry.runs;
//             else newB[idx] = entry.runs;
//           }
//         });
//       }

//       // R, H 컬럼
//       newA[7] = response.teamSummary.away.runs;
//       newA[8] = response.teamSummary.away.hits;
//       newB[7] = response.teamSummary.home.runs;
//       newB[8] = response.teamSummary.home.hits;

//       setTeamAScores(newA);
//       setTeamBScores(newB);

//       // attackVal 계산
//       let newAttack = "away";
//       if (Array.isArray(response.scoreboard) && response.scoreboard.length) {
//         const last = response.scoreboard[response.scoreboard.length - 1];
//         newAttack = last.inningHalf === "TOP" ? "home" : "away";
//       }
//       setAttackVal(newAttack);
//       return newAttack;
//     } catch (err) {
//       // console.error("이닝 점수 로드 실패:", err);
//       setError(err);
//     }
//   }, [router.query.recordId, attackVal]);
//   // ── 2) 현재 타자 GET ──
//   const fetchBatter = useCallback(
//     async (newAttakVal) => {
//       if (!recordId || !attackVal) return;
//       try {
//         // [배포 시 다시 켜기]
//         // const teamType = newAttakVal === "home" ? "home" : "away";
//         // console.log("useEffect내부 팀타입", teamType);
//         // const res = await API.get(
//         //   `/games/${recordId}/current-batter?teamType=${teamType}`
//         //   // { withCredentials: true }
//         // );
//         // setBatter(res.data);
//         // setBatterPlayerId(res.data.playerId);
//         // console.log("타자 응답도착");
//       } catch (err) {
//         // console.error("타자 로드 실패:", err);
//         setError(err);
//       }
//     },
//     [recordId, attackVal]
//   );

//   // ── 3) 현재 투수 GET ──
//   const fetchPitcher = useCallback(
//     async (newAttack) => {
//       if (!recordId || !attackVal) return;
//       try {
//         // [배포 시 다시 켜기]
//         // const teamType = newAttack === "home" ? "away" : "home";
//         // const res = await API.get(
//         //   `/games/${recordId}/current-pitcher?teamType=${teamType}`
//         //   // { withCredentials: true }
//         // );
//         // setPitcher(res.data);
//         // console.log("투수 응답도착");
//       } catch (err) {
//         // console.error("투수 로드 실패:", err);
//         setError(err);
//       }
//     },
//     [recordId, attackVal]
//   );

//   // ── 마운트 및 의존성 변경 시 호출 ──
//   useEffect(() => {
//     // 팀 이름 로컬스토리지에서
//     const matchStr = localStorage.getItem("selectedMatch");
//     if (matchStr) {
//       try {
//         const { awayTeam, homeTeam } = JSON.parse(matchStr);
//         setTeamAName(awayTeam.name);
//         setTeamBName(homeTeam.name);
//       } catch {
//         // console.error("selectedMatch 파싱 실패");
//       }
//     }
//     fetchInningScores();
//   }, [fetchInningScores]);

//   // ── 4) attack 쿼리 실제 동기화 ──
//   useEffect(() => {
//     if (!recordId) return;
//     if (router.query.attack !== attackVal) {
//       router.replace({
//         pathname: router.pathname,
//         query: { ...router.query, attack: attackVal },
//       });
//     }
//   }, [recordId, attackVal, router.query.attack, router]);

//   // ── 기록 액션 ──
//   const handleRecordAction = async (action: string) => {
//     if (isSubmitting) return;

//     switch (action) {
//       case "안타":
//         setIsHitModalOpen(true);
//         break;

//       case "볼넷/사구":
//         setIsSubmitting(true);
//         try {
//           // 1) POST 요청

//           // [배포 시 다시 켜기]
//           // await API.post(
//           //   `/games/${recordId}/plate-appearance`,
//           //   {
//           //     result: "BB",
//           //   }

//           // );

//           // 3) GET 요청들만 다시 실행
//           const newAttack = await fetchInningScores();
//           await fetchBatter(newAttack);
//           await fetchPitcher(newAttack);

//           // 2) Alert 표시 (확인 클릭 후 다음 로직 실행)

//           setIsGroundRecordModalOpen(true);
//           // alert("볼넷/사구 기록 전송 완료");
//         } catch (e) {
//           // console.error("볼넷/사구 오류:", e);
//           setError(e);
//           // alert("볼넷/사구 오류");
//         } finally {
//           setIsSubmitting(false);
//         }
//         break;

//       case "아웃":
//         setIsOutModalOpen(true);
//         break;

//       case "etc":
//         setIsEtcModalOpen(true);
//         break;

//       default:
//         break;
//     }
//   };

//   // ── 교체/공수교대/경기종료 ──
//   const handleSubstitution = (isHome) => {
//     router.push({
//       pathname: `/matches/${recordId}/substitution`,
//       query: { isHomeTeam: isHome },
//     });
//   };
//   // ① POST + alert 후에 resolve 되는 async 함수로 변경
//   // → 여기에 모든 “공수교대” 로직을 몰아서 처리
//   const handleDefenseChange = useCallback(async () => {
//     if (isSubmitting) return;
//     setIsSubmitting(true);
//     try {
//       // 1) POST
//       // await API.post(`/games/${recordId}/scores`, { runs: thisInningScore }),
//       // { withCredentials: true };
//       // 2) 사용자 알림 (확인 클릭 후 다음 단계)
//       // console.log({ runs: thisInningScore });

//       // 3) 로컬 state 리셋
//       setIsSubstitutionSwapped((prev) => !prev);
//       setThisInningScore(0);
//       // 4) GET 리패치
//       // alert("공수교대 완료");
//       const newAttack = await fetchInningScores();
//     } catch (error) {
//       console.error("교대 오류:", error);
//       setError(error);
//       // alert("교대 오류");
//     } finally {
//       setIsSubmitting(false);
//       setIsChangeModalOpen(false);
//     }
//   }, [
//     recordId,
//     thisInningScore,
//     isSubmitting,
//     fetchInningScores,

//     setIsSubstitutionSwapped,
//   ]);

//   const [activeId, setActiveId] = useState<string | null>(null);
//   // ── 모달 상태 ──
//   const [isHitModalOpen, setIsHitModalOpen] = useState(false);
//   const [isOutModalOpen, setIsOutModalOpen] = useState(false);
//   const [isEtcModalOpen, setIsEtcModalOpen] = useState(false);
//   const [isChangeModalOpen, setIsChangeModalOpen] = useState(false);
//   const [isGameEndModalOpen, setIsGameEndModalOpen] = useState(false);
//   const [isScorePatchModalOpen, setIsScorePatchModalOpen] = useState(false);
//   const [selectedCell, setSelectedCell] = useState(null);

//   const handleScoreCellClick = (score, team, idx) => {
//     if (score === "" || idx >= 7) return;
//     setSelectedCell({ score: String(score), team, index: idx });
//     setIsScorePatchModalOpen(true);
//   };
//   // 에러 상태
//   const [validationError, setValidationError] = useState<string | null>(null);

//   useEffect(() => {
//     const originalAlert = window.alert;
//     window.alert = (msg: string) => {
//       setValidationError(msg);
//     };
//     return () => {
//       window.alert = originalAlert;
//     };
//   }, []);

//   // console.log("isHomeAttack", isHomeAttack);

//   // -------------------- 드래그앤드롭 ------------------------//
//   // 드래그 앤 드롭 관련
//   // 베이스 아이디 목록
//   const baseIds = useMemo(
//     () => ["first-base", "second-base", "third-base", "home-base"] as const,
//     []
//   );
//   type BaseId = (typeof baseIds)[number];

//   // 베이스 <polygon> ref 저장
//   const baseRefs = useRef<Record<BaseId, SVGPolygonElement | null>>({
//     "first-base": null,
//     "second-base": null,
//     "third-base": null,
//     "home-base": null,
//   });
//   const { setNodeRef: set1st } = useDroppable({ id: "first-base" });
//   const { setNodeRef: set2nd } = useDroppable({ id: "second-base" });
//   const { setNodeRef: set3rd } = useDroppable({ id: "third-base" });
//   const { setNodeRef: setHome } = useDroppable({ id: "home-base" });

//   // map
//   const droppableSetters = {
//     "first-base": set1st,
//     "second-base": set2nd,
//     "third-base": set3rd,
//     "home-base": setHome,
//   };

//   // wrapper ref (배지·베이스 좌표 계산용)
//   const wrapperRef = useRef<HTMLDivElement>(null);
//   // const wrapperRef = useRef<SVGSVGElement | null>(null);
//   // 배지 설정

//   const baseOrder: Record<(typeof baseIds)[number], number> = useMemo(
//     () => ({
//       "first-base": 1,
//       "second-base": 2,
//       "third-base": 3,
//       "home-base": 4,
//     }),
//     []
//   );
//   interface BlackBadgeConfig {
//     id: string;
//     label: string;
//     initialLeft: string;
//     initialTop: string;
//     sportPosition: string; // 스포츠 포지션 (string)
//   }
//   // ▶️ 1) config 를 state 로

//   const [blackBadgeConfigs, setBlackBadgeConfigs] = useState<
//     BlackBadgeConfig[]
//   >([
//     {
//       id: "black-badge-1",
//       label: "원태인",
//       initialLeft: "50%",
//       initialTop: "55%",
//       sportPosition: "P",
//     },
//     {
//       id: "black-badge-2",
//       label: "강민호",
//       initialLeft: "50%",
//       initialTop: "93%",
//       sportPosition: "C",
//     },
//     {
//       id: "black-badge-3",
//       label: "박병호",
//       initialLeft: "80%",
//       initialTop: "50%",
//       sportPosition: "1B",
//     },
//     {
//       id: "black-badge-4",
//       label: "류지혁",
//       initialLeft: "70%",
//       initialTop: "40%",
//       sportPosition: "2B",
//     },
//     {
//       id: "black-badge-5",
//       label: "김영웅",
//       initialLeft: "20%",
//       initialTop: "50%",
//       sportPosition: "3B",
//     },
//     {
//       id: "black-badge-6",
//       label: "이재현",
//       initialLeft: "30%",
//       initialTop: "40%",
//       sportPosition: "SS",
//     },
//     {
//       id: "black-badge-7",
//       label: "구자욱",
//       initialLeft: "20%",
//       initialTop: "25%",
//       sportPosition: "LF",
//     },
//     {
//       id: "black-badge-8",
//       label: "김지찬",
//       initialLeft: "50%",
//       initialTop: "15%",
//       sportPosition: "CF",
//     },
//     {
//       id: "black-badge-9",
//       label: "김성윤",
//       initialLeft: "80%",
//       initialTop: "25%",
//       sportPosition: "RF",
//     },
//   ]);

//   // 수비 교체 로직
//   // 검정 배지 위치 누적량 관리
//   // 컴포넌트 최상단에

//   const blackBadgeRefs = useRef<Record<string, HTMLElement | null>>({});
//   const initialAnchors = useRef<Record<string, { x: number; y: number }>>({});
//   const initialBlackPositions = blackBadgeConfigs.reduce(
//     (acc, { id }) => ({ ...acc, [id]: { x: 0, y: 0 } }),
//     {} as Record<string, { x: number; y: number }>
//   );

//   const [blackPositions, setBlackPositions] = useState(initialBlackPositions);

//   // ── 2️⃣ 마운트 직후 wrapper 크기 얻어서 초기 anchor 계산 ──
//   useLayoutEffect(() => {
//     const wrapEl = wrapperRef.current;
//     if (!wrapEl) return;
//     const { left, top, width, height } = wrapEl.getBoundingClientRect();
//     blackBadgeConfigs.forEach(({ id, initialLeft, initialTop }) => {
//       const pctX = parseFloat(initialLeft) / 100;
//       const pctY = parseFloat(initialTop) / 100;
//       initialAnchors.current[id] = {
//         x: left + width * pctX,
//         y: top + height * pctY,
//       };
//     });
//     // initialize blackPositions to zero-offsets
//     setBlackPositions(
//       blackBadgeConfigs.reduce((acc, { id }) => {
//         acc[id] = { x: 0, y: 0 };
//         return acc;
//       }, {} as Record<string, { x: number; y: number }>)
//     );
//   }, [blackBadgeConfigs]);

//   function BlackDraggableBadge({
//     cfg,
//     pos,
//   }: {
//     cfg: BlackBadgeConfig;
//     pos: { x: number; y: number };
//   }) {
//     const { attributes, listeners, setNodeRef, transform, isDragging } =
//       useDraggable({
//         id: cfg.id,
//       });

//     // dnd-kit nodeRef + our ref 동시 설정
//     const combinedRef = (el: HTMLElement | null) => {
//       setNodeRef(el);
//       blackBadgeRefs.current[cfg.id] = el;
//     };
//     // 누적 + 현재 드래그 중인 오프셋
//     const dx = pos.x + (transform?.x ?? 0);
//     const dy = pos.y + (transform?.y ?? 0);

//     return (
//       <NameBadge
//         ref={combinedRef}
//         {...attributes}
//         {...listeners}
//         style={{
//           position: "absolute",
//           left: cfg.initialLeft,
//           top: cfg.initialTop,

//           transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`,
//           background: "#000000",
//           color: "#fff",
//           border: "0.3px solid #ffffff",
//           cursor: "grab",
//         }}
//       >
//         {cfg.label}
//         {/* ({cfg.sportPosition}) */}
//       </NameBadge>
//     );
//   }
//   // ▶️ 3) handleBlackDragEnd: swap 로직 수정
//   // ▶️ 3) swap 포함 drag end 핸들러
//   function handleBlackDragEnd(event: DragEndEvent) {
//     const id = event.active.id as string;
//     const prevOff = blackPositions[id];
//     const dx = event.delta?.x ?? 0;
//     const dy = event.delta?.y ?? 0;
//     const newOff = { x: prevOff.x + dx, y: prevOff.y + dy };
//     const el = blackBadgeRefs.current[id];
//     if (el) {
//       const rect = el.getBoundingClientRect();
//       const cx = rect.left + rect.width / 2;
//       const cy = rect.top + rect.height / 2;

//       for (const otherId of Object.keys(blackBadgeRefs.current)) {
//         if (otherId === id) continue;
//         const otherRect =
//           blackBadgeRefs.current[otherId]!.getBoundingClientRect();
//         if (
//           cx >= otherRect.left &&
//           cx <= otherRect.right &&
//           cy >= otherRect.top &&
//           cy <= otherRect.bottom
//         ) {
//           // swap both configs and their sportPosition
//           setBlackBadgeConfigs((prev) => {
//             const a = prev.findIndex((c) => c.id === id);
//             const b = prev.findIndex((c) => c.id === otherId);
//             const copy = [...prev];
//             [copy[a].initialLeft, copy[b].initialLeft] = [
//               copy[b].initialLeft,
//               copy[a].initialLeft,
//             ];
//             [copy[a].initialTop, copy[b].initialTop] = [
//               copy[b].initialTop,
//               copy[a].initialTop,
//             ];
//             [copy[a].sportPosition, copy[b].sportPosition] = [
//               copy[b].sportPosition,
//               copy[a].sportPosition,
//             ];
//             return copy;
//           });
//           // reset offsets to zero so new anchors apply
//           setBlackPositions((prev) => ({
//             ...prev,
//             [id]: { x: 0, y: 0 },
//             [otherId]: { x: 0, y: 0 },
//           }));
//           return;
//         }
//       }
//     }
//     // ── swap 없을 때: offset을 (0,0)으로 초기화하여 초기 위치로 복귀
//     setBlackPositions((prev) => ({
//       ...prev,
//       [id]: { x: 0, y: 0 },
//     }));
//   }

//   // console.log("blackBadgeConfigs", blackBadgeConfigs);

//   const diamondSvgRef = useRef<SVGSVGElement | null>(null);
//   const diamondPolyRef = useRef<SVGPolygonElement | null>(null);
//   type PassedMap = Record<BaseId, boolean>;
//   const [isOutside, setIsOutside] = useState(false);
//   // ② useRef 에 제네릭을 명시하고, reduce에도 초기값 타입을 단언
//   const passedBasesRef = useRef<Record<string, PassedMap>>(
//     badgeConfigs.reduce<Record<string, PassedMap>>((acc, { id }) => {
//       // 각 베이스를 false 로 초기화
//       const map = {} as PassedMap;
//       baseIds.forEach((base) => {
//         map[base] = false;
//       });
//       acc[id] = map;
//       return acc;
//     }, {}) // {} 가 Record<string, PassedMap> 임을 TS에게 알려줌
//   );

//   const lastPassedRef = useRef<Record<string, BaseId | null>>(
//     badgeConfigs.reduce((acc, cfg) => {
//       acc[cfg.id] = null;
//       return acc;
//     }, {} as Record<string, BaseId | null>)
//   );
//   // 3) 통과한 베이스 중 최대 순서
//   const maxReachedRef = useRef<Record<string, number>>(
//     badgeConfigs.reduce((acc, cfg) => {
//       acc[cfg.id] = 0;
//       return acc;
//     }, {} as Record<string, number>)
//   );

//   // 배지별 스냅 정보 관리
//   type SnapInfo = { base: BaseId; pos: { xPct: number; yPct: number } };
//   // 1) 초기 스냅 상태를 미리 저장해 두고…
//   const initialBadgeSnaps = badgeConfigs.reduce((acc, cfg) => {
//     acc[cfg.id] = null;
//     return acc;
//   }, {} as Record<string, SnapInfo | null>);

//   // 2) useState 초기값에 사용
//   const [badgeSnaps, setBadgeSnaps] =
//     useState<Record<string, SnapInfo | null>>(initialBadgeSnaps);

//   // console.log("badgeSnaps", badgeSnaps);

//   // 2) badgeSnaps 상태가 바뀔 때마다 각 베이스가 채워졌는지 체크하는 useEffect
//   useEffect(() => {
//     // badgeSnaps: Record<badgeId, { base: BaseId; pos: { x, y } } | null>
//     const occupancy: Record<BaseId, boolean> = baseIds.reduce((acc, base) => {
//       // badgeSnaps 중에 baseId === base 인 항목이 하나라도 있으면 true
//       acc[base] = Object.values(badgeSnaps).some((snap) => snap?.base === base);
//       return acc;
//     }, {} as Record<BaseId, boolean>);

//     console.log("Base occupancy:", occupancy);
//     // 예: { "first-base": true, "second-base": false, ... }
//   }, [badgeSnaps]);
//   // 센서 정의
//   const sensors = useSensors(useSensor(PointerSensor));

//   const badgeRefs = useRef<Record<string, HTMLElement | null>>({});
//   const [activeBadges, setActiveBadges] = useState(
//     badgeConfigs.map((cfg) => cfg.id)
//   );

//   // 드래그 종료 시 스냅 처리

//   // 1) 오버/종료를 구분할 수 있도록 오버로드 선언
//   // function handleDragEvent(event: DragOverEvent, isEnd: false): void;
//   // function handleDragEvent(event: DragEndEvent, isEnd: true): void;

//   // -------------------- 성능 최적화용 refs --------------------

//   // 컴포넌트 최상단(모든 useState/useRef 아래)에 추가
//   const baseRectsRef = useRef<Partial<Record<BaseId, DOMRect>>>({});
//   const wrapperRectRef = useRef<DOMRect | null>(null);
//   const zoneRectRef = useRef<DOMRect | null>(null);

//   // 측정: 마운트 시 한 번만, 필요하면 resize 시에도 다시 측handleDragEvent정

//   // 1️⃣ 마운트 시 한 번만: DOMRect 캐싱
//   useLayoutEffect(() => {
//     const wrapEl = wrapperRef.current;
//     const zoneEl = outZoneRef.current;
//     if (wrapEl) wrapperRectRef.current = wrapEl.getBoundingClientRect();
//     if (zoneEl) zoneRectRef.current = zoneEl.getBoundingClientRect();

//     baseIds.forEach((baseId) => {
//       const poly = baseRefs.current[baseId];
//       if (poly) {
//         baseRectsRef.current[baseId] = poly.getBoundingClientRect();
//       }
//     });
//   }, []);

//   // (선택) 리사이즈 시에도 다시 측정하려면
//   useEffect(() => {
//     const onResize = () => {
//       if (wrapperRef.current)
//         wrapperRectRef.current = wrapperRef.current.getBoundingClientRect();
//       if (outZoneRef.current)
//         zoneRectRef.current = outZoneRef.current.getBoundingClientRect();
//       baseIds.forEach((baseId) => {
//         const poly = baseRefs.current[baseId];
//         if (poly) baseRectsRef.current[baseId] = poly.getBoundingClientRect();
//       });
//     };
//     window.addEventListener("resize", onResize);
//     return () => window.removeEventListener("resize", onResize);
//   }, []);

//   // 실제 화면 업데이트는 state(isOutside)로, 비교용 값은 ref로
//   const isOutsideRef = useRef(false);
//   // requestAnimationFrame 아이디 저장
//   const rafIdRef = useRef<number | null>(null);

//   // 2) 실제 구현부 (합집합 타입 + 플래그)
//   function handleDragEvent(
//     event: DragOverEvent | DragEndEvent,
//     isEnd: boolean
//   ) {
//     const badgeId = event.active.id as string;
//     const badgeEl = badgeRefs.current[badgeId];
//     const wrapperRect = wrapperRectRef.current;
//     const zoneRect = zoneRectRef.current;
//     if (!badgeEl || !wrapperRect) return;

//     // --- ① badge 중심 좌표 (live) ---
//     const { left, top, width, height } = badgeEl.getBoundingClientRect();
//     const cx = left + width / 2;
//     const cy = top + height / 2;

//     // --- ② out‐of‐zone 검사 (캐시된 zoneRect 사용) ---
//     if (zoneRect) {
//       const outside =
//         cx < zoneRect.left ||
//         cx > zoneRect.right ||
//         cy < zoneRect.top ||
//         cy > zoneRect.bottom;

//       if (outside !== isOutsideRef.current) {
//         isOutsideRef.current = outside;
//         setIsOutside(outside);
//       }
//       // drag end 시 반드시 복귀
//       if (isEnd && outside) {
//         isOutsideRef.current = false;
//         setIsOutside(false);
//       }
//     }

//     // --- 1) drag over: 베이스 통과 기록 & 하이라이트 (캐시된 baseRectsRef 사용) ---
//     if (!isEnd) {
//       for (const baseId of baseIds) {
//         const rect = baseRectsRef.current[baseId];
//         const idx = baseIds.indexOf(baseId);
//         if (!rect) continue;

//         // 순서 검사(직전 루 통과 여부)
//         if (idx > 0) {
//           const prev = baseIds[idx - 1];
//           if (!passedBasesRef.current[badgeId][prev]) continue;
//         }

//         if (
//           cx >= rect.left &&
//           cx <= rect.right &&
//           cy >= rect.top &&
//           cy <= rect.bottom
//         ) {
//           // highlight
//           const poly = baseRefs.current[baseId]!;
//           poly.classList.add("highlight");
//           setTimeout(() => poly.classList.remove("highlight"), 500);

//           // 홈베이스 액티브
//           if (baseId === "home-base") {
//             setIsHomeBaseActive(true);
//             setTimeout(() => setIsHomeBaseActive(false), 500);
//           }

//           // 통과 기록
//           const order = baseOrder[baseId];
//           if (order > maxReachedRef.current[badgeId]) {
//             passedBasesRef.current[badgeId][baseId] = true;
//             lastPassedRef.current[badgeId] = baseId;
//             maxReachedRef.current[badgeId] = order;
//           }
//           break;
//         }
//       }
//       return;
//     }

//     // --- 2) drag end: drop‐base 판별 & 스냅 ---
//     let dropBase: BaseId | null = null;
//     let dropPos: { x: number; y: number } | null = null;

//     // 캐시된 base rect 로 drop 감지
//     for (const baseId of baseIds) {
//       const rect = baseRectsRef.current[baseId];
//       if (!rect) continue;
//       if (
//         cx >= rect.left &&
//         cx <= rect.right &&
//         cy >= rect.top &&
//         cy <= rect.bottom
//       ) {
//         dropBase = baseId;
//         dropPos = {
//           x: rect.left + rect.width / 2 - wrapperRect.left,
//           y: rect.top + rect.height / 2 - wrapperRect.top,
//         };
//         break;
//       }
//     }

//     // out‐zone 밖 드롭 시 제거
//     if (
//       zoneRect &&
//       (cx < zoneRect.left ||
//         cx > zoneRect.right ||
//         cy < zoneRect.top ||
//         cy > zoneRect.bottom)
//     ) {
//       setActiveBadges((prev) => prev.filter((id) => id !== badgeId));
//       setBadgeSnaps((prev) => ({ ...prev, [badgeId]: null }));
//       baseIds.forEach(
//         (base) => (passedBasesRef.current[badgeId][base] = false)
//       );
//       lastPassedRef.current[badgeId] = null;
//       maxReachedRef.current[badgeId] = 0;
//       return;
//     }

//     // snapBase 결정 (dropBase 우선, 없으면 lastPassedRef)
//     let snapBase = dropBase ?? lastPassedRef.current[badgeId];
//     let snapPos = dropPos;
//     const isWhite = !badgeId.startsWith("black-badge"); // ← 흰 배지 판별
//     // 홈베이스 완주 시 제거
//     if (snapBase === "home-base") {
//       const passed = passedBasesRef.current[badgeId];
//       if (["first-base", "second-base", "third-base"].every((b) => passed[b])) {
//         setActiveBadges((prev) => prev.filter((id) => id !== badgeId));
//         // 2) 스냅 정보 삭제 → occupancy 자동 false
//         setBadgeSnaps((prev) => {
//           const next = { ...prev };
//           next[badgeId] = null;
//           return next;
//         });

//         // 3) 통과 기록/최대순서/마지막 통과 초기화
//         baseIds.forEach((base) => {
//           passedBasesRef.current[badgeId][base] = false;
//         });
//         lastPassedRef.current[badgeId] = null;
//         maxReachedRef.current[badgeId] = 0;
//       }
//       return;
//     }

//     // dropBase 없으면 캐시된 rect 로 snapPos 계산
//     if (!dropBase && snapBase) {
//       const rect = baseRectsRef.current[snapBase]!;
//       snapPos = {
//         x: rect.left + rect.width / 2 - wrapperRect.left,
//         y: rect.top + rect.height / 2 - wrapperRect.top,
//       }; // px 기준 임시 값
//     }

//     // ✅ NEW: px → % 변환 (흰 배지 전용)
//     let snapPosPct: { xPct: number; yPct: number } | null = null;
//     if (isWhite && snapPos) {
//       snapPosPct = {
//         xPct: (snapPos.x / wrapperRect.width) * 100,
//         yPct: (snapPos.y / wrapperRect.height) * 100,
//       };
//     }

//     // occupancy 검사 & 상태 업데이트
//     const occupied = Object.entries(badgeSnaps).some(
//       ([otherId, snap]) => otherId !== badgeId && snap?.base === snapBase
//     );

//     setBadgeSnaps((prev) => {
//       const next = { ...prev };
//       if (snapBase && snapPos && !occupied) {
//         const idx = baseIds.indexOf(snapBase);
//         const prevBase = idx > 0 ? baseIds[idx - 1] : null;
//         if (!prevBase || passedBasesRef.current[badgeId][prevBase]) {
//           // ✅ CHANGED: 흰 배지는 %좌표 저장
//           if (isWhite && snapPosPct) {
//             next[badgeId] = { base: snapBase, pos: snapPosPct };
//           } else if (!isWhite && snapPos) {
//             // (검정 배지 스냅 안 쓰면 이 블록 삭제해도 됨)
//             next[badgeId] = {
//               base: snapBase,
//               pos: {
//                 xPct: (snapPos.x / wrapperRect.width) * 100,
//                 yPct: (snapPos.y / wrapperRect.height) * 100,
//               },
//             };
//           }
//           maxReachedRef.current[badgeId] = baseOrder[snapBase];
//         }
//       }
//       return next;
//     });

//     // 다음 드래그를 위해 마지막 기록 초기화
//     lastPassedRef.current[badgeId] = null;
//   }

//   // DraggableBadge 컴포넌트
//   // function DraggableBadge({
//   //   id,
//   //   label,
//   //   initialLeft,
//   //   initialTop,
//   //   snapInfo,
//   // }: {
//   //   id: string;
//   //   label: string;
//   //   initialLeft: string;
//   //   initialTop: string;
//   //   snapInfo: SnapInfo | null;
//   // }) {
//   //   const { attributes, listeners, setNodeRef, transform } = useDraggable({
//   //     id,
//   //   });
//   //   if (snapInfo) {
//   //     // console.log(`🔔 [${id}] snapInfo:`, snapInfo);
//   //   }
//   //   const combinedRef = (el: HTMLElement | null) => {
//   //     setNodeRef(el);
//   //     badgeRefs.current[id] = el;
//   //   };

//   //   // CSS position & transform 결정
//   //   if (snapInfo) {
//   //     const { pos } = snapInfo;
//   //     // console.log("pos", pos);
//   //     const offsetX = transform?.x ?? 0;
//   //     const offsetY = transform?.y ?? 0;
//   //     return (
//   //       <NameBadge
//   //         ref={combinedRef}
//   //         style={{
//   //           position: "absolute",
//   //           left: `${pos.x}px`,
//   //           top: `${pos.y}px`,
//   //           transform: transform
//   //             ? `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`
//   //             : "translate(-50%, -50%)",
//   //         }}
//   //         {...attributes}
//   //         {...listeners}
//   //       >
//   //         {label}
//   //       </NameBadge>
//   //     );
//   //   }

//   //   const offsetX = transform?.x ?? 0;
//   //   const offsetY = transform?.y ?? 0;
//   //   return (
//   //     <NameBadge
//   //       ref={combinedRef}
//   //       style={{
//   //         position: "absolute",
//   //         left: initialLeft,
//   //         top: initialTop,
//   //         transform: transform
//   //           ? `translate3d(${offsetX}px, ${offsetY}px, 0)`
//   //           : undefined,
//   //       }}
//   //       {...attributes}
//   //       {...listeners}
//   //     >
//   //       {label}
//   //     </NameBadge>
//   //   );
//   // }

//   function DraggableBadge({
//     id,
//     label,
//     initialLeft,
//     initialTop,
//     snapInfo,
//   }: {
//     id: string;
//     label: string;
//     initialLeft: string;
//     initialTop: string;
//     snapInfo: SnapInfo | null;
//   }) {
//     const { attributes, listeners, setNodeRef, transform } = useDraggable({
//       id,
//     });
//     const combinedRef = (el: HTMLElement | null) => {
//       setNodeRef(el);
//       badgeRefs.current[id] = el;
//     };

//     // const left = snapInfo ? `${snapInfo.pos.x}px` : initialLeft;
//     // const top = snapInfo ? `${snapInfo.pos.y}px` : initialTop;
//     console.log("snapInfo", snapInfo);
//     console.log();
//     const isWhite = !id.startsWith("black-badge");

//     const left = snapInfo && isWhite ? `${snapInfo.pos.xPct}%` : initialLeft;
//     const top = snapInfo && isWhite ? `${snapInfo.pos.yPct}%` : initialTop;

//     const dx = transform?.x ?? 0;
//     const dy = transform?.y ?? 0;

//     return (
//       <NameBadge
//         id={id} /* onAnyDragMove 에서 찾기 위해 id 필요 */
//         ref={combinedRef}
//         style={{
//           position: "absolute",
//           left,
//           top,
//           transform: `translate(-50%, -50%) translate3d(${dx}px, ${dy}px, 0)`,
//         }}
//         {...attributes}
//         {...listeners}
//       >
//         {label}
//       </NameBadge>
//     );
//   }
//   function handleWhiteDragEvent(
//     event: DragOverEvent | DragEndEvent,
//     isEnd: boolean
//   ) {
//     handleDragEvent(event, isEnd);
//   }

//   function onAnyDragMove(e: DragOverEvent) {
//     const id = e.active.id.toString();
//     if (id.startsWith("black-badge")) return;

//     // if (rafIdRef.current != null) {
//     //   cancelAnimationFrame(rafIdRef.current);
//     // }

//     // rafIdRef.current = requestAnimationFrame(() => {
//     //   // 기존 통과(highlight) 로직은 그대로 실행
//     //   handleWhiteDragEvent(e, false);

//     //   // ① badge DOM 찾기
//     //   const badge = document.getElementById(id);
//     //   if (badge) {
//     //     // ② 누적 오프셋 읽기

//     //     const { x, y } = e.delta as { x: number; y: number };
//     //     // ③ CSS 변수만 갱신
//     //     badge.style.setProperty("--tx", `${x}px`);
//     //     badge.style.setProperty("--ty", `${y}px`);
//     //     // badge.style.setProperty("--tx", "0px");
//     //     // badge.style.setProperty("--ty", "0px");
//     //   }

//     //   rafIdRef.current = null;
//     // });
//     handleWhiteDragEvent(e, false); // 통과/하이라이트만 처리
//   }

//   function onAnyDragEnd(e: DragEndEvent) {
//     const id = e.active.id.toString();
//     if (id.startsWith("black-badge")) {
//       // 검정 배지는 단순 이동량 누적
//       handleBlackDragEnd(e);
//     } else {
//       // 흰 배지는 베이스 스냅/아웃 로직
//       handleWhiteDragEvent(e, true);
//     }
//   }

//   // --이닝의 재구성--//

//   const [isReconstructMode, setIsReconstructMode] = useState(false);
//   const resetAllBadges = useCallback(() => {
//     // 스냅 위치와 보이기 상태 초기화
//     setBadgeSnaps(initialBadgeSnaps);
//     setActiveBadges(badgeConfigs.map((cfg) => cfg.id));
//     // 통과 기록 초기화
//     badgeConfigs.forEach(({ id }) => {
//       baseIds.forEach((base) => {
//         passedBasesRef.current[id][base] = false;
//       });
//       lastPassedRef.current[id] = null;
//       maxReachedRef.current[id] = 0;
//     });
//   }, [badgeConfigs, baseIds, initialBadgeSnaps]);

//   // 그라운드 내 직선 움직임 //

//   // 주자 모달 창
//   const [isGroundRecordModalOpen, setIsGroundRecordModalOpen] = useState(false);

//   // 아웃존 설정
//   const outZoneRef = useRef<HTMLDivElement>(null);

//   // 커스텀 경계설정
//   const customBoundsRef = useRef<HTMLDivElement>(null);

//   const restrictToCustomBounds: Modifier = (args) => {
//     const { transform, draggingNodeRect } = args;

//     // ① 드래그 중이 아닐 때는 원본 transform 반환
//     if (!draggingNodeRect) {
//       return transform;
//     }

//     // ② 경계 요소(ref) 유효성 검사
//     const boundsEl = customBoundsRef.current;
//     if (!boundsEl) {
//       return transform;
//     }

//     // 이제 안전하게 ClientRect 사용 가능
//     const { width: nodeW, height: nodeH } = draggingNodeRect;
//     const bounds = boundsEl.getBoundingClientRect();

//     // (이하 클램핑 로직 동일)
//     const newLeft = draggingNodeRect.left + transform.x;
//     const newTop = draggingNodeRect.top + transform.y;

//     const minX = bounds.left;
//     const maxX = bounds.right - nodeW;
//     const minY = bounds.top;
//     const maxY = bounds.bottom - nodeH;

//     const clampedX = Math.min(Math.max(newLeft, minX), maxX);
//     const clampedY = Math.min(Math.max(newTop, minY), maxY);

//     return {
//       ...transform,
//       x: transform.x + (clampedX - newLeft),
//       y: transform.y + (clampedY - newTop),
//     };
//   };
//   const dynamicBoundary: Modifier = (args) => {
//     const { active, transform } = args;
//     // active가 없으면 아무 제한도 걸지 않고 원본 transform 그대로 반환
//     if (!active) {
//       return transform;
//     }

//     const id = active.id.toString();
//     // 배지가 베이스에 올라간(snap된) 상태면 custom, 아니면 부모 요소 제한
//     // 검정 배지는 항상 custom, 흰 배지는 스냅된 경우 custom, 아닌 경우 부모 요소 제한
//     if (
//       id.startsWith("black-badge") || // ▶ 검정 배지
//       Boolean(badgeSnaps[id]) // ▶ 흰 배지(스냅됐을 때)
//     ) {
//       return restrictToCustomBounds(args);
//     } else {
//       return restrictToParentElement(args);
//     }
//   };

//   // 홈베이스 색칠

//   const [isHomeBaseActive, setIsHomeBaseActive] = useState(false);
//   // 이미지 프리로드
//   // useEffect(() => {
//   //   const img = new Image();
//   //   img.src = "/images/home-base-white-1.png";
//   //   // (옵션) 로드 완료 콜백
//   //   img.onload = () => {
//   //     console.log("/images/home-base-white-1.png preloaded!");
//   //   };
//   // }, []);\

//   // 위치 어긋남 해결
//   function refreshRects() {
//     if (wrapperRef.current)
//       wrapperRectRef.current = wrapperRef.current.getBoundingClientRect();
//     if (outZoneRef.current)
//       zoneRectRef.current = outZoneRef.current.getBoundingClientRect();
//     baseIds.forEach((b) => {
//       const poly = baseRefs.current[b];
//       if (poly) baseRectsRef.current[b] = poly.getBoundingClientRect();
//     });
//   }

//   function onAnyDragStart() {
//     refreshRects();
//   }

//   return (
//     <GameRecordContainer reconstructMode={isReconstructMode}>
//       <ScoreBoardWrapper>
//         <InningHeader>
//           {inningHeaders.map((inn, i) => (
//             <InningCell key={i}>{inn}</InningCell>
//           ))}
//         </InningHeader>

//         {/* Team A */}
//         <TeamRow>
//           <TeamNameCell>{teamAName.slice(0, 3)}</TeamNameCell>
//           {teamAScores.map((s, i) => (
//             <TeamScoreCell
//               key={i}
//               onClick={() => handleScoreCellClick(s, "A", i)}
//             >
//               {s}
//             </TeamScoreCell>
//           ))}
//         </TeamRow>

//         {/* Team B */}
//         <TeamRow>
//           <TeamNameCell>{teamBName.slice(0, 3)}</TeamNameCell>
//           {teamBScores.map((s, i) => (
//             <TeamScoreCell
//               key={i}
//               onClick={() => handleScoreCellClick(s, "B", i)}
//             >
//               {s}
//             </TeamScoreCell>
//           ))}
//         </TeamRow>
//       </ScoreBoardWrapper>

//       <ControlButtonsRow>
//         <ControlButtonsWrapper>
//           <ReconstructionWrapper>
//             <ReconstructionTitle>이닝의 재구성</ReconstructionTitle>
//             <ReconstructionButtonWrapper>
//               <ReconstructionSwitch
//                 checked={isReconstructMode}
//                 onChange={(checked) => {
//                   // OFF로 전환될 때만 초기화
//                   if (!checked) {
//                     resetAllBadges();
//                   }
//                   setIsReconstructMode(checked);
//                 }}
//               />
//             </ReconstructionButtonWrapper>
//           </ReconstructionWrapper>
//           <ControlButtonWhite>임시저장</ControlButtonWhite>
//           <ControlButton onClick={() => setIsGameEndModalOpen(true)}>
//             경기종료
//           </ControlButton>
//         </ControlButtonsWrapper>
//       </ControlButtonsRow>

//       <DndContext
//         id="game-record-dnd" // ← 여기에 고정된 string ID를 넣어줍니다
//         sensors={sensors}
//         modifiers={[dynamicBoundary]}
//         measuring={{
//           droppable: {
//             // or AlwaysExceptInitialPlacement
//             strategy: MeasuringStrategy.Always,
//           },
//         }}
//         onDragStart={onAnyDragStart}
//         onDragMove={onAnyDragMove}
//         onDragEnd={onAnyDragEnd}
//       >
//         <GraphicWrapper
//           // as="svg"
//           ref={wrapperRef}
//           // viewBox="0 0 110 110"
//           // preserveAspectRatio="xMidYMid meet"

//           // outside={isOutside}
//         >
//           <HomeWrapper />
//           <LineWrapper />
//           <HomeBaseWrapper active={isHomeBaseActive} />
//           <Ground outside={isOutside} />
//           <OutZoneWrapper ref={outZoneRef}></OutZoneWrapper>
//           <CustomBoundaryWrapper ref={customBoundsRef}></CustomBoundaryWrapper>
//           <DiamondSvg
//             viewBox="0 0 110 110"
//             ref={(el) => {
//               diamondSvgRef.current = el;
//               // svgRef.current = el;
//             }}
//           >
//             <polygon
//               id="ground"
//               points="55,0 110,55 55,110 0,55"
//               // style={{ border: "1px solid black" }}
//               ref={(el) => {
//                 diamondPolyRef.current = el;
//                 // groundRef.current = el;
//               }}
//             />
//             {/* 디버그용: 계산된 screenPoints로 다시 그린 폴리곤 */}
//             {/* {overlayPoints && (
//               <polygon points={overlayPoints} stroke="red" strokeWidth={0.5} />
//             )} */}
//             {/* 1루 */}
//             <polygon
//               className="inner"
//               id="1st"
//               // transform="translate(-5, 10)"
//               ref={(el) => {
//                 droppableSetters["first-base"](el as any);
//                 baseRefs.current["first-base"] = el;
//               }}
//               points="103.5,48.5 110,55 103.5,61.5 97,55"
//             />
//             {/* 2루 */}
//             <polygon
//               className="inner"
//               id="2nd"
//               ref={(el) => {
//                 droppableSetters["second-base"](el as any);
//                 baseRefs.current["second-base"] = el;
//               }}
//               points="55,0 61.5,6.5 55,13 48.5,6.5"
//             />
//             {/* 3루 */}
//             <polygon
//               className="inner"
//               id="3rd"
//               ref={(el) => {
//                 droppableSetters["third-base"](el as any);
//                 baseRefs.current["third-base"] = el;
//               }}
//               points="6.5,48.5 13,55 6.5,61.5 0,55"
//             />{" "}
//             {/* 홈 */}
//             <polygon
//               className="inner"
//               id="Home"
//               ref={(el) => {
//                 droppableSetters["home-base"](el as any);
//                 baseRefs.current["home-base"] = el;
//               }}
//               points="55,97 61.5,103.5 55,110 48.5,103.5"
//             />
//           </DiamondSvg>
//           <SideWrapper>
//             <OutCount>
//               {outs.map((isActive, idx) => (
//                 <Ellipse key={idx} active={isActive} />
//               ))}
//             </OutCount>
//             <OnDeckWrapper>
//               {onDeckPlayers.length > 0 ? (
//                 onDeckPlayers.map((p) => (
//                   <div key={p.playerId}>
//                     {p.battingOrder} {p.playerName}
//                   </div>
//                 ))
//               ) : (
//                 <div>대기타석입니다</div>
//               )}
//             </OnDeckWrapper>
//           </SideWrapper>
//           <LeftSideWrapper>
//             <InningBoard>
//               <ArrowUp color={!isHomeAttack ? "red" : "#B8B8B8"} />
//               <InningNumber>7</InningNumber>
//               <ArrowDown color={isHomeAttack ? "red" : "#B8B8B8"} />
//             </InningBoard>
//             <LittleScoreBoardWrapper>
//               <AwayTeamWrapper>
//                 <AwayTeamName> {teamAName.slice(0, 3)}</AwayTeamName>
//                 <AwayTeamScore>
//                   {teamAScores.length >= 2
//                     ? teamAScores[teamAScores.length - 2]
//                     : ""}
//                 </AwayTeamScore>
//               </AwayTeamWrapper>
//               <HomeTeamWrapper>
//                 <HomeTeamName>{teamBName.slice(0, 3)}</HomeTeamName>
//                 <HomeTeamScore>
//                   {teamBScores.length >= 2
//                     ? teamBScores[teamBScores.length - 2]
//                     : ""}
//                 </HomeTeamScore>
//               </HomeTeamWrapper>
//             </LittleScoreBoardWrapper>
//           </LeftSideWrapper>
//           <ResetDot
//             style={{ left: "75vw", top: "2vh" }}
//             onClick={() => {
//               // console.log("클릭됨");
//               // 1) 스냅 위치와 보이기 상태 초기화
//               setBadgeSnaps(initialBadgeSnaps);
//               setActiveBadges(badgeConfigs.map((cfg) => cfg.id));

//               // 2) 통과한 베이스 기록 초기화
//               badgeConfigs.forEach(({ id }) => {
//                 // passedBasesRef 초기화
//                 baseIds.forEach((base) => {
//                   passedBasesRef.current[id][base] = false;
//                 });
//                 // 마지막 통과 베이스, 최대 순서 초기화
//                 lastPassedRef.current[id] = null;
//                 maxReachedRef.current[id] = 0;
//               });
//             }}
//           />
//           {blackBadgeConfigs.map((cfg) => (
//             <BlackDraggableBadge
//               key={cfg.id}
//               cfg={cfg}
//               pos={blackPositions[cfg.id]}
//             />
//           ))}
//           {/* NameBadge */}
//           {/* 4) 드롭 후 스냅 or 드래그 상태에 따라 렌더 */}
//           {/* ③ activeBadges에 든 것만 렌더 */}
//           {badgeConfigs
//             .filter((cfg) => activeBadges.includes(cfg.id))
//             .map((cfg) => (
//               <DraggableBadge
//                 key={cfg.id}
//                 id={cfg.id}
//                 label={cfg.label}
//                 initialLeft={cfg.initialLeft}
//                 initialTop={cfg.initialTop}
//                 snapInfo={badgeSnaps[cfg.id]}
//               />
//             ))}
//         </GraphicWrapper>
//       </DndContext>
//       <PlayersRow>
//         <LeftPolygon />
//         <PlayerBox>
//           <PlayerWrapper>
//             <PlayerPosition>
//               투수
//               <Dot />
//               {isHomeAttack ? "AWAY" : "HOME"}
//             </PlayerPosition>
//             <PlayerInfo>{pitcher.playerName}</PlayerInfo>
//             <PlayerChangeButton
//               onClick={() => handleSubstitution(!isHomeAttack)}
//             >
//               선수교체
//             </PlayerChangeButton>
//           </PlayerWrapper>
//         </PlayerBox>
//         <VsText>VS</VsText>
//         <PlayerBox>
//           <PlayerWrapper>
//             <PlayerPosition>
//               {batter.battingOrder}번타자
//               <Dot />
//               {isHomeAttack ? "HOME" : "AWAY"}
//             </PlayerPosition>
//             <PlayerInfo>{batter.playerName}</PlayerInfo>
//             <PlayerChangeButton
//               onClick={() => handleSubstitution(isHomeAttack)}
//             >
//               선수교체
//             </PlayerChangeButton>
//           </PlayerWrapper>
//         </PlayerBox>
//         <RightPolygon />
//       </PlayersRow>

//       <RecordActionsRow>
//         <RecordActionButton onClick={() => handleRecordAction("안타")}>
//           안타
//         </RecordActionButton>
//         <RecordActionButton
//           onClick={() => handleRecordAction("볼넷/사구")}
//           disabled={isSubmitting}
//         >
//           사사구
//         </RecordActionButton>
//         <RecordActionButton onClick={() => handleRecordAction("아웃")}>
//           아웃
//         </RecordActionButton>
//         <RecordActionButton onClick={() => handleRecordAction("etc")}>
//           etc
//         </RecordActionButton>
//       </RecordActionsRow>

//       {isHitModalOpen && (
//         <HitModal
//           setIsHitModalOpen={setIsHitModalOpen}
//           playerId={batterPlayerId}
//           onSuccess={async () => {
//             const newAttack = await fetchInningScores();
//             await fetchBatter(newAttack);
//             await fetchPitcher(newAttack);
//           }}
//           onTypeSelect={() => setIsGroundRecordModalOpen(true)}
//         />
//       )}
//       {isOutModalOpen && (
//         <OutModal
//           setIsOutModalOpen={setIsOutModalOpen}
//           playerId={batterPlayerId}
//           onSuccess={async () => {
//             const newAttack = await fetchInningScores();
//             await fetchBatter(newAttack);
//             await fetchPitcher(newAttack);
//           }}
//           onTypeSelect={() => setIsGroundRecordModalOpen(true)}
//         />
//       )}
//       {isEtcModalOpen && (
//         <EtcModal
//           setIsEtcModalOpen={setIsEtcModalOpen}
//           playerId={batterPlayerId}
//           onSuccess={async () => {
//             const newAttack = await fetchInningScores();
//             await fetchBatter(newAttack);
//             await fetchPitcher(newAttack);
//           }}
//           onTypeSelect={() => setIsGroundRecordModalOpen(true)}
//         />
//       )}
//       {isChangeModalOpen && (
//         <DefenseChangeModal
//           setIsChangeModalOpen={setIsChangeModalOpen}
//           onSuccess={handleDefenseChange}
//         />
//       )}

//       {isGameEndModalOpen && (
//         <GameOverModal
//           inningScore={thisInningScore}
//           setIsGameEndModalOpen={setIsGameEndModalOpen}
//         />
//       )}

//       {isScorePatchModalOpen && selectedCell && (
//         <ScorePatchModal
//           setIsModalOpen={setIsScorePatchModalOpen}
//           cellValue={selectedCell.score}
//           team={selectedCell.team}
//           cellIndex={selectedCell.index}
//           onSuccess={async () => {
//             // setIsSubmitting(true);
//             try {
//               const newAttack = await fetchInningScores();
//               await fetchBatter(newAttack);
//               await fetchPitcher(newAttack);
//             } finally {
//               // setIsSubmitting(false);
//             }
//           }}
//         />
//       )}
//       {!isSubmitting && validationError && (
//         <ModalOverlay>
//           <ModalContainer>
//             <ModalTitleSmaller>{validationError}</ModalTitleSmaller>

//             <ModalButton onClick={() => setValidationError(null)}>
//               확인
//             </ModalButton>
//           </ModalContainer>
//         </ModalOverlay>
//       )}
//       {isGroundRecordModalOpen && (
//         <GroundRecordModal
//           setIsGroundRecordModalOpen={setIsGroundRecordModalOpen}
//           /* 필요 시 props 추가 */
//         />
//       )}
//       <LoadingOverlay visible={isSubmitting}>
//         <LoadingIcon spin fontSize={48} />
//       </LoadingOverlay>
//       <ErrorAlert error={error} />
//     </GameRecordContainer>
//   );
// }
