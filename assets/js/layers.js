// Home page figure: level sets of an exact convection–diffusion solution.
//   −ε Δu + b·∇u = f  on (0,1)²,  b = (1,1),  u = 0 on the boundary,
//   u(x,y) = X(x) X(y),  X(s) = s − (e^{−(1−s)/ε} − e^{−1/ε}) / (1 − e^{−1/ε}).
// As ε → 0 the level sets crowd into layers along the outflow boundary x = 1, y = 1.
(function () {
  const canvas = document.getElementById('layers');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const slider = document.getElementById('eps');
  const out = document.getElementById('epsOut');
  const toggle = document.getElementById('epsToggle');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const N = 120, LEVELS = 13;
  const EPS_MAX = 0.3, EPS_MIN = 0.008;
  // Grid graded towards 1 so the layers stay resolved.
  const s = Array.from({ length: N + 1 }, (_, i) => 1 - Math.pow(1 - i / N, 2.2));
  const X = new Float64Array(N + 1), u = new Float64Array((N + 1) * (N + 1));
  const low = [92, 66, 44], high = [222, 174, 86];

  const epsOf = (t) => Math.exp(Math.log(EPS_MAX) + (Math.log(EPS_MIN) - Math.log(EPS_MAX)) * t);
  const tOf = (eps) => (Math.log(eps) - Math.log(EPS_MAX)) / (Math.log(EPS_MIN) - Math.log(EPS_MAX));

  let size = 0, pad = 0;
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth;
    canvas.width = canvas.height = Math.round(w * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    pad = 22; size = w - pad - 6;
  }
  const px = (x) => pad + x * size;
  const py = (y) => 6 + (1 - y) * size;

  function draw(eps) {
    const e1 = Math.exp(-1 / eps);
    let max = 0;
    for (let i = 0; i <= N; i++) X[i] = s[i] - (Math.exp(-(1 - s[i]) / eps) - e1) / (1 - e1);
    for (let j = 0; j <= N; j++) for (let i = 0; i <= N; i++) {
      const v = X[i] * X[j]; u[j * (N + 1) + i] = v; if (v > max) max = v;
    }
    const w = canvas.clientWidth;
    ctx.clearRect(0, 0, w, w);

    // frame and axis labels
    ctx.strokeStyle = '#3b2f23'; ctx.lineWidth = 1;
    ctx.strokeRect(px(0) + 0.5, py(1) + 0.5, size - 1, size - 1);
    ctx.fillStyle = '#a2947f'; ctx.font = "italic 13px 'STIX Two Text', serif";
    ctx.textBaseline = 'top'; ctx.textAlign = 'left'; ctx.fillText('0', px(0) - 14, py(0) + 3);
    ctx.textAlign = 'right'; ctx.fillText('x = 1', px(1), py(0) + 4);
    ctx.save(); ctx.translate(px(0) - 18, py(1)); ctx.rotate(-Math.PI / 2); ctx.fillText('y = 1', 0, 0); ctx.restore();

    // marching squares, one pass per level
    ctx.lineWidth = 1.15; ctx.lineCap = 'round';
    for (let k = 1; k <= LEVELS; k++) {
      const c = (k / (LEVELS + 1)) * max, f = k / LEVELS;
      ctx.strokeStyle = `rgb(${low.map((a, m) => Math.round(a + (high[m] - a) * f)).join(',')})`;
      ctx.beginPath();
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
        const a = u[j * (N + 1) + i], b = u[j * (N + 1) + i + 1];
        const d = u[(j + 1) * (N + 1) + i], cc = u[(j + 1) * (N + 1) + i + 1];
        const code = (a > c) | ((b > c) << 1) | ((cc > c) << 2) | ((d > c) << 3);
        if (code === 0 || code === 15) continue;
        const x0 = s[i], x1 = s[i + 1], y0 = s[j], y1 = s[j + 1];
        const B = [x0 + (x1 - x0) * (c - a) / (b - a), y0];        // bottom edge
        const R = [x1, y0 + (y1 - y0) * (c - b) / (cc - b)];       // right edge
        const T = [x0 + (x1 - x0) * (c - d) / (cc - d), y1];       // top edge
        const L = [x0, y0 + (y1 - y0) * (c - a) / (d - a)];        // left edge
        const seg = (p, q) => { ctx.moveTo(px(p[0]), py(p[1])); ctx.lineTo(px(q[0]), py(q[1])); };
        switch (code) {
          case 1: case 14: seg(L, B); break;
          case 2: case 13: seg(B, R); break;
          case 3: case 12: seg(L, R); break;
          case 4: case 11: seg(R, T); break;
          case 6: case 9: seg(B, T); break;
          case 7: case 8: seg(L, T); break;
          case 5: seg(L, T); seg(B, R); break;
          case 10: seg(L, B); seg(R, T); break;
        }
      }
      ctx.stroke();
    }
    out.textContent = 'ε = ' + (eps < 0.1 ? eps.toFixed(3) : eps.toFixed(2));
  }

  let playing = !reduce, phase = 0, last = null;
  function show(t) { slider.value = Math.round(t * 1000); draw(epsOf(t)); }
  function frame(now) {
    if (!playing) { last = null; return; }
    if (last !== null) phase += (now - last) / 16000;
    last = now;
    show(0.5 - 0.5 * Math.cos(2 * Math.PI * phase));
    requestAnimationFrame(frame);
  }
  function setPlaying(on) {
    playing = on; toggle.textContent = on ? 'Pause' : 'Play';
    if (on) { phase = Math.acos(1 - 2 * slider.value / 1000) / (2 * Math.PI); requestAnimationFrame(frame); }
  }
  slider.addEventListener('input', () => { if (playing) setPlaying(false); draw(epsOf(slider.value / 1000)); });
  toggle.addEventListener('click', () => setPlaying(!playing));
  window.addEventListener('resize', () => { resize(); draw(epsOf(slider.value / 1000)); });

  resize();
  toggle.textContent = playing ? 'Pause' : 'Play';
  if (playing) requestAnimationFrame(frame); else show(tOf(0.04));
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (!playing) draw(epsOf(slider.value / 1000)); });
})();
