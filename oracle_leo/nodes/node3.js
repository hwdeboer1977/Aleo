// nodes/node3.js - Kraken price source
const express = require('express');
const app = express();

const PORT = 3003;
const SOURCE = 'kraken';

async function fetchPrice() {
  try {
    const res = await fetch('https://api.kraken.com/0/public/Ticker?pair=XBTUSD');
    const data = await res.json();
    const price = parseFloat(data.result.XXBTZUSD.c[0]);
    return {
      source: SOURCE,
      price: price,
      price_e8: Math.round(price * 100000000),
      timestamp: Math.floor(Date.now() / 1000)
    };
  } catch (error) {
    console.error('Kraken fetch error:', error.message);
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
  console.log(`Node 3 (${SOURCE}) running on port ${PORT}`);
});