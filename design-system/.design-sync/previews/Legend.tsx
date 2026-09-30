import { Legend } from "@negotiation-ring/design-system";

export function LeyendaDeArena() {
  return (
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
  );
}

export function LeyendaDeTorneo() {
  return (
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
  );
}
