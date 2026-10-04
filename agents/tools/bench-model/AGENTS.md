# agents/tools/bench-model — modelo offline del Market Test (v2)

Scripts del agente [broker](../../routes/broker.md) que respaldan el informe [bench-model-v2.md](../bench-model-v2.md). Ese informe concluye que ninguna política que solo ve el presente supera a auto de forma robusta, así que en vivo seguimos con greedy sin espera (holdTicks 0). Padre: [agents/tools](../AGENTS.md).

Solo leen las trazas de results/; no llaman a la API. Se ejecutan con python3 desde esta carpeta. La carpeta de datos por defecto es la del 3 de octubre; se cambia con la variable BENCH_DAY_DIR.

| Fichero | Qué es |
|---------|--------|
| [data.py](data.py) | Carga las sesiones grabadas: libro tras auto (bench.jsonl, bench-raw.jsonl) y resultado oficial (stream-team.jsonl). |
| [sim2.py](sim2.py) | Modelo generativo de operadores, con límite oculto, llegada, paciencia, firmes y relajación. Incluye la parada de auto y las políticas thin, rollout y leave-first. |
| [calibrate2.py](calibrate2.py) | Calibración ABC para que el libro simulado se parezca al grabado. Escribe prior2.json y ensemble.json. |
| [replay2.py](replay2.py) | Replays por sesión: mundos ocultos coherentes con lo grabado, puntuando auto frente a cada política. |
| [evaluate.py](evaluate.py) | Evaluación sintética con semillas nuevas (2000 libros o más por conjunto de mundos), incluido el error de especificación. |
| [pols.py](pols.py) | Políticas comparadas y su creencia (belief.json). |
| [prior2.json](prior2.json) · [ensemble.json](ensemble.json) · [belief.json](belief.json) | Prior calibrado, las 20 mejores candidatas del ABC y la creencia de las políticas (prior más mezcla de k). |

Orden para reproducir: calibrate2.py, después replay2.py y después evaluate.py.

El parche [broker-thin.patch](../broker-thin.patch) solo se guarda: no se aplica sin el OK de Pablo.
