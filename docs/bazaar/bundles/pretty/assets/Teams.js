import { i, n, t } from "./jsx-runtime.js";
import { i as i_1, t as I1 } from "./Cromo.js";
import { i as i_2, r as r_1, t as S1 } from "./Button.js";
import { n as C1, t as L1 } from "./arrow-up.js";
import { t as U1 } from "./award.js";
import { n as D1, t as F1 } from "./IconBtn.js";
import { t as P1 } from "./gift.js";
import { t as M1 } from "./EmptyState.js";
import { A as A_1, M, _, a as V1, s, t as t_2 } from "./useEvents.js";
import { t as X1 } from "./plus.js";
import { t as S } from "./ErrorNote.js";
import { t as C } from "./snowflake.js";
import { t as W1 } from "./sun.js";
import { n as n_2 } from "./catalog.js";
import { t as t_3 } from "./names.js";
import { t as D } from "./KPI.js";
import { t as O } from "./LevelBadge.js";
import { t as K1 } from "./PackCard.js";
import { t as Ee } from "./PageHeader.js";
import { t as Te } from "./Panel.js";
import { t as A } from "./PersonaAvatar.js";
import {
  A as A_2,
  C as C_1,
  D as D_1,
  G as G_1,
  H as H_1,
  K as K_1,
  M as M_2,
  a as F,
  b,
  i as I,
  l,
  r as r_2,
  u as R,
  v,
  y,
} from "./index.js";
import { t as V } from "./ConfirmDialog.js";
import {
  d as H,
  i as i_3,
  l as U,
  n as n_3,
  o as G,
  p as K,
  r as r_3,
} from "./hooks.js";
import { d as d_1 } from "./util.js";
import { t as Ue } from "./OfferView.js";
const q = {
  name: `check`,
  size: 24,
  node: [
    [
      `path`,
      {
        d: `M20 6 9 17l-5-5`,
        key: `1gmf2c`,
      },
    ],
  ],
};
q.node;
const De = i_2(q);
const J = {
  name: `minus`,
  size: 24,
  node: [
    [
      `path`,
      {
        d: `M5 12h14`,
        key: `1ays0h`,
      },
    ],
  ],
};
J.node;
const Fe = i_2(J);
const Y = i(n(), 1);
const X = t();
function ZComponent({ team, keyValue, note }) {
  let [r, setR] = Y.useState(false);
  let a = async () => {
    try {
      await navigator.clipboard.writeText(keyValue);
      setR(true);
      setTimeout(() => setR(false), 2000);
    } catch {}
  };
  return (
    <div className={`flex flex-col gap-3`}>
      <div className={`flex items-center gap-2 text-sm text-ink`}>
        <M className={`size-4 text-gold`} />
        {` Team key for `}
        <b>{team}</b>
      </div>
      <div
        className={`flex items-center gap-2 rounded-xl border border-gold/40 bg-gold/8 p-3`}
      >
        <code
          className={`min-w-0 flex-1 select-all break-all font-mono text-sm text-gold`}
        >
          {keyValue}
        </code>
        <S1
          size={`sm`}
          variant={r ? `secondary` : `primary`}
          icon={
            r ? <De className={`size-3.5`} /> : <D1 className={`size-3.5`} />
          }
          onClick={() => void a()}
        >
          {r ? `Copied` : `Copy`}
        </S1>
      </div>
      <p
        className={`text-xs text-warn`}
      >{`Shown once — the server keeps only a hash. Hand it to the team now; if it is lost, rotate the key.`}</p>
      {note && <p className={`text-xs text-muted`}>{note}</p>}
      <p className={`text-xs text-faint`}>
        {`The team calls the API with the header `}
        <code className={`font-mono text-muted`}>{`X-Team-Key`}</code>
        {`.`}
      </p>
    </div>
  );
}
function PeComponent({ action, onClose, onDone }) {
  return (
    <>
      <MeComponent
        open={action?.kind === `create`}
        onClose={onClose}
        onDone={onDone}
      />
      <HeComponent
        action={action?.kind === `grant` ? action : null}
        onClose={onClose}
        onDone={onDone}
      />
      <GeComponent
        action={action?.kind === `adjust` ? action : null}
        onClose={onClose}
        onDone={onDone}
      />
      <EComponent
        action={action?.kind === `freeze` ? action : null}
        onClose={onClose}
        onDone={onDone}
      />
      <VeComponent
        action={action?.kind === `rotate` ? action : null}
        onClose={onClose}
        onDone={onDone}
      />
    </>
  );
}
function MeComponent({ open, onClose, onDone }) {
  let [r, setR] = Y.useState(``);
  let [a, setA] = Y.useState(``);
  let [c, setC] = Y.useState(false);
  let [u, setU] = Y.useState(null);
  let [f, setF] = Y.useState(null);
  Y.useEffect(() => {
    if (open) {
      setR(``);
      setA(``);
      setU(null);
      setF(null);
    }
  }, [open]);
  let m = async () => {
    setC(true);
    setU(null);
    try {
      let e = await s.createTeam(r.trim(), a.trim());
      setF(e);
      onDone();
    } catch (error) {
      setU(error);
    } finally {
      setC(false);
    }
  };
  return (
    <F
      open={open}
      onClose={onClose}
      dismissable={!f}
      title={f ? `${f.name} is in` : `Create a team`}
      description={
        f
          ? undefined
          : `The team gets the start cash and an equalised starting hand, and Abuela opens for it.`
      }
      footer={
        f ? (
          <S1
            variant={`primary`}
            onClick={onClose}
          >{`Done — I handed over the key`}</S1>
        ) : (
          <>
            <S1 variant={`ghost`} onClick={onClose}>{`Cancel`}</S1>
            <S1
              variant={`primary`}
              loading={c}
              onClick={() => void m()}
            >{`Create team`}</S1>
          </>
        )
      }
    >
      {f ? (
        <ZComponent team={`${f.name} (${f.team})`} keyValue={f.key} />
      ) : (
        <div className={`flex flex-col gap-4 pb-1`}>
          <G
            label={`Team name`}
            hint={`shown on the leaderboard; empty = “Team N”`}
          >
            <K
              value={r}
              onChange={setR}
              placeholder={`Los Gatos de Lavapiés`}
              autoFocus
              onEnter={() => void m()}
            />
          </G>
          <G label={`Members`} hint={`for your records only`}>
            <K value={a} onChange={setA} placeholder={`Ana, Bruno, Carla`} />
          </G>
          {u ? <S error={u} /> : null}
        </div>
      )}
    </F>
  );
}
function HeComponent({ action, onClose, onDone }) {
  let r = r_2();
  let { index } = n_2();
  let [a, setA] = Y.useState(0);
  let [l, setL] = Y.useState({});
  let [d, setD] = Y.useState([]);
  let [p, setP] = Y.useState(`uncommon`);
  let [h, setH] = Y.useState(``);
  let [v, setV] = Y.useState(false);
  let [C, setC] = Y.useState(null);
  Y.useEffect(() => {
    if (action) {
      setA(0);
      setL({});
      setD([]);
      setH(``);
      setC(null);
    }
  }, [action]);
  let options = Y.useMemo(() => {
    let e = _.map((e) => ({
      value: e,
      label: `a random ${e} card`,
    }));
    for (let t of index?.catalog.sets ?? []) {
      for (let n of t.cards) {
        e.push({
          value: n.id,
          label: `${n.id} · ${n.name} (${n.rarity}, ${n.minted}/${n.print_run} minted)`,
        });
      }
    }
    return e;
  }, [index]);
  let packs = Object.entries(l).flatMap(([e, length]) =>
    Array.from(
      {
        length,
      },
      () => e,
    ),
  );
  let disabled = !a && !packs.length && !d.length;
  let k = async () => {
    if (action) {
      setV(true);
      setC(null);
      try {
        await s.grant(action.team.id, {
          cash: a ?? 0,
          packs,
          cards: d,
          reason: h.trim() || `organiser grant`,
        });
        r.gold(
          `Granted to ${action.team.name}`,
          [
            a ? `${index?.symbol ?? `P`}${a}` : ``,
            packs.length ? `${packs.length} pack(s)` : ``,
            d.length ? `${d.length} card(s)` : ``,
          ]
            .filter(Boolean)
            .join(` · `),
        );
        onDone();
        onClose();
      } catch (error) {
        setC(error);
      } finally {
        setV(false);
      }
    }
  };
  return (
    <F
      open={!!action}
      onClose={onClose}
      size={`lg`}
      title={`Grant to ${action?.team.name ?? ``}`}
      description={`Cash, sealed packs or cards, minted fresh and logged as a settlement. Grants never count towards the score unless the game config says so.`}
      footer=<>
        <S1 variant={`ghost`} onClick={onClose}>{`Cancel`}</S1>
        <S1
          variant={`primary`}
          loading={v}
          disabled={disabled}
          onClick={() => void k()}
        >{`Grant`}</S1>
      </>
    >
      <div className={`flex flex-col gap-4 pb-1`}>
        <G label={`Cash`} aside={index?.symbol ?? `P`}>
          <U value={a} integer min={0} max={100000} onChange={setA} />
        </G>
        <div>
          <div className={`eyebrow mb-2`}>{`Packs`}</div>
          <div className={`flex flex-wrap gap-2`}>
            {(index?.catalog.packs ?? []).map((e) => {
              let t = l[e.id] ?? 0;
              return (
                <div
                  key={e.id}
                  className={r_1(
                    `flex items-center gap-2 rounded-xl border px-2.5 py-1.5`,
                    t ? `border-gold/40 bg-gold/8` : `border-line bg-base/50`,
                  )}
                >
                  <span
                    className={`size-3 rounded-sm`}
                    style={{
                      background: e.color,
                    }}
                  />
                  <span className={`text-sm text-ink`}>{e.name}</span>
                  <button
                    type={`button`}
                    className={`rounded p-0.5 text-muted hover:bg-raised hover:text-ink disabled:opacity-30`}
                    disabled={!t}
                    onClick={() =>
                      setL((n) => ({
                        ...n,
                        [e.id]: Math.max(0, t - 1),
                      }))
                    }
                    aria-label={`one ${e.name} less`}
                  >
                    <Fe className={`size-3.5`} />
                  </button>
                  <span
                    className={`w-4 text-center font-mono text-sm text-ink`}
                  >
                    {t}
                  </span>
                  <button
                    type={`button`}
                    className={`rounded p-0.5 text-muted hover:bg-raised hover:text-ink`}
                    onClick={() =>
                      setL((n) => ({
                        ...n,
                        [e.id]: Math.min(20, t + 1),
                      }))
                    }
                    aria-label={`one more ${e.name}`}
                  >
                    <X1 className={`size-3.5`} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
        <div>
          <div className={`eyebrow mb-2`}>{`Cards`}</div>
          <div className={`flex gap-2`}>
            <H value={p} onChange={setP} options={options} />
            <S1
              variant={`secondary`}
              icon=<X1 className={`size-4`} />
              onClick={() => setD((e) => [...e, p])}
            >{`Add`}</S1>
          </div>
          {d.length > 0 && (
            <div className={`mt-2 flex flex-wrap gap-1.5`}>
              {d.map((e, t) => (
                <R
                  key={`${e}-${t}`}
                  tone={_.includes(e) ? e : `neutral`}
                  onRemove={() => setD((e) => e.filter((e, n) => n !== t))}
                >
                  {_.includes(e)
                    ? `random ${e}`
                    : `${e} ${index?.cards.get(e)?.card.name ?? ``}`}
                </R>
              ))}
            </div>
          )}
        </div>
        <G label={`Reason`} hint={`logged with the grant`}>
          <K
            value={h}
            onChange={setH}
            placeholder={`compensation for the 14:05 outage`}
          />
        </G>
        {C ? <S error={C} /> : null}
      </div>
    </F>
  );
}
function GeComponent({ action, onClose, onDone }) {
  let r = r_2();
  let [i, setI] = Y.useState(`penalty_pct`);
  let [c, setC] = Y.useState(10);
  let [u, setU] = Y.useState(`both`);
  let [f, setF] = Y.useState(``);
  let [m, setM] = Y.useState(false);
  let [g, setG] = Y.useState(null);
  Y.useEffect(() => {
    if (action) {
      setI(`penalty_pct`);
      setC(10);
      setU(`both`);
      setF(``);
      setG(null);
    }
  }, [action]);
  let v = c === null || (i === `penalty_pct` && (c <= 0 || c > 100));
  let b = async () => {
    if (action && c !== null) {
      setM(true);
      setG(null);
      try {
        await s.adjust(action.team.id, {
          kind: i,
          amount: c,
          component: u,
          reason: f.trim(),
        });
        r.info(
          `${action.team.name}: ${i === `penalty_pct` ? `−${c}%` : `${c >= 0 ? `+` : ``}${c} points`} on ${u}`,
          `A visible line on the leaderboard; it recomputes now.`,
        );
        onDone();
        onClose();
      } catch (error) {
        setG(error);
      } finally {
        setM(false);
      }
    }
  };
  return (
    <F
      open={!!action}
      onClose={onClose}
      title={`Adjust ${action?.team.name ?? ``}'s score`}
      description={`Every adjustment is a visible line item on the team's leaderboard row, with the reason you give.`}
      footer=<>
        <S1 variant={`ghost`} onClick={onClose}>{`Cancel`}</S1>
        <S1
          variant={i === `penalty_pct` ? `danger` : `primary`}
          loading={m}
          disabled={v || !f.trim()}
          onClick={() => void b()}
        >
          {i === `penalty_pct` ? `Apply penalty` : `Award points`}
        </S1>
      </>
    >
      <div className={`flex flex-col gap-4 pb-1`}>
        <div className={`grid grid-cols-2 gap-2`}>
          {[
            [`penalty_pct`, `Penalty`, `a % off the component this round`],
            [`reward_points`, `Reward`, `points added (negative takes away)`],
          ].map(([e, t, n]) => (
            <button
              key={e}
              type={`button`}
              onClick={() => {
                setI(e);
                setC(e === `penalty_pct` ? 10 : 2);
              }}
              className={r_1(
                `rounded-xl border p-3 text-left transition-colors`,
                i === e
                  ? e === `penalty_pct`
                    ? `border-accent/50 bg-accent/10`
                    : `border-good/50 bg-good/10`
                  : `border-line hover:border-line-strong`,
              )}
            >
              <div
                className={r_1(
                  `font-semibold`,
                  i === e
                    ? e === `penalty_pct`
                      ? `text-accent`
                      : `text-good`
                    : `text-ink`,
                )}
              >
                {t}
              </div>
              <div className={`text-xs text-muted`}>{n}</div>
            </button>
          ))}
        </div>
        <div className={`grid grid-cols-2 gap-3`}>
          <G
            label={i === `penalty_pct` ? `Percent` : `Points`}
            error={
              v
                ? i === `penalty_pct`
                  ? `between 0 and 100`
                  : `a number`
                : undefined
            }
          >
            <U
              value={c}
              min={i === `penalty_pct` ? 0 : -1000}
              max={i === `penalty_pct` ? 100 : 1000}
              step={i === `penalty_pct` ? 5 : 0.5}
              onChange={setC}
              suffix={i === `penalty_pct` ? `%` : `pts`}
            />
          </G>
          <G label={`Component`}>
            <H
              value={u}
              onChange={setU}
              options={[
                {
                  value: `both`,
                  label: `both`,
                },
                {
                  value: `negotiating`,
                  label: `negotiating`,
                },
                {
                  value: `market`,
                  label: `market-making`,
                },
              ]}
            />
          </G>
        </div>
        <G label={`Reason`} hint={`shown next to the line item — required`}>
          <K
            value={f}
            onChange={setF}
            placeholder={`prompt injection against a persona, 3rd time`}
          />
        </G>
        {!!action?.team.adjustments?.length && (
          <div>
            <div className={`eyebrow mb-1.5`}>{`Already on the row`}</div>
            <ul className={`flex flex-col gap-1 text-xs`}>
              {action.team.adjustments.map((e, t) => (
                <li key={t} className={`flex items-center gap-2 text-muted`}>
                  <span
                    className={r_1(
                      `font-mono`,
                      e.points < 0 ? `text-accent` : `text-good`,
                    )}
                  >
                    {e.pct === undefined
                      ? `${e.points >= 0 ? `+` : ``}${e.points}`
                      : `−${e.pct}%`}
                  </span>
                  <span className={`text-faint`}>{e.component}</span>
                  <span className={`truncate`}>{e.reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {g ? <S error={g} /> : null}
      </div>
    </F>
  );
}
function EComponent({ action, onClose, onDone }) {
  let r = r_2();
  let i = action?.team;
  return (
    <V
      open={!!action}
      onClose={onClose}
      title={i?.frozen ? `Thaw ${i?.name}?` : `Freeze ${i?.name}?`}
      confirmLabel={
        i?.frozen ? (
          <>
            <W1 className={`size-4`} />
            {` Thaw`}
          </>
        ) : (
          <>
            <C className={`size-4`} />
            {` Freeze`}
          </>
        )
      }
      tone={i?.frozen ? `primary` : `danger`}
      onConfirm={async () => {
        if (i) {
          await s.freeze(i.id, !i.frozen);
          r.info(
            i.frozen ? `${i.name} can trade again` : `${i.name} is frozen`,
            i.frozen
              ? undefined
              : `Its open offers were cancelled; personas will not answer it.`,
          );
          onDone();
        }
      }}
    >
      <p>
        {i?.frozen
          ? `The team can talk, offer and accept again from the next tick.`
          : `The team can still read, but every write is refused, its open offers are cancelled and personas hold its turns until you thaw it.`}
      </p>
    </V>
  );
}
function VeComponent({ action, onClose, onDone }) {
  let [r, setR] = Y.useState(null);
  let [a, setA] = Y.useState(false);
  let [c, setC] = Y.useState(null);
  Y.useEffect(() => {
    if (action) {
      setR(null);
      setC(null);
    }
  }, [action]);
  let u = action?.team;
  let d = async () => {
    if (u) {
      setA(true);
      setC(null);
      try {
        let e = await s.rotateKey(u.id);
        setR(e.key);
        onDone();
      } catch (error) {
        setC(error);
      } finally {
        setA(false);
      }
    }
  };
  return (
    <F
      open={!!action}
      onClose={onClose}
      dismissable={!r}
      size={`md`}
      title={r ? `New key for ${u?.name}` : `Rotate ${u?.name}'s key?`}
      footer={
        r ? (
          <S1 variant={`primary`} onClick={onClose}>{`Done`}</S1>
        ) : (
          <>
            <S1 variant={`ghost`} onClick={onClose}>{`Cancel`}</S1>
            <S1
              variant={`danger`}
              loading={a}
              onClick={() => void d()}
            >{`Rotate key`}</S1>
          </>
        )
      }
    >
      {r && u ? (
        <ZComponent team={u.name} keyValue={r} />
      ) : (
        <div className={`flex flex-col gap-3 pb-1 text-sm text-muted`}>
          <p>{`The old key stops working at once — the team's agents get 401 until they switch to the new one. Use it when a key leaked or a team lost it.`}</p>
          {c ? <S error={c} /> : null}
        </div>
      )}
    </F>
  );
}
function YeComponent({ teamId, row, onClose, onAction }) {
  let { index } = n_2();
  let l = n_3();
  let d = index?.symbol ?? `P`;
  let f = t_2(
    (t) => {
      if (teamId) {
        return s.team(teamId, t);
      }
      return Promise.resolve(null);
    },
    [teamId],
    {
      enabled: !!teamId,
    },
  );
  i_3(
    [
      `settlement`,
      `admin.`,
      `pack.opened`,
      `persona.strike`,
      `persona.cooloff`,
      `level.unlocked`,
      `badge.awarded`,
    ],
    f.refresh,
    {
      throttleMs: 2000,
      enabled: !!teamId,
      filter: (t) => JSON.stringify(t.payload).includes(`"${teamId}"`),
    },
  );
  let f_data = f.data;
  let x = Y.useMemo(
    () =>
      (f_data?.assets ?? [])
        .filter((e) => e.kind === `card`)
        .sort(
          (e, t) => A_1(t.rarity) - A_1(e.rarity) || e.ref.localeCompare(t.ref),
        ),
    [f_data],
  );
  let E = (f_data?.assets ?? []).filter((e) => e.kind === `pack`);
  let team = {
    id: teamId ?? ``,
    name: f_data?.name ?? row?.name ?? teamId ?? ``,
    frozen: f_data?.frozen ?? row?.frozen ?? false,
    adjustments: row?.adjustments,
  };
  return (
    <I
      open={!!teamId}
      onClose={onClose}
      width={`min(820px, 100vw)`}
      title=<span className={`flex items-center gap-3`}>
        {team.name}
        {f_data && <O level={f_data.level} showName size={`md`} />}
        {team.frozen && (
          <R tone={`info`} icon=<C className={`size-3`} />>{`frozen`}</R>
        )}
      </span>
      description={
        row
          ? `#${row.rank ?? `—`} · score ${y(row.score ?? 0, 2)} · ${teamId}${row.members ? ` · ${row.members}` : ``}`
          : (teamId ?? undefined)
      }
      footer=<>
        <S1
          size={`sm`}
          variant={`secondary`}
          icon=<P1 className={`size-3.5`} />
          onClick={() =>
            onAction({
              kind: `grant`,
              team,
            })
          }
        >{`Grant`}</S1>
        <S1
          size={`sm`}
          variant={`secondary`}
          icon=<M_2 className={`size-3.5`} />
          onClick={() =>
            onAction({
              kind: `adjust`,
              team,
            })
          }
        >{`Adjust score`}</S1>
        <S1
          size={`sm`}
          variant={team.frozen ? `primary` : `danger`}
          icon={
            team.frozen ? (
              <W1 className={`size-3.5`} />
            ) : (
              <C className={`size-3.5`} />
            )
          }
          onClick={() =>
            onAction({
              kind: `freeze`,
              team,
            })
          }
        >
          {team.frozen ? `Thaw` : `Freeze`}
        </S1>
        <S1
          size={`sm`}
          variant={`ghost`}
          icon=<M className={`size-3.5`} />
          onClick={() =>
            onAction({
              kind: `rotate`,
              team,
            })
          }
        >{`Rotate key`}</S1>
      </>
    >
      {f.error ? <S error={f.error} onRetry={f.refresh} /> : null}
      {f_data ? (
        <div className={`flex flex-col gap-6`}>
          <div className={`grid grid-cols-2 gap-2 sm:grid-cols-4`}>
            <QComponent
              label={`cash`}
              value={v(f_data.cash, {
                symbol: d,
              })}
            />
            <QComponent
              label={`collection (own eyes)`}
              value={v(f_data.collection_value, {
                symbol: d,
                decimals: 1,
              })}
            />
            <QComponent
              label={`worth`}
              value={v(f_data.worth, {
                symbol: d,
                decimals: 1,
              })}
              tone={`gold`}
            />
            <QComponent
              label={`album`}
              value={`${f_data.album.filled}/${f_data.album.slots}`}
            />
          </div>
          {(f_data.badges.length > 0 || !!row?.adjustments?.length) && (
            <div className={`flex flex-wrap gap-1.5`}>
              {f_data.badges.map((e) => (
                <R key={e} tone={`gold`} icon=<U1 className={`size-3`} />>
                  {e}
                </R>
              ))}
              {row?.adjustments?.map((e, t) => (
                <R
                  key={t}
                  tone={e.points < 0 ? `accent` : `good`}
                  title={e.reason}
                >
                  {e.pct === undefined ? C_1(e.points, 1) : `−${e.pct}%`}
                  {` `}
                  {e.component}
                  {` · `}
                  {e.reason}
                </R>
              ))}
            </div>
          )}
          <section>
            <h4
              className={`eyebrow mb-2`}
            >{`Private set affinities · album pages`}</h4>
            <div className={`grid gap-2 sm:grid-cols-2`}>
              {f_data.album.pages.map((e) => {
                let t = index?.sets.get(e.set);
                let n = f_data.affinity[e.set] ?? 1;
                return (
                  <div
                    key={e.set}
                    className={`rounded-xl border border-line bg-base/50 px-3 py-2`}
                  >
                    <div className={`flex items-center gap-2 text-sm`}>
                      <span
                        className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold text-night`}
                        style={{
                          background: t?.color ?? `#888`,
                        }}
                      >
                        {e.set}
                      </span>
                      <span className={`min-w-0 flex-1 truncate text-ink`}>
                        {e.name}
                      </span>
                      <span
                        className={r_1(
                          `font-mono text-xs`,
                          n >= 1.2
                            ? `text-gold`
                            : n < 0.8
                              ? `text-faint`
                              : `text-muted`,
                        )}
                        title={`how much this team values the set (private)`}
                      >
                        {`×`}
                        {n}
                      </span>
                    </div>
                    <div className={`mt-1.5 flex items-center gap-2`}>
                      <div
                        className={`h-1.5 flex-1 overflow-hidden rounded-full bg-line`}
                      >
                        <div
                          className={`h-full rounded-full`}
                          style={{
                            width: `${(e.have / Math.max(1, e.of)) * 100}%`,
                            background: t?.color ?? `#888`,
                          }}
                        />
                      </div>
                      <span className={`font-mono text-[11px] text-muted`}>
                        {e.have}
                        {`/`}
                        {e.of}
                      </span>
                      {e.complete && <R tone={`good`}>{`page`}</R>}
                      {e.master && <R tone={`gold`}>{`master`}</R>}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
          <section>
            <h4 className={`eyebrow mb-2`}>
              {`Holdings · `}
              {x.length}
              {` cards · `}
              {E.length}
              {` sealed packs `}
              <span
                className={`normal-case tracking-normal text-faint`}
              >{`— chip = what one copy is worth to this team`}</span>
            </h4>
            {!x.length && !E.length ? (
              <M1
                compact
                title={`Empty-handed`}
                hint={`No cards or packs right now.`}
              />
            ) : (
              <div className={`flex flex-wrap gap-2.5`}>
                {E.map((e) => {
                  let t = index?.packs.get(e.ref);
                  return (
                    <div
                      key={e.id}
                      className={`flex flex-col items-center gap-1`}
                      title={`pack #${e.id} · value to the team ${v(
                        e.your_value,
                        {
                          symbol: d,
                          decimals: 1,
                        },
                      )}`}
                    >
                      <K1
                        name={e.name}
                        color={t?.color}
                        odds={t?.slots}
                        serial={e.serial}
                        size={`sm`}
                        currency={d}
                      />
                      <span className={`font-mono text-[10px] text-gold`}>
                        {v(e.your_value, {
                          symbol: d,
                          decimals: 1,
                        })}
                      </span>
                    </div>
                  );
                })}
                {x.map((e) => (
                  <H_1
                    key={e.id}
                    to={`/admin/cards/${e.id}`}
                    title={`provenance of #${e.id}`}
                  >
                    <I1
                      {...i_1(e.ref, index, {
                        serial: e.serial,
                        printRun: e.print_run,
                        yourValue: e.your_value,
                        currency: d,
                      })}
                      size={`sm`}
                    />
                  </H_1>
                ))}
              </div>
            )}
          </section>
          <section>
            <h4 className={`eyebrow mb-2`}>
              {`Negotiations · `}
              {f_data.threads.length}
            </h4>
            {f_data.threads.length ? (
              <div
                className={`flex flex-col divide-y divide-line/60 rounded-xl border border-line`}
              >
                {[...f_data.threads].reverse().map((e) => {
                  let t = l.info(e.with);
                  return (
                    <H_1
                      key={e.id}
                      to={`/admin/threads/${e.id}`}
                      className={`flex items-center gap-3 px-3 py-2 text-sm hover:bg-raised/50`}
                    >
                      <span className={`font-mono text-[11px] text-faint`}>
                        {`#`}
                        {e.id}
                      </span>
                      {t?.kind === `persona` ? (
                        <A avatar={t.avatar} name={t.name} size={`xs`} />
                      ) : null}
                      <span className={`min-w-0 flex-1 truncate text-ink`}>
                        {l.name(e.with)}
                        {` `}
                        {e.item && (
                          <span className={`text-muted`}>
                            {`· `}
                            {e.item}
                          </span>
                        )}
                      </span>
                      <span className={`text-[11px] text-faint`}>
                        {e.messages}
                        {` msgs`}
                      </span>
                      <Ue
                        status={
                          e.status === `deal`
                            ? `settled`
                            : e.status === `open`
                              ? `open`
                              : `cancelled`
                        }
                      />
                      <span
                        className={`w-12 text-right text-[11px] text-muted`}
                      >
                        {e.status}
                      </span>
                    </H_1>
                  );
                })}
              </div>
            ) : (
              <p className={`text-sm text-faint`}>{`No negotiations yet.`}</p>
            )}
          </section>
          <section>
            <h4 className={`eyebrow mb-2`}>
              {`Settlements · surplus earned by `}
              {team.name}
            </h4>
            {f_data.settlements.length ? (
              <div className={`overflow-x-auto rounded-xl border border-line`}>
                <table className={`bz-table`}>
                  <thead>
                    <tr>
                      <th>{`Tick`}</th>
                      <th>{`Kind`}</th>
                      <th>{`With`}</th>
                      <th>{`Items`}</th>
                      <th className={`num-cell`}>{`Price`}</th>
                      <th className={`num-cell`}>{`Surplus`}</th>
                      <th className={`num-cell`}>{`Luck`}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...f_data.settlements].reverse().map((t) => {
                      let n =
                        t.parties.find((t) => t !== teamId) ?? t.persona ?? ``;
                      let r = t.surplus?.[teamId ?? ``] ?? 0;
                      let i = t.luck?.[teamId ?? ``];
                      return (
                        <tr key={t.settlement}>
                          <td className={`font-mono text-xs text-faint`}>
                            {`T`}
                            {t.tick}
                          </td>
                          <td>
                            <R
                              tone={
                                t.kind === `trade` || t.kind === `match`
                                  ? `good`
                                  : t.kind === `pack_open`
                                    ? `neutral`
                                    : `gold`
                              }
                            >
                              {t.kind}
                            </R>
                          </td>
                          <td className={`text-xs text-muted`}>
                            {n ? l.name(n) : `—`}
                          </td>
                          <td
                            className={`max-w-[16rem] truncate text-xs text-ink`}
                            title={t.items.map((e) => e.name).join(`, `)}
                          >
                            {t.items.map((e) => e.name).join(`, `) || `—`}
                          </td>
                          <td className={`num-cell font-mono text-xs`}>
                            {t.price
                              ? v(t.price, {
                                  symbol: d,
                                })
                              : `—`}
                          </td>
                          <td
                            className={r_1(
                              `num-cell font-mono text-xs`,
                              r > 0
                                ? `text-good`
                                : r < 0
                                  ? `text-accent`
                                  : `text-faint`,
                            )}
                          >
                            {C_1(r, 1)}
                          </td>
                          <td
                            className={`num-cell font-mono text-xs text-muted`}
                          >
                            {i === undefined ? `` : C_1(i, 1)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className={`text-sm text-faint`}>{`Nothing settled yet.`}</p>
            )}
          </section>
          <section className={`grid gap-3 sm:grid-cols-2`}>
            <div>
              <h4 className={`eyebrow mb-2`}>{`Strikes by persona`}</h4>
              {Object.entries(f_data.strikes).filter(([, e]) => e > 0)
                .length ? (
                <div className={`flex flex-wrap gap-1.5`}>
                  {Object.entries(f_data.strikes)
                    .filter(([, e]) => e > 0)
                    .map(([e, t]) => (
                      <R key={e} tone={`warn`}>
                        {l.name(e)}
                        {` · `}
                        {t}
                      </R>
                    ))}
                </div>
              ) : (
                <p className={`text-sm text-faint`}>{`Clean record.`}</p>
              )}
            </div>
            <div>
              <h4 className={`eyebrow mb-2`}>{`Cooling off`}</h4>
              {Object.keys(f_data.cooloff).length ? (
                <div className={`flex flex-wrap gap-1.5`}>
                  {Object.entries(f_data.cooloff).map(([e, t]) => (
                    <R key={e} tone={`info`} icon=<C className={`size-3`} />>
                      {l.name(e)}
                      {` until T`}
                      {t}
                    </R>
                  ))}
                </div>
              ) : (
                <p className={`text-sm text-faint`}>{`Welcome everywhere.`}</p>
              )}
            </div>
          </section>
        </div>
      ) : (
        <div className={`flex flex-col gap-3`}>
          <V1 className={`h-20`} />
          <V1 className={`h-48`} />
        </div>
      )}
    </I>
  );
}
function QComponent({ label, value, tone }) {
  return (
    <div className={`rounded-xl border border-line bg-base/50 px-3 py-2`}>
      <div
        className={r_1(
          `font-display-num text-2xl`,
          tone === `gold` ? `text-gold` : `text-ink`,
        )}
      >
        {value}
      </div>
      <div
        className={`text-[10px] font-bold uppercase tracking-wider text-faint`}
      >
        {label}
      </div>
    </div>
  );
}
const be = {
  rank: (e) => e.rank ?? 999,
  name: (e) => e.name.toLowerCase(),
  score: (e) => e.score ?? 0,
  negotiating: (e) => e.negotiating ?? 0,
  duels: (e) => e.duel_points ?? 0,
  ladder: (e) => e.ladder_points ?? 0,
  trades: (e) => e.neg_points ?? 0,
  market: (e) => e.market ?? 0,
  bench: (e) => e.bench_points ?? -1,
  benchEff: (e) => e.bench_efficiency ?? -1,
  organic: (e) => e.mm_points ?? 0,
  level: (e) => e.level,
  cash: (e) => e.cash,
  worth: (e) => e.worth ?? 0,
  album: (e) => (e.album_filled ?? 0) / Math.max(1, e.album_slots ?? 1),
  deals: (e) => e.deals ?? 0,
  luck: (e) => e.luck ?? 0,
  seen: (e) => e.last_seen_tick,
};
function XeComponent() {
  let { id } = K_1();
  let t = G_1();
  let { index } = n_2();
  let { clock } = l({
    live: false,
  });
  let i = t_3();
  let a = r_3();
  i_3(
    [
      `settlement`,
      `admin.`,
      `team.`,
      `level.unlocked`,
      `pack.opened`,
      `badge.awarded`,
      `venue.`,
      `round.`,
    ],
    a.refresh,
    {
      throttleMs: 2000,
    },
  );
  let [d, setD] = Y.useState({
    key: `rank`,
    dir: 1,
  });
  let [action, setAction] = Y.useState(null);
  let symbol = index?.symbol ?? `P`;
  let k = Y.useMemo(() => {
    let e = be[d.key];
    return [...a.rows].sort((t, n) => {
      let r = e(t);
      let i = e(n);
      return (r < i ? -1 : +(r > i)) * d.dir;
    });
  }, [a.rows, d]);
  let A = Math.max(1, ...a.rows.map((e) => e.score ?? 0));
  let length = a.rows.filter((e) => e.frozen).length;
  let F = a.rows.reduce((acc, row_1) => acc + row_1.cash, 0);
  let I = a.rows.reduce((acc, row_1) => acc + (row_1.worth ?? 0), 0);
  let L = clock ? Math.max(1, Math.round(120 / clock.tick_seconds)) : 24;
  let VComponent = (e, t, className, r = {}) => (
    <th className={className} title={r.title} rowSpan={r.rowSpan}>
      <button
        type={`button`}
        onClick={() =>
          setD((t) => ({
            key: e,
            dir: t.key === e ? -t.dir : e === `name` || e === `rank` ? 1 : -1,
          }))
        }
        className={r_1(
          `inline-flex items-center gap-1 whitespace-nowrap uppercase tracking-[0.12em] hover:text-ink`,
          d.key === e && `text-gold`,
        )}
      >
        {t}
        {d.key === e &&
          (d.dir === 1 ? (
            <L1 className={`size-3`} />
          ) : (
            <C1 className={`size-3`} />
          ))}
      </button>
    </th>
  );
  let H = {
    rowSpan: 2,
  };
  let onDone = () => {
    a.refresh();
    i.refresh();
  };
  let row = id ? a.rows.find((t) => t.id === id) : undefined;
  return (
    <div>
      <Ee
        eyebrow={`Game master`}
        title={`Teams`}
        subtitle={`The live leaderboard with the private numbers. Grants, penalties and freezes are visible line items — every action is logged.`}
        actions=<S1
          variant={`primary`}
          icon=<X1 className={`size-4`} />
          onClick={() =>
            setAction({
              kind: `create`,
            })
          }
        >{`Create team`}</S1>
      />
      {a.error && (
        <S
          error={a.error}
          onRetry={() => void a.refresh()}
          className={`mb-4`}
        />
      )}
      <div className={`mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4`}>
        <D
          label={`Teams`}
          value={a.rows.length}
          icon=<D_1 className={`size-4`} />
          hint={`${a.rows.filter((e) => clock && clock.tick - e.last_seen_tick <= L).length} active in the last 2 min`}
        />
        <D
          label={`Cash in play`}
          value={F}
          format={(e) =>
            v(e, {
              symbol,
              compact: true,
            })
          }
          hint={`all teams`}
        />
        <D
          label={`Total worth`}
          value={I}
          format={(e) =>
            v(e, {
              symbol,
              compact: true,
            })
          }
          tone={`gold`}
          hint={`cash + collections in each team's own eyes`}
        />
        <D
          label={`Frozen`}
          value={length}
          icon=<C className={`size-4`} />
          tone={length ? `info` : `default`}
          hint={length ? `cannot trade until thawed` : `nobody on ice`}
        />
      </div>
      {a.rows.length === 0 && !a.ready ? (
        <V1 className={`h-64 rounded-2xl`} />
      ) : a.rows.length ? (
        <Te padded={false} className={`overflow-hidden`}>
          <div className={`overflow-x-auto`}>
            <table className={`bz-table min-w-[1400px]`}>
              <thead>
                <tr>
                  {VComponent(`rank`, `#`, `w-12`, H)}
                  {VComponent(`name`, `Team`, `bz-sticky-l`, H)}
                  {VComponent(`score`, `Score`, `w-40`, H)}
                  <th
                    colSpan={4}
                    className={`border-b-info/40! pb-1! text-center! text-info!`}
                    title={`negotiating = duels + persona ladder + team-to-team trades (weights in game.yaml scoring)`}
                  >{`Negotiating`}</th>
                  <th
                    colSpan={4}
                    className={`border-b-good/40! pb-1! text-center! text-good!`}
                    title={`market-making = the Market Test + organic market-making on the team's own venue`}
                  >{`Market-making`}</th>
                  {VComponent(`level`, `Level`, undefined, H)}
                  {VComponent(`cash`, `Cash`, `num-cell`, H)}
                  {VComponent(`worth`, `Worth`, `num-cell`, H)}
                  {VComponent(`album`, `Album`, `w-32`, H)}
                  {VComponent(`deals`, `Deals`, `num-cell`, H)}
                  {VComponent(`luck`, `Luck`, `num-cell`, H)}
                  {VComponent(`seen`, `Last seen`, undefined, H)}
                  <th
                    rowSpan={2}
                    className={`bz-sticky-r w-32 text-right`}
                  >{`Actions`}</th>
                </tr>
                <tr>
                  {VComponent(`negotiating`, `Neg.`, `num-cell`, {
                    title: `negotiating points in the score (0 to its weight, all rounds weighted)`,
                  })}
                  {VComponent(`duels`, `Duels`, `num-cell`, {
                    title: `this round: summed share of the pie over scored duels (0–1 each; practice excluded)`,
                  })}
                  {VComponent(`ladder`, `Ladder`, `num-cell`, {
                    title: `this round: persona ladder, the best deal shares per persona level weighted by level (0–1)`,
                  })}
                  {VComponent(`trades`, `Trades`, `num-cell`, {
                    title: `this round: private-value surplus from team-to-team trades, capped per trade and per counterparty`,
                  })}
                  {VComponent(`market`, `Market`, `num-cell`, {
                    title: `market-making points in the score (0 to its weight, all rounds weighted)`,
                  })}
                  {VComponent(`bench`, `Bench`, `num-cell`, {
                    title: `this round: the Market Test score 0–1 (0.5 = as good as the free auto stall, 1 = the top-three mean)`,
                  })}
                  {VComponent(`benchEff`, `Eff.`, `num-cell`, {
                    title: `this round: the best venue's bench efficiency, realised ÷ feasible gains`,
                  })}
                  {VComponent(`organic`, `Organic`, `num-cell`, {
                    title: `this round: √ of the pair-capped value created on the team's own venue between other teams`,
                  })}
                </tr>
              </thead>
              <tbody>
                {k.map((n) => {
                  let team = {
                    id: n.id,
                    name: n.name,
                    frozen: n.frozen,
                    adjustments: n.adjustments,
                  };
                  let a = clock ? clock.tick - n.last_seen_tick : null;
                  return (
                    <tr
                      key={n.id}
                      data-selected={id === n.id || undefined}
                      className={r_1(
                        `cursor-pointer`,
                        n.frozen && `[&>td>*]:opacity-70`,
                      )}
                      onClick={() => t(`/admin/teams/${n.id}`)}
                    >
                      <td>
                        <span
                          className={r_1(
                            `font-display text-xl font-extrabold`,
                            n.rank === 1
                              ? `text-gold`
                              : n.rank && n.rank <= 3
                                ? `text-ink`
                                : `text-faint`,
                          )}
                        >
                          {n.rank ?? `—`}
                        </span>
                      </td>
                      <td className={`bz-sticky-l`}>
                        <div className={`flex items-center gap-2`}>
                          <span
                            className={`whitespace-nowrap font-semibold text-ink`}
                          >
                            {n.name}
                          </span>
                          {n.frozen && (
                            <C
                              className={`size-3.5 text-info`}
                              aria-label={`frozen`}
                            />
                          )}
                          {n.venue && (
                            <A_2
                              className={`size-3.5 text-good`}
                              aria-label={`runs venue ${n.venue}`}
                            />
                          )}
                        </div>
                        <div
                          className={`mt-0.5 flex flex-wrap items-center gap-1`}
                        >
                          <span className={`font-mono text-[10px] text-faint`}>
                            {n.id}
                          </span>
                          {n.badges?.map((e) => (
                            <span
                              key={e}
                              className={`inline-flex items-center gap-0.5 rounded bg-gold/12 px-1 text-[10px] font-semibold text-gold`}
                            >
                              <U1 className={`size-2.5`} />
                              {e}
                            </span>
                          ))}
                          {n.adjustments?.map((e, t) => (
                            <span
                              key={t}
                              title={e.reason}
                              className={r_1(
                                `rounded px-1 font-mono text-[10px]`,
                                e.points < 0
                                  ? `bg-accent/12 text-accent`
                                  : `bg-good/12 text-good`,
                              )}
                            >
                              {e.pct === undefined
                                ? C_1(e.points, 1)
                                : `−${e.pct}%`}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <div className={`flex items-center gap-2`}>
                          <span
                            className={`w-12 text-right font-display-num text-lg text-ink`}
                          >
                            {y(n.score ?? 0, 1)}
                          </span>
                          <div
                            className={`flex h-2 min-w-16 flex-1 overflow-hidden rounded-full bg-line`}
                            title={`negotiating ${y(n.negotiating ?? 0, 2)} · market ${y(n.market ?? 0, 2)}`}
                          >
                            <div
                              className={`h-full bg-info`}
                              style={{
                                width: `${((n.negotiating ?? 0) / A) * 100}%`,
                              }}
                            />
                            <div
                              className={`h-full bg-good`}
                              style={{
                                width: `${((n.market ?? 0) / A) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td
                        className={`num-cell font-mono text-xs font-semibold text-info`}
                      >
                        {y(n.negotiating ?? 0, 1)}
                      </td>
                      <Component value={n.duel_points} decimals={2} />
                      <Component value={n.ladder_points} decimals={2} />
                      <Component value={n.neg_points} decimals={1} />
                      <td
                        className={`num-cell border-l border-l-line/60 font-mono text-xs font-semibold text-good`}
                      >
                        {y(n.market ?? 0, 1)}
                      </td>
                      <Component
                        value={n.bench_points}
                        decimals={2}
                        empty={`no bench yet this round`}
                      />
                      <Component
                        value={n.bench_efficiency}
                        format={(e) => b(e)}
                        empty={`no bench yet this round`}
                      />
                      <Component value={n.mm_points} decimals={1} />
                      <td>
                        <O level={n.level} />
                      </td>
                      <td className={`num-cell font-mono text-xs`}>
                        {v(n.cash, {
                          symbol,
                        })}
                      </td>
                      <td className={`num-cell font-mono text-xs text-gold`}>
                        {v(n.worth, {
                          symbol,
                        })}
                      </td>
                      <td>
                        <div
                          className={`flex items-center gap-2`}
                          title={`${n.album_filled}/${n.album_slots} page slots · ${n.pages_complete} pages complete`}
                        >
                          <div
                            className={`h-1.5 min-w-14 flex-1 overflow-hidden rounded-full bg-line`}
                          >
                            <div
                              className={`h-full rounded-full bg-gold`}
                              style={{
                                width: `${((n.album_filled ?? 0) / Math.max(1, n.album_slots ?? 1)) * 100}%`,
                              }}
                            />
                          </div>
                          <span className={`font-mono text-[11px] text-muted`}>
                            {n.album_filled}
                            {`/`}
                            {n.album_slots}
                          </span>
                          {!!n.pages_complete && (
                            <R tone={`good`}>
                              {n.pages_complete}
                              {`p`}
                            </R>
                          )}
                        </div>
                      </td>
                      <td className={`num-cell font-mono text-xs`}>
                        {n.deals ?? 0}
                      </td>
                      <td
                        className={r_1(
                          `num-cell font-mono text-xs`,
                          (n.luck ?? 0) > 0
                            ? `text-good`
                            : (n.luck ?? 0) < 0
                              ? `text-accent`
                              : `text-faint`,
                        )}
                        title={`pack luck vs expected book`}
                      >
                        {C_1(n.luck ?? 0, 0)}
                      </td>
                      <td
                        className={r_1(
                          `whitespace-nowrap text-xs`,
                          a !== null && a <= L ? `text-good` : `text-faint`,
                        )}
                      >
                        {d_1(
                          n.last_seen_tick,
                          clock?.tick,
                          clock?.tick_seconds,
                        )}
                      </td>
                      <td
                        className={`bz-sticky-r`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className={`flex items-center justify-end`}>
                          <F1
                            label={`Grant to ${n.name}`}
                            onClick={() =>
                              setAction({
                                kind: `grant`,
                                team,
                              })
                            }
                          >
                            <P1 className={`size-4`} />
                          </F1>
                          <F1
                            label={`Adjust ${n.name}'s score`}
                            onClick={() =>
                              setAction({
                                kind: `adjust`,
                                team,
                              })
                            }
                          >
                            <M_2 className={`size-4`} />
                          </F1>
                          <F1
                            label={
                              n.frozen ? `Thaw ${n.name}` : `Freeze ${n.name}`
                            }
                            onClick={() =>
                              setAction({
                                kind: `freeze`,
                                team,
                              })
                            }
                            danger={!n.frozen}
                          >
                            {n.frozen ? (
                              <W1 className={`size-4`} />
                            ) : (
                              <C className={`size-4`} />
                            )}
                          </F1>
                          <F1
                            label={`Rotate ${n.name}'s key`}
                            onClick={() =>
                              setAction({
                                kind: `rotate`,
                                team,
                              })
                            }
                          >
                            <M className={`size-4`} />
                          </F1>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p
            className={`border-t border-line px-4 py-2.5 text-[11px] leading-relaxed text-faint`}
          >
            <span
              className={`font-semibold text-info`}
            >{`Duels · Ladder · Trades`}</span>
            {` and `}
            <span
              className={`font-semibold text-good`}
            >{`Bench · Eff. · Organic`}</span>
            {` are the raw parts of the current round`}
            {clock ? ` (round ${clock.round})` : ``}
            {`; Neg. and Market are what they add up to in the score, normalised to the top three and weighted over rounds. Hover a heading for what it counts.`}
          </p>
        </Te>
      ) : (
        <M1
          icon=<D_1 className={`size-6`} />
          title={`No teams yet`}
          hint={`Create the first one — its key is shown once.`}
          action=<S1
            variant={`primary`}
            onClick={() =>
              setAction({
                kind: `create`,
              })
            }
          >{`Create team`}</S1>
        />
      )}
      <YeComponent
        teamId={id ?? null}
        row={row}
        onClose={() => t(`/admin/teams`)}
        onAction={setAction}
      />
      <PeComponent
        action={action}
        onClose={() => setAction(null)}
        onDone={onDone}
      />
    </div>
  );
}
function Component({ value, decimals = 1, format, empty }) {
  if (value == null) {
    return (
      <td
        className={`num-cell font-mono text-xs text-faint`}
        title={empty}
      >{`—`}</td>
    );
  }
  return (
    <td
      className={r_1(
        `num-cell font-mono text-xs`,
        value ? `text-ink/85` : `text-faint`,
      )}
    >
      {format ? format(value) : y(value, decimals)}
    </td>
  );
}
export { XeComponent as default };
