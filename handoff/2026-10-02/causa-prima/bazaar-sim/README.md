# Abuela Carmen en local

Simulador de la Abuela Carmen (dealer nivel 1 de The Bazaar) para probar estrategias sin gastar tratos reales.

**Es una hipótesis.** El comportamiento sale de lo publicado (rasgos y menú de `/api/dealers`, reglas de `RULES.md`
y diapositivas), pero las fórmulas exactas de Causa Prima no se conocen. Todo lo supuesto está en `PARAMS`
de `abuela_model.py`: ajustadlo en cuanto tengáis conversaciones reales.

## Ficheros

| Fichero | Para qué |
|---|---|
| `abuela_model.py` | El modelo: suelo secreto por conversación, concesión proporcional a vuestro paso, paciencia, oferta final, amabilidad, penalización por repetir, por trucos y por anclas insultantes. |
| `sim.py` | Miles de negociaciones en segundos, sin HTTP. Compara estrategias y hace barridos. |
| `fake_server.py` | Servidor HTTP que imita la API de la Abuela. Vuestro agente real, con `bazaar_sdk.py`, funciona contra él cambiando solo `BAZAAR_URL`. |
| `bazaar_sdk.py`, `starter_agent.py` | Del kit oficial, sin cambios. |

## Uso

```bash
# 1. Comparar estrategias (starter vs plan) y barrer ancla y pasos
python3 sim.py --n 2000 --sweep
python3 sim.py --item common

# 2. Probar el agente real contra la Abuela local (tick de 0,3 s en vez de 60 s)
python3 fake_server.py --tick 0.3 &
BAZAAR_URL=http://localhost:8765 BAZAAR_KEY=tk-local python3 starter_agent.py
curl -s localhost:8765/api/sim/stats      # límite secreto, precio, rondas y captura de cada conversación
```

## Cómo funciona el modelo

1. Al abrir, ella fija un límite secreto: si vende, suelo = lista × U(0,70, 0,90); si compra, techo = lista × U(0,55, 0,80).
2. Pide su apertura (sobre: 30).
3. Vuestra primera oferta no se premia. Si es menor que lista × 0,55, se ofende y concede un 35 % menos toda la conversación.
4. Después, cada vez que subís, ella baja **vuestro paso × ratio**. Ratio = (0,55 + 0,45 × generosidad) × (1 − 0,5 × astucia), un 15 % más si el mensaje es amable. Con sus rasgos sale ≈ 1: imita vuestro paso.
5. Repetir precio no da nada y gasta 2 de paciencia. Las palabras de inyección o groseras gastan 3. Cada mensaje gasta 1.
6. Acepta vuestra oferta si ya está a 1 P de su precio y no cruza su límite.
7. Con la paciencia agotada (≈ 11 mensajes) da su oferta final, a mitad de camino entre los dos y sin cruzar su límite. Si no la aceptáis, se va.
8. **Captura** = (apertura − precio) / (apertura − límite), la lectura más probable de "share of each dealer's price range you captured".

## Calibrar con datos reales

Después de cada conversación real, guardad `b.thread(id)` en un JSON. Mirad tres cosas:

- **Ratio:** cuánto baja ella por cada prima que subís vosotros. Cambiad `base_ratio` y `generosity_ratio`.
- **Paciencia:** en qué mensaje llega el `"final": true`. Cambiad `rounds_min` y `rounds_per_patience`.
- **Suelo:** los precios de cierre más bajos que hayáis visto. Cambiad `floor_range`.
