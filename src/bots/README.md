# bots

Rivales para la arena de self-play, escritos en código para que la arena sea rápida, gratis y
determinista por semilla (sin LLM ni red). Registro en `index.ts`; `pnpm bot:serve <bot>` expone
cualquiera como agente HTTP JSON para sparring.

- `boulware`, `conceder`: tácticas dependientes del tiempo (Faratin et al.), β = 0,2 y β = 3.
- `tit-for-tat`: Tit-for-Tat relativo; concede en su utilidad lo que concedió el rival en su última oferta.
- `text-only`: ofertas solo en el texto con todas las formas del normalizador; acepta sin cifras.

- Adversariales con el texto en código (`adversarial.ts`): `inject-voss` (inyección y técnicas de Voss),
  `liar` (falso BATNA), `hypothetical` (extracción con marco hipotético), `extreme-anchor` (abre en el
  extremo y casi no concede) y `causa-prima` (autoridad, fijar identidad o mandato y acuerdos inexistentes).
  La cifra la decide un bot determinista y la frase se elige por ronda sin consumir el rng, así que
  `plainTwin(name)` hace las mismas ofertas con texto plano (`test/redteam/scripted-bots.test.ts`).
- `createLlmBot` (`llm-bot.ts`): guiado por LLM, conjunto reservado, fuera de `BOTS`.
