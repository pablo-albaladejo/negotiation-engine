import { useEffect, useState } from "react";

/** Current time (ms) refreshed every `periodMs`: ages and countdowns without asking the server. */
export function useNow(periodMs = 5_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), periodMs);
    return () => clearInterval(id);
  }, [periodMs]);
  return now;
}
