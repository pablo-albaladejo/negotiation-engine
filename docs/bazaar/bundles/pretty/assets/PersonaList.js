import { i, n, t } from "./jsx-runtime.js";
import { i as i_2, r as r_1, t as A1 } from "./Button.js";
import { t as O1 } from "./arrow-right.js";
import { t as S1 } from "./bot.js";
import { n as C1, t as L1 } from "./shield-alert.js";
import { t as U1 } from "./gift.js";
import { t as D1 } from "./handshake.js";
import { t as F1 } from "./EmptyState.js";
import { a as P1, b, h, i as i_3, s as s_1 } from "./useEvents.js";
import { t as V1 } from "./lightbulb.js";
import { t as Y1 } from "./plus.js";
import { t as B1 } from "./ErrorNote.js";
import { t as X1 } from "./snowflake.js";
import { t as S } from "./LevelBadge.js";
import { t as C } from "./PageHeader.js";
import { t as W1 } from "./PersonaAvatar.js";
import { t as T } from "./Toggle.js";
import { E, F as F_1, G, H, a as K1, l, r as r_2, u as M } from "./index.js";
import { t as N } from "./ConfirmDialog.js";
import {
  c as P,
  d as F,
  i as i_4,
  l as L,
  o as R,
  p as Z1,
  r as r_3,
} from "./hooks.js";
import { _, r as r_4, t as t_2, u } from "./util.js";
import { n as n_2, t as t_3 } from "./unlock.js";
const q = {
  name: `file-down`,
  size: 24,
  node: [
    [
      `path`,
      {
        d: `M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z`,
        key: `1oefj6`,
      },
    ],
    [
      `path`,
      {
        d: `M14 2v5a1 1 0 0 0 1 1h5`,
        key: `wfsgrz`,
      },
    ],
    [
      `path`,
      {
        d: `M12 18v-6`,
        key: `17g6i2`,
      },
    ],
    [
      `path`,
      {
        d: `m9 15 3 3 3-3`,
        key: `1npd3o`,
      },
    ],
  ],
};
q.node;
const J = i_2(q);
const Y = i(n(), 1);
const X = t();
function ZComponent({ open, onClose, personas, onCreated }) {
  let [i, setI] = Y.useState(``);
  let [s, setS] = Y.useState(``);
  let [l, setL] = Y.useState(``);
  let [d, setD] = Y.useState(false);
  let [p, setP] = Y.useState(null);
  let [h, setH] = Y.useState(false);
  let [loading, setLoading] = Y.useState(false);
  let [x, setX] = Y.useState(null);
  Y.useEffect(() => {
    if (!open) {
      return;
    }
    let t = personas[0];
    setI(t?.config.id ?? ``);
    setS(``);
    setL(``);
    setD(false);
    setP(t?.config.level ?? 1);
    setH(false);
    setX(null);
  }, [open, personas]);
  let C = personas.find((e) => e.config.id === i);
  let E = personas.some((e) => e.config.id === l);
  let D = t_2.test(l) && !E;
  return (
    <K1
      open={open}
      onClose={onClose}
      title={`New persona`}
      description={`Starts as a copy of an existing persona — every trait, band, hint and egg — under a new id. Refine it in the editor.`}
      footer=<>
        <A1 variant={`ghost`} onClick={onClose}>{`Cancel`}</A1>
        <A1
          variant={`primary`}
          loading={loading}
          disabled={!C || !D || !s.trim() || p === null}
          onClick={async () => {
            if (C && D && s.trim() && p !== null) {
              setLoading(true);
              setX(null);
              try {
                let config = r_4(C.config);
                config.id = l;
                config.name = s.trim();
                config.level = p;
                config.enabled = h;
                let initials = s
                  .trim()
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((e) => e[0]?.toUpperCase() ?? ``)
                  .join(``);
                config.avatar = {
                  ...config.avatar,
                  initials,
                };
                await s_1.createPersona({
                  config,
                  note: `cloned from ${C.config.id}`,
                });
                onCreated(l);
              } catch (error) {
                setX(error);
              } finally {
                setLoading(false);
              }
            }
          }}
        >{`Create and edit`}</A1>
      </>
    >
      <div className={`flex flex-col gap-4 pb-1`}>
        <R label={`Copy of`}>
          <F
            value={i}
            onChange={setI}
            options={personas.map((e) => ({
              value: e.config.id,
              label: `L${e.config.level} · ${e.config.name}`,
            }))}
          />
        </R>
        <div className={`grid grid-cols-[1fr_7rem] gap-3`}>
          <R label={`Name`}>
            <Z1
              value={s}
              autoFocus
              onChange={(e) => {
                setS(e);
                if (!d) {
                  setL(u(e).replace(/^[^a-z]+/, ``));
                }
              }}
              placeholder={`Tía Lola`}
            />
          </R>
          <R label={`Level`}>
            <L value={p} integer min={1} max={9} onChange={setP} />
          </R>
        </div>
        <R
          label={`Id`}
          hint={`lowercase letters, digits and _ (2–31 characters); it names the YAML file and cannot change later`}
          error={
            l && !t_2.test(l)
              ? `not a valid id`
              : E
                ? `this id exists`
                : undefined
          }
        >
          <Z1
            value={l}
            mono
            onChange={(e) => {
              setL(e);
              setD(true);
            }}
            placeholder={`tia_lola`}
            invalid={!!l && !D}
          />
        </R>
        <T
          checked={h}
          onChange={setH}
          label={h ? `Starts switched on` : `Starts switched off`}
          description={`Off: teams cannot talk to it until you switch it on.`}
        />
        {C && (
          <div
            className={`flex items-center gap-3 rounded-xl border border-line bg-base/50 p-3 text-xs text-muted`}
          >
            <W1
              avatar={C.config.avatar}
              name={s || C.config.name}
              size={`md`}
            />
            <span>
              {`Copies `}
              {C.config.name}
              {`'s `}
              {C.config.trades.sells.length}
              {` sell and `}
              {C.config.trades.buys.length}
              {` buy bands, `}
              {C.config.hints.length}
              {` hints and `}
              {C.config.easter_eggs.length}
              {` eggs.`}
              {C.config.unlock.always
                ? ` Its unlock rule opens it to every team.`
                : ``}
            </span>
          </div>
        )}
        {x ? <B1 error={x} /> : null}
      </div>
    </K1>
  );
}
const Q = [
  `patience`,
  `generosity`,
  `shrewdness`,
  `memory`,
  `strictness`,
  `chattiness`,
];
function TeComponent({ p: p_1, onToggle, toggling, unlockText, teamCount }) {
  let p_1_config = p_1.config;
  let { clock } = l({
    live: false,
  });
  let background = p_1_config.avatar?.color || `#5C6B73`;
  let p_1_stats = p_1.stats;
  let g = Object.values(p_1_stats.eggs).reduce((acc, item) => acc + item, 0);
  let length = Object.keys(p_1_stats.eggs).length;
  let y = Object.values(p_1_stats.strikes).reduce((acc, item) => acc + item, 0);
  let length_1 = Object.keys(p_1_stats.cooloffs).length;
  let length_2 = p_1_config.hints.filter(
    (e) =>
      e.enabled &&
      [`always`, `active`].includes(
        _(e.active_from, e.active_to, clock?.t_hours).state,
      ),
  ).length;
  let T = p_1.versions[p_1.versions.length - 1];
  return (
    <div
      className={r_1(
        `group relative flex flex-col overflow-hidden rounded-[var(--radius-card)] border bg-panel shadow-[var(--shadow-panel)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]`,
        p_1_config.enabled
          ? `border-line hover:border-line-strong`
          : `border-dashed border-line`,
      )}
    >
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-28 opacity-70`}
        style={{
          background: `radial-gradient(420px 120px at 20% 0%, ${background}55, transparent 75%)`,
        }}
        aria-hidden
      />
      <div className={`relative flex items-start gap-4 px-5 pt-5`}>
        <H
          to={`/admin/personas/${p_1_config.id}`}
          className={`shrink-0`}
          aria-label={`Edit ${p_1_config.name}`}
        >
          <W1
            avatar={p_1_config.avatar}
            name={p_1_config.name}
            size={`lg`}
            status={p_1_config.enabled ? undefined : `disabled`}
          />
        </H>
        <div className={`min-w-0 flex-1`}>
          <H to={`/admin/personas/${p_1_config.id}`} className={`block`}>
            <h3 className={`truncate text-2xl text-ink group-hover:text-gold`}>
              {p_1_config.name}
            </h3>
          </H>
          <p className={`truncate text-xs text-muted`}>{p_1_config.title}</p>
          <div className={`mt-2 flex flex-wrap items-center gap-1.5`}>
            <S level={p_1_config.level} showName />
            <M tone={`neutral`} title={n_2[p_1_config.kind]}>
              {p_1_config.kind}
            </M>
          </div>
        </div>
        <div className={`flex flex-col items-end gap-1`}>
          <P
            checked={p_1_config.enabled}
            onChange={() => onToggle(p_1)}
            label={
              p_1_config.enabled
                ? `Switch ${p_1_config.name} off`
                : `Switch ${p_1_config.name} on`
            }
            disabled={toggling}
          />
          <span
            className={`text-[10px] font-semibold uppercase tracking-wider text-faint`}
          >
            {p_1_config.enabled ? `on` : `off`}
          </span>
        </div>
      </div>
      <div className={`relative mt-4 grid grid-cols-3 gap-x-4 gap-y-1.5 px-5`}>
        {Q.map((e) => {
          let t = p_1_config.traits[e] ?? 0;
          return (
            <div key={e} title={`${b[e]} ${t.toFixed(2)}`}>
              <div
                className={`flex justify-between text-[10px] font-semibold uppercase tracking-wider text-faint`}
              >
                <span>{b[e].slice(0, 5)}</span>
                <span className={`font-mono normal-case tracking-normal`}>
                  {t.toFixed(2)}
                </span>
              </div>
              <div
                className={`mt-0.5 h-1.5 overflow-hidden rounded-full bg-line`}
              >
                <div
                  className={`h-full rounded-full`}
                  style={{
                    width: `${t * 100}%`,
                    background,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div
        className={`relative mt-4 grid grid-cols-5 gap-1 border-y border-line bg-base/40 px-3 py-2.5 text-center`}
      >
        <Component
          icon=<D1 className={`size-3.5`} />
          value={p_1_stats.deals}
          label={`deals`}
        />
        <Component
          icon=<F_1 className={`size-3.5`} />
          value={`${p_1_stats.open}/${p_1_stats.threads}`}
          label={`talks`}
        />
        <Component
          icon=<U1 className={`size-3.5`} />
          value={p_1_stats.gifts}
          label={`gifts`}
        />
        <Component
          icon=<C1 className={`size-3.5`} />
          value={g}
          label={`eggs${p_1_config.easter_eggs.length ? ` (${length}/${p_1_config.easter_eggs.length})` : ``}`}
          tone={g ? `gold` : undefined}
        />
        <Component
          icon=<L1 className={`size-3.5`} />
          value={y}
          label={`strikes`}
          tone={y ? `accent` : undefined}
        />
      </div>
      <div className={`relative flex flex-1 flex-col gap-2 px-5 py-3 text-xs`}>
        <div className={`flex flex-wrap items-center gap-1.5`}>
          {p_1.open_to_all ? (
            <M tone={`good`} dot>{`open to all`}</M>
          ) : (
            <M tone={`muted`}>
              {`unlocked by `}
              {p_1.unlocked_teams.length}
              {`/`}
              {teamCount}
            </M>
          )}
          {length_1 > 0 && (
            <M tone={`info`} icon=<X1 className={`size-3`} />>
              {length_1}
              {` cooling off`}
            </M>
          )}
          <M
            tone={length_2 ? `info` : `muted`}
            icon=<V1 className={`size-3`} />
          >
            {length_2}
            {`/`}
            {p_1_config.hints.length}
            {` hints live`}
          </M>
        </div>
        <p className={`leading-snug text-muted`}>{unlockText}</p>
        <div
          className={`mt-auto flex items-center justify-between gap-2 pt-1 text-[11px] text-faint`}
        >
          <span className={`inline-flex items-center gap-1 truncate`}>
            <S1 className={`size-3`} />
            {` `}
            {p_1_config.model.provider}
            {` · `}
            {p_1_config.model.name}
          </span>
          <span className={`shrink-0 font-mono`} title={T?.note}>
            {`v`}
            {p_1.version}
            {T?.note
              ? ` · ${T.note.slice(0, 28)}${T.note.length > 28 ? `…` : ``}`
              : ``}
          </span>
        </div>
      </div>
    </div>
  );
}
function Component({ icon, value, label, tone }) {
  return (
    <div className={`min-w-0`}>
      <div
        className={r_1(
          `flex items-center justify-center gap-1 font-display-num text-lg`,
          tone === `gold`
            ? `text-gold`
            : tone === `accent`
              ? `text-accent`
              : `text-ink`,
        )}
      >
        <span className={`opacity-60`}>{icon}</span>
        {value}
      </div>
      <div
        className={`truncate text-[9px] font-bold uppercase tracking-wider text-faint`}
      >
        {label}
      </div>
    </div>
  );
}
function NeComponent() {
  let e = G();
  let t = r_2();
  let { clock } = l({
    live: false,
  });
  let r = r_3();
  let s = i_3((e) => s_1.personas(e), 8000);
  i_4(
    [`persona.`, `level.unlocked`, `egg.found`, `gift.given`, `settlement`],
    s.refresh,
    {
      throttleMs: 2500,
    },
  );
  let [c, setC] = Y.useState(false);
  let [u, setU] = Y.useState(false);
  let [m, setM] = Y.useState(null);
  let personas = Y.useMemo(() => s.data?.personas ?? [], [s.data]);
  let S = (e) => personas.find((t) => t.config.id === e)?.config.name ?? e;
  let T = Y.useMemo(() => {
    let e = new Map();
    for (let t of personas) {
      e.set(t.config.level, [...(e.get(t.config.level) ?? []), t]);
    }
    return e;
  }, [personas]);
  let D = Y.useMemo(() => {
    let length = Math.max(5, ...personas.map((e) => e.config.level));
    return Array.from(
      {
        length,
      },
      (e, t) => t + 1,
    );
  }, [personas]);
  let onToggle = async (e) => {
    setM(e.config.id);
    try {
      let n = !e.config.enabled;
      let r = await s_1.savePersona(e.config.id, {
        config: {
          ...e.config,
          enabled: n,
        },
        note: n ? `switched on` : `switched off`,
      });
      t.success(
        `${e.config.name} ${n ? `is open for business` : `closed the stall`}`,
        `saved as v${r.version}`,
      );
      s.refresh();
    } catch (error) {
      t.error(error, `Could not switch ${e.config.name}`);
    } finally {
      setM(null);
    }
  };
  return (
    <div>
      <C
        eyebrow={`Game master`}
        title={`Personas`}
        subtitle={`The negotiators teams climb past, level by level. Every trait, price, hint and egg is data: change it here and the persona uses it on its next reply.`}
        actions=<>
          <A1
            variant={`secondary`}
            icon=<J className={`size-4`} />
            onClick={() => setU(true)}
            disabled={!personas.length}
          >{`Write to config files`}</A1>
          <A1
            variant={`primary`}
            icon=<Y1 className={`size-4`} />
            onClick={() => setC(true)}
            disabled={!personas.length}
          >{`New persona`}</A1>
        </>
      />
      {s.error && <B1 error={s.error} onRetry={s.refresh} className={`mb-4`} />}
      {s.loading && !s.data ? (
        <div className={`grid gap-4 md:grid-cols-2 2xl:grid-cols-3`}>
          {Array.from(
            {
              length: 5,
            },
            (e, key) => (
              <P1 key={key} className={`h-80 rounded-2xl`} />
            ),
          )}
        </div>
      ) : personas.length ? (
        <>
          <section
            className={`mb-6 overflow-x-auto rounded-[var(--radius-card)] border border-line bg-panel/70 p-4 shadow-[var(--shadow-panel)]`}
          >
            <div
              className={`eyebrow mb-3`}
            >{`The ladder · how teams climb`}</div>
            <div className={`flex min-w-[760px] items-stretch gap-2`}>
              {D.map((t, r) => {
                let a = h.find((e) => e.level === t);
                let s = T.get(t) ?? [];
                return (
                  <div
                    key={t}
                    className={`flex min-w-0 flex-1 items-stretch gap-2`}
                  >
                    {r > 0 && (
                      <div
                        className={`flex w-6 shrink-0 items-center justify-center text-faint`}
                      >
                        <O1 className={`size-4`} />
                      </div>
                    )}
                    <div
                      className={r_1(
                        `flex min-w-0 flex-1 flex-col gap-2 rounded-xl border p-3`,
                        s.length
                          ? `border-line-strong bg-base/50`
                          : `border-dashed border-line`,
                      )}
                    >
                      <div className={`flex items-baseline gap-2`}>
                        <span
                          className={`font-display text-2xl font-extrabold text-gold`}
                        >
                          {`L`}
                          {t}
                        </span>
                        <span className={`text-sm font-semibold text-ink`}>
                          {a?.name ?? `Level ${t}`}
                        </span>
                      </div>
                      {a?.blurb && (
                        <p className={`text-[11px] leading-snug text-faint`}>
                          {a.blurb}
                        </p>
                      )}
                      <div className={`mt-auto flex flex-col gap-1.5`}>
                        {s.map((t) => (
                          <button
                            key={t.config.id}
                            type={`button`}
                            onClick={() => e(`/admin/personas/${t.config.id}`)}
                            className={`flex min-w-0 items-center gap-2 rounded-lg px-1.5 py-1 text-left hover:bg-raised`}
                            title={t_3(
                              t.config.name,
                              t.config.unlock,
                              S,
                              clock?.t_hours,
                            )}
                          >
                            <W1
                              avatar={t.config.avatar}
                              name={t.config.name}
                              size={`sm`}
                              status={t.config.enabled ? undefined : `disabled`}
                            />
                            <span className={`min-w-0`}>
                              <span
                                className={`block truncate text-xs font-semibold text-ink`}
                              >
                                {t.config.name}
                              </span>
                              <span
                                className={`block truncate text-[10px] text-faint`}
                              >
                                {t.open_to_all
                                  ? `open to all`
                                  : t.config.unlock.early_deals_with
                                    ? `${t.config.unlock.early_min_deals} deals at ${S(t.config.unlock.early_deals_with)}`
                                    : `by hand`}
                                {!t.open_to_all &&
                                t.config.unlock.open_to_all_at
                                  ? ` · all ${t.config.unlock.open_to_all_at}`
                                  : ``}
                              </span>
                            </span>
                          </button>
                        ))}
                        {!s.length && (
                          <span
                            className={`text-[11px] italic text-faint`}
                          >{`nobody here yet`}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
          <div className={`grid gap-4 md:grid-cols-2 2xl:grid-cols-3`}>
            {personas.map((p) => (
              <TeComponent
                key={p.config.id}
                p={p}
                onToggle={onToggle}
                toggling={m === p.config.id}
                unlockText={t_3(
                  p.config.name,
                  p.config.unlock,
                  S,
                  clock?.t_hours,
                )}
                teamCount={r.rows.length}
              />
            ))}
          </div>
        </>
      ) : (
        <F1
          icon=<E className={`size-6`} />
          title={`No personas loaded`}
          hint={`Personas come from config/personas/*.yaml when the server starts.`}
        />
      )}
      <ZComponent
        open={c}
        onClose={() => setC(false)}
        personas={personas}
        onCreated={(n) => {
          setC(false);
          t.gold(`Persona created`, `Refine it here, then switch it on.`);
          e(`/admin/personas/${n}`);
        }}
      />
      <N
        open={u}
        onClose={() => setU(false)}
        title={`Write the live personas to config files?`}
        confirmLabel={`Write files`}
        onConfirm={async () => {
          let e = await s_1.exportPersonas();
          t.success(
            `Wrote ${e.written.length} persona files`,
            `config/personas/*.yaml now match the live game — commit them to keep tonight’s edits.`,
          );
        }}
      >
        <p>
          {`Every persona's live version is written to `}
          <code
            className={`rounded bg-base px-1 font-mono text-xs text-gold`}
          >{`config/personas/<id>.yaml`}</code>
          {` on the server, replacing the files there. Use it to keep the evening's edits: the next server start loads them, and git shows the diff.`}
        </p>
      </N>
    </div>
  );
}
export { NeComponent as default };
