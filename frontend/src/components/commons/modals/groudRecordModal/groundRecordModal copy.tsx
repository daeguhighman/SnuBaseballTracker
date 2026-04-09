// // src/components/modals/groundRecordModal.tsx
// import { useRouter } from "next/router";
// import API from "../../../../commons/apis/api";

// import {
//   forwardRef,
//   useCallback,
//   useEffect,
//   useImperativeHandle,
//   useRef,
//   useState,
// } from "react";
// import {
//   LoadingIcon,
//   LoadingOverlay,
// } from "../../../../commons/libraries/loadingOverlay";
// import ErrorAlert from "../../../../commons/libraries/showErrorCode";
// import {
//   DndContext,
//   DragEndEvent,
//   DragMoveEvent,
//   DragOverEvent,
//   DragStartEvent,
//   MeasuringStrategy,
//   Modifier,
//   PointerSensor,
//   TouchSensor,
//   useDraggable,
//   useDroppable,
//   useSensor,
//   useSensors,
// } from "@dnd-kit/core";
// import {
//   CancelButton,
//   CancelButtonWrapper,
//   CustomBoundaryWrapper,
//   DiamondSvg,
//   Ellipse,
//   GraphicWrapper,
//   Ground,
//   HomeBaseWrapper,
//   HomeWrapper,
//   LineWrapper,
//   ModalBottomRedoUndoWrapper,
//   ModalBottomRunnerTitle,
//   ModalBottomRunnerWrapper,
//   ModalBottomWrapper,
//   ModalContainer,
//   ModalOverlay,
//   NameBadge,
//   OutCount,
//   OutZoneWrapper,
//   ReconstructionButtonWrapper,
//   ReconstructionSwitch,
//   ReconstructionTitle,
//   ReconstructionWrapper,
//   ResetDot,
// } from "./groundRecordModal.style";
// import { restrictToParentElement } from "@dnd-kit/modifiers";
// import { ControlButton } from "../playerSelectionModal";
// import { RoundCloseOutlined } from "../../../../commons/libraries/cancelButton";
// import LeftPolygon from "../../../../commons/libraries/leftPolygon";
// import RightPolygon from "../../../../commons/libraries/rightPolygon";
// import { badgeConfigsForModal } from "../../units/gameRecord-v2/gameRecord.variables";
// import {
//   BASE_IDS,
//   useRectsCache,
// } from "../../units/gameRecord-v2/gameRecord-v2.container";

// // 모달 컨트롤용 핸들러 타입
// export type GroundRecordModalHandle = {
//   open: () => void;
//   close: () => void;
// };

// interface GroundRecordModalProps {
//   onSuccess?: () => Promise<void>;
// }

// const GroundRecordModal = forwardRef<
//   GroundRecordModalHandle,
//   GroundRecordModalProps
// >(({ onSuccess }, ref) => {
//   const [isOpen, setIsOpen] = useState(false);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   // const router = useRouter();
//   const [error, setError] = useState(null);

//   // 부모가 ref로 open()/close() 호출 가능
//   useImperativeHandle(
//     ref,
//     () => ({
//       open: () => setIsOpen(true),
//       close: () => setIsOpen(false),
//     }),
//     []
//   );

//   // 모달 닫기 핸들러
//   const handleClose = useCallback(() => {
//     setIsOpen(false);
//   }, []);

//   // 확인 버튼 핸들러
//   const handleSubmit = useCallback(async () => {
//     setIsSubmitting(true);
//     try {
//       await onSuccess?.();
//       handleClose();
//     } catch (e) {
//       setError(e as Error);
//     } finally {
//       setIsSubmitting(false);
//     }
//   }, [onSuccess, handleClose]);

//   // 모달이 닫혀있으면 렌더링 스킵
//   if (!isOpen) return null;

//   // 드래그 앤 드롭 관련
//   // 베이스 아이디 목록
//   const baseIds = [
//     "first-base",
//     "second-base",
//     "third-base",
//     "home-base",
//   ] as const;
//   type BaseId = (typeof baseIds)[number];

//   // 베이스 <polygon> ref 저장
//   const baseRefs = useRef<Record<BaseId, SVGPolygonElement | null>>({
//     "first-base": null,
//     "second-base": null,
//     "third-base": null,
//     "home-base": null,
//   });
//   const droppableSetters = baseIds.reduce((acc, id) => {
//     acc[id] = useDroppable({ id }).setNodeRef;
//     return acc;
//   }, {} as Record<BaseId, (el: HTMLElement | null) => void>);

