// =====================================================================
// sob.js — the numerical core of "Why Sobolev spaces?".
// Pure functions, no drawing. Everything the figures show is computed
// here, and tests/test.js checks these functions against exact answers.
// One block per chapter.
// =====================================================================
(function (root) {
  'use strict';
  const PI = Math.PI;
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

  // Solve a tridiagonal system (lower a, diagonal b, upper c, right side d).
  function thomas(a, b, c, d) {
    const n = b.length, cp = new Array(n), dp = new Array(n), x = new Array(n);
    cp[0] = c[0] / b[0]; dp[0] = d[0] / b[0];
    for (let i = 1; i < n; i++) {
      const m = b[i] - a[i] * cp[i - 1];
      cp[i] = c[i] / m; dp[i] = (d[i] - a[i] * dp[i - 1]) / m;
    }
    x[n - 1] = dp[n - 1];
    for (let i = n - 2; i >= 0; i--) x[i] = dp[i] - cp[i] * x[i + 1];
    return x;
  }

  // ---- CHAPTER 1: a jump and a corner, each smoothed over a width eps ----
  // Jump: rises from 0 to 1 across [1/2 − eps/2, 1/2 + eps/2].
  function ramp(eps) {
    return {
      u: (x) => clamp((x - 0.5) / eps + 0.5, 0, 1),
      du: (x) => (Math.abs(x - 0.5) < eps / 2 ? 1 / eps : 0),
      energy: 1 / eps,
    };
  }
  // Corner: the tent 1 − |2x − 1| with its tip rounded by a parabola of width eps.
  function tent(eps) {
    return {
      u: (x) => { const t = x - 0.5; return Math.abs(t) < eps / 2 ? 1 - eps / 2 - (2 * t * t) / eps : 1 - 2 * Math.abs(t); },
      du: (x) => { const t = x - 0.5; return Math.abs(t) < eps / 2 ? (-4 * t) / eps : t < 0 ? 2 : -2; },
      energy: 4 - (8 * eps) / 3,
    };
  }

  // ---- CHAPTER 2: a rod of two materials ---------------------------------
  // −(k u′)′ = 1 on (0,1), u(0) = u(1) = 0, k = 1 on the left half, kappa on the right.
  function twoMaterial(kappa) {
    const c = (kappa + 3) / (4 * (kappa + 1));          // the flux k u′ equals c − x
    const uHalf = c / 2 - 1 / 8;
    return {
      c, k: (x) => (x < 0.5 ? 1 : kappa),
      flux: (x) => c - x,
      du: (x) => (c - x) / (x < 0.5 ? 1 : kappa),
      u: (x) => (x <= 0.5 ? c * x - (x * x) / 2 : uHalf + (c * (x - 0.5) - (x * x - 0.25) / 2) / kappa),
      slopeLeft: c - 0.5, slopeRight: (c - 0.5) / kappa,
    };
  }
  // Linear finite elements on n equal elements. The element integral of k is exact,
  // also when the interface x = 1/2 falls inside an element.
  function twoMaterialFE(kappa, n) {
    const h = 1 / n, ke = [];
    for (let e = 0; e < n; e++) {
      const a = e * h, b = a + h;
      const left = clamp(0.5 - a, 0, h), right = clamp(b - 0.5, 0, h);
      ke.push((left + kappa * right) / (h * h));
    }
    const m = n - 1, lo = [], di = [], up = [], rhs = [];
    for (let i = 1; i <= m; i++) { lo.push(-ke[i - 1]); di.push(ke[i - 1] + ke[i]); up.push(-ke[i]); rhs.push(h); }
    const U = m > 0 ? thomas(lo, di, up, rhs) : [];
    const nodes = Array.from({ length: n + 1 }, (_, i) => i * h);
    return { nodes, U: [0, ...U, 0] };
  }

  // ---- CHAPTER 3: smooth functions whose energy keeps dropping -----------
  // −u″ = f, u(0) = u(1) = 0, energy J(v) = ½∫v′² − ∫fv, minimised over
  // sums of the first N sine waves. fhat(k) = 2∫ f sin(kπx) dx.
  const ritzData = {
    step: {
      label: 'Heating on the right half',
      fhat: (k) => (16 * (Math.cos((k * PI) / 2) - Math.cos(k * PI))) / (k * PI),
      u: (x) => (x <= 0.5 ? x : x - 4 * (x - 0.5) * (x - 0.5)),
      du: (x) => (x <= 0.5 ? 1 : 1 - 8 * (x - 0.5)),
      ddu: (x) => (x < 0.5 ? 0 : -8),
      J: -5 / 6,
    },
    point: {
      label: 'A point source in the middle',
      fhat: (k) => 4 * Math.sin((k * PI) / 2),
      u: (x) => (x <= 0.5 ? x : 1 - x),
      du: (x) => (x < 0.5 ? 1 : -1),
      J: -0.5,
    },
  };
  function ritz(kind, N) {
    const d = ritzData[kind], b = [];
    let J = 0;
    for (let k = 1; k <= N; k++) {
      const fk = d.fhat(k), w = k * PI;
      b.push(fk / (w * w));
      J -= (fk * fk) / (4 * w * w);
    }
    const sum = (term) => (x) => { let s = 0; for (let k = 1; k <= N; k++) s += b[k - 1] * term(k * PI, x); return s; };
    return {
      b, J, gap: J - d.J,
      u: sum((w, x) => Math.sin(w * x)),
      du: sum((w, x) => w * Math.cos(w * x)),
      ddu: sum((w, x) => -w * w * Math.sin(w * x)),
    };
  }

  // ---- CHAPTER 4: a point load, in one and in two dimensions -------------
  // 1D: −u″ = δ₀ on (−1,1), u(±1) = 0. Exact u = (1 − |x|)/2. 2n equal elements.
  function point1D(n) {
    const h = 1 / n, m = 2 * n - 1;
    const lo = new Array(m).fill(-1 / h), di = new Array(m).fill(2 / h), up = new Array(m).fill(-1 / h), rhs = new Array(m).fill(0);
    rhs[n - 1] = 1;
    const U = [0, ...thomas(lo, di, up, rhs), 0];
    const nodes = Array.from({ length: 2 * n + 1 }, (_, i) => -1 + i * h);
    return { nodes, U, peak: U[n], energy: U[n] };
  }
  // 2D: −Δu = δ₀ on the unit disc, u = 0 on the rim. Exact u = −ln(r)/2π.
  // Radial linear elements on n equal rings: a(u,v) = 2π ∫ r u′ v′ dr.
  // The energy a(u_h, u_h) equals u_h(0), because the load is v(0).
  function point2D(n) {
    const h = 1 / n, ke = [];
    for (let e = 0; e < n; e++) ke.push((2 * PI * (e + 0.5) * h) / h);
    const lo = [], di = [], up = [], rhs = [];
    for (let i = 0; i < n; i++) {
      lo.push(i > 0 ? -ke[i - 1] : 0);
      di.push((i > 0 ? ke[i - 1] : 0) + ke[i]);
      up.push(-ke[i]);
      rhs.push(i === 0 ? 1 : 0);
    }
    const U = [...thomas(lo, di, up, rhs), 0];
    const nodes = Array.from({ length: n + 1 }, (_, i) => i * h);
    return { nodes, U, peak: U[0], energy: U[0] };
  }

  // ---- CHAPTER 5: smoothness sets the speed --------------------------------
  // u(x) = x^α (1 − x) on (0,1), for 1/2 < α < 1. Its derivative blows up at 0.
  // u is in H¹ because α > 1/2, but not in H² (that would need α > 3/2).
  // In one dimension the finite element solution equals u at the nodes, so the
  // error in the energy norm is the error of the interpolant.
  const GX = [-0.9061798459386640, -0.5384693101056831, 0, 0.5384693101056831, 0.9061798459386640];
  const GW = [0.2369268850561891, 0.4786286704993665, 0.5688888888888889, 0.4786286704993665, 0.2369268850561891];
  function singular(alpha) {
    const u = (x) => (x <= 0 ? 0 : Math.pow(x, alpha) * (1 - x));
    const du = (x) => alpha * Math.pow(x, alpha - 1) - (alpha + 1) * Math.pow(x, alpha);
    // ∫₀ᵇ u′² dx, term by term
    const E0 = (b) => (alpha * alpha * Math.pow(b, 2 * alpha - 1)) / (2 * alpha - 1) - (alpha + 1) * Math.pow(b, 2 * alpha) + ((alpha + 1) * (alpha + 1) * Math.pow(b, 2 * alpha + 1)) / (2 * alpha + 1);
    return { u, du, E0, total: E0(1) };
  }
  function mesh(n, grade) { return Array.from({ length: n + 1 }, (_, i) => Math.pow(i / n, grade)); }
  // Grading that restores the full rate: nodes at (i/n)^μ.
  function grading(alpha) { return 1.25 / (alpha - 0.5); }
  // Relative error of the interpolant in the energy norm.
  function energyError(alpha, nodes) {
    const s = singular(alpha);
    let e2 = 0;
    for (let i = 0; i + 1 < nodes.length; i++) {
      const a = nodes[i], b = nodes[i + 1], h = b - a, slope = (s.u(b) - s.u(a)) / h;
      if (i === 0) { e2 += Math.max(0, s.E0(b) - h * slope * slope); continue; }   // exact on the element that touches 0
      for (let g = 0; g < 5; g++) {
        const x = a + (h * (GX[g] + 1)) / 2, d = s.du(x) - slope;
        e2 += (h / 2) * GW[g] * d * d;
      }
    }
    return Math.sqrt(e2 / s.total);
  }
  // Slope of log(error) against log(n) between the two finest meshes of a list.
  function rate(ns, errs) {
    const k = ns.length - 1;
    return -Math.log(errs[k] / errs[k - 1]) / Math.log(ns[k] / ns[k - 1]);
  }

  const api = { thomas, ramp, tent, twoMaterial, twoMaterialFE, ritzData, ritz, point1D, point2D, singular, mesh, grading, energyError, rate };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SOB = api;
})(typeof window !== 'undefined' ? window : globalThis);
