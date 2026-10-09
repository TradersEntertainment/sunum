// Heap algorithms against the deck's own trace tables (slides 32-38).
const test = require('node:test');
const assert = require('node:assert/strict');
const heap = require('../js/algo/heap.js');

const rows = (events) => events.filter((e) => e.t === 'row').map((e) =>
  e.vals.slice(0, e.m).join(' ') + (e.m < e.vals.length ? ' | ' + e.vals.slice(e.m).join(' ') : ''));

test('bottom-up construction reproduces the deck table for 2 9 7 6 5 8', () => {
  const b = heap.buildBottomUp([2, 9, 7, 6, 5, 8]);
  assert.deepEqual(rows(b.events), [
    '2 9 7 6 5 8',
    '2 9 8 6 5 7',
    '2 9 8 6 5 7',
    '9 2 8 6 5 7',
    '9 6 8 2 5 7',
  ]);
  assert.deepEqual(b.ids.map((id) => b.values[id]), [9, 6, 8, 2, 5, 7]);
  // parental nodes are visited 3, 2, 1
  assert.deepEqual(b.events.filter((e) => e.t === 'sift').map((e) => e.i), [3, 2, 1]);
});

test('heapsort stage 2 reproduces the deck table', () => {
  const r = heap.heapsort([2, 9, 7, 6, 5, 8]);
  assert.deepEqual(rows(r.sort.events), [
    '7 6 8 2 5 | 9',
    '8 6 7 2 5 | 9',
    '5 6 7 2 | 8 9',
    '7 6 5 2 | 8 9',
    '2 6 5 | 7 8 9',
    '6 2 5 | 7 8 9',
    '5 2 | 6 7 8 9',
    '5 2 | 6 7 8 9',
    '2 | 5 6 7 8 9',
  ]);
  assert.deepEqual(r.sorted, [2, 5, 6, 7, 8, 9]);
  const locks = r.sort.events.filter((e) => e.t === 'lock').map((e) => e.p);
  assert.deepEqual(locks, [6, 5, 4, 3, 2, 1]);
});

test('inserting 10 into 9 6 8 2 5 7 sifts it up to the root', () => {
  const r = heap.insert([9, 6, 8, 2, 5, 7], 10);
  assert.deepEqual(r.ids.map((id) => r.values[id]), [10, 6, 9, 2, 5, 7, 8]);
  assert.deepEqual(r.events.filter((e) => e.t === 'swap').map((e) => [e.i, e.j]), [[7, 3], [3, 1]]);
  assert.equal(r.events.at(-1).at, 1);
});

test('heap array example 9 5 3 1 4 2 is a heap; deck counter-examples are not', () => {
  assert.equal(heap.isHeap([9, 5, 3, 1, 4, 2]), true);
  assert.equal(heap.isHeap([10, 5, 7, 6, 2, 1]), false);
});

test('ascending input of size 2^k - 1 costs exactly 2(n - log2(n+1)) comparisons', () => {
  for (const k of [2, 3, 4, 5]) {
    const n = 2 ** k - 1;
    const b = heap.buildBottomUp(Array.from({ length: n }, (_, i) => i + 1));
    assert.equal(b.cmp, 2 * (n - k), 'n=' + n);
  }
});

test('heapsort is not stable: equal keys 1a, 1b come out as 1b, 1a', () => {
  const r = heap.heapsort([1, 1]);
  assert.deepEqual(r.sort.ids, [1, 0]);
});

test('random inputs: build gives a heap, sort gives the sorted permutation', () => {
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let t = 0; t < 300; t++) {
    const n = 1 + Math.floor(rnd() * 20);
    const vals = Array.from({ length: n }, () => Math.floor(rnd() * 30));
    const b = heap.buildBottomUp(vals);
    assert.ok(heap.isHeap(b.ids.map((id) => vals[id])));
    assert.ok(b.cmp <= 2 * n);
    const r = heap.heapsort(vals);
    assert.deepEqual(r.sorted, vals.slice().sort((a, c) => a - c));
    assert.deepEqual(r.sort.ids.slice().sort((a, c) => a - c), Array.from({ length: n }, (_, i) => i));
    // replaying swaps from the initial arrangement reproduces every arrangement
    let a = b.events[0].a.slice();
    for (const e of b.events) {
      if (e.t === 'swap') { [a[e.i - 1], a[e.j - 1]] = [a[e.j - 1], a[e.i - 1]]; assert.deepEqual(a, e.a); }
    }
  }
});
