# Tatum MCP Server

[![npm version](https://badge.fury.io/js/tatum-mcp-server.svg)](https://badge.fury.io/js/tatum-mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A Model Context Protocol (MCP) server providing access to Tatum's comprehensive blockchain API across **130+ networks** with **13 tools** including the gateways (access to rpc) & data insights api

## 🚀 Features

- **130+ Blockchain Networks**: Bitcoin, Ethereum, Polygon, Arbitrum, Base, Avalanche, and many more
- **13 Tools**: Comprehensive blockchain operations
- **2 Feature Categories**:
  - 🔗 **Blockchain Data**: Blocks, transactions, balances, network info
  - **RPC Gateways**: Direct access to blockchain RPC endpoints
- **TypeScript**: Full type safety and IntelliSense support
- **ES Modules**: Modern JavaScript module system

## 📦 Installation

### Global Installation (Recommended)

```bash
npm install -g tatum-mcp-server
```

### Local Installation

```bash
npm install tatum-mcp-server
```

## 🔑 Getting Started

### 1. Get Your API Key

Get your free API key from [Tatum Dashboard](https://dashboard.tatum.io).

### 2. MCP Client Integration

Add this server to your MCP client configuration:

#### Basic Configuration

```json
{
  "mcpServers": {
    "tatum": {
      "command": "npx",
      "args": [
        "tatum-mcp-server"
      ],
      "env": {
        "TATUM_API_KEY": "YOUR_API_KEY"
      }
    }
  }
}
```

#### With Custom RPC URLs (Bring Your Own RPC)

You can override Tatum's gateway URLs with your own RPC endpoints:

```json
{
  "mcpServers": {
    "tatum": {
      "command": "npx",
      "args": [
        "tatum-mcp-server"
      ],
      "env": {
        "TATUM_API_KEY": "YOUR_API_KEY",
        "BYO_RPC_CONFIG": "{\"ethereum-mainnet\": \"https://ethereum-rpc.publicnode.com\", \"polygon-mainnet\": \"https://polygon-rpc.com\"}"
      }
    }
  }
}
```

**Benefits of Custom RPC URLs:**
- Use your preferred RPC providers
- No authentication required for your custom endpoints
- Potentially better performance or reliability
- Support for private or enterprise RPC endpoints

## 🛠️ Available Tools

### Blockchain Data (10 tools)
- Get wallet balances and portfolios
- Query transaction history
- Retrieve block information
- Access NFT and token metadata
- Check token ownership
- Fetch Real Time Exchange Rates
- Check Malicious Address

### RPC Gateways (3 tools)
- Execute RPC calls on any supported chain
- Get supported blockchain networks
- Direct gateway URL access

## 🌐 Supported Networks

### EVM-Compatible (69 networks)
- **Ethereum**: Mainnet, Sepolia, Holesky
- **Layer 2**: Polygon, Arbitrum, Optimism, Base
- **Sidechains**: BSC, Avalanche, Fantom
- **Enterprise**: Celo, Palm, Gnosis
- **Gaming**: Ronin, Chiliz
- **And many more...**

### Non-EVM (61 networks)
- **Bitcoin**: Mainnet, Testnet, Signet
- **Alternative Coins**: Litecoin, Dogecoin, Bitcoin Cash
- **Smart Contract Platforms**: Solana, Cardano, Tezos
- **Enterprise**: Stellar, Ripple, EOS
- **And many more...**

## 🔧 Configuration

#### BYO_RPC_CONFIG Format

The `BYO_RPC_CONFIG` environment variable uses a simple comma-separated format:

```bash
export BYO_RPC_CONFIG="ethereum-mainnet,https://eth.llamarpc.com;polygon-mainnet,https://polygon.llamarpc.com"
```

For a single chain:
```bash
export BYO_RPC_CONFIG="ethereum-mainnet,https://eth.llamarpc.com"
```

**Format**: `chain1,url1;chain2,url2;chain3,url3`
- Use commas (`,`) to separate chain name from URL
- Use semicolons (`;`) to separate multiple chain configurations
- No spaces around separators (they will be trimmed automatically)

**Supported Chain Names:**
- Use the same chain identifiers as Tatum (e.g., `ethereum-mainnet`, `polygon-mainnet`, `bsc-mainnet`)
- Custom RPC URLs will override Tatum's gateway URLs for those specific chains
- Authentication headers are not sent to custom RPC endpoints

## 📖 Documentation

- [Tatum API Documentation](https://docs.tatum.io)
- [Model Context Protocol](https://modelcontextprotocol.io)
- [Blockchain Networks](https://docs.tatum.io/docs/supported-blockchains)
- [API Reference](https://docs.tatum.io/reference)

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- [Documentation](https://docs.tatum.io)
- [Discord Community](https://discord.gg/tatum)
- [GitHub Issues](https://github.com/tatumio/tatum-mcp-server/issues)
- [Email Support](mailto:support@tatum.io)

## 🏢 About Tatum

Tatum is a blockchain development platform that provides APIs, SDKs, and tools for building blockchain applications. Learn more at [tatum.io](https://tatum.io).

---
**Made with ❤️ by the Tatum team**

## License

MIT

## Support

For issues and questions:
- [Tatum Documentation](https://docs.tatum.io)
- [Tatum Discord](https://discord.gg/tatum)
- [GitHub Issues](https://github.com/your-repo/issues)