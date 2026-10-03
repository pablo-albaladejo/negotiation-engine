import { useEffect, useState } from "react";

/** Hora actual (ms) que se refresca cada `periodMs`: edades y cuentas atrás sin pedir nada al servidor. */
export function useNow(periodMs = 5_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), periodMs);
    return () => clearInterval(id);
  }, [periodMs]);
  return now;
}
