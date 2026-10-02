import type { BazaarApi } from "../agent.js";
import type { Topic } from "../client.js";
import { BazaarError } from "../client.js";
import { CatalogSchema, MeSchema, SayResultSchema, ThreadListSchema, ThreadSchema, type Catalog, type Me, type Thread } from "../schemas.js";
import type { DealerSim } from "./dealer.js";

/**
 * Adaptador: el `DealerSim` detrás de la misma interfaz que `BazaarClient` usa el agente
 * (`BazaarApi`). Toda respuesta pasa por los esquemas Zod reales, así que el agente y el
 * negociador corren sin cambios. Sin red.
 */

export interface SimApiOptions {
  team?: string;
  me?: unknown;
  catalog?: unknown;
  values?: Record<string, number>;
}

export class SimApi implements BazaarApi {
  readonly team: string;
  constructor(
    readonly sim: DealerSim,
    private readonly o: SimApiOptions = {},
  ) {
    this.team = o.team ?? "t01";
  }

  async me(): Promise<Me> {
    return MeSchema.parse(this.o.me ?? { name: this.team, cash: 400, assets: [] });
  }
  async catalog(): Promise<Catalog> {
    return CatalogSchema.parse(this.o.catalog ?? { sets: [], packs: [] });
  }
  async value(card: string): Promise<number> {
    return this.o.values?.[card] ?? 0;
  }
  async myThreads(status?: string) {
    const threads = this.sim.threadsOf(this.team).filter((t) => !status || t.status === status);
    return ThreadListSchema.parse({ threads });
  }
  /** El simulador no tiene venues: ninguna oferta abierta fuera de los hilos. */
  async myOffers(): Promise<unknown> {
    return { offers: [] };
  }
  async thread(id: number): Promise<Thread> {
    return ThreadSchema.parse(this.sim.view(id));
  }
  async openThread(withId: string, topic: Topic): Promise<Thread> {
    if (withId !== this.sim.profile.id) throw new BazaarError("not_found", `no dealer ${withId}`, 404);
    return ThreadSchema.parse(this.sim.open(this.team, topic));
  }
  async say(threadId: number, text: string, price?: number) {
    return SayResultSchema.parse(this.sim.message(this.team, threadId, text, price));
  }
  async closeThread(threadId: number): Promise<unknown> {
    this.sim.close(this.team, threadId);
    return { ok: true };
  }
  async accept(offerId: number): Promise<unknown> {
    this.sim.accept(this.team, offerId);
    return { ok: true };
  }
}
