const fs = require('fs');
const xrpl = require('xrpl');
require('dotenv').config();

async function createWallet(client) {
  const wallet = (await client.fundWallet()).wallet;
  return wallet;
}

(async () => {
  const client = new xrpl.Client("wss://s.altnet.rippletest.net:51233");
  await client.connect();

  // Store old secrets if they exist
  const oldSender = process.env.SENDER_SECRET || '';
  const oldReceiver = process.env.RECEIVER_SECRET || '';

  const sender = await createWallet(client);
  const receiver = await createWallet(client);

  client.disconnect();

  const newEnv = `
# === GENERATED XRPL WALLETS ===
SENDER_ADDRESS=${sender.classicAddress}
SENDER_SECRET=${sender.seed}
SENDER_SECRET_OLD=${oldSender}

RECEIVER_ADDRESS=${receiver.classicAddress}
RECEIVER_SECRET=${receiver.seed}
RECEIVER_SECRET_OLD=${oldReceiver}
`;

  // Append or replace in .env
  let envFile = fs.readFileSync('.env', 'utf8');
  envFile = envFile.replace(/# === GENERATED XRPL WALLETS ===[\s\S]*/gm, '');
  envFile += newEnv;

  fs.writeFileSync('.env', envFile);

  console.log("✅ New wallets created and .env updated!");
  console.log(`Sender: ${sender.classicAddress}`);
  console.log(`Receiver: ${receiver.classicAddress}`);
})();
