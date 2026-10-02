import { useEffect, useState } from "react";
import type { TraceLine } from "../../src/pipeline/trace.js";
import type { ApiError } from "./api.js";
import { emptyLiveFeed, type LiveFeed } from "./model/index.js";

/** Aplica un evento de `/api/live` al feed: `session` cambia de sesión (la anterior queda para el descanso). */
export function applyLiveEvent(feed: LiveFeed, event: string, data: unknown, at: number): LiveFeed {
  if (event === "session") {
    const d = data as { runId: string; session: string };
    if (d.session === feed.session) return feed;
    const previous = feed.session !== null && feed.lines.length > 0 ? { session: feed.session, lines: feed.lines } : feed.previous;
    return { runId: d.runId, session: d.session, lines: [], previous, lastEventAt: at };
  }
  if (event === "record") {
    const d = data as { session: string; record: TraceLine };
    if (d.session !== feed.session) return feed;
    return { ...feed, lines: [...feed.lines, d.record], lastEventAt: at };
  }
  return feed;
}

/** Cliente SSE con `EventSource` (reconexión nativa). Badge state es log-derived. */
export function useLiveFeed(): { feed: LiveFeed; errors: ApiError[] } {
  const [feed, setFeed] = useState<LiveFeed>(emptyLiveFeed);
  const [errors, setErrors] = useState<ApiError[]>([]);
  useEffect(() => {
    const source = new EventSource("/api/live");
    const on = (event: string) => (e: MessageEvent<string>) => setFeed((f) => applyLiveEvent(f, event, JSON.parse(e.data), Date.now()));
    source.addEventListener("session", (e) => {
      setErrors([]);
      on("session")(e);
    });
    source.addEventListener("record", on("record"));
    source.addEventListener("invalid", (e) => setErrors((list) => [...list.slice(-19), JSON.parse((e as MessageEvent<string>).data) as ApiError]));
    return () => {
      source.close();
    };
  }, []);
  return { feed, errors };
}
