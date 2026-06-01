# Blockchain MCP powered by Tatum

[![MCP](https://img.shields.io/badge/MCP-Model%20Context%20Protocol-blue)](https://modelcontextprotocol.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![NPM Version](https://img.shields.io/npm/v/%40tatumio%2Fblockchain-mcp)](https://www.npmjs.com/package/@tatumio/blockchain-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A [Model Context Protocol](https://modelcontextprotocol.io) (MCP) server that exposes the Tatum Blockchain Data API and RPC Gateway so LLM clients can query blockchain data across **130+ networks**. Get an API key on the [Tatum MCP page](https://tatum.io/mcp) or [dashboard](https://dashboard.tatum.io).

[![Install MCP Server](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/en/install-mcp?name=tatumio&config=eyJjb21tYW5kIjoibnB4IEB0YXR1bWlvL2Jsb2NrY2hhaW4tbWNwIiwiZW52Ijp7IlRBVFVNX0FQSV9LRVkiOiJZT1VSX0FQSV9LRVkifX0%3D)

## Features

- **130+ Blockchain Networks**: [Bitcoin](https://tatum.io/chain/bitcoin), [Ethereum](https://tatum.io/chain/ethereum), [Solana](https://tatum.io/chain/solana), [Polygon](https://tatum.io/chain/polygon), [Arbitrum](https://tatum.io/chain/arbitrum), [Base](https://tatum.io/chain/base), [Avalanche](https://tatum.io/chain/avalanche), and many more.
- 🔗 **[Blockchain Data API](https://tatum.io/blockchain-api)**: Blocks, transactions, balances, network info, and more. 
- 🌐 **[RPC Gateway](https://tatum.io/nodes)**: Direct access to blockchain RPC endpoints. 

Requires Node.js **18+** and a `TATUM_API_KEY`.

## Installation

```bash
npm install -g @tatumio/blockchain-mcp
```

Or use without a global install:

```bash
npx @tatumio/blockchain-mcp
```

Published binaries: `blockchain-mcp` and `blockchain-mcp-server` (same entrypoint).

## MCP client setup

1. Create a free API key at [dashboard.tatum.io](https://dashboard.tatum.io).
2. Add the server to your MCP client (Cursor, Claude Desktop, VS Code, etc.):

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

Do not commit API keys. Use environment variables in client config only.

### Example prompts

Once connected, you can ask your assistant to use MCP tools, for example:

- “What is the BTC/USD exchange rate?” → `get_exchange_rate` with `symbol: BTC`, `basePair: USD`
- “Show Vitalik’s native ETH balance history” → `get_wallet_portfolio` / `get_transaction_history` on `ethereum-mainnet`
- “What is the latest Ethereum block number?” → `gateway_execute_rpc` with `eth_blockNumber`

Chain identifiers use Tatum gateway names (e.g. `ethereum-mainnet`, `bitcoin-mainnet`). Call `gateway_get_supported_chains` for the live list.

## Available tools (13)

### Blockchain Data (10)

| Tool | Description |
|------|-------------|
| `get_metadata` | NFT/multitoken metadata by contract address and token IDs |
| `get_wallet_balance_by_time` | Native wallet balance at a block or timestamp |
| `get_wallet_portfolio` | Wallet portfolio (native, fungible, NFT) |
| `get_owners` | Owners of an NFT or token contract |
| `check_owner` | Whether an address owns a given token |
| `get_transaction_history` | Transaction history for one or more addresses |
| `get_block_by_time` | Block info for a timestamp |
| `get_tokens` | Token metadata (contract address or `native`) |
| `check_malicious_address` | Security check for a wallet/contract address |
| `get_exchange_rate` | Fiat/crypto rate (e.g. `BTC` / `USD`) |

### RPC Gateway (3)

| Tool | Description |
|------|-------------|
| `gateway_get_supported_chains` | All networks available through the gateway |
| `gateway_get_supported_methods` | RPC/REST methods supported for a chain |
| `gateway_execute_rpc` | Run a JSON-RPC method or REST call on a chain |

## Supported networks

Tatum supports many EVM and non-EVM chains. Examples:

- **EVM**: Ethereum (mainnet, Sepolia, Holesky), Polygon, Arbitrum, Optimism, Base, BSC, Avalanche, Fantom, Celo, Gnosis, Ronin, and others.
- **Non-EVM**: Bitcoin, Litecoin, Dogecoin, Solana, Cardano, Tezos, Stellar, Ripple, and others.

For authoritative chain IDs and RPC coverage, use `gateway_get_supported_chains` or see [Supported blockchains](https://docs.tatum.io/docs/supported-blockchains).

## Development

```bash
git clone https://github.com/tatumio/blockchain-mcp.git
cd blockchain-mcp
npm install
cp .env.example .env   # add your TATUM_API_KEY
npm run build
```

Run the MCP server locally:

```bash
export TATUM_API_KEY=your-key
npm start
# or via CLI wrapper:
npx blockchain-mcp --api-key your-key
```

Point a local MCP client at the built CLI:

```json
{
  "mcpServers": {
    "tatumio-local": {
      "command": "node",
      "args": ["/absolute/path/to/blockchain-mcp/dist/cli.js"],
      "env": { "TATUM_API_KEY": "YOUR_API_KEY" }
    }
  }
}
```

Smoke-test live APIs (requires `TATUM_API_KEY`):

```bash
npm run verify:tools
```

## Documentation

- [Tatum API documentation](https://docs.tatum.io)
- [API reference](https://docs.tatum.io/reference)
- [Model Context Protocol](https://modelcontextprotocol.io)
- [Repository](https://github.com/tatumio/blockchain-mcp)

## License

MIT — see [LICENSE](LICENSE).

## About Tatum

[Tatum](https://tatum.io) provides blockchain APIs, SDKs, and infrastructure for developers.
