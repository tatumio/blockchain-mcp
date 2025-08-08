# Blockchain MCP powered by Tatum

[![MCP](https://img.shields.io/badge/MCP-Model%20Context%20Protocol-blue)](https://modelcontextprotocol.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![NPM Version](https://img.shields.io/npm/v/%40tatumio%2Fblockchain-mcp)](https://www.npmjs.com/package/@tatumio/blockchain-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A Model Context Protocol (MCP) server that provides access to the Tatum Blockchain Data API and RPC Gateway, enabling any LLM to read and write blockchain data across **130+ networks**. Visit [official MCP webpage](https://tatum.io/mcp) for more details and to get your Tatum API key. 

[![Install MCP Server](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/en/install-mcp?name=tatumio&config=eyJjb21tYW5kIjoibnB4IEB0YXR1bWlvL2Jsb2NrY2hhaW4tbWNwIiwiZW52Ijp7IlRBVFVNX0FQSV9LRVkiOiJZT1VSX0FQSV9LRVkifX0%3D)

## 🚀 Features

- **130+ Blockchain Networks**: Bitcoin, Ethereum, Solana, Polygon, Arbitrum, Base, Avalanche, and many more.
- 🔗 **Blockchain Data API**: Blocks, transactions, balances, network info, and more. 
- 🌐 **RPC Gateway**: Direct access to blockchain RPC endpoints. 

## 📦 Installation

### Global Installation (Recommended)

```bash
npm install -g @tatumio/blockchain-mcp
```

### Local Installation

```bash
npm install @tatumio/blockchain-mcp
```

## 🔑 Getting Started

### 1. Get Your API Key

Get your free API key from [Tatum Dashboard](https://dashboard.tatum.io).

### 2. MCP Client Integration

Add this server to your MCP client configuration:

```json
{
  "mcpServers": {
    "tatumio": {
      "command": "npx",
      "args": [
        "@tatumio/blockchain-mcp"
      ],
      "env": {
        "TATUM_API_KEY": "YOUR_API_KEY"
      }
    }
  }
}
```

## 🛠️ Available Tools

### Blockchain Data (10 tools)

- **get_metadata** - Fetch NFT/multitoken metadata by address and IDs
- **get_wallet_balance_by_time** - Get wallet balance at specific time
- **get_wallet_portfolio** - Get comprehensive wallet portfolio
- **get_owners** - Get owners of NFT/token
- **check_owner** - Check if address owns specific token
- **get_transaction_history** - Get transaction history for address
- **get_block_by_time** - Get block information by timestamp
- **get_tokens** - Get tokens for specific wallet
- **check_malicous_address** - Check if address is malicious
- **get_exchange_rate** - Get real-time exchange rates

### RPC Gateways (4 tools)

- **gateway_get_supported_chains** - Get all supported blockchain networks
- **gateway_get_supported_methods** - Get supported RPC methods for chain
- **gateway_execute_rpc** - Execute RPC calls on any supported chain

## 🌐 Supported Networks

### EVM-Compatible (69 networks)

- **Ethereum**: Mainnet, Sepolia, Holesky
- **Layer 2**: Polygon, Arbitrum, Optimism, Base
- **Sidechains**: BSC, Avalanche, Fantom
- **Enterprise**: Celo, Palm, Gnosis
- **Gaming**: Ronin, Chiliz

### Non-EVM (61 networks)

- **Bitcoin**: Mainnet, Testnet, Signet
- **Alternative Coins**: Litecoin, Dogecoin, Bitcoin Cash
- **Smart Contract Platforms**: Solana, Cardano, Tezos
- **Enterprise**: Stellar, Ripple, EOS

## 📖 Documentation

- [Tatum API Documentation](https://docs.tatum.io)
- [Model Context Protocol](https://modelcontextprotocol.io)
- [Blockchain Networks](https://docs.tatum.io/docs/supported-blockchains)
- [API Reference](https://docs.tatum.io/reference)



## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
## 🏢 About Tatum

Tatum is a blockchain development platform that provides APIs, SDKs, and tools for building blockchain applications. Learn more at [tatum.io](https://tatum.io).

---

**Made with ❤️ by the Tatum team**
