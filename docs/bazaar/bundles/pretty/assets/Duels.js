import { i, n, t } from "./jsx-runtime.js";
import { i as i_2, r as r_1, t as A1 } from "./Button.js";
import { t as O1 } from "./handshake.js";
import { t as S1 } from "./EmptyState.js";
import { a as C1, i as i_3, s as s_1 } from "./useEvents.js";
import { t as D1 } from "./ErrorNote.js";
import { n as n_2 } from "./catalog.js";
import { t as P1 } from "./KPI.js";
import { t as M1 } from "./PageHeader.js";
import { t as H1 } from "./Panel.js";
import { t as G1 } from "./Tabs.js";
import { t as _ } from "./Toggle.js";
import {
  O as O_1,
  b,
  k as B1,
  l,
  r as r_2,
  u as C,
  v,
  x as x_1,
  y,
} from "./index.js";
import { t as D } from "./ConfirmDialog.js";
import {
  d as O,
  i as i_4,
  l as A,
  n as n_3,
  o as M,
  p as N,
  r as r_3,
} from "./hooks.js";
import { f } from "./util.js";
const I = {
  name: `calendar-plus`,
  size: 24,
  node: [
    [
      `path`,
      {
        d: `M16 18h6`,
        key: `987eiv`,
      },
    ],
    [
      `path`,
      {
        d: `M16 2v3`,
        key: `otl347`,
      },
    ],
    [
      `path`,
      {
        d: `M19 15v6`,
        key: `10aioa`,
      },
    ],
    [
      `path`,
      {
        d: `M21 11.5V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h8.3`,
        key: `jgwkxf`,
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
        d: `M8 2v3`,
        key: `1ioesn`,
      },
    ],
  ],
};
I.node;
const L = i_2(I);
const R = {
  name: `chart-pie`,
  size: 24,
  node: [
    [
      `path`,
      {
        d: `M21 12c.552 0 1.005-.449.95-.998a10 10 0 0 0-8.953-8.951c-.55-.055-.998.398-.998.95v8a1 1 0 0 0 1 1z`,
        key: `pzmjnu`,
      },
    ],
    [
      `path`,
      {
        d: `M21.21 15.89A10 10 0 1 1 8 2.83`,
        key: `k2fpak`,
      },
    ],
  ],
  aliases: [`pie-chart`],
};
R.node;
const Z1 = i_2(R);
const B = {
  name: `hourglass`,
  size: 24,
  node: [
    [
      `path`,
      {
        d: `M5 22h14`,
        key: `ehvnwv`,
      },
    ],
    [
      `path`,
      {
        d: `M5 2h14`,
        key: `pdyrp9`,
      },
    ],
    [
      `path`,
      {
        d: `M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22`,
        key: `1d314k`,
      },
    ],
    [
      `path`,
      {
        d: `M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2`,
        key: `1vvvr6`,
      },
    ],
  ],
};
B.node;
const V = i_2(B);
const H = i(n(), 1);
const U = t();
const W = {
  live: `gold`,
  waiting: `muted`,
  deal: `good`,
  no_deal: `accent`,
};
const G = {
  live: `live`,
  waiting: `waiting`,
  deal: `deal`,
  no_deal: `no deal`,
};
const K = {
  live: 0,
  deal: 1,
  no_deal: 1,
  waiting: 2,
};
const q = 80;
const J = (issues) => {
  if (issues.includes(`days`)) {
    return `price + delivery days`;
  }
  return `price only`;
};
const Y = (e) => e.deals + e.no_deals;
function X(e) {
  let done = Y(e);
  let n = Object.values(e.per_team).reduce((acc, item) => acc + item.share, 0);
  let r = e.duels.filter((e) => e.status === `deal`);
  let i = r.length
    ? r.reduce((acc, item) => acc + item.factor, 0) / r.length
    : null;
  let meanRounds = r.length
    ? r.reduce((acc, item) => acc + item.rounds, 0) / r.length
    : null;
  return {
    done,
    dealRate: done ? e.deals / done : null,
    pieCaptured: e.deals ? n / e.deals : null,
    lost: i === null ? null : 1 - i,
    meanRounds,
    capped: e.duels.length < e.total,
  };
}
function ZComponent() {
  let e = r_2();
  let t = n_3();
  let n = r_3();
  let { clock } = l({
    live: false,
  });
  let { index } = n_2();
  let sym = index?.symbol ?? `P`;
  let p = i_3((e) => s_1.duels(e), 5000);
  i_4(
    [`duels.`, `duel.started`, `duel.closed`, `duel.message`, `round.`],
    p.refresh,
    {
      throttleMs: 2000,
    },
  );
  let h = H.useMemo(() => [...(p.data?.sessions ?? [])].reverse(), [p.data]);
  let [_, set_] = H.useState(null);
  let [open, setOpen] = H.useState(false);
  let s =
    h.find((e) => e.session === _) ??
    h.find((e) => e.status === `running`) ??
    h[0];
  return (
    <div>
      <M1
        eyebrow={`Game master`}
        title={`Duels`}
        subtitle={`Anonymous one-on-one negotiations between teams. Every pair meets twice on the same scenario, once in each role; each side knows only its own limit and scores its share of the pie. No deal scores 0 for both.`}
        actions=<A1
          variant={`primary`}
          icon=<L className={`size-4`} />
          onClick={() => setOpen(true)}
        >{`Schedule a session`}</A1>
      />
      {p.error && <D1 error={p.error} onRetry={p.refresh} className={`mb-4`} />}
      {p.loading && !p.data ? (
        <div className={`flex flex-col gap-4`}>
          <C1 className={`h-12 rounded-2xl`} />
          <C1 className={`h-28 rounded-2xl`} />
          <C1 className={`h-80 rounded-2xl`} />
        </div>
      ) : s ? (
        <>
          {h.length > 1 && (
            <G1
              variant={`pills`}
              size={`sm`}
              label={`Duel sessions`}
              className={`mb-4 w-fit max-w-full flex-wrap`}
              value={String(s.session)}
              onChange={(e) => set_(Number(e))}
              tabs={h.map((e) => ({
                id: String(e.session),
                label: (
                  <span
                    className={`inline-flex items-center gap-1.5 whitespace-nowrap`}
                  >
                    {e.status === `running` && (
                      <span
                        className={`size-1.5 rounded-full bg-gold`}
                        aria-hidden
                      />
                    )}
                    {e.name}
                    <span className={`font-mono text-[10px] text-faint`}>
                      {Y(e)}
                      {`/`}
                      {e.total}
                    </span>
                    {e.practice && (
                      <span
                        className={`text-[10px] text-faint`}
                      >{`practice`}</span>
                    )}
                  </span>
                ),
              }))}
            />
          )}
          <QComponent
            key={s.session}
            s={s}
            name={t.name}
            sym={sym}
            tick={clock?.tick}
            tickSeconds={clock?.tick_seconds}
          />
        </>
      ) : (
        <S1
          icon=<B1 className={`size-6`} />
          title={`No duel session yet`}
          hint="Sessions come from `schedule` in config/game.yaml (Duels I at +8.5h) or from here. Duels need at least two teams."
          action=<A1
            variant={`primary`}
            onClick={() => setOpen(true)}
          >{`Schedule a session`}</A1>
        />
      )}
      <AeComponent
        open={open}
        onClose={() => setOpen(false)}
        teamCount={n.rows.length}
        frozenCount={n.rows.filter((e) => e.frozen).length}
        nextName={`Duels ${h.length + 1}`}
        tickSeconds={clock?.tick_seconds}
        onDone={(t, n) => {
          e.gold(
            `Session #${t.session} scheduled`,
            `${t.duels} one-on-one negotiations${n ? ` · practice, not scored` : ``}`,
          );
          set_(t.session);
          p.refresh();
        }}
      />
    </div>
  );
}
function QComponent({ s: s_1, name, sym, tick, tickSeconds }) {
  let a = X(s_1);
  let days = s_1.issues.includes(`days`);
  return (
    <div className={`flex flex-col gap-4`}>
      <H1 padded={false}>
        <div
          className={`flex flex-wrap items-start gap-x-6 gap-y-3 px-5 pb-4 pt-4`}
        >
          <div className={`min-w-0 flex-1`}>
            <div className={`flex flex-wrap items-center gap-2`}>
              <h2 className={`text-3xl text-ink`}>{s_1.name}</h2>
              <C
                tone={s_1.status === `running` ? `gold` : `muted`}
                dot
                live={s_1.status === `running` && s_1.live > 0}
              >
                {s_1.status}
              </C>
              {s_1.practice ? (
                <C tone={`info`}>{`practice · not scored`}</C>
              ) : (
                <C tone={`good`}>
                  {`scored · round `}
                  {s_1.round}
                </C>
              )}
              <C tone={`neutral`}>{J(s_1.issues)}</C>
            </div>
            <p className={`mt-1.5 text-xs text-muted`}>
              {s_1.duel_ticks}
              {` ticks per duel`}
              {tickSeconds ? ` (≈ ${f(s_1.duel_ticks, tickSeconds)})` : ``}
              {` · decay `}
              {b(s_1.decay)}
              {` per round of talk · at most `}
              {s_1.max_concurrent}
              {` at once per team ·`}
              {` `}
              {x_1(s_1.scenarios.length, `scenario`)}
              {` · session #`}
              {s_1.session}
            </p>
          </div>
          <Component s={s_1} />
        </div>
      </H1>
      <div className={`grid grid-cols-2 gap-3 lg:grid-cols-4`}>
        <P1
          label={`Decided`}
          value={a.done}
          unit={`/ ${s_1.total}`}
          icon=<B1 className={`size-4`} />
          tone={s_1.status === `running` ? `gold` : `default`}
          hint={`${s_1.live} live · ${s_1.waiting} waiting`}
        />
        <P1
          label={`Deal rate`}
          value={a.dealRate === null ? `—` : b(a.dealRate)}
          icon=<O1 className={`size-4`} />
          tone={`good`}
          hint={`${s_1.deals} deals · ${s_1.no_deals} no deal`}
        />
        <P1
          label={`Pie captured`}
          value={a.pieCaptured === null ? `—` : b(a.pieCaptured)}
          icon=<Z1 className={`size-4`} />
          tone={`info`}
          hint={`both sides together, per deal`}
        />
        <P1
          label={`Lost to haggling`}
          value={a.lost === null ? `—` : b(a.lost)}
          icon=<V className={`size-4`} />
          tone={a.lost && a.lost > 0.2 ? `warn` : `default`}
          hint={
            a.meanRounds === null
              ? `no deal yet`
              : `${y(a.meanRounds, 1)} rounds of talk per deal`
          }
        />
      </div>
      <div
        className={`grid gap-4 2xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]`}
      >
        <EeComponent s={s_1} name={name} />
        <TeComponent s={s_1} sym={sym} days={days} />
      </div>
      <NeComponent
        s={s_1}
        name={name}
        sym={sym}
        tick={tick}
        capped={a.capped}
      />
    </div>
  );
}
function Component({ s }) {
  let t = [
    {
      n: s.deals,
      cls: `bg-good`,
      label: `deals`,
    },
    {
      n: s.no_deals,
      cls: `bg-accent/80`,
      label: `no deal`,
    },
    {
      n: s.live,
      cls: `bg-gold`,
      label: `live`,
    },
    {
      n: s.waiting,
      cls: `bg-line-strong`,
      label: `waiting`,
    },
  ];
  return (
    <div className={`w-full sm:w-80`}>
      <div
        className={`flex h-2.5 overflow-hidden rounded-full bg-line`}
        role={`img`}
        aria-label={t.map((e) => `${e.n} ${e.label}`).join(`, `)}
      >
        {t.map((t) => {
          if (t.n) {
            return (
              <div
                key={t.label}
                className={r_1(`h-full`, t.cls)}
                style={{
                  width: `${(t.n / Math.max(1, s.total)) * 100}%`,
                }}
              />
            );
          }
          return null;
        })}
      </div>
      <div
        className={`mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted`}
      >
        {t.map((e) => (
          <span key={e.label} className={`inline-flex items-center gap-1`}>
            <span className={r_1(`size-2 rounded-sm`, e.cls)} />
            {e.n}
            {` `}
            {e.label}
          </span>
        ))}
      </div>
    </div>
  );
}
function EeComponent({ s, name }) {
  let n = Object.entries(s.per_team)
    .map(([team, t]) => ({
      team,
      ...t,
    }))
    .sort((e, t) => t.share - e.share || e.team.localeCompare(t.team));
  let r = Math.max(0.001, ...n.map((e) => e.share));
  return (
    <H1
      title={`Teams · summed share`}
      subtitle={
        s.practice
          ? `Practice: shares are shown so teams can compare, but they never reach the score.`
          : `Each duel scores a side's share of the pie (0–1); the negotiating score sums them over round ${s.round}.`
      }
      actions=<O_1 className={`size-4 text-faint`} />
      padded={false}
    >
      {n.length ? (
        <div className={`overflow-x-auto px-2 pb-2`}>
          <table className={`bz-table`}>
            <thead>
              <tr>
                <th className={`w-8`}>{`#`}</th>
                <th>{`Team`}</th>
                <th
                  className={`num-cell`}
                  title={`decided of scheduled`}
                >{`Played`}</th>
                <th className={`num-cell`}>{`Deals`}</th>
                <th className={`w-[34%]`}>{`Σ share`}</th>
                <th
                  className={`num-cell`}
                  title={`summed share as the seller`}
                >{`Seller`}</th>
                <th
                  className={`num-cell`}
                  title={`summed share as the buyer`}
                >{`Buyer`}</th>
                <th
                  className={`num-cell whitespace-nowrap`}
                  title={`summed share ÷ decided duels`}
                >{`Per duel`}</th>
              </tr>
            </thead>
            <tbody>
              {n.map((e, n) => (
                <tr key={e.team}>
                  <td
                    className={r_1(
                      `font-display text-lg font-extrabold`,
                      n === 0 && e.share > 0 ? `text-gold` : `text-faint`,
                    )}
                  >
                    {n + 1}
                  </td>
                  <td className={`whitespace-nowrap`}>
                    <span className={`font-semibold text-ink`}>
                      {name(e.team)}
                    </span>
                    <span className={`ml-1.5 font-mono text-[10px] text-faint`}>
                      {e.team}
                    </span>
                  </td>
                  <td className={`num-cell font-mono text-xs`}>
                    {e.decided}
                    <span className={`text-faint`}>
                      {`/`}
                      {e.duels}
                    </span>
                  </td>
                  <td className={`num-cell font-mono text-xs`}>{e.deals}</td>
                  <td>
                    <div className={`flex items-center gap-2`}>
                      <div
                        className={`h-2 flex-1 overflow-hidden rounded-full bg-line`}
                      >
                        <div
                          className={`h-full rounded-full bg-gold`}
                          style={{
                            width: `${(e.share / r) * 100}%`,
                          }}
                        />
                      </div>
                      <span
                        className={`w-12 text-right font-display-num text-base text-ink`}
                      >
                        {y(e.share, 2)}
                      </span>
                    </div>
                  </td>
                  <td className={`num-cell font-mono text-xs text-info`}>
                    {y(e.as_seller, 2)}
                  </td>
                  <td className={`num-cell font-mono text-xs text-gold/90`}>
                    {y(e.as_buyer, 2)}
                  </td>
                  <td className={`num-cell font-mono text-xs text-muted`}>
                    {e.decided ? y(e.share / e.decided, 2) : `—`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <S1 compact title={`No teams in this session`} />
      )}
    </H1>
  );
}
function TeComponent({ s, sym, days }) {
  let r = H.useMemo(() => {
    let t = new Map();
    for (let n of s.duels) {
      let e = t.get(n.scenario) ?? {
        n: 0,
        deals: 0,
        decided: 0,
      };
      e.n += 1;
      if (n.status === `deal` || n.status === `no_deal`) {
        e.decided += 1;
      }
      if (n.status === `deal`) {
        e.deals += 1;
      }
      t.set(n.scenario, e);
    }
    return t;
  }, [s.duels]);
  return (
    <H1
      title={`Scenarios`}
      subtitle={`Base limits before each duel's secret scale and shift, so allies cannot swap numbers. A zone of zero or less means no deal is the right answer.`}
      padded={false}
    >
      <div className={`overflow-x-auto px-2 pb-2`}>
        <table className={`bz-table`}>
          <thead>
            <tr>
              <th className={`w-8`}>{`#`}</th>
              <th>{`Item`}</th>
              <th
                className={`num-cell`}
                title={`the seller's base cost`}
              >{`Cost`}</th>
              <th
                className={`num-cell`}
                title={`the buyer's base value`}
              >{`Value`}</th>
              <th
                className={`num-cell`}
                title={`value − cost: the room for a deal`}
              >{`Zone`}</th>
              {days && (
                <th
                  className={`num-cell whitespace-nowrap`}
                  title={`${sym} per delivery day: the seller gains / the buyer loses`}
                >
                  {sym}
                  {` per day`}
                </th>
              )}
              <th
                className={`num-cell`}
                title={`deals of decided duels on this scenario`}
              >{`Deals`}</th>
            </tr>
          </thead>
          <tbody>
            {s.scenarios.map((e, i) => {
              let a = e.base_value - e.base_cost;
              let o = r.get(i);
              return (
                <tr key={i}>
                  <td className={`font-mono text-xs text-faint`}>{i + 1}</td>
                  <td
                    className={`max-w-[12rem] truncate text-ink`}
                    title={e.item}
                  >
                    {e.item}
                  </td>
                  <td className={`num-cell font-mono text-xs`}>
                    {v(e.base_cost, {
                      symbol: sym,
                    })}
                  </td>
                  <td className={`num-cell font-mono text-xs`}>
                    {v(e.base_value, {
                      symbol: sym,
                    })}
                  </td>
                  <td className={`num-cell`}>
                    {a > 0 ? (
                      <span className={`font-mono text-xs text-good`}>
                        {`+`}
                        {y(a)}
                      </span>
                    ) : (
                      <C
                        tone={`accent`}
                        className={`h-5 px-2 text-[10px]`}
                        title={`value at or below cost: walking away is right`}
                      >
                        {y(a)}
                        {` · no deal`}
                      </C>
                    )}
                  </td>
                  {days && (
                    <td
                      className={`num-cell whitespace-nowrap font-mono text-xs`}
                      title={`seller gains / buyer loses per delivery day`}
                    >
                      <span className={`text-info`}>{y(e.w_seller, 1)}</span>
                      <span className={`text-faint`}>{` / `}</span>
                      <span className={`text-gold/90`}>{y(e.w_buyer, 1)}</span>
                    </td>
                  )}
                  <td className={`num-cell font-mono text-xs text-muted`}>
                    {o && o.decided ? `${o.deals}/${o.decided}` : `—`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </H1>
  );
}
function NeComponent({ s, name, sym, tick, capped }) {
  let [a, setA] = H.useState(``);
  let [c, setC] = H.useState(``);
  let [u, setU] = H.useState(false);
  let days = s.issues.includes(`days`);
  let p = H.useMemo(
    () =>
      s.duels
        .filter(
          (e) =>
            (!a || e.status === a) && (!c || e.seller === c || e.buyer === c),
        )
        .sort(
          (e, t) =>
            K[e.status] - K[t.status] ||
            (e.status === `waiting` ? e.duel - t.duel : t.duel - e.duel),
        ),
    [s.duels, a, c],
  );
  let m = H.useMemo(() => {
    let t = {};
    for (let n of s.duels) {
      t[n.status] = (t[n.status] ?? 0) + 1;
    }
    return t;
  }, [s.duels]);
  let g = u ? p : p.slice(0, q);
  return (
    <H1
      title={`Every duel`}
      subtitle={`Both private limits, the pie they could split, and what each side took home.${capped ? ` The server lists the last ${s.duels.length} of ${s.total}; the team sums above cover all of them.` : ``}`}
      padded={false}
      actions=<div className={`flex items-center gap-2`}>
        <O
          value={a}
          onChange={(e) => setA(e)}
          className={`w-36`}
          options={[
            {
              value: ``,
              label: `any status (${s.duels.length})`,
            },
            ...[`live`, `deal`, `no_deal`, `waiting`].map((e) => ({
              value: e,
              label: `${G[e]} (${m[e] ?? 0})`,
            })),
          ]}
        />
        <O
          value={c}
          onChange={setC}
          className={`w-40`}
          options={[
            {
              value: ``,
              label: `every team`,
            },
            ...Object.keys(s.per_team).map((e) => ({
              value: e,
              label: name(e),
            })),
          ]}
        />
      </div>
    >
      {p.length ? (
        <div className={`overflow-x-auto px-2 pb-2`}>
          <table className={`bz-table min-w-[980px]`}>
            <thead>
              <tr>
                <th className={`w-12`}>{`Duel`}</th>
                <th>{`Item`}</th>
                <th>{`Seller → buyer`}</th>
                <th>{`Status`}</th>
                <th className={`num-cell`}>
                  {`Price`}
                  {days ? ` · days` : ``}
                </th>
                <th
                  className={`num-cell`}
                  title={`seller's cost / buyer's value, after the duel's secret map`}
                >{`Limits`}</th>
                <th
                  className={`num-cell`}
                  title={`the biggest surplus the two could split`}
                >{`Pie`}</th>
                <th
                  className={`num-cell`}
                  title={`full rounds of talk · the decay factor applied to the deal`}
                >{`Rounds`}</th>
                <th
                  className={`w-44`}
                  title={`seller's share (blue) and buyer's share (gold) of the pie; the gap is lost to decay or left on the table`}
                >{`Split`}</th>
                <th
                  className={`num-cell`}
                  title={`surplus captured after decay, seller / buyer`}
                >{`Captured`}</th>
              </tr>
            </thead>
            <tbody>
              {g.map((d) => (
                <ReComponent
                  key={d.duel}
                  d={d}
                  s={s}
                  name={name}
                  sym={sym}
                  tick={tick}
                  days={days}
                />
              ))}
            </tbody>
          </table>
          {p.length > q && (
            <div className={`px-3 py-2 text-xs text-muted`}>
              {u ? `all ${p.length} shown · ` : `${q} of ${p.length} shown · `}
              <button
                type={`button`}
                className={`font-semibold text-gold hover:underline`}
                onClick={() => setU((e) => !e)}
              >
                {u ? `show fewer` : `show all`}
              </button>
            </div>
          )}
        </div>
      ) : (
        <S1
          compact
          title={`No duels match`}
          hint={`Change the filters above.`}
        />
      )}
    </H1>
  );
}
function ReComponent({ d: d_1, s: s_1, name, sym, tick, days }) {
  let s = s_1.scenarios[d_1.scenario];
  let [c, l] = d_1.limits;
  let u =
    d_1.status === `live` && tick !== undefined
      ? Math.max(0, d_1.deadline_tick - tick)
      : null;
  let seller = d_1.share[d_1.seller] ?? 0;
  let buyer = d_1.share[d_1.buyer] ?? 0;
  return (
    <tr>
      <td className={`font-mono text-xs text-faint`}>
        {`#`}
        {d_1.duel}
      </td>
      <td className={`max-w-[11rem]`}>
        <div className={`truncate text-ink`} title={s?.item}>
          {s?.item ?? `—`}
        </div>
        <div className={`text-[10px] text-faint`}>
          {`scenario `}
          {d_1.scenario + 1}
        </div>
      </td>
      <td className={`whitespace-nowrap`}>
        <span className={`font-semibold text-info`}>{name(d_1.seller)}</span>
        <span className={`mx-1 text-faint`}>{`→`}</span>
        <span className={`font-semibold text-gold/90`}>{name(d_1.buyer)}</span>
      </td>
      <td className={`whitespace-nowrap`}>
        <C
          tone={W[d_1.status]}
          className={`h-5 px-2 text-[10px]`}
          live={d_1.status === `live`}
        >
          {G[d_1.status]}
        </C>
        {u !== null && (
          <div className={`mt-0.5 text-[10px] text-faint`}>
            {`closes in `}
            {x_1(u, `tick`)}
          </div>
        )}
      </td>
      <td className={`num-cell font-mono text-xs`}>
        {d_1.price === null
          ? `—`
          : v(d_1.price, {
              symbol: sym,
            })}
        {days && d_1.status === `deal` && (
          <span className={`text-faint`}>
            {` · `}
            {d_1.days}
            {`d`}
          </span>
        )}
      </td>
      <td className={`num-cell whitespace-nowrap font-mono text-xs`}>
        <span className={`text-info`}>{y(c)}</span>
        <span className={`text-faint`}>{` / `}</span>
        <span className={`text-gold/90`}>{y(l)}</span>
      </td>
      <td
        className={r_1(
          `num-cell font-mono text-xs`,
          d_1.max_pie <= 0 ? `text-accent` : `text-ink`,
        )}
      >
        {y(d_1.max_pie, 1)}
      </td>
      <td className={`num-cell whitespace-nowrap font-mono text-xs`}>
        {d_1.rounds}
        {d_1.status === `deal` && (
          <span className={`text-faint`}>
            {` ×`}
            {y(d_1.factor, 2)}
          </span>
        )}
      </td>
      <td>
        <IeComponent d={d_1} seller={seller} buyer={buyer} />
      </td>
      <td className={`num-cell whitespace-nowrap font-mono text-xs`}>
        {d_1.status === `deal` ? (
          <>
            <span className={`text-info`}>{y(d_1.result[d_1.seller], 1)}</span>
            <span className={`text-faint`}>{` / `}</span>
            <span className={`text-gold/90`}>
              {y(d_1.result[d_1.buyer], 1)}
            </span>
          </>
        ) : d_1.status === `no_deal` ? (
          <span className={`text-faint`}>{`0 / 0`}</span>
        ) : (
          `—`
        )}
      </td>
    </tr>
  );
}
function IeComponent({ d, seller, buyer }) {
  if (d.status !== `deal`) {
    return (
      <div className={`flex items-center gap-2`}>
        <div
          className={r_1(
            `h-2 flex-1 rounded-full`,
            d.status === `no_deal`
              ? `bg-accent/25`
              : `bg-line [background-image:repeating-linear-gradient(135deg,transparent_0_4px,rgb(255_255_255/0.05)_4px_8px)]`,
          )}
        />
        <span
          className={`w-16 whitespace-nowrap text-right font-mono text-[10px] text-faint`}
        >
          {d.status === `no_deal`
            ? `0·0`
            : d.status === `live`
              ? `talking`
              : `queued`}
        </span>
      </div>
    );
  }
  let r = Math.max(0, Math.min(1, seller));
  let a = Math.max(0, Math.min(1 - r, buyer));
  let o =
    seller === 0 && buyer === 0 && Object.values(d.result).some((e) => e < 0);
  return (
    <div
      className={`flex items-center gap-2`}
      title={
        o
          ? `a side went below its own limit: neither scores (no feeding a friend)`
          : `seller ${y(seller, 3)} · buyer ${y(buyer, 3)} of the pie`
      }
    >
      <div className={`flex h-2 flex-1 overflow-hidden rounded-full bg-line`}>
        <div
          className={`h-full bg-info`}
          style={{
            width: `${r * 100}%`,
          }}
        />
        <div className={`h-full flex-1`} />
        <div
          className={`h-full bg-gold`}
          style={{
            width: `${a * 100}%`,
          }}
        />
      </div>
      <span
        className={r_1(
          `w-16 whitespace-nowrap text-right font-mono text-[10px]`,
          o ? `text-accent` : `text-muted`,
        )}
      >
        {o ? `below limit` : `${y(seller, 2)}·${y(buyer, 2)}`}
      </span>
    </div>
  );
}
function AeComponent({
  open,
  onClose,
  teamCount,
  frozenCount,
  nextName,
  tickSeconds,
  onDone,
}) {
  let [c, setC] = H.useState(nextName);
  let [d, setD] = H.useState([`price`]);
  let [p, setP] = H.useState(2);
  let [h, setH] = H.useState(16);
  let [v, setV] = H.useState(0.06);
  let [x, setX] = H.useState(3);
  let [C, setC_1] = H.useState(6);
  let [O, setO] = H.useState(false);
  H.useEffect(() => {
    if (open) {
      setC(nextName);
    }
  }, [open, nextName]);
  let j = teamCount;
  let P = j * (j - 1);
  let I = P * (p ?? 0);
  let L = 2 * Math.max(0, j - 1) * (p ?? 0);
  let R = (x ? Math.ceil(L / x) : 0) * (h ?? 0);
  let z = v === null ? null : (1 - v) ** 5;
  let B =
    !!c.trim() &&
    p !== null &&
    h !== null &&
    v !== null &&
    x !== null &&
    C !== null &&
    j >= 2;
  return (
    <D
      open={open}
      onClose={onClose}
      size={`lg`}
      title={`Schedule a duel session`}
      confirmLabel={O ? `Schedule practice` : `Schedule duels`}
      disabled={!B}
      onConfirm={async () => {
        onDone(
          await s_1.scheduleDuels({
            name: c.trim(),
            rounds: p ?? 2,
            duel_ticks: h ?? 16,
            decay: v ?? 0.06,
            max_concurrent: x ?? 3,
            scenarios: C ?? 6,
            issues: d,
            practice: O,
          }),
          O,
        );
      }}
    >
      <p>
        {`It starts at once: duels go live as soon as both teams have a free slot. Teams find them on `}
        <code
          className={`font-mono text-[12px] text-ink`}
        >{`GET /api/duels`}</code>
        {`; the big screen shows the session.`}
      </p>
      <div className={`grid gap-4 sm:grid-cols-2`}>
        <M label={`Name`} hint={`shown to teams and on the big screen`}>
          <N value={c} onChange={setC} maxLength={60} autoFocus />
        </M>
        <M
          label={`Issues`}
          hint={
            d.includes(`days`)
              ? `each side has a private primas-per-day weight: trading days for price grows the pie`
              : `a single number to agree on`
          }
        >
          <div className={`flex gap-1.5`} role={`group`} aria-label={`Issues`}>
            {[
              [[`price`], `Price only`],
              [[`price`, `days`], `Price + delivery days`],
            ].map(([e, t]) => {
              let n = e.length === d.length;
              return (
                <button
                  key={t}
                  type={`button`}
                  aria-pressed={n}
                  onClick={() => setD(e)}
                  className={r_1(
                    `h-9 flex-1 rounded-lg border px-3 text-xs font-semibold transition-colors`,
                    n
                      ? `border-gold/50 bg-gold/12 text-gold`
                      : `border-line-strong text-muted hover:text-ink`,
                  )}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </M>
        <M
          label={`Round-robins`}
          hint={`every pair meets twice per round-robin, once in each role`}
        >
          <A value={p} integer min={1} max={6} onChange={setP} />
        </M>
        <M
          label={`Ticks per duel`}
          hint={`no accepted offer by then = no deal, 0 for both${tickSeconds && h ? ` · ≈ ${f(h, tickSeconds)} now` : ``}`}
        >
          <A
            value={h}
            integer
            min={4}
            max={240}
            onChange={setH}
            suffix={`ticks`}
          />
        </M>
        <M
          label={`Decay per round`}
          aside={v === null ? undefined : b(v)}
          hint={
            z === null
              ? `value lost per full round of talk`
              : `value lost per full round of talk: after 5 rounds a deal keeps ${b(z)}`
          }
        >
          <A value={v} min={0} max={0.5} step={0.01} onChange={setV} />
        </M>
        <M
          label={`At once per team`}
          hint={`how many duels one team plays at the same time`}
        >
          <A value={x} integer min={1} max={20} onChange={setX} />
        </M>
        <M
          label={`Scenarios`}
          hint={`base scenarios drawn from the server secret; about one in six has no zone of agreement`}
        >
          <A value={C} integer min={2} max={30} onChange={setC_1} />
        </M>
        <div className={`flex items-end pb-1`}>
          <_
            checked={O}
            onChange={setO}
            tone={`gold`}
            label={`Practice session`}
            description={`teaches the protocol; its shares never reach the score`}
          />
        </div>
      </div>
      <div
        className={r_1(
          `rounded-xl border px-3 py-2.5 text-xs`,
          j >= 2
            ? `border-line bg-base/50 text-muted`
            : `border-accent/40 bg-accent/10 text-accent`,
        )}
      >
        {j >= 2 ? (
          <>
            <b className={`text-ink`}>
              {j}
              {` teams`}
            </b>
            {` → `}
            <b className={`text-ink`}>
              {y(I)}
              {` duels`}
            </b>
            {` (`}
            {y(P)}
            {` per round-robin); each team plays `}
            {y(L)}
            {`, at most `}
            {x ?? `—`}
            {` at a time — up to ≈ `}
            {y(R)}
            {` ticks`}
            {tickSeconds && R
              ? ` (${f(R, tickSeconds)} at the current speed)`
              : ``}
            {` if every duel runs to its deadline.`}
            {frozenCount > 0 &&
              ` ${x_1(frozenCount, `frozen team`)}: ${frozenCount === 1 ? `its` : `their`} duels close with no deal.`}
          </>
        ) : (
          `Duels need at least two teams.`
        )}
      </div>
    </D>
  );
}
export { ZComponent as default };
