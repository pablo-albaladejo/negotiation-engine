## Qué trae

Herramienta para medir con llamadas reales a Claude si el parser y el narrador LLM aportan valor frente al camino determinista.

- `pnpm arena` añade dos flags opcionales: `--llm-provider` (por defecto `LLM_PROVIDER` o `none`) y `--no-narrator`. El `pnpm arena` por defecto sigue sin hacer llamadas al LLM, y lo comprueba un test.
- Las trazas de los participantes registran el proveedor LLM real.
- `pnpm eval:llm` (`scripts/eval-llm.sh` y `src/arena/eval-llm-main.ts`), configurable con las variables `EVAL_LLM_*`, compara:
  - `none` frente a `claude-cli` contra el bot `text-only` y los adversariales;
  - partidas contra el bot guiado por LLM.
- README: sección «Medir el valor del LLM», con el perfil de cuenta y el coste. Los `AGENTS.md` también se han actualizado.

## Resultado de la medición

Unas 263 llamadas reales con el perfil personal (`claude -p`, modelo por defecto).

- **Parser LLM:** no recupera ofertas. La reconciliación exige que el parser determinista y el LLM coincidan, así que añadir el LLM vuelve la extracción más estricta: más ofertas sin extraer y algo menos de excedente.
- **Narrador por `claude -p`:** cada llamada arranca un proceso (unos 2 s). Así no cabe en `turnBudgetMs` = 4500 ms, y casi siempre responde la plantilla.
- **Frente al bot LLM:** nuestra campeona sin LLM consigue un 100 % de acuerdo y un 97,1 % de excedente.

Esta PR no cambia el comportamiento del agente. La política de LLM para el torneo se decide aparte.

## Cómo probar

```bash
pnpm test && pnpm typecheck && pnpm docs:check   # 642
pnpm eval:llm   # hace llamadas reales y cuesta tokens
```

🤖 Generated with [Claude Code](https://claude.com/claude-code)
