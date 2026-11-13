// =====================================================================
// app.js — draws the live figures of "From PDE to matrix".
//   Words:        index.html
//   Mathematics:  fem1d.js   (window.FEM1D)
//   This file:    one draw...() function per chapter, plus the controls.
// Colours used inside figures are in C just below.
// =====================================================================
(function () {
  'use strict';
  const F = window.FEM1D;
  const C = {
    main: '#2b4a63',   // slate: the main curve
    hi: '#6b1d2a',     // deep wine: the highlighted thing
    third: '#a8742a',  // ochre: third series (the heating f, individual hats)
    soft: '#8b867c',   // dashed reference curves
    tintHi: 'rgba(107,29,42,0.13)', tintMain: 'rgba(43,74,99,0.13)', tintThird: 'rgba(168,116,42,0.16)',
  };

  // ---- What the reader has chosen (the state of every figure) ----------
  const S = {
    prob: 'middle',                                   // heating pattern, shared by all chapters
    v: { kind: 'bump', c: 0.4, w: 0.25, k: 1 },        // chapter 2: test function
    hat: { n: 4, nodes: [], U: [], sel: 2 },           // chapter 3
    el: { a: 0.25, h: 0.25, sel: [0, 1] },             // chapter 4
    asm: { n: 4, uneven: false, step: 0, timer: null },// chapter 5
    sol: { n: 4, uneven: false },                      // chapter 6
  };
  const P = () => F.problems[S.prob];

  // ---- Small helpers ------------------------------------------------------
  const $ = (id) => document.getElementById(id);
  const NS = 'http://www.w3.org/2000/svg';
  function el(name, attrs, parent) {
    const e = document.createElementNS(NS, name);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function text(svg, x, y, str, cls, anchor) {
    const t = el('text', { x, y, class: cls || '', 'text-anchor': anchor || 'middle' }, svg);
    t.textContent = str;
    return t;
  }
  function fmt(x, d) {
    d = d === undefined ? 2 : d;
    if (Math.abs(x) < 0.5 * Math.pow(10, -d)) x = 0;
    return x.toFixed(d).replace('-', '−');
  }
  const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
  function sci(x) {
    if (x < 1e-13) return '0';
    if (x >= 0.001) return x.toPrecision(2);
    const e = Math.floor(Math.log10(x));
    return (x / Math.pow(10, e)).toFixed(1) + ' × 10' + String(e).split('').map((c) => SUP[c]).join('');
  }
  const sub = (i) => String(i).split('').map((c) => '₀₁₂₃₄₅₆₇₈₉'[+c]).join('');
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

  // A plotting area inside an SVG: maps (x, y) in problem units to pixels.
  function start(svg, W, H) { svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.textContent = ''; }
  function frame(box, x0, x1, y0, y1) {
    return {
      X: (x) => box.l + ((x - x0) / (x1 - x0)) * (box.r - box.l),
      Y: (y) => box.b - ((y - y0) / (y1 - y0)) * (box.b - box.t),
      ix: (px) => x0 + ((px - box.l) / (box.r - box.l)) * (x1 - x0),
      iy: (py) => y0 + ((box.b - py) / (box.b - box.t)) * (y1 - y0),
    };
  }
  function curve(fr, fn, a, b, n) {
    n = n || 120;
    let d = '';
    for (let i = 0; i <= n; i++) {
      const x = a + ((b - a) * i) / n;
      d += (i ? 'L' : 'M') + fr.X(x).toFixed(1) + ' ' + fr.Y(fn(x)).toFixed(1);
    }
    return d;
  }
  function areaUnder(fr, fn, a, b, n) {
    return `M${fr.X(a).toFixed(1)} ${fr.Y(0).toFixed(1)}` + curve(fr, fn, a, b, n || 60).replace('M', 'L') + `L${fr.X(b).toFixed(1)} ${fr.Y(0).toFixed(1)}Z`;
  }
  function poly(fr, pts) {
    return pts.map((p, i) => (i ? 'L' : 'M') + fr.X(p[0]).toFixed(1) + ' ' + fr.Y(p[1]).toFixed(1)).join('');
  }
  function axis(svg, fr, labels) {
    el('line', { x1: fr.X(0), x2: fr.X(1), y1: fr.Y(0), y2: fr.Y(0), class: 'axis' }, svg);
    if (labels !== false) {
      text(svg, fr.X(0), fr.Y(0) + 22, 'x = 0', '', 'start');
      text(svg, fr.X(1), fr.Y(0) + 22, 'x = 1', '', 'end');
    }
  }
  function segmented(host, options, current, onPick) {
    host.textContent = '';
    options.forEach(([value, label]) => {
      const b = document.createElement('button');
      b.type = 'button'; b.textContent = label;
      b.setAttribute('aria-pressed', value === current ? 'true' : 'false');
      b.addEventListener('click', () => onPick(value));
      host.appendChild(b);
    });
  }
  // Position of a pointer event in the SVG's own coordinates.
  function svgPoint(svg, ev) {
    const r = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal;
    return { x: ((ev.clientX - r.left) / r.width) * vb.width, y: ((ev.clientY - r.top) / r.height) * vb.height };
  }

  // =====================================================================
  // CHAPTER 1 — the heating f and the exact temperature u
  // =====================================================================
  function drawProblem() {
    const p = P(), svg = $('figProblem');
    segmented($('probSeg'), Object.entries(F.problems).map(([k, q]) => [k, q.label]), S.prob, (k) => { S.prob = k; drawAll(); });
    start(svg, 720, 340);
    const top = frame({ l: 60, r: 700, t: 26, b: 130 }, 0, 1, 0, p.fmax * 1.12);
    const bot = frame({ l: 60, r: 700, t: 186, b: 310 }, 0, 1, 0, 1.15);
    text(svg, 60, 16, 'heating rate f', 'it strong', 'start');
    el('path', { d: areaUnder(top, p.f, 0, 1), fill: C.tintThird }, svg);
    el('path', { d: curve(top, p.f, 0, 1), fill: 'none', stroke: C.third, 'stroke-width': 2 }, svg);
    axis(svg, top, false);
    text(svg, 60, 176, 'temperature u', 'it strong', 'start');
    el('path', { d: curve(bot, p.u, 0, 1), fill: 'none', stroke: C.main, 'stroke-width': 2.5 }, svg);
    axis(svg, bot);
    [0, 1].forEach((x) => el('circle', { cx: bot.X(x), cy: bot.Y(0), r: 4.5, fill: C.main }, svg));
    $('outProblem').innerHTML = `Heating <b class="math">${p.fText}</b>, exact temperature <b class="math">${p.uText}</b>. Both ends stay at zero.`;
  }

  // =====================================================================
  // CHAPTER 2 — the weak form: ∫u′v′ = ∫fv for every admissible v
  // =====================================================================
  // The test function as smooth pieces, so kinks are drawn and integrated correctly.
  function testFunction() {
    const t = S.v;
    if (t.kind === 'sine') return [{ a: 0, b: 1, v: (x) => Math.sin(t.k * Math.PI * x), dv: (x) => t.k * Math.PI * Math.cos(t.k * Math.PI * x) }];
    if (t.kind === 'bad') return [{ a: 0, b: 1, v: (x) => x, dv: () => 1 }];
    const w = Math.min(t.w, t.c, 1 - t.c), c = t.c;
    return [
      { a: 0, b: c - w, v: () => 0, dv: () => 0 },
      { a: c - w, b: c, v: (x) => (x - (c - w)) / w, dv: () => 1 / w },
      { a: c, b: c + w, v: (x) => (c + w - x) / w, dv: () => -1 / w },
      { a: c + w, b: 1, v: () => 0, dv: () => 0 },
    ].filter((q) => q.b - q.a > 1e-9);
  }
  function drawIntegrand(svg, pieces, g, colour, tint) {
    start(svg, 350, 190);
    let m = 1e-9;
    pieces.forEach((q) => { for (let i = 0; i <= 40; i++) m = Math.max(m, Math.abs(g(q, q.a + ((q.b - q.a) * i) / 40))); });
    const fr = frame({ l: 14, r: 336, t: 14, b: 176 }, 0, 1, -m * 1.1, m * 1.1);
    pieces.forEach((q) => {
      el('path', { d: areaUnder(fr, (x) => g(q, x), q.a, q.b, 40), fill: tint }, svg);
      el('path', { d: curve(fr, (x) => g(q, x), q.a, q.b, 40), fill: 'none', stroke: colour, 'stroke-width': 2 }, svg);
    });
    axis(svg, fr, false);
  }
  function drawWeak() {
    const p = P(), t = S.v, pieces = testFunction();
    segmented($('vSeg'), [['bump', 'A bump'], ['sine', 'A wave'], ['bad', 'v = x (breaks the rule)']], t.kind, (k) => { t.kind = k; drawWeak(); });
    $('vcWrap').hidden = $('vwWrap').hidden = t.kind !== 'bump';
    $('vkWrap').hidden = t.kind !== 'sine';
    const wMax = Math.min(t.c, 1 - t.c);
    $('vc').value = t.c; $('vcOut').textContent = fmt(t.c);
    $('vw').value = Math.min(t.w, wMax); $('vwOut').textContent = fmt(Math.min(t.w, wMax));
    $('vk').value = t.k; $('vkOut').textContent = t.k;

    const svg = $('figWeakTop');
    const dips = t.kind === 'sine' && t.k > 1;          // only waves go below the axis
    start(svg, 720, dips ? 250 : 170);
    const fr = frame({ l: 40, r: 700, t: 26, b: dips ? 216 : 136 }, 0, 1, dips ? -1.15 : 0, 1.15);
    axis(svg, fr);
    el('path', { d: curve(fr, p.u, 0, 1), fill: 'none', stroke: C.main, 'stroke-width': 2, 'stroke-dasharray': '6 5' }, svg);
    pieces.forEach((q) => el('path', { d: curve(fr, q.v, q.a, q.b, 60), fill: 'none', stroke: C.hi, 'stroke-width': 2.5 }, svg));
    text(svg, fr.X(0.9), fr.Y(p.u(0.9)) - 12, 'exact u', 'it', 'middle').setAttribute('fill', C.main);
    const lx = t.kind === 'bump' ? t.c : t.kind === 'sine' ? 1 / (2 * t.k) : 0.86;
    const lv = pieces.reduce((acc, q) => (lx >= q.a && lx <= q.b ? q.v(lx) : acc), 0);
    text(svg, fr.X(lx) + (t.kind === 'bad' ? -14 : 0), fr.Y(lv) - 9, 'test function v', 'it hi', t.kind === 'bad' ? 'end' : 'middle');

    drawIntegrand($('figWeakL'), pieces, (q, x) => p.du(x) * q.dv(x), C.main, C.tintMain);
    drawIntegrand($('figWeakR'), pieces, (q, x) => p.f(x) * q.v(x), C.third, C.tintThird);
    const lhs = pieces.reduce((s, q) => s + F.simpson((x) => p.du(x) * q.dv(x), q.a, q.b), 0);
    const rhs = pieces.reduce((s, q) => s + F.simpson((x) => p.f(x) * q.v(x), q.a, q.b), 0);
    $('capWeakL').innerHTML = `<span class="math">∫ u′ v′ dx</span> = <b>${fmt(lhs, 4)}</b>`;
    $('capWeakR').innerHTML = `<span class="math">∫ f v dx</span> = <b>${fmt(rhs, 4)}</b>`;
    $('outWeak').innerHTML = t.kind === 'bad'
      ? `<span class="warn">The areas differ by <b>${fmt(lhs - rhs, 4)}</b>.</span> That is exactly the boundary term <span class="math">u′(1) · v(1)</span> = <b>${fmt(p.du(1), 4)}</b>, which we could drop only because <span class="math">v</span> was zero at the ends.`
      : `The two areas agree: <b>${fmt(lhs, 4)}</b> on both sides.`;
  }

  // =====================================================================
  // CHAPTER 3 — hat functions: u_h is a sum of scaled hats
  // =====================================================================
  let hatFrame = null;
  function resetHats(keepShape) {
    const h = S.hat;
    h.nodes = F.uniformMesh(h.n);
    h.U = h.nodes.map((x, i) => (i === 0 || i === h.n ? 0 : keepShape ? P().u(x) : 0.5));
    h.sel = Math.min(h.sel, h.n - 1) || 1;
  }
  function drawHats() {
    const h = S.hat, p = P(), svg = $('figHats');
    $('hatN').value = h.n; $('hatNOut').textContent = h.n;
    start(svg, 720, 360);
    const fr = (hatFrame = frame({ l: 40, r: 700, t: 16, b: 300 }, 0, 1, -0.2, 1.35));
    axis(svg, fr, false);
    el('path', { d: curve(fr, p.u, 0, 1), fill: 'none', stroke: C.soft, 'stroke-width': 1.5, 'stroke-dasharray': '6 5' }, svg);
    // each scaled hat U_i φ_i
    for (let i = 1; i < h.n; i++) {
      const pts = [[h.nodes[i - 1], 0], [h.nodes[i], h.U[i]], [h.nodes[i + 1], 0]];
      const on = i === h.sel;
      el('path', { d: poly(fr, pts) + 'Z', fill: on ? C.tintHi : 'none', stroke: on ? C.hi : C.third, 'stroke-width': on ? 1.8 : 1.1, 'stroke-opacity': on ? 1 : 0.7 }, svg);
    }
    // their sum
    el('path', { d: poly(fr, h.nodes.map((x, i) => [x, h.U[i]])), fill: 'none', stroke: C.main, 'stroke-width': 2.8, 'stroke-linejoin': 'round' }, svg);
    h.nodes.forEach((x, i) => {
      const inner = i > 0 && i < h.n, X = fr.X(x), Y0 = fr.Y(0);
      text(svg, X, Y0 + 34, 'x' + sub(i), 'it' + (i === h.sel ? ' hi' : ''));
      if (!inner) { el('rect', { x: X - 5, y: Y0 - 5, width: 10, height: 10, fill: C.main }, svg); return; }
      el('path', { d: `M${X} ${Y0 - 9}L${X + 9} ${Y0}L${X} ${Y0 + 9}L${X - 9} ${Y0}Z`, fill: '#fff', stroke: i === h.sel ? C.hi : C.main, 'stroke-width': 2, class: 'grab', 'data-drag': 'x', 'data-i': i }, svg);
      el('circle', { cx: X, cy: fr.Y(h.U[i]), r: 9, fill: i === h.sel ? C.hi : C.main, stroke: '#fff', 'stroke-width': 2, class: 'grab', 'data-drag': 'U', 'data-i': i }, svg);
    });
    const s = h.sel;
    $('outHats').innerHTML = `Heights <b>U = (${h.U.map((u) => fmt(u)).join(', ')})</b>. Highlighted: the hat at node ${s}, scaled by <span class="math">U${sub(s)}</span> = <b>${fmt(h.U[s])}</b>.`;
  }
  function wireHatDragging() {
    const svg = $('figHats');
    let drag = null;
    svg.addEventListener('pointerdown', (ev) => {
      const t = ev.target.closest('[data-drag]');
      if (!t) return;
      drag = { kind: t.dataset.drag, i: +t.dataset.i };
      S.hat.sel = drag.i;
      svg.setPointerCapture(ev.pointerId);
      svg.classList.add('dragging');
      ev.preventDefault();
      drawHats();
    });
    svg.addEventListener('pointermove', (ev) => {
      if (!drag) return;
      const pt = svgPoint(svg, ev), h = S.hat, i = drag.i;
      if (drag.kind === 'U') h.U[i] = clamp(hatFrame.iy(pt.y), -0.15, 1.3);
      else h.nodes[i] = clamp(hatFrame.ix(pt.x), h.nodes[i - 1] + 0.04, h.nodes[i + 1] - 0.04);
      drawHats();
    });
    const stop = () => { drag = null; svg.classList.remove('dragging'); };
    svg.addEventListener('pointerup', stop);
    svg.addEventListener('pointercancel', stop);
  }

  // =====================================================================
  // CHAPTER 4 — one element: its 2×2 matrix and its load
  // =====================================================================
  function drawElement() {
    const e = S.el, p = P(), svg = $('figElement');
    e.h = clamp(e.h, 0.05, 1 - e.a);
    $('elA').value = e.a; $('elAOut').textContent = fmt(e.a);
    $('elH').max = (1 - e.a).toFixed(2); $('elH').value = e.h; $('elHOut').textContent = fmt(e.h);
    const a = e.a, b = e.a + e.h, h = e.h;
    start(svg, 720, 262);
    const fr = frame({ l: 40, r: 700, t: 30, b: 200 }, 0, 1, 0, 1.12);
    el('rect', { x: fr.X(a), y: fr.Y(1.12), width: fr.X(b) - fr.X(a), height: fr.Y(0) - fr.Y(1.12), fill: '#f6f2ea' }, svg);
    axis(svg, fr);
    const on = (k) => e.sel.includes(k);
    const lines = [
      { k: 0, pts: [[a, 1], [b, 0]], name: 'φ₁', slope: '−1/h', lx: a + h * 0.22, ly: 0.78, anchor: 'start' },
      { k: 1, pts: [[a, 0], [b, 1]], name: 'φ₂', slope: '+1/h', lx: b - h * 0.22, ly: 0.78, anchor: 'end' },
    ];
    lines.forEach((L) => {
      el('path', { d: poly(fr, L.pts), fill: 'none', stroke: on(L.k) ? C.hi : C.main, 'stroke-width': on(L.k) ? 3 : 2, 'stroke-opacity': on(L.k) ? 1 : 0.55 }, svg);
    });
    text(svg, fr.X(a) - 6, fr.Y(1) - 8, 'φ₁, slope −1/h', 'it' + (on(0) ? ' hi' : ''), a < 0.2 ? 'start' : 'end').setAttribute('x', a < 0.2 ? fr.X(a) : fr.X(a) + 4);
    text(svg, fr.X(b), fr.Y(1) - 8, 'φ₂, slope +1/h', 'it' + (on(1) ? ' hi' : ''), b > 0.8 ? 'end' : 'start');
    [a, b].forEach((x) => el('circle', { cx: fr.X(x), cy: fr.Y(0), r: 5, fill: C.main }, svg));
    el('path', { d: `M${fr.X(a)} ${fr.Y(0) + 30}H${fr.X(b)}`, stroke: C.soft, 'stroke-width': 1 }, svg);
    text(svg, fr.X((a + b) / 2), fr.Y(0) + 52, `h = ${fmt(h)}`, 'it strong');

    const Ke = F.elementMatrix(h), Fe = F.elementLoad(p.f, a, b);
    const host = $('matKe');
    host.textContent = '';
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
      const btn = document.createElement('button');
      btn.type = 'button'; btn.textContent = fmt(Ke[i][j]);
      btn.setAttribute('aria-label', `Row ${i + 1}, column ${j + 1}: ${fmt(Ke[i][j])}`);
      btn.setAttribute('aria-pressed', e.sel[0] === i && e.sel[1] === j ? 'true' : 'false');
      btn.addEventListener('click', () => { e.sel = [i, j]; drawElement(); });
      host.appendChild(btn);
    }
    $('vecFe').innerHTML = Fe.map((v) => `<span>${fmt(v, 3)}</span>`).join('');
    const [i, j] = e.sel, sl = ['−1/h', '+1/h'];
    $('outElement').innerHTML =
      `<span class="math">K${sub(i + 1)}${sub(j + 1)} = ∫ φ${sub(i + 1)}′ φ${sub(j + 1)}′ dx = (${sl[i]}) × (${sl[j]}) × h = ${i === j ? '+' : '−'}1/h</span> = <b>${fmt(Ke[i][j])}</b>.` +
      `<br>Load: the two entries add up to <b>${fmt(Fe[0] + Fe[1], 3)}</b>, the total heating on this element.`;
  }

  // =====================================================================
  // CHAPTER 5 — assembly, one element at a time
  // =====================================================================
  const mesh = (n, uneven) => (uneven ? F.gradedMesh(n) : F.uniformMesh(n));
  function stopPlay() {
    if (S.asm.timer) { clearInterval(S.asm.timer); S.asm.timer = null; }
    $('asmPlay').textContent = 'Play';
  }
  function drawAssembly() {
    const A = S.asm, p = P(), n = A.n, nodes = mesh(n, A.uneven), s = A.step;
    $('asmN').value = n; $('asmNOut').textContent = n; $('asmUneven').checked = A.uneven;
    $('asmBack').disabled = s === 0; $('asmNext').disabled = s === n; $('asmReset').disabled = s === 0;

    // the mesh, with the element being added highlighted
    const svg = $('figAssembly');
    start(svg, 720, 200);
    const fr = frame({ l: 40, r: 700, t: 28, b: 146 }, 0, 1, 0, 1.1);
    for (let e = 0; e < n; e++) {
      const cur = e === s - 1, done = e < s;
      el('rect', { x: fr.X(nodes[e]), y: fr.Y(1.1), width: fr.X(nodes[e + 1]) - fr.X(nodes[e]), height: fr.Y(0) - fr.Y(1.1), fill: cur ? C.tintHi : done ? C.tintMain : 'none' }, svg);
      text(svg, fr.X((nodes[e] + nodes[e + 1]) / 2), fr.Y(0) + 46, (n > 4 ? 'el. ' : 'element ') + (e + 1), cur ? 'hi' : '');
      const stroke = cur ? C.hi : C.main, w = cur ? 2.6 : 1.3, op = cur ? 1 : done ? 0.75 : 0.3;
      el('path', { d: poly(fr, [[nodes[e], 1], [nodes[e + 1], 0]]), stroke, 'stroke-width': w, 'stroke-opacity': op, fill: 'none' }, svg);
      el('path', { d: poly(fr, [[nodes[e], 0], [nodes[e + 1], 1]]), stroke, 'stroke-width': w, 'stroke-opacity': op, fill: 'none' }, svg);
    }
    axis(svg, fr, false);
    nodes.forEach((x, i) => {
      const cur = s > 0 && (i === s - 1 || i === s);
      el('circle', { cx: fr.X(x), cy: fr.Y(0), r: cur ? 6 : 4.5, fill: cur ? C.hi : C.main }, svg);
      text(svg, fr.X(x), fr.Y(0) + 24, String(i), 'strong' + (cur ? ' hi' : ''));
    });
    text(svg, 40, 17, 'nodes are numbered 0 to ' + n, '', 'start');

    // the local 2×2 block
    const local = $('asmLocal');
    if (s === 0) {
      $('capLocal').textContent = 'Element matrix and load';
      local.innerHTML = '<p class="cap">Nothing chosen yet.</p>';
    } else {
      const a = nodes[s - 1], b = nodes[s], Ke = F.elementMatrix(b - a), Fe = F.elementLoad(p.f, a, b);
      $('capLocal').textContent = `Element ${s}: nodes ${s - 1} and ${s}, h = ${fmt(b - a, 3)}`;
      local.innerHTML = `<table class="grid"><tr><th></th><th>${s - 1}</th><th>${s}</th><th class="sep"></th><th>load</th></tr>` +
        [0, 1].map((r) => `<tr><th>${s - 1 + r}</th><td class="hit"><b>${fmt(Ke[r][0])}</b></td><td class="hit"><b>${fmt(Ke[r][1])}</b></td><td class="sep"></td><td class="hit"><b>${fmt(Fe[r], 3)}</b></td></tr>`).join('') + '</table>';
    }

    // the global matrix, before and after this step
    const now = F.assemble(nodes, p.f, s), prev = F.assemble(nodes, p.f, Math.max(0, s - 1));
    const touched = (i, j) => s > 0 && Math.abs(i - j) <= 1 && Math.max(i, j) <= s;   // an added element joins these nodes
    let html = '<table class="grid"><tr><th></th>' + nodes.map((_, j) => `<th>${j}</th>`).join('') + '<th class="sep"></th><th>F</th></tr>';
    for (let i = 0; i <= n; i++) {
      html += `<tr><th>${i}</th>`;
      for (let j = 0; j <= n; j++) {
        const hit = s > 0 && (i === s - 1 || i === s) && (j === s - 1 || j === s);
        if (hit) {
          const add = now.K[i][j] - prev.K[i][j], had = prev.K[i][j] !== 0;
          html += `<td class="hit"><span class="sum">${had ? fmt(prev.K[i][j]) + ' + ' + fmt(add) : 'new'}</span><b>${fmt(now.K[i][j])}</b></td>`;
        } else if (touched(i, j)) html += `<td>${fmt(now.K[i][j])}</td>`;
        else html += '<td class="empty">·</td>';
      }
      const hitF = s > 0 && (i === s - 1 || i === s);
      if (hitF) {
        const had = i === s - 1 && s > 1;   // the left node already got a share from the previous element
        html += `<td class="sep"></td><td class="hit vec"><span class="sum">${had ? fmt(prev.F[i], 3) + ' + ' + fmt(now.F[i] - prev.F[i], 3) : 'new'}</span><b>${fmt(now.F[i], 3)}</b></td>`;
      } else html += `<td class="sep"></td><td class="vec${i < s ? '' : ' empty'}">${i < s ? fmt(now.F[i], 3) : '·'}</td>`;
      html += '</tr>';
    }
    $('asmGlobal').innerHTML = html + '</table>';

    $('outAssembly').innerHTML = s === 0
      ? 'Nothing has been added yet. Press <b>Add next element</b>.'
      : s < n
        ? `Element ${s} adds its block to rows and columns <b>${s - 1}</b> and <b>${s}</b>.` + (s > 1 ? ` Node ${s - 1} is shared with element ${s - 1}, so its diagonal entry now holds two contributions.` : '')
        : `All ${n} elements are in. Only the diagonal and its two neighbours are non-zero, and every row adds up to zero.`;
  }

  // =====================================================================
  // CHAPTER 6 — boundary conditions, solve, compare with the exact u
  // =====================================================================
  function drawSolve() {
    const Q = S.sol, p = P(), n = Q.n, nodes = mesh(n, Q.uneven);
    $('solN').value = n; $('solNOut').textContent = n; $('solUneven').checked = Q.uneven;
    const { K, F: L, U } = F.solve(nodes, p.f);
    const svg = $('figSolve');
    start(svg, 720, 340);
    const fr = frame({ l: 40, r: 700, t: 16, b: 300 }, 0, 1, 0, 1.15);
    // shade the gap between exact and computed
    let gap = curve(fr, p.u, 0, 1, 160);
    for (let i = n; i >= 0; i--) gap += 'L' + fr.X(nodes[i]).toFixed(1) + ' ' + fr.Y(U[i]).toFixed(1);
    el('path', { d: gap + 'Z', fill: C.tintHi }, svg);
    axis(svg, fr);
    el('path', { d: curve(fr, p.u, 0, 1, 160), fill: 'none', stroke: C.soft, 'stroke-width': 1.6, 'stroke-dasharray': '6 5' }, svg);
    el('path', { d: poly(fr, nodes.map((x, i) => [x, U[i]])), fill: 'none', stroke: C.main, 'stroke-width': 2.6, 'stroke-linejoin': 'round' }, svg);
    if (n <= 16) nodes.forEach((x, i) => el('circle', { cx: fr.X(x), cy: fr.Y(U[i]), r: 4.5, fill: C.main, stroke: '#fff', 'stroke-width': 1.5 }, svg));
    text(svg, 700, 30, 'solid: finite elements, dashed: exact, shaded: the error', '', 'end');

    const en = F.nodalError(nodes, U, p.u), em = F.maxError(nodes, U, p.u);
    $('outSolve').innerHTML = `Largest error at a node: <b>${en < 1e-12 ? 'zero, to rounding' : sci(en)}</b>. Largest error between nodes: <b>${sci(em)}</b>.`;

    // the system with boundary rows and columns struck out (small meshes only)
    if (n <= 6) {
      $('capSystem').textContent = 'K U = F with the boundary rows and columns removed, and the solved heights U';
      let html = '<table class="grid"><tr><th></th>' + nodes.map((_, j) => `<th>${j}</th>`).join('') + '<th class="sep"></th><th>U</th><th class="sep"></th><th>F</th></tr>';
      for (let i = 0; i <= n; i++) {
        const edge = i === 0 || i === n;
        html += `<tr><th>${i}</th>`;
        for (let j = 0; j <= n; j++) {
          const gone = edge || j === 0 || j === n, zero = Math.abs(i - j) > 1;
          html += `<td class="${gone ? 'gone' : zero ? 'empty' : ''}">${zero ? '·' : fmt(K[i][j])}</td>`;
        }
        html += `<td class="sep"></td><td class="u">${edge ? '0' : fmt(U[i], 3)}</td><td class="sep"></td><td class="${edge ? 'gone' : 'vec'}">${fmt(L[i], 3)}</td></tr>`;
      }
      $('solSystem').innerHTML = html + '</table>';
    } else {
      $('capSystem').textContent = '';
      $('solSystem').innerHTML = `<p class="cap">The system now has ${n - 1} unknowns. Its matrix still has only three non-zero diagonals, so it is solved in a number of steps proportional to ${n - 1}. Choose 6 elements or fewer to see it written out.</p>`;
    }

    // error when the mesh is refined
    const ns = [2, 4, 8, 16, 32];
    const errs = ns.map((m) => { const g = mesh(m, Q.uneven); return F.maxError(g, F.solve(g, p.f).U, p.u); });
    $('solTable').innerHTML = '<table class="plain"><tr><th>elements</th><th>largest error</th><th>falls by</th></tr>' +
      ns.map((m, k) => `<tr><td>${m}</td><td>${sci(errs[k])}</td><td>${k ? '× ' + fmt(errs[k - 1] / errs[k], 1) : ''}</td></tr>`).join('') + '</table>';
  }

  // =====================================================================
  // Controls and start-up
  // =====================================================================
  const hooks = [];   // app2d.js adds its own redraw here, so Part II follows the chosen heating pattern
  function drawAll() { drawProblem(); drawWeak(); drawHats(); drawElement(); drawAssembly(); drawSolve(); hooks.forEach((fn) => fn()); }
  // Shared with app2d.js
  window.FEMUI = { S, C, $, el, text, fmt, sci, sub, clamp, start, frame, segmented, svgPoint, hooks };

  function wire() {
    const on = (id, type, fn) => $(id).addEventListener(type, fn);
    on('vc', 'input', (e) => { S.v.c = +e.target.value; drawWeak(); });
    on('vw', 'input', (e) => { S.v.w = +e.target.value; drawWeak(); });
    on('vk', 'input', (e) => { S.v.k = +e.target.value; drawWeak(); });
    on('hatN', 'input', (e) => { S.hat.n = +e.target.value; resetHats(false); drawHats(); });
    on('hatMatch', 'click', () => { S.hat.U = S.hat.nodes.map((x, i) => (i === 0 || i === S.hat.n ? 0 : P().u(x))); drawHats(); });
    on('hatEven', 'click', () => { S.hat.nodes = F.uniformMesh(S.hat.n); drawHats(); });
    wireHatDragging();
    on('elA', 'input', (e) => { S.el.a = +e.target.value; drawElement(); });
    on('elH', 'input', (e) => { S.el.h = +e.target.value; drawElement(); });
    const asmSet = (fn) => () => { stopPlay(); fn(); drawAssembly(); };
    on('asmN', 'input', (e) => { stopPlay(); S.asm.n = +e.target.value; S.asm.step = 0; drawAssembly(); });
    on('asmUneven', 'change', (e) => { stopPlay(); S.asm.uneven = e.target.checked; drawAssembly(); });
    on('asmBack', 'click', asmSet(() => { S.asm.step = Math.max(0, S.asm.step - 1); }));
    on('asmNext', 'click', asmSet(() => { S.asm.step = Math.min(S.asm.n, S.asm.step + 1); }));
    on('asmReset', 'click', asmSet(() => { S.asm.step = 0; }));
    on('asmPlay', 'click', () => {
      if (S.asm.timer) { stopPlay(); drawAssembly(); return; }
      if (S.asm.step === S.asm.n) S.asm.step = 0;
      $('asmPlay').textContent = 'Pause';
      const tick = () => {
        S.asm.step++;
        if (S.asm.step >= S.asm.n) stopPlay();
        drawAssembly();
      };
      tick();
      if (S.asm.step < S.asm.n) S.asm.timer = setInterval(tick, 1300);
    });
    on('solN', 'input', (e) => { S.sol.n = +e.target.value; drawSolve(); });
    on('solUneven', 'change', (e) => { S.sol.uneven = e.target.checked; drawSolve(); });

    // highlight the current chapter in the menu
    const links = [...document.querySelectorAll('.toc a')];
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) links.forEach((a) => a.classList.toggle('current', a.getAttribute('href') === '#' + en.target.id));
        });
      }, { rootMargin: '-30% 0px -60% 0px' });
      document.querySelectorAll('.chapter[id]').forEach((s) => io.observe(s));
    }
  }

  resetHats(false);
  wire();
  drawAll();
})();
