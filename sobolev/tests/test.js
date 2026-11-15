// Checks sob.js against known exact answers. Run:  node sobolev/tests/test.js
const S = require('../sob.js');
let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('FAIL', m); } else console.log('ok  ', m); };
const close = (a, b, t) => Math.abs(a - b) <= (t || 1e-12);
const integrate = (f, a, b, n) => { let s = 0; const h = (b - a) / n; for (let i = 0; i < n; i++) s += f(a + (i + 0.5) * h) * h; return s; };

// 1. energies of the smoothed jump and the rounded corner
for (const eps of [0.4, 0.1, 0.02]) {
  const r = S.ramp(eps), t = S.tent(eps);
  ok(close(integrate((x) => r.du(x) ** 2, 0, 1, 200000), r.energy, 1e-2 * r.energy), `jump energy 1/eps at eps=${eps}`);
  ok(close(integrate((x) => t.du(x) ** 2, 0, 1, 200000), t.energy, 1e-4), `corner energy 4 - 8eps/3 at eps=${eps}`);
  ok(close(t.u(0.5 - eps / 2 - 1e-9), t.u(0.5 - eps / 2 + 1e-9), 1e-7) && close(t.u(0), 0) && close(t.u(1), 0), `rounded tent continuous, zero at ends (eps=${eps})`);
}

// 2. two materials: boundary values, continuity, flux, and the equation
for (const kappa of [0.01, 0.3, 1, 7, 100]) {
  const p = S.twoMaterial(kappa), e = 1e-6;
  ok(close(p.u(0), 0) && close(p.u(1), 0, 1e-12), `kappa=${kappa}: u zero at both ends`);
  ok(close(p.u(0.5 - e), p.u(0.5 + e), 1e-4), `kappa=${kappa}: u continuous at the interface`);
  let bad = 0;
  for (const x of [0.1, 0.3, 0.45, 0.6, 0.8, 0.95]) {
    if (!close((p.u(x + e) - p.u(x - e)) / (2 * e), p.du(x), 1e-6)) bad++;
    if (!close(p.k(x) * p.du(x), p.flux(x))) bad++;
  }
  ok(bad === 0, `kappa=${kappa}: du matches u, and k u' = c - x`);
  ok(close(p.slopeLeft, kappa * p.slopeRight), `kappa=${kappa}: slopes differ by the factor kappa`);
  // nodal exactness when the interface is a node (n even)
  const fe = S.twoMaterialFE(kappa, 8);
  ok(Math.max(...fe.nodes.map((x, i) => Math.abs(fe.U[i] - p.u(x)))) < 1e-12, `kappa=${kappa}: FE exact at nodes when x=1/2 is a node`);
}
{ const p = S.twoMaterial(10), fe = S.twoMaterialFE(10, 5);
  ok(Math.max(...fe.nodes.map((x, i) => Math.abs(fe.U[i] - p.u(x)))) > 1e-4, 'FE not exact at nodes when the interface cuts an element'); }
ok(close(S.twoMaterial(1).u(0.5), 0.125), 'kappa=1 reduces to u = x(1-x)/2');

// 3. sine minimisers: energies decrease to the exact minimum, functions converge
for (const kind of ['step', 'point']) {
  const d = S.ritzData[kind];
  const J = integrate((x) => 0.5 * d.du(x) ** 2, 0, 1, 20000) - (kind === 'step' ? integrate((x) => 8 * d.u(x), 0.5, 1, 20000) : 2 * d.u(0.5));
  ok(close(J, d.J, 1e-6), `${kind}: stated minimum energy is J(u)`);
  const gaps = [1, 2, 5, 10, 40, 400].map((N) => S.ritz(kind, N).gap);
  ok(gaps.every((g, i) => g > 0 && (i === 0 || g <= gaps[i - 1])), `${kind}: energy gap positive and decreasing`);
  ok(gaps[5] < (kind === 'step' ? 1e-6 : 2e-3), `${kind}: gap tends to zero (${gaps[5].toExponential(2)})`);
  const r = S.ritz(kind, 400);
  ok(Math.max(...[0.1, 0.3, 0.5, 0.7, 0.9].map((x) => Math.abs(r.u(x) - d.u(x)))) < 2e-3, `${kind}: partial sums converge to u`);
}
{ const r = S.ritz('step', 5), e = 1e-5;
  ok(close((r.u(0.3 + e) - r.u(0.3 - e)) / (2 * e), r.du(0.3), 1e-7) && close((r.du(0.3 + e) - r.du(0.3 - e)) / (2 * e), r.ddu(0.3), 1e-5), 'derivatives of the partial sum are consistent'); }

// 4. point loads
for (const n of [1, 4, 32]) {
  const p = S.point1D(n);
  ok(close(p.peak, 0.5) && p.nodes.every((x, i) => close(p.U[i], (1 - Math.abs(x)) / 2, 1e-12)), `1D point load exact at nodes, peak 1/2 (n=${n})`);
}
{ const peaks = [8, 16, 32, 64, 128, 256].map((n) => S.point2D(n).peak);
  const steps = peaks.slice(1).map((p, i) => p - peaks[i]);
  ok(steps.every((s) => close(s, Math.log(2) / (2 * Math.PI), 2e-3)), `2D peak grows by ln2/2π per halving of h (${steps.map((s) => s.toFixed(4)).join(', ')})`);
  const p = S.point2D(64);
  ok(Math.abs(p.U[32] - Math.log(2) / (2 * Math.PI)) < 2e-3, '2D radial solution matches -ln(r)/2π away from the centre'); }

// 5. convergence rates
const ns = [64, 128, 256, 512, 1024, 2048];
for (const alpha of [0.55, 0.6, 2 / 3, 0.75, 0.85]) {
  const uni = ns.map((n) => S.energyError(alpha, S.mesh(n, 1)));
  const gr = ns.map((n) => S.energyError(alpha, S.mesh(n, S.grading(alpha))));
  const ru = S.rate(ns, uni), rg = S.rate(ns, gr), want = alpha - 0.5;
  ok(close(ru, want, 0.04), `alpha=${alpha}: uniform rate ${ru.toFixed(3)} ≈ ${want.toFixed(2)}`);
  ok(close(rg, 1, 0.03), `alpha=${alpha}: graded rate ${rg.toFixed(3)} ≈ 1`);
}
{ // energy error by brute force agrees with the fast formula
  const alpha = 0.8, nodes = S.mesh(8, 1), s = S.singular(alpha);
  let e2 = 0;
  for (let i = 0; i < 8; i++) { const a = nodes[i], b = nodes[i + 1], sl = (s.u(b) - s.u(a)) / (b - a);
    e2 += integrate((t) => { const x = a + (b - a) * t * t; return (s.du(x) - sl) ** 2 * 2 * t * (b - a); }, 0, 1, 200000); }
  ok(close(Math.sqrt(e2 / s.total), S.energyError(alpha, nodes), 1e-4), 'energy error matches brute-force integration'); }

console.log(fails ? `\n${fails} FAILED` : '\nall passed');
process.exit(fails ? 1 : 0);
