// =====================================================================
// fem1d.js — the numerical core of "From PDE to matrix".
// Pure functions, no drawing. Everything the figures show is computed
// here, and tests/ check these functions against known exact answers.
//
// Model problem:  −u″ = f on (0,1),  u(0) = u(1) = 0.
// =====================================================================
(function (root) {
  'use strict';
  const PI = Math.PI;

  // ---- The three heating patterns, each with its exact solution -------
  // To add a pattern: give f, the exact u, its derivative du, and labels.
  const problems = {
    even: {
      label: 'Even heating',
      fText: 'f(x) = 8', uText: 'u(x) = 4x(1 − x)',
      f: () => 8, u: (x) => 4 * x * (1 - x), du: (x) => 4 - 8 * x, fmax: 8,
    },
    middle: {
      label: 'Warm in the middle',
      fText: 'f(x) = π² sin(πx)', uText: 'u(x) = sin(πx)',
      f: (x) => PI * PI * Math.sin(PI * x), u: (x) => Math.sin(PI * x), du: (x) => PI * Math.cos(PI * x), fmax: PI * PI,
    },
    right: {
      label: 'Hotter towards the right',
      fText: 'f(x) = 15x', uText: 'u(x) = 2.5(x − x³)',
      f: (x) => 15 * x, u: (x) => 2.5 * (x - x * x * x), du: (x) => 2.5 * (1 - 3 * x * x), fmax: 15,
    },
  };

  // ---- Integration ------------------------------------------------------
  // Three-point Gauss rule on [a,b]: exact for polynomials up to degree 5.
  const G3 = [[-Math.sqrt(0.6), 5 / 9], [0, 8 / 9], [Math.sqrt(0.6), 5 / 9]];
  function gauss3(g, a, b) {
    const m = (a + b) / 2, r = (b - a) / 2;
    let s = 0;
    for (const [t, w] of G3) s += w * g(m + r * t);
    return s * r;
  }
  // Composite Simpson rule, used for the weak-form check in chapter 2.
  function simpson(g, a, b, n) {
    n = n || 200;
    if (b <= a) return 0;
    const h = (b - a) / n;
    let s = g(a) + g(b);
    for (let i = 1; i < n; i++) s += g(a + i * h) * (i % 2 ? 4 : 2);
    return (s * h) / 3;
  }

  // ---- Meshes -------------------------------------------------------------
  function uniformMesh(n) { return Array.from({ length: n + 1 }, (_, i) => i / n); }
  // Elements shrink towards the right end.
  function gradedMesh(n) { return Array.from({ length: n + 1 }, (_, i) => 1 - Math.pow(1 - i / n, 1.6)); }

  // ---- Hat functions --------------------------------------------------------
  // Value at x of the hat that is 1 at nodes[i] and 0 at all other nodes.
  function hat(nodes, i, x) {
    const c = nodes[i];
    if (i > 0 && x >= nodes[i - 1] && x <= c) return (x - nodes[i - 1]) / (c - nodes[i - 1]);
    if (i < nodes.length - 1 && x >= c && x <= nodes[i + 1]) return (nodes[i + 1] - x) / (nodes[i + 1] - c);
    return 0;
  }
  // Value at x of the piecewise-linear function with nodal values U.
  function evalP1(nodes, U, x) {
    for (let e = 0; e < nodes.length - 1; e++) {
      if (x <= nodes[e + 1] || e === nodes.length - 2) {
        const t = (x - nodes[e]) / (nodes[e + 1] - nodes[e]);
        return U[e] * (1 - t) + U[e + 1] * t;
      }
    }
    return 0;
  }

  // ---- One element ------------------------------------------------------------
  // Stiffness: entries are (slope)(slope)(length), with slopes −1/h and +1/h.
  function elementMatrix(h) { return [[1 / h, -1 / h], [-1 / h, 1 / h]]; }
  // Load: ∫ f φ over the element, for the falling hat and the rising hat.
  function elementLoad(f, a, b) {
    const h = b - a;
    return [gauss3((x) => f(x) * (b - x) / h, a, b), gauss3((x) => f(x) * (x - a) / h, a, b)];
  }

  // ---- Assembly -------------------------------------------------------------------
  // Adds the first `count` elements (all of them if count is omitted).
  // Element e touches nodes e and e+1, so its 2×2 block lands on rows/columns e, e+1.
  function assemble(nodes, f, count) {
    const n = nodes.length - 1;
    if (count === undefined) count = n;
    const K = Array.from({ length: n + 1 }, () => new Array(n + 1).fill(0));
    const F = new Array(n + 1).fill(0);
    for (let e = 0; e < count; e++) {
      const Ke = elementMatrix(nodes[e + 1] - nodes[e]);
      const Fe = elementLoad(f, nodes[e], nodes[e + 1]);
      for (let p = 0; p < 2; p++) {
        F[e + p] += Fe[p];
        for (let q = 0; q < 2; q++) K[e + p][e + q] += Ke[p][q];
      }
    }
    return { K, F };
  }

  // ---- Boundary conditions and solve ------------------------------------------------
  // U[0] = U[n] = 0 are known, so drop their rows and columns and solve the
  // remaining tridiagonal system by elimination (the Thomas algorithm).
  function solveDirichlet(K, F) {
    const n = K.length - 1, m = n - 1;
    const U = new Array(n + 1).fill(0);
    if (m < 1) return U;
    const d = [], up = [], rhs = [];
    for (let i = 1; i <= m; i++) { d.push(K[i][i]); up.push(i < m ? K[i][i + 1] : 0); rhs.push(F[i]); }
    for (let i = 1; i < m; i++) {
      const w = K[i + 1][i] / d[i - 1];
      d[i] -= w * up[i - 1];
      rhs[i] -= w * rhs[i - 1];
    }
    const x = new Array(m);
    x[m - 1] = rhs[m - 1] / d[m - 1];
    for (let i = m - 2; i >= 0; i--) x[i] = (rhs[i] - up[i] * x[i + 1]) / d[i];
    for (let i = 1; i <= m; i++) U[i] = x[i - 1];
    return U;
  }
  function solve(nodes, f) {
    const { K, F } = assemble(nodes, f);
    return { K, F, U: solveDirichlet(K, F) };
  }

  // ---- Errors ---------------------------------------------------------------------------
  function nodalError(nodes, U, u) {
    return Math.max(...nodes.map((x, i) => Math.abs(U[i] - u(x))));
  }
  function maxError(nodes, U, u, perElement) {
    perElement = perElement || 40;
    let m = 0;
    for (let e = 0; e < nodes.length - 1; e++) {
      for (let k = 0; k <= perElement; k++) {
        const x = nodes[e] + ((nodes[e + 1] - nodes[e]) * k) / perElement;
        m = Math.max(m, Math.abs(evalP1(nodes, U, x) - u(x)));
      }
    }
    return m;
  }

  const api = { problems, gauss3, simpson, uniformMesh, gradedMesh, hat, evalP1, elementMatrix, elementLoad, assemble, solveDirichlet, solve, nodalError, maxError };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.FEM1D = api;
})(typeof window !== 'undefined' ? window : globalThis);
