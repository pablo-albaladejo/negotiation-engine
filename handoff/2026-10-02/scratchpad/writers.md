## Files written to disk

**1. `results/<runId>/transcripts.jsonl`** — one line per game
- Writer: `createWriteStream` at `src/arena/cli.ts:82`; line written at `src/arena/cli.ts:92`
- Line shape: `{ ...rest, metrics }` where `rest` = `GameResult` minus `records` (`src/arena/cli.ts:91`). Fields: `gameId, scenarioId, rival, agent, role, mode, seed, endReason, agreement?, agreedBy?, wrongAgreement, rounds, transcript, agentLatencyMs, error?` (`src/arena/runner.ts:20-39`) + `metrics` (see #12).
- `transcript` entries: `{ round, from, action, offer?, text }` (`src/arena/runner.ts:9-16`)

**2. `results/<runId>/traces/<gameId>.jsonl`** — per-game trace
- Writer: `writeJsonlTrace` at `src/arena/cli.ts:94`; skipped with `--no-traces` or empty records (`src/arena/cli.ts:93`)
- Header object shape (`src/arena/cli.ts:95-105`): `kind, mode, sessionId, runId, scenarioId, rival, seed, configVersion, createdAt, mandate`
- `gameId` format: `${scenario.id}__${rival.name}__${seed}` (`src/arena/runner.ts:68`)

**3. `results/<runId>/summary.json`** — arena summary
- Writer: `writeFileSync` at `src/arena/cli.ts:138`
- Shape (`src/arena/cli.ts:122-137`): `runId, createdAt, llmProvider, network, agent, config {path, version, provenance}, seeds {start, count}, scenarios[], rivals[{name, pool}], durationMs, overall, byRole, clusters`
- Optional when `--candidate` (`src/arena/cli.ts:136`): `candidate {path, version, overall}`, `paired` (`PairedCluster[]`, see #13), `comparison` = `PairedReport` with `clusters` set to `undefined` (`src/arena/cli.ts:118,136`)
- `overall`/`byRole` shape = `summarize` output (see #12)

**4. `results/promote-<stamp>/gate.json`** — promote gate result
- Writer: `writeFileSync` at `src/arena/promote.ts:103`
- Shape: `{ candidate, champion, criterion, gate, reports }` (`src/arena/promote.ts:103`); `gate` = `GateResult` (see #14), `reports` = `Partial<Record<GatePhase, PairedReport>>`

**5. `config/champion.json`** — promoted champion (overwrites)
- Writer: `writeFileSync` at `src/arena/promote.ts:129`
- Shape (`src/arena/promote.ts:109-127`): `{ ...candidateRaw minus frozen, version, provenance {source, parent, createdAt, notes, sweepId?, seeds {phase, start, count}, metrics {criterion, tuningDiffPp, tuningSignP, revalidationDiffPp

[bulk-read: fireworks/deepseek-v4.1-flash · 38914 in / 2500 out · $0.0102 · 26205 ms]
