/**
 * Last-free-copy guardrail: no sale or payment may leave us without a free copy of a card. A copy is free when we hold
 * it and it is neither locked (another offer, a dealer thread) nor reserved (a pending acceptance, busy elsewhere).
 */

export interface HeldCopy {
  id: number;
  ref: string;
}

/** Free copies per card: held minus locked minus reserved. */
export function freeCounts(held: readonly HeldCopy[], lockedIds: ReadonlySet<number>, reservedIds: ReadonlySet<number>): Map<string, number> {
  const c = new Map<string, number>();
  for (const a of held) if (!lockedIds.has(a.id) && !reservedIds.has(a.id)) c.set(a.ref, (c.get(a.ref) ?? 0) + 1);
  return c;
}

/**
 * True if handing over `assetIds` is not allowed: one of them is not a free copy we hold, or giving them would leave
 * 0 free copies of one of their cards.
 */
export function takesLastFreeCopy(assetIds: readonly number[], held: readonly HeldCopy[], lockedIds: ReadonlySet<number>, reservedIds: ReadonlySet<number>): boolean {
  const byId = new Map(held.map((a) => [a.id, a]));
  const free = freeCounts(held, lockedIds, reservedIds);
  const giving = new Map<string, number>();
  for (const id of new Set(assetIds)) {
    const a = byId.get(id);
    if (!a || lockedIds.has(id) || reservedIds.has(id)) return true;
    giving.set(a.ref, (giving.get(a.ref) ?? 0) + 1);
  }
  for (const [ref, n] of giving) if ((free.get(ref) ?? 0) - n < 1) return true;
  return false;
}

/** True if `assetId` is our last free copy of its card (or not a free copy at all): it must not be sold or paid. */
export function isLastFreeCopy(assetId: number, held: readonly HeldCopy[], lockedIds: ReadonlySet<number>, reservedIds: ReadonlySet<number>): boolean {
  return takesLastFreeCopy([assetId], held, lockedIds, reservedIds);
}
