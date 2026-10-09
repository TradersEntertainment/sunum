/* Binary search trees and AVL trees (Levitin §6.3) as replayable snapshots.
 *
 * A tree snapshot is a plain object
 *   { root: key | null, nodes: { [key]: { l: key | null, r: key | null } } }
 * Keys are distinct numbers; a node is identified by its key, which is what
 * the views use to "magic move" nodes between snapshots.
 *
 * bstInsertAll(keys)  plain BST insertion
 *   events: { t: 'insert', key, path, parent, side, snap }
 * avlInsertAll(keys)  AVL insertion (one rotation at most per insert, done at
 *   the unbalanced node closest to the new leaf, as in the book)
 *   events: { t: 'insert', key, path, parent, side, snap, bf }
 *           { t: 'unbalanced', at, bf, all }            all = every node with |bf| = 2
 *           { t: 'rotate', kind, at, name, stages, snap, bf }
 *     stages: the single rotations that make up the rotation, in order:
 *           [{ kind: 'L' | 'R', at, up, snap }]         up = the child that rises
 * Both return { events, snaps (one per insert, after any rotation), final,
 *   rotations (names) }.
 *
 * Balance factor = height(left) − height(right); an empty tree has height −1.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else (root.Algo = root.Algo || {}).bst = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function empty() { return { root: null, nodes: {} }; }

  function clone(t) {
    const nodes = {};
    for (const k in t.nodes) nodes[k] = { l: t.nodes[k].l, r: t.nodes[k].r };
    return { root: t.root, nodes };
  }

  function keys(t) { return Object.keys(t.nodes).map(Number).sort((a, b) => a - b); }

  function heights(t) {
    const h = {};
    const rec = (k) => {
      if (k == null) return -1;
      const n = t.nodes[k];
      const v = 1 + Math.max(rec(n.l), rec(n.r));
      h[k] = v;
      return v;
    };
    rec(t.root);
    return h;
  }

  function height(t) { return t.root == null ? -1 : heights(t)[t.root]; }

  function balance(t) {
    const h = heights(t);
    const H = (k) => (k == null ? -1 : h[k]);
    const bf = {};
    for (const k in t.nodes) bf[k] = H(t.nodes[k].l) - H(t.nodes[k].r);
    return bf;
  }

  function depths(t) {
    const d = {};
    const rec = (k, depth) => {
      if (k == null) return;
      d[k] = depth;
      rec(t.nodes[k].l, depth + 1);
      rec(t.nodes[k].r, depth + 1);
    };
    rec(t.root, 0);
    return d;
  }

  function inorder(t) {
    const out = [];
    const rec = (k) => {
      if (k == null) return;
      rec(t.nodes[k].l);
      out.push(k);
      rec(t.nodes[k].r);
    };
    rec(t.root);
    return out;
  }

  /* Parent-child pairs, parent first. */
  function edges(t) {
    const out = [];
    for (const k in t.nodes) {
      const n = t.nodes[k];
      if (n.l != null) out.push([Number(k), n.l]);
      if (n.r != null) out.push([Number(k), n.r]);
    }
    return out;
  }

  /* "5(3(2,4),7(6,8))"; an empty child is "-". */
  function shape(t, k) {
    const at = arguments.length < 2 ? t.root : k;
    if (at == null) return '-';
    const n = t.nodes[at];
    if (n.l == null && n.r == null) return String(at);
    return at + '(' + shape(t, n.l) + ',' + shape(t, n.r) + ')';
  }

  function parentOf(t, key) {
    let cur = t.root, par = null;
    while (cur != null && cur !== key) {
      par = cur;
      cur = key < cur ? t.nodes[cur].l : t.nodes[cur].r;
    }
    return par;
  }

  /* Plain BST insertion. Returns the search path (keys compared). */
  function insert(t, key) {
    const path = [];
    if (t.root == null) {
      t.root = key;
      t.nodes[key] = { l: null, r: null };
      return { path, parent: null, side: null };
    }
    let cur = t.root;
    for (;;) {
      path.push(cur);
      if (key === cur) return { path, parent: null, side: null, dup: true };
      const n = t.nodes[cur];
      const side = key < cur ? 'l' : 'r';
      if (n[side] == null) {
        n[side] = key;
        t.nodes[key] = { l: null, r: null };
        return { path, parent: cur, side };
      }
      cur = n[side];
    }
  }

  function replaceChild(t, parent, from, to) {
    if (parent == null) t.root = to;
    else if (t.nodes[parent].l === from) t.nodes[parent].l = to;
    else t.nodes[parent].r = to;
  }

  /* Single right rotation at a: its left child rises. */
  function rotR(t, a) {
    const b = t.nodes[a].l;
    const par = parentOf(t, a);
    t.nodes[a].l = t.nodes[b].r;
    t.nodes[b].r = a;
    replaceChild(t, par, a, b);
    return b;
  }

  /* Single left rotation at a: its right child rises. */
  function rotL(t, a) {
    const b = t.nodes[a].r;
    const par = parentOf(t, a);
    t.nodes[a].r = t.nodes[b].l;
    t.nodes[b].l = a;
    replaceChild(t, par, a, b);
    return b;
  }

  function bstInsertAll(list) {
    const t = empty();
    const events = [];
    const snaps = [];
    for (const key of list) {
      const r = insert(t, key);
      if (r.dup) continue;
      const snap = clone(t);
      events.push({ t: 'insert', key, path: r.path, parent: r.parent, side: r.side, snap });
      snaps.push(snap);
    }
    return { events, snaps, final: clone(t), rotations: [] };
  }

  /* Rebalance after inserting `key` (path = keys compared on the way down).
   * Returns the rotation event or null. */
  function rebalance(t, key, path) {
    const bf = balance(t);
    const all = path.filter((k) => Math.abs(bf[k]) >= 2);
    if (!all.length) return null;
    const at = all[all.length - 1];                 // closest to the new leaf
    const events = [{ t: 'unbalanced', at, bf: bf[at], all }];
    const stages = [];
    let kind;
    if (bf[at] > 1) {
      const c = t.nodes[at].l;
      if (bf[c] >= 0) {
        kind = 'R';
        stages.push({ kind: 'R', at, up: rotR(t, at), snap: clone(t) });
      } else {
        kind = 'LR';
        stages.push({ kind: 'L', at: c, up: rotL(t, c), snap: clone(t) });
        stages.push({ kind: 'R', at, up: rotR(t, at), snap: clone(t) });
      }
    } else {
      const c = t.nodes[at].r;
      if (bf[c] <= 0) {
        kind = 'L';
        stages.push({ kind: 'L', at, up: rotL(t, at), snap: clone(t) });
      } else {
        kind = 'RL';
        stages.push({ kind: 'R', at: c, up: rotR(t, c), snap: clone(t) });
        stages.push({ kind: 'L', at, up: rotL(t, at), snap: clone(t) });
      }
    }
    events.push({ t: 'rotate', kind, at, name: kind + '(' + at + ')', stages, snap: clone(t), bf: balance(t) });
    return events;
  }

  function avlInsertAll(list) {
    const t = empty();
    const events = [];
    const snaps = [];
    const rotations = [];
    for (const key of list) {
      const r = insert(t, key);
      if (r.dup) continue;
      events.push({ t: 'insert', key, path: r.path, parent: r.parent, side: r.side, snap: clone(t), bf: balance(t) });
      const rot = rebalance(t, key, r.path);
      if (rot) {
        events.push(...rot);
        rotations.push(rot[rot.length - 1].name);
      }
      snaps.push(clone(t));
    }
    return { events, snaps, final: clone(t), rotations };
  }

  /* Build a snapshot from nested arrays: [k, left, right] or a bare key. */
  function fromNested(spec) {
    const t = empty();
    const rec = (s) => {
      if (s == null) return null;
      const k = Array.isArray(s) ? s[0] : s;
      t.nodes[k] = { l: null, r: null };
      if (Array.isArray(s)) {
        t.nodes[k].l = rec(s[1]);
        t.nodes[k].r = rec(s[2]);
      }
      return k;
    };
    t.root = rec(spec);
    return t;
  }

  /* Group events per inserted key: [[insert, unbalanced?, rotate?], …]. */
  function perInsert(events) {
    const out = [];
    for (const e of events) {
      if (e.t === 'insert') out.push([e]);
      else if (out.length) out[out.length - 1].push(e);
    }
    return out;
  }

  return {
    empty, clone, keys, heights, height, balance, depths, inorder, edges, shape,
    insert, rotL, rotR, bstInsertAll, avlInsertAll, fromNested, perInsert,
  };
});