//   // wrapper ref (배지·베이스 좌표 계산용)
//   const wrapperRef = useRef<HTMLDivElement>(null);

//   // 배지 설정
//   // interface BadgeConfig {
//   //   id: string;
//   //   label: string;
//   //   initialLeft: string; // e.g. '55%'
//   //   initialTop: string; // e.g. '85%'
//   // }

//   // 최상단에 선언
//   const diamondSvgRef = useRef<SVGSVGElement | null>(null);
//   const diamondPolyRef = useRef<SVGPolygonElement | null>(null);

//   // const [isOutside, setIsOutside] = useState(false);

//   const outZoneRef = useRef<HTMLDivElement>(null);
//   const { wrapperRectRef, zoneRectRef, baseRectsRef, refreshRects } =
//     useRectsCache(wrapperRef, outZoneRef, baseRefs, BASE_IDS);
//   const sensors = useSensors(useSensor(PointerSensor));
//   const badgeRefs = useRef<Record<string, HTMLElement | null>>({});
//   const [activeBadges, setActiveBadges] = useState(
//     badgeConfigsForModal.map((cfg) => cfg.id)
//   );

//   // 배지별 스냅 정보 관리
//   type SnapInfo = { base: BaseId; pos: { xPct: number; yPct: number } };
//   // 1) 초기 스냅 상태를 미리 저장해 두고…
//   const initialBadgeSnaps = badgeConfigsForModal.reduce((acc, cfg) => {
//     acc[cfg.id] = null;
//     return acc;
//   }, {} as Record<string, SnapInfo | null>);

//   // 2) useState 초기값에 사용
//   const [badgeSnaps, setBadgeSnaps] =
//     useState<Record<string, SnapInfo | null>>(initialBadgeSnaps);

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

//   // 이전 outside 값을 저장할 ref
//   // const prevOutsideRef = useRef<boolean>(false);
//   // ── 베이스 중심 좌표 캐싱용 ref (이미 적용하셨다면 생략) ──
//   const baseCentersRef = useRef<Record<BaseId, { x: number; y: number }>>(
//     {} as Record<BaseId, { x: number; y: number }>
//   );
//   // ── 마운트 시·리사이즈 시에만 베이스 중심 계산 ──
//   // useEffect(() => {
//   //   const updateCenters = () => {
//   //     baseIds.forEach((baseId) => {
//   //       const poly = baseRefs.current[baseId];
//   //       if (!poly) return;
//   //       const rect = poly.getBoundingClientRect();
//   //       baseCentersRef.current[baseId] = {
//   //         x: rect.left + rect.width / 2,
//   //         y: rect.top + rect.height / 2,
//   //       }; // ← 변경: 여기서 한 번만 계산해서 저장
//   //     });
//   //   };
//   //   updateCenters(); // ← 변경
//   //   window.addEventListener("resize", updateCenters); // ← 변경
//   //   return () => {
//   //     window.removeEventListener("resize", updateCenters); // ← 변경
//   //   };
//   // }, []);

//   const [isReconstructMode, setIsReconstructMode] = useState(false);

//   // const handleClose = () => {
//   //   // 모달 닫기
//   //   props.setIsGroundRecordModalOpen(false);
//   // };

//   // // 확인하기 눌렀을 때 실행될 함수
//   // const handleSubmit = () => {
//   //   // // 모달 닫기
//   //   // props.setIsGroundRecordModalOpen(false);
//   // };

//   // 커스텀경계

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
//     const isBlack = id.startsWith("black-badge");
//     return isBlack
//       ? restrictToCustomBounds(args)
//       : restrictToCustomBounds(args);
//   };

//   // 성능 최적화
//   const DraggableBadge = ({
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
//   }) => {
//     const { attributes, listeners, setNodeRef, transform } = useDraggable({
//       id,
//     });

//     const combinedRef = (el: HTMLElement | null) => {
//       setNodeRef(el);
//       badgeRefs.current[id] = el;
//     };

//     const isWhite = !id.startsWith("black-badge");
//     const dragging = !!transform;

//     // 1) 스냅 좌표
//     const left = snapInfo && isWhite ? `${snapInfo.pos.xPct}%` : initialLeft;
//     const top = snapInfo && isWhite ? `${snapInfo.pos.yPct}%` : initialTop;

