use anchor_lang::prelude::*;


declare_id!("EduJX2mC335nh3uQ6TarYT5GaMumA2RBethG4CEuyh62");

/// Origin OS Memory Registry
/// 
/// Unified memory substrate for AI agents on Solana.
/// Implements three-layer memory architecture:
/// - Working Memory (session-scoped, off-chain)
/// - Episodic Memory (events, append-only)
/// - Semantic Memory (facts, validated/promoted)
/// 
/// Integrates with Origin OS Protocol:
/// - session_escrow for CDN attestation
/// - staking_rewards for agent trust scores
/// - lead_marketplace for locality proofs

#[program]
pub mod org_memory_registry {
    use super::*;

    /// Initialize the memory registry with admin authority
    pub fn initialize_registry(ctx: Context<InitializeRegistry>, config: RegistryConfig) -> Result<()> {
        let registry = &mut ctx.accounts.registry;
        registry.admin = ctx.accounts.admin.key();
        registry.schema_version = 1;
        registry.memory_count = 0;
        registry.agent_count = 0;
        registry.merkle_root = [0u8; 32];
        registry.last_attestation = 0;
        registry.config = config;
        registry.bump = ctx.bumps.registry;

        emit!(RegistryInitialized {
            registry: registry.key(),
            admin: registry.admin,
            schema_version: registry.schema_version,
        });

        Ok(())
    }

    /// Register an agent with signing authority
    pub fn register_agent(
        ctx: Context<RegisterAgent>,
        agent_id: [u8; 16],
        role: AgentRole,
    ) -> Result<()> {
        let agent = &mut ctx.accounts.agent_authority;
        agent.agent_id = agent_id;
        agent.pubkey = ctx.accounts.agent_signer.key();
        agent.role = role;
        agent.trust_score = 0;
        agent.memory_count = 0;
        agent.created_at = Clock::get()?.unix_timestamp;
        agent.last_active = agent.created_at;
        agent.bump = ctx.bumps.agent_authority;

        let registry = &mut ctx.accounts.registry;
        registry.agent_count += 1;

        emit!(AgentRegistered {
            agent_id,
            pubkey: agent.pubkey,
            role,
        });

        Ok(())
    }

    /// Write episodic memory (any registered agent can write)
    pub fn write_memory(
        ctx: Context<WriteMemory>,
        memory_id: [u8; 16],
        memory_type: MemoryType,
        subject: [u8; 32],
        privacy: PrivacyLevel,
        ttl: Option<i64>,
        tags: Vec<[u8; 32]>,
        links_hash: [u8; 32],
    ) -> Result<()> {
        require!(
            memory_type == MemoryType::Episodic,
            MemoryError::OnlyEpisodicAllowed
        );
        require!(tags.len() <= MAX_TAGS, MemoryError::TooManyTags);

        let memory = &mut ctx.accounts.memory_record;
        let agent = &mut ctx.accounts.agent_authority;
        let clock = Clock::get()?;

        memory.memory_id = memory_id;
        memory.schema_version = 1;
        memory.owner = ctx.accounts.owner.key();
        memory.agent = agent.pubkey;
        memory.created_at = clock.unix_timestamp;
        memory.observed_at = clock.unix_timestamp;
        memory.memory_type = memory_type;
        memory.subject = subject;
        memory.claims_count = 0;
        memory.privacy = privacy;
        memory.ttl = ttl;
        memory.tags = tags;
        memory.links_hash = links_hash;
        memory.integrity_hash = [0u8; 32];
        memory.is_promoted = false;
        memory.bump = ctx.bumps.memory_record;

        agent.memory_count += 1;
        agent.last_active = clock.unix_timestamp;

        let registry = &mut ctx.accounts.registry;
        registry.memory_count += 1;

        emit!(MemoryCreated {
            memory_id,
            owner: memory.owner,
            agent: memory.agent,
            memory_type,
            subject,
        });

        Ok(())
    }

