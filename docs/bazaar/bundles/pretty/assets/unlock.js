import { c } from "./util.js";
const t = {
  opening_markup: {
    label: `Opening markup`,
    help: `First ask above list when selling; first bid below the ceiling when buying.`,
    min: 0,
    max: 2,
    step: 0.01,
    pct: true,
  },
  beta: {
    label: `Concession β`,
    help: `β > 1 concedes early (a conceder, like Abuela); β < 1 holds out until late (a boulware, like the strict dealers).`,
    min: 0.05,
    max: 8,
    step: 0.05,
  },
  max_rounds: {
    label: `Rounds to limit`,
    help: `Counter-offers until the curve reaches the walk-away price.`,
    min: 1,
    max: 60,
    step: 1,
    integer: true,
  },
  walk_after_rounds: {
    label: `Walks after`,
    help: `Rounds of patience; then it accepts only an offer at or past its limit, or walks away.`,
    min: 1,
    max: 80,
    step: 1,
    integer: true,
  },
  patience_jitter: {
    label: `Patience jitter`,
    help: `The walk-away round varies by up to ± this per conversation, so teams cannot count on it.`,
    min: 0,
    max: 20,
    step: 1,
    integer: true,
  },
  accept_margin: {
    label: `Accept margin`,
    help: `Accepts a team offer this close to its current target (share of book).`,
    min: 0,
    max: 1,
    step: 0.01,
    pct: true,
  },
  politeness_discount: {
    label: `Politeness discount`,
    help: `Most the limit can soften for a politeness score of 3 (share of book). 0 = words never move money.`,
    min: 0,
    max: 1,
    step: 0.01,
    pct: true,
  },
  demand_markup: {
    label: `Demand markup`,
    help: `The limit rises by this share of book as the hour's stock sells out (or its buying budget is spent).`,
    min: 0,
    max: 2,
    step: 0.01,
    pct: true,
  },
  limit_jitter: {
    label: `Limit jitter`,
    help: `Each conversation's secret limit moves by up to ± this share of book: the same five steps for every team, in a secret order, so one conversation never reveals the floor.`,
    min: 0,
    max: 1,
    step: 0.01,
    pct: true,
  },
  mirror_concessions: {
    label: `Mirror concessions`,
    help: `Tit-for-tat: never concedes faster than the team does, so stalling earns nothing.`,
  },
  welcome_first_deal: {
    label: `Welcome first deal`,
    help: `A team's very first conversation opens at a welcome price: the first deal is a small, sure win. The playground's Welcome offer switch shows it.`,
  },
  welcome_price_frac: {
    label: `Welcome price`,
    help: `The welcome offer as a share of book: selling at most this (buying at least 2 − this). Empty = at the persona's limit.`,
    min: 0,
    max: 2,
    step: 0.05,
    pct: true,
  },
};
const n = [
  `opening_markup`,
  `beta`,
  `max_rounds`,
  `walk_after_rounds`,
  `patience_jitter`,
  `accept_margin`,
  `politeness_discount`,
  `demand_markup`,
  `limit_jitter`,
  `mirror_concessions`,
  `welcome_first_deal`,
];
const r = [
  {
    key: `greet`,
    help: `opening offer`,
  },
  {
    key: `counter`,
    help: `a counter-offer`,
  },
  {
    key: `accept`,
    help: `deal done`,
  },
  {
    key: `walk`,
    help: `ends the talk`,
  },
  {
    key: `refuse`,
    help: `does not trade that`,
  },
  {
    key: `cooloff`,
    help: `sends a team away`,
  },
  {
    key: `menu`,
    help: `what it sells and buys`,
  },
  {
    key: `gift`,
    help: `a present (first line used)`,
  },
  {
    key: `warn`,
    help: `a strike warning (first line used)`,
  },
];
const i = [`{item}`, `{price}`, `{cur}`, `{reason}`, `{menu}`, `{gift}`];
const a = {
  dealer: `sells packs and singles, buys duplicates`,
  collector: `pays over book for what she loves`,
  trickster: `pressure tactics and switched cards — flag them`,
  banker: `deep pockets, endless patience`,
};
const o = {
  fake_deadline: `invents time pressure: “decide now, we close in a minute”`,
  fake_rival: `invents a competing bidder who offered more`,
  false_scarcity: `claims the item is the last one anywhere`,
};
function s(t, n, r, i) {
  if (n.always) {
    return `${t} trades with every team from the first tick.`;
  }
  let a = [];
  if (n.early_deals_with) {
    a.push(
      `unlocks early for a team after ${n.early_min_deals} deal${n.early_min_deals === 1 ? `` : `s`} with ${r(n.early_deals_with)}${n.early_min_level ? ` at level ${n.early_min_level} or more` : ``}`,
    );
  }
  if (n.open_to_all_at) {
    let t = c(n.open_to_all_at);
    let r = t !== null && i != null && t <= i;
    a.push(`opens to everyone at ${n.open_to_all_at}${r ? ` (passed)` : ``}`);
  }
  if (a.length) {
    return `${t} ${a.join(`, and `)}.`;
  }
  return `${t} has no unlock rule: only a game master can open it.`;
}
export { n as a, t as i, a as n, r as o, i as r, o as s, s as t };
