# @negotiation-ring/design-system

Biblioteca de componentes React del sistema de diseño **Negotiation Ring**, de
**Equipo 2** (hackathon Causa Prima). Reúne en código los tokens y las clases
CSS `nr-*` ya definidos para el visor de la arena: repeticiones de partida,
comparativas campeón vs candidato y vistas de torneo en vivo.

Este paquete es la fuente que `/design-sync` usará para publicar el sistema
en Claude Design; el shape de `examples/` es lo que ese flujo usará para
generar las previews.

## Instalación y uso

```bash
pnpm add @negotiation-ring/design-system
```

Importa la hoja de estilos una vez (trae las fuentes de Google Fonts, los
tokens de color/tipografía/espaciado y las clases de cada componente) y
envuelve la aplicación en `<Root>`, que fija el fondo, la tipografía de
cuerpo y los números tabulares:

```tsx
import "@negotiation-ring/design-system/styles.css";
import { Root, Card, KpiStrip } from "@negotiation-ring/design-system";

function App() {
  return (
    <Root theme="light">
      <Card title="Ofertas por ronda">
        <KpiStrip items={[{ label: "Excedente / ZOPA", value: "0,64" }]} />
      </Card>
    </Root>
  );
}
```

`theme` acepta `"light"` o `"dark"` y se traduce en el atributo
`data-theme` del contenedor raíz. Sin `theme`, el tema sigue la preferencia
del sistema operativo (`prefers-color-scheme`).

## Componentes

| Componente | Props | Qué es |
| --- | --- | --- |
| `Root` | `RootProps` | Contenedor raíz de la app (`div.nr-root`), fija fondo, tipografía y tema. |
| `Card` | `CardProps` | El único contenedor: superficie con borde, título y pie opcionales. |
| `Tabs` | `TabsProps` | Navegación entre vistas (`role="tab"`, `aria-selected`). |
| `MatchSelector` | `MatchSelectorProps` | Fila de partidas para elegir cuál repetir (`aria-pressed`). |
| `KpiStrip` | `KpiStripProps` | Tira de cifras clave por encima del gráfico. |
| `ChatMessage` | `ChatMessageProps` | Un turno de la negociación como burbuja (`us` / `them`). |
| `Flag` | `FlagProps` | Chip mono sobre un mensaje: lo que registró el parser, el motor o el validador. |
| `Pill` | `PillProps` | Etiqueta redondeada para un estado final (veredicto, rechazo, muestra). |
| `DataTable` | `DataTableProps` | Tabla de métricas con columnas numéricas y variación mejor/peor. |
| `Heatmap` | `HeatmapProps` | Mapa de calor de excedente/ZOPA por rival × rol, construido sobre `DataTable`. |
| `OfferChart` | `OfferChartProps` | SVG dibujado a mano con las ofertas por ronda; solo dibuja lo que se le pasa. |
| `Legend` | — | Leyenda que acompaña siempre a `OfferChart`. |
| `Filters` | `FiltersProps` | Barra de filtros controlada: rival, rol, resultado y checkboxes. |
| `ModeBadge` | `ModeBadgeProps` | Insignia `ARENA` / `TOURNAMENT` según el modo. |
| `Scatter2D` | `Scatter2DProps` | SVG dibujado a mano para ofertas en dos cuestiones (eje X / eje Y); solo dibuja lo que se le pasa. |
| `Scoreboard` | `ScoreboardProps` | Cabecera del proyector en directo: equipos, ronda y ataques bloqueados. |
| `WarningBanner` | `WarningBannerProps` | Aviso en línea con tono (`warn` / `info`), título y contenido libre. |

Cada componente exporta su interfaz de props (`<Nombre>Props`) desde
`src/index.ts`. Los ejemplos de uso realista, en inglés (idioma de la
interfaz del visor), están en `examples/`, uno por componente más
`examples/ViewerScreen.tsx`, que compone la pantalla completa del visor:
pestañas, selector de partida, tira de KPIs y, debajo, la tarjeta del
gráfico junto a la del chat.

## Reglas de marca

- **Inglés, claro y preciso, en la interfaz del visor.** "Deal closed at
  112", "walk away", "surplus / ZOPA". Los términos técnicos del equipo
  quedan en inglés: ZOPA, AC_next, AC_time, Boulware. El texto del rival se
  muestra tal cual, en el idioma en que llegue; los identificadores de
  configuración (p. ej. `calido-firme`) también se muestran tal cual, sin
  traducir.
- **Números en formato inglés.** Punto decimal (0.64), sin espacio antes
  del `%` (84%), diferencias en puntos (−2pp), siempre con `tabular-nums`.
  Usa `formatNumber(v, { locale: "en" })`; `formatEsNumber` se mantiene por
  compatibilidad con consumidores en español.
- **El código decide el número; la interfaz solo lo muestra.** Ningún
  componente calcula una oferta, una decisión o un veredicto. La única
  excepción es el formateo de la coma decimal española (`formatEsNumber`).
- **El texto del rival es no confiable.** Se renderiza siempre como texto de
  React (children), nunca con `dangerouslySetInnerHTML`; el paquete no lo usa
  en ningún sitio (hay un test que lo comprueba con un grep).
- **Dos lados, dos tonos.** `--us` (azul) somos siempre nosotros; `--them`
  (ámbar) es siempre el rival. Nunca se intercambian ni se usan como
  decoración.
- **La semántica es independiente de los lados.** `--ok` es trato, aceptar,
  mejor valor o promoción. `--warn` es retirada, inyección, peor valor o
  celda débil del mapa de calor.
- **La ZOPA** es la banda translúcida `--zopa`, y solo se dibuja en modo
  arena: en un torneo la reserva del rival es desconocida.
- Sin emoji, sin signos de exclamación, sin iconografía: el estado se
  transmite con color, chips y palabras.

## Build

```bash
pnpm install
pnpm build      # dist/index.js (ESM), dist/index.cjs, dist/styles.css, dist/index.d.ts
pnpm test       # vitest
pnpm typecheck  # tsc --noEmit
```

`dist/` no se versiona en este repositorio: se genera con `pnpm build` y,
si `/design-sync` necesita los artefactos ya compilados, se construyen en
ese paso en lugar de comitearlos.
