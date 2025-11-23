const { Keypair } = require('@solana/web3.js');
const fs = require('fs');

// Create a new keypair
const keypair = Keypair.generate();

// Save the secret key to a file
const secretKey = Uint8Array.from(keypair.secretKey);
fs.writeFileSync('devnet-keypair.json', JSON.stringify(Array.from(secretKey)));

console.log('Public Key:', keypair.publicKey.toString());
console.log('Keypair saved to devnet-keypair.json');