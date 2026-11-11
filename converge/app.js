/**
 * CONVERGE — INTERACTIVE NUMERICAL ANALYSIS
 *
 * Reading order:
 *   1. chapters: lesson content, practice answers, and experiment defaults
 *   2. Numerical functions: calculations independent of the page
 *   3. Plot helpers: coordinates and SVG drawing
 *   4. Interface functions: controls, rendering, and navigation
 *   5. Optional agent tools and browser initialization
 *
 * No framework or build step is required. See README.md for editing tips.
 */
"use strict";
// SECTION 1 — COURSE CONTENT
// Edit text and formulas here. Keep each chapter id unique.
// k means the quantity controlled by the main slider; see each range.label.
const chapters = [
  {
    id: "errors",
    short: "Errors & convergence",
    symbol: "ε",
    title: "How close is close enough?",
    intro:
      "Every computation is an approximation. Learn to measure the error—and " +
      "discover why smaller steps don’t always give better answers.",
    prereq: "Calculus · limits",
    lab: "The small-step paradox",
    legend: ["Absolute error", "Selected step"],
    theoryTitle: "Two errors, pulling in opposite directions",
    theory: [
      "<strong>Truncation error</strong> comes from replacing an exact mathematical " +
        "process with a finite approximation. The forward difference D(h) = [exp(1 + " +
        "h) − exp(1)] / h estimates the derivative of exp(x) at x = 1. Taylor " +
        "expansion gives D(h) = e + (e/2)h + O(h²).",
      "<strong>Roundoff error</strong> comes from finite-precision arithmetic. For " +
        "very small h, subtracting two almost equal numbers loses significant digits. " +
        "Dividing that difference by h amplifies the effect. The combined error is " +
        "roughly C₁h + C₂u/h, where u is the unit roundoff.",
      "<strong>Absolute error</strong> is |approximation − exact|. Relative error " +
        "divides this by |exact|, when the exact value is nonzero. A method of order p " +
        "has error proportional to hᵖ in its asymptotic regime; halving h then reduces " +
        "error by about 2ᵖ.",
    ],
    formula: 'D(h) = <span style="white-space:nowrap">(e<sup>1+h</sup> − e) / h</span>',
    formulaNote:
      "Exact derivative: f′(1) = e. The plot uses JavaScript double precision; " +
      "tiny-step results may vary slightly by browser.",
    workedTitle: "Measure a relative error",
    steps: [
      [
        "Start with a reference",
        "Approximate √2 by 1.414. The reference value is approximately 1.414213562.",
      ],
      ["Measure the difference", "The absolute error is approximately 0.000213562."],
      ["Put it in context", "Divide by √2: relative error ≈ 0.000151, or 0.0151%."],
    ],
    caution:
      "Conditioning describes the sensitivity of the mathematical problem. Stability " +
      "describes how an algorithm handles perturbations. A stable algorithm cannot " +
      "make an ill-conditioned problem insensitive.",
    code: [
      "for k = 1, 2, …, 16:",
      "    h = 10^(−k)",
      "    D = (exp(1 + h) − exp(1)) / h",
      "    error = abs(D − exp(1))",
    ].join("\n"),
    question:
      "A second-order method has error 0.04 at step size h. Approximately what error " +
      "do you expect at h/2?",
    answer: 0.01,
    tolerance: 0.000001,
    hint: "Second order means error is proportional to h².",
    solution:
      "0.04 × (1/2)² = 0.01. This prediction assumes you are in the asymptotic " +
      "regime and roundoff is not dominant.",
    defaults: { k: 6 },
    range: { key: "k", label: "Step-size exponent", min: 1, max: 16, step: 1 },
    reading: "https://fncbook.com/",
  },
  {
    id: "roots",
    short: "Root finding",
    symbol: "ƒ",
    title: "Finding roots, step by step.",
    intro:
      "An equation may resist an exact solution. Start with a guess, refine it, and " +
      "watch a numerical method move toward the answer.",
    prereq: "Calculus · derivatives",
    lab: "A root-finding playground",
    legend: ["Function f(x)", "Current estimate", "Iteration geometry"],
    theoryTitle: "Turn an equation into a sequence",
    theory: [
      "To solve f(x) = 0 numerically, construct a sequence of estimates. In this " +
        "experiment, the default equation is x³ − x − 2 = 0. Since f(1) = −2 and f(2) " +
        "= 4, continuity guarantees at least one root in [1, 2].",
      "<strong>Bisection</strong> halves a sign-changing interval at every step. " +
        "After k midpoint evaluations, the kth midpoint is within (b₀ − a₀)/2ᵏ of a " +
        "root in the original bracket. It is reliable when f is continuous and the " +
        "endpoint values have opposite signs.",
      "<strong>Newton’s method</strong> follows the tangent line to its x-intercept. " +
        "Near a simple root, with sufficient smoothness and a sufficiently close " +
        "initial guess, convergence is quadratic. <strong>The secant method</strong> " +
        "uses a line through two previous points, avoiding an explicit derivative; it " +
        "has local order approximately 1.618 under suitable conditions.",
    ],
    formula:
      "x<sub>n+1</sub> = x<sub>n</sub> − <span " +
      'style="white-space:nowrap">f(x<sub>n</sub>) / f′(x<sub>n</sub>)</span>',
    formulaNote:
      "Newton’s update. The derivative must be nonzero, and the next estimate need " +
      "not stay inside your starting interval.",
    workedTitle: "The first three bisections of x³ − x − 2",
    steps: [
      [
        "Midpoint: 1.5",
        "f(1.5) = −0.125. Keep [1.5, 2], because the signs still differ.",
      ],
      ["Midpoint: 1.75", "f(1.75) = 1.609375. Keep [1.5, 1.75]."],
      [
        "Midpoint: 1.625",
        "f(1.625) = 0.666015625. Keep [1.5, 1.625]. The bracket is narrowing.",
      ],
    ],
    caution:
      "A small residual |f(x)| is not automatically a small root error: a flat " +
      "function can have a tiny residual far from a root. Newton and secant may fail " +
      "from poor starting values; bisection needs continuity and a valid bracket.",
    code: [
      "a, b = initial sign-changing bracket",
      "repeat k times:",
      "    m = (a + b) / 2",
      "    if f(m) == 0: return m",
      "    if f(a) and f(m) have opposite signs: b = m",
      "    else: a = m",
      "return m",
    ].join("\n"),
    question:
      "Bisection starts with a bracket of width 1. What is the error bound for the " +
      "fourth midpoint?",
    answer: 0.0625,
    tolerance: 0.000001,
    hint: "After k midpoint evaluations, use initial width / 2ᵏ.",
    solution:
      "1 / 2⁴ = 0.0625. This is an upper bound, not necessarily the actual error.",
    defaults: { method: "bisection", fn: "cubic", k: 4, start: 1.8 },
    range: { key: "k", label: "Iterations", min: 1, max: 12, step: 1 },
    reading: "https://fncbook.com/",
  },
  {
    id: "linear",
    short: "Linear systems",
    symbol: "A",
    title: "Solve a system by revisiting it.",
    intro:
      "Use the latest approximation to build the next one. See how an iterative " +
      "solver brings two equations into agreement.",
    prereq: "Linear algebra",
    lab: "Jacobi iteration in the plane",
    legend: ["4x + y = 1", "2x + 3y = 2", "Iterates"],
    theoryTitle: "One equation, one updated variable",
    theory: [
      "For Ax = b, a direct method such as Gaussian elimination computes the " +
        "solution through a finite sequence of elimination steps (up to rounding " +
        "error). An iterative method instead generates successive approximations, " +
        "which can be useful for large, sparse systems.",
      "<strong>Jacobi iteration</strong> solves each row for its diagonal variable, " +
        "using only values from the previous iterate. For 4x + y = 1 and 2x + 3y = 2, " +
        "update x to (1 − y)/4 and y to (2 − 2x)/3, simultaneously.",
      "Writing A = D + L + U gives x⁽ᵏ⁺¹⁾ = D⁻¹[b − (L + U)x⁽ᵏ⁾]. Convergence for " +
        "every initial guess requires the spectral radius of −D⁻¹(L + U) to be below " +
        "1. Strict row diagonal dominance is a sufficient condition, satisfied by this " +
        "example.",
    ],
    formula:
      "x<sup>(k+1)</sup> = (1 − y<sup>(k)</sup>) / 4<br>y<sup>(k+1)</sup> = (2 − " +
      "2x<sup>(k)</sup>) / 3",
    formulaNote:
      "Both right-hand sides use the old iterate. Start from (0, 0). The exact " +
      "solution is (0.1, 0.6).",
    workedTitle: "From a first guess to a better one",
    steps: [
      [
        "Begin at (0, 0)",
        "The initial residual b − Ax is (1, 2), with infinity norm 2.",
      ],
      ["Update together", "Using the old zeros gives x = 1/4 and y = 2/3."],
      [
        "Repeat the update",
        "Use (1/4, 2/3) to get (1/12, 1/2). Each full iteration uses the previous pair.",
      ],
    ],
    caution:
      "Small residuals can coexist with large solution errors in ill-conditioned " +
      "systems. Also, updating y with the newly computed x changes the algorithm to " +
      "Gauss–Seidel.",
    code: [
      "x, y = 0, 0",
      "repeat k times:",
      "    x_new = (1 − y) / 4",
      "    y_new = (2 − 2*x) / 3",
      "    x, y = x_new, y_new",
      "residual = max(abs(1 − 4*x − y), abs(2 − 2*x − 3*y))",
    ].join("\n"),
    question:
      "Starting from (x, y) = (0, 0), what is x after one Jacobi iteration for this system?",
    answer: 0.25,
    tolerance: 0.000001,
    hint: "Substitute the old y = 0 into x_new = (1 − y)/4.",
    solution: "x_new = (1 − 0)/4 = 0.25. Compute y_new from the old x as well.",
    defaults: { k: 4 },
    range: { key: "k", label: "Iterations", min: 0, max: 16, step: 1 },
    reading: "https://fncbook.com/",
  },
  {
    id: "interpolation",
    short: "Interpolation",
    symbol: "p",
    title: "Between the points.",
    intro:
      "A polynomial can pass through every data point and still behave badly between " +
      "them. Explore why the placement of nodes matters.",
    prereq: "Polynomials · functions",
    lab: "Runge’s function and the choice of nodes",
    legend: ["Original function", "Interpolating polynomial", "Data nodes"],
    theoryTitle: "An exact fit is only the beginning",
    theory: [
      "Given n distinct nodes xᵢ and values yᵢ, there is exactly one polynomial of " +
        "degree at most n − 1 that interpolates them. Lagrange basis polynomials are " +
        "built to equal 1 at their own node and 0 at all the others.",
      "This experiment interpolates <strong>f(x) = 1/(1 + 25x²)</strong> on [−1, 1]. " +
        "With equally spaced nodes, increasing the degree can create large " +
        "oscillations near the endpoints: the Runge phenomenon. More points do not " +
        "always mean a uniformly better approximation.",
      "<strong>Chebyshev–Lobatto nodes</strong>, xᵢ = cos(iπ/(n − 1)), cluster near " +
        "the endpoints. They control the growth of interpolation error more " +
        "effectively for this example. For many practical datasets, piecewise " +
        "low-degree interpolation is also a useful alternative.",
    ],
    formula: "p(x) = ∑<sub>i=0</sub><sup>n−1</sup> y<sub>i</sub> ℓ<sub>i</sub>(x)",
    formulaNote:
      "ℓᵢ(x) = ∏ⱼ≠ᵢ (x − xⱼ)/(xᵢ − xⱼ). Distinct nodes are essential. The displayed " +
      "error is sampled at 601 evenly spaced points.",
    workedTitle: "A line through two data points",
    steps: [
      [
        "Use the data",
        "Take the points (0, 1) and (2, 5). Two distinct nodes determine a polynomial " +
          "of degree at most 1.",
      ],
      ["Build the basis", "The basis functions are ℓ₀(x) = (2 − x)/2 and ℓ₁(x) = x/2."],
      ["Evaluate between nodes", "p(x) = 1·ℓ₀(x) + 5·ℓ₁(x) = 1 + 2x. Thus p(1) = 3."],
    ],
    caution:
      "The plotted sampled maximum is an estimate, not a rigorous uniform error " +
      "bound. Interpolation also says little about extrapolation outside the range " +
      "of the data.",
    code: [
      "for each node i:",
      "    weight[i] = 1 / product(x[i] − x[j], j != i)",
      "if x equals a node: return its data value",
      "p(x) = sum(weight[i]*y[i]/(x − x[i]))",
      "       / sum(weight[i]/(x − x[i]))",
    ].join("\n"),
    question:
      "A polynomial interpolant through 7 distinct nodes has degree at most what number?",
    answer: 6,
    tolerance: 0,
    hint: "The degree is at most one less than the number of nodes.",
    solution:
      "6. The actual degree may be lower when the data lie on a lower-degree polynomial.",
    defaults: { nodes: "equally", k: 9 },
    range: { key: "k", label: "Number of nodes", min: 3, max: 17, step: 2 },
    reading: "https://fncbook.com/",
  },
  {
    id: "integration",
    short: "Numerical integration",
    symbol: "∫",
    title: "Area, piece by piece.",
    intro:
      "Replace a difficult integral with a weighted sum. Compare straight-line and " +
      "quadratic approximations as you refine the partition.",
    prereq: "Calculus · integration",
    lab: "Integrating sin(x) on [0, π]",
    legend: ["sin(x)", "Quadrature approximation"],
    theoryTitle: "Replace a curve with something integrable",
    theory: [
      "Partition [a, b] into n equal subintervals of width h = (b − a)/n. The " +
        "<strong>composite trapezoidal rule</strong> joins adjacent function values by " +
        "straight lines and sums the areas underneath them. Endpoints have weight 1/2; " +
        "interior nodes have weight 1.",
      "<strong>Composite Simpson’s rule</strong> fits a quadratic over every pair of " +
        "subintervals. It requires an even n and uses the repeating weights 1, 4, 2, " +
        "4, …, 2, 4, 1, multiplied by h/3.",
      "For sufficiently smooth functions on a fixed interval, the trapezoidal rule " +
        "has global error O(h²), while Simpson’s rule has global error O(h⁴). In this " +
        "experiment, the exact integral is 2, so you can compare the measured errors " +
        "directly.",
    ],
    formula:
      "T<sub>n</sub> = h [ f(a)/2 + ∑<sub>i=1</sub><sup>n−1</sup> f(a+ih) + f(b)/2 ]",
    formulaNote: "Simpson: Sₙ = (h/3)[f₀ + 4f₁ + 2f₂ + … + 4fₙ₋₁ + fₙ], for even n.",
    workedTitle: "One Simpson panel",
    steps: [
      [
        "Choose three nodes",
        "For [0, π], take n = 2 and h = π/2. The nodes are 0, π/2, and π.",
      ],
      ["Evaluate the function", "sin(0) = 0, sin(π/2) = 1, sin(π) = 0."],
      [
        "Apply the weights",
        "S₂ = (π/6)(0 + 4 + 0) = 2π/3 ≈ 2.094395. The absolute error is about 0.094395.",
      ],
    ],
    caution:
      "The usual error orders need smoothness (bounded derivatives of the relevant " +
      "order). Discontinuities, endpoint singularities, and highly oscillatory " +
      "functions may need a different strategy or a finer adaptive partition.",
    code: [
      "h = (b − a) / n        # n must be even",
      "sum = f(a) + f(b)",
      "for i = 1, …, n − 1:",
      "    weight = 4 if i is odd else 2",
      "    sum += weight * f(a + i*h)",
      "return h * sum / 3",
    ].join("\n"),
    question:
      "Simpson’s rule has error proportional to h⁴ for a smooth function. By what " +
      "factor should the error decrease when h is halved?",
    answer: 16,
    tolerance: 0,
    hint: "Compare h⁴ with (h/2)⁴.",
    solution:
      "16. The new error should be about one sixteenth of the old error, once " +
      "asymptotic behavior dominates.",
    defaults: { method: "trapezoid", k: 4 },
    range: { key: "k", label: "Subintervals", min: 2, max: 40, step: 2 },
    reading: "https://fncbook.com/",
  },
  {
    id: "odes",
    short: "Differential equations",
    symbol: "ẏ",
    title: "Follow the slope into the future.",
    intro:
      "An initial value tells you where to start. A differential equation tells you " +
      "how to move. Build the solution one time step at a time.",
    prereq: "Calculus · differential equations",
    lab: "Approximating exponential decay",
    legend: ["Exact solution", "Numerical solution"],
    theoryTitle: "From local slope to a global solution",
    theory: [
      "An initial-value problem gives y′ = f(t, y) and y(t₀) = y₀. <strong>Forward " +
        "Euler</strong> takes a step using the slope at the current point: yₖ₊₁ = yₖ + " +
        "hf(tₖ, yₖ). It is a first-order method: on a fixed interval, the global error " +
        "is O(h) under standard regularity assumptions.",
      "<strong>Heun’s method</strong> first predicts with Euler, then corrects using " +
        "the average of the starting slope and the predicted endpoint slope. This " +
        "explicit trapezoidal method has global error O(h²) under suitable smoothness " +
        "assumptions.",
      "Here, y′ = −2y with y(0) = 1, so the exact solution is exp(−2t). Euler " +
        "multiplies the solution by 1 − 2h at each step. Decay in magnitude requires " +
        "|1 − 2h| < 1, meaning 0 < h < 1. Accuracy and stability are related, but " +
        "different, questions.",
    ],
    formula: "y<sub>k+1</sub> = y<sub>k</sub> + h f(t<sub>k</sub>, y<sub>k</sub>)",
    formulaNote:
      "Heun: predict y* = yₖ + hf(tₖ,yₖ); then yₖ₊₁ = yₖ + (h/2)[f(tₖ,yₖ) + f(tₖ₊₁,y*)].",
    workedTitle: "One Euler step with h = 0.1",
    steps: [
      ["Start at y(0) = 1", "The initial slope is y′(0) = −2·1 = −2."],
      ["Take a step", "y₁ = 1 + 0.1(−2) = 0.8. This approximates y(0.1)."],
      [
        "Compare with the reference",
        "The exact value is exp(−0.2) ≈ 0.818731, so the absolute error is about 0.018731.",
      ],
    ],
    caution:
      "A visually smooth curve can still be inaccurate. At h = 1, Euler alternates " +
      "between ±1 for this decay problem and fails to reproduce decay. Stiff " +
      "problems can require very small explicit steps even when the exact solution " +
      "varies slowly.",
    code: [
      "t, y = 0, 1",
      "h = 2 / n",
      "repeat n times:",
      "    slope = −2*y",
      "    predictor = y + h*slope",
      "    y = y + (h/2)*(slope − 2*predictor)  # Heun",
      "    t = t + h",
    ].join("\n"),
    question:
      "For y′ = −2y and y(0) = 1, what is the forward Euler estimate after one step " +
      "of size h = 0.25?",
    answer: 0.5,
    tolerance: 0.000001,
    hint: "Use y₁ = y₀ + h(−2y₀).",
    solution:
      "y₁ = 1 + 0.25(−2) = 0.5. The exact value at t = 0.25 is exp(−0.5) ≈ 0.606531.",
    defaults: { method: "euler", k: 10 },
    range: { key: "k", label: "Time steps over [0, 2]", min: 2, max: 40, step: 2 },
    reading: "https://fncbook.com/",
  },
];

