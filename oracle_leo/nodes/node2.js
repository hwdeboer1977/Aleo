// nodes/node2.js - Coinbase price source
const express = require('express');
const app = express();

const PORT = 3002;
const SOURCE = 'coinbase';

async function fetchPrice() {
  try {
    const res = await fetch('https://api.coinbase.com/v2/prices/BTC-USD/spot');
    const data = await res.json();
    const price = parseFloat(data.data.amount);
    return {
      source: SOURCE,
      price: price,
      price_e8: Math.round(price * 100000000),
      timestamp: Math.floor(Date.now() / 1000)
    };
  } catch (error) {
    console.error('Coinbase fetch error:', error.message);
    return null;
  }
}

app.get('/price', async (req, res) => {
  const data = await fetchPrice();
  if (data) {
    console.log(`[${SOURCE}] BTC/USD: $${data.price.toFixed(2)}`);
    res.json(data);
  } else {
    res.status(500).json({ error: 'Failed to fetch price' });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', source: SOURCE });
});

app.listen(PORT, () => {
  console.log(`Node 2 (${SOURCE}) running on port ${PORT}`);
});