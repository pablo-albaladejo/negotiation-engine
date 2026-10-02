import { request } from "node:http";

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
