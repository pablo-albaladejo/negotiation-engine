#!/bin/bash
# Stops the Bazaar sniffer and dashboard server via launchd.
# Usage: ./stop.sh [--keep-sniff | --keep-serve]

set -u

KEEP_SNIFF=0
KEEP_SERVE=0

if [ "${1:-}" = "--keep-sniff" ]; then
  KEEP_SERVE=1
elif [ "${1:-}" = "--keep-serve" ]; then
  KEEP_SNIFF=1
fi

uid=$(id -u)

if [ "$KEEP_SNIFF" -eq 0 ]; then
  echo "Stopping sniff..."
  launchctl bootout gui/$uid/ai.causaprima.bazaar-sniff 2>/dev/null || \
    echo "  (was not running)"
fi

if [ "$KEEP_SERVE" -eq 0 ]; then
  echo "Stopping dashboard server..."
  launchctl bootout gui/$uid/ai.causaprima.bazaar-serve 2>/dev/null || \
    echo "  (was not running)"
fi

sleep 1
echo "Done."
