import { Card, Flag, Pill } from "@negotiation-ring/design-system";
import { useEffect, useState } from "react";
import { fetchApi } from "../../api.js";
import { useNow } from "../../ui/use-now.js";
import { ageLabel } from "./nowModel.js";

/**
 * «Radio Rastro» panel: the summary that `pnpm bazaar:news` writes (`/api/bazaar/news`, file only) and the
 * latest items. Display only: some news is true, some is rumour, some is just Madrid. Plain text only.
 */

interface NewsMention {
  name: string;
  kind: string;
}
interface NewsItem {
  id: number;
  tick: number | null;
  source: string;
  source_name: string;
  headline: string;
  body: string;
  mentions: NewsMention[];
}
interface NewsData {
  available: boolean;
  updatedAt?: string;
  count?: number;
  items?: NewsItem[];
  summary?: { text: string; by: "llm" | "rules"; at: string };
}

const POLL_MS = 15_000;
const SHOWN = 6;

function useNews(): NewsData | null {
  const [news, setNews] = useState<NewsData | null>(null);
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (document.hidden) return;
      try {
        const res = await fetchApi<NewsData | null>("bazaar/news");
        // A server without the route answers 404 with `data: null`: shown as "no summary yet".
        if (!cancelled) setNews(res.data && typeof res.data === "object" ? res.data : { available: false });
      } catch {
        // keep the last known value
      }
    };
    void load();
    const id = setInterval(() => void load(), POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);
  return news;
}

const col = { display: "flex", flexDirection: "column", gap: "var(--space-2)" } as const;
const row = { display: "flex", gap: "var(--space-2)", alignItems: "center", flexWrap: "wrap" } as const;

export function RadioRastro() {
  const news = useNews();
  const now = useNow(5_000);
  const items = Array.isArray(news?.items) ? news.items.slice(0, SHOWN) : [];
  const summary = news?.summary;
  const age = summary?.at ? Math.max(0, Math.round((now - Date.parse(summary.at)) / 1000)) : null;
  return (
    <Card title={`Radio Rastro${news?.available && typeof news.count === "number" ? ` · ${news.count} item${news.count === 1 ? "" : "s"}` : ""}`}>
      <div style={col}>
        {!news ? (
          <span className="nr-muted">Loading news…</span>
        ) : !news.available ? (
          <span className="nr-muted">No news summary yet (pnpm bazaar:news writes it).</span>
        ) : (
          <>
            {summary ? (
              <div style={row}>
                <Pill kind={summary.by === "llm" ? "sample" : "verdict"}>{summary.by}</Pill>
                <span className="nr-muted">{`${ageLabel(age)} ago`}</span>
                <span>{summary.text}</span>
              </div>
            ) : null}
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
              {items.map((i) => (
                <li key={i.id} style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
                  <div style={row}>
                    <Flag kind={i.source === "radio" ? "decision" : "neutral"}>{i.source_name || i.source}</Flag>
                    <span className="nr-muted">{`tick ${i.tick ?? "?"}`}</span>
                    <strong>{i.headline}</strong>
                    {(i.mentions ?? []).map((m) => (
                      <Flag key={`${m.kind}:${m.name}`} kind="fallback">{`${m.kind} · ${m.name}`}</Flag>
                    ))}
                  </div>
                  {i.body ? <span className="nr-muted">{i.body}</span> : null}
                </li>
              ))}
            </ul>
          </>
        )}
        <span className="nr-muted">Some is true, some is rumour, some is just Madrid.</span>
      </div>
    </Card>
  );
}
