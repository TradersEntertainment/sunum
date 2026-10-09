// Horner, binary exponentiation, lcm via gcd and path counting (Levitin §6.5–6.6).
const test = require('node:test');
const assert = require('node:assert/strict');
const N = require('../js/algo/numeric.js');

const P = [2, -1, 3, 1, -5];          // 2x⁴ − x³ + 3x² + x − 5 (the deck's example)
const M = '−';

/* deterministic generator, like the deck's U.shuffle */
function rng(seed) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

test('Horner at x = 3 reproduces the table 2, 5, 18, 55, 160', () => {
  const h = N.horner(P, 3);
  assert.deepEqual(h.values, [2, 5, 18, 55, 160]);
  assert.equal(h.value, 160);
  assert.deepEqual(h.steps.slice(1).map((s) => [s.prev, s.a, s.value]), [[2, -1, 5], [5, 3, 18], [18, 1, 55], [55, -5, 160]]);
  assert.equal(h.mults, 4);
  assert.equal(h.adds, 4);
});

test('nested form of 2x⁴ − x³ + 3x² + x − 5', () => {
  assert.equal(N.nestedForm(P), `x(x(x(2x ${M} 1) + 3) + 1) ${M} 5`);
  assert.deepEqual(N.factorStages(P).map(N.tokensToString), [
    `2x⁴ ${M} x³ + 3x² + x ${M} 5`,
    `x(2x³ ${M} x² + 3x + 1) ${M} 5`,
    `x(x(2x² ${M} x + 3) + 1) ${M} 5`,
    `x(x(x(2x ${M} 1) + 3) + 1) ${M} 5`,
  ]);
  // token ids stay stable from stage to stage
  const ids = N.factorStages(P).map((s) => s.map((t) => t.id));
  assert.deepEqual(ids[3], ['o1', 'o2', 'o3', 'k0', 'x0', 's1', 'k1', 'c3', 's2', 'k2', 'c2', 's3', 'k3', 'c1', 's4', 'k4']);
});

test('the middle numbers are the quotient of p(x) ÷ (x − 3), the last one the remainder', () => {
  const h = N.horner(P, 3);
  assert.deepEqual(h.quotient, [2, 5, 18, 55]);
  assert.equal(N.polyString(h.quotient), '2x³ + 5x² + 18x + 55');
  assert.equal(h.remainder, 160);
  // p(x) = (x − 3)·q(x) + r for several x
  for (let x = -4; x <= 6; x++) {
    const q = N.horner(h.quotient, x).value;
    assert.equal((x - 3) * q + h.remainder, N.evaluateDirect(P, x).value);
  }
});

test('polyString handles signs, ones and zeros', () => {
  assert.equal(N.polyString(P), `2x⁴ ${M} x³ + 3x² + x ${M} 5`);
  assert.equal(N.polyString([-1, 0, 1]), `${M}x² + 1`);
  assert.equal(N.polyString([0]), '0');
  assert.equal(N.nestedForm([3, 0, -2]), `x(3x) ${M} 2`);
  assert.equal(N.nestedForm([4, 7]), '4x + 7');
});

test('random polynomials: Horner = direct evaluation, n multiplications vs n(n+1)/2', () => {
  const r = rng(11);
  for (let t = 0; t < 400; t++) {
    const n = 1 + Math.floor(r() * 8);
    const c = Array.from({ length: n + 1 }, (_, i) => (i === 0 ? 1 + Math.floor(r() * 9) : Math.floor(r() * 19) - 9));
    const x = Math.floor(r() * 11) - 5;
    const h = N.horner(c, x);
    const d = N.evaluateDirect(c, x);
    assert.equal(h.value, d.value);
    assert.equal(h.mults, n);
    assert.equal(d.mults, (n * (n + 1)) / 2);
    // every stage string evaluates like the polynomial (spot check: no stray tokens)
    const last = N.factorStage(c, n - 1);
    assert.equal(last.filter((tk) => tk.kind === 'open').length, Math.max(0, n - 1));
    assert.equal(last.filter((tk) => tk.kind === 'close').length, Math.max(0, n - 1));
  }
});

test('left-to-right binary exponentiation of a¹³: SM, SM, S, SM', () => {
  const lr = N.binExpLR(13);
  assert.deepEqual(lr.bits, [1, 1, 0, 1]);
  assert.deepEqual(lr.ops, ['SM', 'SM', 'S', 'SM']);
  assert.deepEqual(lr.exps, [1, 3, 6, 13]);
  assert.equal(lr.mults, 5);                       // 3 squarings + 2 multiplications
  const ex = lr.events.filter((e) => e.t === 'S' || e.t === 'M').map((e) => e.t + e.e);
  assert.deepEqual(ex, ['S0', 'M1', 'S2', 'M3', 'S6', 'S12', 'M13']);
});

