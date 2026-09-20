(function () {
  var nav = document.getElementById('nav');
  window.addEventListener('scroll', function () {
    nav.classList.toggle('is-scrolled', window.scrollY > 40);
  });

  var navToggle = document.getElementById('navToggle');
  var navLinks = document.querySelector('.nav-links');
  navToggle.addEventListener('click', function () {
    var open = navLinks.style.display === 'flex';
    navLinks.style.display = open ? 'none' : 'flex';
    navLinks.style.flexDirection = 'column';
    navLinks.style.position = 'absolute';
    navLinks.style.top = '64px';
    navLinks.style.right = '20px';
    navLinks.style.background = '#111d33';
    navLinks.style.border = '1px solid #24334d';
    navLinks.style.padding = '16px 22px';
    navLinks.style.gap = '14px';
  });
  document.querySelectorAll('.nav-links a').forEach(function (a) {
    a.addEventListener('click', function () {
      if (window.innerWidth <= 900) navLinks.style.display = 'none';
    });
  });

  var TOKEN_RE = /(\/\/.*$)|("(?:[^"\\]|\\.)*")|\b(void|int|bool|float|double|const|static|class|struct|public|private|namespace|return|if|else|for|while|new|nullptr|true|false|this|virtual|f32|f64|u8|u32|i32)\b|\b(Timer|Engine|SceneManager|Lerp|Image|Color|SDL_Rect|std)\b|\b(\d+\.?\d*f?)\b/gm;

  function highlight(code) {
    return code.replace(TOKEN_RE, function (m, comment, str, kw, ty, num) {
      if (comment) return '<span class="cm">' + comment + '</span>';
      if (str) return '<span class="st">' + str + '</span>';
      if (kw) return '<span class="kw">' + kw + '</span>';
      if (ty) return '<span class="ty">' + ty + '</span>';
      if (num) return '<span class="nu">' + num + '</span>';
      return m;
    });
  }

  document.querySelectorAll('.code-body pre').forEach(function (pre) {
    pre.innerHTML = highlight(pre.textContent);
  });

  var tabLabels = {
    tween: 'Lerp::easeInOut, Lerp::bounce',
    timer: 'Timer::update, Timer::justFinished',
    scene: 'SceneManager::update',
    sprite: 'Engine::drawImage'
  };
  var codeFrameLabel = document.getElementById('codeFrameLabel');
  document.querySelectorAll('.code-tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      var target = tab.getAttribute('data-tab');
      document.querySelectorAll('.code-tab').forEach(function (t) { t.classList.remove('is-active'); });
      document.querySelectorAll('.code-body').forEach(function (b) { b.classList.remove('is-active'); });
      tab.classList.add('is-active');
      document.querySelector('.code-body[data-tab="' + target + '"]').classList.add('is-active');
      codeFrameLabel.textContent = tabLabels[target];
    });
  });

  var canvas = document.getElementById('curveCanvas');
  var ctx = canvas.getContext('2d');
  var wrap = document.getElementById('canvasWrap');
  var readout = document.getElementById('coordReadout');

  var curves = {
    linear: function (t) { return t; },
    easeIn: function (t) { return t * t; },
    easeOut: function (t) { return 1 - (1 - t) * (1 - t); },
    easeInOut: function (t) {
      return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    },
    smoothstep: function (t) {
      t = Math.max(0, Math.min(1, t));
      return t * t * (3 - 2 * t);
    },
    bounce: function (t) {
      var n1 = 7.5625, d1 = 2.75;
      if (t < 1 / d1) return n1 * t * t;
      if (t < 2 / d1) { t -= 1.5 / d1; return n1 * t * t + 0.75; }
      if (t < 2.5 / d1) { t -= 2.25 / d1; return n1 * t * t + 0.9375; }
      t -= 2.625 / d1;
      return n1 * t * t + 0.984375;
    }
  };

  var current = 'linear';
  var duration = 1300;
  var startTime = null;
  var W = 0, H = 0, dpr = window.devicePixelRatio || 1;

  function resize() {
    var rect = canvas.getBoundingClientRect();
    W = rect.width;
    H = rect.height;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', resize);
  resize();

  function draw(t) {
    ctx.clearRect(0, 0, W, H);
    var pad = 26;
    var trackY = H - pad;
    var curve = curves[current];

    ctx.strokeStyle = '#1a2540';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad, trackY);
    ctx.lineTo(W - pad, trackY);
    ctx.stroke();

    ctx.strokeStyle = '#24334d';
    ctx.beginPath();
    var steps = 60;
    for (var i = 0; i <= steps; i++) {
      var tt = i / steps;
      var v = curve(tt);
      var x = pad + tt * (W - pad * 2);
      var y = pad + (1 - v) * (trackY - pad - 20);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();

    var progress = Math.max(0, Math.min(1, t));
    var val = curve(progress);
    var dotX = pad + progress * (W - pad * 2);
    var dotY = pad + (1 - val) * (trackY - pad - 20);

    ctx.fillStyle = '#57d9c8';
    ctx.beginPath();
    ctx.arc(dotX, dotY, 3, 0, Math.PI * 2);
    ctx.fill();

    var spriteX = pad + val * (W - pad * 2);
    ctx.fillStyle = '#ff7a29';
    ctx.fillRect(spriteX - 6, trackY - 6, 12, 12);
  }

  function loop(ts) {
    if (startTime === null) startTime = ts;
    var elapsed = ts - startTime;
    var t = (elapsed % (duration * 2)) / duration;
    if (t > 1) t = 2 - t;
    draw(t);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  document.querySelectorAll('.chip').forEach(function (chip) {
    chip.addEventListener('click', function () {
      document.querySelectorAll('.chip').forEach(function (c) { c.classList.remove('is-active'); });
      chip.classList.add('is-active');
      current = chip.getAttribute('data-curve');
      startTime = null;
    });
  });

  wrap.addEventListener('mousemove', function (e) {
    var rect = wrap.getBoundingClientRect();
    var x = Math.round(e.clientX - rect.left);
    var y = Math.round(e.clientY - rect.top);
    readout.style.opacity = '1';
    readout.style.left = x + 'px';
    readout.style.top = y + 'px';
    readout.textContent = 'x ' + x + ' y ' + y;
  });
  wrap.addEventListener('mouseleave', function () {
    readout.style.opacity = '0';
  });

  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href').slice(1);
      var target = document.getElementById(id);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
})();
