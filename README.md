# Origin OS Memory Registry

Solana/Anchor program for unified AI agent memory on-chain.

## Program ID
`memRYfSiJ4TgVZMbN3BpZvmHEp7kVLoaLPEJzjdFVWL`

## Architecture

### Memory Types
- **Episodic**: Raw observations, append-only
- **Semantic**: Validated facts, promoted from episodic

### Agent Roles
- Observer (read-only)
- Writer (can create episodic memories)
- TrustedPublisher (can promote to semantic)
- Admin (full control)

### Instructions
1. `initialize_registry` - Create registry with admin
2. `register_agent` - Register agent with signing authority
3. `write_memory` - Write episodic memory
4. `add_claim` - Add claim to memory
5. `promote_memory` - Promote episodic to semantic
6. `retract_claim` - Mark claim as invalid
7. `supersede_claim` - Replace claim with new value
8. `attest_merkle_root` - Batch attestation
9. `update_trust_score` - CPI from staking_rewards
10. `verify_memory_for_session` - CPI for session_escrow

## Build
```bash
anchor build
anchor deploy --provider.cluster devnet
```

## SDK
```bash
cd sdk && npm install && npm run build
```

## License
Apache-2.0
