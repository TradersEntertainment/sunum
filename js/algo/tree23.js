/* 2-3 trees (Levitin §6.3) as replayable snapshots.
 *
 * A snapshot is { root: id | null, nodes: { [id]: { keys: [..], kids: [ids] } } }.
 * Node ids are small integers handed out in creation order, so a node keeps
 * its identity while it grows; keys are distinct numbers and move on their own.
 *
 * insertAll(keys) → { events, final, splits }
 *   { t: 'insert', key, path, leaf, snap }        key placed in its leaf (may now hold 3 keys)
 *   { t: 'overflow', node, keys }                 node holds 3 keys
 *   { t: 'split', node, keys: [a, b, c], up: b,   node keeps a, new node `right` gets c,
 *     left, right, parent, newRoot, snap }        b moves into `parent` (a new root if newRoot)
 *   { t: 'done', snap }
 * A split of an internal node gives its two right children to `right`.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else (root.Algo = root.Algo || {}).tree23 = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function clone(t) {
    const nodes = {};
    for (const id in t.nodes) nodes[id] = { keys: t.nodes[id].keys.slice(), kids: t.nodes[id].kids.slice() };
    return { root: t.root, nodes };
  }

  /* Which child of node n a search for key goes to. */
  function childIndex(n, key) {
    let i = 0;
    while (i < n.keys.length && key > n.keys[i]) i++;
    return i;
  }

  function insertAll(list) {
    const t = { root: null, nodes: {} };
    let next = 0;
    const make = (keys, kids) => { const id = next++; t.nodes[id] = { keys, kids }; return id; };
    const events = [];
    const splits = [];
    const snap = () => ({ root: t.root, nodes: clone(t).nodes });

    for (const key of list) {
      if (t.root == null) {
        const id = make([key], []);
        t.root = id;
        events.push({ t: 'insert', key, path: [id], leaf: id, snap: snap() });
        continue;
      }
      const path = [];
      let id = t.root;
      let dup = false;
      for (;;) {
        path.push(id);
        const n = t.nodes[id];
        if (n.keys.includes(key)) { dup = true; break; }
        if (!n.kids.length) break;
        id = n.kids[childIndex(n, key)];
      }
      if (dup) continue;                              // already present
      const leaf = t.nodes[id];
      leaf.keys.splice(childIndex(leaf, key), 0, key);
      events.push({ t: 'insert', key, path, leaf: id, snap: snap() });

      let cur = id;
      let level = path.length - 1;
      while (t.nodes[cur].keys.length === 3) {
        const n = t.nodes[cur];
        const [a, b, c] = n.keys;
        events.push({ t: 'overflow', node: cur, keys: [a, b, c] });
        const right = make([c], n.kids.length ? n.kids.slice(2) : []);
        n.keys = [a];
        n.kids = n.kids.length ? n.kids.slice(0, 2) : [];
        let parent;
        let newRoot = false;
        if (level === 0) {
          parent = make([b], [cur, right]);
          t.root = parent;
          newRoot = true;
        } else {
          parent = path[level - 1];
          const p = t.nodes[parent];
          const at = p.kids.indexOf(cur);
          p.kids.splice(at + 1, 0, right);
          p.keys.splice(at, 0, b);
        }
        const ev = { t: 'split', node: cur, keys: [a, b, c], up: b, left: cur, right, parent, newRoot, snap: snap() };
        events.push(ev);
        splits.push(ev);
        cur = parent;
        level--;
      }
    }
    events.push({ t: 'done', snap: snap() });
    return { events, final: snap(), splits };
  }

  /* "[5]([3]([2],[4]),[8]([7],[9]))" */
  function shape(t, id) {
    const at = arguments.length < 2 ? t.root : id;
    if (at == null) return '';
    const n = t.nodes[at];
    const s = '[' + n.keys.join(',') + ']';
    return n.kids.length ? s + '(' + n.kids.map((k) => shape(t, k)).join(',') + ')' : s;
  }

  function height(t) {
    let h = -1;
    let id = t.root;
    while (id != null) { h++; const n = t.nodes[id]; id = n.kids.length ? n.kids[0] : null; }
    return h;
  }

  /* Depth of every node, and the list of leaves left to right. */
  function walk(t) {
    const depth = {};
    const leaves = [];
    const rec = (id, d) => {
      depth[id] = d;
      const n = t.nodes[id];
      if (!n.kids.length) leaves.push(id);
      n.kids.forEach((k) => rec(k, d + 1));
    };
    if (t.root != null) rec(t.root, 0);
    return { depth, leaves };
  }

  function inorder(t) {
    const out = [];
    const rec = (id) => {
      const n = t.nodes[id];
      if (!n.kids.length) { out.push(...n.keys); return; }
      n.kids.forEach((k, i) => { rec(k); if (i < n.keys.length) out.push(n.keys[i]); });
    };
    if (t.root != null) rec(t.root);
    return out;
  }

  /* Structural check: 1–2 sorted keys per node, keys+1 children for internal
   * nodes, every leaf on the same level, search-tree order. Returns a list
   * of problems (empty = valid). */
  function check(t) {
    const problems = [];
    const { depth, leaves } = walk(t);
    const leafDepths = new Set(leaves.map((id) => depth[id]));
    if (leafDepths.size > 1) problems.push('leaves on different levels');
    for (const id in t.nodes) {
      if (!(id in depth)) continue;
      const n = t.nodes[id];
      if (n.keys.length < 1 || n.keys.length > 2) problems.push('node ' + id + ' has ' + n.keys.length + ' keys');
      if (n.kids.length && n.kids.length !== n.keys.length + 1) problems.push('node ' + id + ' has ' + n.kids.length + ' children');
      for (let i = 1; i < n.keys.length; i++) if (n.keys[i - 1] >= n.keys[i]) problems.push('node ' + id + ' keys unsorted');
    }
    const io = inorder(t);
    for (let i = 1; i < io.length; i++) if (io[i - 1] >= io[i]) { problems.push('in-order not sorted'); break; }
    return problems;
  }

  return { insertAll, shape, height, walk, inorder, check, clone, childIndex };
});