    /// Add a claim to an existing memory
    pub fn add_claim(
        ctx: Context<AddClaim>,
        claim_index: u32,
        predicate: [u8; 32],
        object: [u8; 64],
        confidence: u16,
        evidence_hash: [u8; 32],
    ) -> Result<()> {
        require!(confidence <= 10000, MemoryError::InvalidConfidence);

        let claim = &mut ctx.accounts.claim_account;
        let memory = &mut ctx.accounts.memory_record;
        let clock = Clock::get()?;

        claim.memory_id = memory.memory_id;
        claim.claim_index = claim_index;
        claim.predicate = predicate;
        claim.object = object;
        claim.confidence = confidence;
        claim.evidence_hash = evidence_hash;
        claim.created_at = clock.unix_timestamp;
        claim.is_retracted = false;
        claim.superseded_by = None;
        claim.bump = ctx.bumps.claim_account;

        memory.claims_count += 1;

        // Recompute integrity hash
        let mut hash_input = Vec::new();
        hash_input.extend_from_slice(&memory.memory_id);
        hash_input.extend_from_slice(&predicate);
        hash_input.extend_from_slice(&object);
        hash_input.extend_from_slice(&confidence.to_le_bytes());
        let new_hash = hash(&hash_input);
        memory.integrity_hash = new_hash.to_bytes();

        emit!(ClaimAdded {
            memory_id: memory.memory_id,
            claim_index,
            predicate,
            confidence,
        });

        Ok(())
    }

    /// Promote episodic memory to semantic (requires trusted publisher role)
    pub fn promote_memory(ctx: Context<PromoteMemory>) -> Result<()> {
        let memory = &mut ctx.accounts.memory_record;
        let agent = &ctx.accounts.agent_authority;

        require!(
            agent.role == AgentRole::TrustedPublisher || agent.role == AgentRole::Admin,
            MemoryError::InsufficientPermissions
        );
        require!(
            memory.memory_type == MemoryType::Episodic,
            MemoryError::AlreadyPromoted
        );
        require!(!memory.is_promoted, MemoryError::AlreadyPromoted);

        memory.memory_type = MemoryType::Semantic;
        memory.is_promoted = true;

        emit!(MemoryPromoted {
            memory_id: memory.memory_id,
            promoted_by: agent.pubkey,
            new_type: MemoryType::Semantic,
        });

        Ok(())
    }

    /// Retract a claim (marks as invalid with reason)
    pub fn retract_claim(
        ctx: Context<RetractClaim>,
        reason_hash: [u8; 32],
    ) -> Result<()> {
        let claim = &mut ctx.accounts.claim_account;
        let agent = &ctx.accounts.agent_authority;

        require!(!claim.is_retracted, MemoryError::AlreadyRetracted);
        require!(
            agent.role == AgentRole::TrustedPublisher || agent.role == AgentRole::Admin,
            MemoryError::InsufficientPermissions
        );

        claim.is_retracted = true;

        emit!(ClaimRetracted {
            memory_id: claim.memory_id,
            claim_index: claim.claim_index,
            retracted_by: agent.pubkey,
            reason_hash,
        });

        Ok(())
    }

    /// Supersede a claim with a new value
    pub fn supersede_claim(
        ctx: Context<SupersedeClaim>,
        new_object: [u8; 64],
        new_confidence: u16,
        new_evidence_hash: [u8; 32],
    ) -> Result<()> {
        let old_claim = &mut ctx.accounts.old_claim;
        let new_claim = &mut ctx.accounts.new_claim;
        let memory = &ctx.accounts.memory_record;
        let clock = Clock::get()?;

        require!(!old_claim.is_retracted, MemoryError::AlreadyRetracted);
        require!(new_confidence <= 10000, MemoryError::InvalidConfidence);

        // Mark old claim as superseded
        old_claim.superseded_by = Some(new_claim.key());

        // Initialize new claim
        new_claim.memory_id = memory.memory_id;
        new_claim.claim_index = old_claim.claim_index + 1000; // Offset for superseding claims
        new_claim.predicate = old_claim.predicate;
        new_claim.object = new_object;
        new_claim.confidence = new_confidence;
        new_claim.evidence_hash = new_evidence_hash;
        new_claim.created_at = clock.unix_timestamp;
        new_claim.is_retracted = false;
        new_claim.superseded_by = None;
        new_claim.bump = ctx.bumps.new_claim;

        emit!(ClaimSuperseded {
            memory_id: memory.memory_id,
            old_claim_index: old_claim.claim_index,
            new_claim_index: new_claim.claim_index,
        });

        Ok(())
    }

