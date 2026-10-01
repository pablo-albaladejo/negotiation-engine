import type { HTMLAttributes, ReactNode } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  caption?: string;
  children?: ReactNode;
}

export function Card({ title, caption, className, children, ...rest }: CardProps) {
  const classes = ["nr-card", className].filter(Boolean).join(" ");
  return (
    <div className={classes} {...rest}>
      {title ? <h2 className="nr-heading">{title}</h2> : null}
      {children}
      {caption ? <p className="nr-muted">{caption}</p> : null}
    </div>
  );
}
