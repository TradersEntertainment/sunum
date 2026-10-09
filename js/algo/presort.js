/* Element uniqueness (Levitin §6.1): brute force vs. presorting, as
 * replayable event lists.
 *
 * bruteForcePairs(a) -> { events, found, count, max }
 *   Compares every pair i < j in the textbook order
 *     for i <- 0 .. n-2:  for j <- i+1 .. n-1:  if a[i] = a[j] return false
 *   and stops at the first equal pair.
 *   events: { t: 'cmp', i, j, eq, count }   count = comparisons so far
 *   found:  { i, j } or null;  max = n(n-1)/2 (the all-distinct worst case)
 *
 * stableOrder(a) -> { order, cmp }
 *   Mergesort on indices: order[p] = input index of the p-th smallest key.
 *   Equal keys keep their input order (stable); cmp = key comparisons made.
 *
 * presortCheck(a) -> { order, pos, sorted, sortCmp, events, found, count }
 *   Sort first (stableOrder), then compare neighbours only.
 *   pos[i]  = sorted position of input index i (for FLIP-style moves)
 *   events: { t: 'cmp', p, q: p+1, eq, count }   p, q are sorted positions
 *   found:  { p, q, i, j } (i, j = input indices) or null
 *
 * pairs(n) = n(n-1)/2,  nLog2n(n) = n log2 n
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else (root.Algo = root.Algo || {}).presort = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function pairs(n) { return (n * (n - 1)) / 2; }
  function nLog2n(n) { return n <= 1 ? 0 : n * Math.log2(n); }

  function bruteForcePairs(a) {
    const n = a.length;
    const events = [];
    let count = 0;
    for (let i = 0; i <= n - 2; i++) {
      for (let j = i + 1; j <= n - 1; j++) {
        count++;
        const eq = a[i] === a[j];
        events.push({ t: 'cmp', i, j, eq, count });
        if (eq) return { events, found: { i, j }, count, max: pairs(n) };
      }
    }
    return { events, found: null, count, max: pairs(n) };
  }

  function stableOrder(a) {
    let cmp = 0;
    function sort(ids) {
      if (ids.length <= 1) return ids;
      const mid = Math.floor(ids.length / 2);
      const L = sort(ids.slice(0, mid));
      const R = sort(ids.slice(mid));
      const out = [];
      let i = 0, j = 0;
      while (i < L.length && j < R.length) {
        cmp++;
        if (a[R[j]] < a[L[i]]) out.push(R[j++]);   // ties take the left one: stable
        else out.push(L[i++]);
      }
      while (i < L.length) out.push(L[i++]);
      while (j < R.length) out.push(R[j++]);
      return out;
    }
    const order = sort(a.map((_, i) => i));
    return { order, cmp };
  }

  function presortCheck(a) {
    const { order, cmp } = stableOrder(a);
    const pos = new Array(a.length);
    order.forEach((id, p) => { pos[id] = p; });
    const sorted = order.map((id) => a[id]);
    const events = [];
    let count = 0;
    let found = null;
    for (let p = 0; p + 1 < sorted.length; p++) {
      count++;
      const eq = sorted[p] === sorted[p + 1];
      events.push({ t: 'cmp', p, q: p + 1, eq, count });
      if (eq) { found = { p, q: p + 1, i: order[p], j: order[p + 1] }; break; }
    }
    return { order, pos, sorted, sortCmp: cmp, events, found, count };
  }

  return { bruteForcePairs, stableOrder, presortCheck, pairs, nLog2n };
});
