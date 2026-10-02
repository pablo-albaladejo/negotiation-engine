# Deep review R1 — tests/routing/robustness fixes (items not already in review-r1-logic.md)

T1. viewer/src/route.ts:17 — `parts.map(decodeURIComponent)` throws URIError on malformed % (e.g. `#/runs/%E0%A4%A`) → blank app. Use safeDecode (try/catch, return raw). Test. Also consider a top-level error boundary that shows the DS error state instead of a blank page.
T2. App.tsx useHashRoute (~27-35, 105-107): after replaceState for filters, router state (route.query) goes stale; expose `replaceRoute(hash)` that does replaceState + setHash so state matches location. Make sure navigate(x) to the current URL still works.
T3. viewer/test/ui/app.test.tsx back/forward test: assertions pass vacuously ("Runs" is a tab label; firstGameId also in Matches table). Assert window.location.hash and screen-unique content (e.g. "← Matches" on replay, Runs page heading). Drop manual hashchange dispatch (jsdom fires it).
T4. Add test: start #/runs/r no query → click Buyer → hash has role=buyer → open game → hash carries role=buyer → "← Matches" → Buyer selected and all rows Buyer.
T5. App.tsx:42-54 useChampionVersion: add .catch → null (no unhandled rejection); test with fetch rejecting (Runs renders, no pill).
T6. viewer/test/server/api.test.ts: /api/champion cases — missing file → {data:null, errors:[]}; malformed JSON / no version → 200, data null, one error; extra fields (e.g. mandate) stripped; /api/champion/x → 404.
T7. MatchesScreen page number in the URL query (`p=`), carried through replay and back; invalid/out-of-range p clamps. Test: page 2 → open game → back → "Page 2 of N".
T8. Drop `injection` from filters/URL when the run has no injection data (on mount / in queryToFilters given hasInjectionData).
T9. App.tsx:113-129: cache the run payload per runId so switching games in the replay doesn't refetch summary + all games; refetch only the trace.
T10. MatchesScreen.tsx:67: useMemo for matchesModel.
T11. route.test.ts: ids with ? / # % space round-trip; unknown head → Runs; empty hash; `#/runs/r?` empty query.
T12. theme test asserts direction (stub matchMedia light → before light, after dark); theme.test storage failure → fallback to matchMedia dark.
