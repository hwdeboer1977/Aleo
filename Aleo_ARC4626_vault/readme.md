# ERC-4626 Vault Implementation for Aleo

A minimal implementation of the ERC-4626 tokenized vault standard for the Aleo blockchain using the Leo programming language.

## Overview

This project implements a yield-bearing vault that:

- Accepts deposits of an underlying asset (mock USDC)
- Mints shares to depositors proportional to their contribution
- Allows redemption of shares for underlying assets
- Supports yield distribution that increases share price

The implementation uses OpenZeppelin's virtual shares mechanism to prevent inflation attacks.

## Project Structure

```
~/leo_projects/
├── mock_usdc/                 # Underlying token
│   ├── src/
│   │   └── main.leo
│   ├── program.json
│   └── .env
│
└── arc4626_vault/             # ERC-4626 vault
    ├── src/
    │   └── main.leo
    ├── program.json
    ├── .env
    ├── check_vault.sh         # Query state, deposit, redeem
    └── setup_vault.sh         # Full deployment script
```

## Programs

### mock_usdc.aleo

A simple token contract with ERC-20 style functionality:

| Function                                  | Description               |
| ----------------------------------------- | ------------------------- |
| `mint_public(recipient, amount)`          | Mint tokens (admin only)  |
| `transfer_public(recipient, amount)`      | Transfer tokens           |
| `approve(spender, amount)`                | Approve spender allowance |
| `transfer_from(owner, recipient, amount)` | Transfer using allowance  |
| `burn_public(amount)`                     | Burn tokens               |

### arc4626_vault.aleo

The ERC-4626 vault implementation:

| Function                 | Description                     |
| ------------------------ | ------------------------------- |
| `deposit(amount)`        | Deposit assets, receive shares  |
| `redeem(shares, assets)` | Burn shares, receive assets     |
| `add_yield(amount)`      | Add yield to vault (admin only) |

#### Key Concepts

**Virtual Shares Formula (OpenZeppelin style)**

Prevents inflation attacks by adding virtual liquidity:

```
// Deposit: calculate shares to mint
shares = (assets * (totalShares + DECIMALS_OFFSET)) / (totalAssets + 1)

// Redeem: calculate assets to return
assets = (shares * (totalAssets + 1)) / (totalShares + DECIMALS_OFFSET)
```

Where `DECIMALS_OFFSET = 1,000,000`

**Share Price**

```
price = (totalAssets + 1) / (totalShares + DECIMALS_OFFSET)
```

Initially 1.0, increases when yield is added.

## Environment Setup

### .env file

Both projects need a `.env` file:

```bash
PRIVATE_KEY=APrivateKey1zkp8CZNn3yeCseEtxuVPbDCwSyhGW6yZKUYKfgXmcpoGPWH
ENDPOINT=http://localhost:3030
NETWORK=testnet
```

### Prerequisites

- Rust (via rustup)
- Leo (`cargo install leo-lang`)
- snarkOS (`cargo install snarkos`)
- bc (for bash calculations)

## Scripts

### setup_vault.sh

Deploys everything from scratch:

```bash
#!/bin/bash
set -e

ENDPOINT="http://localhost:3030"
CONSENSUS="--consensus-heights 0,1,2,3,4,5,6,7,8,9,10,11"
NETWORK="--network testnet --broadcast"
ADDR="aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px"

echo "Waiting for devnet..."
until curl -s "$ENDPOINT/testnet/block/height/latest" 2>/dev/null | grep -qE '^[0-9]+$'; do
    sleep 2
    echo "  Waiting for devnet to start..."
done

height=$(curl -s "$ENDPOINT/testnet/block/height/latest")
while [ "$height" -lt 12 ]; do
    echo "  Block height: $height (waiting for 12)"
    sleep 2
    height=$(curl -s "$ENDPOINT/testnet/block/height/latest")
done
echo "Devnet ready! Height: $height"

echo "=== 1. Deploying mock_usdc ==="
cd ~/leo_projects/mock_usdc
leo deploy $NETWORK $CONSENSUS
sleep 3

echo "=== 2. Deploying vault ==="
cd ~/leo_projects/arc4626_vault
leo deploy $NETWORK $CONSENSUS
sleep 3

echo "=== 3. Minting tokens ==="
cd ~/leo_projects/mock_usdc
leo execute mint_public $ADDR 2000000000u128 $NETWORK $CONSENSUS
sleep 3

echo "=== 4. Approving vault ==="
leo execute approve arc4626_vault.aleo 2000000000u128 $NETWORK $CONSENSUS
sleep 3

echo "=== 5. Depositing ==="
cd ~/leo_projects/arc4626_vault
leo execute deposit 1000000u128 $NETWORK $CONSENSUS
sleep 3

echo "=== 6. Adding yield ==="
leo execute add_yield 500000u128 $NETWORK $CONSENSUS
sleep 3

echo "=== Done! Checking state ==="
./check_vault.sh
```

### check_vault.sh

Query vault state, deposit, and redeem:

