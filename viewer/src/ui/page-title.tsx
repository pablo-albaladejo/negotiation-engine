import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { consumePageFocus } from "../focus.js";

export interface PageTitleProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

/**
 * Page `h2` used by every screen (C1): focuses itself on mount when `App` flagged a real
 * navigation (`requestPageFocus`), i.e. only once the screen itself has rendered this heading —
 * sturdier than `App` querying the DOM for an `h2` on hash change, which can fire while the
 * screen is still showing a `LoadingCard` with nothing to focus.
 */
export function PageTitle({ children, className = "nr-heading-lg", style }: PageTitleProps) {
  const ref = useRef<HTMLHeadingElement | null>(null);
  useEffect(() => {
    if (consumePageFocus()) ref.current?.focus();
  }, []);
  return (
    <h2 ref={ref} tabIndex={-1} className={className} style={style}>
      {children}
    </h2>
  );
}
