#!/bin/bash
# Starts the Bazaar sniffer and dashboard server via launchd.
# Usage: ./start.sh

set -u

uid=$(id -u)

echo "Starting Bazaar sniffer and dashboard..."
launchctl bootstrap gui/$uid /Users/pablo/Library/LaunchAgents/ai.causaprima.bazaar-sniff.plist 2>/dev/null || \
  launchctl kickstart -k gui/$uid/ai.causaprima.bazaar-sniff

launchctl bootstrap gui/$uid /Users/pablo/Library/LaunchAgents/ai.causaprima.bazaar-serve.plist 2>/dev/null || \
  launchctl kickstart -k gui/$uid/ai.causaprima.bazaar-serve

sleep 2

echo ""
echo "=== Job status ==="
launchctl list | grep "ai.causaprima.bazaar"

echo ""
echo "=== Running processes ==="
pgrep -fl "sniff.sh|http.server" | grep -v grep || echo "(checking...)"

echo ""
echo "Dashboard: http://localhost:8787/dashboard.html"
echo "Logs: tail -f data/snapshots.jsonl or tail -f sniff.log"
