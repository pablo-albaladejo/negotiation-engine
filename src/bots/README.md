# bots

Rivales para la arena de self-play, escritos en código para que la arena sea rápida, gratis y
determinista por semilla (sin LLM ni red). Registro en `index.ts`; `pnpm bot:serve <bot>` expone
cualquiera como agente HTTP JSON para sparring.

- `boulware`, `conceder`: tácticas dependientes del tiempo (Faratin et al.), β = 0,2 y β = 3.
- `tit-for-tat`: Tit-for-Tat relativo; concede en su utilidad lo que concedió el rival en su última oferta.
- `text-only`: ofertas solo en el texto con todas las formas del normalizador; acepta sin cifras.

Previstos: adversariales (inyección con técnicas de Voss, mentiroso, extracción
mediante un escenario hipotético, ancla extrema) y «estilo Causa Prima».
