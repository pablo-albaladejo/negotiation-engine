import { extractScoreFields } from "/Users/pablo/development/hackathon/negotiation-ring/src/bazaar/score.ts";
const me = {score: {"team":"t02","name":"Team 2","score":0,"negotiating":0,"market":0,"neg_points":0,"mm_points":0,"duel_points":0,"ladder_points":0,"bench_efficiency":null,"bench_points":null,"bench_venue":null,"level":1,"album_filled":14,"album_slots":40,"pages_complete":0,"rarest":{"ref":"SAL-10"},"luck":0,"deals":0,"badges":[],"adjustments":[],"frozen":false,"venue":null,"luck_private":0,"rank":17}};
console.log(extractScoreFields(me));
