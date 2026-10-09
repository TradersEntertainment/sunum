// BST and AVL insertion against the deck's examples (Levitin §6.3, Fig. 6.6).
const test = require('node:test');
const assert = require('node:assert/strict');
const bst = require('../js/algo/bst.js');

test('BST of 5 3 1 10 12 7 9 has the expected shape and height 3', () => {
  const r = bst.bstInsertAll([5, 3, 1, 10, 12, 7, 9]);
  assert.equal(bst.shape(r.final), '5(3(1,-),10(7(-,9),12))');
  assert.equal(bst.height(r.final), 3);
  assert.deepEqual(r.events.map((e) => e.path), [[], [5], [5, 3], [5], [5, 10], [5, 10], [5, 10, 7]]);
  assert.deepEqual(r.events.map((e) => e.side), [null, 'l', 'l', 'r', 'r', 'l', 'r']);
  assert.deepEqual(bst.inorder(r.final), [1, 3, 5, 7, 9, 10, 12]);
});

test('sorted keys 1..7 build a stick of height n - 1', () => {
  const r = bst.bstInsertAll([1, 2, 3, 4, 5, 6, 7]);
  assert.equal(bst.shape(r.final), '1(-,2(-,3(-,4(-,5(-,6(-,7))))))');
  assert.equal(bst.height(r.final), 6);
  assert.deepEqual(r.events.map((e) => e.path.length), [0, 1, 2, 3, 4, 5, 6]);
});

test('AVL construction for 5 6 8 3 2 4 7 matches the book', () => {
  const r = bst.avlInsertAll([5, 6, 8, 3, 2, 4, 7]);
  assert.deepEqual(r.rotations, ['L(5)', 'R(5)', 'LR(6)', 'RL(6)']);
  const after = r.events.filter((e) => e.t === 'rotate').map((e) => bst.shape(e.snap));
  assert.deepEqual(after, ['6(5,8)', '6(3(2,5),8)', '5(3(2,4),6(-,8))', '5(3(2,4),7(6,8))']);
  assert.equal(bst.shape(r.final), '5(3(2,4),7(6,8))');
  // the unbalanced node shown before each rotation, with its balance factor
  const unb = r.events.filter((e) => e.t === 'unbalanced').map((e) => [e.at, e.bf]);
  assert.deepEqual(unb, [[5, -2], [5, 2], [6, 2], [6, -2]]);
  // inserting 2 unbalances both 6 and 5; the rotation is at 5, the one closest to the leaf
  assert.deepEqual(r.events.filter((e) => e.t === 'unbalanced')[1].all, [6, 5]);
  // double rotations are made of two single ones
  const stages = r.events.filter((e) => e.t === 'rotate').map((e) => e.stages.map((s) => s.kind + '(' + s.at + ')↑' + s.up));
  assert.deepEqual(stages, [['L(5)↑6'], ['R(5)↑3'], ['L(3)↑5', 'R(6)↑5'], ['R(8)↑7', 'L(6)↑7']]);
  assert.equal(bst.shape(r.events.find((e) => e.name === 'LR(6)').stages[0].snap), '6(5(3(2,4),-),8)');
  assert.equal(bst.shape(r.events.find((e) => e.name === 'RL(6)').stages[0].snap), '5(3(2,4),6(-,7(-,8)))');
  // balance factors right before each rotation (as in Fig. 6.6)
  const before = r.events.filter((e) => e.t === 'insert').map((e) => e.bf);
  assert.deepEqual(before[2], { 5: -2, 6: -1, 8: 0 });
  assert.deepEqual(before[4], { 2: 0, 3: 1, 5: 2, 6: 2, 8: 0 });
  assert.deepEqual(before[5], { 2: 0, 3: -1, 4: 0, 5: 1, 6: 2, 8: 0 });
  assert.deepEqual(before[6], { 2: 0, 3: 0, 4: 0, 5: -1, 6: -2, 7: 0, 8: 1 });
});

test('rotations keep every key in its in-order (sorted) position', () => {
  const r = bst.avlInsertAll([5, 6, 8, 3, 2, 4, 7]);
  for (const e of r.events.filter((x) => x.t === 'rotate')) {
    for (const s of e.stages) {
      const io = bst.inorder(s.snap);
      assert.deepEqual(io, io.slice().sort((a, b) => a - b));
    }
  }
});

test('fromNested and helpers', () => {
  const t = bst.fromNested([5, [3, 2, 4], [7, 6, 8]]);
  assert.equal(bst.shape(t), '5(3(2,4),7(6,8))');
  assert.deepEqual(bst.depths(t), { 2: 2, 3: 1, 4: 2, 5: 0, 6: 2, 7: 1, 8: 2 });
  assert.equal(bst.edges(t).length, 6);
  assert.deepEqual(bst.balance(bst.fromNested([3, [1, null, 2], null])), { 1: -1, 2: 0, 3: 2 });
  assert.equal(bst.height(bst.empty()), -1);
});

test('random inputs: AVL stays balanced and sorted; BST stays sorted', () => {
  let seed = 11;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let trial = 0; trial < 300; trial++) {
    const n = 1 + Math.floor(rnd() * 40);
    const pool = Array.from({ length: 3 * n }, (_, i) => i + 1);
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    const list = pool.slice(0, n);
    const sorted = list.slice().sort((a, b) => a - b);

    const a = bst.avlInsertAll(list);
    for (const snap of a.snaps) {
      const bf = bst.balance(snap);
      for (const k in bf) assert.ok(Math.abs(bf[k]) <= 1, 'bf ' + bf[k] + ' at ' + k + ' for ' + list);
    }
    assert.deepEqual(bst.inorder(a.final), sorted);
    assert.ok(bst.height(a.final) <= 1.4404 * Math.log2(n + 2) - 1.3277 + 1e-9, 'AVL height bound');
    // at most one (single or double) rotation per insertion
    assert.ok(a.rotations.length <= n);
    for (const g of bst.perInsert(a.events)) assert.ok(g.filter((e) => e.t === 'rotate').length <= 1);

    const b = bst.bstInsertAll(list);
    assert.deepEqual(bst.inorder(b.final), sorted);
    b.snaps.forEach((s, i) => assert.equal(bst.keys(s).length, i + 1));
  }
});

test('duplicates are ignored', () => {
  const r = bst.avlInsertAll([2, 1, 2, 3, 1]);
  assert.deepEqual(bst.inorder(r.final), [1, 2, 3]);
  assert.equal(r.events.filter((e) => e.t === 'insert').length, 3);
});
