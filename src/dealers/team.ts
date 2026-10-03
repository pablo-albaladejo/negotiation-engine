/**
 * Limits shared by all dealers in a run: hourly and total purchase spending, cash floor
 * (what is never touched, e.g. 270 P to open the market) and one acceptance per tick for the whole team.
 */

export interface TeamBudgetOptions {
  /** Maximum purchase spending per clock hour (P). */
  maxSpendPerHour: number;
  /** Maximum spending of the run (P). */
  maxSpendTotal?: number;
  /** Cash never drops below this because of a purchase (P). */
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
  /** Cash kept for page-completing cards we still lack (set by the coordinator each tick); other page-card buys stay above it. */
  pageReserve = 0;

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

  /**
   * What can still be spent: what is left of the hour, of the run and of the cash above the floor. The page reserve
   * only holds back buys that bring in a page card we lack (`keepPageReserve`); loose-surplus and pack buys ignore it.
   */
  left(cash?: number, keepPageReserve = false): number {
    const byCash = cash === undefined ? Infinity : cash - this.cashFloor - (keepPageReserve ? this.pageReserve : 0);
    return Math.min(this.maxSpendPerHour - this.spentThisHour(), this.maxSpendTotal - this.spentRun, byCash);
  }

  record(amount: number): void {
    const hour = Math.floor(this.now() / HOUR_MS);
    this.spend.set(hour, (this.spend.get(hour) ?? 0) + amount);
    this.spentRun += amount;
  }

  /** One acceptance per tick for the whole team (`accepts_per_team_per_tick`). */
  canAccept(tick: number): boolean {
    return this.lastAcceptTick !== tick;
  }

  markAccept(tick: number): void {
    this.lastAcceptTick = tick;
  }

  /** Card each dealer is buying right now (its open conversation), so two dealers never buy the same card (threads 407+408: RET-07 twice). */
  private readonly buying = new Map<string, string>();

  /** Sets (or clears, with `undefined`) the card this dealer is buying. */
  claimBuy(dealer: string, card: string | undefined): void {
    if (card === undefined) this.buying.delete(dealer);
    else this.buying.set(dealer, card);
  }

  /** Another dealer is already buying this card. */
  buyingElsewhere(dealer: string, card: string): boolean {
    for (const [d, c] of this.buying) if (d !== dealer && c === card) return true;
    return false;
  }

  /** Cash a page-completing buy may use: above the floor only (no hourly or run cap). */
  pageLeft(cash: number): number {
    return cash - this.cashFloor;
  }
}