```bash
#!/bin/bash

ENDPOINT="http://localhost:3030"
PROGRAM="arc4626_vault.aleo"
ADDR="aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px"
OFFSET=1000000
CONSENSUS="--consensus-heights 0,1,2,3,4,5,6,7,8,9,10,11"
NETWORK="--network testnet --broadcast"

fetch_state() {
    ta=$(curl -s "$ENDPOINT/testnet/program/$PROGRAM/mapping/total_assets/0u8" | sed 's/"//g; s/u128//')
    ts=$(curl -s "$ENDPOINT/testnet/program/$PROGRAM/mapping/total_shares/0u8" | sed 's/"//g; s/u128//')
    shares=$(curl -s "$ENDPOINT/testnet/program/$PROGRAM/mapping/share_balances/$ADDR" | sed 's/"//g; s/u128//')
    ta=${ta:-0}
    ts=${ts:-0}
    shares=${shares:-0}
}

show_state() {
    fetch_state
    echo "=== Vault State ==="
    echo "Total Assets: $ta"
    echo "Total Shares (raw): $ts"
    echo "Total Shares (display): $(echo "scale=0; $ts / $OFFSET" | bc)"
    echo "Your Shares (raw): $shares"
    echo "Your Shares (display): $(echo "scale=0; $shares / $OFFSET" | bc)"
    echo "Share Price: $(echo "scale=6; ($ta + 1) * $OFFSET / ($ts + $OFFSET)" | bc)"
    echo "Your Value: $(echo "scale=6; $shares * ($ta + 1) / ($ts + $OFFSET)" | bc)"
}

deposit() {
    amount=$1
    echo "Depositing $amount..."
    cd ~/leo_projects/arc4626_vault
    leo execute deposit ${amount}u128 $NETWORK $CONSENSUS
    sleep 3
    show_state
}

redeem_all() {
    fetch_state
    if [ "$shares" -gt 0 ] 2>/dev/null; then
        assets=$(echo "($shares * ($ta + 1)) / ($ts + $OFFSET)" | bc)
        echo "Redeeming $shares shares for $assets assets..."
        cd ~/leo_projects/arc4626_vault
        leo execute redeem ${shares}u128 ${assets}u128 $NETWORK $CONSENSUS
        sleep 3
        show_state
    else
        echo "No shares to redeem"
    fi
}

case "$1" in
    deposit)
        deposit $2
        ;;
    redeem)
        redeem_all
        ;;
    *)
        show_state
        echo ""
        echo "=== Commands ==="
        echo "./check_vault.sh deposit <amount>  - Deposit assets"
        echo "./check_vault.sh redeem            - Redeem all shares"
        ;;
esac
```

## How to Run

### 1. Start Local Devnet

```bash
# Terminal 1
leo devnet --snarkos $(which snarkos) --snarkos-features test_network --consensus-heights 0,1,2,3,4,5,6,7,8,9,10,11 --install
```

Wait for block height to reach 12+.

### 2. Deploy and Setup

```bash
# Terminal 2
cd ~/leo_projects/arc4626_vault
chmod +x setup_vault.sh check_vault.sh
./setup_vault.sh
```

### 3. Interact with Vault

```bash
# Check state
./check_vault.sh

# Deposit 1,000,000 tokens
./check_vault.sh deposit 1000000

# Redeem all shares
./check_vault.sh redeem
```

### Manual Commands

```bash
# Deploy
leo deploy --network testnet --broadcast --consensus-heights 0,1,2,3,4,5,6,7,8,9,10,11

# Mint tokens
leo execute mint_public <address> <amount>u128 --network testnet --broadcast --consensus-heights 0,1,2,3,4,5,6,7,8,9,10,11

# Approve vault
leo execute approve arc4626_vault.aleo <amount>u128 --network testnet --broadcast --consensus-heights 0,1,2,3,4,5,6,7,8,9,10,11

# Deposit
leo execute deposit <amount>u128 --network testnet --broadcast --consensus-heights 0,1,2,3,4,5,6,7,8,9,10,11

# Redeem
leo execute redeem <shares>u128 <assets>u128 --network testnet --broadcast --consensus-heights 0,1,2,3,4,5,6,7,8,9,10,11
```

## Query Mappings Directly

```bash
# Total assets in vault
curl "http://localhost:3030/testnet/program/arc4626_vault.aleo/mapping/total_assets/0u8"

# Total shares minted
curl "http://localhost:3030/testnet/program/arc4626_vault.aleo/mapping/total_shares/0u8"

# User share balance
curl "http://localhost:3030/testnet/program/arc4626_vault.aleo/mapping/share_balances/<address>"

# Vault's token balance
curl "http://localhost:3030/testnet/program/mock_usdc.aleo/mapping/balances/<vault_address>"
```

## References

- [ERC-4626 Specification](https://eips.ethereum.org/EIPS/eip-4626)
- [OpenZeppelin ERC-4626](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/extensions/ERC4626.sol)
- [Leo Documentation](https://docs.leo-lang.org/)
- [Aleo Developer Docs](https://developer.aleo.org/)
