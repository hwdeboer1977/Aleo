# Aleo Multisig — Complete Setup & Operations Guide

A hands-on guide to deploying and operating the [AleoNet Aleo Multisig](https://github.com/AleoNet/aleo-multisig) system on a local devnet. Covers deployment, wallet creation, the 3-phase signing flow, fund transfers, and admin operations.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Setup & Deployment](#setup--deployment)
4. [Creating a Multisig Wallet](#creating-a-multisig-wallet)
5. [Funding the Wallet](#funding-the-wallet)
6. [Public Credit Transfer (3-Phase Flow)](#public-credit-transfer-3-phase-flow)
7. [Admin Operations](#admin-operations)
   - [Change Threshold](#change-threshold)
   - [Add a Signer](#add-a-signer)
   - [Remove a Signer](#remove-a-signer)
8. [Key Concepts & Gotchas](#key-concepts--gotchas)
9. [Reference](#reference)

---

## Architecture Overview

The system consists of three on-chain programs:

| Program | Role |
|---------|------|
| `multisig_core.aleo` | The engine — manages wallets, signers, thresholds, and the signing protocol |
| `multisig_wallet.aleo` | Example wallet app — holds Aleo credits and tokens, uses multisig_core for authorization |
| `token_registry.aleo` | Token management — handles public/private token balances |

A **multisig wallet** is identified by a `wallet_id` (any Aleo address), has a configurable threshold, and supports up to 4 signers (Aleo addresses and/or ECDSA/Ethereum addresses).

Every multisig-gated operation follows a **3-phase flow**:

1. **Init** — Someone starts the operation (if they're an authorized signer, it counts as signature #1)
2. **Sign** — Other authorized signers sign until the threshold is met
3. **Execute** — Anyone triggers the actual operation once enough signatures are collected

---

## Prerequisites

- **Leo CLI v3.4.0+** — `leo --version`
- **snarkOS** — installed and accessible via `which snarkos`
- **Node.js 22+** — for running tests

---

## Setup & Deployment

### 1. Clone the repo

```bash
git clone https://github.com/AleoNet/aleo-multisig.git
cd aleo-multisig
```

### 2. Update the DEPLOYER_ADDRESS

**Critical:** Open `programs/multisig_core/src/main.leo` and replace the hardcoded `DEPLOYER_ADDRESS` constant with your own address. The address must match the private key in your `.env` file.

To derive the address from a private key:

```bash
leo account import APrivateKey1zkp8CZNn3yeCseEtxuVPbDCwSyhGW6yZKUYKfgXmcpoGPWH
```

### 3. Configure `.env`

In the root directory, create/edit `.env`:

```env
NETWORK=testnet
PRIVATE_KEY=APrivateKey1zkp8CZNn3yeCseEtxuVPbDCwSyhGW6yZKUYKfgXmcpoGPWH
ENDPOINT=http://localhost:3030
CONSENSUS_VERSION_HEIGHTS=0,1,2,3,4,5,6,7,8,9,10,11
```

### 4. Start local devnet

```bash
leo devnet --snarkos $(which snarkos) --snarkos-features test_network \
  --consensus-heights 0,1,2,3,4,5,6,7,8,9,10,11 --clear-storage
```

### 5. Deploy all programs

From the `programs/multisig_wallet` directory. This automatically deploys all dependencies (`multisig_core.aleo`, `token_registry.aleo`) in the correct order:

```bash
cd programs/multisig_wallet
leo deploy --broadcast --consensus-heights 0,1,2,3,4,5,6,7,8,9,10,11
```

Deployment costs (on devnet):

| Program | Cost |
|---------|------|
| multisig_core.aleo | ~36.4 credits |
| token_registry.aleo | ~36.2 credits |
| multisig_wallet.aleo | ~18.3 credits |
| **Total** | **~91 credits** |

### 6. Initialize the core program

This sets the global configuration — the upgrader address and wallet creation mode:

```bash
leo execute --broadcast \
  --consensus-heights 0,1,2,3,4,5,6,7,8,9,10,11 --yes \
  multisig_core.aleo/init \
  aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px \
  false
```

Parameters:
- **First argument (address):** The upgrader address — authorized to deploy future upgrades
- **Second argument (bool):** `false` = open mode (anyone can create wallets), `true` = guarded mode (wallet creation requires multisig approval)

> **Note:** `init` can only be called once, by the deployer address.

---

## Creating a Multisig Wallet

### Generate a wallet ID

The wallet ID is just an Aleo address used as an identifier. Generate a fresh one:

```bash
leo account new
```

Save the address (you don't need the private key — it's just an identifier).

### Test accounts

For this guide we use two test accounts:

| Account | Private Key | Address |
|---------|-------------|---------|
| Signer 1 | `APrivateKey1zkp8CZNn3yeCseEtxuVPbDCwSyhGW6yZKUYKfgXmcpoGPWH` | `aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px` |
| Signer 2 | `APrivateKey1zkp2RWGDcde3efb89rjhME1VYA8QMxcxep5DShNBR6n8Yjh` | `aleo1s3ws5tra87fjycnjrwsjcrnw2qxr8jfqqdugnf0xzqqw29q9m5pqem2u4t` |

### Create a 2-of-2 wallet

```bash
leo execute --broadcast \
  --consensus-heights 0,1,2,3,4,5,6,7,8,9,10,11 --yes \
  multisig_core.aleo/create_wallet \
  <WALLET_ID> \
  2u8 \
  '[aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px, aleo1s3ws5tra87fjycnjrwsjcrnw2qxr8jfqqdugnf0xzqqw29q9m5pqem2u4t, aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc, aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc]' \
  '[[0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8],[0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8],[0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8],[0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8]]'
```

**Important notes:**
- The Aleo signer array is **fixed at 4 slots** — unused slots must be the zero address: `aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc`
- The ECDSA signer array is also **fixed at 4 slots of 20 bytes** — all zeroed when not using Ethereum signers
- `2u8` means both signers must approve every operation
- A wallet ID cannot be reused once created

---

## Funding the Wallet

The multisig wallet holds its own funds separately from account balances. You must deposit before transferring.

### Deposit public Aleo credits

```bash
leo execute --broadcast \
  --consensus-heights 0,1,2,3,4,5,6,7,8,9,10,11 --yes \
  multisig_wallet.aleo/deposit_public_aleo_credits \
  <WALLET_ID> \
  1000u128
```

### Deposit public tokens

```bash
leo execute --broadcast \
  --consensus-heights 0,1,2,3,4,5,6,7,8,9,10,11 --yes \
  multisig_wallet.aleo/deposit_public_token \
  <WALLET_ID> \
  <TOKEN_ID> \
  1000u128
```

---

## Public Credit Transfer (3-Phase Flow)

This demonstrates the complete init → sign → execute cycle for sending Aleo credits from the multisig wallet.

The `CREDITS_RESERVED_TOKEN_ID` used by the token registry for Aleo credits is:
```
3443843282313283355522573239085696902919850365217539366784739393210722344986field
```

### Phase 1: Initiate the transfer (signature 1/2)

Called with your main key (Signer 1). Since the caller is an authorized signer, this counts as the first signature.

```bash
leo execute --broadcast \
  --consensus-heights 0,1,2,3,4,5,6,7,8,9,10,11 --yes \
  multisig_wallet.aleo/init_public_transfer \
  <WALLET_ID> \
  1field \
  100u32 \
  '{ token_id: 3443843282313283355522573239085696902919850365217539366784739393210722344986field, destination: aleo1s3ws5tra87fjycnjrwsjcrnw2qxr8jfqqdugnf0xzqqw29q9m5pqem2u4t, amount: 50u128 }'
```

Parameters:
- `<WALLET_ID>` — your multisig wallet address
- `1field` — unique signing operation ID (any field value, cannot be reused for active/completed ops)
- `100u32` — block expiration (signatures must be collected within 100 blocks)
- The `Transfer` struct containing `token_id`, `destination`, and `amount`

### Phase 2: Sign with second key (signature 2/2)

Use the `--private-key` flag to sign with a different key without editing `.env`:

```bash
leo execute --broadcast \
  --consensus-heights 0,1,2,3,4,5,6,7,8,9,10,11 --yes \
  multisig_core.aleo/sign \
  <WALLET_ID> \
  1field \
  --private-key APrivateKey1zkp2RWGDcde3efb89rjhME1VYA8QMxcxep5DShNBR6n8Yjh
```

### Phase 3: Execute the transfer

Once the threshold is met, anyone can trigger execution:

```bash
leo execute --broadcast \
  --consensus-heights 0,1,2,3,4,5,6,7,8,9,10,11 --yes \
  multisig_wallet.aleo/exec_public_credits_transfer \
  <WALLET_ID> \
  1field \
  '{ token_id: 3443843282313283355522573239085696902919850365217539366784739393210722344986field, destination: aleo1s3ws5tra87fjycnjrwsjcrnw2qxr8jfqqdugnf0xzqqw29q9m5pqem2u4t, amount: 50u128 }'
```

> **Note:** The function is `exec_public_credits_transfer` (with an **s** in "credits"), not `exec_public_credit_transfer`.

---

## Admin Operations

Admin operations use the same 3-phase flow but go through `multisig_core.aleo/init_admin_op` and `multisig_core.aleo/exec_admin_op`. They modify wallet configuration (threshold, signers) and don't require funds in the wallet.

The `AdminOp` struct:
```
struct AdminOp {
    op_type: u8,        // 0 = set_threshold, 1 = add_signer, 2 = remove_signer
    threshold: u8,      // new threshold (only used for op_type 0)
    is_aleo_signer: bool,  // true for Aleo signer, false for ECDSA
    signer_index: u8,   // unused for most operations, set to 0u8
    aleo_signer: address,  // the Aleo address to add/remove
    ecdsa_signer: [u8; 20] // the ECDSA address to add/remove
}
```

### Change Threshold

Change the required number of signatures from 2 to 1.

**Phase 1: Init** (counts as signature 1/2 under current threshold)

```bash
leo execute --broadcast \
  --consensus-heights 0,1,2,3,4,5,6,7,8,9,10,11 --yes \
  multisig_core.aleo/init_admin_op \
  <WALLET_ID> \
  2field \
  100u32 \
  '{ op_type: 0u8, threshold: 1u8, is_aleo_signer: false, signer_index: 0u8, aleo_signer: aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc, ecdsa_signer: [0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8] }'
```

**Phase 2: Sign**

```bash
leo execute --broadcast \
  --consensus-heights 0,1,2,3,4,5,6,7,8,9,10,11 --yes \
  multisig_core.aleo/sign \
  <WALLET_ID> \
  2field \
  --private-key APrivateKey1zkp2RWGDcde3efb89rjhME1VYA8QMxcxep5DShNBR6n8Yjh
```

**Phase 3: Execute**

```bash
leo execute --broadcast \
  --consensus-heights 0,1,2,3,4,5,6,7,8,9,10,11 --yes \
  multisig_core.aleo/exec_admin_op \
  <WALLET_ID> \
  2field \
  '{ op_type: 0u8, threshold: 1u8, is_aleo_signer: false, signer_index: 0u8, aleo_signer: aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc, ecdsa_signer: [0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8] }'
```

### Add a Signer

Add a third Aleo signer to the wallet. Generate a new address first with `leo account new`.

**Phase 1: Init**

```bash
leo execute --broadcast \
  --consensus-heights 0,1,2,3,4,5,6,7,8,9,10,11 --yes \
  multisig_core.aleo/init_admin_op \
  <WALLET_ID> \
  3field \
  100u32 \
  '{ op_type: 1u8, threshold: 0u8, is_aleo_signer: true, signer_index: 0u8, aleo_signer: <NEW_SIGNER_ADDRESS>, ecdsa_signer: [0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8] }'
```

Key fields:
- `op_type: 1u8` — add signer
- `is_aleo_signer: true` — adding an Aleo address (not ECDSA)
- `aleo_signer` — the address to add

**Phase 2: Sign** (same as before, using signing_op_id `3field`)

```bash
leo execute --broadcast \
  --consensus-heights 0,1,2,3,4,5,6,7,8,9,10,11 --yes \
  multisig_core.aleo/sign \
  <WALLET_ID> \
  3field \
  --private-key APrivateKey1zkp2RWGDcde3efb89rjhME1VYA8QMxcxep5DShNBR6n8Yjh
```

**Phase 3: Execute**

```bash
leo execute --broadcast \
  --consensus-heights 0,1,2,3,4,5,6,7,8,9,10,11 --yes \
  multisig_core.aleo/exec_admin_op \
  <WALLET_ID> \
  3field \
  '{ op_type: 1u8, threshold: 0u8, is_aleo_signer: true, signer_index: 0u8, aleo_signer: <NEW_SIGNER_ADDRESS>, ecdsa_signer: [0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8] }'
```

After execution, the wallet will have 3 signers. The threshold remains unchanged — you may want to update it separately.

### Remove a Signer

Remove a signer from the wallet.

**Phase 1: Init**

```bash
leo execute --broadcast \
  --consensus-heights 0,1,2,3,4,5,6,7,8,9,10,11 --yes \
  multisig_core.aleo/init_admin_op \
  <WALLET_ID> \
  4field \
  100u32 \
  '{ op_type: 2u8, threshold: 0u8, is_aleo_signer: true, signer_index: 0u8, aleo_signer: <SIGNER_TO_REMOVE>, ecdsa_signer: [0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8] }'
```

Key field: `op_type: 2u8` — remove signer

**Phase 2 & 3:** Same pattern — sign with `4field`, then execute with the same `AdminOp` struct.

> **Important:** You cannot remove a signer if it would make the number of signers less than the threshold. Lower the threshold first if needed.

---

## Key Concepts & Gotchas

### Signing operation IDs
- Each operation needs a unique `signing_op_id` (a field value like `1field`, `2field`, or a random value)
- IDs cannot be reused for active or completed operations
- If an operation expires without execution, the ID can be reused

### Block expiration
- The `block_expiration` parameter (e.g., `100u32`) is relative — signatures must be collected within that many blocks from initiation
- Use `4294967295u32` (u32 max) for operations that should effectively never expire
- Expired operations cannot be signed or executed, but can be re-initiated with the same ID

### Threshold enforcement
- The threshold checked at **execution time** is the **current** threshold, not the one at initiation
- This means if the threshold changes between init and execute, the new threshold applies

### Who can do what
- **Init:** Anyone can initiate (if they're an authorized signer, it auto-counts as a signature)
- **Sign:** Only authorized signers for that specific wallet
- **Execute:** Anyone can trigger execution once the threshold is met
- Each signer can only sign once per operation (no double-signing)

### Transfer struct
The `Transfer` struct uses `destination` (not `recipient`):
```
{ token_id: <field>, destination: <address>, amount: <u128> }
```

### Function naming
- Credits functions have an **s**: `deposit_public_aleo_credits`, `exec_public_credits_transfer`
- Use `grep "transition" programs/multisig_wallet/src/main.leo` to check exact names

### Using different private keys
Use the `--private-key` flag instead of editing `.env`:
```bash
leo execute --broadcast --yes <program/function> <args> \
  --private-key <PRIVATE_KEY>
```

---

## Reference

### Available wallet transitions

| Function | Program | Description |
|----------|---------|-------------|
| `create_wallet` | multisig_core | Create a new multisig wallet |
| `sign` | multisig_core | Add an Aleo signature to a pending operation |
| `sign_ecdsa` | multisig_core | Add an ECDSA signature to a pending operation |
| `init_admin_op` | multisig_core | Start an admin operation (threshold/signer changes) |
| `exec_admin_op` | multisig_core | Execute a completed admin operation |
| `deposit_public_aleo_credits` | multisig_wallet | Deposit Aleo credits into the wallet |
| `deposit_public_token` | multisig_wallet | Deposit tokens into the wallet |
| `deposit_private_aleo_credits` | multisig_wallet | Deposit private Aleo credits into the wallet |
| `deposit_private_token` | multisig_wallet | Deposit private tokens into the wallet |
| `init_public_transfer` | multisig_wallet | Initiate a public transfer |
| `exec_public_credits_transfer` | multisig_wallet | Execute a public credits transfer |
| `exec_public_token_transfer` | multisig_wallet | Execute a public token transfer |
| `init_private_transfer` | multisig_wallet | Initiate a private transfer |
| `exec_private_credits_transfer` | multisig_wallet | Execute a private credits transfer |
| `exec_private_token_transfer` | multisig_wallet | Execute a private token transfer |

### AdminOp op_type values

| Value | Operation |
|-------|-----------|
| `0u8` | Set threshold |
| `1u8` | Add signer |
| `2u8` | Remove signer |

### Running the JS test suite

```bash
cd tests
npm install
export CONSENSUS_VERSION_HEIGHTS=0,1,2,3,4,5,6,7,8,9,10,11
npm test
```

Run a specific test:
```bash
npm test -- -t 'Can update threshold'
```
