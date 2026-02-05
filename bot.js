import Alpaca from '@alpacahq/alpaca-trade-api';
import fetch from 'node-fetch';

// ⚙️ Configure API (paper trading)
const alpaca = new Alpaca({
  keyId: process.env.APCA_API_KEY_ID,
  secretKey: process.env.APCA_API_SECRET_KEY,
  paper: true,   // paper trading mode
  usePolygon: false
});

// Your stock symbol
const SYMBOL = 'AAPL';

// Thresholds
const STOP_LOSS = 0.90;   // -10%
const TAKE_PROFIT = 1.50; // +50%

let buyPrice = null;

// Buy a share once
async function buyStock() {
  const current = await alpaca.lastQuote(SYMBOL);
  buyPrice = current.askprice;
  console.log(`Bought ${SYMBOL} at $${buyPrice}`);
  await alpaca.createOrder({
    symbol: SYMBOL,
    qty: 1,
    side: 'buy',
    type: 'market',
    time_in_force: 'gtc'
  });
}

// Check price every minute
async function monitor() {
  if (!buyPrice) return;

  const quote = await alpaca.lastQuote(SYMBOL);
  const price = quote.askprice;
  const change = price / buyPrice;

  console.log(`Price: $${price} (${((change - 1) * 100).toFixed(2)}%)`);

  if (change <= STOP_LOSS || change >= TAKE_PROFIT) {
    console.log(`Threshold met — selling at $${price}`);
    await alpaca.createOrder({
      symbol: SYMBOL,
      qty: 1,
      side: 'sell',
      type: 'market',
      time_in_force: 'gtc'
    });
    return;
  }
}

// Start
(async () => {
  await buyStock();
  setInterval(monitor, 60 * 1000); // check every minute
})();
