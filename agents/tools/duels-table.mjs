// Live duel table for one server session (Duels I = 2, II = 3, III = 4), refreshed every 15 s. GET only.
// Usage: node agents/tools/duels-table.mjs [session] [--out file] [--tty]
//   writes results/duels/<file> (default duels-s<session>.txt) and logs each close's duel_points jump in results/duels/dpts.log;
//   --tty also redraws the terminal. Watch it with: watch -n 15 cat results/duels/duels-s4.txt
import { readFileSync, writeFileSync, existsSync, appendFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const DIR = join(ROOT, "results", "duels");
mkdirSync(DIR, { recursive: true });
const SESSION = Number(process.argv.slice(2).find((a) => /^\d+$/.test(a)) ?? 4);
const outArg = process.argv.indexOf("--out");
const OUT = join(DIR, outArg > 0 ? process.argv[outArg + 1] : `duels-s${SESSION}.txt`);
const TITLE = { 2: "Duelos I", 3: "Duelos II", 4: "Duelos III" }[SESSION] ?? `Duels session ${SESSION}`;
const TRACK = join(DIR, "dpts.log");
// One line per tick where duels of ours closed: {tick, session, before, after, delta, duels[]} (shared jump when duels.length > 1).
const duelPointsFile = () => { const d = new Date(); const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; return join(ROOT, "results", "bazaar-live", day, "duel-points.jsonl"); };
function writeDuelPoints(rec) { const f = duelPointsFile(); mkdirSync(dirname(f), { recursive: true }); appendFileSync(f, `${JSON.stringify(rec)}\n`); }
const TTY = process.argv.includes("--tty");
// Keys only from .env (BAZAAR_KEY, BAZAAR_URL).
const env = Object.fromEntries(readFileSync(join(ROOT, ".env"), "utf8").split("\n").filter((l) => l.includes("=") && !l.startsWith("#")).map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]));
const H = { "X-Team-Key": env.BAZAAR_KEY };
const BASE = env.BAZAAR_URL || "https://bazaar.causaprima.ai";
const get = async (p) => { const r = await fetch(BASE + p, { headers: H }); if (!r.ok) throw new Error(`${p} ${r.status}`); return r.json(); };

// Δduel_points per duel: seeded from the earlier tracker log; shared deltas are marked with "*".
const dpts = new Map();
// Keep the Δpts column of the previous run's table across restarts.
if (existsSync(OUT)) for (const line of readFileSync(OUT, "utf8").split("\n")) {
  const c = line.split("|").map((x) => x.trim());
  if (c.length > 9 && /^\d+$/.test(c[1]) && c[9] && c[9] !== "·" && c[9] !== "Δpts") dpts.set(Number(c[1]), c[9]);
}
if (existsSync(TRACK)) for (const line of readFileSync(TRACK, "utf8").split("\n")) {
  const m = line.match(/Δduel_points (-?[\d.]+) .*closed: (.*)$/);
  if (!m) continue;
  const ids = [...m[2].matchAll(/(\d+) (?:buyer|seller)/g)].map((x) => x[1]);
  ids.forEach((id, k) => dpts.set(Number(id), ids.length > 1 ? (k === 0 ? `${sign(m[1])}*` : "*") : sign(m[1])));
}
function sign(v) { const n = Number(v); return `${n >= 0 ? "+" : ""}${n.toFixed(2)}`; }

const pad = (s, n, right = false) => { s = String(s); return s.length >= n ? s.slice(0, n) : right ? s.padStart(n) : s.padEnd(n); };
const COLS = [["Duel", 5], ["Rol", 4], ["Rival", 11], ["Carta", 22], ["Estado", 7], ["Rnd", 3], ["Trato (P/día)", 16], ["Result", 6], ["Δpts", 6]];
const sep = "+" + COLS.map(([, n]) => "-".repeat(n + 2)).join("+") + "+";
const row = (cells) => "| " + cells.map((c, k) => pad(c, COLS[k][1], k === 5 || k === 7 || k === 8)).join(" | ") + " |";

