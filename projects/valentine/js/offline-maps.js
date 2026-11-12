(function () {
  var frames = document.querySelectorAll('iframe[src*="google.com/maps"]');
  if (!frames.length) return;

  function placeName(src) {
    var m = /!2s([^!]+)!/.exec(src || '');
    if (!m) return 'our date spot';
    try { return decodeURIComponent(m[1]); } catch (e) { return m[1]; }
  }

  var shown = false;
  function showCards() {
    if (shown) return;
    shown = true;
    var style = document.createElement('style');
    style.textContent =
      '.map-offline{box-sizing:border-box;width:100%;max-width:400px;margin:8px auto 0;padding:22px 16px;' +
      'border:3px dashed #ff9cbc;border-radius:18px;background:#fff0f5;color:#ff006a;text-align:center;}' +
      '.map-offline-pin{font-size:2rem;line-height:1;}' +
      '.map-offline-name{margin-top:8px;font-size:1.25rem;font-weight:700;}' +
      '.map-offline-note{margin-top:6px;font-size:.9rem;opacity:.75;}';
    document.head.appendChild(style);
    for (var i = 0; i < frames.length; i++) {
      var frame = frames[i];
      var card = document.createElement('div');
      card.className = 'map-offline';
      card.innerHTML = '<div class="map-offline-pin">📍</div><div class="map-offline-name"></div>' +
                       '<div class="map-offline-note">The map shows up when you\'re online 🌐</div>';
      card.querySelector('.map-offline-name').textContent = placeName(frame.getAttribute('src'));
      frame.parentNode.replaceChild(card, frame);
    }
  }

  if (navigator.onLine === false) { showCards(); return; }

  var probe = new Image();
  var timer = setTimeout(showCards, 8000);
  probe.onload = function () { clearTimeout(timer); };
  probe.onerror = function () { clearTimeout(timer); showCards(); };
  probe.src = 'https://www.google.com/favicon.ico?disc=' + Date.now();
})();
