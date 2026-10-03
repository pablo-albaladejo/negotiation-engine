import { i, n, t } from "./jsx-runtime.js";
import { i as i_1, n as I1, t as A1, u as u_1 } from "./Cromo.js";
import { i as i_2, r as r_1 } from "./Button.js";
import { t as L1 } from "./award.js";
import { c as clock, o as announce } from "./EventLine.js";
import { t as t_2 } from "./flag.js";
import { t as t_3 } from "./gift.js";
import { t as M1 } from "./EmptyState.js";
import {
  E,
  T as T_1,
  a as _,
  c,
  i as i_3,
  k,
  n as n_2,
  r as r_2,
  t as t_4,
  v,
} from "./useEvents.js";
import { t as T } from "./landmark.js";
import { t as t_5 } from "./lock-open.js";
import { t as D } from "./lock.js";
import { n as n_3, r as K1, t as A } from "./LiveFeed.js";
import { t as Ee1 } from "./ErrorNote.js";
import { t as J1 } from "./snowflake.js";
import { n as n_4, r as Te1, t as t_6 } from "./useFit.js";
import { t as t_7 } from "./sun.js";
import { t as Ne1 } from "./x.js";
import { n as n_5, t as t_8 } from "./catalog.js";
import { t as t_9 } from "./names.js";
import { t as Ie1 } from "./LevelBadge.js";
import { t as Ae1 } from "./PersonaAvatar.js";
import {
  A as A_1,
  C,
  D as D_1,
  E as E_2,
  H,
  I as set_release,
  M as bench,
  N,
  O,
  P,
  S,
  X as X_1,
  Y as Y_1,
  d as Pe1,
  h,
  j as persona,
  k as duels,
  l as l_1,
  m,
  n as Ge1,
  p as p_1,
  q,
  s as K,
  t as Ye1,
  v as v_2,
  y as y_1,
} from "./index.js";
import { a, n as n_6, r as r_3, t as We1 } from "./Pesetas.js";
const J = {
  name: `crown`,
  size: 24,
  node: [
    [
      `path`,
      {
        d: `M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z`,
        key: `1vdc57`,
      },
    ],
    [
      `path`,
      {
        d: `M5 21h14`,
        key: `11awu3`,
      },
    ],
  ],
};
J.node;
const Te = i_2(J);
const Ee = {
  name: `maximize`,
  size: 24,
  node: [
    [
      `path`,
      {
        d: `M8 3H5a2 2 0 0 0-2 2v3`,
        key: `1dcmit`,
      },
    ],
    [
      `path`,
      {
        d: `M21 8V5a2 2 0 0 0-2-2h-3`,
        key: `1e4gt3`,
      },
    ],
    [
      `path`,
      {
        d: `M3 16v3a2 2 0 0 0 2 2h3`,
        key: `wsl5sc`,
      },
    ],
    [
      `path`,
      {
        d: `M16 21h3a2 2 0 0 0 2-2v-3`,
        key: `18trek`,
      },
    ],
  ],
};
Ee.node;
const De = i_2(Ee);
const Oe = {
  name: `minimize`,
  size: 24,
  node: [
    [
      `path`,
      {
        d: `M8 3v3a2 2 0 0 1-2 2H3`,
        key: `hohbtr`,
      },
    ],
    [
      `path`,
      {
        d: `M21 8h-3a2 2 0 0 1-2-2V3`,
        key: `5jw1f3`,
      },
    ],
    [
      `path`,
      {
        d: `M3 16h3a2 2 0 0 1 2 2v3`,
        key: `198tvr`,
      },
    ],
    [
      `path`,
      {
        d: `M16 21v-3a2 2 0 0 1 2-2h3`,
        key: `ph8mxp`,
      },
    ],
  ],
};
Oe.node;
const Ke1 = i_2(Oe);
const Ae = {
  name: `moon`,
  size: 24,
  node: [
    [
      `path`,
      {
        d: `M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401`,
        key: `kfwtm`,
      },
    ],
  ],
};
Ae.node;
const Y = i_2(Ae);
const X = i(n(), 1);
const Z = t();
const je = {
  announce,
  bench,
  duels,
  grant_all: t_3,
  persona_opens: t_5,
  set_release,
  persona,
  round: t_2,
  pause: Y,
  resume: t_7,
  day_closes: Y,
  day_opens: t_7,
  clock,
};
const Me = {
  bench: `The Market Test`,
  duels: `Duels`,
  grant_all: `A gift for everyone`,
  round: `New round`,
  pause: `Pause`,
  resume: `Back open`,
  announce: `Announcement`,
  persona: `Dealer change`,
  clock: `Clock change`,
};
const Ne = (e) => e.charAt(0).toUpperCase() + e.slice(1);
function Pe(e, name) {
  let e_params = e.params;
  let detail = (e.note ?? ``).trim();
  if (e.action === `persona_opens`) {
    return {
      title: `${name(String(e_params.persona))} opens to all`,
      detail: ``,
    };
  }
  if (e.action === `set_release`) {
    return {
      title: detail || `New set`,
      detail: ``,
    };
  }
  if (e.action === `day_closes`) {
    return {
      title: `We close`,
      detail,
    };
  }
  if (e.action === `day_opens`) {
    return {
      title: detail || `We open`,
      detail: e_params.tick_seconds
        ? `one tick every ${e_params.tick_seconds} s`
        : ``,
    };
  }
  let i = detail.indexOf(`:`);
  if (i > 0) {
    return {
      title: detail.slice(0, i).trim(),
      detail: detail.slice(i + 1).trim(),
    };
  }
  return {
    title: Me[e.action] ?? Ne(e.action.replace(/_/g, ` `)),
    detail,
  };
}
function FeComponent({ items, nowHours, max = 3, fit = false, className }) {
  let { name } = t_9();
  let oRef = X.useRef(null);
  let s = t_6(oRef, {
    rowPx: 46,
    gapPx: 6,
    max,
    active: n_4(1024) && fit && !!items?.length,
  });
  let l = (items ?? [])
    .filter(
      (e) =>
        e.action !== `announce` &&
        (nowHours === null || e.at_hours > nowHours - 0.000001),
    )
    .slice(0, s);
  return (
    <section
      className={r_1(
        `flex min-h-0 min-w-0 flex-col rounded-[20px] border border-line/80 bg-panel/60 p-4 shadow-[var(--shadow-panel)] backdrop-blur-sm`,
        className,
      )}
    >
      <header className={`mb-2 flex items-center gap-2.5 px-1`}>
        <clock className={`size-5 text-gold`} aria-hidden />
        <h2 className={`text-[22px] text-ink`}>{`Coming up`}</h2>
      </header>
      {items ? (
        l.length === 0 ? (
          <div
            className={`grid flex-1 place-items-center text-sm text-muted`}
          >{`Nothing scheduled — the organisers pull levers by hand.`}</div>
        ) : (
          <ol
            ref={oRef}
            className={`flex min-h-0 flex-1 flex-col gap-1.5 overflow-hidden`}
          >
            {l.map((e, n) => {
              let r = je[e.action] ?? clock;
              let i = nowHours === null ? null : e.at_hours - nowHours;
              let { title, detail } = Pe(e, name);
              return (
                <li
                  key={`${e.action}-${e.at_hours}-${n}`}
                  className={r_1(
                    `flex shrink-0 items-start gap-2.5 rounded-lg border px-2.5 py-1.5`,
                    n === 0
                      ? `border-gold/35 bg-gold/[0.07]`
                      : `border-line/70 bg-base/40`,
                  )}
                >
                  {Z.jsx(r, {
                    className: r_1(
                      `mt-0.5 size-4 shrink-0`,
                      n === 0 ? `text-gold` : `text-muted`,
                    ),
                    "aria-hidden": true,
                  })}
                  <div className={`min-w-0 flex-1`}>
                    <div
                      className={`truncate text-[14px] leading-tight font-bold text-ink`}
                    >
                      {title}
                    </div>
                    {detail && (
                      <div className={`line-clamp-1 text-[11px] text-muted`}>
                        {detail}
                      </div>
                    )}
                  </div>
                  <span
                    className={r_1(
                      `shrink-0 font-mono text-[13px] font-bold whitespace-nowrap`,
                      n === 0 ? `text-gold` : `text-muted`,
                    )}
                  >
                    {e.action === `day_opens` && e.wall
                      ? new Date(e.wall).toLocaleString(`en-GB`, {
                          weekday: `short`,
                          hour: `2-digit`,
                          minute: `2-digit`,
                          timeZone: `Europe/Madrid`,
                        })
                      : i === null
                        ? ``
                        : i <= 0
                          ? `now`
                          : `in ${h(i)}`}
                  </span>
                </li>
              );
            })}
          </ol>
        )
      ) : (
        <_ lines={3} />
      )}
    </section>
  );
}
const types = [`duels.scheduled`, `duel.closed`, `duels.finished`];
const Le = 2000;
function Re(e, t) {
  let t_payload = t.payload;
  if (typeof t_payload.session != `number`) {
    return e;
  }
  let r = new Map(e);
  let i = r.get(t_payload.session);
  if (t.type === `duels.scheduled`) {
    r.set(t_payload.session, {
      session: t_payload.session,
      name: String(t_payload.name ?? `Duels`),
      total: Number(t_payload.duels ?? 0),
      decided: i?.decided ?? new Set(),
      finished: i?.finished ?? false,
    });
  } else if (
    t.type === `duel.closed` &&
    i &&
    typeof t_payload.duel == `number` &&
    !i.decided.has(t_payload.duel)
  ) {
    r.set(t_payload.session, {
      ...i,
      decided: new Set(i.decided).add(t_payload.duel),
    });
  } else if (t.type === `duels.finished` && i) {
    r.set(t_payload.session, {
      ...i,
      finished: true,
    });
  } else {
    return e;
  }
  return r;
}
function useZe() {
  let [e, setE] = X.useState(new Map());
  X.useEffect(() => {
    let e = new AbortController();
    c.feed(Le, e.signal)
      .then((e) =>
        setE((t) =>
          e.events.filter((e) => types.includes(e.type)).reduce(Re, t),
        ),
      )
      .catch(() => undefined);
    return () => e.abort();
  }, []);
  n_2((e) => setE((t) => Re(t, e)), {
    scope: `public`,
    types,
  });
  return X.useMemo(
    () =>
      [...e.values()]
        .filter((e) => !e.finished && e.total > 0)
        .sort((e, t) => t.session - e.session)
        .map((e) => ({
          session: e.session,
          name: e.name,
          total: e.total,
          decided: Math.min(e.total, e.decided.size),
        })),
    [e],
  );
}
function BeComponent({ className }) {
  let t = useZe().slice(0, 2);
  if (t.length) {
    return (
      <div className={r_1(`flex flex-wrap items-center gap-2`, className)}>
        {t.map((e) => (
          <span
            key={e.session}
            className={`relative inline-flex items-center gap-2 overflow-hidden rounded-full border border-gold/40 bg-gold/10 py-1 pl-2.5 pr-3 text-[13px] font-semibold whitespace-nowrap text-ink`}
            role={`status`}
          >
            <duels className={`size-3.5 text-gold`} aria-hidden />
            <span className={`max-w-[18ch] truncate`}>{e.name}</span>
            <span className={`text-muted`}>{`·`}</span>
            <span className={`font-mono text-gold`}>
              {e.decided}
              {` of `}
              {e.total}
            </span>
            <span className={`text-muted`}>{`decided`}</span>
            <span
              className={`absolute inset-x-0 bottom-0 h-0.5 bg-gold/15`}
              aria-hidden
            >
              <span
                className={`block h-full bg-gold`}
                style={{
                  width: `${(e.decided / Math.max(1, e.total)) * 100}%`,
                }}
              />
            </span>
          </span>
        ))}
      </div>
    );
  }
  return null;
}
const Ve = `var(--color-gold)`;
const He = `#4C8DFF`;
const Q = {
  xl: {
    font: 19,
    two: true,
  },
  lg: {
    font: 16,
    two: true,
  },
  md: {
    font: 14,
    two: false,
  },
  sm: {
    font: 13,
    two: false,
  },
};
const Ue = [`text-gold`, `text-[#D7DEEA]`, `text-[#E3A06B]`];
function WeComponent({ row, weights, relMax, thin }) {
  let i = weights
    ? weights.negotiating + weights.market
    : Math.max(relMax, 1e-9);
  let a = (e) => `${Math.max(0, Math.min(100, (e / i) * 100))}%`;
  return (
    <div
      className={r_1(
        `relative flex w-full overflow-hidden rounded-full bg-base/80 ring-1 ring-line`,
        thin ? `h-[0.45em]` : `h-[0.62em]`,
      )}
      role={`img`}
      aria-label={`negotiating ${y_1(row.negotiating, 1)}, market-making ${y_1(row.market, 1)}${weights ? ` of ${y_1(i)}` : ``}`}
    >
      {weights && (
        <span
          className={`pointer-events-none absolute inset-y-0 w-px bg-line-strong`}
          style={{
            left: a(weights.negotiating),
          }}
          aria-hidden
        />
      )}
      <Y_1.span
        className={`h-full`}
        style={{
          background: `linear-gradient(90deg, #d69b2a, ${Ve})`,
        }}
        initial={false}
        animate={{
          width: a(row.negotiating),
        }}
        transition={{
          type: `spring`,
          stiffness: 120,
          damping: 22,
        }}
      />
      <Y_1.span
        className={`h-full`}
        style={{
          background: `linear-gradient(90deg, #3569c9, ${He})`,
        }}
        initial={false}
        animate={{
          width: a(row.market),
        }}
        transition={{
          type: `spring`,
          stiffness: 120,
          damping: 22,
        }}
      />
    </div>
  );
}
function GeComponent({ luck, scale }) {
  let n = Math.max(-1, Math.min(1, luck / Math.max(scale, 1)));
  let r = n >= 0;
  return (
    <div
      className={`flex flex-col items-end gap-[0.3em]`}
      title={`luck ${C(luck, 0)} P of book value from packs — shown, not scored`}
    >
      <span
        className={r_1(
          `font-mono text-[0.86em] font-bold whitespace-nowrap`,
          luck > 0.5 ? `text-good` : luck < -0.5 ? `text-accent` : `text-muted`,
        )}
      >
        {`luck `}
        {C(Math.round(luck))}
      </span>
      <span
        className={`relative block h-[0.34em] w-[5.2em] overflow-hidden rounded-full bg-base/80 ring-1 ring-line`}
        aria-hidden
      >
        <span className={`absolute inset-y-0 left-1/2 w-px bg-line-strong`} />
        <span
          className={r_1(
            `absolute inset-y-0 rounded-full`,
            r ? `bg-good` : `bg-accent`,
          )}
          style={
            r
              ? {
                  left: `50%`,
                  width: `${n * 50}%`,
                }
              : {
                  right: `50%`,
                  width: `${-n * 50}%`,
                }
          }
        />
      </span>
    </div>
  );
}
function KeComponent({ card, showName = true, cardEm }) {
  let { index } = n_5();
  if (!card) {
    return <span className={`text-[0.8em] text-faint`}>{`—`}</span>;
  }
  let color = index?.rarityColor(card.rarity) ?? v[card.rarity];
  return (
    <span
      className={`flex min-w-0 items-center gap-[0.55em]`}
      title={`${card.name} ${S(card.serial, card.print_run)}`}
    >
      <A1
        {...i_1(card.ref, index, {
          serial: card.serial,
          printRun: card.print_run,
        })}
        size={`sm`}
        tilt={false}
        style={{
          fontSize: cardEm,
        }}
      />
      {showName && (
        <span className={`lb-rarest-name min-w-0 leading-tight`}>
          <span
            className={`block truncate text-[0.86em] font-semibold text-ink`}
          >
            {card.name}
          </span>
          <span
            className={`block font-mono text-[0.76em] font-bold`}
            style={{
              color,
            }}
          >
            {S(card.serial, card.print_run)}
          </span>
        </span>
      )}
    </span>
  );
}
function qe(adjustments) {
  let t = [];
  for (let n of adjustments) {
    let e = t.find(
      (e) =>
        e.reason === n.reason &&
        (n.pct
          ? e.pct === n.pct
          : !e.pct && Math.sign(e.points) === Math.sign(n.points)),
    );
    if (e) {
      e.count += 1;
      if (!n.pct) {
        e.points += n.points;
      }
    } else {
      t.push({
        ...n,
        count: 1,
      });
    }
  }
  return t;
}
function JeComponent({ a, withReason }) {
  let n = a.points < 0 || !!a.pct;
  return (
    <span
      className={r_1(
        `inline-flex h-[1.55em] items-center gap-1 rounded-full border px-[0.55em] text-[0.7em] font-bold whitespace-nowrap`,
        n
          ? `border-accent/45 bg-accent/12 text-accent`
          : `border-good/40 bg-good/12 text-good`,
      )}
      title={`${a.reason || (n ? `penalty` : `reward`)}${a.pct ? ` · −${y_1(a.pct)}% of the round score` : ` · ${C(a.points, 1)} points`}`}
    >
      {a.pct ? `−${y_1(a.pct)}%` : `${C(a.points, 1)} pts`}
      {withReason && a.reason && (
        <span className={`max-w-[10em] truncate font-semibold opacity-80`}>
          {a.reason}
        </span>
      )}
    </span>
  );
}
function YeComponent({
  row,
  density,
  weights,
  relMax,
  luckScale,
  delta,
  flash,
}) {
  let s = Q[density];
  let u = s.two ? 3 : +(density === `md`);
  let d = row.rank === 1 && row.score > 0;
  let f = weights ? weights.negotiating + weights.market : null;
  let p = row.album_slots ? row.album_filled / row.album_slots : 0;
  let m = (
    <>
      <Ie1 level={row.level} size={s.two ? `md` : `sm`} />
      {row.badges.slice(0, u).map((e) => (
        <span
          key={e}
          className={`inline-flex h-[1.55em] items-center gap-1 rounded-full border border-gold/35 bg-gold/10 px-[0.55em] text-[0.7em] font-bold whitespace-nowrap text-gold`}
        >
          <L1 className={`size-[1.1em]`} aria-hidden />
          {e}
        </span>
      ))}
      {row.badges.length > u && (
        <span className={`text-[0.72em] font-bold text-gold/80`}>
          {`+`}
          {row.badges.length - u}
        </span>
      )}
      {qe(row.adjustments)
        .slice(-2)
        .map((a, t) => (
          <JeComponent key={t} a={a} withReason={s.two} />
        ))}
      {row.frozen && (
        <span
          className={`inline-flex h-[1.55em] items-center gap-1 rounded-full border border-info/40 bg-info/12 px-[0.55em] text-[0.7em] font-bold text-info`}
        >
          <J1 className={`size-[1.1em]`} aria-hidden />
          {` frozen`}
        </span>
      )}
    </>
  );
  return (
    <div
      className={r_1(
        `lb-grid h-full rounded-[0.8em] border border-line/80 bg-panel/85 px-[0.8em]`,
        d && `lb-row--leader`,
        row.frozen && `opacity-60`,
      )}
    >
      <div className={`flex flex-col items-center justify-center leading-none`}>
        <span
          className={r_1(
            `font-display font-black`,
            Ue[row.rank - 1] ?? `text-muted`,
          )}
          style={{
            fontSize: s.two ? `2.1em` : `1.7em`,
          }}
        >
          {row.rank}
        </span>
        <X_1>
          {delta !== 0 && (
            <Y_1.span
              key={delta}
              initial={{
                opacity: 0,
                y: delta > 0 ? 6 : -6,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
              }}
              className={r_1(
                `mt-[0.15em] font-mono text-[0.68em] font-bold`,
                delta > 0 ? `text-good` : `text-accent`,
              )}
            >
              {delta > 0 ? `▲${delta}` : `▼${-delta}`}
            </Y_1.span>
          )}
        </X_1>
      </div>
      <div className={`min-w-0`}>
        <div className={`flex min-w-0 items-center gap-[0.5em]`}>
          {d && (
            <Te
              className={`size-[1.1em] shrink-0 text-gold`}
              aria-label={`leader`}
            />
          )}
          <span
            className={r_1(
              `truncate font-display font-extrabold tracking-wide text-ink`,
              s.two ? `text-[1.42em]` : `text-[1.28em]`,
            )}
          >
            {row.name}
          </span>
          {!s.two && (
            <span className={`flex shrink-0 items-center gap-[0.4em]`}>
              {m}
            </span>
          )}
        </div>
        {s.two && (
          <div
            className={`mt-[0.35em] flex min-w-0 flex-wrap items-center gap-[0.4em] overflow-hidden`}
            style={{
              maxHeight: `1.75em`,
            }}
          >
            {m}
          </div>
        )}
      </div>
      <div className={`min-w-0`}>
        <div className={`flex items-baseline gap-[0.5em] whitespace-nowrap`}>
          <span
            key={flash ? `f${row.score}` : `s`}
            className={r_1(`leading-none text-gold`, flash && `lb-flash`)}
            style={{
              fontSize: s.two ? `1.95em` : `1.5em`,
            }}
          >
            <K value={row.score} format={(e) => y_1(e, 1)} />
          </span>
          {f !== null && (
            <span className={`text-[0.78em] font-semibold text-faint`}>
              {`/ `}
              {y_1(f)}
            </span>
          )}
          {s.two && (
            <span
              className={`lb-comp ml-auto flex gap-[0.7em] font-mono text-[0.74em] font-semibold whitespace-nowrap`}
            >
              <span
                style={{
                  color: `var(--color-gold)`,
                }}
              >
                {`N `}
                {y_1(row.negotiating, 1)}
              </span>
              <span
                style={{
                  color: `#4C8DFF`,
                }}
              >
                {`M `}
                {y_1(row.market, 1)}
              </span>
            </span>
          )}
        </div>
        <div
          className={
            s.two
              ? `mt-[0.45em]`
              : density === `sm`
                ? `mt-[0.2em]`
                : `mt-[0.3em]`
          }
        >
          <WeComponent
            row={row}
            weights={weights}
            relMax={relMax}
            thin={!s.two}
          />
        </div>
      </div>
      <div className={`lb-album min-w-0`}>
        <div className={`flex items-baseline justify-between gap-1`}>
          <K
            value={`${row.album_filled}/${row.album_slots}`}
            weight={700}
            className={`text-[1.08em] text-ink`}
          />
          {row.pages_complete > 0 && (
            <span
              className={`inline-flex items-center gap-0.5 text-[0.78em] font-bold text-gold`}
              title={`${row.pages_complete} complete page${row.pages_complete === 1 ? `` : `s`}`}
            >
              <Te1 className={`size-[1em] fill-current`} aria-hidden />
              {row.pages_complete}
            </span>
          )}
        </div>
        <div
          className={r_1(
            `mt-[0.35em] h-[0.34em] overflow-hidden rounded-full bg-base/80 ring-1 ring-line`,
            density === `sm` && `hidden`,
          )}
        >
          <Y_1.div
            className={`h-full rounded-full bg-good`}
            initial={false}
            animate={{
              width: `${p * 100}%`,
            }}
            transition={{
              duration: 0.8,
            }}
          />
        </div>
      </div>
      <div className={`lb-rarest min-w-0`}>
        <KeComponent
          card={row.rarest}
          cardEm={s.two ? 2.6 : density === `sm` ? 1.45 : 1.9}
        />
      </div>
      <div className={`lb-luck`}>
        <GeComponent luck={row.luck} scale={luckScale} />
      </div>
    </div>
  );
}
function XeComponent({
  board,
  loading,
  error,
  onRetry,
  fit = true,
  className,
}) {
  let { clock, nextTickIn } = l_1();
  let l = n_4(1024);
  let u = fit && l;
  let d = board?.teams ?? [];
  let d_length = d.length;
  let weights = n_6(board);
  let relMax = Math.max(...d.map((e) => e.score), 1e-9);
  let luckScale = Math.max(40, ...d.map((e) => Math.abs(e.luck)));
  let vRef = X.useRef(null);
  let [y, setY] = X.useState(new Map());
  let [x, setX] = X.useState(new Set());
  let snap = board?.snapshot_tick ?? board?.tick;
  X.useEffect(() => {
    if (!board) {
      return;
    }
    let ranks = new Map(board.teams.map((e) => [e.team, e.rank]));
    let scores = new Map(board.teams.map((e) => [e.team, e.score]));
    let vRef_current = vRef.current;
    if (vRef_current && vRef_current.snap !== snap) {
      let t = new Map();
      let n = new Set();
      for (let i of board.teams) {
        let e = vRef_current.ranks.get(i.team);
        if (e !== undefined && e !== i.rank) {
          t.set(i.team, e - i.rank);
        }
        let a = vRef_current.scores.get(i.team);
        if (a !== undefined && i.score > a + 0.05) {
          n.add(i.team);
        }
      }
      setY(t);
      setX(n);
    }
    if (!vRef_current || vRef_current.snap !== snap) {
      vRef.current = {
        snap,
        ranks,
        scores,
      };
    }
  }, [board, snap]);
  let wRef = X.useRef(null);
  let [T, setT] = X.useState(66);
  let D = d_length > 10;
  let gap = D ? 3 : 6;
  X.useLayoutEffect(() => {
    let wRef_current = wRef.current;
    if (!wRef_current || !u) {
      setT(66);
      return;
    }
    let t = () => {
      let wRef_current_clientHeight = wRef_current.clientHeight;
      if (wRef_current_clientHeight > 0 && d_length > 0) {
        setT(
          Math.max(
            32,
            Math.min(
              104,
              (wRef_current_clientHeight - gap * (d_length - 1)) / d_length,
            ),
          ),
        );
      }
    };
    t();
    let n = new ResizeObserver(t);
    n.observe(wRef_current);
    return () => n.disconnect();
  }, [d_length, u]);
  let k = T >= 84 ? `xl` : T >= 58 ? `lg` : T >= 42 ? `md` : `sm`;
  let fontSize = u ? Math.max(13, Math.min(Q[k].font, T * 0.23)) : Q.lg.font;
  let j = null;
  if (
    board?.next_refresh_tick !== undefined &&
    clock &&
    !clock.paused &&
    nextTickIn !== null
  ) {
    j = Math.max(
      0,
      (board.next_refresh_tick - clock.tick - 1) * clock.tick_seconds +
        nextTickIn,
    );
  }
  return (
    <section
      className={r_1(
        `lb flex min-h-0 min-w-0 flex-col rounded-[20px] border border-line/80 bg-panel/60 p-4 shadow-[var(--shadow-panel)] backdrop-blur-sm`,
        className,
      )}
    >
      <header
        className={r_1(
          `flex flex-wrap items-end justify-between gap-x-6 gap-y-2 px-1`,
          D && u ? `mb-1.5` : `mb-3`,
        )}
      >
        <div className={`flex items-center gap-3`}>
          <span
            className={r_1(
              `grid place-items-center rounded-xl bg-gold/12 text-gold ring-1 ring-gold/30`,
              D && u ? `size-8` : `size-10`,
            )}
          >
            <O className={`size-5`} aria-hidden />
          </span>
          <div className={`leading-none`}>
            {!(D && u) && <div className={`eyebrow`}>{`Standings`}</div>}
            <h2
              className={r_1(
                `text-ink`,
                D && u ? `text-[24px]` : `mt-1 text-[30px]`,
              )}
            >{`Leaderboard`}</h2>
          </div>
        </div>
        <div className={`flex flex-wrap items-center gap-x-5 gap-y-1 text-sm`}>
          <span className={`flex items-center gap-2 font-semibold text-muted`}>
            <span
              className={`size-3 rounded-sm`}
              style={{
                background: Ve,
              }}
              aria-hidden
            />
            {`Negotiating`}
            {weights ? ` ${y_1(weights.negotiating)}` : ``}
          </span>
          <span className={`flex items-center gap-2 font-semibold text-muted`}>
            <span
              className={`size-3 rounded-sm`}
              style={{
                background: He,
              }}
              aria-hidden
            />
            {`Market-making`}
            {weights ? ` ${y_1(weights.market)}` : ``}
          </span>
          {j !== null && (
            <span
              className={`rounded-full border border-line-strong bg-base/60 px-3 py-1 font-mono text-xs font-semibold text-muted`}
              title={`The public board is a snapshot; it refreshes every few ticks`}
            >
              {j > 0.5 ? (
                <>
                  {`next standings in `}
                  <span className={`text-ink`}>{m(j)}</span>
                </>
              ) : (
                `updating standings…`
              )}
            </span>
          )}
        </div>
      </header>
      {d_length > 0 && (
        <div
          className={`lb-grid mb-1.5 px-[0.8em] text-[11px] font-bold tracking-[0.14em] text-faint uppercase`}
          style={{
            fontSize: 11,
          }}
        >
          <span className={`text-center`}>{`#`}</span>
          <span>{`Team`}</span>
          <span>
            {`Score`}
            {weights ? ` / ${y_1(weights.negotiating + weights.market)}` : ``}
          </span>
          <span className={`lb-album`}>{`Album`}</span>
          <span className={`lb-rarest`}>{`Rarest card`}</span>
          <span className={`lb-luck text-right leading-tight`}>
            {`Luck`}
            <span
              className={`block text-[9px] tracking-[0.08em] normal-case`}
            >{`not scored`}</span>
          </span>
        </div>
      )}
      {error && !board && (
        <Ee1 error={error} onRetry={onRetry} className={`mb-3`} />
      )}
      {loading && !board ? (
        <div className={`flex flex-col gap-2`}>
          {Array.from(
            {
              length: 6,
            },
            (e, t) => (
              <_ key={t} className={`h-14 rounded-xl`} />
            ),
          )}
        </div>
      ) : d_length === 0 ? (
        <M1
          title={`Waiting for the first teams`}
          hint={`Teams appear here as soon as the organisers hand out their keys.`}
          className={`flex-1`}
        />
      ) : (
        <ol
          ref={wRef}
          className={r_1(
            `flex flex-col`,
            u ? `min-h-0 flex-1 overflow-y-auto overflow-x-hidden` : ``,
          )}
          style={{
            gap,
            fontSize,
          }}
          aria-label={`Leaderboard`}
        >
          <X_1 initial={false}>
            {d.map((row) => (
              <Y_1.li
                key={row.team}
                layout={`position`}
                initial={{
                  opacity: 0,
                  x: -24,
                }}
                animate={{
                  opacity: 1,
                  x: 0,
                }}
                exit={{
                  opacity: 0,
                }}
                transition={{
                  layout: {
                    type: `spring`,
                    stiffness: 170,
                    damping: 26,
                  },
                  duration: 0.4,
                }}
                style={{
                  height: u ? T : undefined,
                  minHeight: u ? undefined : 64,
                  flexShrink: 0,
                }}
              >
                <YeComponent
                  row={row}
                  density={u ? k : `lg`}
                  weights={weights}
                  relMax={relMax}
                  luckScale={luckScale}
                  delta={y.get(row.team) ?? 0}
                  flash={x.has(row.team)}
                />
              </Y_1.li>
            ))}
          </X_1>
        </ol>
      )}
    </section>
  );
}
const Ze = (due_in_hours) => {
  if (due_in_hours >= 1) {
    return `${due_in_hours.toFixed(1)} h`;
  }
  return `${Math.max(1, Math.round(due_in_hours * 60))} min`;
};
function QeComponent({ levels, className }) {
  let n = (levels ?? []).filter((e) => e.kind !== `persona`);
  if (n.length) {
    return (
      <div
        className={r_1(`grid gap-3.5`, className)}
        style={{
          gridTemplateColumns: `repeat(${n.length}, minmax(0, 1fr))`,
        }}
      >
        {n.map((e) => {
          if (e.state === `announced`) {
            return (
              <section
                key={e.id}
                className={`flex min-w-0 items-center gap-3 rounded-[18px] border border-dashed border-gold/45 bg-gold/[0.06] px-4 py-2.5`}
              >
                <span
                  className={`grid size-10 shrink-0 place-items-center rounded-full bg-line/60 text-lg font-black text-faint`}
                  aria-hidden
                >{`?`}</span>
                <div className={`min-w-0`}>
                  <div
                    className={`text-[10px] font-extrabold tracking-[0.2em] text-gold uppercase`}
                  >{`Coming soon`}</div>
                  <div
                    className={`truncate font-display text-[20px] leading-tight font-extrabold text-ink`}
                  >
                    {e.name}
                  </div>
                  {e.teaser && (
                    <div className={`truncate text-[13px] text-muted italic`}>
                      {e.teaser}
                    </div>
                  )}
                </div>
              </section>
            );
          }
          return (
            <section
              key={e.id}
              className={`flex min-w-0 flex-col rounded-[18px] border border-gold/40 bg-panel/60 px-4 py-2.5 shadow-[var(--shadow-panel)]`}
            >
              <div className={`flex items-center gap-2`}>
                <persona className={`size-4 shrink-0 text-gold`} aria-hidden />
                <h2
                  className={`truncate font-display text-[19px] leading-tight font-extrabold text-ink`}
                >
                  {e.name}
                </h2>
                {e.teaser && (
                  <span className={`truncate text-[12px] text-muted italic`}>
                    {e.teaser}
                  </span>
                )}
              </div>
              {e.board && e.board.length > 0 ? (
                <ul className={`mt-1 grid gap-0.5`}>
                  {e.board.slice(0, 3).map((e, t) => (
                    <li
                      key={t}
                      className={`flex min-w-0 items-baseline gap-2 text-[13px]`}
                    >
                      <span className={`truncate text-ink`}>{e.text}</span>
                      <span
                        className={`ml-auto shrink-0 font-mono font-bold text-gold`}
                      >
                        {e.price}
                        {` `}
                        {e.currency}
                      </span>
                      <span
                        className={`w-14 shrink-0 text-right font-mono text-[11px] text-faint`}
                      >
                        {Ze(e.due_in_hours)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                e.how && (
                  <p className={`mt-1 line-clamp-2 text-[12px] text-muted`}>
                    {e.how}
                  </p>
                )
              )}
            </section>
          );
        })}
      </div>
    );
  }
  return null;
}
const $e = (text, t) => {
  if (text.length > t) {
    return `${text.slice(0, t - 1)}…`;
  }
  return text;
};
function EtComponent({ personas, quotes }) {
  let n = personas
    .filter((e) => quotes.has(e.id))
    .map((p) => ({
      p,
      q: quotes.get(p.id),
    }))
    .sort((e, t) => t.q.t - e.q.t);
  let [r, setR] = X.useState(0);
  X.useEffect(() => {
    if (n.length <= 1) {
      return;
    }
    let e = setInterval(() => setR((e) => e + 1), 7000);
    return () => clearInterval(e);
  }, [n.length]);
  if (!n.length) {
    return null;
  }
  let a = n[r % n.length];
  return (
    <div
      className={`relative h-7 min-w-[14rem] flex-1 overflow-hidden`}
      aria-live={`off`}
    >
      <X_1 mode={`wait`} initial={false}>
        <Y_1.div
          key={`${a.p.id}-${a.q.t}-${r % n.length}`}
          initial={{
            opacity: 0,
            y: 8,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          exit={{
            opacity: 0,
            y: -8,
          }}
          transition={{
            duration: 0.35,
          }}
          className={`absolute inset-0 flex items-center gap-2 text-[13px]`}
          title={a.q.text}
        >
          <K1 className={`size-3.5 shrink-0 text-muted`} aria-hidden />
          <span className={`shrink-0 font-bold text-ink`}>
            {a.p.name}
            {`:`}
          </span>
          <span className={`truncate text-muted italic`}>
            {`“`}
            {$e(a.q.text, 140)}
            {`”`}
          </span>
        </Y_1.div>
      </X_1>
    </div>
  );
}
function TtComponent({
  personas,
  teams,
  nowHours,
  quotes,
  avatar = `md`,
  openings,
  teasers,
  className,
}) {
  let { name } = t_9();
  let personas_1 = (personas ?? [])
    .filter((e) => e.enabled)
    .sort((e, t) => e.level - t.level);
  let d = teams?.length ?? 0;
  return (
    <section
      className={r_1(
        `flex min-h-0 min-w-0 flex-col rounded-[20px] border border-line/80 bg-panel/60 p-4 shadow-[var(--shadow-panel)] backdrop-blur-sm`,
        className,
      )}
    >
      <header
        className={`mb-2 flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 px-1`}
      >
        <div className={`flex shrink-0 items-center gap-2.5`}>
          <E_2 className={`size-5 text-gold`} aria-hidden />
          <h2
            className={`text-[22px] whitespace-nowrap text-ink`}
          >{`The dealer ladder`}</h2>
        </div>
        {quotes && quotes.size > 0 ? (
          <EtComponent personas={personas_1} quotes={quotes} />
        ) : (
          <span
            className={`truncate text-xs font-semibold text-muted`}
          >{`each level opens early for teams that earn it`}</span>
        )}
      </header>
      {personas ? (
        <div
          className={`-mx-1 min-h-0 flex-1 overflow-x-auto overflow-y-hidden px-1 pt-1.5`}
        >
          <ol
            className={`relative grid min-w-[560px] content-start gap-2`}
            style={{
              gridTemplateColumns: `repeat(${Math.max(personas_1.length + (teasers?.length ?? 0), 1)}, minmax(0, 1fr))`,
            }}
          >
            <span
              className={`pointer-events-none absolute left-[10%] right-[10%] h-[3px] rounded-full bg-gradient-to-r from-gold/70 via-line-strong to-line`}
              style={{
                top: avatar === `lg` ? 31 : 21,
              }}
              aria-hidden
            />
            {personas_1.map((e) => {
              let r = a(e, name, nowHours, openings?.get(e.id));
              let length = (teams ?? []).filter(
                (t) => t.level >= e.level,
              ).length;
              return (
                <li
                  key={e.id}
                  className={`relative flex min-w-0 flex-col items-center self-start text-center`}
                >
                  <H
                    to={`/personas/${e.id}`}
                    className={`relative rounded-full`}
                    title={`${e.name} — ${e.title}`}
                  >
                    <Ae1
                      avatar={e.avatar}
                      name={e.name}
                      size={avatar}
                      status={r.openNow ? undefined : `locked`}
                      ring={r.openNow}
                    />
                  </H>
                  <div
                    className={`mt-1.5 flex max-w-full items-baseline gap-1.5`}
                    title={E(e.level).blurb}
                  >
                    <span
                      className={`font-display text-[15px] font-black text-gold`}
                    >
                      {`L`}
                      {e.level}
                    </span>
                    <span
                      className={`truncate font-display text-[19px] leading-none font-extrabold text-ink`}
                    >
                      {e.name}
                    </span>
                  </div>
                  {avatar === `lg` && (
                    <div
                      className={`mt-0.5 truncate text-[11px] font-semibold tracking-[0.12em] text-faint uppercase`}
                    >
                      {E(e.level).name}
                    </div>
                  )}
                  <div
                    className={`mt-1.5 flex flex-wrap items-center justify-center gap-1`}
                  >
                    {r.openNow ? (
                      <span
                        className={`rounded-full border border-good/40 bg-good/12 px-1.5 py-0.5 text-[10px] font-extrabold tracking-[0.1em] whitespace-nowrap text-good uppercase`}
                        title={`open to every team`}
                      >{`Open`}</span>
                    ) : (
                      <span
                        className={`inline-flex items-center gap-0.5 rounded-full border border-gold/35 bg-gold/10 px-1.5 py-0.5 text-[10px] font-bold whitespace-nowrap text-gold`}
                        title={r.everyone}
                      >
                        <D className={`size-3`} aria-hidden />
                        {r.short === `Locked`
                          ? `locked`
                          : r.short.replace(/^in /, ``)}
                      </span>
                    )}
                    {d > 0 && (
                      <span
                        className={`inline-flex items-center gap-0.5 rounded-full border border-line-strong bg-base/60 px-1.5 py-0.5 text-[10px] font-bold whitespace-nowrap text-muted`}
                        title={`teams that have reached this level`}
                      >
                        <D_1 className={`size-3`} aria-hidden />
                        {` `}
                        {length}
                        {`/`}
                        {d}
                      </span>
                    )}
                  </div>
                  {!r.openNow && r.earlyShort && (
                    <div
                      className={`mt-1 max-w-full truncate text-[11px] leading-tight text-muted`}
                      title={r.early ?? undefined}
                    >
                      {`early: `}
                      {r.earlyShort}
                    </div>
                  )}
                </li>
              );
            })}
            {(teasers ?? []).map((e) => (
              <li
                key={e.id}
                className={`relative flex min-w-0 flex-col items-center self-start text-center`}
                title={e.teaser}
              >
                <span
                  className={r_1(
                    `grid place-items-center rounded-full border-2 border-dashed border-gold/50 bg-panel font-black text-faint`,
                    avatar === `lg`
                      ? `size-[62px] text-2xl`
                      : `size-[42px] text-lg`,
                  )}
                  aria-hidden
                >{`?`}</span>
                <div
                  className={`mt-1.5 max-w-full truncate font-display text-[19px] leading-none font-extrabold text-ink`}
                >
                  {e.name}
                </div>
                <span
                  className={`mt-1.5 rounded-full border border-gold/35 bg-gold/10 px-1.5 py-0.5 text-[10px] font-extrabold tracking-[0.1em] whitespace-nowrap text-gold uppercase`}
                >{`Coming soon`}</span>
                {e.teaser && (
                  <div
                    className={`mt-1 max-w-full truncate text-[11px] leading-tight text-muted italic`}
                  >
                    {e.teaser}
                  </div>
                )}
              </li>
            ))}
          </ol>
        </div>
      ) : (
        <div className={`grid flex-1 grid-cols-5 gap-3`}>
          {Array.from(
            {
              length: 5,
            },
            (e, t) => (
              <_ key={t} className={`h-full min-h-24 rounded-xl`} />
            ),
          )}
        </div>
      )}
    </section>
  );
}
const nt = 7600;
function RtComponent({ enabled = true }) {
  let { index } = n_5();
  let { name } = t_9();
  let [r, setR] = X.useState([]);
  n_2(
    (r) => {
      if (!enabled) {
        return;
      }
      let r_payload = r.payload;
      let o = (e) =>
        setR((t) => {
          if (t.some((t) => t.key === e.key)) {
            return t;
          }
          return [...t, e].slice(-4);
        });
      if (r.type === `pack.opened`) {
        let e = r_payload.best ?? null;
        let i = e ? [e] : (r_payload.cards ?? []);
        for (let e of i) {
          if (e.rarity !== `epic` && e.rarity !== `legendary`) {
            continue;
          }
          let i =
            index?.packs.get(String(r_payload.pack))?.name ??
            String(r_payload.pack);
          o({
            key: `${r.id}:${e.ref}:${e.serial}`,
            team: String(r_payload.name ?? name(String(r_payload.team))),
            ref: e.ref,
            name: e.name ?? e.ref,
            rarity: e.rarity,
            serial: e.serial ?? null,
            printRun: e.print_run ?? null,
            source: `from a ${i}`,
          });
        }
      } else if (r.type === `egg.given` || r.type === `gift.given`) {
        for (let ref of r_payload.cards ?? []) {
          let i = index?.cards.get(ref);
          if (!(
            !i ||
            (i.card.rarity !== `epic` && i.card.rarity !== `legendary`)
          )) {
            o({
              key: `${r.id}:${ref}`,
              team: String(r_payload.name ?? name(String(r_payload.team))),
              ref,
              name: i.card.name,
              rarity: i.card.rarity,
              serial: null,
              printRun: i.card.print_run,
              source:
                r.type === `egg.given`
                  ? `for finding an easter egg`
                  : `as a gift from ${name(r.actor)}`,
            });
          }
        }
      }
    },
    {
      scope: `public`,
      types: [`pack.opened`, `egg.given`, `gift.given`],
    },
  );
  let m_1 = r[0] ?? null;
  X.useEffect(() => {
    if (!m_1) {
      return;
    }
    let e = setTimeout(() => setR((e) => e.slice(1)), nt);
    return () => clearTimeout(e);
  }, [m_1]);
  return (
    <X_1>
      {m_1 && (
        <ItComponent
          key={m_1.key}
          m={m_1}
          onDone={() => setR((e) => e.slice(1))}
        />
      )}
    </X_1>
  );
}
function ItComponent({ m, onDone }) {
  let { index } = n_5();
  let a = u_1();
  let [s, setS] = X.useState(false);
  X.useEffect(() => {
    let e = setTimeout(() => setS(true), a ? 0 : 700);
    return () => clearTimeout(e);
  }, [a]);
  let l =
    index?.rarityColor(m.rarity) ?? (T_1(m.rarity) ? v[m.rarity] : `#FFC44D`);
  let u = (index?.rarityLabel(m.rarity) ?? m.rarity).toUpperCase();
  let d = X.useMemo(() => {
    let t = k(m.key.length * 7919 + m.name.length);
    return Array.from(
      {
        length: 22,
      },
      (e, n) => {
        let r = (n / 22) * Math.PI * 2 + t() * 0.3;
        let i = 220 + t() * 260;
        return {
          dx: Math.cos(r) * i,
          dy: Math.sin(r) * i * 0.75,
          delay: 0.7 + t() * 0.5,
          size: 5 + t() * 7,
        };
      },
    );
  }, [m.key, m.name]);
  let f = index?.cards.get(m.ref);
  return (
    <Y_1.div
      className={`fixed inset-0 z-[70] grid cursor-pointer place-items-center overflow-hidden bg-base/80 backdrop-blur-md`}
      style={{
        "--moment": l,
      }}
      initial={{
        opacity: 0,
      }}
      animate={{
        opacity: 1,
      }}
      exit={{
        opacity: 0,
        transition: {
          duration: 0.5,
        },
      }}
      onClick={onDone}
      role={`alertdialog`}
      aria-label={`${m.team} pulled ${m.name}, ${u}`}
    >
      <div
        className={`moment-rays pointer-events-none absolute left-1/2 top-1/2 size-[1500px] -translate-x-1/2 -translate-y-1/2 rounded-full`}
        aria-hidden
      />
      <div
        className={`pointer-events-none absolute left-1/2 top-1/2 size-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full`}
        style={{
          background: `radial-gradient(circle, ${l}40 0%, transparent 60%)`,
        }}
        aria-hidden
      />
      {!a &&
        s &&
        d.map((e, t) => (
          <span
            key={t}
            className={`moment-spark`}
            style={{
              "--dx": `${e.dx}px`,
              "--dy": `${e.dy}px`,
              width: e.size,
              height: e.size,
              animationDelay: `${e.delay - 0.7}s`,
            }}
            aria-hidden
          />
        ))}
      <div
        className={`relative flex flex-col items-center gap-8 px-6 text-center`}
      >
        <Y_1.div
          initial={{
            opacity: 0,
            y: -30,
            letterSpacing: `0.5em`,
          }}
          animate={{
            opacity: 1,
            y: 0,
            letterSpacing: `0.08em`,
          }}
          transition={{
            delay: 0.9,
            duration: 0.7,
            ease: [0.2, 0.8, 0.2, 1],
          }}
          className={`font-display text-[clamp(56px,9vw,132px)] leading-none font-black`}
          style={{
            color: l,
            textShadow: `0 0 40px ${l}99, 0 6px 0 rgb(0 0 0 / 0.35)`,
          }}
        >
          {u}
          {`!`}
        </Y_1.div>
        <Y_1.div
          initial={{
            scale: 0.55,
            y: 60,
            rotate: -8,
            opacity: 0,
          }}
          animate={{
            scale: 1,
            y: 0,
            rotate: 0,
            opacity: 1,
          }}
          transition={{
            type: `spring`,
            stiffness: 140,
            damping: 16,
          }}
          style={{
            filter: `drop-shadow(0 0 60px ${l}88)`,
          }}
        >
          <I1
            {...i_1(m.ref, index, {
              serial: m.serial,
              printRun: m.printRun ?? f?.card.print_run,
            })}
            size={`lg`}
            revealed={s}
            style={{
              fontSize: `clamp(12px, 1.9vh, 22px)`,
            }}
          />
        </Y_1.div>
        <Y_1.div
          initial={{
            opacity: 0,
            y: 20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: 1.3,
            duration: 0.5,
          }}
          className={`max-w-[60ch]`}
        >
          <div
            className={`font-display text-[clamp(28px,3.4vw,54px)] leading-tight font-extrabold text-ink`}
          >
            {m.team}
            {` `}
            <span className={`text-muted`}>{`pulled`}</span>
            {` `}
            {m.name}
          </div>
          <div
            className={`mt-2 text-[clamp(15px,1.4vw,22px)] font-semibold text-muted`}
          >
            {m.serial ? (
              <span
                className={`font-mono font-bold`}
                style={{
                  color: l,
                }}
              >
                {S(m.serial, m.printRun)}
              </span>
            ) : null}
            {m.serial ? ` · ` : ``}
            {m.printRun ? `one of ${m.printRun} ever printed · ` : ``}
            {m.source}
          </div>
        </Y_1.div>
      </div>
      <Y_1.div
        className={`absolute bottom-0 left-0 h-1.5`}
        style={{
          background: l,
        }}
        initial={{
          width: `0%`,
        }}
        animate={{
          width: `100%`,
        }}
        transition={{
          duration: nt / 1000,
          ease: `linear`,
        }}
        aria-hidden
      />
    </Y_1.div>
  );
}
function AtComponent({ size = 76 }) {
  let { clock, nextTickIn, progress, paused } = l_1();
  let strokeWidth = Math.max(4, size * 0.085);
  let r = (size - strokeWidth) / 2 - 1;
  let strokeDasharray = 2 * Math.PI * r;
  let c = nextTickIn === null ? null : Math.ceil(nextTickIn);
  return (
    <div
      className={`relative grid shrink-0 place-items-center`}
      style={{
        width: size,
        height: size,
      }}
      aria-label={paused ? `clock paused` : `next tick in ${c ?? `—`} seconds`}
    >
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className={`absolute inset-0 -rotate-90`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill={`none`}
          stroke={`var(--color-line-strong)`}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill={`none`}
          stroke={paused ? `var(--color-warn)` : `var(--color-gold)`}
          strokeWidth={strokeWidth}
          strokeLinecap={`round`}
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDasharray * (1 - (paused ? 1 : progress))}
          style={{
            filter: paused
              ? undefined
              : `drop-shadow(0 0 6px rgb(255 196 77 / 0.55))`,
          }}
        />
      </svg>
      {paused ? (
        <N className={`size-[38%] text-warn`} aria-hidden />
      ) : (
        <span className={`flex flex-col items-center leading-none`}>
          <span
            style={{
              fontSize: Math.round(size * 0.36),
            }}
          >
            <K value={c} className={`text-ink`} />
          </span>
          {size >= 60 && (
            <span
              className={`mt-0.5 text-[9px] font-bold tracking-[0.18em] text-muted uppercase`}
            >{`sec`}</span>
          )}
        </span>
      )}
      {clock === null && <span className={`sr-only`}>{`connecting`}</span>}
    </div>
  );
}
function ot(e) {
  let t = Math.max(0, Math.floor(e * 3600));
  let n = Math.floor(t / 3600);
  let r = Math.floor((t % 3600) / 60);
  let i = t % 60;
  return `${n}:${String(r).padStart(2, `0`)}:${String(i).padStart(2, `0`)}`;
}
function useSt(e, t) {
  let [n, setN] = X.useState(false);
  X.useEffect(() => {
    if (!t) {
      return;
    }
    let n;
    let i = () => {
      setN(false);
      clearTimeout(n);
      n = setTimeout(() => setN(true), e);
    };
    i();
    window.addEventListener(`pointermove`, i);
    window.addEventListener(`keydown`, i);
    return () => {
      clearTimeout(n);
      window.removeEventListener(`pointermove`, i);
      window.removeEventListener(`keydown`, i);
    };
  }, [e, t]);
  return t && n;
}
function useCt() {
  let [e, setE] = X.useState(
    () => typeof document < `u` && !!document.fullscreenElement,
  );
  X.useEffect(() => {
    let e = () => setE(!!document.fullscreenElement);
    document.addEventListener(`fullscreenchange`, e);
    return () => document.removeEventListener(`fullscreenchange`, e);
  }, []);
  return [
    e,
    () => {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => undefined);
      } else {
        document.documentElement.requestFullscreen?.().catch(() => undefined);
      }
    },
  ];
}
function LtComponent({ tv, stream, exitTo = `/`, tvTo = `/?tv=1`, badge }) {
  let { clock, paused, error } = l_1({
    live: false,
  });
  let l = useSt(3500, tv);
  let [u, onClick] = useCt();
  let f = n_4(640);
  let p = !!error || stream === `reconnecting`;
  let m =
    !!clock?.calendar &&
    clock.calendar_on !== false &&
    !!clock.doors &&
    clock.doors !== `open`;
  let h = clock?.next_opens
    ? new Date(clock.next_opens).toLocaleString(`en-GB`, {
        weekday: `short`,
        hour: `2-digit`,
        minute: `2-digit`,
        timeZone: `Europe/Madrid`,
      })
    : null;
  let className = `inline-flex items-center gap-1.5 rounded-full border border-line bg-panel/95 px-3 py-1.5 text-xs font-semibold text-muted shadow-[var(--shadow-panel)] hover:text-ink`;
  return (
    <header
      className={`relative flex flex-wrap items-center gap-x-6 gap-y-3 rounded-[20px] border border-line/80 bg-panel/70 px-4 py-3 shadow-[var(--shadow-panel)] backdrop-blur-md sm:px-6`}
    >
      {tv ? (
        <div className={`flex min-w-0 items-center gap-3`}>
          <Ye1
            className={`size-11 shrink-0 drop-shadow-[0_6px_14px_rgb(255_196_77/0.25)]`}
          />
          <div className={`min-w-0 leading-none`}>
            <div
              className={`font-display text-[34px] font-extrabold tracking-wide whitespace-nowrap text-ink`}
            >{`THE BAZAAR`}</div>
            <div
              className={`mt-1 text-[11px] font-bold tracking-[0.3em] whitespace-nowrap text-gold/90 uppercase`}
            >{`Cromos de Madrid`}</div>
          </div>
          <Ge1
            className={`ml-2 hidden border-l border-line-strong/80 pl-5 sm:flex`}
            logoClass={`h-[26px]`}
          />
        </div>
      ) : null}
      <div
        className={r_1(
          `min-w-0 flex-col`,
          tv ? `mx-auto hidden items-center text-center md:flex` : `flex`,
        )}
      >
        <div className={`eyebrow`}>
          {clock ? `Round ${clock.round}` : `Round`}
        </div>
        <div
          className={`mt-1 max-w-[36ch] truncate font-display text-[26px] leading-none font-extrabold text-ink sm:text-[30px]`}
        >
          {clock?.round_name ?? `—`}
        </div>
        {badge}
      </div>
      <div className={`ml-auto flex shrink-0 items-center gap-3 sm:gap-5`}>
        <div className={`hidden text-right lg:block`}>
          <div className={`eyebrow`}>{`Game clock`}</div>
          <div className={`mt-1 font-mono text-xl font-semibold text-ink`}>
            {clock ? ot(clock.t_hours) : `—`}
          </div>
        </div>
        <div className={`text-right`}>
          <div className={`eyebrow`}>{`Tick`}</div>
          <K
            value={clock?.tick ?? null}
            className={`text-[32px] leading-none text-ink sm:text-[44px]`}
          />
        </div>
        <AtComponent size={f ? 76 : 56} />
        <div
          className={r_1(
            `flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-extrabold tracking-[0.2em] uppercase sm:px-3.5 sm:py-2 sm:text-sm`,
            m
              ? `border-line-strong bg-raised text-ink`
              : paused
                ? `border-warn/50 bg-warn/12 text-warn`
                : p
                  ? `border-line-strong bg-raised text-muted`
                  : `border-accent/50 bg-accent/12 text-accent`,
          )}
          role={`status`}
          title={m && h ? `Closed until ${h}` : undefined}
        >
          {m ? (
            <Y className={`size-4`} aria-hidden />
          ) : paused ? (
            <N className={`size-4`} aria-hidden />
          ) : (
            <Pe1 tone={p ? `muted` : `accent`} />
          )}
          {m
            ? clock?.doors === `after`
              ? `Closed`
              : h
                ? `Closed · opens ${h}`
                : `Closed`
            : paused
              ? `Paused`
              : p
                ? `Reconnecting`
                : `Live`}
        </div>
        {!tv && (
          <H
            to={tvTo}
            className={`hidden rounded-full border border-line bg-base/60 p-2.5 text-muted hover:text-ink lg:inline-flex`}
            title={`Big screen mode (kiosk, full screen)`}
          >
            <P className={`size-4`} aria-hidden />
            <span className={`sr-only`}>{`Big screen mode`}</span>
          </H>
        )}
      </div>
      {tv && (
        <div
          className={r_1(
            `fixed right-5 bottom-5 z-[60] flex gap-2 transition-opacity duration-500`,
            l ? `pointer-events-none opacity-0` : `opacity-100`,
          )}
        >
          <button type={`button`} onClick={onClick} className={className}>
            {u ? <Ke1 className={`size-3.5`} /> : <De className={`size-3.5`} />}
            {u ? `Exit full screen` : `Full screen`}
          </button>
          <H to={exitTo} className={className}>
            <Ne1 className={`size-3.5`} />
            {` Leave big screen`}
          </H>
        </div>
      )}
    </header>
  );
}
const ut = {
  open: `bg-good`,
  closing: `bg-warn`,
  closed: `bg-faint`,
  suspended: `bg-accent`,
};
const dt = {
  open: `border-good/40 bg-good/12 text-good`,
  closing: `border-warn/40 bg-warn/12 text-warn`,
  closed: `border-line bg-base/50 text-faint`,
  suspended: `border-accent/45 bg-accent/12 text-accent`,
};
function FtComponent({ venues, rows = 4, fit = false, className }) {
  let { index } = n_5();
  let symbol = index?.symbol ?? `P`;
  let o = (venues ?? []).filter((e) => e.status !== `closed`);
  let sRef = X.useRef(null);
  let l = t_6(sRef, {
    rowPx: 44,
    gapPx: 4,
    reservePx: 22,
    max: rows,
    active: n_4(1024) && fit && o.length > 0,
  });
  let length = Math.max(1, Math.ceil(o.length / l));
  let [d, setD] = X.useState(0);
  X.useEffect(() => {
    if (length <= 1) {
      setD(0);
      return;
    }
    let e = setInterval(() => setD((e) => (e + 1) % length), 9000);
    return () => clearInterval(e);
  }, [length]);
  let p = o.slice((d % length) * l, (d % length) * l + l);
  let m = o.some((e) => typeof e.value_created == `number`);
  return (
    <section
      className={r_1(
        `vb flex min-h-0 min-w-0 flex-col rounded-[20px] border border-line/80 bg-panel/60 p-4 shadow-[var(--shadow-panel)] backdrop-blur-sm`,
        className,
      )}
    >
      <header className={`mb-2 flex items-center justify-between gap-3 px-1`}>
        <div className={`flex items-center gap-2.5`}>
          <A_1 className={`size-5 text-gold`} aria-hidden />
          <h2 className={`text-[22px] text-ink`}>{`Markets`}</h2>
        </div>
        {length > 1 && (
          <span
            className={`flex items-center gap-1`}
            aria-label={`page ${d + 1} of ${length}`}
          >
            {Array.from(
              {
                length,
              },
              (e, t) => (
                <span
                  key={t}
                  className={r_1(
                    `size-1.5 rounded-full`,
                    t === d % length ? `bg-gold` : `bg-line-strong`,
                  )}
                />
              ),
            )}
          </span>
        )}
      </header>
      {venues ? (
        o.length === 0 ? (
          <div
            className={`grid flex-1 place-items-center text-sm text-muted`}
          >{`No markets yet — teams open theirs from level 2.`}</div>
        ) : (
          <div ref={sRef} className={`min-h-0 flex-1 overflow-hidden`}>
            <div
              className={`vb-grid px-2 pb-1 text-[10px] font-bold tracking-[0.14em] text-faint uppercase`}
            >
              <span>{`Market`}</span>
              <span className={`text-right`}>{`Fee`}</span>
              <span
                className={`vb-teams text-right`}
                title={`teams that traded there this round`}
              >{`Teams`}</span>
              <span
                className={`text-right`}
                title={
                  m
                    ? `value created between other teams`
                    : `cash traded this round`
                }
              >
                {m ? `Value` : `Volume`}
              </span>
              <span className={`vb-status text-right`}>{`Status`}</span>
            </div>
            <X_1 mode={`popLayout`} initial={false}>
              <Y_1.ul
                key={d}
                initial={{
                  opacity: 0,
                  y: 8,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                  y: -8,
                }}
                transition={{
                  duration: 0.35,
                }}
                className={`flex flex-col gap-1`}
              >
                {p.map((e) => (
                  <li
                    key={e.venue}
                    className={`vb-grid rounded-lg border border-line/70 bg-base/40 px-2 py-1`}
                    title={
                      e.status === `suspended` && e.suspension_reason
                        ? `suspended: ${e.suspension_reason}`
                        : e.description
                    }
                  >
                    <span className={`flex min-w-0 items-center gap-2`}>
                      {e.house ? (
                        <T
                          className={`size-4 shrink-0 text-muted`}
                          aria-hidden
                        />
                      ) : (
                        <A_1
                          className={`size-4 shrink-0 text-gold/80`}
                          aria-hidden
                        />
                      )}
                      <span className={`min-w-0`}>
                        <span
                          className={`flex items-center gap-1.5 text-[15px] leading-tight font-bold text-ink`}
                        >
                          <span
                            className={r_1(
                              `vb-dot size-2 shrink-0 rounded-full`,
                              ut[e.status],
                            )}
                            title={e.status}
                            aria-label={e.status}
                          />
                          <span className={`truncate`}>{e.name}</span>
                        </span>
                        <span
                          className={`block truncate text-[11px] text-muted`}
                        >
                          {e.house ? `the house` : e.owner_name}
                        </span>
                      </span>
                    </span>
                    <span
                      className={`text-right font-mono text-[13px] font-semibold text-ink`}
                    >
                      {p_1(e.fee_bps)}
                      {e.fee_per_card ? (
                        <span className={`block text-[10px] text-muted`}>
                          {`+`}
                          {v_2(e.fee_per_card, {
                            symbol,
                          })}
                          {`/card`}
                        </span>
                      ) : null}
                    </span>
                    <span
                      className={`vb-teams text-right font-display text-[18px] font-extrabold text-ink`}
                    >
                      {y_1(e.traders)}
                    </span>
                    <span
                      className={`text-right font-display text-[18px] font-extrabold text-gold`}
                      title={`${y_1(e.trades)} trades`}
                    >
                      <We1 value={m ? e.value_created : e.volume} compact />
                    </span>
                    <span className={`vb-status text-right`}>
                      <span
                        className={r_1(
                          `inline-block rounded-full border px-2 py-0.5 text-[10px] font-extrabold tracking-[0.1em] uppercase`,
                          dt[e.status],
                        )}
                      >
                        {e.status}
                      </span>
                    </span>
                  </li>
                ))}
              </Y_1.ul>
            </X_1>
          </div>
        )
      ) : (
        <_ lines={4} />
      )}
    </section>
  );
}
const pt = 30000;
const $ = {
  pauseHidden: false,
};
function MtComponent() {
  let [e] = q();
  let tv = e.has(`tv`);
  let n = e.get(`quotes`) !== `0`;
  let r = i_3((e) => c.leaderboard(e), 5000, [], $);
  let i = i_3((e) => c.personas(e), 30000, [], $);
  let a = i_3((e) => c.schedule(e), 30000, [], $);
  let o = i_3((e) => c.levels(e), 15000, [], $);
  let s = t_4((e) => c.feed(150, e), [], $);
  let { events, status } = r_2({
    scope: `public`,
    limit: 200,
    seed: s.data?.events,
  });
  let { clock } = l_1({
    live: false,
  });
  let [liveSince, setLiveSince] = X.useState(2 ** 53 - 1);
  X.useEffect(() => {
    if (s.data) {
      setLiveSince(
        s.data.events.reduce((acc, event) => Math.max(acc, event.id), 0),
      );
    } else if (s.error) {
      setLiveSince(0);
    }
  }, [s.data, s.error]);
  let [h, setH] = X.useState(null);
  X.useEffect(() => {
    if (!h) {
      return;
    }
    let e = setTimeout(() => setH(null), pt);
    return () => clearTimeout(e);
  }, [h]);
  n_2(
    (e) => {
      switch (e.type) {
        case `announcement`:
          setH({
            id: e.id,
            text: String(e.payload.text ?? ``),
          });
          break;
        case `persona.open_to_all`:
        case `persona.updated`:
          i.refresh();
          a.refresh();
          break;
        case `level.announced`:
        case `level.activated`: {
          let t = e.payload;
          setH({
            id: e.id,
            text:
              e.type === `level.announced`
                ? `Coming soon: ${t.name ?? ``}${t.teaser ? ` — ${t.teaser}` : ``}`
                : `${t.name ?? ``} is open`,
          });
          o.refresh();
          i.refresh();
          a.refresh();
          break;
        }
        case `set.released`:
          t_8();
          a.refresh();
          break;
        case `schedule.fired`:
        case `duels.scheduled`:
        case `bench.started`:
          a.refresh();
          break;
        case `round.started`:
        case `round.ended`:
        case `round.voided`:
        case `round.weight`:
          r.refresh();
      }
    },
    {
      scope: `public`,
    },
  );
  let quotes = X.useMemo(() => {
    if (n) {
      return n_3(events);
    }
  }, [events, n]);
  let openings = X.useMemo(() => r_3(a.data?.upcoming), [a.data]);
  let nowHours = clock?.t_hours ?? null;
  let T = (
    <div className={`flex flex-col gap-3.5 lg:h-full lg:min-h-0`}>
      <LtComponent
        tv={tv}
        stream={status}
        badge=<BeComponent className={r_1(`mt-2`, tv && `justify-center`)} />
      />
      <X_1>
        {h && (
          <Y_1.div
            key={h.id}
            initial={{
              opacity: 0,
              y: -12,
              height: 0,
            }}
            animate={{
              opacity: 1,
              y: 0,
              height: `auto`,
            }}
            exit={{
              opacity: 0,
              height: 0,
            }}
            transition={{
              duration: 0.4,
            }}
            className={`shrink-0 overflow-hidden`}
          >
            <div
              className={`flex items-center gap-4 rounded-[18px] border border-info/40 bg-gradient-to-r from-info/20 via-info/10 to-transparent px-5 py-3`}
            >
              <announce className={`size-7 shrink-0 text-info`} aria-hidden />
              <div className={`min-w-0`}>
                <div
                  className={`text-[11px] font-extrabold tracking-[0.2em] text-info uppercase`}
                >{`From the organisers`}</div>
                <div
                  className={`truncate font-display text-[28px] leading-tight font-extrabold text-ink`}
                >
                  {h.text}
                </div>
              </div>
            </div>
          </Y_1.div>
        )}
      </X_1>
      <QeComponent levels={o.data?.levels} className={`shrink-0`} />
      <div
        className={`grid gap-3.5 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1.62fr)_minmax(0,1fr)]`}
      >
        <XeComponent
          board={r.data}
          loading={r.loading}
          error={r.error}
          onRetry={r.refresh}
          className={`lg:min-h-0`}
        />
        <A
          events={events}
          liveSince={liveSince}
          loading={s.loading}
          className={`h-[560px] lg:h-auto lg:min-h-0`}
        />
      </div>
      <div
        className={r_1(
          `grid gap-3.5 lg:shrink-0 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,0.72fr)]`,
          (r.data?.teams.length ?? 0) > 10
            ? `lg:h-[212px]`
            : `lg:h-[clamp(212px,22vh,252px)]`,
        )}
      >
        <TtComponent
          personas={i.data?.personas}
          teasers={i.data?.teasers}
          teams={r.data?.teams}
          nowHours={nowHours}
          quotes={quotes}
          openings={openings}
        />
        <FtComponent venues={r.data?.venues} rows={3} fit />
        <FeComponent items={a.data?.upcoming} nowHours={nowHours} fit />
      </div>
      <RtComponent />
    </div>
  );
  if (tv) {
    return (
      <div
        className={r_1(
          `bg-market fixed inset-0 z-50 overflow-y-auto p-4 lg:overflow-hidden lg:p-5`,
        )}
      >
        {T}
      </div>
    );
  }
  return <div className={`lg:h-[calc(100dvh-8rem)] lg:min-h-[760px]`}>{T}</div>;
}
export { MtComponent as default };
