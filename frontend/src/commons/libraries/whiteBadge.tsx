import { useDraggable } from "@dnd-kit/core";
import { memo, useCallback } from "react";
import { NameBadge } from "../../components/commons/modals/groudRecordModal/groundRecordModal.style";

const baseIds = [
  "first-base",
  "second-base",
  "third-base",
  "home-base",
] as const;
type BaseId = (typeof baseIds)[number];

type SnapInfo = { base: BaseId; pos: { xPct: number; yPct: number } };

interface DraggableBadgeProps {
  id: string;
  label: string;
  initialLeft: string;
  initialTop: string;
  snapInfo: SnapInfo | null;
  badgeRefs: React.MutableRefObject<Record<string, HTMLElement | null>>;
}

export const DraggableBadge = memo(
  function DraggableBadge({
    id,
    label,
    initialLeft,
    initialTop,
    snapInfo,
    badgeRefs,
  }: DraggableBadgeProps) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
      id,
    });
    // console.log(`badge render`);

    const combinedRef = useCallback(
      (el: HTMLElement | null) => {
        setNodeRef(el);
        badgeRefs.current[id] = el;
      },
      [id, setNodeRef, badgeRefs]
    );

    const isWhite = !id.startsWith("black-badge");
    const dragging = !!transform;
    const left = snapInfo && isWhite ? `${snapInfo.pos.xPct}%` : initialLeft;
    const top = snapInfo && isWhite ? `${snapInfo.pos.yPct}%` : initialTop;
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
  },
  (prev, next) => {
    // snapInfo 비교를 깊이 있게 해서 실제 변화가 있을 때만 재렌더
    const prevSnap = prev.snapInfo;
    const nextSnap = next.snapInfo;
    const sameSnap =
      prevSnap === nextSnap ||
      (prevSnap &&
        nextSnap &&
        prevSnap.base === nextSnap.base &&
        prevSnap.pos.xPct === nextSnap.pos.xPct &&
        prevSnap.pos.yPct === nextSnap.pos.yPct);
    return (
      prev.id === next.id &&
      prev.label === next.label &&
      prev.initialLeft === next.initialLeft &&
      prev.initialTop === next.initialTop &&
      sameSnap
    );
  }
);
