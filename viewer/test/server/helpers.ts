import { cpSync, mkdirSync, mkdtempSync, readdirSync, statSync, symlinkSync, writeFileSync } from "node:fs";
import { request } from "node:http";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import type { ViewerFixtures } from "../fixtures.js";

export interface Reply {
  status: number;
  headers: Record<string, string | string[] | undefined>;
  text: string;
  json: { data: unknown; errors: { file: string | null; line: number | null; path: string; message: string }[] };
}

/** GET crudo (sin normalizar `..` ni `%2e`) con `Host` y método a elección. */
export function get(port: number, path: string, opts: { method?: string; host?: string } = {}): Promise<Reply> {
  return new Promise((resolve, reject) => {
    const req = request(
      { host: "127.0.0.1", port, path, method: opts.method ?? "GET", headers: { host: opts.host ?? `127.0.0.1:${port}` } },
      (res) => {
        let text = "";
        res.setEncoding("utf8");
        res.on("data", (c: string) => (text += c));
        res.on("end", () => resolve({ status: res.statusCode ?? 0, headers: res.headers, text, json: text ? JSON.parse(text) : null }));
      },
    );
    req.on("error", reject);
    req.end();
  });
}

/**
 * Repo temporal: `results/` con el run de arena de los fixtures (`fx`) y la sesión de torneo
 * (`agent-test`), `config/` con escenario, campeona y ficheros fuera de la lista, y un directorio
 * de fuera enlazado como `results/evil`.
 */
export function makeRepo(fx: ViewerFixtures): { root: string; outside: string; sessionId: string } {
  const root = mkdtempSync(join(tmpdir(), "viewer-repo-"));
  const outside = mkdtempSync(join(tmpdir(), "viewer-outside-"));
  writeFileSync(join(outside, "summary.json"), "{}");
  writeFileSync(join(outside, "secret.jsonl"), '{"secret":true}\n');
  cpSync(fx.dirs.runDir, join(root, "results", fx.runId), { recursive: true });
  cpSync(fx.dirs.tournamentDir, join(root, "results", "agent-test"), { recursive: true });
  symlinkSync(outside, join(root, "results", "evil"));
  symlinkSync(join(outside, "secret.jsonl"), join(root, "results", "agent-test", "leak.jsonl"));
  mkdirSync(join(root, "config", "arena"), { recursive: true });
  mkdirSync(join(root, "config", "candidates"), { recursive: true });
  cpSync(fx.dirs.scenarioPath, join(root, "config", basename(fx.dirs.scenarioPath)));
  writeFileSync(join(root, "config", "champion.json"), '{"version":1}');
  writeFileSync(join(root, "config", "arena", "scenarios.json"), "[]");
  writeFileSync(join(root, "config", "candidates", "x.json"), '{"version":2}');
  const sessionFile = readdirSync(join(root, "results", "agent-test")).find((f) => f !== "leak.jsonl")!;
  return { root, outside, sessionId: sessionFile.replace(/\.jsonl$/, "") };
}

/** Instantánea (ruta, tamaño, mtime) del árbol para comprobar que nada cambió. */
export function snapshot(dir: string): string[] {
  const out: string[] = [];
  const walk = (d: string) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name);
      if (e.isDirectory()) walk(p);
      else {
        const s = statSync(p);
        out.push(`${p}:${s.size}:${s.mtimeMs}`);
      }
    }
  };
  walk(dir);
  return out.sort();
}
