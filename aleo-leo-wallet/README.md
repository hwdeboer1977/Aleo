# Leo Wallet React Integration (Aleo)

A minimal React + TypeScript frontend demonstrating wallet connection with Leo Wallet on the Aleo blockchain.

## Features

- Connect/disconnect Leo Wallet
- Network selection (Mainnet / Testnet) before connecting
- Display connected wallet address
- Clean, modern UI

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

## Dependencies

```bash
npm install @demox-labs/aleo-wallet-adapter-base \
  @demox-labs/aleo-wallet-adapter-react \
  @demox-labs/aleo-wallet-adapter-reactui \
  @demox-labs/aleo-wallet-adapter-leo
```

## Project Structure

```
src/
├── main.tsx    # WalletProvider setup with NetworkContext
├── App.tsx     # Connect button, network modal, wallet display
└── index.css   # Styling
```

## How It Works

1. **WalletProvider** wraps the app and manages wallet state
2. User clicks "Connect Wallet" → network selection modal appears
3. User selects Mainnet or Testnet → clicks Connect
4. Leo Wallet extension popup requests approval
5. On success, the app displays the connected address

### Important: Network Matching

Your Leo Wallet extension must be set to the **same network** you select in the app:

| App Selection | Leo Wallet Setting |
|---------------|-------------------|
| Mainnet | Mainnet |
| Testnet | Testnet Beta |

Mismatched networks will result in a `NETWORK_NOT_GRANTED` error.

## ⚠️ Early Stage Tooling

Aleo mainnet launched in **September 2024**, making it a relatively new blockchain. As a result:

**Current limitations:**

- **No auto-detection of wallet network** - Unlike Ethereum wallets (MetaMask), the Leo Wallet adapter doesn't expose the wallet's current network to dApps. Users must manually ensure their wallet network matches the app.

- **Network enum quirks** - The `WalletAdapterNetwork` enum has legacy values (`Testnet` = "testnet3") that no longer work. Use `MainnetBeta` or `TestnetBeta`.

- **Limited wallet options** - Leo Wallet is the primary option, though Puzzle, Fox, and Soter wallets also exist.

- **Adapter packages in flux** - The `@demox-labs/aleo-wallet-adapter-*` packages are actively maintained but APIs may change.

- **Documentation gaps** - Official docs sometimes lag behind actual implementation. The connection flow parameters (DecryptPermission, network strings) aren't always clearly documented.

**What works well:**

- Basic connect/disconnect flow
- Message signing
- Record requests
- Transaction execution
- The `WalletMultiButton` component (if you want a simpler integration)

## Extending This Project

Once connected, you can use the `useWallet` hook to access:

```typescript
const { 
  publicKey,          // Connected wallet address
  signMessage,        // Sign arbitrary messages
  decrypt,            // Decrypt ciphertext
  requestRecords,     // Get records for a program
  requestTransaction, // Execute transactions
  requestDeploy,      // Deploy programs
} = useWallet();
```

## Resources

- [Leo Wallet Adapter Docs](https://docs.leo.app/aleo-wallet-adapter/)
- [Aleo Developer Docs](https://developer.aleo.org/)
- [Leo Wallet Extension](https://www.leo.app/)

## License

MIT
