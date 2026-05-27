# Dynamic tool discovery — implementation phases

This document describes what each phase changed and how it compares to the original **13-tool** MCP.

## Before (v1.0.x)

- **13 fixed tools**: 3 gateway + 10 data (hand-coded in `data.ts`)
- Static `tools/list` for the whole session
- No OpenAPI integration
- Most Tatum REST APIs unreachable via MCP

---

## Phase 1 — Foundation (registry + dynamic discovery protocol)

### Code changes

| Area | Change |
|------|--------|
| `src/registry/tool-registry.ts` | Central registry; all tools register here |
| `src/index.ts` | Uses `McpServer` with `tools.listChanged: true` |
| `src/services/legacy-tools.ts` | Existing 13 tools moved into registry (same names & behavior) |
| `@modelcontextprotocol/sdk` | Upgraded to v1.x for `sendToolListChanged()` |

### What you get

- Same **13 tools** as before (backward compatible)
- Server advertises **dynamic tool list** support to MCP clients
- Infrastructure ready to add tools at runtime without rewriting handlers

### Before vs after example

**User:** “List chains and get ETH balance via RPC.”

| Before | After (Phase 1) |
|--------|-----------------|
| `gateway_get_supported_chains`, `gateway_execute_rpc` | **Same tools, same flow** |
| 13 tools only | Still 13 tools — no new API coverage yet |

---

## Phase 2 — OpenAPI catalog + meta-tools (Tier 1 core)

### Code changes

| Area | Change |
|------|--------|
| `config/openapi-allowlist.json` | Curated spec allowlist (tiers) |
| `src/openapi/*` | Parser, loader, operation index, invoke |
| `generated/openapi-operations.json` | Bundled index (~488 ops from 4 core specs) |
| **New tools** | `tatum_list_api_catalog`, `tatum_search_operations`, `tatum_invoke_operation` |

**Tier 1 specs loaded:**

- `blockchain-data-1.json` (106 ops)
- `blockchain-1.json` (358 ops)
- `gateway-management-service.json` (17 ops)
- `utils-1.json` (7 ops)

### What you get

- **17 MCP tools** visible to the client (13 legacy + 4 meta)
- **488 REST operations** searchable and invokable via meta-tools (not 488 separate MCP tool names)
- Covers wallets, subscriptions path search, gateway CRUD, rates, DeFi data, etc.

### Before vs after example

**User:** “Create a notification subscription when USDC arrives on my Polygon wallet.”

| Before (13 tools) | After (Phase 2) |
|-------------------|-----------------|
| No subscription tool → model guesses or gives up | 1. `tatum_search_operations({ query: "subscription" })` |
| | 2. Finds `POST /v4/subscription` |
| | 3. `tatum_invoke_operation({ operationId: "...", body: { ... } })` |
| | 4. Subscription created via API |

**User:** “Get wallet portfolio” (already supported)

| Before | After |
|--------|-------|
| `get_wallet_portfolio` | Still works — **or** invoke via OpenAPI index |

---

## Phase 3 — Optional platform packs (env)

### Code changes

| Area | Change |
|------|--------|
| Env `TATUM_MCP_PLATFORM_PACKS` | Comma-separated spec files to load at startup |
| Loader | Loads platform tier specs into same index |

**Example:**

```bash
export TATUM_MCP_PLATFORM_PACKS=notifications-1.json,smart-contracts-1.json
```

Adds ~91 more indexed operations (subscriptions, NFT mint, etc.) without new MCP tool names.

### Before vs after example

**User:** “Mint an NFT on Ethereum.”

| Before | After (Phase 3 + env) |
|--------|------------------------|
| Not possible via MCP | `tatum_search_operations("nft mint")` → `tatum_invoke_operation` on `/v3/nft/mint` |

---

## Phase 4 — Per-chain REST packs (runtime)

### Code changes

| Area | Change |
|------|--------|
| **New tool** | `gateway_enable_chain_api` |
| On call | Loads Tron/Stellar/TON/etc. OpenAPI pack into index |
| Side effect | `tools/list_changed` notification to client |

### Before vs after example

**User:** “Use Tron HTTP API to get account info.”

| Before | After (Phase 4) |
|--------|-----------------|
| `gateway_execute_rpc` with guessed REST path | 1. `gateway_enable_chain_api({ chain: "tron-mainnet" })` |
| | 2. `tatum_search_operations("account")` within Tron spec |
| | 3. `tatum_invoke_operation` with `chain: "tron-mainnet"` |

---

## Tool count summary

| Stage | MCP tools (client sees) | API operations reachable |
|-------|-------------------------|---------------------------|
| Original | 13 | ~13 endpoints |
| Phase 1 | 13 | ~13 |
| Phase 2 | 17 | ~488 (via search + invoke) |
| Phase 3 | 17 | ~488 + platform packs |
| Phase 4 | 17 | + chain REST packs on demand |

---

## Regenerating the bundled index

```bash
npm run generate:openapi-index
```

Commit `generated/openapi-operations.json` for faster cold starts (optional fallback: fetch from docs.tatum.io at runtime).
