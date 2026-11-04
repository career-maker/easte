// Hero: zoom through the logo into the plantation, then three packs rise in one by one.

// ---------- smooth (inertial) scrolling: wheel steps are eased instead of jumping ----------
let lenis = null;
if (window.Lenis && window.gsap && window.ScrollTrigger && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  lenis = new Lenis({ lerp: 0.075, wheelMultiplier: 0.85, smoothWheel: true }); window.lenis = lenis;   // touch keeps native momentum
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
(() => {
  // Intro: white sheet with the logo punched out; scroll zooms into the logo's thickest stroke until the plantation fills the screen.
  const cv = document.querySelector('.intro'), cx = cv.getContext('2d'), state = { z: 0 };
  let logo = null;                                                // Path2D of assets/logo.svg: stays razor sharp at any zoom
  fetch('assets/logo.svg?v=20261104g').then(r => r.text()).then(t => { logo = new Path2D(/ d="([^"]+)"/.exec(t)[1]); draw(); });
  const FX = 385, FY = 149, FR = 12.4, LW = 760, LH = 225;       // focus = thickest stroke near the logo centre (inscribed radius FR px): zooming into it fills the screen with plantation
  const draw = () => {
    if (!logo) return;
    const d = Math.min(devicePixelRatio || 1, 2), W = cv.clientWidth, H = cv.clientHeight;
    if (cv.width !== Math.round(W * d)) { cv.width = Math.round(W * d); cv.height = Math.round(H * d); }
    const k = (W < 900 ? W * .74 : Math.min(W * .34, H * .62 * LW / LH)) / LW, z = state.z, s = Math.pow(Math.hypot(W, H) / 2 / (FR * k) * 1.08, z), g = Math.min(1, z * 1.7);
    const ix = W / 2 - LW * k / 2 + FX * k, iy = H / 2 - LH * k / 2 + FY * k;     // focus point, resting position
    const ax = ix + (W / 2 - ix) * g, ay = iy + (H / 2 - iy) * g;                  // glides to screen centre early, so the zoom stays centred
    cx.setTransform(d, 0, 0, d, 0, 0); cx.globalCompositeOperation = 'source-over'; cx.clearRect(0, 0, W, H);
    cx.fillStyle = '#fff'; cx.fillRect(0, 0, W, H);
    cx.setTransform(d * k * s, 0, 0, d * k * s, d * (ax - FX * k * s), d * (ay - FY * k * s));
    cx.globalCompositeOperation = 'destination-out'; cx.fillStyle = '#000'; cx.fill(logo, 'evenodd');   // logo strokes = window onto the plantation
  };
  addEventListener('resize', draw);
  window.__introDraw = draw; window.__introState = state;

  const packs = gsap.utils.toArray('.pack');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // leaves from the supplied pack: [file, x, y, width, rotation, blur, layer] in 1920-wide design units
  const L = [
    [1,40,150,430,-25,9,'back'],[4,520,170,340,40,0,'back'],[8,800,215,95,12,0,'back'],[5,680,410,210,70,0,'back'],
    [11,820,440,300,-15,0,'back'],[2,1560,330,210,-8,0,'back'],[6,1440,60,150,30,3,'back'],[0,860,700,240,-30,0,'back'],
    [9,980,80,130,55,5,'front'],[10,1800,560,150,-20,0,'front'],[3,1200,820,150,20,4,'front'],[7,-60,640,220,-60,6,'front'],
  ];
  const leafEls = L.map(([f, x, y, w, r, b, layer]) => {
    const n = new Image(); n.src = `assets/leaves/l${String(f).padStart(2, '0')}${b ? 'b' : ''}.webp`; n.alt = '';
    Object.assign(n.style, { left: `calc(${x}*var(--u))`, top: `calc(${y}*var(--u))`, width: `calc(${w}*var(--u))` });
    n.dataset.r = r;
    document.querySelector('.leaves--' + layer).appendChild(n);
    return n;
  });

  // coffee beans for the Kaapi theme: [file, x, y, width, rotation, blurred, layer]
  const B = [
    [0,40,170,300,-30,1,'back'],[4,520,40,200,-15,0,'back'],[8,230,10,190,40,1,'back'],
    [1,60,860,150,-40,1,'back'],[7,380,20,210,20,0,'back'],[11,640,60,170,70,0,'back'],
    [9,1470,40,170,25,0,'front'],[10,1700,120,170,-35,0,'front'],[4,1540,230,160,60,0,'back'],[7,1800,360,150,15,0,'front'],
    [13,1300,30,110,0,1,'back'],[8,1830,10,160,50,0,'front'],
  ];
  const beanEls = B.map(([f, x, y, w, r, bl, layer]) => {
    const n = new Image(); n.src = `assets/beans/b${String(f).padStart(2, '0')}${bl ? 'b' : ''}.webp`; n.alt = '';
    Object.assign(n.style, { left: `calc(${x}*var(--u))`, top: `calc(${y}*var(--u))`, width: `calc(${w}*var(--u))` });
    n.dataset.r = r;
    document.querySelector('.beans--' + layer).appendChild(n);
    return n;
  });
  // Harmony (green) theme: one big leaf burst swirling round the packs (mirrored art, so it gathers on the right)
  const G = [['burstr', 640, -170, 1300, 0, 'back']];
  const gEls = G.map(([f, x, y, w, r, layer]) => {
    const n = new Image(); n.src = `assets/gleaves/${f}.webp?v=20261104g`; n.alt = ''; n.className = 'g burst';
    Object.assign(n.style, { left: `calc(${x}*var(--u))`, top: `calc(${y}*var(--u))`, width: `calc(${w}*var(--u))` });
    n.dataset.r = r;
    document.querySelector('.leaves--' + layer).appendChild(n);
    return n;
  });
  const fall = leafEls.concat(beanEls, gEls);
  fall.forEach((n, i) => {            // per-element wind parameters (CSS animation, runs on the compositor)
    const dir = i % 2 ? 1 : -1;
    n.style.setProperty('--wx', dir * (10 + (i * 7) % 22) + 'px');
    n.style.setProperty('--wy', (6 + (i * 5) % 16) * (i % 3 ? 1 : -1) + 'px');
    n.style.setProperty('--wr', dir * (4 + (i * 3) % 9) + 'deg');
    n.style.setProperty('--wd', (3.2 + (i % 5) * .7) + 's');
    n.style.setProperty('--wdl', (-i * .55) + 's');
  });
  const slideEl = document.querySelector('.slide');
  const THEMES = ['blue', 'brown', 'green'];

  // slider: three slots, the big arrow rotates the packs through them
  const mobile = () => matchMedia('(max-width:900px) and (min-height:540px), (max-width:900px) and (orientation:portrait)').matches;
  const ASP = [1.505, 1.346, 1.336];                 // image height/width per pack
  const slotsD = [[980, 140, 480], [1500, 330, 262], [1762, 398, 140]];
  const BLUR = [0, 2, 3.5], DIM = [1, .88, .8];
  let order = [0, 1, 2];                              // order[slot] = pack index
  const slotsFor = () => {
    const cr = document.querySelector('.chrome').offsetHeight;
    if (!mobile()) {
      const W = document.documentElement.clientWidth, U = Math.min(W / 1920, (innerHeight - cr) / 927);
      return slotsD.map(([x, y, w]) => ({ left: x * U, top: y * U, width: w * U }));
    }
    // stacked layout: bottom-aligned row of three, sized to the free area under the copy
    const r = document.querySelector('.packs').getBoundingClientRect(), cw = r.width, ch = r.height;
    const mw = Math.max(40, Math.min(cw * .42, ch * .66 / ASP[0]));
    const ws = [mw, mw * .68, mw * .5], g = cw * .02, total = ws[0] + ws[1] + ws[2] + 2 * g;
    let x = (cw - total) / 2;
    return ws.map((w, s) => { const o = { left: x, width: w, _s: s }; x += w + g; return o; });
  };
  const place = (animate) => {
    const slots = slotsFor(), ch = document.querySelector('.packs').getBoundingClientRect().height;
    order.forEach((pi, s) => {
      const t = { ...slots[s] }; delete t._s;
      if (mobile()) t.top = ch * .96 - t.width * ASP[pi];
      packs[pi].classList.toggle('is-main', s === 0);
      if (s === 0) { slideEl.dataset.theme = THEMES[pi]; slideEl.closest('.hero').dataset.theme = THEMES[pi]; }
      packs[pi].style.zIndex = 3 - s;
      const im = packs[pi].querySelector('img'), f = { filter: `blur(${BLUR[s]}px) brightness(${DIM[s]})` };
      if (animate) { gsap.to(packs[pi], { ...t, duration: .8, ease: 'power3.inOut', overwrite: 'auto' }); gsap.to(im, { ...f, duration: .8, ease: 'power3.inOut' }); }
      else { gsap.set(packs[pi], t); gsap.set(im, f); }
    });
  };
  document.querySelector('.next').addEventListener('click', () => { order = [order[1], order[2], order[0]]; place(true); });
  addEventListener('resize', () => place(false));
  addEventListener('orientationchange', () => setTimeout(() => place(false), 250));
  addEventListener('load', () => place(false));
  document.fonts && document.fonts.ready.then(() => place(false));
  place(false);

  if (reduce || !window.ScrollTrigger) {            // static, fully visible fallback
    cv.style.display = 'none';
    document.querySelector('.bgfade').style.opacity = 1;
    fall.forEach(n => gsap.set(n, { rotate: +n.dataset.r }));
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  // leaves burst outward from the scene centre; packs pop in (zoom-in overshoot, then settle) at their own centre
  // start each piece at the scene centre (offset), then fly out to its own spot
  const toCentre = () => { const W = slideEl.clientWidth / 2, Hh = slideEl.clientHeight / 2; fall.forEach(n => { const w = n.offsetWidth, h = n.offsetHeight; gsap.set(n, { x: W - (n.offsetLeft + w / 2), y: Hh - (n.offsetTop + h / 2) }); }); };
  gsap.set(fall, { rotate: (i, t) => +t.dataset.r - 50, opacity: 0, scale: 0 });
  toCentre();
  gsap.set('.cup--tea, .cup--coffee', { opacity: 0, y: 160, rotate: -8 });
  gsap.set(packs, { opacity: 0, scale: .15 });
  gsap.set(['.l1 .t', '.l2 .t', '.splash'], { yPercent: 40, opacity: 0 });
  gsap.set(['.sub', '.btn'], { y: 30, opacity: 0 });
  gsap.set('.next', { scale: 0, opacity: 0 });

  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: '.hero__pin', start: () => 'top ' + document.querySelector('.chrome').offsetHeight + 'px', end: '+=950%', fastScrollEnd: true,
      pin: true, scrub: lenis ? true : 0.2, anticipatePin: 1, invalidateOnRefresh: true,
    },
  });

  // fly-by leaves around the screen centre, so the plantation feels like it is being travelled through
  const flyEls = ['g00', 'g10', 'g21', 'g06', 'g13', 'g25', 'g29', 'g12', 'g14', 'g16'].map((f, i) => {
    const n = new Image(); n.src = `assets/gleaves/${f}.webp`; n.alt = ''; if (i % 3 == 0) n.style.filter = 'blur(5px)';
    document.querySelector('.fly').appendChild(n); return n;
  });
  const ang = i => i * 2.399 + .5;                                  // golden-angle spread

  tl.to(state, { z: 1, duration: 2.6, ease: 'power1.in', onUpdate: draw }, 0)        // 1) zoom through the logo
    .to('.intro', { opacity: 0, duration: .3, ease: 'none' }, 2.45)
    .to('.scroll-hint', { opacity: 0, duration: .3 }, .35)
    .fromTo('.hero__video', { scale: 1.04 }, { scale: 1.3, duration: 6, ease: 'power1.inOut' }, 0)   // 2) slow push through the plantation
    .fromTo(flyEls, { x: i => Math.cos(ang(i)) * innerWidth * .03, y: i => Math.sin(ang(i)) * innerHeight * .03, scale: .3, rotate: i => i * 37, opacity: 0 },
      { x: i => Math.cos(ang(i)) * innerWidth * .75, y: i => Math.sin(ang(i)) * innerHeight * .8, scale: i => 2 + (i % 3), rotate: i => i * 37 + 70, duration: 2.6, stagger: .28, ease: 'power2.in' }, 1.8)
    .to(flyEls, { opacity: 1, duration: .5, stagger: .28, ease: 'none' }, 1.8)
    .to(flyEls, { opacity: 0, duration: .4, stagger: .28, ease: 'none' }, 3.9)
    // 3) blue scene wipes open, then packs, titles
    .to('.bgfade', { opacity: 1, duration: .9, ease: 'power1.inOut' }, 5.2)
    .to('.pack--green', { opacity: 1, scale: 1, duration: 1, ease: 'back.out(1.5)' }, 4.9)
    .to('.pack--kaapi', { opacity: 1, scale: 1, duration: 1, ease: 'back.out(1.5)' }, 5.3)
    .to('.pack--harmony', { opacity: 1, scale: 1, duration: 1, ease: 'back.out(1.5)' }, 5.7)
    .to(fall, { opacity: 1, scale: 1, x: 0, y: 0, rotate: (i, t) => +t.dataset.r, duration: 1.1, stagger: .05, ease: 'back.out(1.4)' }, 5.5)
    .to('.cup--tea, .cup--coffee', { opacity: 1, y: 0, rotate: 0, duration: .7, ease: 'power3.out' }, 6.5)
    .to(['.l1 .t', '.l1 .splash'], { yPercent: 0, opacity: 1, duration: .45, ease: 'power3.out' }, 6.5)
    .to(['.l2 .t', '.l2 .splash'], { yPercent: 0, opacity: 1, duration: .5, ease: 'power3.out' }, 6.65)
    .to('.sub', { y: 0, opacity: 1, duration: .4, ease: 'power2.out' }, 6.9)
    .to('.btn', { y: 0, opacity: 1, duration: .4, stagger: .12, ease: 'power2.out' }, 7.05)
    .to('.next', { scale: 1, opacity: 1, duration: .35, ease: 'back.out(2)' }, 7.9)
    .to({}, { duration: .6 });                      // hold

  // idle motion once the scene is up: packs float, leaves sway
  packs.forEach((p, i) => gsap.to(p.querySelector('img'), { y: -12, duration: 2.4 + i * .3, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: i * .4 }));
})();