// SECTION 2 — NUMERICAL CALCULATIONS
// Display finite numbers compactly; use scientific notation for small values.
const fmt = (n, d = 6) =>
  !Number.isFinite(n)
    ? "—"
    : Math.abs(n) > 0 && Math.abs(n) < 1e-4
      ? n.toExponential(2)
      : Number(n.toFixed(d)).toString();
/**
 * Calculate root-finding iterates for the selected equation.
 * s contains fn, method, k (iteration limit), and start (Newton initial guess).
 * Returns the function, reference root, iteration rows, and any failure message.
 * Bisection preserves a sign-changing bracket; Newton and secant stop when
 * the residual reaches the chosen numerical tolerance.
 */
function rootData(s) {
  const f = s.fn === "cosine" ? (x) => Math.cos(x) - x : (x) => x * x * x - x - 2;
  const df = s.fn === "cosine" ? (x) => -Math.sin(x) - 1 : (x) => 3 * x * x - 1;
  const exact = s.fn === "cosine" ? 0.7390851332151607 : 1.5213797068045676;
  const initial = s.fn === "cosine" ? [0, 1] : [1, 2];
  let [a, b] = initial;
  let x = s.start;
  let prev = a,
    cur = b;
  const rows = [];
  let warning = "";
  for (let i = 1; i <= s.k; i++) {
    let old = x;
    let older;
    let bound;
    if (s.method === "bisection") {
      x = (a + b) / 2;
      bound = (b - a) / 2;
      rows.push({ i, x, fx: f(x), a, b, bound });
      if (f(x) === 0) break;
      if (f(a) * f(x) < 0) b = x;
      else a = x;
    } else if (s.method === "newton") {
      if (Math.abs(df(x)) < 1e-14) {
        warning = "The derivative is too close to zero. Choose another starting value.";
        break;
      }
      x = x - f(x) / df(x);
      if (!Number.isFinite(x) || Math.abs(x) > 1e8) {
        warning = "The estimates have diverged. Reset the starting value.";
        break;
      }
      rows.push({ i, x, fx: f(x), old, slope: df(old) });
      if (Math.abs(f(x)) < 1e-14) break;
    } else {
      let den = f(cur) - f(prev);
      if (Math.abs(den) < 1e-15) {
        warning =
          "The secant denominator is too small; further updates are unreliable.";
        break;
      }
      older = prev;
      old = cur;
      x = cur - (f(cur) * (cur - prev)) / den;
      rows.push({ i, x, fx: f(x), old, older, slope: den / (cur - prev) });
      prev = cur;
      cur = x;
      if (Math.abs(f(x)) < 1e-14) break;
    }
  }
  return { f, df, exact, initial, rows, last: rows.at(-1), warning };
}
/**
 * Run k Jacobi iterations for 4x + y = 1 and 2x + 3y = 2.
 * Both coordinates use the previous pair, not a partially updated pair.
 * Return each iterate and the infinity norm of its residual.
 */
