# Market Test (bench): modelo v2 y política frente a «auto»

**Veredicto:** ninguna política supera a *auto* de forma robusta. «thin» es la más segura: +0,001 en sintético, +0,006 de media en los replays y −0,004 en la peor sesión; es casi neutra. Rollout gana entre +0,004 y +0,012 en sintético, pero pierde −0,067 en la sesión 6.

**Datos:** 6 sesiones del 3 de octubre (h3, h5, h7, h9 y h11 en v04 *auto*; h13 en v26 *board*). Eficiencia oficial, siempre igual a `auto_baseline`: 0,899 · 0,967 · 0,769 · 0,928 · 0,866 · 0,696.

**Corrección de los datos:** dos registros con el mismo tick separados por menos de 15 s son una relectura del libro dentro del mismo tick, no un tick extra. Contarlos como tick extra creaba pausas falsas. Corregido, las trayectorias son lineales y nadie dura más de 6 ticks.

## Modelo calibrado (ABC, 6000 candidatos)

Bids U[10,130] · asks U[25,100] · margen inicial ask U[.05,.35], bid U[.10,.30] · llegada U{0..9} · paciencia: 25 % impacientes (1–2 ticks), el resto 3–6 · 20 % firmes · relajación lineal que termina k pasos antes del límite (k = 0/1/2 en 0,4/0,4/0,2). Ajuste: eficiencia de auto 0,855 frente a 0,854 observada.

## Δ de eficiencia frente a auto en los replays (60 mundos coherentes por sesión)

| Sesión | leave-first | skip-extramarginal | thin | rollout |
|---|---|---|---|---|
| 1 | −0,038 | −0,000 | +0,001 | −0,007 |
| 2 | −0,012 | 0 | 0 | −0,006 |
| 3 | +0,002 | +0,011 | +0,007 | +0,002 |
| 4 | −0,040 | +0,000 | −0,004 | −0,000 |
| 5 | −0,010 | +0,038 | +0,033 | +0,039 |
| 6 | 0 | −0,003 | 0 | −0,067 |
| Media / peor sesión | −0,016 / −0,040 | +0,008 / −0,003 | +0,006 / −0,004 | −0,007 / −0,067 |

En sintético (2000 libros por mundo): leave-first ≈ −0,02; skip-extramarginal ≈ 0; thin entre +0,0003 y +0,0018 (p5 = 0); rollout entre +0,004 y +0,010.

## Recomendación

1. En vivo, mantener `planBench` (holdTicks 0, equivalente a auto).
2. thin (s 0,3, θ 0,3, te 2) solo como opción desactivada por defecto (`broker-thin.patch`, sin aplicar). Esperanza realista: entre +0,000 y +0,002 por sesión.
3. Descartar rollout y leave-first.
4. El techo con información completa está unos +0,07 por encima de auto. Ninguna política que solo ve el presente se acerca, porque los traders impacientes castigan cualquier espera.
