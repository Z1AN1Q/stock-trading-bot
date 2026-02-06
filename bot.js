import Alpaca from "@alpacahq/alpaca-trade-api";

// ---------------- CONFIG ----------------
const SYMBOL = "AAPL";
const QTY = 1;

const STOP_LOSS = 0.90;   // -10%
const TAKE_PROFIT = 1.50; // +50%

// ----------------------------------------

const alpaca = new Alpaca({
  keyId: process.env.APCA_API_KEY_ID,
  secretKey: process.env.APCA_API_SECRET_KEY,
  paper: true
});

let buyPrice = null;
let hasSold = false;

// Buy stock once
async function buyStock() {
  const quote = await alpaca.lastQuote(SYMBOL);
  buyPrice = quote.askprice;

  console.log(`Buying ${SYMBOL} at $${buyPrice}`);

  await alpaca.createOrder({
    symbol: SYMBOL,
    qty: QTY,
    side: "buy",
    type: "market",
    time_in_force: "gtc"
  });
}

// Monitor price
async function monitor() {
  if (!buyPrice || hasSold) return;

  const quote = await alpaca.lastQuote(SYMBOL);
  const price = quote.askprice;
  const percentChange = ((price - buyPrice) / buyPrice) * 100;

  console.log(
    `${SYMBOL} | Price: $${price.toFixed(2)} | Change: ${percentChange.toFixed(2)}%`
  );

  if (price <= buyPrice * STOP_LOSS) {
    console.log("STOP LOSS hit — selling");
    await sellStock(price);
  }

  if (price >= buyPrice * TAKE_PROFIT) {
    console.log("TAKE PROFIT hit — selling");
    await sellStock(price);
  }
}

// Sell stock
async function sellStock(price) {
  await alpaca.createOrder({
    symbol: SYMBOL,
    qty: QTY,
    side: "sell",
    type: "market",
    time_in_force: "gtc"
  });

  hasSold = true;

  console.log(`Sold ${SYMBOL} at $${price.toFixed(2)}`);
  console.log("Bot will stay alive but stop trading.");
}

// ---------------- START BOT ----------------
(async () => {
  console.log("Bot starting...");

  await buyStock();

  // Check price every 60 seconds
  setInterval(monitor, 60 * 1000);

  // Heartbeat to keep GitHub Actions alive
  setInterval(() => {
    console.log("Bot heartbeat — still running");
  }, 60 * 1000);
})();