    /// Attest a batch of memory hashes with Merkle root
    pub fn attest_merkle_root(
        ctx: Context<AttestMerkleRoot>,
        memory_hashes: Vec<[u8; 32]>,
    ) -> Result<()> {
        require!(
            !memory_hashes.is_empty(),
            MemoryError::EmptyMerkleInput
        );
        require!(
            memory_hashes.len() <= MAX_MERKLE_LEAVES,
            MemoryError::TooManyMerkleLeaves
        );

        let attestation = &mut ctx.accounts.attestation;
        let registry = &mut ctx.accounts.registry;
        let clock = Clock::get()?;

        // Compute Merkle root
        let merkle_root = compute_merkle_root(&memory_hashes);

        attestation.merkle_root = merkle_root;
        attestation.timestamp = clock.unix_timestamp;
        attestation.attester = ctx.accounts.attester.key();
        attestation.leaf_count = memory_hashes.len() as u32;
        attestation.epoch = registry.memory_count;
        attestation.bump = ctx.bumps.attestation;

        registry.merkle_root = merkle_root;
        registry.last_attestation = clock.unix_timestamp;

        emit!(MerkleRootAttested {
            merkle_root,
            timestamp: attestation.timestamp,
            attester: attestation.attester,
            leaf_count: attestation.leaf_count,
            epoch: attestation.epoch,
        });

        Ok(())
    }

    /// Update agent trust score (called by staking_rewards via CPI)
    pub fn update_trust_score(
        ctx: Context<UpdateTrustScore>,
        new_score: u64,
    ) -> Result<()> {
        let agent = &mut ctx.accounts.agent_authority;
        
        // Only allow score updates from authorized callers
        require!(
            ctx.accounts.caller.key() == ctx.accounts.registry.config.staking_program,
            MemoryError::UnauthorizedCaller
        );

        agent.trust_score = new_score;

        emit!(TrustScoreUpdated {
            agent_id: agent.agent_id,
            new_score,
        });

        Ok(())
    }

    /// Verify memory for session escrow (CPI callable)
    pub fn verify_memory_for_session(
        ctx: Context<VerifyMemoryForSession>,
        expected_hash: [u8; 32],
    ) -> Result<bool> {
        let memory = &ctx.accounts.memory_record;
        
        let valid = memory.integrity_hash == expected_hash
            && !memory.is_expired(Clock::get()?.unix_timestamp);

        emit!(MemoryVerified {
            memory_id: memory.memory_id,
            verified: valid,
            verifier: ctx.accounts.verifier.key(),
        });

        Ok(valid)
    }
}

// ================================================================================
// ACCOUNT STRUCTURES
// ================================================================================

#[account]
#[derive(Default)]
pub struct MemoryRegistry {
    pub admin: Pubkey,
    pub schema_version: u8,
    pub memory_count: u64,
    pub agent_count: u32,
    pub merkle_root: [u8; 32],
    pub last_attestation: i64,
    pub config: RegistryConfig,
    pub bump: u8,
}

