#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ANCHOR_TOML="$ROOT_DIR/Anchor.toml"

echo "# Surfpool Program Plan"
echo "anchor_toml: $ANCHOR_TOML"

awk '
  BEGIN { in_section=0; count=0; }
  /^\[programs\.localnet\]/ { in_section=1; next }
  /^\[/ { if (in_section) in_section=0 }
  in_section && /^[[:space:]]*[a-zA-Z0-9_]+[[:space:]]*=[[:space:]]*"[^"]+"/ {
    line=$0
    gsub(/^[[:space:]]+|[[:space:]]+$/, "", line)
    split(line, parts, "=")
    name=parts[1]
    gsub(/[[:space:]]/, "", name)
    id=parts[2]
    gsub(/^[[:space:]]*"|"[[:space:]]*$/, "", id)
    printf("- %s -> %s\n", name, id)
    count++
  }
  END { printf("program_count: %d\n", count) }
' "$ANCHOR_TOML"
