import { t } from "./jsx-runtime.js";
import { i, r as r_1 } from "./Button.js";
const r = {
  name: `copy`,
  size: 24,
  node: [
    [
      `rect`,
      {
        width: `14`,
        height: `14`,
        x: `8`,
        y: `8`,
        rx: `2`,
        ry: `2`,
        key: `17jyea`,
      },
    ],
    [
      `path`,
      {
        d: `M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2`,
        key: `zix9uf`,
      },
    ],
  ],
};
r.node;
export const n = i(r);
const a = t();
function OComponent({ label, onClick, disabled, danger, children, className }) {
  return (
    <button
      type={`button`}
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={r_1(
        `rounded-md p-1.5 text-faint transition-colors disabled:opacity-30`,
        danger
          ? `hover:bg-accent/15 hover:text-accent`
          : `hover:bg-raised hover:text-ink`,
        className,
      )}
    >
      {children}
    </button>
  );
}
export { OComponent as t };
