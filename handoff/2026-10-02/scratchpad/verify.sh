#!/bin/bash
# Verifica HEAD + lo staged en un worktree limpio (sin los cambios de duels de otro agente).
set -u
R=/Users/pablo/development/hackathon/negotiation-ring
W=/private/tmp/claude-501/-Users-pablo-development-hackathon-causa-prima/4328c728-5ba0-4af5-b8fe-2a085aa33646/scratchpad/wt
cd $R
git worktree remove --force $W >/dev/null 2>&1; rm -rf $W
GUARD_BRANCH=off git worktree add --detach $W HEAD >/dev/null 2>&1 || { echo "worktree failed"; exit 1; }
for f in "$@"; do mkdir -p "$W/$(dirname "$f")"; cp "$R/$f" "$W/$f"; done
cd $W
ln -s $R/node_modules $W/node_modules
for d in viewer design-system; do [ -d $R/$d/node_modules ] && ln -s $R/$d/node_modules $W/$d/node_modules; done
npx vitest run 2>&1 | grep -E "Test Files|Tests |FAIL" | head -15
npx tsc --noEmit 2>&1 | tail -5 && echo "typecheck exit ${PIPESTATUS[0]}"
node scripts/check-agents-links.mjs >/dev/null 2>&1; l=$?; node scripts/check-identifiers.mjs 2>&1 | tail -3; i=$?; echo "docs links=$l ids=$i"
cd $R && git worktree remove --force $W
