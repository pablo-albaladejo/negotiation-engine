import { i, n, t } from "./jsx-runtime.js";
import { r, t as I1 } from "./Button.js";
import { n as n_2 } from "./EventLine.js";
import { t as O1 } from "./chevron-down.js";
import { t as S1 } from "./chevron-right.js";
import { t as C1 } from "./EmptyState.js";
import { a as Ee, i as i_1, n as n_3, s } from "./useEvents.js";
import { t as F1 } from "./radio.js";
import { n as P1, t as M1 } from "./ErrorNote.js";
import { t as H1 } from "./search.js";
import { t as G1 } from "./PageHeader.js";
import { t as _ } from "./Panel.js";
import { t as V1 } from "./Toggle.js";
import { g, u as B1 } from "./index.js";
import { d as X1, n as n_4 } from "./hooks.js";
const C = i(n(), 1);
const w = t();
const T =
  /("(?:\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(?:true|false)\b|\bnull\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g;
function E(e) {
  let t = [];
  let n = 0;
  for (let r of e.matchAll(T)) {
    let i = r.index ?? 0;
    if (i > n) {
      t.push({
        text: e.slice(n, i),
        cls: `text-faint`,
      });
    }
    let text = r[0];
    let cls = `text-info`;
    if (text.startsWith(`"`)) {
      cls = r[2] ? `text-gold/90` : `text-good/90`;
    } else if (text === `true` || text === `false`) {
      cls = `text-epic`;
    } else if (text === `null`) {
      cls = `text-faint`;
    }
    t.push({
      text,
      cls,
    });
    n = i + text.length;
  }
  if (n < e.length) {
    t.push({
      text: e.slice(n),
      cls: `text-faint`,
    });
  }
  return t;
}
function DComponent({ value, className, maxHeight = `22rem` }) {
  let i = C.useMemo(() => E(JSON.stringify(value, null, 2) ?? `null`), [value]);
  return (
    <pre
      className={r(
        `overflow-auto rounded-lg border border-line bg-base/80 px-3 py-2.5 font-mono text-[12px] leading-relaxed`,
        className,
      )}
      style={{
        maxHeight,
      }}
    >
      {i.map((e, key) => (
        <span key={key} className={e.cls}>
          {e.text}
        </span>
      ))}
    </pre>
  );
}
const O =
  `settlement,thread.opened,thread.message,thread.closed,offer.listed,offer.cancelled,pack.opened,persona.updated,persona.strike,persona.cooloff,persona.open_to_all,egg.found,badge.awarded,gift.given,level.unlocked,flag.raised,venue.opened,venue.suspended,venue.reopened,venue.fee_announced,round.started,round.ended,round.voided,admin.grant,admin.adjustment,admin.freeze,admin.key_rotated,announcement,clock.changed,team.joined,schedule.fired,duels.scheduled,bench.started,settlement.failed,engine.error,tick`.split(
    `,`,
  );
const k = [
  [`settlement`, `text-good border-good/35 bg-good/10`],
  [`pack`, `text-gold border-gold/35 bg-gold/10`],
  [`egg`, `text-gold border-gold/35 bg-gold/10`],
  [`badge`, `text-gold border-gold/35 bg-gold/10`],
  [`gift`, `text-gold border-gold/35 bg-gold/10`],
  [`level`, `text-gold border-gold/35 bg-gold/10`],
  [`thread`, `text-info border-info/35 bg-info/10`],
  [`offer`, `text-info border-info/35 bg-info/10`],
  [`persona`, `text-epic border-epic/35 bg-epic/10`],
  [`venue`, `text-good border-good/35 bg-good/5`],
  [`admin`, `text-accent border-accent/35 bg-accent/10`],
  [`engine`, `text-accent border-accent/35 bg-accent/10`],
  [`flag`, `text-warn border-warn/35 bg-warn/10`],
  [`round`, `text-warn border-warn/35 bg-warn/10`],
];
const A = (type) =>
  k.find(([t]) => type.startsWith(t))?.[1] ??
  `text-muted border-line bg-raised/40`;
function JComponent() {
  let e = n_4();
  let t = n_2(true);
  let [n, setN] = C.useState(``);
  let [o, setO] = C.useState(``);
  let [y, setY] = C.useState(``);
  let [T, setT] = C.useState({
    actor: ``,
    contains: ``,
  });
  let [D, setD] = C.useState(`200`);
  let [A, setA] = C.useState(true);
  let [N, setN_1] = C.useState(true);
  let [F, setF] = C.useState(true);
  let [L, setL] = C.useState([]);
  let [loading, setLoading] = C.useState(false);
  let [V, setV] = C.useState([]);
  let [U, setU] = C.useState(new Set());
  let G = Number(D);
  let limit = A && !n ? Math.min(2000, G * 4) : G;
  let q = i_1(
    (e) =>
      s.events(
        {
          type: n || undefined,
          actor: T.actor || undefined,
          contains: T.contains || undefined,
          limit,
        },
        e,
      ),
    null,
    [n, T.actor, T.contains, limit],
  );
  let J = C.useCallback(() => {
    setL([]);
    setV([]);
  }, []);
  let Y = C.useCallback(
    (e) =>
      !(
        (A && e.type === `tick`) ||
        (N && e.type === `thread.message` && e.scope !== `admin`) ||
        (n && e.type !== n) ||
        (T.actor &&
          e.actor !== T.actor &&
          !JSON.stringify(e.payload).includes(`"${T.actor}"`)) ||
        (T.contains && !JSON.stringify(e.payload).includes(T.contains))
      ),
    [A, N, n, T],
  );
  n_3(
    (e) => {
      if (F) {
        setV((t) => [e, ...t].slice(0, 500));
      }
    },
    {
      scope: `admin`,
    },
  );
  let X = C.useMemo(() => {
    let e = new Set();
    return [...V, ...(q.data?.events ?? []), ...L]
      .filter((t) => !e.has(t.id) && (e.add(t.id), true))
      .filter(Y)
      .sort((e, t) => t.id - e.id);
  }, [V, q.data, L, Y]);
  let Z = X.slice(0, G + L.length + V.length);
  let Q = C.useMemo(() => {
    let e = new Set(O);
    for (let t of q.data?.events ?? []) {
      e.add(t.type);
    }
    return [...e].sort();
  }, [q.data]);
  let te = async () => {
    let before = Math.min(...X.map((e) => e.id));
    if (Number.isFinite(before)) {
      setLoading(true);
      try {
        let t = await s.events({
          type: n || undefined,
          actor: T.actor || undefined,
          contains: T.contains || undefined,
          limit,
          before,
        });
        setL((e) => [...e, ...t.events]);
      } finally {
        setLoading(false);
      }
    }
  };
  let onClick = () => {
    J();
    setT({
      actor: o.trim(),
      contains: y.trim(),
    });
  };
  return (
    <div>
      <G1
        eyebrow={`Game master`}
        title={`Events`}
        subtitle={`The append-only log behind everything: every event with its scope, actor and payload — private fields included.`}
      />
      <_ className={`mb-4`} padded>
        <div className={`grid gap-3 md:grid-cols-[14rem_12rem_1fr_7rem_auto]`}>
          <X1
            value={n}
            onChange={(e) => {
              J();
              setN(e);
            }}
            options={[
              {
                value: ``,
                label: `every type`,
              },
              ...Q.map((e) => ({
                value: e,
                label: e,
              })),
            ]}
          />
          <input
            value={o}
            onChange={(e) => setO(e.target.value)}
            onKeyDown={(e) => e.key === `Enter` && onClick()}
            placeholder={`actor or id (t03, abuela, v02)`}
            className={`h-9 rounded-lg border border-line-strong bg-base/80 px-3 font-mono text-[13px] text-ink outline-none placeholder:font-sans placeholder:text-faint focus:border-gold/70`}
          />
          <label
            className={`flex h-9 items-center gap-2 rounded-lg border border-line-strong bg-base/80 px-3 focus-within:border-gold/70`}
          >
            <H1 className={`size-3.5 text-faint`} />
            <input
              value={y}
              onChange={(e) => setY(e.target.value)}
              onKeyDown={(e) => e.key === `Enter` && onClick()}
              placeholder={`text inside the payload (Enter)`}
              className={`w-full bg-transparent text-sm text-ink outline-none placeholder:text-faint`}
            />
          </label>
          <X1
            value={D}
            onChange={(e) => {
              J();
              setD(e);
            }}
            options={[`100`, `200`, `500`, `1000`].map((e) => ({
              value: e,
              label: `${e} rows`,
            }))}
          />
          <div className={`flex gap-2`}>
            <I1
              variant={`secondary`}
              icon=<H1 className={`size-4`} />
              onClick={onClick}
            >{`Filter`}</I1>
            <I1
              variant={`ghost`}
              icon=<P1 className={`size-4`} />
              onClick={() => {
                J();
                q.refresh();
              }}
              aria-label={`Reload`}
            />
          </div>
        </div>
        <div className={`mt-3 flex flex-wrap gap-5`}>
          <V1
            size={`sm`}
            checked={A}
            onChange={(e) => {
              J();
              setA(e);
            }}
            label={`Hide ticks`}
          />
          <V1
            size={`sm`}
            checked={N}
            onChange={setN_1}
            label={`One copy per message`}
            description={`a persona message is logged for the public, the team and the admins`}
          />
          <V1
            size={`sm`}
            checked={F}
            onChange={setF}
            label=<span className={`inline-flex items-center gap-1.5`}>
              <F1 className={`size-3.5`} />
              {` Live`}
            </span>
            tone={`gold`}
          />
        </div>
      </_>
      {q.error ? (
        <M1 error={q.error} onRetry={q.refresh} className={`mb-4`} />
      ) : null}
      <_ padded={false} className={`overflow-hidden`}>
        {q.loading && !q.data ? (
          <div className={`p-4`}>
            <Ee lines={10} />
          </div>
        ) : Z.length ? (
          <div className={`overflow-x-auto`}>
            <table className={`bz-table min-w-[900px]`}>
              <thead>
                <tr>
                  <th className={`w-8`} />
                  <th className={`w-16`}>{`Id`}</th>
                  <th className={`w-24`}>{`Tick · time`}</th>
                  <th className={`w-44`}>{`Type`}</th>
                  <th className={`w-24`}>{`Scope`}</th>
                  <th className={`w-32`}>{`Actor`}</th>
                  <th>{`What happened`}</th>
                </tr>
              </thead>
              <tbody>
                {Z.map((ev) => {
                  let isOpen = U.has(ev.id);
                  return (
                    <MComponent
                      key={ev.id}
                      ev={ev}
                      isOpen={isOpen}
                      text={t(ev).text}
                      actor={ev.actor ? e.name(ev.actor) : ``}
                      onToggle={() =>
                        setU((e) => {
                          let t = new Set(e);
                          if (t.has(ev.id)) {
                            t.delete(ev.id);
                          } else {
                            t.add(ev.id);
                          }
                          return t;
                        })
                      }
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <C1
            compact
            title={`No events match`}
            hint={`Loosen the filters, or wait for the game to move.`}
          />
        )}
        <div
          className={`flex items-center justify-between border-t border-line px-4 py-2.5 text-xs text-faint`}
        >
          <span>
            {Z.length}
            {` events`}
            {V.length ? ` · ${V.filter(Y).length} arrived live` : ``}
          </span>
          <I1
            size={`sm`}
            variant={`ghost`}
            loading={loading}
            onClick={() => void te()}
            disabled={!X.length}
          >{`Load older`}</I1>
        </div>
      </_>
    </div>
  );
}
function MComponent({ ev, isOpen, text, actor, onToggle }) {
  return (
    <>
      <tr className={`cursor-pointer`} onClick={onToggle}>
        <td className={`text-faint`}>
          {isOpen ? (
            <O1 className={`size-3.5`} />
          ) : (
            <S1 className={`size-3.5`} />
          )}
        </td>
        <td className={`font-mono text-xs text-faint`}>{ev.id}</td>
        <td className={`whitespace-nowrap font-mono text-xs text-muted`}>
          {`T`}
          {ev.tick}
          {` `}
          <span className={`text-faint`}>
            {`· `}
            {g(ev.t)}
          </span>
        </td>
        <td>
          <span
            className={r(
              `inline-flex max-w-full truncate rounded-md border px-1.5 py-0.5 font-mono text-[11px]`,
              A(ev.type),
            )}
          >
            {ev.type}
          </span>
        </td>
        <td>
          <B1
            tone={
              ev.scope === `admin`
                ? `accent`
                : ev.scope === `public`
                  ? `muted`
                  : `info`
            }
            className={`h-5 px-2 text-[10px]`}
          >
            {ev.scope}
          </B1>
        </td>
        <td className={`truncate text-xs text-muted`}>{actor}</td>
        <td className={`text-sm text-ink`}>
          <span className={`line-clamp-2`}>{text}</span>
        </td>
      </tr>
      {isOpen && (
        <tr>
          <td colSpan={7} className={`bg-base/50`}>
            <div className={`grid gap-3 py-1 lg:grid-cols-2`}>
              <div>
                <div className={`eyebrow mb-1`}>{`payload`}</div>
                <DComponent value={ev.payload} />
              </div>
              <div>
                <div className={`eyebrow mb-1`}>
                  {`private `}
                  {ev.private ? `` : `(none)`}
                </div>
                {ev.private ? (
                  <DComponent value={ev.private} />
                ) : (
                  <p
                    className={`text-xs text-faint`}
                  >{`Nothing private on this event.`}</p>
                )}
                {ev.ts ? (
                  <p className={`mt-2 font-mono text-[11px] text-faint`}>
                    {`wall clock `}
                    {new Date(ev.ts * 1000).toLocaleString(`en-GB`)}
                  </p>
                ) : null}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
export { JComponent as default };
