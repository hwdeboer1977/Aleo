// ARC-4626 Vault for mock_usdc_ok.aleo
// Standalone vault - no token_registry dependency


// First run all commands in mock_usdc
// 5. leo build
// 6. leo deploy --broadcast --consensus-heights 0,1,2,3,4,5,6,7,8,9,10,11
// 7. In mock_usdc: leo execute approve arc4626_vault.aleo 500000000u128 --network testnet --broadcast --consensus-heights 0,1,2,3,4,5,6,7,8,9,10,11

// leo execute approve arc4626_vault.aleo 2000000000u128 --network testnet --broadcast --consensus-heights 0,1,2,3,4,5,6,7,8,9,10,11
// 8a. leo execute deposit 1000000u128 aleo1d9es6d8kuzg65dlfdpx9zxchcsarh8k0hwxfx5eg6k4w7ew6gs8sv5aza0 --network testnet --broadcast --consensus-heights 0,1,2,3,4,5,6,7,8,9,10,11
// 8b. leo execute deposit 1000000u128 aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px --network testnet --broadcast --consensus-heights 0,1,2,3,4,5,6,7,8,9,10,11

// leo execute add_yield 1000000u128 aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px --network testnet --broadcast --consensus-heights 0,1,2,3,4,5,6,7,8,9,10,11

import mock_usdc.aleo;

program arc4626_vault.aleo {

    const DECIMALS_OFFSET: u128 = 1000000u128;

    mapping total_assets: u8 => u128;
    mapping total_shares: u8 => u128;
    mapping share_balances: address => u128;

    const ADMIN: address = aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px;

    // self.caller - The address that called this transition (the user's wallet address)
    // self.address - The program's own address (arc4626_vault.aleo in this case)

    // Transition (off-chain) - Runs on the user's machine, generates a proof. Can access records, do private computation, 
    // call other programs. But cannot read or write mappings.
    async transition deposit(
        public amount: u128,
    ) -> Future {
        // transfer from the user to the vault
        // f is a Future (similar to await in JavaScript )
        let f: Future = mock_usdc.aleo/transfer_from(
            self.caller,
            self.address,
            amount,
        );
        return finalize_deposit(f, self.caller, amount);
    }

    // Finalize (on-chain) - Runs by validators after the proof is verified. 
    // Can read/write mappings but cannot access private data.
    async function finalize_deposit(
        f: Future,
        depositor: address,
        amount: u128,
    ) {
        f.await();

        let ta: u128 = Mapping::get_or_use(total_assets, 0u8, 0u128);
        let ts: u128 = Mapping::get_or_use(total_shares, 0u8, 0u128);
        
        // Virtual shares formula (OpenZeppelin style)
        let shares: u128 = (amount * (ts + DECIMALS_OFFSET)) / (ta + 1u128);
        
        let current: u128 = Mapping::get_or_use(share_balances, depositor, 0u128);
        Mapping::set(share_balances, depositor, current + shares);
        Mapping::set(total_assets, 0u8, ta + amount);
        Mapping::set(total_shares, 0u8, ts + shares);
    }


    // ============ REDEEM ============
    // In Leo: The transfer_public call happens in the transition (off-chain), but we can only read mappings in finalize (on-chain).
    // The problem is mock_usdc.aleo/transfer_public must be called in the transition, not finalize. And transitions can't read mappings.
    async transition redeem(public shares: u128, public assets: u128) -> Future {
        // Can't calculate assets here - no mapping access --> determine before calling redeem
        // Share price is available on chain --> use this!
        let f: Future = mock_usdc.aleo/transfer_public(
            self.caller,
            assets,
        );
        return finalize_redeem(f, self.caller, shares, assets);
    }

    async function finalize_redeem(f: Future, owner: address, shares: u128, assets: u128) {
        f.await();

        let ta: u128 = Mapping::get_or_use(total_assets, 0u8, 0u128);
        let ts: u128 = Mapping::get_or_use(total_shares, 0u8, 0u128);
        
        // Verify user isn't withdrawing more than entitled
        let expected_assets: u128 = (shares * (ta + 1u128)) / (ts + DECIMALS_OFFSET);
        assert(assets <= expected_assets);

        // Burn shares
        let current: u128 = Mapping::get(share_balances, owner);
        assert(current >= shares);
        Mapping::set(share_balances, owner, current - shares);

        // Update totals
        Mapping::set(total_assets, 0u8, ta - assets);
        Mapping::set(total_shares, 0u8, ts - shares);
    }

    // Function to add yield to the vault (without minting new shares)
    // DeFi protocols earn additional yield (without minting new shares)
    async transition add_yield(public amount: u128) -> Future {
        assert_eq(self.caller, ADMIN);
        return finalize_add_yield(amount);
    }

    async function finalize_add_yield(amount: u128) {
        let ta: u128 = Mapping::get_or_use(total_assets, 0u8, 0u128);
        Mapping::set(total_assets, 0u8, ta + amount);
    }

    // For basic vault (deposit/redeem), you don't need transfer_shares. 
    // But if you want users to trade or send their vault shares to others, add it to the vault
    async transition transfer_shares(public to: address, public amount: u128) -> Future {
        return finalize_transfer_shares(self.caller, to, amount);
    }

    // In ERC4626, the vault IS an ERC20 (shares are automatically transferable).
    // In Leo, you add it explicitly if needed.
    async function finalize_transfer_shares(from: address, to: address, amount: u128) {
        let from_bal: u128 = Mapping::get(share_balances, from);
        assert(from_bal >= amount);
        Mapping::set(share_balances, from, from_bal - amount);

        let to_bal: u128 = Mapping::get_or_use(share_balances, to, 0u128);
        Mapping::set(share_balances, to, to_bal + amount);
    }
 
    // The constructor is configured to prevent upgrades.
    @noupgrade
    async constructor() {}
}