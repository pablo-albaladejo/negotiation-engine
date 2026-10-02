import type { HTMLAttributes, ReactNode } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  /** Heading level for the title (h2/h3/h4), default 3: a Card nests under the page's own h2 (`.nr-heading-lg`). */
  level?: 2 | 3 | 4;
  caption?: string;
  children?: ReactNode;
}

export function Card({ title, level = 3, caption, className, children, ...rest }: CardProps) {
  const classes = ["nr-card", className].filter(Boolean).join(" ");
  const Heading = (`h${level}` as const);
  return (
    <div className={classes} {...rest}>
      {title ? <Heading className="nr-heading">{title}</Heading> : null}
      {children}
      {caption ? <p className="nr-muted">{caption}</p> : null}
    </div>
  );
}
