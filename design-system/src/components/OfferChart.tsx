import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

export interface OfferPoint {
  round: number;
  value: number;
}

export interface OfferChartEnd {
  round: number;
  kind: "deal" | "walk";
  label: string;
}

export interface OfferChartProps {
  rounds: number;
  yDomain: [number, number];
  ourOffers: OfferPoint[];
  theirOffers: OfferPoint[];
  target?: OfferPoint[];
  estimate?: OfferPoint[];
  ourReserve?: number;
  theirReserve?: number;
  zopa?: boolean;
  injectionRounds?: number[];
  end?: OfferChartEnd;
  onPointClick?: (point: { side: "us" | "them"; round: number; value: number }) => void;
  /** Roving tab stop starts on this round's point (and marks it aria-pressed) instead of the first one (A2). */
  selectedRound?: number;
}

const WIDTH = 640;
const HEIGHT = 330;
const MARGIN = { top: 16, right: 16, bottom: 36, left: 48 };
const INNER_WIDTH = WIDTH - MARGIN.left - MARGIN.right;
const INNER_HEIGHT = HEIGHT - MARGIN.top - MARGIN.bottom;

export function offerChartXScale(round: number, rounds: number): number {
  return MARGIN.left + (round / rounds) * INNER_WIDTH;
}

export function offerChartYScale(value: number, yDomain: [number, number]): number {
  const [yMin, yMax] = yDomain;
  return MARGIN.top + (INNER_HEIGHT * (yMax - value)) / (yMax - yMin);
}

function toPolylinePoints(points: OfferPoint[], rounds: number, yDomain: [number, number]): string {
  return points.map((point) => `${offerChartXScale(point.round, rounds)},${offerChartYScale(point.value, yDomain)}`).join(" ");
}

function findOfferAt(round: number, ourOffers: OfferPoint[], theirOffers: OfferPoint[]): { side: "us" | "them"; value: number } | undefined {
  const our = ourOffers.find((point) => point.round === round);
  if (our) return { side: "us", value: our.value };
  const their = theirOffers.find((point) => point.round === round);
  if (their) return { side: "them", value: their.value };
  return undefined;
}

interface OfferChartInteractivePoint {
  side: "us" | "them";
  round: number;
  value: number;
}

function buildOfferInteractivePoints(ours: OfferPoint[], theirs: OfferPoint[]): OfferChartInteractivePoint[] {
  return [
    ...ours.map((p) => ({ side: "us" as const, round: p.round, value: p.value })),
    ...theirs.map((p) => ({ side: "them" as const, round: p.round, value: p.value })),
  ].sort((a, b) => a.round - b.round || (a.side === b.side ? 0 : a.side === "us" ? -1 : 1));
}

/** Roving tabindex navigation: clamps delta moves to the point list bounds (no wraparound). */
export function clampOfferChartIndex(index: number, delta: number, length: number): number {
  if (length === 0) return 0;
  return Math.max(0, Math.min(index + delta, length - 1));
}

/** Initial roving tab stop: the selected round's point if present, else the first one (A2). */
function initialOfferChartIndex(points: OfferChartInteractivePoint[], selectedRound?: number): number {
  if (points.length === 0) return 0;
  if (selectedRound !== undefined) {
    const index = points.findIndex((p) => p.round === selectedRound);
    if (index >= 0) return index;
  }
  return 0;
}

export interface LegendItem {
  kind: "us" | "them" | "target" | "estimate" | "zopa" | "reserve-us" | "reserve-them" | "same-round" | "mandate";
  label: string;
}

export interface LegendProps {
  children?: ReactNode;
  items?: LegendItem[];
}

export function Legend({ children, items }: LegendProps) {
  return (
    <div className="nr-legend">
      {items?.map((item, index) => (
        <span className="nr-legend-item" key={`${item.kind}-${index}`}>
          <i className={`nr-legend-swatch ${item.kind}`} />
          {item.label}
        </span>
      ))}
      {children}
    </div>
  );
}

/** Deal/walk label placement near the end point: avoids the incoming line segment by flipping sides. */
export function endLabelPlacement(prevValue: number | undefined, currentValue: number): { dx: number; dy: number; anchor: "start" | "end" } {
  const ascending = prevValue === undefined ? true : currentValue >= prevValue;
  return ascending ? { dx: -13, dy: -13, anchor: "end" } : { dx: 13, dy: 18, anchor: "start" };
}

