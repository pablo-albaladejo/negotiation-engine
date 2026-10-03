import { t } from "./jsx-runtime-CU3EbJiN.js";
import { r } from "./Button-DIaWEsZ9.js";
import { C, D } from "./useEvents-BpJ5PfZT.js";
import { t as I } from "./lock-Cv7BB2xm.js";
import { t as A } from "./snowflake-CGy1yW7K.js";
const o = t();
const s = {
  xs: {
    box: `size-6`,
    text: `text-[10px]`,
    emoji: `size-3.5 text-[8px] -right-1 -bottom-1`,
  },
  sm: {
    box: `size-8`,
    text: `text-xs`,
    emoji: `size-4 text-[9px] -right-1 -bottom-1`,
  },
  md: {
    box: `size-11`,
    text: `text-base`,
    emoji: `size-5 text-[11px] -right-1 -bottom-1`,
  },
  lg: {
    box: `size-16`,
    text: `text-2xl`,
    emoji: `size-7 text-sm -right-1 -bottom-1`,
  },
  xl: {
    box: `size-24`,
    text: `text-4xl`,
    emoji: `size-9 text-lg -right-1.5 -bottom-1.5`,
  },
};
function c(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((e) => e[0]?.toUpperCase() ?? ``)
    .join(``);
}
function LComponent({ avatar, name, size = `md`, status, ring, className }) {
  let m = avatar?.color || `#5C6B73`;
  let h = s[size];
  let g = status === `locked` || status === `disabled`;
  return (
    <span
      className={r(`relative inline-flex shrink-0`, className)}
      role={`img`}
      aria-label={`${name}${status ? ` (${status})` : ``}`}
    >
      <span
        className={r(
          `grid place-items-center rounded-full font-display font-extrabold tracking-wide select-none`,
          h.box,
          h.text,
          ring
            ? `ring-2 ring-gold ring-offset-2 ring-offset-base`
            : `ring-1 ring-white/10`,
          g && `grayscale opacity-55`,
        )}
        style={{
          color: C(m),
          background: `radial-gradient(circle at 30% 25%, ${D(m, `#ffffff`, 0.28)} 0%, ${m} 55%, ${D(m, `#0B1020`, 0.35)} 100%)`,
          boxShadow: `0 6px 18px -8px ${m}`,
        }}
      >
        {avatar?.initials || c(name)}
      </span>
      {avatar?.emoji && !status && (
        <span
          className={r(
            `absolute grid place-items-center rounded-full border border-line bg-panel leading-none`,
            h.emoji,
          )}
          aria-hidden
        >
          {avatar.emoji}
        </span>
      )}
      {status && (
        <span
          className={r(
            `absolute grid place-items-center rounded-full border border-line bg-panel text-muted`,
            h.emoji,
          )}
          aria-hidden
        >
          {status === `cooloff` ? (
            <A className={`size-[70%] text-info`} />
          ) : (
            <I className={`size-[65%]`} />
          )}
        </span>
      )}
    </span>
  );
}
export { LComponent as t };
