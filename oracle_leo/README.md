# Aleo Price Oracle

A decentralized price oracle for the Aleo blockchain, inspired by Chainlink's OCR (Off-Chain Reporting) design. This oracle provides BTC/USD price feeds by aggregating data from multiple exchanges.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         OFF-CHAIN                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │   Node 1     │  │   Node 2     │  │   Node 3     │              │
│  │  (Binance)   │  │  (Coinbase)  │  │  (Kraken)    │              │
│  │              │  │              │  │              │              │
│  │ Coordinator  │  │ Price Server │  │ Price Server │              │
│  │ Port: 4001   │  │ Port: 3002   │  │ Port: 3003   │              │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
│         │                 │                 │                       │
│         │    HTTP GET /price                │                       │
│         │◄────────────────┴─────────────────┘                       │
│         │                                                           │
│         ▼                                                           │
│  ┌─────────────────────────────────────┐                           │
│  │         Coordinator Logic           │                           │
│  │                                     │                           │
│  │  1. Collect prices from all nodes   │                           │
│  │  2. Compute median(3 prices)        │                           │
│  │  3. Check deviation (>0.5%) OR      │                           │
│  │     heartbeat (>1 hour)             │                           │
│  │  4. Submit TX if triggered          │                           │
│  └──────────────┬──────────────────────┘                           │
│                 │                                                   │
└─────────────────┼───────────────────────────────────────────────────┘
                  │
                  │ submit_price(feed_id, round, price, timestamp)
                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         ON-CHAIN (Aleo)                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  oracle_leo_v1.aleo                                                 │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Mappings:                                                   │   │
│  │    - latest_round: field => u64                             │   │
│  │    - latest_price_e8: field => u128                         │   │
│  │    - latest_timestamp: field => u64                         │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  submit_price(feed_id, round_id, price_e8, timestamp)       │   │
│  │    - Verify caller is whitelisted oracle                    │   │
│  │    - Verify round_id > last_round (monotonic)               │   │
│  │    - Store new price data                                   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Features

- **Multi-source price aggregation**: Fetches BTC/USD from Binance, Coinbase, and Kraken
- **Median calculation**: Robust against single source manipulation or downtime
- **Chainlink-style update policy**:
  - **Deviation trigger**: Updates when price moves >0.5% from last on-chain price
  - **Heartbeat trigger**: Updates at least once per hour even if price is stable
- **Whitelisted oracles**: Only authorized addresses can submit prices
- **Single transaction submission**: Efficient coordinator model

## Project Structure

```
oracle_leo/
├── src/
│   └── main.leo              # Aleo smart contract
├── nodes/
│   ├── node1.js              # Coordinator + Binance price source
│   ├── node2.js              # Coinbase price server
│   └── node3.js              # Kraken price server
├── build/                    # Compiled Aleo program
├── .env                      # Configuration (private keys, endpoints)
├── package.json
└── README.md
```

## Prerequisites

