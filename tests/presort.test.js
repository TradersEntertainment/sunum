// Element uniqueness: brute force vs. presorting (Levitin §6.1), on the
// deck's list 5 2 8 1 9 3 8 6 (twin 8s at positions 2 and 6).
const test = require('node:test');
const assert = require('node:assert/strict');
const ps = require('../js/algo/presort.js');

const LIST = [5, 2, 8, 1, 9, 3, 8, 6];

test('brute force compares pairs in textbook order and stops at the twin 8s', () => {
  const r = ps.bruteForcePairs(LIST);
  assert.deepEqual(r.found, { i: 2, j: 6 });
  assert.equal(r.count, 17);                      // 7 + 6 + 4 pairs
  assert.equal(r.max, 28);                        // n(n-1)/2 for n = 8
  assert.equal(r.events.length, 17);
  assert.deepEqual(r.events.slice(0, 3).map((e) => [e.i, e.j]), [[0, 1], [0, 2], [0, 3]]);
  assert.deepEqual(r.events.map((e) => e.count), Array.from({ length: 17 }, (_, k) => k + 1));
  assert.ok(r.events.slice(0, -1).every((e) => !e.eq));
  assert.equal(r.events.at(-1).eq, true);
});

test('brute force on distinct keys checks all n(n-1)/2 pairs', () => {
  const r = ps.bruteForcePairs([5, 2, 7, 1, 9, 3, 8, 6]);
  assert.equal(r.found, null);
  assert.equal(r.count, 28);
  const seen = new Set(r.events.map((e) => e.i + ',' + e.j));
  assert.equal(seen.size, 28);
  assert.ok(r.events.every((e) => e.i < e.j));
});

test('presorting sorts stably, then finds the twins among neighbours', () => {
  const r = ps.presortCheck(LIST);
  assert.deepEqual(r.sorted, [1, 2, 3, 5, 6, 8, 8, 9]);
  assert.deepEqual(r.order, [3, 1, 5, 0, 7, 2, 6, 4]);   // the first 8 (index 2) stays first
  assert.deepEqual(r.pos, [3, 1, 5, 0, 7, 2, 6, 4]);
  assert.deepEqual(r.found, { p: 5, q: 6, i: 2, j: 6 });
  assert.equal(r.count, 6);
  assert.deepEqual(r.events.map((e) => [e.p, e.q, e.eq]), [
    [0, 1, false], [1, 2, false], [2, 3, false], [3, 4, false], [4, 5, false], [5, 6, true],
  ]);
  assert.equal(r.sortCmp, 16);                     // mergesort comparisons for this list
  assert.ok(r.sortCmp <= Math.ceil(ps.nLog2n(8)));
});

test('presorting on distinct keys checks n - 1 neighbours', () => {
  const r = ps.presortCheck([4, 1, 3, 2]);
  assert.equal(r.found, null);
  assert.equal(r.count, 3);
  assert.deepEqual(r.sorted, [1, 2, 3, 4]);
});

test('pair and n log n counts used on the scale-up slide', () => {
  assert.equal(ps.pairs(8), 28);
  assert.equal(ps.pairs(1000), 499500);
  assert.equal(ps.pairs(1e6), 499999500000);
  assert.equal(ps.nLog2n(8), 24);
  assert.equal(Math.round(ps.nLog2n(1000)), 9966);
  assert.equal(Math.round(ps.nLog2n(1e6) / 1e6), 20);
});

test('random lists: both methods agree; order is a stable sort; mergesort stays below n log2 n + n', () => {
  let seed = 11;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let t = 0; t < 400; t++) {
    const n = 1 + Math.floor(rnd() * 14);
    const a = Array.from({ length: n }, () => Math.floor(rnd() * 20));
    const b = ps.bruteForcePairs(a);
    const p = ps.presortCheck(a);
    const distinct = new Set(a).size === n;
    assert.equal(b.found === null, distinct);
    assert.equal(p.found === null, distinct);
    if (!distinct) assert.equal(a[b.found.i], a[b.found.j]);
    if (!distinct) assert.equal(a[p.found.i], a[p.found.j]);
    if (distinct) assert.equal(b.count, ps.pairs(n));
    const expect = a.map((v, i) => [v, i]).sort((x, y) => x[0] - y[0] || x[1] - y[1]).map((x) => x[1]);
    assert.deepEqual(p.order, expect);
    p.order.forEach((id, k) => assert.equal(p.pos[id], k));
    assert.ok(p.sortCmp <= ps.nLog2n(n) + n);
  }
});
