import type { HTMLAttributes, ReactNode } from "react";

export interface RootProps extends HTMLAttributes<HTMLDivElement> {
  theme?: "light" | "dark";
  children?: ReactNode;
}

export function Root({ theme, className, children, ...rest }: RootProps) {
  const classes = ["nr-root", className].filter(Boolean).join(" ");
  return (
    <div className={classes} data-theme={theme} {...rest}>
      {children}
    </div>
  );
}
