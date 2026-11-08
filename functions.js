/* =========================================================
   عيد ميلاد شهدة — السلوك
   كل ما تريد تعديله موجود في CONFIG بالأسفل.
   ========================================================= */
(() => {
  'use strict';

  /* ---------------- الإعدادات ---------------- */
  const CONFIG = {
    birthday: { year: 2005, month: 11, day: 8 },
    password: '0811',
    hintAfterTries: 2,
    hint: 'تلميح 💭 يوم وشهر ميلادكِ',

    // أضيفي/عدّلي الأمنيات (6 بالونات)
    wishes: [
      'أتمنى أن يكون عامك الجديد أخف على قلبك وأحلى على أيامك 🌷',
      'أن تضحكي من قلبك أكثر مما تتعبين 🩵',
      'أن يفتح الله لك أبواب الخير من حيث لا تحتسبين 🤍',
      'أن تكبر أحلامك معك، وتتحقق كلها بإذن الله ✨',
      'أن يحيط بك من يحبك كما تستحقين 🫂',
      'أن تبقى روحك كما هي: نقيةً وطيبةً 🦋',
    ],

    // صور اختيارية: ضعي الصور بجانب الموقع واكتبي مساراتها هنا فيظهر قسم الذكريات
    // مثال: { src: 'photos/1.jpg', caption: 'يوم حلو' }
    photos: [],

    letter: [
      'شهد كل عام وأنتي بألف خير يا بنت الخالي الحرباي، وجودك بحياتي مش بس قرابة، أنتي صديقة قريبة وأخت حبيبة، ومن الناس اللي بعتبرهم سند وضحكة حلوة، الله يجعل عامك الجديد مليان فرح ونجاح وراحة بال، ويحققلك كل اللي بتتمني، بتستاهلي كل الأشياء الحلوة وكل خير، وعقبال سنين كثيرة نضل صحبة وما يحرمني من هبلك يحرباي 🩵',
      'شهد، محظوظ إني عندي بنت خال وبرو مثلك. بعتبرك أختشي اللي مش من دمي، ووجودك دايماً بيخلّي الأيام ألطف والضحكة أحلى. يا رب تضل روحك الحلوة منورة حياة كل اللي حواليك 🌷',
      'كل عام وأنتي بخير يا أختشي وصديقتي وبرو العمر 🤍 شكراً على قربك وعلى كل لحظة حلوة وضحكة شاركناها. الله يحفظك ويكتب لك عام مليان خير وفرح، وتضلي دايماً غالية على قلبي وعلى العيلة كلها 🦋',
    ],

    cards: ['🩵', '🫂', '🎂', '🌷', '🦋', '🎁'],
  };

  /* ---------------- أدوات ---------------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const root = document.documentElement;
  const body = document.body;
  const rand = (a, b) => a + Math.random() * (b - a);
  const pad2 = (n) => String(n).padStart(2, '0');
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } },
  };
  const reduceMQ = matchMedia('(prefers-reduced-motion: reduce)');
  const buzz = (p) => { try { navigator.vibrate && navigator.vibrate(p); } catch (e) { /* ignore */ } };

  /* ---------------- 1) قراءة الجهاز والتأقلم معه ---------------- */
  const env = { w: 0, h: 0, lite: 1 };
  function readEnv() {
    const w = window.innerWidth, h = window.innerHeight;
    const coarse = matchMedia('(pointer: coarse)').matches;
    env.w = w; env.h = h;
    root.dataset.device = w < 700 ? 'phone' : w < 1024 ? 'tablet' : 'desktop';
    root.dataset.orient = w > h ? 'landscape' : 'portrait';
    root.dataset.input = coarse ? 'touch' : 'mouse';
    root.dataset.compact = h < 520 ? '1' : '0';
    root.dataset.motion = reduceMQ.matches ? 'reduced' : 'full';
    root.dataset.standalone = (matchMedia('(display-mode: standalone)').matches || navigator.standalone) ? '1' : '0';
    root.style.setProperty('--vh', (h * 0.01) + 'px');

    // أجهزة ضعيفة أو توفير بيانات → جسيمات أقل
    const c = navigator.connection;
    const weak = (navigator.hardwareConcurrency || 4) <= 4 || (c && c.saveData);
    env.lite = reduceMQ.matches ? 0.25 : (root.dataset.device === 'phone' || weak) ? 0.6 : 1;
  }
  let envTimer = 0;
  function onEnvChange() {
    clearTimeout(envTimer);
    envTimer = setTimeout(() => { readEnv(); sky.resize(); fx.resize(); }, 120);
  }
  window.addEventListener('resize', onEnvChange, { passive: true });
  window.addEventListener('orientationchange', onEnvChange, { passive: true });
  if (reduceMQ.addEventListener) reduceMQ.addEventListener('change', onEnvChange);
  readEnvSafe();
  function readEnvSafe() { readEnv(); }

  /* ---------------- 2) سماء النجوم (تتحرك مع الماوس/اللمس/ميلان الجهاز) ---------------- */
  const sky = (() => {
    const c = $('#sky'), x = c.getContext('2d');
    let W = 0, H = 0, dpr = 1, stars = [], shoot = null, nextShoot = 3000;
    let px = 0, py = 0, tx = 0, ty = 0, raf = 0;

    function resize() {
      const nw = window.innerWidth, nh = window.innerHeight;
      // شريط العنوان في الموبايل يغيّر الارتفاع قليلاً: لا نعيد التوليد إلا لتغيّر حقيقي
      if (stars.length && nw === W && Math.abs(nh - H) < 140) return;
      W = nw; H = nh;
      dpr = Math.min(window.devicePixelRatio || 1, root.dataset.device === 'phone' ? 1.5 : 2);
      c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
      x.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round((W * H) / 5500 * env.lite);
      stars = Array.from({ length: n }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        r: rand(0.3, 1.5), z: rand(0.15, 1), p: rand(0, 6.28), s: rand(0.5, 1.8),
        c: Math.random() < 0.18 ? '255,170,210' : Math.random() < 0.3 ? '255,226,170' : '255,255,255',
      }));
      draw(performance.now());
    }

    function draw(t) {
      x.clearRect(0, 0, W, H);
      px += (tx - px) * 0.06; py += (ty - py) * 0.06;
      for (const s of stars) {
        const a = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(t * 0.0012 * s.s + s.p));
        const X = (s.x + px * s.z * 26 + W) % W, Y = (s.y + py * s.z * 26 + H) % H;
        x.fillStyle = 'rgba(' + s.c + ',' + a.toFixed(2) + ')';
        x.beginPath(); x.arc(X, Y, s.r, 0, 6.283); x.fill();
      }
      if (!reduceMQ.matches) {
        if (!shoot && t > nextShoot) {
          shoot = { x: rand(W * 0.2, W), y: rand(0, H * 0.4), vx: -rand(7, 11), vy: rand(3, 5), life: 1 };
          nextShoot = t + rand(5000, 11000);
        }
        if (shoot) {
          const g = x.createLinearGradient(shoot.x, shoot.y, shoot.x - shoot.vx * 7, shoot.y - shoot.vy * 7);
          g.addColorStop(0, 'rgba(255,255,255,' + shoot.life + ')'); g.addColorStop(1, 'rgba(255,255,255,0)');
          x.strokeStyle = g; x.lineWidth = 2; x.beginPath();
          x.moveTo(shoot.x, shoot.y); x.lineTo(shoot.x - shoot.vx * 7, shoot.y - shoot.vy * 7); x.stroke();
          shoot.x += shoot.vx; shoot.y += shoot.vy; shoot.life -= 0.014;
          if (shoot.life <= 0) shoot = null;
        }
      }
    }

    function loop(t) { draw(t); raf = requestAnimationFrame(loop); }
    function start() { if (!raf && !reduceMQ.matches && !document.hidden) raf = requestAnimationFrame(loop); }
    function stop() { cancelAnimationFrame(raf); raf = 0; }

    window.addEventListener('pointermove', (e) => {
      tx = (e.clientX / (W || 1) - 0.5) * 2; ty = (e.clientY / (H || 1) - 0.5) * 2;
    }, { passive: true });
    window.addEventListener('deviceorientation', (e) => {
      if (e.gamma == null) return;
      tx = Math.max(-1, Math.min(1, e.gamma / 30));
      ty = Math.max(-1, Math.min(1, ((e.beta || 0) - 45) / 30));
    }, { passive: true });
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));

    return { resize, start };
  })();

  /* ---------------- 3) المؤثرات: قصاصات ورق وألعاب نارية ---------------- */
  const fx = (() => {
    const c = $('#fx'), x = c.getContext('2d');
    let W = 0, H = 0, dpr = 1, parts = [], raf = 0;
    const COLORS = ['#ff7eb6', '#ffd9a0', '#9bdcff', '#ffffff', '#ffb86b', '#c9a7ff'];

    function resize() {
      W = window.innerWidth; H = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
      x.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    const count = (n) => Math.max(6, Math.round(n * env.lite));

    function push(p) { parts.push(p); if (!raf) raf = requestAnimationFrame(tick); }

    function confetti(cx, cy, n = 90, spread = 1) {
      for (let i = 0; i < count(n); i++) {
        const a = rand(-Math.PI, 0) * spread - (spread < 1 ? Math.PI / 2 * (1 - spread) : 0);
        const sp = rand(5, 14);
        push({ k: 'rect', x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: 0.28, drag: 0.985,
          w: rand(6, 11), h: rand(4, 7), rot: rand(0, 6.28), vr: rand(-0.3, 0.3), wob: rand(0, 6.28),
          life: 1, decay: rand(0.004, 0.008), col: COLORS[(Math.random() * COLORS.length) | 0] });
      }
    }
    // مطر قصاصات من الأعلى
    function rain(n = 120) {
      for (let i = 0; i < count(n); i++) {
        push({ k: 'rect', x: rand(0, W), y: rand(-H * 0.4, -10), vx: rand(-1.2, 1.2), vy: rand(2, 5), g: 0.02, drag: 0.999,
          w: rand(6, 11), h: rand(4, 7), rot: rand(0, 6.28), vr: rand(-0.2, 0.2), wob: rand(0, 6.28),
          life: 1, decay: rand(0.0035, 0.006), col: COLORS[(Math.random() * COLORS.length) | 0] });
      }
    }
    function cannons() {
      confetti(0, H, 80, 0.5); confetti(W, H, 80, 0.5);
    }
    function sparks(cx, cy, n = 22, col) {
      for (let i = 0; i < count(n); i++) {
        const a = rand(0, 6.28), sp = rand(2, 7);
        push({ k: 'spark', x: cx, y: cy, px: cx, py: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: 0.12, drag: 0.97,
          life: 1, decay: rand(0.02, 0.035), col: col || COLORS[(Math.random() * COLORS.length) | 0], r: rand(1.4, 2.6) });
      }
    }
    function firework(cx, cy) {
      const col = COLORS[(Math.random() * 5) | 0];
      for (let i = 0; i < count(70); i++) {
        const a = (i / count(70)) * 6.283 + rand(-0.05, 0.05), sp = rand(3, 8.5);
        push({ k: 'spark', x: cx, y: cy, px: cx, py: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: 0.07, drag: 0.968,
          life: 1, decay: rand(0.011, 0.018), col: Math.random() < 0.3 ? '#ffffff' : col, r: 2 });
      }
    }
    function show(n = 5) {
      for (let i = 0; i < n; i++) setTimeout(() => firework(rand(W * 0.15, W * 0.85), rand(H * 0.15, H * 0.5)), i * 380);
    }

    function tick() {
      x.clearRect(0, 0, W, H);
      for (const p of parts) {
        p.px = p.x; p.py = p.y;
        p.vx *= p.drag; p.vy = p.vy * p.drag + p.g;
        p.x += p.vx; p.y += p.vy; p.life -= p.decay;
        if (p.k === 'rect') {
          p.rot += p.vr; p.wob += 0.15;
          x.save(); x.globalAlpha = Math.max(0, Math.min(1, p.life * 1.4));
          x.translate(p.x, p.y); x.rotate(p.rot); x.scale(1, Math.cos(p.wob));
          x.fillStyle = p.col; x.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); x.restore();
        } else {
          x.globalAlpha = Math.max(0, p.life);
          x.strokeStyle = p.col; x.lineWidth = p.r; x.lineCap = 'round';
          x.beginPath(); x.moveTo(p.px, p.py); x.lineTo(p.x, p.y); x.stroke();
        }
      }
      x.globalAlpha = 1;
      parts = parts.filter((p) => p.life > 0 && p.y < H + 40);
      if (parts.length) raf = requestAnimationFrame(tick);
      else { raf = 0; x.clearRect(0, 0, W, H); }
    }
    return { resize, confetti, rain, cannons, sparks, firework, show, get W() { return W; }, get H() { return H; } };
  })();

  /* ---------------- 4) الموسيقى ---------------- */
  const music = (() => {
    const el = $('#birthdayAudio'), btn = $('#musicToggle');
    const VOL = 0.35;
    let on = false, wasOn = false, fadeT = 0;

    function ui() {
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      btn.setAttribute('aria-label', on ? 'كتم الموسيقى' : 'تشغيل الموسيقى');
      btn.title = on ? 'كتم الموسيقى' : 'تشغيل الموسيقى';
    }
    function fade(to, ms = 600, done) {
      clearInterval(fadeT);
      const from = el.volume, steps = 12; let i = 0;
      fadeT = setInterval(() => {
        i++; el.volume = Math.max(0, Math.min(1, from + (to - from) * (i / steps)));
        if (i >= steps) { clearInterval(fadeT); done && done(); }
      }, ms / steps);
    }
    async function start() {
      try { el.volume = 0; await el.play(); on = true; ui(); fade(VOL, 900); return true; }
      catch (e) { on = false; ui(); return false; }
    }
    function stop() { on = false; ui(); fade(0, 400, () => el.pause()); }
    function duck(v) { if (on) fade(v == null ? VOL : v, 250); }
    btn.addEventListener('click', () => (on ? stop() : start()));
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { wasOn = on; if (on) { el.pause(); } }
      else if (wasOn) { el.play().catch(() => {}); }
    });
    ui();
    return { start, stop, duck, get on() { return on; } };
  })();

  /* ---------------- 5) التواريخ والعدّادات ---------------- */
  const B = CONFIG.birthday;
  const jordanDateFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Amman',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });
  function jordanDateParts(date) {
    const values = {};
    for (const part of jordanDateFormatter.formatToParts(date)) {
      if (part.type !== 'literal') values[part.type] = Number(part.value);
    }
    return values;
  }
  function jordanDateTime(year, month, day) {
    const target = Date.UTC(year, month - 1, day);
    let timestamp = target;
    for (let i = 0; i < 3; i++) {
      const local = jordanDateParts(new Date(timestamp));
      const represented = Date.UTC(local.year, local.month - 1, local.day, local.hour, local.minute, local.second);
      timestamp += target - represented;
    }
    return new Date(timestamp);
  }
  const birthDate = jordanDateTime(B.year, B.month, B.day);
  const isBirthdayToday = (date = new Date()) => {
    const today = jordanDateParts(date);
    return today.month === B.month && today.day === B.day;
  };

  function ageNow() {
    const today = jordanDateParts(new Date());
    let a = today.year - B.year;
    if (today.month < B.month || (today.month === B.month && today.day < B.day)) a--;
    return Math.max(a, 0);
  }
  function nextBirthday(now = new Date()) {
    const year = jordanDateParts(now).year;
    let date = jordanDateTime(year, B.month, B.day);
    if (date <= now) date = jordanDateTime(year + 1, B.month, B.day);
    return date;
  }
  function parts(ms) {
    ms = Math.max(0, ms);
    const s = Math.floor(ms / 1000);
    return { d: Math.floor(s / 86400), h: Math.floor(s % 86400 / 3600), m: Math.floor(s % 3600 / 60), s: s % 60 };
  }
  const fmtNum = (n) => n.toLocaleString('en-US');
  function paintClock(el, p) {
    for (const k of ['d', 'h', 'm', 's']) {
      const dd = $('[data-u="' + k + '"]', el);
      const v = k === 'd' ? fmtNum(p[k]) : pad2(p[k]);
      if (dd && dd.textContent !== v) dd.textContent = v;
    }
  }
  let clockT = 0;
  function startClocks() {
    clearInterval(clockT);
    const tick = () => {
      const now = new Date();
      paintClock($('#sinceClock'), parts(now - birthDate));
      paintClock($('#nextClock'), parts(nextBirthday(now) - now));
    };
    tick(); clockT = setInterval(tick, 1000);
  }
  function countUp(el, to, ms = 1400) {
    if (reduceMQ.matches) { el.textContent = to; return; }
    const t0 = performance.now();
    (function step(t) {
      const k = Math.min(1, (t - t0) / ms);
      el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(step);
    })(t0);
  }

  /* ---------------- 6) البوابة + لوحة الرقم السري ---------------- */
  const gate = $('#gate');
  const pinDots = $('#pinDots'), pinMsg = $('#pinMsg');
  let pin = '', tries = 0, busy = false;

  function setStage(s) { body.dataset.stage = s; gate.dataset.stage = s; }

  function paintPin() {
    $$('i', pinDots).forEach((d, i) => d.classList.toggle('on', i < pin.length));
    pinDots.setAttribute('aria-label', 'كلمة السر: أُدخل ' + pin.length + ' من 4');
  }
  function pressKey(k) {
    if (busy) return;
    if (k === 'back') pin = pin.slice(0, -1);
    else if (k === 'ok') { if (pin.length === 4) return submitPin(); pinMsg.textContent = 'اكتبي 4 أرقام'; pinMsg.classList.remove('hint'); return; }
    else if (pin.length < 4) pin += k;
    pinMsg.textContent = '';
    paintPin();
    buzz(8);
    if (pin.length === 4) setTimeout(submitPin, 180);
  }
  function submitPin() {
    if (busy || pin.length !== 4) return;
    if (pin === CONFIG.password) return unlock();
    tries++;
    buzz([70, 50, 70]);
    pinDots.classList.remove('shake'); void pinDots.offsetWidth; pinDots.classList.add('shake');
    pinMsg.classList.remove('hint');
    pinMsg.textContent = 'كلمة المرور غير صحيحة';
    pin = '';
    setTimeout(paintPin, 380);
    if (tries >= CONFIG.hintAfterTries) setTimeout(() => { pinMsg.textContent = CONFIG.hint; pinMsg.classList.add('hint'); }, 1100);
  }
  function unlock() {
    busy = true;
    pinDots.classList.add('ok');
    pinMsg.textContent = '';
    $('#lockTitle').textContent = 'الهدية جاهزة الآن!';
    $('#lockLabel').textContent = 'افتحي…';
    gate.classList.add('is-open');
    buzz([30, 40, 90]);
    setTimeout(() => fx.confetti(fx.W / 2, fx.H * 0.38, 110), 450);
    setTimeout(reveal, 1700);
  }

  $('#keypad').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-k]');
    if (b) pressKey(b.dataset.k);
  });
  document.addEventListener('keydown', (e) => {
    if (gate.dataset.stage !== 'lock' || e.ctrlKey || e.metaKey || e.altKey) return;
    // يدعم الأرقام العربية-الهندية ٠-٩ أيضاً
    const ar = '٠١٢٣٤٥٦٧٨٩'.indexOf(e.key);
    const k = ar > -1 ? String(ar) : e.key;
    if (/^[0-9]$/.test(k)) { pressKey(k); e.preventDefault(); }
    else if (k === 'Backspace') { pressKey('back'); e.preventDefault(); }
    else if (k === 'Enter') { pressKey('ok'); e.preventDefault(); }
  });

  $('#startCelebration').addEventListener('click', async () => {
    music.start();
    // iOS يطلب إذناً صريحاً لحساسات الميلان
    try {
      if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function') {
        await DeviceOrientationEvent.requestPermission();
      }
    } catch (e) { /* ignore */ }
    setStage('lock');
    pin = ''; paintPin();
  });

  /* ---------------- 7) الكشف عن القصة ---------------- */
  const story = $('#story');
  function reveal() {
    gate.classList.add('is-gone');
    story.inert = false;
    setStage('story');
    window.scrollTo(0, 0);
    countUp($('#ageValue'), ageNow());
    buildCandles();
    startClocks();
    if (isBirthdayToday()) { $('#todayBanner').hidden = false; setTimeout(() => { fx.rain(160); fx.show(4); }, 900); }
    else setTimeout(() => fx.rain(70), 700);
  }

  /* ---------------- 8) الكيكة والشمعة (نفخ بالمايك أو لمس) ---------------- */
  const cake = $('#cake'), cakeStatus = $('#cakeStatus');
  const blowBtn = $('#blowBtn'), relightBtn = $('#relightBtn'), blowHint = $('#blowHint');
  const canMic = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.isSecureContext);
  let mic = null;

  function buildCandles() {
    const box = $('#candles');
    if (box.childElementCount) return;
    for (const ch of String(ageNow())) {
      const c = document.createElement('button');
      c.type = 'button'; c.className = 'ncandle'; c.setAttribute('aria-label', 'شمعة، اضغطي لإطفائها');
      c.innerHTML = '<i class="flame"></i><b>' + ch + '</b>';
      c.addEventListener('click', blowOut);
      box.appendChild(c);
    }
  }
  function blowOut() {
    if (cake.classList.contains('is-out')) return;
    stopMic();
    cake.classList.remove('listening'); cake.classList.add('is-out');
    cakeStatus.textContent = 'تمنّيتي؟ الله يحقق لك كل أمنية 🤍';
    blowBtn.hidden = true; blowHint.hidden = true; relightBtn.hidden = false;
    buzz([40, 30, 40]);
    const r = cake.getBoundingClientRect();
    setTimeout(() => { fx.show(4); fx.confetti(r.left + r.width / 2, r.top + 40, 90); }, 250);
  }
  function relight() {
    cake.classList.remove('is-out');
    cakeStatus.textContent = 'غمضي عيونك، اتمني أمنية… انفخي الشمعة.';
    relightBtn.hidden = true; blowHint.hidden = false; blowBtn.hidden = !canMic;
  }
  async function startMic() {
    if (mic) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: false } });
      const AC = window.AudioContext || window.webkitAudioContext;
      const ctx = new AC(); const src = ctx.createMediaStreamSource(stream);
      const an = ctx.createAnalyser(); an.fftSize = 1024; src.connect(an);
      const buf = new Uint8Array(an.fftSize);
      mic = { stream, ctx, raf: 0 };
      cake.classList.add('listening');
      cakeStatus.textContent = 'أنا أسمعك… انفخي 💨';
      blowBtn.disabled = true;
      music.duck(0.05);
      let base = 0, n = 0, hot = 0; const t0 = performance.now();
      const loop = () => {
        an.getByteTimeDomainData(buf);
        let s = 0; for (let i = 0; i < buf.length; i++) { const v = (buf[i] - 128) / 128; s += v * v; }
        const rms = Math.sqrt(s / buf.length);
        if (performance.now() - t0 < 500) { base += rms; n++; }          // معايرة ضجيج الغرفة
        else {
          const th = Math.max(0.12, (base / Math.max(n, 1)) * 3.2);
          hot = rms > th ? hot + 1 : Math.max(0, hot - 1);
          if (hot > 7) return blowOut();                                 // نفخ مستمر ≈ 120ms+
        }
        if (mic) mic.raf = requestAnimationFrame(loop);
      };
      mic.raf = requestAnimationFrame(loop);
      mic.timeout = setTimeout(() => { if (mic) { stopMic(); cakeStatus.textContent = 'ما سمعتكِ 😅 جرّبي ثانية أو اضغطي على الشمعة.'; } }, 20000);
    } catch (e) {
      cakeStatus.textContent = 'ما قدرت أستخدم المايك — اضغطي على الشمعة مباشرة 🕯️';
      blowBtn.hidden = true;
    }
  }
  function stopMic() {
    if (!mic) return;
    cancelAnimationFrame(mic.raf); clearTimeout(mic.timeout);
    mic.stream.getTracks().forEach((t) => t.stop());
    try { mic.ctx.close(); } catch (e) { /* ignore */ }
    mic = null; blowBtn.disabled = false; cake.classList.remove('listening'); music.duck();
  }
  blowBtn.hidden = !canMic;
  blowBtn.addEventListener('click', startMic);
  relightBtn.addEventListener('click', relight);

  /* ---------------- 9) بالونات الأمنيات ---------------- */
  const stage = $('#balloonStage'), wishOut = $('#wishOut'), wishCount = $('#wishCount'), balloonsReset = $('#balloonsReset');
  const BALLOON_COLORS = ['#ff7eb6', '#9bdcff', '#ffd9a0', '#c9a7ff', '#7fe3c1', '#ff9a8b'];
  let popped = 0;
  function buildBalloons() {
    stage.innerHTML = ''; popped = 0; wishCount.textContent = '0';
    $('#wishTotal').textContent = CONFIG.wishes.length;
    wishOut.textContent = 'اضغطي على أي بالون 🎈'; balloonsReset.hidden = true;
    const n = CONFIG.wishes.length;
    CONFIG.wishes.forEach((w, i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'balloon'; b.setAttribute('aria-label', 'بالون أمنية ' + (i + 1));
      const per = 3, col = i % per, row = Math.floor(i / per), rows = Math.ceil(n / per);
      const x = (n <= 3 ? 20 + i * 30 : 18 + col * 32) + rand(-5, 5);
      const y = n <= 3 ? rand(20, 40) : 6 + row * (100 / rows - 8) + rand(0, 6);
      b.style.cssText = '--c:' + BALLOON_COLORS[i % BALLOON_COLORS.length] + ';--x:' + x + '%;--y:' + Math.min(y, 70) + '%;--t:' + rand(3, 5).toFixed(1) + 's;--d:-' + rand(0, 3).toFixed(1) + 's';
      b.addEventListener('click', () => pop(b, w));
      stage.appendChild(b);
    });
  }
  function pop(b, wish) {
    if (b.classList.contains('popped')) return;
    const r = b.getBoundingClientRect();
    b.classList.add('popped');
    fx.sparks(r.left + r.width / 2, r.top + r.height / 2, 26, getComputedStyle(b).getPropertyValue('--c').trim());
    buzz(20);
    wishOut.textContent = wish; wishOut.classList.remove('pop'); void wishOut.offsetWidth; wishOut.classList.add('pop');
    wishCount.textContent = ++popped;
    if (popped === CONFIG.wishes.length) { balloonsReset.hidden = false; fx.confetti(r.left + r.width / 2, r.top, 80); }
  }
  balloonsReset.addEventListener('click', buildBalloons);

  /* ---------------- 10) لعبة الذاكرة ---------------- */
  const grid = $('#memoryGrid'), gStatus = $('#gameStatus'), gPrompt = $('#gamePrompt');
  const gMoves = $('#gMoves'), gTime = $('#gTime'), gBest = $('#gBest');
  let first = null, lockBoard = false, matched = 0, moves = 0, secs = 0, timer = 0, won = false, wrongT = 0;

  function paintBest() { const b = store.get('shahd-best'); gBest.textContent = b ? b + ' حركة' : '—'; }
  function buildGame() {
    clearInterval(timer); clearTimeout(wrongT); timer = 0;
    first = null; lockBoard = false; matched = 0; moves = 0; secs = 0;
    gMoves.textContent = '0'; gTime.textContent = '0:00'; gStatus.textContent = ''; gStatus.classList.remove('wrong');
    gPrompt.textContent = won ? 'الرسالة مفتوحة 🤍 العبي مرة ثانية للتسلية.' : 'اكتشف الأزواج المتطابقة 💞 ومن يفوز يفتح الرسالة.';
    const deck = [...CONFIG.cards, ...CONFIG.cards];
    for (let i = deck.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [deck[i], deck[j]] = [deck[j], deck[i]]; }
    grid.innerHTML = '';
    deck.forEach((v, i) => {
      const c = document.createElement('button');
      c.type = 'button'; c.className = 'mcard'; c.dataset.v = v; c.setAttribute('aria-label', 'بطاقة ' + (i + 1));
      c.innerHTML = '<span class="face back">✦</span><span class="face front">' + v + '</span>';
      c.addEventListener('click', () => flip(c));
      grid.appendChild(c);
    });
    paintBest();
  }
  function flip(c) {
    if (lockBoard || c === first || c.classList.contains('matched') || c.classList.contains('revealed')) return;
    if (!timer) timer = setInterval(() => { secs++; gTime.textContent = Math.floor(secs / 60) + ':' + pad2(secs % 60); }, 1000);
    c.classList.add('revealed'); c.setAttribute('aria-label', c.dataset.v);
    buzz(6);
    if (!first) { first = c; return; }
    moves++; gMoves.textContent = moves;
    const a = first, b = c; first = null;
    if (a.dataset.v === b.dataset.v) {
      [a, b].forEach((k) => { k.classList.replace('revealed', 'matched'); k.disabled = true; });
      if (++matched === CONFIG.cards.length) win();
      return;
    }
    lockBoard = true;
    gStatus.textContent = 'مش هاد جربي مرة تانية😜'; gStatus.classList.add('wrong');
    wrongT = setTimeout(() => {
      [a, b].forEach((k) => { k.classList.remove('revealed'); k.setAttribute('aria-label', 'بطاقة'); });
      lockBoard = false; gStatus.textContent = ''; gStatus.classList.remove('wrong');
    }, 750);
  }
  function win() {
    clearInterval(timer); timer = 0;
    gStatus.textContent = 'كفوووو عليكييي👏';
    const best = parseInt(store.get('shahd-best') || '0', 10);
    if (!best || moves < best) { store.set('shahd-best', String(moves)); paintBest(); gStatus.textContent += ' — رقم قياسي جديد!'; }
    const r = grid.getBoundingClientRect();
    fx.confetti(r.left + r.width / 2, r.top + r.height / 2, 110);
    buzz([40, 40, 80]);
    setTimeout(openLetter, 1300);
  }
  $('#gameReset').addEventListener('click', buildGame);

  /* ---------------- 11) الرسالة (آلة كاتبة قابلة للتخطي) ---------------- */
  const letter = $('#letter'), letterBody = $('#letterBody'), sealed = $('#sealed');
  let typeRaf = 0;
  function openLetter() {
    if (won) return;
    won = true;
    sealed.classList.add('opened');
    letter.hidden = false; letter.classList.remove('done');
    letterBody.innerHTML = '';
    letter.scrollIntoView({ behavior: reduceMQ.matches ? 'auto' : 'smooth', block: 'start' });
    setTimeout(typeLetter, 900);
  }
  function typeLetter() {
    const paras = CONFIG.letter.map(() => { const p = document.createElement('p'); letterBody.appendChild(p); return p; });
    const cursor = document.createElement('span'); cursor.className = 'cursor';
    let pi = 0, ci = 0, last = performance.now();
    cancelAnimationFrame(typeRaf);
    const step = (t) => {
      // سرعة مستقلة عن معدل الإطارات: ~55 حرفاً/ثانية
      const add = Math.max(1, Math.round((t - last) / 18)); last = t;
      const txt = CONFIG.letter[pi];
      ci = Math.min(txt.length, ci + add);
      paras[pi].textContent = txt.slice(0, ci);
      paras[pi].appendChild(cursor);
      if (ci >= txt.length) { pi++; ci = 0; }
      if (pi >= paras.length) return finishLetter();
      typeRaf = requestAnimationFrame(step);
    };
    typeRaf = requestAnimationFrame(step);
  }
  function finishLetter() {
    cancelAnimationFrame(typeRaf);
    letterBody.innerHTML = '';
    CONFIG.letter.forEach((t) => { const p = document.createElement('p'); p.textContent = t; letterBody.appendChild(p); });
    letter.classList.add('done');
  }
  $('#letterSkip').addEventListener('click', finishLetter);

  /* ---------------- 12) الصور (اختياري) ---------------- */
  if (CONFIG.photos.length) {
    const g = $('#gallery');
    CONFIG.photos.forEach((ph) => {
      const f = document.createElement('figure');
      const img = new Image(); img.src = ph.src; img.alt = ph.caption || 'ذكرى'; img.loading = 'lazy'; img.decoding = 'async';
      f.appendChild(img);
      if (ph.caption) { const c = document.createElement('figcaption'); c.textContent = ph.caption; f.appendChild(c); }
      g.appendChild(f);
    });
    $('#galleryChapter').hidden = false;
  }

  /* ---------------- 13) إعادة فتح الهدية ---------------- */
  $('#replayGift').addEventListener('click', () => {
    stopMic(); cancelAnimationFrame(typeRaf); clearInterval(clockT);
    story.inert = true;
    won = false; sealed.classList.remove('opened'); letter.hidden = true;
    cake.classList.remove('is-out'); relight();
    buildBalloons(); buildGame();
    pin = ''; tries = 0; busy = false; paintPin();
    pinDots.classList.remove('ok', 'shake'); pinMsg.textContent = '';
    $('#lockTitle').textContent = 'جاهزة تفتحي هديتك؟ 🤍'; $('#lockLabel').textContent = 'تاريخ ميلادكِ 🎂';
    gate.classList.remove('is-open', 'is-gone');
    setStage('lock');
    window.scrollTo(0, 0);
  });

  /* ---------------- تشغيل ---------------- */
  fx.resize(); sky.resize(); sky.start();
  buildBalloons(); buildGame(); paintPin();

  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
})();