function linearData(k) {
  let x = 0,
    y = 0;
  let rows = [{ i: 0, x, y, r: 2 }];
  for (let i = 1; i <= k; i++) {
    [x, y] = [(1 - y) / 4, (2 - 2 * x) / 3];
    rows.push({
      i,
      x,
      y,
      r: Math.max(Math.abs(1 - 4 * x - y), Math.abs(2 - 2 * x - 3 * y)),
    });
  }
  return rows;
}
/**
 * Build a barycentric polynomial interpolant of Runge’s function.
 * s.k is the number of nodes; s.nodes selects equally spaced or Chebyshev nodes.
 * Precompute barycentric weights, then sample the interpolant at 601 points.
 * The reported maximum error is sampled, not a rigorous uniform bound.
 */
function interpolationData(s) {
  const n = s.k;
  const f = (x) => 1 / (1 + 25 * x * x);
  const nodes = Array.from({ length: n }, (_, i) =>
    s.nodes === "chebyshev"
      ? -Math.cos((Math.PI * i) / (n - 1))
      : -1 + (2 * i) / (n - 1),
  );
  const weights = nodes.map(
    (x, i) => 1 / nodes.reduce((p, y, j) => (i === j ? p : p * (x - y)), 1),
  );
  const p = (x) => {
    const j = nodes.findIndex((y) => Math.abs(x - y) < 1e-14);
    if (j >= 0) return f(nodes[j]);
    let a = 0,
      b = 0;
    nodes.forEach((y, i) => {
      const w = weights[i] / (x - y);
      a += w * f(y);
      b += w;
    });
    return a / b;
  };
  const points = Array.from({ length: 601 }, (_, i) => {
    let x = -1 + (2 * i) / 600;
    return [x, p(x)];
  });
  return {
    f,
    p,
    nodes,
    points,
    error: Math.max(...points.map(([x, y]) => Math.abs(y - f(x)))),
  };
}
/**
 * Approximate the integral of sin(x) from 0 to pi.
 * s.k is the subinterval count; s.method chooses trapezoidal or Simpson weights.
 * The UI ensures an even count, as required by composite Simpson’s rule.
 * Return weighted nodes, step size h, and the integral estimate.
 */
