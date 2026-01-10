/**
 * Origin OS Memory Registry SDK
 * 
 * TypeScript client for interacting with the org-memory-registry Solana program.
 * Provides high-level abstractions for memory operations with automatic PDA derivation.
 */

import {
  Connection,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
  Keypair,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import { BN } from 'bn.js';
import { sha256 } from '@noble/hashes/sha256';

export const PROGRAM_ID = new PublicKey('memRYfSiJ4TgVZMbN3BpZvmHEp7kVLoaLPEJzjdFVWL');

export enum AgentRole { Observer = 0, Writer = 1, TrustedPublisher = 2, Admin = 3 }
export enum MemoryType { Episodic = 0, Semantic = 1, Fact = 2, Preference = 3, Plan = 4, Interaction = 5, Artifact = 6, Skill = 7, Rule = 8 }
export enum PrivacyLevel { Private = 0, Team = 1, Public = 2 }

export interface RegistryConfig { sessionEscrowProgram: PublicKey; stakingProgram: PublicKey; leadMarketplaceProgram: PublicKey; maxClaimsPerMemory: number; defaultTtl: number; }
export interface Claim { predicate: Uint8Array; object: Uint8Array; confidence: number; evidenceHash: Uint8Array; }
export interface Memory { memoryId: Uint8Array; owner: PublicKey; agent: PublicKey; memoryType: MemoryType; subject: Uint8Array; privacy: PrivacyLevel; ttl?: number; tags: Uint8Array[]; linksHash: Uint8Array; claims: Claim[]; }

export function deriveRegistryPDA(): [PublicKey, number] { return PublicKey.findProgramAddressSync([Buffer.from('registry')], PROGRAM_ID); }
export function deriveAgentPDA(agentId: Uint8Array): [PublicKey, number] { return PublicKey.findProgramAddressSync([Buffer.from('agent'), Buffer.from(agentId)], PROGRAM_ID); }
export function deriveMemoryPDA(owner: PublicKey, memoryId: Uint8Array): [PublicKey, number] { return PublicKey.findProgramAddressSync([Buffer.from('memory'), owner.toBuffer(), Buffer.from(memoryId)], PROGRAM_ID); }
export function deriveClaimPDA(memoryId: Uint8Array, claimIndex: number): [PublicKey, number] { const idxBuf = Buffer.alloc(4); idxBuf.writeUInt32LE(claimIndex); return PublicKey.findProgramAddressSync([Buffer.from('claim'), Buffer.from(memoryId), idxBuf], PROGRAM_ID); }

export class MemoryRegistrySDK {
  private connection: Connection; private programId: PublicKey;
  constructor(connection: Connection, programId: PublicKey = PROGRAM_ID) { this.connection = connection; this.programId = programId; }
  generateMemoryId(): Uint8Array { return Keypair.generate().publicKey.toBytes().slice(0, 16); }
  generateAgentId(): Uint8Array { return Keypair.generate().publicKey.toBytes().slice(0, 16); }
  hashString(input: string): Uint8Array { return sha256(Buffer.from(input)); }
}

export default MemoryRegistrySDK;
