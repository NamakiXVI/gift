(function () {
  var data = window.DISC_CONTENT || {};
  var photos = data.photos || [];
  var videos = data.videos || [];
  var songs = (data.audio || []).map(function (a) { return typeof a === 'string' ? { src: a, seconds: 0 } : a; });
  var reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  function fileUrl(path) { return path.split('/').map(encodeURIComponent).join('/'); }
  function baseName(path) { return path.split('/').pop().replace(/\.[^.]+$/, ''); }
  function looksLikeCameraName(name) {
    return /^(img|dsc|dscn|pxl|vid|mvimg|photo|image|screenshot)[\s_-]*\d/i.test(name) ||
           /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(name) || /^\d+$/.test(name);
  }
  function title(path) {
    var name = baseName(path);
    return looksLikeCameraName(name) ? '' : name.replace(/_+/g, ' ').trim();
  }
  function make(tag, className, text) {
    var e = document.createElement(tag);
    if (className) e.className = className;
    if (text) e.textContent = text;
    return e;
  }
  function reveal(id) { document.getElementById(id).classList.remove('hidden'); }

  if (photos.length) {
    var grid = document.getElementById('photo-grid');
    photos.forEach(function (path, i) {
      var button = make('button', 'photo');
      button.type = 'button';
      button.setAttribute('aria-label', 'Open photo ' + (i + 1));
      var img = make('img');
      img.src = fileUrl(path);
      img.alt = title(path) || 'Photo ' + (i + 1);
      img.loading = 'lazy';
      button.appendChild(img);
      button.addEventListener('click', function () { openViewer(i); });
      grid.appendChild(button);
    });
    reveal('photos');
  }

  var videoEls = [];
  if (videos.length) {
    var videoList = document.getElementById('video-list');
    videos.forEach(function (path) {
      var card = make('div', 'card media-card');
      var video = make('video');
      video.src = fileUrl(path);
      video.controls = true;
      video.preload = 'metadata';
      video.setAttribute('playsinline', '');
      video.addEventListener('play', function () {
        if (player && !player.paused) player.pause();
        videoEls.forEach(function (v) { if (v !== video && !v.paused) v.pause(); });
      });
      videoEls.push(video);
      card.appendChild(video);
      var t = title(path);
      if (t) card.appendChild(make('p', 'media-title', '🎬 ' + t));
      videoList.appendChild(card);
    });
    reveal('videos');
  }

  var PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.6v12.8a1.1 1.1 0 0 0 1.7.93l10-6.4a1.1 1.1 0 0 0 0-1.86l-10-6.4A1.1 1.1 0 0 0 8 5.6z"/></svg>';
  var PAUSE = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="5" width="4.3" height="14" rx="1.6"/><rect x="13.7" y="5" width="4.3" height="14" rx="1.6"/></svg>';
  var player = null, current = null, dragging = null, noteTimer = null, cards = [];

  function fmt(s) {
    if (!isFinite(s) || s <= 0) return '–:––';
    s = Math.round(s);
    var h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), sec = s % 60;
    return (h ? h + ':' + (m < 10 ? '0' : '') : '') + m + ':' + (sec < 10 ? '0' : '') + sec;
  }
  function songInfo(path) {
    var parts = baseName(path).split(/\s+-\s+/).map(function (s) { return s.trim(); }).filter(Boolean);
    var name = parts[0] || baseName(path), artist = '';
    if (parts.length >= 3) { artist = parts[0]; name = parts[1]; }
    else if (parts.length === 2) { name = parts[0]; artist = parts[1]; }
    name = name.replace(/\s*[(\[](?:official[^)\]]*|lyrics?[^)\]]*|audio|video|music video|visuali[sz]er|hd|hq|4k|clean|explicit)[)\]]/gi, '').trim();
    return { title: name || baseName(path), artist: artist };
  }
  function seconds(c) {
    if (c === current && player && isFinite(player.duration) && player.duration > 0) return player.duration;
    return c.item.seconds || 0;
  }
  function setProgress(c, s) {
    var d = seconds(c), f = d ? Math.min(1, Math.max(0, s / d)) : 0;
    c.fill.style.width = (f * 100) + '%';
    c.knob.style.left = (f * 100) + '%';
    c.cur.textContent = fmt(s) === '–:––' ? '0:00' : fmt(s);
    c.bar.setAttribute('aria-valuenow', String(Math.round(s)));
  }
  function paint() {
    var on = !!(player && !player.paused && !player.ended);
    cards.forEach(function (c) {
      var playing = on && c === current;
      c.el.classList.toggle('playing', playing);
      c.el.classList.toggle('current', c === current);
      c.btn.innerHTML = playing ? PAUSE : PLAY;
      c.btn.setAttribute('aria-label', (playing ? 'Pause ' : 'Play ') + c.info.title);
    });
  }
  function notes(run) {
    clearInterval(noteTimer);
    noteTimer = null;
    if (!run || reduceMotion) return;
    noteTimer = setInterval(function () {
      if (!current || !player || player.paused) return;
      var n = make('span', 'note-fly', ['♪', '♫', '♬', '💗'][Math.floor(Math.random() * 4)]);
      n.style.left = (14 + Math.random() * 34) + 'px';
      n.style.setProperty('--dx', (Math.random() * 44 - 12).toFixed(0) + 'px');
      current.el.appendChild(n);
      n.addEventListener('animationend', function () { n.remove(); });
    }, 850);
  }
  function getPlayer() {
    if (player) return player;
    player = new Audio();
    player.preload = 'auto';
    player.addEventListener('play', function () {
      videoEls.forEach(function (v) { if (!v.paused) v.pause(); });
      paint();
      notes(true);
    });
    player.addEventListener('pause', function () { paint(); notes(false); });
    player.addEventListener('ended', function () {
      if (current) setProgress(current, 0);
      paint();
      notes(false);
    });
    player.addEventListener('timeupdate', function () {
      if (current && dragging !== current) setProgress(current, player.currentTime);
    });
    player.addEventListener('loadedmetadata', function () {
      if (!current || !isFinite(player.duration)) return;
      current.dur.textContent = fmt(player.duration);
      current.bar.setAttribute('aria-valuemax', String(Math.round(player.duration)));
    });
    player.addEventListener('error', function () {
      if (current) current.dur.textContent = "can't play 😢";
      paint();
    });
    return player;
  }
  function play() {
    var p = player.play();
    if (p && p.catch) p.catch(function () { paint(); });
    paint();
  }
  function choose(c, at) {
    var p = getPlayer();
    if (current !== c) {
      if (current) setProgress(current, 0);
      current = c;
      p.src = fileUrl(c.item.src);
      if (at > 0) {
        p.addEventListener('loadedmetadata', function once() {
          p.removeEventListener('loadedmetadata', once);
          p.currentTime = at;
        });
      }
    } else if (at !== undefined) {
      p.currentTime = at;
    }
    play();
  }
  function toggle(c) {
    if (current === c && player && !player.paused) player.pause();
    else if (current === c && player) play();
    else choose(c);
  }
  function seekable(c) {
    function frac(e) {
      var r = c.bar.getBoundingClientRect();
      return Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    }
    c.bar.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      dragging = c;
      if (c.bar.setPointerCapture) c.bar.setPointerCapture(e.pointerId);
      setProgress(c, frac(e) * seconds(c));
    });
    c.bar.addEventListener('pointermove', function (e) {
      if (dragging === c) setProgress(c, frac(e) * seconds(c));
    });
    c.bar.addEventListener('pointerup', function (e) {
      if (dragging !== c) return;
      dragging = null;
      var at = frac(e) * seconds(c);
      if (current === c && player) {
        player.currentTime = at;
        if (player.paused) play();
      } else {
        choose(c, at);
      }
    });
    c.bar.addEventListener('pointercancel', function () { dragging = null; });
    c.bar.addEventListener('keydown', function (e) {
      var step = e.key === 'ArrowRight' ? 5 : e.key === 'ArrowLeft' ? -5 : 0;
      if (!step || current !== c || !player) return;
      e.preventDefault();
      player.currentTime = Math.max(0, Math.min(seconds(c) - 0.5, player.currentTime + step));
    });
  }

  if (songs.length) {
    var list = document.getElementById('audio-list');
    songs.forEach(function (item, i) {
      var info = songInfo(item.src);
      var el = make('div', 'song c' + (i % 4));
      var disc = make('div', 'song-disc');
      var art = make('img');
      art.src = 'assets/disc-design.jpg';
      art.alt = '';
      disc.appendChild(art);
      disc.appendChild(make('span', 'song-hole'));
      var mid = make('div', 'song-info');
      var head = make('p', 'song-title');
      head.appendChild(make('span', '', info.title));
      var eq = make('span', 'eq');
      eq.setAttribute('aria-hidden', 'true');
      eq.appendChild(make('i'));
      eq.appendChild(make('i'));
      eq.appendChild(make('i'));
      head.appendChild(eq);
      mid.appendChild(head);
      if (info.artist) mid.appendChild(make('p', 'song-artist', info.artist));
      var bar = make('div', 'song-bar');
      bar.tabIndex = 0;
      bar.setAttribute('role', 'slider');
      bar.setAttribute('aria-label', 'Position in ' + info.title);
      bar.setAttribute('aria-valuemin', '0');
      bar.setAttribute('aria-valuemax', String(Math.round(item.seconds || 0)));
      bar.setAttribute('aria-valuenow', '0');
      var fill = make('span', 'song-fill');
      var knob = make('span', 'song-knob', '♥');
      bar.appendChild(fill);
      bar.appendChild(knob);
      mid.appendChild(bar);
      var time = make('div', 'song-time');
      var cur = make('span', '', '0:00');
      var dur = make('span', '', fmt(item.seconds));
      time.appendChild(cur);
      time.appendChild(dur);
      mid.appendChild(time);
      var btn = make('button', 'song-play');
      btn.type = 'button';
      el.appendChild(disc);
      el.appendChild(mid);
      el.appendChild(btn);
      var c = { el: el, item: item, info: info, btn: btn, bar: bar, fill: fill, knob: knob, cur: cur, dur: dur };
      btn.addEventListener('click', function () { toggle(c); });
      seekable(c);
      cards.push(c);
      list.appendChild(el);
    });
    paint();
    reveal('audio');
  }

  if (data.updated) {
    var made = new Date(data.updated + 'T12:00:00');
    if (!isNaN(made.getTime())) {
      document.getElementById('made-date').textContent =
        '💿 ' + made.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    }
  }

  var viewer = document.getElementById('viewer');
  var viewerImg = document.getElementById('viewer-img');
  var viewerCap = document.getElementById('viewer-cap');
  var shown = 0;

  function showPhoto() {
    var path = photos[shown];
    var t = title(path);
    viewerImg.src = fileUrl(path);
    viewerImg.alt = t || 'Photo ' + (shown + 1);
    viewerCap.textContent = (t ? t + '  ·  ' : '') + (shown + 1) + ' / ' + photos.length;
  }
  function openViewer(i) {
    shown = i;
    showPhoto();
    viewer.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeViewer() {
    viewer.classList.remove('open');
    document.body.style.overflow = '';
  }
  function step(d) {
    shown = (shown + d + photos.length) % photos.length;
    showPhoto();
  }

  document.getElementById('viewer-close').addEventListener('click', closeViewer);
  document.getElementById('viewer-prev').addEventListener('click', function (e) { e.stopPropagation(); step(-1); });
  document.getElementById('viewer-next').addEventListener('click', function (e) { e.stopPropagation(); step(1); });
  viewer.addEventListener('click', function (e) { if (e.target === viewer) closeViewer(); });
  document.addEventListener('keydown', function (e) {
    if (!viewer.classList.contains('open')) return;
    if (e.key === 'Escape') closeViewer();
    else if (e.key === 'ArrowLeft') step(-1);
    else if (e.key === 'ArrowRight') step(1);
  });
  if (photos.length < 2) {
    document.getElementById('viewer-prev').classList.add('hidden');
    document.getElementById('viewer-next').classList.add('hidden');
  }

  if (!reduceMotion) {
    var hearts = ['💕', '💖', '💗', '✨', '🌸'];
    var spawnHeart = function (x, y) {
      var s = make('span', 'heart-sparkle', hearts[Math.floor(Math.random() * hearts.length)]);
      s.style.left = (x - 12) + 'px';
      s.style.top = (y - 16) + 'px';
      s.style.setProperty('--dx', (Math.random() * 60 - 30).toFixed(0) + 'px');
      document.body.appendChild(s);
      s.addEventListener('animationend', function () { s.remove(); });
    };
    document.addEventListener('pointerdown', function (e) {
      var target = e.target;
      if (!target.closest || !target.closest('.card, .disc, .song')) return;
      if (target.closest('a, button, video, audio, .song-bar')) return;
      for (var i = 0; i < 3; i++) {
        (function (d) { setTimeout(function () { spawnHeart(e.clientX, e.clientY); }, d * 90); })(i);
      }
    });
  }
})();
