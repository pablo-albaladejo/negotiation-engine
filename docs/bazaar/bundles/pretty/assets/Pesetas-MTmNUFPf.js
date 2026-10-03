import { t } from "./jsx-runtime-CU3EbJiN.js";
import { r as r_1 } from "./Button-DIaWEsZ9.js";
import { n } from "./catalog-C4CNN-Mb.js";
import { h, s as I, v } from "./index-B_RfsMCE.js";
export function i(e) {
  if (!e) {
    return null;
  }
  let t = /^\+(\d+(?:\.\d+)?)([hm])$/.exec(e.trim());
  if (t) {
    if (t[2] === `h`) {
      return Number(t[1]);
    }
    return Number(t[1]) / 60;
  }
  return null;
}
function s(opensAt, t) {
  if (opensAt === null || t == null) {
    return null;
  }
  let n = opensAt - t;
  if (n > 0) {
    return `in ${h(n)}`;
  }
  return null;
}
export function a(e, t, n, r) {
  let e_unlock = e.unlock;
  if (e_unlock.always) {
    return {
      openNow: e.enabled,
      early: null,
      earlyShort: null,
      everyone: `Open to every team from the start`,
      short: `Open`,
      opensAt: null,
    };
  }
  let a =
    e_unlock.early_deals_with && e_unlock.early_min_deals > 0
      ? `${e_unlock.early_min_deals} deal${e_unlock.early_min_deals === 1 ? `` : `s`} with ${t(e_unlock.early_deals_with)}`
      : null;
  let early = a
    ? `After ${a}${e_unlock.early_min_level > 1 ? `, from level ${e_unlock.early_min_level}` : ``}`
    : null;
  let earlyShort = a
    ? `${a}${e_unlock.early_min_level > 1 ? ` · L${e_unlock.early_min_level}+` : ``}`
    : null;
  let opensAt = r ?? i(e_unlock.open_to_all_at);
  let d = s(opensAt, n);
  let everyone;
  everyone = e.open_to_all
    ? e_unlock.open_to_all_at
      ? `Open to everyone since ${e_unlock.open_to_all_at}`
      : `Open to everyone`
    : d
      ? `Opens to everyone ${d}`
      : e_unlock.open_to_all_at
        ? `Opens to everyone at ${e_unlock.open_to_all_at}`
        : `Only through the early route`;
  let short = e.open_to_all ? `Open` : (d ?? `Locked`);
  return {
    openNow: e.open_to_all,
    early,
    earlyShort,
    everyone,
    short,
    opensAt,
  };
}
function l(e) {
  let t = e?.weights;
  if (!t || typeof t.negotiating != `number` || typeof t.market != `number`) {
    return null;
  }
  return {
    negotiating: t.negotiating,
    market: t.market,
  };
}
export function r(e) {
  let t = new Map();
  for (let n of e ?? []) {
    let e = n.params.persona;
    if (n.action === `persona_opens` && typeof e == `string`) {
      t.set(e, n.at_hours);
    }
  }
  return t;
}
const d = t();
function FComponent({ value, compact, className }) {
  let { index } = n();
  let symbol = index?.symbol ?? `P`;
  if (value == null || !Number.isFinite(value)) {
    return <span className={className}>{`—`}</span>;
  }
  let value_1 = v(value, {
    symbol: ``,
    compact,
  });
  return (
    <span
      className={r_1(`inline-flex items-baseline whitespace-nowrap`, className)}
      title={v(value, {
        symbol,
        compact,
      })}
    >
      <I value={value_1} className={`leading-none`} />
      <span
        className={`ml-[0.16em] font-sans text-[0.8em] font-bold opacity-90`}
      >
        {symbol}
      </span>
    </span>
  );
}
export { l as n, FComponent as t };
