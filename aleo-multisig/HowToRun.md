# 1. Clone the repo
git clone https://github.com/AleoNet/aleo-multisig.git
cd aleo-multisig

# 2. Update the DEPLOYER_ADDRESS
This is critical. 

# 3. Start local devnet
leo devnet --snarkos $(which snarkos) --snarkos-features test_network --consensus-heights 0,1,2,3,4,5,6,7,8,9,10,11 --clear-storage

# 4. Deploy multisig_wallet
cd programs/multisig_wallet
leo deploy --broadcast --consensus-heights 0,1,2,3,4,5,6,7,8,9,10,11

# 5. Initialize
# Here we initialize the address authorized to deploy future upgrades to the multisig_core.aleo
# The false means open mode: anyone can call create_wallet to create a new multisig wallet without needing prior authorization.
leo execute --broadcast --consensus-heights 0,1,2,3,4,5,6,7,8,9,10,11 --yes multisig_core.aleo/init aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px false


# 6. Create multisig wallet
# This creates a 2-of-2 multisig wallet where:
# Signer 1: aleo1rhgdu77... (your main key)
# Signer 2: aleo1s3ws5tr... (your second key)
# Threshold: 2 (both must sign)
leo execute --broadcast --consensus-heights 0,1,2,3,4,5,6,7,8,9,10,11 --yes multisig_core.aleo/create_wallet \
  aleo1d9es6d8kuzg65dlfdpx9zxchcsarh8k0hwxfx5eg6k4w7ew6gs8sv5aza0 \
  2u8 \
  '[aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px, aleo1s3ws5tra87fjycnjrwsjcrnw2qxr8jfqqdugnf0xzqqw29q9m5pqem2u4t, aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc, aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc]' \
  '[[0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8],[0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8],[0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8],[0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8]]'

# 7. Fund multisig wallet
leo execute --broadcast --consensus-heights 0,1,2,3,4,5,6,7,8,9,10,11 --yes multisig_wallet.aleo/deposit_public_aleo_credits \
  aleo1d9es6d8kuzg65dlfdpx9zxchcsarh8k0hwxfx5eg6k4w7ew6gs8sv5aza0\
  1000u128

# public credit transfer: 3 phases

# Phase 1: sign with wallet 1
leo execute --broadcast --consensus-heights 0,1,2,3,4,5,6,7,8,9,10,11 --yes multisig_wallet.aleo/init_public_transfer \
  aleo1d9es6d8kuzg65dlfdpx9zxchcsarh8k0hwxfx5eg6k4w7ew6gs8sv5aza0 \
  1field \
  100u32 \
  '{ token_id: 3443843282313283355522573239085696902919850365217539366784739393210722344986field, destination: aleo1s3ws5tra87fjycnjrwsjcrnw2qxr8jfqqdugnf0xzqqw29q9m5pqem2u4t, amount: 50u128 }'

# Phase 2: sign with wallet 2
leo execute --broadcast --consensus-heights 0,1,2,3,4,5,6,7,8,9,10,11 --yes multisig_core.aleo/sign \
  aleo1d9es6d8kuzg65dlfdpx9zxchcsarh8k0hwxfx5eg6k4w7ew6gs8sv5aza0 \
  1field \
  --private-key APrivateKey1zkp2RWGDcde3efb89rjhME1VYA8QMxcxep5DShNBR6n8Yjh

# Phase 3: execute
leo execute --broadcast --consensus-heights 0,1,2,3,4,5,6,7,8,9,10,11 --yes multisig_wallet.aleo/exec_public_credits_transfer \
  aleo1d9es6d8kuzg65dlfdpx9zxchcsarh8k0hwxfx5eg6k4w7ew6gs8sv5aza0 \
  1field \
  '{ token_id: 3443843282313283355522573239085696902919850365217539366784739393210722344986field, destination: aleo1s3ws5tra87fjycnjrwsjcrnw2qxr8jfqqdugnf0xzqqw29q9m5pqem2u4t, amount: 50u128 }'