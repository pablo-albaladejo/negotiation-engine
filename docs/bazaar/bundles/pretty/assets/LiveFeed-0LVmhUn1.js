import { i, n as n_1, t } from "./jsx-runtime-CU3EbJiN.js";
import { i as i_1, n as I1, t as A1 } from "./Cromo-BD7ZopIA.js";
import { i as i_2, r as r_1 } from "./Button-DIaWEsZ9.js";
import { t as t_2 } from "./award-n-Uno7d2.js";
import {
  c as round,
  i as i_3,
  n as n_2,
  o as announce,
  r as r_2,
  s as dot,
} from "./EventLine-Bsrbkjwf.js";
import { n as n_3, t as t_3 } from "./shield-alert-D37rzUV0.js";
import { t as _ } from "./gift-By9eZ4Hi.js";
import { t as t_4 } from "./handshake-BOxgdx9P.js";
import { t as Y1 } from "./EmptyState-BxhxbZPA.js";
import { A, M as admin, T } from "./useEvents-BpJ5PfZT.js";
import { t as t_5 } from "./lock-open-BaFFRJ5V.js";
import { t as t_6 } from "./package-BroSsHdu.js";
import { t as talk } from "./radio-DXXmGeQs.js";
import { n as n_4 } from "./catalog-C4CNN-Mb.js";
import { t as t_7 } from "./names-CpRLV58L.js";
import { t as O } from "./RarityBadge-Boc23U-c.js";
import {
  A as A_2,
  E as persona,
  I as set,
  M as M_2,
  X,
  Y,
  f,
  k as duel,
  l,
  p,
  v,
} from "./index-B_RfsMCE.js";
import { t as R } from "./Pesetas-MTmNUFPf.js";
const z = {
  name: `message-circle`,
  size: 24,
  node: [
    [
      `path`,
      {
        d: `M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719`,
        key: `1sd12s`,
      },
    ],
  ],
};
z.node;
export const r = i_2(z);
const V = i(n_1(), 1);
const H = t();
const U = new Set([
  `tick`,
  `thread.opened`,
  `thread.message`,
  `thread.closed`,
  `offer.listed`,
  `offer.cancelled`,
  `duel.message`,
  `duel.started`,
  `duel.result`,
  `team.granted`,
  `admin.key_rotated`,
  `persona.strike`,
  `flag.raised`,
  `engine.error`,
  `schedule.failed`,
]);
function W(events, t = 30) {
  let n = [];
  for (let ev of events) {
    if (U.has(ev.type)) {
      continue;
    }
    let e = ev.payload;
    if (
      (ev.type !== `level.unlocked` ||
        (e.why !== `open to everyone now` && e.why !== `always open`)) &&
      (ev.type !== `schedule.fired` || e.action !== `announce`) &&
      (ev.type !== `settlement` ||
        (e.kind !== `gift` && e.kind !== `egg` && e.kind !== `grant`))
    ) {
      if (
        (ev.type === `venue.opened` && e.starter) ||
        ev.type === `team.joined`
      ) {
        let e = n[n.length - 1];
        let i = ev.type === `team.joined` || e?.ev.tick === ev.tick;
        if (e?.group && e.ev.type === ev.type && i) {
          e.group.push(ev);
          continue;
        }
        n.push({
          key: `g${ev.id}`,
          ev,
          group: [ev],
        });
        if (n.length >= t) {
          break;
        }
        continue;
      }
      n.push({
        key: String(ev.id),
        ev,
      });
      if (n.length >= t) {
        break;
      }
    }
  }
  return n;
}
export function n(e) {
  let t = new Map();
  for (let n of e) {
    if (n.type !== `thread.message`) {
      continue;
    }
    let e = n.payload;
    if (e.text && e.sender && e.sender === e.with && !t.has(e.sender)) {
      t.set(e.sender, {
        text: e.text,
        t: n.t,
      });
    }
  }
  return t;
}
const K = {
  deal: t_4,
  pack: t_6,
  talk,
  offer: A_2,
  unlock: t_5,
  egg: n_3,
  badge: t_2,
  persona,
  venue: A_2,
  alert: t_3,
  round,
  clock: i_3,
  announce,
  team: r_2,
  admin,
  duel,
  bench: M_2,
  set,
  dot,
};
const q = {
  good: `text-good bg-good/14 ring-good/30`,
  gold: `text-gold bg-gold/14 ring-gold/35`,
  accent: `text-accent bg-accent/14 ring-accent/35`,
  warn: `text-warn bg-warn/14 ring-warn/30`,
  info: `text-info bg-info/14 ring-info/30`,
  neutral: `text-ink bg-ink/8 ring-line-strong`,
  muted: `text-muted bg-ink/5 ring-line`,
};
function JComponent({ color = `#E0A458`, size = 34 }) {
  let width = size * 0.68;
  return (
    <svg
      viewBox={`0 0 24 34`}
      width={width}
      height={size}
      aria-hidden
      className={`shrink-0 drop-shadow-[0_4px_6px_rgb(0_0_0/0.5)]`}
    >
      <path
        d={`M1,3 L3,1 L5,3 L7,1 L9,3 L11,1 L13,3 L15,1 L17,3 L19,1 L21,3 L23,1 L23,33 L21,31 L19,33 L17,31 L15,33 L13,31 L11,33 L9,31 L7,33 L5,31 L3,33 L1,31 Z`}
        fill={color}
      />
      <rect
        x={`4`}
        y={`10`}
        width={`16`}
        height={`14`}
        rx={`2`}
        fill={`rgb(11 16 32 / 0.8)`}
      />
      <circle cx={`12`} cy={`17`} r={`3`} fill={`#FFC44D`} />
      <polygon
        points={`0,14 24,6 24,10 0,18`}
        fill={`rgb(255 255 255 / 0.18)`}
      />
    </svg>
  );
}
function YComponent({ a, em = 2.4 }) {
  let { index } = n_4();
  return (
    <A1
      {...i_1(a.ref, index, {
        serial: a.serial,
        printRun: a.print_run,
      })}
      size={`sm`}
      tilt={false}
      style={{
        fontSize: em,
      }}
    />
  );
}
function XComponent({ a: a_1, live, em }) {
  let { index } = n_4();
  let [revealed, setRevealed] = V.useState(!live);
  V.useEffect(() => {
    if (!live) {
      return;
    }
    let e = setTimeout(() => setRevealed(true), 650);
    return () => clearTimeout(e);
  }, [live]);
  return (
    <I1
      {...i_1(a_1.ref, index, {
        serial: a_1.serial,
        printRun: a_1.print_run,
      })}
      size={`sm`}
      revealed={revealed}
      style={{
        fontSize: em,
      }}
    />
  );
}
function ZComponent({ icon, tone, children, when, extra, highlight }) {
  let o = K[icon] ?? dot;
  return (
    <div
      className={r_1(
        `flex items-start gap-3 rounded-xl px-2.5 py-2`,
        highlight && `bg-gold/[0.06] ring-1 ring-gold/25`,
      )}
    >
      <span
        className={r_1(
          `mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl ring-1`,
          q[tone],
        )}
        aria-hidden
      >
        {H.jsx(o, {
          className: `size-[18px]`,
        })}
      </span>
      <div className={`min-w-0 flex-1`}>
        <div
          className={r_1(
            `text-[17px] leading-snug font-semibold break-words`,
            tone === `muted` ? `text-muted` : `text-ink`,
          )}
        >
          {children}
        </div>
        {extra && <div className={`mt-1.5`}>{extra}</div>}
      </div>
      <span
        className={`shrink-0 pt-1 font-mono text-[12px] whitespace-nowrap text-faint`}
      >
        {when}
      </span>
    </div>
  );
}
const QComponent = ({ children }) => (
  <b className={`font-extrabold text-ink`}>{children}</b>
);
function Component({ amount }) {
  return (
    <span
      className={`ml-1.5 inline-flex items-center rounded-md bg-gold/14 px-1.5 py-px align-[1px] text-[1.02em] text-gold ring-1 ring-gold/30`}
    >
      <R value={amount} />
    </span>
  );
}
function NeComponent({ entry, live, nowHours }) {
  let r = n_2(false);
  let { name } = t_7();
  let { index } = n_4();
  let symbol = index?.symbol ?? `P`;
  let entry_ev = entry.ev;
  let s_payload = entry_ev.payload;
  let when = nowHours === null ? `T${entry_ev.tick}` : f(entry_ev.t, nowHours);
  let u = (e) => index?.packs.get(e)?.color;
  if (entry.group && entry.group.length > 1) {
    if (entry_ev.type === `team.joined`) {
      let t = entry.group.map((e) =>
        String(e.payload.name ?? name(String(e.payload.team))),
      );
      let n = t.slice(0, 3).join(`, `);
      return (
        <ZComponent icon={`team`} tone={`info`} when={when}>
          {entry.group.length}
          {` teams joined the Bazaar: `}
          {n}
          {t.length > 3 ? ` and ${t.length - 3} more` : ``}
        </ZComponent>
      );
    }
    return (
      <ZComponent icon={`venue`} tone={`gold`} when={when}>
        {entry.group.length}
        {` starter stalls opened — every team can make a market now`}
      </ZComponent>
    );
  }
  switch (entry_ev.type) {
    case `settlement`: {
      let e = s_payload.parties ?? [];
      let t = s_payload.items ?? [];
      let amount = Number(s_payload.price) || 0;
      let r = s_payload.venue ?? null;
      let a = [...new Set(t.map((e) => e.to))];
      let extra = (
        <span className={`flex items-center gap-1.5`}>
          {t.slice(0, 4).map((e) => {
            if (e.kind === `pack`) {
              return <JComponent key={e.id} color={u(e.ref)} />;
            }
            return <YComponent key={e.id} a={e} />;
          })}
          {r && (
            <span
              className={`ml-1 inline-flex items-center gap-1 rounded-full border border-line-strong bg-base/60 px-2 py-0.5 text-[12px] font-semibold text-muted`}
            >
              <A_2 className={`size-3`} aria-hidden />
              {` `}
              {name(r)}
              {Number(s_payload.fee) > 0 && (
                <span className={`text-faint`}>
                  {` · fee `}
                  {v(Number(s_payload.fee), {
                    symbol,
                  })}
                </span>
              )}
            </span>
          )}
        </span>
      );
      let d = t.map((e) => e.name ?? e.ref).join(`, `);
      if (a.length === 1 && t.length) {
        let r = a[0];
        let o = t[0].frm ?? e.find((e) => e !== r) ?? ``;
        return (
          <ZComponent icon={`deal`} tone={`good`} when={when} extra={extra}>
            <QComponent>{name(r)}</QComponent>
            {` bought `}
            {d}
            {` from `}
            <QComponent>{name(o)}</QComponent>
            {amount > 0 && <Component amount={amount} />}
          </ZComponent>
        );
      }
      let [f, p] = e;
      let m = t.filter((e) => e.frm === f).map((e) => e.name ?? e.ref);
      let h = t.filter((e) => e.frm === p).map((e) => e.name ?? e.ref);
      return (
        <ZComponent icon={`deal`} tone={`good`} when={when} extra={extra}>
          <QComponent>{name(f)}</QComponent>
          {` ⇄ `}
          <QComponent>{name(p)}</QComponent>
          {`: `}
          {m.join(`, `) || `cash`}
          {` for `}
          {h.join(`, `) || `cash`}
          {amount > 0 && <Component amount={amount} />}
        </ZComponent>
      );
    }
    case `pack.opened`: {
      let e = s_payload.best ?? null;
      let rarity = e?.rarity && T(e.rarity) ? e.rarity : undefined;
      let r = A(rarity) >= 2;
      let o = (s_payload.cards ?? [])
        .filter((t) => !e || t.id !== e.id)
        .sort((e, t) => A(e.rarity) - A(t.rarity));
      let s =
        index?.packs.get(String(s_payload.pack))?.name ??
        String(s_payload.pack);
      return (
        <ZComponent
          icon={`pack`}
          tone={A(rarity) >= 3 ? `gold` : r ? `info` : `muted`}
          when={when}
          highlight={A(rarity) >= 3}
          extra={
            r && e ? (
              <span className={`flex items-end gap-1.5`}>
                <JComponent color={u(String(s_payload.pack))} />
                <span className={`mx-1 text-faint`}>{`→`}</span>
                {o.map((e) => (
                  <YComponent key={e.id} a={e} em={2.2} />
                ))}
                <XComponent key={e.id} a={e} live={live} em={3.1} />
              </span>
            ) : undefined
          }
        >
          <QComponent>
            {String(s_payload.name ?? name(String(s_payload.team)))}
          </QComponent>
          {` opened a `}
          {s}
          {e && r ? (
            <>
              {` `}
              {`— pulled `}
              <QComponent>{e.name ?? e.ref}</QComponent>
              {` `}
              <O
                rarity={rarity}
                label={index?.rarityLabel(rarity)}
                color={index?.rarityColor(rarity)}
                className={`ml-1 align-middle`}
              />
            </>
          ) : null}
        </ZComponent>
      );
    }
    case `egg.found`:
      return (
        <ZComponent icon={`egg`} tone={`gold`} when={when} highlight>
          <QComponent>
            {String(s_payload.name ?? name(String(s_payload.team)))}
          </QComponent>
          {` found an easter egg at `}
          {name(String(s_payload.persona))}
          {`'s stall 🥚`}
        </ZComponent>
      );
    case `egg.given`:
    case `gift.given`: {
      let e = [
        ...(s_payload.cards ?? []).map(
          (e) =>
            index?.cards.get(e)?.card.name ??
            (T(e) ? `a ${index?.rarityLabel(e) ?? e} card` : e),
        ),
        ...(s_payload.packs ?? []).map((e) => index?.packs.get(e)?.name ?? e),
        ...(Number(s_payload.cash)
          ? [
              v(Number(s_payload.cash), {
                symbol,
              }),
            ]
          : []),
      ];
      let t = String(s_payload.name ?? name(String(s_payload.team)));
      return (
        <ZComponent
          icon={entry_ev.type === `egg.given` ? `egg` : `badge`}
          tone={`gold`}
          when={when}
        >
          <QComponent>{t}</QComponent>
          {` received `}
          {e.join(`, `) || `a surprise`}
          {` `}
          {entry_ev.type === `egg.given`
            ? `for finding an easter egg`
            : `as a gift from ${name(entry_ev.actor)}`}
          <_ className={`ml-1.5 inline size-4 text-gold`} aria-hidden />
        </ZComponent>
      );
    }
    case `level.unlocked`:
      return (
        <ZComponent icon={`unlock`} tone={`gold`} when={when} highlight>
          <QComponent>
            {String(s_payload.name ?? name(String(s_payload.team)))}
          </QComponent>
          {` unlocked `}
          <QComponent>
            {String(s_payload.persona_name ?? name(String(s_payload.persona)))}
          </QComponent>
          {` — now level `}
          {String(s_payload.level)}
        </ZComponent>
      );
    case `venue.opened`:
      return (
        <ZComponent
          icon={`venue`}
          tone={s_payload.starter ? `muted` : `gold`}
          when={when}
          highlight={!s_payload.starter}
        >
          {s_payload.starter ? (
            <>
              {`Starter stall “`}
              {String(s_payload.name)}
              {`” opened for `}
              {name(String(s_payload.owner))}
            </>
          ) : (
            <>
              <QComponent>{name(String(s_payload.owner))}</QComponent>
              {` opened the market “`}
              {String(s_payload.name)}
              {`” — fee `}
              {p(Number(s_payload.fee_bps))}
              {Number(s_payload.fee_per_card)
                ? ` + ${v(Number(s_payload.fee_per_card), {
                    symbol,
                  })}/card`
                : ``}
            </>
          )}
        </ZComponent>
      );
    case `announcement`:
      return (
        <div
          className={`rounded-xl border border-info/35 bg-info/10 px-3 py-2.5`}
        >
          <div className={`mb-1 flex items-center justify-between gap-2`}>
            <span
              className={`flex items-center gap-2 text-[11px] font-extrabold tracking-[0.18em] text-info uppercase`}
            >
              <announce className={`size-4`} aria-hidden />
              {` From the organisers`}
            </span>
            <span className={`font-mono text-[12px] text-faint`}>{when}</span>
          </div>
          <div className={`text-[18px] leading-snug font-semibold text-ink`}>
            {String(s_payload.text)}
          </div>
        </div>
      );
    default: {
      let e = r(entry_ev);
      return (
        <ZComponent
          icon={e.icon}
          tone={e.tone}
          when={when}
          highlight={e.tone === `gold`}
        >
          {e.text}
          {e.rarity && e.rarity !== `common` && (
            <O rarity={e.rarity} className={`ml-2 align-middle`} />
          )}
        </ZComponent>
      );
    }
  }
}
function ReComponent({ events, liveSince, loading, max = 16, className }) {
  let { clock } = l({
    live: false,
  });
  let o = V.useMemo(() => W(events, max), [events, max]);
  return (
    <section
      className={r_1(
        `flex min-h-0 min-w-0 flex-col rounded-[20px] border border-line/80 bg-panel/60 p-4 shadow-[var(--shadow-panel)] backdrop-blur-sm`,
        className,
      )}
    >
      <header className={`mb-2 flex items-center justify-between gap-3 px-1`}>
        <div className={`flex items-center gap-3`}>
          <span
            className={`grid size-10 place-items-center rounded-xl bg-accent/12 text-accent ring-1 ring-accent/30`}
          >
            <talk className={`size-5`} aria-hidden />
          </span>
          <div className={`leading-none`}>
            <div className={`eyebrow`}>{`On air`}</div>
            <h2 className={`mt-1 text-[30px] text-ink`}>{`Live feed`}</h2>
          </div>
        </div>
      </header>
      {o.length === 0 ? (
        <Y1
          compact
          title={loading ? `Tuning in…` : `The market is quiet`}
          hint={`Deals, pack openings, unlocks and easter eggs appear here the moment they happen.`}
          className={`flex-1`}
        />
      ) : (
        <ol
          className={`feed-mask flex min-h-0 flex-1 flex-col gap-1 overflow-hidden`}
          aria-live={`polite`}
          aria-label={`Live feed`}
        >
          <X initial={false}>
            {o.map((entry) => (
              <Y.li
                key={entry.key}
                layout={`position`}
                initial={{
                  opacity: 0,
                  y: -18,
                  scale: 0.98,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                }}
                exit={{
                  opacity: 0,
                }}
                transition={{
                  duration: 0.45,
                  ease: [0.2, 0.8, 0.2, 1],
                }}
              >
                <NeComponent
                  entry={entry}
                  live={entry.ev.id > liveSince}
                  nowHours={clock?.t_hours ?? null}
                />
              </Y.li>
            ))}
          </X>
        </ol>
      )}
    </section>
  );
}
export { ReComponent as t };
