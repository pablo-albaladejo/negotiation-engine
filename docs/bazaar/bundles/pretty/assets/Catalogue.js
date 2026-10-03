import { i, n, t } from "./jsx-runtime.js";
import { r, t as I1 } from "./Cromo.js";
import { r as r_1 } from "./Button.js";
import { t as O1 } from "./EmptyState.js";
import {
  C,
  D as D_1,
  O as O_1,
  _ as __1,
  a as D1,
  c,
  i as i_1,
  t as t_2,
  v,
  w,
  x,
} from "./useEvents.js";
import { t as V1 } from "./lock.js";
import { t as Y1 } from "./package.js";
import { t as B1 } from "./ErrorNote.js";
import { n as n_2, r as S } from "./useFit.js";
import { n as n_3, t as t_3 } from "./catalog.js";
import { t as T } from "./RarityBadge.js";
import { t as E } from "./KPI.js";
import { t as D } from "./PackCard.js";
import { t as O } from "./PageHeader.js";
import {
  B as B_1,
  I as I_1,
  K,
  U as U_1,
  a as N,
  b,
  h,
  j as I,
  l,
  y as y_1,
} from "./index.js";
import { i as i_2, t as B } from "./Pesetas.js";
const V = i(n(), 1);
const H = t();
function UComponent({ card, color }) {
  let n = Math.max(0, card.print_run - card.minted);
  if (card.print_run <= 12) {
    return (
      <div
        className={`flex flex-col items-center gap-1`}
        title={`${card.minted} of ${card.print_run} minted`}
      >
        <div className={`flex flex-wrap justify-center gap-1`}>
          {Array.from(
            {
              length: card.print_run,
            },
            (n, r) => (
              <span
                key={r}
                className={`size-2.5 rounded-full ring-1`}
                style={
                  r < card.minted
                    ? {
                        background: color,
                        boxShadow: `0 0 8px ${color}`,
                        borderColor: color,
                      }
                    : {
                        background: `transparent`,
                        boxShadow: `inset 0 0 0 1.5px ${x(color, 0.45)}`,
                      }
                }
              />
            ),
          )}
        </div>
        <span className={`font-mono text-[11px] font-semibold text-muted`}>
          {card.minted
            ? `${card.minted}/${card.print_run} found`
            : `none of ${card.print_run} found yet`}
        </span>
      </div>
    );
  }
  return (
    <div
      className={`w-full`}
      title={`${card.minted} of ${card.print_run} minted, ${n} left`}
    >
      <div
        className={`h-1.5 overflow-hidden rounded-full bg-base/80 ring-1 ring-line`}
      >
        <div
          className={`h-full rounded-full`}
          style={{
            width: `${Math.min(100, (card.minted / card.print_run) * 100)}%`,
            background: color,
          }}
        />
      </div>
      <div
        className={`mt-1 flex justify-between font-mono text-[11px] font-semibold text-muted`}
      >
        <span>
          <span className={`text-ink`}>{y_1(card.minted)}</span>
          {`/`}
          {y_1(card.print_run)}
        </span>
        <span>
          {y_1(n)}
          {` left`}
        </span>
      </div>
    </div>
  );
}
function WComponent({ set, index, releaseAt, nowHours, onPick, className }) {
  let f = set.cards.filter((e) => e.page);
  let p = set.cards.filter((e) => !e.page);
  let m = set.cards.reduce((acc, card) => acc + card.minted, 0);
  let g = set.cards
    .filter((e) => !e.hidden)
    .reduce((acc, item) => acc + item.print_run, 0);
  let y =
    !set.released &&
    releaseAt !== null &&
    nowHours !== null &&
    releaseAt > nowHours
      ? h(releaseAt - nowHours)
      : null;
  let b = (e) => index?.rarityColor(e.rarity) ?? v[e.rarity];
  let size = n_2(640) ? `md` : `sm`;
  let CComponent = (card) => (
    <div
      key={card.id}
      className={`flex w-[128px] flex-col items-center gap-2 sm:w-[176px]`}
    >
      {set.released ? (
        <I1
          {...r(card, set, index)}
          size={size}
          onClick={onPick ? () => onPick(card) : undefined}
        />
      ) : (
        <I1
          id={card.id}
          name={card.name}
          rarity={card.rarity}
          setColor={set.color}
          size={size}
          faceDown
        />
      )}
      {set.released ? (
        <UComponent card={card} color={b(card)} />
      ) : (
        <span
          className={`flex items-center gap-1.5 text-[11px] font-bold`}
          style={{
            color: b(card),
          }}
        >
          <span
            className={`size-2 rounded-full`}
            style={{
              background: b(card),
            }}
          />
          {index?.rarityLabel(card.rarity) ?? card.rarity}
          {` · Nº `}
          {String(O_1(card.id).number).padStart(2, `0`)}
        </span>
      )}
    </div>
  );
  return (
    <section
      id={`set-${set.id}`}
      className={r_1(
        `album-sheet scroll-mt-24 overflow-hidden rounded-[22px] border border-line shadow-[var(--shadow-lift)]`,
        className,
      )}
    >
      <header
        className={`relative flex flex-wrap items-end justify-between gap-4 px-6 py-5`}
        style={{
          background: `linear-gradient(100deg, ${x(set.color, 0.55)}, ${x(D_1(set.color, `#0B1020`, 0.5), 0.35)} 55%, transparent)`,
        }}
      >
        <div className={`flex items-end gap-4`}>
          <span
            className={`grid h-16 min-w-16 place-items-center rounded-2xl px-3 font-display text-3xl font-black tracking-wider shadow-[0_10px_24px_-12px_rgb(0_0_0/0.8)]`}
            style={{
              background: set.color,
              color: C(set.color),
            }}
          >
            {set.id}
          </span>
          <div>
            <h2 className={`text-4xl text-ink`}>{set.name}</h2>
            <p className={`mt-1 text-sm text-ink/80 italic`}>{set.theme}</p>
          </div>
        </div>
        <div className={`flex flex-wrap items-center gap-3 text-sm`}>
          {set.released ? (
            <>
              <span
                className={`rounded-full border border-good/40 bg-good/12 px-3 py-1 text-xs font-extrabold tracking-[0.12em] text-good uppercase`}
              >{`Out now`}</span>
              <span className={`text-muted`}>
                <span
                  className={`font-display text-xl font-extrabold text-ink`}
                >
                  {y_1(m)}
                </span>
                {` of `}
                {y_1(g)}
                {` copies in circulation`}
              </span>
            </>
          ) : (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs font-extrabold tracking-[0.12em] text-gold uppercase`}
            >
              <V1 className={`size-3.5`} aria-hidden />
              {` `}
              {y ? `Arrives in ${y}` : `Release ${set.release}`}
            </span>
          )}
        </div>
      </header>
      <div className={`flex flex-col gap-8 px-6 pt-4 pb-7 xl:flex-row`}>
        <div className={`min-w-0 flex-1`}>
          <div className={`mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1`}>
            <h3
              className={`text-xl whitespace-nowrap text-ink`}
            >{`The page`}</h3>
            <span className={`text-sm text-muted`}>
              {f.length}
              {` cards — collect them all for the page bonus`}
            </span>
          </div>
          <div
            className={`grid grid-cols-[repeat(auto-fill,128px)] justify-center gap-x-4 gap-y-5 sm:grid-cols-[repeat(auto-fill,176px)] sm:justify-start xl:grid-cols-[repeat(5,176px)]`}
          >
            {f.map(CComponent)}
          </div>
        </div>
        {p.length > 0 && (
          <div className={`shrink-0 xl:w-[392px]`}>
            <div
              className={`mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1`}
            >
              <h3
                className={`flex items-center gap-2 text-xl whitespace-nowrap text-ink`}
              >
                <I className={`size-5 text-gold`} aria-hidden />
                {` Shinies`}
              </h3>
              <span
                className={`text-sm text-muted`}
              >{`not on the page · they top it up`}</span>
            </div>
            <div
              className={`flex flex-wrap justify-center gap-x-4 gap-y-5 rounded-2xl border border-gold/20 bg-gold/[0.04] p-3 sm:justify-start`}
            >
              {p.map(CComponent)}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
function GComponent({ odds, index, n }) {
  let r = __1
    .filter((t) => (odds[t] ?? 0) > 0)
    .map((r_2) => ({
      r: r_2,
      p: odds[r_2] ?? 0,
    }));
  let i = r.reduce((acc, item) => acc + item.p, 0) || 1;
  let title = r
    .map((e) => `${index?.rarityLabel(e.r) ?? e.r} ${b(e.p / i)}`)
    .join(` · `);
  return (
    <div
      className={`grid grid-cols-[3.2em_minmax(0,1fr)] items-center gap-3`}
      title={title}
    >
      <span className={`font-mono text-[11px] font-bold text-faint`}>
        {`#`}
        {n}
      </span>
      <div className={`min-w-0`}>
        <div
          className={`flex h-3 overflow-hidden rounded-full bg-base/80 ring-1 ring-line`}
        >
          {r.map((e) => (
            <span
              key={e.r}
              className={`h-full`}
              style={{
                width: `${(e.p / i) * 100}%`,
                background: index?.rarityColor(e.r) ?? v[e.r],
              }}
            />
          ))}
        </div>
        <div
          className={`mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] font-semibold`}
        >
          {r.map((e) => (
            <span
              key={e.r}
              style={{
                color: index?.rarityColor(e.r) ?? v[e.r],
              }}
            >
              {index?.rarityLabel(e.r) ?? e.r}
              {` `}
              {b(e.p / i)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
function KComponent({ pack, index, sellers = [], className }) {
  let i = (t) =>
    1 -
    pack.slots.reduce(
      (acc, slot) =>
        acc *
        (1 -
          (slot[t] ?? 0) /
            (Object.values(slot).reduce(
              (acc_1, item) => acc_1 + (item ?? 0),
              0,
            ) || 1)),
      1,
    );
  let o = [...__1].reverse().find((e) => i(e) > 0);
  return (
    <article
      className={r_1(`surface flex flex-col gap-4 p-5 sm:flex-row`, className)}
    >
      <div className={`flex shrink-0 flex-col items-center gap-2`}>
        <D
          name={pack.name}
          color={pack.color}
          odds={pack.slots}
          expectedBook={pack.expected_book}
          currency={index?.symbol}
          size={`md`}
        />
      </div>
      <div className={`min-w-0 flex-1`}>
        <div className={`flex flex-wrap items-baseline justify-between gap-2`}>
          <h3 className={`text-2xl text-ink`}>{pack.name}</h3>
          <span className={`text-sm text-muted`}>
            {`≈ `}
            <B value={pack.expected_book} className={`text-lg text-gold`} />
            {` book value`}
          </span>
        </div>
        <p className={`mt-1 text-sm text-muted`}>
          {pack.slots.length}
          {` cards`}
          {o && o !== `common` && (
            <>
              {` `}
              {`· `}
              <span
                style={{
                  color: index?.rarityColor(o) ?? v[o],
                }}
              >
                {index?.rarityLabel(o) ?? o}
              </span>
              {` in `}
              {b(i(o), +(i(o) < 0.1))}
              {` of packs`}
            </>
          )}
        </p>
        <div className={`mt-3 flex flex-col gap-2.5`}>
          {pack.slots.map((odds, n) => (
            <GComponent key={n} odds={odds} index={index} n={n + 1} />
          ))}
        </div>
        {sellers.length > 0 && (
          <div className={`mt-4 flex flex-wrap items-center gap-2 text-sm`}>
            <span className={`eyebrow`}>{`Sold by`}</span>
            {sellers.map(({ persona, price }) => (
              <span
                key={persona.id}
                className={`inline-flex items-center gap-1.5 rounded-full border border-line-strong bg-base/60 px-2.5 py-1 font-semibold text-ink`}
              >
                <span aria-hidden>{persona.avatar.emoji}</span>
                {persona.name}
                {price > 0 && (
                  <span className={`text-gold`}>
                    {`· `}
                    <B value={price} />
                  </span>
                )}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
function QComponent() {
  let { setId } = K();
  let { index, error, loading, refresh } = n_3();
  let a = t_2((e) => c.personas(e));
  let s = i_1((e) => c.schedule(e), 60000);
  let { clock } = l({
    live: false,
  });
  let nowHours = clock?.t_hours ?? null;
  let [_, set_] = V.useState(null);
  V.useEffect(() => {
    t_3();
    let e = setInterval(() => void t_3(), 15000);
    return () => clearInterval(e);
  }, []);
  let x = index?.catalog;
  let D = x?.sets ?? [];
  let U = setId
    ? D.filter((t) => t.id.toLowerCase() === setId.toLowerCase())
    : D;
  let G = V.useMemo(() => {
    let e = new Map();
    for (let t of s.data?.upcoming ?? []) {
      let n = t.params.set;
      if (t.action === `set_release` && typeof n == `string`) {
        e.set(n, t.at_hours);
      }
    }
    return (t) => e.get(t.id) ?? i_2(t.release);
  }, [s.data]);
  let q = V.useMemo(() => {
    let e = new Map();
    for (let persona of a.data?.personas ?? []) {
      if (persona.enabled) {
        for (let n of persona.menu.sells) {
          if (`pack` in n) {
            e.set(n.pack, [
              ...(e.get(n.pack) ?? []),
              {
                persona,
                price: n.list_price,
              },
            ]);
          }
        }
      }
    }
    return e;
  }, [a.data]);
  let Z = V.useMemo(() => {
    if (!x) {
      return null;
    }
    let e = x.sets.filter((e) => e.released);
    let t = e.flatMap((e) => e.cards);
    let n = t.filter((e) => w(e.rarity));
    return {
      released: e.length,
      total: x.sets.length,
      minted: t.reduce((acc, item) => acc + item.minted, 0),
      printed: t
        .filter((e) => !e.hidden)
        .reduce((acc, item) => acc + item.print_run, 0),
      shiniesFound: n.reduce((acc, item) => acc + item.minted, 0),
      shiniesPrinted: n
        .filter((e) => !e.hidden)
        .reduce((acc, item) => acc + item.print_run, 0),
      secrets: x.sets.flatMap((e) => e.cards).filter((e) => e.hidden).length,
      cardsPerSet: Math.max(
        0,
        ...x.sets.map((e) => e.cards.filter((e) => !e.hidden).length),
      ),
    };
  }, [x]);
  let Q = D.find((e) => !e.released);
  let $ = Q ? G(Q) : null;
  return (
    <div>
      <O
        eyebrow={`Cromos de Madrid`}
        title={`The album`}
        subtitle={
          Z
            ? `${Z.total} neighbourhoods, ${Z.cardsPerSet} cards each. Every card is a numbered copy with a fixed print run — complete a page for the bonus, hunt the shinies.`
            : `Every neighbourhood, every card, every numbered copy.`
        }
      />
      {error && !index && (
        <B1 error={error} onRetry={refresh} className={`mb-4`} />
      )}
      {loading && !index && <D1 className={`h-96 rounded-2xl`} />}
      {Z && (
        <div className={`mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4`}>
          <E
            label={`Sets out`}
            value={`${Z.released}/${Z.total}`}
            icon=<I_1 className={`size-4`} />
            tone={`gold`}
            hint={
              Q
                ? `${Q.name} ${$ !== null && nowHours !== null && $ > nowHours ? `in ${h($ - nowHours)}` : `next`}`
                : `all released`
            }
          />
          <E
            label={`Copies in circulation`}
            value={Z.minted}
            icon=<B_1 className={`size-4`} />
            hint={`of ${y_1(Z.printed)} ever printed (${b(Z.printed ? Z.minted / Z.printed : 0, 1)})`}
          />
          <E
            label={`Shinies found`}
            value={Z.shiniesFound}
            icon=<I className={`size-4`} />
            tone={`gold`}
            hint={`of ${y_1(Z.shiniesPrinted)} epics and legendaries`}
          />
          <E
            label={`Secret cards found`}
            value={Z.secrets}
            icon=<S className={`size-4`} />
            tone={Z.secrets ? `gold` : `default`}
            hint={
              Z.secrets
                ? `someone found a hidden one`
                : `rumours only — nobody has found one yet`
            }
          />
        </div>
      )}
      {D.length > 0 && (
        <nav
          className={`sticky top-16 z-30 -mx-4 mb-6 flex gap-2 overflow-x-auto border-y border-line/60 bg-base/85 px-4 py-2.5 backdrop-blur-md sm:-mx-6 sm:px-6`}
          aria-label={`Sets`}
        >
          <U_1
            to={`/cards`}
            end
            className={({ isActive }) => Y(isActive)}
          >{`All sets`}</U_1>
          {D.map((e) => (
            <U_1
              key={e.id}
              to={`/cards/${e.id}`}
              className={({ isActive }) => Y(isActive)}
            >
              <span
                className={`size-2.5 rounded-full`}
                style={{
                  background: e.color,
                  boxShadow: `0 0 8px ${e.color}`,
                }}
                aria-hidden
              />
              <span
                className={`font-display text-[15px] font-extrabold tracking-wide`}
              >
                {e.id}
              </span>
              <span className={`hidden sm:inline`}>{e.name}</span>
              {!e.released && (
                <span className={`text-[11px] font-bold text-gold`}>
                  {X(G(e), nowHours) ?? `soon`}
                </span>
              )}
            </U_1>
          ))}
          <a href={`#packs`} className={Y(false)}>
            <Y1 className={`size-3.5`} aria-hidden />
            {` Packs`}
          </a>
        </nav>
      )}
      {setId && index && U.length === 0 && (
        <O1 title={`No set “${setId}”`} hint={`Pick one of the sets above.`} />
      )}
      <div className={`flex flex-col gap-8`}>
        {U.map((set) => (
          <WComponent
            key={set.id}
            set={set}
            index={index}
            releaseAt={G(set)}
            nowHours={nowHours}
            onPick={(card) =>
              set_({
                card,
                set,
              })
            }
          />
        ))}
      </div>
      {x && (
        <section id={`packs`} className={`mt-12 scroll-mt-32`}>
          <div
            className={`mb-4 flex flex-wrap items-end justify-between gap-3`}
          >
            <div>
              <div className={`eyebrow mb-1 text-gold/90`}>{`Sealed`}</div>
              <h2 className={`text-3xl text-ink`}>{`Packs and their odds`}</h2>
              <p
                className={`mt-1 max-w-2xl text-sm text-muted`}
              >{`Each slot draws one card of a rarity at these odds, from the sets that are out. When a rarity runs out, the slot gives the next rarity down.`}</p>
            </div>
          </div>
          <div className={`grid gap-4 xl:grid-cols-2`}>
            {x.packs.map((pack) => (
              <KComponent
                key={pack.id}
                pack={pack}
                index={index}
                sellers={q.get(pack.id)}
              />
            ))}
          </div>
        </section>
      )}
      {x && (
        <section
          className={`mt-12 grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]`}
        >
          <div className={`surface p-5`}>
            <div className={`eyebrow mb-1 text-gold/90`}>{`Rarities`}</div>
            <h2
              className={`mb-4 text-2xl text-ink`}
            >{`Five rarities, fixed print runs`}</h2>
            <div className={`flex flex-col gap-2`}>
              {__1.map((e) => {
                let t = x.rarities[e];
                if (!t) {
                  return null;
                }
                let n = t.color || v[e];
                return (
                  <div
                    key={e}
                    className={`grid grid-cols-[9rem_minmax(0,1fr)_5rem_5rem] items-center gap-3 rounded-xl border border-line/70 bg-base/40 px-3 py-2`}
                  >
                    <T rarity={e} label={t.label} color={n} size={`md`} />
                    <div
                      className={`h-2 overflow-hidden rounded-full bg-base ring-1 ring-line`}
                      title={`print run ${t.print_run}`}
                    >
                      <div
                        className={`h-full rounded-full`}
                        style={{
                          width: `${Math.max(2, (Math.log10(t.print_run) / Math.log10(300)) * 100)}%`,
                          background: n,
                        }}
                      />
                    </div>
                    <span className={`text-right font-mono text-sm text-ink`}>
                      {`×`}
                      {y_1(t.print_run)}
                    </span>
                    <span className={`text-right text-sm text-muted`}>
                      <B value={t.book} className={`text-base text-gold`} />
                      {` book`}
                    </span>
                  </div>
                );
              })}
            </div>
            <p
              className={`mt-3 text-xs text-muted`}
            >{`Book value is the public reference price. What a card is worth to your team is private — it depends on which neighbourhoods you care about and what you already hold.`}</p>
          </div>
          <div className={`surface p-5`}>
            <div className={`eyebrow mb-1 text-gold/90`}>{`Value`}</div>
            <h2
              className={`mb-4 text-2xl text-ink`}
            >{`How a collection is worth more`}</h2>
            <ul className={`flex flex-col gap-3 text-sm`}>
              {x.values.copy_marginals.map((e, t) => (
                <li key={t} className={`flex items-center gap-3`}>
                  <span
                    className={`grid size-9 shrink-0 place-items-center rounded-lg bg-raised font-display text-lg font-extrabold text-ink`}
                  >
                    {t + 1 === x.values.copy_marginals.length
                      ? `${t + 1}+`
                      : t + 1}
                  </span>
                  <span className={`text-muted`}>
                    {ee(t + 1)}
                    {t + 1 === x.values.copy_marginals.length
                      ? ` and later copies`
                      : ` copy`}
                    {` of a card: `}
                    <b className={`text-ink`}>{b(e)}</b>
                    {` of its value`}
                  </span>
                </li>
              ))}
              <li className={`flex items-center gap-3`}>
                <span
                  className={`grid size-9 shrink-0 place-items-center rounded-lg bg-good/15 text-good`}
                >
                  <B_1 className={`size-4`} aria-hidden />
                </span>
                <span className={`text-muted`}>
                  {`A complete page adds `}
                  <b className={`text-ink`}>{b(x.values.page_bonus)}</b>
                  {` of its cards' value`}
                </span>
              </li>
              <li className={`flex items-center gap-3`}>
                <span
                  className={`grid size-9 shrink-0 place-items-center rounded-lg bg-gold/15 text-gold`}
                >
                  <I className={`size-4`} aria-hidden />
                </span>
                <span className={`text-muted`}>
                  {`The page plus its epic and legendary add another `}
                  <b className={`text-ink`}>{b(x.values.master_bonus)}</b>
                </span>
              </li>
            </ul>
            <p
              className={`mt-4 text-xs text-muted`}
            >{`Duplicates are worth little to you and a lot to whoever is missing them — that is why people swap.`}</p>
          </div>
        </section>
      )}
      <N
        open={!!_}
        onClose={() => set_(null)}
        title={_?.card.name}
        description={_ ? `${_.card.id} · ${_.set.name}` : undefined}
        size={`lg`}
      >
        {_ && <JComponent card={_.card} set={_.set} />}
      </N>
    </div>
  );
}
function JComponent({ card, set }) {
  let { index } = n_3();
  let color = index?.rarityColor(card.rarity) ?? v[card.rarity];
  let s = Math.max(0, card.print_run - card.minted);
  return (
    <div
      className={`flex flex-col items-center gap-6 py-2 sm:flex-row sm:items-start`}
    >
      <I1 {...r(card, set, index)} size={`lg`} />
      <div className={`flex min-w-0 flex-1 flex-col gap-4`}>
        <div className={`flex flex-wrap items-center gap-2`}>
          <T
            rarity={card.rarity}
            label={index?.rarityLabel(card.rarity)}
            color={color}
            size={`md`}
            printRun={card.print_run}
          />
          <span
            className={r_1(
              `rounded-full border px-2.5 py-0.5 text-xs font-bold`,
              card.page
                ? `border-good/40 bg-good/10 text-good`
                : `border-gold/40 bg-gold/10 text-gold`,
            )}
          >
            {card.page ? `page card` : card.hidden ? `secret` : `shiny`}
          </span>
        </div>
        {card.flavour && (
          <p className={`text-base text-ink/85 italic`}>
            {`“`}
            {card.flavour}
            {`”`}
          </p>
        )}
        <dl className={`grid grid-cols-2 gap-3 text-sm`}>
          <div className={`rounded-xl border border-line bg-base/40 p-3`}>
            <dt className={`eyebrow`}>{`Print run`}</dt>
            <dd
              className={`mt-1 font-display text-2xl font-extrabold text-ink`}
            >
              {y_1(card.print_run)}
            </dd>
          </div>
          <div className={`rounded-xl border border-line bg-base/40 p-3`}>
            <dt className={`eyebrow`}>{`Book value`}</dt>
            <dd className={`mt-1 text-2xl text-gold`}>
              <B value={card.book} />
            </dd>
          </div>
          <div className={`rounded-xl border border-line bg-base/40 p-3`}>
            <dt className={`eyebrow`}>{`Found so far`}</dt>
            <dd
              className={`mt-1 font-display text-2xl font-extrabold text-ink`}
            >
              {y_1(card.minted)}
            </dd>
          </div>
          <div className={`rounded-xl border border-line bg-base/40 p-3`}>
            <dt className={`eyebrow`}>{`Still out there`}</dt>
            <dd
              className={`mt-1 font-display text-2xl font-extrabold text-ink`}
            >
              {y_1(s)}
            </dd>
          </div>
        </dl>
        <UComponent card={card} color={color} />
        <p className={`text-xs text-muted`}>
          {set.name}
          {`: `}
          {set.theme}
        </p>
      </div>
    </div>
  );
}
var Y = (e) =>
  r_1(
    `inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold whitespace-nowrap transition-colors`,
    e
      ? `border-gold/50 bg-gold/12 text-ink`
      : `border-line bg-panel/70 text-muted hover:text-ink`,
  );
function X(e, nowHours) {
  if (e === null || nowHours === null || e <= nowHours) {
    return null;
  }
  return h(e - nowHours);
}
function ee(e) {
  switch (e) {
    case 1:
      return `1st`;
    case 2:
      return `2nd`;
    case 3:
      return `3rd`;
    default:
      return `${e}th`;
  }
}
export { QComponent as default };
