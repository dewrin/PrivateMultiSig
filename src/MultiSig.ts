import {
  Field,
  SmartContract,
  state,
  State,
  method,
  DeployArgs,
  // PublicKey,
  PrivateKey,
  Permissions,
  Experimental,
  CircuitString,
  Poseidon,
  isReady,
  Circuit,
} from 'snarkyjs';

await isReady;

class MerkleWitness extends Experimental.MerkleWitness(8) {}

// export function isMember(member: PublicKey, path: MerkleWitness) {

// }

export class MultiSig extends SmartContract {
  @state(Field) root = State<Field>();
  @state(Field) cancelVotesBitmap = State<Field>();
  @state(Field) executeVotesBitmap = State<Field>();
  // - Maximum BitMask Size for a single Field is 2^254 calculated via given computation:
  //   Max Field Value on Mina is: `28948022309329048855892746252171976963363056481941560715954676764349967630336` just a little over 2^254
  //   Converted to Hex: `40000000000000000000000000000000224698FC094CF91B992D30ED00000000`
  //   Which leaves us with Maximum mask value of: `3fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff`
  //   Which is just enough place for 254 boolean voting values, which means we can fit 254 member votes in a single word (f == 1111, 3 == 11, 63 * 4 slots + 2 slots = 254 slots)
  @state(Field) proposalHash = State<Field>();
  @state(Field) minimalQuorum = State<Field>();
  @state(Field) numberOfMembers = State<Field>();

  deploy(args: DeployArgs) {
    super.deploy(args);
    this.setPermissions({
      ...Permissions.default(),
      editState: Permissions.none(),
    });
  }

  // TODO: Add proper tree root computation logic adapted to snarky.js
  // @method init(initialMembers: MembersList) {
  //   let root: Field = new Field(0);

  //   for (let i = 0; i < initialMembers.members.length; i+=2) {
  //     if (initialMembers.members[i+1] === undefined) {
  //       Poseidon.hash([initialMembers.hashSingleProperty(i), initialMembers.hashSingleProperty(i)]);
  //     } else {
  //       Poseidon.hash([initialMembers.hashSingleProperty(i), initialMembers.hashSingleProperty(i + 1)]);
  //     }
  //   }

  //   let members: Field[] = initialMembers.hash();
  //   while (members.length > 1) {
  //     let counter = 0;
  //     for (let i = 0; i < members.length; i+=2) {
  //       if (members[i+1] === undefined) {
  //         members[counter] = Poseidon.hash([new Field(members[i]), new Field(members[i])]);
  //       } else {
  //         members[counter] = Poseidon.hash([new Field(members[i]), new Field(members[i+1])]);
  //       }
  //       counter += 1;
  //     }
  //     for (let i = counter; i < members.length; i++) {
  //       members.pop();
  //     }
  //   }

  //   this.root.set(new Field(members[0]));
  // }

  @method init(initialRoot: Field) {
    this.root.set(initialRoot);
  }

  @method addNewMember(
    memberPrivateKey: PrivateKey,
    currentPath: MerkleWitness,
    newMember: Field,
    newRoot: Field,
    newPath: MerkleWitness
  ) {
    let root = this.root.get();
    this.root.assertEquals(root);

    // Confirm the current member tree presence
    currentPath
      .calculateRoot(Poseidon.hash(memberPrivateKey.toPublicKey().toFields()))
      .assertEquals(root);

    // Confirm the root change with new member addition
    newPath
      .calculateRoot(Poseidon.hash(newMember.toFields()))
      .assertEquals(newRoot);

    this.root.set(newRoot);
    this.numberOfMembers.set(this.numberOfMembers.get().add(1));
    this.minimalQuorum.set(this.numberOfMembers.get().div(2));
  }

  @method removeMember(
    memberPrivateKey: PrivateKey,
    currentPath: MerkleWitness,
    newMember: Field,
    newRoot: Field,
    newPath: MerkleWitness
  ) {
    let root = this.root.get();
    this.root.assertEquals(root);

    // Confirm the current member tree presence
    currentPath
      .calculateRoot(Poseidon.hash(memberPrivateKey.toPublicKey().toFields()))
      .assertEquals(root);

    // Confirm the root change with new member addition
    newPath
      .calculateRoot(Poseidon.hash(newMember.toFields()))
      .assertEquals(newRoot);

    this.root.set(newRoot);
    this.numberOfMembers.set(this.numberOfMembers.get().add(1));
    this.minimalQuorum.set(this.numberOfMembers.get().div(2));
  }

  @method propose(
    memberPrivateKey: PrivateKey,
    path: MerkleWitness,
    proposal: CircuitString
  ) {
    // Make sure there is no active proposal
    this.proposalHash.get().assertEquals(Field(0));
    path
      .calculateRoot(Poseidon.hash(memberPrivateKey.toPublicKey().toFields()))
      .assertEquals(this.root.get());

    this.proposalHash.set(Poseidon.hash(proposal.toFields()));
  }

  @method cancelProposal() {
    let minimalQuorum = this.minimalQuorum.get();
    this.minimalQuorum.assertEquals(minimalQuorum);

    let votesBitmap = this.cancelVotesBitmap.get();
    this.cancelVotesBitmap.assertEquals(votesBitmap);

    let voteCount = 0;
    let bits = votesBitmap.toBits();

    // Readout a bitmap for cancel votes
    for (let i = 0; i <= 254; i++) {
      const voteValue = Circuit.if(bits[i], 1, 0);
      voteCount += voteValue;
    }

    Field(voteCount).assertGte(this.minimalQuorum.get());
    this.proposalHash.set(Field(0));
  }

  @method executeProposal() {
    let minimalQuorum = this.minimalQuorum.get();
    this.minimalQuorum.assertEquals(minimalQuorum);

    let votesBitmap = this.executeVotesBitmap.get();
    this.executeVotesBitmap.assertEquals(votesBitmap);

    let voteCount = 0;
    let bits = votesBitmap.toBits();

    // Readout a bitmap for cancel votes
    for (let i = 0; i <= 254; i++) {
      const voteValue = Circuit.if(bits[i], 1, 0);
      voteCount += voteValue;
    }

    Field(voteCount).assertGte(this.minimalQuorum.get());

    // TODO: Proposal execution logic for making custom transfers
  }
}