function integrationData(s) {
  const n = s.k,
    h = Math.PI / n;
  let sum = 0;
  let nodes = [];
  for (let i = 0; i <= n; i++) {
    let x = i * h,
      y = Math.sin(x),
      w =
        s.method === "trapezoid"
          ? i === 0 || i === n
            ? 0.5
            : 1
          : i === 0 || i === n
            ? 1
            : i % 2
              ? 4
              : 2;
    sum += w * y;
    nodes.push({ i, x, y, w });
  }
  return { nodes, h, value: (sum * h) / (s.method === "simpson" ? 3 : 1) };
}
/**
 * Solve y′ = −2y, y(0) = 1 on [0, 2], using Euler or Heun.
 * s.k specifies the number of equal time steps.
 * Return the time history and errors against the exact solution exp(−2t).
 */
function odeData(s) {
  const h = 2 / s.k;
  let y = 1;
  const rows = [{ i: 0, t: 0, y, error: 0 }];
  for (let i = 1; i <= s.k; i++) {
    if (s.method === "euler") y += h * (-2 * y);
    else {
      let pred = y - 2 * h * y;
      y += (h / 2) * (-2 * y - 2 * pred);
    }
    let t = i * h;
    rows.push({ i, t, y, error: Math.abs(y - Math.exp(-2 * t)) });
  }
  return { rows, h };
}
/**
 * Explore truncation and roundoff in the forward difference of exp(x).
 * Evaluate all step sizes h = 10^(−k), for k = 1 through 16.
 * Return the full table and the row selected by the control.
 */
function errorData(k) {
  const rows = Array.from({ length: 16 }, (_, i) => {
    const h = 10 ** (-i - 1),
      value = (Math.exp(1 + h) - Math.E) / h;
    return { i: i + 1, h, value, error: Math.abs(value - Math.E) };
  });
  return { rows, last: rows[k - 1] };
}

// SECTION 3 — SHARED STATE AND PLOTTING
// current is the chapter index. Start with the root-finding lesson.
// Spread syntax makes a fresh copy so edits do not mutate chapter defaults.
let current = 1,
  state = { ...chapters[1].defaults };
// Data colours, matching sarthakmath.github.io: slate main curve, wine iterates/nodes, ochre third series.
const svgColor = { green: "#2b4a63", blue: "#6b1d2a", orange: "#a8742a" };
/**
 * Create an SVG plot using mathematical coordinate bounds and tick values.
 * xp and yp convert data coordinates into SVG pixels (SVG y increases downward).
 * The returned helpers add curves, lines, and points to the same plot.
 * end() assembles the SVG; clipping keeps data inside the plotting area.
 */
function chart({
  xmin,
  xmax,
  ymin,
  ymax,
  xticks,
  yticks,
  xlabel = "x",
  ylabel = "f(x)",
}) {
  const W = 650,
    H = 330,
    L = 51,
    R = 23,
    T = 27,
    B = 44;
  let xp = (x) => L + ((x - xmin) / (xmax - xmin)) * (W - L - R),
    yp = (y) => H - B - ((y - ymin) / (ymax - ymin)) * (H - T - B);
  let body = "";
  let extras = "";
  const line = (pts, color, width = 2.5, dash = "") => /* HTML */ `<path
      d="${pts
        .filter((p) => p.every(Number.isFinite))
        .map(([x, y], i) => `${i ? "L" : "M"}${xp(x).toFixed(2)},${yp(y).toFixed(2)}`)
        .join(" ")}"
      fill="none"
      stroke="${color}"
      stroke-width="${width}"
      ${dash ? `stroke-dasharray="${dash}"` : ""}
      stroke-linejoin="round"
    />`;
  for (let x of xticks)
    body += /* HTML */ `<path d="M${xp(x)},${T}V${H - B}" stroke="#ece6dc" /><text
        x="${xp(x)}"
        y="${H - B + 24}"
        text-anchor="middle"
        >${fmt(x, 2)}</text
      >`;
  for (let y of yticks)
    body += /* HTML */ `<path d="M${L},${yp(y)}H${W - R}" stroke="#ece6dc" /><text
        x="${L - 12}"
        y="${yp(y) + 4}"
        text-anchor="end"
        >${fmt(y, 2)}</text
      >`;
  if (ymin < 0 && ymax > 0)
    body += /* HTML */ `<path d="M${L},${yp(0)}H${W - R}" stroke="#cfc6b8" />`;
  body += /* HTML */ `<text x="${W - R}" y="${H - 9}" text-anchor="end">${xlabel}</text
    ><text x="${L}" y="17">${ylabel}</text>`;
  return {
    xp,
    yp,
    line,
    add: (s) => (extras += s),
    curve: (f, c = svgColor.green) =>
      (extras += line(
        Array.from({ length: 301 }, (_, i) => {
          const x = xmin + ((xmax - xmin) * i) / 300;
          return [x, f(x)];
        }),
        c,
      )),
    dot: (x, y, c = svgColor.blue, r = 5) =>
      (extras += /* HTML */ `<circle
        cx="${xp(x)}"
        cy="${yp(y)}"
        r="${r}"
        fill="${c}"
        stroke="white"
        stroke-width="2"
      />`),
    end: () => /* HTML */ `<svg
        class="graph"
        viewBox="0 0 ${W} ${H}"
        role="img"
        aria-label="${chapters[current].lab}. Numerical results are listed below."
      >
        <defs>
          <clipPath id="plotClip">
            <rect x="${L}" y="${T}" width="${W - L - R}" height="${H - T - B}" />
          </clipPath>
        </defs>
        ${body}
        <g clip-path="url(#plotClip)">${extras}</g>
      </svg>`,
  };
}
/**
 * Build the current experiment from the active chapter and control state.
 * Each branch calculates results, draws its plot, and prepares display text.
 * Return SVG, three metrics, an explanation, and table headers and rows.
 * This function prepares content; renderExperiment writes it to the page.
 */
