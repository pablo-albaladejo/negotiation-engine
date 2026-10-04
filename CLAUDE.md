# negotiation-ring — context for Claude Code

@AGENTS.md

Team 2 agent for El Bazaar (Causa Prima hackathon). TypeScript, Node ≥ 22, pnpm, Zod, Vitest + fast-check.

## Git flow of this repo (team decision, 3 Oct 2026)

- **The DAY2 branch is the source of truth.** Everything, absolutely everything, is committed on **DAY2**: nothing to `main`, no other branches, no worktrees and no PRs. Work happens in the repo's main folder, on **DAY2**.
- Before every commit: `pnpm test` (guardrails only), `pnpm typecheck` and `pnpm docs:check` green (and `pnpm viewer:typecheck` if the viewer is touched). Hackathon: no tests are written except guardrail tests; everything else is tested with `--dry-run`.
- Small commits and `git push origin DAY2` right after; if the remote **DAY2** has advanced, `git pull --rebase` before pushing.
- This rule overrides any global instruction to use branches or worktrees; the branch guard is disabled only in this repo with `GUARD_BRANCH=off`.

## Claude Code notes

- Non-negotiable rules: see [`AGENTS.md`](AGENTS.md) (the figure comes from the code, only the rival's structure, guardrails, nothing live without approval).
- Recommended reading order: see root `AGENTS.md` and then `src/AGENTS.md`.
- `pnpm` scripts: see root `AGENTS.md` (table).
- Convention: everything in the repo is in English (code, identifiers, comments, dev strings such as logs, CLI, errors and UI, and documentation); only game text (templates, probe phrases, regex over dealer text) keeps its language because it is data.
- Keys (`BAZAAR_KEY`, broker) only in .env and .env.broker; never in docs or code.
