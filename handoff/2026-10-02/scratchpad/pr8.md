## Qué trae

Una jerarquía enlazada de `AGENTS.md` para que cualquier agente de codificación (Claude Code, Codex, Cursor…) cargue el contexto del repo por carpetas, según lo necesite.

- **27 `AGENTS.md`**:
  - Raíz: punto de entrada con resumen, reglas no negociables, pipeline del turno, mapa de carpetas, todos los scripts `pnpm`, los tres paquetes con sus lockfiles, variables de entorno (solo nombres), estado de OpenSpec, cómo evaluar un agente y orden de lectura.
  - Una por carpeta: `src/*`, `test/*`, `config/`, `scripts/`, `docs/`, `openspec/`, `redteam/`, `viewer/*`, `design-system/*` y `.design-sync/`.
  - Cada una tiene propósito, ficheros clave, invariantes de la carpeta, comandos y enlaces arriba, abajo y a las carpetas relacionadas.
- **`CLAUDE.md`** queda corto: importa `@AGENTS.md` y solo guarda notas propias de Claude Code.
- **`pnpm docs:check`** ejecuta las dos comprobaciones y falla si cualquiera falla:
  - Enlaces relativos y rutas entre backticks, con ignores exactos o por prefijo y una lista documentada de ficheros generados.
  - Cada identificador entre backticks contrastado con el código fuente: camelCase, PascalCase, ALL_CAPS, `--flags`, formas con punto y llamadas, y variables CSS.

## Revisión

Tres rondas de reviewer contra el código. Se corrigieron:

- la regla de guardarraíles, que estaba invertida;
- el propósito de `leak.ts`;
- las reglas de redacción en pino y OTel (`explain`, `rivalText`, `protocol`);
- el presupuesto del turno, que tenía un valor por defecto inventado;
- los flags de arena y promote, y el freeze;
- el puerto del visor (5199);
- `redteam/`, que está en git;
- el parser, cuya oferta sí llega al motor vía `reconcileTextOffer`;
- 8 nombres inexistentes.

`docs:check` se verificó metiendo a propósito una ruta falsa, una ruta de openspec falsa y cuatro identificadores falsos de cada categoría.

Solo cambia documentación y herramientas de comprobación; el código no cambia de comportamiento.

## Cómo probar

```bash
pnpm docs:check
pnpm test && pnpm typecheck   # 642
```

🤖 Generated with [Claude Code](https://claude.com/claude-code)
