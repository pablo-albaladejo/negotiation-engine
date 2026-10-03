import { i, n, t } from "./jsx-runtime-CU3EbJiN.js";
import { r } from "./Button-DIaWEsZ9.js";
import { t as I1 } from "./eye-off-Bio-uKSw.js";
import { t as A1 } from "./eye-NDS9hpL0.js";
import { t as O1 } from "./EmptyState-BxhxbZPA.js";
import { a as S1, c, i as i_1, s, t as t_2 } from "./useEvents-BpJ5PfZT.js";
import { t as F1 } from "./ErrorNote-Ca3ig8px.js";
import { t as P1 } from "./search-LtN31357.js";
import { n as n_2 } from "./catalog-C4CNN-Mb.js";
import { t as H1 } from "./Sparkline-0X5dHX-k.js";
import { t as G1 } from "./PageHeader-B1UyPTkh.js";
import { t as _ } from "./Panel-DtYcp5Ol.js";
import { t as V1 } from "./PersonaAvatar-pfo-WxM7.js";
import { t as Y } from "./Toggle-B3ShqYPV.js";
import {
  A,
  F as F_1,
  G as G_1,
  H,
  K as K_1,
  l,
  q as q_1,
  u as D,
  v,
} from "./index-B_RfsMCE.js";
import { d as K1, i as i_2, n as n_3, r as r_1 } from "./hooks-BX-dyw4g.js";
import { d } from "./util-CFqlaVVI.js";
import { n as P, r as F, t as I } from "./Conversation-qXKH7jXc.js";
import { n as L } from "./OfferView-C4dF4qTy.js";
const R = i(n(), 1);
const z = t();
const B = {
  open: `info`,
  deal: `good`,
  walked: `warn`,
  closed: `muted`,
  cooloff: `accent`,
};
function VComponent({ thread, error, loading, onRetry }) {
  let { index } = n_2();
  let l = n_3();
  let [u, setU] = R.useState(true);
  let symbol = index?.symbol ?? `P`;
  let g = thread ? l.info(thread.with) : undefined;
  let _ = thread?.kind === `persona`;
  let x = thread?.state?.terms ?? null;
  let S = R.useMemo(
    () =>
      (thread?.state?.team_prices ?? []).map(Number).filter(Number.isFinite),
    [thread],
  );
  if (error && !thread) {
    return <F1 error={error} onRetry={onRetry} />;
  }
  if (thread) {
    return (
      <div className={`flex h-full min-h-0 flex-col`}>
        <div
          className={`flex flex-wrap items-start gap-3 border-b border-line pb-3`}
        >
          {_ && g ? <V1 avatar={g.avatar} name={g.name} size={`md`} /> : null}
          <div className={`min-w-0 flex-1`}>
            <h2 className={`text-2xl text-ink`}>
              <H
                to={`/admin/teams/${thread.team}`}
                className={`hover:text-info`}
              >
                {l.name(thread.team)}
              </H>
              <span className={`mx-2 text-faint`}>{`⇄`}</span>
              {_ ? (
                <H
                  to={`/admin/personas/${thread.with}`}
                  className={`hover:text-gold`}
                >
                  {l.name(thread.with)}
                </H>
              ) : (
                <H
                  to={`/admin/teams/${thread.with}`}
                  className={`hover:text-info`}
                >
                  {l.name(thread.with)}
                </H>
              )}
            </h2>
            <div
              className={`mt-1 flex flex-wrap items-center gap-2 text-xs text-muted`}
            >
              <span className={`font-mono text-faint`}>
                {`#`}
                {thread.id}
              </span>
              <D tone={B[thread.status] ?? `muted`} dot>
                {thread.status}
              </D>
              <D tone={`neutral`}>{thread.kind}</D>
              {thread.item && <span className={`text-ink`}>{thread.item}</span>}
              {thread.venue && (
                <span className={`inline-flex items-center gap-1`}>
                  <A className={`size-3`} />
                  {` `}
                  {l.name(thread.venue)}
                </span>
              )}
              <span className={`font-mono text-faint`}>
                {`opened T`}
                {thread.created_tick}
              </span>
            </div>
          </div>
          <Y
            size={`sm`}
            checked={u}
            onChange={setU}
            label=<span className={`inline-flex items-center gap-1 text-xs`}>
              {u ? (
                <A1 className={`size-3.5`} />
              ) : (
                <I1 className={`size-3.5`} />
              )}
              {` admin layer`}
            </span>
            tone={`gold`}
          />
        </div>
        {u && _ && thread.state && (
          <div
            className={`mt-3 grid grid-cols-2 gap-2 rounded-xl border border-line bg-base/50 p-3 text-xs sm:grid-cols-5`}
          >
            <HComponent label={`role`} value={x?.role ?? `—`} />
            <HComponent
              label={`opens`}
              value={
                x?.open === undefined
                  ? `—`
                  : v(x.open, {
                      symbol,
                      decimals: 1,
                    })
              }
            />
            <HComponent
              label={x?.role === `buyer` ? `ceiling` : `floor`}
              value={
                x?.limit === undefined
                  ? `—`
                  : v(x.limit, {
                      symbol,
                      decimals: 1,
                    })
              }
              tone={`accent`}
            />
            <HComponent
              label={`rounds / patience`}
              value={`${thread.state.rounds ?? 0} / ${thread.state.patience ?? `—`}`}
            />
            <div className={`rounded-md bg-panel px-2 py-1`}>
              <div
                className={`text-[9px] font-bold uppercase tracking-wider text-faint`}
              >{`team offers`}</div>
              {S.length > 1 ? (
                <H1
                  data={S}
                  width={110}
                  height={22}
                  color={`var(--color-info)`}
                />
              ) : (
                <div className={`font-mono text-ink`}>
                  {S.length
                    ? v(S[0], {
                        symbol,
                      })
                    : `—`}
                </div>
              )}
            </div>
          </div>
        )}
        <div
          className={`mt-4 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1`}
        >
          {!thread.messages.length && (
            <p className={`text-sm text-faint`}>{`No messages yet.`}</p>
          )}
          {thread.messages.map((t, n) => {
            let r = t.sender === thread.team;
            let i = l.info(t.sender);
            let a = thread.messages[n - 1];
            let o = !!a && a.sender === thread.team && !!a.text.trim();
            let decision = t.meta?.decision;
            return (
              <I
                key={t.id}
                side={r ? `right` : `left`}
                tone={r ? `team` : `persona`}
                who={l.name(t.sender)}
                avatar={
                  i?.kind === `persona` ? (
                    <V1 avatar={i.avatar} name={i.name} size={`sm`} />
                  ) : undefined
                }
                text={t.text}
                meta={`T${t.tick} · #${t.id}`}
              >
                {t.offer && <L offer={t.offer} name={l.name} hideMaker />}
                {u && r && t.meta?.verdict && (
                  <div
                    className={`rounded-lg border border-line bg-base/60 px-2.5 py-1.5 text-xs`}
                  >
                    <F verdict={t.meta.verdict} label={`judge`} />
                  </div>
                )}
                {u && !r && t.meta && (decision || t.meta.provider) && (
                  <P
                    decision={decision}
                    verdict={o ? t.meta.verdict_of_team : null}
                    hints={t.meta.hints}
                    trap={t.meta.trap ?? null}
                    provider={t.meta.provider}
                    error={t.meta.error}
                    rejected={t.meta.rejected}
                    personaVersion={t.meta.persona_version}
                    symbol={symbol}
                  />
                )}
              </I>
            );
          })}
          {thread.standing_offers.length > 0 && (
            <div
              className={`rounded-xl border border-dashed border-line-strong p-3`}
            >
              <div className={`eyebrow mb-2`}>{`Standing offers`}</div>
              <div className={`flex flex-col gap-1.5`}>
                {thread.standing_offers.map((offer) => (
                  <L key={offer.id} offer={offer} name={l.name} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
  if (loading) {
    return <S1 className={`h-96 rounded-2xl`} />;
  }
  return (
    <O1
      title={`Pick a negotiation`}
      hint={`Choose a thread on the left to read it with the code decisions behind every reply.`}
    />
  );
}
function HComponent({ label, value, tone }) {
  return (
    <div className={`rounded-md bg-panel px-2 py-1`}>
      <div
        className={`text-[9px] font-bold uppercase tracking-wider text-faint`}
      >
        {label}
      </div>
      <div
        className={
          tone === `accent` ? `font-mono text-accent` : `font-mono text-ink`
        }
      >
        {value}
      </div>
    </div>
  );
}
const U = B;
const W = [``, `open`, `deal`, `walked`, `closed`, `cooloff`];
function GComponent() {
  let { id } = K_1();
  let t = G_1();
  let [n, i] = q_1();
  let a = n.get(`persona`) ?? ``;
  let m = n.get(`status`) ?? ``;
  let h = n.get(`team`) ?? ``;
  let [y, setY] = R.useState(``);
  let [C, setC] = R.useState(``);
  let { clock } = l({
    live: false,
  });
  let F = n_3();
  let I = r_1();
  let L = t_2((e) => c.personas(e), []);
  let B = i_1(
    (e) =>
      s.threads(
        {
          status: m || undefined,
          persona: a || undefined,
          team: h || undefined,
          limit: 200,
        },
        e,
      ),
    6000,
    [m, a, h],
  );
  i_2([`thread.`, `settlement`, `persona.cooloff`], B.refresh, {
    throttleMs: 1500,
  });
  let H = id ? Number(id) : null;
  let G = i_1(
    (e) => {
      if (H) {
        return s.thread(H, e);
      }
      return Promise.resolve(undefined);
    },
    5000,
    [H],
    {
      enabled: !!H,
    },
  );
  i_2([`thread.message`, `settlement`, `thread.closed`], G.refresh, {
    throttleMs: 600,
    enabled: !!H,
    filter: (e) => e.payload.thread === H || e.type === `settlement`,
  });
  let K = (e, t) => {
    let r = new URLSearchParams(n);
    if (t) {
      r.set(e, t);
    } else {
      r.delete(e);
    }
    i(r, {
      replace: true,
    });
  };
  let q = R.useMemo(() => {
    let e = C.trim().toLowerCase();
    return (B.data?.threads ?? []).filter(
      (t) =>
        (!y || t.kind === y) &&
        (!e ||
          `${t.team_name} ${F.name(t.with)} ${t.item ?? ``} ${t.last_text}`
            .toLowerCase()
            .includes(e)),
    );
  }, [B.data, y, C, F]);
  let J = R.useMemo(() => {
    let e = {};
    for (let t of B.data?.threads ?? []) {
      e[t.status] = (e[t.status] ?? 0) + 1;
    }
    return e;
  }, [B.data]);
  return (
    <div className={`flex h-[calc(100vh-7.5rem)] min-h-[36rem] flex-col`}>
      <G1
        eyebrow={`Game master`}
        title={`Threads`}
        subtitle={`Every negotiation, live. The words are free; the structured offers bind — and the admin layer shows what the code decided behind each reply.`}
        className={`mb-4`}
      />
      <div
        className={`grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(20rem,26rem)_1fr]`}
      >
        <_
          padded={false}
          className={`flex min-h-0 flex-col overflow-hidden`}
          bodyClassName={`flex min-h-0 flex-1 flex-col`}
        >
          <div className={`grid grid-cols-2 gap-2 border-b border-line p-3`}>
            <K1
              value={a}
              onChange={(e) => K(`persona`, e)}
              options={[
                {
                  value: ``,
                  label: `all personas`,
                },
                ...(L.data?.personas ?? []).map((e) => ({
                  value: e.id,
                  label: `L${e.level} ${e.name}`,
                })),
              ]}
            />
            <K1
              value={h}
              onChange={(e) => K(`team`, e)}
              options={[
                {
                  value: ``,
                  label: `all teams`,
                },
                ...I.rows.map((e) => ({
                  value: e.id,
                  label: e.name,
                })),
              ]}
            />
            <K1
              value={m}
              onChange={(e) => K(`status`, e)}
              options={W.map((e) => ({
                value: e,
                label: e
                  ? `${e}${J[e] !== undefined && !m ? ` (${J[e]})` : ``}`
                  : `any status`,
              }))}
            />
            <K1
              value={y}
              onChange={(e) => setY(e)}
              options={[
                {
                  value: ``,
                  label: `any kind`,
                },
                {
                  value: `persona`,
                  label: `with personas`,
                },
                {
                  value: `team`,
                  label: `team to team`,
                },
                {
                  value: `duel`,
                  label: `duels`,
                },
              ]}
            />
            <label
              className={`col-span-2 flex h-9 items-center gap-2 rounded-lg border border-line-strong bg-base/80 px-3 focus-within:border-gold/70`}
            >
              <P1 className={`size-3.5 text-faint`} />
              <input
                value={C}
                onChange={(e) => setC(e.target.value)}
                placeholder={`search names, items, last words`}
                className={`w-full bg-transparent text-sm text-ink outline-none placeholder:text-faint`}
              />
            </label>
          </div>
          {B.error ? (
            <F1 error={B.error} onRetry={B.refresh} className={`m-3`} />
          ) : null}
          <div className={`min-h-0 flex-1 overflow-y-auto`}>
            {B.loading && !B.data ? (
              <div className={`flex flex-col gap-2 p-3`}>
                {Array.from(
                  {
                    length: 6,
                  },
                  (e, key) => (
                    <S1 key={key} className={`h-14`} />
                  ),
                )}
              </div>
            ) : q.length ? (
              <ul className={`divide-y divide-line/60`}>
                {q.map((e) => {
                  let i = F.info(e.with);
                  let a = e.id === H;
                  return (
                    <li key={e.id}>
                      <button
                        type={`button`}
                        onClick={() =>
                          t(
                            `/admin/threads/${e.id}${n.toString() ? `?${n}` : ``}`,
                          )
                        }
                        className={r(
                          `relative flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors`,
                          a ? `bg-raised` : `hover:bg-raised/50`,
                        )}
                      >
                        {a && (
                          <span
                            className={`absolute inset-y-2 left-0 w-0.5 rounded-full bg-gold`}
                            aria-hidden
                          />
                        )}
                        {i?.kind === `persona` ? (
                          <V1 avatar={i.avatar} name={i.name} size={`sm`} />
                        ) : (
                          <span
                            className={`grid size-8 shrink-0 place-items-center rounded-full bg-raised font-mono text-[10px] text-muted`}
                          >
                            {e.kind === `duel` ? `⚔` : `⇄`}
                          </span>
                        )}
                        <span className={`min-w-0 flex-1`}>
                          <span className={`flex items-center gap-1.5`}>
                            <span
                              className={`truncate text-sm font-semibold text-ink`}
                            >
                              {e.team_name}
                              {` `}
                              <span className={`text-faint`}>{`⇄`}</span>
                              {` `}
                              {F.name(e.with)}
                            </span>
                            <span
                              className={`ml-auto shrink-0 font-mono text-[10px] text-faint`}
                            >
                              {d(e.last_tick, clock?.tick, clock?.tick_seconds)}
                            </span>
                          </span>
                          <span className={`mt-0.5 flex items-center gap-1.5`}>
                            <D
                              tone={U[e.status] ?? `muted`}
                              className={`h-5 px-2 text-[10px]`}
                            >
                              {e.status}
                            </D>
                            {e.item && (
                              <span className={`truncate text-xs text-muted`}>
                                {e.item}
                              </span>
                            )}
                            <span
                              className={`ml-auto shrink-0 text-[10px] text-faint`}
                            >
                              {e.messages}
                              {` msgs`}
                            </span>
                          </span>
                          {e.last_text && (
                            <span
                              className={`mt-1 line-clamp-1 block text-xs text-faint`}
                            >
                              {`“`}
                              {e.last_text}
                              {`”`}
                            </span>
                          )}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <O1
                compact
                icon=<F_1 className={`size-5`} />
                title={`No negotiations`}
                hint={`Nothing matches these filters yet.`}
              />
            )}
          </div>
          <div
            className={`border-t border-line px-3 py-2 text-[11px] text-faint`}
          >
            {q.length}
            {` shown`}
            {B.data && B.data.threads.length >= 200 ? ` · newest 200` : ``}
            {` · refreshes live`}
          </div>
        </_>
        <_
          className={`flex min-h-0 flex-col overflow-hidden`}
          bodyClassName={`flex min-h-0 flex-1 flex-col`}
        >
          <VComponent
            thread={H ? G.data : undefined}
            error={G.error}
            loading={G.loading && !!H}
            onRetry={G.refresh}
          />
        </_>
      </div>
    </div>
  );
}
export { GComponent as default };
