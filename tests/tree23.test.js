// 2-3 tree insertion against the deck's example (Levitin §6.3, Fig. 6.8).
const test = require('node:test');
const assert = require('node:assert/strict');
const t23 = require('../js/algo/tree23.js');

test('2-3 tree for 9 5 8 3 2 4 7: splits and final tree as in the book', () => {
  const r = t23.insertAll([9, 5, 8, 3, 2, 4, 7]);
  assert.deepEqual(r.splits.map((e) => '[' + e.keys.join(',') + ']↑' + e.up),
    ['[5,8,9]↑8', '[2,3,5]↑3', '[4,5,7]↑5', '[3,5,8]↑5']);
  assert.deepEqual(r.splits.map((e) => e.newRoot), [true, false, false, true]);
  assert.equal(t23.shape(r.final), '[5]([3]([2],[4]),[8]([7],[9]))');
  assert.equal(t23.height(r.final), 2);
  assert.deepEqual(t23.check(r.final), []);
});

test('intermediate trees and events', () => {
  const r = t23.insertAll([9, 5, 8, 3, 2, 4, 7]);
  const after = (k) => r.events.filter((e) => e.t !== 'done' && e.t !== 'overflow')
    .filter((e, i, all) => {
      // last snapshot produced while handling key k
      const idx = all.findIndex((x) => x.t === 'insert' && x.key === k);
      const nextIns = all.findIndex((x, j) => j > idx && x.t === 'insert');
      return i >= idx && (nextIns < 0 || i < nextIns);
    }).at(-1).snap;
  assert.equal(t23.shape(after(5)), '[5,9]');
  assert.equal(t23.shape(after(8)), '[8]([5],[9])');
  assert.equal(t23.shape(after(3)), '[8]([3,5],[9])');
  assert.equal(t23.shape(after(2)), '[3,8]([2],[5],[9])');
  assert.equal(t23.shape(after(4)), '[3,8]([2],[4,5],[9])');
  assert.equal(t23.shape(after(7)), '[5]([3]([2],[4]),[8]([7],[9]))');
  // the overflowing node is shown with 3 keys before it splits
  const ins8 = r.events.find((e) => e.t === 'insert' && e.key === 8);
  assert.equal(t23.shape(ins8.snap), '[5,8,9]');
  assert.deepEqual(r.events.filter((e) => e.t === 'overflow').map((e) => e.keys), [[5, 8, 9], [2, 3, 5], [4, 5, 7], [3, 5, 8]]);
  // the second split of key 7 happens in the parent of the first
  const [s3, s4] = r.splits.slice(2);
  assert.equal(s4.node, s3.parent);
  // paths go from the root to the leaf
  const ins7 = r.events.find((e) => e.t === 'insert' && e.key === 7);
  assert.equal(ins7.path[0], r.events.find((e) => e.t === 'insert' && e.key === 4).snap.root);
  assert.equal(ins7.path.at(-1), ins7.leaf);
});

test('random inputs: valid 2-3 trees after every event', () => {
  let seed = 5;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let trial = 0; trial < 300; trial++) {
    const n = 1 + Math.floor(rnd() * 45);
    const list = Array.from({ length: n }, () => 1 + Math.floor(rnd() * 60));
    const uniq = Array.from(new Set(list)).sort((a, b) => a - b);
    const r = t23.insertAll(list);
    assert.deepEqual(t23.check(r.final), [], 'final for ' + list);
    assert.deepEqual(t23.inorder(r.final), uniq);
    const { depth, leaves } = t23.walk(r.final);
    assert.equal(new Set(leaves.map((id) => depth[id])).size, 1);
    // height bounds from the book: log3(n+1) - 1 <= h <= log2(n+1) - 1
    const h = t23.height(r.final), m = uniq.length;
    assert.ok(h >= Math.log(m + 1) / Math.log(3) - 1 - 1e-9);
    assert.ok(h <= Math.log2(m + 1) - 1 + 1e-9);
    // after each finished insertion (the event before the next insert) the tree is valid
    r.events.forEach((e, i) => {
      const nxt = r.events[i + 1];
      if (nxt && (nxt.t === 'insert' || nxt.t === 'done')) assert.deepEqual(t23.check(e.snap), []);
    });
    // splits always send up the middle key
    for (const s of r.splits) assert.equal(s.up, s.keys[1]);
  }
});
