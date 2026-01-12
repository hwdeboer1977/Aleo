import { useWallet } from "@demox-labs/aleo-wallet-adapter-react";
import { WalletAdapterNetwork, WalletReadyState } from "@demox-labs/aleo-wallet-adapter-base";
import { useContext, useState, useMemo, useEffect } from "react";
import { NetworkContext } from "./main";

export default function App() {
  const { wallets, select, connect, disconnect, connected, publicKey, wallet } = useWallet();
  const { network, setNetwork } = useContext(NetworkContext);
  
  const [showModal, setShowModal] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState<WalletAdapterNetwork>(network);
  const [connecting, setConnecting] = useState(false);

  const leoWallet = useMemo(
    () => wallets.find((w) => w.readyState === WalletReadyState.Installed) ?? wallets[0],
    [wallets]
  );

  // Handle connection after network is set
  useEffect(() => {
    if (connecting && wallet) {
      connect()
        .then(() => setShowModal(false))
        .catch(console.error)
        .finally(() => setConnecting(false));
    }
  }, [wallet, connecting, connect]);

  const handleConnect = () => {
    setShowModal(true);
  };

  const handleNetworkSelect = (net: WalletAdapterNetwork) => {
    setSelectedNetwork(net);
  };

  const handleConfirmConnect = () => {
    if (!leoWallet) return;
    
    // Update network in context (this will re-render WalletProvider)
    setNetwork(selectedNetwork);
    
    // Small delay to let the provider update, then connect
    setTimeout(() => {
      setConnecting(true);
      select(leoWallet.adapter.name);
    }, 100);
  };

  const handleDisconnect = async () => {
    await disconnect();
  };

  return (
    <div style={{ padding: 24, fontFamily: "system-ui" }}>
      <h2>Leo Wallet Connect (Aleo)</h2>

      {!connected ? (
        <button onClick={handleConnect} className="connect-btn">
          Connect Wallet
        </button>
      ) : (
        <div>
          <div className="connected-info">
            <span className="network-badge">{network === WalletAdapterNetwork.MainnetBeta ? "Mainnet" : "Testnet"}</span>
            <code className="address">{publicKey?.slice(0, 12)}...{publicKey?.slice(-6)}</code>
            <button onClick={handleDisconnect} className="disconnect-btn">
              Disconnect
            </button>
          </div>
        </div>
      )}

      <div style={{ marginTop: 24 }}>
        <div>Connected: {String(connected)}</div>
        <div style={{ marginTop: 8 }}>
          Public key: <code>{publicKey ?? "—"}</code>
        </div>
      </div>

      {/* Network Selection Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Select Network</h3>
            <p className="modal-subtitle">Choose which network to connect to</p>
            
            <div className="network-options">
              <button
                className={`network-option ${selectedNetwork === WalletAdapterNetwork.MainnetBeta ? "selected" : ""}`}
                onClick={() => handleNetworkSelect(WalletAdapterNetwork.MainnetBeta)}
              >
                <span className="network-icon">🌐</span>
                <span className="network-name">Mainnet</span>
                <span className="network-desc">Production network</span>
              </button>
              
              <button
                className={`network-option ${selectedNetwork === WalletAdapterNetwork.TestnetBeta ? "selected" : ""}`}
                onClick={() => handleNetworkSelect(WalletAdapterNetwork.TestnetBeta)}
              >
                <span className="network-icon">🧪</span>
                <span className="network-name">Testnet</span>
                <span className="network-desc">Testing network</span>
              </button>
            </div>

            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button 
                className="confirm-btn" 
                onClick={handleConfirmConnect}
                disabled={connecting || !leoWallet}
              >
                {connecting ? "Connecting..." : "Connect"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
