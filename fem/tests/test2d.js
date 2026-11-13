// Checks fem2d.js against known exact answers. Run:  node fem/tests/test2d.js
const G = require('../fem2d.js');
let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('FAIL', m); } else console.log('ok  ', m); };
const close = (a, b, t) => Math.abs(a - b) <= (t || 1e-12);
// 1. right triangle with legs h: K = 1/2 [[2,-1,-1],[-1,1,0],[-1,0,1]], independent of h
for (const h of [1, 0.25]) { const g = G.triangle([0, 0], [h, 0], [0, h]); const E = [[1, -.5, -.5], [-.5, .5, 0], [-.5, 0, .5]];
  ok(g.K.every((r, i) => r.every((v, j) => close(v, E[i][j]))) && close(g.area, h * h / 2), `right triangle, legs ${h}: K = ½[[2,−1,−1],[−1,1,0],[−1,0,1]]`); }
// 2. general triangle: row sums zero, symmetric, cotangent formula, orientation-independent
{ const P = [[0.1, 0.2], [0.9, 0.1], [0.4, 0.8]], g = G.triangle(...P), g2 = G.triangle(P[0], P[2], P[1]);
  ok(g.K.every(r => close(r[0] + r[1] + r[2], 0, 1e-12)), 'row sums zero');
  ok(close(g.angles[0] + g.angles[1] + g.angles[2], Math.PI, 1e-12), 'angles sum to π');
  let cot = true; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) if (i !== j) { const k = 3 - i - j; if (!close(g.K[i][j], -0.5 / Math.tan(g.angles[k]), 1e-12)) cot = false; }
  ok(cot, 'off-diagonal K_ij = −½ cot(opposite angle)');
  ok(close(g.K[0][0], 0.5 * (1 / Math.tan(g.angles[1]) + 1 / Math.tan(g.angles[2])), 1e-12), 'diagonal K_ii = ½(cot + cot)');
  ok(close(g.K[0][1], g2.K[0][2], 1e-12) && close(g.area, g2.area), 'same matrix if corners are listed clockwise');
  // gradient of hat 1 is perpendicular to the opposite edge, with length 1/height
  const e = [P[2][0] - P[1][0], P[2][1] - P[1][1]], gr = g.grads[0];
  ok(close(gr[0] * e[0] + gr[1] * e[1], 0, 1e-12) && close(Math.hypot(...gr), Math.hypot(...e) / (2 * g.area), 1e-12), '∇φ₁ ⟂ opposite edge, |∇φ₁| = 1/height'); }
// 3. obtuse triangle gives a positive off-diagonal entry
{ const g = G.triangle([0, 0], [1, 0], [0.5, 0.15]); ok(g.angles[2] > Math.PI / 2 && g.K[0][1] > 0, 'obtuse angle ⇒ positive off-diagonal entry'); }
// 4. assembled matrix on the structured mesh is the 5-point stencil; diagonal couplings are exactly zero
{ const m = G.mesh(4), { rows } = G.assemble(m, null), k = 2 * 5 + 2, r = rows[k];
  ok(close(r.get(k), 4) && [k - 1, k + 1, k - 5, k + 5].every(j => close(r.get(j), -1)), 'interior row: 4 on the diagonal, −1 for the four axis neighbours');
  ok(r.has(k + 6) && r.has(k - 6) && close(r.get(k + 6), 0) && close(r.get(k - 6), 0) && r.size === 7, 'the two diagonal neighbours are touched but exactly zero; 7 entries in the row');
  ok(rows.every(row => { let s = 0; row.forEach(v => s += v); return close(s, 0, 1e-12); }), 'all row sums zero before boundary conditions');
  ok(m.tris.length === 32 && m.nodes.length === 25, 'mesh(4): 25 nodes, 32 triangles'); }
// 5. load vector sums to the integral of f
for (const [k, p] of Object.entries(G.problems)) { const m = G.mesh(8), { F } = G.assemble(m, p.f); let ex = 0; const q = 200;
  for (let i = 0; i < q; i++) for (let j = 0; j < q; j++) ex += p.f((i + .5) / q, (j + .5) / q) / (q * q);
  ok(close(F.reduce((a, b) => a + b, 0), ex, 2e-3 * Math.abs(ex)), `load sums to ∫f (${k})`); }
// 6. the three problems satisfy −Δu = f and vanish on the boundary; max about 1
for (const [k, p] of Object.entries(G.problems)) { let bad = 0, mx = 0; const e = 1e-4;
  for (let x = 0.1; x < 0.95; x += 0.2) for (let y = 0.1; y < 0.95; y += 0.2) {
    const lap = (p.u(x + e, y) + p.u(x - e, y) + p.u(x, y + e) + p.u(x, y - e) - 4 * p.u(x, y)) / (e * e);
    if (!close(-lap, p.f(x, y), 1e-4)) bad++; }
  for (let s = 0; s <= 1; s += 0.05) { if (!close(p.u(s, 0), 0) || !close(p.u(s, 1), 0, 1e-12) || !close(p.u(0, s), 0) || !close(p.u(1, s), 0, 1e-12)) bad++; for (let t = 0; t <= 1; t += 0.05) mx = Math.max(mx, p.u(s, t)); }
  ok(bad === 0 && mx > 0.95 && mx < 1.01, `problem "${k}": −Δu = f, zero on the boundary, max ${mx.toFixed(3)}`); }
// 7. convergence: error falls by about 4 per halving
for (const [k, p] of Object.entries(G.problems)) {
  const errs = [4, 8, 16, 32].map(n => { const m = G.mesh(n), s = G.solve(m, p.f); return G.maxError(m, s.U, p.u); });
  const ratios = errs.slice(1).map((e, i) => errs[i] / e);
  ok(ratios.every(r => r > 3.3 && r < 4.6), `error ratio about 4 (${k}): ${ratios.map(r => r.toFixed(2))}; n=32 error ${errs[3].toExponential(2)}`); }
// 8. CG really solved the system; in 2D the nodes are NOT exact
{ const p = G.problems.middle, m = G.mesh(8), s = G.solve(m, p.f); let res = 0;
  m.nodes.forEach((_, i) => { if (m.boundary[i]) return; let r = -s.F[i]; s.rows[i].forEach((v, j) => r += v * s.U[j]); res = Math.max(res, Math.abs(r)); });
  ok(res < 1e-10, `CG residual ${res.toExponential(1)} after ${s.iters} iterations, ${s.unknowns} unknowns`);
  const ne = G.nodalError(m, s.U, p.u); ok(ne > 1e-4, `nodal error in 2D is not zero: ${ne.toExponential(2)}`); }
// 9. shuffled numbering is a permutation
{ const q = G.shuffled(25); ok(new Set(q).size === 25 && q.some((v, i) => v !== i), 'shuffled(25) is a permutation'); }
console.log(fails ? `\n${fails} FAILED` : '\nall passed'); process.exit(fails ? 1 : 0);
