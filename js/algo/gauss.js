/* Gaussian elimination with exact fractions (Levitin §6.2), as replayable
 * event lists.
 *
 * Fraction: an immutable rational p/q, always reduced, with q > 0.
 *   F(p, q = 1)  or  Fraction.from(x)   x = Fraction | integer | 'p/q' string
 *   .add(y) .sub(y) .mul(y) .div(y) .neg() .abs()   (y may be a number)
 *   .eq(y) .isZero() .isInt() .sign() .valueOf() .toString() -> '-1/2', '6'
 *
 * eliminate(A, {pivoting}) -> { events, U }
 *   A: n × (n+1) augmented matrix [coefficients | b] of numbers or Fractions
 *   (not modified). Forward elimination to upper-triangular form:
 *     for i <- 0..n-2:  for j <- i+1..n-1:
 *       row_j <- row_j - (A[j][i] / A[i][i]) · row_i
 *   A zero pivot is fixed by swapping in a lower row with a non-zero entry;
 *   {pivoting: true} always takes the largest |entry| (partial pivoting).
 *   events:
 *     { t: 'pivot', row, col, value }
 *     { t: 'swap', a, b }                      rows a and b exchanged
 *     { t: 'rowop', target, source, col, factor, before, row }
 *          row_target <- row_target - factor · row_source; before/row = the
 *          target row before/after (Fractions)
 *     { t: 'skip', target, source, col }      entry already zero
 *     { t: 'singular', col }                  no usable pivot in this column
 *     { t: 'done', U }
 *
 * backSubstitute(U) -> { events, x }
 *   Solves the triangular system from the last row up:
 *     x_j = (b_j - sum_{k>j} U[j][k] · x_k) / U[j][j]
 *   events: { t: 'solve', row, col, rhs, terms: [{col, coef, x}], numer, pivot, value }
 *
 * solve(A, opts) -> { elim, back, x }
 * multiply(A, x) -> the left-hand sides A[i][0..n-1] · x (Fractions), for checking.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else (root.Algo = root.Algo || {}).gauss = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function gcd(a, b) {
    a = Math.abs(a); b = Math.abs(b);
    while (b) { const t = a % b; a = b; b = t; }
    return a;
  }

  function safe(v) {
    if (!Number.isSafeInteger(v)) throw new RangeError('Fraction overflow: ' + v);
    return v;
  }

  class Fraction {
    constructor(p, q) {
      if (q === undefined) q = 1;
      if (!Number.isInteger(p) || !Number.isInteger(q)) throw new TypeError('Fraction needs integers: ' + p + '/' + q);
      if (q === 0) throw new RangeError('Fraction with zero denominator');
      if (q < 0) { p = -p; q = -q; }
      const g = gcd(p, q) || 1;
      this.p = safe(p / g) + 0;   // + 0 turns -0 into 0
      this.q = safe(q / g);
      Object.freeze(this);
    }

    static from(x) {
      if (x instanceof Fraction) return x;
      if (typeof x === 'number') return new Fraction(x, 1);
      if (typeof x === 'string') {
        const m = /^\s*([+\-−]?\d+)\s*(?:\/\s*([+\-−]?\d+))?\s*$/.exec(x);
        if (!m) throw new TypeError('Not a fraction: ' + x);
        const num = (s) => Number(s.replace('−', '-'));
        return new Fraction(num(m[1]), m[2] ? num(m[2]) : 1);
      }
      throw new TypeError('Not a fraction: ' + x);
    }

    add(y) { y = Fraction.from(y); return new Fraction(safe(this.p * y.q + y.p * this.q), safe(this.q * y.q)); }
    sub(y) { y = Fraction.from(y); return new Fraction(safe(this.p * y.q - y.p * this.q), safe(this.q * y.q)); }
    mul(y) { y = Fraction.from(y); return new Fraction(safe(this.p * y.p), safe(this.q * y.q)); }
    div(y) {
      y = Fraction.from(y);
      if (y.p === 0) throw new RangeError('Division by zero');
      return new Fraction(safe(this.p * y.q), safe(this.q * y.p));
    }
    neg() { return new Fraction(-this.p, this.q); }
    abs() { return new Fraction(Math.abs(this.p), this.q); }
    eq(y) { y = Fraction.from(y); return this.p === y.p && this.q === y.q; }
    cmp(y) { y = Fraction.from(y); return Math.sign(this.p * y.q - y.p * this.q); }
    isZero() { return this.p === 0; }
    isInt() { return this.q === 1; }
    sign() { return Math.sign(this.p); }
    valueOf() { return this.p / this.q; }
    toString() { return this.q === 1 ? String(this.p) : this.p + '/' + this.q; }
    toJSON() { return this.toString(); }
  }

  const F = (p, q) => new Fraction(p, q);

  function eliminate(A, opts) {
    const o = opts || {};
    const n = A.length;
    const M = A.map((row) => row.map((v) => Fraction.from(v)));
    const events = [];
    for (let i = 0; i < n - 1; i++) {
      let p = i;
      if (o.pivoting) {
        for (let r = i + 1; r < n; r++) if (M[r][i].abs().cmp(M[p][i].abs()) > 0) p = r;
      } else if (M[i][i].isZero()) {
        for (let r = i + 1; r < n; r++) if (!M[r][i].isZero()) { p = r; break; }
      }
      if (M[p][i].isZero()) { events.push({ t: 'singular', col: i }); continue; }
      if (p !== i) {
        const t = M[i]; M[i] = M[p]; M[p] = t;
        events.push({ t: 'swap', a: i, b: p });
      }
      events.push({ t: 'pivot', row: i, col: i, value: M[i][i] });
      for (let j = i + 1; j < n; j++) {
        const factor = M[j][i].div(M[i][i]);
        if (factor.isZero()) { events.push({ t: 'skip', target: j, source: i, col: i }); continue; }
        const before = M[j].slice();
        for (let k = i; k <= n; k++) M[j][k] = M[j][k].sub(M[i][k].mul(factor));
        events.push({ t: 'rowop', target: j, source: i, col: i, factor, before, row: M[j].slice() });
      }
    }
    const U = M.map((r) => r.slice());
    events.push({ t: 'done', U });
    return { events, U };
  }

  function backSubstitute(U) {
    const n = U.length;
    const x = new Array(n);
    const events = [];
    for (let j = n - 1; j >= 0; j--) {
      const rhs = Fraction.from(U[j][n]);
      const pivot = Fraction.from(U[j][j]);
      if (pivot.isZero()) throw new RangeError('Singular system: zero on the diagonal at row ' + j);
      let t = rhs;
      const terms = [];
      for (let k = j + 1; k < n; k++) {
        const coef = Fraction.from(U[j][k]);
        terms.push({ col: k, coef, x: x[k] });
        t = t.sub(coef.mul(x[k]));
      }
      x[j] = t.div(pivot);
      events.push({ t: 'solve', row: j, col: j, rhs, terms, numer: t, pivot, value: x[j] });
    }
    return { events, x };
  }

  function solve(A, opts) {
    const elim = eliminate(A, opts);
    const back = backSubstitute(elim.U);
    return { elim, back, x: back.x };
  }

  function multiply(A, x) {
    const n = x.length;
    return A.map((row) => {
      let s = F(0);
      for (let k = 0; k < n; k++) s = s.add(Fraction.from(row[k]).mul(x[k]));
      return s;
    });
  }

  return { Fraction, F, eliminate, backSubstitute, solve, multiply, gcd };
});
