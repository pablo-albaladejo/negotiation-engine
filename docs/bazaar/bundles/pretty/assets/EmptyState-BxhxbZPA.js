import { t } from "./jsx-runtime-CU3EbJiN.js";
import { i, r as r_1 } from "./Button-DIaWEsZ9.js";
const r = {
  name: `inbox`,
  size: 24,
  node: [
    [
      `polyline`,
      {
        points: `22 12 16 12 14 15 10 15 8 12 2 12`,
        key: `o97t9d`,
      },
    ],
    [
      `path`,
      {
        d: `M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z`,
        key: `oot6mr`,
      },
    ],
  ],
};
r.node;
const I = i(r);
const a = t();
function OComponent({ icon, title, hint, action, compact, className }) {
  return (
    <div
      className={r_1(
        `flex flex-col items-center justify-center text-center`,
        compact ? `gap-2 px-4 py-8` : `gap-3 px-6 py-14`,
        className,
      )}
    >
      <div
        className={r_1(
          `grid place-items-center rounded-2xl border border-dashed border-line-strong text-muted`,
          compact ? `size-10` : `size-14`,
        )}
      >
        {icon ?? <I className={compact ? `size-5` : `size-6`} />}
      </div>
      <div
        className={r_1(
          `font-display font-extrabold text-ink`,
          compact ? `text-lg` : `text-2xl`,
        )}
      >
        {title}
      </div>
      {hint && <p className={`max-w-md text-sm text-muted`}>{hint}</p>}
      {action && <div className={`mt-1`}>{action}</div>}
    </div>
  );
}
export { OComponent as t };
