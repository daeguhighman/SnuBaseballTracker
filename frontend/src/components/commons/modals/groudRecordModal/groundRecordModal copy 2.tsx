// // src/components/modals/groundRecordModal.tsx

// import API from "../../../../commons/apis/api";

// import {
//   forwardRef,
//   useCallback,
//   useEffect,
//   useImperativeHandle,
//   useMemo,
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
// import PortalSwitch from "./reconstructionSwitch";
// import { DraggableBadge } from "../../../../commons/libraries/whiteBadge";
// import { unstable_batchedUpdates } from "react-dom";

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
//   // if (!isOpen) return null;

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
//   console.log("▶ Modal render");
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

//   const baseCentersRef = useRef<Record<BaseId, { x: number; y: number }>>(
//     {} as Record<BaseId, { x: number; y: number }>
//   );
//   // ── 마운트 시·리사이즈 시에만 베이스 중심 계산 ──

//   const [isReconstructMode, setIsReconstructMode] = useState(false);

//   // 커스텀 경계설정
//   const customBoundsRef = useRef<HTMLDivElement>(null);

//   // 성능 최적화
//   const restrictToCustomBoundsFn = useCallback<Modifier>((args) => {
//     const { transform, draggingNodeRect } = args;
//     if (!draggingNodeRect) return transform;
//     const boundsEl = customBoundsRef.current;
//     if (!boundsEl) return transform;

//     const { width: nodeW, height: nodeH } = draggingNodeRect;
//     const bounds = boundsEl.getBoundingClientRect();

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
//   }, []);

//   const dynamicBoundary = useMemo<Modifier>(() => {
//     return (args) => {
//       if (!args.active) return args.transform;
//       return restrictToCustomBoundsFn(args);
//     };
//   }, [restrictToCustomBoundsFn]);

//   const modifiers = useMemo(() => [dynamicBoundary], [dynamicBoundary]);

//   const [isHomeBaseActive, setIsHomeBaseActive] = useState(false);

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
//   const badgeSnapsRef =
//     useRef<Record<string, SnapInfo | null>>(initialBadgeSnaps);
//   useEffect(() => {
//     badgeSnapsRef.current = badgeSnaps;
//   }, [badgeSnaps]);
//   // 다음에 가야 할(스냅해야 할) 베이스

//   const handleDrop = (e: DragEndEvent) => {
//     const badgeId = e.active.id as string;

//     // 검정 배지: 기존 자리 스왑 로직

//     const badgeEl = badgeRefs.current[badgeId];
//     const wrapperRect = wrapperRectRef.current;
//     const zoneRect = zoneRectRef.current;
//     if (!badgeEl || !wrapperRect) return;

//     const { left, top, width, height } = badgeEl.getBoundingClientRect();
//     const cx = left + width / 2;
//     const cy = top + height / 2;

//     // 1) 필드(outZone) 밖 드롭 → 제거(기록은 유지)
//     if (
//       zoneRect &&
//       (cx < zoneRect.left ||
//         cx > zoneRect.right ||
//         cy < zoneRect.top ||
//         cy > zoneRect.bottom)
//     ) {
//       // setActiveBadges((prev) => prev.filter((id) => id !== badgeId));
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

//       // ★ Ground의 'out-zone-active' 클래스 제거
//       // groundRef.current?.classList.remove("out-zone-active");
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
//   // 2. handleDrop을 useCallback으로 감싸되, 상태 읽기는 ref에서
//   // const handleDrop = useCallback(
//   //   (e: DragEndEvent) => {
//   //     const badgeId = String(e.active.id);
//   //     const badgeEl = badgeRefs.current[badgeId];
//   //     const wrapperRect = wrapperRectRef.current;
//   //     const zoneRect = zoneRectRef.current;
//   //     if (!badgeEl || !wrapperRect) return;

//   //     const { left, top, width, height } = badgeEl.getBoundingClientRect();
//   //     const cx = left + width / 2;
//   //     const cy = top + height / 2;

//   //     // 아웃존 밖이면 제거
//   //     if (
//   //       zoneRect &&
//   //       (cx < zoneRect.left ||
//   //         cx > zoneRect.right ||
//   //         cy < zoneRect.top ||
//   //         cy > zoneRect.bottom)
//   //     ) {
//   //       setActiveBadges((prev) => {
//   //         const next = prev.filter((id) => id !== badgeId);
//   //         const whiteLeft = next.filter(
//   //           (id) => !id.startsWith("black-badge")
//   //         ).length;
//   //         return whiteLeft > 0 ? next : prev;
//   //       });
//   //       setBadgeSnaps((prev) => ({ ...prev, [badgeId]: null }));
//   //       groundRef.current?.classList.remove("out-zone-active");
//   //       return;
//   //     }

//   //     // 어느 베이스 위인지 판정
//   //     let dropBase: BaseId | null = null;
//   //     let baseRect: DOMRect | undefined;
//   //     for (const b of BASE_IDS) {
//   //       const rect = baseRectsRef.current[b];
//   //       if (!rect) continue;
//   //       if (
//   //         cx >= rect.left &&
//   //         cx <= rect.right &&
//   //         cy >= rect.top &&
//   //         cy <= rect.bottom
//   //       ) {
//   //         dropBase = b;
//   //         baseRect = rect;
//   //         break;
//   //       }
//   //     }
//   //     if (!dropBase || !baseRect) return;

