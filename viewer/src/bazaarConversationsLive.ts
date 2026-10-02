import { useEffect, useState } from "react";
import { fetchApi } from "./api.js";
import { conversationsModel, duelsModel, type ConversationThread, type Duel } from "./model/index.js";

const POLL_MS = 5_000;

/** `/api/bazaar/threads` + `/api/bazaar/duels`, sondeados cada 5 s mientras la pestaña está visible
 * (se detiene oculta y recarga al volver). Nunca calcula: solo arma el modelo puro a partir de lo
 * que ya sirvió el servidor. */
export function useBazaarConversations(): { threads: ConversationThread[]; duels: Duel[] } {
  const [threads, setThreads] = useState<ConversationThread[]>([]);
  const [duels, setDuels] = useState<Duel[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (document.hidden) return;
      try {
        const res = await fetchApi<ConversationThread[]>("bazaar/threads");
        if (!cancelled) setThreads(conversationsModel(res.data ?? []));
      } catch {
        // deja el último valor conocido
      }
      try {
        const res = await fetchApi<Duel[]>("bazaar/duels");
        if (!cancelled) setDuels(duelsModel(res.data ?? []));
      } catch {
        // deja el último valor conocido
      }
    };
    void load();
    const timer = setInterval(() => void load(), POLL_MS);
    const onVisibility = () => {
      if (!document.hidden) void load();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return { threads, duels };
}
