import { i as i_1, n as n_1, t as t_1 } from "./jsx-runtime-CU3EbJiN.js";
const r = i_1(n_1(), 1);
const i = (e) => e?.replace(/([a-z0-9])([A-Z])/g, `$1-$2`).toLowerCase();
function a(e, node, aliases = []) {
  if (node == null) {
    throw Error(`[lucide]: iconNode is required when icon name is used`);
  }
  return {
    name: i(e),
    size: 24,
    node,
    ...(aliases.length > 0
      ? {
          aliases,
        }
      : {}),
  };
}
const o = (e) => {
  let t = ``;
  let n = false;
  for (let r of e) {
    if (r === `-` || r === `_` || r <= ` `) {
      n = t.length > 0;
      continue;
    }
    if (t.length === 0) {
      t += r.toLowerCase();
    } else {
      t += n ? r.toUpperCase() : r;
    }
    n = false;
  }
  return t;
};
const s = (name) => {
  let t = o(name);
  return t.charAt(0).toUpperCase() + t.slice(1);
};
const c = (...e) =>
  e
    .filter((e, t, n) => !!e && e.trim() !== `` && n.indexOf(e) === t)
    .join(` `)
    .trim();
const l = {
  xmlns: `http://www.w3.org/2000/svg`,
  width: 24,
  height: 24,
  viewBox: `0 0 24 24`,
  fill: `none`,
  stroke: `currentColor`,
  "stroke-width": 2,
  "stroke-linecap": `round`,
  "stroke-linejoin": `round`,
};
function u(e) {
  return e != null;
}
function d(e, t = {}) {
  let n = t.attributeNames ?? {};
  let r = (e) => n[e] ?? e;
  let i = e.size ?? e.width ?? l.width;
  let a = e.size ?? e.height ?? l.height;
  let o =
    e.aliases
      ?.filter((e) => typeof e == `string` && e.trim() !== ``)
      .map((e) => `lucide-${e}`) ?? [];
  let s = [...(e.name ? [`lucide-${e.name}`] : []), ...o];
  let d = t.className?.split(` `).filter(Boolean) ?? [];
  let f = t.includeDefaultClasses === false ? c(...d) : c(`lucide`, ...s, ...d);
  let p = t.absoluteStrokeWidth
    ? (Number(t.strokeWidth ?? l[`stroke-width`]) *
        Number(e.size ?? e.width ?? l.width)) /
      Number(t.size ?? t.width ?? l.width)
    : (t.strokeWidth ?? l[`stroke-width`]);
  return [
    `svg`,
    {
      ...Object.entries(l).reduce((acc, [t, n]) => {
        acc[r(t)] = n;
        return acc;
      }, {}),
      ...(`color` in t &&
        t.color && {
          [r(`stroke`)]: t.color,
        }),
      ...(`size` in t &&
        u(t.size) && {
          [r(`width`)]: t.size,
          [r(`height`)]: t.size,
        }),
      ...(`width` in t &&
        u(t.width) && {
          [r(`width`)]: t.width,
        }),
      ...(`height` in t &&
        u(t.height) && {
          [r(`height`)]: t.height,
        }),
      [r(`stroke-width`)]: p,
      ...(f && {
        [r(`class`)]: f,
      }),
      [r(`viewBox`)]: `0 0 ${i} ${a}`,
      ...(t.hasA11yProp === false
        ? {
            [r(`aria-hidden`)]: `true`,
          }
        : {}),
      ...(`attributes` in t && t.attributes),
    },
    e.node.map(([n, i, a]) => {
      let o = t.nonScalingStroke
        ? {
            [r(`vector-effect`)]: `non-scaling-stroke`,
            ...i,
          }
        : i;
      if (a) {
        return [n, o, a];
      }
      return [n, o];
    }),
  ];
}
function f(icon, t = {}) {
  return d(icon, {
    ...t,
    attributeNames: {
      ...t.attributeNames,
      class: `className`,
      "stroke-width": `strokeWidth`,
      "stroke-linecap": `strokeLinecap`,
      "stroke-linejoin": `strokeLinejoin`,
      "vector-effect": `vectorEffect`,
    },
  });
}
const p = (rest) => {
  for (let t in rest) {
    if (t.startsWith(`aria-`) || t === `role` || t === `title`) {
      return true;
    }
  }
  return false;
};
const MContext = r.createContext({});
const useH = () => r.useContext(MContext);
const G = r.forwardRef(
  (
    {
      color,
      size,
      width,
      height,
      strokeWidth,
      absoluteStrokeWidth,
      nonScalingStroke,
      className = ``,
      children,
      iconNode = [],
      icon = {
        node: iconNode,
        aliases: [],
        size: 24,
      },
      ...rest
    },
    _,
  ) => {
    let {
      size: size_1 = 24,
      strokeWidth: strokeWidth_1 = 2,
      absoluteStrokeWidth: absoluteStrokeWidth_1 = false,
      nonScalingStroke: nonScalingStroke_1 = false,
      color: color_1 = `currentColor`,
      className: className_1 = ``,
    } = useH() ?? {};
    let hasA11yProp = !!children || p(rest);
    let [T, E, D = []] = f(icon, {
      color: color ?? color_1,
      width: width ?? size ?? size_1,
      height: height ?? size ?? size_1,
      strokeWidth: strokeWidth ?? strokeWidth_1,
      absoluteStrokeWidth: absoluteStrokeWidth ?? absoluteStrokeWidth_1,
      nonScalingStroke: nonScalingStroke ?? nonScalingStroke_1,
      className: c(className_1, className),
      hasA11yProp,
      attributes: rest,
    });
    return (
      <T ref={_} {...E}>
        {[
          ...D.map(([E1, t]) => <E1 {...t} />),
          ...(Array.isArray(children) ? children : [children]),
        ]}
      </T>
    );
  },
);
function _(e, t = [], n = []) {
  let icon = typeof e == `string` ? a(e, t, n) : e;
  let o = r.forwardRef(({ className, ...rest }, n) => (
    <G ref={n} icon={icon} className={className} {...rest} />
  ));
  if (icon.name) {
    o.displayName = s(icon.name);
  }
  return o;
}
const v = {
  name: `loader-circle`,
  size: 24,
  node: [
    [
      `path`,
      {
        d: `M21 12a9 9 0 1 1-6.219-8.56`,
        key: `13zald`,
      },
    ],
  ],
  aliases: [`loader-2`],
};
v.node;
const Y = _(v);
function b(...e) {
  return e.filter(Boolean).join(` `);
}
const x = t_1();
const S = {
  primary: `bg-gold text-night font-bold shadow-[0_8px_24px_-12px_rgb(255_196_77/0.7)] hover:bg-[#ffd073] active:bg-[#f0b43c] disabled:bg-gold/40`,
  secondary: `bg-raised text-ink border border-line-strong hover:border-muted/60 hover:bg-[#1d2946] active:bg-[#16203a]`,
  ghost: `bg-transparent text-muted hover:text-ink hover:bg-raised/70`,
  danger: `bg-accent/15 text-accent border border-accent/40 hover:bg-accent/25 hover:border-accent/70`,
  subtle: `bg-ink/5 text-ink hover:bg-ink/10`,
};
const C = {
  sm: `h-8 px-3 text-xs gap-1.5 rounded-lg`,
  md: `h-10 px-4 text-sm gap-2 rounded-xl`,
  lg: `h-12 px-6 text-base gap-2.5 rounded-xl`,
};
export function n(e = `secondary`, t = `md`, n) {
  return b(
    `inline-flex select-none items-center justify-center whitespace-nowrap font-semibold transition-colors duration-150`,
    `disabled:cursor-not-allowed disabled:opacity-60`,
    S[e],
    C[t],
    n,
  );
}
export const t = r.forwardRef(
  (
    {
      variant = `secondary`,
      size = `md`,
      icon,
      iconRight,
      loading,
      disabled,
      className,
      children,
      type = `button`,
      ...rest
    },
    u,
  ) => (
    <button
      ref={u}
      type={type}
      disabled={disabled || loading}
      className={n(variant, size, className)}
      {...rest}
    >
      {loading ? <Y className={`size-4 animate-spin`} aria-hidden /> : icon}
      {children}
      {iconRight}
    </button>
  ),
);
export { _ as i, b as r };
