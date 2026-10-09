/* Speed Travel — LP v2. GSAP 3.13 + ScrollTrigger + SplitText + MotionPath + Lenis. */
(() => {
  const html = document.documentElement;
  const hasGSAP = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
  if (!hasGSAP) html.classList.add('rm'); // CDN caiu: página estática e legível
  const RM = html.classList.contains('rm');
  const WA = '556934162900';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* ---------- WhatsApp + tracking ---------- */
  const qs = new URLSearchParams(location.search);
  const ref = ['utm_source', 'utm_campaign'].map((k) => qs.get(k)).filter(Boolean).join('/');
  const waLink = (msg) => `https://wa.me/${WA}?text=${encodeURIComponent(ref ? `${msg} [ref: ${ref}]` : msg)}`;
  const setWa = (el, msg) => { el.dataset.wa = msg; el.href = waLink(msg); el.target = '_blank'; el.rel = 'noopener'; };
  $$('[data-wa]').forEach((el) => el.dataset.wa && setWa(el, el.dataset.wa));

  const trackLead = (plan) => {
    window.fbq && window.fbq('track', 'Lead', { content_name: plan });
    window.gtag && window.gtag('event', 'generate_lead', { plan });
  };
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-wa]');
    if (a) trackLead(a.dataset.plan || 'Geral');
  });

  // Meta Pixel do cliente: só no domínio de produção, pra não sujar dados em preview
  if (/(^|\.)speedtravel\.com\.br$/.test(location.hostname)) {
    !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s); }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', '1074140915540845');
    window.fbq('track', 'PageView');
  }

  /* ---------- Smooth scroll ---------- */
  let lenis = null;
  if (!RM && typeof Lenis !== 'undefined') {
    lenis = new Lenis({ lerp: 0.12 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    const target = a && a.getAttribute('href').length > 1 && $(a.getAttribute('href'));
    if (!target || !lenis) return;
    e.preventDefault();
    lenis.scrollTo(target, { offset: -parseInt(getComputedStyle(html).scrollPaddingTop, 10) || -90, duration: 1.2 });
  });

  /* ---------- Nav, menu, barra fixa ---------- */
  const nav = $('.nav'), burger = $('.nav__burger'), menu = $('#menu');
  const sticky = $('[data-sticky]'), fab = $('.fab'), footer = $('.footer');
  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle('is-scrolled', y > 10);
    const on = y > 640 && footer.getBoundingClientRect().top > innerHeight - 40; // some no rodapé pra não cobrir links
    sticky.classList.toggle('is-on', on);
    fab.classList.toggle('is-on', on);
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const setMenu = (open) => {
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    menu.hidden = !open;
    if (lenis) open ? lenis.stop() : lenis.start();
  };
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', (e) => e.target.closest('a') && setMenu(false));
  addEventListener('keydown', (e) => e.key === 'Escape' && !menu.hidden && setMenu(false));
  addEventListener('resize', () => innerWidth >= 1024 && !menu.hidden && setMenu(false));

  /* ---------- Planos: abas, carrossel, setas ---------- */
  const tabs = $$('.tab'), ink = $('.tabs__ink'), navArrows = $('.cards__nav');
  const activePanel = () => $(`#${$('.tab.is-active').getAttribute('aria-controls')}`);
  const moveInk = (tab) => { ink.style.width = `${tab.offsetWidth}px`; ink.style.transform = `translateX(${tab.offsetLeft}px)`; };
  // No carrossel, abre centralizado no plano em destaque (não no mais barato)
  const centerHot = (panel) => {
    const row = $('.cards', panel), hot = $('.plan--hot', panel);
    if (row && hot && row.scrollWidth > row.clientWidth) row.scrollLeft = hot.offsetLeft - (row.clientWidth - hot.offsetWidth) / 2;
  };
  const syncArrows = () => {
    const row = $('.cards', activePanel());
    navArrows.classList.toggle('is-on', !!row && row.scrollWidth > row.clientWidth + 4);
  };
  const selectTab = (tab) => {
    tabs.forEach((t) => {
      const on = t === tab;
      t.classList.toggle('is-active', on);
      t.setAttribute('aria-selected', on);
      t.tabIndex = on ? 0 : -1;
      $(`#${t.getAttribute('aria-controls')}`).hidden = !on;
    });
    moveInk(tab);
    centerHot(activePanel());
    syncArrows();
    if (!RM) gsap.fromTo($$('.plan', activePanel()), { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.06, ease: 'power3.out', clearProps: 'transform,opacity' });
    if (hasGSAP) ScrollTrigger.refresh();
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => selectTab(t));
    t.addEventListener('keydown', (e) => {
      const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      const next = tabs[(i + d + tabs.length) % tabs.length];
      next.focus();
      selectTab(next);
    });
  });
  $$('[data-open-tab]').forEach((a) => a.addEventListener('click', () => selectTab($(`#${a.dataset.openTab}`))));
  const step = (dir) => { const row = $('.cards', activePanel()); row.scrollBy({ left: dir * ($('.plan', row).offsetWidth + 14), behavior: 'smooth' }); };
  $('[data-cards-prev]').addEventListener('click', () => step(-1));
  $('[data-cards-next]').addEventListener('click', () => step(1));
  const layoutPlans = () => { moveInk($('.tab.is-active')); centerHot(activePanel()); syncArrows(); };
  layoutPlans();
  document.fonts.ready.then(layoutPlans);
  addEventListener('resize', layoutPlans);

  /* ---------- Quiz ---------- */
  const quiz = $('[data-quiz]');
  if (quiz) {
    const steps = $$('[data-step]', quiz), dots = $$('.quiz__dots i');
    let cur = 0;
    const go = (i) => {
      steps[cur].classList.remove('is-active');
      cur = i;
      steps[i].classList.add('is-active');
      dots.forEach((d, k) => d.classList.toggle('is-on', k <= Math.min(i, 2)));
      if (!RM) gsap.fromTo(steps[i], { opacity: 0, x: 24 }, { opacity: 1, x: 0, duration: 0.45, ease: 'power3.out' });
    };
    const showResult = () => {
      const fd = new FormData(quiz);
      const r = window.SpeedPlans.recommend({ people: +fd.get('people'), uses: fd.getAll('uses'), tv: fd.get('tv') === '1' });
      $('[data-r-name]', quiz).textContent = r.name;
      $('[data-r-price]', quiz).textContent = r.price;
      $('[data-r-why]', quiz).textContent = r.why;
      const cta = $('[data-r-cta]', quiz);
      cta.dataset.plan = `Quiz: ${r.name}`;
      setWa(cta, `Olá! Fiz o teste no site e o plano indicado foi ${r.name} (R$ ${r.price}/mês). Quero assinar!`);
      go(3);
    };
    quiz.addEventListener('change', (e) => {
      if (e.target.type !== 'radio') return;
      const s = +e.target.closest('[data-step]').dataset.step;
      setTimeout(() => (s === 2 ? showResult() : go(s + 1)), 240);
    });
    $('[data-next]', quiz).addEventListener('click', () => go(2));
    $('[data-restart]', quiz).addEventListener('click', () => { quiz.reset(); go(0); });
  }

  /* ---------- Cobertura por CEP → WhatsApp (nada é salvo) ---------- */
  const fmtCep = (v) => v.replace(/\D/g, '').slice(0, 8).replace(/^(\d{5})(\d)/, '$1-$2');
  $$('[data-coverage]').forEach((form) => {
    const input = form.elements.cep, err = $('.cep__err', form);
    input.addEventListener('input', () => { input.value = fmtCep(input.value); form.classList.remove('is-invalid'); err.hidden = true; });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const digits = input.value.replace(/\D/g, '');
      if (digits.length !== 8) { form.classList.add('is-invalid'); err.hidden = false; input.focus(); return; }
      trackLead('Cobertura');
      window.open(waLink(`Olá! Quero saber se a fibra da Speed Travel chega no meu endereço. Meu CEP é ${fmtCep(digits)}.`), '_blank', 'noopener');
    });
  });

  /* ---------- Contador: só liga com oferta real configurada ---------- */
  const cd = $('.countdown');
  const deadline = cd && Date.parse(cd.dataset.deadline);
  if (deadline && deadline > Date.now()) {
    cd.hidden = false;
    const pad = (n) => String(n).padStart(2, '0');
    const tick = () => {
      const s = Math.max(0, Math.floor((deadline - Date.now()) / 1000));
      if (!s) { cd.hidden = true; return clearInterval(timer); }
      $('[data-d]', cd).textContent = pad(Math.floor(s / 86400));
      $('[data-h]', cd).textContent = pad(Math.floor(s / 3600) % 24);
      $('[data-m]', cd).textContent = pad(Math.floor(s / 60) % 60);
      $('[data-s]', cd).textContent = pad(s % 60);
    };
    const timer = setInterval(tick, 1000);
    tick();
  }

  /* ---------- Story: etapas (funciona mesmo sem animação) ---------- */
  const card = $('.story__card'), storySteps = $$('.story__step');
  const setStage = (i) => {
    storySteps.forEach((s, k) => s.classList.toggle('is-active', k === i));
    card.dataset.stage = i;
    $('[data-stage-num]').textContent = i + 1;
    $('[data-stage-name]').textContent = storySteps[i].dataset.name;
  };

  if (!hasGSAP) return;
  gsap.registerPlugin(ScrollTrigger, SplitText, MotionPathPlugin);
  ScrollTrigger.config({ ignoreMobileResize: true }); // barra do navegador mobile não força refresh

  const FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const headerOffset = () => nav.offsetHeight + 20;

  // Nós do caminho da fibra
  const path = $('#fiberPath'), fiber = $('.story__fiber'), pulse = $('.story__pulse');
  const len = path.getTotalLength(), stops = [0.02, 0.5, 0.98];
  const nodes = stops.map((t) => {
    const p = path.getPointAtLength(len * t);
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'story__node');
    g.innerHTML = `<circle cx="${p.x}" cy="${p.y}" r="12"/><circle cx="${p.x}" cy="${p.y}" r="5"/>`;
    $('.story__nodes').appendChild(g);
    return g;
  });

  if (RM) {
    nodes.forEach((n) => n.classList.add('is-on'));
    gsap.set(pulse, { motionPath: { path, align: path, alignOrigin: [0.5, 0.5], start: 1, end: 1 } });
    $$('.pain__list li').forEach((li) => li.classList.add('is-solved'));
    setStage(1);
    return;
  }

  // Animação infinita que só roda enquanto o alvo está na tela
  const playWhenVisible = (trigger, anim) => ScrollTrigger.create({ trigger, start: 'top bottom', end: 'bottom top', onToggle: (st) => (st.isActive ? anim.play() : anim.pause()) });
  const pauseCssWhenHidden = (el) => ScrollTrigger.create({ trigger: el, start: 'top bottom', end: 'bottom top', onToggle: (st) => el.classList.toggle('is-paused', !st.isActive) });

  /* ---------- Intro do hero ---------- */
  const fontsOrTimeout = Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 900))]);
  fontsOrTimeout.then(() => {
    const split = SplitText.create('[data-hero-title]', { type: 'lines', mask: 'lines', linesClass: 'split-line' });
    const base = $$('.hero__base path');
    base.forEach((p) => { const l = p.getTotalLength(); gsap.set(p, { strokeDasharray: l, strokeDashoffset: l }); });
    gsap.timeline({ defaults: { ease: 'power3.out' } })
      .set('[data-intro]', { visibility: 'visible' })
      .to(base, { strokeDashoffset: 0, duration: 2.2, stagger: 0.15, ease: 'power2.inOut' }, 0)
      .from(split.lines, { yPercent: 105, duration: 1, stagger: 0.1, ease: 'power4.out', onComplete: () => split.revert() }, 0)
      .from(['.hero .pill', '.hero__sub', '.hero .cep', '.hero__alt'], { opacity: 0, y: 18, duration: 0.8, stagger: 0.07 }, 0.15)
      .from('[data-hero-photo]', { clipPath: 'inset(8% 8% 8% 8% round 36px)', opacity: 0, duration: 1.3, ease: 'expo.out' }, 0.1)
      .from('[data-hero-photo] img', { scale: 1.14, duration: 1.8, ease: 'expo.out' }, '<')
      .from('[data-hero-card]', { y: 36, opacity: 0, duration: 0.9 }, 0.55)
      .from('[data-hero-chip]', { y: -16, opacity: 0, duration: 0.8 }, 0.7)
      .from('.trust li', { y: 18, opacity: 0, duration: 0.7, stagger: 0.07 }, 0.6);
    initScroll();
    addEventListener('load', () => ScrollTrigger.refresh());
  });

  /* ---------- Mouse: parallax do hero e botões magnéticos (só desktop) ---------- */
  if (FINE) {
    const layers = [['[data-hero-photo]', 10], ['[data-hero-card]', 22], ['[data-hero-chip]', 30], ['.hero__lines', 14]]
      .map(([sel, d]) => ({ d, x: gsap.quickTo(sel, 'x', { duration: 0.9, ease: 'power3' }), r: gsap.quickTo(sel, 'rotation', { duration: 0.9, ease: 'power3' }) }));
    $('.hero').addEventListener('pointermove', (e) => {
      const dx = e.clientX / innerWidth - 0.5, dy = e.clientY / innerHeight - 0.5;
      layers.forEach((l) => { l.x(dx * l.d); l.r(dy * l.d * 0.04); });
    });
    $$('[data-magnetic]').forEach((el) => {
      const x = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3' }), y = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3' });
      el.addEventListener('pointermove', (e) => { const r = el.getBoundingClientRect(); x((e.clientX - r.left - r.width / 2) * 0.25); y((e.clientY - r.top - r.height / 2) * 0.3); });
      el.addEventListener('pointerleave', () => { x(0); y(0); });
    });
  }

  /* ---------- Tudo que depende de scroll ---------- */
  function initScroll() {
    const mm = gsap.matchMedia();
    const pinnable = '(min-width: 900px) and (min-height: 680px)';
    const notPinnable = 'not all and (min-width: 900px) and (min-height: 680px)';

    // Barra de progresso de leitura
    gsap.to('.progress span', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });

    // Hero: camadas em velocidades diferentes ao sair de cena
    gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } })
      .to('.hero__copy', { yPercent: -12, opacity: 0.25 }, 0)
      .to('[data-hero-photo]', { yPercent: 10 }, 0)
      .to('[data-hero-photo] img', { scale: 1.1 }, 0)
      .to('[data-hero-card]', { yPercent: -40 }, 0)
      .to('[data-hero-chip]', { yPercent: -140 }, 0)
      .to('.hero__lines', { yPercent: 16 }, 0);

    // Pulsos de luz correndo pelas fibras (pausam fora da tela)
    const pulses = gsap.timeline({ paused: true });
    $$('.hero__pulses path').forEach((p, i) => pulses.to(p, { strokeDashoffset: 0, duration: 3.6 + i * 0.7, ease: 'none', repeat: -1 }, i * 0.9));
    playWhenVisible('.hero', pulses);

    /* ===== PINS (sempre primeiro, em ordem de página) ===== */

    // 2. Dor — fixa e "resolve" cada problema conforme rola
    const items = $$('.pain__list li');
    const setSolved = (p) => items.forEach((li, i) => li.classList.toggle('is-solved', p > (i + 0.6) / (items.length + 1.6)));
    const painTimeline = (st) => gsap.timeline({ scrollTrigger: Object.assign({ scrub: 0.5, onUpdate: (s) => setSolved(s.progress) }, st) })
      .to({}, { duration: items.length })
      .to('.pain__close', { opacity: 0.45, duration: 0.6 })
      .fromTo('.pain__fix', { opacity: 0, y: 24, scale: 0.92 }, { opacity: 1, y: 0, scale: 1, duration: 1, ease: 'back.out(1.6)' }, '<');
    mm.add(pinnable, () => { painTimeline({ trigger: '.pain', start: () => 'top ' + headerOffset() + 'px', end: '+=110%', pin: true, fastScrollEnd: true }); });
    mm.add(notPinnable, () => { painTimeline({ trigger: '.pain__list', start: 'top 70%', end: 'bottom 30%' }); });

    // 5. Prova — fixa: contador e barra andam com o scroll
    const proofNum = $('[data-proof-num]'), pv = { v: 0 };
    const proofTl = (st) => gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: st })
      .fromTo(pv, { v: 0 }, { v: 618, duration: 1, onUpdate: () => (proofNum.textContent = Math.round(pv.v)) }, 0)
      .fromTo('.meter__fill', { scaleX: 0 }, { scaleX: 1, duration: 1 }, 0)
      .from('.proof__rank', { opacity: 0, y: 14, duration: 0.3 }, 0.75);
    mm.add(pinnable, () => { proofTl({ trigger: '.proof', start: () => 'top ' + headerOffset() + 'px', end: '+=70%', pin: true, scrub: 0.6, fastScrollEnd: true }); });
    mm.add(notPinnable, () => { proofTl({ trigger: '.proof__card', start: 'top 85%', end: 'top 35%', scrub: 0.6 }); });

    /* ===== Demais animações ===== */

    // Faixa: anda sozinha e acelera/inverte com a velocidade do scroll
    const track = $('.band__track'), vel = ScrollTrigger.create({});
    const bandVis = ScrollTrigger.create({ trigger: '.band', start: 'top bottom', end: 'bottom top' });
    const skew = gsap.quickTo(track, 'skewX', { duration: 0.4, ease: 'power3' });
    const setX = gsap.quickSetter(track, 'x', 'px');
    let bx = 0, dir = 1;
    gsap.ticker.add((t, dt) => {
      if (!bandVis.isActive) return;
      const v = vel.getVelocity();
      if (Math.abs(v) > 20) dir = v > 0 ? 1 : -1;
      bx = gsap.utils.wrap(-track.scrollWidth / 2, 0, bx - (40 + Math.min(Math.abs(v) * 0.25, 900)) * (dt / 1000) * dir);
      setX(bx);
      skew(gsap.utils.clamp(-6, 6, v / -250));
    });

    // Manchas de cor em parallax
    $$('.blob').forEach((b) => gsap.to(b, { yPercent: +b.dataset.speed, ease: 'none', scrollTrigger: { trigger: b.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } }));

    // Títulos: linhas sobem de dentro de uma máscara
    $$('[data-split]').forEach((el) => SplitText.create(el, {
      type: 'lines', mask: 'lines', linesClass: 'split-line', autoSplit: true,
      onSplit: (self) => gsap.from(self.lines, { yPercent: 105, duration: 1, stagger: 0.08, ease: 'power4.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } }),
    }));

    // Reveal genérico em lote
    ScrollTrigger.batch('[data-reveal]', {
      start: 'top 90%', once: true,
      onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 0.8, stagger: 0.07, ease: 'power3.out' }),
    });
    gsap.from(items, { opacity: 0, x: -24, duration: 0.6, stagger: 0.06, ease: 'power3.out', scrollTrigger: { trigger: '.pain__list', start: 'top 88%', once: true } });

    // Contadores
    $$('[data-count]').forEach((el) => {
      const end = +el.dataset.count, o = { v: 0 };
      el.textContent = '0';
      gsap.to(o, { v: end, duration: 1.8, ease: 'power2.out', onUpdate: () => (el.textContent = Math.round(o.v)), scrollTrigger: { trigger: el, start: 'top 92%', once: true } });
    });

    // Painéis e cards grandes "chegam" com escala ao entrar
    $$('.tv, .quiz, .duo__card, .trio__card').forEach((el) => gsap.fromTo(el, { scale: 0.94 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'top 55%', scrub: 0.5 } }));

    // 3. Story: fibra desenha, pulso viaja, nós acendem, barra de etapas enche
    gsap.set(fiber, { strokeDasharray: len, strokeDashoffset: len });
    gsap.set(pulse, { motionPath: { path, align: path, alignOrigin: [0.5, 0.5], start: 0, end: 0 } });
    gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: {
      trigger: '.story__steps', start: 'top 70%', end: 'bottom 60%', scrub: 0.6,
      onUpdate: (st) => nodes.forEach((n, i) => n.classList.toggle('is-on', st.progress >= stops[i] - 0.02)),
    } })
      .to(fiber, { strokeDashoffset: 0 }, 0)
      .to(pulse, { motionPath: { path, align: path, alignOrigin: [0.5, 0.5] } }, 0)
      .to('.story__bar i', { scaleX: 1 }, 0);
    storySteps.forEach((s, i) => {
      ScrollTrigger.create({ trigger: s, start: 'top 62%', end: 'bottom 38%', onToggle: (st) => st.isActive && setStage(i) });
      gsap.from(s.children, { opacity: 0, y: 22, duration: 0.7, stagger: 0.08, ease: 'power3.out', scrollTrigger: { trigger: s, start: 'top 82%', once: true } });
    });
    mm.add('(min-width: 900px)', () => { gsap.fromTo('.story__card', { rotateX: 8, rotateY: -10, transformPerspective: 1200 }, { rotateX: -4, rotateY: 6, ease: 'none', scrollTrigger: { trigger: '.story', start: 'top bottom', end: 'bottom top', scrub: true } }); });

    // 4. Benefícios: fotos abrem com máscara + parallax interno
    $$('.bcard--photo').forEach((c) => gsap.from(c, { clipPath: 'inset(18% 6% 0% 6% round 28px)', duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: c, start: 'top 85%', once: true } }));
    $$('[data-parallax]').forEach((img) => gsap.fromTo(img, { yPercent: -8 }, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } }));
    $$('.bcard .ico').forEach((ic) => gsap.from(ic, { scale: 0, rotate: -90, duration: 0.7, ease: 'back.out(2)', scrollTrigger: { trigger: ic, start: 'top 90%', once: true } }));

    // 6. Planos: no desktop os cards saem empilhados atrás do destaque e abrem em leque
    mm.add('(min-width: 1200px)', () => {
      const cards = $$('#tab-fibra .plan'), hot = $('#tab-fibra .plan--hot'), hi = cards.indexOf(hot);
      cards.forEach((c, i) => gsap.set(c, { zIndex: 10 - Math.abs(i - hi) }));
      gsap.fromTo(cards,
        { x: (i, el) => hot.offsetLeft - el.offsetLeft, y: (i) => 30 + Math.abs(i - hi) * 16, rotate: (i) => (i - hi) * 4, scale: (i) => (i === hi ? 1 : 0.88), opacity: (i) => (i === hi ? 1 : 0.5) },
        { x: 0, y: 0, rotate: 0, scale: 1, opacity: 1, ease: 'power2.out', scrollTrigger: { trigger: '#tab-fibra .cards', start: 'top 88%', end: 'top 30%', scrub: 0.6, invalidateOnRefresh: true } });
    });
    mm.add('(max-width: 1199px)', () => { gsap.from('#tab-fibra .plan', { x: 60, opacity: 0, duration: 0.8, stagger: 0.08, ease: 'power3.out', clearProps: 'transform,opacity', scrollTrigger: { trigger: '.tabs', start: 'top 88%', once: true } }); });
    gsap.from('.tabs', { y: 20, opacity: 0, scale: 0.96, duration: 0.7, ease: 'power3.out', scrollTrigger: { trigger: '.tabs', start: 'top 92%', once: true } });

    // 7. Quiz: lado escuro desliza, opções entram em cascata
    gsap.from('.quiz__intro', { xPercent: -8, opacity: 0, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: '.quiz', start: 'top 80%', once: true } });
    gsap.from('.quiz__step.is-active .opt', { y: 20, opacity: 0, duration: 0.6, stagger: 0.07, ease: 'power3.out', scrollTrigger: { trigger: '.quiz', start: 'top 75%', once: true } });

    // 8. Gamer: foto revela com máscara + parallax
    gsap.fromTo('.gamer__media', { clipPath: 'inset(14% 14% 14% 14% round 36px)' }, { clipPath: 'inset(0% 0% 0% 0% round 36px)', ease: 'none', scrollTrigger: { trigger: '.gamer', start: 'top 85%', end: 'center center', scrub: 0.5 } });
    gsap.fromTo('.gamer__media img', { yPercent: -10 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: '.gamer', start: 'top bottom', end: 'bottom top', scrub: true } });

    // 9. TV: chips correm só quando visíveis
    pauseCssWhenHidden($('.chips'));

    // 10. App: celular sobe e gira, cards da tela aparecem em cascata
    gsap.fromTo('[data-phone]', { y: 60, rotate: -8 }, { y: -30, rotate: 4, ease: 'none', scrollTrigger: { trigger: '.app', start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.from('.phone__body > *', { y: 24, opacity: 0, scale: 0.94, duration: 0.6, stagger: 0.12, ease: 'back.out(1.6)', scrollTrigger: { trigger: '.phone', start: 'top 80%', once: true } });
    const uiBar = gsap.fromTo('.ui-bar i', { scaleX: 0 }, { scaleX: 1, transformOrigin: 'left center', duration: 1.6, ease: 'power2.inOut', repeat: -1, repeatDelay: 1.2, yoyo: true, paused: true });
    playWhenVisible('.phone', uiBar);
    pauseCssWhenHidden($('.sim'));
    gsap.fromTo('.sim', { rotate: -12 }, { rotate: 6, ease: 'none', scrollTrigger: { trigger: '.mobile', start: 'top bottom', end: 'bottom top', scrub: true } });

    // 15. FAQ: conteúdo abre suave
    $$('.faq details').forEach((d) => d.addEventListener('toggle', () => {
      if (d.open) gsap.fromTo($('p', d), { height: 0, opacity: 0 }, { height: 'auto', opacity: 1, duration: 0.45, ease: 'power2.out', clearProps: 'height', onComplete: () => ScrollTrigger.refresh() });
      else ScrollTrigger.refresh();
    }));

    // 16. CTA final: cartão expande ao entrar + linhas de velocidade correndo
    gsap.fromTo('.final', { scale: 0.9 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.final', start: 'top bottom', end: 'top 45%', scrub: 0.5 } });
    const streams = gsap.timeline({ paused: true });
    $$('.final__lines i').forEach((l, i) => streams.fromTo(l, { xPercent: -120 }, { xPercent: 320, duration: 2.6 + i * 0.35, ease: 'none', repeat: -1 }, i * 0.3));
    playWhenVisible('.final', streams);

    // Rodapé
    gsap.from('.footer__grid > *, .footer__bottom, .credit', { y: 30, opacity: 0, duration: 0.8, stagger: 0.08, ease: 'power3.out', scrollTrigger: { trigger: '.footer', start: 'top 92%', once: true } });
  }
})();