// ---------- add to cart: "woosh" ----------
(() => {
  const cart = document.querySelector('.cart'), badge = document.getElementById('cartCount'), toast = document.querySelector('.toast');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let count = parseInt(badge.textContent, 10) || 0, tt;

  const arrive = (name, q = 1) => {
    count += q; badge.textContent = String(count).padStart(2, '0');
    cart.setAttribute('aria-label', `Cart, ${count} items`);
    cart.classList.remove('bump'); void cart.offsetWidth; cart.classList.add('bump');
    toast.innerHTML = `<i>✓</i>${q > 1 ? q + ' × ' : ''}${name} added to cart`; toast.classList.add('show');
    clearTimeout(tt); tt = setTimeout(() => toast.classList.remove('show'), 2200);
    const r = cart.getBoundingClientRect();
    const ring = Object.assign(document.createElement('div'), { className: 'ring' });
    Object.assign(ring.style, { left: r.left + r.width / 2 - 20 + 'px', top: r.top + r.height / 2 - 20 + 'px', width: '40px', height: '40px' });
    document.body.appendChild(ring);
    gsap.fromTo(ring, { scale: .5, opacity: .9 }, { scale: 2.4, opacity: 0, duration: .6, ease: 'power2.out', onComplete: () => ring.remove() });
  };

  const run = (btn, pack, qty) => {
    const name = pack.dataset.name;
    if (reduce || !window.gsap) return arrive(name, qty);
    const src = pack.querySelector('img'), s = btn.getBoundingClientRect(), t = cart.getBoundingClientRect();
    const sx = s.left + s.width / 2, sy = s.top + s.height / 2, tx = t.left + t.width / 2, ty = t.top + t.height / 2;
    const size = 96;
    // press feedback on the plus itself
    gsap.fromTo(btn, { scale: .8 }, { scale: 1, duration: .5, ease: 'elastic.out(1,.4)' });
    // one hero copy + a trail of ghosts, all along the same swooping path
    const mk = (ghost) => {
      const el = new Image(); el.src = src.currentSrc || src.src; el.className = 'fly' + (ghost ? ' fly--ghost' : '');
      el.style.width = size + 'px'; el.style.height = size * 1.3 + 'px';
      document.body.appendChild(el);
      return el;
    };
    const fly = (el, delay, op) => {
      gsap.set(el, { x: sx - size / 2, y: sy - size * .65, scale: .3, opacity: 0, rotate: -10 });
      const tl = gsap.timeline({ delay, onComplete: () => { el.remove(); if (!delay) arrive(name, qty); } });
      tl.to(el, { opacity: op, scale: 1, duration: .22, ease: 'back.out(2)' })
        // x eases out, y eases in: the product arcs up-and-over like it's thrown
        .to(el, { x: tx - size / 2, duration: .85, ease: 'power2.inOut' }, .12)
        .to(el, { y: sy - size * .65 + 140, duration: .38, ease: 'power2.out' }, .12)
        .to(el, { y: ty - size * .65, duration: .47, ease: 'power3.in' }, .5)
        .to(el, { scale: .14, rotate: 540, duration: .85, ease: 'power2.in' }, .12)
        .to(el, { opacity: 0, duration: .15 }, .85);
    };
    for (let i = 5; i >= 1; i--) fly(mk(true), i * .045, .35 - i * .05);
    fly(mk(false), 0, 1);
  };

  // ---------- product quick-view popup ----------
  const INFO = {
    'Green Tea': { tag: 'Loose Leaf Green Tea', wt: '100 g', price: 199, mrp: 249, rate: '4.8', pts: ['Whole-leaf, hand-picked', 'Light, fresh and naturally antioxidant-rich', 'Resealable zip pouch keeps it fresh'] },
    'Kaapi': { tag: 'Coffee blended with Chicory', wt: '100 g', price: 179, mrp: 219, rate: '4.7', pts: ['Rich South-Indian filter style blend', '55% coffee, 45% chicory', 'Crafted in Coorg'] },
    'Harmony Tea': { tag: 'Premium Dust Tea', wt: '250 g', price: 149, mrp: 185, rate: '4.6', pts: ['Strong, fast-brewing everyday chai', 'Blended for a bold, golden cup', 'Value 250 g pack'] },
  };
  const dlg = document.createElement('div');
  dlg.className = 'qv'; dlg.hidden = true; dlg.setAttribute('role', 'dialog'); dlg.setAttribute('aria-modal', 'true'); dlg.setAttribute('aria-labelledby', 'qvTitle');
  dlg.innerHTML = `<div class="qv__scrim"></div><div class="qv__card">
    <button class="qv__x" type="button" aria-label="Close">×</button>
    <div class="qv__img"><img alt=""></div>
    <div class="qv__body">
      <span class="qv__tag"></span><h3 id="qvTitle"></h3>
      <p class="qv__meta"><span class="qv__rate">★ <b></b></span><span class="qv__wt"></span></p>
      <p class="qv__price"><strong></strong><s></s><em></em></p>
      <ul class="qv__pts"></ul>
      <div class="qv__row"><div class="qv__qty" role="group" aria-label="Quantity"><button type="button" data-d="-1" aria-label="Decrease">−</button><output>1</output><button type="button" data-d="1" aria-label="Increase">+</button></div>
        <button class="qv__add" type="button"><span>Add to cart</span></button></div>
      <button class="qv__next" type="button">Shop next</button>
    </div></div>`;
  document.body.appendChild(dlg);
  const $ = (s) => dlg.querySelector(s), card = $('.qv__card');
  let cur = null, qty = 1, lastFocus = null;
  const show = (btn) => {
    const pack = btn.closest('.pack'), d = INFO[pack.dataset.name];
    cur = { btn, pack }; qty = 1; lastFocus = btn;
    $('.qv__img img').src = pack.querySelector('img').src;
    $('.qv__tag').textContent = pack.dataset.name; $('h3').textContent = d.tag;
    $('.qv__rate b').textContent = d.rate; $('.qv__wt').textContent = d.wt;
    $('.qv__price strong').textContent = '₹' + d.price; $('.qv__price s').textContent = '₹' + d.mrp;
    $('.qv__price em').textContent = Math.round((1 - d.price / d.mrp) * 100) + '% off';
    $('.qv__pts').innerHTML = d.pts.map(p => `<li>${p}</li>`).join('');
    $('output').textContent = qty; $('.qv__add span').textContent = 'Add to cart · ₹' + d.price;
    dlg.hidden = false; document.body.classList.add('qv-open');
    if (window.lenis) window.lenis.stop();
    const r = btn.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    requestAnimationFrame(() => {
      dlg.classList.add('on'); $('.qv__add').focus({ preventScroll: true });
      if (!reduce && window.gsap) { const cr = card.getBoundingClientRect(); gsap.fromTo(card, { scale: .6, opacity: 0, transformOrigin: `${cx - cr.left}px ${cy - cr.top}px` }, { scale: 1, opacity: 1, duration: .5, ease: 'back.out(1.6)' }); }
    });
  };
  const hide = (after) => {
    const done = () => { dlg.hidden = true; dlg.classList.remove('on'); document.body.classList.remove('qv-open'); if (window.lenis) window.lenis.start(); if (after) after(); else if (lastFocus) lastFocus.focus({ preventScroll: true }); };
    dlg.classList.remove('on');
    if (!reduce && window.gsap) gsap.to(card, { scale: .85, opacity: 0, duration: .22, ease: 'power2.in', onComplete: done }); else done();
  };
  document.querySelectorAll('.plus').forEach(btn => btn.addEventListener('click', e => { e.preventDefault(); show(btn); }));
  $('.qv__scrim').addEventListener('click', () => hide());
  $('.qv__x').addEventListener('click', () => hide());
  $('.qv__next').addEventListener('click', () => hide());
  dlg.querySelectorAll('.qv__qty button').forEach(b => b.addEventListener('click', () => { qty = Math.min(9, Math.max(1, qty + +b.dataset.d)); $('output').textContent = qty; const d = INFO[cur.pack.dataset.name]; $('.qv__add span').textContent = 'Add to cart · ₹' + d.price * qty; }));
  $('.qv__add').addEventListener('click', () => { const { btn, pack } = cur, q = qty; hide(() => run(btn, pack, q)); });
  addEventListener('keydown', e => {
    if (dlg.hidden) return;
    if (e.key === 'Escape') hide();
    if (e.key === 'Tab') { const f = [...dlg.querySelectorAll('button')]; const i = f.indexOf(document.activeElement); if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); } else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); } }
  });
})();



