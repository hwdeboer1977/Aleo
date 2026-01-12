---
arc: 4626
title: Tokenized Vault Standard
authors: @hwdeboer1977
discussion: https://github.com/ProvableHQ/ARCs/discussions/XXX
topic: Application
status: Draft
created: 2025-18-05
---

## Abstract

This ARC proposes a standard for tokenized yield-bearing vaults on Aleo, adapted from Ethereum's ERC-4626. It defines a minimal interface for depositing assets, minting shares, and redeeming shares for underlying assets. The implementation uses OpenZeppelin's virtual shares mechanism to prevent inflation attacks.

## Motivation

Yield-bearing vaults are fundamental DeFi primitives that enable:

1. **Composability**: Standardized vaults allow other protocols to build on top without custom integrations
2. **Capital Efficiency**: Users can earn yield while maintaining liquidity through tokenized shares
3. **Risk Management**: Clear share/asset accounting enables transparent pricing

The Ethereum ecosystem demonstrated the value of ERC-4626 standardization - before it, every vault (Yearn, Compound, Aave) had different interfaces, creating integration friction. A standard vault interface for Aleo will accelerate DeFi development.

### Why Aleo?

Aleo's programmable privacy enables vaults with:

- Private deposits (hide investment amounts)
- Private share balances (hide portfolio allocations)
- Public yield accounting (maintain transparency for share pricing)

## Specification

### Terminology

| Term        | Definition                                                 |
| ----------- | ---------------------------------------------------------- |
| Asset       | The underlying token deposited into the vault (e.g., USDC) |
| Share       | Token representing proportional ownership of vault assets  |
| Share Price | `totalAssets / totalShares` - increases as yield accrues   |

### Virtual Shares Mechanism

To prevent inflation attacks (where the first depositor manipulates share price), the vault uses OpenZeppelin's virtual shares formula:

```
DECIMALS_OFFSET = 1_000_000

// Deposit: calculate shares to mint
shares = (assets * (totalShares + DECIMALS_OFFSET)) / (totalAssets + 1)

// Redeem: calculate assets to return
assets = (shares * (totalAssets + 1)) / (totalShares + DECIMALS_OFFSET)
```

### Mappings

| Mapping          | Key        | Value  | Description                |
| ---------------- | ---------- | ------ | -------------------------- |
| `total_assets`   | `u8` (0u8) | `u128` | Total assets held by vault |
| `total_shares`   | `u8` (0u8) | `u128` | Total shares minted        |
| `share_balances` | `address`  | `u128` | Share balance per user     |

### Transitions

#### Core Functions

| Function  | Parameters                   | Description                    |
| --------- | ---------------------------- | ------------------------------ |
| `deposit` | `amount: u128`               | Deposit assets, receive shares |
| `redeem`  | `shares: u128, assets: u128` | Burn shares, receive assets    |

#### Admin Functions

| Function    | Parameters     | Description                                |
| ----------- | -------------- | ------------------------------------------ |
| `add_yield` | `amount: u128` | Add yield to vault (increases share price) |

### Interface

```leo
program arc4626_vault.aleo {

    // Constants
    const DECIMALS_OFFSET: u128 = 1000000u128;

    // Mappings
    mapping total_assets: u8 => u128;
    mapping total_shares: u8 => u128;
    mapping share_balances: address => u128;

    // Deposit assets, receive shares
    async transition deposit(amount: u128) -> Future {
        // Transfer assets from caller to vault
        let transfer_future: Future = mock_usdc.aleo/transfer_from(
            self.caller,
            arc4626_vault.aleo,
            amount
        );

        return finalize_deposit(transfer_future, self.caller, amount);
    }

    async function finalize_deposit(
        transfer_future: Future,
        depositor: address,
        amount: u128
    ) {
        // Await asset transfer
        transfer_future.await();

        // Get current state
        let current_assets: u128 = Mapping::get_or_use(total_assets, 0u8, 0u128);
        let current_shares: u128 = Mapping::get_or_use(total_shares, 0u8, 0u128);

        // Calculate shares using virtual shares formula
        let shares_to_mint: u128 = (amount * (current_shares + DECIMALS_OFFSET))
                                    / (current_assets + 1u128);

        // Update state
        Mapping::set(total_assets, 0u8, current_assets + amount);
        Mapping::set(total_shares, 0u8, current_shares + shares_to_mint);

        let user_shares: u128 = Mapping::get_or_use(share_balances, depositor, 0u128);
        Mapping::set(share_balances, depositor, user_shares + shares_to_mint);
    }

    // Redeem shares for assets
    async transition redeem(shares: u128, assets: u128) -> Future {
        return finalize_redeem(self.caller, shares, assets);
    }

    async function finalize_redeem(
        redeemer: address,
        shares: u128,
        expected_assets: u128
    ) {
        // Get current state
        let current_assets: u128 = Mapping::get(total_assets, 0u8);
        let current_shares: u128 = Mapping::get(total_shares, 0u8);
        let user_shares: u128 = Mapping::get(share_balances, redeemer);

        // Verify user has enough shares
        assert(user_shares >= shares);

        // Calculate assets to return
        let assets_to_return: u128 = (shares * (current_assets + 1u128))
                                      / (current_shares + DECIMALS_OFFSET);

        // Verify expected assets matches (slippage protection)
        assert(assets_to_return >= expected_assets);

        // Update state
        Mapping::set(total_assets, 0u8, current_assets - assets_to_return);
        Mapping::set(total_shares, 0u8, current_shares - shares);
        Mapping::set(share_balances, redeemer, user_shares - shares);

        // Transfer assets to redeemer
        // Note: Requires vault to have approved transfer capability
    }

    // Add yield to vault (admin only)
    async transition add_yield(amount: u128) -> Future {
        let transfer_future: Future = mock_usdc.aleo/transfer_from(
            self.caller,
            arc4626_vault.aleo,
            amount
        );

        return finalize_add_yield(transfer_future, amount);
    }

    async function finalize_add_yield(transfer_future: Future, amount: u128) {
        transfer_future.await();

        let current_assets: u128 = Mapping::get_or_use(total_assets, 0u8, 0u128);
        Mapping::set(total_assets, 0u8, current_assets + amount);
    }
}
```

