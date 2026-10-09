// Gaussian elimination with exact fractions (Levitin §6.2), on the deck's
// system 2x1 - 4x2 + x3 = 6, 3x1 - x2 + x3 = 11, x1 + x2 - x3 = -3.
const test = require('node:test');
const assert = require('node:assert/strict');
const g = require('../js/algo/gauss.js');

const { F, Fraction } = g;
const A = [
  [2, -4, 1, 6],
  [3, -1, 1, 11],
  [1, 1, -1, -3],
];
const str = (row) => row.map(String);

test('fractions reduce, keep the sign on top and do exact arithmetic', () => {
  assert.equal(String(F(6, -4)), '-3/2');
  assert.equal(String(F(0, -5)), '0');
  assert.equal(String(F(10, 5)), '2');
  assert.ok(F(1, 2).add(F(1, 3)).eq(F(5, 6)));
  assert.ok(F(-3, 2).sub(F(-3, 10)).eq(F(-6, 5)));
  assert.ok(F(-36, 5).div(F(-6, 5)).eq(6));
  assert.ok(F(3, 5).mul(5).eq(3));
  assert.ok(Fraction.from('−1/2').eq(F(-1, 2)));
  assert.equal(F(-1, 2).sign(), -1);
  assert.equal(+F(3, 4), 0.75);
  assert.throws(() => F(1, 0));
  assert.throws(() => F(1, 2).div(0));
});

test('forward elimination reproduces the deck rows, in order', () => {
  const r = g.eliminate(A);
  const ops = r.events.filter((e) => e.t === 'rowop');
  assert.deepEqual(ops.map((e) => [e.target, e.source, String(e.factor)]), [
    [1, 0, '3/2'],
    [2, 0, '1/2'],
    [2, 1, '3/5'],
  ]);
  assert.deepEqual(str(ops[0].row), ['0', '5', '-1/2', '2']);
  assert.deepEqual(str(ops[1].row), ['0', '3', '-3/2', '-6']);
  assert.deepEqual(str(ops[2].row), ['0', '0', '-6/5', '-36/5']);
  assert.deepEqual(str(ops[0].before), ['3', '-1', '1', '11']);
  assert.deepEqual(str(ops[2].before), ['0', '3', '-3/2', '-6']);
  assert.deepEqual(r.U.map(str), [
    ['2', '-4', '1', '6'],
    ['0', '5', '-1/2', '2'],
    ['0', '0', '-6/5', '-36/5'],
  ]);
  assert.equal(r.events.filter((e) => e.t === 'swap').length, 0);
  assert.deepEqual(r.events.filter((e) => e.t === 'pivot').map((e) => [e.row, String(e.value)]), [[0, '2'], [1, '5']]);
  // the input is untouched
  assert.deepEqual(A[1], [3, -1, 1, 11]);
});

test('backward substitution gives x = (2, 1, 6), solving from the bottom up', () => {
  const { U } = g.eliminate(A);
  const b = g.backSubstitute(U);
  assert.deepEqual(b.x.map(String), ['2', '1', '6']);
  assert.deepEqual(b.events.map((e) => [e.row, String(e.value)]), [[2, '6'], [1, '1'], [0, '2']]);
  // x3 = (-36/5) / (-6/5)
  assert.equal(String(b.events[0].numer), '-36/5');
  assert.equal(String(b.events[0].pivot), '-6/5');
  // x2 = (2 - (-1/2)·6) / 5 = (2 + 3) / 5
  assert.equal(String(b.events[1].numer), '5');
  assert.deepEqual(b.events[1].terms.map((t) => [t.col, String(t.coef), String(t.x)]), [[2, '-1/2', '6']]);
  // x1 = (6 - (-4)·1 - 1·6) / 2 = 4 / 2
  assert.equal(String(b.events[2].numer), '4');
});

test('A · x = b exactly', () => {
  const { x } = g.solve(A);
  const lhs = g.multiply(A, x);
  assert.deepEqual(lhs.map(String), ['6', '11', '-3']);
  lhs.forEach((v, i) => assert.ok(v.eq(A[i][3])));
});

test('a zero pivot is fixed by a row swap', () => {
  const r = g.solve([
    [0, 1, 2],
    [1, 1, 3],
  ]);
  assert.equal(r.elim.events[0].t, 'swap');
  assert.deepEqual(r.x.map(String), ['1', '2']);
});

test('partial pivoting picks the largest entry and finds the same solution', () => {
  const r = g.solve(A, { pivoting: true });
  assert.deepEqual(r.elim.events.filter((e) => e.t === 'swap')[0], { t: 'swap', a: 0, b: 1 });
  assert.deepEqual(r.x.map(String), ['2', '1', '6']);
});

test('random integer systems with a known solution are solved exactly', () => {
  let seed = 5;
  const rnd = (k) => ((seed = (seed * 16807) % 2147483647) % k);
  let solved = 0;
  for (let t = 0; t < 300; t++) {
    const n = 2 + rnd(3);
    const x0 = Array.from({ length: n }, () => F(rnd(9) - 4, 1 + rnd(3)));
    const M = Array.from({ length: n }, () => Array.from({ length: n }, () => rnd(11) - 5));
    const rows = M.map((row) => row.concat([row.reduce((s, c, k) => s.add(x0[k].mul(c)), F(0))]));
    let r;
    try { r = g.solve(rows); } catch (e) { continue; }   // singular matrix
    if (r.elim.events.some((e) => e.t === 'singular')) continue;
    solved++;
    r.x.forEach((v, k) => assert.ok(v.eq(x0[k]), 'x' + k));
    g.multiply(rows, r.x).forEach((v, i) => assert.ok(v.eq(rows[i][n])));
    // U is upper triangular
    r.elim.U.forEach((row, i) => row.slice(0, i).forEach((v) => assert.ok(v.isZero())));
  }
  assert.ok(solved > 200);
});
