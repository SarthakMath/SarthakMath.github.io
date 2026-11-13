// =====================================================================
// app2d.js — draws the live figures of Part II (chapters 7 to 10).
//   Words:        index.html
//   Mathematics:  fem2d.js   (window.FEM2D)
//   Shared tools: window.FEMUI, set up by app.js (helpers, colours, and
//                 S.prob, the heating pattern chosen in chapter 1)
// =====================================================================
(function () {
  'use strict';
  const G = window.FEM2D, UI = window.FEMUI;
  const { S, C, $, el, text, fmt, sci, sub, clamp, start, segmented, svgPoint } = UI;
  const P2 = () => G.problems[S.prob];

  // ---- What the reader has chosen in Part II ------------------------------
  const T = {
    pyr: { mode: 'one', n: 3, sel: null },                                   // chapter 7
    tri: { P: [[0.15, 0.18], [1.02, 0.28], [0.5, 0.9]], sel: [0, 1] },       // chapter 8
    sp: { n: 2, order: 'rows', step: 0, node: null, timer: null },           // chapter 9
    pl: { n: 8 },                                                            // chapter 10
  };

  // ---- Colour scales for the maps ---------------------------------------------
  function ramp(stops, t) {
    t = clamp(t, 0, 1) * (stops.length - 1);
    const i = Math.min(stops.length - 2, Math.floor(t)), f = t - i;
    return 'rgb(' + stops[i].map((a, k) => Math.round(a + (stops[i + 1][k] - a) * f)).join(',') + ')';
  }
  const heat = (t) => ramp([[247, 240, 226], [214, 160, 92], [150, 62, 50], [84, 20, 34]], t);   // temperature
  const cool = (t) => ramp([[246, 244, 240], [150, 172, 190], [43, 74, 99]], t);                 // error
  const pts = (list) => list.map((p) => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');

  // =====================================================================
  // CHAPTER 7 — pyramids: the hat function of a node in two dimensions
  // =====================================================================
  function drawPyramid() {
    const s = T.pyr, n = s.n, m = G.mesh(n), p = P2(), svg = $('figPyramid');
    if (s.sel === null || s.sel >= m.nodes.length) s.sel = Math.floor(n / 2) * (n + 1) + Math.floor(n / 2);
    segmented($('pyrSeg'), [['one', 'One pyramid'], ['all', 'All pyramids added']], s.mode, (k) => { s.mode = k; drawPyramid(); });
    $('pyrN').value = n; $('pyrNOut').textContent = n;
    start(svg, 720, 345);
    // the square seen from the front and above: x to the right, y into the page, z up
    const proj = (x, y, z) => [120 + 380 * x + 190 * y, 322 - 150 * y - 150 * z];
    const z = m.nodes.map((q, k) => (s.mode === 'one' ? (k === s.sel ? 1 : 0) : p.u(q[0], q[1])));
    const ground = (k) => proj(m.nodes[k][0], m.nodes[k][1], 0);
    const raised = (k) => proj(m.nodes[k][0], m.nodes[k][1], z[k]);

    el('polygon', { points: pts([proj(0, 0, 0), proj(1, 0, 0), proj(1, 1, 0), proj(0, 1, 0)]), fill: '#f6f2ea' }, svg);
    m.tris.forEach((t) => el('polygon', { points: pts(t.map(ground)), fill: 'none', stroke: '#cfc7b8', 'stroke-width': 0.9 }, svg));

    // far triangles first, so near ones are drawn over them
    const order = m.tris.map((t, i) => i).sort((a, b) => {
      const ya = m.tris[a].reduce((q, k) => q + m.nodes[k][1], 0), yb = m.tris[b].reduce((q, k) => q + m.nodes[k][1], 0);
      return yb - ya;
    });
    order.forEach((i) => {
      const t = m.tris[i];
      if (s.mode === 'one') {
        if (!t.includes(s.sel)) return;
        el('polygon', { points: pts(t.map(raised)), fill: 'rgba(107,29,42,0.2)', stroke: C.hi, 'stroke-width': 1.5, 'stroke-linejoin': 'round' }, svg);
      } else {
        const mean = (z[t[0]] + z[t[1]] + z[t[2]]) / 3;
        el('polygon', { points: pts(t.map(raised)), fill: heat(mean), stroke: '#fff', 'stroke-width': 0.8, 'stroke-linejoin': 'round' }, svg);
      }
    });
    if (s.mode === 'one') {
      const a = ground(s.sel), b = raised(s.sel);
      el('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: C.hi, 'stroke-width': 1, 'stroke-dasharray': '4 4' }, svg);
      el('circle', { cx: a[0], cy: a[1], r: 3.5, fill: '#fff', stroke: C.hi, 'stroke-width': 1.5 }, svg);
      text(svg, b[0] + 12, b[1] + 4, 'height 1', 'it hi', 'start');
    }
    m.nodes.forEach((q, k) => {
      const c = raised(k), on = k === s.sel;
      const dot = el('circle', { cx: c[0], cy: c[1], r: on ? 7 : s.mode === 'all' ? 3.5 : 5.5, fill: on ? C.hi : C.main, stroke: '#fff', 'stroke-width': 1.5, class: 'pick', 'data-node': k }, svg);
      dot.addEventListener('click', () => { s.sel = k; drawPyramid(); });
    });
    const touching = m.tris.filter((t) => t.includes(s.sel)).length, q = m.nodes[s.sel];
    $('outPyramid').innerHTML = s.mode === 'one'
      ? `The pyramid of the node at <span class="math">(${fmt(q[0])}, ${fmt(q[1])})</span> stands on <b>${touching}</b> triangle${touching === 1 ? '' : 's'}` + (m.boundary[s.sel] ? '. This node lies on the edge of the plate, so its height will be fixed at zero.' : ' and is zero everywhere else.')
      : `Each pyramid is scaled to the exact temperature at its node; here the selected node has height <b>${fmt(z[s.sel])}</b>. The surface has <b>${m.tris.length}</b> flat facets and <b>${(n - 1) * (n - 1)}</b> free heights.`;
  }

  // =====================================================================
  // CHAPTER 8 — one triangle: gradients, angles and the 3×3 matrix
  // =====================================================================
  const triX = (x) => 20 + 350 * x, triY = (y) => 385 - 350 * y;
  function arrow(svg, from, dir, lenPx, colour, label) {
    const n = Math.hypot(dir[0], dir[1]), ux = dir[0] / n, uy = -dir[1] / n;   // screen y points down
    const x2 = from[0] + ux * lenPx, y2 = from[1] + uy * lenPx;
    el('line', { x1: from[0], y1: from[1], x2, y2, stroke: colour, 'stroke-width': 2.5 }, svg);
    const hx = x2 + ux * 11, hy = y2 + uy * 11;
    el('polygon', { points: pts([[hx, hy], [x2 - uy * 5, y2 + ux * 5], [x2 + uy * 5, y2 - ux * 5]]), fill: colour }, svg);
    text(svg, hx + ux * 16, hy + uy * 16 + 4, label, 'it', 'middle').setAttribute('fill', colour);
  }
  function drawTriangle() {
    const s = T.tri, P = s.P, g = G.triangle(P[0], P[1], P[2]), svg = $('figTriangle');
    const deg = g.angles.map((a) => (a * 180) / Math.PI);
    const [i, j] = s.sel, k = i === j ? -1 : 3 - i - j;
    start(svg, 460, 400);
    const S2 = P.map((p) => [triX(p[0]), triY(p[1])]);
    const cen = [(S2[0][0] + S2[1][0] + S2[2][0]) / 3, (S2[0][1] + S2[1][1] + S2[2][1]) / 3];
    el('polygon', { points: pts(S2), fill: '#f6f2ea', stroke: C.main, 'stroke-width': 2, 'stroke-linejoin': 'round' }, svg);
    if (i !== j) el('line', { x1: S2[i][0], y1: S2[i][1], x2: S2[j][0], y2: S2[j][1], stroke: C.hi, 'stroke-width': 4.5, 'stroke-linecap': 'round' }, svg);
    S2.forEach((v, a) => {
      const dx = cen[0] - v[0], dy = cen[1] - v[1], d = Math.hypot(dx, dy) || 1;
      text(svg, v[0] + (dx / d) * 40, v[1] + (dy / d) * 40 + 5, Math.round(deg[a]) + '°', 'strong' + (a === k ? ' hi' : ''));
      text(svg, v[0] - (dx / d) * 24, v[1] - (dy / d) * 24 + 5, String(a + 1), 'strong');
    });
    const shown = i === j ? [i] : [i, j], colours = [C.hi, C.third];
    shown.forEach((a, q) => arrow(svg, cen, g.grads[a], clamp(Math.hypot(...g.grads[a]) * 30, 20, 115), colours[q], '∇φ' + sub(a + 1)));
    S2.forEach((v, a) => el('circle', { cx: v[0], cy: v[1], r: 10, fill: C.main, stroke: '#fff', 'stroke-width': 2, class: 'grab', 'data-drag': a }, svg));

    const host = $('matTri');
    host.textContent = '';
    for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) {
      const btn = document.createElement('button');
      btn.type = 'button'; btn.textContent = fmt(g.K[a][b]);
      btn.setAttribute('aria-label', `Row ${a + 1}, column ${b + 1}: ${fmt(g.K[a][b])}`);
      btn.setAttribute('aria-pressed', a === i && b === j ? 'true' : 'false');
      btn.addEventListener('click', () => { s.sel = [a, b]; drawTriangle(); });
      host.appendChild(btn);
    }
    let html;
    if (i === j) {
      const [b, c] = [0, 1, 2].filter((a) => a !== i);
      html = `<span class="math">K${sub(i + 1)}${sub(i + 1)} = area × |∇φ${sub(i + 1)}|² = ½ (cot θ${sub(b + 1)} + cot θ${sub(c + 1)})</span> = <b>${fmt(g.K[i][i])}</b>.<br>A diagonal entry is always positive.`;
    } else {
      const th = deg[k];
      const why = Math.abs(th - 90) < 0.75
        ? `The angle at corner ${k + 1} is 90°: the two gradients are perpendicular and the entry vanishes.`
        : th > 90
          ? `<span class="warn">The angle at corner ${k + 1} is obtuse.</span> The two gradients point partly the same way, and the entry is positive.`
          : `The angle at corner ${k + 1} is below 90°. The two gradients point partly against each other, so the entry is negative.`;
      html = `<span class="math">K${sub(i + 1)}${sub(j + 1)} = area × ∇φ${sub(i + 1)} · ∇φ${sub(j + 1)} = −½ cot θ${sub(k + 1)} = −½ cot ${Math.round(th)}°</span> = <b>${fmt(g.K[i][j])}</b>.<br>${why}`;
    }
    $('outTriangle').innerHTML = html;
    $('outTriShape').innerHTML = `Area <b>${fmt(g.area, 3)}</b>. Angles <b>${deg.map((d) => Math.round(d) + '°').join(', ')}</b>. Every row of the matrix adds up to zero.`;
  }
  function wireTriangleDragging() {
    const svg = $('figTriangle');
    let drag = null;
    svg.addEventListener('pointerdown', (ev) => {
      const t = ev.target.closest('[data-drag]');
      if (!t) return;
      drag = +t.dataset.drag;
      svg.setPointerCapture(ev.pointerId);
      svg.classList.add('dragging');
      ev.preventDefault();
    });
    svg.addEventListener('pointermove', (ev) => {
      if (drag === null) return;
      const pt = svgPoint(svg, ev), P = T.tri.P, old = P[drag];
      P[drag] = [clamp((pt.x - 20) / 350, 0.04, 1.16), clamp((385 - pt.y) / 350, 0.04, 1.0)];
      if (G.triangle(P[0], P[1], P[2]).area < 0.02) P[drag] = old;      // do not let the triangle collapse
      drawTriangle();
    });
    const stop = () => { drag = null; svg.classList.remove('dragging'); };
    svg.addEventListener('pointerup', stop);
    svg.addEventListener('pointercancel', stop);
  }

  // =====================================================================
  // CHAPTER 9 — assembly in 2D and the pattern of the matrix
  // =====================================================================
  function stopSpPlay() {
    if (T.sp.timer) { clearInterval(T.sp.timer); T.sp.timer = null; }
    $('spPlay').textContent = 'Play';
  }
  function drawSparsity() {
    const s = T.sp, n = s.n, m = G.mesh(n), N = m.nodes.length, total = m.tris.length, step = s.step;
    const label = s.order === 'rows' ? m.nodes.map((_, k) => k) : G.shuffled(N);   // node → its number
    const nodeOf = []; label.forEach((a, k) => { nodeOf[a] = k; });
    $('spN').value = n; $('spNOut').textContent = n;
    segmented($('spSeg'), [['rows', 'Row by row'], ['shuffled', 'Shuffled']], s.order, (k) => { s.order = k; drawSparsity(); });
    $('spBack').disabled = $('spReset').disabled = step === 0;
    $('spNext').disabled = $('spAll').disabled = step === total;
    const cur = step > 0 ? m.tris[step - 1] : [];
    const neighbours = new Set();
    if (s.node !== null) m.tris.forEach((t) => { if (t.includes(s.node)) t.forEach((k) => neighbours.add(k)); });

    // the mesh
    const svg = $('figSpMesh');
    start(svg, 360, 360);
    const X = (x) => 36 + 288 * x, Y = (y) => 324 - 288 * y, R = N > 16 ? 10 : 12;
    m.tris.forEach((t, i) => {
      const now = i === step - 1;
      el('polygon', { points: pts(t.map((k) => [X(m.nodes[k][0]), Y(m.nodes[k][1])])), fill: now ? 'rgba(107,29,42,0.22)' : i < step ? C.tintMain : '#fff', stroke: now ? C.hi : '#b9b1a2', 'stroke-width': now ? 2 : 1, 'stroke-linejoin': 'round' }, svg);
    });
    m.nodes.forEach((q, k) => {
      const hit = cur.includes(k), picked = k === s.node, near = neighbours.has(k) && !picked;
      const grp = el('g', { class: 'pick' }, svg);
      if (picked || near) el('circle', { cx: X(q[0]), cy: Y(q[1]), r: R + 4, fill: picked ? C.third : 'none', stroke: C.third, 'stroke-width': 2 }, grp);
      el('circle', { cx: X(q[0]), cy: Y(q[1]), r: R, fill: hit ? C.hi : '#fff', stroke: hit ? C.hi : C.main, 'stroke-width': 1.5 }, grp);
      const lab = text(grp, X(q[0]), Y(q[1]) + 4, String(label[k]), '');
      lab.setAttribute('style', `font-size:${N > 16 ? 11 : 12}px;fill:${hit ? '#fff' : C.main}`);
      grp.addEventListener('click', () => { s.node = s.node === k ? null : k; drawSparsity(); });
    });

    // the matrix pattern
    const mat = $('figSpMatrix');
    start(mat, 360, 360);
    const { rows } = G.assemble(m, null, step);
    const o = 34, size = 310 / N, pad = Math.min(2, size * 0.12);
    el('rect', { x: o, y: o, width: 310, height: 310, fill: '#fff', stroke: '#ddd6c8' }, mat);
    if (s.node !== null) el('rect', { x: o, y: o + label[s.node] * size, width: 310, height: size, fill: C.tintThird }, mat);
    el('line', { x1: o, y1: o, x2: o + 310, y2: o + 310, stroke: '#ebe5da' }, mat);
    if (N <= 16) for (let a = 0; a < N; a++) {
      text(mat, o - 7, o + (a + 0.5) * size + 4, String(a), '', 'end').setAttribute('style', 'font-size:10px');
      text(mat, o + (a + 0.5) * size, o - 7, String(a), '').setAttribute('style', 'font-size:10px');
    }
    let nonzero = 0, band = 0;
    rows.forEach((row, i) => row.forEach((v, j) => {
      const a = label[i], b = label[j], solid = Math.abs(v) > 1e-12, hit = cur.includes(i) && cur.includes(j);
      if (solid) { nonzero++; band = Math.max(band, Math.abs(a - b)); }
      const colour = hit ? C.hi : C.main;
      el('rect', { x: o + b * size + pad, y: o + a * size + pad, width: size - 2 * pad, height: size - 2 * pad, fill: solid ? colour : '#fff', stroke: colour, 'stroke-width': solid ? 0 : 1.2, 'fill-opacity': solid ? (hit ? 1 : 0.85) : 1 }, mat);
    }));

    let msg;
    if (step === 0) msg = `No triangles added yet. With ${N} nodes the matrix has ${N} × ${N} = <b>${N * N}</b> entries, all zero so far.`;
    else if (step < total) msg = `Triangle ${step} of ${total} joins nodes <b>${cur.map((k) => label[k]).join(', ')}</b> and adds nine numbers, at those rows and columns.`;
    else msg = `All ${total} triangles are in. <b>${nonzero}</b> of the ${N * N} entries are non-zero (${Math.round((100 * nonzero) / (N * N))}%), and they lie within <b>${band}</b> places of the diagonal.`;
    if (s.node !== null) {
      const list = [...neighbours].filter((k) => k !== s.node).map((k) => label[k]).sort((a, b) => a - b);
      msg += ` Node <b>${label[s.node]}</b> shares a triangle with nodes ${list.join(', ')}; row ${label[s.node]} can hold entries only in those columns and its own.`;
    }
    $('outSparsity').innerHTML = msg;
  }

  // =====================================================================
  // CHAPTER 10 — solve on the plate; error map; convergence plot
  // =====================================================================
  const convCache = {};
  function convergence() {
    if (!convCache[S.prob]) {
      const p = P2();
      convCache[S.prob] = [2, 4, 8, 16, 32].map((n) => { const m = G.mesh(n); return { n, err: G.maxError(m, G.solve(m, p.f).U, p.u) }; });
    }
    return convCache[S.prob];
  }
  function drawPlate() {
    const n = T.pl.n, p = P2(), m = G.mesh(n), sol = G.solve(m, p.f), U = sol.U;
    $('plN').value = n; $('plNOut').textContent = n;
    const sub2 = n <= 4 ? 8 : n <= 8 ? 4 : n <= 16 ? 2 : 1;      // small pieces per triangle side, for smooth colour
    const X = (x) => 14 + 312 * x, Y = (y) => 326 - 312 * y;
    const cells = [];
    let emax = 0;
    m.tris.forEach((t) => {
      const [a, b, c] = t.map((k) => m.nodes[k]), ua = U[t[0]], ub = U[t[1]], uc = U[t[2]];
      const at = (i, j) => { const l2 = i / sub2, l3 = j / sub2, l1 = 1 - l2 - l3; return [l1 * a[0] + l2 * b[0] + l3 * c[0], l1 * a[1] + l2 * b[1] + l3 * c[1], l1 * ua + l2 * ub + l3 * uc]; };
      const add = (q1, q2, q3) => {
        const x = (q1[0] + q2[0] + q3[0]) / 3, y = (q1[1] + q2[1] + q3[1]) / 3, uh = (q1[2] + q2[2] + q3[2]) / 3, e = Math.abs(p.u(x, y) - uh);
        emax = Math.max(emax, e);
        cells.push({ poly: pts([q1, q2, q3].map((q) => [X(q[0]), Y(q[1])])), uh, e });
      };
      for (let i = 0; i < sub2; i++) for (let j = 0; j < sub2 - i; j++) {
        add(at(i, j), at(i + 1, j), at(i, j + 1));
        if (i + j < sub2 - 1) add(at(i + 1, j), at(i + 1, j + 1), at(i, j + 1));
      }
    });
    const err = (emax = Math.max(emax, G.maxError(m, U, p.u)));   // one number for the map, the caption and the plot
    const svgU = $('figPlateU'), svgE = $('figPlateE');
    start(svgU, 340, 340); start(svgE, 340, 340);
    cells.forEach((c) => {
      const fu = heat(c.uh), fe = cool(emax > 0 ? c.e / emax : 0);
      el('polygon', { points: c.poly, fill: fu, stroke: fu, 'stroke-width': 0.7 }, svgU);
      el('polygon', { points: c.poly, fill: fe, stroke: fe, 'stroke-width': 0.7 }, svgE);
    });
    if (n <= 12) m.tris.forEach((t) => {
      const poly = pts(t.map((k) => [X(m.nodes[k][0]), Y(m.nodes[k][1])]));
      el('polygon', { points: poly, fill: 'none', stroke: 'rgba(255,255,255,0.55)', 'stroke-width': 0.8 }, svgU);
      el('polygon', { points: poly, fill: 'none', stroke: 'rgba(20,26,33,0.16)', 'stroke-width': 0.8 }, svgE);
    });
    [svgU, svgE].forEach((v) => el('rect', { x: X(0), y: Y(1), width: 312, height: 312, fill: 'none', stroke: '#b9b1a2' }, v));
    $('capPlateU').innerHTML = 'Computed temperature, from <b>0</b> (pale) to <b>1</b> (dark)';
    $('capPlateE').innerHTML = `Error, from <b>0</b> (pale) to <b>${sci(emax)}</b> (dark)`;
    $('outPlate').innerHTML = `Heating <b class="math">${p.fText}</b>, exact temperature <b class="math">${p.uText}</b>.<br><b>${sol.unknowns}</b> unknown${sol.unknowns === 1 ? '' : 's'}, solved in <b>${sol.iters}</b> conjugate gradient step${sol.iters === 1 ? '' : 's'}. Largest error: <b>${sci(err)}</b>.`;

    // error against mesh size, both on logarithmic axes
    const data = convergence(), svg = $('figConv');
    start(svg, 720, 240);
    const lx = (v) => Math.log2(v), ly = (v) => Math.log10(v);
    const y0 = Math.floor(ly(data[4].err)) , y1 = Math.ceil(ly(Math.max(data[0].err, err)));
    const box = { l: 76, r: 690, t: 18, b: 190 };
    const PX = (v) => box.l + ((lx(v) - 0.7) / 4.6) * (box.r - box.l), PY = (v) => box.b - ((ly(v) - y0) / (y1 - y0)) * (box.b - box.t);
    for (let d = y0; d <= y1; d++) {
      const y = box.b - ((d - y0) / (y1 - y0)) * (box.b - box.t);
      el('line', { x1: box.l, x2: box.r, y1: y, y2: y, stroke: '#ebe5da' }, svg);
      text(svg, box.l - 10, y + 4, d === 0 ? '1' : '10' + String(d).split('').map((ch) => ({ '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵' }[ch])).join(''), '', 'end');
    }
    el('line', { x1: box.l, x2: box.r, y1: box.b, y2: box.b, class: 'axis' }, svg);
    data.forEach((d) => text(svg, PX(d.n), box.b + 20, String(d.n)));
    text(svg, (box.l + box.r) / 2, box.b + 42, 'cells per side', 'it');
    text(svg, box.l - 10, box.t - 4, 'largest error', 'it', 'end').setAttribute('x', box.l + 70);
    // guide of slope 2, drawn a little above the data
    const lift = 2.2, g0 = data[4].err * lift * Math.pow(16, 2), g1 = data[4].err * lift;
    el('line', { x1: PX(2), y1: PY(Math.min(g0, Math.pow(10, y1))), x2: PX(32), y2: PY(g1), stroke: C.soft, 'stroke-width': 1.3, 'stroke-dasharray': '6 5' }, svg);
    text(svg, PX(32) - 6, PY(g1) - 10, 'slope 2', 'it', 'end');
    el('polyline', { points: pts(data.map((d) => [PX(d.n), PY(d.err)])), fill: 'none', stroke: C.main, 'stroke-width': 2.2 }, svg);
    data.forEach((d) => el('circle', { cx: PX(d.n), cy: PY(d.err), r: 4.5, fill: C.main, stroke: '#fff', 'stroke-width': 1.5 }, svg));
    el('circle', { cx: PX(n), cy: PY(err), r: 7, fill: C.hi, stroke: '#fff', 'stroke-width': 2 }, svg);
    text(svg, PX(n), PY(err) + 24, `n = ${n}`, 'hi', 'middle');
  }

  // =====================================================================
  // Controls and start-up
  // =====================================================================
  function drawAll2d() { drawPyramid(); drawTriangle(); drawSparsity(); drawPlate(); }
  const on = (id, type, fn) => $(id).addEventListener(type, fn);
  on('pyrN', 'input', (e) => { T.pyr.n = +e.target.value; T.pyr.sel = null; drawPyramid(); });
  const shape = (P) => () => { T.tri.P = P; drawTriangle(); };
  on('triRight', 'click', shape([[0.15, 0.15], [1.0, 0.15], [0.15, 0.85]]));
  on('triEqui', 'click', shape([[0.18, 0.15], [1.03, 0.15], [0.605, 0.886]]));
  on('triObtuse', 'click', shape([[0.08, 0.2], [1.12, 0.2], [0.6, 0.42]]));
  wireTriangleDragging();
  const spSet = (fn) => () => { stopSpPlay(); fn(); drawSparsity(); };
  const spTotal = () => 2 * T.sp.n * T.sp.n;
  on('spN', 'input', (e) => { stopSpPlay(); T.sp.n = +e.target.value; T.sp.step = 0; T.sp.node = null; drawSparsity(); });
  on('spBack', 'click', spSet(() => { T.sp.step = Math.max(0, T.sp.step - 1); }));
  on('spNext', 'click', spSet(() => { T.sp.step = Math.min(spTotal(), T.sp.step + 1); }));
  on('spAll', 'click', spSet(() => { T.sp.step = spTotal(); }));
  on('spReset', 'click', spSet(() => { T.sp.step = 0; }));
  on('spPlay', 'click', () => {
    if (T.sp.timer) { stopSpPlay(); return; }
    if (T.sp.step === spTotal()) T.sp.step = 0;
    $('spPlay').textContent = 'Pause';
    const tick = () => { T.sp.step++; if (T.sp.step >= spTotal()) stopSpPlay(); drawSparsity(); };
    tick();
    if (T.sp.step < spTotal()) T.sp.timer = setInterval(tick, 450);
  });
  on('plN', 'input', (e) => { T.pl.n = +e.target.value; drawPlate(); });

  UI.hooks.push(() => { drawPyramid(); drawPlate(); });   // these two depend on the heating pattern
  drawAll2d();
})();
