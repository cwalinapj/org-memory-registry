"use strict";
/**
 * Origin OS Memory Registry SDK
 *
 * TypeScript client for interacting with the org-memory-registry Solana program.
 * Provides high-level abstractions for memory operations with automatic PDA derivation.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryRegistrySDK = exports.PrivacyLevel = exports.MemoryType = exports.AgentRole = exports.PROGRAM_ID = void 0;
exports.deriveRegistryPDA = deriveRegistryPDA;
exports.deriveAgentPDA = deriveAgentPDA;
exports.deriveMemoryPDA = deriveMemoryPDA;
exports.deriveClaimPDA = deriveClaimPDA;
const web3_js_1 = require("@solana/web3.js");
const sha256_1 = require("@noble/hashes/sha256");
exports.PROGRAM_ID = new web3_js_1.PublicKey('memRYfSiJ4TgVZMbN3BpZvmHEp7kVLoaLPEJzjdFVWL');
var AgentRole;
(function (AgentRole) {
    AgentRole[AgentRole["Observer"] = 0] = "Observer";
    AgentRole[AgentRole["Writer"] = 1] = "Writer";
    AgentRole[AgentRole["TrustedPublisher"] = 2] = "TrustedPublisher";
    AgentRole[AgentRole["Admin"] = 3] = "Admin";
})(AgentRole || (exports.AgentRole = AgentRole = {}));
var MemoryType;
(function (MemoryType) {
    MemoryType[MemoryType["Episodic"] = 0] = "Episodic";
    MemoryType[MemoryType["Semantic"] = 1] = "Semantic";
    MemoryType[MemoryType["Fact"] = 2] = "Fact";
    MemoryType[MemoryType["Preference"] = 3] = "Preference";
    MemoryType[MemoryType["Plan"] = 4] = "Plan";
    MemoryType[MemoryType["Interaction"] = 5] = "Interaction";
    MemoryType[MemoryType["Artifact"] = 6] = "Artifact";
    MemoryType[MemoryType["Skill"] = 7] = "Skill";
    MemoryType[MemoryType["Rule"] = 8] = "Rule";
})(MemoryType || (exports.MemoryType = MemoryType = {}));
var PrivacyLevel;
(function (PrivacyLevel) {
    PrivacyLevel[PrivacyLevel["Private"] = 0] = "Private";
    PrivacyLevel[PrivacyLevel["Team"] = 1] = "Team";
    PrivacyLevel[PrivacyLevel["Public"] = 2] = "Public";
})(PrivacyLevel || (exports.PrivacyLevel = PrivacyLevel = {}));
function deriveRegistryPDA() { return web3_js_1.PublicKey.findProgramAddressSync([Buffer.from('registry')], exports.PROGRAM_ID); }
function deriveAgentPDA(agentId) { return web3_js_1.PublicKey.findProgramAddressSync([Buffer.from('agent'), Buffer.from(agentId)], exports.PROGRAM_ID); }
function deriveMemoryPDA(owner, memoryId) { return web3_js_1.PublicKey.findProgramAddressSync([Buffer.from('memory'), owner.toBuffer(), Buffer.from(memoryId)], exports.PROGRAM_ID); }
function deriveClaimPDA(memoryId, claimIndex) { const idxBuf = Buffer.alloc(4); idxBuf.writeUInt32LE(claimIndex); return web3_js_1.PublicKey.findProgramAddressSync([Buffer.from('claim'), Buffer.from(memoryId), idxBuf], exports.PROGRAM_ID); }
class MemoryRegistrySDK {
    constructor(connection, programId = exports.PROGRAM_ID) { this.connection = connection; this.programId = programId; }
    generateMemoryId() { return web3_js_1.Keypair.generate().publicKey.toBytes().slice(0, 16); }
    generateAgentId() { return web3_js_1.Keypair.generate().publicKey.toBytes().slice(0, 16); }
    hashString(input) { return (0, sha256_1.sha256)(Buffer.from(input)); }
}
exports.MemoryRegistrySDK = MemoryRegistrySDK;
exports.default = MemoryRegistrySDK;
//# sourceMappingURL=index.js.map