function getExperiment() {
  const s = state,
    c = chapters[current];
  let ch, metrics, insight, headers, rows;
  if (c.id === "roots") {
    const d = rootData(s),
      l = d.last;
    const cos = s.fn === "cosine";
    ch = chart({
      xmin: cos ? -0.1 : 0.8,
      xmax: cos ? 1.2 : 2.2,
      ymin: cos ? -0.7 : -2.8,
      ymax: cos ? 1.2 : 6,
      xticks: cos ? [0, 0.25, 0.5, 0.75, 1] : [1, 1.25, 1.5, 1.75, 2],
      yticks: cos ? [-0.5, 0, 0.5, 1] : [-2, 0, 2, 4, 6],
    });
    if (l) {
      if (s.method === "bisection") {
        ch.add(/* HTML */ `<rect
            x="${ch.xp(l.a)}"
            y="27"
            width="${ch.xp(l.b) - ch.xp(l.a)}"
            height="259"
            fill="#f5ecec"
          />`);
        ch.add(
          ch.line(
            [
              [l.x, -3],
              [l.x, 6],
            ],
            svgColor.blue,
            1.5,
            "5 5",
          ),
        );
      } else {
        ch.add(
          ch.line(
            [
              [cos ? -0.1 : 0.8, d.f(l.old) + l.slope * ((cos ? -0.1 : 0.8) - l.old)],
              [cos ? 1.2 : 2.2, d.f(l.old) + l.slope * ((cos ? 1.2 : 2.2) - l.old)],
            ],
            svgColor.orange,
            1.6,
            "6 4",
          ),
        );
        ch.dot(l.old, d.f(l.old), svgColor.orange, 4);
      }
      ch.curve(d.f);
      ch.dot(l.x, d.f(l.x));
      ch.dot(l.x, 0, svgColor.blue, 4);
    }
    metrics = [
      ["Current estimate", fmt(l?.x, 8)],
      ["Residual |f(x)|", fmt(Math.abs(l?.fx))],
      ["Iterations evaluated", String(d.rows.length)],
    ];
    insight =
      d.warning ||
      (s.method === "bisection"
        ? "At iteration " +
          String(l.i) +
          ", the midpoint is " +
          String(fmt(l.x)) +
          ". Its guaranteed error bound is " +
          String(fmt(l.bound)) +
          "; the shaded region is the bracket used for this midpoint."
        : String(s.method === "newton" ? "The tangent" : "The secant") +
          " meets the x-axis at the next estimate. " +
          String(
            d.rows.length < s.k
              ? "The residual reached numerical precision, so iteration stopped early."
              : `The absolute root error is ${fmt(Math.abs(l.x - d.exact))}.`,
          ));
    headers = ["Iteration", "Estimate x", "f(x)", "Absolute error"];
    rows = d.rows.map((r) => [
      r.i,
      fmt(r.x, 9),
      fmt(r.fx, 9),
      fmt(Math.abs(r.x - d.exact), 9),
    ]);
  } else if (c.id === "errors") {
    const d = errorData(s.k);
    ch = chart({
      xmin: 1,
      xmax: 16,
      ymin: -17,
      ymax: 1,
      xticks: [1, 4, 8, 12, 16],
      yticks: [-16, -12, -8, -4, 0],
      xlabel: "k, where h = 10⁻ᵏ",
      ylabel: "log₁₀(absolute error)",
    });
    ch.add(
      ch.line(
        d.rows.map((r) => [r.i, Math.log10(Math.max(r.error, 1e-18))]),
        svgColor.green,
      ),
    );
    d.rows.forEach((r) =>
      ch.dot(
        r.i,
        Math.log10(Math.max(r.error, 1e-18)),
        r.i === s.k ? svgColor.blue : svgColor.green,
        r.i === s.k ? 6 : 3,
      ),
    );
    metrics = [
      ["Derivative estimate", fmt(d.last.value, 8)],
      ["Absolute error", fmt(d.last.error)],
      ["Step size h", `10⁻${s.k}`],
    ];
    insight =
      "Move the step-size exponent from left to right. Initially the approximation " +
      "improves; eventually cancellation and roundoff overwhelm the benefit of a " +
      "smaller step.";
    headers = ["Exponent k", "Step size h", "Derivative estimate", "Absolute error"];
    rows = d.rows.map((r) => [r.i, fmt(r.h), fmt(r.value, 9), fmt(r.error, 9)]);
  } else if (c.id === "linear") {
    const data = linearData(s.k),
      l = data.at(-1);
    ch = chart({
      xmin: -0.08,
      xmax: 0.4,
      ymin: -0.1,
      ymax: 0.85,
      xticks: [0, 0.1, 0.2, 0.3, 0.4],
      yticks: [0, 0.2, 0.4, 0.6, 0.8],
      ylabel: "y",
    });
    ch.curve((x) => 1 - 4 * x);
    ch.curve((x) => (2 - 2 * x) / 3, svgColor.blue);
    ch.add(
      ch.line(
        data.map((r) => [r.x, r.y]),
        svgColor.orange,
        1.5,
        "4 4",
      ),
    );
    data.forEach((r, i) =>
      ch.dot(r.x, r.y, svgColor.orange, i === data.length - 1 ? 6 : 3),
    );
    ch.dot(0.1, 0.6, svgColor.green, 4);
    metrics = [
      ["x estimate", fmt(l.x, 7)],
      ["y estimate", fmt(l.y, 7)],
      ["Residual ‖b − Ax‖∞", fmt(l.r)],
    ];
    insight =
      "The two lines meet at (0.1, 0.6). After " +
      String(s.k) +
      " iterations, the largest absolute coordinate error is " +
      String(fmt(Math.max(Math.abs(l.x - 0.1), Math.abs(l.y - 0.6)))) +
      ".";
    headers = ["Iteration", "x", "y", "Residual ∞-norm"];
    rows = data.map((r) => [r.i, fmt(r.x, 8), fmt(r.y, 8), fmt(r.r, 8)]);
  } else if (c.id === "interpolation") {
    const d = interpolationData(s);
    const ys = d.points.map((p) => p[1]);
    const low = Math.min(-0.15, ...ys),
      high = Math.max(1.15, ...ys);
    ch = chart({
      xmin: -1.05,
      xmax: 1.05,
      ymin: low - 0.05 * (high - low),
      ymax: high + 0.05 * (high - low),
      xticks: [-1, -0.5, 0, 0.5, 1],
      yticks:
        high > 2 || low < -0.5
          ? [Number(low.toFixed(1)), 0, 1, Number(high.toFixed(1))]
          : [0, 0.5, 1],
      ylabel: "y",
    });
    ch.add(ch.line(d.points, svgColor.blue));
    ch.curve(d.f);
    d.nodes.forEach((x) => ch.dot(x, d.f(x), svgColor.orange, 4));
    metrics = [
      ["Polynomial degree ≤", String(s.k - 1)],
      ["Sampled max error", fmt(d.error)],
      ["Interpolation nodes", String(s.k)],
    ];
    insight =
      s.nodes === "equally"
        ? "Try 17 equally spaced nodes, then switch to Chebyshev. Watch the endpoints: " +
          "the polynomial matches every node, but can stray far from the function " +
          "between them."
        : "Chebyshev–Lobatto nodes cluster near the endpoints. Compare the sampled " +
          "maximum error with equally spaced nodes at the same degree.";
    headers = ["Node", "x", "f(x)", "p(x)"];
    rows = d.nodes.map((x, i) => [i, fmt(x), fmt(d.f(x)), fmt(d.p(x))]);
  } else if (c.id === "integration") {
    const d = integrationData(s);
    ch = chart({
      xmin: -0.12,
      xmax: Math.PI + 0.12,
      ymin: -0.08,
      ymax: 1.17,
      xticks: [0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4, Math.PI],
      yticks: [0, 0.25, 0.5, 0.75, 1],
      ylabel: "y",
    });
    if (s.method === "trapezoid") {
      for (let i = 0; i < s.k; i++) {
        const a = d.nodes[i],
          b = d.nodes[i + 1];
        ch.add(/* HTML */ `<path
  d="M${ch.xp(a.x)},${ch.yp(0)}L${ch.xp(a.x)},${ch.yp(a.y)}L${ch.xp(b.x)},${ch.yp(b.y)}L${ch.xp(b.x)},${ch.yp(0)}Z"
  fill="#f5ecec"
  stroke="#cfa3aa"
  stroke-width="1"
/>`);
      }
    } else {
      for (let i = 0; i < s.k; i += 2) {
        const a = d.nodes[i],
          b = d.nodes[i + 1],
          c = d.nodes[i + 2];
        const pts = Array.from({ length: 25 }, (_, j) => {
          let x = a.x + ((c.x - a.x) * j) / 24;
          let y =
            (a.y * (x - b.x) * (x - c.x)) / ((a.x - b.x) * (a.x - c.x)) +
            (b.y * (x - a.x) * (x - c.x)) / ((b.x - a.x) * (b.x - c.x)) +
            (c.y * (x - a.x) * (x - b.x)) / ((c.x - a.x) * (c.x - b.x));
          return [x, y];
        });
        ch.add(/* HTML */ `<path
  d="M${ch.xp(a.x)},${ch.yp(0)}${pts.map(([x, y]) => `L${ch.xp(x)},${ch.yp(y)}`).join("")}L${ch.xp(c.x)},${ch.yp(0)}Z"
  fill="#f5ecec"
  stroke="#cfa3aa"
  stroke-width="1"
/>`);
      }
    }
    ch.curve(Math.sin);
    d.nodes.forEach((r) => ch.dot(r.x, r.y, svgColor.blue, 3));
    metrics = [
      ["Integral estimate", fmt(d.value, 8)],
      ["Absolute error", fmt(Math.abs(d.value - 2))],
      ["Exact integral", "2"],
    ];
    insight = `With ${s.k} subintervals, h = ${fmt(d.h)}. ${
      s.method === "trapezoid"
        ? "The straight segments lie below this concave curve, so the estimate is too small."
        : "Quadratic panels follow the smooth curve more closely. The number of " +
          "subintervals remains even."
    }`;
    headers = ["Node", "x", "sin(x)", "Weight"];
    rows = d.nodes.map((r) => [r.i, fmt(r.x), fmt(r.y), r.w]);
  } else {
    const d = odeData(s),
      l = d.rows.at(-1),
      lowest = Math.min(0, ...d.rows.map((r) => r.y));
    ch = chart({
      xmin: -0.05,
      xmax: 2.08,
      ymin: lowest - 0.09,
      ymax: 1.13,
      xticks: [0, 0.5, 1, 1.5, 2],
      yticks: lowest < 0 ? [-1, -0.5, 0, 0.5, 1] : [0, 0.25, 0.5, 0.75, 1],
      xlabel: "t",
      ylabel: "y(t)",
    });
    ch.curve((t) => Math.exp(-2 * t));
    ch.add(
      ch.line(
        d.rows.map((r) => [r.t, r.y]),
        svgColor.blue,
        2,
      ),
    );
    d.rows.forEach((r) => ch.dot(r.t, r.y, svgColor.blue, 3));
    metrics = [
      ["Estimate y(2)", fmt(l.y, 8)],
      ["Endpoint error", fmt(l.error)],
      ["Step size h", fmt(d.h)],
    ];
    insight =
      d.h === 1
        ? "At h = 1, " +
          String(
            s.method === "euler"
              ? "Euler oscillates between +1 and −1"
              : "Heun remains at 1",
          ) +
          ". Neither reproduces the true decay. Increase the number of steps."
        : "The exact endpoint is e⁻⁴ ≈ " +
          String(fmt(Math.exp(-4), 8)) +
          ". " +
          String(
            s.method === "euler"
              ? "Euler uses one slope per step and has first-order global accuracy."
              : "Heun averages two slopes and has second-order global accuracy.",
          );
    headers = ["Step", "Time t", "Estimate y", "Absolute error"];
    rows = d.rows.map((r) => [r.i, fmt(r.t), fmt(r.y, 8), fmt(r.error, 8)]);
  }
  return { svg: ch.end(), metrics, insight, headers, rows };
}

