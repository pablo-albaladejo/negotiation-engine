import { OfferChart, Legend } from "@negotiation-ring/design-system";

export function OfferChartExample() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <OfferChart
        rounds={10}
        yDomain={[60, 140]}
        ourOffers={[
          { round: 1, value: 128 },
          { round: 2, value: 124 },
          { round: 3, value: 121 },
          { round: 4, value: 119 },
          { round: 5, value: 117 },
          { round: 6, value: 114 },
        ]}
        theirOffers={[
          { round: 1, value: 70 },
          { round: 2, value: 81 },
          { round: 3, value: 90 },
          { round: 4, value: 97 },
          { round: 5, value: 103 },
          { round: 6, value: 108 },
          { round: 7, value: 112 },
        ]}
        target={[
          { round: 0, value: 136 },
          { round: 1, value: 128 },
          { round: 2, value: 124 },
          { round: 3, value: 121 },
          { round: 4, value: 119 },
          { round: 5, value: 117 },
          { round: 6, value: 114 },
          { round: 10, value: 112 },
        ]}
        estimate={[
          { round: 2, value: 118 },
          { round: 3, value: 115 },
          { round: 4, value: 116 },
          { round: 5, value: 114 },
          { round: 6, value: 115 },
        ]}
        ourReserve={80}
        theirReserve={112}
        zopa
        injectionRounds={[2]}
        end={{ round: 7, kind: "deal", label: "AC_next → trato a 112" }}
      />
      <Legend>
        <span>nuestra oferta</span>
        <span>oferta del rival</span>
        <span>curva objetivo</span>
        <span>estimación de su reserva</span>
        <span>ZOPA (solo arena)</span>
      </Legend>
    </div>
  );
}
