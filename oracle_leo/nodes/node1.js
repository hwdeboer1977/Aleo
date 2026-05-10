// nodes/node1.js - Coordinator + Binance source
const express = require('express');
const { execSync } = require('child_process');

const app = express();
const PORT = 3001;
const SOURCE = 'binance';

require('dotenv').config({ path: __dirname + '/../.env' });
console.log('ORACLE_1_PRIVATE_KEY:', process.env.PRIVATE_KEY_2);


// Config
const NETWORK_URL = process.env.ENDPOINT || 'http://localhost:3030';
const NETWORK_NAME = process.env.NETWORK || 'testnet';
const PROGRAM_ID = 'oracle_leo_v1.aleo';
const ORACLE_PRIVATE_KEY = process.env.PRIVATE_KEY_2;

console.log(ORACLE_PRIVATE_KEY)

const FEED_ID = '1field'; // BTC/USD
const DEVIATION_THRESHOLD = 0.005; // 0.5%
const HEARTBEAT_SECONDS = 3600; // 1 hour

const NODE_URLS = {
  node2: 'http://localhost:3002',
  node3: 'http://localhost:3003'
};

// State
let lastSubmittedPrice = null;
let lastSubmittedTime = 0;
let currentRound = 0;

////////////////////////////////////////////////////////////
// PRICE FETCHING
////////////////////////////////////////////////////////////

async function fetchBinancePrice() {
  try {
    const res = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT');
    const data = await res.json();
    const price = parseFloat(data.price);
    return {
      source: SOURCE,
      price: price,
      price_e8: Math.round(price * 100000000),
      timestamp: Math.floor(Date.now() / 1000)
    };
  } catch (error) {
    console.error('Binance fetch error:', error.message);
    return null;
  }
}

async function fetchFromNode(url) {
  try {
    const res = await fetch(`${url}/price`, { timeout: 5000 });
    if (res.ok) {
      return await res.json();
    }
  } catch (error) {
    console.error(`Failed to fetch from ${url}:`, error.message);
  }
  return null;
}

async function collectAllPrices() {
  const prices = [];

  // Get own price (Binance)
  const binancePrice = await fetchBinancePrice();
  if (binancePrice) {
    prices.push(binancePrice);
    console.log(`  [binance]  $${binancePrice.price.toFixed(2)}`);
  }

  // Get from Node 2 (Coinbase)
  const coinbasePrice = await fetchFromNode(NODE_URLS.node2);
  if (coinbasePrice) {
    prices.push(coinbasePrice);
    console.log(`  [coinbase] $${coinbasePrice.price.toFixed(2)}`);
  }

  // Get from Node 3 (Kraken)
  const krakenPrice = await fetchFromNode(NODE_URLS.node3);
  if (krakenPrice) {
    prices.push(krakenPrice);
    console.log(`  [kraken]   $${krakenPrice.price.toFixed(2)}`);
  }

  return prices;
}

function computeMedian(prices) {
  if (prices.length === 0) return null;
  
  const sorted = [...prices].sort((a, b) => a.price - b.price);
  const mid = Math.floor(sorted.length / 2);
  
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1].price + sorted[mid].price) / 2;
  }
  return sorted[mid].price;
}

////////////////////////////////////////////////////////////
// ON-CHAIN INTERACTION
////////////////////////////////////////////////////////////

async function getLatestOnChainData() {
  try {
    const [roundRes, priceRes, timeRes] = await Promise.all([
      fetch(`${NETWORK_URL}/${NETWORK_NAME}/program/${PROGRAM_ID}/mapping/latest_round/${FEED_ID}`),
      fetch(`${NETWORK_URL}/${NETWORK_NAME}/program/${PROGRAM_ID}/mapping/latest_price_e8/${FEED_ID}`),
      fetch(`${NETWORK_URL}/${NETWORK_NAME}/program/${PROGRAM_ID}/mapping/latest_timestamp/${FEED_ID}`)
    ]);

    const roundText = await roundRes.text();
    const priceText = await priceRes.text();
    const timeText = await timeRes.text();

    const round = parseInt(roundText.match(/(\d+)u64/)?.[1] || '0');
    const priceE8 = BigInt(priceText.match(/(\d+)u128/)?.[1] || '0');
    const timestamp = parseInt(timeText.match(/(\d+)u64/)?.[1] || '0');

    return {
      round,
      priceE8,
      price: Number(priceE8) / 100000000,
      timestamp
    };
  } catch (error) {
    console.error('Failed to get on-chain data:', error.message);
    return { round: 0, priceE8: 0n, price: 0, timestamp: 0 };
  }
}