// SECTION 4 — CONTROLS AND PAGE RENDERING
/**
 * Create a labeled select control from [value, visible label] pairs.
 * The currently selected option comes from the shared experiment state.
 */
function options(name, list) {
  return /* HTML */ `<div class="control-group">
  <label for="${name}">${name === "fn" ? "Equation" : "Node placement"}</label
  ><select id="${name}" data-control="${name}">
    ${list.map(([v, t]) => /* HTML */ `<option value="${v}" ${state[name] === v ? "selected" : ""}>${t}</option>`).join("")}
  </select>
</div>`;
}
/**
 * Create method-selection buttons with accessible pressed states.
 * data-method connects each button to its click handler.
 */
function methods(list) {
  return /* HTML */ `<div class="control-group">
    <span class="control-label" id="method-label">Method</span>
    <div class="segmented" role="group" aria-labelledby="method-label">
      ${list
        .map(
          ([v, t]) => /* HTML */ `<button
  type="button"
  data-method="${v}"
  class="${state.method === v ? "selected" : ""}"
  aria-pressed="${state.method === v}"
>
  ${t}
</button>`,
        )
        .join("")}
    </div>
  </div>`;
}
/**
 * Build controls appropriate to the current chapter.
 * The chapter range defines valid counts and increments.
 * Newton additionally exposes an initial-guess slider.
 */
