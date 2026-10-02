/**
 * Topes compartidos por todos los dealers de una ejecución: gasto por hora y total en compras, suelo de caja
 * (lo que nunca se toca, p. ej. 270 P para abrir el mercado) y una aceptación por tick para todo el equipo.
 */

export interface TeamBudgetOptions {
  /** Gasto máximo por hora de reloj en compras (P). */
  maxSpendPerHour: number;
  /** Gasto máximo de la ejecución (P). */
  maxSpendTotal?: number;
  /** La caja nunca baja de aquí por una compra (P). */
  cashFloor?: number;
  now?: () => number;
}

const HOUR_MS = 3_600_000;

export class TeamBudget {
  private readonly spend = new Map<number, number>();
  private spentRun = 0;
  private lastAcceptTick = -1;
  private readonly now: () => number;
  readonly maxSpendPerHour: number;
  readonly maxSpendTotal: number;
  readonly cashFloor: number;

  constructor(o: TeamBudgetOptions) {
    this.maxSpendPerHour = o.maxSpendPerHour;
    this.maxSpendTotal = o.maxSpendTotal ?? Infinity;
    this.cashFloor = o.cashFloor ?? 0;
    this.now = o.now ?? Date.now;
  }

  spentThisHour(): number {
    return this.spend.get(Math.floor(this.now() / HOUR_MS)) ?? 0;
  }

  spentTotal(): number {
    return this.spentRun;
  }

  /** Lo que aún se puede gastar: lo que queda de la hora, de la ejecución y de la caja por encima del suelo. */
  left(cash?: number): number {
    const byCash = cash === undefined ? Infinity : cash - this.cashFloor;
    return Math.min(this.maxSpendPerHour - this.spentThisHour(), this.maxSpendTotal - this.spentRun, byCash);
  }

  record(amount: number): void {
    const hour = Math.floor(this.now() / HOUR_MS);
    this.spend.set(hour, (this.spend.get(hour) ?? 0) + amount);
    this.spentRun += amount;
  }

  /** Una aceptación por tick para todo el equipo (`accepts_per_team_per_tick`). */
  canAccept(tick: number): boolean {
    return this.lastAcceptTick !== tick;
  }

  markAccept(tick: number): void {
    this.lastAcceptTick = tick;
  }
}
