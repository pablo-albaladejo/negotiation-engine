import { i, n, t } from "./jsx-runtime-CU3EbJiN.js";
import { r } from "./Button-DIaWEsZ9.js";
import {
  D as D_1,
  O as O_1,
  S,
  k as k_1,
  v as v_1,
  w,
  y,
} from "./useEvents-BpJ5PfZT.js";
import {
  $ as $_1,
  Q as Q_1,
  S as S_2,
  Y,
  Z as Z_1,
  at,
  ct as ct_1,
  dt as dt_1,
  et,
  ft as ft_1,
  it,
  lt as lt_1,
  nt,
  ot,
  pt as pt_1,
  rt,
  st as st_1,
  tt,
  ut as ut_1,
  v as v_2,
} from "./index-B_RfsMCE.js";
function E(...e) {
  let t = !Array.isArray(e[0]);
  let n = t ? 0 : -1;
  let r = e[0 + n];
  let i = e[1 + n];
  let a = e[2 + n];
  let o = e[3 + n];
  let s = ct_1(i, a, o);
  if (t) {
    return s(r);
  }
  return s;
}
const D = new Set();
const O = ({ timestamp }) => {
  D.forEach((t) => t.tick(timestamp));
};
class k extends it {
  constructor(e) {
    super();
    this.state = `idle`;
    this.startTime = 0;
    this.currentTime = 0;
    this.started = false;
    this.hasNextTarget = false;
    this.nextTarget = 0;
    this.stop = () => {
      if (this.state !== `idle`) {
        this.teardown();
        this.options.onStop?.();
      }
    };
    this.options = e;
    at(e);
    this.factory = e.type || st_1;
    this.generator = this.factory(e);
    let { driver } = e;
    if (driver) {
      this.driver = driver((e) => this.tick(e));
    }
    this.startTime = this.now();
    this.state = `running`;
    if (this.driver) {
      this.driver.start();
    } else {
      if (!D.size) {
        dt_1.update(O, true);
      }
      D.add(this);
    }
  }
  setTarget(e, t) {
    this.nextTarget = e;
    this.nextVelocity = t;
    this.hasNextTarget = true;
  }
  retarget(e, t) {
    let { options, generator } = this;
    options.keyframes = e;
    options.velocity = t;
    this.startTime = this.now();
    this.currentTime = 0;
    if (generator.retarget) {
      generator.retarget(e, t);
    } else {
      this.generator = this.factory(options);
    }
  }
  tick(e) {
    let { options, hasNextTarget } = this;
    let { delay = 0, onUpdate, onPlay } = options;
    let o = Math.round(e - this.startTime) - delay;
    let s = (this.currentTime = Math.max(0, o));
    let c = this.generator.next(s);
    let l = o < 0 ? options.keyframes[0] : c.value;
    if (hasNextTarget) {
      this.hasNextTarget = false;
      let { keyframes } = options;
      keyframes[0] = l;
      keyframes[1] = this.nextTarget;
      this.retarget(
        keyframes,
        this.nextVelocity ?? this.getGeneratorVelocity(),
      );
    }
    if (hasNextTarget || !this.started) {
      this.started = true;
      onPlay?.();
    }
    this.state === `running` &&
      (onUpdate?.(l),
      c.done &&
        o >= 0 &&
        !hasNextTarget &&
        !this.hasNextTarget &&
        this.state === `running` &&
        (this.notifyFinished(),
        this.teardown(),
        (this.state = `finished`),
        options.onComplete?.()));
  }
  getGeneratorVelocity() {
    return ot(this.generator, this.currentTime, this.options.velocity);
  }
  now() {
    if (this.driver) {
      return this.driver.now();
    }
    return lt_1.now();
  }
  teardown() {
    this.state = `idle`;
    if (this.driver) {
      this.driver.stop();
    } else {
      D.delete(this);
      if (!D.size) {
        ut_1(O);
      }
    }
  }
}
function A(e, t, n = {}) {
  let r = e.get();
  let i = null;
  let a;
  let o = typeof r == `string` ? r.replace(/[\d.-]/g, ``) : undefined;
  let onUpdate = (e) => a(o ? e + o : e);
  let onPlay = () => e.events.animationStart?.notify();
  let l = () => {
    i &&= (i.stop(), null);
    e.animation = undefined;
  };
  e.attach((t, r) => {
    a = r;
    let o = M(t);
    if (i?.state === `running`) {
      i.setTarget(o, n.velocity);
      return;
    }
    let u = M(e.get());
    let velocity = i ? i.getGeneratorVelocity() : e.getVelocity();
    l();
    if (u === o) {
      return;
    }
    let f = (i = new k({
      keyframes: [u, o],
      velocity,
      type: `spring`,
      restDelta: 0.001,
      restSpeed: 0.01,
      ...n,
      onUpdate,
      onPlay,
    }));
    e.animation = f;
    f.then(() => {
      if (i === f) {
        i = null;
        e.animation = undefined;
        e.events.animationComplete?.notify();
      }
    });
  }, l);
  if (tt(t)) {
    let r = n.skipInitialAnimation === true;
    let i = t.on(`change`, (t) => {
      if (r) {
        r = false;
        e.jump(j(t, o), false);
      } else {
        e.set(j(t, o));
      }
    });
    let a = e.on(`destroy`, i);
    return () => {
      i();
      a();
    };
  }
  return l;
}
function j(e, t) {
  if (t) {
    return e + t;
  }
  return e;
}
function M(e) {
  if (typeof e == `number`) {
    return e;
  }
  return parseFloat(e);
}
const N = i(n(), 1);
function useP(e) {
  let t = pt_1(() => rt(e));
  let { isStatic } = N.useContext(Z_1);
  if (isStatic) {
    let [, n] = N.useState(e);
    N.useEffect(() => t.on(`change`, n), []);
  }
  return t;
}
function F(e, t) {
  let n = useP(t());
  let r = () => n.set(t());
  r();
  ft_1(() => {
    let t = () => dt_1.preRender(r, false, true);
    let n = e.map((e) => e.on(`change`, t));
    return () => {
      n.forEach((e) => e());
      ut_1(r);
    };
  });
  return n;
}
function I(e) {
  nt.current = [];
  e();
  let t = F(nt.current, e);
  nt.current = undefined;
  return t;
}
function L(e, times, keyframes, r) {
  if (typeof e == `function`) {
    return I(e);
  }
  if (
    keyframes !== undefined &&
    !Array.isArray(keyframes) &&
    typeof times != `function`
  ) {
    return oe(e, times, keyframes, r);
  }
  let i = typeof times == `function` ? times : E(times, keyframes, r);
  let a = Array.isArray(e) ? ae(e, i) : ae([e], ([e]) => i(e));
  let o = Array.isArray(e) ? undefined : e.accelerate;
  if (
    o &&
    !o.isTransformed &&
    typeof times != `function` &&
    Array.isArray(keyframes) &&
    r?.clamp !== false
  ) {
    a.accelerate = {
      ...o,
      times,
      keyframes,
      isTransformed: true,
      ...(r?.ease
        ? {
            ease: r.ease,
          }
        : {}),
    };
  }
  return a;
}
function ae(e, t) {
  let n = pt_1(() => []);
  return F(e, () => {
    n.length = 0;
    let e_length = e.length;
    for (let t = 0; t < e_length; t++) {
      n[t] = e[t].get();
    }
    return t(n);
  });
}
function oe(e, times, keyframes, r) {
  let i = pt_1(() => Object.keys(keyframes));
  let a = pt_1(() => ({}));
  for (let o of i) {
    a[o] = L(e, times, keyframes[o], r);
  }
  return a;
}
function useSe(e, t = {}) {
  let { isStatic } = N.useContext(Z_1);
  let r = () => {
    if (tt(e)) {
      return e.get();
    }
    return e;
  };
  if (isStatic) {
    return L(r);
  }
  let i = useP(r());
  N.useInsertionEffect(() => A(i, e, t), [i, JSON.stringify(t)]);
  return i;
}
function ce(e, t = {}) {
  return useSe(e, {
    type: `spring`,
    ...t,
  });
}
function useLe() {
  if (!$_1.current) {
    Q_1();
  }
  let [e] = N.useState(et.current);
  return e;
}
const ue = `ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789`;
const R = [
  478, 473, 490, 495, 408, 406, 493, 485, 230, 453, 497, 402, 745, 543, 497,
  471, 497, 477, 474, 419, 487, 494, 800, 471, 465, 418, 507, 274, 490, 504,
  511, 515, 499, 485, 501, 499,
];
const de = {
  " ": 220,
  ".": 250,
  ",": 251,
  ":": 250,
  ";": 251,
  "'": 203,
  "’": 251,
  '"': 403,
  "-": 446,
  "–": 546,
  "—": 902,
  "·": 189,
  "/": 410,
  "&": 619,
  "!": 250,
  "¡": 250,
  "?": 480,
  "¿": 480,
  "(": 292,
  ")": 292,
  "#": 736,
  "×": 482,
  "+": 536,
  º: 406,
  ª: 403,
  ...Object.fromEntries([...ue].map((e, t) => [e, R[t]])),
};
const fe = (e) => e.toLocaleUpperCase(`es`);
function pe(e, t = 900) {
  let n = 0;
  for (let t of e.normalize(`NFD`).replace(/\p{M}/gu, ``)) {
    n += de[t] ?? 500;
  }
  return (n / 1000) * (t === 800 ? 0.93 : 1);
}
const me = (e) => [...e].length * 0.6;
function he(e, t) {
  if (t === 1) {
    return [[e.join(` `)]];
  }
  let n = [];
  for (let r = 1; r <= e.length - t + 1; r++) {
    for (let i of he(e.slice(r), t - 1)) {
      n.push([e.slice(0, r).join(` `), ...i]);
    }
  }
  return n;
}
function ge(name, t, size, maxLines, i) {
  let a = fe(name).split(/\s+/).filter(Boolean);
  if (!a.length) {
    return {
      lines: [],
      size,
    };
  }
  let o = (e, size) => pe(e) * size + i * Math.max(0, [...e].length - 1);
  let s = Math.min(maxLines, a.length);
  let c = {
    lines: [a.join(` `)],
    size,
  };
  for (let e = 1; e <= s; e++) {
    let lines = [];
    let i = Infinity;
    for (let t of he(a, e)) {
      let e = Math.max(...t.map((e) => o(e, size)));
      if (e < i) {
        lines = t;
        i = e;
      }
    }
    c = {
      lines,
      size: Math.min(size, (size * t) / i),
    };
    let s = e === 1 ? 0.92 : 0.8;
    if (c.size >= size * s) {
      return c;
    }
  }
  return c;
}
const z = t();
const B = `#1B0C22`;
const _e = `#FFF1DA`;
const V = `#FFD66B`;
const ve = [
  `skyTop`,
  `skyBottom`,
  `far`,
  `farL`,
  `main`,
  `mainL`,
  `shade`,
  `ground`,
  `glassBg`,
  `groove`,
  `neon`,
  `accent`,
  `accentD`,
  `dark`,
  `light`,
  `bulb`,
  `green`,
  `greenL`,
];
function ye(setColor) {
  return {
    skyTop: D_1(setColor, `#FFFFFF`, 0.55),
    skyBottom: D_1(setColor, `#5B1F4F`, 0.55),
    far: D_1(setColor, `#2B1433`, 0.55),
    farL: D_1(setColor, `#2B1433`, 0.42),
    main: D_1(setColor, `#1F0E26`, 0.78),
    mainL: D_1(setColor, `#1F0E26`, 0.6),
    shade: D_1(setColor, B, 0.7),
    ground: D_1(setColor, B, 0.65),
    glassBg: D_1(setColor, B, 0.5),
    groove: D_1(setColor, B, 0.45),
    neon: D_1(setColor, `#FFFFFF`, 0.4),
    accent: V,
    accentD: `#F29A3D`,
    dark: B,
    light: _e,
    bulb: `#FFE9A8`,
    green: D_1(`#2E7D57`, B, 0.35),
    greenL: D_1(`#58B07F`, B, 0.25),
  };
}
const be = (setColor) => Object.fromEntries(ve.map((t) => [t, setColor]));
const H = `var(--font-display)`;
const U = (e, t) => t[Math.floor(e.rand() * t.length)];
function WComponent(e, t, n) {
  return (
    <g>
      <circle cx={t} cy={n - 98} r={16} fill={e.bulb} opacity={0.22} />
      <path
        d={`M${t - 8} ${n} H${t + 8} L${t + 4} ${n - 18} H${t - 4} Z`}
        fill={e.dark}
      />
      <rect x={t - 2} y={n - 92} width={4} height={76} fill={e.dark} />
      <path
        d={`M${t - 10} ${n - 108} H${t + 10} L${t + 6} ${n - 88} H${t - 6} Z`}
        fill={e.dark}
      />
      <path
        d={`M${t - 7} ${n - 105} H${t + 7} L${t + 4.2} ${n - 91} H${t - 4.2} Z`}
        fill={e.bulb}
      />
      <path
        d={`M${t - 12} ${n - 108} L${t} ${n - 118} L${t + 12} ${n - 108} Z`}
        fill={e.dark}
      />
      <circle cx={t} cy={n - 120} r={2.2} fill={e.dark} />
    </g>
  );
}
function XeComponent(e, t, n, r, i, length, o) {
  let s = (n - t) / length;
  let c = (n - t + 12) / length;
  return (
    <g>
      {Array.from(
        {
          length,
        },
        (n, a) => {
          let l = a % 2 ? e.light : o;
          let u = t + a * s;
          let d = t - 6 + a * c;
          return (
            <g key={a}>
              <path
                d={`M${u} ${r} H${u + s} L${d + c} ${r + i} H${d} Z`}
                fill={l}
              />
              <circle cx={d + c / 2} cy={r + i} r={c / 2} fill={l} />
            </g>
          );
        },
      )}
      <rect x={t - 2} y={r - 3} width={n - t + 4} height={4} fill={e.dark} />
    </g>
  );
}
function GComponent(e, t, n, r, i) {
  return (
    <g key={i}>
      <rect
        x={t - 2.2 * r}
        y={n - 26 * r}
        width={4.4 * r}
        height={26 * r}
        fill={e.dark}
      />
      <circle cx={t - 9 * r} cy={n - 34 * r} r={13 * r} fill={e.green} />
      <circle cx={t + 9 * r} cy={n - 36 * r} r={14 * r} fill={e.green} />
      <circle cx={t} cy={n - 48 * r} r={15 * r} fill={e.green} />
      <circle cx={t - 3 * r} cy={n - 54 * r} r={6 * r} fill={e.greenL} />
      <circle cx={t + 8 * r} cy={n - 40 * r} r={5 * r} fill={e.greenL} />
    </g>
  );
}
const KComponent = (x, y, n, r, i, a) => (
  <rect key={a} x={x} y={y} width={n} height={r} fill={i} />
);
function SeComponent(e, t, n, r = 64) {
  return (
    <g>
      <rect x={t - 1.5} y={n + 38} width={3} height={r} fill={e.dark} />
      <path
        d={`M${t} ${n} L${t + 22} ${n + 22} L${t} ${n + 44} L${t - 22} ${n + 22} Z`}
        fill={e.light}
        stroke={e.accentD}
        strokeWidth={3.4}
        strokeLinejoin={`round`}
      />
      <rect x={t - 24} y={n + 16} width={48} height={12} fill={e.dark} />
      <text
        x={t}
        y={n + 25.6}
        textAnchor={`middle`}
        fontSize={9.5}
        fontWeight={900}
        letterSpacing={0.8}
        fill={e.light}
        fontFamily={H}
      >{`METRO`}</text>
    </g>
  );
}
const Ce = (e, t, n, r, i, a, o) => [
  (1 - o) ** 2 * e + 2 * (1 - o) * o * n + o * o * i,
  (1 - o) ** 2 * t + 2 * (1 - o) * o * r + o * o * a,
];
function WeComponent(e, id, n) {
  return (
    <g>
      <defs>
        <pattern id={id} width={16} height={20} patternUnits={`userSpaceOnUse`}>
          <rect x={4} y={4} width={8} height={11} fill={e.farL} />
        </pattern>
      </defs>
      <path
        d={`M0 160 V${n + 18} H44 V${n + 6} H96 V${n + 22} H138 V${n} H200 V160 Z`}
        fill={e.far}
      />
      <rect
        x={0}
        y={n + 24}
        width={200}
        height={136 - n}
        fill={`url(#${id})`}
      />
    </g>
  );
}
const QComponent = (e, t = 156) => (
  <rect x={0} y={t} width={200} height={180 - t} fill={e.ground} />
);
const TeComponent = (e, t) => (
  <>
    {WeComponent(e, t.id(`win`), 40)}
    <rect x={0} y={118} width={200} height={62} fill={e.ground} />
    <rect x={0} y={116} width={200} height={4} fill={e.light} opacity={0.5} />
    <path d={`M40 128 H128 L146 162 H22 Z`} fill={e.dark} />
    {[0, 1, 2, 3, 4].map((t) => {
      let n = 132 + t * 6;
      let r = (162 - n) * 0.53;
      return (
        <rect
          key={t}
          x={22 + r}
          y={n}
          width={124 - 2 * r}
          height={1.8}
          fill={e.light}
          opacity={0.3 + t * 0.1}
        />
      );
    })}
    <g fill={e.dark}>
      <rect x={36} y={104} width={96} height={2.6} />
      {Array.from(
        {
          length: 13,
        },
        (e, t) => (
          <rect key={t} x={38 + t * 7.4} y={106} width={1.6} height={22} />
        ),
      )}
      <path
        d={`M36 104 L18 140 H21 L39 106 Z M132 104 L150 140 H147 L129 106 Z`}
      />
      <rect x={34} y={96} width={4} height={34} />
      <rect x={130} y={96} width={4} height={34} />
    </g>
    <circle cx={36} cy={93} r={5} fill={e.bulb} />
    <circle cx={132} cy={93} r={5} fill={e.bulb} />
    {SeComponent(e, 170, 44, 86)}
  </>
);
const EeComponent = (e, t) => {
  let n = t.has(`fantasma`);
  return (
    <>
      <rect x={0} y={40} width={200} height={120} fill={e.far} />
      <path d={`M112 160 V84 A44 44 0 0 1 200 84 V160 Z`} fill={e.dark} />
      <path
        d={`M104 160 V84 A52 52 0 0 1 208 84`}
        fill={`none`}
        stroke={e.farL}
        strokeWidth={10}
        strokeDasharray={`7 3`}
      />
      <rect x={0} y={60} width={200} height={1.4} fill={e.dark} />
      <path
        d={`M60 86 L70 62 L80 86`}
        fill={`none`}
        stroke={e.dark}
        strokeWidth={1.8}
      />
      <rect x={-8} y={86} width={172} height={56} rx={12} fill={e.main} />
      <rect x={-8} y={86} width={172} height={10} rx={5} fill={e.mainL} />
      <rect x={-8} y={124} width={172} height={4} fill={e.accent} />
      {[6, 36, 66, 96, 126].map((t, r) => (
        <g key={t}>
          <rect
            x={t}
            y={100}
            width={22}
            height={20}
            rx={3}
            fill={n ? e.light : e.bulb}
            opacity={n ? 0.35 : 1}
          />
          {!n && r % 2 == 0 && (
            <circle cx={t + 11} cy={112} r={4.5} fill={e.dark} />
          )}
          {!n && r % 2 == 0 && (
            <rect
              x={t + 5}
              y={115}
              width={12}
              height={5}
              rx={2.5}
              fill={e.dark}
            />
          )}
        </g>
      ))}
      {n && (
        <g>
          <circle cx={100} cy={110} r={18} fill={e.light} opacity={0.18} />
          <path
            d={`M100 102 C94 102 92 107 92 112 V120 L95 118 L98 120 L101 118 L104 120 L107 118 L108 120 V112 C108 107 106 102 100 102 Z`}
            fill={e.light}
          />
          <circle cx={97} cy={109} r={1.3} fill={e.dark} />
          <circle cx={103} cy={109} r={1.3} fill={e.dark} />
        </g>
      )}
      <circle cx={158} cy={132} r={4} fill={e.bulb} />
      <circle cx={158} cy={132} r={10} fill={e.bulb} opacity={0.25} />
      {[20, 44, 116, 140].map((t) => (
        <circle key={t} cx={t} cy={144} r={6} fill={e.dark} />
      ))}
      {QComponent(e, 150)}
      <rect
        x={0}
        y={150}
        width={200}
        height={2.4}
        fill={e.light}
        opacity={0.5}
      />
    </>
  );
};
const DeComponent = (e, t) => (
  <>
    <defs>
      <pattern
        id={t.id(`tiles`)}
        width={12}
        height={8}
        patternUnits={`userSpaceOnUse`}
      >
        <rect
          x={0.6}
          y={0.6}
          width={10.8}
          height={6.8}
          rx={1}
          fill={e.light}
          opacity={0.16}
        />
      </pattern>
    </defs>
    <rect x={0} y={16} width={200} height={144} fill={e.mainL} />
    <rect
      x={0}
      y={16}
      width={200}
      height={144}
      fill={`url(#${t.id(`tiles`)})`}
    />
    <rect x={0} y={60} width={200} height={3} fill={e.accentD} />
    <rect
      x={12}
      y={74}
      width={38}
      height={50}
      fill={e.accent}
      stroke={e.light}
      strokeWidth={2.4}
    />
    <rect x={18} y={80} width={26} height={8} fill={e.dark} />
    <circle cx={31} cy={106} r={9} fill={e.accentD} />
    <rect
      x={150}
      y={74}
      width={38}
      height={50}
      fill={e.neon}
      stroke={e.light}
      strokeWidth={2.4}
    />
    <rect x={156} y={80} width={26} height={8} fill={e.dark} />
    <path d={`M158 118 L169 94 L180 118 Z`} fill={e.dark} />
    <rect x={99} y={20} width={2} height={12} fill={e.dark} />
    <circle
      cx={100}
      cy={42}
      r={11}
      fill={e.light}
      stroke={e.dark}
      strokeWidth={2}
    />
    <path
      d={`M100 42 V35 M100 42 L105 45`}
      fill={`none`}
      stroke={e.dark}
      strokeWidth={1.4}
    />
    <rect x={58} y={66} width={84} height={94} fill={e.accentD} />
    <rect x={54} y={62} width={92} height={6} fill={e.dark} />
    <rect x={62} y={70} width={76} height={14} fill={e.dark} />
    <text
      x={100}
      y={80.4}
      textAnchor={`middle`}
      fontSize={9.5}
      fontWeight={900}
      letterSpacing={1.2}
      fill={e.light}
      fontFamily={H}
    >{`BILLETES`}</text>
    <path
      d={`M76 124 V100 A24 24 0 0 1 124 100 V124 Z`}
      fill={e.bulb}
      opacity={0.85}
    />
    <path
      d={`M76 100 A24 24 0 0 1 124 100 M84 124 V86 M92 124 V78 M100 124 V76 M108 124 V78 M116 124 V86`}
      fill={`none`}
      stroke={e.dark}
      strokeWidth={1.4}
    />
    <circle cx={100} cy={112} r={5} fill={e.dark} />
    <rect x={70} y={124} width={60} height={5} fill={e.light} />
    <path
      d={`M62 136 H138 M62 148 H138`}
      stroke={e.dark}
      strokeWidth={1.2}
      opacity={0.5}
    />
    {QComponent(e)}
    <g fill={e.dark}>
      <rect x={164} y={128} width={8} height={30} rx={2} />
      <rect x={148} y={134} width={18} height={2.6} />
      <rect x={170} y={140} width={18} height={2.6} />
    </g>
  </>
);
const OeComponent = (e, t) => {
  let n = t.has(`cebada`);
  return (
    <>
      {n ? (
        <g>
          <path
            d={`M6 92 Q29 58 52 92 Q75 58 98 92 Q121 58 144 92 Q167 58 190 92 Z`}
            fill={e.main}
          />
          <path
            d={`M18 84 Q29 70 40 84 M64 84 Q75 70 86 84 M110 84 Q121 70 132 84 M156 84 Q167 70 178 84`}
            fill={`none`}
            stroke={e.neon}
            strokeWidth={2}
          />
        </g>
      ) : (
        <g>
          <path d={`M2 92 L100 50 L198 92 Z`} fill={e.main} />
          <path d={`M40 92 L100 66 L160 92 Z`} fill={e.neon} opacity={0.7} />
          <circle cx={100} cy={78} r={6} fill={e.light} />
        </g>
      )}
      <rect x={8} y={90} width={184} height={70} fill={e.mainL} />
      <rect x={4} y={88} width={192} height={4} fill={e.light} />
      <path d={`M68 128 V106 A32 32 0 0 1 132 106 V128 Z`} fill={e.glassBg} />
      <path
        d={`M68 106 A32 32 0 0 1 132 106 M100 128 V74 M100 106 L78 84 M100 106 L122 84 M68 106 H132`}
        fill={`none`}
        stroke={e.dark}
        strokeWidth={1.4}
      />
      {[22, 44, 142, 164].map((t) => (
        <g key={t}>
          <path
            d={`M${t} 136 V110 A7 7 0 0 1 ${t + 14} 110 V136 Z`}
            fill={e.glassBg}
          />
          <path
            d={`M${t + 7} 136 V103 M${t} 120 H${t + 14}`}
            fill={`none`}
            stroke={e.dark}
            strokeWidth={1.1}
          />
        </g>
      ))}
      {[16, 62, 134, 180].map((t) => (
        <rect key={t} x={t} y={92} width={4} height={64} fill={e.dark} />
      ))}
      <rect x={8} y={136} width={184} height={4} fill={e.shade} />
      <rect x={84} y={132} width={32} height={26} fill={e.dark} />
      {QComponent(e)}
    </>
  );
};
const KeComponent = (e, t) => {
  let n = () => U(t, [e.neon, e.accent, e.green, e.accentD, e.light]);
  let r = t.has(`huevos`) ? `eggs` : t.has(`churreria`) ? `churros` : `tapas`;
  return (
    <>
      <rect width={200} height={180} fill={e.far} />
      <rect
        x={22}
        y={18}
        width={156}
        height={46}
        fill={e.glassBg}
        stroke={e.accent}
        strokeWidth={2.4}
      />
      <path
        d={`M40 18 L70 18 L46 64 L22 64 L22 46 Z`}
        fill={e.light}
        opacity={0.14}
      />
      {t.has(`lactea`) &&
        [
          [60, 34, 3],
          [96, 28, 4.5],
          [130, 44, 3],
          [156, 30, 2.5],
          [80, 50, 2],
        ].map(([t, n, r]) => (
          <path
            key={t}
            d={`M${t} ${n - r} L${t + r * 0.3} ${n - r * 0.3} L${t + r} ${n} L${t + r * 0.3} ${n + r * 0.3} L${t} ${n + r} L${t - r * 0.3} ${n + r * 0.3} L${t - r} ${n} L${t - r * 0.3} ${n - r * 0.3} Z`}
            fill={e.light}
          />
        ))}
      {[84, 108].map((t) => (
        <g key={t}>
          {Array.from(
            {
              length: 11,
            },
            (r, i) => {
              let a = 12 + ((i * 5) % 4) * 2;
              return (
                <g key={i}>
                  <rect
                    x={26 + i * 14}
                    y={t - a}
                    width={8}
                    height={a}
                    rx={2}
                    fill={n()}
                  />
                  <rect
                    x={28.5 + i * 14}
                    y={t - a - 5}
                    width={3}
                    height={6}
                    fill={e.dark}
                  />
                </g>
              );
            },
          )}
          <rect x={18} y={t} width={164} height={3} fill={e.light} />
        </g>
      ))}
      <rect x={0} y={122} width={200} height={40} fill={e.main} />
      <rect x={0} y={118} width={200} height={6} fill={e.light} />
      <g>
        <rect x={150} y={96} width={6} height={22} fill={e.dark} />
        <rect x={146} y={90} width={14} height={8} rx={2} fill={e.accent} />
        <rect x={156} y={104} width={8} height={3} fill={e.dark} />
      </g>
      {r === `eggs` && (
        <g>
          <ellipse
            cx={80}
            cy={117}
            rx={24}
            ry={4.4}
            fill={e.light}
            stroke={e.dark}
            strokeWidth={0.8}
          />
          {[66, 72, 88, 94].map((t, n) => (
            <rect
              key={t}
              x={t}
              y={110 - (n % 2) * 2}
              width={3}
              height={9}
              rx={1}
              fill={e.accent}
              transform={`rotate(${n * 25 - 30} ${t} 114)`}
            />
          ))}
          <ellipse cx={80} cy={113} rx={8} ry={4} fill={e.light} />
          <circle cx={80} cy={112} r={3} fill={e.accentD} />
        </g>
      )}
      {r === `churros` && (
        <g>
          <ellipse
            cx={80}
            cy={117}
            rx={20}
            ry={3.6}
            fill={e.light}
            stroke={e.dark}
            strokeWidth={0.8}
          />
          <path
            d={`M72 104 H86 V110 C86 116 72 116 72 110 Z`}
            fill={e.light}
            stroke={e.dark}
            strokeWidth={0.8}
          />
          <ellipse cx={79} cy={104} rx={7} ry={1.8} fill={e.dark} />
          <path
            d={`M90 116 C96 110 102 106 108 104 M92 118 C99 113 106 110 112 109`}
            fill={`none`}
            stroke={e.accentD}
            strokeWidth={3.4}
            strokeLinecap={`round`}
          />
        </g>
      )}
      {r === `tapas` && (
        <g>
          <path d={`M70 100 H80 L78 116 H72 Z`} fill={e.light} opacity={0.9} />
          <path d={`M70.8 106 H79.2 L78 116 H72 Z`} fill={e.accentD} />
          <ellipse
            cx={100}
            cy={117}
            rx={12}
            ry={3}
            fill={e.light}
            stroke={e.dark}
            strokeWidth={0.8}
          />
          <circle cx={96} cy={114} r={2.6} fill={e.green} />
          <circle cx={102} cy={114.5} r={2.6} fill={e.accent} />
        </g>
      )}
      {[34, 116].map((t) => (
        <g key={t} fill={e.dark}>
          <rect x={t} y={140} width={26} height={5} rx={2.5} />
          <rect x={t + 11} y={144} width={4} height={16} />
        </g>
      ))}
    </>
  );
};
const AeComponent = (e, t) => (
  <>
    <defs>
      <pattern
        id={t.id(`stone`)}
        width={24}
        height={16}
        patternUnits={`userSpaceOnUse`}
      >
        <rect x={1} y={1} width={14} height={6} rx={1.5} fill={e.farL} />
        <rect x={17} y={1} width={6} height={6} rx={1.5} fill={e.farL} />
        <rect x={-5} y={9} width={12} height={6} rx={1.5} fill={e.farL} />
        <rect x={9} y={9} width={14} height={6} rx={1.5} fill={e.farL} />
      </pattern>
    </defs>
    <rect x={0} y={22} width={200} height={138} fill={e.far} />
    <rect
      x={0}
      y={22}
      width={200}
      height={138}
      fill={`url(#${t.id(`stone`)})`}
    />
    <path d={`M-4 24 H204 L198 16 H2 Z`} fill={e.dark} />
    <path
      d={`M62 160 V100 A34 34 0 0 1 130 100 V160`}
      fill={`none`}
      stroke={e.light}
      strokeWidth={7}
      strokeDasharray={`9 3`}
    />
    <path d={`M66 160 V100 A30 30 0 0 1 126 100 V160 Z`} fill={e.main} />
    <path
      d={`M81 160 V76 M96 160 V70 M111 160 V76`}
      stroke={e.dark}
      strokeWidth={1.4}
    />
    {[88, 110, 132].flatMap((t) =>
      [74, 118].map((n) => (
        <circle key={`${n}-${t}`} cx={n} cy={t} r={1.6} fill={e.dark} />
      )),
    )}
    <circle cx={104} cy={128} r={3} fill={e.accent} />
    <path
      d={`M142 46 H186 M150 46 V52 M180 46 V52`}
      fill={`none`}
      stroke={e.dark}
      strokeWidth={2.4}
    />
    <rect
      x={144}
      y={52}
      width={42}
      height={30}
      rx={3}
      fill={e.accent}
      stroke={e.dark}
      strokeWidth={2}
    />
    <path
      d={`M159 58 H171 L169 62 C176 64 176 72 170 76 H160 C154 72 154 64 161 62 Z M171 64 C176 64 177 70 172 71`}
      fill={e.dark}
    />
    <rect x={146} y={98} width={30} height={24} fill={e.dark} />
    <path
      d={`M154 98 V122 M161 98 V122 M168 98 V122`}
      stroke={e.light}
      strokeWidth={1.3}
    />
    <g>
      <path
        d={`M26 66 H40 V70`}
        fill={`none`}
        stroke={e.dark}
        strokeWidth={2}
      />
      <path d={`M33 70 L27 78 V90 H39 V78 Z`} fill={e.dark} />
      <rect x={29} y={79} width={8} height={9} fill={e.bulb} />
      <circle cx={33} cy={84} r={12} fill={e.bulb} opacity={0.2} />
    </g>
    {[
      [14, 134],
      [36, 134],
      [25, 112],
    ].map(([t, n]) => (
      <g key={`${t}-${n}`}>
        <rect x={t} y={n} width={20} height={24} rx={6} fill={e.accentD} />
        <rect x={t} y={n + 5} width={20} height={2} fill={e.dark} />
        <rect x={t} y={n + 17} width={20} height={2} fill={e.dark} />
        <circle cx={t + 10} cy={n + 12} r={2.4} fill={e.dark} />
      </g>
    ))}
    {QComponent(e, 158)}
  </>
);
const JeComponent = (e, t) => {
  let n =
    t.has(`bici`) || t.has(`reparto`)
      ? `bike`
      : t.has(`rastro`)
        ? `cart`
        : `taxi`;
  return (
    <>
      {WeComponent(e, t.id(`win`), 44)}
      {WComponent(e, 24, 146)}
      <rect
        x={0}
        y={138}
        width={200}
        height={8}
        fill={e.light}
        opacity={0.45}
      />
      {QComponent(e, 144)}
      {[10, 50, 90, 130, 170].map((t) => (
        <rect
          key={t}
          x={t}
          y={165}
          width={22}
          height={2.4}
          fill={e.light}
          opacity={0.5}
        />
      ))}
      {n === `taxi` && (
        <g>
          <path
            d={`M60 148 V132 Q60 126 68 125 L86 124 L98 110 H138 L152 124 L166 126 Q174 128 174 135 V148 Z`}
            fill={e.light}
          />
          <path
            d={`M91 124 L101 114 H118 V124 Z M122 124 V114 H136 L146 124 Z`}
            fill={e.glassBg}
          />
          <path d={`M112 126 L121 126 L111 148 L102 148 Z`} fill={e.accentD} />
          <rect
            x={112}
            y={103}
            width={14}
            height={6}
            rx={1.5}
            fill={e.accent}
          />
          <circle cx={170} cy={132} r={2.4} fill={e.bulb} />
          {[82, 150].map((t) => (
            <g key={t}>
              <circle cx={t} cy={148} r={9} fill={e.dark} />
              <circle cx={t} cy={148} r={3.4} fill={e.light} />
            </g>
          ))}
        </g>
      )}
      {n === `bike` && (
        <g>
          <g
            fill={`none`}
            stroke={e.dark}
            strokeWidth={2.6}
            strokeLinejoin={`round`}
          >
            <circle cx={78} cy={140} r={15} />
            <circle cx={136} cy={140} r={15} />
            <path
              d={`M78 140 L98 114 H126 L136 140 M98 114 L106 140 H78 M126 114 L122 102 H132`}
            />
          </g>
          <rect x={92} y={106} width={14} height={4} rx={2} fill={e.dark} />
          <rect x={58} y={92} width={30} height={24} rx={2} fill={e.accent} />
          <rect x={58} y={100} width={30} height={3} fill={e.dark} />
          <path d={`M64 116 L76 128`} stroke={e.dark} strokeWidth={2} />
        </g>
      )}
      {n === `cart` && (
        <g>
          <path
            d={`M150 128 L186 112`}
            stroke={e.dark}
            strokeWidth={3}
            strokeLinecap={`round`}
          />
          <rect x={60} y={120} width={92} height={10} fill={e.accentD} />
          <circle
            cx={84}
            cy={140}
            r={10}
            fill={`none`}
            stroke={e.dark}
            strokeWidth={3}
          />
          <circle
            cx={128}
            cy={140}
            r={10}
            fill={`none`}
            stroke={e.dark}
            strokeWidth={3}
          />
          <path
            d={`M68 120 V94 H86 V104 H70 M86 120 V104`}
            fill={`none`}
            stroke={e.dark}
            strokeWidth={2.2}
          />
          <rect
            x={94}
            y={96}
            width={22}
            height={24}
            fill={e.light}
            stroke={e.dark}
            strokeWidth={2}
          />
          <circle cx={105} cy={108} r={5} fill={e.accent} />
          <path
            d={`M130 120 V104 M122 104 H138 L134 94 H126 Z`}
            fill={e.neon}
            stroke={e.dark}
            strokeWidth={1.6}
          />
        </g>
      )}
    </>
  );
};
const MeComponent = (e) => (
  <>
    <rect x={0} y={28} width={200} height={132} fill={e.mainL} />
    <rect x={0} y={24} width={200} height={5} fill={e.light} />
    {[20, 80, 140].map((t) => (
      <g key={t}>
        <rect x={t} y={38} width={40} height={24} fill={e.dark} />
        <rect x={t - 3} y={62} width={46} height={3} fill={e.light} />
      </g>
    ))}
    <path d={`M6 76 H194 L188 88 H12 Z`} fill={e.dark} />
    <rect x={14} y={88} width={152} height={68} fill={e.glassBg} />
    {[48, 96, 136].map((t) => (
      <path
        key={t}
        d={`M${t - 3} 89 H${t + 3} L${t + 18} 156 H${t - 18} Z`}
        fill={e.light}
        opacity={0.1}
      />
    ))}
    <path d={`M30 88 H58 L24 156 H14 V120 Z`} fill={e.light} opacity={0.14} />
    <g>
      <circle cx={52} cy={102} r={5} fill={e.light} />
      <path d={`M44 112 H60 L68 146 H36 Z`} fill={e.accentD} />
      <rect x={51} y={107} width={2} height={5} fill={e.light} />
      <rect x={51} y={146} width={2} height={8} fill={e.dark} />
      <rect x={44} y={153} width={16} height={2} fill={e.dark} />
    </g>
    <g>
      <ellipse cx={96} cy={96} rx={10} ry={2.4} fill={e.dark} />
      <rect x={91} y={91} width={10} height={5} rx={2} fill={e.dark} />
      <circle cx={96} cy={102} r={5} fill={e.light} />
      <path d={`M86 112 H106 L110 146 H82 Z`} fill={e.neon} />
      <path d={`M96 112 V146`} stroke={e.dark} strokeWidth={1} />
      <rect x={95} y={146} width={2} height={8} fill={e.dark} />
    </g>
    <rect x={124} y={132} width={30} height={24} fill={e.light} />
    <path d={`M129 132 L131 118 H147 L149 132 Z`} fill={e.accent} />
    <path
      d={`M133 118 C133 108 145 108 145 118`}
      fill={`none`}
      stroke={e.dark}
      strokeWidth={1.6}
    />
    <rect
      x={14}
      y={88}
      width={152}
      height={68}
      fill={`none`}
      stroke={e.dark}
      strokeWidth={2.4}
    />
    <rect x={170} y={90} width={16} height={66} fill={e.dark} />
    <circle cx={173} cy={124} r={1.6} fill={e.accent} />
    {QComponent(e)}
  </>
);
const NeComponent = (e, t) => {
  let n = t.has(`guanteria`) ? `gloves` : t.has(`tatuador`) ? `tattoo` : `jars`;
  let RComponent = (t, n, r, i) => (
    <g key={i} fill={r}>
      <rect x={t} y={n + 8} width={11} height={13} rx={2.4} />
      {[0, 1, 2, 3].map((e) => (
        <rect
          key={e}
          x={t + 0.3 + e * 2.7}
          y={n + (e === 0 || e === 3 ? 2 : 0)}
          width={2.3}
          height={10}
          rx={1.1}
        />
      ))}
      <rect
        x={t - 3.4}
        y={n + 9}
        width={2.4}
        height={7}
        rx={1.1}
        transform={`rotate(-30 ${t - 2} ${n + 12})`}
      />
      <rect x={t - 0.5} y={n + 20} width={12} height={4} fill={e.dark} />
    </g>
  );
  let IComponent = (t) => {
    if (n === `gloves`) {
      return [0, 1, 2].map((n) =>
        RComponent(
          t + 8 + n * 16,
          104 + (n % 2) * 6,
          n === 1 ? e.accentD : e.light,
          n,
        ),
      );
    }
    if (n === `tattoo`) {
      return (
        <g>
          <path
            d={`M${t + 28} 108 C${t + 22} 98 ${t + 10} 102 ${t + 12} 112 C${t + 14} 120 ${t + 28} 128 ${t + 28} 128 C${t + 28} 128 ${t + 42} 120 ${t + 44} 112 C${t + 46} 102 ${t + 34} 98 ${t + 28} 108 Z`}
            fill={e.accentD}
          />
          <rect x={t + 8} y={110} width={40} height={6} fill={e.light} />
        </g>
      );
    }
    return [0, 1, 2, 3].map((n) => (
      <rect
        key={n}
        x={t + 8 + n * 11}
        y={104 + (n % 2) * 4}
        width={8}
        height={14}
        rx={2}
        fill={n % 2 ? e.accent : e.neon}
      />
    ));
  };
  return (
    <>
      <rect x={8} y={18} width={184} height={142} fill={e.mainL} />
      <rect x={4} y={14} width={192} height={5} fill={e.light} />
      {[28, 86, 144].map((t) => (
        <g key={t}>
          <rect x={t} y={28} width={28} height={26} fill={e.dark} />
          <rect x={t - 4} y={54} width={36} height={3} fill={e.light} />
        </g>
      ))}
      <rect x={16} y={70} width={168} height={90} fill={e.main} />
      <rect x={12} y={64} width={176} height={22} fill={e.dark} />
      <rect x={28} y={70} width={144} height={10} fill={e.accent} />
      {Array.from(
        {
          length: 9,
        },
        (t, n) => (
          <rect
            key={n}
            x={38 + n * 14.4}
            y={72.5}
            width={8}
            height={5}
            fill={e.dark}
          />
        ),
      )}
      <rect x={22} y={92} width={60} height={44} fill={e.glassBg} />
      <rect x={118} y={92} width={60} height={44} fill={e.glassBg} />
      {IComponent(22)}
      {IComponent(118)}
      <rect
        x={22}
        y={92}
        width={60}
        height={44}
        fill={`none`}
        stroke={e.dark}
        strokeWidth={2.4}
      />
      <rect
        x={118}
        y={92}
        width={60}
        height={44}
        fill={`none`}
        stroke={e.dark}
        strokeWidth={2.4}
      />
      <rect x={88} y={92} width={24} height={66} fill={e.dark} />
      <rect x={92} y={96} width={16} height={24} fill={e.glassBg} />
      <circle cx={107} cy={128} r={1.8} fill={e.accent} />
      <rect x={16} y={140} width={168} height={4} fill={e.shade} />
      {n === `tattoo` && (
        <g>
          <path
            d={`M184 36 H196 M190 36 V42`}
            stroke={e.dark}
            strokeWidth={2}
          />
          <circle
            cx={190}
            cy={50}
            r={8}
            fill={e.neon}
            stroke={e.dark}
            strokeWidth={1.6}
          />
        </g>
      )}
      {QComponent(e)}
    </>
  );
};
const PeComponent = (e, t) => {
  let n = t.has(`sorolla`);
  let RComponent = (t, r, i, a) => (
    <g>
      <rect x={t - 3} y={r - 3} width={i + 6} height={a + 6} fill={e.accent} />
      <rect x={t} y={r} width={i} height={a} fill={n ? e.neon : e.light} />
      {n ? (
        <g>
          <rect
            x={t}
            y={r + a * 0.55}
            width={i}
            height={a * 0.45}
            fill={e.groove}
          />
          <path
            d={`M${t} ${r + a * 0.62} Q${t + i / 4} ${r + a * 0.56} ${t + i / 2} ${r + a * 0.62} T${t + i} ${r + a * 0.62}`}
            fill={`none`}
            stroke={e.light}
            strokeWidth={1.4}
          />
          <path
            d={`M${t + i * 0.6} ${r + a * 0.9} L${t + i * 0.66} ${r + a * 0.5} L${t + i * 0.72} ${r + a * 0.9} Z`}
            fill={e.light}
          />
        </g>
      ) : (
        <g>
          <circle
            cx={t + i * 0.7}
            cy={r + a * 0.32}
            r={Math.min(i, a) * 0.16}
            fill={e.accentD}
          />
          <path
            d={`M${t} ${r + a} V${r + a * 0.68} Q${t + i * 0.35} ${r + a * 0.45} ${t + i * 0.6} ${r + a * 0.7} T${t + i} ${r + a * 0.62} V${r + a} Z`}
            fill={e.main}
          />
        </g>
      )}
    </g>
  );
  return (
    <>
      <rect width={200} height={180} fill={e.mainL} />
      {[34, 100, 166].map((t) => (
        <path
          key={t}
          d={`M${t - 3} 0 H${t + 3} L${t + 30} 140 H${t - 30} Z`}
          fill={e.light}
          opacity={0.08}
        />
      ))}
      {RComponent(16, 60, 36, 46)}
      {RComponent(72, 40, 56, 70)}
      {RComponent(148, 56, 36, 50)}
      <rect x={0} y={140} width={200} height={3} fill={e.light} />
      {QComponent(e, 143)}
      <g fill={e.dark}>
        <rect x={64} y={130} width={60} height={5} />
        <rect x={68} y={135} width={4} height={14} />
        <rect x={116} y={135} width={4} height={14} />
        <circle cx={150} cy={104} r={5.5} />
        <path d={`M142 112 C142 108 158 108 158 112 L160 134 H140 Z`} />
        <rect x={143} y={134} width={5} height={20} />
        <rect x={152} y={134} width={5} height={20} />
      </g>
    </>
  );
};
const FeComponent = (e, t) => {
  let n = t.has(`cartel`) || t.has(`conciertos`);
  let r = [e.light, e.accent, e.neon, e.accentD];
  let i = ``;
  for (let e = 0; e < 6; e++) {
    let t = 148 - e * 13;
    i += `M${150 + ((160 - t) * 12) / 82} ${t} H${170 + ((160 - t) * 10) / 80} `;
  }
  return (
    <>
      <rect x={0} y={44} width={200} height={116} fill={e.mainL} />
      <rect x={0} y={40} width={200} height={5} fill={e.light} />
      {n ? (
        <g>
          {Array.from(
            {
              length: 10,
            },
            (n, i) => {
              let a = 6 + (i % 5) * 30 + (t.rand() - 0.5) * 6;
              let o = 54 + Math.floor(i / 5) * 46 + (t.rand() - 0.5) * 6;
              let s = (t.rand() - 0.5) * 12;
              return (
                <g
                  key={i}
                  transform={`rotate(${s.toFixed(1)} ${a + 13} ${o + 18})`}
                >
                  <rect x={a} y={o} width={26} height={36} fill={r[i % 4]} />
                  <rect
                    x={a + 3}
                    y={o + 4}
                    width={20}
                    height={9}
                    fill={e.dark}
                  />
                  <rect
                    x={a + 3}
                    y={o + 17}
                    width={20}
                    height={2}
                    fill={e.dark}
                  />
                  <rect
                    x={a + 3}
                    y={o + 22}
                    width={14}
                    height={2}
                    fill={e.dark}
                  />
                  <circle cx={a + 18} cy={o + 29} r={3} fill={e.dark} />
                </g>
              );
            },
          )}
          {WComponent(e, 180, 160)}
        </g>
      ) : (
        <g>
          <rect x={10} y={52} width={180} height={98} fill={e.shade} />
          <path d={`M10 52 H74 L34 150 H10 Z`} fill={e.neon} opacity={0.6} />
          <path d={`M136 52 H190 V112 Z`} fill={e.light} opacity={0.75} />
          <circle cx={96} cy={96} r={30} fill={e.accent} />
          <circle cx={86} cy={90} r={3.5} fill={e.dark} />
          <circle cx={106} cy={90} r={3.5} fill={e.dark} />
          <path
            d={`M82 104 Q96 116 110 104`}
            fill={`none`}
            stroke={e.dark}
            strokeWidth={3}
            strokeLinecap={`round`}
          />
          <path
            d={`M10 132 Q46 110 84 130 T190 124 V150 H10 Z`}
            fill={e.accentD}
          />
          <path
            d={`M150 160 L162 78 M170 160 L180 80 ${i}`}
            fill={`none`}
            stroke={e.dark}
            strokeWidth={2.2}
          />
          <rect x={132} y={146} width={12} height={12} fill={e.light} />
          <rect x={132} y={146} width={12} height={3} fill={e.accent} />
        </g>
      )}
      {QComponent(e, 152)}
    </>
  );
};
const IeComponent = (e, t) => (
  <>
    <defs>
      <pattern
        id={t.id(`brick`)}
        width={12}
        height={8}
        patternUnits={`userSpaceOnUse`}
      >
        <rect
          x={0.5}
          y={0.5}
          width={11}
          height={3}
          fill={e.main}
          opacity={0.3}
        />
        <rect
          x={-5.5}
          y={4.5}
          width={11}
          height={3}
          fill={e.main}
          opacity={0.3}
        />
        <rect
          x={6.5}
          y={4.5}
          width={11}
          height={3}
          fill={e.main}
          opacity={0.3}
        />
      </pattern>
    </defs>
    <circle cx={164} cy={14} r={8} fill={e.light} opacity={0.4} />
    <circle cx={174} cy={4} r={10} fill={e.light} opacity={0.3} />
    <path d={`M150 110 L153 24 H163 L166 110 Z`} fill={e.main} />
    <rect x={151} y={20} width={14} height={6} fill={e.dark} />
    {[40, 58, 76].map((t) => (
      <rect
        key={t}
        x={152.4}
        y={t}
        width={11.2}
        height={2}
        fill={e.dark}
        opacity={0.5}
      />
    ))}
    <path
      d={`M6 96 L28 74 V96 L50 74 V96 L72 74 V96 L94 74 V96 L116 74 V96 Z`}
      fill={e.main}
    />
    {[28, 50, 72, 94].map((t) => (
      <rect key={t} x={t - 3} y={78} width={2.4} height={16} fill={e.neon} />
    ))}
    <path d={`M114 96 L156 70 L198 96 Z`} fill={e.main} />
    <rect x={4} y={96} width={192} height={64} fill={e.mainL} />
    <rect
      x={4}
      y={96}
      width={192}
      height={64}
      fill={`url(#${t.id(`brick`)})`}
    />
    <rect x={2} y={93} width={196} height={4} fill={e.light} />
    {[14, 36, 58, 128, 150, 172].map((t, n) => (
      <path
        key={t}
        d={`M${t} 134 V114 A7 7 0 0 1 ${t + 14} 114 V134 Z`}
        fill={n % 3 == 1 ? e.bulb : e.dark}
      />
    ))}
    <path d={`M82 158 V122 A18 18 0 0 1 118 122 V158 Z`} fill={e.dark} />
    <path
      d={`M82 122 A18 18 0 0 1 118 122`}
      fill={`none`}
      stroke={e.light}
      strokeWidth={3}
    />
    {QComponent(e, 156)}
  </>
);
const LeComponent = (e) => (
  <>
    <circle cx={100} cy={26} r={9} fill={e.accent} />
    <circle cx={100} cy={26} r={4} fill={e.dark} />
    <rect x={20} y={34} width={160} height={2.4} fill={e.light} />
    {Array.from(
      {
        length: 20,
      },
      (t, n) => (
        <rect
          key={n}
          x={22 + n * 8}
          y={36}
          width={3}
          height={8}
          fill={e.light}
        />
      ),
    )}
    <rect x={20} y={50} width={160} height={110} fill={e.mainL} />
    <rect x={16} y={44} width={168} height={7} fill={e.light} />
    {[36, 88, 140].map((t) => (
      <g key={t}>
        <path
          d={`M${t} 104 V70 A12 12 0 0 1 ${t + 24} 70 V104 Z`}
          fill={e.dark}
        />
        <path
          d={`M${t + 1} 104 V70 A11 11 0 0 1 ${t + 12} 59 C${t + 10} 76 ${t + 8} 92 ${t + 1} 104 Z`}
          fill={e.accentD}
        />
        <path
          d={`M${t + 23} 104 V70 A11 11 0 0 0 ${t + 12} 59 C${t + 14} 76 ${t + 16} 92 ${t + 23} 104 Z`}
          fill={e.accentD}
        />
        <rect x={t - 3} y={104} width={30} height={3} fill={e.light} />
      </g>
    ))}
    <path d={`M26 118 H174 L164 108 H36 Z`} fill={e.dark} />
    <rect x={26} y={118} width={148} height={4} fill={e.accent} />
    {Array.from(
      {
        length: 15,
      },
      (t, n) => (
        <circle key={n} cx={30 + n * 10} cy={126} r={2} fill={e.bulb} />
      ),
    )}
    {[46, 76, 106, 136].map((t) => (
      <g key={t}>
        <rect x={t} y={132} width={18} height={28} fill={e.dark} />
        <rect x={t + 3} y={135} width={12} height={10} fill={e.glassBg} />
      </g>
    ))}
    {[22, 164].map((t) => (
      <g key={t}>
        <rect x={t} y={132} width={14} height={22} fill={e.light} />
        <rect x={t + 2} y={135} width={10} height={6} fill={e.accentD} />
        <rect x={t + 2} y={144} width={10} height={2} fill={e.dark} />
      </g>
    ))}
    {QComponent(e, 158)}
  </>
);
const ReComponent = (e, t) => {
  let n = [e.light, e.accent, e.neon, e.accentD];
  return (
    <>
      <defs>
        <pattern
          id={t.id(`rail`)}
          width={5}
          height={12}
          patternUnits={`userSpaceOnUse`}
        >
          <rect x={1.8} width={1.4} height={12} fill={e.dark} />
        </pattern>
      </defs>
      <rect x={34} y={28} width={132} height={132} fill={e.mainL} />
      <path d={`M0 10 L34 28 V160 H0 Z`} fill={e.main} />
      <path d={`M200 10 L166 28 V160 H200 Z`} fill={e.main} />
      <rect x={30} y={24} width={140} height={5} fill={e.light} />
      {[40, 80, 120].map((n) => (
        <g key={n}>
          {[46, 78, 110, 142].map((t) => (
            <rect
              key={t}
              x={t}
              y={n + 2}
              width={12}
              height={24}
              fill={e.dark}
            />
          ))}
          <rect
            x={34}
            y={n + 14}
            width={132}
            height={12}
            fill={`url(#${t.id(`rail`)})`}
          />
          <rect x={34} y={n + 13} width={132} height={2} fill={e.dark} />
          <rect x={34} y={n + 26} width={132} height={4} fill={e.light} />
          <path
            d={`M0 ${n + 12} L34 ${n + 26} V${n + 30} L0 ${n + 17} Z M200 ${n + 12} L166 ${n + 26} V${n + 30} L200 ${n + 17} Z`}
            fill={e.light}
          />
          <path
            d={`M0 ${n - 1} L34 ${n + 13} V${n + 15} L0 ${n + 1} Z M200 ${n - 1} L166 ${n + 13} V${n + 15} L200 ${n + 1} Z`}
            fill={e.dark}
          />
          <circle cx={62 + (n % 3) * 32} cy={n + 11} r={3} fill={e.green} />
        </g>
      ))}
      <path
        d={`M0 62 Q100 80 200 60`}
        fill={`none`}
        stroke={e.dark}
        strokeWidth={0.8}
      />
      {[0.14, 0.3, 0.46, 0.62, 0.8].map((e, t) => {
        let [r, i] = Ce(0, 62, 100, 80, 200, 60, e);
        if (t % 2) {
          return (
            <path
              key={t}
              d={`M${r - 6} ${i} H${r + 6} L${r + 8} ${i + 5} L${r + 5} ${i + 5} V${i + 14} H${r - 5} V${i + 5} L${r - 8} ${i + 5} Z`}
              fill={n[t % 4]}
            />
          );
        }
        return (
          <rect
            key={t}
            x={r - 5}
            y={i}
            width={10}
            height={16}
            fill={n[t % 4]}
          />
        );
      })}
      {QComponent(e, 158)}
    </>
  );
};
const ZeComponent = (e, t) => {
  let n = t.has(`dama`) ? `dama` : t.has(`reina`) ? `reina` : `chulapa`;
  return (
    <>
      <path
        d={`M0 160 V112 H22 V100 H50 V116 H150 V96 H176 V108 H200 V160 Z`}
        fill={e.far}
      />
      {[8, 30, 158, 184].map((t) => KComponent(t, 122, 6, 8, e.bulb, t))}
      {QComponent(e, 156)}
      {n === `chulapa` && (
        <g>
          <path
            d={`M76 160 C80 132 84 112 88 96 H104 C108 112 112 132 116 160 Z`}
            fill={e.dark}
          />
          <path
            d={`M78 150 Q84 146 90 150 T102 150 T114 150 M80 138 Q86 134 92 138 T104 138 T112 138`}
            fill={`none`}
            stroke={e.light}
            strokeWidth={1.4}
          />
          <path d={`M78 86 H114 L96 124 Z`} fill={e.accent} />
          <path
            d={`M84 100 L82 108 M90 112 L88 120 M102 112 L104 120 M108 100 L110 108`}
            stroke={e.accent}
            strokeWidth={1.4}
          />
          <path
            d={`M82 88 L70 104 L84 112 M110 88 L122 104 L108 112`}
            fill={`none`}
            stroke={e.dark}
            strokeWidth={5}
            strokeLinecap={`round`}
            strokeLinejoin={`round`}
          />
          <rect x={93} y={78} width={6} height={9} fill={e.dark} />
          <circle cx={96} cy={70} r={9} fill={e.dark} />
          <path
            d={`M85 72 C85 58 107 58 107 72 L109 78 H83 Z`}
            fill={e.light}
          />
          {[
            [90, 66],
            [98, 64],
            [104, 70],
            [92, 74],
          ].map(([t, n]) => (
            <circle key={`${t}-${n}`} cx={t} cy={n} r={1.2} fill={e.dark} />
          ))}
          <circle cx={102} cy={60} r={4} fill={e.accentD} />
          <path d={`M104 62 L110 60`} stroke={e.green} strokeWidth={2} />
        </g>
      )}
      {n === `dama` && (
        <g>
          <rect x={88} y={146} width={4} height={14} fill={e.dark} />
          <rect x={100} y={146} width={4} height={14} fill={e.dark} />
          <path d={`M80 148 L84 94 H108 L112 148 Z`} fill={e.dark} />
          <ellipse cx={96} cy={94} rx={15} ry={6} fill={e.light} />
          <path
            d={`M108 100 L118 118`}
            stroke={e.dark}
            strokeWidth={5}
            strokeLinecap={`round`}
          />
          <rect
            x={112}
            y={118}
            width={16}
            height={12}
            rx={2}
            fill={e.accentD}
          />
          <path
            d={`M115 118 C115 111 125 111 125 118`}
            fill={`none`}
            stroke={e.dark}
            strokeWidth={1.6}
          />
          <circle cx={96} cy={78} r={8.5} fill={e.dark} />
          <ellipse cx={96} cy={70} rx={20} ry={4.6} fill={e.dark} />
          <path d={`M86 70 C86 60 106 60 106 70 Z`} fill={e.dark} />
          <rect x={84} y={66} width={24} height={3} fill={e.accent} />
          <rect x={90} y={77} width={12} height={3} rx={1.5} fill={e.accent} />
        </g>
      )}
      {n === `reina` && (
        <g>
          <circle cx={96} cy={68} r={16} fill={e.accentD} />
          <circle cx={84} cy={60} r={8} fill={e.accentD} />
          <circle cx={108} cy={60} r={8} fill={e.accentD} />
          <path d={`M80 160 L86 96 H106 L112 160 Z`} fill={e.neon} />
          {Array.from(
            {
              length: 14,
            },
            (t, n) => (
              <circle
                key={n}
                cx={86 + ((n * 7) % 22)}
                cy={104 + n * 4}
                r={1.2}
                fill={e.light}
              />
            ),
          )}
          <path
            d={`M86 98 L74 84 L70 70 M106 98 L118 112`}
            fill={`none`}
            stroke={e.dark}
            strokeWidth={5}
            strokeLinecap={`round`}
            strokeLinejoin={`round`}
          />
          <rect x={68} y={60} width={4} height={12} rx={2} fill={e.dark} />
          <circle cx={70} cy={58} r={3.6} fill={e.light} />
          <rect x={93} y={80} width={6} height={10} fill={e.dark} />
          <circle cx={96} cy={74} r={8.5} fill={e.dark} />
          {[
            [126, 60, 5],
            [62, 96, 4],
            [132, 96, 3.5],
          ].map(([t, n, r]) => (
            <path
              key={t}
              d={`M${t} ${n - r} L${t + r * 0.3} ${n - r * 0.3} L${t + r} ${n} L${t + r * 0.3} ${n + r * 0.3} L${t} ${n + r} L${t - r * 0.3} ${n + r * 0.3} L${t - r} ${n} L${t - r * 0.3} ${n - r * 0.3} Z`}
              fill={e.light}
            />
          ))}
        </g>
      )}
    </>
  );
};
const BeComponent = (e, t) => {
  let n = t.has(`angel`);
  return (
    <>
      {GComponent(e, 24, 152, 1.25, `l`)}
      {GComponent(e, 178, 150, 1.15, `r`)}
      {QComponent(e, 152)}
      <rect x={52} y={148} width={96} height={6} fill={e.light} />
      <rect x={62} y={142} width={76} height={6} fill={e.mainL} />
      <rect x={80} y={100} width={40} height={42} fill={e.mainL} />
      <rect x={76} y={96} width={48} height={5} fill={e.light} />
      <rect x={90} y={112} width={20} height={14} fill={e.accent} />
      <rect x={91} y={52} width={18} height={44} fill={e.mainL} />
      <path
        d={`M95 52 V96 M100 52 V96 M105 52 V96`}
        stroke={e.shade}
        strokeWidth={1.2}
      />
      <rect x={87} y={48} width={26} height={5} fill={e.light} />
      {n ? (
        <g fill={e.dark}>
          <path d={`M96 48 C92 40 94 32 100 28 C106 30 108 38 104 48 Z`} />
          <circle cx={92} cy={26} r={4.4} />
          <path d={`M100 32 C112 20 126 18 134 6 C132 22 120 32 104 38 Z`} />
          <path d={`M97 34 C86 24 80 14 82 2 C90 12 96 20 101 30 Z`} />
          <path
            d={`M104 44 L114 50 M96 44 L84 50`}
            stroke={e.dark}
            strokeWidth={3}
            strokeLinecap={`round`}
          />
        </g>
      ) : (
        <g fill={e.dark}>
          <path d={`M94 48 L96 30 H104 L106 48 Z`} />
          <circle cx={100} cy={25} r={4.6} />
          <path
            d={`M104 32 L112 18`}
            stroke={e.dark}
            strokeWidth={3.2}
            strokeLinecap={`round`}
          />
          <path
            d={`M111 20 L118 2`}
            stroke={e.light}
            strokeWidth={2}
            strokeLinecap={`round`}
          />
          <path
            d={`M96 32 L90 44`}
            stroke={e.dark}
            strokeWidth={3.2}
            strokeLinecap={`round`}
          />
        </g>
      )}
    </>
  );
};
const VeComponent = (e) => (
  <>
    {[0, 26, 52, 78, 104, 130, 156, 182, 208].map((t, n) => (
      <circle key={t} cx={t} cy={96} r={13 + (n % 3) * 3} fill={e.green} />
    ))}
    <rect x={0} y={94} width={200} height={8} fill={e.green} />
    <rect x={0} y={100} width={200} height={80} fill={e.mainL} />
    {[
      [148, 108, 22, 2.4],
      [148, 116, 14, 1.8],
      [148, 123, 8, 1.3],
    ].map(([t, n, r, i]) => (
      <ellipse
        key={n}
        cx={t}
        cy={n}
        rx={r}
        ry={i}
        fill={e.accent}
        opacity={0.8}
      />
    ))}
    {[
      [12, 112, 20],
      [60, 106, 16],
      [150, 136, 18],
      [20, 150, 22],
    ].map(([t, n, r]) => (
      <rect
        key={`${t}-${n}`}
        x={t}
        y={n}
        width={r}
        height={1.4}
        fill={e.neon}
        opacity={0.7}
      />
    ))}
    <path
      d={`M88 118 L40 146 M112 118 L160 146`}
      stroke={e.dark}
      strokeWidth={3}
      strokeLinecap={`round`}
    />
    <ellipse cx={38} cy={148} rx={7} ry={2.6} fill={e.dark} />
    <ellipse cx={162} cy={148} rx={7} ry={2.6} fill={e.dark} />
    <path
      d={`M92 132 L94 112 C94 106 106 106 106 112 L108 132 Z`}
      fill={e.dark}
    />
    <circle cx={100} cy={102} r={6} fill={e.dark} />
    <ellipse cx={100} cy={98} rx={11} ry={2.6} fill={e.accent} />
    <rect x={95} y={92} width={10} height={6} rx={2} fill={e.accent} />
    <path d={`M44 128 H156 L144 146 Q100 154 56 146 Z`} fill={e.accentD} />
    <rect x={44} y={126} width={112} height={4} fill={e.light} />
    <path
      d={`M172 118 C172 114 178 114 178 118 L184 118 C184 122 168 124 166 120 Z`}
      fill={e.dark}
    />
    <circle cx={177} cy={114} r={2.6} fill={e.dark} />
  </>
);
const HeComponent = (e) => (
  <>
    {[0, 30, 60, 90, 120, 150, 180, 210].map((t, n) => (
      <circle key={t} cx={t} cy={128} r={12 + (n % 3) * 3} fill={e.far} />
    ))}
    {QComponent(e, 130)}
    <path
      d={`M14 160 C22 116 18 70 26 0 H60 C54 60 60 112 72 160 Z`}
      fill={e.dark}
    />
    <path
      d={`M52 98 C92 92 132 96 200 86 V94 C132 106 92 102 54 108 Z`}
      fill={e.dark}
    />
    <circle cx={188} cy={70} r={20} fill={e.green} />
    <circle cx={164} cy={78} r={14} fill={e.green} />
    <circle cx={180} cy={64} r={7} fill={e.greenL} />
    <circle cx={70} cy={20} r={22} fill={e.green} />
    <circle cx={94} cy={34} r={14} fill={e.green} />
    <circle cx={80} cy={16} r={7} fill={e.greenL} />
    <g fill={e.accentD}>
      <path
        d={`M116 96 C98 92 94 66 106 56 C118 46 132 58 124 68 C118 76 122 86 128 90 Z`}
      />
      <ellipse cx={132} cy={86} rx={8.5} ry={10} />
      <circle cx={138} cy={74} r={6.4} />
      <path d={`M135 69 L136 62 L140 68 Z`} />
    </g>
    <circle cx={140} cy={73} r={1.2} fill={e.dark} />
    <ellipse cx={141} cy={84} rx={3.4} ry={4} fill={e.accent} />
    <path d={`M137.6 81 H144.4 L143 79 H139 Z`} fill={e.dark} />
    {[
      [100, 150],
      [120, 156],
      [150, 148],
    ].map(([t, n]) => (
      <g key={t}>
        <ellipse cx={t} cy={n} rx={3} ry={3.6} fill={e.accent} />
        <rect
          x={t - 3.2}
          y={n - 4.4}
          width={6.4}
          height={2.4}
          rx={1}
          fill={e.dark}
        />
      </g>
    ))}
  </>
);
const UeComponent = (e, t) => {
  let n = () => U(t, [e.accentD, e.light, e.accent]);
  return (
    <>
      <rect x={0} y={106} width={200} height={10} fill={e.far} />
      {QComponent(e, 112)}
      <path
        d={`M78 180 L122 180 L108 112 L92 112 Z`}
        fill={e.light}
        opacity={0.35}
      />
      {[18, 78, 138].map((t) => (
        <g key={t}>
          <path
            d={`M${t} 150 V96 A22 22 0 0 1 ${t + 44} 96 V150`}
            fill={`none`}
            stroke={e.dark}
            strokeWidth={3}
          />
          {Array.from(
            {
              length: 9,
            },
            (r, i) => {
              let a = Math.PI + (i / 8) * Math.PI;
              return (
                <circle
                  key={i}
                  cx={t + 22 + Math.cos(a) * 22}
                  cy={96 + Math.sin(a) * 22}
                  r={3.4}
                  fill={i % 2 ? e.green : n()}
                />
              );
            },
          )}
          {[108, 122, 136].flatMap((n) =>
            [t, t + 44].map((t) => (
              <circle key={`${t}-${n}`} cx={t} cy={n} r={2.8} fill={e.green} />
            )),
          )}
        </g>
      ))}
      {[
        [30, 158],
        [66, 150],
        [134, 150],
        [170, 158],
      ].map(([t, r]) => (
        <g key={t}>
          <ellipse cx={t} cy={r} rx={16} ry={6} fill={e.green} />
          {[-9, -3, 3, 9].map((e) => (
            <circle
              key={e}
              cx={t + e}
              cy={r - 3 - Math.abs(e) * 0.1}
              r={2.4}
              fill={n()}
            />
          ))}
        </g>
      ))}
    </>
  );
};
const We = (e, t) => (
  <>
    <defs>
      <pattern
        id={t.id(`fence`)}
        width={6}
        height={24}
        patternUnits={`userSpaceOnUse`}
      >
        <rect x={2.2} y={3} width={1.6} height={21} fill={e.dark} />
        <path d={`M3 0 L4.6 3.4 H1.4 Z`} fill={e.dark} />
      </pattern>
    </defs>
    {GComponent(e, 20, 150, 1.2, `l`)}
    {GComponent(e, 184, 150, 1.05, `r`)}
    <rect x={40} y={72} width={100} height={80} fill={e.mainL} />
    <path d={`M34 74 L46 48 H134 L146 74 Z`} fill={e.dark} />
    {[58, 86, 114].map((t) => (
      <g key={t}>
        <rect x={t} y={56} width={10} height={12} fill={e.bulb} />
        <path d={`M${t - 2} 57 L${t + 5} 50 L${t + 12} 57 Z`} fill={e.light} />
      </g>
    ))}
    <rect x={30} y={72} width={120} height={4} fill={e.light} />
    <rect x={136} y={40} width={30} height={112} fill={e.mainL} />
    <path d={`M132 42 L151 8 L170 42 Z`} fill={e.dark} />
    <rect x={150} y={2} width={2} height={8} fill={e.dark} />
    <rect x={132} y={40} width={38} height={4} fill={e.light} />
    {[84, 112].flatMap((t) =>
      [50, 70, 104, 122].map((n) => (
        <rect
          key={`${n}-${t}`}
          x={n}
          y={t}
          width={10}
          height={18}
          fill={e.dark}
        />
      )),
    )}
    {[56, 90].map((t) => (
      <rect key={t} x={146} y={t} width={10} height={18} rx={5} fill={e.dark} />
    ))}
    <path d={`M84 152 V126 A6 6 0 0 1 96 126 V152 Z`} fill={e.dark} />
    {QComponent(e, 150)}
    <rect
      x={0}
      y={128}
      width={78}
      height={24}
      fill={`url(#${t.id(`fence`)})`}
    />
    <rect
      x={102}
      y={128}
      width={98}
      height={24}
      fill={`url(#${t.id(`fence`)})`}
    />
    <rect x={0} y={134} width={200} height={1.6} fill={e.dark} />
    {[76, 102].map((t) => (
      <g key={t}>
        <rect x={t - 3} y={120} width={8} height={32} fill={e.light} />
        <path
          d={`M${t - 3} 120 C${t - 3} 112 ${t + 5} 112 ${t + 5} 120 Z`}
          fill={e.accent}
        />
      </g>
    ))}
  </>
);
const GeComponent = (e, t) => (
  <>
    <defs>
      <pattern
        id={t.id(`bricks`)}
        width={30}
        height={28}
        patternUnits={`userSpaceOnUse`}
      >
        <rect x={2} y={6} width={26} height={10} rx={1.5} fill={e.farL} />
        <rect x={-12} y={20} width={26} height={10} rx={1.5} fill={e.farL} />
        <rect x={18} y={20} width={26} height={10} rx={1.5} fill={e.farL} />
      </pattern>
    </defs>
    <rect width={200} height={180} fill={e.far} />
    <rect width={200} height={128} fill={`url(#${t.id(`bricks`)})`} />
    <path d={`M128 180 V86 A28 28 0 0 1 184 86 V180 Z`} fill={e.dark} />
    <path d={`M136 180 V90 A20 20 0 0 1 176 90 V180 Z`} fill={e.shade} />
    <rect x={57} y={0} width={2.4} height={22} fill={e.dark} />
    <path
      d={`M58 20 C36 42 36 84 54 100 C62 108 74 104 77 92 C82 70 76 42 58 20 Z`}
      fill={e.accentD}
    />
    <path
      d={`M56 30 C46 48 46 74 56 88`}
      fill={`none`}
      stroke={e.dark}
      strokeWidth={1.6}
    />
    <rect x={0} y={128} width={200} height={52} fill={e.main} />
    <rect x={0} y={124} width={200} height={8} fill={e.mainL} />
    <ellipse cx={152} cy={124} rx={30} ry={6.5} fill={e.light} />
    {[142, 152, 162].map((t, n) => (
      <circle
        key={t}
        cx={t}
        cy={n === 1 ? 118.5 : 119.5}
        r={4.2}
        fill={e.green}
      />
    ))}
    <path
      d={`M76 66 L124 66 L117 126 L83 126 Z`}
      fill={e.light}
      opacity={0.9}
    />
    <path d={`M79 82 L121 82 L116 124 L84 124 Z`} fill={e.accent} />
    <ellipse cx={100} cy={76} rx={25} ry={9} fill={e.light} />
    <circle cx={86} cy={70} r={8} fill={e.light} />
    <circle cx={102} cy={67} r={9} fill={e.light} />
    <circle cx={116} cy={71} r={7} fill={e.light} />
    <circle cx={92} cy={100} r={1.8} fill={e.light} opacity={0.8} />
    <circle cx={106} cy={110} r={1.5} fill={e.light} opacity={0.8} />
    <circle cx={100} cy={92} r={1.3} fill={e.light} opacity={0.8} />
  </>
);
const Ke = (e) => (
  <>
    <rect x={8} y={14} width={184} height={166} fill={e.main} />
    {[0, 1, 2].map((t) => (
      <g key={t}>
        <rect
          x={26 + t * 54}
          y={24}
          width={40}
          height={30}
          rx={2}
          fill={e.dark}
        />
        <rect x={22 + t * 54} y={54} width={48} height={4} fill={e.mainL} />
      </g>
    ))}
    <rect x={20} y={64} width={160} height={24} rx={3} fill={e.dark} />
    <text
      x={100}
      y={82}
      textAnchor={`middle`}
      fontSize={17}
      fontWeight={800}
      letterSpacing={4}
      fill={e.neon}
      fontFamily={H}
    >{`DISCOS`}</text>
    {Array.from(
      {
        length: 8,
      },
      (t, n) => (
        <path
          key={n}
          d={`M${20 + n * 20} 92 L${40 + n * 20} 92 L${38 + n * 20} 108 L${22 + n * 20} 108 Z`}
          fill={n % 2 ? e.light : e.accent}
        />
      ),
    )}
    <rect x={20} y={112} width={112} height={62} fill={e.glassBg} />
    {[
      [44, 143],
      [76, 139],
      [108, 145],
    ].map(([t, n], r) => (
      <g key={t}>
        <circle cx={t} cy={n} r={17} fill={e.dark} />
        <circle
          cx={t}
          cy={n}
          r={12}
          fill={`none`}
          stroke={e.groove}
          strokeWidth={1.6}
        />
        <circle cx={t} cy={n} r={5.5} fill={r === 1 ? e.accent : e.neon} />
        <circle cx={t} cy={n} r={1.4} fill={e.dark} />
      </g>
    ))}
    <rect x={142} y={112} width={38} height={68} fill={e.dark} />
    <circle cx={172} cy={148} r={2.2} fill={e.accent} />
  </>
);
const QeComponent = (e) => (
  <>
    <path d={`M26 180 V64 Q100 8 174 64 V180 Z`} fill={e.mainL} />
    <path d={`M44 66 Q100 22 156 66 L156 74 Q100 32 44 74 Z`} fill={e.accent} />
    <circle cx={72} cy={84} r={9} fill={e.dark} />
    <circle cx={128} cy={84} r={9} fill={e.dark} />
    <rect x={92} y={74} width={16} height={20} rx={8} fill={e.dark} />
    <rect x={36} y={100} width={128} height={28} rx={5} fill={e.main} />
    {Array.from(
      {
        length: 12,
      },
      (t, n) => (
        <g key={n}>
          <circle cx={43 + n * 10.4} cy={104} r={2.3} fill={e.bulb} />
          <circle cx={43 + n * 10.4} cy={124} r={2.3} fill={e.bulb} />
        </g>
      ),
    )}
    <text
      x={100}
      y={119.5}
      textAnchor={`middle`}
      fontSize={14}
      fontWeight={800}
      letterSpacing={5}
      fill={e.bulb}
      fontFamily={H}
    >{`DORÉ`}</text>
    {[0, 1, 2].map((t) => (
      <path
        key={t}
        d={`M${56 + t * 32} 180 V150 A12 12 0 0 1 ${80 + t * 32} 150 V180 Z`}
        fill={e.dark}
      />
    ))}
    <rect x={26} y={134} width={10} height={46} fill={e.main} />
    <rect x={164} y={134} width={10} height={46} fill={e.main} />
    <rect x={0} y={176} width={200} height={4} fill={e.ground} />
  </>
);
const Je = (e) => (
  <>
    <circle cx={14} cy={150} r={28} fill={e.green} />
    <circle cx={188} cy={148} r={30} fill={e.green} />
    <ellipse cx={100} cy={184} rx={118} ry={20} fill={e.ground} />
    <rect x={18} y={80} width={164} height={92} fill={e.mainL} />
    <rect x={12} y={74} width={176} height={8} fill={e.light} />
    <rect x={56} y={46} width={88} height={30} fill={e.mainL} />
    <path d={`M48 48 L100 22 L152 48 Z`} fill={e.mainL} />
    <rect x={64} y={56} width={72} height={8} rx={1} fill={e.light} />
    <circle cx={100} cy={34} r={5} fill={e.accent} />
    <rect x={97} y={38} width={6} height={8} fill={e.accent} />
    <path d={`M86 172 V120 A14 14 0 0 1 114 120 V172 Z`} fill={e.dark} />
    <path d={`M54 172 V126 A11 11 0 0 1 76 126 V172 Z`} fill={e.dark} />
    <path d={`M124 172 V126 A11 11 0 0 1 146 126 V172 Z`} fill={e.dark} />
    <rect x={26} y={128} width={16} height={44} fill={e.dark} />
    <rect x={158} y={128} width={16} height={44} fill={e.dark} />
    {[45, 79, 117, 151].map((t) => (
      <rect key={t} x={t} y={82} width={4} height={90} fill={e.light} />
    ))}
  </>
);
const YeComponent = (e) => (
  <>
    <ellipse cx={100} cy={170} rx={104} ry={16} fill={e.far} />
    <rect x={0} y={148} width={200} height={2.2} fill={e.dark} />
    {Array.from(
      {
        length: 11,
      },
      (t, n) => (
        <rect
          key={n}
          x={4 + n * 19}
          y={140}
          width={2.2}
          height={12}
          fill={e.dark}
        />
      ),
    )}
    <path
      d={`M84 170 C88 142 82 120 90 98 L110 98 C118 120 112 142 116 170 C108 164 92 164 84 170 Z`}
      fill={e.dark}
    />
    <path d={`M84 170 C74 172 66 176 60 178 L92 176 Z`} fill={e.dark} />
    <path d={`M116 170 C126 172 134 176 142 178 L108 176 Z`} fill={e.dark} />
    {[
      [60, 80, 27],
      [84, 58, 31],
      [118, 55, 33],
      [144, 78, 28],
      [100, 86, 30],
      [70, 100, 20],
      [132, 100, 22],
    ].map(([t, n, r]) => (
      <circle key={`${t}-${n}`} cx={t} cy={n} r={r} fill={e.green} />
    ))}
    {[
      [88, 50, 12],
      [120, 46, 13],
      [146, 70, 9],
      [62, 72, 9],
    ].map(([t, n, r]) => (
      <circle key={`${t}-${n}`} cx={t} cy={n} r={r} fill={e.greenL} />
    ))}
  </>
);
const Xe = (e, t) => {
  let n = () => {
    if (t.rand() < 0.45) {
      return e.bulb;
    }
    return e.dark;
  };
  let r = t.has(`gato`);
  return (
    <>
      <path
        d={`M0 132 V106 H12 V98 H26 V108 H38 V92 H50 V102 H62 V112 H76 V100 H90 V132 Z M168 132 V104 H180 V94 H200 V132 Z`}
        fill={e.far}
      />
      <rect x={130} y={60} width={36} height={100} fill={e.mainL} />
      {[136, 142, 148, 154, 160].map((t) => (
        <rect
          key={t}
          x={t - 1.2}
          y={63}
          width={2.4}
          height={30}
          fill={e.light}
        />
      ))}
      <rect x={127} y={56} width={42} height={5} fill={e.light} />
      <rect x={134} y={44} width={28} height={13} fill={e.mainL} />
      <path d={`M132 45 C132 25 164 25 164 45 Z`} fill={e.dark} />
      <path
        d={`M148 30 V45 M140.5 33 L142 45 M155.5 33 L154 45`}
        fill={`none`}
        stroke={e.accent}
        strokeWidth={1.2}
      />
      <rect x={146.4} y={20} width={3.2} height={10} fill={e.dark} />
      <circle cx={148} cy={4.6} r={1.9} fill={e.dark} />
      <path
        d={`M146.6 7 H149.4 L150.4 13 L149.4 20 H146.6 L145.6 13 Z M146.8 9.5 C143 9 139 6 136.5 1.5 C136 5 138.5 10.5 146 13.5 Z M149.2 9.5 C153 9 157 6 159.5 1.5 C160 5 157.5 10.5 150 13.5 Z`}
        fill={e.dark}
      />
      {[100, 114, 128, 142].flatMap((e) =>
        [136, 145, 154].map((t) => KComponent(t, e, 6, 8, n(), `${t}-${e}`)),
      )}
      <rect x={0} y={120} width={64} height={60} fill={e.shade} />
      <path d={`M-6 122 L32 98 L70 122 Z`} fill={e.main} />
      <rect x={12} y={100} width={7} height={16} fill={e.dark} />
      <rect x={10} y={98} width={11} height={3} fill={e.dark} />
      <path
        d={`M44 104 V80 M37 85 H51 M39 90 H49`}
        fill={`none`}
        stroke={e.dark}
        strokeWidth={1.3}
      />
      {[10, 28, 46].map((e) => KComponent(e, 130, 8, 11, n(), e))}
      <rect x={60} y={112} width={60} height={68} fill={e.mainL} />
      <path d={`M54 114 L90 92 L126 114 Z`} fill={e.main} />
      <rect x={104} y={94} width={6} height={14} fill={e.dark} />
      <rect x={102} y={92} width={10} height={3} fill={e.dark} />
      {[70, 86, 102].map((e) => KComponent(e, 124, 8, 11, n(), e))}
      <rect x={118} y={134} width={82} height={46} fill={e.shade} />
      <path d={`M112 136 L200 120 V136 Z`} fill={e.main} />
      <path d={`M0 160 L200 148 V180 H0 Z`} fill={e.dark} />
      {r && (
        <g fill={e.dark}>
          <path d={`M70 101 C68 90 72 82 78 81 C84 82 88 90 86 101 Z`} />
          <circle cx={78} cy={77} r={5.8} />
          <path
            d={`M73.2 74 L73.6 67.5 L77.4 72.4 Z M82.8 74 L82.4 67.5 L78.6 72.4 Z`}
          />
          <path
            d={`M85 99 C95 99 97 90 92 85`}
            fill={`none`}
            stroke={e.dark}
            strokeWidth={2.6}
            strokeLinecap={`round`}
          />
          <circle cx={76} cy={76.6} r={0.95} fill={e.accent} />
          <circle cx={80} cy={76.6} r={0.95} fill={e.accent} />
        </g>
      )}
    </>
  );
};
const Ze = (e, t) => {
  let n = () => U(t, [e.accent, e.light, e.accentD]);
  return (
    <>
      <rect x={0} y={30} width={126} height={150} fill={e.mainL} />
      <rect x={0} y={26} width={130} height={6} fill={e.light} />
      {[20, 72].map((t) => (
        <g key={t}>
          <rect x={t} y={44} width={24} height={30} fill={e.dark} />
          <rect x={t - 7} y={44} width={7} height={30} fill={e.main} />
          <rect x={t + 24} y={44} width={7} height={30} fill={e.main} />
        </g>
      ))}
      <rect x={38} y={88} width={44} height={56} fill={e.glassBg} />
      <rect
        x={38}
        y={88}
        width={44}
        height={56}
        fill={`none`}
        stroke={e.dark}
        strokeWidth={3}
      />
      <rect x={58.5} y={88} width={3} height={56} fill={e.dark} />
      <rect x={27} y={88} width={11} height={56} fill={e.main} />
      <rect x={82} y={88} width={11} height={56} fill={e.main} />
      <rect x={22} y={142} width={76} height={5} fill={e.light} />
      <rect x={24} y={118} width={72} height={2.6} fill={e.dark} />
      {Array.from(
        {
          length: 11,
        },
        (t, n) => (
          <rect
            key={n}
            x={25 + n * 6.8}
            y={120}
            width={1.8}
            height={22}
            fill={e.dark}
          />
        ),
      )}
      {[28, 52, 76].map((t) => (
        <g key={t}>
          <ellipse cx={t + 6} cy={109} rx={8} ry={4} fill={e.green} />
          <circle cx={t + 2} cy={106} r={2.6} fill={n()} />
          <circle cx={t + 6.5} cy={104.5} r={2.6} fill={n()} />
          <circle cx={t + 10.5} cy={106.5} r={2.6} fill={n()} />
          <path
            d={`M${t} 111 H${t + 12} L${t + 10.5} 118 H${t + 1.5} Z`}
            fill={e.accentD}
          />
        </g>
      ))}
      <rect x={104} y={92} width={14} height={42} fill={e.dark} />
      {WComponent(e, 162, 160)}
      {t.has(`cartel`) && (
        <g>
          <rect x={153} y={94} width={18} height={24} fill={e.light} />
          <rect x={156} y={98} width={12} height={4} fill={e.accentD} />
          <rect x={156} y={105} width={12} height={2} fill={e.dark} />
          <rect x={156} y={110} width={9} height={2} fill={e.dark} />
        </g>
      )}
      <rect x={0} y={158} width={200} height={22} fill={e.ground} />
    </>
  );
};
const Qe = (e) => {
  let t = (
    <g>
      <g fill={e.dark}>
        <ellipse cx={72} cy={127} rx={13} ry={7.5} />
        <circle cx={60} cy={120} r={8.5} />
        <ellipse cx={54} cy={123.5} rx={5} ry={4} />
        <rect x={62} y={127} width={3.4} height={10} rx={1.2} />
        <rect x={80} y={127} width={3.4} height={10} rx={1.2} />
      </g>
      <path
        d={`M85 125 C92 121 93 113 89 111`}
        fill={`none`}
        stroke={e.dark}
        strokeWidth={2}
        strokeLinecap={`round`}
      />
    </g>
  );
  let n = (
    <path
      d={`M30 152 C36 124 50 116 62 128`}
      fill={`none`}
      stroke={e.light}
      strokeWidth={2.2}
      strokeLinecap={`round`}
      opacity={0.85}
    />
  );
  return (
    <>
      <path
        d={`M14 150 V100 H34 V88 L39 80 L44 88 V100 H74 V84 H84 V70 L100 50 L116 70 V84 H126 V100 H156 V88 L161 80 L166 88 V100 H186 V150 Z`}
        fill={e.far}
      />
      {[22, 50, 60, 132, 142, 170].map((t) => (
        <rect
          key={t}
          x={t}
          y={108}
          width={6}
          height={10}
          rx={3}
          fill={e.farL}
        />
      ))}
      <rect x={94} y={72} width={12} height={12} rx={6} fill={e.farL} />
      <ellipse cx={100} cy={154} rx={82} ry={12} fill={e.mainL} />
      <ellipse cx={100} cy={152} rx={74} ry={8} fill={e.neon} opacity={0.75} />
      <path
        d={`M68 152 C70 138 84 130 100 130 C116 130 130 138 132 152 Z`}
        fill={e.main}
      />
      <path d={`M84 132 H118 L114 114 H90 Z`} fill={e.dark} />
      <circle
        cx={110}
        cy={132}
        r={9}
        fill={e.main}
        stroke={e.dark}
        strokeWidth={2.4}
      />
      <circle cx={110} cy={132} r={2} fill={e.dark} />
      <path d={`M93 116 H107 L106 100 C106 92 94 92 94 100 Z`} fill={e.dark} />
      <circle cx={100} cy={88} r={4.5} fill={e.dark} />
      <rect x={96.5} y={81} width={7} height={4} fill={e.dark} />
      <rect x={108} y={82} width={1.8} height={30} fill={e.dark} />
      {t}
      <g transform={`translate(200 0) scale(-1 1)`}>{t}</g>
      {n}
      <g transform={`translate(200 0) scale(-1 1)`}>{n}</g>
    </>
  );
};
const EComponent = (e) => (
  <>
    <path d={`M104 150 V104 H200 V150 Z`} fill={e.far} />
    <rect x={140} y={72} width={26} height={34} fill={e.far} />
    <path d={`M138 72 L153 60 L168 72 Z`} fill={e.far} />
    <rect x={152.2} y={40} width={1.6} height={20} fill={e.far} />
    <circle cx={153} cy={44} r={3.4} fill={e.far} />
    <circle cx={153} cy={86} r={7} fill={e.light} opacity={0.85} />
    <path
      d={`M153 86 V81 M153 86 L156.5 88`}
      fill={`none`}
      stroke={e.dark}
      strokeWidth={1.2}
    />
    {[112, 124, 180, 190].map((t) => (
      <rect key={t} x={t} y={114} width={6} height={10} fill={e.farL} />
    ))}
    <rect x={40} y={140} width={80} height={20} fill={e.mainL} />
    <rect x={36} y={136} width={88} height={6} fill={e.light} />
    <path
      d={`M88 138 C90 118 86 100 78 84 L84 81 C92 98 97 118 97 138 Z`}
      fill={e.dark}
    />
    <path
      d={`M86 98 C94 92 102 88 110 80 L111.5 83 C103.5 91 95.5 96 88 102 Z`}
      fill={e.dark}
    />
    {[
      [70, 70, 17],
      [90, 60, 19],
      [111, 70, 16],
      [58, 84, 12],
      [102, 84, 12],
    ].map(([t, n, r]) => (
      <circle key={`${t}-${n}`} cx={t} cy={n} r={r} fill={e.green} />
    ))}
    <circle cx={84} cy={53} r={8} fill={e.greenL} />
    <circle cx={106} cy={62} r={6.5} fill={e.greenL} />
    {[
      [66, 66],
      [76, 77],
      [88, 58],
      [97, 70],
      [109, 64],
      [115, 76],
      [60, 86],
      [100, 87],
    ].map(([t, n]) => (
      <circle key={`${t}-${n}`} cx={t} cy={n} r={2.3} fill={e.accentD} />
    ))}
    <g fill={e.main}>
      <ellipse
        cx={70}
        cy={116}
        rx={11}
        ry={19}
        transform={`rotate(-12 70 116)`}
      />
      <circle cx={76} cy={94} r={7.5} />
      <circle cx={71} cy={88} r={2.8} />
      <circle cx={80.5} cy={87.5} r={2.8} />
      <ellipse cx={83} cy={96.5} rx={4.2} ry={3} />
      <rect
        x={74}
        y={100}
        width={15}
        height={5}
        rx={2.5}
        transform={`rotate(-28 74 100)`}
      />
      <rect
        x={76}
        y={110}
        width={13}
        height={5}
        rx={2.5}
        transform={`rotate(-8 76 110)`}
      />
      <rect x={61} y={128} width={8} height={9} rx={2.5} />
      <rect x={72} y={128} width={8} height={9} rx={2.5} />
    </g>
    <circle cx={85.5} cy={95.5} r={1.2} fill={e.dark} />
    <rect x={0} y={156} width={200} height={24} fill={e.ground} />
  </>
);
const EtComponent = (e, t) => {
  let n = () => U(t, [e.light, e.neon, e.accent, e.accentD]);
  let r = t.has(`castanera`) || t.has(`churreria`);
  let i = t.has(`titiritero`);
  return (
    <>
      <defs>
        <pattern
          id={t.id(`win`)}
          width={14}
          height={18}
          patternUnits={`userSpaceOnUse`}
        >
          <rect x={4} y={4} width={6} height={9} fill={e.farL} />
        </pattern>
      </defs>
      <rect x={0} y={60} width={46} height={100} fill={e.far} />
      <rect
        x={0}
        y={60}
        width={46}
        height={100}
        fill={`url(#${t.id(`win`)})`}
      />
      <rect x={160} y={48} width={40} height={112} fill={e.far} />
      <rect
        x={160}
        y={48}
        width={40}
        height={112}
        fill={`url(#${t.id(`win`)})`}
      />
      {r && (
        <g>
          <rect x={128} y={50} width={6} height={22} fill={e.dark} />
          <circle cx={131} cy={44} r={5} fill={e.light} opacity={0.55} />
          <circle cx={136} cy={34} r={6.5} fill={e.light} opacity={0.45} />
          <circle cx={131} cy={22} r={8} fill={e.light} opacity={0.35} />
        </g>
      )}
      <path d={`M42 86 H158 L150 70 H50 Z`} fill={e.dark} />
      <path d={`M96 70 L100 58 L104 70 Z`} fill={e.dark} />
      <rect x={40} y={86} width={120} height={4} fill={e.accent} />
      <rect x={52} y={90} width={96} height={64} fill={e.main} />
      {i ? (
        <g>
          {Array.from(
            {
              length: 6,
            },
            (t, n) => (
              <rect
                key={n}
                x={78 + (44 / 6) * n}
                y={96}
                width={44 / 6}
                height={24}
                fill={n % 2 ? e.light : e.accentD}
              />
            ),
          )}
          <circle cx={100} cy={93} r={5} fill={e.light} />
          <path d={`M95 91 L100 83 L105 91 Z`} fill={e.accent} />
        </g>
      ) : (
        <g>
          <rect x={78} y={96} width={44} height={24} fill={e.glassBg} />
          <circle cx={100} cy={106} r={5} fill={e.dark} />
          <path d={`M88 120 C88 111 112 111 112 120 Z`} fill={e.dark} />
        </g>
      )}
      <rect x={48} y={120} width={104} height={5} fill={e.light} />
      {[56, 66, 126, 136].flatMap((e) =>
        [97, 108].map((t) => KComponent(e, t, 8, 10, n(), `${e}-${t}`)),
      )}
      {[58, 76, 94, 112, 130].map((t) => (
        <g key={t}>
          <rect x={t} y={128} width={13} height={17} fill={e.light} />
          <rect x={t + 2} y={131} width={9} height={2.4} fill={e.dark} />
        </g>
      ))}
      <rect x={52} y={150} width={96} height={8} fill={e.dark} />
      <rect x={0} y={158} width={200} height={22} fill={e.ground} />
    </>
  );
};
const TtComponent = (e, t) => {
  let n = t.has(`tren`);
  let r = t.rand() < 0.5 ? 40 : 160;
  let d = `M-2 180 V76 Q100 -6 202 76 V180 Z`;
  return (
    <>
      <defs>
        <pattern
          id={t.id(`tiles`)}
          width={12}
          height={8}
          patternUnits={`userSpaceOnUse`}
        >
          <rect
            x={0.6}
            y={0.6}
            width={10.8}
            height={6.8}
            rx={1}
            fill={e.light}
            opacity={0.16}
          />
        </pattern>
      </defs>
      <path d={d} fill={e.mainL} />
      <path d={d} fill={`url(#${t.id(`tiles`)})`} />
      <rect
        x={16}
        y={104}
        width={32}
        height={22}
        fill={e.accent}
        stroke={e.light}
        strokeWidth={2}
      />
      <rect
        x={152}
        y={104}
        width={32}
        height={22}
        fill={e.neon}
        stroke={e.light}
        strokeWidth={2}
      />
      <path d={`M58 152 V114 A42 42 0 0 1 142 114 V152 Z`} fill={e.dark} />
      {n ? (
        <g>
          <path
            d={`M72 152 V112 Q72 98 86 98 H114 Q128 98 128 112 V152 Z`}
            fill={e.main}
          />
          <rect x={80} y={106} width={40} height={16} rx={4} fill={e.neon} />
          <circle cx={83} cy={137} r={3.6} fill={e.bulb} />
          <circle cx={117} cy={137} r={3.6} fill={e.bulb} />
          <circle cx={100} cy={134} r={5} fill={e.accent} />
          <rect x={72} y={146} width={56} height={4} fill={e.dark} />
        </g>
      ) : (
        <ellipse
          cx={100}
          cy={130}
          rx={16}
          ry={11}
          fill={e.bulb}
          opacity={0.28}
        />
      )}
      <rect x={0} y={152} width={200} height={28} fill={e.ground} />
      <rect x={0} y={152} width={200} height={3} fill={e.accent} />
      {SeComponent(e, r, 52)}
    </>
  );
};
const NtComponent = (e, t) => {
  let n = t.has(`rastro`);
  let r = U(t, [e.accent, e.accentD, e.neon]);
  let i = [e.accent, e.green, e.accentD];
  let a = Math.floor(t.rand() * 3);
  return (
    <>
      <path d={`M8 128 V76 Q100 30 192 76 V128 Z`} fill={e.far} />
      {[30, 88, 146].map((t) => (
        <path
          key={t}
          d={`M${t} 128 V96 A12 12 0 0 1 ${t + 24} 96 V128 Z`}
          fill={e.farL}
        />
      ))}
      <rect x={30} y={78} width={4} height={50} fill={e.dark} />
      <rect x={166} y={78} width={4} height={50} fill={e.dark} />
      {XeComponent(e, 24, 176, 64, 20, 8, r)}
      <rect x={22} y={120} width={156} height={5} fill={e.mainL} />
      <rect x={24} y={124} width={152} height={36} fill={e.main} />
      {n ? (
        <g>
          <rect x={38} y={106} width={22} height={14} fill={e.dark} />
          <path d={`M50 106 L42 88 C48 81 62 81 66 90 Z`} fill={e.accent} />
          <path
            d={`M92 120 V102 C92 90 114 90 114 102 V120 Z`}
            fill={`none`}
            stroke={e.dark}
            strokeWidth={1.8}
          />
          <path
            d={`M99 120 V94 M107 120 V94 M92 110 H114`}
            fill={`none`}
            stroke={e.dark}
            strokeWidth={1.2}
          />
          <rect x={132} y={96} width={3} height={24} fill={e.dark} />
          <path d={`M124 96 H143 L139 84 H128 Z`} fill={e.accentD} />
          <rect x={146} y={108} width={20} height={12} rx={2} fill={e.light} />
          <circle cx={156} cy={114} r={3.4} fill={e.dark} />
        </g>
      ) : (
        [0, 1, 2].map((t) => {
          let n = 36 + t * 44;
          let r = i[(t + a) % 3];
          return (
            <g key={t}>
              <rect
                x={n}
                y={110}
                width={36}
                height={12}
                fill={e.accentD}
                stroke={e.dark}
                strokeWidth={1.2}
              />
              {[0, 1, 2].map((e) => (
                <circle key={e} cx={n + 7 + e * 11} cy={107} r={5} fill={r} />
              ))}
              {[0, 1].map((e) => (
                <circle
                  key={`t${e}`}
                  cx={n + 12.5 + e * 11}
                  cy={99}
                  r={5}
                  fill={r}
                />
              ))}
            </g>
          );
        })
      )}
      <rect x={0} y={158} width={200} height={22} fill={e.ground} />
    </>
  );
};
const RtComponent = (e, t) => {
  let n = t.has(`vermut`)
    ? `vermut`
    : t.has(`te`)
      ? `tea`
      : t.has(`huevos`)
        ? `plate`
        : t.has(`cafe`)
          ? `cup`
          : U(t, [`cup`, `vermut`, `tea`]);
  let r = (
    <g>
      <g fill={e.dark}>
        <rect x={120} y={136} width={18} height={3} rx={1} />
        <rect x={120} y={112} width={2.6} height={46} />
        <rect x={135.4} y={138} width={2.6} height={20} />
      </g>
      <path
        d={`M121.3 115 C123 108 130 107 134 112`}
        fill={`none`}
        stroke={e.dark}
        strokeWidth={2.4}
      />
    </g>
  );
  return (
    <>
      <rect x={0} y={44} width={132} height={116} fill={e.mainL} />
      <rect x={0} y={40} width={136} height={5} fill={e.light} />
      <rect x={16} y={52} width={22} height={20} fill={e.dark} />
      <rect x={70} y={52} width={22} height={20} fill={e.dark} />
      {XeComponent(e, 2, 126, 80, 14, 6, e.accentD)}
      <rect x={10} y={102} width={70} height={52} fill={e.glassBg} />
      <rect
        x={10}
        y={102}
        width={70}
        height={52}
        fill={`none`}
        stroke={e.dark}
        strokeWidth={2.4}
      />
      <rect x={92} y={102} width={28} height={56} fill={e.dark} />
      <rect x={97} y={108} width={18} height={24} fill={e.bulb} opacity={0.8} />
      <rect x={130} y={48} width={14} height={2.4} fill={e.dark} />
      <rect x={139} y={50} width={1.4} height={4} fill={e.dark} />
      <circle cx={140} cy={62} r={9} fill={e.accent} />
      <path
        d={`M135.5 58.5 H143 V62 C143 65.5 135.5 65.5 135.5 62 Z M143 59.5 C146 59.5 146 63 143 63`}
        fill={e.dark}
      />
      <rect x={0} y={156} width={200} height={24} fill={e.ground} />
      {r}
      <g transform={`translate(312 0) scale(-1 1)`}>{r}</g>
      <ellipse cx={156} cy={128} rx={22} ry={4.5} fill={e.light} />
      <rect x={154.8} y={130} width={2.4} height={26} fill={e.dark} />
      <ellipse cx={156} cy={157} rx={10} ry={2.2} fill={e.dark} />
      {n === `cup` && (
        <g>
          <ellipse
            cx={154}
            cy={126}
            rx={8}
            ry={1.8}
            fill={e.light}
            stroke={e.dark}
            strokeWidth={0.8}
          />
          <path
            d={`M149 117 H159 V122 C159 126 149 126 149 122 Z`}
            fill={e.light}
            stroke={e.dark}
            strokeWidth={0.8}
          />
          <path
            d={`M152 113 C150 110 154 108 152 105`}
            fill={`none`}
            stroke={e.light}
            strokeWidth={1.2}
            opacity={0.8}
          />
        </g>
      )}
      {n === `vermut` && (
        <g>
          <path
            d={`M150 110 H160 L158 125 H152 Z`}
            fill={e.light}
            opacity={0.9}
          />
          <path d={`M150.9 115 H159.1 L158 125 H152 Z`} fill={e.accentD} />
          <circle cx={155} cy={113} r={1.8} fill={e.green} />
        </g>
      )}
      {n === `tea` && (
        <g>
          <path
            d={`M151 114 H159 L158 125 H152 Z`}
            fill={e.accentD}
            opacity={0.9}
          />
          <rect x={151} y={114} width={8} height={1.6} fill={e.accent} />
          <path d={`M162 119 C170 119 170 126 162 126 Z`} fill={e.accent} />
        </g>
      )}
      {n === `plate` && (
        <g>
          <ellipse
            cx={154}
            cy={125}
            rx={10}
            ry={2.4}
            fill={e.light}
            stroke={e.dark}
            strokeWidth={0.8}
          />
          <circle cx={152} cy={123} r={2.6} fill={e.accent} />
          <circle cx={157} cy={123.4} r={2} fill={e.accentD} />
        </g>
      )}
    </>
  );
};
const ItComponent = (e, t) => {
  let n = [`movida`, `noche`, `sala`, `jazz`, `reina`, `vinilo`].some((e) =>
    t.has(e),
  );
  let r = (e, t, n, r, i, a, o) => [
    (1 - o) ** 2 * e + 2 * (1 - o) * o * n + o * o * i,
    (1 - o) ** 2 * t + 2 * (1 - o) * o * r + o * o * a,
  ];
  let i = [-4, 30, 100, 80, 204, 26];
  let a = [-4, 62, 100, 112, 204, 70];
  let o = [e.accent, e.light, e.neon, e.accentD];
  let s = [0.3, 0.72].map((e) => r(...i, e));
  let c = t.has(`vinilo`)
    ? `record`
    : t.has(`sala`) || t.has(`jazz`)
      ? `note`
      : `ball`;
  let l = 50 + Math.round(t.rand() * 60);
  return (
    <>
      <path
        d={`M0 180 V112 H26 V98 H52 V114 H78 V102 H104 V118 H130 V96 H158 V110 H182 V100 H200 V180 Z`}
        fill={e.far}
      />
      {[8, 34, 60, 88, 112, 138, 166, 186].map((n, r) =>
        KComponent(
          n,
          122 + (r % 3) * 9,
          6,
          8,
          t.rand() < 0.6 ? e.bulb : e.farL,
          n,
        ),
      )}
      <path
        d={`M${i[0]} ${i[1]} Q${i[2]} ${i[3]} ${i[4]} ${i[5]}`}
        fill={`none`}
        stroke={e.dark}
        strokeWidth={1}
      />
      {n ? (
        <g>
          <path
            d={`M${a[0]} ${a[1]} Q${a[2]} ${a[3]} ${a[4]} ${a[5]}`}
            fill={`none`}
            stroke={e.dark}
            strokeWidth={1}
          />
          {Array.from(
            {
              length: 12,
            },
            (t, n) => {
              let [i, o] = r(...a, (n + 0.5) / 12);
              return (
                <circle
                  key={n}
                  cx={i}
                  cy={o + 2}
                  r={2.6}
                  fill={n % 3 == 1 ? e.neon : e.bulb}
                />
              );
            },
          )}
          <g
            transform={`translate(${l - 100} ${r(...i, (l + 4) / 208)[1] - 53})`}
          >
            <rect x={99.4} y={55} width={1.2} height={13} fill={e.dark} />
            {c === `record` ? (
              <g>
                <circle cx={100} cy={80} r={13} fill={e.dark} />
                <circle
                  cx={100}
                  cy={80}
                  r={9}
                  fill={`none`}
                  stroke={e.groove}
                  strokeWidth={1.2}
                />
                <circle cx={100} cy={80} r={4.2} fill={e.accent} />
                <circle cx={100} cy={80} r={1.1} fill={e.dark} />
              </g>
            ) : c === `note` ? (
              <path
                d={`M97 68 H112 V88 C112 92 105 93 105 89 C105 86 109 85 110 86 V74 H99 V92 C99 96 92 97 92 93 C92 90 96 89 97 90 Z`}
                fill={e.neon}
                stroke={e.dark}
                strokeWidth={1}
              />
            ) : (
              <g>
                <circle cx={100} cy={80} r={12} fill={e.light} />
                <path
                  d={`M88 80 H112 M90 73 H110 M90 87 H110 M100 68 V92 M93 70 C90 76 90 84 93 90 M107 70 C110 76 110 84 107 90`}
                  fill={`none`}
                  stroke={e.groove}
                  strokeWidth={0.9}
                />
              </g>
            )}
            <path
              d={`M116 66 L118 71 L123 73 L118 75 L116 80 L114 75 L109 73 L114 71 Z`}
              fill={e.light}
            />
          </g>
        </g>
      ) : (
        <g>
          <path
            d={`M${a[0]} ${a[1]} Q${a[2]} ${a[3]} ${a[4]} ${a[5]}`}
            fill={`none`}
            stroke={e.dark}
            strokeWidth={1}
          />
          {Array.from(
            {
              length: 12,
            },
            (e, t) => {
              let [n, i] = r(...a, (t + 0.5) / 12);
              return (
                <path
                  key={t}
                  d={`M${n - 5.5} ${i} H${n + 5.5} L${n} ${i + 11} Z`}
                  fill={o[t % 4]}
                />
              );
            },
          )}
          {s.map(([t, n], r) => (
            <g key={r}>
              <rect x={t - 0.6} y={n} width={1.2} height={6} fill={e.dark} />
              <ellipse
                cx={t}
                cy={n + 15}
                rx={7}
                ry={9}
                fill={r ? e.accent : e.accentD}
              />
              <rect x={t - 4} y={n + 5} width={8} height={2.4} fill={e.dark} />
              <rect
                x={t - 4}
                y={n + 22.6}
                width={8}
                height={2.4}
                fill={e.dark}
              />
            </g>
          ))}
        </g>
      )}
      {Array.from(
        {
          length: 11,
        },
        (t, n) => {
          let [a, o] = r(...i, (n + 0.5) / 11);
          return <circle key={n} cx={a} cy={o + 2.5} r={2.8} fill={e.bulb} />;
        },
      )}
      <rect x={0} y={160} width={200} height={20} fill={e.ground} />
    </>
  );
};
const AtComponent = (e) => {
  let t = (
    <g>
      <rect x={20} y={62} width={26} height={98} fill={e.mainL} />
      <rect x={18} y={60} width={30} height={4} fill={e.light} />
      <path d={`M27 98 V86 A6 6 0 0 1 39 86 V98 Z`} fill={e.dark} />
      <path d={`M30 97 C30 89 36 89 36 97 Z`} fill={e.accent} />
      <rect x={29} y={112} width={8} height={16} rx={4} fill={e.dark} />
      <path
        d={`M18 60 H48 L44 50 C40 44 36 34 33 18 C30 34 26 44 22 50 Z`}
        fill={e.dark}
      />
      <circle cx={33} cy={16} r={2.2} fill={e.accent} />
      <path
        d={`M33 3 V14 M29.5 7 H36.5`}
        fill={`none`}
        stroke={e.dark}
        strokeWidth={1.6}
      />
    </g>
  );
  return (
    <>
      <rect x={66} y={70} width={68} height={34} fill={e.mainL} />
      {[74, 90, 104, 120].map((t) => (
        <path
          key={t}
          d={`M${t} 98 V84 A3 3 0 0 1 ${t + 6} 84 V98 Z`}
          fill={e.dark}
        />
      ))}
      <path d={`M62 72 C62 34 138 34 138 72 Z`} fill={e.main} />
      <path
        d={`M100 44 V72 M83 48 L87 72 M117 48 L113 72`}
        fill={`none`}
        stroke={e.mainL}
        strokeWidth={1.4}
      />
      <rect x={94} y={30} width={12} height={15} fill={e.mainL} />
      <path d={`M92 31 C92 24 108 24 108 31 Z`} fill={e.main} />
      <path
        d={`M100 8 V24 M95 13 H105`}
        fill={`none`}
        stroke={e.dark}
        strokeWidth={2}
      />
      {t}
      <g transform={`translate(200 0) scale(-1 1)`}>{t}</g>
      <rect x={46} y={102} width={108} height={58} fill={e.shade} />
      <rect x={44} y={100} width={112} height={4} fill={e.light} />
      <circle cx={100} cy={114} r={7} fill={e.bulb} />
      <circle
        cx={100}
        cy={114}
        r={7}
        fill={`none`}
        stroke={e.dark}
        strokeWidth={1.6}
      />
      <path d={`M86 160 V132 A14 14 0 0 1 114 132 V160 Z`} fill={e.dark} />
      <path
        d={`M58 160 V136 A7 7 0 0 1 72 136 V160 Z M128 160 V136 A7 7 0 0 1 142 136 V160 Z`}
        fill={e.dark}
      />
      <rect x={0} y={158} width={200} height={22} fill={e.ground} />
    </>
  );
};
const OtComponent = (e, t) => {
  let n = t.has(`cristal`);
  let r = t.has(`encendida`);
  let i = n ? e.neon : e.mainL;
  return (
    <>
      <rect
        x={8}
        y={98}
        width={184}
        height={54}
        fill={i}
        opacity={n ? 0.85 : 1}
      />
      <rect x={4} y={94} width={192} height={5} fill={e.light} />
      {n ? (
        <path
          d={`M24 98 V152 M40 98 V152 M56 98 V152 M144 98 V152 M160 98 V152 M176 98 V152 M8 124 H68 M132 124 H192`}
          fill={`none`}
          stroke={e.dark}
          strokeWidth={1.2}
        />
      ) : (
        [16, 34, 52, 138, 156, 174].map((t) => (
          <rect
            key={t}
            x={t - 5}
            y={108}
            width={10}
            height={22}
            rx={5}
            fill={r ? e.bulb : e.dark}
          />
        ))
      )}
      <rect
        x={68}
        y={70}
        width={64}
        height={82}
        fill={i}
        opacity={n ? 0.9 : 1}
      />
      {n ? (
        <g>
          <path
            d={`M66 72 C66 26 134 26 134 72 Z`}
            fill={e.neon}
            opacity={0.9}
          />
          <path
            d={`M66 72 C66 26 134 26 134 72 M100 38 V72 M80 44 C84 54 86 62 86 72 M120 44 C116 54 114 62 114 72 M68 58 H132`}
            fill={`none`}
            stroke={e.dark}
            strokeWidth={1.3}
          />
          <rect x={95} y={30} width={10} height={9} fill={e.dark} />
          <path
            d={`M78 70 V152 M90 70 V152 M110 70 V152 M122 70 V152 M68 108 H132`}
            fill={`none`}
            stroke={e.dark}
            strokeWidth={1.2}
          />
        </g>
      ) : (
        <g>
          <path d={`M62 72 L100 46 L138 72 Z`} fill={e.mainL} />
          <path d={`M74 69 L100 52 L126 69 Z`} fill={e.main} />
          <rect x={62} y={70} width={76} height={4} fill={e.light} />
          {[76, 88, 108, 120].map((t) => (
            <rect key={t} x={t} y={76} width={4} height={70} fill={e.light} />
          ))}
        </g>
      )}
      <path d={`M92 152 V122 A8 8 0 0 1 108 122 V152 Z`} fill={e.dark} />
      <rect x={0} y={150} width={200} height={30} fill={e.ground} />
      <path
        d={`M90 180 L110 180 L105 150 L95 150 Z`}
        fill={e.light}
        opacity={0.35}
      />
      <rect x={4} y={146} width={76} height={9} rx={4.5} fill={e.green} />
      <rect x={120} y={146} width={76} height={9} rx={4.5} fill={e.green} />
      {[18, 62, 138, 182].map((t) => (
        <path
          key={t}
          d={`M${t - 7} 150 L${t} 118 L${t + 7} 150 Z`}
          fill={e.green}
        />
      ))}
    </>
  );
};
const J = {
  tavern: {
    draw: GeComponent,
    words: [`cana`],
    bespoke: true,
  },
  records: {
    draw: Ke,
    words: [`discos`],
    bespoke: true,
  },
  cinema: {
    draw: QeComponent,
    words: [`dore`],
    bespoke: true,
  },
  arch: {
    draw: Je,
    words: [`alcala`],
    bespoke: true,
  },
  tree: {
    draw: YeComponent,
    words: [`ahuehuete`],
    bespoke: true,
  },
  metro: {
    draw: TtComponent,
    words: [`metro`, `anden`],
  },
  entrance: {
    draw: TeComponent,
    words: [`estacion`, `boca`, `entrada`],
  },
  train: {
    draw: EeComponent,
    words: [`tren`, `fantasma`, `vagon`],
  },
  ticketHall: {
    draw: DeComponent,
    words: [`taquilla`, `billete`, `anden`],
  },
  kiosk: {
    draw: EtComponent,
    words: [`kiosco`, `prensa`, `castanera`, `churreria`, `titiritero`],
    mirror: true,
  },
  market: {
    draw: NtComponent,
    words: [`mercado`, `puesto`, `rastro`, `frutero`, `samosas`],
    mirror: true,
  },
  hall: {
    draw: OeComponent,
    words: [`mercado`, `cebada`, `ildefonso`, `vallehermoso`],
  },
  bar: {
    draw: KeComponent,
    words: [`huevos`, `tapas`, `barra`, `bar`, `lactea`, `churreria`],
  },
  meson: {
    draw: AeComponent,
    words: [`meson`, `bodega`, `taberna`],
    mirror: true,
  },
  terrace: {
    draw: RtComponent,
    words: [`cafe`, `vermut`, `te`, `terraza`, `meson`],
    mirror: true,
  },
  street: {
    draw: JeComponent,
    words: [`taxi`, `bici`, `coche`, `reparto`, `rastro`],
  },
  boutique: {
    draw: MeComponent,
    words: [`escaparate`, `boutique`, `moda`],
  },
  shopfront: {
    draw: NeComponent,
    words: [`guanteria`, `tatuador`, `tienda`],
  },
  gallery: {
    draw: PeComponent,
    words: [`galeria`, `museo`, `sorolla`, `arte`, `pintura`],
  },
  mural: {
    draw: FeComponent,
    words: [`mural`, `grafiti`, `cartel`, `conciertos`],
    mirror: true,
  },
  factory: {
    draw: IeComponent,
    words: [`tabacalera`, `fabrica`],
    mirror: true,
  },
  theatre: {
    draw: LeComponent,
    words: [`teatro`, `sala`, `club`, `titiritero`, `jazz`],
  },
  corrala: {
    draw: ReComponent,
    words: [`corrala`, `patio`, `vecinos`],
  },
  figure: {
    draw: ZeComponent,
    words: [`chulapa`, `dama`, `reina`],
    mirror: true,
  },
  monument: {
    draw: BeComponent,
    words: [`angel`, `heroina`, `monumento`, `estatua`],
  },
  fountain: {
    draw: Qe,
    words: [`fuente`, `cibeles`, `alcachofa`, `angel`, `neptuno`],
    seed: true,
  },
  boat: {
    draw: VeComponent,
    words: [`barca`, `remo`],
    mirror: true,
  },
  lake: {
    draw: (e, t) => {
      let n = 50 + t.rand() * 40;
      return (
        <>
          <defs>
            <pattern
              id={t.id(`cols`)}
              width={8}
              height={22}
              patternUnits={`userSpaceOnUse`}
            >
              <rect
                x={2}
                width={3.2}
                height={22}
                fill={e.light}
                opacity={0.3}
              />
            </pattern>
          </defs>
          {[0, 22, 44, 66, 134, 156, 178, 200].map((t, n) => (
            <circle
              key={t}
              cx={t}
              cy={104}
              r={14 + ((n * 7) % 5)}
              fill={e.green}
            />
          ))}
          <rect x={40} y={92} width={120} height={22} fill={e.farL} />
          <rect
            x={40}
            y={92}
            width={120}
            height={22}
            fill={`url(#${t.id(`cols`)})`}
          />
          <rect x={38} y={89} width={124} height={4} fill={e.far} />
          <rect x={90} y={58} width={20} height={56} fill={e.farL} />
          <rect x={87} y={56} width={26} height={4} fill={e.far} />
          <g fill={e.dark}>
            <ellipse cx={100} cy={48} rx={9} ry={4.5} />
            <path d={`M106 46 L111 37 L114.5 39 L110 49 Z`} />
            <rect x={93} y={50} width={2} height={7} />
            <rect x={105} y={50} width={2} height={7} />
            <rect x={98} y={36} width={4} height={10} />
            <circle cx={100} cy={33.5} r={2.3} />
          </g>
          <rect x={0} y={112} width={200} height={68} fill={e.mainL} />
          {[
            [146, 118, 18, 2.2],
            [146, 125, 12, 1.6],
            [146, 131, 7, 1.2],
          ].map(([t, n, r, i]) => (
            <ellipse
              key={n}
              cx={t}
              cy={n}
              rx={r}
              ry={i}
              fill={e.accent}
              opacity={0.8}
            />
          ))}
          {[
            [14, 122, 18],
            [70, 118, 14],
            [30, 134, 12],
            [112, 140, 16],
            [168, 142, 14],
            [60, 158, 20],
            [150, 156, 12],
          ].map(([t, n, r]) => (
            <rect
              key={`${t}-${n}`}
              x={t}
              y={n}
              width={r}
              height={1.4}
              fill={e.neon}
              opacity={0.7}
            />
          ))}
          <g fill={e.dark}>
            <path d={`M${n - 26} 142 H${n + 26} L${n + 18} 152 H${n - 18} Z`} />
            <path d={`M${n - 5} 142 L${n - 3} 129 H${n + 3} L${n + 5} 142 Z`} />
            <circle cx={n} cy={126} r={3.6} />
          </g>
          <path
            d={`M${n} 134 L${n - 32} 150 M${n} 134 L${n + 32} 150`}
            fill={`none`}
            stroke={e.dark}
            strokeWidth={1.4}
          />
          <path
            d={`M160 124 H178 L174 129 H164 Z`}
            fill={e.dark}
            opacity={0.8}
          />
        </>
      );
    },
    words: [`estanque`, `lago`, `alfonso`],
  },
  squirrel: {
    draw: HeComponent,
    words: [`ardilla`],
    mirror: true,
  },
  garden: {
    draw: UeComponent,
    words: [`rosaleda`, `flores`, `jardin`, `rosas`],
    mirror: true,
  },
  park: {
    draw: (e, t) => {
      let n = () => U(t, [e.accentD, e.light, e.accent]);
      return (
        <>
          <rect x={0} y={108} width={200} height={72} fill={e.ground} />
          {[0, 22, 44, 66, 88, 110, 132, 154, 176, 198].map((t, n) => (
            <circle key={t} cx={t} cy={108} r={11 + (n % 3) * 3} fill={e.far} />
          ))}
          <rect x={0} y={104} width={200} height={8} fill={e.far} />
          <path
            d={`M60 180 L140 180 L106 110 L94 110 Z`}
            fill={e.light}
            opacity={0.4}
          />
          {GComponent(e, 22, 148, 1.25, `l`)}
          {GComponent(e, 184, 146, 1.15, `r`)}
          {WComponent(e, 58, 158)}
          <g fill={e.dark}>
            <rect x={130} y={128} width={40} height={3} />
            <rect x={130} y={122} width={40} height={3} />
            <rect x={128} y={136} width={44} height={3.6} />
            <rect x={132} y={139} width={3} height={14} />
            <rect x={165} y={139} width={3} height={14} />
          </g>
          {[
            [86, 152],
            [120, 154],
            [150, 160],
          ].map(([t, r]) => (
            <g key={t}>
              <ellipse cx={t} cy={r} rx={13} ry={6} fill={e.green} />
              <circle cx={t - 6} cy={r - 2.5} r={2.3} fill={n()} />
              <circle cx={t + 1} cy={r - 4} r={2.3} fill={n()} />
              <circle cx={t + 7} cy={r - 1.5} r={2.3} fill={n()} />
            </g>
          ))}
          {t.has(`perrito`) && (
            <g>
              <path
                d={`M92 150 L104 128`}
                fill={`none`}
                stroke={e.dark}
                strokeWidth={1}
              />
              <g fill={e.dark}>
                <ellipse cx={92} cy={154} rx={11} ry={5} />
                <circle cx={82} cy={148} r={4.6} />
                <path d={`M78.4 146 L76 152 L80.2 150 Z`} />
                <rect x={84} y={156} width={2.4} height={6} />
                <rect x={98} y={156} width={2.4} height={6} />
                <path
                  d={`M102 152 C107 150 108 146 106 143`}
                  fill={`none`}
                  stroke={e.dark}
                  strokeWidth={1.8}
                  strokeLinecap={`round`}
                />
              </g>
              <path
                d={`M86 150 H100 C102 150 103 153 101 156 H86 Z`}
                fill={e.accentD}
              />
            </g>
          )}
          {t.has(`ardilla`) && (
            <g fill={e.dark}>
              <path
                d={`M158 136 C150 136 146 128 150 122 C153 117 160 120 158 126 C157 130 162 132 162 136 Z`}
              />
              <ellipse cx={144} cy={131} rx={5} ry={5.5} />
              <circle cx={140.5} cy={125} r={3.4} />
              <path d={`M139.5 122.5 L140 119 L142 122 Z`} />
              <circle cx={139.4} cy={124.6} r={0.7} fill={e.light} />
            </g>
          )}
        </>
      );
    },
    words: [`retiro`, `paseo`, `parque`, `perrito`, `isidro`, `pradera`],
    mirror: true,
  },
  glasshouse: {
    draw: (e, t) =>
      OtComponent(e, {
        ...t,
        has: (e) => e === `cristal` || t.has(e),
      }),
    words: [`cristal`, `invernadero`],
  },
  mansion: {
    draw: We,
    words: [`marques`, `palacete`, `lazaro`, `galdiano`],
    mirror: true,
  },
  palace: {
    draw: OtComponent,
    words: [`palacio`, `museo`, `instituto`, `encendida`],
  },
  verbena: {
    draw: ItComponent,
    words: [
      `fiesta`,
      `verbena`,
      `chulapa`,
      `chulapo`,
      `organillero`,
      `movida`,
      `noche`,
      `vinilo`,
      `jazz`,
    ],
    mirror: true,
  },
  bear: {
    draw: EComponent,
    words: [`oso`, `madrono`, `sol`],
    seed: true,
  },
  towers: {
    draw: AtComponent,
    words: [
      `san`,
      `iglesia`,
      `basilica`,
      `catedral`,
      `ermita`,
      `francisco`,
      `grande`,
    ],
    seed: true,
  },
  balcony: {
    draw: Ze,
    words: [
      `balcon`,
      `farola`,
      `calle`,
      `plaza`,
      `cartel`,
      `portero`,
      `esquina`,
      `flores`,
      `dama`,
    ],
    seed: true,
    mirror: true,
  },
  rooftops: {
    draw: Xe,
    words: [`gato`, `tejado`, `azotea`, `vistillas`, `casa`, `noche`],
    seed: true,
  },
};
export const o = Object.keys(J);
export const s = o.filter((e) => J[e].seed);
const st = (e) => J[e].words;
const ct = (e) => e.normalize(`NFD`).replace(/\p{M}/gu, ``).toLowerCase();
const lt = (e) =>
  new Set(
    ct(e)
      .split(/[^a-z0-9]+/)
      .filter(Boolean),
  );
