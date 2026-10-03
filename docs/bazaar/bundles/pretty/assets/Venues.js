import { i, n, t } from "./jsx-runtime.js";
import { i as i_2, r, t as A1 } from "./Button.js";
import { t as O1 } from "./EventLine.js";
import { t as S1 } from "./coins.js";
import { t as C1 } from "./EmptyState.js";
import {
  a as L1,
  c as c_1,
  i as i_3,
  s as s_1,
  t as t_2,
} from "./useEvents.js";
import { t as M1 } from "./landmark.js";
import { t as H1 } from "./octagon-alert.js";
import { t as G1 } from "./ErrorNote.js";
import { t as _ } from "./trending-up.js";
import { n as n_2 } from "./catalog.js";
import { t as t_3 } from "./names.js";
import { t as B1 } from "./KPI.js";
import { t as X1 } from "./PageHeader.js";
import { t as S } from "./Slider.js";
import {
  A,
  B as B_1,
  D,
  G as G_1,
  H as H_1,
  K as K_1,
  i as K1,
  l,
  p,
  r as r_2,
  u as N,
  v as v_1,
  y,
} from "./index.js";
import { t as I } from "./ConfirmDialog.js";
import { i as i_4, o as R, p as Z1 } from "./hooks.js";
import { n as B } from "./OfferView.js";
const V = {
  name: `circle-play`,
  size: 24,
  node: [
    [
      `path`,
      {
        d: `M9 9.003a1 1 0 0 1 1.517-.859l4.997 2.997a1 1 0 0 1 0 1.718l-4.997 2.997A1 1 0 0 1 9 14.996z`,
        key: `kmsa83`,
      },
    ],
    [
      `circle`,
      {
        cx: `12`,
        cy: `12`,
        r: `10`,
        key: `1mglay`,
      },
    ],
  ],
  aliases: [`play-circle`],
};
V.node;
const H = i_2(V);
const U = {
  name: `shield-ban`,
  size: 24,
  node: [
    [
      `path`,
      {
        d: `M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z`,
        key: `oel41y`,
      },
    ],
    [
      `path`,
      {
        d: `m4.243 5.21 14.39 12.472`,
        key: `1c9a7c`,
      },
    ],
  ],
};
U.node;
const W = i_2(U);
const G = i(n(), 1);
const K = t();
const q = {
  open: `good`,
  closing: `warn`,
  closed: `muted`,
  suspended: `accent`,
};
function JComponent() {
  let { id } = K_1();
  let t = G_1();
  let n = r_2();
  let { index } = n_2();
  let { clock } = l({
    live: false,
  });
  let a = index?.symbol ?? `P`;
  let o = i_3((e) => s_1.venues(e), 6000);
  let u = t_2(() => s_1.config(), []);
  i_4([`venue.`, `settlement`, `offer.`], o.refresh, {
    throttleMs: 2000,
  });
  let [h, setH] = G.useState(null);
  let [S, setS] = G.useState(null);
  let T = o.data?.venues ?? [];
  let D = T.filter((e) => !e.house);
  let slashDefault = Number(u.data?.game?.venues?.default_slash_frac ?? 0.5);
  let j = u.data?.game?.venues?.trading_opens_at;
  let venue = id ? T.find((t) => t.venue === id) : undefined;
  return (
    <div>
      <X1
        eyebrow={`Game master`}
        title={`Venues`}
        subtitle={`Team-run markets: each posts a bond, charges capped fees and runs a broker agent. Suspending one stops its offers from settling at once.${j ? ` Team venues trade from ${j}.` : ``}`}
      />
      {o.error && <G1 error={o.error} onRetry={o.refresh} className={`mb-4`} />}
      <div className={`mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4`}>
        <B1
          label={`Team venues open`}
          value={D.filter((e) => e.status === `open`).length}
          unit={`/ ${D.length}`}
          icon=<A className={`size-4`} />
          tone={`gold`}
        />
        <B1
          label={`Volume`}
          value={T.reduce((acc, item) => acc + item.volume, 0)}
          format={(e) =>
            v_1(e, {
              symbol: a,
              compact: true,
            })
          }
          icon=<S1 className={`size-4`} />
          hint={`cash traded this round`}
        />
        <B1
          label={`Value created`}
          value={T.reduce((acc, item) => acc + item.value_created, 0)}
          format={(e) => y(e, 1)}
          icon=<_ className={`size-4`} />
          tone={`good`}
          hint={`private-value surplus of their trades`}
        />
        <B1
          label={`Bonds at stake`}
          value={D.reduce((acc, item) => acc + item.bond, 0)}
          format={(e) =>
            v_1(e, {
              symbol: a,
            })
          }
          icon=<M1 className={`size-4`} />
          hint={`still posted · default slash ${Math.round(slashDefault * 100)}%`}
        />
      </div>
      {o.loading && !o.data ? (
        <div className={`grid gap-4 lg:grid-cols-2`}>
          {Array.from(
            {
              length: 2,
            },
            (e, key) => (
              <L1 key={key} className={`h-72 rounded-2xl`} />
            ),
          )}
        </div>
      ) : T.length ? (
        <div className={`grid gap-4 lg:grid-cols-2 2xl:grid-cols-3`}>
          {T.map((v) => (
            <YComponent
              key={v.venue}
              v={v}
              sym={a}
              tick={clock?.tick}
              onOpen={() => t(`/admin/venues/${v.venue}`)}
              onSuspend={() => setH(v)}
              onReopen={() => setS(v)}
            />
          ))}
        </div>
      ) : (
        <C1 icon=<A className={`size-6`} /> title={`No venues`} />
      )}
      <QComponent
        venue={venue}
        vid={id ?? null}
        onClose={() => t(`/admin/venues`)}
      />
      <ZComponent
        venue={h}
        bond={h ? h.bond : null}
        slashDefault={slashDefault}
        onClose={() => setH(null)}
        onDone={(e, t) => {
          n.warn(
            `${t.name} suspended`,
            `${v_1(e.slashed, {
              symbol: a,
            })} of the bond slashed · ${v_1(e.bond_left, {
              symbol: a,
            })} left`,
          );
          o.refresh();
        }}
      />
      <I
        open={!!S}
        onClose={() => setS(null)}
        title={`Reopen ${S?.name ?? ``}?`}
        confirmLabel={`Reopen`}
        onConfirm={async () => {
          if (S) {
            await s_1.unsuspendVenue(S.venue);
            n.success(
              `${S.name} is open again`,
              `Its broker can match from the next tick. The slashed bond is not returned.`,
            );
            o.refresh();
          }
        }}
      >
        <p>{`The venue trades again from the next tick; offers cancelled by the suspension stay cancelled, and the slashed part of the bond is gone.`}</p>
      </I>
    </div>
  );
}
function YComponent({ v, sym, tick, onOpen, onSuspend, onReopen }) {
  let c = t_3();
  let l = v.rules.mechanism ?? (v.house ? `posted offers` : `board`);
  return (
    <div
      className={r(
        `relative flex flex-col overflow-hidden rounded-[var(--radius-card)] border bg-panel shadow-[var(--shadow-panel)]`,
        v.status === `suspended`
          ? `border-accent/40`
          : v.house
            ? `border-gold/30`
            : `border-line`,
      )}
    >
      {v.status === `suspended` && (
        <div className={`absolute inset-x-0 top-0 h-1 bg-accent`} aria-hidden />
      )}
      <div className={`flex items-start gap-3 px-5 pt-4`}>
        <span
          className={r(
            `grid size-10 shrink-0 place-items-center rounded-xl`,
            v.house ? `bg-gold/15 text-gold` : `bg-raised text-good`,
          )}
        >
          {v.house ? <M1 className={`size-5`} /> : <A className={`size-5`} />}
        </span>
        <div className={`min-w-0 flex-1`}>
          <div className={`flex flex-wrap items-center gap-2`}>
            <h3 className={`truncate text-2xl text-ink`}>{v.name}</h3>
            <N
              tone={q[v.status] ?? `muted`}
              dot
              live={v.status === `open` && v.trades > 0}
            >
              {v.status}
            </N>
            <N tone={`neutral`}>{l}</N>
            {v.starter && <N tone={`muted`}>{`starter stall`}</N>}
          </div>
          <div className={`mt-0.5 text-xs text-muted`}>
            {v.house ? (
              `the house market`
            ) : (
              <>
                {`run by`}
                {` `}
                <H_1
                  to={`/admin/teams/${v.owner}`}
                  className={`font-semibold text-info hover:underline`}
                >
                  {v.owner_name || c.name(v.owner)}
                </H_1>
                {` `}
                {`· `}
                <span className={`font-mono`}>{v.venue}</span>
                {` · since T`}
                {v.opened_tick}
              </>
            )}
          </div>
        </div>
        <div className={`text-right`}>
          <div className={`font-display-num text-2xl text-ink`}>
            {p(v.fee_bps)}
          </div>
          <div className={`text-[10px] text-faint`}>
            {v.fee_per_card
              ? `+ ${v_1(v.fee_per_card, {
                  symbol: sym,
                })}/card`
              : `no card fee`}
          </div>
        </div>
      </div>
      {v.pending_fee && (
        <div
          className={`mx-5 mt-3 rounded-lg border border-info/35 bg-info/10 px-3 py-1.5 text-xs text-info`}
        >
          {`fee changes to `}
          {p(v.pending_fee.fee_bps)}
          {v.pending_fee.fee_per_card
            ? ` + ${v_1(v.pending_fee.fee_per_card, {
                symbol: sym,
              })}/card`
            : ``}
          {` at T`}
          {v.pending_fee.effective_tick}
          {tick === undefined
            ? ``
            : ` (in ${Math.max(0, v.pending_fee.effective_tick - tick)} ticks)`}
        </div>
      )}
      {v.status === `suspended` && v.suspension_reason && (
        <div
          className={`mx-5 mt-3 flex items-start gap-2 rounded-lg border border-accent/35 bg-accent/10 px-3 py-1.5 text-xs text-accent`}
        >
          <H1 className={`mt-0.5 size-3.5 shrink-0`} />
          {` `}
          {v.suspension_reason}
        </div>
      )}
      <div className={`mt-4 grid grid-cols-3 gap-2 px-5 sm:grid-cols-6`}>
        <XComponent label={`trades`} value={y(v.trades)} />
        <XComponent
          label={`volume`}
          value={v_1(v.volume, {
            symbol: sym,
            compact: true,
          })}
        />
        <XComponent
          label={`value`}
          value={y(v.value_created, 1)}
          tone={`good`}
        />
        <XComponent label={`traders`} value={y(v.traders)} />
        <XComponent label={`pairs`} value={y(v.pairs)} />
        <XComponent
          label={`fees`}
          value={v_1(v.fees, {
            symbol: sym,
          })}
          tone={`gold`}
        />
      </div>
      <div
        className={`mt-3 flex flex-wrap items-center gap-1.5 px-5 text-[11px]`}
      >
        {v.rules.min_level ? (
          <N tone={`muted`}>
            {`level ≥ `}
            {v.rules.min_level}
          </N>
        ) : null}
        {v.rules.rarities?.map((e) => (
          <N key={e} tone={e}>
            {e}
          </N>
        ))}
        {v.rules.sets?.map((e) => (
          <N key={e} tone={`neutral`}>
            {e}
          </N>
        ))}
        {!v.house && (
          <span
            className={`ml-auto inline-flex items-center gap-1 text-muted`}
            title={
              v.starter
                ? `a starter stall posts no bond`
                : v.status === `closed`
                  ? `refunded when the venue closed`
                  : `still posted: the opening bond minus any slash`
            }
          >
            <M1 className={`size-3`} />
            {` bond `}
            {v_1(v.bond, {
              symbol: sym,
            })}
            {v.starter ? (
              <span className={`text-faint`}>{`(starter)`}</span>
            ) : v.status === `closed` ? (
              <span className={`text-faint`}>{`(refunded)`}</span>
            ) : null}
          </span>
        )}
      </div>
      {v.description && (
        <p className={`mt-2 px-5 text-xs italic text-faint`}>
          {`“`}
          {v.description}
          {`”`}
        </p>
      )}
      <div
        className={`mt-auto flex flex-wrap gap-2 border-t border-line px-5 py-3 pt-3`}
      >
        <A1
          size={`sm`}
          variant={`secondary`}
          icon=<B_1 className={`size-3.5`} />
          onClick={onOpen}
        >{`Board and history`}</A1>
        {!v.house && v.status === `open` && (
          <A1
            size={`sm`}
            variant={`danger`}
            icon=<W className={`size-3.5`} />
            onClick={onSuspend}
          >{`Suspend`}</A1>
        )}
        {!v.house && v.status === `suspended` && (
          <A1
            size={`sm`}
            variant={`primary`}
            icon=<H className={`size-3.5`} />
            onClick={onReopen}
          >{`Reopen`}</A1>
        )}
      </div>
    </div>
  );
}
function XComponent({ label, value, tone }) {
  return (
    <div className={`rounded-lg bg-base/60 px-2 py-1.5 text-center`}>
      <div
        className={r(
          `font-display-num text-lg`,
          tone === `good`
            ? `text-good`
            : tone === `gold`
              ? `text-gold`
              : `text-ink`,
        )}
      >
        {value}
      </div>
      <div
        className={`text-[9px] font-bold uppercase tracking-wider text-faint`}
      >
        {label}
      </div>
    </div>
  );
}
function ZComponent({ venue, bond, slashDefault, onClose, onDone }) {
  let { index } = n_2();
  let symbol = index?.symbol ?? `P`;
  let [s, setS] = G.useState(``);
  let [l, setL] = G.useState(Math.round(slashDefault * 100));
  let [d, setD] = G.useState(null);
  if (venue && d !== venue.venue) {
    setD(venue.venue);
    setS(``);
    setL(Math.round(slashDefault * 100));
  }
  return (
    <I
      open={!!venue}
      onClose={onClose}
      size={`md`}
      title={`Suspend ${venue?.name ?? ``}?`}
      confirmLabel={`Suspend and slash`}
      tone={`danger`}
      disabled={!s.trim()}
      onConfirm={async () => {
        if (venue) {
          onDone(await s_1.suspendVenue(venue.venue, s.trim(), l / 100), venue);
        }
      }}
    >
      <p>{`Its open and queued offers are cancelled and nothing settles there until you reopen it. The owner sees the reason on the feed.`}</p>
      <R label={`Reason (public)`}>
        <Z1
          value={s}
          onChange={setS}
          placeholder={`wash trading between Demo 2 and Demo 4`}
          autoFocus
        />
      </R>
      <S
        label={`Slash of the bond`}
        value={l}
        onChange={setL}
        min={0}
        max={100}
        step={5}
        marks={[0, 25, 50, 75, 100]}
        format={(e) => `${e}%`}
        color={`var(--color-accent)`}
      />
      <p className={`text-xs`}>
        {bond ? (
          <>
            {`Slashes `}
            <b className={`text-accent`}>
              {v_1(Math.round((bond * l) / 100), {
                symbol,
              })}
            </b>
            {` of the `}
            <b className={`text-ink`}>
              {v_1(bond, {
                symbol,
              })}
            </b>
            {` bond still posted.`}
          </>
        ) : (
          `No bond is posted here (a starter stall, or slashed already): suspending stops its trading and slashes nothing.`
        )}
      </p>
    </I>
  );
}
function QComponent({ venue, vid, onClose }) {
  let r = t_3();
  let { clock } = l({
    live: false,
  });
  let a = i_3(
    (e) => {
      if (vid) {
        return c_1.venueOffers(vid, e);
      }
      return Promise.resolve({
        offers: [],
      });
    },
    5000,
    [vid],
    {
      enabled: !!vid,
    },
  );
  let s = t_2(
    (e) => {
      if (vid) {
        return s_1.events(
          {
            contains: `"venue": "${vid}"`,
            limit: 120,
          },
          e,
        );
      }
      return Promise.resolve({
        events: [],
      });
    },
    [vid],
    {
      enabled: !!vid,
    },
  );
  i_4(
    [`offer.`, `settlement`, `venue.`],
    () => {
      a.refresh();
      s.refresh();
    },
    {
      enabled: !!vid,
      throttleMs: 1500,
    },
  );
  let c = (s.data?.events ?? []).filter(
    (e) => e.type !== `thread.message` || e.scope === `admin`,
  );
  return (
    <K1
      open={!!vid}
      onClose={onClose}
      width={`min(720px, 100vw)`}
      title={venue?.name ?? vid ?? ``}
      description={
        venue
          ? `${venue.house ? `the house market` : `run by ${venue.owner_name}`} · ${venue.status}`
          : undefined
      }
    >
      <section>
        <h4 className={`eyebrow mb-2 flex items-center gap-1.5`}>
          <B_1 className={`size-3.5`} />
          {` The board · `}
          {a.data?.offers.length ?? 0}
          {` open offers`}
        </h4>
        {a.error ? <G1 error={a.error} /> : null}
        {a.data?.offers.length ? (
          <div className={`flex flex-col gap-1.5`}>
            {a.data.offers.map((offer) => (
              <B key={offer.id} offer={offer} name={r.name} />
            ))}
          </div>
        ) : (
          <p className={`text-sm text-faint`}>{`No resting offers.`}</p>
        )}
      </section>
      <section className={`mt-6`}>
        <h4 className={`eyebrow mb-2 flex items-center gap-1.5`}>
          <D className={`size-3.5`} />
          {` History`}
        </h4>
        {s.error ? <G1 error={s.error} /> : null}
        {c.length ? (
          <div className={`flex flex-col`}>
            {c.map((event) => (
              <O1
                key={event.id}
                event={event}
                admin
                nowHours={clock?.t_hours}
                compact
              />
            ))}
          </div>
        ) : (
          <p className={`text-sm text-faint`}>{`Nothing yet.`}</p>
        )}
      </section>
    </K1>
  );
}
export { JComponent as default };
