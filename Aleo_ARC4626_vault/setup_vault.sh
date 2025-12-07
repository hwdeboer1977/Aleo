#!/bin/bash
set -e

# HOW TO RUN?

# Terminal 1: Start devnet
# leo devnet --snarkos $(which snarkos) --snarkos-features test_network --consensus-heights 0,1,2,3,4,5,6,7,8,9,10,11 --clear-storage 

# Terminal 2: Run setup
# chmod +x setup_vault.sh
# ./setup_vault.sh

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
leo deploy $NETWORK $CONSENSUS --yes
sleep 3

echo "=== 2. Deploying vault ==="
cd ~/leo_projects/arc4626_vault
leo deploy $NETWORK $CONSENSUS --yes
sleep 3

echo "=== 3. Minting tokens ==="
cd ~/leo_projects/mock_usdc
leo execute mint_public $ADDR 2000000000u128 $NETWORK $CONSENSUS --yes
sleep 3

echo "=== 4. Approving vault ==="
leo execute approve arc4626_vault.aleo 2000000000u128 $NETWORK $CONSENSUS --yes
sleep 3

echo "=== 5. Depositing ==="
cd ~/leo_projects/arc4626_vault
leo execute deposit 1000000u128 $NETWORK $CONSENSUS --yes
sleep 3

echo "=== 6. Adding yield ==="
leo execute add_yield 500000u128 $NETWORK $CONSENSUS --yes
sleep 3

echo "=== Done! Checking state ==="
./check_vault.sh