# Deep review R2 — DS fidelity (range 51859c9..a172cad). R1 DS verified 26/30.

## Major (docs that mislead Claude Design at re-sync)
S1. design-system/.design-sync/config.json:41 Heatmap signature: `rows: { label?: string; /** @deprecated use label */ rival?: string; cells: { label: string; value: number }[] }[]; columns: string[]; rowHeader?: string;`
S2. previews/Button.tsx doesn't match any exported component name (AGENTS.md:105: previews/<Name>.tsx per exported component). Split into previews/PrimaryButton.tsx, SecondaryButton.tsx, BackLink.tsx, TableLink.tsx (Default + Disabled where applicable); delete Button.tsx; update AGENTS.md list.
S3. conventions.md:16 + previews/Legend.tsx: example must use `items`, not children; bullet: "Legend: always pass items (kinds: us, them, target, estimate, zopa, reserve-us, reserve-them, same-round, mandate); children render text only, no swatch." (verify the actual kind list in the source); add TwoIssueLegend preview.

## Minor
S4. Card `level` (2|3|4, default 3) — preview TopLevelCard + conventions bullet.
S5. .design-sync/NOTES.md: update preview count (~20) and remove/close the OfferChart walk-ring paragraph (.walk-ring exists at styles.css:107).
S6. viewer/src/ui/states.tsx:45 inline `font:13px mono; color ink` → DS `.nr-banner-detail{font:13px var(--font-mono);color:var(--ink)}`; lines 121,139 inline color ink → class.
S7. LiveScreen.tsx:120 inline font → DS `.nr-live-caption{font:500 24px var(--font-body);color:var(--muted)}`.
S8. styles.css:133 include `.nr-btn-back` in `.nr-link-back,.nr-link-table{min-height:24px;padding:2px 0}`.
S9. config.json Button signatures: add `className?: string; style?: React.CSSProperties; type?: "button" | "submit";` to all four.

## Nit
S10. LiveScreen.tsx:132 gap:10 → var(--space-3).
S11. Heatmap row key `${rowLabel}-${rowIndex}`.
S12. styles.css:83 `.nr-heat-cell{text-align:center!important}` → `.nr-heat td.nr-heat-cell{text-align:center}`.
S13. conventions.md grid bullet: note "(in TS: as React.CSSProperties)".
