const fs = require('fs');
const xrpl = require('xrpl');
require('dotenv').config();

const names = ['Shane', 'Luc', 'Florian', 'Thomas'];

async function createWallet(client) {
  const { wallet } = await client.fundWallet();
  return wallet;
}

(async () => {
  const client = new xrpl.Client("wss://s.altnet.rippletest.net:51233");
  await client.connect();

  const oldSecrets = {};
  for (const name of names) {
    const envKey = `WALLET_${name.toUpperCase()}_SECRET`;
    oldSecrets[name] = process.env[envKey] || '';
  }

  const newWallets = {};
  for (const name of names) {
    newWallets[name] = await createWallet(client);
  }

  await client.disconnect();

  let newEnv = `\n# === GENERATED NAMED WALLETS ===\n`;
  for (const name of names) {
    const upper = name.toUpperCase();
    newEnv += `WALLET_${upper}_ADDRESS=${newWallets[name].classicAddress}\n`;
    newEnv += `WALLET_${upper}_SECRET=${newWallets[name].seed}\n`;
    newEnv += `WALLET_${upper}_SECRET_OLD=${oldSecrets[name]}\n\n`;
  }

  // Replace or append to .env
  let envFile = fs.readFileSync('.env', 'utf8');
  envFile = envFile.replace(/# === GENERATED NAMED WALLETS ===[\s\S]*?(?=\n#|$)/gm, '');
  envFile += newEnv;
  fs.writeFileSync('.env', envFile);

  console.log("✅ New named wallets created and .env updated!");
  for (const name of names) {
    console.log(`${name}: ${newWallets[name].classicAddress}`);
  }
})();
