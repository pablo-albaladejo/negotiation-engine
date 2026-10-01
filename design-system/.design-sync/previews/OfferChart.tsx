import { OfferChart, Legend } from "@negotiation-ring/design-system";

export function ModoArenaConZopa() {
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
        <span>
          <i style={{ borderTop: "3px solid var(--us)" }} />
          nuestra oferta
        </span>
        <span>
          <i style={{ borderTop: "3px solid var(--them)" }} />
          oferta del rival
        </span>
        <span>
          <i style={{ borderTop: "2px dashed var(--us)" }} />
          curva objetivo
        </span>
        <span>
          <i style={{ borderTop: "2px dotted var(--them)" }} />
          estimación de su reserva
        </span>
        <span>
          <i style={{ borderTop: "10px solid var(--zopa)" }} />
          ZOPA (solo arena)
        </span>
      </Legend>
    </div>
  );
}

export function ModoTorneoSinZopa() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <OfferChart
        rounds={8}
        yDomain={[60, 140]}
        ourOffers={[
          { round: 1, value: 132 },
          { round: 2, value: 126 },
          { round: 3, value: 120 },
          { round: 4, value: 116 },
        ]}
        theirOffers={[
          { round: 1, value: 68 },
          { round: 2, value: 78 },
          { round: 3, value: 90 },
          { round: 4, value: 104 },
        ]}
      />
      <Legend>
        <span>
          <i style={{ borderTop: "3px solid var(--us)" }} />
          nuestra oferta
        </span>
        <span>
          <i style={{ borderTop: "3px solid var(--them)" }} />
          oferta del rival
        </span>
      </Legend>
    </div>
  );
}
