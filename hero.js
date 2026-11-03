// Hero: scroll-scrubbed video frames, then three packs rise in one by one.

// ---------- smooth (inertial) scrolling: wheel steps are eased instead of jumping ----------
let lenis = null;
if (window.Lenis && window.gsap && window.ScrollTrigger && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  lenis = new Lenis({ lerp: 0.075, wheelMultiplier: 0.85, smoothWheel: true });   // touch keeps native momentum
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
(() => {
  // Scroll-scrubbed 60fps video: short-GOP H.264 so any frame seeks instantly.
  const video = document.querySelector('.hero__video');
  // Slow hosts can't seek a streamed file smoothly, so pull the clip into memory first:
  // 720p (~8 MB) swaps in quickly; on fast desktop connections 1080p (~15 MB) follows silently.
  const bar = document.querySelector('.loadbar');
  const small = matchMedia('(max-width:900px)').matches;
  const getBlob = async (url, onp) => {
    const r = await fetch(url), len = +r.headers.get('content-length') || 0, rd = r.body.getReader(), parts = [];
    let got = 0;
    for (;;) { const { done, value } = await rd.read(); if (done) break; parts.push(value); got += value.length; if (onp && len) onp(got / len); }
    return URL.createObjectURL(new Blob(parts, { type: 'video/mp4' }));
  };
  const swap = (url) => new Promise(res => {
    const t = video.currentTime || 0;
    video.addEventListener('loadedmetadata', () => { video.currentTime = t; res(); }, { once: true });
    video.src = url;
  });
  (async () => {
    try {
      const lq = await getBlob('assets/video/hero-m.mp4?v=20261103e', p => { if (bar) bar.style.transform = `scaleX(${p})`; });
      await swap(lq);
    } catch (e) { video.src = 'assets/video/hero-m.mp4?v=20261103e'; }
    if (bar) bar.classList.add('done');
    const c = navigator.connection || {};
    if (!small && !c.saveData && !/2g|3g/.test(c.effectiveType || '')) {
      try { await swap(await getBlob('assets/video/hero.mp4?v=20261103e')); } catch (e) {}
    }
  })();
  const state = { p: 0 };                             // 0..1 through the clip
  let tgt = 0;
  // Forward scroll: let the decoder PLAY and steer its playbackRate toward the scroll position
  // (continuous frames, no seek stalls). Backward / big jumps: seek (clip is all-intra, so it is instant).
  const tick = () => {
    const d = video.duration;
    if (d) {
      const target = state.p * (d - .05);
      tgt += (target - tgt) * .2;
      const diff = tgt - video.currentTime;
      if (diff > .6 || diff < -.015) {
        if (!video.paused) video.pause();
        if (!video.seeking) video.currentTime = tgt;
      } else if (diff > .01) {
        video.playbackRate = Math.min(8, Math.max(.1, diff * 14));
        if (video.paused) video.play().catch(() => {});
      } else if (!video.paused) video.pause();
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  const draw = () => {};

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

  // slider: three slots, the big arrow rotates the packs through them
  const mobile = () => matchMedia('(max-width:900px) and (min-height:540px), (max-width:900px) and (orientation:portrait)').matches;
  const ASP = [1.505, 1.346, 1.336];                 // image height/width per pack
  const slotsD = [[1000, 167, 384], [1438, 278, 268], [1724, 301, 191]];
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
      packs[pi].style.zIndex = 3 - s;
      if (animate) gsap.to(packs[pi], { ...t, duration: .8, ease: 'power3.inOut', overwrite: 'auto' });
      else gsap.set(packs[pi], t);
    });
  };
  document.querySelector('.next').addEventListener('click', () => { order = [order[1], order[2], order[0]]; place(true); });
  addEventListener('resize', () => place(false));
  addEventListener('orientationchange', () => setTimeout(() => place(false), 250));
  addEventListener('load', () => place(false));
  document.fonts && document.fonts.ready.then(() => place(false));
  place(false);

  if (reduce || !window.ScrollTrigger) {            // static, fully visible fallback
    video.addEventListener('loadedmetadata', () => { video.currentTime = video.duration * .6; });
    document.querySelector('.slide').style.opacity = 1;
    document.querySelector('.hero__arc').style.opacity = 1;
    leafEls.forEach(n => gsap.set(n, { rotate: +n.dataset.r }));
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  gsap.set(leafEls, { rotate: (i, t) => +t.dataset.r - 120, xPercent: (i) => 260 + i * 40, y: (i) => (i % 2 ? -80 : 80), opacity: 0, scale: .8 });
  gsap.set('.cup', { opacity: 0, y: 160, rotate: -8 });
  gsap.set(packs, { opacity: 0, y: 240, scale: .88 });
  gsap.set('.pack--harmony', { y: 0, x: 220 });
  gsap.set(['.l1 .t', '.l2 .t', '.splash'], { yPercent: 40, opacity: 0 });
  gsap.set(['.sub', '.btn'], { y: 30, opacity: 0 });
  gsap.set('.next', { scale: 0, opacity: 0 });

  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: '.hero__pin', start: () => 'top ' + document.querySelector('.chrome').offsetHeight + 'px', end: '+=800%', fastScrollEnd: true,
      pin: true, scrub: lenis ? true : 0.2, anticipatePin: 1, invalidateOnRefresh: true,
    },
  });

  // 1) video frames scrub with a slow push-in
  tl.to(state, { p: 1, duration: 2.8, ease: 'none' }, 0)
    .fromTo('.hero__video', { scale: 1 }, { scale: 1.15, duration: 3.3, ease: 'power2.in' }, 0)
    .to('.scroll-hint', { opacity: 0, duration: .4 }, 2.3)
    // 2) blue scene wipes open
    .to('.slide', { opacity: 1, duration: .7, ease: 'power1.inOut' }, 2.7)
    .to('.hero__arc', { opacity: 1, duration: .4 }, 3.1)
    // 3) titles, left side
    .to(['.l1 .t', '.l1 .splash'], { yPercent: 0, opacity: 1, duration: .45, ease: 'power3.out' }, 3.25)
    .to(['.l2 .t', '.l2 .splash'], { yPercent: 0, opacity: 1, duration: .5, ease: 'power3.out' }, 3.4)
    .to('.sub', { y: 0, opacity: 1, duration: .4, ease: 'power2.out' }, 3.65)
    .to('.btn', { y: 0, opacity: 1, duration: .4, stagger: .12, ease: 'power2.out' }, 3.8)
    // 4) leaves fall in behind, then packets one by one on the right
    .to(leafEls, { xPercent: 0, y: 0, opacity: 1, scale: 1, rotate: (i, t) => +t.dataset.r, duration: 1, stagger: .06, ease: 'power3.out' }, 2.75)
    .to('.pack--green', { opacity: 1, y: 0, scale: 1, duration: .6, ease: 'power3.out' }, 3.55)
    .to('.pack--kaapi', { opacity: 1, y: 0, scale: 1, duration: .6, ease: 'power3.out' }, 3.95)
    .to('.pack--harmony', { opacity: 1, x: 0, scale: 1, duration: .6, ease: 'power3.out' }, 4.35)
    .to('.cup', { opacity: 1, y: 0, rotate: 0, duration: .7, ease: 'power3.out' }, 4.2)
    .to('.next', { scale: 1, opacity: 1, duration: .35, ease: 'back.out(2)' }, 4.7)
    .to({}, { duration: .6 });                      // hold

  // idle motion once the scene is up: packs float, leaves sway
  packs.forEach((p, i) => gsap.to(p.querySelector('img'), { y: -12, duration: 2.4 + i * .3, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: i * .4 }));
  leafEls.forEach((n, i) => gsap.to(n, { x: i % 2 ? 14 : -14, duration: 3 + (i % 4) * .5, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: i * .15 }));
})();