const Z = (e) => J[e];
const ut = (scene, t) => !!Z(scene).mirror && ((t >>> 9) & 1) == 1;
function dt(e) {
  let t = lt(e);
  return o.filter((e) => Z(e).words.some((e) => t.has(e)));
}
function ft(e, name, n) {
  let r = S(e);
  let scene = n ?? dt(name)[0] ?? s[r % s.length];
  let a = lt(name);
  return {
    scene,
    word: Z(scene).words.find((e) => a.has(e)),
    flip: ut(scene, r),
  };
}
const pt = o.filter((e) => !Z(e).bespoke);
function mt(e) {
  let t = new Map();
  let n = new Set();
  let r = (e, r) => {
    n.add(r);
    t.set(e, r);
  };
  let i = [];
  for (let t of e) {
    let e = dt(t.name).find((e) => !n.has(e));
    if (e) {
      r(t.id, e);
    } else {
      i.push(t);
    }
  }
  for (let e of i) {
    let t = [s, pt]
      .map((e) => e.filter((e) => !n.has(e)))
      .find((e) => e.length);
    r(e.id, t ? t[S(e.id) % t.length] : ft(e.id, e.name).scene);
  }
  return t;
}
const ht = new WeakMap();
function gt(e, t) {
  let n = ht.get(e);
  if (!n) {
    n = mt(e);
    ht.set(e, n);
  }
  return n.get(t);
}
function TComponent(e, seed, name, r, id) {
  let a = lt(name);
  let c = {
    id,
    rand: k_1(S(`${seed}:${e.scene}`)),
    has: (e) => a.has(e),
  };
  let l = J[e.scene].draw(r, c);
  if (e.flip) {
    return <g transform={`translate(200 0) scale(-1 1)`}>{l}</g>;
  }
  return l;
}
const Q = 240;
const $ = 336;
const vt = 18;
const yt = `var(--font-display)`;
const bt = `var(--font-mono)`;
const xt = {
  sm: {
    bar: 40,
    title: 38,
    maxLines: 2,
    mono: 15,
    label: 0,
    tracking: 0.6,
  },
  md: {
    bar: 36,
    title: 33,
    maxLines: 3,
    mono: 11.5,
    label: 14.5,
    tracking: 0.8,
  },
  lg: {
    bar: 36,
    title: 33,
    maxLines: 3,
    mono: 10.5,
    label: 14,
    tracking: 1,
  },
};
const St = 30;
const Ct = (e, t) => $ - xt[e].bar - (t ? St : 0);
const wt = (e = `md`, t = false) => 1 - Ct(e, t) / $;
const Tt = (e, t, n) =>
  `M${e} ${t - n} L${e + n * 0.28} ${t - n * 0.28} L${e + n} ${t} L${e + n * 0.28} ${t + n * 0.28} L${e} ${t + n} L${e - n * 0.28} ${t + n * 0.28} L${e - n} ${t} L${e - n * 0.28} ${t - n * 0.28} Z`;
