export interface Scatter2DPoint {
  round: number;
  x: number;
  y: number;
}

export interface Scatter2DCurve {
  points: { x: number; y: number }[];
  label?: string;
}

export interface Scatter2DRegion {
  points: { x: number; y: number }[];
  label?: string;
}

export interface Scatter2DDeal {
  x: number;
  y: number;
  label?: string;
}

export interface Scatter2DProps {
  xDomain: [number, number];
  yDomain: [number, number];
  xLabel: string;
  yLabel: string;
  ourOffers: Scatter2DPoint[];
  theirOffers: Scatter2DPoint[];
  isoLines?: Scatter2DCurve[];
  mandate?: Scatter2DRegion;
  deal?: Scatter2DDeal;
}

const WIDTH = 640;
const HEIGHT = 380;
const MARGIN = { top: 20, right: 16, bottom: 48, left: 48 };
const INNER_WIDTH = WIDTH - MARGIN.left - MARGIN.right;
const INNER_HEIGHT = HEIGHT - MARGIN.top - MARGIN.bottom;
const TICK_COUNT = 4;

export function scatter2DXScale(x: number, xDomain: [number, number]): number {
  const [xMin, xMax] = xDomain;
  return MARGIN.left + (INNER_WIDTH * (x - xMin)) / (xMax - xMin);
}

export function scatter2DYScale(y: number, yDomain: [number, number]): number {
  const [yMin, yMax] = yDomain;
  return MARGIN.top + (INNER_HEIGHT * (yMax - y)) / (yMax - yMin);
}

function toPolylinePoints(points: { x: number; y: number }[], xDomain: [number, number], yDomain: [number, number]): string {
  return points.map((point) => `${scatter2DXScale(point.x, xDomain)},${scatter2DYScale(point.y, yDomain)}`).join(" ");
}

function byRound(a: Scatter2DPoint, b: Scatter2DPoint): number {
  return a.round - b.round;
}

function ticksFor(domain: [number, number]): number[] {
  const [min, max] = domain;
  return Array.from({ length: TICK_COUNT + 1 }, (_, index) => min + ((max - min) * index) / TICK_COUNT);
}

export function Scatter2D({ xDomain, yDomain, xLabel, yLabel, ourOffers, theirOffers, isoLines, mandate, deal }: Scatter2DProps) {
  const sortedOurs = [...ourOffers].sort(byRound);
  const sortedTheirs = [...theirOffers].sort(byRound);
  const rounds = Array.from(new Set([...ourOffers, ...theirOffers].map((point) => point.round)));
  const xTicks = ticksFor(xDomain);
  const yTicks = ticksFor(yDomain);

  return (
    <svg className="nr-scatter" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="Offers by round on two issues">
      {mandate ? (
        <polygon
          className="mandate"
          points={toPolylinePoints(mandate.points, xDomain, yDomain)}
        />
      ) : null}
      {mandate?.label ? (
        <text className="mandate-label" x={MARGIN.left + 8} y={MARGIN.top + 16}>
          {mandate.label}
        </text>
      ) : null}

      <g className="grid">
        {yTicks.map((tick) => (
          <line
            key={`y-${tick}`}
            x1={MARGIN.left}
            x2={WIDTH - MARGIN.right}
            y1={scatter2DYScale(tick, yDomain)}
            y2={scatter2DYScale(tick, yDomain)}
          />
        ))}
      </g>

      <g className="axis-label" textAnchor="end">
        {yTicks.map((tick) => (
          <text key={`yl-${tick}`} x={MARGIN.left - 6} y={scatter2DYScale(tick, yDomain) + 4}>
            {tick}
          </text>
        ))}
      </g>
      <g className="axis-label" textAnchor="middle">
        {xTicks.map((tick) => (
          <text key={`xl-${tick}`} x={scatter2DXScale(tick, xDomain)} y={HEIGHT - MARGIN.bottom + 16}>
            {tick}
          </text>
        ))}
        <text x={WIDTH / 2} y={HEIGHT - 6}>
          {xLabel}
        </text>
      </g>
      <text
        className="axis-label"
        textAnchor="middle"
        x={14}
        y={HEIGHT / 2}
        transform={`rotate(-90 14 ${HEIGHT / 2})`}
      >
        {yLabel}
      </text>

      {(isoLines ?? []).map((iso, index) => (
        <g key={`iso-${index}`}>
          <polyline className="iso" points={toPolylinePoints(iso.points, xDomain, yDomain)} />
          {iso.label ? (
            <text
              className="iso-label"
              textAnchor="end"
              x={Math.min(
                scatter2DXScale(iso.points[iso.points.length - 1]?.x ?? xDomain[0], xDomain),
                WIDTH - MARGIN.right - 2,
              )}
              y={scatter2DYScale(iso.points[iso.points.length - 1]?.y ?? yDomain[0], yDomain) - 6}
            >
              {iso.label}
            </text>
          ) : null}
        </g>
      ))}

      {rounds.map((round) => {
        const our = sortedOurs.find((point) => point.round === round);
        const their = sortedTheirs.find((point) => point.round === round);
        if (!our || !their) return null;
        return (
          <line
            key={`link-${round}`}
            className="link"
            x1={scatter2DXScale(our.x, xDomain)}
            y1={scatter2DYScale(our.y, yDomain)}
            x2={scatter2DXScale(their.x, xDomain)}
            y2={scatter2DYScale(their.y, yDomain)}
          />
        );
      })}

      <polyline className="us-line" points={toPolylinePoints(sortedOurs, xDomain, yDomain)} />
      <polyline className="them-line" points={toPolylinePoints(sortedTheirs, xDomain, yDomain)} />

      {sortedOurs.map((point) => (
        <g key={`us-${point.round}`}>
          <circle className="dot-us" cx={scatter2DXScale(point.x, xDomain)} cy={scatter2DYScale(point.y, yDomain)} r={4.5} />
          <text className="point-label us" x={scatter2DXScale(point.x, xDomain)} y={scatter2DYScale(point.y, yDomain) - 8}>
            R{point.round}
          </text>
        </g>
      ))}
      {sortedTheirs.map((point) => (
        <g key={`them-${point.round}`}>
          <circle className="dot-them" cx={scatter2DXScale(point.x, xDomain)} cy={scatter2DYScale(point.y, yDomain)} r={4.5} />
          <text className="point-label them" x={scatter2DXScale(point.x, xDomain)} y={scatter2DYScale(point.y, yDomain) - 8}>
            R{point.round}
          </text>
        </g>
      ))}

      {deal
        ? (() => {
            const dealX = scatter2DXScale(deal.x, xDomain);
            const dealY = scatter2DYScale(deal.y, yDomain);
            const labelOnLeft = dealX > (WIDTH - MARGIN.left - MARGIN.right) / 2 + MARGIN.left;
            return (
              <>
                <circle className="deal-ring" cx={dealX} cy={dealY} r={11} />
                {deal.label ? (
                  <text
                    className="deal-label"
                    textAnchor={labelOnLeft ? "end" : "start"}
                    x={dealX + (labelOnLeft ? -14 : 14)}
                    y={dealY - 14}
                  >
                    {deal.label}
                  </text>
                ) : null}
              </>
            );
          })()
        : null}
    </svg>
  );
}
