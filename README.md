# Blockchain MCP powered by Tatum

[![MCP](https://img.shields.io/badge/MCP-Model%20Context%20Protocol-blue)](https://modelcontextprotocol.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![NPM Version](https://img.shields.io/npm/v/%40tatumio%2Fblockchain-mcp)](https://www.npmjs.com/package/@tatumio/blockchain-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A Model Context Protocol (MCP) server that provides access to the Tatum REST APIs and RPC Gateway, enabling any LLM to read and write blockchain data across **130+ networks**. Visit [official MCP webpage](https://tatum.io/mcp) for more details and to get your Tatum API key.

[![Install MCP Server](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/en/install-mcp?name=tatumio&config=eyJjb21tYW5kIjoibnB4IEB0YXR1bWlvL2Jsb2NrY2hhaW4tbWNwIiwiZW52Ijp7IlRBVFVNX0FQSV9LRVkiOiJZT1VSX0FQSV9LRVkifX0%3D)

## Features

- **130+ Blockchain Networks**: Bitcoin, Ethereum, Solana, Polygon, Arbitrum, Base, Avalanche, and many more.
- **OpenAPI discovery**: Search and invoke **697+** REST operations (data, notifications, NFT, virtual accounts, KMS, storage, gateway management).
- **RPC Gateway**: Direct JSON-RPC and REST access via `gateway_discover` and `gateway_execute_rpc`.
- **Offline-friendly**: Bundled OpenAPI index; background refresh when online.

## Installation

```bash
npm install -g @tatumio/blockchain-mcp
```

## Getting started

### 1. Get your API key

Get your free API key from [Tatum Dashboard](https://dashboard.tatum.io).

### 2. MCP client configuration

Only `TATUM_API_KEY` is required — no platform pack env vars:

```json
{
  "mcpServers": {
    "tatumio": {
      "command": "npx",
      "args": ["@tatumio/blockchain-mcp"],
      "env": {
        "TATUM_API_KEY": "YOUR_API_KEY"
      }
    }
  }
}
```

## MCP tools (v1.2)

| Tool | Purpose |
|------|---------|
| `tatum_search_operations` | Find REST APIs by keyword (auto-loads notifications, NFT, portfolio, Tron, etc.) |
| `tatum_invoke_operation` | Execute an operation by `operationId` from search |
| `tatum_openapi_status` | Index mode (live/cached), bundle age, loaded specs |
| `tatum_refresh_openapi_cache` | Refresh OpenAPI from docs.tatum.io (background by default) |
| `gateway_discover` | List all chains, or methods for one chain |
| `gateway_execute_rpc` | Run JSON-RPC or REST on a gateway |

### Example: notification subscription

1. `tatum_search_operations({ query: "subscription incoming transaction" })`
2. `tatum_invoke_operation({ operationId: "...", body: { ... } })`

### Example: ETH balance via RPC

1. `gateway_discover({ chain: "ethereum-mainnet" })`
2. `gateway_execute_rpc({ chain: "ethereum-mainnet", method: "eth_getBalance", params: ["0x...", "latest"] })`

## OpenAPI index

- **Bundled offline index:** `generated/openapi-operations.json` (core + platform specs).
- **Regenerate:** `npm run generate:openapi-index`
- **Background refresh:** runs automatically after server start when network is available.

Optional: `TATUM_MCP_PLATFORM_PACKS=extra-spec.json` to add more specs at refresh time.

See [docs/PHASES.md](docs/PHASES.md) for architecture details.

## Supported networks

EVM, Bitcoin, Solana, Tron, Stellar, TON, Cardano, Kadena, and 120+ more via the RPC gateway. See [Tatum docs](https://docs.tatum.io/docs/supported-blockchains).

## Documentation

- [Tatum API Documentation](https://docs.tatum.io)
- [Model Context Protocol](https://modelcontextprotocol.io)

## License

MIT — see [LICENSE](LICENSE).

## About Tatum

[Tatum](https://tatum.io) — blockchain APIs, SDKs, and tools for building on-chain applications.
