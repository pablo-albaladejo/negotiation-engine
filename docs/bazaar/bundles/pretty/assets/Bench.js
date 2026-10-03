import { i, n, t } from "./jsx-runtime.js";
import { i as i_2, r as r_1, t as A1 } from "./Button.js";
import { t as O1 } from "./EmptyState.js";
import { a as S1, i as i_3, s as s_1, t as t_2 } from "./useEvents.js";
import { t as D1 } from "./play.js";
import { t as F1 } from "./ErrorNote.js";
import { t as P1 } from "./trending-up.js";
import { t as M1 } from "./KPI.js";
import { t as H1 } from "./PageHeader.js";
import { t as G1 } from "./Panel.js";
import { t as _ } from "./Slider.js";
import { t as V1 } from "./Tabs.js";
import {
  A,
  H as H_1,
  L as L_1,
  M,
  b,
  l,
  r as r_2,
  u as E,
  x as x_1,
  y,
} from "./index.js";
import { t as K1 } from "./ConfirmDialog.js";
import {
  i as i_4,
  l as J1,
  n as n_2,
  o as N,
  p as P,
  r as r_3,
} from "./hooks.js";
import { f as f_1 } from "./util.js";
const L = {
  name: `target`,
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
      `circle`,
      {
        cx: `12`,
        cy: `12`,
        r: `6`,
        key: `1vlfrh`,
      },
    ],
    [
      `circle`,
      {
        cx: `12`,
        cy: `12`,
        r: `2`,
        key: `1c9p78`,
      },
    ],
  ],
};
L.node;
const R = i_2(L);
const z = i(n(), 1);
const B = t();
const V = 0.005;
const H = (e) => {
  if (e.status === `live`) {
    return `live`;
  }
  if (e.efficiency === null) {
    return `muted`;
  }
  if (e.efficiency > e.auto_baseline + V) {
    return `good`;
  }
  if (e.efficiency < e.auto_baseline - V) {
    return `accent`;
  }
  return `gold`;
};
function UComponent() {
  let e = r_2();
  let t = n_2();
  let n = r_3();
  let { clock } = l({
    live: false,
  });
  let i = i_3((e) => s_1.bench(e), 5000);
  let p = i_3((e) => s_1.venues(e), 15000);
  let m = t_2(() => s_1.config(), []);
  i_4([`bench.`, `round.`], i.refresh, {
    throttleMs: 1500,
  });
  i_4([`venue.`], p.refresh, {
    throttleMs: 2000,
  });
  i_4([`bench.finished`, `round.`], () => void n.refresh(), {
    throttleMs: 2000,
  });
  let g = z.useMemo(() => [...(i.data?.sessions ?? [])].reverse(), [i.data]);
  let [_, set_] = z.useState(null);
  let [open, setOpen] = z.useState(false);
  let s =
    g.find((e) => e.session === _) ??
    g.find((e) => e.status === `live`) ??
    g[0];
  let byVenue = z.useMemo(
    () => new Map((p.data?.venues ?? []).map((e) => [e.venue, e])),
    [p.data],
  );
  let openVenues = (p.data?.venues ?? []).filter(
    (e) => !e.house && e.status === `open`,
  );
  let benchWeight = Number(m.data?.game?.scoring?.bench_weight ?? NaN);
  return (
    <div>
      <H1
        eyebrow={`Game master`}
        title={`The Market Test`}
        subtitle={`The venue bench: every open team venue gets the identical synthetic order book, so brokers compete on the same traders. Efficiency is realised ÷ feasible gains; the score is measured against the free auto stall on the same book.`}
        actions=<A1
          variant={`primary`}
          icon=<D1 className={`size-4`} />
          onClick={() => setOpen(true)}
        >{`Run the Market Test`}</A1>
      />
      {i.error && <F1 error={i.error} onRetry={i.refresh} className={`mb-4`} />}
      <WComponent benchWeight={benchWeight} />
      {i.loading && !i.data ? (
        <div className={`mt-4 flex flex-col gap-4`}>
          <S1 className={`h-28 rounded-2xl`} />
          <S1 className={`h-72 rounded-2xl`} />
        </div>
      ) : s ? (
        <div className={`mt-4 flex flex-col gap-4`}>
          {g.length > 1 && (
            <V1
              variant={`pills`}
              size={`sm`}
              label={`Bench sessions`}
              className={`w-fit max-w-full flex-wrap`}
              value={String(s.session)}
              onChange={(e) => set_(Number(e))}
              tabs={g.map((e) => ({
                id: String(e.session),
                label: (
                  <span
                    className={`inline-flex items-center gap-1.5 whitespace-nowrap`}
                  >
                    {e.status === `live` && (
                      <span
                        className={`size-1.5 rounded-full bg-gold`}
                        aria-hidden
                      />
                    )}
                    <span className={`max-w-[16rem] truncate`}>{e.name}</span>
                    <span className={`font-mono text-[10px] text-faint`}>
                      {`#`}
                      {e.session}
                    </span>
                  </span>
                ),
              }))}
            />
          )}
          <div
            className={`grid gap-4 2xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]`}
          >
            <GComponent
              key={s.session}
              s={s}
              byVenue={byVenue}
              name={t.name}
              tickSeconds={clock?.tick_seconds}
            />
            <QComponent
              rows={n.rows}
              round={clock?.round}
              byVenue={byVenue}
              benchWeight={benchWeight}
            />
          </div>
        </div>
      ) : (
        <O1
          className={`mt-4`}
          icon=<M className={`size-6`} />
          title={`No bench session yet`}
          hint="Sessions come from `schedule` in config/game.yaml (from +3h, every 2 hours) or from here. Only open team venues are benched."
          action=<A1
            variant={`primary`}
            onClick={() => setOpen(true)}
          >{`Run the Market Test`}</A1>
        />
      )}
      <YComponent
        open={open}
        onClose={() => setOpen(false)}
        openVenues={openVenues}
        nextName={`The Market Test ${g.length + 1}`}
        tickSeconds={clock?.tick_seconds}
        onDone={(t) => {
          e.gold(
            `The Market Test #${t.session} started`,
            `${x_1(t.venues.length, `venue`)} on the same synthetic book`,
          );
          set_(t.session);
          i.refresh();
        }}
      />
    </div>
  );
}
function WComponent({ benchWeight }) {
  return (
    <G1 padded={false}>
      <div
        className={`grid gap-4 px-5 py-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] md:items-center`}
      >
        <div className={`text-xs leading-relaxed text-muted`}>
          <div className={`eyebrow mb-1 text-gold/90`}>{`How it scores`}</div>
          {`Each session counts a team's best venue open in it, and 0 if none was; the round averages its sessions, so closing a venue never keeps its score. Matching as well as the free auto stall earns`}
          {` `}
          <b className={`text-ink`}>{`half`}</b>
          {`; the teams above it share the rest, up to `}
          <b className={`text-ink`}>{`full`}</b>
          {` at the mean of the top three.`}
          {Number.isFinite(benchWeight) && (
            <>
              {` `}
              {`Once a session ran, the Market Test carries `}
              <b className={`text-ink`}>{b(benchWeight)}</b>
              {` of the market score; organic market-making the rest.`}
            </>
          )}
        </div>
        <div className={`px-2`} aria-hidden>
          <div className={`relative h-8`}>
            <div
              className={`absolute inset-x-0 top-3.5 h-1.5 rounded-full bg-gradient-to-r from-accent/50 via-gold/70 to-good`}
            />
            {[0, 50, 100].map((e) => (
              <span
                key={e}
                className={`absolute top-0 h-5 w-0.5 -translate-x-1/2 rounded-full bg-ink/80`}
                style={{
                  left: `${e}%`,
                }}
              />
            ))}
          </div>
          <div className={`relative h-8 text-[11px]`}>
            {[
              {
                at: 0,
                label: `0`,
                sub: `no gains realised`,
              },
              {
                at: 50,
                label: `0.5`,
                sub: `the auto stall`,
              },
              {
                at: 100,
                label: `1.0`,
                sub: `top-three mean`,
              },
            ].map((e) => (
              <div
                key={e.at}
                className={r_1(
                  `absolute top-0 flex flex-col`,
                  e.at === 0
                    ? `items-start`
                    : e.at === 100
                      ? `items-end`
                      : `-translate-x-1/2 items-center`,
                )}
                style={
                  e.at === 100
                    ? {
                        right: 0,
                      }
                    : {
                        left: `${e.at}%`,
                      }
                }
              >
                <span className={`font-display-num text-sm text-ink`}>
                  {e.label}
                </span>
                <span className={`text-faint`}>{e.sub}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </G1>
  );
}
function GComponent({ s: s_1, byVenue, name, tickSeconds }) {
  let i = [...s_1.runs].sort(
    (e, t) =>
      (t.efficiency ?? -1) - (e.efficiency ?? -1) ||
      e.venue.localeCompare(t.venue),
  );
  let a = i.length
    ? i.reduce((acc, item) => acc + item.auto_baseline, 0) / i.length
    : null;
  let s = i.filter((e) => e.status === `done`);
  let c = s.find((e) => e.efficiency !== null);
  let length = s.filter(
    (e) => e.efficiency !== null && e.efficiency > e.auto_baseline + V,
  ).length;
  let length_1 = s.filter(
    (e) => e.efficiency !== null && e.efficiency < e.auto_baseline - V,
  ).length;
  let d = i[0]?.feasible;
  return (
    <div className={`flex min-w-0 flex-col gap-4`}>
      <G1 padded={false}>
        <div className={`flex flex-wrap items-center gap-2 px-5 pb-1 pt-4`}>
          <h2 className={`min-w-0 truncate text-3xl text-ink`}>{s_1.name}</h2>
          <E
            tone={s_1.status === `live` ? `gold` : `muted`}
            dot
            live={s_1.status === `live`}
          >
            {s_1.status}
          </E>
          <E tone={`neutral`}>
            {`round `}
            {s_1.round}
          </E>
        </div>
        <p className={`px-5 pb-4 text-xs text-muted`}>
          {s_1.ticks}
          {` ticks`}
          {tickSeconds ? ` (≈ ${f_1(s_1.ticks, tickSeconds)})` : ``}
          {` · `}
          {x_1(i.length, `venue`)}
          {` on the same book · session #`}
          {s_1.session}
          {d !== undefined && ` · feasible gains ${y(d)}`}
        </p>
      </G1>
      <div className={`grid grid-cols-2 gap-3 lg:grid-cols-4`}>
        <M1
          label={`Auto baseline`}
          value={a === null ? `—` : b(a, 1)}
          icon=<R className={`size-4`} />
          tone={`gold`}
          hint={`free auto stall, same book`}
        />
        <M1
          label={`Best`}
          value={c ? b(c.efficiency, 1) : `—`}
          icon=<P1 className={`size-4`} />
          tone={`good`}
          hint={
            c
              ? `${byVenue.get(c.venue)?.name ?? c.venue}`
              : `when the first run finishes`
          }
        />
        <M1
          label={`Above base`}
          value={length}
          unit={`/ ${s.length}`}
          icon=<L_1 className={`size-4`} />
          tone={length ? `good` : `default`}
          hint={`${length_1} below · ${s.length - length - length_1} at it`}
        />
        <M1
          label={`Venues`}
          value={i.length}
          icon=<A className={`size-4`} />
          hint={`${s.length} finished · ${i.length - s.length} running`}
        />
      </div>
      <G1
        title={`Runs against the baseline`}
        subtitle={`Each bar is one venue's efficiency on its copy of the book; the gold tick is what the free auto stall achieves on the same traders.`}
        padded={false}
      >
        {i.length ? (
          <div className={`overflow-x-auto px-2 pb-2`}>
            <table className={`bz-table min-w-[680px]`}>
              <thead>
                <tr>
                  <th>{`Venue`}</th>
                  <th>{`Status`}</th>
                  <th className={`num-cell`}>{`Matches`}</th>
                  <th
                    className={`num-cell`}
                    title={`gains from trade realised ÷ the most the book allows`}
                  >{`Realised`}</th>
                  <th className={`w-[36%]`}>{`Efficiency vs baseline`}</th>
                  <th
                    className={`num-cell`}
                    title={`efficiency minus the auto baseline, in percentage points`}
                  >{`Δ`}</th>
                </tr>
              </thead>
              <tbody>
                {i.map((r) => (
                  <KComponent
                    key={r.venue}
                    r={r}
                    v={byVenue.get(r.venue)}
                    name={name}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <O1
            compact
            icon=<A className={`size-5`} />
            title={`No venue in this session`}
            hint={`Only venues open when the session started are benched.`}
          />
        )}
      </G1>
    </div>
  );
}
function KComponent({ r: r_2, v, name }) {
  let r = H(r_2);
  let a = r_2.efficiency === null ? null : r_2.efficiency - r_2.auto_baseline;
  let o = v?.rules?.mechanism;
  return (
    <tr>
      <td className={`whitespace-nowrap`}>
        <H_1
          to={`/admin/venues/${r_2.venue}`}
          className={`font-semibold text-ink hover:text-gold`}
        >
          {v?.name ?? r_2.venue}
        </H_1>
        <div
          className={`mt-0.5 flex items-center gap-1.5 text-[11px] text-faint`}
        >
          {v && (
            <H_1
              to={`/admin/teams/${v.owner}`}
              className={`text-info hover:underline`}
            >
              {v.owner_name || name(v.owner)}
            </H_1>
          )}
          <span className={`font-mono`}>{r_2.venue}</span>
          {o && (
            <span className={`rounded bg-raised px-1 text-[10px] text-muted`}>
              {o === `auto` ? `auto match` : `broker`}
            </span>
          )}
          {v?.starter && (
            <span
              className={`rounded bg-raised px-1 text-[10px] text-muted`}
            >{`starter`}</span>
          )}
        </div>
      </td>
      <td>
        <E
          tone={r_2.status === `live` ? `gold` : `muted`}
          className={`h-5 px-2 text-[10px]`}
          live={r_2.status === `live`}
        >
          {r_2.status}
        </E>
      </td>
      <td className={`num-cell font-mono text-xs`}>{r_2.matches}</td>
      <td className={`num-cell whitespace-nowrap font-mono text-xs`}>
        {y(r_2.realised)}
        <span className={`text-faint`}>
          {` / `}
          {y(r_2.feasible)}
        </span>
      </td>
      <td>
        <div className={`flex items-center gap-2.5`}>
          <div className={`relative h-2.5 flex-1 rounded-full bg-line`}>
            <div
              className={r_1(
                `h-full rounded-full`,
                r === `good`
                  ? `bg-good`
                  : r === `accent`
                    ? `bg-accent`
                    : r === `gold`
                      ? `bg-gold/80`
                      : r === `live`
                        ? `bg-info/70`
                        : `bg-line-strong`,
              )}
              style={{
                width: `${Math.max(0, Math.min(1, r_2.efficiency ?? 0)) * 100}%`,
              }}
            />
            <span
              className={`absolute -top-1 h-4.5 w-0.5 -translate-x-1/2 rounded-full bg-gold shadow-[0_0_0_2px_var(--color-panel)]`}
              style={{
                left: `${Math.max(0, Math.min(1, r_2.auto_baseline)) * 100}%`,
              }}
              title={`auto baseline ${b(r_2.auto_baseline, 1)}`}
            />
          </div>
          <span
            className={`w-14 text-right font-display-num text-base text-ink`}
          >
            {r_2.efficiency === null ? `—` : b(r_2.efficiency, 1)}
          </span>
        </div>
      </td>
      <td
        className={r_1(
          `num-cell whitespace-nowrap font-mono text-xs`,
          r === `good`
            ? `text-good`
            : r === `accent`
              ? `text-accent`
              : `text-muted`,
        )}
      >
        {r === `live`
          ? `running`
          : a === null
            ? `—`
            : Math.abs(a) < V
              ? `at base`
              : `${a > 0 ? `+` : `−`}${y(Math.abs(a) * 100, 1)} pt`}
      </td>
    </tr>
  );
}
function QComponent({ rows, round, byVenue, benchWeight }) {
  let a = [...rows].sort(
    (e, t) =>
      (t.bench_points ?? -1) - (e.bench_points ?? -1) ||
      e.name.localeCompare(t.name),
  );
  let s = a.some(
    (e) => e.bench_points !== null && e.bench_points !== undefined,
  );
  return (
    <G1
      title={`Bench standing${round ? ` · round ${round}` : ``}`}
      subtitle={`What the market score reads: every session this round, each counting the team's best venue open in it (none open counts 0).${Number.isFinite(benchWeight) ? ` Bench points (0–1) carry ${b(benchWeight)} of the market component.` : ``}`}
      padded={false}
      className={`h-fit`}
    >
      {s ? (
        <div className={`overflow-x-auto px-2 pb-2`}>
          <table className={`bz-table`}>
            <thead>
              <tr>
                <th>{`Team`}</th>
                <th
                  className={`num-cell`}
                  title={`realised ÷ feasible of the team's best venue in each session, averaged over the round's sessions`}
                >{`Efficiency`}</th>
                <th
                  className={`w-[42%]`}
                  title={`0.5 at the auto stall, 1.0 at the top-three mean`}
                >{`Bench points`}</th>
              </tr>
            </thead>
            <tbody>
              {a.map((e) => {
                let e_bench_points = e.bench_points;
                let r = e.bench_venue ?? undefined;
                let a = r
                  ? byVenue.get(r)
                  : e.venue
                    ? byVenue.get(e.venue)
                    : undefined;
                return (
                  <tr key={e.id}>
                    <td className={`max-w-[14rem]`}>
                      <div className={`truncate font-semibold text-ink`}>
                        {e.name}
                      </div>
                      <div
                        className={`truncate text-[11px] text-faint`}
                        title={
                          r
                            ? `the venue the round's latest session counted`
                            : undefined
                        }
                      >
                        {a
                          ? `${r ? `counts ` : ``}${a.name}${a.starter ? ` · starter` : ``}${a.status === `closed` ? ` · now closed` : ``}`
                          : `no venue`}
                      </div>
                    </td>
                    <td className={`num-cell font-mono text-xs`}>
                      {e.bench_efficiency === null ||
                      e.bench_efficiency === undefined
                        ? `—`
                        : b(e.bench_efficiency, 1)}
                    </td>
                    <td>
                      {e_bench_points == null ? (
                        <span
                          className={`text-xs text-faint`}
                        >{`not benched`}</span>
                      ) : (
                        <div className={`flex items-center gap-2`}>
                          <div
                            className={`relative h-2 flex-1 rounded-full bg-line`}
                          >
                            <div
                              className={r_1(
                                `h-full rounded-full`,
                                e_bench_points > 0.505
                                  ? `bg-good`
                                  : e_bench_points < 0.495
                                    ? `bg-accent`
                                    : `bg-gold/80`,
                              )}
                              style={{
                                width: `${Math.min(1, e_bench_points) * 100}%`,
                              }}
                            />
                            <span
                              className={`absolute -top-0.5 left-1/2 h-3 w-px bg-ink/50`}
                              aria-hidden
                            />
                          </div>
                          <span
                            className={`w-10 text-right font-display-num text-base text-ink`}
                          >
                            {y(e_bench_points, 2)}
                          </span>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <O1
          compact
          icon=<M className={`size-5`} />
          title={`No finished session this round`}
          hint={`Bench points appear when the first session of the round finishes.`}
        />
      )}
    </G1>
  );
}
const J = [
  {
    label: `The Market Test`,
    traders: 10,
    ticks: 16,
    firm: 0.2,
    impatient: 0.25,
    hint: `the regular session`,
  },
  {
    label: `The hard Market Test`,
    traders: 12,
    ticks: 16,
    firm: 0.35,
    impatient: 0.35,
    hint: `firmer, more impatient traders`,
  },
];
function YComponent({
  open,
  onClose,
  openVenues,
  nextName,
  tickSeconds,
  onDone,
}) {
  let [s, setS] = z.useState(``);
  let [u, setU] = z.useState(10);
  let [f, setF] = z.useState(16);
  let [m, setM] = z.useState(0.2);
  let [g, setG] = z.useState(0.25);
  let [y, setY] = z.useState(false);
  if (open !== y) {
    setY(open);
    if (open) {
      setS(nextName);
    }
  }
  let x = !!s.trim() && u !== null && f !== null;
  return (
    <K1
      open={open}
      onClose={onClose}
      size={`lg`}
      title={`Run the Market Test now`}
      confirmLabel={`Start the bench`}
      disabled={!x}
      onConfirm={async () => {
        onDone(
          await s_1.scheduleBench({
            name: s.trim(),
            traders: u ?? 10,
            ticks: f ?? 16,
            firm_share: m,
            impatient_share: g,
          }),
        );
      }}
    >
      <p>{`Every team venue open right now gets the same synthetic book. Bench goods are virtual: nothing in the ledger moves and teams cannot see or take the bench offers.`}</p>
      <div className={`flex flex-wrap gap-2`}>
        {J.map((e) => {
          let t =
            u === e.traders &&
            f === e.ticks &&
            m === e.firm &&
            g === e.impatient;
          return (
            <button
              key={e.label}
              type={`button`}
              aria-pressed={t}
              onClick={() => {
                setU(e.traders);
                setF(e.ticks);
                setM(e.firm);
                setG(e.impatient);
              }}
              className={r_1(
                `rounded-xl border px-3 py-2 text-left transition-colors`,
                t
                  ? `border-gold/50 bg-gold/10`
                  : `border-line-strong hover:border-muted/60`,
              )}
            >
              <div
                className={r_1(
                  `text-xs font-bold`,
                  t ? `text-gold` : `text-ink`,
                )}
              >
                {e.label}
              </div>
              <div className={`text-[11px] text-faint`}>
                {e.traders}
                {` per side · `}
                {e.ticks}
                {` ticks · `}
                {e.hint}
              </div>
            </button>
          );
        })}
      </div>
      <div className={`grid gap-4 sm:grid-cols-3`}>
        <N
          label={`Name`}
          className={`sm:col-span-3`}
          hint={`shown on the big screen and in each team's bench result`}
        >
          <P value={s} onChange={setS} maxLength={60} autoFocus />
        </N>
        <N
          label={`Traders per side`}
          hint={`house buyers and sellers, each with a private limit`}
        >
          <J1 value={u} integer min={2} max={40} onChange={setU} />
        </N>
        <N
          label={`Ticks`}
          hint={
            tickSeconds && f
              ? `how long the book trades · ≈ ${f_1(f, tickSeconds)} now`
              : `how long the book trades`
          }
        >
          <J1
            value={f}
            integer
            min={4}
            max={120}
            onChange={setF}
            suffix={`ticks`}
          />
        </N>
        <div className={`hidden sm:block`} />
        <div className={`sm:col-span-3 grid gap-5 sm:grid-cols-2`}>
          <div>
            <_
              label={`Firm traders`}
              value={m}
              onChange={(e) => setM(Math.round(e * 100) / 100)}
              min={0}
              max={1}
              step={0.05}
              format={(e) => b(e)}
            />
            <p
              className={`mt-1 text-xs text-faint`}
            >{`Share whose quotes never relax: a broker waiting for them to cross waits in vain.`}</p>
          </div>
          <div>
            <_
              label={`Impatient traders`}
              value={g}
              onChange={(e) => setG(Math.round(e * 100) / 100)}
              min={0}
              max={1}
              step={0.05}
              format={(e) => b(e)}
            />
            <p
              className={`mt-1 text-xs text-faint`}
            >{`Share who leave after 1–2 ticks instead of 3–6: slow matching loses them.`}</p>
          </div>
        </div>
      </div>
      <div
        className={r_1(
          `rounded-xl border px-3 py-2.5 text-xs`,
          openVenues.length
            ? `border-line bg-base/50 text-muted`
            : `border-warn/40 bg-warn/10 text-warn`,
        )}
      >
        {openVenues.length ? (
          <>
            <b className={`text-ink`}>
              {x_1(openVenues.length, `open team venue`)}
            </b>
            {` would be benched: `}
            {openVenues.map((e) => e.name).join(`, `)}
            {`.`}
          </>
        ) : (
          `No team venue is open right now: the session would bench nobody. Starter stalls open when team trading opens.`
        )}
      </div>
    </K1>
  );
}
export { UComponent as default };
