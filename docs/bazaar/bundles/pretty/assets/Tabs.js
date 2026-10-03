import { i, n, t } from "./jsx-runtime.js";
import { r } from "./Button.js";
import { Y } from "./index.js";
const a = i(n(), 1);
const o = t();
function SComponent({
  tabs,
  value,
  onChange,
  variant = `underline`,
  size = `md`,
  className,
  label,
}) {
  let layoutId = `tabs-${a.useId()}`;
  let fRef = a.useRef([]);
  return (
    <div
      role={`tablist`}
      aria-label={label}
      onKeyDown={(r) => {
        if (![`ArrowLeft`, `ArrowRight`, `Home`, `End`].includes(r.key)) {
          return;
        }
        r.preventDefault();
        let i = tabs
          .map((e, t) => {
            if (e.disabled) {
              return -1;
            }
            return t;
          })
          .filter((e) => e >= 0);
        let a = i.indexOf(tabs.findIndex((e) => e.id === value));
        let o = a;
        if (r.key === `ArrowRight`) {
          o = (a + 1) % i.length;
        }
        if (r.key === `ArrowLeft`) {
          o = (a - 1 + i.length) % i.length;
        }
        if (r.key === `Home`) {
          o = 0;
        }
        if (r.key === `End`) {
          o = i.length - 1;
        }
        let s = i[o];
        onChange(tabs[s].id);
        fRef.current[s]?.focus();
      }}
      className={r(
        `relative flex items-center`,
        variant === `underline`
          ? `gap-5 border-b border-line`
          : `gap-1 rounded-xl border border-line bg-base/60 p-1`,
        className,
      )}
    >
      {tabs.map((e, a) => {
        let l = e.id === value;
        return (
          <button
            key={e.id}
            ref={(e) => {
              fRef.current[a] = e;
            }}
            role={`tab`}
            type={`button`}
            aria-selected={l}
            tabIndex={l ? 0 : -1}
            disabled={e.disabled}
            onClick={() => onChange(e.id)}
            className={r(
              `relative inline-flex items-center gap-2 font-semibold transition-colors disabled:opacity-40`,
              size === `sm` ? `text-xs` : `text-sm`,
              variant === `underline`
                ? `pb-2.5 pt-1`
                : `rounded-lg px-3 py-1.5`,
              l ? `text-ink` : `text-muted hover:text-ink`,
            )}
          >
            {variant === `pills` && l && (
              <Y.span
                layoutId={layoutId}
                className={`absolute inset-0 rounded-lg bg-raised shadow-[var(--shadow-panel)]`}
                transition={{
                  type: `spring`,
                  bounce: 0.18,
                  duration: 0.4,
                }}
              />
            )}
            <span className={`relative inline-flex items-center gap-2`}>
              {e.icon}
              {e.label}
              {e.count !== undefined && (
                <span
                  className={r(
                    `rounded-full px-1.5 py-0.5 text-[10px] leading-none`,
                    l ? `bg-gold/15 text-gold` : `bg-raised text-muted`,
                  )}
                >
                  {e.count}
                </span>
              )}
            </span>
            {variant === `underline` && l && (
              <Y.span
                layoutId={layoutId}
                className={`absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-gold`}
                transition={{
                  type: `spring`,
                  bounce: 0.18,
                  duration: 0.4,
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
export { SComponent as t };
