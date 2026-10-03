import { i as i_1, n, t } from "./jsx-runtime-CU3EbJiN.js";
import { u } from "./Cromo-BD7ZopIA.js";
import { i, r as r_1 } from "./Button-DIaWEsZ9.js";
import { t as O1 } from "./chevron-right-BmhxKtEk.js";
import { t as S1 } from "./EmptyState-BxhxbZPA.js";
import {
  D as D_1,
  E as E_1,
  a as U1,
  c,
  g as g_1,
  i as i_2,
  n as n_2,
  r as r_2,
  t as t_2,
  x,
} from "./useEvents-BpJ5PfZT.js";
import { t as V1 } from "./lock-open-BaFFRJ5V.js";
import { t as Y1 } from "./lock-Cv7BB2xm.js";
import { n as n_3, r as X1 } from "./LiveFeed-0LVmhUn1.js";
import { t as S } from "./ErrorNote-Ca3ig8px.js";
import { n as n_4 } from "./catalog-C4CNN-Mb.js";
import { t as t_3 } from "./names-CpRLV58L.js";
import { t as T } from "./RarityBadge-Boc23U-c.js";
import { t as E } from "./LevelBadge-BVpKP7Tt.js";
import { t as D } from "./PackCard-uJX1JC15.js";
import { t as O } from "./PageHeader-B1UyPTkh.js";
import { t as K1 } from "./PersonaAvatar-pfo-WxM7.js";
import { D as D_2, H as H_1, K as K_1, Y, f, l } from "./index-B_RfsMCE.js";
import { a, r as r_3, t as R } from "./Pesetas-MTmNUFPf.js";
const z = {
  name: `clock`,
  size: 24,
  node: [
    [
      `circle`,
      {
        cx: `12`,
        cy: `12`,
        r: `10`,
        key: `1mglay`,
      },
    ],
    [
      `path`,
      {
        d: `M12 6v6l4 2`,
        key: `mmk7yg`,
      },
    ],
  ],
};
z.node;
const B = i(z);
const V = {
  name: `hand-coins`,
  size: 24,
  node: [
    [
      `path`,
      {
        d: `M11 15h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 17`,
        key: `geh8rc`,
      },
    ],
    [
      `path`,
      {
        d: `m7 21 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.75-2.91l-4.2 3.9`,
        key: `1fto5m`,
      },
    ],
    [
      `path`,
      {
        d: `m2 16 6 6`,
        key: `1pfhp9`,
      },
    ],
    [
      `circle`,
      {
        cx: `16`,
        cy: `9`,
        r: `2.9`,
        key: `1n0dlu`,
      },
    ],
    [
      `circle`,
      {
        cx: `6`,
        cy: `5`,
        r: `3`,
        key: `151irh`,
      },
    ],
  ],
};
V.node;
const H = i(V);
const U = {
  name: `shopping-bag`,
  size: 24,
  node: [
    [
      `path`,
      {
        d: `M16 10a4 4 0 0 1-8 0`,
        key: `1ltviw`,
      },
    ],
    [
      `path`,
      {
        d: `M3.103 6.034h17.794`,
        key: `awc11p`,
      },
    ],
    [
      `path`,
      {
        d: `M3.4 5.467a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.667a2 2 0 0 0-.4-1.2l-2-2.667A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z`,
        key: `o988cm`,
      },
    ],
  ],
};
U.node;
const W = i(U);
const G = i_1(n(), 1);
const K = t();
const q = [
  {
    key: `patience`,
    label: `Patience`,
    high: `haggles for a long time`,
    low: `walks away fast`,
  },
  {
    key: `generosity`,
    label: `Generosity`,
    high: `concedes easily`,
    low: `concedes almost nothing`,
  },
  {
    key: `shrewdness`,
    label: `Shrewdness`,
    high: `knows every price`,
    low: `easy on prices`,
  },
  {
    key: `memory`,
    label: `Memory`,
    high: `remembers how you treated them`,
    low: `forgets quickly`,
  },
  {
    key: `strictness`,
    label: `Strictness`,
    high: `punishes tricks`,
    low: `forgives almost anything`,
  },
  {
    key: `chattiness`,
    label: `Chattiness`,
    high: `loves to talk`,
    low: `says little`,
  },
];
function J(traits) {
  let t = q.map((t) => ({
    ...t,
    value: traits[t.key] ?? 0,
  }));
  let n = [...t]
    .sort((e, t) => t.value - e.value)
    .filter((e) => e.value >= 0.6)
    .slice(0, 2);
  let r = [...t]
    .sort((e, t) => e.value - t.value)
    .find((e) => e.value <= 0.3 && !n.includes(e));
  let i = n.map((e) => ({
    label: e.label,
    text: e.high,
    value: e.value,
  }));
  if (r) {
    i.push({
      label: `Low ${r.label.toLowerCase()}`,
      text: r.low,
      value: r.value,
    });
  }
  return i;
}
function YComponent({ traits, color = `#FFC44D`, size = 260, className }) {
  let a = G.useId().replace(/:/g, ``);
  let o = u();
  let maxWidth = size + 168;
  let l = size / 2 - 40;
  let x1 = maxWidth / 2;
  let y1 = size / 2;
  let q_length = q.length;
  let p = (e, t) => {
    let n = -Math.PI / 2 + (e / q_length) * Math.PI * 2;
    return [x1 + Math.cos(n) * l * t, y1 + Math.sin(n) * l * t];
  };
  let m = (e) =>
    q
      .map((t, n) => p(n, e(n)))
      .map(([e, t]) => `${e.toFixed(1)},${t.toFixed(1)}`)
      .join(` `);
  let h = q.map((t) => Math.max(0, Math.min(1, traits[t.key] ?? 0)));
  return (
    <svg
      viewBox={`0 0 ${maxWidth} ${size}`}
      className={className}
      style={{
        width: `100%`,
        maxWidth,
        height: `auto`,
      }}
      role={`img`}
      aria-label={q
        .map((e, t) => `${e.label} ${Math.round(h[t] * 100)}`)
        .join(`, `)}
    >
      <defs>
        <radialGradient id={`rg-${a}`} cx={`50%`} cy={`50%`} r={`50%`}>
          <stop
            offset={`0%`}
            stopColor={x(D_1(color, `#ffffff`, 0.25), 0.55)}
          />
          <stop offset={`100%`} stopColor={x(color, 0.22)} />
        </radialGradient>
      </defs>
      {[0.25, 0.5, 0.75, 1].map((e) => (
        <polygon
          key={e}
          points={m(() => e)}
          fill={e === 1 ? `rgb(11 16 32 / 0.5)` : `none`}
          stroke={`var(--color-line-strong)`}
          strokeWidth={e === 1 ? 1.2 : 0.8}
          strokeDasharray={e === 1 ? undefined : `2 3`}
        />
      ))}
      {q.map((e, t) => {
        let [x2, y2] = p(t, 1);
        return (
          <line
            key={t}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={`var(--color-line)`}
            strokeWidth={0.8}
          />
        );
      })}
      <Y.polygon
        points={m((e) => h[e])}
        fill={`url(#rg-${a})`}
        stroke={color}
        strokeWidth={2}
        strokeLinejoin={`round`}
        initial={
          !o && {
            opacity: 0,
            scale: 0.4,
          }
        }
        whileInView={{
          opacity: 1,
          scale: 1,
        }}
        viewport={{
          once: true,
        }}
        transition={{
          type: `spring`,
          stiffness: 90,
          damping: 14,
        }}
        style={{
          transformOrigin: `${x1}px ${y1}px`,
          filter: `drop-shadow(0 0 10px ${x(color, 0.5)})`,
        }}
      />
      {q.map((e, n) => {
        let [cx, cy] = p(n, h[n]);
        return (
          <circle
            key={e.key}
            cx={cx}
            cy={cy}
            r={3.4}
            fill={color}
            stroke={`#0B1020`}
            strokeWidth={1.2}
          />
        );
      })}
      {q.map((e, t) => {
        let [n, r] = p(t, 1);
        let i = t === 0;
        let a = t === q_length / 2;
        let o = n > x1 + 1;
        let x_1 = i || a ? x1 : n + (o ? 10 : -10);
        let y = i ? r - 22 : a ? r + 16 : r - 3;
        let textAnchor = i || a ? `middle` : o ? `start` : `end`;
        return (
          <g key={e.key}>
            <text
              x={x_1}
              y={y}
              textAnchor={textAnchor}
              fontSize={`10.5`}
              fontWeight={`700`}
              fill={`var(--color-muted)`}
              fontFamily={`var(--font-sans)`}
              letterSpacing={`0.06em`}
            >
              {e.label.toUpperCase()}
            </text>
            <text
              x={x_1}
              y={y + 15}
              textAnchor={textAnchor}
              fontSize={`15`}
              fontWeight={`800`}
              fill={`var(--color-ink)`}
              fontFamily={`var(--font-display)`}
            >
              {Math.round(h[t] * 100)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
function XComponent({ sets, index }) {
  if (sets === `released`) {
    return (
      <span className={`text-xs text-muted`}>{`any set that is out`}</span>
    );
  }
  return (
    <span className={`flex flex-wrap gap-1`}>
      {sets.map((e) => {
        let n = index?.sets.get(e);
        return (
          <span
            key={e}
            className={`inline-flex items-center gap-1 rounded-full border border-line bg-base/60 px-2 py-0.5 text-[11px] font-semibold text-ink`}
          >
            <span
              className={`size-2 rounded-full`}
              style={{
                background: n?.color ?? `#5C6B73`,
              }}
              aria-hidden
            />
            {n?.name ?? e}
          </span>
        );
      })}
    </span>
  );
}
function Z(e) {
  let t = [];
  for (let n of e) {
    let e = n.sets === `released` ? `released` : [...n.sets].sort().join(`,`);
    let r = t.find((t) => t.key === e);
    if (r) {
      r.items.push(n);
    } else {
      t.push({
        key: e,
        sets: n.sets,
        items: [n],
      });
    }
  }
  return t;
}
function QComponent({
  persona,
  index,
  nowHours,
  opensAt,
  reached,
  quote,
  name,
  highlighted,
}) {
  let color = persona.avatar.color || `#5C6B73`;
  let d = a(persona, name, nowHours, opensAt);
  let p = J(persona.traits);
  let open_to_all_at = persona.unlock.open_to_all_at;
  let h = persona.unlock.always
    ? `open from the start`
    : d.openNow
      ? open_to_all_at
        ? `open since ${open_to_all_at}`
        : `open`
      : d.short === `Locked`
        ? open_to_all_at
          ? `opens at ${open_to_all_at}`
          : `only through the early route`
        : `opens ${d.short}${open_to_all_at ? ` (at ${open_to_all_at})` : ``}`;
  let g = persona.menu.sells.filter((e) => `pack` in e);
  let b = persona.menu.sells.filter((e) => `rarity` in e);
  return (
    <article
      id={`persona-${persona.id}`}
      className={r_1(
        `relative scroll-mt-24 overflow-hidden rounded-[24px] border bg-panel shadow-[var(--shadow-lift)] transition-shadow`,
        highlighted ? `border-gold/60 ring-2 ring-gold/40` : `border-line`,
        !persona.enabled && `opacity-60`,
      )}
    >
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-44`}
        style={{
          background: `radial-gradient(900px 200px at 12% -30%, ${x(color, 0.45)}, transparent 70%), linear-gradient(180deg, ${x(D_1(color, `#0B1020`, 0.4), 0.35)}, transparent)`,
        }}
        aria-hidden
      />
      <header className={`relative flex flex-wrap items-start gap-5 px-6 pt-6`}>
        <K1
          avatar={persona.avatar}
          name={persona.name}
          size={`xl`}
          status={
            persona.enabled ? (d.openNow ? undefined : `locked`) : `disabled`
          }
          ring={d.openNow}
        />
        <div className={`min-w-0 flex-1`}>
          <div className={`flex flex-wrap items-center gap-2`}>
            <E level={persona.level} showName size={`md`} />
            <span
              className={`rounded-full border border-line-strong bg-base/60 px-2.5 py-0.5 text-[11px] font-bold tracking-[0.12em] text-muted uppercase`}
            >
              {g_1[persona.kind] ?? persona.kind}
            </span>
            {persona.enabled ? (
              d.openNow ? (
                <span
                  className={`inline-flex items-center gap-1 rounded-full border border-good/40 bg-good/12 px-2.5 py-0.5 text-[11px] font-extrabold tracking-[0.1em] text-good uppercase`}
                >
                  <V1 className={`size-3`} aria-hidden />
                  {` open to all`}
                </span>
              ) : (
                <span
                  className={`inline-flex items-center gap-1 rounded-full border border-gold/40 bg-gold/10 px-2.5 py-0.5 text-[11px] font-extrabold tracking-[0.1em] text-gold uppercase`}
                >
                  <Y1 className={`size-3`} aria-hidden />
                  {` `}
                  {d.short === `Locked` ? `locked` : `opens to all ${d.short}`}
                </span>
              )
            ) : (
              <span
                className={`rounded-full border border-line bg-base/60 px-2.5 py-0.5 text-[11px] font-bold text-faint uppercase`}
              >{`away today`}</span>
            )}
          </div>
          <h2 className={`mt-2 text-4xl text-ink sm:text-5xl`}>
            {persona.name}
          </h2>
          <p className={`mt-1 text-base text-ink/80`}>{persona.title}</p>
        </div>
      </header>
      <div
        className={`relative grid gap-6 px-6 pt-5 pb-6 lg:grid-cols-[minmax(0,1fr)_400px]`}
      >
        <div className={`flex min-w-0 flex-col gap-5`}>
          <p className={`max-w-[68ch] text-[15px] leading-relaxed text-muted`}>
            {persona.bio}
          </p>
          {quote && (
            <blockquote
              className={`flex max-w-[68ch] gap-2 rounded-xl border border-line bg-base/50 px-3.5 py-2.5 text-sm text-ink/90 italic`}
            >
              <X1
                className={`mt-0.5 size-4 shrink-0 not-italic text-muted`}
                aria-hidden
              />
              <span>
                {`“`}
                {quote.text}
                {`”`}
                <span className={`ml-2 text-xs text-faint not-italic`}>
                  {`— at the stall`}
                  {nowHours === null ? `` : `, ${f(quote.t, nowHours)}`}
                </span>
              </span>
            </blockquote>
          )}
          <div className={`grid gap-4 md:grid-cols-2`}>
            <section
              className={`rounded-2xl border border-line bg-base/40 p-4`}
            >
              <h3 className={`mb-2 flex items-center gap-2 text-lg text-ink`}>
                <V1 className={`size-4 text-gold`} aria-hidden />
                {` When they deal with you`}
              </h3>
              <ul className={`flex flex-col gap-2 text-sm`}>
                {d.early && (
                  <li className={`flex gap-2`}>
                    <span
                      className={`mt-1.5 size-1.5 shrink-0 rounded-full bg-gold`}
                      aria-hidden
                    />
                    <span className={`text-ink`}>
                      <b>{`Early, for your team:`}</b>
                      {` `}
                      {d.early.replace(/^After/, `after`)}
                      {`.`}
                    </span>
                  </li>
                )}
                <li className={`flex gap-2`}>
                  <span
                    className={r_1(
                      `mt-1.5 size-1.5 shrink-0 rounded-full`,
                      d.openNow ? `bg-good` : `bg-line-strong`,
                    )}
                    aria-hidden
                  />
                  <span className={`text-ink`}>
                    <b>{`For everyone:`}</b>
                    {` `}
                    {h}
                    {`.`}
                  </span>
                </li>
                {reached && reached.of > 0 && (
                  <li className={`flex items-center gap-2 text-muted`}>
                    <D_2 className={`size-3.5 shrink-0`} aria-hidden />
                    {reached.n === 0
                      ? `No team has reached this level yet.`
                      : `${reached.n} of ${reached.of} teams have reached this level.`}
                  </li>
                )}
                <li className={`flex items-center gap-2 text-muted`}>
                  <B className={`size-3.5 shrink-0`} aria-hidden />
                  {`Deals with each team up to `}
                  {persona.menu.deals_per_team_per_hour}
                  {`× per hour.`}
                </li>
              </ul>
            </section>
            <section
              className={`rounded-2xl border border-line bg-base/40 p-4`}
            >
              <h3 className={`mb-2 flex items-center gap-2 text-lg text-ink`}>
                <W className={`size-4 text-gold`} aria-hidden />
                {` On the table`}
              </h3>
              {g.length + b.length === 0 && persona.menu.buys.length === 0 && (
                <p
                  className={`text-sm text-muted`}
                >{`Nothing on the menu right now.`}</p>
              )}
              <div className={`flex flex-col gap-3`}>
                {g.map((e) => {
                  let n = index?.packs.get(e.pack);
                  return (
                    <div key={e.pack} className={`flex items-center gap-3`}>
                      <D
                        name={e.name}
                        color={n?.color}
                        odds={n?.slots}
                        size={`sm`}
                        className={`!w-[56px]`}
                      />
                      <div className={`min-w-0`}>
                        <div className={`font-semibold text-ink`}>{e.name}</div>
                        <div className={`text-xs text-muted`}>
                          {`list `}
                          <R
                            value={e.list_price}
                            className={`text-sm text-gold`}
                          />
                          {` · up to `}
                          {e.per_team_per_hour}
                          {` per team per hour`}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {Z(b).map((e) => (
                  <div
                    key={`s-${e.key}`}
                    className={`flex flex-wrap items-center gap-2`}
                  >
                    <span
                      className={`text-xs font-bold tracking-[0.12em] text-faint uppercase`}
                    >{`sells`}</span>
                    {e.items.map((e) => (
                      <span
                        key={e.rarity}
                        className={`inline-flex items-center gap-1.5`}
                      >
                        <T
                          rarity={e.rarity}
                          label={index?.rarityLabel(e.rarity)}
                          color={index?.rarityColor(e.rarity)}
                        />
                        <R
                          value={e.list_price}
                          className={`text-sm text-gold`}
                        />
                      </span>
                    ))}
                    <span className={`text-xs text-muted`}>{`from`}</span>
                    <XComponent sets={e.sets} index={index} />
                  </div>
                ))}
                {Z(persona.menu.buys).map((e) => (
                  <div
                    key={`b-${e.key}`}
                    className={`flex flex-wrap items-center gap-2`}
                  >
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-bold tracking-[0.12em] text-good uppercase`}
                    >
                      <H className={`size-3.5`} aria-hidden />
                      {` buys`}
                    </span>
                    {e.items.map((e) => (
                      <T
                        key={e.rarity}
                        rarity={e.rarity}
                        label={index?.rarityLabel(e.rarity)}
                        color={index?.rarityColor(e.rarity)}
                      />
                    ))}
                    <span className={`text-xs text-muted`}>{`from`}</span>
                    <XComponent sets={e.sets} index={index} />
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
        <aside className={`flex flex-col items-center gap-3`}>
          <YComponent traits={persona.traits} color={color} size={250} />
          {p.length > 0 && (
            <ul className={`flex w-full flex-col gap-1.5`}>
              {p.map((e) => (
                <li
                  key={e.label}
                  className={`flex items-baseline justify-between gap-3 rounded-lg border border-line bg-base/40 px-3 py-1.5 text-sm`}
                >
                  <span className={`font-semibold text-ink`}>{e.label}</span>
                  <span className={`text-right text-xs text-muted`}>
                    {e.text}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </article>
  );
}
function Component() {
  let { id } = K_1();
  let t = i_2((e) => c.personas(e), 30000);
  let n = i_2((e) => c.leaderboard(e), 30000);
  let r = i_2((e) => c.schedule(e), 60000);
  let i = t_2((e) => c.feed(150, e));
  let { events } = r_2({
    scope: `public`,
    limit: 200,
    seed: i.data?.events,
  });
  let { index } = n_4();
  let { name } = t_3();
  let { clock } = l({
    live: false,
  });
  let nowHours = clock?.t_hours ?? null;
  n_2(
    (e) => {
      if (e.type === `persona.updated` || e.type === `persona.open_to_all`) {
        t.refresh();
      }
    },
    {
      scope: `public`,
      types: [`persona.updated`, `persona.open_to_all`],
    },
  );
  let T = G.useMemo(
    () => [...(t.data?.personas ?? [])].sort((e, t) => e.level - t.level),
    [t.data],
  );
  let E = G.useMemo(() => r_3(r.data?.upcoming), [r.data]);
  let D = G.useMemo(() => n_3(events), [events]);
  let A = n.data?.teams ?? [];
  G.useEffect(() => {
    id &&
      T.length &&
      document.getElementById(`persona-${id}`)?.scrollIntoView({
        behavior: `smooth`,
        block: `start`,
      });
  }, [id, T.length]);
  return (
    <div>
      <O
        eyebrow={`The stalls`}
        title={`Dealers`}
        subtitle={`${T.length ? `${T.length} card dealers` : `The card dealers`}, from the friendliest stall at El Rastro to the bank's treasury desk. Each level opens early for teams that earn it, and for everyone at a published time. Their prices come from rules; their words are their own.`}
      />
      {t.error && !t.data && (
        <S error={t.error} onRetry={t.refresh} className={`mb-4`} />
      )}
      {t.loading && !t.data ? (
        <div className={`flex flex-col gap-4`}>
          <U1 className={`h-36 rounded-2xl`} />
          <U1 className={`h-96 rounded-2xl`} />
        </div>
      ) : T.length === 0 ? (
        <S1
          title={`No dealers yet`}
          hint={`The organisers add them in the game-master console.`}
        />
      ) : (
        <>
          <nav
            className={`surface mb-8 overflow-x-auto p-5`}
            aria-label={`The dealer ladder`}
          >
            <ol className={`flex min-w-[720px] items-end gap-2`}>
              {T.map((t, n) => {
                let r = a(t, name, nowHours, E.get(t.id));
                let length = A.filter((e) => e.level >= t.level).length;
                return (
                  <li key={t.id} className={`flex flex-1 items-end gap-2`}>
                    <H_1
                      to={`/personas/${t.id}`}
                      className={r_1(
                        `group flex flex-1 flex-col items-center gap-2 rounded-2xl border px-3 pt-4 pb-3 text-center transition-colors`,
                        id === t.id
                          ? `border-gold/50 bg-gold/[0.07]`
                          : `border-line bg-base/40 hover:border-line-strong hover:bg-raised/60`,
                      )}
                      style={{
                        marginBottom: n * 10,
                      }}
                    >
                      <K1
                        avatar={t.avatar}
                        name={t.name}
                        size={`lg`}
                        status={
                          t.enabled
                            ? r.openNow
                              ? undefined
                              : `locked`
                            : `disabled`
                        }
                        ring={r.openNow && t.enabled}
                      />
                      <div className={`leading-tight`}>
                        <div
                          className={`font-display text-sm font-black text-gold`}
                        >
                          {`L`}
                          {t.level}
                          {` · `}
                          {E_1(t.level).name}
                        </div>
                        <div
                          className={`font-display text-xl font-extrabold text-ink`}
                        >
                          {t.name}
                        </div>
                      </div>
                      <div className={`text-xs font-semibold`}>
                        {t.enabled ? (
                          r.openNow ? (
                            <span className={`text-good`}>{`open to all`}</span>
                          ) : (
                            <span
                              className={`inline-flex items-center gap-1 text-gold`}
                            >
                              <Y1 className={`size-3`} aria-hidden />
                              {r.short === `Locked`
                                ? `locked`
                                : `opens for all ${r.short}`}
                            </span>
                          )
                        ) : (
                          <span className={`text-faint`}>{`away today`}</span>
                        )}
                      </div>
                      {A.length > 0 && (
                        <div className={`text-[11px] text-muted`}>
                          {length}
                          {`/`}
                          {A.length}
                          {` teams here`}
                        </div>
                      )}
                    </H_1>
                    {n < T.length - 1 && (
                      <O1
                        className={`mb-12 size-5 shrink-0 text-line-strong`}
                        aria-hidden
                      />
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
          <div className={`flex flex-col gap-6`}>
            {T.map((persona) => (
              <QComponent
                key={persona.id}
                persona={persona}
                index={index}
                nowHours={nowHours}
                opensAt={E.get(persona.id)}
                reached={{
                  n: A.filter((e) => e.level >= persona.level).length,
                  of: A.length,
                }}
                quote={D.get(persona.id)}
                name={name}
                highlighted={id === persona.id}
              />
            ))}
            {(t.data?.teasers ?? []).map((e) => (
              <section
                key={e.id}
                className={`flex items-center gap-5 rounded-[20px] border border-dashed border-gold/45 bg-gold/[0.05] p-6`}
              >
                <span
                  className={`grid size-16 shrink-0 place-items-center rounded-full border-2 border-dashed border-gold/50 text-2xl font-black text-faint`}
                  aria-hidden
                >{`?`}</span>
                <div className={`min-w-0`}>
                  <div
                    className={`text-[11px] font-extrabold tracking-[0.2em] text-gold uppercase`}
                  >{`Coming soon`}</div>
                  <h2
                    className={`font-display text-3xl font-extrabold text-ink`}
                  >
                    {e.name}
                  </h2>
                  {e.teaser && (
                    <p className={`mt-1 text-muted italic`}>{e.teaser}</p>
                  )}
                </div>
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
export { Component as default };