//     // 2) transform: 드래그 중일 때만 델타 적용
//     const styleTransform = dragging
//       ? `translate(-50%, -50%) translate3d(${transform!.x}px, ${
//           transform!.y
//         }px, 0)`
//       : `translate(-50%, -50%)`;

//     return (
//       <NameBadge
//         id={id}
//         ref={combinedRef}
//         style={{
//           position: "absolute",
//           left,
//           top,
//           transform: styleTransform,
//         }}
//         {...attributes}
//         {...listeners}
//       >
//         {label}
//       </NameBadge>
//     );
//   };

//   const [isHomeBaseActive, setIsHomeBaseActive] = useState(false);
//   // 베이스별 중심 좌표를 담을 ref
//   // const baseRectsRef = useRef<Partial<Record<BaseId, DOMRect>>>({});
//   // const wrapperRectRef = useRef<DOMRect | null>(null);
//   // const zoneRectRef = useRef<DOMRect | null>(null);

//   const RUN_SEQUENCE: BaseId[] = [
//     "first-base",
//     "second-base",
//     "third-base",
//     "home-base",
//   ];

//   // 배지별로 지금까지 "순서대로" 스냅된 베이스 목록을 저장 (삭제하지 않고 유지)
//   const snappedSeqRef = useRef<Record<string, BaseId[]>>(
//     badgeConfigsForModal.reduce((acc, { id }) => {
//       acc[id] = [];
//       return acc;
//     }, {} as Record<string, BaseId[]>)
//   );

//   // 다음에 가야 할(스냅해야 할) 베이스
//   const nextRequiredBase = (badgeId: string): BaseId => {
//     const seq = snappedSeqRef.current[badgeId];
//     return RUN_SEQUENCE[Math.min(seq.length, RUN_SEQUENCE.length - 1)];
//   };

//   const handleDrop = (e: DragEndEvent) => {
//     const badgeId = e.active.id as string;

//     // // 검정 배지: 기존 자리 스왑 로직
//     // if (badgeId.startsWith("black-badge")) {
//     //   handleBlackDragEnd(e);
//     //   return;
//     // }

//     const badgeEl = badgeRefs.current[badgeId];
//     const wrapperRect = wrapperRectRef.current;
//     const zoneRect = zoneRectRef.current;
//     if (!badgeEl || !wrapperRect) return;

//     const { left, top, width, height } = badgeEl.getBoundingClientRect();
//     const cx = left + width / 2;
//     const cy = top + height / 2;

//     // 아웃존 바깥 드롭 시 제거(단, 흰 배지가 최소 1개는 남아야 함)
//     if (
//       zoneRect &&
//       (cx < zoneRect.left ||
//         cx > zoneRect.right ||
//         cy < zoneRect.top ||
//         cy > zoneRect.bottom)
//     ) {
//       setActiveBadges((prev) => {
//         // 새로 걸러낸 배열
//         const next = prev.filter((id) => id !== badgeId);
//         // 남은 흰 배지 개수 계산
//         const whiteLeft = next.filter(
//           (id) => !id.startsWith("black-badge")
//         ).length;
//         // 흰 배지가 하나라도 남으면 next, 아니면 prev 유지
//         return whiteLeft > 0 ? next : prev;
//       });
//       setBadgeSnaps((prev) => ({ ...prev, [badgeId]: null }));

//       // Ground 배경 리셋
//       groundRef.current?.classList.remove("out-zone-active");
//       return;
//     }

//     // 2) 어느 베이스 위인지 판정
//     let dropBase: BaseId | null = null;
//     let baseRect: DOMRect | undefined;
//     for (const b of BASE_IDS) {
//       const rect = baseRectsRef.current[b];
//       if (!rect) continue;
//       if (
//         cx >= rect.left &&
//         cx <= rect.right &&
//         cy >= rect.top &&
//         cy <= rect.bottom
//       ) {
//         dropBase = b;
//         baseRect = rect;
//         break;
//       }
//     }
//     if (!dropBase || !baseRect) return;

//     // 3) 순서 강제
//     // const required = nextRequiredBase(badgeId);
//     // if (dropBase !== required) {
//     //   return; // 순서 아니면 스냅 불가
//     // }

