# design-system/.design-sync/ — Sync with Claude Design

Contract for exporting the components of [`design-system/`](../AGENTS.md) to the Claude Design project (`projectId` in `config.json`, fixed: do not change it). Folder exempt from the 10-file cap (generated and maintained by the sync tool).

## Files

- **`config.json`** — `pkg` (`@negotiation-ring/design-system`), `globalName` (`NegotiationRing`), `buildCmd` (`pnpm build`), `cssEntry` (`dist/styles.css`), `provider` (`Root` wraps each cell), `overrides` (`cardMode:"column"` on wide components), `dtsPropsFor` (inline typed props per component) and `readmeHeader`.
- **`conventions.md`** — README in English read by the Claude Design agent: wrap in `<Root>`, CSS tokens (`--us` blue = us, `--them` amber = rival, `--ok`, `--warn`), numbers in English format (`formatNumber(v, {locale:"en"})`), rival text verbatim, presentation-only UI.
- **`NOTES.md`** — gotchas and re-sync risks (render warns, known bugs, Playwright 1.60.0 pinned).
- **`previews/*.tsx`** — one preview cell per exported component (22; never a shared one, even if they share source, e.g. the four buttons), hand-written and without the `@ds-preview generated` marker.
- Ignored by git: `.cache/`, `ds-bundle/`, `learnings/` and `.ds-sync/`; `dist/` too (run `pnpm build` before syncing).

## How to re-sync

1. Change a component in `src/`: update its preview and `dtsPropsFor` in `config.json`.
2. From Claude Code in `design-system/`: `/design-sync`.
3. Changing a preview's JSX or the keys of `config.json` forces a re-grade; `cardMode` and English UI text do not.

## Links

- ↑ [`design-system/`](../AGENTS.md)
