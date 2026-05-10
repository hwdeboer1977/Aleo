// TESTNET
// 1. leo build
// 2. leo deploy --network testnet --broadcast
// 3. leo execute authorize_issuer "aleo1d9es6d8kuzg65dlfdpx9zxchcsarh8k0hwxfx5eg6k4w7ew6gs8sv5aza0" --network testnet --broadcast
// 4. leo execute whitelist_merchant "aleo1d9es6d8kuzg65dlfdpx9zxchcsarh8k0hwxfx5eg6k4w7ew6gs8sv5aza0" --network testnet --broadcast
// 5. leo execute issue_aid "aleo122uq924daywh5h5r3feuk2hjsa6j6w47kp79zeudhnmq5dqf8grsqgx28a" 1000u64 0u8 --network testnet --broadcast

// Make sure you authorize the bulk program to as an issuer!!
https://testnet.explorer.provable.com/program/bulk_issue_16.aleo

leo execute bulk_issue \
  "[
    10000000u64,
    10000000u64,
    10000000u64,
    10000000u64,
    10000000u64,
    10000000u64,
    10000000u64,
    10000000u64,
    10000000u64,
    10000000u64,
    10000000u64,
    10000000u64,
    10000000u64,
    10000000u64,
    10000000u64,
    10000000u64
  ]" \
  "[
    aleo1d9es6d8kuzg65dlfdpx9zxchcsarh8k0hwxfx5eg6k4w7ew6gs8sv5aza0,
    aleo1g0myvqrwdt32erjz0y32k59hwu8xe9sd2yvy2aysasej39m5lvgqe6hscp,
    aleo1d9es6d8kuzg65dlfdpx9zxchcsarh8k0hwxfx5eg6k4w7ew6gs8sv5aza0,
    aleo1g0myvqrwdt32erjz0y32k59hwu8xe9sd2yvy2aysasej39m5lvgqe6hscp,
    aleo1d9es6d8kuzg65dlfdpx9zxchcsarh8k0hwxfx5eg6k4w7ew6gs8sv5aza0,
    aleo1g0myvqrwdt32erjz0y32k59hwu8xe9sd2yvy2aysasej39m5lvgqe6hscp,
    aleo1d9es6d8kuzg65dlfdpx9zxchcsarh8k0hwxfx5eg6k4w7ew6gs8sv5aza0,
    aleo1g0myvqrwdt32erjz0y32k59hwu8xe9sd2yvy2aysasej39m5lvgqe6hscp,
    aleo1d9es6d8kuzg65dlfdpx9zxchcsarh8k0hwxfx5eg6k4w7ew6gs8sv5aza0,
    aleo1g0myvqrwdt32erjz0y32k59hwu8xe9sd2yvy2aysasej39m5lvgqe6hscp,
    aleo1d9es6d8kuzg65dlfdpx9zxchcsarh8k0hwxfx5eg6k4w7ew6gs8sv5aza0,
    aleo1g0myvqrwdt32erjz0y32k59hwu8xe9sd2yvy2aysasej39m5lvgqe6hscp,
    aleo1d9es6d8kuzg65dlfdpx9zxchcsarh8k0hwxfx5eg6k4w7ew6gs8sv5aza0,
    aleo1g0myvqrwdt32erjz0y32k59hwu8xe9sd2yvy2aysasej39m5lvgqe6hscp,
    aleo1d9es6d8kuzg65dlfdpx9zxchcsarh8k0hwxfx5eg6k4w7ew6gs8sv5aza0,
    aleo1g0myvqrwdt32erjz0y32k59hwu8xe9sd2yvy2aysasej39m5lvgqe6hscp
  ]" \
  0u8 \
  --network testnet \
  --broadcast
