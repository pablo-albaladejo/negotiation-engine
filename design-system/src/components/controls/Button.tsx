import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

function withClass(base: string, className?: string): string {
  return className ? `${base} ${className}` : base;
}

/** Back navigation: no border or background, low-key text link (see INBOX §0.1). */
export function BackLink({ className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={withClass("nr-link-back", className)} {...props} />;
}

/** Secondary action: round navigation, "show all", "Copy", etc. (INBOX §0.1). */
export function SecondaryButton({ className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={withClass("nr-btn-secondary", className)} {...props} />;
}

/** Primary action, reserved for the single most important action in a panel (INBOX §0.1). */
export function PrimaryButton({ className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={withClass("nr-btn-primary", className)} {...props} />;
}

/** Table/row link styled like a link but kept as a `<button>` for keyboard + click semantics (INBOX §0.2). */
export function TableLink({ className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={withClass("nr-link-table", className)} {...props} />;
}