impl MemoryRegistry {
    pub const SIZE: usize = 8 + 32 + 1 + 8 + 4 + 32 + 8 + RegistryConfig::SIZE + 1;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct RegistryConfig {
    pub session_escrow_program: Pubkey,
    pub staking_program: Pubkey,
    pub lead_marketplace_program: Pubkey,
    pub max_claims_per_memory: u16,
    pub default_ttl: i64,
}

impl RegistryConfig {
    pub const SIZE: usize = 32 + 32 + 32 + 2 + 8;
}

#[account]
pub struct AgentAuthority {
    pub agent_id: [u8; 16],
    pub pubkey: Pubkey,
    pub role: AgentRole,
    pub trust_score: u64,
    pub memory_count: u64,
    pub created_at: i64,
    pub last_active: i64,
    pub bump: u8,
}

impl AgentAuthority {
    pub const SIZE: usize = 8 + 16 + 32 + 1 + 8 + 8 + 8 + 8 + 1;
}

#[account]
pub struct MemoryRecord {
    pub memory_id: [u8; 16],
    pub schema_version: u8,
    pub owner: Pubkey,
    pub agent: Pubkey,
    pub created_at: i64,
    pub observed_at: i64,
    pub memory_type: MemoryType,
    pub subject: [u8; 32],
    pub claims_count: u16,
    pub privacy: PrivacyLevel,
    pub ttl: Option<i64>,
    pub tags: Vec<[u8; 32]>,
    pub links_hash: [u8; 32],
    pub integrity_hash: [u8; 32],
    pub is_promoted: bool,
    pub bump: u8,
}

impl MemoryRecord {
    pub const BASE_SIZE: usize = 8 + 16 + 1 + 32 + 32 + 8 + 8 + 1 + 32 + 2 + 1 + 9 + 4 + 32 + 32 + 1 + 1;
    
    pub fn size(num_tags: usize) -> usize {
        Self::BASE_SIZE + (num_tags * 32)
    }

    pub fn is_expired(&self, current_time: i64) -> bool {
        if let Some(ttl) = self.ttl {
            current_time > self.created_at + ttl
        } else {
            false
        }
    }
}

#[account]
pub struct ClaimAccount {
    pub memory_id: [u8; 16],
    pub claim_index: u32,
    pub predicate: [u8; 32],
    pub object: [u8; 64],
    pub confidence: u16,
    pub evidence_hash: [u8; 32],
    pub created_at: i64,
    pub is_retracted: bool,
    pub superseded_by: Option<Pubkey>,
    pub bump: u8,
}

impl ClaimAccount {
    pub const SIZE: usize = 8 + 16 + 4 + 32 + 64 + 2 + 32 + 8 + 1 + 33 + 1;
}

#[account]
pub struct MerkleAttestation {
    pub merkle_root: [u8; 32],
    pub timestamp: i64,
    pub attester: Pubkey,
    pub leaf_count: u32,
    pub epoch: u64,
    pub bump: u8,
}

impl MerkleAttestation {
    pub const SIZE: usize = 8 + 32 + 8 + 32 + 4 + 8 + 1;
}

// ================================================================================
// ENUMS
// ================================================================================

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Default)]
pub enum AgentRole {
    #[default]
    Observer,           // Can read
    Writer,             // Can write episodic
    TrustedPublisher,   // Can promote to semantic
    Admin,              // Full control
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Default)]
pub enum MemoryType {
    #[default]
    Episodic,   // Events, interactions
    Semantic,   // Facts, validated truths
    Fact,
    Preference,
    Plan,
    Interaction,
    Artifact,
    Skill,
    Rule,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Default)]
pub enum PrivacyLevel {
    #[default]
    Private,
    Team,
    Public,
}

// ================================================================================
// CONTEXTS
// ================================================================================

#[derive(Accounts)]
pub struct InitializeRegistry<'info> {
    #[account(
        init,
        payer = admin,
        space = MemoryRegistry::SIZE,
        seeds = [b"registry"],
        bump
    )]
    pub registry: Account<'info, MemoryRegistry>,
    
    #[account(mut)]
    pub admin: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(agent_id: [u8; 16])]
pub struct RegisterAgent<'info> {
    #[account(
        mut,
        seeds = [b"registry"],
        bump = registry.bump
    )]
    pub registry: Account<'info, MemoryRegistry>,
    
    #[account(
        init,
        payer = payer,
        space = AgentAuthority::SIZE,
        seeds = [b"agent", agent_id.as_ref()],
        bump
    )]
    pub agent_authority: Account<'info, AgentAuthority>,
    
    pub agent_signer: Signer<'info>,
    
    #[account(mut)]
    pub payer: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(memory_id: [u8; 16], memory_type: MemoryType, subject: [u8; 32], privacy: PrivacyLevel, ttl: Option<i64>, tags: Vec<[u8; 32]>)]
