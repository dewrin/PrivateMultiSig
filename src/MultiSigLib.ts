import {
  Field,
  PrivateKey,
  Mina,
  AccountUpdate,
  Poseidon,
  PublicKey,
} from 'snarkyjs';
import { MultiSig } from './MultiSig';
//export { initialMembers };

// const initialMembers: PublicKey[] = [
//     PublicKey.fromBase58("B62qqRbQokdeAvK3iHSwkUfssaS7rY72gAY4ywopQpBgPBhwtKceXtk"),
//     PublicKey.fromBase58("B62qoYMGvVNBGo89P3QG7TaDLXgWKn4169w8vmPSu2LAwtSZSgeWQXh"),
//     PublicKey.fromBase58("B62qrYhxY1RexLrb2PPfKrbK9nvD9GZCvQqJ8U2X3efx3QKMud8LXPo"),
//     PublicKey.fromBase58("B62qm9zaGLj2MqKgZySYRkJsEEG2ziT8AMuJsCjxR3yETxBf1pCz97m")
// ];

const memb1: PublicKey = PublicKey.fromBase58(
  'B62qqRbQokdeAvK3iHSwkUfssaS7rY72gAY4ywopQpBgPBhwtKceXtk'
);
const memb2: PublicKey = PublicKey.fromBase58(
  'B62qoYMGvVNBGo89P3QG7TaDLXgWKn4169w8vmPSu2LAwtSZSgeWQXh'
);
const memb3: PublicKey = PublicKey.fromBase58(
  'B62qrYhxY1RexLrb2PPfKrbK9nvD9GZCvQqJ8U2X3efx3QKMud8LXPo'
);
const memb4: PublicKey = PublicKey.fromBase58(
  'B62qm9zaGLj2MqKgZySYRkJsEEG2ziT8AMuJsCjxR3yETxBf1pCz97m'
);

export function createLocalBlockchain(): PrivateKey[] {
  let Local = Mina.LocalBlockchain();
  Mina.setActiveInstance(Local);
  return [Local.testAccounts[0].privateKey, Local.testAccounts[1].privateKey];
}

export function computeInitialRoot(): Field {
  return Poseidon.hash([
    Poseidon.hash([
      Poseidon.hash(memb1.toFields()),
      Poseidon.hash(memb2.toFields()),
    ]),
    Poseidon.hash([
      Poseidon.hash(memb3.toFields()),
      Poseidon.hash(memb4.toFields()),
    ]),
  ]);
}

export async function deploy(
  zkAppInstance: MultiSig,
  zkAppPrivateKey: PrivateKey,
  deployer: PrivateKey
) {
  const initialRoot: Field = computeInitialRoot();
  const txn = await Mina.transaction(deployer, () => {
    AccountUpdate.fundNewAccount(deployer);
    zkAppInstance.deploy({ zkappKey: zkAppPrivateKey });
    zkAppInstance.init(initialRoot);
  });
  await txn.send().wait();
}

export async function init(zkAppInstance: MultiSig, deployer: PrivateKey) {
  const initialRoot: Field = computeInitialRoot();
  const txn = await Mina.transaction(deployer, () => {
    zkAppInstance.init(initialRoot);
  });
  await txn.send().wait();
}

// export async function addMember(
//   feePayerKey: PrivateKey,
//   zkAppInstance: MultiSig,
//   zkAppPrivatekey: PrivateKey,
//   num: Field
// ) {
//   const txn = await Mina.transaction(
//     { feePayerKey, fee: 100_000_000, memo: 'Update' },
//     async () => {
//       zkAppInstance.addNewMember(num);
//       zkAppInstance.sign(zkAppPrivatekey);
//     }
//   );
//   await txn.send().wait();
//   console.log(txn, txn.transaction.feePayer.body);
//}
