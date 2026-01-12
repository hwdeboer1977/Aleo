import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";

import { WalletProvider } from "@demox-labs/aleo-wallet-adapter-react";
import { WalletModalProvider } from "@demox-labs/aleo-wallet-adapter-reactui";
import { LeoWalletAdapter } from "@demox-labs/aleo-wallet-adapter-leo";
import { DecryptPermission, WalletAdapterNetwork } from "@demox-labs/aleo-wallet-adapter-base";

import "@demox-labs/aleo-wallet-adapter-reactui/styles.css";
import "./index.css";

const wallets = [new LeoWalletAdapter({ appName: "Aleo React Demo" })];

export const NetworkContext = React.createContext<{
  network: WalletAdapterNetwork;
  setNetwork: (n: WalletAdapterNetwork) => void;
}>({ network: WalletAdapterNetwork.MainnetBeta, setNetwork: () => {} });

function Root() {
  const [network, setNetwork] = React.useState<WalletAdapterNetwork>(
    WalletAdapterNetwork.MainnetBeta
  );

  return (
    <React.StrictMode>
      <NetworkContext.Provider value={{ network, setNetwork }}>
        <WalletProvider
          wallets={wallets}
          decryptPermission={DecryptPermission.UponRequest}
          network={network}
          autoConnect={false}
        >
          <WalletModalProvider>
            <App />
          </WalletModalProvider>
        </WalletProvider>
      </NetworkContext.Provider>
    </React.StrictMode>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(<Root />);
