(function () {
  var cv = document.getElementById('scene');
  var main = cv.getContext('2d');
  var ctx = main;
  var body = document.body;
  var topEl = document.getElementById('top'), botEl = document.getElementById('bottom'), regrow = document.getElementById('regrow');
  var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var TAU = Math.PI * 2, D = Math.PI / 180;
  var B = { x: 500, y: 1010 };
  var BOX = { x: 45, y: 128, w: 910, h: 1142 };
  var T_TEXT = 6900, T_END = 7800;
  var W = 0, H = 0, dpr = 1, S = 1, OX = 0, OY = 0;
  var start = 0, lastT = 0, shown = false, cache = null;
  var parts = [], kick = 0, petalClock = 0, sparkClock = 0, heartClock = 0, bowPopped = false, finalPopped = false;

  function rng(seed) {
    return function () {
      seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  var rand = rng(20261111);
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function prog(t, s, d) { return clamp((t - s) / d, 0, 1); }
  function eOut(p) { return 1 - Math.pow(1 - p, 3); }
  function eInOut(p) { return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; }
  function eBack(p) { var c = 1.70158; return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2); }
  function eElastic(p) { return p <= 0 ? 0 : p >= 1 ? 1 : Math.pow(2, -10 * p) * Math.sin((p * 10 - 0.75) * (TAU / 3)) + 1; }
  function hex(c) { var n = parseInt(c.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function mix(a, b, t) {
    var x = hex(a), y = hex(b);
    return 'rgb(' + Math.round(x[0] + (y[0] - x[0]) * t) + ',' + Math.round(x[1] + (y[1] - x[1]) * t) + ',' + Math.round(x[2] + (y[2] - x[2]) * t) + ')';
  }
  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }

  var PAL = {
    red: ['#7E0C27', '#B81A3B', '#E43F62', '#FF8DA4'],
    rose: ['#A82450', '#D94B74', '#F27A98', '#FFC3D1'],
    blush: ['#C35C7E', '#EB8FAA', '#FFB9CA', '#FFE9F0']
  };
  var ROSES = [
    { x: 372, y: 395, r: 78, c: 'blush' },
    { x: 516, y: 346, r: 86, c: 'red' },
    { x: 657, y: 404, r: 78, c: 'rose' },
    { x: 288, y: 518, r: 80, c: 'rose' },
    { x: 444, y: 490, r: 92, c: 'red' },
    { x: 606, y: 502, r: 90, c: 'red' },
    { x: 736, y: 538, r: 76, c: 'blush' },
    { x: 376, y: 628, r: 84, c: 'red' },
    { x: 564, y: 636, r: 86, c: 'rose' }
  ];
  var RINGS = [
    { n: 5, len: 1.0, w: 1.12, off: 0 },
    { n: 5, len: 0.84, w: 1.06, off: 36 },
    { n: 5, len: 0.66, w: 1.0, off: 14 },
    { n: 4, len: 0.48, w: 0.98, off: 58 },
    { n: 3, len: 0.32, w: 0.95, off: 22 }
  ];
  var order = ROSES.map(function (R, i) { return i; }).sort(function (a, b) { return ROSES[b].y - ROSES[a].y; });
  ROSES.forEach(function (R, i) {
    R.pal = PAL[R.c];
    R.rot = rand() * TAU;
    R.tilt = 0.84 + rand() * 0.12;
    R.cx = B.x + (R.x - B.x) * 0.2;
    R.cy = (B.y + R.y) / 2 + 36;
    var o = order.indexOf(i);
    R.s0 = 250 + o * 130;
    R.sd = 900 + Math.hypot(R.x - B.x, R.y - B.y) * 1.1;
    R.s1 = R.s0 + R.sd;
    R.b0 = R.s1 + 120 + rand() * 380;
    R.bd = 1900;
    R.cols = RINGS.map(function (ring, k) {
      var f = k / (RINGS.length - 1);
      return {
        base: mix(R.pal[1], R.pal[0], 0.35 + 0.5 * f),
        mid: mix(R.pal[2], R.pal[1], 0.15 + 0.55 * f),
        tip: mix(R.pal[3], R.pal[2], 0.1 + 0.6 * f),
        edge: mix(R.pal[0], R.pal[1], 0.3)
      };
    });
  });
  var BY_Y = ROSES.slice().sort(function (a, b) { return a.y - b.y; });

  var LEAVES = [];
  ROSES.forEach(function (R) {
    var dx = R.x - 512, dy = R.y - 500;
    var base = Math.atan2(dy, dx);
    var count = Math.hypot(dx, dy) > 120 ? 2 : 1;
    for (var k = 0; k < count; k++) {
      var a = base + (k === 0 ? -0.55 : 0.6) + (rand() - 0.5) * 0.35;
      LEAVES.push({ x: R.x + Math.cos(a) * R.r * 0.5, y: R.y + Math.sin(a) * R.r * 0.5, ang: a + Math.PI / 2, len: 80 + rand() * 34, w: 42 + rand() * 12, t0: R.s1 - 250 + k * 140, flip: k ? -1 : 1 });
    }
  });
  [[206, 652, -2.55, 1900], [806, 668, -0.55, 2050], [262, 744, -2.85, 2200], [752, 752, -0.28, 2350], [158, 470, -2.3, 2500], [850, 470, -0.85, 2650]].forEach(function (L) {
    LEAVES.push({ x: L[0], y: L[1], ang: L[2] + Math.PI / 2, len: 100 + rand() * 24, w: 48 + rand() * 8, t0: L[3], flip: L[2] < -1.57 ? 1 : -1 });
  });

  var SPRIGS = [];
  function grow(sp, x, y, a, len, depth, t0) {
    var x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len;
    sp.branches.push({ x1: x, y1: y, x2: x2, y2: y2, t0: t0, d: 280, wd: 2.8 - depth * 0.6 });
    if (depth >= 2) {
      var n = 3 + Math.floor(rand() * 4);
      for (var k = 0; k < n; k++) {
        sp.flowers.push({ x: x2 + (rand() - 0.5) * 30, y: y2 + (rand() - 0.5) * 26, r: 4.2 + rand() * 3, t0: t0 + 220 + rand() * 480, pink: rand() < 0.22 });
      }
      return;
    }
    var kids = 2 + (rand() < 0.5 ? 1 : 0);
    for (var j = 0; j < kids; j++) {
      var na = a + (j - (kids - 1) / 2) * (0.55 + rand() * 0.3) + (rand() - 0.5) * 0.25;
      grow(sp, x2, y2, na, len * (0.62 + rand() * 0.2), depth + 1, t0 + 260);
    }
    var extra = 1 + Math.floor(rand() * 3);
    for (j = 0; j < extra; j++) {
      sp.flowers.push({ x: x2 + (rand() - 0.5) * 22, y: y2 + (rand() - 0.5) * 20, r: 3.6 + rand() * 2.4, t0: t0 + 320 + rand() * 420, pink: false });
    }
  }
  [[262, 372], [338, 288], [452, 244], [586, 250], [702, 296], [792, 418], [206, 560], [818, 636], [282, 700], [730, 712], [520, 266], [192, 452], [828, 520]].forEach(function (T, i) {
    var a = Math.atan2(T[1] - 540, T[0] - 510);
    var sp = { x: T[0], y: T[1], cx: B.x + (T[0] - B.x) * 0.22, cy: (B.y + T[1]) / 2 + 30, t0: 1450 + i * 120 + rand() * 180, branches: [], flowers: [] };
    grow(sp, T[0], T[1], a, 36 + rand() * 14, 0, sp.t0 + 820);
    SPRIGS.push(sp);
  });

  function makePattern(c2d) {
    var c = document.createElement('canvas');
    c.width = 64;
    c.height = 64;
    var g = c.getContext('2d');
    function h(x, y, s) {
      g.beginPath();
      g.moveTo(x, y + s * 0.35);
      g.bezierCurveTo(x - s * 0.9, y - s * 0.25, x - s * 0.45, y - s * 0.95, x, y - s * 0.4);
      g.bezierCurveTo(x + s * 0.45, y - s * 0.95, x + s * 0.9, y - s * 0.25, x, y + s * 0.35);
      g.fill();
    }
    g.fillStyle = 'rgba(242, 116, 140, 0.3)';
    h(16, 18, 10);
    h(48, 50, 8);
    g.fillStyle = 'rgba(240, 196, 106, 0.45)';
    g.beginPath(); g.arc(48, 16, 2.4, 0, TAU); g.fill();
    g.beginPath(); g.arc(14, 48, 2, 0, TAU); g.fill();
    return c2d.createPattern(c, 'repeat');
  }
  function pat() {
    if (!ctx.heartPattern) ctx.heartPattern = makePattern(ctx);
    return ctx.heartPattern;
  }
  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
  function heartPath(x, y, s) {
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.35);
    ctx.bezierCurveTo(x - s * 0.9, y - s * 0.25, x - s * 0.45, y - s * 0.95, x, y - s * 0.4);
    ctx.bezierCurveTo(x + s * 0.45, y - s * 0.95, x + s * 0.9, y - s * 0.25, x, y + s * 0.35);
    ctx.closePath();
  }
  function quadAt(x0, y0, cx, cy, x1, y1, u) {
    var v = 1 - u;
    return [v * v * x0 + 2 * v * u * cx + u * u * x1, v * v * y0 + 2 * v * u * cy + u * u * y1];
  }
  function partial(x0, y0, cx, cy, x1, y1, p, steps) {
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    var n = Math.max(2, Math.ceil(steps * p));
    for (var k = 1; k <= n; k++) {
      var q = quadAt(x0, y0, cx, cy, x1, y1, p * k / n);
      ctx.lineTo(q[0], q[1]);
    }
  }

  function layout() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = window.innerWidth;
    H = window.innerHeight;
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    var top = topEl.getBoundingClientRect().bottom + 2;
    var bot = botEl.getBoundingClientRect().top - 2;
    var availH = Math.max(160, bot - top), availW = Math.max(160, W - 20);
    S = Math.min(availW / BOX.w, availH / BOX.h);
    OX = (W - BOX.w * S) / 2 - BOX.x * S;
    OY = top + (availH - BOX.h * S) / 2 - BOX.y * S;
    cache = null;
    main.heartPattern = null;
  }
  function cam(t, sway) {
    var z = reduce ? 1 : 1.07 - 0.07 * eInOut(prog(t, 0, 6800));
    var s = S * z, fx = 510, fy = 640;
    ctx.setTransform(dpr * s, 0, 0, dpr * s, dpr * (OX + fx * S - fx * s), dpr * (OY + fy * S - fy * s));
    if (sway) {
      ctx.translate(B.x, B.y);
      ctx.rotate(sway);
      ctx.translate(-B.x, -B.y);
    }
  }

  function halo(t) {
    var a = eOut(prog(t, 1600, 3600));
    if (t < 1500 && !reduce) {
      var s = eOut(prog(t, 0, 500)) * (1 - prog(t, 900, 600));
      var g0 = ctx.createRadialGradient(B.x, B.y, 0, B.x, B.y, 90);
      g0.addColorStop(0, 'rgba(255, 255, 255, ' + 0.95 * s + ')');
      g0.addColorStop(0.4, 'rgba(255, 210, 225, ' + 0.6 * s + ')');
      g0.addColorStop(1, 'rgba(255, 210, 225, 0)');
      ctx.fillStyle = g0;
      ctx.fillRect(B.x - 100, B.y - 100, 200, 200);
    }
    if (a <= 0) return;
    var g = ctx.createRadialGradient(510, 500, 30, 510, 520, 600);
    g.addColorStop(0, 'rgba(255, 255, 255, ' + 0.9 * a + ')');
    g.addColorStop(0.45, 'rgba(255, 238, 244, ' + 0.6 * a + ')');
    g.addColorStop(1, 'rgba(255, 225, 236, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(-120, -100, 1240, 1400);
  }

  function stem(R, t) {
    var p = eInOut(prog(t, R.s0, R.sd));
    if (p <= 0) return;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    partial(B.x, B.y, R.cx, R.cy, R.x, R.y, p, 30);
    ctx.strokeStyle = '#3D7A49';
    ctx.lineWidth = 11;
    ctx.stroke();
    ctx.strokeStyle = '#69AE72';
    ctx.lineWidth = 5;
    ctx.stroke();
    if (p < 1 && !reduce) {
      var q = quadAt(B.x, B.y, R.cx, R.cy, R.x, R.y, p);
      var g = ctx.createRadialGradient(q[0], q[1], 0, q[0], q[1], 22);
      g.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
      g.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(q[0] - 22, q[1] - 22, 44, 44);
    }
  }

  function leaf(L, t) {
    var p = prog(t, L.t0, 700);
    if (p <= 0) return;
    var e = eBack(p), len = L.len, w = L.w;
    ctx.save();
    ctx.translate(L.x, L.y);
    ctx.rotate(L.ang + (1 - eOut(p)) * 0.8 * L.flip);
    ctx.scale(e, e);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(w * 0.62, -len * 0.16, w * 0.6, -len * 0.72, 0, -len);
    ctx.bezierCurveTo(-w * 0.6, -len * 0.72, -w * 0.62, -len * 0.16, 0, 0);
    ctx.closePath();
    var g = ctx.createLinearGradient(-w * 0.5, 0, w * 0.5, 0);
    g.addColorStop(0, '#3E8A4F');
    g.addColorStop(0.5, '#58A666');
    g.addColorStop(0.5, '#6CBB78');
    g.addColorStop(1, '#92D59D');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = 'rgba(40, 96, 52, 0.45)';
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -2);
    ctx.quadraticCurveTo(w * 0.04, -len * 0.5, 0, -len * 0.94);
    for (var k = 1; k <= 3; k++) {
      var y = -len * 0.22 * k;
      ctx.moveTo(0, y);
      ctx.quadraticCurveTo(w * 0.18, y - len * 0.06, w * 0.34, y - len * 0.15);
      ctx.moveTo(0, y);
      ctx.quadraticCurveTo(-w * 0.18, y - len * 0.06, -w * 0.34, y - len * 0.15);
    }
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(40, 96, 52, 0.4)';
    ctx.stroke();
    ctx.restore();
  }

  function sprigStem(sp, t) {
    var p = eInOut(prog(t, sp.t0, 820));
    if (p <= 0) return;
    ctx.lineCap = 'round';
    partial(B.x, B.y, sp.cx, sp.cy, sp.x, sp.y, p, 24);
    ctx.strokeStyle = '#7FAE70';
    ctx.lineWidth = 3.4;
    ctx.stroke();
  }
  function sprigTop(sp, t) {
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#8DBB7C';
    for (var k = 0; k < sp.branches.length; k++) {
      var br = sp.branches[k], p = eOut(prog(t, br.t0, br.d));
      if (p <= 0) continue;
      ctx.lineWidth = br.wd;
      ctx.beginPath();
      ctx.moveTo(br.x1, br.y1);
      ctx.lineTo(br.x1 + (br.x2 - br.x1) * p, br.y1 + (br.y2 - br.y1) * p);
      ctx.stroke();
    }
    for (k = 0; k < sp.flowers.length; k++) {
      var f = sp.flowers[k], q = prog(t, f.t0, 420);
      if (q <= 0) continue;
      var r = f.r * eBack(q);
      ctx.beginPath();
      ctx.arc(f.x, f.y, r, 0, TAU);
      ctx.fillStyle = f.pink ? '#FFEFF4' : '#FFFFFF';
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(176, 140, 152, 0.55)';
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(f.x + r * 0.18, f.y - r * 0.15, r * 0.4, 0, TAU);
      ctx.fillStyle = 'rgba(232, 214, 188, 0.95)';
      ctx.fill();
    }
  }

  function petal(L, w) {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-w * 0.55, -L * 0.08, -w * 0.64, -L * 0.72, -w * 0.3, -L * 0.96);
    ctx.quadraticCurveTo(0, -L * 1.1, w * 0.3, -L * 0.96);
    ctx.bezierCurveTo(w * 0.64, -L * 0.72, w * 0.55, -L * 0.08, 0, 0);
    ctx.closePath();
  }
  function rose(R, t) {
    var a = eBack(prog(t, R.s1 - 260, 480));
    if (a <= 0) return;
    var b = prog(t, R.b0, R.bd), r = R.r, k, j;
    ctx.save();
    ctx.translate(R.x, R.y);
    ctx.scale(a, a * R.tilt);
    ctx.rotate(R.rot);
    ctx.fillStyle = '#4C9A5B';
    for (k = 0; k < 5; k++) {
      ctx.save();
      ctx.rotate(k * TAU / 5 + 0.3);
      ctx.beginPath();
      ctx.moveTo(-r * 0.09, 0);
      ctx.quadraticCurveTo(-r * 0.15, -r * 0.34, 0, -r * 0.6);
      ctx.quadraticCurveTo(r * 0.15, -r * 0.34, r * 0.09, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    for (k = 0; k < RINGS.length; k++) {
      var ring = RINGS[k], col = R.cols[k];
      var pk = eOut(clamp((b - k * 0.1) / 0.6, 0, 1));
      var L = r * ring.len * (0.3 + 0.7 * pk), w = L * ring.w;
      var twist = (1 - pk) * -0.75 + ring.off * D;
      if (k > 0) {
        ctx.fillStyle = 'rgba(90, 10, 35, 0.16)';
        for (j = 0; j < ring.n; j++) {
          ctx.save();
          ctx.rotate(twist + j * TAU / ring.n);
          ctx.scale(1.1, 1.1);
          petal(L, w);
          ctx.fill();
          ctx.restore();
        }
      }
      for (j = 0; j < ring.n; j++) {
        ctx.save();
        ctx.rotate(twist + j * TAU / ring.n);
        petal(L, w);
        var g = ctx.createLinearGradient(0, 0, 0, -L);
        g.addColorStop(0, col.base);
        g.addColorStop(0.55, col.mid);
        g.addColorStop(1, col.tip);
        ctx.fillStyle = g;
        ctx.fill();
        ctx.globalAlpha = 0.35;
        ctx.lineWidth = Math.max(0.8, r * 0.012);
        ctx.strokeStyle = col.edge;
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.moveTo(-w * 0.27, -L * 0.93);
        ctx.quadraticCurveTo(0, -L * 1.06, w * 0.27, -L * 0.93);
        ctx.lineWidth = L * 0.05;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.stroke();
        ctx.restore();
      }
    }
    var cr = r * 0.16 * (0.6 + 0.4 * b);
    var cg = ctx.createRadialGradient(0, 0, 0, 0, 0, cr);
    cg.addColorStop(0, R.pal[0]);
    cg.addColorStop(1, R.pal[1]);
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.arc(0, 0, cr, 0, TAU);
    ctx.fill();
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (k = 0; k <= 40; k++) {
      var th = k / 40 * 3.4 * Math.PI, sr = cr * (0.12 + 0.95 * k / 40);
      if (k) ctx.lineTo(Math.cos(th) * sr, Math.sin(th) * sr);
      else ctx.moveTo(Math.cos(th) * sr, Math.sin(th) * sr);
    }
    ctx.globalAlpha = 0.7;
    ctx.lineWidth = r * 0.034;
    ctx.strokeStyle = R.cols[1].tip;
    ctx.stroke();
    ctx.globalAlpha = 0.45;
    ctx.lineWidth = r * 0.016;
    ctx.strokeStyle = R.pal[0];
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function fan(R, a0, a1, wav, waves, ph) {
    ctx.beginPath();
    ctx.moveTo(B.x, B.y);
    for (var i = 0; i <= 64; i++) {
      var u = i / 64, a = (a0 + (a1 - a0) * u) * D;
      var rr = R + Math.sin(u * Math.PI * waves + ph) * wav;
      ctx.lineTo(B.x + Math.cos(a) * rr, B.y - Math.sin(a) * rr);
    }
    ctx.closePath();
  }
  function creases(R, a0, a1, col) {
    ctx.strokeStyle = col;
    ctx.lineWidth = 2.5;
    for (var a = a0 + 9; a < a1 - 4; a += 13) {
      ctx.beginPath();
      ctx.moveTo(B.x, B.y);
      ctx.lineTo(B.x + Math.cos(a * D) * R * 0.97, B.y - Math.sin(a * D) * R * 0.97);
      ctx.stroke();
    }
  }
  function wrapIn(p, side, draw) {
    if (p <= 0) return;
    var e = reduce ? 1 : eBack(p);
    ctx.save();
    ctx.globalAlpha = clamp(p * 2.4, 0, 1);
    ctx.translate(B.x, B.y);
    ctx.rotate((1 - e) * side * 16 * D);
    ctx.scale(0.55 + 0.45 * e, 0.55 + 0.45 * e);
    ctx.translate(-B.x, -B.y);
    draw();
    ctx.restore();
  }
  function backPaper(t) {
    wrapIn(prog(t, 4500, 1000), -1, function () {
      fan(672, 48, 132, 11, 11, 0.4);
      var g = ctx.createRadialGradient(B.x, B.y, 60, B.x, B.y, 690);
      g.addColorStop(0, '#CDB6EE');
      g.addColorStop(0.6, '#E2D3F7');
      g.addColorStop(1, '#F3ECFD');
      ctx.fillStyle = g;
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(160, 130, 200, 0.35)';
      ctx.stroke();
      creases(672, 48, 132, 'rgba(150, 120, 190, 0.16)');
    });
    wrapIn(prog(t, 4650, 950), 1, function () {
      fan(626, 54, 126, 13, 9, 1.3);
      var g = ctx.createRadialGradient(B.x, B.y, 60, B.x, B.y, 650);
      g.addColorStop(0, '#F7A9BD');
      g.addColorStop(0.55, '#FFCFDB');
      g.addColorStop(1, '#FFE8EF');
      ctx.fillStyle = g;
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(225, 81, 111, 0.25)';
      ctx.stroke();
      creases(626, 54, 126, 'rgba(225, 81, 111, 0.12)');
    });
  }
  function sheet(path, c0, c1, edge) {
    path();
    var g = ctx.createLinearGradient(0, 700, 0, B.y);
    g.addColorStop(0, c0);
    g.addColorStop(1, c1);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.save();
    path();
    ctx.clip();
    ctx.fillStyle = pat();
    ctx.fillRect(100, 640, 820, 420);
    ctx.beginPath();
    ctx.moveTo(edge[0], edge[1]);
    ctx.quadraticCurveTo(edge[2], edge[3], edge[4], edge[5]);
    ctx.lineWidth = 30;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.stroke();
    ctx.translate(0, 15);
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = 'rgba(225, 81, 111, 0.25)';
    ctx.stroke();
    ctx.restore();
    path();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = 'rgba(225, 81, 111, 0.3)';
    ctx.stroke();
  }
  function leftSheet() {
    ctx.beginPath();
    ctx.moveTo(B.x - 40, B.y + 8);
    ctx.lineTo(196, 706);
    ctx.quadraticCurveTo(400, 742, 622, 818);
    ctx.lineTo(B.x + 34, B.y + 2);
    ctx.closePath();
  }
  function rightSheet() {
    ctx.beginPath();
    ctx.moveTo(B.x + 40, B.y + 8);
    ctx.lineTo(806, 716);
    ctx.quadraticCurveTo(600, 752, 380, 826);
    ctx.lineTo(B.x - 34, B.y + 2);
    ctx.closePath();
  }
  function frontPaper(t) {
    wrapIn(prog(t, 5050, 850), -1.6, function () { sheet(leftSheet, '#FFF9F4', '#FBE4EC', [196, 706, 400, 742, 622, 818]); });
    wrapIn(prog(t, 5200, 850), 1.6, function () { sheet(rightSheet, '#FFF3F7', '#F7DDE7', [806, 716, 600, 752, 380, 826]); });
  }
  function conePath() {
    ctx.beginPath();
    ctx.moveTo(B.x - 52, B.y - 10);
    ctx.quadraticCurveTo(B.x - 50, B.y + 140, B.x - 10, B.y + 236);
    ctx.quadraticCurveTo(B.x, B.y + 250, B.x + 10, B.y + 236);
    ctx.quadraticCurveTo(B.x + 50, B.y + 140, B.x + 52, B.y - 10);
    ctx.closePath();
  }
  function cone(t) {
    var p = prog(t, 5150, 700);
    if (p <= 0) return;
    ctx.save();
    ctx.globalAlpha = clamp(p * 2, 0, 1);
    ctx.translate(B.x, B.y);
    ctx.scale(1, reduce ? 1 : eBack(p));
    ctx.translate(-B.x, -B.y);
    conePath();
    var g = ctx.createLinearGradient(B.x - 52, 0, B.x + 52, 0);
    g.addColorStop(0, '#F6B9C9');
    g.addColorStop(0.5, '#FFE3EA');
    g.addColorStop(1, '#F3AABD');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.save();
    conePath();
    ctx.clip();
    ctx.fillStyle = pat();
    ctx.fillRect(B.x - 60, B.y - 20, 120, 280);
    ctx.strokeStyle = 'rgba(225, 81, 111, 0.18)';
    ctx.lineWidth = 2;
    [-24, 0, 24].forEach(function (dx) {
      ctx.beginPath();
      ctx.moveTo(B.x + dx, B.y);
      ctx.lineTo(B.x + dx * 0.25, B.y + 236);
      ctx.stroke();
    });
    ctx.restore();
    conePath();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = 'rgba(225, 81, 111, 0.35)';
    ctx.stroke();
    ctx.restore();
  }
  function band(t) {
    var p = eOut(prog(t, 5700, 350));
    if (p <= 0) return;
    ctx.save();
    ctx.globalAlpha = p;
    ctx.beginPath();
    ctx.moveTo(B.x - 58, B.y - 22);
    ctx.quadraticCurveTo(B.x, B.y - 8, B.x + 58, B.y - 22);
    ctx.lineTo(B.x + 56, B.y + 10);
    ctx.quadraticCurveTo(B.x, B.y + 24, B.x - 56, B.y + 10);
    ctx.closePath();
    var g = ctx.createLinearGradient(0, B.y - 22, 0, B.y + 24);
    g.addColorStop(0, '#F58CA2');
    g.addColorStop(0.5, '#E9607C');
    g.addColorStop(1, '#C93F5E');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(140, 20, 50, 0.3)';
    ctx.stroke();
    ctx.restore();
  }

  function scene(t) {
    var k;
    halo(t);
    backPaper(t);
    for (k = 0; k < ROSES.length; k++) stem(ROSES[k], t);
    for (k = 0; k < SPRIGS.length; k++) sprigStem(SPRIGS[k], t);
    for (k = 0; k < LEAVES.length; k++) leaf(LEAVES[k], t);
    for (k = 0; k < SPRIGS.length; k++) sprigTop(SPRIGS[k], t);
    for (k = 0; k < BY_Y.length; k++) rose(BY_Y[k], t);
    frontPaper(t);
    cone(t);
    band(t);
  }

  function loop(sx) {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(sx * 34, -86, sx * 146, -96, sx * 140, -24);
    ctx.bezierCurveTo(sx * 136, 32, sx * 58, 38, 0, 0);
    ctx.closePath();
    var g = ctx.createLinearGradient(0, 0, sx * 140, -30);
    g.addColorStop(0, '#B8334F');
    g.addColorStop(0.35, '#E9607C');
    g.addColorStop(1, '#FF9DB2');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.lineWidth = 2.4;
    ctx.strokeStyle = 'rgba(140, 20, 50, 0.35)';
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(sx * 10, -4);
    ctx.bezierCurveTo(sx * 42, -52, sx * 104, -60, sx * 110, -26);
    ctx.bezierCurveTo(sx * 86, -30, sx * 46, -20, sx * 10, -4);
    ctx.closePath();
    ctx.fillStyle = 'rgba(130, 15, 45, 0.28)';
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(sx * 34, -50);
    ctx.quadraticCurveTo(sx * 84, -92, sx * 128, -52);
    ctx.lineCap = 'round';
    ctx.lineWidth = 6;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.stroke();
  }
  function bow(t) {
    var p = prog(t, 5800, 1000);
    if (p <= 0) return;
    var e = reduce ? 1 : eElastic(p);
    ctx.save();
    ctx.translate(B.x, B.y - 2);
    ctx.scale(e, e);
    loop(-1);
    loop(1);
    roundRect(-21, -25, 42, 48, 15);
    var g = ctx.createLinearGradient(0, -25, 0, 23);
    g.addColorStop(0, '#F27A93');
    g.addColorStop(1, '#C93F5E');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(140, 20, 50, 0.35)';
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-8, -15);
    ctx.quadraticCurveTo(0, -20, 8, -15);
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.stroke();
    ctx.restore();
  }
  function tails(t, ts) {
    var p = eOut(prog(t, 5950, 900));
    if (p <= 0) return;
    for (var k = 0; k < 2; k++) {
      var sx = k ? 1 : -1;
      var sw = reduce ? 0 : Math.sin(ts / 760 + k * 1.7) * 7;
      ctx.save();
      ctx.translate(B.x, B.y + 4);
      ctx.scale(1, p);
      ctx.beginPath();
      ctx.moveTo(sx * 2, 0);
      ctx.bezierCurveTo(sx * 30, 60, sx * 24 + sw * 0.5, 128, sx * 64 + sw, 198);
      ctx.lineTo(sx * 46 + sw, 182);
      ctx.lineTo(sx * 30 + sw, 208);
      ctx.bezierCurveTo(sw * 0.5, 130, sx * 2, 66, -sx * 16, 2);
      ctx.closePath();
      var g = ctx.createLinearGradient(-sx * 10, 0, sx * 60, 200);
      g.addColorStop(0, '#C93F5E');
      g.addColorStop(0.5, '#EC6A86');
      g.addColorStop(1, '#F7909F');
      ctx.fillStyle = g;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(150, 25, 55, 0.35)';
      ctx.stroke();
      ctx.restore();
    }
  }
  function tag(t, ts) {
    var p = prog(t, 6400, 1600);
    if (p <= 0) return;
    var ang = -0.42 + (reduce ? 0 : 1.25 * Math.cos(p * 10) * Math.exp(-p * 4)) + (reduce ? 0 : Math.sin(ts / 1300) * 0.035);
    ctx.save();
    ctx.globalAlpha = clamp(p * 4, 0, 1);
    ctx.translate(B.x + 14, B.y + 12);
    ctx.rotate(ang);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(10, 30, -8, 70, 0, 104);
    ctx.lineWidth = 2.6;
    ctx.strokeStyle = '#D9A441';
    ctx.stroke();
    ctx.translate(0, 104);
    ctx.rotate(-ang * 0.55);
    ctx.font = '700 34px Caveat, cursive';
    var tw = ctx.measureText('for my pretty girl').width, w = tw + 78;
    roundRect(-w / 2, -12, w, 84, 18);
    ctx.fillStyle = '#FFFDF8';
    ctx.shadowColor = 'rgba(225, 81, 111, 0.25)';
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 6;
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#F2748C';
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 2, 6, 0, TAU);
    ctx.fillStyle = '#FFE1EC';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#F2748C';
    ctx.stroke();
    ctx.fillStyle = '#E1516F';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('for my pretty girl', -w / 2 + 22, 44);
    heartPath(w / 2 - 30, 46, 20);
    ctx.fillStyle = '#F2748C';
    ctx.fill();
    ctx.restore();
  }

  function toScreen(x, y) { return [OX + x * S, OY + y * S]; }
  function addPart(p) {
    if (parts.length > 500) return;
    p.age = 0;
    parts.push(p);
  }
  function petalColor() { var R = pick(ROSES); return pick([R.pal[2], R.pal[3], R.pal[1]]); }
  function spawnPetal(x, y, col, burst) {
    addPart({
      k: 'petal', x: x, y: y,
      vx: (Math.random() - 0.5) * (burst ? 0.32 : 0.03), vy: burst ? -0.05 - Math.random() * 0.22 : 0.025 + Math.random() * 0.03,
      g: burst ? 0.00022 : 0.000006, life: burst ? 3200 + Math.random() * 1500 : 9000,
      s: (6 + Math.random() * 6) * clamp(S * 1.7, 0.7, 1.4), rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 0.004,
      flip: Math.random() * TAU, vf: 0.002 + Math.random() * 0.004, sway: Math.random() * TAU, col: col
    });
  }
  function spawnHeart(x, y, fast) {
    addPart({
      k: 'heart', x: x + (Math.random() - 0.5) * 30, y: y,
      vx: (Math.random() - 0.5) * (fast ? 0.2 : 0.03), vy: fast ? -0.12 - Math.random() * 0.18 : -0.035 - Math.random() * 0.03,
      g: fast ? 0.00008 : 0, life: fast ? 2200 + Math.random() * 900 : 5200 + Math.random() * 2000,
      s: (9 + Math.random() * 10) * clamp(S * 1.7, 0.7, 1.4), rot: (Math.random() - 0.5) * 0.6, vr: 0, sway: Math.random() * TAU,
      col: pick(['#F2748C', '#FFB6C1', '#E1516F', '#C9B3E8', '#F0C46A'])
    });
  }
  function spawnSpark(x, y, big) {
    addPart({
      k: 'spark', x: x, y: y, vx: 0, vy: big ? -0.01 : -0.004, g: 0, life: 700 + Math.random() * 700,
      s: (big ? 7 : 4) + Math.random() * (big ? 9 : 6), rot: Math.random(), vr: 0.001,
      col: pick(['#F0C46A', '#FFFFFF', '#FFB6C1', '#F2748C', '#FFE9A8'])
    });
  }
  function sparkBurst(x, y, n, spread) {
    for (var k = 0; k < n; k++) {
      var a = Math.random() * TAU, d = Math.random() * spread;
      spawnSpark(x + Math.cos(a) * d, y + Math.sin(a) * d, true);
    }
  }
  function star(s) {
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.quadraticCurveTo(0, 0, s, 0);
    ctx.quadraticCurveTo(0, 0, 0, s);
    ctx.quadraticCurveTo(0, 0, -s, 0);
    ctx.quadraticCurveTo(0, 0, 0, -s);
    ctx.closePath();
  }

  function effects(t, ts, dt) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!reduce) {
      ROSES.forEach(function (R) {
        if (!R.popped && t > R.b0 + R.bd * 0.62) {
          R.popped = true;
          var q = toScreen(R.x, R.y);
          sparkBurst(q[0], q[1], 7, R.r * S * 0.9);
        }
      });
      if (!bowPopped && t > 6150) {
        bowPopped = true;
        var b = toScreen(B.x, B.y);
        sparkBurst(b[0], b[1], 16, 90 * S);
      }
      if (!finalPopped && t > T_TEXT) {
        finalPopped = true;
        for (var h = 0; h < 14; h++) {
          var hp = toScreen(300 + Math.random() * 420, 330 + Math.random() * 300);
          spawnHeart(hp[0], hp[1], true);
        }
      }
      if (t > 3000) {
        sparkClock += dt;
        if (sparkClock > 150) {
          sparkClock = 0;
          var sp = toScreen(170 + Math.random() * 680, 220 + Math.random() * 560);
          spawnSpark(sp[0], sp[1], false);
        }
      }
      if (t > T_TEXT - 600) {
        petalClock += dt;
        heartClock += dt;
        if (petalClock > 850) {
          petalClock = 0;
          var R = pick(ROSES), pq = toScreen(R.x + (Math.random() - 0.5) * R.r, R.y + R.r * 0.3);
          spawnPetal(pq[0], pq[1], pick([R.pal[2], R.pal[3]]), false);
        }
        if (heartClock > 1700) {
          heartClock = 0;
          var hq = toScreen(330 + Math.random() * 360, 300);
          spawnHeart(hq[0], hq[1], false);
        }
      }
    }
    for (var i = parts.length - 1; i >= 0; i--) {
      var p = parts[i];
      p.age += dt;
      if (p.age >= p.life || p.y > H + 60 || p.y < -80) {
        parts[i] = parts[parts.length - 1];
        parts.pop();
        continue;
      }
      p.vy += p.g * dt;
      p.x += p.vx * dt + (p.sway !== undefined ? Math.sin(p.age / 700 + p.sway) * 0.4 : 0);
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      var life = p.age / p.life;
      ctx.globalAlpha = Math.min(1, p.age / 150) * (life > 0.75 ? (1 - life) / 0.25 : 1);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      if (p.k === 'petal') {
        p.flip += p.vf * dt;
        ctx.scale(Math.cos(p.flip), 1);
        ctx.beginPath();
        ctx.moveTo(0, -p.s);
        ctx.bezierCurveTo(p.s * 0.95, -p.s * 0.65, p.s * 0.75, p.s * 0.75, 0, p.s);
        ctx.bezierCurveTo(-p.s * 0.75, p.s * 0.75, -p.s * 0.95, -p.s * 0.65, 0, -p.s);
        ctx.fillStyle = p.col;
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.stroke();
      } else if (p.k === 'heart') {
        heartPath(0, 0, p.s);
        ctx.fillStyle = p.col;
        ctx.fill();
      } else {
        var tw = 0.6 + 0.4 * Math.sin(p.age / 70);
        star(p.s * tw);
        ctx.fillStyle = p.col;
        ctx.shadowColor = 'rgba(255, 255, 255, 0.9)';
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  function buildCache() {
    var c = document.createElement('canvas');
    c.width = cv.width;
    c.height = cv.height;
    var keep = ctx;
    ctx = c.getContext('2d');
    cam(T_END, 0);
    scene(T_END + 1);
    ctx = keep;
    cache = c;
  }

  function frame(ts) {
    if (!start) start = ts;
    var dt = lastT ? Math.min(50, ts - lastT) : 16;
    lastT = ts;
    var t = reduce ? T_END + 1 : ts - start;
    var settle = clamp((t - (T_END - 1600)) / 1800, 0, 1);
    kick *= Math.pow(0.94, dt / 16.67);
    var sway = reduce ? 0 : (Math.sin(ts / 950) * 0.012 + Math.sin(ts / 2300 + 1) * 0.006) * settle + kick * Math.sin(ts / 120);
    ctx = main;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, cv.width, cv.height);
    if (t >= T_END) {
      if (!cache) buildCache();
      var bx = dpr * (OX + B.x * S), by = dpr * (OY + B.y * S);
      ctx.translate(bx, by);
      ctx.rotate(sway);
      ctx.translate(-bx, -by);
      ctx.drawImage(cache, 0, 0);
    } else {
      cam(t, sway);
      scene(t);
    }
    cam(Math.min(t, T_END), sway);
    tails(t, ts);
    bow(t);
    tag(t, ts);
    if (!shown && t >= T_TEXT) {
      shown = true;
      body.classList.add('done');
    }
    effects(t, ts, dt);
    requestAnimationFrame(frame);
  }

  cv.addEventListener('pointerdown', function (e) {
    var vx = (e.clientX - OX) / S, vy = (e.clientY - OY) / S;
    if (Math.hypot(vx - 512, vy - 520) > 420 && !(Math.abs(vx - B.x) < 160 && vy > 600 && vy < B.y + 280)) return;
    for (var k = 0; k < 14; k++) spawnPetal(e.clientX, e.clientY, petalColor(), true);
    for (k = 0; k < 6; k++) spawnHeart(e.clientX, e.clientY, true);
    sparkBurst(e.clientX, e.clientY, 8, 40);
    kick = Math.min(0.06, kick + 0.035);
  });
  regrow.addEventListener('click', function () {
    start = performance.now();
    shown = false;
    cache = null;
    parts.length = 0;
    bowPopped = false;
    finalPopped = false;
    ROSES.forEach(function (R) { R.popped = false; });
    body.classList.remove('done');
  });
  window.addEventListener('resize', layout);

  function begin() {
    layout();
    requestAnimationFrame(frame);
  }
  if (document.fonts && document.fonts.load) {
    Promise.all([document.fonts.load('700 32px Caveat'), document.fonts.load('40px Pacifico')]).then(begin, begin);
  } else {
    begin();
  }
})();
