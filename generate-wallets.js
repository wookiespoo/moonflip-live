const fs = require('fs');
const { Keypair } = require('@solana/web3.js');

console.log('🎰 MoonFlip Wallet Generator');
console.log('============================');

// Generate House Wallet
const houseKeypair = Keypair.generate();
console.log('\n🏦 HOUSE WALLET:');
console.log('Public Key:', houseKeypair.publicKey.toString());
console.log('Private Key:', '[' + houseKeypair.secretKey.toString() + ']');

// Save to file
fs.writeFileSync('house-wallet.json', '[' + houseKeypair.secretKey.toString() + ']');
console.log('✅ Saved to house-wallet.json');

// Generate Owner Wallet  
const ownerKeypair = Keypair.generate();
console.log('\n👑 OWNER WALLET:');
console.log('Public Key:', ownerKeypair.publicKey.toString());
console.log('Private Key:', '[' + ownerKeypair.secretKey.toString() + ']');

// Save to file
fs.writeFileSync('owner-wallet.json', '[' + ownerKeypair.secretKey.toString() + ']');
console.log('✅ Saved to owner-wallet.json');

console.log('\n⚠️  IMPORTANT: Keep these files secure!');
console.log('💰 Fund these wallets with mainnet SOL before using in production!');
console.log('\nNext steps:');
console.log('1. Fund House Wallet (100+ SOL):', houseKeypair.publicKey.toString());
console.log('2. Fund Owner Wallet (1-2 SOL):', ownerKeypair.publicKey.toString());
console.log('3. Copy private keys to Vercel environment variables');