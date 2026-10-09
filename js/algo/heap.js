/* Heap algorithms (Levitin §6.4) as replayable event lists.
 *
 * Positions are 1-based like the deck: children of j are 2j and 2j+1, the
 * parent is ⌊j/2⌋. Every item keeps its input index as a stable id, so equal
 * keys stay distinguishable (needed for the stability demo).
 *
 * Event types
 *   init {a, m}            arrangement a = ids by position 1..n, heap size m
 *   row {vals, m}          a row of the deck's trace table (m = heap size)
 *   sift {i}               start fixing the subtree rooted at position i
 *   compare {k, j, kids}   parent k against its larger child j
 *   ok {k, j}              parent ≥ larger child: heap condition holds
 *   swap {i, j, a}         exchange positions i and j (a = arrangement after)
 *   leaf {k}               the sifted key reached a leaf
 *   settled {i}            subtree at i is a heap
 *   swapRoot {i:1, j, a}   heapsort: root ↔ last heap position
 *   lock {p}               position p now holds its final sorted key
 *   append {i, id, v, a}   insertion: new key v placed at position i
 *   compareUp {i, p}       insertion: key at i against its parent p
 *   done {a}
 * Each event also carries cmp/swaps running totals.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else (root.Algo = root.Algo || {}).heap = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function swap(H, i, j) { const t = H[i]; H[i] = H[j]; H[j] = t; }

  function tracker(val) {
    const H = [null];
    const stats = { cmp: 0, swaps: 0 };
    const ev = [];
    const push = (e) => { e.cmp = stats.cmp; e.swaps = stats.swaps; ev.push(e); return e; };
    const vals = () => H.slice(1).map((id) => val[id]);
    return { H, stats, ev, push, vals };
  }

  /* Sift the key at position k down inside H[1..m] (swap version of the
   * deck's "keep exchanging it with its larger child"). */
  function siftDown(T, val, k, m, rowEachSwap) {
    const { H, stats, push } = T;
    let moved = false;
    while (2 * k <= m) {
      let j = 2 * k;
      const kids = j < m ? [j, j + 1] : [j];
      if (j < m) {
        stats.cmp++;
        if (val[H[j + 1]] > val[H[j]]) j++;
      }
      stats.cmp++;
      push({ t: 'compare', k, j, kids });
      if (val[H[k]] >= val[H[j]]) {
        push({ t: 'ok', k, j });
        return moved;
      }
      swap(H, k, j);
      stats.swaps++;
      push({ t: 'swap', i: k, j, a: H.slice(1) });
      if (rowEachSwap) push({ t: 'row', vals: T.vals(), m });
      moved = true;
      k = j;
    }
    push({ t: 'leaf', k });
    return moved;
  }

  /* HeapBottomUp: rows as in the deck — the initial list, one after every
   * swap, and one for each parent that needed no swap. */
  function buildBottomUp(values) {
    const val = values.slice();
    const n = val.length;
    const T = tracker(val);
    for (let i = 0; i < n; i++) T.H.push(i);
    T.push({ t: 'init', a: T.H.slice(1), m: n });
    T.push({ t: 'row', vals: T.vals(), m: n });
    for (let i = Math.floor(n / 2); i >= 1; i--) {
      T.push({ t: 'sift', i });
      const moved = siftDown(T, val, i, n, true);
      if (!moved) T.push({ t: 'row', vals: T.vals(), m: n });
      T.push({ t: 'settled', i });
    }
    T.push({ t: 'done', a: T.H.slice(1) });
    return { events: T.ev, ids: T.H.slice(1), values: val, cmp: T.stats.cmp, swaps: T.stats.swaps };
  }

  /* Stage 2 of heapsort on an existing heap (ids by position, values by id).
   * Rows: one after each root↔last swap, one after each sift-down while the
   * heap still has at least 2 keys. */
  function sortStage(ids, values) {
    const val = values.slice();
    const n = ids.length;
    const T = tracker(val);
    ids.forEach((id) => T.H.push(id));
    T.push({ t: 'init', a: T.H.slice(1), m: n });
    for (let m = n; m >= 2; m--) {
      swap(T.H, 1, m);
      T.stats.swaps++;
      T.push({ t: 'swapRoot', i: 1, j: m, a: T.H.slice(1) });
      T.push({ t: 'lock', p: m });
      T.push({ t: 'row', vals: T.vals(), m: m - 1 });
      if (m - 1 >= 2) {
        T.push({ t: 'sift', i: 1 });
        siftDown(T, val, 1, m - 1, false);
        T.push({ t: 'row', vals: T.vals(), m: m - 1 });
        T.push({ t: 'settled', i: 1 });
      }
    }
    if (n >= 1) T.push({ t: 'lock', p: 1 });
    T.push({ t: 'done', a: T.H.slice(1) });
    return { events: T.ev, ids: T.H.slice(1), values: val, cmp: T.stats.cmp, swaps: T.stats.swaps };
  }

  /* Full heapsort: build (stage 1) then sort (stage 2). */
  function heapsort(values) {
    const b = buildBottomUp(values);
    const s = sortStage(b.ids, values);
    return { build: b, sort: s, sorted: s.ids.map((id) => values[id]) };
  }

  /* Insert key v into a heap given as values by position. The new item gets
   * id = heap.length. */
  function insert(heapValues, v) {
    const val = heapValues.concat([v]);
    const T = tracker(val);
    for (let i = 0; i < heapValues.length; i++) T.H.push(i);
    T.push({ t: 'init', a: T.H.slice(1), m: heapValues.length });
    const id = heapValues.length;
    T.H.push(id);
    let i = T.H.length - 1;
    T.push({ t: 'append', i, id, v, a: T.H.slice(1) });
    while (i > 1) {
      const p = Math.floor(i / 2);
      T.stats.cmp++;
      T.push({ t: 'compareUp', i, p });
      if (val[T.H[p]] >= val[T.H[i]]) {
        T.push({ t: 'ok', k: p, j: i });
        break;
      }
      swap(T.H, i, p);
      T.stats.swaps++;
      T.push({ t: 'swap', i, j: p, a: T.H.slice(1) });
      i = p;
    }
    T.push({ t: 'done', a: T.H.slice(1), at: i });
    return { events: T.ev, ids: T.H.slice(1), values: val, cmp: T.stats.cmp, swaps: T.stats.swaps };
  }

  function isHeap(vals) {
    for (let j = 2; j <= vals.length; j++) if (vals[Math.floor(j / 2) - 1] < vals[j - 1]) return false;
    return true;
  }

  /* Split events into click-sized groups: a new group starts at every event
   * whose type is in `starts`; events before the first starter are "setup". */
  function groups(events, starts) {
    const set = new Set(starts);
    const out = [];
    let curr = null;
    for (const e of events) {
      if (set.has(e.t) || !curr) {
        curr = [];
        out.push(curr);
      }
      curr.push(e);
    }
    return out;
  }

  return { buildBottomUp, sortStage, heapsort, insert, isHeap, groups };
});
