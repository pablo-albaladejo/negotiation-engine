# test/golden/ — Resultados Esperados (Golden)

Resultados de pruebas esperados, regenerables y versionados. Permite detectar cambios accidentales en el motor.

## Propósito

**Golden testing**: ejecuta el motor bajo condiciones conocidas, almacena el resultado, verifica que cambios posteriores no alteren el comportamiento esperado.

Regenerable con `pnpm golden:update` cuando se intenta un cambio intencional.

## Archivos

- Nombres: descripción del caso (ej. `price-buyer-wide__boulware__1.json`).
- Estructura: simulación de turno a turno con decisiones esperadas.

## Cómo trabajar

```bash
# Ejecutar test de golden (verifica que resultados coinciden)
pnpm test test/golden.test.ts

# Regenerar golden (después de cambios intencionales)
pnpm golden:update

# Ver diferencias
git diff test/golden/
```

## Invariantes

- **Versionados**: se commitean (no están en `.gitignore`).
- **Reproducibles**: misma seed, misma simulación, mismo resultado.
- **Protección**: cambios accidentales al motor se detectan en CI.

## Links

- ↑ [`test/`](../AGENTS.md)
- ← Generado por: [`pnpm golden:update`](../../src/dev/golden-main.ts)
- ← Tests: [`test/golden.test.ts`](../golden.test.ts)
