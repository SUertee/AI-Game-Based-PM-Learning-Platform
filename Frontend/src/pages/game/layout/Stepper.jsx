import React, { useEffect, useMemo, useRef, useCallback } from "react";
import "../../../styles/game/layout/Stepper.css";

export default function Stepper({ current = 0, steps = [], onJump }) {
  const fallback = useMemo(() => [
    { title: "Intro", sub: "Project brief" },
    { title: "Details", sub: "" },
    { title: "Quiz 1 Intro", sub: "" },
    { title: "Q1", sub: "" },
    { title: "Q2", sub: "" },
    { title: "Q3", sub: "" },
    { title: "Quiz 1 Result", sub: "" }
  ], []);

  const items = useMemo(
    () => (steps.length ? steps : fallback).map((s, i) =>
      typeof s === "string" ? { title: s, sub: "" } : { title: s.title ?? `Step ${i + 1}`, sub: s.sub ?? "" }
    ),
    [steps, fallback]
  );

  const total = items.length;
  const safeCurrent = Math.max(0, Math.min(current, total - 1));

  const viewportRef = useRef(null);
  const itemRefs = useRef([]);
  const dragging = useRef(false);
  const moved = useRef(false);
  const startX = useRef(0);
  const startLeft = useRef(0);
  const DRAG_THRESHOLD = 4;

  const handleJump = useCallback(i => { if (typeof onJump === "function") onJump(i); }, [onJump]);

  useEffect(() => {
    const el = itemRefs.current[safeCurrent];
    if (el && viewportRef.current) el.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [safeCurrent, total]);

  const onWheel = useCallback((e) => {
    if (!viewportRef.current) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) { e.preventDefault(); viewportRef.current.scrollLeft += e.deltaY; }
  }, []);

  const onPointerDown = useCallback((e) => {
    if (!viewportRef.current) return;
    dragging.current = true; moved.current = false;
    startX.current = e.clientX; startLeft.current = viewportRef.current.scrollLeft;
    viewportRef.current.setPointerCapture?.(e.pointerId);
  }, []);
  const onPointerMove = useCallback((e) => {
    if (!viewportRef.current || !dragging.current) return;
    const dx = e.clientX - startX.current;
    if (Math.abs(dx) >= DRAG_THRESHOLD) moved.current = true;
    viewportRef.current.scrollLeft = startLeft.current - dx;
  }, []);
  const endPointer = useCallback((e) => {
    if (!viewportRef.current) return;
    dragging.current = false; viewportRef.current.releasePointerCapture?.(e.pointerId);
  }, []);

  const scrollByAmount = useCallback((dir) => {
    if (!viewportRef.current) return;
    const amount = Math.max(240, viewportRef.current.clientWidth * 0.8);
    viewportRef.current.scrollBy({ left: dir * amount, behavior: "smooth" });
  }, []);

  const onActivate = useCallback((i) => { if (!moved.current) handleJump(i); }, [handleJump]);
  const onKeyActivate = (e, i) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onActivate(i); } };

  const clickable = !!onJump;

  return (
    <div className="stepper conveyor" aria-label="Step progress">
      <div className="stepper-inner">
        <div
          className={`belt-viewport ${clickable ? "is-clickable" : ""}`}
          ref={viewportRef}
          onWheel={onWheel}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endPointer}
          onPointerCancel={endPointer}
          onPointerLeave={endPointer}
          role="region"
          aria-roledescription="carousel"
        >
          <div className="belt">
            {items.map((s, i) => (
              <div
                className={`step-slide ${clickable ? "clickable" : ""}`}
                key={i}
                ref={(el) => (itemRefs.current[i] = el)}
                role={clickable ? "button" : undefined}
                tabIndex={clickable ? 0 : -1}
                aria-current={i === safeCurrent ? "step" : undefined}
                onClick={() => onActivate(i)}
                onKeyDown={(e) => onKeyActivate(e, i)}
                title={s.title}
              >
                <div className={`step-label ${i === safeCurrent ? "is-active" : ""}`}>
                  <div className="title">{s.title}</div>
                  <div className="sub">{s.sub || ""}</div>
                </div>

                <div className="track-row">
                    <div
                      className={`dot ${i === safeCurrent ? "active" : ""} ${i < safeCurrent ? "done" : ""} ${clickable ? "clickable" : ""}`}
                      onClick={(e) => { e.stopPropagation(); onActivate(i); }}
                      onKeyDown={(e) => { if (clickable) onKeyActivate(e, i); }}
                      role={clickable ? "button" : undefined}
                      tabIndex={clickable ? 0 : -1}
                      aria-label={`Go to ${s.title}`}
                      title={s.title}
                    >
                      {i < safeCurrent ? '✓' : (i + 1)}
                    </div>
                  {i < total - 1 && <div className="line" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
