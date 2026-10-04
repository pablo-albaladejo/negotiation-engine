# agents/tools — herramientas de sesión que hay que conservar

Scripts y notas que cada agente usaba desde su scratchpad (que se pierde al cerrar la sesión). Aquí quedan versionados para poder relanzar el agente tal cual. Padre: [`agents/`](../AGENTS.md).

Reglas: solo lectura (GET) salvo que la ficha del agente diga otra cosa; las claves se leen de `.env` y nunca se escriben aquí; comentarios del código en inglés. Cada agente añade su fichero; la tabla de abajo la mantiene la sesión que lleva `agents/`.

| Fichero | Agente | Qué es |
|---------|--------|--------|
| [duels-table.mjs](duels-table.mjs) | [duels](../routes/duels.md) | Tabla en vivo (solo GET) de una sesión de duelos: trato, result y Δduel_points por duelo cada 15 s (`node agents/tools/duels-table.mjs 4`) |
| [audit-tick-eval.py](audit-tick-eval.py) | [audit](../analysis/audit.md) | Una línea por tick de `play.log` con los Δ (score, escalera, neg, duelos, caja) y los FLAG |
| [audit-alerts.sh](audit-alerts.sh) | [audit](../analysis/audit.md) | Alertas: caídas de play, banco/Pícaros, desajustes de score-audit, bench, nuestro venue y nuestros tratos |
| [objetivos-design.md](objetivos-design.md) | [market-analyst](../analysis/market-analyst.md) → [goals](../ops/goals.md) | Diseño de partida de los objetivos del equipo |
| [workshop-opps.mjs](workshop-opps.mjs) | [workshop](../routes/workshop.md) | Chequeo de solo lectura (GET) de tríos para el Taller y candidatas a Pilar L3, sin copias en ofertas o hilos ni cartas ocultas; se lanza con `.env` cargado (ver la ficha) |
| [bench-model-v2.md](bench-model-v2.md) | [broker](../routes/broker.md) | Informe del modelo offline del Market Test: ninguna política que solo ve el presente supera a auto de forma robusta; en vivo, greedy sin espera |
| [broker-thin.patch](broker-thin.patch) | [broker](../routes/broker.md) | Parche de la política «thin» para el broker (casi neutra, de +0,000 a +0,002); solo se guarda, no se aplica sin OK de Pablo |
| [bench-model/](bench-model/AGENTS.md) | [broker](../routes/broker.md) | Scripts y priors para reproducir el modelo (calibración ABC, replays, evaluación sintética) |

## Links

- [bench-model/](bench-model/AGENTS.md) — modelo offline del Market Test (broker)