pub struct WriteMemory<'info> {
    #[account(
        mut,
        seeds = [b"registry"],
        bump = registry.bump
    )]
    pub registry: Account<'info, MemoryRegistry>,
    
    #[account(
        init,
        payer = payer,
        space = MemoryRecord::size(tags.len()),
        seeds = [b"memory", owner.key().as_ref(), memory_id.as_ref()],
        bump
    )]
    pub memory_record: Account<'info, MemoryRecord>,
    
    #[account(
        mut,
        seeds = [b"agent", agent_authority.agent_id.as_ref()],
        bump = agent_authority.bump
    )]
    pub agent_authority: Account<'info, AgentAuthority>,
    
    /// CHECK: Owner can be any account
    pub owner: UncheckedAccount<'info>,
    
    #[account(mut)]
    pub payer: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(claim_index: u32)]
pub struct AddClaim<'info> {
    #[account(
        mut,
        seeds = [b"memory", memory_record.owner.as_ref(), memory_record.memory_id.as_ref()],
        bump = memory_record.bump
    )]
    pub memory_record: Account<'info, MemoryRecord>,
    
    #[account(
        init,
        payer = payer,
        space = ClaimAccount::SIZE,
        seeds = [b"claim", memory_record.memory_id.as_ref(), &claim_index.to_le_bytes()],
        bump
    )]
    pub claim_account: Account<'info, ClaimAccount>,
    
    #[account(
        seeds = [b"agent", agent_authority.agent_id.as_ref()],
        bump = agent_authority.bump
    )]
    pub agent_authority: Account<'info, AgentAuthority>,
    
    #[account(mut)]
    pub payer: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct PromoteMemory<'info> {
    #[account(
        mut,
        seeds = [b"memory", memory_record.owner.as_ref(), memory_record.memory_id.as_ref()],
        bump = memory_record.bump
    )]
    pub memory_record: Account<'info, MemoryRecord>,
    
    #[account(
        seeds = [b"agent", agent_authority.agent_id.as_ref()],
        bump = agent_authority.bump,
        constraint = agent_authority.pubkey == promoter.key()
    )]
    pub agent_authority: Account<'info, AgentAuthority>,
    
    pub promoter: Signer<'info>,
}

#[derive(Accounts)]
pub struct RetractClaim<'info> {
    #[account(
        mut,
        seeds = [b"claim", claim_account.memory_id.as_ref(), &claim_account.claim_index.to_le_bytes()],
        bump = claim_account.bump
    )]
    pub claim_account: Account<'info, ClaimAccount>,
    
    #[account(
        seeds = [b"agent", agent_authority.agent_id.as_ref()],
        bump = agent_authority.bump,
        constraint = agent_authority.pubkey == retractor.key()
    )]
    pub agent_authority: Account<'info, AgentAuthority>,
    
    pub retractor: Signer<'info>,
}

#[derive(Accounts)]
pub struct SupersedeClaim<'info> {
    pub memory_record: Account<'info, MemoryRecord>,
    
    #[account(mut)]
    pub old_claim: Account<'info, ClaimAccount>,
    
    #[account(
        init,
        payer = payer,
        space = ClaimAccount::SIZE,
        seeds = [b"claim", memory_record.memory_id.as_ref(), &(old_claim.claim_index + 1000).to_le_bytes()],
        bump
    )]
    pub new_claim: Account<'info, ClaimAccount>,
    
    #[account(mut)]
    pub payer: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AttestMerkleRoot<'info> {
    #[account(
        mut,
        seeds = [b"registry"],
        bump = registry.bump
    )]
    pub registry: Account<'info, MemoryRegistry>,
    
    #[account(
        init,
        payer = attester,
        space = MerkleAttestation::SIZE,
        seeds = [b"attestation", registry.memory_count.to_le_bytes().as_ref()],
        bump
    )]
    pub attestation: Account<'info, MerkleAttestation>,
    
    #[account(mut)]
    pub attester: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateTrustScore<'info> {
    #[account(
        seeds = [b"registry"],
        bump = registry.bump
    )]
    pub registry: Account<'info, MemoryRegistry>,
    
    #[account(
        mut,
        seeds = [b"agent", agent_authority.agent_id.as_ref()],
        bump = agent_authority.bump
    )]
    pub agent_authority: Account<'info, AgentAuthority>,
    
    pub caller: Signer<'info>,
}

