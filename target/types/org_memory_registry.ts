/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/org_memory_registry.json`.
 */
export type OrgMemoryRegistry = {
  "address": "EduJX2mC335nh3uQ6TarYT5GaMumA2RBethG4CEuyh62",
  "metadata": {
    "name": "orgMemoryRegistry",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Origin OS Memory Registry - Unified memory substrate for AI agents on Solana",
    "repository": "https://github.com/cwalinapj/org-memory-registry"
  },
  "docs": [
    "Origin OS Memory Registry",
    "",
    "Unified memory substrate for AI agents on Solana.",
    "Implements three-layer memory architecture:",
    "- Working Memory (session-scoped, off-chain)",
    "- Episodic Memory (events, append-only)",
    "- Semantic Memory (facts, validated/promoted)",
    "",
    "Integrates with Origin OS Protocol:",
    "- session_escrow for CDN attestation",
    "- staking_rewards for agent trust scores",
    "- lead_marketplace for locality proofs"
  ],
  "instructions": [
    {
      "name": "addClaim",
      "docs": [
        "Add a claim to an existing memory"
      ],
      "discriminator": [
        70,
        114,
        85,
        106,
        66,
        244,
        46,
        99
      ],
      "accounts": [
        {
          "name": "memoryRecord",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  101,
                  109,
                  111,
                  114,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "memory_record.owner",
                "account": "memoryRecord"
              },
              {
                "kind": "account",
                "path": "memory_record.memory_id",
                "account": "memoryRecord"
              }
            ]
          }
        },
        {
          "name": "claimAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  108,
                  97,
                  105,
                  109
                ]
              },
              {
                "kind": "account",
                "path": "memory_record.memory_id",
                "account": "memoryRecord"
              },
              {
                "kind": "arg",
                "path": "claimIndex"
              }
            ]
          }
        },
        {
          "name": "agentAuthority",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  103,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "agent_authority.agent_id",
                "account": "agentAuthority"
              }
            ]
          }
        },
        {
          "name": "claimant",
          "signer": true
        },
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "claimIndex",
          "type": "u32"
        },
        {
          "name": "predicate",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "object",
          "type": {
            "array": [
              "u8",
              64
            ]
          }
        },
        {
          "name": "confidence",
          "type": "u16"
        },
        {
          "name": "evidenceHash",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        }
      ]
    },
    {
      "name": "attestMerkleRoot",
      "docs": [
        "Attest a batch of memory hashes with Merkle root"
      ],
      "discriminator": [
        16,
        228,
        43,
        207,
        158,
        69,
        210,
        197
      ],
      "accounts": [
        {
          "name": "registry",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  103,
                  105,
                  115,
                  116,
                  114,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "attestation",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  116,
                  116,
                  101,
                  115,
                  116,
                  97,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "registry.memory_count",
                "account": "memoryRegistry"
              }
            ]
          }
        },
        {
          "name": "attester",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "memoryHashes",
          "type": {
            "vec": {
              "array": [
                "u8",
                32
              ]
            }
          }
        }
      ]
    },
    {
      "name": "initializeRegistry",
      "docs": [
        "Initialize the memory registry with admin authority"
      ],
      "discriminator": [
        189,
        181,
        20,
        17,
        174,
        57,
        249,
        59
      ],
      "accounts": [
        {
          "name": "registry",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  103,
                  105,
                  115,
                  116,
                  114,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "admin",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "config",
          "type": {
            "defined": {
              "name": "registryConfig"
            }
          }
        }
      ]
    },
    {
      "name": "promoteMemory",
      "docs": [
        "Promote episodic memory to semantic (requires trusted publisher role)"
      ],
      "discriminator": [
        92,
        183,
        106,
        53,
        20,
        75,
        40,
        2
      ],
      "accounts": [
        {
          "name": "memoryRecord",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  101,
                  109,
                  111,
                  114,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "memory_record.owner",
                "account": "memoryRecord"
              },
              {
                "kind": "account",
                "path": "memory_record.memory_id",
                "account": "memoryRecord"
              }
            ]
          }
        },
        {
          "name": "agentAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  103,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "agent_authority.agent_id",
                "account": "agentAuthority"
              }
            ]
          }
        },
        {
          "name": "promoter",
          "signer": true
        }
      ],
      "args": []
    },
    {
      "name": "registerAgent",
      "docs": [
        "Register an agent with signing authority"
      ],
      "discriminator": [
        135,
        157,
        66,
        195,
        2,
        113,
        175,
        30
      ],
      "accounts": [
        {
          "name": "registry",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  103,
                  105,
                  115,
                  116,
                  114,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "agentAuthority",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  103,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "agentId"
              }
            ]
          }
        },
        {
          "name": "agentSigner",
          "signer": true
        },
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "agentId",
          "type": {
            "array": [
              "u8",
              16
            ]
          }
        },
        {
          "name": "role",
          "type": {
            "defined": {
              "name": "agentRole"
            }
          }
        },
        {
          "name": "agentRepoUrl",
          "type": "string"
        },
        {
          "name": "registryReferenceUrl",
          "type": "string"
        }
      ]
    },
    {
      "name": "retractClaim",
      "docs": [
        "Retract a claim (marks as invalid with reason)"
      ],
      "discriminator": [
        211,
        132,
        89,
        144,
        210,
        79,
        139,
        68
      ],
      "accounts": [
        {
          "name": "claimAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  108,
                  97,
                  105,
                  109
                ]
              },
              {
                "kind": "account",
                "path": "claim_account.memory_id",
                "account": "claimAccount"
              },
              {
                "kind": "account",
                "path": "claim_account.claim_index",
                "account": "claimAccount"
              }
            ]
          }
        },
        {
          "name": "agentAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  103,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "agent_authority.agent_id",
                "account": "agentAuthority"
              }
            ]
          }
        },
        {
          "name": "retractor",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "reasonHash",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        }
      ]
    },
    {
      "name": "supersedeClaim",
      "docs": [
        "Supersede a claim with a new value"
      ],
      "discriminator": [
        96,
        21,
        55,
        159,
        63,
        180,
        252,
        154
      ],
      "accounts": [
        {
          "name": "memoryRecord",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  101,
                  109,
                  111,
                  114,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "memory_record.owner",
                "account": "memoryRecord"
              },
              {
                "kind": "account",
                "path": "memory_record.memory_id",
                "account": "memoryRecord"
              }
            ]
          }
        },
        {
          "name": "oldClaim",
          "writable": true
        },
        {
          "name": "agentAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  103,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "agent_authority.agent_id",
                "account": "agentAuthority"
              }
            ]
          }
        },
        {
          "name": "newClaim",
          "writable": true
        },
        {
          "name": "superseder",
          "signer": true
        },
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "newObject",
          "type": {
            "array": [
              "u8",
              64
            ]
          }
        },
        {
          "name": "newConfidence",
          "type": "u16"
        },
        {
          "name": "newEvidenceHash",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        }
      ]
    },
    {
      "name": "updateTrustScore",
      "docs": [
        "Update agent trust score (called by staking_rewards via CPI)"
      ],
      "discriminator": [
        100,
        231,
        130,
        250,
        180,
        196,
        20,
        248
      ],
      "accounts": [
        {
          "name": "registry",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  103,
                  105,
                  115,
                  116,
                  114,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "agentAuthority",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  103,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "agent_authority.agent_id",
                "account": "agentAuthority"
              }
            ]
          }
        },
        {
          "name": "caller",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "newScore",
          "type": "u64"
        }
      ]
    },
    {
      "name": "verifyMemoryForSession",
      "docs": [
        "Verify memory for session escrow (CPI callable)"
      ],
      "discriminator": [
        252,
        0,
        30,
        137,
        163,
        240,
        249,
        26
      ],
      "accounts": [
        {
          "name": "memoryRecord"
        },
        {
          "name": "verifier",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "expectedHash",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        }
      ],
      "returns": "bool"
    },
    {
      "name": "writeMemory",
      "docs": [
        "Write episodic memory (any registered agent can write)"
      ],
      "discriminator": [
        230,
        48,
        240,
        225,
        213,
        184,
        250,
        80
      ],
      "accounts": [
        {
          "name": "registry",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  103,
                  105,
                  115,
                  116,
                  114,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "memoryRecord",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  101,
                  109,
                  111,
                  114,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              },
              {
                "kind": "arg",
                "path": "memoryId"
              }
            ]
          }
        },
        {
          "name": "agentAuthority",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  103,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "agent_authority.agent_id",
                "account": "agentAuthority"
              }
            ]
          }
        },
        {
          "name": "agentSigner",
          "signer": true
        },
        {
          "name": "owner"
        },
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "memoryId",
          "type": {
            "array": [
              "u8",
              16
            ]
          }
        },
        {
          "name": "memoryType",
          "type": {
            "defined": {
              "name": "memoryType"
            }
          }
        },
        {
          "name": "subject",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "privacy",
          "type": {
            "defined": {
              "name": "privacyLevel"
            }
          }
        },
        {
          "name": "ttl",
          "type": {
            "option": "i64"
          }
        },
        {
          "name": "tags",
          "type": {
            "vec": {
              "array": [
                "u8",
                32
              ]
            }
          }
        },
        {
          "name": "linksHash",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "agentAuthority",
      "discriminator": [
        161,
        225,
        83,
        39,
        179,
        98,
        31,
        118
      ]
    },
    {
      "name": "claimAccount",
      "discriminator": [
        113,
        109,
        47,
        96,
        242,
        219,
        61,
        165
      ]
    },
    {
      "name": "memoryRecord",
      "discriminator": [
        162,
        57,
        172,
        127,
        32,
        241,
        38,
        199
      ]
    },
    {
      "name": "memoryRegistry",
      "discriminator": [
        82,
        243,
        174,
        217,
        206,
        237,
        140,
        155
      ]
    },
    {
      "name": "merkleAttestation",
      "discriminator": [
        40,
        182,
        76,
        16,
        22,
        52,
        90,
        110
      ]
    }
  ],
  "events": [
    {
      "name": "agentRegistered",
      "discriminator": [
        191,
        78,
        217,
        54,
        232,
        100,
        189,
        85
      ]
    },
    {
      "name": "claimAdded",
      "discriminator": [
        147,
        187,
        131,
        7,
        56,
        200,
        233,
        46
      ]
    },
    {
      "name": "claimRetracted",
      "discriminator": [
        215,
        79,
        183,
        228,
        157,
        42,
        140,
        172
      ]
    },
    {
      "name": "claimSuperseded",
      "discriminator": [
        188,
        118,
        161,
        230,
        158,
        5,
        78,
        252
      ]
    },
    {
      "name": "memoryCreated",
      "discriminator": [
        171,
        19,
        154,
        208,
        129,
        72,
        147,
        37
      ]
    },
    {
      "name": "memoryPromoted",
      "discriminator": [
        204,
        115,
        229,
        124,
        73,
        249,
        225,
        43
      ]
    },
    {
      "name": "memoryVerified",
      "discriminator": [
        0,
        0,
        161,
        42,
        188,
        33,
        51,
        166
      ]
    },
    {
      "name": "merkleRootAttested",
      "discriminator": [
        102,
        241,
        136,
        192,
        225,
        239,
        233,
        85
      ]
    },
    {
      "name": "registryInitialized",
      "discriminator": [
        144,
        138,
        62,
        105,
        58,
        38,
        100,
        177
      ]
    },
    {
      "name": "trustScoreUpdated",
      "discriminator": [
        105,
        104,
        218,
        9,
        165,
        191,
        162,
        198
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "onlyEpisodicAllowed",
      "msg": "Only episodic memories can be written directly"
    },
    {
      "code": 6001,
      "name": "tooManyTags",
      "msg": "Too many tags (max 10)"
    },
    {
      "code": 6002,
      "name": "invalidConfidence",
      "msg": "Confidence must be 0-10000 basis points"
    },
    {
      "code": 6003,
      "name": "invalidTtl",
      "msg": "TTL must be a positive number of seconds"
    },
    {
      "code": 6004,
      "name": "insufficientPermissions",
      "msg": "Insufficient permissions for this operation"
    },
    {
      "code": 6005,
      "name": "alreadyPromoted",
      "msg": "Memory is already promoted to semantic"
    },
    {
      "code": 6006,
      "name": "alreadyRetracted",
      "msg": "Claim is already retracted"
    },
    {
      "code": 6007,
      "name": "alreadySuperseded",
      "msg": "Claim has already been superseded"
    },
    {
      "code": 6008,
      "name": "emptyMerkleInput",
      "msg": "Empty Merkle input"
    },
    {
      "code": 6009,
      "name": "tooManyMerkleLeaves",
      "msg": "Too many Merkle leaves (max 256)"
    },
    {
      "code": 6010,
      "name": "unauthorizedCaller",
      "msg": "Unauthorized caller"
    },
    {
      "code": 6011,
      "name": "counterOverflow",
      "msg": "Counter overflow"
    },
    {
      "code": 6012,
      "name": "memoryExpired",
      "msg": "Memory has expired"
    },
    {
      "code": 6013,
      "name": "maxClaimsExceeded",
      "msg": "Maximum claims reached for memory"
    },
    {
      "code": 6014,
      "name": "invalidAgentRepoUrl",
      "msg": "Agent repository URL is invalid"
    },
    {
      "code": 6015,
      "name": "repoUrlTooLong",
      "msg": "Agent repository URL exceeds max length"
    },
    {
      "code": 6016,
      "name": "missingRegistryRepoLink",
      "msg": "Missing required registry repository link"
    }
  ],
  "types": [
    {
      "name": "agentAuthority",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "agentId",
            "type": {
              "array": [
                "u8",
                16
              ]
            }
          },
          {
            "name": "pubkey",
            "type": "pubkey"
          },
          {
            "name": "role",
            "type": {
              "defined": {
                "name": "agentRole"
              }
            }
          },
          {
            "name": "trustScore",
            "type": "u64"
          },
          {
            "name": "memoryCount",
            "type": "u64"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "lastActive",
            "type": "i64"
          },
          {
            "name": "repoUrl",
            "type": "string"
          },
          {
            "name": "registryReferenceUrl",
            "type": "string"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "agentRegistered",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "agentId",
            "type": {
              "array": [
                "u8",
                16
              ]
            }
          },
          {
            "name": "pubkey",
            "type": "pubkey"
          },
          {
            "name": "role",
            "type": {
              "defined": {
                "name": "agentRole"
              }
            }
          },
          {
            "name": "repoUrl",
            "type": "string"
          },
          {
            "name": "registryReferenceUrl",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "agentRole",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "observer"
          },
          {
            "name": "writer"
          },
          {
            "name": "trustedPublisher"
          },
          {
            "name": "admin"
          }
        ]
      }
    },
    {
      "name": "claimAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "memoryId",
            "type": {
              "array": [
                "u8",
                16
              ]
            }
          },
          {
            "name": "claimIndex",
            "type": "u32"
          },
          {
            "name": "predicate",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "object",
            "type": {
              "array": [
                "u8",
                64
              ]
            }
          },
          {
            "name": "confidence",
            "type": "u16"
          },
          {
            "name": "evidenceHash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "isRetracted",
            "type": "bool"
          },
          {
            "name": "supersededBy",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "claimAdded",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "memoryId",
            "type": {
              "array": [
                "u8",
                16
              ]
            }
          },
          {
            "name": "claimIndex",
            "type": "u32"
          },
          {
            "name": "predicate",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "confidence",
            "type": "u16"
          }
        ]
      }
    },
    {
      "name": "claimRetracted",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "memoryId",
            "type": {
              "array": [
                "u8",
                16
              ]
            }
          },
          {
            "name": "claimIndex",
            "type": "u32"
          },
          {
            "name": "retractedBy",
            "type": "pubkey"
          },
          {
            "name": "reasonHash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          }
        ]
      }
    },
    {
      "name": "claimSuperseded",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "memoryId",
            "type": {
              "array": [
                "u8",
                16
              ]
            }
          },
          {
            "name": "oldClaimIndex",
            "type": "u32"
          },
          {
            "name": "newClaimIndex",
            "type": "u32"
          }
        ]
      }
    },
    {
      "name": "memoryCreated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "memoryId",
            "type": {
              "array": [
                "u8",
                16
              ]
            }
          },
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "agent",
            "type": "pubkey"
          },
          {
            "name": "memoryType",
            "type": {
              "defined": {
                "name": "memoryType"
              }
            }
          },
          {
            "name": "subject",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          }
        ]
      }
    },
    {
      "name": "memoryPromoted",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "memoryId",
            "type": {
              "array": [
                "u8",
                16
              ]
            }
          },
          {
            "name": "promotedBy",
            "type": "pubkey"
          },
          {
            "name": "newType",
            "type": {
              "defined": {
                "name": "memoryType"
              }
            }
          }
        ]
      }
    },
    {
      "name": "memoryRecord",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "memoryId",
            "type": {
              "array": [
                "u8",
                16
              ]
            }
          },
          {
            "name": "schemaVersion",
            "type": "u8"
          },
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "agent",
            "type": "pubkey"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "observedAt",
            "type": "i64"
          },
          {
            "name": "memoryType",
            "type": {
              "defined": {
                "name": "memoryType"
              }
            }
          },
          {
            "name": "subject",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "claimsCount",
            "type": "u16"
          },
          {
            "name": "maxClaims",
            "type": "u16"
          },
          {
            "name": "privacy",
            "type": {
              "defined": {
                "name": "privacyLevel"
              }
            }
          },
          {
            "name": "ttl",
            "type": {
              "option": "i64"
            }
          },
          {
            "name": "tags",
            "type": {
              "vec": {
                "array": [
                  "u8",
                  32
                ]
              }
            }
          },
          {
            "name": "linksHash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "integrityHash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "isPromoted",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "memoryRegistry",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "admin",
            "type": "pubkey"
          },
          {
            "name": "schemaVersion",
            "type": "u8"
          },
          {
            "name": "memoryCount",
            "type": "u64"
          },
          {
            "name": "agentCount",
            "type": "u32"
          },
          {
            "name": "merkleRoot",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "lastAttestation",
            "type": "i64"
          },
          {
            "name": "config",
            "type": {
              "defined": {
                "name": "registryConfig"
              }
            }
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "memoryType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "episodic"
          },
          {
            "name": "semantic"
          },
          {
            "name": "fact"
          },
          {
            "name": "preference"
          },
          {
            "name": "plan"
          },
          {
            "name": "interaction"
          },
          {
            "name": "artifact"
          },
          {
            "name": "skill"
          },
          {
            "name": "rule"
          }
        ]
      }
    },
    {
      "name": "memoryVerified",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "memoryId",
            "type": {
              "array": [
                "u8",
                16
              ]
            }
          },
          {
            "name": "verified",
            "type": "bool"
          },
          {
            "name": "verifier",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "merkleAttestation",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "merkleRoot",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "timestamp",
            "type": "i64"
          },
          {
            "name": "attester",
            "type": "pubkey"
          },
          {
            "name": "leafCount",
            "type": "u32"
          },
          {
            "name": "epoch",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "merkleRootAttested",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "merkleRoot",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "timestamp",
            "type": "i64"
          },
          {
            "name": "attester",
            "type": "pubkey"
          },
          {
            "name": "leafCount",
            "type": "u32"
          },
          {
            "name": "epoch",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "privacyLevel",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "private"
          },
          {
            "name": "team"
          },
          {
            "name": "public"
          }
        ]
      }
    },
    {
      "name": "registryConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "sessionEscrowProgram",
            "type": "pubkey"
          },
          {
            "name": "stakingProgram",
            "type": "pubkey"
          },
          {
            "name": "leadMarketplaceProgram",
            "type": "pubkey"
          },
          {
            "name": "maxClaimsPerMemory",
            "type": "u16"
          },
          {
            "name": "defaultTtl",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "registryInitialized",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "registry",
            "type": "pubkey"
          },
          {
            "name": "admin",
            "type": "pubkey"
          },
          {
            "name": "schemaVersion",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "trustScoreUpdated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "agentId",
            "type": {
              "array": [
                "u8",
                16
              ]
            }
          },
          {
            "name": "newScore",
            "type": "u64"
          }
        ]
      }
    }
  ]
};