function controls() {
  const c = chapters[current],
    r = c.range;
  let out = "";
  if (c.id === "roots") {
    out += options("fn", [
      ["cubic", "x³ − x − 2"],
      ["cosine", "cos(x) − x"],
    ]);
    out += methods([
      ["bisection", "Bisection"],
      ["newton", "Newton"],
      ["secant", "Secant"],
    ]);
  }
  if (c.id === "interpolation")
    out += options("nodes", [
      ["equally", "Equally spaced"],
      ["chebyshev", "Chebyshev"],
    ]);
  if (c.id === "integration")
    out += methods([
      ["trapezoid", "Trapezoidal"],
      ["simpson", "Simpson"],
    ]);
  if (c.id === "odes")
    out += methods([
      ["euler", "Euler"],
      ["heun", "Heun"],
    ]);
  out += /* HTML */ `<div class="control-group">
    <div class="range-head">
      <label for="iteration">${r.label}</label
      ><output id="range-value" for="iteration">${state.k}</output>
    </div>
    <input
      id="iteration"
      data-control="k"
      type="range"
      min="${r.min}"
      max="${r.max}"
      step="${r.step}"
      value="${state.k}"
    />
    <div class="range-ends"><span>${r.min}</span><span>${r.max}</span></div>
  </div>`;
  if (c.id === "roots" && state.method === "newton")
    out += /* HTML */ `<div class="control-group">
      <div class="range-head">
        <label for="start">Initial guess x₀</label
        ><output id="start-value" for="start">${state.start}</output>
      </div>
      <input
        id="start"
        type="range"
        min="${state.fn === "cosine" ? 0 : 1}"
        max="${state.fn === "cosine" ? 1.2 : 2.2}"
        step=".1"
        value="${state.start}"
        data-control="start"
      />
    </div>`;
  out += /* HTML */ `<div class="btn-row">
    <button
      class="btn primary"
      id="next-step"
      type="button"
      ${state.k >= r.max ? "disabled" : ""}
    >
      ${["roots", "linear"].includes(c.id) ? "Next iteration" : c.id === "errors" ? "Smaller step" : "Refine"}</button
    ><button
      class="btn reset"
      id="reset"
      type="button"
      aria-label="Reset experiment"
      title="Reset experiment"
    >
      ↺
    </button>
  </div>
  <p class="control-hint">
    ${
      c.id === "roots"
        ? state.method === "bisection"
          ? "Starting bracket: " +
            (state.fn === "cosine" ? "[0, 1]" : "[1, 2]") +
            ". Each step halves the interval."
          : state.method === "secant"
            ? "Starting pair: " +
              (state.fn === "cosine" ? "0 and 1" : "1 and 2") +
              ". Two points determine each secant."
            : "Move the initial guess to see how the sequence changes."
        : "Change the control and compare the result with the exact solution."
    }
  </p>`;
  return out;
}
/**
 * Refresh the graph, numerical metrics, explanation, and results table.
 * Keep the controls themselves intact so dragging a slider retains focus.
 * Return the calculated result for callers, including optional agent tools.
 */
function renderExperiment() {
  const d = getExperiment();
  document.getElementById("plot").innerHTML =
    d.svg +
    /* HTML */ `<div class="legend">
  ${
    chapters[current].legend
      .map(
        (t, i) => /* HTML */ `
          <span>
            <i class="${i === 1 ? "blue" : i === 2 ? "orange" : ""}"></i>
            ${t}
          </span>
        `,
      )
      .join("")
  }
</div>`;
  document.getElementById("metrics").innerHTML = d.metrics
    .map(
      ([l, v], i) => /* HTML */ `<div class="metric">
          <span class="metric-label">${l}</span
          ><span class="metric-value ${i === 1 ? "accent" : ""}">${v}</span>
        </div>`,
    )
    .join("");
  document.getElementById("insight").innerHTML = /* HTML */ `<span
      class="symbol"
      aria-hidden="true"
      >∴</span
    >
    <p>${d.insight}</p>`;
  document.getElementById("table").innerHTML = /* HTML */ `<table>
    <caption class="sr-only">
      Numerical results for ${chapters[current].short}
    </caption>
    <thead>
      <tr>
        ${d.headers.map((t) => /* HTML */ `<th scope="col">${t}</th>`).join("")}
      </tr>
    </thead>
    <tbody>
      ${d.rows
        .map(
          (r) => /* HTML */ `<tr>
              ${r.map((v) => /* HTML */ `<td>${v}</td>`).join("")}
            </tr>`,
        )
        .join("")}
    </tbody>
  </table>`;
  document.getElementById("range-value").textContent = String(state.k);
  document.getElementById("next-step").disabled =
    state.k >= chapters[current].range.max;
  return d;
}
/**
 * Merge partial control values into state and refresh the experiment.
 * Values should already be validated by the caller.
 */
function setState(change) {
  state = { ...state, ...change };
  return renderExperiment();
}
/**
 * Connect dropdowns, sliders, method buttons, stepping, and reset.
 * Call this again when a method change rebuilds the controls.
 * Changing an equation also selects a suitable default Newton starting point.
 */
function bindControls() {
  document.querySelectorAll("[data-control]").forEach((el) =>
    el.addEventListener(el.tagName === "SELECT" ? "change" : "input", () => {
      const key = el.dataset.control;
      let v = el.tagName === "SELECT" ? el.value : Number(el.value);
      state[key] = v;
      if (key === "fn") {
        state.start = v === "cosine" ? 0.8 : 1.8;
        document.getElementById("controls").innerHTML = controls();
        bindControls();
      }
      if (key === "start")
        document.getElementById("start-value").textContent = String(v);
      renderExperiment();
    }),
  );
  document.querySelectorAll("[data-method]").forEach((b) =>
    b.addEventListener("click", () => {
      state.method = b.dataset.method;
      document.getElementById("controls").innerHTML = controls();
      bindControls();
      renderExperiment();
      document.querySelector(`[data-method="${state.method}"]`).focus();
    }),
  );
  document.getElementById("next-step").onclick = () => {
    state.k = Math.min(
      chapters[current].range.max,
      state.k + chapters[current].range.step,
    );
    document.getElementById("iteration").value = String(state.k);
    renderExperiment();
  };
  document.getElementById("reset").onclick = () => {
    state = { ...chapters[current].defaults };
    document.getElementById("controls").innerHTML = controls();
    bindControls();
    renderExperiment();
    document.getElementById("reset").focus();
  };
}
/**
 * Select a chapter by its stable ID and restore that chapter’s defaults.
 * Unknown IDs return false. Otherwise render the lesson and optionally
 * move focus to its heading for keyboard and screen-reader users.
 */
function selectChapter(id, scroll = true) {
  const idx = chapters.findIndex((c) => c.id === id);
  if (idx < 0) return false;
  current = idx;
  state = { ...chapters[current].defaults };
  render();
  if (scroll) {
    window.scrollTo({ top: 0, behavior: "instant" });
    document.getElementById("lesson-title").focus({ preventScroll: true });
  }
  return true;
}
/**
 * Render the complete lesson page from the current chapter object.
 * Build navigation, the experiment, teaching notes, and the practice form.
 * After inserting the HTML, attach controls and answer-checking behavior.
 * Most lesson wording lives in chapters, rather than in this layout function.
 */