//     // 4) 점유 체크(1베이스 1주자)
//     const occupied = Object.entries(badgeSnaps).some(
//       ([otherId, snap]) => otherId !== badgeId && snap?.base === dropBase
//     );
//     if (occupied) {
//       return;
//     }

//     // 5) 스냅(흰 배지: % 좌표)
//     const x = baseRect.left + baseRect.width / 2 - wrapperRect.left;
//     const y = baseRect.top + baseRect.height / 2 - wrapperRect.top;

//     setBadgeSnaps((prev) => ({
//       ...prev,
//       [badgeId]: {
//         base: dropBase,
//         pos: {
//           xPct: (x / wrapperRect.width) * 100,
//           yPct: (y / wrapperRect.height) * 100,
//         },
//       },
//     }));

//     // 6) 진행 기록 업데이트 (유지)
//     const seq = snappedSeqRef.current[badgeId];
//     if (seq[seq.length - 1] !== dropBase) {
//       seq.push(dropBase);
//     }

//     // 7) 홈에 스냅 & 3루 찍혀 있으면 완주
//     // 3루에서 홈으로 들어오면 배지 없어짐
//     // const finished =
//     //   dropBase === "home-base" &&
//     //   ["first-base", "second-base", "third-base"].every((b) =>
//     //     seq.includes(b as BaseId)
//     //   );
//     const finished =
//       dropBase === "home-base" &&
//       ["third-base"].every((b) => seq.includes(b as BaseId));

//     if (finished) {
//       setActiveBadges((prev) => prev.filter((id) => id !== badgeId));
//       setBadgeSnaps((prev) => ({ ...prev, [badgeId]: null }));
//       // 기록은 유지 (snappedSeqRef.current[badgeId]는 지우지 않음)
//     }
//   };

//   const onAnyDragEnd = (e: DragEndEvent) => {
//     // 좌표는 ResizeObserver가 최신화 해주므로 보통 추가 호출 불필요
//     // 필요하면 여기서 refreshRects();
//     groundRef.current?.classList.remove("out-zone-active");
//     handleDrop(e);
//     // 깔끔하게 리셋
//     prevOutsideRef.current = false;
//     // setIsOutside(false);
//   };

//   const resetWhiteBadges = useCallback(() => {
//     // 1) badgeSnaps(= 점유/스냅 정보) 초기화
//     const freshSnaps: Record<string, SnapInfo | null> = {};
//     badgeConfigsForModal.forEach((c) => (freshSnaps[c.id] = null));
//     setBadgeSnaps(freshSnaps);

//     // 2) 화면에 모든 흰 배지 다시 보이게
//     setActiveBadges(badgeConfigsForModal.map((c) => c.id));

//     // 3) 베이스 이동(순서) 기록 초기화
//     badgeConfigsForModal.forEach(({ id }) => {
//       snappedSeqRef.current[id] = [];
//     });

//     // 4) (선택) 흰 배지 DOM ref 정리
//     badgeRefs.current = {};

//     // 5) (선택) 기타 UI 상태 리셋이 필요하면 여기서
//     // setIsOutside(false);
//   }, [badgeConfigsForModal]);

//   // ---아웃존 설정 ---
//   // 1) ref 선언
//   const originCenters = useRef<Record<string, { x: number; y: number }>>({});
//   // ① Ground용 ref 선언
//   const groundRef = useRef<HTMLDivElement | null>(null);

//   const [isOutside, setIsOutside] = useState(false);
//   const prevOutsideRef = useRef(false);
//   const rafIdRef = useRef<number | null>(null);

//   function handleDragStart(event: DragStartEvent) {
//     const id = String(event.active.id);
//     const el = badgeRefs.current[id];
//     if (!el) return;

//     // 여기서만 한 번만 읽어 온다!
//     const rect = el.getBoundingClientRect();
//     originCenters.current[id] = {
//       x: rect.left + rect.width / 2, // 요소의 화면상 중앙 X
//       y: rect.top + rect.height / 2, // 요소의 화면상 중앙 Y
//     };
//   }

//   // const handleDragMove = (e: DragMoveEvent) => {
//   //   if (rafIdRef.current != null) return; // 이미 예약됨(스로틀)
//   //   rafIdRef.current = requestAnimationFrame(() => {
//   //     rafIdRef.current = null;

//   //     const zoneRect = zoneRectRef.current;
//   //     if (!zoneRect) return;

