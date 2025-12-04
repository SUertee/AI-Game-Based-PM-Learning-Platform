// PageShell.jsx
import React, { useMemo } from "react";
import "../../../styles/game/layout/Layout.css";

export default function PageShell({
  children,
  onBack,
  onNext,
  nextLabel = "Next",
  showBack = true,
  right = null,
  wide = false,
  className = "",
}) {
  const childArray = useMemo(() => React.Children.toArray(children), [children]);
  const ctxFromChild = useMemo(() => {
    for (const ch of childArray) {
      if (ch && ch.props && ch.props.ctx) return ch.props.ctx;
    }
    return null;
  }, [childArray]);

  const defaultBack = () => {
    if (!ctxFromChild) return;
    const { pageIndex, goPrev, goTo } = ctxFromChild;
    if (typeof pageIndex === "number" && typeof goTo === "function" && pageIndex <= 0) {
      goTo("BACK_DASHBOARD");
    } else if (typeof goPrev === "function") {
      goPrev();
    }
  };
  const navBack = onBack ?? (ctxFromChild ? defaultBack : undefined);

  const navNext = onNext ?? (ctxFromChild && typeof ctxFromChild.goNext === "function" ? ctxFromChild.goNext : undefined);

  // Check if current page is BRIEF_INTRO
  const currentStep = ctxFromChild?.flow?.[ctxFromChild?.pageIndex];
  const isBriefIntro = currentStep?.kind === 'BRIEF_INTRO';

  const canShowBack = showBack && typeof navBack === "function";
  const canShowNext = typeof navNext === "function" && isBriefIntro;

  return (
    <div className={`app-shell ${wide ? "app-shell--wide" : ""} ${className}`}>
      <div className="footer-nav">
        <div>
          {canShowBack ? (
            <button className="backbtn" onClick={navBack}>❮ Back</button>
          ) : (
            <button className="backbtn" disabled style={{ visibility: "hidden" }}>
              ❮ Back
            </button>
          )}
        </div>
        <div className="right">
          {right}
          {canShowNext && (
            <button className="nextbtn" onClick={navNext}>
              {nextLabel} ❯
            </button>
          )}
        </div>
      </div>

      <div className="content">{children}</div>

      <div className="footer-nav">
        <div className="helper">Use Back / Next to move linearly.</div>
        <div />
      </div>
    </div>
  );
}