//   //     // 점유 체크
//   //     const occupied = Object.entries(badgeSnaps).some(
//   //       ([otherId, snap]) => otherId !== badgeId && snap?.base === dropBase
//   //     );
//   //     console.log("occupied check", { occupied, dropBase, badgeSnaps });
//   //     if (occupied) return;

//   //     // 스냅 좌표 계산
//   //     const x = baseRect.left + baseRect.width / 2 - wrapperRect.left;
//   //     const y = baseRect.top + baseRect.height / 2 - wrapperRect.top;

//   //     setBadgeSnaps((prev) => ({
//   //       ...prev,
//   //       [badgeId]: {
//   //         base: dropBase,
//   //         pos: {
//   //           xPct: (x / wrapperRect.width) * 100,
//   //           yPct: (y / wrapperRect.height) * 100,
//   //         },
//   //       },
//   //     }));

//   //     // 진행 기록
//   //     const seq = snappedSeqRef.current[badgeId];
//   //     if (seq[seq.length - 1] !== dropBase) {
//   //       seq.push(dropBase);
//   //     }

//   //     const finished =
//   //       dropBase === "home-base" &&
//   //       ["third-base"].every((b) => seq.includes(b as BaseId));

//   //     if (finished) {
//   //       setActiveBadges((prev) => prev.filter((id) => id !== badgeId));
//   //       setBadgeSnaps((prev) => ({ ...prev, [badgeId]: null }));
//   //     }
//   //   },
//   //   [badgeSnaps] // 최신 badgeSnaps를 반영하도록 의존성에 넣음
//   // );
//   // 내부에서 쓰는 대부분이 ref이므로 빈 배열로 안정화 가능

//   // const onAnyDragEnd = (e: DragEndEvent) => {
//   //   // 좌표는 ResizeObserver가 최신화 해주므로 보통 추가 호출 불필요
//   //   // 필요하면 여기서 refreshRects();
//   //   groundRef.current?.classList.remove("out-zone-active");
//   //   handleDrop(e);
//   //   // 깔끔하게 리셋
//   //   prevOutsideRef.current = false;
//   //   // setIsOutside(false);
//   // };

//   const onAnyDragEnd = useCallback(
//     (e: DragEndEvent) => {
//       groundRef.current?.classList.remove("out-zone-active");
//       handleDrop(e);
//       prevOutsideRef.current = false;
//     },
//     [handleDrop]
//   );
//   const resetWhiteBadges = useCallback(() => {
//     const freshSnaps: Record<string, SnapInfo | null> = {};
//     badgeConfigsForModal.forEach((c) => (freshSnaps[c.id] = null));

//     unstable_batchedUpdates(() => {
//       setBadgeSnaps(freshSnaps);
//       setActiveBadges(badgeConfigsForModal.map((c) => c.id));
//     });

//     badgeConfigsForModal.forEach(({ id }) => {
//       snappedSeqRef.current[id] = [];
//     });
//     badgeRefs.current = {};
//   }, [badgeConfigsForModal]);

//   // const resetWhiteBadges = useCallback(() => {
//   //   // 1) 순서 기록 초기화 (snappedSeqRef)
//   //   Object.keys(snappedSeqRef.current).forEach((id) => {
//   //     snappedSeqRef.current[id] = [];
//   //   });

//   //   // 2) badgeSnaps 와 activeBadges를 한 번의 배치로 초기화
//   //   unstable_batchedUpdates(() => {
//   //     setBadgeSnaps((prev) => {
//   //       // 기존 키를 그대로 쓰되 모두 null
//   //       const fresh = Object.fromEntries(
//   //         Object.keys(prev).map((k) => [k, null])
//   //       ) as Record<string, SnapInfo | null>;
//   //       return fresh;
//   //     });
//   //     setActiveBadges(badgeConfigsForModal.map((c) => c.id));
//   //   });

//   //   // 3) DOM ref 캐시 클리어 (이건 렌더링엔 영향 없지만 다음 드래그 로직을 위해)
//   //   badgeRefs.current = {};

//   //   // (선택) 좌표/rect 재계산이 필요한 경우
//   //   refreshRects();
//   // }, [badgeConfigsForModal, refreshRects]);
//   const originCenters = useRef<Record<string, { x: number; y: number }>>({});
//   // ① Ground용 ref 선언
//   const groundRef = useRef<HTMLDivElement | null>(null);

//   const [isOutside, setIsOutside] = useState(false);
//   const prevOutsideRef = useRef(false);
//   const rafIdRef = useRef<number | null>(null);

//   // function handleDragStart(event: DragStartEvent) {
//   //   const id = String(event.active.id);
//   //   const el = badgeRefs.current[id];
//   //   if (!el) return;

