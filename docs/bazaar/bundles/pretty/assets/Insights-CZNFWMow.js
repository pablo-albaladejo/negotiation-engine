import { i, n, t } from "./jsx-runtime-CU3EbJiN.js";
import { i as i_2, r as r_1 } from "./Button-DIaWEsZ9.js";
import { n as A1, t as O1 } from "./arrow-up-ebU7lgQM.js";
import { t as S1 } from "./handshake-BOxgdx9P.js";
import { t as C1 } from "./EmptyState-BxhxbZPA.js";
import { a as L1, i as i_3, s } from "./useEvents-BpJ5PfZT.js";
import { t as F1 } from "./ErrorNote-Ca3ig8px.js";
import { t as P1 } from "./Sparkline-0X5dHX-k.js";
import { t as M1 } from "./KPI-BYUa0IMS.js";
import { t as H1 } from "./LevelBadge-BVpKP7Tt.js";
import { t as G1 } from "./PageHeader-B1UyPTkh.js";
import { t as _ } from "./Panel-DtYcp5Ol.js";
import { t as Ee } from "./Tabs-BcELG-Ib.js";
import {
  A as A_1,
  C as C_1,
  E,
  G,
  K,
  b,
  i as S,
  k as C,
  p,
  u as T,
  v,
  x,
  y,
  z as K1,
} from "./index-B_RfsMCE.js";
const A = {
  name: `grid-3x3`,
  size: 24,
  node: [
    [
      `rect`,
      {
        width: `18`,
        height: `18`,
        x: `3`,
        y: `3`,
        rx: `2`,
        key: `afitv7`,
      },
    ],
    [
      `path`,
      {
        d: `M3 9h18`,
        key: `1pudct`,
      },
    ],
    [
      `path`,
      {
        d: `M3 15h18`,
        key: `5xshup`,
      },
    ],
    [
      `path`,
      {
        d: `M9 3v18`,
        key: `fh3hqa`,
      },
    ],
    [
      `path`,
      {
        d: `M15 3v18`,
        key: `14nvp0`,
      },
    ],
  ],
  aliases: [`grid`, `grid-3-x-3`],
};
A.node;
const J1 = i_2(A);
const M = i(n(), 1);
const N = t();
const P = 10000;
const F = 0.0005;
const I = `[&_td]:px-2! [&_th]:px-2!`;
const L = (hours, t, n) => Math.min(n, Math.max(t + 4, hours * t));
const R = (e) => {
  if (e.market.bench.efficiency === null || e.market.bench.auto === null) {
    return null;
  }
  return e.market.bench.efficiency - e.market.bench.auto;
};
const z = {
  name: (e) => e.name.toLowerCase(),
  talks: (e) => e.personas.opened,
  deals: (e) => e.personas.deals,
  share: (e) => e.personas.share ?? -1,
  speed: (e) => e.personas.speed ?? -1,
  walk: (e) => e.personas.walk_rate ?? -1,
  finals: (e) => {
    if (e.personas.finals.offered) {
      return e.personas.finals.taken / e.personas.finals.offered;
    }
    return -1;
  },
  strikes: (e) => e.personas.strikes,
  trades: (e) => e.trading.trades,
  value: (e) => e.trading.value_created,
  partner: (e) => e.trading.counterparties[0]?.share ?? -1,
  hosted: (e) => e.market.trades_hosted,
  organic: (e) => e.market.organic_value,
  bench: (e) => R(e) ?? -9,
  duels: (e) => e.duels.played,
  dealRate: (e) => e.duels.deal_rate ?? -1,
  seller: (e) => e.duels.share_as_seller ?? -1,
  buyer: (e) => e.duels.share_as_buyer ?? -1,
  messages: (e) => e.activity.messages,
  offers: (e) => e.activity.offers,
  settlements: (e) => e.activity.settlements,
};
const B = (e) => e.reduce((acc, item) => acc + item, 0);
function V(e) {
  let t = e.market.venues.filter((e) => e.status === `open`);
  return (
    t.find((e) => !e.starter) ??
    t[0] ??
    e.market.venues.find((e) => !e.starter) ??
    e.market.venues[e.market.venues.length - 1]
  );
}
function HComponent() {
  let { id } = K();
  let t = G();
  let n = i_3((e) => s.insights(e), P);
  let n_data = n.data;
  let [i, setI] = M.useState({
    key: `name`,
    dir: 1,
  });
  let sym = n_data?.currency ?? `P`;
  let rows = M.useMemo(() => {
    let e = z[i.key];
    return [...(n_data?.teams ?? [])].sort((t, n) => {
      let r = e(t);
      let a = e(n);
      return (r < a ? -1 : +(r > a)) * i.dir || t.name.localeCompare(n.name);
    });
  }, [n_data, i]);
  let team = id ? n_data?.teams.find((t) => t.team === id) : undefined;
  let onOpen = (e) => t(`/admin/insights/${e}`);
  return (
    <div>
      <G1
        eyebrow={`Game master`}
        title={`Insights`}
        subtitle={`How each team plays: how it haggles with the personas, whom it trades with and where, what its venues host, how it duels, and when it is active. Private values included; click a row for the team's drill-down.`}
        actions={
          n_data && (
            <T tone={`muted`} title={`refreshes every ${P / 1000} s`}>
              {`tick `}
              {y(n_data.tick)}
              {` · game hour `}
              {y(n_data.t, 1)}
            </T>
          )
        }
      />
      {n.error && <F1 error={n.error} onRetry={n.refresh} className={`mb-4`} />}
      {!n_data && n.loading ? (
        <div className={`flex flex-col gap-4`}>
          <L1 className={`h-28 rounded-2xl`} />
          <L1 className={`h-80 rounded-2xl`} />
        </div>
      ) : n_data?.teams.length ? (
        <div className={`flex flex-col gap-4`}>
          <UComponent data={n_data} sym={sym} />
          <GComponent
            rows={rows}
            sort={i}
            setSort={setI}
            sym={sym}
            hours={n_data.hours}
            selected={id}
            onOpen={onOpen}
          />
          <IeComponent data={n_data} sym={sym} selected={id} onOpen={onOpen} />
        </div>
      ) : (
        <C1
          icon=<K1 className={`size-6`} />
          title={`No teams yet`}
          hint={`Insights fill in as teams talk to the personas, trade, open venues and duel.`}
        />
      )}
      <AeComponent
        teamId={id ?? null}
        team={team}
        data={n_data}
        sym={sym}
        onOpen={onOpen}
        onClose={() => t(`/admin/insights`)}
      />
    </div>
  );
}
function UComponent({ data, sym }) {
  let data_teams = data.teams;
  let r = B(data_teams.map((e) => e.personas.deals));
  let i = B(data.matrix.count.flat()) / 2;
  let a = B(data.matrix.value.flat()) / 2;
  let o = B(data_teams.map((e) => e.duels.played)) / 2;
  let c = B(data_teams.map((e) => e.duels.deals)) / 2;
  return (
    <div className={`grid grid-cols-2 gap-3 lg:grid-cols-4`}>
      <M1
        label={`Persona deals`}
        value={r}
        icon=<E className={`size-4`} />
        tone={`gold`}
        hint={`${y(B(data_teams.map((e) => e.personas.negotiated)))} talks negotiated · ${y(B(data_teams.map((e) => e.personas.took_opening)))} deals at the opening`}
      />
      <M1
        label={`Team trades`}
        value={i}
        icon=<S1 className={`size-4`} />
        tone={`info`}
        hint={`${v(a, {
          symbol: sym,
        })} created, both sides' surplus + fees`}
      />
      <M1
        label={`On team venues`}
        value={B(data_teams.map((e) => e.market.organic_value))}
        format={(e) =>
          v(e, {
            symbol: sym,
          })
        }
        icon=<A_1 className={`size-4`} />
        tone={`good`}
        hint={`${x(B(data_teams.map((e) => e.market.trades_hosted)), `trade`)} hosted between other teams`}
      />
      <M1
        label={`Duels decided`}
        value={o}
        icon=<C className={`size-4`} />
        tone={`accent`}
        hint={
          o ? `deal rate ${b(c / o)} · practice apart` : `no scored duel yet`
        }
      />
    </div>
  );
}
const W = [
  {
    label: `Personas`,
    span: 7,
    cls: `border-b-gold/40! text-gold!`,
    title: `persona conversations: counts over every talk; share, speed and walk % over negotiated talks (both sides made an offer)`,
  },
  {
    label: `Trading`,
    span: 4,
    cls: `border-b-info/40! text-info!`,
    title: `team-to-team trades (personas excluded)`,
  },
  {
    label: `Market`,
    span: 4,
    cls: `border-b-good/40! text-good!`,
    title: `the team's venues: trades they host between other teams, and the Market Test`,
  },
  {
    label: `Duels`,
    span: 4,
    cls: `border-b-accent/40! text-accent!`,
    title: `scored duels (practice sessions apart)`,
  },
  {
    label: `Activity`,
    span: 3,
    cls: `border-b-line-strong! text-muted!`,
    title: `messages, offers and settled trades`,
  },
];
function GComponent({ rows, sort, setSort, sym, hours, selected, onOpen }) {
  let u = (e, r, className, title, rowSpan) => (
    <th className={className} title={title} rowSpan={rowSpan}>
      <button
        type={`button`}
        onClick={() =>
          setSort((t) => ({
            key: e,
            dir: t.key === e ? -t.dir : e === `name` ? 1 : -1,
          }))
        }
        className={r_1(
          `inline-flex items-center gap-1 whitespace-nowrap uppercase tracking-[0.12em] hover:text-ink`,
          sort.key === e && `text-gold`,
        )}
      >
        {r}
        {sort.key === e &&
          (sort.dir === 1 ? (
            <O1 className={`size-3`} />
          ) : (
            <A1 className={`size-3`} />
          ))}
      </button>
    </th>
  );
  let d = `border-l border-l-line/60`;
  return (
    <_ padded={false} className={`overflow-hidden`}>
      <div className={`overflow-x-auto`}>
        <table className={r_1(`bz-table min-w-[1400px]`, I)}>
          <thead>
            <tr>
              {u(`name`, `Team`, `bz-sticky-l`, undefined, 2)}
              {W.map((e) => (
                <th
                  key={e.label}
                  colSpan={e.span}
                  title={e.title}
                  className={r_1(`pb-1! text-center!`, e.cls)}
                >
                  {e.label}
                </th>
              ))}
            </tr>
            <tr>
              {u(`talks`, `Talks`, `num-cell`, `persona conversations opened`)}
              {u(
                `deals`,
                `Deals`,
                `num-cell`,
                `conversations that ended in a deal; below: taken at the opening offer, never countered`,
              )}
              {u(
                `share`,
                `Share`,
                `w-24`,
                `mean share of the persona's price range captured, over negotiated deals (the settlement's ladder share)`,
              )}
              {u(
                `speed`,
                `Speed`,
                `num-cell`,
                `concession speed: the share of the opening gap the team gave up per round, over negotiated deals`,
              )}
              {u(
                `walk`,
                `Walk %`,
                `num-cell`,
                `the persona walked away ÷ (deals + walks), over negotiated talks`,
              )}
              {u(
                `finals`,
                `Finals`,
                `num-cell`,
                `final offers taken ÷ received ("take it or I walk")`,
              )}
              {u(
                `strikes`,
                `Strikes`,
                `num-cell`,
                `messages that drew a strike under the persona's anti-cheat rules`,
              )}
              {u(
                `trades`,
                `Trades`,
                `num-cell ${d}`,
                `team-to-team trades settled`,
              )}
              {u(
                `value`,
                `Value`,
                `num-cell`,
                `value created in its trades: both sides' private-value surplus + fees`,
              )}
              <th
                title={`as maker (its offer was taken) · as taker (it took one) · matched by a broker or the auto stall`}
                className={`num-cell whitespace-nowrap`}
              >{`M·T·X`}</th>
              {u(
                `partner`,
                `Top partner`,
                undefined,
                `its most frequent trading partner and that partner's share of its trades`,
              )}
              <th
                className={d}
                title={`its own venue if one is open, else its free starter stall`}
              >{`Venue`}</th>
              {u(
                `hosted`,
                `Hosted`,
                `num-cell`,
                `trades between other teams on its venues`,
              )}
              {u(
                `organic`,
                `Organic`,
                `num-cell`,
                `value created on its venues (before the score caps pairs and takes the square root)`,
              )}
              {u(
                `bench`,
                `Bench Δ`,
                `num-cell`,
                `The Market Test: mean efficiency minus the free auto stall on the same books, over finished sessions with a venue`,
              )}
              {u(`duels`, `Played`, `num-cell ${d}`, `scored duels decided`)}
              {u(
                `dealRate`,
                `Deal %`,
                `num-cell`,
                `duels that ended in a deal`,
              )}
              {u(
                `seller`,
                `Seller`,
                `num-cell`,
                `mean share of the pie as seller (a no deal counts 0)`,
              )}
              {u(
                `buyer`,
                `Buyer`,
                `num-cell`,
                `mean share of the pie as buyer (a no deal counts 0)`,
              )}
              {u(
                `messages`,
                `Msgs`,
                `num-cell ${d}`,
                `messages sent: persona and team threads, duels`,
              )}
              {u(`offers`, `Offers`, `num-cell`, `offers posted`)}
              {u(
                `settlements`,
                `Trades / h`,
                undefined,
                `settled trades (personas and teams) per game hour`,
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <KComponent
                key={t.team}
                t={t}
                sym={sym}
                hours={hours}
                selected={selected === t.team}
                onOpen={onOpen}
                first={d}
              />
            ))}
          </tbody>
        </table>
      </div>
      <p
        className={`border-t border-line px-4 py-2.5 text-[11px] leading-relaxed text-faint`}
      >
        <span className={`font-semibold text-gold`}>{`Talks · Deals`}</span>
        {` count every persona conversation; `}
        <span
          className={`font-semibold text-gold`}
        >{`Share · Speed · Walk %`}</span>
        {` rate the negotiated ones, where both sides made an offer, as the tournament report does. Value, surplus and organic value are private values: admin only. Refreshes every`}
        {` `}
        {P / 1000}
        {` s; hover a heading for what it counts.`}
      </p>
    </_>
  );
}
function KComponent({ t: t_1, sym, hours, selected, onOpen, first }) {
  let t_1_personas = t_1.personas;
  let c = t_1.trading.counterparties[0];
  let l = V(t_1);
  let delta = R(t_1);
  let bench = t_1.market.bench;
  return (
    <tr
      data-selected={selected || undefined}
      className={`cursor-pointer`}
      onClick={() => onOpen(t_1.team)}
    >
      <td className={`bz-sticky-l`}>
        <div
          className={`max-w-[12rem] truncate whitespace-nowrap font-semibold text-ink`}
        >
          {t_1.name}
        </div>
        <div className={`font-mono text-[10px] text-faint`}>{t_1.team}</div>
      </td>
      <td
        className={`num-cell font-mono text-xs`}
        title={`${t_1_personas.negotiated} negotiated · ${t_1_personas.open} open · ${t_1_personas.walked} walked · ${t_1_personas.closed} closed · ${t_1_personas.cooloffs} cooled off`}
      >
        {t_1_personas.opened}
      </td>
      <td className={`num-cell font-mono text-xs`}>
        {t_1_personas.deals}
        {t_1_personas.took_opening > 0 && (
          <div className={`text-[10px] text-faint`}>
            {t_1_personas.took_opening}
            {` at opening`}
          </div>
        )}
      </td>
      <td>
        <JComponent value={t_1_personas.share} tone={`gold`} />
      </td>
      <td className={`num-cell font-mono text-xs`}>
        {t_1_personas.speed === null ? <Q1Component /> : b(t_1_personas.speed)}
      </td>
      <td className={`num-cell font-mono text-xs`}>
        {t_1_personas.walk_rate === null ? (
          <Q1Component />
        ) : (
          b(t_1_personas.walk_rate)
        )}
      </td>
      <td
        className={`num-cell font-mono text-xs`}
        title={`${t_1_personas.finals.taken} taken · ${t_1_personas.finals.refused} refused · ${t_1_personas.finals.pending} pending`}
      >
        {t_1_personas.finals.offered ? (
          <>
            {t_1_personas.finals.taken}
            <span className={`text-faint`}>
              {`/`}
              {t_1_personas.finals.offered}
            </span>
          </>
        ) : (
          <Q1Component />
        )}
      </td>
      <td
        className={r_1(
          `num-cell font-mono text-xs`,
          t_1_personas.strikes ? `text-accent` : `text-faint`,
        )}
      >
        {t_1_personas.strikes}
      </td>
      <td className={r_1(`num-cell font-mono text-xs`, first)}>
        {t_1.trading.trades}
      </td>
      <td className={`num-cell font-mono text-xs`}>
        {t_1.trading.trades ? (
          v(t_1.trading.value_created, {
            symbol: sym,
          })
        ) : (
          <Q1Component />
        )}
      </td>
      <td
        className={`num-cell whitespace-nowrap font-mono text-xs`}
        title={`${t_1.trading.in_threads} negotiated in team threads`}
      >
        {t_1.trading.trades ? (
          `${t_1.trading.as_maker}·${t_1.trading.as_taker}·${t_1.trading.matched}`
        ) : (
          <Q1Component />
        )}
      </td>
      <td className={`max-w-[10rem]`}>
        {c ? (
          <div
            className={`truncate text-xs`}
            title={`${c.name}: ${x(c.trades, `trade`)}, ${v(c.value, {
              symbol: sym,
            })} created`}
          >
            <span className={`text-ink`}>{c.name}</span>
            <span className={`ml-1.5 font-mono text-[11px] text-info`}>
              {b(c.share)}
            </span>
          </div>
        ) : (
          <Q1Component />
        )}
      </td>
      <td className={r_1(`max-w-[10rem]`, first)}>
        {l ? (
          <div className={`min-w-0 text-xs`}>
            <div className={`truncate text-ink`} title={l.name}>
              {l.name}
            </div>
            <div className={`truncate text-[10px] text-faint`}>
              {l.starter ? `stall` : p(l.fee_bps)}
              {` · `}
              {l.mechanism}
              {l.status === `open` ? `` : ` · ${l.status}`}
            </div>
          </div>
        ) : (
          <Q1Component />
        )}
      </td>
      <td className={`num-cell font-mono text-xs`}>
        {t_1.market.trades_hosted}
      </td>
      <td className={`num-cell font-mono text-xs`}>
        {t_1.market.trades_hosted ? (
          v(t_1.market.organic_value, {
            symbol: sym,
          })
        ) : (
          <Q1Component />
        )}
      </td>
      <td
        className={`num-cell whitespace-nowrap font-mono text-xs`}
        title={
          bench.runs
            ? `${bench.won} won · ${bench.tied} tied · ${bench.lost} lost vs the auto stall over ${x(bench.runs, `session`)}; efficiency ${b(bench.efficiency, 1)} vs ${b(bench.auto, 1)}${bench.no_venue ? `; ${bench.no_venue} without a venue` : ``}`
            : bench.no_venue
              ? `${bench.no_venue} sessions without a venue`
              : `no finished session yet`
        }
      >
        <YComponent delta={delta} />
      </td>
      <td
        className={r_1(`num-cell font-mono text-xs`, first)}
        title={
          t_1.duels.practice
            ? `${t_1.duels.practice} practice duels apart`
            : undefined
        }
      >
        {t_1.duels.played}
      </td>
      <td className={`num-cell font-mono text-xs`}>
        {t_1.duels.deal_rate === null ? (
          <Q1Component />
        ) : (
          b(t_1.duels.deal_rate)
        )}
      </td>
      <td className={`num-cell font-mono text-xs`}>
        {t_1.duels.share_as_seller === null ? (
          <Q1Component />
        ) : (
          b(t_1.duels.share_as_seller)
        )}
      </td>
      <td className={`num-cell font-mono text-xs`}>
        {t_1.duels.share_as_buyer === null ? (
          <Q1Component />
        ) : (
          b(t_1.duels.share_as_buyer)
        )}
      </td>
      <td className={r_1(`num-cell font-mono text-xs`, first)}>
        {t_1.activity.messages}
      </td>
      <td className={`num-cell font-mono text-xs`}>{t_1.activity.offers}</td>
      <td title={`${x(t_1.activity.settlements, `trade`)} settled`}>
        <P1
          data={t_1.activity.per_hour.settlements}
          bars
          width={L(hours, 6, 84)}
          height={22}
          label={`settled trades per game hour`}
        />
      </td>
    </tr>
  );
}
function Q1Component() {
  return <span className={`text-faint`}>{`—`}</span>;
}
function JComponent({ value, tone }) {
  if (value === null) {
    return <Q1Component />;
  }
  let n = tone === `gold` ? `bg-gold` : tone === `info` ? `bg-info` : `bg-good`;
  return (
    <div className={`flex flex-col gap-1`}>
      <span className={`font-mono text-xs text-ink`}>{b(value)}</span>
      <div className={`h-1 w-16 overflow-hidden rounded-full bg-line`}>
        <div
          className={r_1(`h-full rounded-full`, n)}
          style={{
            width: `${Math.max(0, Math.min(1, value)) * 100}%`,
          }}
        />
      </div>
    </div>
  );
}
function YComponent({ delta }) {
  if (delta === null) {
    return <Q1Component />;
  }
  if (Math.abs(delta) < F) {
    return <span className={`text-gold`}>{`at base`}</span>;
  }
  return (
    <span className={delta > 0 ? `text-good` : `text-accent`}>
      {C_1(delta * 100, 1)}
      {` pt`}
    </span>
  );
}
function X(e, t, n) {
  if (e <= 0 || t <= 0) {
    return {
      strong: false,
    };
  }
  let r = 0.16 + 0.84 * Math.sqrt(e / t);
  return {
    background: `color-mix(in oklab, ${n} ${Math.round(r * 100)}%, transparent)`,
    strong: r > 0.62,
  };
}
const re = (e) => {
  if (e >= 10000) {
    return `${y(e / 1000, 0)}k`;
  }
  if (e >= 1000) {
    return `${y(e / 1000, 1)}k`;
  }
  return y(e);
};
function IeComponent({ data, sym, selected, onOpen }) {
  let [a, setA] = M.useState(`count`);
  let s = M.useMemo(
    () => new Map(data.teams.map((e) => [e.team, e.name])),
    [data.teams],
  );
  let teams = data.matrix.teams;
  let u = a === `count` ? data.matrix.count : data.matrix.value;
  let d = Math.max(0, ...u.flat());
  let f = a === `count` ? `var(--color-gold)` : `var(--color-good)`;
  let p = (e) => {
    if (a === `count`) {
      return y(e);
    }
    return re(e);
  };
  return (
    <_
      title={`Who trades with whom`}
      subtitle={`Team-to-team trades per pair, personas excluded. A bright pair in an otherwise dark row is a team that trades almost only with one partner. Click a team for its drill-down.`}
      actions=<Ee
        variant={`pills`}
        size={`sm`}
        label={`Heatmap measure`}
        value={a}
        onChange={setA}
        tabs={[
          {
            id: `count`,
            label: `Trades`,
          },
          {
            id: `value`,
            label: `Value created`,
          },
        ]}
      />
      padded={false}
    >
      {d <= 0 ? (
        <C1
          compact
          icon=<J1 className={`size-5`} />
          title={`No team-to-team trade yet`}
          hint={`Cells light up as teams trade with each other on the house market, the stalls and team venues.`}
        />
      ) : (
        <div className={`overflow-x-auto px-4 pb-4 pt-2`}>
          <table className={`border-separate border-spacing-1`}>
            <thead>
              <tr>
                <th />
                {teams.map((e) => (
                  <th
                    key={e}
                    className={`h-36 min-w-9 align-bottom`}
                    title={s.get(e)}
                  >
                    <button
                      type={`button`}
                      onClick={() => onOpen(e)}
                      className={r_1(
                        `mx-auto block max-h-36 truncate text-[11px] font-semibold [writing-mode:vertical-rl] rotate-180 hover:text-ink`,
                        selected === e ? `text-gold` : `text-muted`,
                      )}
                    >
                      {s.get(e) ?? e}
                    </button>
                  </th>
                ))}
                <th
                  className={`min-w-12 align-bottom text-[10px] font-bold uppercase tracking-wider text-faint`}
                  title={`all its team-to-team trades`}
                >{`Σ`}</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((a, o) => (
                <tr key={a}>
                  <th className={`pr-2 text-right`}>
                    <button
                      type={`button`}
                      onClick={() => onOpen(a)}
                      className={r_1(
                        `max-w-[11rem] truncate text-xs font-semibold hover:text-ink`,
                        selected === a ? `text-gold` : `text-ink/90`,
                      )}
                      title={s.get(a)}
                    >
                      {s.get(a) ?? a}
                    </button>
                  </th>
                  {teams.map((n, c) => {
                    if (o === c) {
                      return (
                        <td
                          key={n}
                          className={`h-9 min-w-9 rounded-md bg-line/30`}
                          aria-hidden
                        />
                      );
                    }
                    let l = data.matrix.count[o][c];
                    let m = data.matrix.value[o][c];
                    let h = u[o][c];
                    let g = X(h, d, f);
                    return (
                      <td key={n} className={`p-0`}>
                        <button
                          type={`button`}
                          onClick={() => onOpen(a)}
                          title={`${s.get(a) ?? a} ↔ ${s.get(n) ?? n}: ${x(l, `trade`)}, ${v(
                            m,
                            {
                              symbol: sym,
                            },
                          )} created`}
                          style={{
                            background: g.background,
                          }}
                          className={r_1(
                            `grid h-9 w-full min-w-9 place-items-center rounded-md px-1 font-mono text-[11px]`,
                            h > 0
                              ? g.strong
                                ? `font-bold text-night`
                                : `text-ink`
                              : `border border-line/60 text-transparent`,
                          )}
                        >
                          {h > 0 ? p(h) : `·`}
                        </button>
                      </td>
                    );
                  })}
                  <td
                    className={`pl-1 text-right font-mono text-xs text-muted`}
                  >
                    {p(B(u[o]))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div
            className={`mt-3 flex items-center gap-2 text-[11px] text-faint`}
          >
            <span>{`0`}</span>
            <span
              className={`h-1.5 w-32 rounded-full`}
              style={{
                background: `linear-gradient(to right, color-mix(in oklab, ${f} 16%, transparent), ${f})`,
              }}
            />
            <span>
              {a === `count`
                ? x(d, `trade`)
                : v(d, {
                    symbol: sym,
                  })}
              {` for the busiest pair`}
            </span>
          </div>
        </div>
      )}
    </_>
  );
}
function AeComponent({ teamId, team, data, sym, onOpen, onClose }) {
  return (
    <S
      open={!!teamId}
      onClose={onClose}
      width={`min(960px, 100vw)`}
      title={team?.name ?? teamId ?? ``}
      description={
        team && data
          ? `${team.team} · tick ${y(data.tick)} · game hour ${y(data.t, 1)} · refreshes every ${P / 1000} s`
          : (teamId ?? undefined)
      }
    >
      {team ? (
        <div className={`flex flex-col gap-7`}>
          <div
            data-autofocus
            tabIndex={-1}
            className={`grid grid-cols-2 gap-2 outline-none sm:grid-cols-4`}
          >
            <QComponent
              label={`persona range captured`}
              value={
                team.personas.share === null ? `—` : b(team.personas.share)
              }
              tone={`gold`}
            />
            <QComponent
              label={`team trades · ${v(team.trading.value_created, {
                symbol: sym,
              })}`}
              value={y(team.trading.trades)}
              tone={`info`}
            />
            <QComponent
              label={`value created on its venues`}
              value={v(team.market.organic_value, {
                symbol: sym,
              })}
              tone={`good`}
            />
            <QComponent
              label={`duel deal rate · ${team.duels.played} played`}
              value={
                team.duels.deal_rate === null ? `—` : b(team.duels.deal_rate)
              }
              tone={`accent`}
            />
          </div>
          <OeComponent team={team} />
          <div className={`grid gap-7 md:grid-cols-2`}>
            <SeComponent team={team} sym={sym} onOpen={onOpen} />
            <CeComponent team={team} />
          </div>
          <LeComponent team={team} sym={sym} />
          <UeComponent sessions={team.market.bench.sessions} />
          <DeComponent team={team} />
          <FeComponent team={team} hours={data?.hours ?? 1} />
        </div>
      ) : data ? (
        <C1
          compact
          title={`No such team`}
          hint={`${teamId} is not in this game.`}
        />
      ) : (
        <div className={`flex flex-col gap-3`}>
          <L1 className={`h-20`} />
          <L1 className={`h-48`} />
        </div>
      )}
    </S>
  );
}
function ZComponent({ title, hint, children }) {
  return (
    <section className={`min-w-0`}>
      <h4 className={`eyebrow mb-1`}>{title}</h4>
      {hint && <p className={`mb-2 text-xs text-faint`}>{hint}</p>}
      {children}
    </section>
  );
}
function QComponent({ label, value, tone }) {
  let r = {
    gold: `text-gold`,
    info: `text-info`,
    good: `text-good`,
    accent: `text-accent`,
  }[tone];
  return (
    <div className={`rounded-xl border border-line bg-base/50 px-3 py-2`}>
      <div className={r_1(`font-display-num text-2xl`, r)}>{value}</div>
      <div
        className={`truncate text-[10px] font-bold uppercase tracking-wider text-faint`}
      >
        {label}
      </div>
    </div>
  );
}
function OeComponent({ team }) {
  let team_personas = team.personas;
  let NComponent = (e) => (
    <>
      <td className={`num-cell font-mono text-xs`}>{e.opened}</td>
      <td className={`num-cell font-mono text-xs`}>
        {e.deals}
        {e.took_opening > 0 && (
          <span className={`text-faint`}>
            {` (`}
            {e.took_opening}
            {`)`}
          </span>
        )}
      </td>
      <td className={`num-cell font-mono text-xs`}>
        {e.walked}
        <span className={`text-faint`}>
          {` · `}
          {e.closed}
        </span>
      </td>
      <td className={`num-cell font-mono text-xs text-gold`}>
        {e.share === null ? <Q1Component /> : b(e.share)}
      </td>
      <td className={`num-cell font-mono text-xs`}>
        {e.rounds === null ? <Q1Component /> : y(e.rounds, 1)}
      </td>
      <td className={`num-cell font-mono text-xs`}>
        {e.speed === null ? <Q1Component /> : b(e.speed)}
      </td>
      <td
        className={`num-cell font-mono text-xs`}
        title={`${e.finals.pending} still talking`}
      >
        {e.finals.offered ? (
          `${e.finals.taken} / ${e.finals.refused}`
        ) : (
          <Q1Component />
        )}
      </td>
    </>
  );
  let RComponent = (strikes, cooloffs, eggs) => (
    <>
      <td className={`num-cell whitespace-nowrap font-mono text-xs`}>
        <span className={strikes ? `text-accent` : `text-faint`}>
          {strikes}
        </span>
        <span className={`text-faint`}>{` · `}</span>
        <span className={cooloffs ? `text-accent` : `text-faint`}>
          {cooloffs}
        </span>
      </td>
      <td
        className={r_1(
          `num-cell font-mono text-xs`,
          eggs ? `text-gold` : `text-faint`,
        )}
      >
        {eggs}
      </td>
    </>
  );
  return (
    <ZComponent
      title={`Personas, one by one`}
      hint={`Deals in brackets were taken at the opening offer. Walked · closed: the persona walked away · the team closed it or it went idle. Share, rounds and speed are over negotiated deals.`}
    >
      {team_personas.by_persona.length ? (
        <div className={`overflow-x-auto`}>
          <table className={r_1(`bz-table`, I)}>
            <thead>
              <tr>
                <th>{`Persona`}</th>
                <th className={`num-cell`}>{`Talks`}</th>
                <th className={`num-cell`}>{`Deals`}</th>
                <th
                  className={`num-cell whitespace-nowrap`}
                  title={`the persona walked away · the team closed it or it went idle`}
                >{`Walk · close`}</th>
                <th className={`num-cell`}>{`Share`}</th>
                <th className={`num-cell`}>{`Rounds`}</th>
                <th className={`num-cell`}>{`Speed`}</th>
                <th
                  className={`num-cell whitespace-nowrap`}
                  title={`final offers taken / refused`}
                >{`Finals t/r`}</th>
                <th
                  className={`num-cell whitespace-nowrap`}
                  title={`messages that drew a strike · cool-offs`}
                >{`Strikes · cool`}</th>
                <th
                  className={`num-cell`}
                  title={`easter eggs found`}
                >{`Eggs`}</th>
              </tr>
            </thead>
            <tbody>
              {team_personas.by_persona.map((e) => (
                <tr key={e.persona}>
                  <td className={`whitespace-nowrap`}>
                    <div className={`flex items-center gap-2`}>
                      <span className={`font-semibold text-ink`}>{e.name}</span>
                      {e.level !== null && <H1 level={e.level} />}
                    </div>
                  </td>
                  {NComponent(e)}
                  {RComponent(e.strikes, e.cooloffs, e.eggs)}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr
                className={`[&>td]:border-t [&>td]:border-line [&>td]:px-2 [&>td]:py-2`}
              >
                <td
                  className={`text-xs font-bold uppercase tracking-wider text-muted`}
                >{`All`}</td>
                {NComponent(team_personas)}
                {RComponent(
                  team_personas.strikes,
                  team_personas.cooloffs,
                  team_personas.eggs,
                )}
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        <p className={`text-sm text-muted`}>{`No persona conversation yet.`}</p>
      )}
    </ZComponent>
  );
}
function SeComponent({ team, sym, onOpen }) {
  let counterparties = team.trading.counterparties;
  return (
    <ZComponent
      title={`Top counterparties`}
      hint={`Share of its team-to-team trades; value created with them, and its own surplus.`}
    >
      {counterparties.length ? (
        <ul className={`flex flex-col gap-2`}>
          {counterparties.map((e) => (
            <li
              key={e.team}
              className={`rounded-xl border border-line bg-base/50 px-3 py-2`}
            >
              <div className={`flex items-center gap-2 text-sm`}>
                <button
                  type={`button`}
                  onClick={() => onOpen(e.team)}
                  className={`min-w-0 flex-1 truncate text-left font-semibold text-ink hover:text-gold`}
                >
                  {e.name}
                </button>
                <span className={`font-mono text-xs text-muted`}>
                  {x(e.trades, `trade`)}
                </span>
              </div>
              <div className={`mt-1.5 flex items-center gap-2`}>
                <div
                  className={`h-1.5 flex-1 overflow-hidden rounded-full bg-line`}
                >
                  <div
                    className={`h-full rounded-full bg-info`}
                    style={{
                      width: `${e.share * 100}%`,
                    }}
                  />
                </div>
                <span
                  className={`w-10 text-right font-mono text-[11px] text-info`}
                >
                  {b(e.share)}
                </span>
              </div>
              <div
                className={`mt-1 flex justify-between font-mono text-[11px] text-faint`}
              >
                <span>
                  {v(e.value, {
                    symbol: sym,
                  })}
                  {` created`}
                </span>
                <span
                  className={
                    e.surplus > 0
                      ? `text-good`
                      : e.surplus < 0
                        ? `text-accent`
                        : undefined
                  }
                >
                  {v(e.surplus, {
                    symbol: sym,
                    sign: true,
                    decimals: 1,
                  })}
                  {` its surplus`}
                </span>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className={`text-sm text-muted`}>{`No team-to-team trade yet.`}</p>
      )}
    </ZComponent>
  );
}
const $ = {
  house: {
    label: `house market`,
    bar: `bg-muted/70`,
  },
  stall: {
    label: `starter stalls`,
    bar: `bg-info`,
  },
  venue: {
    label: `team venues`,
    bar: `bg-good`,
  },
};
function CeComponent({ team }) {
  let team_trading = team.trading;
  let n = Object.keys($).filter((e) => team_trading.where[e] > 0);
  return (
    <ZComponent
      title={`Where it trades`}
      hint={`As maker ${team_trading.as_maker} · as taker ${team_trading.as_taker} · matched ${team_trading.matched} · negotiated in team threads ${team_trading.in_threads} · fees paid ${y(team_trading.fees_paid)}.`}
    >
      {team_trading.trades ? (
        <>
          <div
            className={`flex h-2.5 overflow-hidden rounded-full bg-line`}
            role={`img`}
            aria-label={n
              .map((e) => `${team_trading.where[e]} on ${$[e].label}`)
              .join(`, `)}
          >
            {n.map((e) => (
              <div
                key={e}
                className={r_1(`h-full`, $[e].bar)}
                style={{
                  width: `${(team_trading.where[e] / team_trading.trades) * 100}%`,
                }}
              />
            ))}
          </div>
          <div
            className={`mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted`}
          >
            {n.map((e) => (
              <span key={e} className={`inline-flex items-center gap-1`}>
                <span className={r_1(`size-2 rounded-sm`, $[e].bar)} />
                {team_trading.where[e]}
                {` `}
                {$[e].label}
              </span>
            ))}
          </div>
          <ul className={`mt-3 flex flex-col divide-y divide-line/60 text-sm`}>
            {team_trading.venues.map((e) => (
              <li
                key={e.venue ?? `none`}
                className={`flex items-center gap-2 py-1.5`}
              >
                <span
                  className={r_1(`size-2 shrink-0 rounded-sm`, $[e.kind].bar)}
                />
                <span className={`min-w-0 flex-1 truncate text-ink`}>
                  {e.name}
                </span>
                <span className={`font-mono text-[10px] text-faint`}>
                  {e.venue}
                </span>
                <span
                  className={`w-16 text-right font-mono text-xs text-muted`}
                >
                  {x(e.trades, `trade`)}
                </span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className={`text-sm text-muted`}>{`No team-to-team trade yet.`}</p>
      )}
    </ZComponent>
  );
}
function LeComponent({ team, sym }) {
  let venues = team.market.venues;
  return (
    <ZComponent
      title={`Its venues`}
      hint={`What each hosts: trades between other teams, their traders, the fees and the value those trades created.`}
    >
      {venues.length ? (
        <div className={`overflow-x-auto`}>
          <table className={`bz-table`}>
            <thead>
              <tr>
                <th>{`Venue`}</th>
                <th>{`Status`}</th>
                <th className={`num-cell`}>{`Fee`}</th>
                <th>{`Matching`}</th>
                <th className={`num-cell`}>{`Hosted`}</th>
                <th className={`num-cell`}>{`Traders`}</th>
                <th className={`num-cell`}>{`Fees`}</th>
                <th className={`num-cell`}>{`Value`}</th>
              </tr>
            </thead>
            <tbody>
              {venues.map((e) => (
                <tr key={e.venue}>
                  <td className={`whitespace-nowrap`}>
                    <span className={`font-semibold text-ink`}>{e.name}</span>
                    <span className={`ml-1.5 font-mono text-[10px] text-faint`}>
                      {e.venue}
                    </span>
                    {e.starter && (
                      <span
                        className={`ml-1.5 rounded bg-raised px-1 text-[10px] text-muted`}
                      >{`starter`}</span>
                    )}
                  </td>
                  <td>
                    <T
                      tone={
                        e.status === `open`
                          ? `good`
                          : e.status === `suspended`
                            ? `accent`
                            : `muted`
                      }
                      className={`h-5 px-2 text-[10px]`}
                    >
                      {e.status}
                    </T>
                  </td>
                  <td
                    className={`num-cell whitespace-nowrap font-mono text-xs`}
                  >
                    {p(e.fee_bps)}
                    {e.fee_per_card
                      ? ` + ${v(e.fee_per_card, {
                          symbol: sym,
                        })}`
                      : ``}
                  </td>
                  <td className={`text-xs text-muted`}>
                    {e.mechanism === `auto` ? `auto match` : `broker`}
                  </td>
                  <td className={`num-cell font-mono text-xs`}>{e.trades}</td>
                  <td className={`num-cell font-mono text-xs`}>{e.traders}</td>
                  <td className={`num-cell font-mono text-xs`}>
                    {v(e.fees, {
                      symbol: sym,
                    })}
                  </td>
                  <td className={`num-cell font-mono text-xs text-good`}>
                    {v(e.value_created, {
                      symbol: sym,
                      decimals: 1,
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p
          className={`text-sm text-muted`}
        >{`No venue: its starter stall opens when team trading opens.`}</p>
      )}
    </ZComponent>
  );
}
function UeComponent({ sessions }) {
  let t = [...sessions].reverse();
  return (
    <ZComponent
      title={`The Market Test, session by session`}
      hint={`Its best venue in each session against the free auto stall on the same book (the gold tick). A session with no venue open counts 0.`}
    >
      {t.length ? (
        <div className={`overflow-x-auto`}>
          <table className={`bz-table`}>
            <thead>
              <tr>
                <th>{`Session`}</th>
                <th>{`Venue`}</th>
                <th className={`num-cell`}>{`Matches`}</th>
                <th className={`w-[38%]`}>{`Efficiency vs auto`}</th>
                <th className={`num-cell`}>{`Δ`}</th>
              </tr>
            </thead>
            <tbody>
              {t.map((e) => {
                let delta =
                  e.efficiency === null || e.auto === null
                    ? null
                    : e.efficiency - e.auto;
                return (
                  <tr key={e.session}>
                    <td className={`whitespace-nowrap`}>
                      <span className={`font-semibold text-ink`}>{e.name}</span>
                      <span
                        className={`ml-1.5 font-mono text-[10px] text-faint`}
                      >
                        {`#`}
                        {e.session}
                        {` · round `}
                        {e.round}
                      </span>
                      {e.status === `live` && (
                        <T
                          tone={`gold`}
                          live
                          className={`ml-2 h-5 px-2 text-[10px]`}
                        >{`live`}</T>
                      )}
                    </td>
                    <td className={`whitespace-nowrap text-xs`}>
                      {e.no_venue ? (
                        <span className={`text-accent`}>{`no venue open`}</span>
                      ) : (
                        <span className={`text-ink`}>{e.venue_name}</span>
                      )}
                      {e.mechanism && (
                        <span
                          className={`ml-1.5 rounded bg-raised px-1 text-[10px] text-muted`}
                        >
                          {e.mechanism === `auto` ? `auto` : `broker`}
                        </span>
                      )}
                    </td>
                    <td className={`num-cell font-mono text-xs`}>
                      {e.matches}
                    </td>
                    <td>
                      <div className={`flex items-center gap-2.5`}>
                        <div
                          className={`relative h-2.5 flex-1 rounded-full bg-line`}
                        >
                          <div
                            className={r_1(
                              `h-full rounded-full`,
                              e.status === `live`
                                ? `bg-info/70`
                                : delta === null
                                  ? `bg-line-strong`
                                  : delta > F
                                    ? `bg-good`
                                    : delta < -0.0005
                                      ? `bg-accent`
                                      : `bg-gold/80`,
                            )}
                            style={{
                              width: `${Math.max(0, Math.min(1, e.efficiency ?? 0)) * 100}%`,
                            }}
                          />
                          {e.auto !== null && (
                            <span
                              className={`absolute -top-1 h-4.5 w-0.5 -translate-x-1/2 rounded-full bg-gold shadow-[0_0_0_2px_var(--color-panel)]`}
                              style={{
                                left: `${Math.max(0, Math.min(1, e.auto)) * 100}%`,
                              }}
                              title={`auto stall ${b(e.auto, 1)}`}
                            />
                          )}
                        </div>
                        <span
                          className={`w-12 text-right font-mono text-xs text-ink`}
                        >
                          {e.efficiency === null ? `—` : b(e.efficiency, 1)}
                        </span>
                      </div>
                    </td>
                    <td
                      className={`num-cell whitespace-nowrap font-mono text-xs`}
                    >
                      {e.status === `live` ? (
                        <span className={`text-muted`}>{`running`}</span>
                      ) : (
                        <YComponent delta={delta} />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className={`text-sm text-muted`}>{`No bench session yet.`}</p>
      )}
    </ZComponent>
  );
}
function DeComponent({ team }) {
  let team_duels = team.duels;
  let n = [
    {
      label: `decided`,
      value: y(team_duels.played),
      sub: `${team_duels.deals} deals`,
    },
    {
      label: `share as seller`,
      value:
        team_duels.share_as_seller === null
          ? `—`
          : b(team_duels.share_as_seller),
      sub: `mean, no deal = 0`,
    },
    {
      label: `share as buyer`,
      value:
        team_duels.share_as_buyer === null ? `—` : b(team_duels.share_as_buyer),
      sub: `mean, no deal = 0`,
    },
    {
      label: `rounds per deal`,
      value: team_duels.rounds === null ? `—` : y(team_duels.rounds, 1),
      sub:
        team_duels.factor === null
          ? `no deal yet`
          : `kept ${b(team_duels.factor)} of the pie`,
    },
  ];
  return (
    <ZComponent
      title={`Duels`}
      hint={`Scored duels only${team_duels.practice ? `; ${team_duels.practice} practice duels apart` : ``}${team_duels.live || team_duels.waiting ? `; ${team_duels.live} live, ${team_duels.waiting} waiting` : ``}.`}
    >
      <div className={`grid grid-cols-2 gap-2 sm:grid-cols-4`}>
        {n.map((e) => (
          <div
            key={e.label}
            className={`rounded-xl border border-line bg-base/50 px-3 py-2`}
          >
            <div className={`font-display-num text-2xl text-ink`}>
              {e.value}
            </div>
            <div
              className={`text-[10px] font-bold uppercase tracking-wider text-faint`}
            >
              {e.label}
            </div>
            <div className={`text-[11px] text-muted`}>{e.sub}</div>
          </div>
        ))}
      </div>
    </ZComponent>
  );
}
function FeComponent({ team, hours }) {
  let team_activity = team.activity;
  let r = [
    {
      label: `messages sent`,
      data: team_activity.per_hour.messages,
      total: team_activity.messages,
      color: `var(--color-info)`,
    },
    {
      label: `offers posted`,
      data: team_activity.per_hour.offers,
      total: team_activity.offers,
      color: `var(--color-gold)`,
    },
    {
      label: `trades settled`,
      data: team_activity.per_hour.settlements,
      total: team_activity.settlements,
      color: `var(--color-good)`,
    },
  ];
  return (
    <ZComponent
      title={`Activity by game hour`}
      hint={`One bar per game hour, from hour 0 to hour ${hours - 1}; the last bar is the hour in progress.`}
    >
      <div className={`flex flex-col gap-2`}>
        {r.map((e) => (
          <div
            key={e.label}
            className={`flex items-center gap-3 rounded-xl border border-line bg-base/50 px-3 py-2`}
          >
            <div className={`w-28 shrink-0`}>
              <div className={`font-display-num text-xl text-ink`}>
                {y(e.total)}
              </div>
              <div
                className={`text-[10px] font-bold uppercase tracking-wider text-faint`}
              >
                {e.label}
              </div>
            </div>
            <P1
              data={e.data}
              bars
              width={L(hours, 18, 560)}
              height={36}
              color={e.color}
              className={`min-w-0 max-w-full`}
              label={`${e.label} per game hour`}
            />
          </div>
        ))}
      </div>
    </ZComponent>
  );
}
export { HComponent as default };
