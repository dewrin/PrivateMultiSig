import { PrivateKey, PublicKey, isReady, shutdown } from 'snarkyjs';

await isReady;
const pk: PrivateKey = PrivateKey.random();
const pub: PublicKey = pk.toPublicKey();
console.log(pk.toBase58());
console.log(pub.toBase58());
shutdown();
