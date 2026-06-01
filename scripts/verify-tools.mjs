#!/usr/bin/env node
/**
 * Smoke-test all blockchain-mcp data + gateway tools against live Tatum APIs.
 * Usage: TATUM_API_KEY=... node scripts/verify-tools.mjs
 */

const API_KEY = process.env.TATUM_API_KEY;
if (!API_KEY) {
  console.error('Set TATUM_API_KEY');
  process.exit(1);
}

const BASE = 'https://api.tatum.io';
const VITALIK = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
// Docs example NFT contract (valid EIP-55 checksum)
const EXAMPLE_NFT = '0xba30E5F9Bb24caa003E9f2f0497Ad287FDF95623';

async function apiGet(path, params = {}) {
  const url = new URL(path, BASE);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
  }
  const res = await fetch(url, { headers: { 'x-api-key': API_KEY } });
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { status: res.status, ok: res.ok, body };
}

function summarize(name, result, expectFail = false) {
  const status = result.status;
  const ok = expectFail ? !result.ok : result.ok;
  const preview =
    typeof result.body === 'object'
      ? JSON.stringify(result.body).slice(0, 120)
      : String(result.body).slice(0, 120);
  return { name, status, ok, preview, expectFail };
}

const tests = [
  {
    name: 'get_exchange_rate (/v4/data/rate/symbol)',
    run: () => apiGet('/v4/data/rate/symbol', { symbol: 'BTC', basePair: 'USD' }),
  },
  {
    name: 'deprecated /v4/data/exchange-rate (expect 404)',
    expectFail: true,
    run: () =>
      apiGet('/v4/data/exchange-rate', {
        chain: 'bitcoin-mainnet',
        tokenAddress: 'native',
        basePair: 'USD',
      }),
  },
  {
    name: 'get_transaction_history WRONG (/v4/data/transactions)',
    run: () =>
      apiGet('/v4/data/transactions', {
        chain: 'ethereum-mainnet',
        addresses: VITALIK,
        pageSize: 1,
      }),
  },
  {
    name: 'get_transaction_history CORRECT (/v4/data/transaction/history)',
    run: () =>
      apiGet('/v4/data/transaction/history', {
        chain: 'ethereum-mainnet',
        addresses: VITALIK,
        transactionTypes: 'native',
        pageSize: 1,
      }),
  },
  {
    name: 'get_wallet_portfolio',
    run: () =>
      apiGet('/v4/data/wallet/portfolio', {
        chain: 'ethereum-mainnet',
        addresses: VITALIK,
        tokenTypes: 'native',
        pageSize: 1,
      }),
  },
  {
    name: 'get_wallet_balance_by_time',
    run: () =>
      apiGet('/v4/data/wallet/balance/time', {
        chain: 'ethereum-mainnet',
        addresses: VITALIK,
        unix: Math.floor(Date.now() / 1000) - 86400,
      }),
  },
  {
    name: 'get_block_by_time',
    run: () =>
      apiGet('/v4/data/block/time', {
        chain: 'ethereum-mainnet',
        unix: Math.floor(Date.now() / 1000) - 86400,
      }),
  },
  {
    name: 'get_tokens (native)',
    run: () =>
      apiGet('/v4/data/tokens', {
        chain: 'ethereum-mainnet',
        tokenAddress: 'native',
      }),
  },
  {
    name: 'get_owners (USDC)',
    run: () =>
      apiGet('/v4/data/owners', {
        chain: 'ethereum-mainnet',
        tokenAddress: USDC,
        pageSize: 1,
      }),
  },
  {
    name: 'check_owner',
    run: () =>
      apiGet('/v4/data/owners/address', {
        chain: 'ethereum-mainnet',
        address: VITALIK,
        tokenAddress: USDC,
      }),
  },
  {
    name: 'get_metadata (NFT #1)',
    run: () =>
      apiGet('/v4/data/metadata', {
        chain: 'ethereum-mainnet',
        tokenAddress: EXAMPLE_NFT,
        tokenIds: '1',
      }),
  },
  {
    name: 'check_malicious_address',
    run: () => apiGet(`/v3/security/address/${VITALIK}`),
  },
  {
    name: 'gateway blockchains.json',
    run: async () => {
      const res = await fetch('https://blockchains.tatum.io/blockchains.json');
      const body = await res.json();
      const chains = body.flatMap((b) => b.chains?.map((c) => c.gatewayName) ?? []);
      return {
        status: res.status,
        ok: res.ok && chains.length > 0,
        body: { count: chains.length, sample: chains.slice(0, 3) },
      };
    },
  },
  {
    name: 'gateway eth_blockNumber',
    run: async () => {
      const chainsRes = await fetch('https://blockchains.tatum.io/blockchains.json');
      const blockchains = await chainsRes.json();
      let gatewayUrl;
      for (const b of blockchains) {
        for (const c of b.chains || []) {
          if (c.gatewayName === 'ethereum-mainnet') {
            gatewayUrl = c.gatewayUrl;
            break;
          }
        }
      }
      if (!gatewayUrl) {
        return { status: 404, ok: false, body: 'ethereum-mainnet not found' };
      }
      const res = await fetch(gatewayUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_blockNumber',
          params: [],
        }),
      });
      const body = await res.json();
      return { status: res.status, ok: res.ok && body?.result, body };
    },
  },
];

const results = [];
for (const t of tests) {
  try {
    const result = await t.run();
    results.push(summarize(t.name, result, t.expectFail));
  } catch (e) {
    results.push({ name: t.name, status: 0, ok: false, preview: e.message });
  }
}

console.log('\n=== Tool verification results ===\n');
for (const r of results) {
  const label = r.expectFail ? (r.ok ? 'PASS (deprecated)' : 'FAIL') : r.ok ? 'PASS' : 'FAIL';
  console.log(`${label} [${r.status}] ${r.name}`);
  if (!r.ok) console.log(`       ${r.preview}`);
}
console.log('');

const failed = results.filter((r) => r.ok === false);
process.exit(failed.length > 0 ? 1 : 0);
