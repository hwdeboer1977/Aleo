# Aleo Wallet Connector

A standalone React app for connecting to Aleo wallets using the [Aleo Wallet Adapter](https://aleo-dev-toolkit-documentation.vercel.app/docs/wallet-adapter) by Provable.

![Connected State](./screenshots/connected.png)

## Supported Wallets

- **Shield Wallet**
- **Leo Wallet**
- **Puzzle Wallet**
- **Fox Wallet**
- **Soter Wallet**

## Features

- Connect/disconnect wallets via the built-in wallet modal
- View connection info (wallet name, network, address)
- Sign messages
- Execute transactions (with Shield Wallet approval flow)
- Auto-connect on page reload

## Getting Started

### Prerequisites

- Node.js 18+
- One of the supported wallet browser extensions installed

### Installation

```bash
npm install --legacy-peer-deps
```

> **Note:** The `--legacy-peer-deps` flag is required because the Aleo wallet adapter packages currently target React 18, while Vite scaffolds with React 19. Everything works fine with this flag.

### Development

```bash
npm run dev
```

Opens at [http://localhost:5173](http://localhost:5173).

### Build

```bash
npm run build
```

Output goes to `dist/`.

## Project Structure

```
src/
├── App.tsx       # Main app — wallet providers, connection UI, actions
├── App.css       # Styling (dark theme)
├── main.tsx      # Entry point
└── index.css     # Global resets
```

## Configuration

The app is configured for **Testnet** by default. To change the network or other settings, edit the `AleoWalletProvider` props in `App.tsx`:

```tsx
<AleoWalletProvider
  wallets={wallets}
  network={Network.MAINNET}          // or Network.TESTNET, Network.CANARY
  decryptPermission={DecryptPermission.UponRequest}
  autoConnect={true}
/>
```

### Adding/Removing Wallets

Edit the `wallets` array in `App.tsx`:

```tsx
const wallets = [
  new ShieldWalletAdapter(),
  new LeoWalletAdapter(),
  // remove or add adapters as needed
];
```

## Dependencies

| Package | Purpose |
|---------|---------|
| `@provablehq/aleo-wallet-adaptor-react` | React context & hooks |
| `@provablehq/aleo-wallet-adaptor-react-ui` | Connect modal & button components |
| `@provablehq/aleo-wallet-adaptor-core` | Core types & errors |
| `@provablehq/aleo-wallet-standard` | Wallet standard interface |
| `@provablehq/aleo-types` | Aleo network & transaction types |
| `@provablehq/aleo-wallet-adaptor-shield` | Shield Wallet adapter |
| `@provablehq/aleo-wallet-adaptor-leo` | Leo Wallet adapter |
| `@provablehq/aleo-wallet-adaptor-puzzle` | Puzzle Wallet adapter |
| `@provablehq/aleo-wallet-adaptor-fox` | Fox Wallet adapter |
| `@provablehq/aleo-wallet-adaptor-soter` | Soter Wallet adapter |

## Resources

- [Aleo Wallet Adapter Docs](https://aleo-dev-toolkit-documentation.vercel.app/docs/wallet-adapter)
- [Demo App](https://aleo-dev-toolkit-react-app.vercel.app/)
- [GitHub — Aleo Dev Toolkit](https://github.com/ProvableHQ/aleo-dev-toolkit)

## License

MIT