test('right-to-left binary exponentiation of a¹³: terms a, a², a⁴, a⁸; use a⁸·a⁴·a', () => {
  const rl = N.binExpRL(13);
  assert.deepEqual(rl.terms, [1, 2, 4, 8]);
  assert.deepEqual(rl.used, [1, 4, 8]);
  assert.equal(rl.events.at(-1).e, 13);
});

test('both schemes give a^n exactly (BigInt) for every n ≤ 5000, with ≤ 2⌊log₂ n⌋ multiplications', () => {
  for (let n = 1; n <= 5000; n++) {
    const a = BigInt(2 + (n % 5));
    const want = a ** BigInt(n);
    assert.equal(N.powLR(a, n), want, 'LR n=' + n);
    assert.equal(N.powRL(a, n), want, 'RL n=' + n);
    const lr = N.binExpLR(n);
    const rl = N.binExpRL(n);
    assert.equal(lr.exps.at(-1), n);
    assert.equal(rl.used.reduce((s, v) => s + v, 0), n);
    const bound = 2 * Math.floor(Math.log2(n));
    assert.ok(lr.mults <= bound, 'LR count n=' + n);
    assert.ok(rl.mults <= bound, 'RL count n=' + n);
  }
  assert.equal(N.powLR(5n, 0), 1n);
  assert.equal(N.powRL(5n, 0), 1n);
});

test('Euclid: gcd(60, 24) → gcd(24, 12) → gcd(12, 0) = 12; lcm(24, 60) = 120', () => {
  const g = N.gcdSteps(60, 24);
  assert.deepEqual(g.pairs, [[60, 24], [24, 12], [12, 0]]);
  assert.deepEqual(g.steps.map((s) => s.r), [12, 0]);
  assert.equal(g.gcd, 12);
  assert.equal(N.lcm(24, 60), 120);
  assert.equal(N.lcm(24, 60) * N.gcd(24, 60), 24 * 60);
});

test('random pairs: lcm·gcd = m·n and lcm is the least common multiple', () => {
  const r = rng(5);
  for (let t = 0; t < 300; t++) {
    const m = 1 + Math.floor(r() * 200);
    const n = 1 + Math.floor(r() * 200);
    const g = N.gcd(m, n);
    const l = N.lcm(m, n);
    assert.equal(l * g, m * n);
    assert.equal(m % g, 0);
    assert.equal(n % g, 0);
    assert.equal(l % m, 0);
    assert.equal(l % n, 0);
    for (let k = 1; k < l; k++) assert.ok(k % m !== 0 || k % n !== 0, 'smaller common multiple ' + k);
  }
});

test('the deck graph: A and A² (two paths of length 2 from 2 to 4)', () => {
  const A = N.adjacency(4, [[1, 3], [1, 4], [2, 1], [2, 3], [3, 4]]);
  assert.deepEqual(A, [[0, 0, 1, 1], [1, 0, 1, 0], [0, 0, 0, 1], [0, 0, 0, 0]]);
  const A2 = N.matMul(A, A);
  assert.deepEqual(A2, [[0, 0, 0, 1], [0, 0, 1, 2], [0, 0, 0, 0], [0, 0, 0, 0]]);
  assert.deepEqual(N.matPow(A, 2), A2);
  const c = N.cellTerms(A, A, 1, 3);                  // entry (2, 4)
  assert.deepEqual(c.terms.map((t) => [t.a, t.b, t.p]), [[1, 1, 1], [0, 0, 0], [1, 1, 1], [0, 0, 0]]);
  assert.equal(c.sum, 2);
  // the non-zero terms are the intermediate vertices 1 and 3
  assert.deepEqual(c.terms.filter((t) => t.p).map((t) => t.k + 1), [1, 3]);
  assert.equal(N.matMulTerms(A, A).length, 16);
  assert.deepEqual(N.matPow(A, 0), N.identity(4));
});

test('random small graphs: (A^k)[i][j] counts the walks of length k by brute force', () => {
  const r = rng(3);
  const walks = (A, i, j, k) => {
    if (k === 0) return i === j ? 1 : 0;
    let c = 0;
    for (let v = 0; v < A.length; v++) if (A[i][v]) c += walks(A, v, j, k - 1);
    return c;
  };
  for (let t = 0; t < 60; t++) {
    const n = 2 + Math.floor(r() * 4);
    const edges = [];
    for (let u = 1; u <= n; u++) for (let v = 1; v <= n; v++) if (r() < 0.4) edges.push([u, v]);
    const A = N.adjacency(n, edges);
    for (let k = 0; k <= 4; k++) {
      const P2 = N.matPow(A, k);
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) assert.equal(P2[i][j], walks(A, i, j, k));
    }
  }
});