#[derive(Accounts)]
pub struct VerifyMemoryForSession<'info> {
    pub memory_record: Account<'info, MemoryRecord>,
    pub verifier: Signer<'info>,
}

// ================================================================================
// EVENTS
// ================================================================================

#[event]
pub struct RegistryInitialized {
    pub registry: Pubkey,
    pub admin: Pubkey,
    pub schema_version: u8,
}

#[event]
pub struct AgentRegistered {
    pub agent_id: [u8; 16],
    pub pubkey: Pubkey,
    pub role: AgentRole,
}

#[event]
pub struct MemoryCreated {
    pub memory_id: [u8; 16],
    pub owner: Pubkey,
    pub agent: Pubkey,
    pub memory_type: MemoryType,
    pub subject: [u8; 32],
}

#[event]
pub struct ClaimAdded {
    pub memory_id: [u8; 16],
    pub claim_index: u32,
    pub predicate: [u8; 32],
    pub confidence: u16,
}

#[event]
pub struct MemoryPromoted {
    pub memory_id: [u8; 16],
    pub promoted_by: Pubkey,
    pub new_type: MemoryType,
}

#[event]
pub struct ClaimRetracted {
    pub memory_id: [u8; 16],
    pub claim_index: u32,
    pub retracted_by: Pubkey,
    pub reason_hash: [u8; 32],
}

#[event]
pub struct ClaimSuperseded {
    pub memory_id: [u8; 16],
    pub old_claim_index: u32,
    pub new_claim_index: u32,
}

#[event]
pub struct MerkleRootAttested {
    pub merkle_root: [u8; 32],
    pub timestamp: i64,
    pub attester: Pubkey,
    pub leaf_count: u32,
    pub epoch: u64,
}

#[event]
pub struct TrustScoreUpdated {
    pub agent_id: [u8; 16],
    pub new_score: u64,
}

#[event]
pub struct MemoryVerified {
    pub memory_id: [u8; 16],
    pub verified: bool,
    pub verifier: Pubkey,
}

// ================================================================================
// ERRORS
// ================================================================================

#[error_code]
pub enum MemoryError {
    #[msg("Only episodic memories can be written directly")]
    OnlyEpisodicAllowed,
    
    #[msg("Too many tags (max 10)")]
    TooManyTags,
    
    #[msg("Confidence must be 0-10000 basis points")]
    InvalidConfidence,
    
    #[msg("Insufficient permissions for this operation")]
    InsufficientPermissions,
    
    #[msg("Memory is already promoted to semantic")]
    AlreadyPromoted,
    
    #[msg("Claim is already retracted")]
    AlreadyRetracted,
    
    #[msg("Empty Merkle input")]
    EmptyMerkleInput,
    
    #[msg("Too many Merkle leaves (max 256)")]
    TooManyMerkleLeaves,
    
    #[msg("Unauthorized caller")]
    UnauthorizedCaller,
    
    #[msg("Memory has expired")]
    MemoryExpired,
}

// ================================================================================
// CONSTANTS
// ================================================================================

pub const MAX_TAGS: usize = 10;
pub const MAX_MERKLE_LEAVES: usize = 256;

// ================================================================================
// HELPERS
// ================================================================================

/// Compute Merkle root from a list of hashes
fn compute_merkle_root(hashes: &[[u8; 32]]) -> [u8; 32] {
    if hashes.is_empty() {
        return [0u8; 32];
    }
    if hashes.len() == 1 {
        return hashes[0];
    }

    let mut current_level: Vec<[u8; 32]> = hashes.to_vec();

    while current_level.len() > 1 {
        let mut next_level = Vec::new();
        
        for chunk in current_level.chunks(2) {
            let combined = if chunk.len() == 2 {
                let mut data = Vec::with_capacity(64);
                data.extend_from_slice(&chunk[0]);
                data.extend_from_slice(&chunk[1]);
                hash(&data).to_bytes()
            } else {
                // Odd number of elements, carry forward
                chunk[0]
            };
            next_level.push(combined);
        }
        
        current_level = next_level;
    }

    current_level[0]
}