async function submitPrice(roundId, priceE8, timestamp) {
  console.log(`\n📤 Submitting price to chain...`);
  console.log(`   Round: ${roundId}`);
  console.log(`   Price: ${priceE8} ($${(priceE8 / 100000000).toFixed(2)})`);

  const cmd = `snarkos developer execute ${PROGRAM_ID} submit_price \
    "${FEED_ID}" \
    "${roundId}u64" \
    "${priceE8}u128" \
    "${timestamp}u64" \
    --private-key ${ORACLE_PRIVATE_KEY} \
    --query ${NETWORK_URL} \
    --broadcast "${NETWORK_URL}/${NETWORK_NAME}/transaction/broadcast" \
    --network 1`;

  try {
    const result = execSync(cmd, { 
      encoding: 'utf8', 
      timeout: 300000,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    const txId = result.match(/at1[a-z0-9]+/)?.[0];
    console.log(`✅ Submitted! TX: ${txId}`);
    return true;
  } catch (error) {
    console.error('❌ Submission failed:', error.message);
    return false;
  }
}

////////////////////////////////////////////////////////////
// COORDINATOR LOGIC
////////////////////////////////////////////////////////////

function shouldUpdate(newPrice, lastPrice, lastTime) {
  const now = Math.floor(Date.now() / 1000);

  // Heartbeat check
  if (now - lastTime >= HEARTBEAT_SECONDS) {
    console.log(`⏰ Heartbeat triggered (${HEARTBEAT_SECONDS}s elapsed)`);
    return true;
  }

  // Deviation check
  if (lastPrice > 0) {
    const deviation = Math.abs(newPrice - lastPrice) / lastPrice;
    if (deviation >= DEVIATION_THRESHOLD) {
      console.log(`📈 Deviation triggered (${(deviation * 100).toFixed(2)}% > ${DEVIATION_THRESHOLD * 100}%)`);
      return true;
    }
  } else {
    // No previous price, should update
    return true;
  }

  return false;
}

async function coordinatorLoop() {
  console.log('\n========================================');
  console.log(`🔄 Coordinator check at ${new Date().toISOString()}`);
  console.log('========================================');

  // 1. Collect prices from all nodes
  console.log('\n📊 Collecting prices...');
  const prices = await collectAllPrices();

  if (prices.length < 2) {
    console.log('⚠️  Not enough price sources (need at least 2)');
    return;
  }

  // 2. Compute median
  const medianPrice = computeMedian(prices);
  const medianPriceE8 = Math.round(medianPrice * 100000000);
  console.log(`\n📈 Median price: $${medianPrice.toFixed(2)}`);

  // 3. Get on-chain state
  const onChainData = await getLatestOnChainData();
  console.log(`\n🔗 On-chain state:`);
  console.log(`   Round: ${onChainData.round}`);
  console.log(`   Price: $${onChainData.price.toFixed(2)}`);
  console.log(`   Time: ${new Date(onChainData.timestamp * 1000).toISOString()}`);

  // 4. Check if update needed
  if (shouldUpdate(medianPrice, onChainData.price, onChainData.timestamp)) {
    const newRound = onChainData.round + 1;
    const timestamp = Math.floor(Date.now() / 1000);
    
    const success = await submitPrice(newRound, medianPriceE8, timestamp);
    
    if (success) {
      lastSubmittedPrice = medianPrice;
      lastSubmittedTime = timestamp;
      currentRound = newRound;
    }
  } else {
    console.log('\n✅ No update needed');
  }
}

////////////////////////////////////////////////////////////
// HTTP ENDPOINTS (for monitoring)
////////////////////////////////////////////////////////////

app.get('/price', async (req, res) => {
  const data = await fetchBinancePrice();
  if (data) {
    res.json(data);
  } else {
    res.status(500).json({ error: 'Failed to fetch price' });
  }
});

app.get('/status', async (req, res) => {
  const onChainData = await getLatestOnChainData();
  const prices = await collectAllPrices();
  const median = computeMedian(prices);

  res.json({
    coordinator: true,
    source: SOURCE,
    currentMedian: median,
    onChain: onChainData,
    lastSubmitted: {
      price: lastSubmittedPrice,
      time: lastSubmittedTime,
      round: currentRound
    },
    config: {
      deviationThreshold: DEVIATION_THRESHOLD,
      heartbeatSeconds: HEARTBEAT_SECONDS
    }
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', source: SOURCE, coordinator: true });
});

////////////////////////////////////////////////////////////
// STARTUP
////////////////////////////////////////////////////////////

async function main() {
  console.log('🚀 Starting Oracle Coordinator (Node 1)');
  console.log(`   Source: ${SOURCE}`);
  console.log(`   Program: ${PROGRAM_ID}`);
  console.log(`   Network: ${NETWORK_URL}`);
  console.log(`   Deviation: ${DEVIATION_THRESHOLD * 100}%`);
  console.log(`   Heartbeat: ${HEARTBEAT_SECONDS}s`);

  // Start HTTP server
  app.listen(PORT, () => {
    console.log(`\n📡 HTTP server on port ${PORT}`);
    console.log(`   GET /price  - Current Binance price`);
    console.log(`   GET /status - Full coordinator status`);
  });

  // Initial check
  await coordinatorLoop();

  // Run coordinator loop every 30 seconds
  setInterval(coordinatorLoop, 30000);
}

main().catch(console.error);