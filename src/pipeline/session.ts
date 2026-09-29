import { webcrypto } from "node:crypto";
import type { AgentConfig } from "../engine/config.js";
import { orientIssues, type Offer, type OfferMandate } from "../engine/issues.js";
import { OpponentModel } from "../engine/opponent.js";

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object") {
    for (const inner of Object.values(value)) deepFreeze(inner);
    Object.freeze(value);
  }
  return value;
}

/** Estado de una sesión. Mandato y configuración (y su versión) quedan fijos toda la sesión. */
export interface Session {
  readonly id: string;
  readonly mandate: Readonly<OfferMandate>;
  readonly config: Readonly<AgentConfig>;
  readonly configVersion: number;
  readonly seed: number;
  readonly startedAtMs: number;
  readonly opponent: OpponentModel;
  round: number;
  roundLimit?: number;
  deadlineMs?: number;
  /** Nuestras ofertas enviadas; la última es la vigente. */
  ourOffers: Offer[];
  /** Ofertas registradas del rival; la última es la oferta actual. */
  rivalOffers: Offer[];
  rivalAcceptedOurLast: boolean;
  rivalWalked: boolean;
  agreement?: Offer;
}

export function ourLastOffer(session: Session): Offer | undefined {
  return session.ourOffers.at(-1);
}

export function rivalCurrentOffer(session: Session): Offer | undefined {
  return session.rivalOffers.at(-1);
}

export interface SessionStoreOptions {
  /** Mandato de la sesión desde la configuración del escenario o de la sesión (nunca del rival). */
  mandateFor: (sessionId: string) => OfferMandate;
  /** Configuración vigente al abrir la sesión (la campeona, releída si cambió). */
  configFor: () => AgentConfig;
  seedFor?: (sessionId: string) => number;
  now?: () => number;
}

/** Almacén en memoria, aislado por sesión. */
export class SessionStore {
  readonly #sessions = new Map<string, Session>();
  readonly #options: SessionStoreOptions;

  constructor(options: SessionStoreOptions) {
    this.#options = options;
  }

  get(sessionId: string): Session | undefined {
    return this.#sessions.get(sessionId);
  }

  getOrCreate(sessionId: string): Session {
    const existing = this.#sessions.get(sessionId);
    if (existing) return existing;
    const config = deepFreeze(structuredClone(this.#options.configFor()));
    const mandate = deepFreeze(structuredClone(this.#options.mandateFor(sessionId)));
    const seed = this.#options.seedFor?.(sessionId) ?? webcrypto.getRandomValues(new Int32Array(1))[0]!;
    const session: Session = {
      id: sessionId,
      mandate,
      config,
      configVersion: config.version,
      seed,
      startedAtMs: (this.#options.now ?? Date.now)(),
      opponent: new OpponentModel(orientIssues(config.issues, mandate.role)),
      round: 0,
      ourOffers: [],
      rivalOffers: [],
      rivalAcceptedOurLast: false,
      rivalWalked: false,
    };
    this.#sessions.set(sessionId, session);
    return session;
  }

  get size(): number {
    return this.#sessions.size;
  }
}
