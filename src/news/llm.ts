import { spawn } from "node:child_process";
import { tmpdir } from "node:os";

/**
 * One headless `claude -p` call: prompt on stdin, answer on stdout. Resolves to the trimmed text, or null on any
 * failure, empty answer or timeout (the child is killed). Never throws. Display text only: never a figure.
 */
export function claudeOnce(prompt: string, { model = "haiku", timeoutMs = 60_000 }: { model?: string; timeoutMs?: number } = {}): Promise<string | null> {
  return new Promise((done) => {
    let settled = false;
    const finish = (v: string | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      done(v);
    };
    let child: ReturnType<typeof spawn>;
    try {
      // Run outside the repo so no project instructions or hooks are loaded.
      child = spawn("claude", ["-p", "--model", model], { cwd: tmpdir(), stdio: ["pipe", "pipe", "ignore"], env: process.env });
    } catch {
      done(null);
      return;
    }
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      finish(null);
    }, timeoutMs);
    let out = "";
    child.stdout?.setEncoding("utf8");
    child.stdout?.on("data", (c: string) => {
      out += c;
    });
    child.on("error", () => finish(null));
    child.on("close", (code) => {
      const text = out.trim();
      finish(code === 0 && text ? text : null);
    });
    child.stdin?.on("error", () => finish(null));
    child.stdin?.end(prompt);
  });
}
