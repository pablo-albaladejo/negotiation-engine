import type { ReactNode } from "react";

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

export interface LegendItem {
  kind: "us" | "them" | "target" | "estimate" | "zopa" | "reserve-us" | "reserve-them";
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
      role="img"
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
        {ourOffers.map((point) => (
          <circle
            key={`us-${point.round}`}
            className="dot-us"
            cx={offerChartXScale(point.round, rounds)}
            cy={offerChartYScale(point.value, yDomain)}
            r={4.5}
            onClick={() => onPointClick?.({ side: "us", round: point.round, value: point.value })}
          />
        ))}
      </g>
      <g>
        {theirOffers.map((point) => (
          <circle
            key={`them-${point.round}`}
            className={injectionSet.has(point.round) ? "dot-injection" : "dot-them"}
            cx={offerChartXScale(point.round, rounds)}
            cy={offerChartYScale(point.value, yDomain)}
            r={injectionSet.has(point.round) ? 6 : 4.5}
            onClick={() => onPointClick?.({ side: "them", round: point.round, value: point.value })}
          />
        ))}
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
