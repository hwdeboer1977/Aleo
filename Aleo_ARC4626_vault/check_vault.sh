#!/bin/bash

# To run:
# chmod +x check_vault.sh

# USAGE:
#./check_vault.sh                # Show state
#./check_vault.sh deposit 1000000  # Deposit 1M
#./check_vault.sh redeem          # Redeem all shares





ENDPOINT="http://localhost:3030"
PROGRAM="arc4626_vault.aleo"
ADDR="aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px"
OFFSET=1000000
CONSENSUS="--consensus-heights 0,1,2,3,4,5,6,7,8,9,10,11"
NETWORK="--network testnet --broadcast"

# Fetch current state
fetch_state() {
    ta=$(curl -s "$ENDPOINT/testnet/program/$PROGRAM/mapping/total_assets/0u8" | sed 's/"//g; s/u128//')
    ts=$(curl -s "$ENDPOINT/testnet/program/$PROGRAM/mapping/total_shares/0u8" | sed 's/"//g; s/u128//')
    shares=$(curl -s "$ENDPOINT/testnet/program/$PROGRAM/mapping/share_balances/$ADDR" | sed 's/"//g; s/u128//')
    ta=${ta:-0}
    ts=${ts:-0}
    shares=${shares:-0}
}

show_state() {
    fetch_state
    echo "=== Vault State ==="
    echo "Total Assets: $ta"
    echo "Total Shares (raw): $ts"
    echo "Total Shares (display): $(echo "scale=0; $ts / $OFFSET" | bc)"
    echo "Your Shares (raw): $shares"
    echo "Your Shares (display): $(echo "scale=0; $shares / $OFFSET" | bc)"
    echo "Share Price: $(echo "scale=6; ($ta + 1) * $OFFSET / ($ts + $OFFSET)" | bc)"
    echo "Your Value: $(echo "scale=6; $shares * ($ta + 1) / ($ts + $OFFSET)" | bc)"
}

deposit() {
    amount=$1
    echo "Depositing $amount..."
    cd ~/leo_projects/arc4626_vault
    leo execute deposit ${amount}u128 $NETWORK $CONSENSUS
    sleep 3
    show_state
}

redeem_all() {
    fetch_state
    if [ "$shares" -gt 0 ] 2>/dev/null; then
        assets=$(echo "($shares * ($ta + 1)) / ($ts + $OFFSET)" | bc)
        echo "Redeeming $shares shares for $assets assets..."
        cd ~/leo_projects/arc4626_vault
        leo execute redeem ${shares}u128 ${assets}u128 $NETWORK $CONSENSUS
        sleep 3
        show_state
    else
        echo "No shares to redeem"
    fi
}

case "$1" in
    deposit)
        deposit $2
        ;;
    redeem)
        redeem_all
        ;;
    *)
        show_state
        echo ""
        echo "=== Commands ==="
        echo "./check_vault.sh deposit <amount>  - Deposit assets"
        echo "./check_vault.sh redeem            - Redeem all shares"
        ;;
esac