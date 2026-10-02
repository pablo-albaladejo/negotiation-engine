# Bazaar kit — technical summary (source: /Users/pablo/Downloads/bazaar-kit/*, read those files for exact details)

Base URL https://bazaar.causaprima.ai · auth header `X-Team-Key: <BAZAAR_KEY>` (env BAZAAR_URL, BAZAAR_KEY; never print the key) · broker: `X-Broker-Key`.
Hours (Madrid): Fri 19–23 (60 s ticks), Sat 09–23 (30 s), Sun 09–15 (15 s). Per tick: 1 accept, 1 message per conversation, 12 new listings. Max 6 open conversations, 30 open offers. Too early → 429 code `wait_for_tick` with `next_tick_in`. Rate limit 5 req/s per key (burst 20) → `rate_limited`. Accepted offers settle next tick, atomically.

Cards: 6 sets (LAV, MAL, LAT, SAL; Retiro Sat; Chamberí Sun), 12 cards each (5 common, 3 uncommon, 2 rare, 1 epic, 1 legendary). Page = set's commons+uncommons+rares → bonus. Start: 400 P + 11 commons + 3 uncommons + 1 rare. `your_value` is PRIVATE per team (duplicates worth little to you, much to others) — GET /api/me (assets[].your_value, album) and GET /api/me/value?card=LAV-09.

Dealers: Abuela Carmen open (buys/sells cards and packs, natural language; "only moves when you move", same price again earns nothing, small steps earn small steps; patience runs out → standing offer `final: true`, take it or she walks; she remembers treatment, likes kindness). More dealers unlock as levels; a deal at the dealer's OPENING price does not count; a few good negotiated deals unlock the next level early. Some dealers lie → POST /api/flags {message_id, reason} (correct flag scores, wrong costs). Prompt injection allowed vs dealers (changes words, never prices). Errors: locked, cooloff (until_tick), persona_quota (come back next hour), sold_out, insufficient_cash, asset_locked, wait_for_tick, rate_limited, bad_key.

Scoring (per day, Fri ×0.5, averaged): Negotiating 30 = duels (share of pie) + dealer ladder (share of the price range captured; best 3 deals per level; higher levels weigh more) + trades with teams at your private values. Market-making 30 = venue efficiency in Market Test + value created on your venue. Judges 40. Never counts: number of trades, fees, pack luck, gifts, easter eggs.

API (team):
- GET /api/clock {tick, tick_seconds, paused, next_tick_in, limits}; /api/catalog {sets[{cards[{id,name,book,print_run,minted}]}], packs[{id, expected_book, slot_odds}], value_rules}; /api/dealers {dealers[{id,name,level,status,unlock_rule,traits,menu}]}; /api/levels; /api/feed; /api/leaderboard; /api/venues; /api/venues/{v}/offers; /api/cards/{id}.
- GET /api/me {name, cash, level, unlocked_dealers, assets[{id, kind card|pack, ref, name, your_value, serial, print_run, rarity}], album, score}; /api/me/threads; /api/me/offers {open, queued, to_me}.
- POST /api/threads {with:"abuela", topic:{buy:{pack:"sobre_barrio"}} | {buy:{card:"LAV-09"}} | {buy:{rarity:"rare", set:"LAV"}} | {sell:{assets:[id]}}} → {id, status, messages, standing_offers}.
- GET /api/threads/{id} {status open|deal|walked|closed|cooloff, closed_reason, messages[{id,text,sender,price,offer}], standing_offers[{id, maker, status, give, want, final}]}.
- POST /api/threads/{id}/messages {text, price} (with dealers: price is our counter) → {message, standing_offer}. POST /api/threads/{id}/close.
- POST /api/offers {give:{assets|cash}, want:{cash|cards}, venue, to, expires_in_ticks}; DELETE /api/offers/{id}; POST /api/offers/{id}/accept {assets?}; POST /api/packs/{id}/open → {cards}.
- Duels: GET /api/duels {duels[{id, role seller|buyer, your_limit, rival_offer, deadline, issues ["price","days"]}]}; POST /api/duels/{id}/messages {text, price, offer:{price, days 0-10}}; POST /api/duels/{id}/accept. Pie shrinks with talk. Friday practice round scores 0.
- Venues (level ≥2, 250 P + 20 P bond, live +3h): POST /api/venues {name, fee_bps≤1000, fee_per_card≤5, rules{mechanism auto|board,...}} → broker_key once. Broker: GET /api/broker/book, POST /api/broker/matches {sell, buy, price}.
Limits: text ≤1200 chars, ≤50 items per offer side, prices 1–10M.

starter_agent.py (naive): buys a sobre_barrio pack from abuela with +2 P counters up to 80% of expected_book, opens it, lists duplicates at book on El Rastro.