//   //   // 여기서만 한 번만 읽어 온다!
//   //   const rect = el.getBoundingClientRect();
//   //   originCenters.current[id] = {
//   //     x: rect.left + rect.width / 2, // 요소의 화면상 중앙 X
//   //     y: rect.top + rect.height / 2, // 요소의 화면상 중앙 Y
//   //   };
//   // }

//   const handleDragStart = useCallback((event: DragStartEvent) => {
//     const id = String(event.active.id);
//     const el = badgeRefs.current[id];
//     if (!el) return;

//     const rect = el.getBoundingClientRect();
//     originCenters.current[id] = {
//       x: rect.left + rect.width / 2,
//       y: rect.top + rect.height / 2,
//     };
//   }, []);

//   // 이닝의 재구성 성능 올리기
//   // ① 컨테이너와 흰 배지를 감쌀 ref
//   const reconstructModeRef = useRef(false);
//   const containerRef = useRef<HTMLDivElement>(null);
//   const whiteBadgesRef = useRef<HTMLDivElement>(null);

//   const switchRef = useRef<HTMLButtonElement | null>(null);
//   useEffect(() => {
//     const el = switchRef.current;
//     if (!el) return;
//     const onPointerDown = () => {
//       el.classList.add("ant-switch-checked");
//     };
//     const onPointerUp = () => {
//       // 실제 상태 반영은 onChange, 여기선 그냥 시각 안정화용
//     };
//     el.addEventListener("pointerdown", onPointerDown);
//     return () => {
//       el.removeEventListener("pointerdown", onPointerDown);
//     };
//   }, []);

//   const switchAnchorRef = useRef<HTMLDivElement>(null);
//   const [reconstructChecked, setReconstructChecked] = useState(false);

//   // const handleReconstructToggle = useCallback(
//   //   (checked: boolean) => {
//   //     // console.log("parent toggle:", checked);
//   //     setReconstructChecked(checked);
//   //     if (containerRef.current) {
//   //       containerRef.current.classList.toggle("reconstruct-mode", checked);
//   //     }
//   //     if (checked) {
//   //       requestAnimationFrame(() => {
//   //         resetWhiteBadges(); // 이 함수는 useCallback으로 정의돼 있어야 함
//   //       });
//   //     }
//   //   },
//   //   [resetWhiteBadges]
//   // );

//   // useEffect(() => {
//   //   console.log("reconstructChecked changed:", reconstructChecked);
//   // }, [reconstructChecked]);

//   const handleReconstructToggle = useCallback(
//     (checked: boolean) => {
//       if (containerRef.current) {
//         containerRef.current.classList.toggle("reconstruct-mode", checked);
//       }

//       // 한 번에 묶어서 상태 갱신: reconstructChecked + badge 리셋
//       unstable_batchedUpdates(() => {
//         setReconstructChecked(checked);
//         if (checked) {
//           // resetWhiteBadges 내용을 여기로 직접 inline
//           const freshSnaps: Record<string, SnapInfo | null> = {};
//           badgeConfigsForModal.forEach((c) => {
//             freshSnaps[c.id] = null;
//             snappedSeqRef.current[c.id] = [];
//           });
//           setBadgeSnaps(freshSnaps);
//           setActiveBadges(badgeConfigsForModal.map((c) => c.id));
//           badgeRefs.current = {};
//         }
//       });
//     },
//     [badgeConfigsForModal]
//   );
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

//   useImperativeHandle(
//     ref,
//     () => ({
//       open: () => setIsOpen(true),
//       close: () => setIsOpen(false),
//     }),
//     []
//   );

//   useEffect(() => {
//     if (isOpen) {
//       refreshRects();
//     }
//   }, [isOpen, refreshRects]);

//   // ── 2) 훅 아래에서만 렌더링 분기
//   if (!isOpen) {
//     return null;
//   }

//   return (
//     <ModalOverlay>
//       <ModalContainer onClick={(e) => e.stopPropagation()} ref={containerRef}>
//         <DndContext
//           id="game-record-dnd" // ← 여기에 고정된 string ID를 넣어줍니다
//           sensors={sensors}
//           modifiers={modifiers}
//           onDragStart={handleDragStart}
//           // onDragMove={handleDragMove}
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
//                 <div
//                   ref={switchAnchorRef}
//                   style={{
//                     width: "11vw",
//                     height: "3vh",
//                     position: "relative",
//                     // (기본 자리 표시용; 실제 스위치는 포털로 올라감)
//                   }}
//                 />

//                 <PortalSwitch
//                   anchorRef={switchAnchorRef}
//                   checked={reconstructChecked}
//                   onChange={handleReconstructToggle}
//                 />
//                 {/* </div> */}
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
//             <div ref={whiteBadgesRef}>
//               {badgeConfigsForModal
//                 .filter((cfg) => activeBadges.includes(cfg.id))
//                 .map((cfg) => (
//                   <DraggableBadge
//                     key={cfg.id}
//                     id={cfg.id}
//                     label={cfg.label}
//                     initialLeft={cfg.initialLeft}
//                     initialTop={cfg.initialTop}
//                     snapInfo={badgeSnaps[cfg.id]}
//                     badgeRefs={badgeRefs}
//                   />
//                 ))}
//             </div>
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
