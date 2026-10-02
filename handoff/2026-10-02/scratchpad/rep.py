import sys, json
# uso: rep.py file  (lee pares JSON [[old,new],...] de stdin)
path = sys.argv[1]
s = open(path).read()
for old, new in json.load(sys.stdin):
    n = s.count(old)
    if n != 1:
        sys.exit(f"{path}: {n} matches for: {old[:80]!r}")
    s = s.replace(old, new)
open(path, "w").write(s)
print("ok", path)
