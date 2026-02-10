import React, { FC, useCallback, useState } from 'react';
import { AleoWalletProvider, useWallet } from '@provablehq/aleo-wallet-adaptor-react';
import { WalletModalProvider, WalletMultiButton } from '@provablehq/aleo-wallet-adaptor-react-ui';
import { ShieldWalletAdapter } from '@provablehq/aleo-wallet-adaptor-shield';
import { LeoWalletAdapter } from '@provablehq/aleo-wallet-adaptor-leo';
import { PuzzleWalletAdapter } from '@provablehq/aleo-wallet-adaptor-puzzle';
import { FoxWalletAdapter } from '@provablehq/aleo-wallet-adaptor-fox';
import { SoterWalletAdapter } from '@provablehq/aleo-wallet-adaptor-soter';
import { Network } from '@provablehq/aleo-types';
import { DecryptPermission, WalletNotConnectedError } from '@provablehq/aleo-wallet-adaptor-core';
import type { TransactionOptions } from '@provablehq/aleo-types';
import '@provablehq/aleo-wallet-adaptor-react-ui/dist/styles.css';
import './App.css';

const wallets = [
  new ShieldWalletAdapter(),
  new LeoWalletAdapter(),
  new PuzzleWalletAdapter(),
  new FoxWalletAdapter(),
  new SoterWalletAdapter(),
];

function WalletApp() {
  const {
    address,
    connected,
    wallet,
    network,
    executeTransaction,
    transactionStatus,
    signMessage,
    disconnect,
  } = useWallet();

  const [txId, setTxId] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');

  const handleSignMessage = useCallback(async () => {
    if (!connected || !address) throw new WalletNotConnectedError();
    setStatus('Signing message...');
    try {
      const sig = await signMessage('Hello, Aleo!');
      setSignature(new TextDecoder().decode(sig));
      setStatus('Message signed!');
    } catch (error) {
      console.error('Sign failed:', error);
      setStatus(`Sign failed: ${error}`);
    }
  }, [address, signMessage, connected]);

  const handleTransaction = useCallback(async () => {
    if (!connected || !address) throw new WalletNotConnectedError();
    setStatus('Executing transaction...');
    const options: TransactionOptions = {
      program: 'credits.aleo',
      function: 'transfer_public',
      inputs: ['aleo1...', '100u64'],
      fee: 100000,
    };
    try {
      const result = await executeTransaction(options);
      if (result?.transactionId) {
        setTxId(result.transactionId);
        setStatus(`Transaction submitted: ${result.transactionId}`);
        const statusRes = await transactionStatus(result.transactionId);
        setStatus(`Transaction status: ${statusRes.status}`);
      }
    } catch (error) {
      console.error('Transaction failed:', error);
      setStatus(`Transaction failed: ${error}`);
    }
  }, [connected, address, executeTransaction, transactionStatus]);

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <h1>Aleo Wallet Connector</h1>
          <WalletMultiButton />
        </div>
      </header>

      <main className="app-main">
        {!connected ? (
          <div className="connect-prompt">
            <div className="prompt-icon">🔗</div>
            <h2>Connect Your Wallet</h2>
            <p>
              Click <strong>Connect Wallet</strong> above to get started.
              <br />
              Supports Shield, Leo, Puzzle, Fox &amp; Soter wallets.
            </p>
          </div>
        ) : (
          <div className="wallet-dashboard">
            <div className="info-card">
              <h3>Connection Info</h3>
              <div className="info-row">
                <span className="label">Status</span>
                <span className="value connected"><span className="dot" /> Connected</span>
              </div>
              <div className="info-row">
                <span className="label">Wallet</span>
                <span className="value">{wallet?.adapter.name ?? 'Unknown'}</span>
              </div>
              <div className="info-row">
                <span className="label">Network</span>
                <span className="value">{network ?? 'Unknown'}</span>
              </div>
              <div className="info-row">
                <span className="label">Address</span>
                <span className="value address" title={address ?? ''}>{address}</span>
              </div>
            </div>

            <div className="actions-card">
              <h3>Actions</h3>
              <div className="actions-grid">
                <button onClick={handleSignMessage} className="action-btn sign">✍️ Sign Message</button>
                <button onClick={handleTransaction} className="action-btn tx">📡 Execute Transaction</button>
                <button onClick={() => disconnect()} className="action-btn disconnect">🔌 Disconnect</button>
              </div>
            </div>

            {status && (
              <div className="status-card">
                <h3>Status</h3>
                <p className="status-text">{status}</p>
              </div>
            )}

            {signature && (
              <div className="result-card">
                <h3>Signature</h3>
                <pre className="result-pre">{signature}</pre>
              </div>
            )}

            {txId && (
              <div className="result-card">
                <h3>Transaction ID</h3>
                <pre className="result-pre">{txId}</pre>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

const App: FC = () => {
  return (
    <AleoWalletProvider
      wallets={wallets}
      network={Network.TESTNET}
      decryptPermission={DecryptPermission.UponRequest}
      autoConnect={true}
      onError={(error) => console.error('Wallet error:', error)}
    >
      <WalletModalProvider>
        <WalletApp />
      </WalletModalProvider>
    </AleoWalletProvider>
  );
};

export default App;