- [Leo](https://developer.aleo.org/leo/installation) (Aleo's programming language)
- [snarkOS](https://github.com/AleoHQ/snarkOS) (Aleo node software)
- Node.js v18+
- npm

## Installation

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd oracle_leo
   ```

2. **Install Node.js dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your oracle private key
   ```

4. **Build the Leo program**
   ```bash
   leo build
   ```

## Configuration

### Environment Variables (.env)

```env
# Aleo network endpoint
ENDPOINT=http://localhost:3030
NETWORK=testnet

# Oracle private key (must match a whitelisted address in the contract)
ORACLE_1_PRIVATE_KEY=APrivateKey1zkp...
```

### Oracle Addresses

The smart contract has 3 whitelisted oracle addresses. To modify them, edit `src/main.leo`:

```leo
const ORACLE_1: address = aleo1ashyu96tjwe63u0gtnnv8z5lhapdu4l5pjsl2kha7fv7hvz2eqxs5dz0rg;
const ORACLE_2: address = aleo12ux3gdauck0v60westgcpqj7v8rrcr3v346e4jtq04q7kkt22czsh808v2;
const ORACLE_3: address = aleo1p9sg8gapg22p3j42tang7c8kqzp4lhe6mg77gx32yys2a5y7pq9sxh6wrd;
```

### Update Policy

Configure in `nodes/node1.js`:

```javascript
const DEVIATION_THRESHOLD = 0.005;  // 0.5% price change triggers update
const HEARTBEAT_SECONDS = 3600;     // 1 hour max between updates
```

## Deployment

### 1. Start Local Devnet

```bash
snarkos start --dev 0
```

### 2. Deploy the Contract

```bash
leo deploy --network testnet --endpoint http://localhost:3030
```

### 3. Fund the Oracle Address

The oracle address needs credits to pay for gas:

```bash
snarkos developer execute credits.aleo transfer_public \
  "aleo1ashyu96tjwe63u0gtnnv8z5lhapdu4l5pjsl2kha7fv7hvz2eqxs5dz0rg" \
  "10000000u64" \
  --private-key APrivateKey1zkp8CZNn3yeCseEtxuVPbDCwSyhGW6yZKUYKfgXmcpoGPWH \
  --query http://localhost:3030 \
  --broadcast "http://localhost:3030/testnet/transaction/broadcast" \
  --network 1
```

## Running the Oracle

### Start All Nodes

```bash
npm run start-all
```

Or start individually:

```bash
# Terminal 1: Coinbase price server
node nodes/node2.js

# Terminal 2: Kraken price server
node nodes/node3.js

# Terminal 3: Coordinator (Binance + aggregation)
node nodes/node1.js
```

### Expected Output

```
🚀 Starting Oracle Coordinator (Node 1)
   Source: binance
   Program: oracle_leo_v1.aleo
   Network: http://localhost:3030
   Deviation: 0.5%
   Heartbeat: 3600s

========================================
🔄 Coordinator check at 2026-01-24T12:30:00.000Z
========================================

📊 Collecting prices...
  [binance]  $89654.84
  [coinbase] $89509.27
  [kraken]   $89484.10

📈 Median price: $89509.27

🔗 On-chain state:
   Round: 1
   Price: $89460.27
   Time: 2026-01-24T12:00:00.000Z

✅ No update needed
```

## API Endpoints

### Node 1 (Coordinator) - Port 4001

| Endpoint | Description |
|----------|-------------|
| `GET /price` | Current Binance BTC/USD price |
| `GET /status` | Full coordinator status including on-chain data |
| `GET /health` | Health check |

### Node 2 (Coinbase) - Port 3002

| Endpoint | Description |
|----------|-------------|
| `GET /price` | Current Coinbase BTC/USD price |
| `GET /health` | Health check |

### Node 3 (Kraken) - Port 3003

| Endpoint | Description |
|----------|-------------|
| `GET /price` | Current Kraken BTC/USD price |
| `GET /health` | Health check |

## Reading Price Data

### From Command Line

```bash
# Latest price (in e8 format: $89509.27 = 8950927000000)
curl http://localhost:3030/testnet/program/oracle_leo_v1.aleo/mapping/latest_price_e8/1field

# Latest round
curl http://localhost:3030/testnet/program/oracle_leo_v1.aleo/mapping/latest_round/1field

# Latest timestamp
curl http://localhost:3030/testnet/program/oracle_leo_v1.aleo/mapping/latest_timestamp/1field
```

### From Another Aleo Program

```leo
// Import the oracle
import oracle_leo_v1.aleo;

// Read price from mapping (off-chain, then pass as input)
// Or use cross-program calls when supported
```

## Price Format

Prices are stored in **e8 format** (8 decimal places):

| USD Price | e8 Format |
|-----------|-----------|
| $89,509.27 | 8950927000000 |
| $100,000.00 | 10000000000000 |
| $0.01 | 1000000 |

To convert: `price_usd = price_e8 / 100,000,000`

## Feed IDs

| Feed | ID |
|------|-----|
| BTC/USD | `1field` |

Additional feeds can be added by using different field values.

## Security Considerations

- **Whitelisted oracles**: Only 3 hardcoded addresses can submit prices
- **Monotonic rounds**: Round IDs must increase, preventing replay attacks
- **Median aggregation**: Protects against single source manipulation
- **No signature verification (MVP)**: Current version trusts whitelisted addresses; future versions could add multi-sig verification

## Future Improvements

- [ ] Add more price feeds (ETH/USD, SOL/USD, etc.)
- [ ] Implement 2-of-3 signature verification on-chain
- [ ] Add historical price storage
- [ ] Support for TWAP (Time-Weighted Average Price)
- [ ] Decentralize coordinator role
- [ ] Add slashing for misbehaving oracles

## Troubleshooting

### "assert.eq failed" error
The calling address is not in the whitelist. Ensure your `ORACLE_1_PRIVATE_KEY` matches one of the addresses in the contract.

### "No public balance" error
The oracle address needs gas credits. Transfer credits from a funded account.

### Node can't connect to other nodes
Ensure all 3 nodes are running before the coordinator starts checking.

## License

MIT

## Acknowledgments

- Inspired by [Chainlink's OCR Protocol](https://chain.link/education-hub/off-chain-reporting)
- Built on [Aleo](https://aleo.org/)