//   //     const translated = e.active?.rect?.current?.translated;
//   //     let cx: number | null = null;
//   //     let cy: number | null = null;

//   //     if (translated) {
//   //       cx = translated.left + translated.width / 2;
//   //       cy = translated.top + translated.height / 2;
//   //     } else {
//   //       // fallback: DOM 읽기(가능하면 피하기)
//   //       const el = badgeRefs.current[e.active.id as string];
//   //       if (el) {
//   //         const r = el.getBoundingClientRect();
//   //         cx = r.left + r.width / 2;
//   //         cy = r.top + r.height / 2;
//   //       }
//   //     }

//   //     if (cx == null || cy == null) return;

//   //     const outsideNow =
//   //       cx < zoneRect.left ||
//   //       cx > zoneRect.right ||
//   //       cy < zoneRect.top ||
//   //       cy > zoneRect.bottom;

//   //     if (outsideNow !== prevOutsideRef.current) {
//   //       prevOutsideRef.current = outsideNow;
//   //       setIsOutside(outsideNow); // 변화 있을 때만 setState
//   //     }
//   //   });
//   // };

//   function handleDragMove(event: DragMoveEvent) {
//     const id = String(event.active.id);
//     // 검정 배지는 스킵
//     if (id.startsWith("black-badge")) return;

//     // 아직 origin이 없으면 스킵
//     const origin = originCenters.current[id];
//     if (!origin) return;

//     // RAF로 한 프레임에 한 번만 실행
//     if (rafIdRef.current != null) return;
//     rafIdRef.current = requestAnimationFrame(() => {
//       rafIdRef.current = null;

//       // DnD‑Kit이 주는 delta.x/y + origin
//       const dx = event.delta?.x ?? 0;
//       const dy = event.delta?.y ?? 0;
//       const cx = origin.x + dx;
//       const cy = origin.y + dy;

//       // out-zone 판정: zoneRectRef.current는 이미 외부에서 갱신된 DOMRect이므로
//       const zone = zoneRectRef.current;
//       if (!zone) return;

//       const outsideNow =
//         cx < zone.left || cx > zone.right || cy < zone.top || cy > zone.bottom;

//       // 변화가 있을 때만 클래스 토글 or 스타일 변경
//       if (outsideNow !== prevOutsideRef.current) {
//         prevOutsideRef.current = outsideNow;
//         // React 상태 대신 DOM 클래스로 토글하면 더 가볍습니다
//         const badgeEl = badgeRefs.current[id]!;
//         badgeEl.classList.toggle("out-zone", outsideNow);
//       }

//       // ★ Ground 배경 토글(추가)
//       groundRef.current?.classList.toggle("out-zone-active", outsideNow);
//     });
//   }

//   return (
//     <ModalOverlay>
//       <ModalContainer
//         onClick={(e) => e.stopPropagation()}
//         reconstructMode={isReconstructMode}
//       >
//         <DndContext
//           id="game-record-dnd" // ← 여기에 고정된 string ID를 넣어줍니다
//           sensors={sensors}
//           modifiers={[dynamicBoundary]}
//           measuring={{
//             droppable: {
//               // or AlwaysExceptInitialPlacement
//               strategy: MeasuringStrategy.Always,
//             },
//           }}
//           onDragStart={handleDragStart}
//           onDragMove={handleDragMove}
//           onDragEnd={onAnyDragEnd}
//         >
//           <CancelButtonWrapper>
//             {" "}
//             <button
//               onClick={handleClose}
//               style={{
//                 all: "unset",
//                 cursor: "pointer",
//                 display: "inline-flex",
//                 alignItems: "center",
//                 justifyContent: "center",
//               }}
//             >
//               <RoundCloseOutlined
//                 width="3vh"
//                 height="3vh"
//                 style={{ fontSize: 24 }}
//               />
//             </button>
//           </CancelButtonWrapper>
//           <ModalBottomWrapper>
//             <ReconstructionWrapper>
//               <ReconstructionTitle>이닝의 재구성</ReconstructionTitle>
//               <ReconstructionButtonWrapper>
//                 <ReconstructionSwitch
//                   checked={isReconstructMode}
//                   onChange={(checked) => {
//                     // OFF로 전환될 때만 초기화
//                     if (!checked) {
//                       resetWhiteBadges();
//                     }
//                     setIsReconstructMode(checked);
//                   }}
//                 />
//               </ReconstructionButtonWrapper>
//             </ReconstructionWrapper>
//             <ModalBottomRunnerWrapper>
//               <LeftPolygon />
//               <ModalBottomRunnerTitle>주자</ModalBottomRunnerTitle>
//               <RightPolygon />
//             </ModalBottomRunnerWrapper>
//           </ModalBottomWrapper>
//           <GraphicWrapper
//             // as="svg"
//             ref={wrapperRef}
//             // viewBox="0 0 110 110"
//             // preserveAspectRatio="xMidYMid meet"

