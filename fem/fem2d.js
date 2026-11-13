// =====================================================================
// fem2d.js — the numerical core of Part II (two dimensions).
// Pure functions, no drawing. Checked by tests/test2d.js.
//
// Model problem:  −Δu = f on the unit square,  u = 0 on its boundary.
// =====================================================================
(function (root) {
  'use strict';
  const PI = Math.PI;

  // ---- Plate versions of the three heating patterns (same keys as fem1d.js) ----
  const C3 = 10.4;
  const problems = {
    even: {
      fText: 'f = 32 [x(1 − x) + y(1 − y)]', uText: 'u = 16 x(1 − x) y(1 − y)',
      u: (x, y) => 16 * x * (1 - x) * y * (1 - y), f: (x, y) => 32 * (x * (1 - x) + y * (1 - y)),
    },
    middle: {
      fText: 'f = 2π² sin(πx) sin(πy)', uText: 'u = sin(πx) sin(πy)',
      u: (x, y) => Math.sin(PI * x) * Math.sin(PI * y), f: (x, y) => 2 * PI * PI * Math.sin(PI * x) * Math.sin(PI * y),
    },
    right: {
      fText: 'f = 10.4 [6x(y − y²) + 2(x − x³)]', uText: 'u = 10.4 (x − x³)(y − y²)',
      u: (x, y) => C3 * (x - x * x * x) * (y - y * y), f: (x, y) => C3 * (6 * x * (y - y * y) + 2 * (x - x * x * x)),
    },
  };

  // ---- Mesh of the unit square: n × n cells, each cut into two triangles ----
  // Node k = j(n+1) + i sits at (i/n, j/n). Triangles list their corners anticlockwise.
  function mesh(n) {
    const nodes = [], tris = [], boundary = [];
    for (let j = 0; j <= n; j++) for (let i = 0; i <= n; i++) {
      nodes.push([i / n, j / n]);
      boundary.push(i === 0 || i === n || j === 0 || j === n);
    }
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const a = j * (n + 1) + i, b = a + 1, c = a + n + 2, d = a + n + 1;
      tris.push([a, b, c], [a, c, d]);
    }
    return { n, nodes, tris, boundary };
  }

  // ---- One triangle -----------------------------------------------------------
  // Returns its area, the (constant) gradients of its three hats, its corner
  // angles in radians, and the 3×3 element matrix K_ij = area × ∇φ_i · ∇φ_j.
  function triangle(p1, p2, p3) {
    const d = (p2[0] - p1[0]) * (p3[1] - p1[1]) - (p3[0] - p1[0]) * (p2[1] - p1[1]);   // twice the signed area
    const area = Math.abs(d) / 2;
    const grads = [
      [(p2[1] - p3[1]) / d, (p3[0] - p2[0]) / d],
      [(p3[1] - p1[1]) / d, (p1[0] - p3[0]) / d],
      [(p1[1] - p2[1]) / d, (p2[0] - p1[0]) / d],
    ];
    const K = grads.map((gi) => grads.map((gj) => area * (gi[0] * gj[0] + gi[1] * gj[1])));
    const P = [p1, p2, p3];
    const angles = P.map((p, i) => {
      const q = P[(i + 1) % 3], r = P[(i + 2) % 3];
      const ux = q[0] - p[0], uy = q[1] - p[1], vx = r[0] - p[0], vy = r[1] - p[1];
      return Math.acos((ux * vx + uy * vy) / (Math.hypot(ux, uy) * Math.hypot(vx, vy)));
    });
    return { area, grads, K, angles };
  }
  // Load ∫ f φ_i over the triangle, by the edge-midpoint rule (exact for quadratics).
  function triangleLoad(f, p1, p2, p3, area) {
    const m12 = f((p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2);
    const m23 = f((p2[0] + p3[0]) / 2, (p2[1] + p3[1]) / 2);
    const m31 = f((p3[0] + p1[0]) / 2, (p3[1] + p1[1]) / 2);
    return [(area / 6) * (m12 + m31), (area / 6) * (m12 + m23), (area / 6) * (m23 + m31)];
  }

  // ---- Assembly ------------------------------------------------------------------
  // The matrix is stored sparsely: rows[i] is a Map from column to value.
  // Adds the first `count` triangles (all of them if count is omitted).
  function assemble(m, f, count) {
    const N = m.nodes.length;
    if (count === undefined) count = m.tris.length;
    const rows = Array.from({ length: N }, () => new Map());
    const F = new Array(N).fill(0);
    for (let t = 0; t < count; t++) {
      const T = m.tris[t], p = T.map((k) => m.nodes[k]);
      const g = triangle(p[0], p[1], p[2]);
      const Fe = f ? triangleLoad(f, p[0], p[1], p[2], g.area) : [0, 0, 0];
      for (let a = 0; a < 3; a++) {
        F[T[a]] += Fe[a];
        for (let b = 0; b < 3; b++) rows[T[a]].set(T[b], (rows[T[a]].get(T[b]) || 0) + g.K[a][b]);
      }
    }
    return { rows, F };
  }

  // ---- Boundary conditions and solve ---------------------------------------------------
  // Boundary heights are 0, so only interior nodes are unknown. The system is
  // solved by the conjugate gradient method, which needs only products K × vector.
  function solve(m, f) {
    const { rows, F } = assemble(m, f);
    const N = m.nodes.length, inner = [];
    for (let k = 0; k < N; k++) if (!m.boundary[k]) inner.push(k);
    const U = new Array(N).fill(0);
    const mult = (x, out) => {
      for (const i of inner) {
        let s = 0;
        rows[i].forEach((v, j) => { if (!m.boundary[j]) s += v * x[j]; });
        out[i] = s;
      }
    };
    const r = new Array(N).fill(0), p = new Array(N).fill(0), Ap = new Array(N).fill(0);
    let rr = 0;
    for (const i of inner) { r[i] = F[i]; p[i] = F[i]; rr += r[i] * r[i]; }
    const stop = rr * 1e-24;
    let iters = 0;
    while (rr > stop && iters < 5 * inner.length + 20) {
      mult(p, Ap);
      let pAp = 0;
      for (const i of inner) pAp += p[i] * Ap[i];
      const alpha = rr / pAp;
      let rrNew = 0;
      for (const i of inner) { U[i] += alpha * p[i]; r[i] -= alpha * Ap[i]; rrNew += r[i] * r[i]; }
      const beta = rrNew / rr;
      for (const i of inner) p[i] = r[i] + beta * p[i];
      rr = rrNew;
      iters++;
    }
    return { U, rows, F, iters, unknowns: inner.length };
  }

  // ---- Errors -------------------------------------------------------------------------------
  // Largest |u − u_h| over a lattice of sample points in every triangle.
  function maxError(m, U, u, sub) {
    sub = sub || 4;
    let worst = 0;
    for (const T of m.tris) {
      const [a, b, c] = T.map((k) => m.nodes[k]);
      for (let i = 0; i <= sub; i++) for (let j = 0; j <= sub - i; j++) {
        const l1 = i / sub, l2 = j / sub, l3 = 1 - l1 - l2;
        const x = l1 * a[0] + l2 * b[0] + l3 * c[0], y = l1 * a[1] + l2 * b[1] + l3 * c[1];
        worst = Math.max(worst, Math.abs(l1 * U[T[0]] + l2 * U[T[1]] + l3 * U[T[2]] - u(x, y)));
      }
    }
    return worst;
  }
  function nodalError(m, U, u) {
    return Math.max(...m.nodes.map((p, k) => Math.abs(U[k] - u(p[0], p[1]))));
  }

  // ---- Numbering of the nodes ------------------------------------------------------------------
  // A fixed "shuffled" numbering, to show how numbering changes the matrix pattern.
  function shuffled(N) {
    const perm = Array.from({ length: N }, (_, i) => i);
    let seed = 12345;
    for (let i = N - 1; i > 0; i--) {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      const j = seed % (i + 1);
      [perm[i], perm[j]] = [perm[j], perm[i]];
    }
    return perm;
  }

  const api = { problems, mesh, triangle, triangleLoad, assemble, solve, maxError, nodalError, shuffled };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.FEM2D = api;
})(typeof window !== 'undefined' ? window : globalThis);
