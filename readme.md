# 🧠 AI-Powered XRP Memo & Transaction Agent

This project combines OpenAI's GPT API with the XRP Ledger (XRPL) Testnet to automatically generate and send XRP transactions based on natural language input.

### 🔥 Example Prompt
> "Send 25 XRP to Florian for helping with web hosting"

✅ The system will:
- Extract the amount, memo, and recipient using OpenAI  
- Display a confirmation screen  
- Send 25 XRP to Florian on the XRPL Testnet  
- Show the transaction hash and Explorer link

---

## 🚀 Features

- 🌐 Node.js + Express backend
- 🎨 EJS + Bootstrap frontend
- 🔐 Uses `.env` to store 4 test wallets:
  - Shane
  - Luc
  - Florian
  - Thomas
- 🤖 GPT-3.5-Turbo for NLP + memo extraction
- 🔁 XRP transactions sent to XRPL Testnet with memos
- ✅ Confirmation screen before sending any XRP

---

# 📁 Project Structure – AI-Powered XRP Memo Agent

This project is organized into key folders for views, public assets, wallet scripts, and server logic.

```plaintext
xrp-memo-agent/
├── public/                         # Static frontend assets
│   └── css/
│       └── style.css               # Custom styles (Bootstrap-enhanced)
│
├── views/                          # Frontend templates
│   └── index.ejs                   # Main UI template
│
├── scripts/                        # Wallet generation scripts
│   └── genWalletsWithNames.js      # Generates named XRPL wallets for Shane, Luc, Florian, Thomas
│
├── .env                            # Environment variables (API keys, wallet secrets)
├── .env.example                    # Example .env for setup
│
├── server.js                       # Main Express app with routes and logic
├── dev.js                          # Entry point for local dev with dotenv support
├── package.json                    # Node dependencies and scripts
├── README.md                       # Project overview and usage guide
├── PROJECT_STRUCTURE.md            # This file!

--- 

# 🔐 .env Configuration for AI-Powered XRP Memo Agent

This project uses environment variables to securely store API keys and wallet secrets for 4 XRPL testnet users.

## ✅ Required Fields in `.env`

```env
# OpenAI API Key
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Shane's Wallet
WALLET_SHANE_ADDRESS=rXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
WALLET_SHANE_SECRET=sXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
WALLET_SHANE_SECRET_OLD=sOldShaneSecret

# Luc's Wallet
WALLET_LUC_ADDRESS=rXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
WALLET_LUC_SECRET=sXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
WALLET_LUC_SECRET_OLD=sOldLucSecret

# Florian's Wallet
WALLET_FLORIAN_ADDRESS=rXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
WALLET_FLORIAN_SECRET=sXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
WALLET_FLORIAN_SECRET_OLD=sOldFlorianSecret

# Thomas's Wallet
WALLET_THOMAS_ADDRESS=rXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
WALLET_THOMAS_SECRET=sXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
WALLET_THOMAS_SECRET_OLD=sOldThomasSecret
```
---
# Note: You can change the names in the genWalletwitNames.js file 
- don't use .env in a production this is for education and ease of use. 
---

## ✅ dev.js – Local Development Entry Point
This file is only for local development. It does two things:

Loads .env so we can use local secrets (OpenAI API key, XRPL wallet secrets)

Starts the server from server.js

🔧 dev.js

```
require('dotenv').config();       // Load .env for local dev
const app = require('./server');  // Import Express app

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
```

## ✅ server.js – Main Express App
This file:

Sets up middleware, static files, views (EJS)

Includes route logic: /, /preview, /confirm

Integrates OpenAI’s GPT-3.5 and XRPL to:

Interpret prompts

Generate memos, extract amount/recipient

Send XRP transactions via XRPL Testnet

This is also the file Vercel or other deployment systems will use.

## 🧠 OpenAI Integration
🔧 Inside /preview route:
We use axios to call OpenAI’s API:

```
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
```

## 🔐 Using OpenAI API Key Without .env

Why?
Some environments (like Vercel, GitHub Actions, or Docker) prefer secrets managed outside of code — not stored in .env.

## ✅ 1. Via Terminal (for Local Dev)
You can export the key inline when running:
```
OPENAI_API_KEY=sk-xxxxxxxxxxxx node dev.js
```
Or permanently in your shell config (e.g. .bashrc, .zshrc):
```
export OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxx
```
Then your server.js will still pick it up via:
```
process.env.OPENAI_API_KEY
```
no .env required 

## Vercel site 

[AI-Agent-XRPL
](https://ai-agent-xrpl.vercel.app/)

