# Tatum MCP — architecture (v1.2)

## Overview

The server exposes **6 fixed MCP tools** covering all Tatum REST APIs via OpenAPI discovery plus RPC gateway access. No hand-coded data tools; no MCP env configuration for platform API packs.

## Tools

| Tool | Purpose |
|------|---------|
| `tatum_search_operations` | Search REST APIs by keyword; auto-loads relevant OpenAPI specs |
| `tatum_invoke_operation` | Call any indexed operation by `operationId` |
| `tatum_openapi_status` | Live vs cached mode, bundle age, loaded specs |
| `tatum_refresh_openapi_cache` | Refresh index from docs.tatum.io (background or wait) |
| `gateway_discover` | List chains or RPC methods for a chain |
| `gateway_execute_rpc` | Execute JSON-RPC or REST on a gateway |

## OpenAPI loading

1. **Startup (fast):** Load `generated/openapi-operations.json` (core + platform specs).
2. **Background:** Refresh bundle from network without blocking MCP connect.
3. **On search:** Query router fetches up to 2 relevant specs into memory (24h TTL).
4. **Offline:** Same tools; search uses bundled/cached index only.

Platform packs (`notifications`, `smart-contracts`, `virtual-accounts`, `security`, `storage`) are included by default in the bundle and router — no `TATUM_MCP_PLATFORM_PACKS` required.

Optional override: `TATUM_MCP_PLATFORM_PACKS=extra-spec.json` adds specs at refresh time.

## Example flows

**Notification subscription**

```
tatum_search_operations({ query: "subscription webhook" })
tatum_invoke_operation({ operationId: "...", body: { ... } })
```

**Wallet portfolio**

```
tatum_search_operations({ query: "wallet portfolio" })
tatum_invoke_operation({ operationId: "...", ... })
```

**ETH balance via RPC**

```
gateway_discover({ chain: "ethereum-mainnet" })
gateway_execute_rpc({ chain: "ethereum-mainnet", method: "eth_getBalance", params: [...] })
```

## Regenerate offline bundle

```bash
npm run generate:openapi-index
```

## Version history

| Version | Behavior |
|---------|----------|
| v1.0.x | 13 fixed tools (10 data + 3 gateway) |
| v1.1.x | 17 tools (13 legacy + 4 OpenAPI meta-tools) |
| v1.2.0 | 6 tools; OpenAPI-first; legacy data tools removed |
