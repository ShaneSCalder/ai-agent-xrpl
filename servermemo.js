const express = require('express');
const axios = require('axios');
const xrpl = require('xrpl');
const path = require('path');

const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Homepage route
app.get('/', (req, res) => {
  res.render('index');
});

// ========== /generate ==========
// Generate memo AND send XRP with memo to the opposite wallet
app.post('/generate', async (req, res) => {
  const { memoInput, walletRole } = req.body;

  const prompt = `Generate a short (under 100 characters) XRP payment memo for this input: "${memoInput}". 
Only return the memo. No greetings, email content, or sign-offs.`;

  try {
    // 1. Generate memo using OpenAI
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    let memo = response.data.choices[0].message.content.trim();
    if (memo.length > 100) {
      memo = memo.slice(0, 97) + '...';
    }

    // 2. Setup XRPL client and wallet
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
      Amount: xrpl.xrpToDrops("10"),
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
      memo,
      txHash: hash,
      explorer: explorerUrl,
      status: result.result.meta.TransactionResult
    });

  } catch (error) {
    console.error('❌ Error in OpenAI + XRPL flow:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to generate memo or send transaction.' });
  }
});

module.exports = app;



  

