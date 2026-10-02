process.loadEnvFile(".env");
const u = process.env.BAZAAR_URL!, k = process.env.BAZAAR_KEY!;
const g = async (p: string) => (await fetch(u + p, { headers: { "X-Team-Key": k } })).json();
const d = await g("/api/dealers"); console.log("MENU", JSON.stringify(d.personas[0].menu), "\nOTHER", JSON.stringify(d.personas.slice(1).map((p: any) => ({ id: p.id, name: p.name, status: p.status, level: p.level }))), "\nDKEYS", Object.keys(d));
const c = await g("/api/catalog"); console.log("RARITIES", JSON.stringify(c.rarities).slice(0, 600), "\nVALUES", JSON.stringify(c.values).slice(0, 900));
const me = await g("/api/me"); console.log("AFFINITY", JSON.stringify(me.affinity), "OPEN", JSON.stringify(me.open_threads), "UNLOCKED", JSON.stringify(me.unlocked));
console.log("ASSETS", JSON.stringify(me.assets.map((a: any) => [a.id, a.ref, a.rarity, a.your_value])));
