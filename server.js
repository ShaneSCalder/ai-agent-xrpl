const express = require('express');
const axios = require('axios');
const xrpl = require('xrpl');
const path = require('path');

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// === Wallet Map ===
const walletMap = {
  Shane: {
    address: process.env.WALLET_SHANE_ADDRESS,
    secret: process.env.WALLET_SHANE_SECRET
  },
  Luc: {
    address: process.env.WALLET_LUC_ADDRESS,
    secret: process.env.WALLET_LUC_SECRET
  },
  Florian: {
    address: process.env.WALLET_FLORIAN_ADDRESS,
    secret: process.env.WALLET_FLORIAN_SECRET
  },
  Thomas: {
    address: process.env.WALLET_THOMAS_ADDRESS,
    secret: process.env.WALLET_THOMAS_SECRET
  }
};

// === Home Page ===
app.get('/', (req, res) => {
  res.render('index');
});

// === /preview ===
app.post('/preview', async (req, res) => {
  const { memoInput } = req.body;

  const prompt = `From this input: "${memoInput}", extract:
1. Amount in XRP (number only),
2. Recipient name (Shane, Luc, Florian, or Thomas),
3. A short XRP memo under 100 characters.

Respond ONLY in this JSON format:
{ "amount": 20, "recipient": "Shane", "memo": "Payment for web hosting" }`;

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

    const { amount, recipient, memo } = JSON.parse(response.data.choices[0].message.content.trim());

    if (!walletMap[recipient]) {
      return res.status(400).json({ error: `Recipient "${recipient}" not recognized.` });
    }

    res.json({ amount, memo, recipient });

  } catch (error) {
    console.error('❌ Preview Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to extract transaction details.' });
  }
});

// === /confirm ===
app.post('/confirm', async (req, res) => {
  const { amount, memo, recipient, sender } = req.body;

  if (!amount || !memo || !recipient || !sender || isNaN(amount)) {
    return res.status(400).json({ error: 'Invalid transaction data.' });
  }

  const senderWallet = walletMap[sender];
  const recipientWallet = walletMap[recipient];

  if (!senderWallet || !recipientWallet) {
    return res.status(400).json({ error: 'Sender or recipient wallet not found.' });
  }

  try {
    const client = new xrpl.Client("wss://s.altnet.rippletest.net:51233");
    await client.connect();

    const wallet = xrpl.Wallet.fromSeed(senderWallet.secret);

    const tx = {
      TransactionType: "Payment",
      Account: senderWallet.address,
      Amount: xrpl.xrpToDrops(String(amount)),
      Destination: recipientWallet.address,
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

module.exports = app;
