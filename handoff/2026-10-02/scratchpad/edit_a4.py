import sys

path = "/Users/pablo/development/hackathon/negotiation-ring/viewer/src/screens/LiveScreen.tsx"
old = '''          {!projectorMode ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                <Scoreboard badge={model.badge} us={US} rival={rival} rivalPending={waiting} round={waiting ? null : model.round} rounds={rounds} attacksBlocked={waiting ? null : model.attacksBlocked} />
                <ModeBadge mode="tournament" />
              </div>
              <SecondaryButton onClick={() => setProjectorMode(true)}>Projector mode</SecondaryButton>
            </div>
          ) : (
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <SecondaryButton onClick={() => setProjectorMode(false)}>Exit projector mode (Esc)</SecondaryButton>
            </div>
          )}'''
new = '''          <div style={{ display: "flex", alignItems: "center", justifyContent: projectorMode ? "flex-end" : "space-between", gap: 24 }}>
            {!projectorMode ? (
              <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                <Scoreboard badge={model.badge} us={US} rival={rival} rivalPending={waiting} round={waiting ? null : model.round} rounds={rounds} attacksBlocked={waiting ? null : model.attacksBlocked} />
                <ModeBadge mode="tournament" />
              </div>
            ) : null}
            <SecondaryButton aria-pressed={projectorMode} onClick={() => setProjectorMode((v) => !v)}>
              {projectorMode ? "Exit projector mode (Esc)" : "Projector mode"}
            </SecondaryButton>
          </div>'''

with open(path, encoding="utf-8") as f:
    content = f.read()
count = content.count(old)
if count != 1:
    print(f"ERROR: found {count} occurrences", file=sys.stderr)
    sys.exit(1)
content = content.replace(old, new, 1)
with open(path, "w", encoding="utf-8") as f:
    f.write(content)
print("OK")
