import { i as i_1, n, t } from "./jsx-runtime.js";
import { a as R1, i, l, n as Ee1, o, r, s, t as S1 } from "./Cromo.js";
import { t as C1 } from "./Button.js";
import { t as Re1 } from "./EventLine.js";
import { t as Ie1 } from "./coins.js";
import { t as L1 } from "./EmptyState.js";
import {
  _ as __1,
  a as D1,
  c,
  d,
  h,
  i as i_2,
  r as r_1,
  s as s_1,
  t as t_2,
} from "./useEvents.js";
import { t as Le1 } from "./play.js";
import { n as Ue1, t as H1 } from "./ErrorNote.js";
import { n as n_2 } from "./catalog.js";
import { t as Fe1 } from "./RarityBadge.js";
import { t as G1 } from "./Sparkline.js";
import { t as _ } from "./KPI.js";
import { t as V1 } from "./LevelBadge.js";
import { t as Y1 } from "./PackCard.js";
import { t as Pe1 } from "./PageHeader.js";
import { t as B1 } from "./Panel.js";
import { t as X1 } from "./PersonaAvatar.js";
import { t as Me1 } from "./Slider.js";
import { t as He1 } from "./Tabs.js";
import { t as Ge1 } from "./Toggle.js";
import { t as _e } from "./YamlEditor.js";
import {
  C,
  D,
  H,
  I,
  L,
  O as O_1,
  S,
  _ as __2,
  a as We1,
  b,
  d as W1,
  f,
  g,
  h as h_1,
  i as Ke1,
  j as Ae,
  l as l_1,
  m,
  o as Me,
  p,
  r as r_2,
  s as Fe,
  u as E,
  v,
  w,
  y,
} from "./index.js";
const O = i_1(n(), 1);
const k = t();
const Re = [
  [`tokens`, `Tokens`],
  [`type`, `Type`],
  [`cromo`, `Cromo`],
  [`packs`, `Packs`],
  [`badges`, `Badges`],
  [`numbers`, `Numbers`],
  [`controls`, `Controls`],
  [`overlays`, `Overlays`],
  [`feedback`, `Feedback`],
  [`yaml`, `YAML`],
  [`live`, `Live`],
  [`format`, `Format`],
];
const ze = [
  {
    group: `Surfaces`,
    items: [
      [`base`, `#0B1020`, `bg-base`],
      [`panel`, `#121A2E`, `bg-panel`],
      [`raised`, `#18223B`, `bg-raised`],
      [`line`, `#22304D`, `border-line`],
      [`line-strong`, `#2E3F63`, `border-line-strong`],
    ],
  },
  {
    group: `Text`,
    items: [
      [`ink`, `#E8ECF6`, `text-ink`],
      [`muted`, `#8C97B2`, `text-muted`],
      [`faint`, `#5B6784`, `text-faint`],
      [`night`, `#0B1020`, `text-night (on gold)`],
    ],
  },
  {
    group: `Signals`,
    items: [
      [`accent`, `#FF5A5F`, `chulapo red · live, alerts`],
      [`gold`, `#FFC44D`, `card gold · highlights`],
      [`good`, `#3DDC97`, `text-good`],
      [`warn`, `#FFB020`, `text-warn`],
      [`info`, `#4C8DFF`, `text-info`],
    ],
  },
];
function AComponent({ id, title, lead, children }) {
  return (
    <section
      id={id}
      className={`scroll-mt-24 border-t border-line/70 py-10 first:border-t-0 first:pt-2`}
    >
      <h2 className={`text-3xl text-ink`}>{title}</h2>
      {lead && <p className={`mt-1.5 max-w-3xl text-sm text-muted`}>{lead}</p>}
      <div className={`mt-6`}>{children}</div>
    </section>
  );
}
function J1Component({ children }) {
  return (
    <div className={`mt-2 text-center font-mono text-[11px] text-faint`}>
      {children}
    </div>
  );
}
function Be(sets) {
  let t = [];
  for (let n of __1) {
    for (let set of sets) {
      let card = set.cards.find((e) => e.rarity === n);
      if (card) {
        t.push({
          card,
          set,
        });
        break;
      }
    }
  }
  return t;
}
function Ve(events, t, n = 30) {
  let r = Array(n).fill(0);
  for (let i of events) {
    if (i.type !== `settlement`) {
      continue;
    }
    let e = Math.floor((t - i.t) * 60);
    if (e >= 0 && e < n) {
      r[n - 1 - e] += 1;
    }
  }
  return r;
}
function MComponent() {
  let { index, error, refresh } = n_2();
  let M = t_2((e) => c.personas(e));
  let N = i_2((e) => c.leaderboard(e), 8000);
  let P = i_2((e) => c.feed(300, e), 8000);
  let { clock, nextTickIn } = l_1();
  let enabled = !!d();
  let R = t_2(
    async (e) =>
      (await s_1.cards({}, e)).assets
        .filter((e) => e.kind === `card`)
        .sort((e, t) => e.id - t.id)
        .slice(0, 12),
    [enabled],
    {
      enabled,
    },
  );
  let z = t_2((e) => c.card(999999, e));
  let B = r_1({
    scope: `public`,
    limit: 10,
  });
  let V = r_2();
  let [revealed, setRevealed] = O.useState(false);
  let [We, setWe] = O.useState(false);
  let [Ge, setGe] = O.useState(false);
  let [Ke, setKe] = O.useState(15);
  let [W, setW] = O.useState(true);
  let [K, setK] = O.useState(`catalogue`);
  let [Ye, setYe] = O.useState(`all`);
  let q = O.useMemo(() => {
    if (index) {
      return Be(index.catalog.sets);
    }
    return [];
  }, [index]);
  let J = O.useMemo(() => {
    let e = new Set();
    return [...B.events, ...[...(P.data?.events ?? [])].reverse()]
      .filter((t) => !e.has(t.id) && e.add(t.id))
      .slice(0, 10);
  }, [B.events, P.data]);
  let Y = q.find((e) => e.card.rarity === `legendary`) ?? q[q.length - 1];
  let X = q.find((e) => e.card.rarity === `epic`);
  let Z = O.useMemo(() => {
    if (P.data && clock) {
      return Ve(P.data.events, clock.t_hours);
    }
    return [];
  }, [P.data, clock]);
  let Ze = index?.catalog.sets.reduce(
    (e, t) => e + t.cards.reduce((acc, card) => acc + card.minted, 0),
    0,
  );
  let Qe = N.data?.teams.reduce((e, t) => e + t.deals, 0);
  let Q = index?.symbol ?? `P`;
  let $ = M.data?.personas[0];
  return (
    <div className={`grid gap-10 lg:grid-cols-[180px_minmax(0,1fr)]`}>
      <aside className={`hidden lg:block`}>
        <nav className={`sticky top-24 flex flex-col gap-0.5 text-sm`}>
          <div className={`eyebrow mb-2`}>{`Styleguide`}</div>
          {Re.map(([e, t]) => (
            <a
              key={e}
              href={`#${e}`}
              className={`rounded-md px-2 py-1 text-muted hover:bg-raised hover:text-ink`}
            >
              {t}
            </a>
          ))}
          <H
            to={`/admin`}
            className={`mt-4 px-2 text-xs text-faint hover:text-ink`}
          >{`→ control room`}</H>
        </nav>
      </aside>
      <div className={`min-w-0`}>
        <Pe1
          eyebrow={`Design system · Madrid night market`}
          title={`Styleguide`}
          subtitle={`Every shared component with real data from this server: the catalogue, the dealers, the leaderboard, the feed and real card instances. Import from '@/components'.`}
          actions=<Me />
        />
        {error && <H1 error={error} onRetry={refresh} className={`mb-6`} />}
        <AComponent
          id={`tokens`}
          title={`Tokens`}
          lead={`Tailwind utilities from @theme (bg-panel, text-muted, border-line …) and the same names as CSS variables (var(--color-gold)). One deliberate dark look.`}
        >
          <div className={`grid gap-6 md:grid-cols-3`}>
            {ze.map((e) => (
              <B1 key={e.group} title={e.group} tone={`raised`}>
                <div className={`flex flex-col gap-2`}>
                  {e.items.map(([e, t, n]) => (
                    <div key={e} className={`flex items-center gap-3`}>
                      <span
                        className={`size-9 shrink-0 rounded-lg border border-white/10`}
                        style={{
                          background: t,
                        }}
                      />
                      <div className={`min-w-0`}>
                        <div className={`text-sm font-semibold`}>{e}</div>
                        <div
                          className={`truncate font-mono text-[11px] text-muted`}
                        >
                          {t}
                          {` · `}
                          {n}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </B1>
            ))}
          </div>
          <B1
            title={`Rarities`}
            subtitle={`colours and labels from /api/catalog (rarities)`}
            className={`mt-6`}
          >
            <div className={`grid grid-cols-2 gap-3 sm:grid-cols-5`}>
              {__1.map((t) => (
                <div key={t} className={`rounded-xl border border-line p-3`}>
                  <div
                    className={`h-10 rounded-lg`}
                    style={{
                      background: index?.rarityColor(t),
                    }}
                  />
                  <div className={`mt-2 text-sm font-semibold`}>
                    {index?.rarityLabel(t) ?? t}
                  </div>
                  <div className={`font-mono text-[11px] text-muted`}>
                    {t}
                    {` · book `}
                    {v(index?.catalog.rarities[t]?.book, {
                      symbol: Q,
                    })}
                    {` · ×`}
                    {index?.catalog.rarities[t]?.print_run}
                  </div>
                </div>
              ))}
            </div>
          </B1>
        </AComponent>
        <AComponent
          id={`type`}
          title={`Type`}
          lead={`Big Shoulders Display for display numbers and headings, Manrope for body, JetBrains Mono for data and code — all bundled via @fontsource, so the venue can run offline.`}
        >
          <div className={`grid gap-6 md:grid-cols-3`}>
            <B1 title={`Display`} subtitle={`font-display · h1–h4`}>
              <div
                className={`font-display text-6xl font-extrabold leading-none`}
              >{`El Rastro`}</div>
              <div className={`mt-3 flex items-baseline gap-3`}>
                <Fe
                  value={clock?.tick ?? null}
                  className={`text-5xl text-gold`}
                />
                <span className={`text-xs text-muted`}>
                  {`<Num/>`}
                  {`: fixed-width digits (the font has no tnum)`}
                </span>
              </div>
            </B1>
            <B1 title={`Body`} subtitle={`font-sans · Manrope`}>
              <p className={`text-sm leading-relaxed text-ink`}>
                {$?.bio ?? `…`}
              </p>
              <p
                className={`mt-2 text-xs text-muted`}
              >{`text-muted for secondary lines.`}</p>
            </B1>
            <B1 title={`Data`} subtitle={`font-mono · JetBrains Mono`}>
              <div className={`font-mono text-sm text-ink`}>
                {R.data?.[0]
                  ? `${R.data[0].ref} ${S(R.data[0].serial, R.data[0].print_run)}`
                  : `…`}
                <br />
                <span className={`text-muted`}>{`X-Team-Key: tk_…`}</span>
              </div>
              <div className={`eyebrow mt-3`}>{`eyebrow label`}</div>
            </B1>
          </div>
        </AComponent>
        <AComponent
          id={`cromo`}
          title={`Cromo`}
          lead={`The showpiece, drawn as a Cartel poster: the set's colour as a sunset, the card's scene in flat silhouettes (deterministic from the name and id), the name as a big condensed title, a plum bar with set, number, serial and rarity, a value chip. Uncommons get an inner frame, rares a holo sheen, epic and legendary shimmer inside a turning foil edge; hover tilts md and lg; everything respects reduced motion.`}
        >
          <div
            className={`eyebrow mb-3`}
          >{`One of each rarity · md · from the catalogue`}</div>
          <div className={`flex flex-wrap items-end gap-5`}>
            {q.map(({ card, set }) => (
              <div key={card.id}>
                <S1 {...r(card, set, index)} size={`md`} />
                <J1Component>
                  {card.id}
                  {` · minted `}
                  {card.minted}
                  {`/`}
                  {card.print_run}
                </J1Component>
              </div>
            ))}
            {!index &&
              Array.from(
                {
                  length: 5,
                },
                (e, key) => (
                  <D1 key={key} className={`h-[246px] w-[176px] rounded-2xl`} />
                ),
              )}
          </div>
          <div
            className={`eyebrow mb-3 mt-10`}
          >{`Real card instances · serial numbers · /api/admin/cards (organiser token)`}</div>
          <div className={`flex flex-wrap gap-3`}>
            {R.data?.map((t) => (
              <div key={t.id}>
                <S1
                  {...i(t.ref, index, {
                    serial: t.serial,
                    printRun: t.print_run,
                  })}
                  size={`sm`}
                />
                <J1Component>
                  {`asset `}
                  {t.id}
                </J1Component>
              </div>
            ))}
            {R.data && !R.data.length && (
              <L1
                compact
                title={`No cards minted yet`}
                hint={`Teams get their starting cards when they join.`}
              />
            )}
            {!enabled && (
              <L1
                compact
                title={`Organiser token needed`}
                hint={`Copies and their serials are private to their holders; open the control room once (it keeps the token in this browser) to see them here.`}
                action=<H
                  to={`/admin`}
                  className={`text-sm font-semibold text-gold hover:underline`}
                >{`→ control room`}</H>
              />
            )}
            {R.error ? <H1 error={R.error} onRetry={R.refresh} /> : null}
          </div>
          {Y && (
            <>
              <div
                className={`eyebrow mb-3 mt-10`}
              >{`Sizes · sm · md · lg (lg shows the flavour)`}</div>
              <div className={`flex flex-wrap items-end gap-6`}>
                {[`sm`, `md`, `lg`].map((t) => (
                  <div key={t}>
                    <S1
                      {...r(Y.card, Y.set, index)}
                      size={t}
                      yourValue={t === `lg` ? Y.card.book : undefined}
                    />
                    <J1Component>
                      {`size="`}
                      {t}
                      {`"`}
                      {t === `lg` ? ` · yourValue (book shown here)` : ``}
                    </J1Component>
                  </div>
                ))}
              </div>
              <div className={`eyebrow mb-3 mt-10`}>{`States`}</div>
              <div className={`flex flex-wrap items-end gap-6`}>
                <div>
                  <S1 {...r(Y.card, Y.set, index)} faceDown />
                  <J1Component>{`faceDown`}</J1Component>
                </div>
                <div>
                  <S1 {...r(Y.card, Y.set, index)} empty />
                  <J1Component>{`empty (album slot)`}</J1Component>
                </div>
                <div>
                  <S1
                    {...r(Y.card, Y.set, index)}
                    secret
                    selected
                    onClick={() =>
                      V.gold(Y.card.name, `onClick + selected + secret`)
                    }
                  />
                  <J1Component>{`secret · selected · onClick`}</J1Component>
                </div>
                <div className={`flex flex-col items-center`}>
                  <Ee1
                    {...r((X ?? Y).card, (X ?? Y).set, index)}
                    revealed={revealed}
                  />
                  <C1
                    size={`sm`}
                    variant={`subtle`}
                    className={`mt-2`}
                    icon=<Ue1 className={`size-3.5`} />
                    onClick={() => setRevealed((e) => !e)}
                  >{`FlipCromo`}</C1>
                </div>
              </div>
              <div
                className={`eyebrow mb-3 mt-10`}
              >{`Cartel scenes · one set's colours · a card gets the first scene its name asks for that no earlier card of its set took; else a free ★ one by its id`}</div>
              <div
                className={`grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6`}
              >
                {o.map((e) => (
                  <div
                    key={e}
                    className={`overflow-hidden rounded-xl border border-line`}
                  >
                    <R1
                      seed={Y.card.id}
                      name={Y.card.name}
                      setColor={Y.set.color}
                      rarity={`common`}
                      scene={e}
                      variant={`scene`}
                      className={`block aspect-[240/212] w-full`}
                    />
                    <div
                      className={`bg-panel px-2 py-1 text-center font-mono text-[10px] text-muted`}
                    >
                      <span className={`text-ink`}>
                        {e}
                        {s.includes(e) ? ` ★` : ``}
                      </span>
                      <span
                        className={`block truncate`}
                        title={l(e).join(`, `)}
                      >
                        {l(e).join(` · `)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div
                className={`eyebrow mb-3 mt-10`}
              >{`One scene in every set's colours · the set colour drives sky, walls and neon; ink, cream and sun are shared`}</div>
              <div className={`grid grid-cols-3 gap-3 sm:grid-cols-6`}>
                {index?.catalog.sets.map((e) => (
                  <div
                    key={e.id}
                    className={`overflow-hidden rounded-xl border border-line`}
                  >
                    <R1
                      seed={e.id}
                      name={e.name}
                      setColor={e.color}
                      rarity={`common`}
                      scene={`rooftops`}
                      variant={`scene`}
                      className={`block aspect-[240/212] w-full`}
                    />
                    <div
                      className={`bg-panel py-1 text-center font-mono text-[10px] text-muted`}
                    >
                      {e.id}
                      {` · `}
                      {e.color}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </AComponent>
        <AComponent
          id={`packs`}
          title={`PackCard`}
          lead={`Sealed packs from /api/catalog (packs): colour, one pip per card coloured by its best possible rarity, expected book value.`}
        >
          <div className={`flex flex-wrap items-end gap-6`}>
            {index?.catalog.packs.map((e) => (
              <div key={e.id}>
                <Y1
                  name={e.name}
                  color={e.color}
                  odds={e.slots}
                  expectedBook={e.expected_book}
                  currency={Q}
                  onClick={() =>
                    V.info(
                      e.name,
                      `${e.slots.length} cards · ≈${v(e.expected_book, {
                        symbol: Q,
                      })}`,
                    )
                  }
                />
                <J1Component>{e.id}</J1Component>
              </div>
            ))}
          </div>
          <div className={`mt-6 flex items-end gap-6`}>
            {index?.catalog.packs[0] &&
              [`sm`, `md`, `lg`].map((t) => (
                <Y1
                  key={t}
                  name={index.catalog.packs[0].name}
                  color={index.catalog.packs[0].color}
                  odds={index.catalog.packs[0].slots}
                  size={t}
                  serial={t === `lg` ? 1 : undefined}
                />
              ))}
          </div>
        </AComponent>
        <AComponent id={`badges`} title={`Badges, avatars, chips`}>
          <div className={`grid gap-6 lg:grid-cols-2`}>
            <B1
              title={`RarityBadge`}
              subtitle={`soft · solid · dot — catalogue labels and print runs`}
            >
              <div className={`flex flex-col gap-3`}>
                {[`soft`, `solid`, `dot`].map((t) => (
                  <div key={t} className={`flex flex-wrap items-center gap-2`}>
                    {__1.map((n) => (
                      <Fe1
                        key={n}
                        rarity={n}
                        variant={t}
                        label={index?.rarityLabel(n)}
                        printRun={
                          t === `soft`
                            ? index?.catalog.rarities[n]?.print_run
                            : undefined
                        }
                      />
                    ))}
                  </div>
                ))}
              </div>
            </B1>
            <B1 title={`LevelBadge`} subtitle={`the five-step dealer ladder`}>
              <div className={`flex flex-col items-start gap-2`}>
                {h.map((e) => (
                  <div key={e.level} className={`flex items-center gap-3`}>
                    <V1 level={e.level} showName locked={e.level > 3} />
                    <span className={`text-xs text-muted`}>{e.blurb}</span>
                  </div>
                ))}
              </div>
            </B1>
            <B1
              title={`PersonaAvatar`}
              subtitle={`/api/dealers · sizes and states`}
            >
              <div className={`flex flex-wrap items-end gap-5`}>
                {M.data?.personas.map((e) => (
                  <div
                    key={e.id}
                    className={`flex flex-col items-center gap-1.5`}
                  >
                    <X1
                      avatar={e.avatar}
                      name={e.name}
                      size={`lg`}
                      status={e.open_to_all ? undefined : `locked`}
                    />
                    <span className={`text-xs font-semibold`}>{e.name}</span>
                    <V1 level={e.level} />
                  </div>
                ))}
              </div>
              {$ && (
                <div className={`mt-5 flex items-end gap-4`}>
                  {[`xs`, `sm`, `md`, `lg`, `xl`].map((e) => (
                    <X1
                      key={e}
                      avatar={$.avatar}
                      name={$.name}
                      size={e}
                      ring={e === `xl`}
                    />
                  ))}
                  <X1 avatar={$.avatar} name={$.name} status={`cooloff`} />
                  <X1 avatar={$.avatar} name={$.name} status={`disabled`} />
                </div>
              )}
            </B1>
            <B1
              title={`Chip · LiveDot`}
              subtitle={`tones for signals and rarities`}
            >
              <div className={`flex flex-wrap gap-2`}>
                <E live tone={`accent`}>{`live`}</E>
                <E
                  tone={`gold`}
                  icon=<Ae className={`size-3`} />
                >{`egg found`}</E>
                <E tone={`good`} dot>{`deal`}</E>
                <E tone={`warn`} dot>{`cool-off`}</E>
                <E tone={`info`}>{`queued`}</E>
                <E tone={`neutral`}>{`open`}</E>
                <E tone={`muted`}>{`expired`}</E>
                <E tone={`epic`}>{`epic`}</E>
                <E tone={`legendary`}>{`legendary`}</E>
                <E
                  tone={`neutral`}
                  onRemove={() => V.info(`Chip removed`)}
                >{`removable`}</E>
              </div>
              <div
                className={`mt-4 flex items-center gap-4 text-xs text-muted`}
              >
                <W1 />
                {` accent `}
                <W1 tone={`good`} />
                {` good `}
                <W1 tone={`gold`} />
                {` gold `}
                <W1 tone={`muted`} />
                {` muted`}
              </div>
            </B1>
          </div>
        </AComponent>
        <AComponent
          id={`numbers`}
          title={`KPI · Sparkline · Num`}
          lead={`Big numbers in Big Shoulders with fixed-width digits. Values below are live: leaderboard, catalogue, clock, and settlements per game minute from the public feed.`}
        >
          <div className={`grid grid-cols-2 gap-4 lg:grid-cols-4`}>
            <_
              label={`Teams`}
              value={N.data?.teams.length ?? null}
              icon=<D className={`size-4`} />
              hint={`/api/leaderboard`}
            />
            <_
              label={`Deals settled`}
              value={Qe ?? null}
              tone={`good`}
              icon=<O_1 className={`size-4`} />
              trend={Z}
              trendBars
              hint={`bars: settlements per game minute`}
            />
            <_
              label={`Cards minted`}
              value={Ze ?? null}
              tone={`gold`}
              icon=<I className={`size-4`} />
              hint={`across all sets`}
            />
            <_
              label={`Next tick`}
              value={m(nextTickIn)}
              tone={`accent`}
              icon=<L className={`size-4`} />
              hint={clock ? `every ${clock.tick_seconds}s` : undefined}
            />
          </div>
          <div className={`mt-4 grid gap-4 md:grid-cols-2`}>
            <_
              size={`lg`}
              label={`Top score`}
              value={N.data?.teams[0]?.score ?? null}
              format={(e) => y(e, 2)}
              icon=<Ie1 className={`size-4`} />
              hint={
                N.data?.teams[0]
                  ? `${N.data.teams[0].name} · ${N.data.teams[0].deals} deals`
                  : undefined
              }
            />
            <B1
              title={`Sparkline`}
              subtitle={`line · bars · flat and empty series`}
            >
              <div className={`flex flex-wrap items-center gap-6`}>
                <G1
                  data={Z}
                  width={160}
                  height={40}
                  label={`settlements per game minute`}
                />
                <G1
                  data={Z}
                  bars
                  width={160}
                  height={40}
                  color={`var(--color-good)`}
                />
                <G1
                  data={[]}
                  width={100}
                  height={40}
                  color={`var(--color-muted)`}
                />
              </div>
            </B1>
          </div>
        </AComponent>
        <AComponent id={`controls`} title={`Controls`}>
          <div className={`grid gap-6 lg:grid-cols-2`}>
            <B1
              title={`Button`}
              subtitle={`primary · secondary · ghost · danger · subtle; sm · md · lg; icon; loading`}
            >
              <div className={`flex flex-wrap items-center gap-2`}>
                <C1
                  variant={`primary`}
                  icon=<Le1 className={`size-4`} />
                >{`Resume`}</C1>
                <C1>{`Secondary`}</C1>
                <C1 variant={`ghost`}>{`Ghost`}</C1>
                <C1 variant={`danger`}>{`Suspend venue`}</C1>
                <C1 variant={`subtle`}>{`Subtle`}</C1>
                <C1 loading>{`Saving`}</C1>
              </div>
              <div className={`mt-3 flex flex-wrap items-center gap-2`}>
                <C1 size={`sm`}>{`Small`}</C1>
                <C1 size={`md`}>{`Medium`}</C1>
                <C1 size={`lg`} variant={`primary`}>{`Large`}</C1>
                <C1 disabled>{`Disabled`}</C1>
              </div>
            </B1>
            <B1
              title={`Slider · Toggle`}
              subtitle={`a local demo of the tick dial — it does not change the game clock`}
            >
              <Me1
                label={`Tick (demo)`}
                value={Ke}
                min={clock?.min_tick_seconds ?? 5}
                max={clock?.max_tick_seconds ?? 60}
                step={1}
                onChange={setKe}
                format={(e) => `${e}s`}
                marks={[
                  clock?.min_tick_seconds ?? 5,
                  15,
                  30,
                  45,
                  clock?.max_tick_seconds ?? 60,
                ]}
              />
              <div className={`mt-5 flex flex-wrap gap-6`}>
                <Ge1
                  checked={W}
                  onChange={setW}
                  label={`Dealer enabled`}
                  description={`role=switch`}
                />
                <Ge1
                  checked={!W}
                  onChange={(e) => setW(!e)}
                  label={`Paused`}
                  tone={`accent`}
                  size={`sm`}
                />
              </div>
            </B1>
            <B1
              title={`Tabs`}
              subtitle={`underline (default) and pills; arrow keys move`}
              className={`lg:col-span-2`}
            >
              <He1
                value={K}
                onChange={setK}
                tabs={[
                  {
                    id: `catalogue`,
                    label: `Catalogue`,
                    count: index?.catalog.sets.length,
                  },
                  {
                    id: `personas`,
                    label: `Dealers`,
                    count: M.data?.personas.length,
                  },
                  {
                    id: `events`,
                    label: `Events`,
                    count: P.data?.events.length,
                  },
                ]}
              />
              <div className={`mt-3 text-sm text-muted`}>
                {K === `catalogue` &&
                  `${index?.catalog.sets.length ?? `…`} sets, ${index?.cards.size ?? `…`} cards visible`}
                {K === `personas` &&
                  M.data?.personas.map((e) => e.name).join(` · `)}
                {K === `events` &&
                  `${P.data?.events.length ?? `…`} public events in the feed`}
              </div>
              <He1
                variant={`pills`}
                size={`sm`}
                className={`mt-5 w-fit`}
                value={Ye}
                onChange={setYe}
                tabs={[
                  {
                    id: `all`,
                    label: `All`,
                  },
                  ...__1.map((id) => ({
                    id,
                    label: index?.rarityLabel(id) ?? id,
                  })),
                ]}
              />
            </B1>
          </div>
        </AComponent>
        <AComponent id={`overlays`} title={`Modal · Drawer · Toast`}>
          <div className={`flex flex-wrap gap-2`}>
            <C1 onClick={() => setWe(true)}>{`Open modal`}</C1>
            <C1 onClick={() => setGe(true)}>{`Open drawer`}</C1>
            <C1
              variant={`subtle`}
              onClick={() => V.success(`toast.success`, $?.name)}
            >{`toast.success`}</C1>
            <C1
              variant={`subtle`}
              onClick={() => V.gold(`toast.gold`, Y?.card.name)}
            >{`toast.gold`}</C1>
            <C1
              variant={`subtle`}
              onClick={() => V.error(z.error, `Could not load the card`)}
            >{`toast.error (real 404)`}</C1>
          </div>
          <We1
            open={We}
            onClose={() => setWe(false)}
            title={`Suspend venue?`}
            description={`Offers stop settling and part of the bond is slashed.`}
            footer=<>
              <C1 variant={`ghost`} onClick={() => setWe(false)}>{`Cancel`}</C1>
              <C1
                variant={`danger`}
                onClick={() => setWe(false)}
              >{`Suspend`}</C1>
            </>
          >
            <p
              className={`text-sm text-muted`}
            >{`Escape closes; focus stays inside; the page behind does not scroll.`}</p>
          </We1>
          <Ke1
            open={Ge}
            onClose={() => setGe(false)}
            title={Y?.card.name ?? `Card`}
            description={`A drawer for details: a thread, a team, a card's provenance.`}
          >
            {Y && (
              <div className={`flex flex-col items-center gap-4`}>
                <S1 {...r(Y.card, Y.set, index)} size={`lg`} />
                <p className={`text-center text-sm italic text-muted`}>
                  {Y.card.flavour}
                </p>
              </div>
            )}
          </Ke1>
        </AComponent>
        <AComponent id={`feedback`} title={`EmptyState · ErrorNote · Skeleton`}>
          <div className={`grid gap-6 lg:grid-cols-3`}>
            <B1 title={`EmptyState`}>
              <L1
                compact
                title={`No negotiations yet`}
                hint={`Threads appear when a team opens one.`}
              />
            </B1>
            <B1
              title={`ErrorNote`}
              subtitle={`a real error: GET /api/cards/999999`}
            >
              {z.error ? (
                <H1 error={z.error} onRetry={z.refresh} />
              ) : (
                <D1 lines={2} />
              )}
            </B1>
            <B1 title={`Skeleton`}>
              <div className={`flex items-center gap-3`}>
                <D1 className={`size-12 rounded-full`} />
                <div className={`flex-1`}>
                  <D1 lines={3} />
                </div>
              </div>
            </B1>
          </div>
        </AComponent>
        <AComponent
          id={`yaml`}
          title={`YamlEditor`}
          lead={`CodeMirror 6 with the Bazaar theme, lazy-loaded. Here: the first public dealer profile (JSON is valid YAML). The persona editor feeds it the real persona YAML.`}
        >
          {$ ? (
            <_e value={JSON.stringify($, null, 2)} readOnly height={`300px`} />
          ) : (
            <D1 className={`h-72 rounded-xl`} />
          )}
        </AComponent>
        <AComponent
          id={`live`}
          title={`Live stream`}
          lead={`useEvents({ scope: 'public' }) — one shared SSE connection per scope; ticks excluded — rendered with <EventLine/>, which words every event type (lib/describe.ts). Admin pages pass scope: 'admin' and admin to EventLine for the private detail.`}
        >
          <B1
            live={B.status === `open`}
            title={`Public events`}
            subtitle={`status ${B.status} · last tick ${B.lastTick ?? `—`}`}
            actions=<H
              to={`/admin/events`}
              className={`text-xs text-muted hover:text-ink`}
            >{`event log →`}</H>
          >
            {J.length ? (
              <ul className={`flex flex-col divide-y divide-line/60`}>
                {J.map((event) => (
                  <li key={event.id}>
                    <Re1 event={event} nowHours={clock?.t_hours} />
                  </li>
                ))}
              </ul>
            ) : (
              <L1
                compact
                title={`Waiting for the next event`}
                hint={`Anything a team does shows up here within a tick.`}
              />
            )}
            {B.events[0] && (
              <details className={`mt-3 text-xs text-muted`}>
                <summary className={`cursor-pointer select-none`}>
                  {`raw payload of the newest event (`}
                  {__2(B.events[0].type)}
                  {`)`}
                </summary>
                <pre
                  className={`mt-2 overflow-x-auto rounded-lg bg-base/70 p-3 font-mono text-[11px] text-muted`}
                >
                  {JSON.stringify(B.events[0], null, 2)}
                </pre>
              </details>
            )}
          </B1>
        </AComponent>
        <AComponent
          id={`format`}
          title={`Formatting`}
          lead={`src/lib/format.ts — en-US grouping everywhere, a true minus sign, the currency symbol (P) from the catalogue.`}
        >
          <B1 padded={false}>
            <table className={`bz-table`}>
              <thead>
                <tr>
                  <th>{`Call`}</th>
                  <th>{`Output`}</th>
                </tr>
              </thead>
              <tbody className={`font-mono text-xs`}>
                {[
                  [
                    `money(${Y?.card.book ?? 450})`,
                    v(Y?.card.book ?? 450, {
                      symbol: Q,
                    }),
                  ],
                  [
                    `money(-9.2, { decimals: 1 })`,
                    v(-9.2, {
                      symbol: Q,
                      decimals: 1,
                    }),
                  ],
                  [
                    `money(125000, { compact: true })`,
                    v(125000, {
                      symbol: Q,
                      compact: true,
                    }),
                  ],
                  [`signed(12.5, 1)`, C(12.5, 1)],
                  [`pct(0.25)`, b(0.25)],
                  [`bps(350)`, p(350)],
                  [`tick(${clock?.tick ?? 0})`, w(clock?.tick ?? 0)],
                  [`gameClock(${clock?.t_hours ?? 0})`, g(clock?.t_hours ?? 0)],
                  [`duration(2.25)`, h_1(2.25)],
                  [`ago(0, ${clock?.t_hours ?? 0})`, f(0, clock?.t_hours ?? 0)],
                  [`countdown(${(nextTickIn ?? 0).toFixed(1)})`, m(nextTickIn)],
                  [`serial(7, 30)`, S(7, 30)],
                ].map(([e, t]) => (
                  <tr key={e}>
                    <td className={`text-muted`}>{e}</td>
                    <td className={`text-ink`}>{t}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </B1>
        </AComponent>
      </div>
    </div>
  );
}
export { MComponent as default };
