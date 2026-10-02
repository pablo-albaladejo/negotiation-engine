#!/usr/bin/env node
// Escaneo de solo lectura de la API del Bazaar: GET a cada endpoint conocido, guarda las respuestas
// completas en results/bazaar-live/<fecha>/api-scan-HHMM.json e imprime la forma de cada una.
// Uso: set -a && . ./.env && . ./.env.broker && set +a && pnpm bazaar:scan
// Nunca imprime claves. /api/cards/{id} pide el id NUMÉRICO del asset (no la ref tipo "SAL-09"):
// se usan los ids de nuestras cartas de /api/me. /api/broker/book usa X-Broker-Key si está en el entorno.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const URL = process.env.BAZAAR_URL;
const KEY = process.env.BAZAAR_KEY;
const BROKER = process.env.BAZAAR_BROKER_KEY ?? process.env.BROKER_KEY;
if (!URL || !KEY) {
  console.error("Faltan BAZAAR_URL / BAZAAR_KEY (carga .env)");
  process.exit(1);
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function get(path, headers = { "X-Team-Key": KEY }) {
  try {
    const r = await fetch(URL + path, { headers });
    const text = await r.text();
    let body;
    try { body = JSON.parse(text); } catch { body = text.slice(0, 500); }
    return { status: r.status, body };
  } catch (e) {
    return { status: `ERR ${e?.cause?.code ?? e}`, body: null };
  }
}
const shape = (v) =>
  Array.isArray(v)
    ? `[${v.length}]` + (v[0] && typeof v[0] === "object" ? `{${Object.keys(v[0]).slice(0, 12).join(",")}}` : "")
    : v && typeof v === "object"
      ? `{${Object.keys(v).slice(0, 16).map((k) => k + (Array.isArray(v[k]) ? `[${v[k].length}]` : "")).join(",")}}`
      : JSON.stringify(v);

const team = [
  "/api/clock", "/api/schedule", "/api/levels", "/api/catalog", "/api/dealers", "/api/leaderboard",
  "/api/feed?limit=300", "/api/venues", "/api/venues/rastro/offers",
  "/api/me", "/api/me/threads", "/api/me/offers", "/api/duels",
];
const out = {};
async function scan(path, headers) {
  const res = await get(path, headers);
  out[path] = res;
  console.log(`${String(res.status).padEnd(4)} ${path.padEnd(30)} ${shape(res.body)}`.slice(0, 240));
  await sleep(250); // < 5 req/s
  return res;
}
for (const p of team) await scan(p);

// Nuestro venue y sus ofertas.
const mine = out["/api/venues"]?.body?.venues?.find((v) => v.owner === out["/api/me"]?.body?.id);
if (mine?.venue) await scan(`/api/venues/${mine.venue}/offers`);

// Valor privado de cada carta que nos falta para completar una página, y detalle de un par de assets nuestros.
const assets = out["/api/me"]?.body?.assets ?? [];
for (const a of assets.filter((x) => x.kind === "card").slice(0, 2)) await scan(`/api/cards/${a.id}`);
await scan("/api/me/value?card=SAL-09");

// Broker (solo si hay clave de broker en el entorno).
if (BROKER) await scan("/api/broker/book", { "X-Broker-Key": BROKER });
else console.log("skip /api/broker/book (sin BAZAAR_BROKER_KEY en el entorno: carga .env.broker)");

const now = new Date();
const day = now.toLocaleDateString("sv-SE"); // fecha local AAAA-MM-DD
const hhmm = now.toTimeString().slice(0, 5).replace(":", "");
const dir = join(process.cwd(), "results", "bazaar-live", day);
mkdirSync(dir, { recursive: true });
const file = join(dir, `api-scan-${hhmm}.json`);
writeFileSync(file, JSON.stringify(out));
console.log(`guardado ${file}`);
