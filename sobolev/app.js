// =====================================================================
// app.js — draws the live figures of "Why Sobolev spaces?".
//   Words:        index.html
//   Mathematics:  sob.js   (window.SOB)
//   This file:    one draw...() function per chapter, plus the controls.
// Colours used inside figures are in C just below.
// =====================================================================
(function () {
  'use strict';
  const M = window.SOB;
  const C = {
    main: '#2b4a63',   // slate: the main curve
    hi: '#6b1d2a',     // deep wine: the highlighted thing
    third: '#a8742a',  // ochre: third series
    soft: '#8b867c',   // dashed reference curves
    tintHi: 'rgba(107,29,42,0.10)', tintMain: 'rgba(43,74,99,0.10)', tintThird: 'rgba(168,116,42,0.14)',
  };

  // ---- What the reader has chosen (the state of every figure) ----------
  const S = {
    jump: { kind: 'jump', logEps: -0.7 },          // chapter 1
    mat: { logK: 0.7, n: 4 },                       // chapter 2
    ritz: { kind: 'step', N: 3 },                   // chapter 3
    point: { level: 3 },                            // chapter 4: n = 2^level
    rate: { alpha: 0.75, mesh: 'uniform', level: 3 }, // chapter 5: n = 2^level
  };

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
  const pow10 = (e) => '10' + String(e).split('').map((c) => SUP[c]).join('');
  function sci(x) {
    if (x < 1e-13) return '0';
    if (x >= 0.001) return x.toPrecision(2);
    const e = Math.floor(Math.log10(x));
    return (x / Math.pow(10, e)).toFixed(1) + ' × ' + pow10(e);
  }
  const big = (x) => (x < 1e6 ? String(Math.round(x)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : pow10(Math.round(Math.log10(x))));

  // A plotting area inside an SVG: maps (x, y) in problem units to pixels.
  function start(svg, W, H) { svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.textContent = ''; }
  function frame(box, x0, x1, y0, y1) {
    return {
      box,
      X: (x) => box.l + ((x - x0) / (x1 - x0)) * (box.r - box.l),
      Y: (y) => box.b - ((y - y0) / (y1 - y0)) * (box.b - box.t),
    };
  }
  function curve(fr, fn, a, b, n) {
    n = n || 160;
    let d = '';
    for (let i = 0; i <= n; i++) {
      const x = a + ((b - a) * i) / n;
      d += (i ? 'L' : 'M') + fr.X(x).toFixed(1) + ' ' + fr.Y(fn(x)).toFixed(1);
    }
    return d;
  }
  const poly = (fr, pts) => pts.map((p, i) => (i ? 'L' : 'M') + fr.X(p[0]).toFixed(1) + ' ' + fr.Y(p[1]).toFixed(1)).join('');
  const line = (svg, fr, x1, y1, x2, y2, attrs) => el('line', Object.assign({ x1: fr.X(x1), y1: fr.Y(y1), x2: fr.X(x2), y2: fr.Y(y2) }, attrs), svg);
  const path = (svg, d, stroke, width, extra) => el('path', Object.assign({ d, fill: 'none', stroke, 'stroke-width': width || 2, 'stroke-linejoin': 'round' }, extra || {}), svg);
  const DASH = { 'stroke-dasharray': '5 4' };
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
  // A small legend entry: a short stroke followed by a label. Returns the x after it.
  function key(svg, x, y, colour, label, dashed) {
    el('line', Object.assign({ x1: x, x2: x + 22, y1: y - 4, y2: y - 4, stroke: colour, 'stroke-width': 2.5 }, dashed ? DASH : {}), svg);
    const t = text(svg, x + 28, y, label, '', 'start');
    return x + 28 + t.getComputedTextLength() + 20;
  }

  // =====================================================================
  // CHAPTER 1 — a jump costs infinite energy, a corner does not
  // =====================================================================
  function drawJump() {
    const s = S.jump, eps = Math.pow(10, s.logEps), svg = $('figJump');
    const shape = s.kind === 'jump' ? M.ramp(eps) : M.tent(eps);
    segmented($('jumpSeg'), [['jump', 'A jump'], ['corner', 'A corner']], s.kind, (k) => { s.kind = k; drawJump(); });
    $('jumpEpsOut').textContent = eps >= 0.01 ? eps.toFixed(2) : eps.toFixed(3);
    start(svg, 720, 430);

    // the function
    const top = frame({ l: 60, r: 700, t: 30, b: 150 }, 0, 1, 0, 1.12);
    text(svg, 60, 18, 'the function u', 'it strong', 'start');
    line(svg, top, 0, 0, 1, 0, { class: 'axis' });
    el('rect', { x: top.X(0.5 - eps / 2), y: top.Y(1.12), width: top.X(eps) - top.X(0), height: top.Y(0) - top.Y(1.12), fill: C.tintHi }, svg);
    path(svg, curve(top, shape.u, 0, 1, 640), C.main, 2.5);
    text(svg, top.X(0), top.Y(0) + 18, 'x = 0', '', 'start');
    text(svg, top.X(1), top.Y(0) + 18, 'x = 1', '', 'end');
    text(svg, top.X(0.5), top.Y(0) + 18, 'width ε', 'hi');

    // its slope
    const jump = s.kind === 'jump', ymax = jump ? 12 : 2.6, ymin = jump ? 0 : -2.6;
    const bl = frame({ l: 60, r: 330, t: 222, b: 390 }, 0, 1, ymin, ymax);
    text(svg, 60, 208, 'its slope u′', 'it strong', 'start');
    line(svg, bl, 0, 0, 1, 0, { class: 'axis' });
    const clipped = (x) => Math.min(shape.du(x), ymax);
    path(svg, curve(bl, clipped, 0, 1, 540), C.hi, 2);
    if (jump) {
      text(svg, bl.X(0.5) + 12, bl.Y(Math.min(1 / eps, ymax)) + (1 / eps > ymax ? 14 : -6), `height 1/ε = ${fmt(1 / eps, 1 / eps < 10 ? 1 : 0)}`, 'hi', 'start');
      if (1 / eps > ymax) text(svg, bl.X(0.5), bl.Y(ymax) - 5, '↑', 'hi');
    } else {
      text(svg, bl.X(0.02), bl.Y(2) - 7, '2', '', 'start');
      text(svg, bl.X(0.98), bl.Y(-2) + 17, '−2', '', 'end');
    }

    // energy against width, on logarithmic axes
    const lx = (e) => Math.log10(e), br = frame({ l: 440, r: 700, t: 222, b: 390 }, -3, lx(0.5), 0, 3);
    text(svg, 440, 208, 'energy against width ε', 'it strong', 'start');
    [0, 1, 2, 3].forEach((p) => {
      line(svg, br, -3, p, lx(0.5), p, { stroke: '#ebe5da' });
      text(svg, br.X(-3) - 8, br.Y(p) + 4, p === 0 ? '1' : pow10(p), '', 'end');
    });
    [-3, -2, -1].forEach((p) => text(svg, br.X(p), br.Y(0) + 18, p === -1 ? '0.1' : p === -2 ? '0.01' : '0.001'));
    line(svg, br, -3, 0, lx(0.5), 0, { class: 'axis' });
    const jumpE = (le) => -le, cornerE = (le) => Math.log10(4 - (8 * Math.pow(10, le)) / 3);
    path(svg, curve(br, jumpE, -3, lx(0.5), 40), C.hi, jump ? 2.5 : 1.5, jump ? {} : DASH);
    path(svg, curve(br, cornerE, -3, lx(0.5), 60), C.main, jump ? 1.5 : 2.5, jump ? DASH : {});
    text(svg, br.X(-2.2), br.Y(2.2) - 8, 'jump: 1/ε', 'hi', 'start');
    text(svg, br.X(-2.9), br.Y(0.6) - 9, 'corner: below 4', '', 'start');
    el('circle', { cx: br.X(s.logEps), cy: br.Y(Math.log10(shape.energy)), r: 5.5, fill: jump ? C.hi : C.main }, svg);

    $('outJump').innerHTML = jump
      ? `Width <b>ε = ${$('jumpEpsOut').textContent}</b>, energy <b>${fmt(shape.energy, shape.energy < 100 ? 1 : 0)}</b>. Each time the width halves, the energy doubles. A true jump, with ε = 0, would cost infinitely much.`
      : `Width <b>ε = ${$('jumpEpsOut').textContent}</b>, energy <b>${fmt(shape.energy, 2)}</b>. However sharp you make the corner, the energy stays below <b>4</b>.`;
  }

  // =====================================================================
  // CHAPTER 2 — a rod of two materials: no second derivative, still a solution
  // =====================================================================
  function drawMaterials() {
    const s = S.mat, kappa = Math.pow(10, s.logK), p = M.twoMaterial(kappa), fe = M.twoMaterialFE(kappa, s.n), svg = $('figMat');
    $('matKOut').textContent = kappa >= 1 ? fmt(kappa, 1) : fmt(kappa, 2);
    $('matNOut').textContent = s.n;
    start(svg, 720, 478);

    let peak = 0, peakAt = 0;
    for (let i = 0; i <= 200; i++) { const v = p.u(i / 200); if (v > peak) { peak = v; peakAt = i / 200; } }
    const ytop = peak * 1.45;
    const top = frame({ l: 60, r: 700, t: 52, b: 212 }, 0, 1, 0, ytop);
    el('rect', { x: top.X(0), y: top.Y(ytop), width: top.X(0.5) - top.X(0), height: top.Y(0) - top.Y(ytop), fill: C.tintMain }, svg);
    el('rect', { x: top.X(0.5), y: top.Y(ytop), width: top.X(0.5) - top.X(0), height: top.Y(0) - top.Y(ytop), fill: C.tintThird }, svg);
    text(svg, 60, 18, 'temperature u', 'it strong', 'start');
    text(svg, top.X(0.02), top.Y(ytop) + 18, 'conductivity k = 1', '', 'start');
    text(svg, top.X(0.98), top.Y(ytop) + 18, `k = ${$('matKOut').textContent}`, '', 'end');
    text(svg, top.X(peakAt), top.Y(peak) - 9, `highest temperature ${fmt(peak, 3)}`, 'strong');
    line(svg, top, 0, 0, 1, 0, { class: 'axis' });
    path(svg, curve(top, p.u, 0, 0.5, 60) + curve(top, p.u, 0.5, 1, 60).replace('M', 'L'), C.main, 2.5);
    path(svg, poly(top, fe.nodes.map((x, i) => [x, fe.U[i]])), C.hi, 1.8);
    fe.nodes.forEach((x, i) => el('circle', { cx: top.X(x), cy: top.Y(fe.U[i]), r: 3.6, fill: C.hi }, svg));
    let kx = key(svg, 60, 40, C.main, 'exact');
    key(svg, kx, 40, C.hi, 'finite elements');

    // slope and flux
    const lim = Math.max(Math.abs(p.c), Math.abs(p.c - 0.5), Math.abs((p.c - 0.5) / kappa), Math.abs((p.c - 1) / kappa), 0.5) * 1.15;
    const bot = frame({ l: 60, r: 700, t: 296, b: 456 }, 0, 1, -lim, lim);
    text(svg, 60, 262, 'slope and heat flux', 'it strong', 'start');
    kx = key(svg, 60, 284, C.hi, 'slope u′ (jumps)');
    key(svg, kx, 284, C.third, 'flux k u′ (does not)');
    line(svg, bot, 0, 0, 1, 0, { class: 'axis' });
    line(svg, bot, 0.5, -lim, 0.5, lim, { stroke: '#b9b1a2', 'stroke-dasharray': '2 4' });
    path(svg, curve(bot, p.flux, 0, 1, 2), C.third, 2);
    path(svg, curve(bot, p.du, 0, 0.4999, 2), C.hi, 2.5);
    path(svg, curve(bot, p.du, 0.5001, 1, 2), C.hi, 2.5);
    [p.slopeLeft, p.slopeRight].forEach((v) => el('circle', { cx: bot.X(0.5), cy: bot.Y(v), r: 4, fill: '#fff', stroke: C.hi, 'stroke-width': 2 }, svg));
    text(svg, bot.X(0), bot.Y(-lim) + 16, 'x = 0', '', 'start');
    text(svg, bot.X(1), bot.Y(-lim) + 16, 'x = 1', '', 'end');
    text(svg, bot.X(0.5), bot.Y(-lim) + 16, 'interface x = ½');

    const err = Math.max(...fe.nodes.map((x, i) => Math.abs(fe.U[i] - p.u(x))));
    const same = Math.abs(s.logK) < 1e-9;
    const cut = s.n % 2 === 1;
    $('outMat').innerHTML = (same
      ? 'One material: the slope has no jump and <span class="math">u = x(1 − x)/2</span> is smooth. '
      : `At the interface the slope jumps from <b>${fmt(p.slopeLeft, 3)}</b> to <b>${fmt(p.slopeRight, 3)}</b>, so <span class="math">u″</span> does not exist there. The flux passes through unbroken. `)
      + (cut && !same
        ? `With ${s.n} elements the interface cuts through an element, and the largest error at the nodes is <b class="warn">${sci(err)}</b>.`
        : `With ${s.n} elements${same ? '' : ' the interface is a node, and'} the largest error at the nodes is <b>${sci(err)}</b>.`);
  }

  // =====================================================================
  // CHAPTER 3 — smooth functions whose energy keeps dropping
  // =====================================================================
  function drawRitz() {
    const s = S.ritz, d = M.ritzData[s.kind], r = M.ritz(s.kind, s.N), svg = $('figRitz'), step = s.kind === 'step';
    segmented($('ritzSeg'), Object.entries(M.ritzData).map(([k, q]) => [k, q.label]), s.kind, (k) => { s.kind = k; drawRitz(); });
    $('ritzNOut').textContent = s.N;
    start(svg, 720, 456);

    const top = frame({ l: 60, r: 700, t: 52, b: 192 }, 0, 1, 0, 0.68);
    text(svg, 60, 18, 'temperature', 'it strong', 'start');
    let kx = key(svg, 60, 40, C.soft, 'the limit u', true);
    key(svg, kx, 40, C.main, `smooth candidate with ${s.N} wave${s.N > 1 ? 's' : ''}`);
    line(svg, top, 0, 0, 1, 0, { class: 'axis' });
    path(svg, curve(top, d.u, 0, 0.5, 40) + curve(top, d.u, 0.5, 1, 40).replace('M', 'L'), C.soft, 2, DASH);
    path(svg, curve(top, r.u, 0, 1, 300), C.main, 2.5);

    const bot = step ? frame({ l: 60, r: 700, t: 264, b: 424 }, 0, 1, -3, 12) : frame({ l: 60, r: 700, t: 264, b: 424 }, 0, 1, -1.7, 1.7);
    text(svg, 60, 252, step ? 'bending −u″, which should equal the heating f' : 'slope u′', 'it strong', 'start');
    line(svg, bot, 0, 0, 1, 0, { class: 'axis' });
    line(svg, bot, 0.5, step ? -3 : -1.7, 0.5, step ? 12 : 1.7, { stroke: '#b9b1a2', 'stroke-dasharray': '2 4' });
    const target = step ? (x) => -d.ddu(x) : d.du, cand = step ? (x) => -r.ddu(x) : r.du;
    path(svg, curve(bot, target, 0, 0.4999, 2), C.soft, 2, DASH);
    path(svg, curve(bot, target, 0.5001, 1, 2), C.soft, 2, DASH);
    path(svg, curve(bot, cand, 0, 1, 600), C.hi, 2);
    text(svg, bot.X(0), bot.Y(0) + 18, 'x = 0', '', 'start');
    text(svg, bot.X(1), bot.Y(0) + 18, 'x = 1', '', 'end');
    if (step) { text(svg, bot.X(0.75), bot.Y(8) - 8, 'f = 8'); text(svg, bot.X(0.25), bot.Y(0) - 8, 'f = 0'); }

    $('outRitz').innerHTML = `Energy of the candidate <b>${fmt(r.J, 5)}</b>. Lowest possible energy <b>${fmt(d.J, 5)}</b>. Still to go: <b>${sci(r.gap)}</b>. `
      + (step
        ? 'Every candidate is infinitely smooth, yet the limit has a second derivative that jumps.'
        : 'Every candidate is infinitely smooth, yet the limit has a corner.');
  }

  // =====================================================================
  // CHAPTER 4 — a point load, in one and in two dimensions
  // =====================================================================
  const LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const peaks1 = LEVELS.map((l) => M.point1D(1 << l).peak), peaks2 = LEVELS.map((l) => M.point2D(1 << l).peak);
  function drawPoint() {
    const s = S.point, n = 1 << s.level, a = M.point1D(n), b = M.point2D(n), svg = $('figPoint');
    $('pointNOut').textContent = `1/${n}`;
    start(svg, 720, 502);
    const ymax = 1.55;

    const left = frame({ l: 50, r: 340, t: 34, b: 200 }, -1, 1, 0, ymax);
    text(svg, 50, 18, 'a rod: one dimension', 'it strong', 'start');
    line(svg, left, -1, 0, 1, 0, { class: 'axis' });
    path(svg, poly(left, [[-1, 0], [0, 0.5], [1, 0]]), C.soft, 2, DASH);
    path(svg, poly(left, a.nodes.map((x, i) => [x, a.U[i]])), C.main, 2.2);
    el('circle', { cx: left.X(0), cy: left.Y(a.peak), r: 4.5, fill: C.main }, svg);
    text(svg, left.X(0) + 10, left.Y(a.peak) - 6, `peak ${fmt(a.peak, 3)}`, 'strong', 'start');

    const right = frame({ l: 410, r: 700, t: 34, b: 200 }, -1, 1, 0, ymax);
    text(svg, 410, 18, 'a disc: two dimensions', 'it strong', 'start');
    line(svg, right, -1, 0, 1, 0, { class: 'axis' });
    const exact = (x) => Math.min(ymax, -Math.log(Math.max(Math.abs(x), 1e-9)) / (2 * Math.PI));
    path(svg, curve(right, exact, -1, -0.00005, 400), C.soft, 2, DASH);
    path(svg, curve(right, exact, 0.00005, 1, 400), C.soft, 2, DASH);
    const pts = b.nodes.map((x, i) => [x, b.U[i]]);
    path(svg, poly(right, pts.slice().reverse().map((q) => [-q[0], q[1]]).concat(pts.slice(1))), C.hi, 2.2);
    el('circle', { cx: right.X(0), cy: right.Y(b.peak), r: 4.5, fill: C.hi }, svg);
    text(svg, right.X(0) + 10, right.Y(b.peak) - 6, `peak ${fmt(b.peak, 3)}`, 'hi', 'start');
    [left, right].forEach((fr) => { text(svg, fr.X(-1), fr.Y(0) + 18, '−1', '', 'start'); text(svg, fr.X(1), fr.Y(0) + 18, '1', '', 'end'); text(svg, fr.X(0), fr.Y(0) + 18, 'load'); });

    // peak against mesh size
    const bot = frame({ l: 60, r: 700, t: 294, b: 462 }, 0.5, 10.5, 0, ymax);
    text(svg, 60, 258, 'height at the load as the mesh is refined', 'it strong', 'start');
    let kx = key(svg, 60, 280, C.main, 'one dimension');
    key(svg, kx, 280, C.hi, 'two dimensions');
    [0.5, 1, 1.5].forEach((v) => { line(svg, bot, 0.5, v, 10.5, v, { stroke: '#ebe5da' }); text(svg, bot.X(0.5) - 8, bot.Y(v) + 4, fmt(v, 1), '', 'end'); });
    line(svg, bot, 0.5, 0, 10.5, 0, { class: 'axis' });
    path(svg, poly(bot, LEVELS.map((l, i) => [l, peaks1[i]])), C.main, 1.5);
    path(svg, poly(bot, LEVELS.map((l, i) => [l, peaks2[i]])), C.hi, 1.5);
    LEVELS.forEach((l, i) => {
      const on = l === s.level;
      el('circle', { cx: bot.X(l), cy: bot.Y(peaks1[i]), r: on ? 6 : 3.2, fill: C.main }, svg);
      el('circle', { cx: bot.X(l), cy: bot.Y(peaks2[i]), r: on ? 6 : 3.2, fill: C.hi }, svg);
      if (l % 2 === 0 || l === 1) text(svg, bot.X(l), bot.Y(0) + 18, `1/${1 << l}`);
    });
    text(svg, bot.X(10.5), bot.Y(0) + 36, 'mesh size h', '', 'end');

    $('outPoint').innerHTML = `Mesh size <b>h = 1/${n}</b>. On the rod the height at the load is <b>${fmt(a.peak, 3)}</b> on every mesh, and so is the energy. On the disc the height is <b>${fmt(b.peak, 3)}</b> and still climbing: each halving of <span class="math">h</span> adds <b>${fmt(Math.log(2) / (2 * Math.PI), 3)}</b>, without end.`;
  }

  // =====================================================================
  // CHAPTER 5 — smoothness sets the speed of convergence
  // =====================================================================
  const NS5 = [4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048];
  function drawRate() {
    const s = S.rate, n = 1 << s.level, graded = s.mesh === 'graded', mu = M.grading(s.alpha), svg = $('figRate');
    const f = M.singular(s.alpha), nodes = M.mesh(n, graded ? mu : 1);
    segmented($('rateSeg'), [['uniform', 'Equal elements'], ['graded', 'Elements crowded towards x = 0']], s.mesh, (k) => { s.mesh = k; drawRate(); });
    $('rateAOut').textContent = fmt(s.alpha, 2);
    $('rateNOut').textContent = n;
    start(svg, 720, 518);

    const umax = Math.max(...Array.from({ length: 101 }, (_, i) => f.u(i / 100))) * 1.18;
    const top = frame({ l: 60, r: 700, t: 52, b: 202 }, 0, 1, 0, umax);
    const lab = text(svg, 60, 18, 'u = x', 'it strong', 'start');
    el('tspan', { dy: -6, 'font-size': 10 }, lab).textContent = fmt(s.alpha, 2);
    el('tspan', { dy: 6 }, lab).textContent = ' (1 − x)';
    let kx = key(svg, 60, 40, C.main, 'exact');
    key(svg, kx, 40, C.hi, `finite elements, ${n} elements`);
    line(svg, top, 0, 0, 1, 0, { class: 'axis' });
    // sample densely near 0, where the curve is steep
    let d = '';
    for (let i = 0; i <= 300; i++) { const x = Math.pow(i / 300, 3); d += (i ? 'L' : 'M') + top.X(x).toFixed(1) + ' ' + top.Y(f.u(x)).toFixed(1); }
    path(svg, d, C.main, 2.5);
    path(svg, poly(top, nodes.map((x) => [x, f.u(x)])), C.hi, 1.6);
    nodes.forEach((x) => el('line', { x1: top.X(x), x2: top.X(x), y1: top.Y(0) - 5, y2: top.Y(0) + 5, stroke: C.hi, 'stroke-width': 1 }, svg));
    text(svg, top.X(0), top.Y(0) + 20, 'x = 0', '', 'start');
    text(svg, top.X(1), top.Y(0) + 20, 'x = 1', '', 'end');

    // error against number of elements, logarithmic axes
    const eu = NS5.map((m) => M.energyError(s.alpha, M.mesh(m, 1))), eg = NS5.map((m) => M.energyError(s.alpha, M.mesh(m, mu)));
    const lg = Math.log10, bot = frame({ l: 60, r: 700, t: 296, b: 476 }, lg(4) - 0.1, lg(2048) + 0.1, -3.2, 0.1);
    text(svg, 60, 262, 'error in the energy norm, relative', 'it strong', 'start');
    kx = key(svg, 60, 284, C.main, 'equal elements');
    key(svg, kx, 284, C.hi, 'crowded towards 0');
    [0, -1, -2, -3].forEach((p) => {
      line(svg, bot, lg(4) - 0.1, p, lg(2048) + 0.1, p, { stroke: '#ebe5da' });
      text(svg, bot.X(lg(4) - 0.1) - 8, bot.Y(p) + 4, p === 0 ? '100%' : p === -1 ? '10%' : p === -2 ? '1%' : '0.1%', '', 'end');
    });
    NS5.forEach((m, i) => { if (i % 2 === 0 || m === 2048) text(svg, bot.X(lg(m)), bot.Y(-3.2) + 18, String(m)); });
    text(svg, bot.X(lg(2048) + 0.1), bot.Y(-3.2) + 36, 'number of elements', '', 'end');
    const series = (errs, colour, on) => {
      path(svg, poly(bot, NS5.map((m, i) => [lg(m), lg(errs[i])])), colour, on ? 2.5 : 1.3, on ? {} : DASH);
      NS5.forEach((m, i) => el('circle', { cx: bot.X(lg(m)), cy: bot.Y(lg(errs[i])), r: m === n && on ? 6 : on ? 3.4 : 2.2, fill: colour }, svg));
    };
    series(eu, C.main, !graded);
    series(eg, C.hi, graded);

    const ru = M.rate(NS5, eu), rg = M.rate(NS5, eg);
    const need = (errs, r) => 2048 * Math.pow(errs[9] / 0.01, 1 / r);
    const say = (x) => 'about ' + big(x < 1e6 ? +x.toPrecision(2) : x);
    $('outRate').innerHTML = `Equal elements: the error falls like <b>h<sup>${fmt(ru, 2)}</sup></b>, and theory predicts the power <b>α − ½ = ${fmt(s.alpha - 0.5, 2)}</b>. Crowded elements: <b>h<sup>${fmt(rg, 2)}</sup></b>. `
      + `To reach an error of 1% you would need ${say(need(eu, ru))} equal elements, or ${say(need(eg, rg))} crowded ones.`;
  }

  // =====================================================================
  function wire() {
    const on = (id, type, fn) => $(id).addEventListener(type, fn);
    const set = (id, v) => { $(id).value = v; };
    set('jumpEps', S.jump.logEps); set('matK', S.mat.logK); set('matN', S.mat.n); set('ritzN', S.ritz.N);
    set('pointN', S.point.level); set('rateA', S.rate.alpha); set('rateN', S.rate.level);
    on('jumpEps', 'input', (e) => { S.jump.logEps = +e.target.value; drawJump(); });
    on('matK', 'input', (e) => { S.mat.logK = +e.target.value; drawMaterials(); });
    on('matN', 'input', (e) => { S.mat.n = +e.target.value; drawMaterials(); });
    on('ritzN', 'input', (e) => { S.ritz.N = +e.target.value; drawRitz(); });
    on('pointN', 'input', (e) => { S.point.level = +e.target.value; drawPoint(); });
    on('rateA', 'input', (e) => { S.rate.alpha = +e.target.value; drawRate(); });
    on('rateN', 'input', (e) => { S.rate.level = +e.target.value; drawRate(); });

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

  wire();
  drawJump(); drawMaterials(); drawRitz(); drawPoint(); drawRate();
})();
