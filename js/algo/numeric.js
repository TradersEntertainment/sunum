/* Numeric algorithms for the representation-change and reduction slides
 * (Levitin §6.5 Horner's rule and binary exponentiation, §6.6 reduction:
 * lcm via gcd, counting paths with matrix powers), as plain data and event
 * lists the slides replay.
 *
 * Polynomials are coefficient arrays with the HIGHEST power first:
 * [2, -1, 3, 1, -5] is 2x⁴ − x³ + 3x² + x − 5. Strings use a real minus
 * sign (U+2212) and Unicode superscripts.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else (root.Algo = root.Algo || {}).numeric = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const MINUS = '−';
  const SUP = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
  const sup = (n) => String(n).split('').map((d) => SUP[d]).join('');
  const num = (v) => (v < 0 ? MINUS + Math.abs(v) : String(v));

  /* ------------------------------------------------------------------
   * Horner's rule
   * ---------------------------------------------------------------- */

  /* Evaluate p(x) with Horner's rule. values[i] is the running value after
   * coefficient i (values[0] = a_n, values[i] = x·values[i−1] + a); the last
   * one is p(x) and the others are the quotient of p(x) ÷ (x − x0). */
  function horner(coeffs, x) {
    const values = [];
    const steps = [];
    let b = 0;
    coeffs.forEach((a, i) => {
      if (i === 0) {
        b = a;
        steps.push({ i, a, value: b });
      } else {
        const prev = b;
        b = x * prev + a;
        steps.push({ i, a, prev, product: x * prev, value: b });
      }
      values.push(b);
    });
    return { x, values, steps, value: b, quotient: values.slice(0, -1), remainder: b, mults: coeffs.length - 1, adds: coeffs.length - 1 };
  }

  /* Brute force: every term a·xᵏ on its own (k multiplications for xᵏ·a). */
  function evaluateDirect(coeffs, x) {
    const n = coeffs.length - 1;
    let sum = 0;
    let mults = 0;
    coeffs.forEach((a, i) => {
      let t = a;
      for (let k = 0; k < n - i; k++) { t *= x; mults++; }
      sum += t;
    });
    return { value: sum, mults };
  }

  /* "2x³ + 5x² + 18x + 55" */
  function polyString(coeffs, v) {
    const x = v || 'x';
    const n = coeffs.length - 1;
    let s = '';
    coeffs.forEach((a, i) => {
      if (a === 0) return;
      const e = n - i;
      const m = Math.abs(a);
      const body = (m !== 1 || e === 0 ? String(m) : '') + (e >= 1 ? x : '') + (e >= 2 ? sup(e) : '');
      if (!s) s = (a < 0 ? MINUS : '') + body;
      else s += (a < 0 ? ' ' + MINUS + ' ' : ' + ') + body;
    });
    return s || '0';
  }

  /* Tokens of the polynomial after factoring x out k times (0 ≤ k < n).
   * Every token has a stable id, so a slide can animate one stage into the
   * next:  o<j> "x(" (j = 1 is outermost) · c<j> ")" · s<i> sign of term i ·
   * k<i> coefficient · x<i> the variable · e<i> exponent.
   * Term i (exponent n − i) sits inside min(k, n − i) brackets and loses one
   * x per bracket. */
  function factorStage(coeffs, k) {
    const n = coeffs.length - 1;
    const toks = [];
    for (let j = 1; j <= k; j++) toks.push({ id: 'o' + j, kind: 'open', text: 'x(', depth: j });
    let depth = k;
    for (let i = 0; i <= n; i++) {
      const a = coeffs[i];
      const e0 = n - i;
      const d = Math.min(k, e0);
      while (depth > d) { toks.push({ id: 'c' + depth, kind: 'close', text: ')', depth }); depth--; }
      if (a === 0) continue;
      const e = e0 - d;
      if (i > 0) toks.push({ id: 's' + i, kind: 'sign', text: a < 0 ? MINUS : '+', term: i });
      else if (a < 0) toks.push({ id: 's' + i, kind: 'neg', text: MINUS, term: i });
      const m = Math.abs(a);
      if (m !== 1 || e === 0) toks.push({ id: 'k' + i, kind: 'coef', text: String(m), term: i, value: a });
      if (e >= 1) toks.push({ id: 'x' + i, kind: 'var', text: 'x', term: i });
      if (e >= 2) toks.push({ id: 'e' + i, kind: 'exp', text: String(e), term: i });
    }
    while (depth > 0) { toks.push({ id: 'c' + depth, kind: 'close', text: ')', depth }); depth--; }
    return toks;
  }

  function tokensToString(toks) {
    return toks.map((t) => {
      if (t.kind === 'sign') return ' ' + t.text + ' ';
      if (t.kind === 'exp') return sup(t.text);
      return t.text;
    }).join('');
  }

  /* Every stage from the plain polynomial (k = 0) to the fully nested form. */
  function factorStages(coeffs) {
    const n = coeffs.length - 1;
    const out = [];
    for (let k = 0; k <= Math.max(0, n - 1); k++) out.push(factorStage(coeffs, k));
    return out;
  }

  /* "x(x(x(2x − 1) + 3) + 1) − 5" */
  function nestedForm(coeffs) {
    const n = coeffs.length - 1;
    return tokensToString(factorStage(coeffs, Math.max(0, n - 1)));
  }

  /* ------------------------------------------------------------------
   * Binary exponentiation
   * ---------------------------------------------------------------- */

  /* Binary digits of n, most significant first: 13 → [1, 1, 0, 1]. */
  function bits(n) { return n.toString(2).split('').map(Number); }

  /* Left to right: the accumulator starts at a⁰ = 1; for every bit, square
   * (S: exponent doubles) and, if the bit is 1, multiply by a (M: +1).
   * exps[i] is the exponent after bit i. `mults` counts as Levitin does:
   * the first bit is free (the product starts at a). */
  function binExpLR(n) {
    const b = bits(n);
    const events = [];
    const ops = [];
    const exps = [];
    let e = 0;
    b.forEach((bit, i) => {
      events.push({ t: 'bit', i, bit });
      const from = e;
      e *= 2;
      events.push({ t: 'S', i, from, e });
      let op = 'S';
      if (bit) {
        events.push({ t: 'M', i, from: e, e: e + 1 });
        e += 1;
        op = 'SM';
      }
      ops.push(op);
      exps.push(e);
      events.push({ t: 'result', i, e, op });
    });
    const ones = b.filter(Boolean).length;
    return { n, bits: b, ops, exps, events, mults: (b.length - 1) + (ones - 1) };
  }

  /* Right to left: terms a, a², a⁴, a⁸ … (each the square of the one before)
   * under the bits from the right; the terms under 1-bits are multiplied
   * together. terms/used hold exponents in right-to-left order. */
  function binExpRL(n) {
    const b = bits(n);
    const events = [];
    const terms = [];
    const used = [];
    let t = 1;
    for (let r = 0; r < b.length; r++) {
      const i = b.length - 1 - r;           // index into b (MSB first)
      if (r > 0) { events.push({ t: 'square', from: t, to: t * 2, i }); t *= 2; }
      terms.push(t);
      events.push({ t: 'term', i, e: t, bit: b[i] });
      if (b[i]) used.push(t);
    }
    events.push({ t: 'product', used: used.slice(), e: used.reduce((s, v) => s + v, 0) });
    return { n, bits: b, terms, used, events, mults: (b.length - 1) + (used.length - 1) };
  }

  /* BigInt powers, to check both schemes against a ** n. */
  function powLR(a, n) {
    let p = 1n;
    for (const bit of bits(n)) {
      p *= p;
      if (bit) p *= a;
    }
    return p;
  }

  function powRL(a, n) {
    let term = a;
    let p = 1n;
    let m = n;
    while (m > 0) {
      if (m & 1) p *= term;
      m = Math.floor(m / 2);
      if (m > 0) term *= term;
    }
    return p;
  }

  /* ------------------------------------------------------------------
   * Problem reduction: lcm through gcd (Euclid)
   * ---------------------------------------------------------------- */

  /* Euclid: gcd(m, n) = gcd(n, m mod n) until n = 0.
   * pairs: [[60, 24], [24, 12], [12, 0]]. */
  function gcdSteps(m, n) {
    const pairs = [[m, n]];
    const steps = [];
    let a = m, b = n;
    while (b !== 0) {
      const q = Math.floor(a / b);
      const r = a % b;
      steps.push({ m: a, n: b, q, r });
      a = b;
      b = r;
      pairs.push([a, b]);
    }
    return { pairs, steps, gcd: a };
  }

  function gcd(m, n) { return gcdSteps(m, n).gcd; }

  /* lcm(m, n) · gcd(m, n) = m · n */
  function lcm(m, n) {
    if (m === 0 || n === 0) return 0;
    const g = gcd(m, n);
    return (m / g) * n;
  }

  /* ------------------------------------------------------------------
   * Problem reduction: counting paths with matrix powers
   * ---------------------------------------------------------------- */

  /* Adjacency matrix of a directed graph on vertices 1..n. */
  function adjacency(n, edges) {
    const A = Array.from({ length: n }, () => new Array(n).fill(0));
    edges.forEach(([u, v]) => { A[u - 1][v - 1] = 1; });
    return A;
  }

  function identity(n) {
    return Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)));
  }

  /* One entry with its row × column terms: C[i][j] = Σ A[i][k]·B[k][j]
   * (0-based indices). */
  function cellTerms(A, B, i, j) {
    const terms = A[i].map((a, k) => ({ k, a, b: B[k][j], p: a * B[k][j] }));
    return { i, j, terms, sum: terms.reduce((s, t) => s + t.p, 0) };
  }

  function matMul(A, B) {
    return A.map((row, i) => B[0].map((_, j) => cellTerms(A, B, i, j).sum));
  }

  /* Every cell of A·B with its terms, row by row. */
  function matMulTerms(A, B) {
    const cells = [];
    for (let i = 0; i < A.length; i++) for (let j = 0; j < B[0].length; j++) cells.push(cellTerms(A, B, i, j));
    return cells;
  }

  function matPow(A, k) {
    let R = identity(A.length);
    for (let t = 0; t < k; t++) R = matMul(R, A);
    return R;
  }

  return {
    MINUS, sup, num,
    horner, evaluateDirect, polyString, factorStage, factorStages, tokensToString, nestedForm,
    bits, binExpLR, binExpRL, powLR, powRL,
    gcdSteps, gcd, lcm,
    adjacency, identity, cellTerms, matMul, matMulTerms, matPow,
  };
});
