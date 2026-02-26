#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ANCHOR_TOML="$ROOT_DIR/Anchor.toml"
DRY_RUN="${DRY_RUN:-0}"
SURFPOOL_HOST="${SURFPOOL_HOST:-127.0.0.1}"
SURFPOOL_RPC_PORT="${SURFPOOL_RPC_PORT:-8899}"
SURFPOOL_NETWORK="${SURFPOOL_NETWORK:-mainnet}"
WALLET_PATH="${WALLET_PATH:-$HOME/.config/solana/id.json}"

echo "# Surfpool Mainnet Emulation"
echo "root_dir: $ROOT_DIR"
echo "network: $SURFPOOL_NETWORK"
echo "rpc_url: http://$SURFPOOL_HOST:$SURFPOOL_RPC_PORT"

PROGRAM_LINES=$(awk '
  BEGIN { in_section=0; }
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
    printf("%s %s\n", name, id)
  }
' "$ANCHOR_TOML")

if [ "$DRY_RUN" = "1" ]; then
  echo "DRY_RUN=1; planned operations"
  echo "- surfpool start --network $SURFPOOL_NETWORK"
  echo "- anchor build"
  echo "- anchor deploy --provider.cluster localnet --provider.wallet $WALLET_PATH"
  while read -r name id; do [ -n "$name" ] && echo "- verify $name ($id)"; done <<< "$PROGRAM_LINES"
  exit 0
fi

echo "Non-dry-run flow requires surfpool binary and local toolchain"
exit 1
