# Origin OS Memory Registry - Ethereum Bridge

Ethereum-side implementation of the unified memory registry for cross-chain memory attestation with Solana.

## Contracts

### OrgMemoryRegistry.sol
Main registry contract that mirrors the Solana program functionality:
- Agent registration with roles (Observer, Writer, TrustedPublisher, Admin)
- Memory creation with types (Episodic, Semantic, Fact, Preference, Plan, etc.)
- Claims with confidence scores
- Merkle root attestations
- Cross-chain bridging to/from Solana

### WormholeBridgeRelayer.sol
Handles Wormhole VAA verification for cross-chain bridges:
- Receives Solana memories via Wormhole
- Verifies attestations
- Initiates bridges to Solana

## Deployment

### Prerequisites
1. Install Foundry: `curl -L https://foundry.paradigm.xyz | bash && foundryup`
2. Get Sepolia ETH from faucet: https://sepoliafaucet.com

### Local (Anvil)
```bash
# Start Anvil
anvil

# Deploy
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
forge script script/DeployAll.s.sol --rpc-url http://127.0.0.1:8545 --broadcast
```

### Sepolia Testnet
```bash
# Set your private key
export PRIVATE_KEY=0x...your_key...

# Deploy
forge script script/DeployAll.s.sol \
  --rpc-url https://ethereum-sepolia-rpc.publicnode.com \
  --broadcast \
  --verify
```

## Cross-Chain Flow

### Solana → Ethereum
1. Memory created on Solana (org-memory-registry program)
2. Wormhole guardian network observes and signs
3. Relayer submits VAA to Ethereum
4. WormholeBridgeRelayer verifies and creates mirrored memory
5. Confidence boosted after verification (50% → 90%)

### Ethereum → Solana
1. Call `bridgeToSolana(memoryId)` on registry
2. Emits `MemoryBridgeRequested` event
3. Relayer picks up and calls Solana program
4. Memory created on Solana with Ethereum attestation

## Testing
```bash
forge test -vv
```

## Addresses

### Sepolia (Testnet)
- OrgMemoryRegistry: TBD (deploy with your key)
- WormholeBridgeRelayer: TBD
- Wormhole Core: 0x4a8bc80Ed5a4067f1CCf107057b8270E0cC11A78

### Solana (Devnet)
- Program ID: memRYfSiJ4TgVZMbN3BpZvmHEp7kVLoaLPEJzjdFVWL

## Integration with Origin OS

The Ethereum bridge enables:
1. **Multi-chain memory persistence** - Same memory accessible on both chains
2. **Cross-chain trust scores** - Verified bridges boost confidence
3. **Unified agent identity** - Map Ethereum addresses to Solana pubkeys
4. **DeFi integration** - Use Ethereum DeFi with Origin OS memories

## License
MIT
