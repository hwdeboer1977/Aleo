import { useWallet } from "@demox-labs/aleo-wallet-adapter-react";
import { 
  WalletAdapterNetwork, 
  WalletReadyState,
  Transaction,
  WalletNotConnectedError 
} from "@demox-labs/aleo-wallet-adapter-base";
import { useContext, useState, useMemo, useEffect } from "react";
import { NetworkContext } from "./main";

export default function App() {
  const { 
    wallets, 
    select, 
    connect, 
    disconnect, 
    connected, 
    publicKey, 
    wallet,
    requestTransaction,
    transactionStatus 
  } = useWallet();
  
  const { network, setNetwork } = useContext(NetworkContext);
  
  const [showModal, setShowModal] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState<WalletAdapterNetwork>(network);
  const [connecting, setConnecting] = useState(false);

  // Transaction state
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [txId, setTxId] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<string | null>(null);
  const [txLoading, setTxLoading] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);

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
    
    setNetwork(selectedNetwork);
    
    setTimeout(() => {
      setConnecting(true);
      select(leoWallet.adapter.name);
    }, 100);
  };

  const handleDisconnect = async () => {
    await disconnect();
    setTxId(null);
    setTxStatus(null);
  };

  // Transfer credits transaction
  const handleTransfer = async () => {
    if (!publicKey) throw new WalletNotConnectedError();
    if (!requestTransaction) {
      setTxError("Transaction not supported");
      return;
    }

    // Validate inputs
    if (!recipient.startsWith("aleo1") || recipient.length !== 63) {
      setTxError("Invalid recipient address. Must be an Aleo address (aleo1...)");
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setTxError("Invalid amount");
      return;
    }

    setTxLoading(true);
    setTxError(null);
    setTxId(null);
    setTxStatus(null);

    try {
      // Convert to microcredits (1 ALEO = 1,000,000 microcredits)
      const microcredits = Math.floor(amountNum * 1_000_000);
      
      // Create the transaction
      // transfer_public is the simplest - transfers from public balance
      const tx = Transaction.createTransaction(
        publicKey,
        network,
        "credits.aleo",
        "transfer_public",
        [recipient, `${microcredits}u64`],
        Math.floor(microcredits * 0.01) + 10000 // Fee estimate: ~1% + base fee
      );

      console.log("Submitting transaction:", tx);
      
      // Request the transaction - this will open Leo Wallet for approval
      const txIdResult = await requestTransaction(tx);
      setTxId(txIdResult);
      setTxStatus("Submitted - waiting for confirmation...");
      
      console.log("Transaction submitted:", txIdResult);

    } catch (err: any) {
      console.error("Transaction error:", err);
      setTxError(err.message || "Transaction failed");
    } finally {
      setTxLoading(false);
    }
  };

  // Check transaction status
  const checkStatus = async () => {
    if (!txId || !transactionStatus) return;
    
    try {
      const status = await transactionStatus(txId);
      setTxStatus(status);
      console.log("Transaction status:", status);
    } catch (err: any) {
      console.error("Status check error:", err);
      setTxStatus("Status check failed: " + err.message);
    }
  };

  return (
    <div style={{ padding: 24, fontFamily: "system-ui", maxWidth: 600, margin: "0 auto" }}>
      <h2>Leo Wallet Connect (Aleo)</h2>

      {!connected ? (
        <button onClick={handleConnect} className="connect-btn">
          Connect Wallet
        </button>
      ) : (
        <div>
          <div className="connected-info">
            <span className="network-badge">
              {network === WalletAdapterNetwork.MainnetBeta ? "Mainnet" : "Testnet"}
            </span>
            <code className="address">{publicKey?.slice(0, 12)}...{publicKey?.slice(-6)}</code>
            <button onClick={handleDisconnect} className="disconnect-btn">
              Disconnect
            </button>
          </div>

          {/* Transaction Section */}
          <div className="tx-section">
            <h3>Transfer ALEO</h3>
            <p className="tx-subtitle">Send a public transfer to another address</p>
            
            <div className="input-group">
              <label>Recipient Address</label>
              <input
                type="text"
                placeholder="aleo1..."
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="tx-input"
              />
            </div>

            <div className="input-group">
              <label>Amount (ALEO)</label>
              <input
                type="number"
                placeholder="0.1"
                step="0.000001"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="tx-input"
              />
            </div>

            <button 
              onClick={handleTransfer} 
              disabled={txLoading || !recipient || !amount}
              className="tx-btn"
            >
              {txLoading ? "Submitting..." : "Send Transfer"}
            </button>

            {txError && (
              <div className="tx-error">
                ❌ {txError}
              </div>
            )}

            {txId && (
              <div className="tx-result">
                <div className="tx-id">
                  <strong>Transaction ID:</strong>
                  <code>{txId}</code>
                </div>
                <div className="tx-status">
                  <strong>Status:</strong> {txStatus || "Unknown"}
                </div>
                <button onClick={checkStatus} className="status-btn">
                  Refresh Status
                </button>
              </div>
            )}
          </div>
        </div>
      )}

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
