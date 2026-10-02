import json, sys

data = json.load(sys.stdin)
path = data["file"]
old = data["old"]
new = data["new"]
replace_all = data.get("replace_all", False)

with open(path, encoding="utf-8") as f:
    content = f.read()

count = content.count(old)
if count == 0:
    print(f"ERROR: old string not found in {path}", file=sys.stderr)
    sys.exit(1)
if count > 1 and not replace_all:
    print(f"ERROR: old string found {count} times in {path}, expected 1 (set replace_all)", file=sys.stderr)
    sys.exit(1)

if replace_all:
    content = content.replace(old, new)
else:
    content = content.replace(old, new, 1)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print(f"OK: edited {path} ({count} occurrence(s) replaced)")
