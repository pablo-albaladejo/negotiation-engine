import { t } from "./jsx-runtime-CU3EbJiN.js";
import { r } from "./Button-DIaWEsZ9.js";
import { v, w, y } from "./useEvents-BpJ5PfZT.js";
const a = t();
function OComponent({
  rarity,
  label,
  printRun,
  color,
  variant = `soft`,
  size = `sm`,
  className,
}) {
  let f = color ?? v[rarity] ?? `#9AA4B8`;
  let p = label ?? y[rarity] ?? rarity;
  if (variant === `dot`) {
    return (
      <span
        className={r(
          `inline-flex items-center gap-1.5 font-semibold`,
          size === `sm` ? `text-xs` : `text-sm`,
          className,
        )}
        style={{
          color: f,
        }}
      >
        <span
          className={`size-2 rounded-full`}
          style={{
            background: f,
            boxShadow: `0 0 8px ${f}`,
          }}
          aria-hidden
        />
        {p}
        {printRun !== undefined && (
          <span className={`font-mono text-[0.85em] text-muted`}>
            {`×`}
            {printRun}
          </span>
        )}
      </span>
    );
  }
  let m = variant === `solid`;
  return (
    <span
      className={r(
        `relative inline-flex items-center gap-1.5 overflow-hidden rounded-full border font-bold uppercase tracking-[0.1em] whitespace-nowrap`,
        size === `sm` ? `h-5 px-2 text-[10px]` : `h-6 px-2.5 text-[11px]`,
        className,
      )}
      style={{
        color: m ? `#0B1020` : f,
        background: m ? f : `${f}1f`,
        borderColor: m ? f : `${f}59`,
      }}
    >
      {w(rarity) && (
        <span
          aria-hidden
          className={`pointer-events-none absolute inset-0 bg-[linear-gradient(110deg,transparent_30%,rgb(255_255_255/0.35)_50%,transparent_70%)] bg-[length:250%_100%] animate-[shimmer_3.5s_linear_infinite]`}
        />
      )}
      <span className={`relative`}>{p}</span>
      {printRun !== undefined && (
        <span
          className={`relative font-mono font-semibold normal-case tracking-normal opacity-80`}
        >
          {`×`}
          {printRun}
        </span>
      )}
    </span>
  );
}
export { OComponent as t };
