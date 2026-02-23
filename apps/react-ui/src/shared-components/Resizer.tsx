import React, { useRef } from "react";

interface ResizerProps {
  direction: "vertical" | "horizontal";
  onResize: (delta: number) => void;
}

const Resizer: React.FC<ResizerProps> = ({ direction, onResize }) => {
  const dragging = useRef(false);
  const lastPosition = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    dragging.current = true;
    lastPosition.current = direction === "vertical" ? e.clientX : e.clientY;
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!dragging.current) return;
    const current = direction === "vertical" ? e.clientX : e.clientY;
    const delta = current - lastPosition.current;
    lastPosition.current = current;
    onResize(delta);
  };

  const handleMouseUp = () => {
    dragging.current = false;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  return (
    <div
      className={`resizer ${direction}`}
      style={{
        cursor: direction === "vertical" ? "col-resize" : "row-resize",
        background: "#e5e7eb",
        width: direction === "vertical" ? 6 : "100%",
        height: direction === "horizontal" ? 6 : "100%",
        zIndex: 10,
        userSelect: "none",
      }}
      onMouseDown={handleMouseDown}
    />
  );
};

export default Resizer;