function render() {
  const c = chapters[current],
    num = String(current + 1).padStart(2, "0");
  document.title = `${c.short} — Converge`;
  document.getElementById("app").innerHTML = /* HTML */ `<aside class="sidebar">
    <a href="#roots" class="brand" aria-label="Converge home"
      ><span class="brand-mark" aria-hidden="true">∑</span>converge<span
        style="font-size:16px;color:var(--green);margin-left:-4px"
        >.</span
      ></a
    >
    <div class="course-label">The core course</div>
    <nav class="chapter-nav" aria-label="Chapters">
      ${chapters
        .map(
          (x, i) => /* HTML */ `<a
              href="#${x.id}"
              class="${i === current ? "active" : ""}"
              ${i === current ? 'aria-current="page"' : ""}
              ><span class="number">${String(i + 1).padStart(2, "0")}</span
              ><span class="nav-title">${x.short}</span
              ><span class="nav-symbol" aria-hidden="true"
                >${x.symbol}</span
              ></a
            >`,
        )
        .join("")}
    </nav>
    <div class="sidebar-foot">
      <strong>Learn by changing something.</strong>
      <p>
        Make a prediction.<br />Run the experiment.<br />Understand the
        difference.
      </p>
      <a href="https://fncbook.com/" target="_blank" rel="noopener"
        >Further reading ↗</a
      >
    </div>
  </aside>
  <main class="main" id="lesson">
    <header class="topbar">
      <div class="crumb">Numerical analysis<span>/</span>${c.short}</div>
      <a class="site-link" href="../">Sarthak Sourav Dash</a>
    </header>
    <div class="content">
      <div class="eyebrow">Chapter ${num} of 06</div>
      <div class="intro-row">
        <h1 id="lesson-title" tabindex="-1">${c.title}</h1>
        <span class="lesson-meta">${c.prereq}</span>
      </div>
      <p class="lesson-intro">${c.intro}</p>
      <nav class="section-links" aria-label="In this lesson">
        <a href="#experiment">Experiment</a
        ><a href="#understand">Understand</a><a href="#practice">Practice</a>
      </nav>
      <section class="lab" id="experiment" aria-labelledby="lab-title">
        <div class="lab-heading">
          <h2 class="lab-title" id="lab-title">${c.lab}</h2>
          <span class="lab-kicker"
            ><span class="spark" aria-hidden="true">⌁</span>LIVE
            EXPERIMENT</span
          >
        </div>
        <div class="lab-body">
          <div class="plot-wrap" id="plot"></div>
          <div class="control-panel" id="controls">${controls()}</div>
        </div>
        <div
          class="metrics"
          id="metrics"
          aria-live="polite"
          aria-atomic="true"
        ></div>
      </section>
      <div class="insight" id="insight"></div>
      <details class="details">
        <summary>See the numbers</summary>
        <div class="table-scroll" id="table"></div>
      </details>
      <section class="reading" id="understand">
        <div class="section-title">
          <span class="section-no">01 /</span>
          <h2>${c.theoryTitle}</h2>
        </div>
        <div class="idea-grid">
          <div class="theory">
            ${c.theory.map((p) => /* HTML */ `<p>${p}</p>`).join("")}
          </div>
          <div class="formula-card">
            <span class="formula-label">The central idea</span>
            <div class="math">${c.formula}</div>
            <p>${c.formulaNote}</p>
          </div>
        </div>
        <h3 class="subhead">Worked example · ${c.workedTitle}</h3>
        <div class="steps">
          ${c.steps
            .map(
              ([title, text], i) => /* HTML */ `<article class="step">
                  <span class="step-num">0${i + 1}</span>
                  <h3>${title}</h3>
                  <p>${text}</p>
                </article>`,
            )
            .join("")}
        </div>
        <p class="caution"><strong>Keep in mind.</strong> ${c.caution}</p>
        <details class="details">
          <summary>Read the algorithm</summary>
          <pre class="code-body">${c.code}</pre>
        </details>
      </section>
      <section class="practice" id="practice">
        <div>
          <div class="practice-label">02 / Check your understanding</div>
          <h2>Your turn.</h2>
          <p>${c.question}</p>
        </div>
        <div>
          <form class="answer-form" id="answer-form">
            <label for="answer">Your answer (a number)</label>
            <div class="answer-field">
              <input
                id="answer"
                inputmode="decimal"
                type="text"
                placeholder="Enter a value"
                autocomplete="off"
                aria-describedby="feedback"
              /><button class="btn" type="submit">Check answer</button>
            </div>
            <p class="feedback" id="feedback" role="status"></p>
          </form>
          <details>
            <summary>Need a hint?</summary>
            <p>${c.hint}</p>
          </details>
          <details>
            <summary>Show explanation</summary>
            <p>${c.solution}</p>
          </details>
        </div>
      </section>
      <footer class="lesson-footer">
        <div>
          <small>CONVERGE / THE CORE COURSE</small><br /><a
            href="#${chapters[(current + 5) % 6].id}"
            >${current === 0 ? "Revisit differential equations" : "Previous: " + chapters[current - 1].short}</a
          >
        </div>
        <a class="btn" href="#${chapters[(current + 1) % 6].id}"
          >${current === 5 ? "Back to foundations" : "Next: " + chapters[current + 1].short}</a
        >
      </footer>
      <p class="footer-reading">
        Want to go deeper?
        <a href="https://fncbook.com/" target="_blank" rel="noopener"
          >Fundamentals of Numerical Computation</a
        >, by Tobin A. Driscoll and Richard J. Braun, is a free undergraduate
        textbook.
      </p>
    </div>
  </main>`;
  renderExperiment();
  bindControls();
  document.getElementById("answer-form").onsubmit = (e) => {
    e.preventDefault();
    const raw = document.getElementById("answer").value.trim();
    const value = Number(raw);
    document.getElementById("feedback").textContent =
      !raw || !Number.isFinite(value)
        ? "Enter a finite number, such as 0.25."
        : Math.abs(value - c.answer) <= c.tolerance
          ? "Correct. " + c.solution
          : "Not quite. Try the hint, then check your calculation.";
  };
}
// SECTION 5 — OPTIONAL AGENT TOOLS AND INITIALIZATION
/**
 * Optionally expose two page actions to WebMCP-capable browsers.
 * Normal browsers skip this section and all lessons still work.
 * Validate tool inputs, reuse the same UI state, and unregister on page exit.
 */
function registerTools() {
  if (!document.modelContext?.registerTool) return;
  const lifecycle = new AbortController();
  const specs = [
    {
      name: "navigate_numerical_lesson",
      title: "Open a numerical analysis lesson",
      description:
        "Navigate to one of the six course lessons and reset its experiment to the " +
        "default values.",
      inputSchema: {
        type: "object",
        properties: { lesson: { type: "string", enum: chapters.map((c) => c.id) } },
        required: ["lesson"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: (input) => {
        if (!input || !chapters.some((c) => c.id === input.lesson))
          throw new Error("Unknown lesson");
        history.replaceState(null, "", "#" + input.lesson);
        selectChapter(input.lesson);
        return { lesson: chapters[current].id, parameters: { ...state } };
      },
    },
    {
      name: "set_experiment_resolution",
      title: "Set numerical experiment resolution",
      description:
        "Change the visible current lesson’s iteration count, node count, step count, " +
        "or step-size exponent. Returns the resulting numerical metrics.",
      inputSchema: {
        type: "object",
        properties: { value: { type: "integer", minimum: 0, maximum: 40 } },
        required: ["value"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: (input) => {
        const r = chapters[current].range,
          v = input?.value;
        if (
          !Number.isInteger(v) ||
          v < r.min ||
          v > r.max ||
          (v - r.min) % r.step !== 0
        )
          throw new Error(
            `For this lesson, value must range from ${r.min} to ${r.max} in steps of ${r.step}`,
          );
        state.k = v;
        document.getElementById("iteration").value = String(v);
        const d = renderExperiment();
        return {
          lesson: chapters[current].id,
          value: v,
          metrics: Object.fromEntries(d.metrics),
        };
      },
    },
  ];
  for (const spec of specs) {
    try {
      Promise.resolve(
        document.modelContext.registerTool(spec, { signal: lifecycle.signal }),
      ).catch(() => {});
    } catch {}
  }
  window.addEventListener("pagehide", () => lifecycle.abort(), { once: true });
}
// Initialize only in a browser. The calculation functions can also run in Node.
if (typeof document !== "undefined") {
  const init = location.hash.slice(1);
  selectChapter(chapters.some((c) => c.id === init) ? init : "roots", false);
  window.addEventListener("hashchange", () => {
    const id = location.hash.slice(1);
    if (chapters.some((c) => c.id === id)) selectChapter(id);
  });
  registerTools();
}
// Export pure calculations for optional Node.js checks; browsers skip this.
if (typeof module !== "undefined")
  module.exports = {
    chapters,
    rootData,
    linearData,
    interpolationData,
    integrationData,
    odeData,
    errorData,
  };