export function OfferChart({
  rounds,
  yDomain,
  ourOffers,
  theirOffers,
  target,
  estimate,
  ourReserve,
  theirReserve,
  zopa,
  injectionRounds,
  end,
  onPointClick,
  selectedRound,
}: OfferChartProps) {
  const [yMin, yMax] = yDomain;
  const injectionSet = new Set(injectionRounds ?? []);
  const gridTicks = 4;
  const gridLines = Array.from({ length: gridTicks + 1 }, (_, index) => {
    const value = yMax - ((yMax - yMin) * index) / gridTicks;
    return { value, y: offerChartYScale(value, yDomain) };
  });
  const xTicks = Array.from({ length: rounds + 1 }, (_, round) => round);

  const showZopa = zopa && ourReserve !== undefined && theirReserve !== undefined;
  const zopaTop = showZopa ? offerChartYScale(Math.max(ourReserve!, theirReserve!), yDomain) : 0;
  const zopaHeight = showZopa ? Math.abs(offerChartYScale(theirReserve!, yDomain) - offerChartYScale(ourReserve!, yDomain)) : 0;

  /** A8: the 12-viewBox-unit hit radius below renders smaller than the 24px touch target on a
   * scaled-down mobile viewport (no ResizeObserver here to rescale it); DecisionPanel's Previous/
   * Next buttons give keyboard and touch users an always-reachable, properly sized alternative to
   * tapping a point directly. */
  const interactivePoints = onPointClick ? buildOfferInteractivePoints(ourOffers, theirOffers) : [];
  const [activeIndex, setActiveIndex] = useState(() => initialOfferChartIndex(interactivePoints, selectedRound));
  useEffect(() => {
    const newIndex = initialOfferChartIndex(interactivePoints, selectedRound);
    setActiveIndex(newIndex);
    hitRefs.current[newIndex]?.focus();
  }, [selectedRound]);
  // A2: clamp against the current point count so a shrunk list always keeps exactly one reachable tab stop.
  const safeActiveIndex = interactivePoints.length === 0 ? 0 : Math.max(0, Math.min(activeIndex, interactivePoints.length - 1));
  const hitRefs = useRef<(SVGCircleElement | null)[]>([]);

  function indexOf(side: "us" | "them", round: number): number {
    return interactivePoints.findIndex((p) => p.side === side && p.round === round);
  }

  function focusIndex(index: number) {
    const clamped = Math.max(0, Math.min(index, interactivePoints.length - 1));
    setActiveIndex(clamped);
    hitRefs.current[clamped]?.focus();
  }

  function handlePointKeyDown(e: KeyboardEvent<SVGCircleElement>, index: number) {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      focusIndex(clampOfferChartIndex(index, 1, interactivePoints.length));
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      focusIndex(clampOfferChartIndex(index, -1, interactivePoints.length));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const point = interactivePoints[index];
      if (point) onPointClick?.({ side: point.side, round: point.round, value: point.value });
    }
  }

  const endPoint = end ? findOfferAt(end.round, ourOffers, theirOffers) : undefined;
  const endPlacement = end && endPoint
    ? endLabelPlacement(
        (() => {
          const earlier = [...(endPoint.side === "us" ? ourOffers : theirOffers)]
            .sort((a, b) => a.round - b.round)
            .filter((p) => p.round < end.round);
          return earlier.length > 0 ? earlier[earlier.length - 1]!.value : undefined;
        })(),
        endPoint.value,
      )
    : undefined;

  return (
    <svg
      className="nr-chart"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role={onPointClick ? "group" : "img"}
      aria-label="Offers from both sides by round"
    >
      {showZopa ? <rect className="zopa" x={MARGIN.left} y={zopaTop} width={INNER_WIDTH} height={zopaHeight} /> : null}

      <g className="grid">
        {gridLines.map((line) => (
          <line key={line.value} x1={MARGIN.left} x2={WIDTH - MARGIN.right} y1={line.y} y2={line.y} />
        ))}
      </g>

      <g className="axis-label" textAnchor="end">
        {gridLines.map((line) => (
          <text key={line.value} x={MARGIN.left - 6} y={line.y + 4}>
            {line.value}
          </text>
        ))}
      </g>

      <g className="axis-label" textAnchor="middle">
        {xTicks.map((round) => (
          <text key={round} x={offerChartXScale(round, rounds)} y={HEIGHT - MARGIN.bottom + 16}>
            {round}
          </text>
        ))}
        <text x={WIDTH / 2} y={HEIGHT - 4}>
          round
        </text>
      </g>

      {ourReserve !== undefined ? (
        <line
          className="reserve-us"
          x1={MARGIN.left}
          x2={WIDTH - MARGIN.right}
          y1={offerChartYScale(ourReserve, yDomain)}
          y2={offerChartYScale(ourReserve, yDomain)}
        />
      ) : null}
      {theirReserve !== undefined ? (
        <line
          className="reserve-them"
          x1={MARGIN.left}
          x2={WIDTH - MARGIN.right}
          y1={offerChartYScale(theirReserve, yDomain)}
          y2={offerChartYScale(theirReserve, yDomain)}
        />
      ) : null}

      {target ? <polyline className="target" points={toPolylinePoints(target, rounds, yDomain)} /> : null}
      {estimate ? <polyline className="estimate" points={toPolylinePoints(estimate, rounds, yDomain)} /> : null}

      <polyline className="us-line" points={toPolylinePoints(ourOffers, rounds, yDomain)} />
      <polyline className="them-line" points={toPolylinePoints(theirOffers, rounds, yDomain)} />

      <g>
        {ourOffers.map((point) => {
          const index = indexOf("us", point.round);
          return (
            <g key={`us-${point.round}`}>
              <circle
                className="dot-us"
                cx={offerChartXScale(point.round, rounds)}
                cy={offerChartYScale(point.value, yDomain)}
                r={4.5}
              />
              {onPointClick ? (
                <circle
                  ref={(el) => {
                    hitRefs.current[index] = el;
                  }}
                  className="hit"
                  cx={offerChartXScale(point.round, rounds)}
                  cy={offerChartYScale(point.value, yDomain)}
                  r={12}
                  role="button"
                  tabIndex={index === safeActiveIndex ? 0 : -1}
                  aria-label={`Our offer, round ${point.round}`}
                  aria-pressed={selectedRound !== undefined ? point.round === selectedRound : undefined}
                  onFocus={() => setActiveIndex(index)}
                  onClick={() => onPointClick({ side: "us", round: point.round, value: point.value })}
                  onKeyDown={(e: KeyboardEvent<SVGCircleElement>) => handlePointKeyDown(e, index)}
                />
              ) : null}
            </g>
          );
        })}
      </g>
      <g>
        {theirOffers.map((point) => {
          const index = indexOf("them", point.round);
          return (
            <g key={`them-${point.round}`}>
              <circle
                className={injectionSet.has(point.round) ? "dot-injection" : "dot-them"}
                cx={offerChartXScale(point.round, rounds)}
                cy={offerChartYScale(point.value, yDomain)}
                r={injectionSet.has(point.round) ? 6 : 4.5}
              />
              {onPointClick ? (
                <circle
                  ref={(el) => {
                    hitRefs.current[index] = el;
                  }}
                  className="hit"
                  cx={offerChartXScale(point.round, rounds)}
                  cy={offerChartYScale(point.value, yDomain)}
                  r={12}
                  role="button"
                  tabIndex={index === safeActiveIndex ? 0 : -1}
                  aria-label={`Opponent offer, round ${point.round}`}
                  aria-pressed={selectedRound !== undefined ? point.round === selectedRound : undefined}
                  onFocus={() => setActiveIndex(index)}
                  onClick={() => onPointClick({ side: "them", round: point.round, value: point.value })}
                  onKeyDown={(e: KeyboardEvent<SVGCircleElement>) => handlePointKeyDown(e, index)}
                />
              ) : null}
            </g>
          );
        })}
      </g>

      {end && endPoint ? (
        <>
          <circle
            className={end.kind === "walk" ? "walk-ring" : "deal-ring"}
            cx={offerChartXScale(end.round, rounds)}
            cy={offerChartYScale(endPoint.value, yDomain)}
            r={9}
          />
          <text
            className={end.kind === "walk" ? "walk-label" : "deal-label"}
            x={offerChartXScale(end.round, rounds) + (endPlacement?.dx ?? -13)}
            y={offerChartYScale(endPoint.value, yDomain) + (endPlacement?.dy ?? -13)}
            textAnchor={endPlacement?.anchor ?? "end"}
          >
            {end.label}
          </text>
        </>
      ) : null}
    </svg>
  );
}
