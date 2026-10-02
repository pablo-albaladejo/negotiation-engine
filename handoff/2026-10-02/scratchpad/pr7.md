## Qué trae

Una evaluación reproducible de un agente «dummy» frente a la campeona, en dos escenarios, y una forma documentada de evaluar cualquier agente.

- **A. Configuración ingenua de nuestro motor** (`config/baselines/dummy.json`):
  - β 1, margen de apertura mínimo y margen de aceptación grande.
  - Se evalúa con `pnpm arena --candidate` y `pnpm promote --dry-run`.
  - Resultado: excedente 4,3 % frente al 26,8 % de la campeona; diferencia pareada de −22,5 pp con IC 95 % [−27,4, −17,8].
  - Puerta: **RECHAZADA**. 0 violaciones y 0 fugas.
- **B. Programa externo como agente** (`pnpm dummy:serve`):
  - Servidor HTTP independiente que habla el contrato `POST /turn` y no usa nuestro motor.
  - Estrategias `accept-first` y `linear`, las dos con test de que respetan el mandato.
  - Se enchufa con `pnpm arena --agent-url`.
  - Resultado: 0 % de excedente frente a todos los bots, frente a hasta un 88 % de la campeona.
  - En el duelo directo, la campeona se lleva el 100 % en la ronda 1.
- **`pnpm eval:dummy [semillas]`** reproduce los dos escenarios en unos 20 s.
- **README**: cómo evaluar un agente como configuración o como agente HTTP externo. El turno no incluye el mandato, así que un agente externo tiene que recibirlo por `--scenario`.
- **Fix**: el vitest raíz excluye `design-system/` y se añade `pnpm ds:test`. Antes, en un clon nuevo, `pnpm install && pnpm test` fallaba.

## Cómo probar

```bash
pnpm install && pnpm test && pnpm typecheck   # 642
pnpm ds:test                                  # 31 (tras instalar dependencias en design-system/)
pnpm eval:dummy
```

🤖 Generated with [Claude Code](https://claude.com/claude-code)
