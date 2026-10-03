import { i, n, t } from "./jsx-runtime.js";
import { r } from "./Button.js";
import { n as n_2, s } from "./useEvents.js";
import { t as O1 } from "./x.js";
import { t as t_2 } from "./names.js";
const c = i(n(), 1);
const l = t();
const u = `h-9 rounded-lg border border-line-strong bg-base/80 px-3 text-sm text-ink outline-none transition-colors placeholder:text-faint hover:border-muted/50 focus:border-gold/70 disabled:opacity-50`;
const d = `${u} w-full`;
const f = (e) => {
  if (e && /(^|\s)w-/.test(e)) {
    return ``;
  }
  return `w-full`;
};
export function o({
  label: label_1,
  hint,
  aside,
  error,
  className,
  children,
  htmlFor,
}) {
  return (
    <div className={r(`flex min-w-0 flex-col gap-1.5`, className)}>
      <div className={`flex items-baseline justify-between gap-2`}>
        <label htmlFor={htmlFor} className={`eyebrow truncate`}>
          {label_1}
        </label>
        {aside && (
          <span className={`shrink-0 text-[11px] text-muted`}>{aside}</span>
        )}
      </div>
      {children}
      {error ? (
        <p className={`text-xs text-accent`}>{error}</p>
      ) : hint ? (
        <p className={`text-xs leading-snug text-faint`}>{hint}</p>
      ) : null}
    </div>
  );
}
function M1Component({
  value,
  onChange,
  placeholder,
  className,
  mono,
  disabled,
  id,
  maxLength,
  list,
  invalid,
  onEnter,
  autoFocus,
}) {
  return (
    <input
      id={id}
      type={`text`}
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      maxLength={maxLength}
      list={list}
      autoFocus={autoFocus}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onEnter ? (e) => e.key === `Enter` && onEnter() : undefined}
      className={r(
        u,
        f(className),
        mono && `font-mono text-[13px]`,
        invalid && `border-accent/70 focus:border-accent`,
        className,
      )}
    />
  );
}
function HComponent({
  value,
  onChange,
  min,
  max,
  step = 1,
  nullable,
  placeholder,
  className,
  disabled,
  id,
  suffix,
  integer,
}) {
  let [g, setG] = c.useState(value == null ? `` : String(value));
  let vRef = c.useRef(false);
  c.useEffect(() => {
    if (!vRef.current) {
      setG(value == null ? `` : String(value));
    }
  }, [value]);
  let y = (() => {
    if (g.trim() === ``) {
      return !nullable;
    }
    let e = Number(g);
    return !!(
      !Number.isFinite(e) ||
      (integer && !Number.isInteger(e)) ||
      (min !== undefined && e < min) ||
      (max !== undefined && e > max)
    );
  })();
  return (
    <div className={r(`relative`, className)}>
      <input
        id={id}
        type={`text`}
        inputMode={`decimal`}
        value={g}
        placeholder={placeholder}
        disabled={disabled}
        onFocus={() => {
          vRef.current = true;
        }}
        onBlur={() => {
          vRef.current = false;
          setG(value == null ? `` : String(value));
        }}
        onKeyDown={(e) => {
          if (e.key !== `ArrowUp` && e.key !== `ArrowDown`) {
            return;
          }
          e.preventDefault();
          let r =
            (Number(g) || 0) +
            (e.key === `ArrowUp` ? step : -step) * (e.shiftKey ? 10 : 1);
          r = Math.round(r * 1000000) / 1000000;
          if (min !== undefined) {
            r = Math.max(min, r);
          }
          if (max !== undefined) {
            r = Math.min(max, r);
          }
          setG(String(r));
          onChange(r);
        }}
        onChange={(e) => {
          let value = e.target.value;
          setG(value);
          if (value.trim() === ``) {
            if (nullable) {
              onChange(null);
            }
            return;
          }
          let a = Number(value);
          Number.isFinite(a) &&
            (!integer || Number.isInteger(a)) &&
            ((min !== undefined && a < min) ||
              (max !== undefined && a > max) ||
              onChange(a));
        }}
        className={r(
          d,
          `font-mono text-[13px] tabular-nums`,
          suffix ? `pr-9` : ``,
          y && `border-accent/70 focus:border-accent`,
        )}
      />
      {suffix && (
        <span
          className={`pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-faint`}
        >
          {suffix}
        </span>
      )}
    </div>
  );
}
function GComponent({
  value,
  onChange,
  rows = 3,
  maxRows = 14,
  mono,
  className,
  ...rest
}) {
  let uRef = c.useRef(null);
  c.useEffect(() => {
    let uRef_current = uRef.current;
    if (!uRef_current) {
      return;
    }
    uRef_current.style.height = `auto`;
    let t = parseFloat(getComputedStyle(uRef_current).lineHeight) || 20;
    uRef_current.style.height = `${Math.min(uRef_current.scrollHeight + 2, t * maxRows + 18)}px`;
  }, [value, maxRows]);
  return (
    <textarea
      ref={uRef}
      rows={rows}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={r(
        `w-full resize-y rounded-lg border border-line-strong bg-base/80 px-3 py-2 text-sm leading-relaxed text-ink outline-none transition-colors placeholder:text-faint hover:border-muted/50 focus:border-gold/70`,
        mono && `font-mono text-[13px]`,
        className,
      )}
      {...rest}
    />
  );
}
function Component({ value, onChange, options, className, disabled, id }) {
  return (
    <select
      id={id}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className={r(
        u,
        f(className),
        `appearance-none bg-[length:12px] bg-[right_10px_center] bg-no-repeat pr-8`,
        className,
      )}
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' stroke='%238C97B2' stroke-width='1.6' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
      }}
    >
      {options.map((e) => (
        <option key={e.value} value={e.value} disabled={e.disabled}>
          {typeof e.label == `string` ? e.label : e.value}
        </option>
      ))}
    </select>
  );
}
const v = {
  gold: `border-gold/35 bg-gold/10 text-gold`,
  info: `border-info/35 bg-info/10 text-info`,
  neutral: `border-line-strong bg-raised text-ink`,
};
function YComponent({
  value,
  onChange,
  placeholder = `type and press Enter`,
  className,
  tone = `gold`,
}) {
  let [s, setS] = c.useState(``);
  let d = c.useId();
  let f = (n) => {
    let r = n
      .split(`,`)
      .map((e) => e.trim())
      .filter(Boolean)
      .filter((t) => !value.includes(t));
    if (r.length) {
      onChange([...value, ...r]);
    }
    setS(``);
  };
  return (
    <label
      htmlFor={d}
      className={r(
        `flex min-h-9 w-full cursor-text flex-wrap items-center gap-1.5 rounded-lg border border-line-strong bg-base/80 px-2 py-1.5 transition-colors focus-within:border-gold/70 hover:border-muted/50`,
        className,
      )}
    >
      {value.map((n) => (
        <span
          key={n}
          className={r(
            `inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 font-mono text-[12px] leading-tight`,
            v[tone],
          )}
        >
          {n}
          <button
            type={`button`}
            onClick={() => onChange(value.filter((e) => e !== n))}
            className={`opacity-60 hover:opacity-100`}
            aria-label={`Remove ${n}`}
          >
            <O1 className={`size-3`} />
          </button>
        </span>
      ))}
      <input
        id={d}
        value={s}
        onChange={(e) => setS(e.target.value)}
        onKeyDown={(n) => {
          if (n.key === `Enter` || n.key === `,`) {
            n.preventDefault();
            f(s);
          } else if (n.key === `Backspace` && !s && value.length) {
            onChange(value.slice(0, -1));
          }
        }}
        onBlur={() => s.trim() && f(s)}
        placeholder={value.length ? `` : placeholder}
        className={`min-w-[8ch] flex-1 bg-transparent px-1 text-sm text-ink outline-none placeholder:text-faint`}
      />
    </label>
  );
}
function BComponent({ value, onChange, className }) {
  let i = /^#[0-9a-fA-F]{6}$/.test(value);
  return (
    <div className={r(`flex items-center gap-2`, className)}>
      <input
        type={`color`}
        value={i ? value : `#5c6b73`}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        className={`h-9 w-11 shrink-0 cursor-pointer rounded-lg border border-line-strong bg-base p-1`}
        aria-label={`Pick a colour`}
      />
      <M1Component
        value={value}
        onChange={onChange}
        mono
        placeholder={`#E07A5F`}
        invalid={!!value && !i}
      />
    </div>
  );
}
function XComponent({ checked, onChange, label, disabled }) {
  return (
    <button
      type={`button`}
      role={`switch`}
      aria-checked={checked}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={r(
        `relative inline-flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors disabled:opacity-40`,
        checked ? `bg-good` : `bg-line-strong`,
      )}
    >
      <span
        className={r(
          `size-4 rounded-full bg-ink shadow transition-transform`,
          checked ? `translate-x-4` : `translate-x-0`,
        )}
      />
    </button>
  );
}
function SComponent({ children, hint, actions }) {
  return (
    <div className={`mb-3 flex flex-wrap items-end justify-between gap-2`}>
      <div>
        <h3 className={`text-xl text-ink`}>{children}</h3>
        {hint && (
          <p className={`mt-0.5 max-w-2xl text-xs text-muted`}>{hint}</p>
        )}
      </div>
      {actions && <div className={`flex items-center gap-2`}>{actions}</div>}
    </div>
  );
}
function C(e, t) {
  return t.some((t) => {
    if (t.endsWith(`.`)) {
      return e.startsWith(t);
    }
    return e === t;
  });
}
function useW(e, t, { throttleMs = 1200, filter, enabled = true } = {}) {
  let sRef = c.useRef(0);
  let lRef = c.useRef(null);
  let uRef = c.useRef(t);
  uRef.current = t;
  let dRef = c.useRef(filter);
  dRef.current = filter;
  c.useEffect(
    () => () => {
      if (lRef.current) {
        clearTimeout(lRef.current);
      }
    },
    [],
  );
  let f = e.join(`|`);
  let p = c.useCallback(
    (e) => {
      if (!C(e.type, f.split(`|`)) || (dRef.current && !dRef.current(e))) {
        return;
      }
      let t = Date.now();
      let n = sRef.current + throttleMs - t;
      if (n <= 0) {
        sRef.current = t;
        uRef.current();
      } else {
        lRef.current ||= setTimeout(() => {
          lRef.current = null;
          sRef.current = Date.now();
          uRef.current();
        }, n);
      }
    },
    [f, throttleMs],
  );
  n_2(p, {
    scope: `admin`,
    enabled,
  });
}
const T = new Set();
let E = {
  rows: [],
  ready: false,
  error: null,
};
let D = null;
let O = null;
function refresh() {
  return (
    O ||
    ((O = s
      .teams()
      .then((e) => {
        E = {
          rows: e.teams,
          ready: true,
          error: null,
        };
      })
      .catch((error) => {
        E = {
          ...E,
          error,
        };
      })
      .finally(() => {
        O = null;
        for (let e of [...T]) {
          e();
        }
      })),
    O)
  );
}
function A(e) {
  T.add(e);
  D ||= (refresh(), setInterval(() => void refresh(), 10000));
  return () => {
    T.delete(e);
    if (!T.size && D) {
      clearInterval(D);
      D = null;
    }
  };
}
function useJ() {
  return {
    ...c.useSyncExternalStore(
      A,
      () => E,
      () => E,
    ),
    refresh,
  };
}
function useM() {
  let { rows } = useJ();
  let t = t_2();
  return c.useMemo(() => {
    let n = new Map(rows.map((e) => [e.id, e.name]));
    return {
      ...t,
      name: (e) => {
        if (e) {
          return n.get(e) ?? t.name(e);
        }
        return `—`;
      },
      isTeam: (e) => !!e && n.has(e),
    };
  }, [rows, t]);
}
export {
  BComponent as a,
  XComponent as c,
  Component as d,
  GComponent as f,
  useW as i,
  HComponent as l,
  useM as n,
  M1Component as p,
  useJ as r,
  YComponent as s,
  C as t,
  SComponent as u,
};
