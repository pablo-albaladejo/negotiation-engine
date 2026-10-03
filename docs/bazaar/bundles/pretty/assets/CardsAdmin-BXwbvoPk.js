import { i as i_1, n, t } from "./jsx-runtime-CU3EbJiN.js";
import { c, i, t as A1 } from "./Cromo-BD7ZopIA.js";
import { r as r_1 } from "./Button-DIaWEsZ9.js";
import { t as S1 } from "./arrow-right-aSvo4Cqf.js";
import { t as C1 } from "./eye-off-Bio-uKSw.js";
import { t as L1 } from "./EmptyState-BxhxbZPA.js";
import {
  A as A_1,
  _ as __1,
  a as F1,
  i as i_2,
  s,
  t as t_2,
  v,
} from "./useEvents-BpJ5PfZT.js";
import { t as _ } from "./ErrorNote-Ca3ig8px.js";
import { t as V1 } from "./search-LtN31357.js";
import { n as n_2 } from "./catalog-C4CNN-Mb.js";
import { t as B1 } from "./RarityBadge-Boc23U-c.js";
import { t as X1 } from "./PageHeader-B1UyPTkh.js";
import { t as S } from "./Panel-DtYcp5Ol.js";
import { t as C } from "./Tabs-BcELG-Ib.js";
import {
  G,
  H,
  I,
  K,
  S as S_1,
  i as K1,
  j as A,
  u as J1,
  y,
} from "./index-B_RfsMCE.js";
import { d as N, i as i_3, n as n_3, r as r_2 } from "./hooks-BX-dyw4g.js";
const L = i_1(n(), 1);
const R = t();
function ZComponent() {
  let { id } = K();
  let t = G();
  let { index, refresh } = n_2();
  let p = r_2();
  let T = t_2(() => s.config().then((e) => e.catalog), []);
  i_3(
    [
      `pack.opened`,
      `settlement`,
      `set.released`,
      `admin.grant`,
      `egg.given`,
      `gift.given`,
    ],
    () => void refresh(),
    {
      throttleMs: 4000,
    },
  );
  let [O, setO] = L.useState(`all`);
  let [A, setA] = L.useState(``);
  let [F, setF] = L.useState(``);
  let [H, setH] = L.useState(``);
  let [card, setCard] = L.useState(null);
  let assetId = id && /^\d+$/.test(id) ? Number(id) : null;
  let rows = L.useMemo(() => {
    let e = [];
    for (let set of T.data?.sets ?? []) {
      let r = index?.sets.get(set.id);
      for (let i of set.cards) {
        let a = index?.cards.get(i.id)?.card;
        e.push({
          id: i.id,
          name: i.name,
          rarity: i.rarity,
          set,
          printRun:
            a?.print_run ??
            i.print_run ??
            T.data?.rarities[i.rarity]?.print_run ??
            0,
          minted: a?.minted ?? 0,
          hidden: i.hidden,
          page: !!a?.page,
          released: !!r?.released,
        });
      }
    }
    return e;
  }, [T.data, index]);
  let J = rows.filter(
    (e) =>
      (O === `all` || e.set.id === O) &&
      (!A || e.rarity === A) &&
      (!F.trim() ||
        `${e.id} ${e.name}`.toLowerCase().includes(F.trim().toLowerCase())),
  );
  let Y = __1.map((r) => {
    let t = rows.filter((t) => t.rarity === r);
    return {
      r,
      minted: t.reduce((acc, item) => acc + item.minted, 0),
      run: t.reduce((acc, item) => acc + item.printRun, 0),
      cards: t.length,
    };
  });
  let X = t_2(
    (e) => {
      if (H) {
        return s.cards(
          {
            owner: H,
          },
          e,
        );
      }
      return Promise.resolve({
        assets: [],
      });
    },
    [H],
    {
      enabled: !!H,
    },
  );
  return (
    <div>
      <X1
        eyebrow={`Game master`}
        title={`Cards`}
        subtitle={`Every card in the catalogue with its print run: minted, left, and where each numbered copy has been.`}
      />
      <div className={`mb-5 grid grid-cols-2 gap-3 md:grid-cols-5`}>
        {Y.map(({ r: r_2, minted, run, cards }) => (
          <button
            key={r_2}
            type={`button`}
            onClick={() =>
              setA((t) => {
                if (t === r_2) {
                  return ``;
                }
                return r_2;
              })
            }
            className={r_1(
              `surface px-4 py-3 text-left transition-colors`,
              A === r_2 ? `ring-1 ring-gold/60` : `hover:border-line-strong`,
            )}
          >
            <div className={`flex items-center justify-between`}>
              <B1
                rarity={r_2}
                label={index?.rarityLabel(r_2)}
                color={index?.rarityColor(r_2)}
              />
              <span className={`text-[11px] text-faint`}>
                {cards}
                {` cards`}
              </span>
            </div>
            <div className={`mt-2 font-display-num text-2xl text-ink`}>
              {y(minted)}
              {` `}
              <span className={`text-sm text-faint`}>
                {`/ `}
                {y(run)}
              </span>
            </div>
            <div
              className={`mt-1.5 h-1.5 overflow-hidden rounded-full bg-line`}
            >
              <div
                className={`h-full rounded-full`}
                style={{
                  width: `${run ? (minted / run) * 100 : 0}%`,
                  background: index?.rarityColor(r_2) ?? v[r_2],
                }}
              />
            </div>
          </button>
        ))}
      </div>
      <div className={`mb-4 flex flex-wrap items-center gap-3`}>
        <C
          variant={`pills`}
          size={`sm`}
          value={O}
          onChange={setO}
          tabs={[
            {
              id: `all`,
              label: `All sets`,
              count: rows.length,
            },
            ...(T.data?.sets ?? []).map((e) => ({
              id: e.id,
              label: e.name,
              count: e.cards.length,
            })),
          ]}
        />
        <label
          className={`flex h-9 min-w-56 items-center gap-2 rounded-lg border border-line-strong bg-base/80 px-3 focus-within:border-gold/70`}
        >
          <V1 className={`size-3.5 text-faint`} />
          <input
            value={F}
            onChange={(e) => setF(e.target.value)}
            placeholder={`search cards`}
            className={`w-full bg-transparent text-sm text-ink outline-none placeholder:text-faint`}
          />
        </label>
        <div className={`w-52`}>
          <N
            value={H}
            onChange={setH}
            options={[
              {
                value: ``,
                label: `holdings of a team…`,
              },
              ...p.rows.map((e) => ({
                value: e.id,
                label: e.name,
              })),
            ]}
          />
        </div>
      </div>
      {T.error ? (
        <_ error={T.error} onRetry={T.refresh} className={`mb-4`} />
      ) : null}
      {H && (
        <S
          className={`mb-5`}
          title={`${p.rows.find((e) => e.id === H)?.name ?? H} holds ${X.data?.assets.length ?? `…`} items`}
          subtitle={`click a copy for its provenance`}
        >
          {X.loading && !X.data ? (
            <F1 className={`h-40`} />
          ) : (
            <div className={`flex flex-wrap gap-2.5`}>
              {(X.data?.assets ?? [])
                .filter((e) => e.kind === `card`)
                .sort(
                  (e, t) =>
                    A_1(t.rarity) - A_1(e.rarity) || e.ref.localeCompare(t.ref),
                )
                .map((e) => (
                  <A1
                    key={e.id}
                    {...i(e.ref, index, {
                      serial: e.serial,
                      printRun: e.print_run,
                    })}
                    size={`sm`}
                    onClick={() => t(`/admin/cards/${e.id}`)}
                  />
                ))}
              {!(X.data?.assets ?? []).some((e) => e.kind === `card`) && (
                <p className={`text-sm text-faint`}>{`No cards.`}</p>
              )}
            </div>
          )}
        </S>
      )}
      {T.data ? (
        J.length ? (
          <div
            className={`grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-7`}
          >
            {J.map((e) => {
              let t = Math.max(0, e.printRun - e.minted);
              return (
                <button
                  key={e.id}
                  type={`button`}
                  onClick={() => setCard(e.id)}
                  className={`group flex flex-col items-center gap-2 rounded-xl p-2 text-left transition-colors hover:bg-raised/60`}
                >
                  <div className={r_1(!e.released && `opacity-50 grayscale`)}>
                    <A1
                      id={e.id}
                      name={e.name}
                      rarity={e.rarity}
                      setCode={e.set.id}
                      setName={e.set.name}
                      setColor={e.set.color}
                      scene={c(e.set.cards, e.id)}
                      printRun={e.printRun}
                      rarityLabel={index?.rarityLabel(e.rarity)}
                      rarityColor={index?.rarityColor(e.rarity)}
                      secret={e.hidden}
                      size={`sm`}
                      tilt={false}
                    />
                  </div>
                  <div className={`w-full px-1`}>
                    <div
                      className={`flex items-center justify-between gap-1 text-[11px]`}
                    >
                      <span className={`font-mono text-muted`}>{e.id}</span>
                      <span className={`font-mono text-ink`}>
                        {y(e.minted)}
                        {`/`}
                        {y(e.printRun)}
                      </span>
                    </div>
                    <div
                      className={`mt-1 h-1.5 overflow-hidden rounded-full bg-line`}
                    >
                      <div
                        className={`h-full rounded-full`}
                        style={{
                          width: `${e.printRun ? (e.minted / e.printRun) * 100 : 0}%`,
                          background:
                            index?.rarityColor(e.rarity) ?? v[e.rarity],
                        }}
                      />
                    </div>
                    <div
                      className={`mt-1 flex flex-wrap items-center gap-1 text-[10px] text-faint`}
                    >
                      <span
                        className={t === 0 ? `font-semibold text-accent` : ``}
                      >
                        {t === 0 ? `sold out` : `${y(t)} left`}
                      </span>
                      {e.hidden && (
                        <span
                          className={`inline-flex items-center gap-0.5 text-epic`}
                        >
                          <C1 className={`size-2.5`} />
                          {` hidden`}
                        </span>
                      )}
                      {e.page && (
                        <span className={`text-good`}>{`· page`}</span>
                      )}
                      {!e.released && (
                        <span>
                          {`· `}
                          {e.set.release}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <L1 icon=<I className={`size-6`} /> title={`No cards match`} />
        )
      ) : (
        <div className={`grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-6`}>
          {Array.from(
            {
              length: 12,
            },
            (e, key) => (
              <F1 key={key} className={`h-64 rounded-xl`} />
            ),
          )}
        </div>
      )}
      <BComponent
        card={card}
        onClose={() => setCard(null)}
        onPick={(e) => {
          setCard(null);
          t(`/admin/cards/${e}`);
        }}
        rows={rows}
      />
      <VComponent
        assetId={assetId}
        onClose={() => t(`/admin/cards`)}
        onCard={(e) => {
          t(`/admin/cards`);
          setCard(e);
        }}
      />
    </div>
  );
}
function BComponent({ card, onClose, onPick, rows }) {
  let { index } = n_2();
  let u = n_3();
  let d = i_2(
    (t) => {
      if (card) {
        return s.cards(
          {
            card,
          },
          t,
        );
      }
      return Promise.resolve({
        assets: [],
      });
    },
    10000,
    [card],
    {
      enabled: !!card,
    },
  );
  let h = rows.find((t) => t.id === card);
  let g = L.useMemo(() => {
    let e = new Map();
    for (let t of d.data?.assets ?? []) {
      e.set(t.owner, (e.get(t.owner) ?? 0) + 1);
    }
    return [...e.entries()].sort((e, t) => t[1] - e[1]);
  }, [d.data]);
  return (
    <K1
      open={!!card}
      onClose={onClose}
      width={`min(640px, 100vw)`}
      title={h ? `${h.id} · ${h.name}` : (card ?? ``)}
      description={
        h
          ? `${h.set.name} · ${y(h.minted)} of ${y(h.printRun)} minted`
          : undefined
      }
    >
      {h && (
        <div className={`mb-5 flex gap-4`}>
          <A1
            {...i(h.id, index, {
              printRun: h.printRun,
              secret: h.hidden,
            })}
            name={h.name}
            rarity={h.rarity}
            setColor={h.set.color}
            scene={c(h.set.cards, h.id)}
            setName={h.set.name}
            size={`md`}
          />
          <div className={`flex min-w-0 flex-col gap-2 text-sm`}>
            <B1
              rarity={h.rarity}
              label={index?.rarityLabel(h.rarity)}
              color={index?.rarityColor(h.rarity)}
              printRun={h.printRun}
            />
            {h.hidden && (
              <J1
                tone={`epic`}
                icon=<A className={`size-3`} />
              >{`hidden — only easter eggs and grants mint it`}</J1>
            )}
            <div className={`text-xs text-muted`}>{`Held by`}</div>
            <div className={`flex flex-wrap gap-1.5`}>
              {g.map(([e, t]) => (
                <J1 key={e} tone={e === `world` ? `muted` : `neutral`}>
                  {u.name(e)}
                  {` ×`}
                  {t}
                </J1>
              ))}
              {!g.length && (
                <span className={`text-xs text-faint`}>{`nobody yet`}</span>
              )}
            </div>
          </div>
        </div>
      )}
      {d.error ? <_ error={d.error} /> : null}
      {d.loading && !d.data ? (
        <F1 lines={6} />
      ) : d.data?.assets.length ? (
        <table className={`bz-table`}>
          <thead>
            <tr>
              <th>{`Serial`}</th>
              <th>{`Owner`}</th>
              <th className={`num-cell`}>{`Hands`}</th>
              <th className={`num-cell`}>{`Asset`}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {[...d.data.assets]
              .sort((e, t) => e.serial - t.serial)
              .map((e) => (
                <tr
                  key={e.id}
                  className={`cursor-pointer`}
                  onClick={() => onPick(e.id)}
                >
                  <td className={`font-mono text-sm text-gold`}>
                    {S_1(e.serial, e.print_run)}
                  </td>
                  <td>
                    {u.isTeam(e.owner) ? (
                      <H
                        to={`/admin/teams/${e.owner}`}
                        onClick={(e) => e.stopPropagation()}
                        className={`text-info hover:underline`}
                      >
                        {u.name(e.owner)}
                      </H>
                    ) : (
                      <span className={`text-muted`}>{u.name(e.owner)}</span>
                    )}
                  </td>
                  <td className={`num-cell font-mono text-xs`}>{e.hops}</td>
                  <td className={`num-cell font-mono text-xs text-faint`}>
                    {`#`}
                    {e.id}
                  </td>
                  <td className={`text-right`}>
                    <S1 className={`ml-auto size-3.5 text-faint`} />
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      ) : (
        <L1
          compact
          title={`Not minted yet`}
          hint={`No copy of this card exists.`}
        />
      )}
    </K1>
  );
}
function VComponent({ assetId, onClose, onCard }) {
  let { index } = n_2();
  let c = n_3();
  let l = t_2(
    () => {
      if (assetId === null) {
        return Promise.resolve(null);
      }
      return s.card(assetId);
    },
    [assetId],
    {
      enabled: assetId !== null,
    },
  );
  let l_data = l.data;
  return (
    <K1
      open={assetId !== null}
      onClose={onClose}
      width={`min(560px, 100vw)`}
      title={
        l_data
          ? `${l_data.name} ${S_1(l_data.serial, l_data.print_run)}`
          : `Asset #${assetId}`
      }
      description={
        l_data
          ? `asset #${l_data.id} · ${l_data.kind} ${l_data.ref} · now with ${c.name(l_data.owner)}`
          : undefined
      }
    >
      {l.error ? <_ error={l.error} /> : null}
      {l_data ? (
        <div className={`flex flex-col gap-5`}>
          {l_data.kind === `card` && (
            <div className={`flex items-start gap-4`}>
              <A1
                {...i(l_data.ref, index, {
                  serial: l_data.serial,
                  printRun: l_data.print_run,
                })}
                size={`md`}
              />
              <div className={`flex flex-col gap-2 text-sm`}>
                <p className={`text-muted`}>
                  {`Copy `}
                  <b className={`text-gold`}>
                    {S_1(l_data.serial, l_data.print_run)}
                  </b>
                  {` of `}
                  {l_data.ref}
                  {`. `}
                  {l_data.history.length}
                  {` hand`}
                  {l_data.history.length === 1 ? `` : `s`}
                  {` so far.`}
                </p>
                <button
                  type={`button`}
                  onClick={() => onCard(l_data.ref)}
                  className={`w-fit text-xs font-semibold text-gold hover:underline`}
                >
                  {`every copy of `}
                  {l_data.ref}
                  {` →`}
                </button>
              </div>
            </div>
          )}
          <ol className={`relative ml-3 border-l border-line-strong`}>
            {l_data.history.map((e, t) => {
              let n = e.from === `world`;
              let r = t === l_data.history.length - 1;
              return (
                <li key={t} className={`relative pb-5 pl-6`}>
                  <span
                    className={r_1(
                      `absolute -left-[7px] top-1 size-3.5 rounded-full border-2`,
                      r
                        ? `border-gold bg-gold`
                        : n
                          ? `border-good bg-panel`
                          : `border-line-strong bg-panel`,
                    )}
                  />
                  <div className={`flex items-baseline gap-2`}>
                    <span className={`font-mono text-xs text-faint`}>
                      {`T`}
                      {e.tick}
                    </span>
                    <span className={`text-sm text-ink`}>
                      {n ? (
                        <span className={`text-good`}>{`minted`}</span>
                      ) : c.isTeam(e.from) ? (
                        <H
                          to={`/admin/teams/${e.from}`}
                          className={`text-info hover:underline`}
                        >
                          {c.name(e.from)}
                        </H>
                      ) : (
                        c.name(e.from)
                      )}
                      {` `}
                      <S1 className={`inline size-3 text-faint`} />
                      {` `}
                      {c.isTeam(e.to) ? (
                        <H
                          to={`/admin/teams/${e.to}`}
                          className={`font-semibold text-info hover:underline`}
                        >
                          {c.name(e.to)}
                        </H>
                      ) : (
                        <span className={`font-semibold`}>{c.name(e.to)}</span>
                      )}
                    </span>
                  </div>
                  <div className={`mt-0.5 text-xs text-muted`}>{e.why}</div>
                </li>
              );
            })}
          </ol>
        </div>
      ) : (
        <F1 lines={5} />
      )}
    </K1>
  );
}
export { ZComponent as default };
