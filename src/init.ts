import { PrivateKey, PublicKey, Mina, shutdown, isReady } from 'snarkyjs';
import { init } from './MultiSigLib.js';
import { MultiSig } from './MultiSig.js';
import * as dotenv from 'dotenv';

dotenv.config({ path: './.env' });

let pk: string = process.env.PK || '';

await isReady;

let Berkeley = Mina.BerkeleyQANet(
  'https://proxy.berkeley.minaexplorer.com/graphql'
);
Mina.setActiveInstance(Berkeley);

const zkAppPublickey: PublicKey = PublicKey.fromBase58(
  'B62qnt7aHgtM3Sy9VrXUU92P3rFJzazWK52ioNNnPfJk619MVSmZ12G'
);
const zkAppInstance = new MultiSig(zkAppPublickey);

// Personal berkeley wallet pk
const signer: PrivateKey = PrivateKey.fromBase58(pk);

await init(zkAppInstance, signer);

shutdown();
