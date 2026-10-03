import { t } from "./jsx-runtime-CU3EbJiN.js";
import { r } from "./Button-DIaWEsZ9.js";
import { t as N } from "./Sparkline-0X5dHX-k.js";
import { s as R } from "./index-B_RfsMCE.js";
const i = t();
const a = {
  default: `text-ink`,
  gold: `text-gold`,
  good: `text-good`,
  warn: `text-warn`,
  accent: `text-accent`,
  info: `text-info`,
};
const o = {
  default: `var(--color-ink)`,
  gold: `var(--color-gold)`,
  good: `var(--color-good)`,
  warn: `var(--color-warn)`,
  accent: `var(--color-accent)`,
  info: `var(--color-info)`,
};
const s = {
  md: `text-3xl`,
  lg: `text-5xl`,
  xl: `text-7xl`,
};
function CComponent({
  label,
  value,
  format,
  unit,
  delta,
  deltaFormat,
  hint,
  tone = `default`,
  icon,
  trend,
  trendBars,
  size = `md`,
  className,
}) {
  let b = typeof value == `number` || typeof value == `string`;
  return (
    <div
      className={r(
        `surface relative flex min-w-0 flex-col gap-2 overflow-hidden px-4 py-3.5`,
        className,
      )}
    >
      <div className={`flex items-center justify-between gap-2`}>
        <span className={`eyebrow truncate`}>{label}</span>
        {icon && (
          <span className={r(`shrink-0 opacity-80`, a[tone])}>{icon}</span>
        )}
      </div>
      <div className={`flex items-end justify-between gap-3`}>
        <div className={r(`flex min-w-0 items-baseline gap-1.5`, a[tone])}>
          {b ? (
            <R
              value={value}
              format={format}
              className={r(s[size], `leading-none`)}
            />
          ) : (
            <span className={r(`font-display-num`, s[size])}>{value}</span>
          )}
          {unit && (
            <span className={`text-sm font-semibold text-muted`}>{unit}</span>
          )}
        </div>
        {trend && trend.length > 1 && (
          <N
            data={trend}
            color={o[tone === "default" ? `gold` : tone]}
            bars={trendBars}
            width={96}
            height={30}
          />
        )}
      </div>
      {(delta !== undefined || hint) && (
        <div className={`flex items-center gap-2 text-xs text-muted`}>
          {typeof delta == `number` ? (
            <span
              className={r(
                `font-semibold`,
                delta > 0
                  ? `text-good`
                  : delta < 0
                    ? `text-accent`
                    : `text-muted`,
              )}
            >
              {delta > 0 ? `▲ ` : delta < 0 ? `▼ ` : ``}
              {deltaFormat
                ? deltaFormat(Math.abs(delta))
                : Math.abs(delta).toLocaleString(`en-US`)}
            </span>
          ) : (
            delta
          )}
          {hint && <span className={`truncate`}>{hint}</span>}
        </div>
      )}
    </div>
  );
}
export { CComponent as t };
