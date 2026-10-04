import { z } from "zod";
import { marginalValue } from "../../../../src/markets/scanner.js";
import { AssetSchema, CatalogSchema } from "../../../../src/shared/schemas.js";
import { buildValueModel, countHoldings, heldAssets } from "../../../../src/trades/trades.js";

/**
 * Our value per card, from the same value model `bazaar:play` uses (`buildValueModel` + `marginalValue`): for a card
 * we hold, what losing one copy costs (page risk included); for one we miss, what one more copy adds (page bonus
 * included). Built from `/api/me` assets, the catalog and the API values already known for missing cards. Read-only;
 * it shows a figure, it decides none.
 */

const MeAssetsSchema = z.looseObject({ assets: z.array(AssetSchema).default([]) });

export function ourValuesOf(meRaw: unknown, catalogRaw: unknown, apiValues: ReadonlyMap<string, number>): Map<string, number> {
  const out = new Map<string, number>();
  const me = MeAssetsSchema.safeParse(meRaw);
  const catalog = CatalogSchema.safeParse(catalogRaw);
  if (!me.success || !catalog.success) return out;
  const held = heldAssets(me.data.assets);
  const counts = countHoldings(held);
  const zero = new Map([...apiValues].filter(([ref]) => !counts.has(ref)));
  const model = buildValueModel(catalog.data, held, zero);
  for (const s of catalog.data.sets)
    for (const c of s.cards) {
      if (!model.base.has(c.id)) continue;
      out.set(c.id, Math.round(marginalValue(counts, c.id, counts.has(c.id) ? "sell" : "buy", model) * 10) / 10);
    }
  return out;
}
