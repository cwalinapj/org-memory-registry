/**
 * Origin OS Memory Registry SDK
 *
 * TypeScript client for interacting with the org-memory-registry Solana program.
 * Provides high-level abstractions for memory operations with automatic PDA derivation.
 */
import { Connection, PublicKey } from '@solana/web3.js';
export declare const PROGRAM_ID: PublicKey;
export declare enum AgentRole {
    Observer = 0,
    Writer = 1,
    TrustedPublisher = 2,
    Admin = 3
}
export declare enum MemoryType {
    Episodic = 0,
    Semantic = 1,
    Fact = 2,
    Preference = 3,
    Plan = 4,
    Interaction = 5,
    Artifact = 6,
    Skill = 7,
    Rule = 8
}
export declare enum PrivacyLevel {
    Private = 0,
    Team = 1,
    Public = 2
}
export interface RegistryConfig {
    sessionEscrowProgram: PublicKey;
    stakingProgram: PublicKey;
    leadMarketplaceProgram: PublicKey;
    maxClaimsPerMemory: number;
    defaultTtl: number;
}
export interface Claim {
    predicate: Uint8Array;
    object: Uint8Array;
    confidence: number;
    evidenceHash: Uint8Array;
}
export interface Memory {
    memoryId: Uint8Array;
    owner: PublicKey;
    agent: PublicKey;
    memoryType: MemoryType;
    subject: Uint8Array;
    privacy: PrivacyLevel;
    ttl?: number;
    tags: Uint8Array[];
    linksHash: Uint8Array;
    claims: Claim[];
}
export declare function deriveRegistryPDA(): [PublicKey, number];
export declare function deriveAgentPDA(agentId: Uint8Array): [PublicKey, number];
export declare function deriveMemoryPDA(owner: PublicKey, memoryId: Uint8Array): [PublicKey, number];
export declare function deriveClaimPDA(memoryId: Uint8Array, claimIndex: number): [PublicKey, number];
export declare class MemoryRegistrySDK {
    private connection;
    private programId;
    constructor(connection: Connection, programId?: PublicKey);
    generateMemoryId(): Uint8Array;
    generateAgentId(): Uint8Array;
    hashString(input: string): Uint8Array;
}
export default MemoryRegistrySDK;
//# sourceMappingURL=index.d.ts.map