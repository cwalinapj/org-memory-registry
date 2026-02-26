# Surfpool Mainnet Emulation

This repo supports local Surfpool-based mainnet emulation for Anchor deploy/verify workflows.

## Quick Start

```bash
bash scripts/surfpool_plan.sh
DRY_RUN=1 bash scripts/surfpool_emulate_mainnet.sh
```

## Notes

- Program IDs are read from `[programs.localnet]` in `Anchor.toml`.
- Full deploy/verify flow is printed in dry-run mode before any execution.