// ---------- mobile menu ----------
(() => {
  const btn = document.querySelector('.menu-btn'), menu = document.getElementById('menu');
  const set = (open) => { menu.classList.toggle('open', open); btn.setAttribute('aria-expanded', open); btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu'); };
  btn.addEventListener('click', () => set(!menu.classList.contains('open')));
  addEventListener('keydown', e => { if (e.key === 'Escape') set(false); });
  addEventListener('resize', () => { if (innerWidth > 1100) set(false); });
  menu.addEventListener('click', e => { if (e.target.closest('nav a')) set(false); });
})();


// ---------- premium button interaction: fill blooms from the pointer, label drifts toward it ----------
(() => {
  if (!matchMedia('(hover:hover)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.querySelectorAll('.btn').forEach(b => {
    const label = b.querySelector('.roll');
    const qx = gsap.quickTo(label, 'x', { duration: .5, ease: 'power3.out' }), qy = gsap.quickTo(label, 'y', { duration: .5, ease: 'power3.out' });
    b.addEventListener('pointermove', e => {
      const r = b.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      b.style.setProperty('--x', x + 'px'); b.style.setProperty('--y', y + 'px');
      qx((x - r.width / 2) * .08); qy((y - r.height / 2) * .12);
    });
    b.addEventListener('pointerleave', () => { qx(0); qy(0); });
  });
})();
