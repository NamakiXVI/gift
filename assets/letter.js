(function () {
  var doc = document;
  var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  function $(id) { return doc.getElementById(id); }
  function noop() {}
  var intro = $('intro'), envelope = $('envelope'), show = $('show'), stage = $('stage'), dots = $('dots');
  var hint = $('hint'), skip = $('skip'), letter = $('letter'), paper = $('paper'), ends = $('ends'), again = $('again');

  var PINKS = ['#F2748C', '#FFB6C1', '#E1516F', '#C9B3E8', '#F0C46A'];
  var SPARKS = ['#F0C46A', '#F2748C', '#FFB6C1', '#C9B3E8'];
  var TINTS = ['#FFE1EC', '#EEE6FB', '#FFE7DB', '#DCF4E9', '#FFE3EE', '#E7E1FA', '#FFF0DA', '#DEF3F0', '#FFE4EC', '#FFD7E3', '#FFE9F0'];

  var fx = $('fx'), ctx = fx.getContext('2d');
  var W = 0, H = 0, dpr = 1, parts = [], twinkles = [], lastT = 0, ambient = 0;
  var HEART = [];
  for (var i = 0; i < 48; i++) {
    var a = i / 48 * Math.PI * 2;
    HEART.push([16 * Math.pow(Math.sin(a), 3) / 17, -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)) / 17 - 0.16]);
  }
  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }

  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = window.innerWidth; H = window.innerHeight;
    fx.width = Math.round(W * dpr); fx.height = Math.round(H * dpr);
    twinkles = [];
    var n = reduce ? 0 : Math.round(Math.min(48, W * H / 24000));
    for (var k = 0; k < n; k++) {
      twinkles.push({ x: Math.random() * W, y: Math.random() * H, s: 3 + Math.random() * 5, p: Math.random() * 6.3, v: 0.5 + Math.random() * 1.2, c: pick(SPARKS) });
    }
  }

  function heartPath(s) {
    ctx.beginPath();
    for (var k = 0; k < HEART.length; k++) {
      if (k) ctx.lineTo(HEART[k][0] * s, HEART[k][1] * s);
      else ctx.moveTo(HEART[k][0] * s, HEART[k][1] * s);
    }
    ctx.closePath();
  }
  function starPath(s) {
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.quadraticCurveTo(0, 0, s, 0);
    ctx.quadraticCurveTo(0, 0, 0, s);
    ctx.quadraticCurveTo(0, 0, -s, 0);
    ctx.quadraticCurveTo(0, 0, 0, -s);
    ctx.closePath();
  }

  function add(p) {
    if (parts.length > 650) return;
    p.age = 0;
    if (!p.vx) p.vx = 0;
    if (!p.vy) p.vy = 0;
    if (!p.drag) p.drag = 1;
    if (!p.g) p.g = 0;
    if (!p.vr) p.vr = 0;
    if (!p.rot) p.rot = 0;
    parts.push(p);
  }
  function sparkle(x, y, n) {
    if (reduce) return;
    for (var k = 0; k < n; k++) {
      var a = Math.random() * Math.PI * 2, sp = 0.015 + Math.random() * 0.05;
      add({
        kind: Math.random() < 0.7 ? 'star' : 'dot', x: x + (Math.random() - 0.5) * 18, y: y + (Math.random() - 0.5) * 12,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 0.025, drag: 0.99,
        life: 650 + Math.random() * 650, size: 3 + Math.random() * 5, rot: Math.random() * 3, vr: (Math.random() - 0.5) * 0.004, color: pick(SPARKS)
      });
    }
  }
  function floatHearts(x, y, n) {
    if (reduce) return;
    for (var k = 0; k < n; k++) {
      add({
        kind: 'heart', x: x + (Math.random() - 0.5) * 22, y: y, vx: (Math.random() - 0.5) * 0.04, vy: -0.05 - Math.random() * 0.07,
        life: 1500 + Math.random() * 1200, size: 7 + Math.random() * 8, rot: (Math.random() - 0.5) * 0.6, sway: 1 + Math.random() * 6, color: pick(PINKS)
      });
    }
  }
  function heartBurst(cx, cy, R, n) {
    if (reduce) return;
    for (var k = 0; k < n; k++) {
      var p = HEART[k % HEART.length], j = 0.82 + Math.random() * 0.32;
      add({
        kind: Math.random() < 0.6 ? 'heart' : 'star', x: cx, y: cy,
        vx: p[0] * R * j / 476, vy: p[1] * R * j / 476, drag: 0.965, g: 0.00003,
        life: 1900 + Math.random() * 900, size: 6 + Math.random() * 9, vr: (Math.random() - 0.5) * 0.004, color: pick(PINKS)
      });
    }
    for (k = 0; k < 26; k++) {
      var a = Math.random() * Math.PI * 2, sp = 0.15 + Math.random() * 0.35;
      add({ kind: 'dot', x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, drag: 0.95, life: 900 + Math.random() * 500, size: 4 + Math.random() * 6, color: pick(SPARKS) });
    }
  }
  function confetti(x, y, n) {
    if (reduce) return;
    for (var k = 0; k < n; k++) {
      var a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2, sp = 0.35 + Math.random() * 0.45;
      add({
        kind: pick(['heart', 'heart', 'star', 'dot']), x: x + (Math.random() - 0.5) * 60, y: y,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, drag: 0.975, g: 0.0007,
        life: 2200 + Math.random() * 1400, size: 6 + Math.random() * 9, rot: Math.random() * 3, vr: (Math.random() - 0.5) * 0.01, sway: Math.random() * 6, color: pick(PINKS)
      });
    }
  }

  function frame(t) {
    var dt = lastT ? Math.min(50, t - lastT) : 16;
    lastT = t;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    if (!reduce) {
      ambient += dt;
      if (ambient > Math.min(1400, Math.max(460, 506000 / W))) {
        ambient = 0;
        add({ kind: 'heart', x: Math.random() * W, y: H + 24, vy: -0.025 - Math.random() * 0.035, life: 26000, size: 6 + Math.random() * 12, rot: (Math.random() - 0.5) * 0.5, sway: 1 + Math.random() * 6, alpha: 0.32, color: pick(PINKS) });
      }
      for (var k = 0; k < twinkles.length; k++) {
        var s = twinkles[k];
        var tw = 0.5 + 0.5 * Math.sin(t / 1000 * s.v * 2 + s.p);
        ctx.globalAlpha = 0.12 + 0.5 * tw * tw;
        ctx.fillStyle = s.c;
        ctx.save();
        ctx.translate(s.x, s.y);
        starPath(s.s * (0.6 + 0.4 * tw));
        ctx.fill();
        ctx.restore();
      }
    }
    for (var i2 = parts.length - 1; i2 >= 0; i2--) {
      var p = parts[i2];
      p.age += dt;
      if (p.age >= p.life || p.y < -80 || p.y > H + 120) {
        parts[i2] = parts[parts.length - 1];
        parts.pop();
        continue;
      }
      var f = Math.pow(p.drag, dt / 16.67);
      p.vx *= f;
      p.vy = p.vy * f + p.g * dt;
      p.x += p.vx * dt + (p.sway ? Math.sin(p.age / 520 + p.sway) * 0.35 : 0);
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      var life = p.age / p.life;
      var alpha = (p.alpha || 1) * Math.min(1, p.age / 140) * (life > 0.72 ? (1 - life) / 0.28 : 1);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      if (p.kind === 'heart') { heartPath(p.size); ctx.fill(); }
      else if (p.kind === 'star') { starPath(p.size * (0.75 + 0.25 * Math.sin(p.age / 80))); ctx.fill(); }
      else { ctx.beginPath(); ctx.arc(0, 0, p.size * 0.32, 0, 6.2832); ctx.fill(); }
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(frame);
  }

  var slides = [];
  Array.prototype.forEach.call(paper.querySelectorAll('p'), function (p) {
    var kind = p.classList.contains('salute') ? 'salute' : p.classList.contains('final') ? 'final' : p.classList.contains('sign') ? 'sign' : 'para';
    slides.push({ kind: kind, el: p });
    var d = doc.createElement('span');
    d.textContent = '♥';
    dots.appendChild(d);
  });
  function markDots(i) {
    Array.prototype.forEach.call(dots.children, function (d, k) { d.className = k < i ? 'on' : k === i ? 'now' : ''; });
  }

  var run = 0, nudgeFn = null, hurryFn = null;
  function wait(ms, nudgeable) {
    return new Promise(function (resolve) {
      var finished = false;
      function fin() {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        if (nudgeFn === fin) nudgeFn = null;
        resolve();
      }
      var timer = setTimeout(fin, ms);
      if (nudgeable) nudgeFn = fin;
    });
  }
  function nudge() {
    if (hurryFn) { var h = hurryFn; hurryFn = null; h(); return; }
    if (nudgeFn) nudgeFn();
  }
  function settle(anims) {
    return Promise.all(anims.map(function (an) { return an.finished.catch(noop); }));
  }

  function wordGroups(el) {
    var groups = [], cur = null;
    Array.prototype.forEach.call(el.childNodes, function (n) {
      var hl = n.nodeType === 1 && n.tagName === 'EM';
      n.textContent.split(/(\s+)/).forEach(function (part) {
        if (!part) return;
        if (/^\s+$/.test(part)) { cur = null; return; }
        if (!cur) { cur = []; groups.push(cur); }
        cur.push({ t: part, hl: hl });
      });
    });
    return groups;
  }
  function renderWords(box, groups, allHl) {
    return groups.map(function (segs, k) {
      if (k) box.appendChild(doc.createTextNode(' '));
      var w = doc.createElement('span');
      w.className = 'w';
      segs.forEach(function (sg) {
        if (sg.hl || allHl) {
          var h = doc.createElement('span');
          h.className = 'hl';
          h.textContent = sg.t;
          w.appendChild(h);
        } else {
          w.appendChild(doc.createTextNode(sg.t));
        }
      });
      box.appendChild(w);
      return w;
    });
  }
  function revealWords(words, pace, token, state) {
    var t = 0;
    return words.map(function (w) {
      var txt = w.textContent;
      var step = Math.min(360, Math.max(170, 140 + txt.length * 16)) * pace;
      if (/[.!?]$/.test(txt)) step += 280 * pace;
      else if (/[,;:]$/.test(txt)) step += 160 * pace;
      var delay = t;
      t += step;
      if (!reduce) {
        setTimeout(function () {
          if (token !== run || state.hurried) return;
          var r = w.getBoundingClientRect();
          sparkle(r.left + r.width * Math.random(), r.top + r.height * 0.5, 2);
        }, delay + 150);
      }
      return w.animate(reduce ? [{ opacity: 0 }, { opacity: 1 }] : [
        { opacity: 0, transform: 'translateY(0.55em) scale(0.9)', filter: 'blur(10px)' },
        { opacity: 1, transform: 'translateY(0) scale(1)', filter: 'blur(0px)' }
      ], { duration: reduce ? 300 : 780, delay: delay, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)', fill: 'both' });
    });
  }
  function writeIn(box, text, ms, token) {
    var s = doc.createElement('span');
    s.className = 'ink';
    s.textContent = text;
    box.appendChild(s);
    var anim = s.animate([
      { clipPath: 'inset(-30% 100% -30% 0)' },
      { clipPath: 'inset(-30% -14% -30% -14%)' }
    ], { duration: reduce ? 300 : ms, easing: 'cubic-bezier(0.45, 0.05, 0.35, 1)', fill: 'both' });
    if (!reduce) {
      (function pen() {
        if (token !== run || anim.playState === 'finished') return;
        var p = anim.effect.getComputedTiming().progress || 0;
        var r = s.getBoundingClientRect();
        if (Math.random() < 0.7) sparkle(r.left + r.width * p, r.top + r.height * (0.3 + Math.random() * 0.45), 1);
        requestAnimationFrame(pen);
      })();
    }
    return { el: s, anim: anim };
  }
  function leave(units) {
    units.forEach(function (u, k) {
      u.animate(reduce ? [{ opacity: 1 }, { opacity: 0 }] : [
        { opacity: 1, transform: 'translateY(0) scale(1)', filter: 'blur(0px)' },
        { opacity: 0, transform: 'translateY(-0.8em) scale(1.06)', filter: 'blur(9px)' }
      ], { duration: reduce ? 250 : 720, delay: reduce ? 0 : k * 12, easing: 'cubic-bezier(0.5, 0, 0.75, 0)', fill: 'forwards' });
      if (!reduce && (k % 3 === 1 || units.length === 1)) {
        var r = u.getBoundingClientRect();
        floatHearts(r.left + r.width / 2, r.top + r.height / 2, units.length === 1 ? 6 : 1);
      }
    });
    return reduce ? 250 : 720 + units.length * 12;
  }

  async function playSlide(s, i, token) {
    markDots(i);
    doc.body.style.setProperty('--tint', TINTS[i % TINTS.length]);
    stage.textContent = '';
    var box = doc.createElement('p');
    box.className = 'say say-' + s.kind;
    stage.appendChild(box);
    var units;
    if (s.kind === 'salute' || s.kind === 'sign') {
      var ink = writeIn(box, s.el.textContent.trim(), s.kind === 'sign' ? 1700 : 1500, token);
      units = [box];
      hurryFn = function () { ink.anim.playbackRate = 4; };
      await ink.anim.finished.catch(noop);
    } else {
      var words = renderWords(box, wordGroups(s.el), s.kind === 'final');
      var state = { hurried: false };
      var anims = revealWords(words, s.kind === 'final' ? 1.5 : 1, token, state);
      units = words;
      hurryFn = function () {
        state.hurried = true;
        anims.forEach(function (an) { an.playbackRate = 7; });
      };
      await settle(anims);
    }
    hurryFn = null;
    if (token !== run) return;
    var r = box.getBoundingClientRect();
    if (s.kind === 'final') {
      if (!reduce) {
        box.animate([
          { transform: 'scale(1)' }, { transform: 'scale(1.07)' }, { transform: 'scale(1)' }, { transform: 'scale(1.045)' }, { transform: 'scale(1)' }
        ], { duration: 1150, easing: 'ease-in-out' });
      }
      heartBurst(r.left + r.width / 2, r.top + r.height / 2, Math.min(W, H) * 0.44, 96);
    } else if (s.kind === 'sign') {
      var heart = doc.createElement('span');
      heart.className = 'sig-heart';
      heart.textContent = '💗';
      box.appendChild(heart);
      heart.animate([{ transform: 'scale(0) rotate(-40deg)' }, { transform: 'scale(1.3) rotate(10deg)' }, { transform: 'scale(1) rotate(0)' }], { duration: 600, easing: 'ease-out' });
      floatHearts(r.right - 20, r.top + r.height / 2, 5);
    } else if (s.kind === 'salute') {
      sparkle(r.left + r.width / 2, r.top + r.height / 2, 10);
    }
    await wait(1000, true);
    if (token !== run) return;
    await wait(leave(units) + 120, false);
  }

  function startShow() {
    var token = ++run;
    letter.hidden = true;
    show.hidden = false;
    show.classList.remove('done');
    stage.textContent = '';
    hint.classList.remove('gone');
    setTimeout(function () { if (token === run) hint.classList.add('gone'); }, 9000);
    (async function () {
      await wait(reduce ? 50 : 320, false);
      for (var k = 0; k < slides.length; k++) {
        if (token !== run) return;
        await playSlide(slides[k], k, token);
      }
      if (token === run) openLetter();
    })();
  }

  function openLetter() {
    var token = ++run;
    nudgeFn = null;
    hurryFn = null;
    show.classList.add('done');
    setTimeout(function () {
      if (token !== run) return;
      show.hidden = true;
      stage.textContent = '';
    }, 650);
    doc.body.style.setProperty('--tint', '#FFE1EC');
    letter.hidden = false;
    window.scrollTo(0, 0);
    paper.classList.remove('visible', 'inked', 'signed');
    ends.classList.remove('on');
    var kids = paper.querySelectorAll('p');
    Array.prototype.forEach.call(kids, function (k, n) { k.style.animationDelay = (reduce ? 0 : 0.35 + n * 0.17) + 's'; });
    void paper.offsetWidth;
    paper.classList.add('visible');
    var t = reduce ? 100 : 350 + kids.length * 170 + 700;
    setTimeout(function () { if (token === run) paper.classList.add('inked'); }, Math.max(0, t - 600));
    setTimeout(function () { if (token === run) paper.classList.add('signed'); }, t);
    setTimeout(function () {
      if (token !== run) return;
      var r = paper.getBoundingClientRect();
      confetti(r.left + r.width / 2, Math.max(30, r.top + 10), 80);
      ends.classList.add('on');
    }, t + (reduce ? 100 : 1700));
  }

  envelope.addEventListener('click', function () {
    if (envelope.classList.contains('open')) return;
    envelope.classList.add('open');
    intro.classList.add('opening');
    var seal = envelope.querySelector('.env-seal').getBoundingClientRect();
    sparkle(seal.left + seal.width / 2, seal.top + seal.height / 2, 16);
    floatHearts(seal.left + seal.width / 2, seal.top, 6);
    setTimeout(function () { envelope.classList.add('flap-back'); }, reduce ? 0 : 520);
    setTimeout(function () {
      var r = envelope.getBoundingClientRect();
      heartBurst(r.left + r.width / 2, r.top, Math.min(W, H) * 0.32, 48);
    }, reduce ? 0 : 1250);
    setTimeout(function () { intro.classList.add('gone'); }, reduce ? 100 : 2100);
    setTimeout(function () {
      intro.hidden = true;
      startShow();
    }, reduce ? 400 : 2750);
  });
  show.addEventListener('pointerdown', function (e) {
    if (e.target.closest && e.target.closest('button')) return;
    nudge();
  });
  skip.addEventListener('click', function (e) {
    e.stopPropagation();
    openLetter();
  });
  again.addEventListener('click', function () {
    window.scrollTo(0, 0);
    startShow();
  });
  doc.addEventListener('keydown', function (e) {
    if (show.hidden || (e.target.closest && e.target.closest('button'))) return;
    if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight') {
      e.preventDefault();
      nudge();
    } else if (e.key === 'Escape') {
      openLetter();
    }
  });

  resize();
  window.addEventListener('resize', resize);
  requestAnimationFrame(frame);
})();
