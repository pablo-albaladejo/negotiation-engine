import "@negotiation-ring/design-system/styles.css";
import { Root } from "@negotiation-ring/design-system";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

/** Punto de entrada; las pantallas P1–P4 llegan en las tareas 5.x. */
const container = document.getElementById("root");
if (container) {
  createRoot(container).render(
    <StrictMode>
      <Root theme="light">
        <h1>Arena viewer</h1>
      </Root>
    </StrictMode>,
  );
}