const Et = N.memo(
  ({
    seed,
    name,
    setColor,
    rarity,
    scene,
    setCode,
    number,
    serial,
    printRun,
    rarityLabel,
    rarityColor,
    size = `md`,
    flavour = false,
    variant = `card`,
    className,
  }) => {
    let ne = N.useId().replace(/:/g, ``);
    let h = (e) => `${e}-${ne}`;
    let g = ft(seed, name, scene);
    if (variant === `ghost`) {
      return (
        <svg
          viewBox={`0 0 200 160`}
          preserveAspectRatio={`xMidYMax meet`}
          className={className}
          aria-hidden
        >
          {TComponent(g, seed, name, be(setColor), h)}
        </svg>
      );
    }
    let _ = ye(setColor);
    let v = xt[size];
    let y = Ct(size, flavour);
    let b = ge(name, 204, v.title, v.maxLines, 0.5);
    let re = 80 + 16 * Math.max(1, b.lines.length);
    let x = (
      <linearGradient id={h(`sky`)} x1={`0`} y1={`0`} x2={`0`} y2={`1`}>
        <stop offset={`0`} stopColor={_.skyTop} />
        <stop offset={`1`} stopColor={_.skyBottom} />
      </linearGradient>
    );
    let S = (
      <>
        <rect width={Q} height={$} fill={`url(#${h(`sky`)})`} />
        <circle
          cx={176}
          cy={variant === `scene` ? 112 : re}
          r={44}
          fill={_.accent}
          opacity={0.95}
        />
        <g transform={`translate(0 ${y - 192}) scale(1.2)`}>
          {TComponent(g, seed, name, _, h)}
        </g>
      </>
    );
    if (variant === `scene`) {
      return (
        <svg
          viewBox={`0 88 ${Q} ${y - 88}`}
          preserveAspectRatio={`xMidYMid slice`}
          className={className}
          aria-hidden
        >
          <defs>{x}</defs>
          {S}
        </svg>
      );
    }
    let C = rarity === `rare` || rarity === `epic` || rarity === `legendary`;
    let w = rarity === `legendary`;
    let T =
      rarity === `epic`
        ? [
            [0.18, 0.2, 5],
            [0.82, 0.16, 7],
            [0.7, 0.62, 4],
          ]
        : w
          ? [
              [0.16, 0.18, 6],
              [0.86, 0.28, 8],
              [0.3, 0.7, 4],
              [0.78, 0.78, 5],
            ]
          : [];
    let ie = serial ? S_2(serial, printRun) : printRun ? `×${printRun}` : ``;
    let E = [[setCode, number].filter(Boolean).join(` `), ie]
      .filter(Boolean)
      .join(` · `);
    let D = v.label && rarityLabel ? fe(rarityLabel) : ``;
    let O = me(E) * v.mono + v.tracking * [...E].length;
    let k = D ? pe(D, 800) * v.label + v.tracking * [...D].length : 0;
    let A = size === `sm` ? 5 : 3.4;
    let j = Math.min(1, 204 / (O + 12 + k + (D ? 6 : 0) + 2 * A));
    let M = $ - v.bar / 2 + v.mono * 0.36;
    let P = 222 - (D ? (k + 6) * j : 0) - A * j;
    let F = M - (D ? v.label * 0.36 : v.mono * 0.37) * j;
    let I = {
      dx: b.size * 0.045,
      dy: b.size * 0.06,
    };
    let L = (e) => vt + b.size * 0.727 + e * b.size * 0.909;
    return (
      <svg viewBox={`0 0 ${Q} ${$}`} className={className} aria-hidden>
        <defs>
          {x}
          {size !== `sm` && (
            <>
              <pattern
                id={h(`dots`)}
                width={6}
                height={6}
                patternUnits={`userSpaceOnUse`}
              >
                <circle cx={3} cy={3} r={1.25} fill={_.dark} />
              </pattern>
              <linearGradient
                id={h(`fade`)}
                x1={`0`}
                y1={`0`}
                x2={`0`}
                y2={`1`}
              >
                <stop offset={`0`} stopColor={`#fff`} stopOpacity={0} />
                <stop offset={`1`} stopColor={`#fff`} />
              </linearGradient>
              <mask id={h(`halftone`)}>
                <rect
                  y={150}
                  width={Q}
                  height={186}
                  fill={`url(#${h(`fade`)})`}
                />
              </mask>
            </>
          )}
          {C && (
            <>
              <linearGradient
                id={h(`holo`)}
                x1={`0`}
                y1={`0`}
                x2={`1`}
                y2={`1`}
              >
                {w ? (
                  <>
                    <stop offset={`0`} stopColor={`#fff4c2`} />
                    <stop offset={`.5`} stopColor={`#f3c64f`} />
                    <stop offset={`1`} stopColor={`#fff4c2`} />
                  </>
                ) : (
                  <>
                    <stop offset={`0`} stopColor={`#ff6f91`} />
                    <stop offset={`.22`} stopColor={`#ffc75f`} />
                    <stop offset={`.4`} stopColor={`#f9f871`} />
                    <stop offset={`.56`} stopColor={`#6ef3a5`} />
                    <stop offset={`.72`} stopColor={`#4ec9ff`} />
                    <stop offset={`.88`} stopColor={`#b58cff`} />
                    <stop offset={`1`} stopColor={`#ff6f91`} />
                  </>
                )}
              </linearGradient>
              <linearGradient
                id={h(`streak`)}
                x1={`0`}
                y1={`0`}
                x2={`1`}
                y2={`1`}
              >
                <stop offset={`.34`} stopColor={`#fff`} stopOpacity={0} />
                <stop offset={`.47`} stopColor={`#fff`} stopOpacity={0.3} />
                <stop offset={`.6`} stopColor={`#fff`} stopOpacity={0} />
              </linearGradient>
            </>
          )}
        </defs>
        {S}
        {size !== `sm` && (
          <rect
            width={Q}
            height={$}
            fill={`url(#${h(`dots`)})`}
            mask={`url(#${h(`halftone`)})`}
            opacity={0.22}
          />
        )}
        {rarity === `uncommon` && (
          <rect
            x={3}
            y={3}
            width={234}
            height={y - 6}
            rx={10}
            fill={`none`}
            stroke={setColor}
            strokeWidth={2}
          />
        )}
        {C && (
          <>
            <rect
              width={Q}
              height={y}
              fill={`url(#${h(`holo`)})`}
              opacity={w ? 0.5 : 0.34}
              style={{
                mixBlendMode: w ? `soft-light` : `overlay`,
              }}
            />
            <rect
              width={Q}
              height={y}
              fill={`url(#${h(`streak`)})`}
              style={{
                mixBlendMode: `screen`,
              }}
            />
          </>
        )}
        {T.length > 0 && (
          <path
            d={T.map(([e, t, n]) => Tt(e * Q, t * y, n)).join(` `)}
            fill={w ? `#fff6cc` : `#ffffff`}
            opacity={0.92}
          />
        )}
        <g
          fontFamily={yt}
          fontWeight={900}
          fontSize={b.size}
          letterSpacing={0.5}
        >
          {b.lines.map((e, t) => (
            <text
              key={`s${t}`}
              x={vt + I.dx}
              y={L(t) + I.dy}
              fill={_.main}
              opacity={0.85}
            >
              {e}
            </text>
          ))}
          {b.lines.map((e, t) => (
            <text key={t} x={vt} y={L(t)} fill={_.light}>
              {e}
            </text>
          ))}
        </g>
        <rect y={y} width={Q} height={$ - y} fill={_.dark} />
        {E && (
          <text
            x={vt}
            y={M}
            fontFamily={bt}
            fontWeight={size === `sm` ? 700 : 500}
            fontSize={v.mono * j}
            letterSpacing={v.tracking * j}
            fill={_.light}
          >
            {E}
          </text>
        )}
        <circle cx={P} cy={F} r={A * j} fill={rarityColor ?? v_1[rarity]} />
        {D && (
          <text
            x={222}
            y={M}
            textAnchor={`end`}
            fontFamily={yt}
            fontWeight={800}
            fontSize={v.label * j}
            letterSpacing={v.tracking * j}
            fill={_.accent}
          >
            {D}
          </text>
        )}
      </svg>
    );
  },
);
const Dt = N.memo(({ className }) => {
  let t = N.useId().replace(/:/g, ``);
  let n = (e) => `${e}-${t}`;
  let d = ``;
  for (let e = 0; e < 28; e += 2) {
    let t = (e / 28) * Math.PI * 2;
    let n = ((e + 1) / 28) * Math.PI * 2;
    d += `M120 168 L${(120 + Math.cos(t) * 320).toFixed(1)} ${(168 + Math.sin(t) * 320).toFixed(1)} L${(120 + Math.cos(n) * 320).toFixed(1)} ${(168 + Math.sin(n) * 320).toFixed(1)} Z `;
  }
  return (
    <svg viewBox={`0 0 ${Q} ${$}`} className={className} aria-hidden>
      <defs>
        <linearGradient id={n(`night`)} x1={`0`} y1={`0`} x2={`0`} y2={`1`}>
          <stop offset={`0`} stopColor={`#40193F`} />
          <stop offset={`1`} stopColor={B} />
        </linearGradient>
        <pattern
          id={n(`dots`)}
          width={6}
          height={6}
          patternUnits={`userSpaceOnUse`}
        >
          <circle cx={3} cy={3} r={1.25} fill={V} />
        </pattern>
        <linearGradient id={n(`fade`)} x1={`0`} y1={`0`} x2={`0`} y2={`1`}>
          <stop offset={`0`} stopColor={`#fff`} stopOpacity={0} />
          <stop offset={`1`} stopColor={`#fff`} />
        </linearGradient>
        <mask id={n(`halftone`)}>
          <rect y={200} width={Q} height={136} fill={`url(#${n(`fade`)})`} />
        </mask>
      </defs>
      <rect width={Q} height={$} fill={`url(#${n(`night`)})`} />
      <path d={d} fill={V} opacity={0.12} />
      <rect
        width={Q}
        height={$}
        fill={`url(#${n(`dots`)})`}
        mask={`url(#${n(`halftone`)})`}
        opacity={0.16}
      />
      <circle cx={120} cy={168} r={54} fill={V} />
      <circle
        cx={120}
        cy={168}
        r={46}
        fill={`none`}
        stroke={B}
        strokeWidth={1.6}
        opacity={0.35}
      />
      <g fontFamily={yt} textAnchor={`middle`}>
        <text
          x={120}
          y={185}
          fontSize={48}
          fontWeight={900}
          fill={B}
        >{`CM`}</text>
        <text
          x={120}
          y={78}
          fontSize={46}
          fontWeight={900}
          letterSpacing={1.5}
          fill={_e}
        >{`CARDS`}</text>
        <text
          x={123.5}
          y={270}
          fontSize={17}
          fontWeight={800}
          letterSpacing={7}
          fill={V}
        >{`OF MADRID`}</text>
      </g>
      <rect
        x={9}
        y={9}
        width={222}
        height={318}
        rx={7}
        fill={`none`}
        stroke={_e}
        strokeOpacity={0.3}
        strokeWidth={1.5}
      />
    </svg>
  );
});
function Ot({
  id,
  name,
  rarity,
  setCode,
  setName,
  setColor = `#5C6B73`,
  scene,
  serial,
  printRun,
  rarityLabel,
  rarityColor,
  flavour,
  yourValue,
  currency = `P`,
  size = `md`,
  faceDown,
  empty,
  secret,
  tilt,
  selected,
  onClick,
  className,
  style,
}) {
  let E = useLe();
  let rarityColor_1 = rarityColor ?? v_1[rarity] ?? `#9AA4B8`;
  let setCode_1 = setCode ?? O_1(id).set;
  let number = String(O_1(id).number).padStart(2, `0`);
  let A = (tilt ?? size !== `sm`) && !E && !empty;
  let j = w(rarity) && !faceDown && !empty;
  let rarityLabel_1 = rarityLabel ?? y[rarity] ?? rarity;
  let N = useP(0);
  let F = useP(0);
  let rotateX = ce(N, {
    stiffness: 260,
    damping: 20,
    mass: 0.6,
  });
  let rotateY = ce(F, {
    stiffness: 260,
    damping: 20,
    mass: 0.6,
  });
  let onPointerMove = (e) => {
    let t = e.currentTarget.getBoundingClientRect();
    let n = (e.clientX - t.left) / t.width;
    let r = (e.clientY - t.top) / t.height;
    e.currentTarget.style.setProperty(`--mx`, `${(n * 100).toFixed(1)}%`);
    e.currentTarget.style.setProperty(`--my`, `${(r * 100).toFixed(1)}%`);
    if (A) {
      F.set((n - 0.5) * 16);
      N.set((0.5 - r) * 16);
    }
  };
  let onPointerLeave = () => {
    N.set(0);
    F.set(0);
  };
  let onKeyDown = (e) => {
    if (onClick && (e.key === `Enter` || e.key === ` `)) {
      e.preventDefault();
      onClick();
    }
  };
  let ue = faceDown
    ? `Face-down card`
    : `${id} ${name}${setName ? `, ${setName}` : ``}, ${rarityLabel_1}${serial ? `, ${S_2(serial, printRun)}` : ``}${empty ? `, not collected yet` : ``}`;
  let flavour_1 = size === `lg` && !!flavour;
  let de = {
    "--rar": rarityColor_1,
    "--set": setColor,
    "--cromo-bar": `${(wt(size, flavour_1) * 100).toFixed(2)}%`,
    ...style,
  };
  return (
    <Y.div
      className={r(
        `cromo`,
        `cromo--${size}`,
        !faceDown && !empty && `cromo--${rarity}`,
        faceDown && `cromo--back`,
        empty && `cromo--empty`,
        className,
      )}
      style={{
        ...de,
        rotateX,
        rotateY,
        transformPerspective: 900,
      }}
      whileHover={
        A
          ? {
              y: -5,
              scale: 1.02,
            }
          : undefined
      }
      whileTap={
        onClick && !E
          ? {
              scale: 0.98,
            }
          : undefined
      }
      transition={{
        type: `spring`,
        stiffness: 300,
        damping: 22,
      }}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      onClick={onClick}
      onKeyDown={onKeyDown}
      role={onClick ? `button` : `img`}
      tabIndex={onClick ? 0 : undefined}
      aria-label={ue}
      aria-pressed={onClick && selected !== undefined ? selected : undefined}
      data-clickable={onClick ? `true` : undefined}
      data-selected={selected ? `true` : undefined}
    >
      <div className={`cromo__inner`}>
        {faceDown ? (
          <Dt className={`cromo__face`} />
        ) : empty ? (
          <>
            <Et
              seed={id}
              name={name}
              setColor={setColor}
              rarity={rarity}
              scene={scene}
              variant={`ghost`}
              className={`cromo__ghost`}
            />
            <div className={`cromo__slot-no`}>{number}</div>
            <div className={`cromo__slot-name`}>{name}</div>
          </>
        ) : (
          <>
            <Et
              seed={id}
              name={name}
              setColor={setColor}
              rarity={rarity}
              scene={scene}
              setCode={setCode_1}
              number={number}
              serial={serial}
              printRun={printRun}
              rarityLabel={rarityLabel_1}
              rarityColor={rarityColor_1}
              size={size}
              flavour={flavour_1}
              className={`cromo__face`}
            />
            {flavour_1 && <div className={`cromo__flavour`}>{flavour}</div>}
            {secret && <span className={`cromo__secret`}>{`secreto`}</span>}
            {yourValue != null && (
              <span
                className={`cromo__value`}
                title={`What this copy is worth to you`}
              >
                <small>{`value`}</small>
                {v_2(yourValue, {
                  symbol: currency,
                  decimals: Math.abs(yourValue) < 100 && yourValue % 1 ? 1 : 0,
                })}
              </span>
            )}
          </>
        )}
      </div>
      {j && <div className={`cromo__edge`} aria-hidden />}
      {j && <div className={`cromo__foil`} aria-hidden />}
      {!empty && <div className={`cromo__glare`} aria-hidden />}
    </Y.div>
  );
}
function kt(e, t, n) {
  return {
    id: e.id,
    name: e.name,
    rarity: e.rarity,
    setCode: t.id,
    setName: t.name,
    setColor: t.color,
    scene: gt(t.cards, e.id),
    printRun: e.print_run,
    rarityLabel: n?.rarityLabel(e.rarity),
    rarityColor: n?.rarityColor(e.rarity),
    flavour: e.flavour,
    secret: e.hidden,
    currency: n?.symbol,
  };
}
function At(e, t, n = {}) {
  let r = t?.cards.get(e);
  if (r) {
    return {
      ...kt(r.card, r.set, t),
      ...n,
    };
  }
  return {
    id: e,
    name: e,
    rarity: `common`,
    ...n,
  };
}
function JtComponent({ revealed, delay = 0, ...rest }) {
  let r = useLe();
  let style = {
    backfaceVisibility: `hidden`,
    WebkitBackfaceVisibility: `hidden`,
  };
  return (
    <div
      className={`relative inline-block`}
      style={{
        perspective: 1100,
      }}
    >
      <Y.div
        initial={false}
        animate={{
          rotateY: revealed ? 180 : 0,
        }}
        transition={
          r
            ? {
                duration: 0,
              }
            : {
                duration: 0.75,
                delay,
                ease: [0.2, 0.8, 0.2, 1],
              }
        }
        style={{
          transformStyle: `preserve-3d`,
          position: `relative`,
        }}
      >
        <div style={style}>
          <Ot {...rest} faceDown tilt={false} onClick={undefined} />
        </div>
        <div
          style={{
            ...style,
            position: `absolute`,
            inset: 0,
            transform: `rotateY(180deg)`,
          }}
        >
          <Ot {...rest} tilt={false} />
        </div>
      </Y.div>
    </div>
  );
}
export {
  Et as a,
  gt as c,
  At as i,
  st as l,
  JtComponent as n,
  kt as r,
  Ot as t,
  useLe as u,
};