//             // outside={isOutside}
//           >
//             <HomeWrapper />
//             <LineWrapper />
//             <HomeBaseWrapper active={isHomeBaseActive} />
//             <Ground ref={groundRef} />

//             <OutZoneWrapper ref={outZoneRef}></OutZoneWrapper>
//             <CustomBoundaryWrapper
//               ref={(el) => {
//                 customBoundsRef.current = el; // ★ 이 한 줄 추가
//               }}
//             ></CustomBoundaryWrapper>
//             <DiamondSvg
//               viewBox="0 0 110 110"
//               ref={(el) => {
//                 diamondSvgRef.current = el;
//                 // svgRef.current = el;
//               }}
//             >
//               <polygon
//                 id="ground"
//                 points="55,0 110,55 55,110 0,55"
//                 // style={{ border: "1px solid black" }}
//                 ref={(el) => {
//                   diamondPolyRef.current = el;
//                   // groundRef.current = el;
//                 }}
//               />
//               {/* 디버그용: 계산된 screenPoints로 다시 그린 폴리곤 */}
//               {/* {overlayPoints && (
//               <polygon points={overlayPoints} stroke="red" strokeWidth={0.5} />
//             )} */}
//               {/* 1루 */}
//               <polygon
//                 className="inner"
//                 id="1st"
//                 // transform="translate(-5, 10)"
//                 ref={(el) => {
//                   droppableSetters["first-base"](el as any);
//                   baseRefs.current["first-base"] = el;
//                 }}
//                 points="103.5,48.5 110,55 103.5,61.5 97,55"
//               />
//               {/* 2루 */}
//               <polygon
//                 className="inner"
//                 id="2nd"
//                 ref={(el) => {
//                   droppableSetters["second-base"](el as any);
//                   baseRefs.current["second-base"] = el;
//                 }}
//                 points="55,0 61.5,6.5 55,13 48.5,6.5"
//               />
//               {/* 3루 */}
//               <polygon
//                 className="inner"
//                 id="3rd"
//                 ref={(el) => {
//                   droppableSetters["third-base"](el as any);
//                   baseRefs.current["third-base"] = el;
//                 }}
//                 points="6.5,48.5 13,55 6.5,61.5 0,55"
//               />{" "}
//               {/* 홈 */}
//               <polygon
//                 className="inner"
//                 id="Home"
//                 ref={(el) => {
//                   droppableSetters["home-base"](el as any);
//                   baseRefs.current["home-base"] = el;
//                 }}
//                 points="55,97 61.5,103.5 55,110 48.5,103.5"
//               />
//             </DiamondSvg>

//             <ResetDot
//               style={{ left: "63vw", top: "2vh" }}
//               onClick={resetWhiteBadges}
//             />

//             {/* NameBadge */}
//             {/* 4) 드롭 후 스냅 or 드래그 상태에 따라 렌더 */}
//             {/* ③ activeBadges에 든 것만 렌더 */}
//             {badgeConfigsForModal
//               .filter((cfg) => activeBadges.includes(cfg.id))
//               .map((cfg) => (
//                 <DraggableBadge
//                   key={cfg.id}
//                   id={cfg.id}
//                   label={cfg.label}
//                   initialLeft={cfg.initialLeft}
//                   initialTop={cfg.initialTop}
//                   snapInfo={badgeSnaps[cfg.id]}
//                 />
//               ))}
//           </GraphicWrapper>
//           <ControlButton onClick={handleSubmit}>확인하기</ControlButton>
//         </DndContext>
//       </ModalContainer>
//       <LoadingOverlay visible={isSubmitting}>
//         <LoadingIcon spin fontSize={48} />
//       </LoadingOverlay>
//       <ErrorAlert error={error} />
//     </ModalOverlay>
//   );
// });

// export default GroundRecordModal;