// ---------- add to cart: "woosh" ----------
(() => {
  const cart = document.querySelector('.cart'), badge = document.getElementById('cartCount'), toast = document.querySelector('.toast');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let count = parseInt(badge.textContent, 10) || 0, tt;

  const arrive = (name) => {
    badge.textContent = String(++count).padStart(2, '0');
    cart.setAttribute('aria-label', `Cart, ${count} items`);
    cart.classList.remove('bump'); void cart.offsetWidth; cart.classList.add('bump');
    toast.innerHTML = `<i>✓</i>${name} added to cart`; toast.classList.add('show');
    clearTimeout(tt); tt = setTimeout(() => toast.classList.remove('show'), 2200);
    const r = cart.getBoundingClientRect();
    const ring = Object.assign(document.createElement('div'), { className: 'ring' });
    Object.assign(ring.style, { left: r.left + r.width / 2 - 20 + 'px', top: r.top + r.height / 2 - 20 + 'px', width: '40px', height: '40px' });
    document.body.appendChild(ring);
    gsap.fromTo(ring, { scale: .5, opacity: .9 }, { scale: 2.4, opacity: 0, duration: .6, ease: 'power2.out', onComplete: () => ring.remove() });
  };

  document.querySelectorAll('.plus').forEach(btn => btn.addEventListener('click', (e) => {
    e.preventDefault();
    const pack = btn.closest('.pack'), name = pack.dataset.name;
    if (reduce || !window.gsap) return arrive(name);
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
      const tl = gsap.timeline({ delay, onComplete: () => { el.remove(); if (!delay) arrive(name); } });
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
  }));
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