### View Functions (Off-chain)

Query vault state via RPC:

```bash
# Total assets
curl "$ENDPOINT/testnet/program/arc4626_vault.aleo/mapping/total_assets/0u8"

# Total shares
curl "$ENDPOINT/testnet/program/arc4626_vault.aleo/mapping/total_shares/0u8"

# User shares
curl "$ENDPOINT/testnet/program/arc4626_vault.aleo/mapping/share_balances/$ADDRESS"
```

### Share Price Calculation

```
share_price = (total_assets + 1) / (total_shares + DECIMALS_OFFSET)
```

Initial price is ~1.0. Price increases as yield is added.

### Example Flow

```
1. Initial State
   total_assets = 0, total_shares = 0

2. Alice deposits 1,000,000 tokens
   shares_minted = (1,000,000 * (0 + 1,000,000)) / (0 + 1) = 1,000,000,000,000
   total_assets = 1,000,000
   total_shares = 1,000,000,000,000

3. Yield of 500,000 added
   total_assets = 1,500,000
   share_price = 1,500,001 / 1,001,000,000 ≈ 1.5

4. Alice redeems all shares
   assets_returned = (1,000,000,000,000 * 1,500,001) / 1,001,000,000 ≈ 1,498,502
```

## Rationale

### Why Virtual Shares?

Without virtual shares, the first depositor could:

1. Deposit 1 wei, receive 1 share
2. Donate 1,000,000 tokens directly to vault
3. Share price = 1,000,001
4. Next depositor with 500,000 tokens gets 0 shares (rounds down)

Virtual shares add "phantom liquidity" that prevents this attack.

### Why u128?

Aleo's u128 provides 38 decimal digits of precision, sufficient for:

- Token amounts up to 10^38
- Share calculations with DECIMALS_OFFSET without overflow

### Why Public Mappings?

Share balances could be private records, but public mappings:

- Enable transparent share pricing
- Allow integration with other protocols
- Support standard DeFi composability

Future versions may add private share records for privacy-preserving deposits.

## Backwards Compatibility

This is a new standard with no backwards compatibility concerns.

## Test Cases

### Deployment Script

```bash
#!/bin/bash
# Deploy mock_usdc and vault
cd ~/leo_projects/mock_usdc && leo deploy --network testnet --broadcast
cd ~/leo_projects/arc4626_vault && leo deploy --network testnet --broadcast

# Mint tokens and approve vault
leo execute mint_public $ADDR 2000000000u128 --network testnet --broadcast
leo execute approve arc4626_vault.aleo 2000000000u128 --network testnet --broadcast

# Deposit
cd ~/leo_projects/arc4626_vault
leo execute deposit 1000000u128 --network testnet --broadcast

# Add yield
leo execute add_yield 500000u128 --network testnet --broadcast

# Redeem
leo execute redeem ${shares}u128 ${assets}u128 --network testnet --broadcast
```

## Reference Implementation

- **Vault Contract**: https://github.com/hwdeboer1977/arc4626_vault
- **Mock Token**: https://github.com/hwdeboer1977/mock_usdc

## Security Considerations

1. **Inflation Attack**: Mitigated by virtual shares mechanism
2. **Rounding**: Always rounds in favor of the vault (depositors get fewer shares, redeemers get fewer assets)
3. **Slippage**: `redeem` requires expected assets parameter as slippage protection
4. **Admin Privileges**: `add_yield` currently has no access control - production implementations should add admin verification

## Dependencies

- Underlying token contract implementing `transfer_from` (ERC-20 style)
- Vault must be approved as spender on the underlying token

## References

- [ERC-4626 Specification](https://eips.ethereum.org/EIPS/eip-4626)
- [OpenZeppelin ERC-4626 Implementation](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/extensions/ERC4626.sol)
- [Leo Documentation](https://docs.leo-lang.org/)

## Copyright

This ARC is licensed under MIT.