let prevPts, prevClosed;
for (;;) {
  try {
    const clock = await get("/api/clock");
    const me = await get("/api/me");
    const done = await get("/api/duels?done=true");
    const live = await get("/api/duels");
    const all = new Map();
    for (const d of [...done.duels, ...live.duels]) if (d.session === SESSION) all.set(d.duel, d);
    const closed = [...all.values()].filter((d) => d.status !== "live");
    const pts = me.score?.duel_points;
    if (prevPts !== undefined) {
      const fresh = closed.filter((d) => !prevClosed.has(d.duel));
      if (fresh.length) appendFileSync(TRACK, `t${clock.tick} Δduel_points ${(pts - prevPts).toFixed(2)} (${prevPts} → ${pts}) · closed: ${fresh.map((d) => `${d.duel} ${d.role}`).join(" | ")}\n`);
      // Same jump for the viewer's Points column (a duel has no settlement, so score-audit never sees it).
      if (fresh.length) writeDuelPoints({ tick: clock.tick, session: SESSION, before: prevPts, after: pts, delta: Math.round((pts - prevPts) * 1000) / 1000, duels: fresh.map((d) => d.duel) });
      if (fresh.length) fresh.forEach((d, k) => dpts.set(d.duel, fresh.length > 1 ? (k === 0 ? `${sign(pts - prevPts)}*` : "*") : sign(pts - prevPts)));
    }
    prevPts = pts; prevClosed = new Set(closed.map((d) => d.duel));

    const sorted = [...all.values()].sort((a, b) => a.duel - b.duel);
    const lines = [`${TITLE} · ${new Date().toTimeString().slice(0, 8)} · tick ${clock.tick} · duel_points ${pts}`, sep, row(COLS.map(([h]) => h)), sep];
    for (const d of sorted.filter((d) => d.status !== "live"))
      lines.push(row([d.duel, d.role === "seller" ? "vend" : "comp", d.rival ?? "", d.item ?? "", d.status === "deal" ? "deal" : "NO DEAL", d.rounds ?? "", d.price != null ? `${d.price}/${d.days ?? 0}` : "-", d.result != null ? `${d.result > 0 ? "+" : ""}${Number(d.result).toFixed(1)}` : "", dpts.get(d.duel) ?? "·"]));
    const liveRows = sorted.filter((d) => d.status === "live");
    if (liveRows.length) {
      lines.push(sep, row(["", "", "EN VIVO", "", "quedan", "", "nuestra vs rival", "", ""]));
      for (const d of liveRows) {
        const o = (x) => (x ? `${x.price}/${x.days ?? 0}` : "-");
        lines.push(row([d.duel, d.role === "seller" ? "vend" : "comp", d.rival ?? "", d.item ?? "", `${d.deadline_tick - clock.tick} tk`, d.rounds ?? "", `${o(d.your_offer)} vs ${o(d.rival_offer)}`, "", ""]));
      }
    }
    const deals = closed.filter((d) => d.status === "deal").length;
    const sum = (role) => closed.filter((d) => !role || d.role === role).reduce((s, d) => s + (d.result ?? 0), 0);
    const n = (role) => closed.filter((d) => d.role === role).length;
    lines.push(sep, `Cerrados ${closed.length} · ${deals} deals · ${closed.length - deals} no deal · en vivo ${liveRows.length}`,
      `vend ${n("seller")} → ${sum("seller").toFixed(1)} P · comp ${n("buyer")} → ${sum("buyer").toFixed(1)} P · total ${sum().toFixed(1)} P`,
      `Δpts: real duel_points jump at close · "*" = closed in the same tick (shared jump) · "·" = closed before tracking`);
    const text = lines.join("\n") + "\n";
    writeFileSync(OUT, text);
    if (TTY) process.stdout.write("\x1b[2J\x1b[H" + text);
  } catch (e) {
    if (TTY) process.stdout.write(`error ${e.message}\n`);
  }
  await new Promise((r) => setTimeout(r, 15000));
}
