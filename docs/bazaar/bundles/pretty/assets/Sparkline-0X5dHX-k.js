import { i as i_1, n, t } from "./jsx-runtime-CU3EbJiN.js";
import { r } from "./Button-DIaWEsZ9.js";
const i = i_1(n(), 1);
const a = t();
function OComponent({
  data,
  width = 120,
  height = 32,
  color = `var(--color-gold)`,
  area = true,
  showLast = true,
  bars = false,
  strokeWidth = 1.75,
  className,
  label,
}) {
  let p = i.useId().replace(/:/g, ``);
  let m = width - 4;
  let h = height - 4;
  let g = data.length ? data : [0];
  let _ = Math.min(0, ...g);
  let v = Math.max(...g) - _ || 1;
  let y = (e) => 2 + (g.length === 1 ? m : (e / (g.length - 1)) * m);
  let b = (e) => 2 + h - ((e - _) / v) * h;
  if (bars) {
    let e = m / g.length;
    return (
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className={r(`overflow-visible`, className)}
        role={`img`}
        aria-label={label ?? `trend`}
      >
        {g.map((t, n) => {
          let y_1 = b(t);
          return (
            <rect
              key={n}
              x={2 + n * e + e * 0.15}
              y={y_1}
              width={Math.max(1, e * 0.7)}
              height={Math.max(t > 0 ? 1.5 : 0.75, 2 + h - y_1)}
              rx={Math.min(1.5, e * 0.3)}
              fill={color}
              opacity={t > 0 ? (n === g.length - 1 ? 1 : 0.7) : 0.18}
            />
          );
        })}
      </svg>
    );
  }
  let d_1 = `M${g.map((e, t) => `${y(t).toFixed(2)},${b(e).toFixed(2)}`).join(` L`)}`;
  let d = `${d_1} L${y(g.length - 1).toFixed(2)},${2 + h} L${y(0).toFixed(2)},${2 + h} Z`;
  let C = g[g.length - 1];
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={r(`overflow-visible`, className)}
      role={`img`}
      aria-label={label ?? `trend`}
    >
      <defs>
        <linearGradient id={`sg${p}`} x1={`0`} x2={`0`} y1={`0`} y2={`1`}>
          <stop offset={`0%`} stopColor={color} stopOpacity={`0.35`} />
          <stop offset={`100%`} stopColor={color} stopOpacity={`0`} />
        </linearGradient>
      </defs>
      {area && <path d={d} fill={`url(#sg${p})`} />}
      <path
        d={d_1}
        fill={`none`}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin={`round`}
        strokeLinecap={`round`}
      />
      {showLast && (
        <circle
          cx={y(g.length - 1)}
          cy={b(C)}
          r={2.6}
          fill={color}
          stroke={`var(--color-panel)`}
          strokeWidth={1.25}
        />
      )}
    </svg>
  );
}
export { OComponent as t };
