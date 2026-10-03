import { t } from "./jsx-runtime-CU3EbJiN.js";
import { r } from "./Button-DIaWEsZ9.js";
import { t as N } from "./arrow-right-aSvo4Cqf.js";
import { T, v } from "./useEvents-BpJ5PfZT.js";
import { t as A } from "./package-BroSsHdu.js";
import { n as n_1 } from "./catalog-C4CNN-Mb.js";
import { S, T as T_1, v as v_1 } from "./index-B_RfsMCE.js";
const u = t();
const d = {
  open: `border-info/40 bg-info/10 text-info`,
  queued: `border-gold/40 bg-gold/10 text-gold`,
  settled: `border-good/40 bg-good/10 text-good`,
  cancelled: `border-line bg-transparent text-faint`,
  expired: `border-line bg-transparent text-faint`,
  failed: `border-accent/40 bg-accent/10 text-accent`,
};
function FComponent({ status }) {
  return (
    <span
      className={r(
        `inline-flex h-5 items-center rounded-full border px-2 text-[10px] font-bold uppercase tracking-wider`,
        d[status] ?? d.cancelled,
      )}
    >
      {status}
    </span>
  );
}
function PComponent({ color, children, title, dashed }) {
  return (
    <span
      title={title}
      className={r(
        `inline-flex max-w-full items-center gap-1.5 rounded-md border px-1.5 py-0.5 text-[12px] font-semibold leading-tight`,
        dashed && `border-dashed`,
      )}
      style={{
        color,
        borderColor: `${color}66`,
        background: `${color}14`,
      }}
    >
      {children}
    </span>
  );
}
function MComponent({ side, empty = `nothing` }) {
  let { index } = n_1();
  let symbol = index?.symbol ?? `P`;
  let s = [];
  for (let asset of side?.assets ?? []) {
    s.push(<HComponent key={`a${asset.id}`} asset={asset} />);
  }
  for (let t of side?.types ?? []) {
    let { kind, ref } = T_1(t);
    if (kind === `pack`) {
      let e = index?.packs.get(ref);
      s.push(
        <PComponent
          key={t}
          color={e?.color ?? `#E0A458`}
          title={`any ${e?.name ?? ref}`}
        >
          <A className={`size-3`} aria-hidden />
          {e?.name ?? ref}
        </PComponent>,
      );
    } else {
      let e = index?.cards.get(ref);
      let a = e?.card.rarity;
      s.push(
        <PComponent
          key={t}
          color={a ? (index?.rarityColor(a) ?? v[a]) : `#9AA4B8`}
          dashed
          title={`any copy of ${ref}`}
        >
          <span className={`font-mono text-[10px] opacity-80`}>{ref}</span>
          {e?.card.name ?? ``}
        </PComponent>,
      );
    }
  }
  if (side?.cash) {
    s.push(
      <PComponent key={`cash`} color={`#FFC44D`}>
        {v_1(side.cash, {
          symbol,
        })}
      </PComponent>,
    );
  }
  if (s.length) {
    return (
      <span className={`inline-flex flex-wrap items-center gap-1`}>{s}</span>
    );
  }
  return <span className={`text-xs italic text-faint`}>{empty}</span>;
}
function HComponent({ asset }) {
  let { index } = n_1();
  if (asset.kind === `pack`) {
    let n = index?.packs.get(asset.ref);
    return (
      <PComponent color={n?.color ?? `#E0A458`} title={`pack #${asset.id}`}>
        <A className={`size-3`} aria-hidden />
        {asset.name ?? n?.name ?? asset.ref}
        <span className={`font-mono text-[10px] opacity-70`}>
          {`#`}
          {asset.serial}
        </span>
      </PComponent>
    );
  }
  let n = index?.cards.get(asset.ref);
  let c = asset.rarity ?? n?.card.rarity;
  let color = c && T(c) ? (index?.rarityColor(c) ?? v[c]) : `#9AA4B8`;
  return (
    <PComponent color={color} title={`asset #${asset.id} · ${asset.ref}`}>
      <span className={`font-mono text-[10px] opacity-80`}>{asset.ref}</span>
      {asset.name ?? n?.card.name ?? ``}
      <span className={`font-mono text-[10px] opacity-70`}>
        {S(asset.serial, asset.print_run ?? n?.card.print_run)}
      </span>
    </PComponent>
  );
}
export function n({ offer, name, className, hideMaker }) {
  return (
    <div
      className={r(
        `flex flex-wrap items-center gap-x-2 gap-y-1.5 rounded-lg border border-line bg-base/60 px-2.5 py-2 text-xs`,
        className,
      )}
    >
      <span className={`font-mono text-[10px] text-faint`}>
        {`#`}
        {offer.id}
      </span>
      {!hideMaker && (
        <span className={`font-semibold text-muted`}>{name(offer.maker)}</span>
      )}
      <span className={`text-faint`}>{`gives`}</span>
      <MComponent side={offer.give} />
      <N className={`size-3.5 text-faint`} aria-hidden />
      <span className={`text-faint`}>{`wants`}</span>
      <MComponent side={offer.want} />
      <span className={`ml-auto flex items-center gap-2`}>
        <FComponent status={offer.status} />
        {offer.status === `open` && (
          <span className={`font-mono text-[10px] text-faint`}>
            {`until T`}
            {offer.expires_tick}
          </span>
        )}
      </span>
    </div>
  );
}
export { FComponent as t };
