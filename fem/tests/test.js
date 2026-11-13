// Checks fem1d.js against known exact answers. Run:  node fem/tests/test.js
const F = require('../fem1d.js');
let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('FAIL', m); } else console.log('ok  ', m); };
const close = (a, b, t) => Math.abs(a - b) <= (t || 1e-12);
// 1. uniform stiffness matrix is (1/h) tridiag(-1,2,-1) with 1/h corners
{ const n = 4, { K } = F.assemble(F.uniformMesh(n), () => 1);
  ok(close(K[0][0], 4) && close(K[1][1], 8) && close(K[1][2], -4) && close(K[2][1], -4) && close(K[4][4], 4) && K[0][2] === 0 && K[0][4] === 0, 'uniform K = 4*tridiag(-1,2,-1), corners 4');
  ok(K.every(r => close(r.reduce((a, b) => a + b, 0), 0)), 'row sums zero before boundary conditions');
  ok(K.every((r, i) => r.every((v, j) => close(v, K[j][i]))), 'K symmetric'); }
// 2. load vector sums to the integral of f (partition of unity)
for (const [k, p] of Object.entries(F.problems)) for (const mesh of [F.uniformMesh(5), F.gradedMesh(5)]) {
  const { F: L } = F.assemble(mesh, p.f); const tot = L.reduce((a, b) => a + b, 0);
  ok(close(tot, F.simpson(p.f, 0, 1, 2000), 1e-5), `load sums to integral of f (${k})`); }
// 3. exact derivative and equation consistency of the three problems: -u'' = f, u(0)=u(1)=0
for (const [k, p] of Object.entries(F.problems)) {
  let bad = 0; const e = 1e-4;
  for (let x = 0.1; x < 0.95; x += 0.1) {
    if (!close(-(p.u(x + e) - 2 * p.u(x) + p.u(x - e)) / (e * e), p.f(x), 1e-4)) bad++;
    if (!close((p.u(x + e) - p.u(x - e)) / (2 * e), p.du(x), 1e-6)) bad++; }
  ok(bad === 0 && close(p.u(0), 0) && close(p.u(1), 0, 1e-12), `problem "${k}": -u''=f, du correct, zero at ends`);
  ok(Math.max(...Array.from({length:101},(_,i)=>p.u(i/100))) <= 1.0001, `problem "${k}": max u about 1`); }
// 4. nodal exactness
for (const [k, p] of Object.entries(F.problems)) for (const [mn, mesh] of [['uniform', F.uniformMesh(6)], ['graded', F.gradedMesh(6)]]) {
  const { U } = F.solve(mesh, p.f); const ne = F.nodalError(mesh, U, p.u);
  ok(ne < (k === 'middle' ? 1e-5 : 1e-12), `nodal error ${k}/${mn} = ${ne.toExponential(2)}`); }
// 5. second-order convergence between nodes
for (const [k, p] of Object.entries(F.problems)) {
  const errs = [4, 8, 16, 32].map(n => { const m = F.uniformMesh(n); return F.maxError(m, F.solve(m, p.f).U, p.u); });
  const ratios = errs.slice(1).map((e, i) => errs[i] / e);
  ok(ratios.every(r => r > 3.7 && r < 4.3), `error ratio about 4 (${k}): ${ratios.map(r => r.toFixed(2))}`); }
// 6. weak form: int u'v' = int f v for v vanishing at the ends; boundary term otherwise
for (const [k, p] of Object.entries(F.problems)) {
  const v = x => Math.sin(2 * Math.PI * x), dv = x => 2 * Math.PI * Math.cos(2 * Math.PI * x);
  ok(close(F.simpson(x => p.du(x) * dv(x), 0, 1), F.simpson(x => p.f(x) * v(x), 0, 1), 1e-7), `weak form balances (${k})`);
  const l = F.simpson(x => p.du(x) * 1, 0, 1), r = F.simpson(x => p.f(x) * x, 0, 1);
  ok(close(l - r, p.du(1), 1e-7), `v = x: mismatch equals u'(1) = ${p.du(1).toFixed(3)} (${k})`); }
// 7. hats: partition of unity and evalP1 agrees with the sum of hats
{ const m = F.gradedMesh(5), U = [0, .3, .9, .4, .7, 0]; let bad = 0;
  for (let x = 0; x <= 1; x += 0.013) { let s = 0, w = 0; for (let i = 0; i < 6; i++) { s += F.hat(m, i, x); w += U[i] * F.hat(m, i, x); }
    if (!close(s, 1, 1e-12) || !close(w, F.evalP1(m, U, x), 1e-12)) bad++; }
  ok(bad === 0, 'hats sum to 1; evalP1 equals the sum of scaled hats'); }
// 8. partial assembly matches the element-by-element story
{ const m = F.uniformMesh(4); const a = F.assemble(m, () => 8, 2).K;
  ok(close(a[0][0], 4) && close(a[1][1], 8) && close(a[2][2], 4) && a[3][3] === 0, 'after 2 elements: diagonal 4, 8, 4, 0, 0'); }
console.log(fails ? `\n${fails} FAILED` : '\nall passed'); process.exit(fails ? 1 : 0);
