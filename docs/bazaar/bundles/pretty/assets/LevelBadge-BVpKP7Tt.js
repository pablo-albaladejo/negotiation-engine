import { t } from "./jsx-runtime-CU3EbJiN.js";
import { r as r_1 } from "./Button-DIaWEsZ9.js";
import { E } from "./useEvents-BpJ5PfZT.js";
const r = t();
function IComponent({
  level,
  max = 5,
  showName,
  locked,
  size = `sm`,
  className,
}) {
  let l = E(level);
  return (
    <span
      className={r_1(
        `inline-flex items-center gap-2 rounded-full border border-line-strong bg-base/60 font-semibold whitespace-nowrap`,
        size === `sm` ? `h-6 px-2.5 text-[11px]` : `h-7 px-3 text-xs`,
        locked ? `text-faint` : `text-ink`,
        className,
      )}
      title={`Level ${level}${l.name ? ` · ${l.name}` : ``}${l.blurb ? ` — ${l.blurb}` : ``}`}
    >
      <span
        className={r_1(
          `font-display font-extrabold tracking-wide`,
          size === `sm` ? `text-[13px]` : `text-[15px]`,
          locked ? `text-faint` : `text-gold`,
        )}
      >
        {`L`}
        {level}
      </span>
      <span className={`flex items-center gap-[3px]`} aria-hidden>
        {Array.from(
          {
            length: max,
          },
          (n, i) => (
            <span
              key={i}
              className={r_1(
                `rounded-full`,
                size === `sm` ? `size-1.5` : `size-2`,
                i < level
                  ? locked
                    ? `bg-faint`
                    : `bg-gold shadow-[0_0_6px_rgb(255_196_77/0.6)]`
                  : `bg-line-strong`,
              )}
            />
          ),
        )}
      </span>
      {showName && <span className={`text-muted`}>{l.name}</span>}
    </span>
  );
}
export { IComponent as t };
