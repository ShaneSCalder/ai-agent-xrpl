// ✅ 1. Imports
const express = require('express');
const axios = require('axios');
const xrpl = require('xrpl');
const path = require('path');

// ✅ 2. Create app
const app = express();

// ✅ 3. Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ✅ 4. Routes start here
app.get('/', (req, res) => {
  res.render('index');
});

// === /preview (OpenAI extracts amount + memo) ===
app.post('/preview', async (req, res) => {
  const { memoInput } = req.body;

  const prompt = `From the following: "${memoInput}", extract:
1. The amount in XRP as a number.
2. A short XRP memo under 100 characters.
Return exactly this format:
{ "amount": 10, "memo": "..." }`;

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const parsed = JSON.parse(response.data.choices[0].message.content.trim());

    res.json({
      amount: parsed.amount,
      memo: parsed.memo
    });

  } catch (error) {
    console.error('❌ Preview Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to preview transaction.' });
  }
});

// === /confirm (Send XRP) ===
app.post('/confirm', async (req, res) => {
  const { amount, memo, walletRole } = req.body;

  if (!amount || !memo || isNaN(amount)) {
    return res.status(400).json({ error: 'Invalid transaction data.' });
  }

  try {
    const client = new xrpl.Client("wss://s.altnet.rippletest.net:51233");
    await client.connect();

    const isSender = walletRole === 'sender';
    const secret = isSender ? process.env.SENDER_SECRET : process.env.RECEIVER_SECRET;
    const address = isSender ? process.env.SENDER_ADDRESS : process.env.RECEIVER_ADDRESS;
    const destination = isSender ? process.env.RECEIVER_ADDRESS : process.env.SENDER_ADDRESS;

    const wallet = xrpl.Wallet.fromSeed(secret);

    const tx = {
      TransactionType: "Payment",
      Account: address,
      Amount: xrpl.xrpToDrops(String(amount)),
      Destination: destination,
      Memos: [{
        Memo: {
          MemoData: Buffer.from(memo).toString('hex')
        }
      }]
    };

    const prepared = await client.autofill(tx);
    const signed = wallet.sign(prepared);
    const result = await client.submitAndWait(signed.tx_blob);
    await client.disconnect();

    const hash = signed.hash;
    const explorerUrl = `https://testnet.xrpl.org/transactions/${hash}`;

    res.json({
      txHash: hash,
      explorer: explorerUrl,
      status: result.result.meta.TransactionResult
    });

  } catch (err) {
    console.error('❌ Confirm Error:', err.message);
    res.status(500).json({ error: 'Transaction failed.' });
  }
});

// ✅ 5. Export app
module.exports = app;

  