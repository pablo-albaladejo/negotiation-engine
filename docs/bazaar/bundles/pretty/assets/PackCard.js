import { i, n, t } from "./jsx-runtime.js";
import { u } from "./Cromo.js";
import { r } from "./Button.js";
import { D as D_1, _, v, x } from "./useEvents.js";
import { Y, v as v_2 } from "./index.js";
const d = i(n(), 1);
const f = t();
const p = {
  sm: 96,
  md: 140,
  lg: 200,
};
function m(name) {
  let t = name.toUpperCase().split(/\s+/).filter(Boolean);
  let n = [];
  let r = ``;
  for (let e of t) {
    if (r) {
      if ((r + ` ` + e).length <= 10) {
        r += ` ` + e;
      } else {
        n.push(r);
        r = e;
      }
    } else {
      r = e;
    }
  }
  if (r) {
    n.push(r);
  }
  return n.slice(0, 3);
}
function h(e) {
  let t = `common`;
  for (let n of _) {
    if ((e[n] ?? 0) > 0) {
      t = n;
    }
  }
  return t;
}
function GComponent({
  name,
  color = `#E0A458`,
  odds,
  slots,
  expectedBook,
  currency = `P`,
  serial,
  size = `md`,
  onClick,
  className,
}) {
  let S = d.useId().replace(/:/g, ``);
  let C = u();
  let w = (e) => `${e}-${S}`;
  let T = 112 / 12;
  let d_1 = `M4,10`;
  for (let e = 0; e < 12; e++) {
    d_1 += ` L${(4 + T * (e + 0.5)).toFixed(2)},4 L${(4 + T * (e + 1)).toFixed(2)},10`;
  }
  d_1 += ` L116,170`;
  for (let e = 0; e < 12; e++) {
    d_1 += ` L${(116 - T * (e + 0.5)).toFixed(2)},176 L${(116 - T * (e + 1)).toFixed(2)},170`;
  }
  d_1 += ` Z`;
  let D = m(name);
  let O = Math.max(...D.map((e) => e.length), 1);
  let fontSize = Math.min(17, 80 / (O * 0.5));
  let A = odds?.length
    ? odds.map(h)
    : Array.from(
        {
          length: slots ?? 0,
        },
        () => `common`,
      );
  return (
    <Y.div
      className={r(
        `relative inline-block shrink-0 select-none`,
        onClick && `cursor-pointer`,
        className,
      )}
      style={{
        width: p[size],
      }}
      whileHover={
        C
          ? undefined
          : {
              rotate: [0, -2, 2, -1, 0],
              y: -4,
              transition: {
                duration: 0.5,
              },
            }
      }
      whileTap={
        onClick && !C
          ? {
              scale: 0.97,
            }
          : undefined
      }
      onClick={onClick}
      role={onClick ? `button` : `img`}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === `Enter` || e.key === ` `)) {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={`Sealed pack: ${name}${A.length ? `, ${A.length} cards` : ``}`}
    >
      <svg
        viewBox={`0 0 120 180`}
        className={`block h-auto w-full drop-shadow-[0_14px_18px_rgb(0_0_0/0.55)]`}
      >
        <defs>
          <linearGradient id={w(`body`)} x1={`0`} y1={`0`} x2={`0.35`} y2={`1`}>
            <stop offset={`0%`} stopColor={D_1(color, `#ffffff`, 0.3)} />
            <stop offset={`45%`} stopColor={color} />
            <stop offset={`100%`} stopColor={D_1(color, `#0B1020`, 0.45)} />
          </linearGradient>
          <pattern
            id={w(`crimp`)}
            width={`3`}
            height={`10`}
            patternUnits={`userSpaceOnUse`}
          >
            <rect
              width={`1.2`}
              height={`10`}
              fill={`rgb(255 255 255 / 0.18)`}
            />
          </pattern>
          <clipPath id={w(`clip`)}>
            <path d={d_1} />
          </clipPath>
        </defs>
        <path d={d_1} fill={`url(#${w(`body`)})`} />
        <g clipPath={`url(#${w(`clip`)})`}>
          <polygon
            points={`0,64 120,18 120,42 0,88`}
            fill={`rgb(255 255 255 / 0.13)`}
          />
          <polygon
            points={`0,104 120,58 120,65 0,111`}
            fill={`rgb(255 255 255 / 0.07)`}
          />
          <rect
            x={`0`}
            y={`0`}
            width={`120`}
            height={`20`}
            fill={`url(#${w(`crimp`)})`}
          />
          <rect
            x={`0`}
            y={`0`}
            width={`120`}
            height={`20`}
            fill={x(D_1(color, `#0B1020`, 0.3), 0.35)}
          />
          <rect
            x={`0`}
            y={`160`}
            width={`120`}
            height={`20`}
            fill={`url(#${w(`crimp`)})`}
          />
          <rect
            x={`0`}
            y={`160`}
            width={`120`}
            height={`20`}
            fill={x(D_1(color, `#0B1020`, 0.3), 0.35)}
          />
        </g>
        <line
          x1={`10`}
          y1={`27`}
          x2={`112`}
          y2={`27`}
          stroke={`rgb(255 255 255 / 0.55)`}
          strokeWidth={`0.8`}
          strokeDasharray={`2.2 2`}
        />
        <text
          x={`6`}
          y={`29.4`}
          fontSize={`6.5`}
          fill={`rgb(255 255 255 / 0.75)`}
        >{`✂`}</text>
        <rect
          x={`15`}
          y={46}
          width={`90`}
          height={`92`}
          rx={`9`}
          fill={`rgb(11 16 32 / 0.84)`}
          stroke={x(D_1(color, `#ffffff`, 0.35), 0.75)}
          strokeWidth={`1.1`}
        />
        <text
          x={`60`}
          y={59}
          textAnchor={`middle`}
          fontSize={`5.6`}
          fontWeight={`800`}
          letterSpacing={`1.5`}
          fill={`#FFC44D`}
          fontFamily={`var(--font-sans)`}
        >{`CROMOS DE MADRID`}</text>
        <line
          x1={`34`}
          y1={63.5}
          x2={`86`}
          y2={63.5}
          stroke={`rgb(255 196 77 / 0.35)`}
          strokeWidth={`0.6`}
        />
        {D.map((e, t) => (
          <text
            key={t}
            x={`60`}
            y={76 + fontSize * 0.98 * t}
            textAnchor={`middle`}
            fontSize={fontSize}
            fontWeight={`800`}
            fill={`#FFF3DC`}
            fontFamily={`var(--font-display)`}
            letterSpacing={`0.4`}
          >
            {e}
          </text>
        ))}
        {A.length > 0 && (
          <g>
            {A.map((e, t) => {
              let n = 8.5;
              let r = 60 - ((A.length - 1) * n) / 2;
              return (
                <circle
                  key={t}
                  cx={r + t * n}
                  cy={116}
                  r={`2.7`}
                  fill={v[e]}
                  stroke={`rgb(11 16 32 / 0.9)`}
                  strokeWidth={`0.8`}
                />
              );
            })}
          </g>
        )}
        <text
          x={`60`}
          y={129}
          textAnchor={`middle`}
          fontSize={`6.2`}
          fontWeight={`700`}
          fill={`#8C97B2`}
          fontFamily={`var(--font-sans)`}
        >
          {A.length ? `${A.length} CARDS` : `CARDS`}
          {expectedBook === undefined
            ? ``
            : ` · ≈${v_2(expectedBook, {
                symbol: currency,
              })}`}
        </text>
        {serial !== undefined && (
          <text
            x={`60`}
            y={`168.5`}
            textAnchor={`middle`}
            fontSize={`5.4`}
            fontWeight={`700`}
            fill={`rgb(255 255 255 / 0.7)`}
            fontFamily={`var(--font-mono)`}
          >
            {`Nº `}
            {String(serial).padStart(5, `0`)}
          </text>
        )}
      </svg>
    </Y.div>
  );
}
export { GComponent as t };
