// PortalSwitch.tsx
import { useLayoutEffect, memo, RefObject, useState } from "react";
import { createPortal } from "react-dom";
import { ReconstructionSwitch } from "./groundRecordModal.style";

interface PortalSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  anchorRef: RefObject<HTMLElement>;
}

const PORTAL_ROOT_ID = "lightweight-switch-portal-root";

function ensurePortalRoot() {
  let root = document.getElementById(PORTAL_ROOT_ID);
  if (!root) {
    root = document.createElement("div");
    root.id = PORTAL_ROOT_ID;
    Object.assign(root.style, {
      position: "fixed",
      top: "0",
      left: "0",
      pointerEvents: "none",
      zIndex: 20000,
    });
    document.body.appendChild(root);
  }
  return root;
}

const PortalSwitch = memo(function PortalSwitch({
  checked,
  onChange,
  anchorRef,
}: PortalSwitchProps) {
  const [position, setPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
    height: 0,
  });

  useLayoutEffect(() => {
    if (!anchorRef.current) return;
    const update = () => {
      const rect = anchorRef.current!.getBoundingClientRect();
      setPosition({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(anchorRef.current);
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [anchorRef]);

  const switchNode = (
    <div
      style={{
        position: "fixed",
        top: position.top,
        left: position.left,
        width: position.width,
        height: position.height,
        pointerEvents: "auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        willChange: "transform, opacity",
        transform: "translateZ(0)",
      }}
    >
      <ReconstructionSwitch
        checked={checked}
        onChange={(val: boolean) => onChange(val)}
        aria-checked={checked}
      />
    </div>
  );

  return createPortal(switchNode, ensurePortalRoot());
});

export default PortalSwitch;
