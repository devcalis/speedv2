/* Speed Travel — landing page. Usa a base compartilhada window.ST (site.js).
   GSAP 3.13 + ScrollTrigger + SplitText + MotionPath. */
(() => {
  const { hasGSAP, RM, FINE, $, $$, setWa, nav } = window.ST;

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
  // Link de outra página pra aba de combos (index.html#combos)
  if (location.hash === '#combos') { selectTab($('#t-combo')); requestAnimationFrame(() => $('#planos').scrollIntoView()); }

  /* ---------- Cards de plano: foto, borda de luz e número que "corre" ---------- */
  const planCards = $$('[data-plan-card]');
  if (FINE) {
    planCards.forEach((card) => {
      const num = $('[data-count-to]', card), end = +num.dataset.countTo, o = { v: end };
      card.addEventListener('pointermove', (e) => { const r = card.getBoundingClientRect(); card.style.setProperty('--mx', `${e.clientX - r.left}px`); card.style.setProperty('--my', `${e.clientY - r.top}px`); });
      if (hasGSAP && !RM && end > 1) card.addEventListener('pointerenter', () => gsap.fromTo(o, { v: 0 }, { v: end, duration: 0.6, ease: 'power3.out', onUpdate: () => (num.textContent = Math.round(o.v)) }));
    });
  } else if ('IntersectionObserver' in window) {
    // sem mouse: o card inteiro na tela (o centralizado no carrossel) ganha a foto
    // root = o próprio carrossel: mede só o deslize lateral (o card é mais alto que 85% da tela no celular)
    const onSee = (ents) => ents.forEach((en) => en.target.classList.toggle('is-active', en.intersectionRatio >= 0.85));
    $$('.plans .cards').forEach((row) => { const io = new IntersectionObserver(onSee, { root: row, threshold: [0, 0.85] }); $$('[data-plan-card]', row).forEach((c) => io.observe(c)); });
  }

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

  /* ---------- Hero: "Monte sua velocidade" (funciona mesmo sem animação) ---------- */
  const SPEEDS = [
    { n: 300, unit: 'Mega', up: 150, wifi: 'Wi-Fi 5', price: '94,99', dl: 44, name: 'Fibra 300 MEGA Kiddle Pass', label: 'Fibra 300 Mega', flag: 'Kiddle Pass' },
    { n: 500, unit: 'Mega', up: 250, wifi: 'Wi-Fi 5', price: '104,99', dl: 27, name: 'Fibra 500 MEGA', label: 'Fibra 500 Mega' },
    { n: 700, unit: 'Mega', up: 350, wifi: 'Wi-Fi 6', price: '114,99', dl: 19, name: 'Fibra 700 MEGA', label: 'Fibra 700 Mega', flag: 'Melhor oferta' },
    { n: 800, unit: 'Mega', up: 400, wifi: 'Wi-Fi 6', price: '124,99', dl: 17, name: 'Fibra 800 MEGA', label: 'Fibra 800 Mega' },
    { n: 1, unit: 'Giga', up: 500, wifi: 'Wi-Fi 6', price: '154,99', dl: 13, name: 'Fibra 1000 MEGA', label: 'Fibra 1 Giga' },
  ];
  const picker = $('[data-speed-picker]');
  if (picker) {
    const range = $('[data-o-range]', picker), ticks = $$('.range__ticks span', picker);
    const out = (k) => $(`[data-o-${k}]`, picker);
    const speedEl = out('speed'), shown = { v: 700 };
    const pick = (i, animate) => {
      const p = SPEEDS[i];
      range.style.setProperty('--p', `${(i / (SPEEDS.length - 1)) * 100}%`);
      range.setAttribute('aria-valuetext', `${p.n} ${p.unit}, R$ ${p.price} por mês`);
      ticks.forEach((t, k) => t.classList.toggle('is-on', k === i));
      out('unit').textContent = p.unit;
      out('up').textContent = p.up;
      out('wifi').textContent = p.wifi;
      out('dl').textContent = p.dl;
      out('price').textContent = p.price;
      out('flag').hidden = !p.flag;
      if (p.flag) out('flag').textContent = p.flag;
      const msg = `Olá! Vim pelo site e quero assinar o plano ${p.name} (R$ ${p.price}/mês).`;
      const cta = out('cta');
      cta.dataset.plan = p.name;
      setWa(cta, msg);
      // a barra fixa do mobile acompanha a escolha
      $('[data-s-name]').textContent = p.label;
      $('[data-s-price]').textContent = `R$ ${p.price}`;
      const sCta = $('[data-s-cta]');
      sCta.dataset.plan = `Barra fixa: ${p.name}`;
      setWa(sCta, msg);
      // número da velocidade "corre" até o novo valor
      if (animate && hasGSAP && !RM && p.unit === 'Mega' && shown.v > 1) {
        gsap.to(shown, { v: p.n, duration: 0.45, ease: 'power3.out', onUpdate: () => (speedEl.textContent = Math.round(shown.v)) });
        gsap.fromTo(out('price').parentElement, { y: -6, opacity: 0.4 }, { y: 0, opacity: 1, duration: 0.35, ease: 'power3.out' });
      } else {
        if (hasGSAP) gsap.killTweensOf(shown);
        speedEl.textContent = p.n;
      }
      shown.v = p.n;
    };
    range.addEventListener('input', () => pick(+range.value, true));
    ticks.forEach((t, k) => t.addEventListener('click', () => { range.value = k; pick(k, true); }));
    pick(+range.value, false);
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
      .from(['.hero .pill', '.hero__sub', '.hero__rating', '.hero .cep', '.hero__alt'], { opacity: 0, y: 18, duration: 0.8, stagger: 0.07 }, 0.15)
      .from('[data-hero-card]', { y: 40, opacity: 0, duration: 1, ease: 'expo.out' }, 0.2)
      .from('[data-hero-photo] img', { scale: 1.18, duration: 1.8, ease: 'expo.out' }, 0.2)
      .from('.offer__body > *', { y: 14, opacity: 0, duration: 0.6, stagger: 0.05 }, 0.55)
      .from('.trust li', { y: 18, opacity: 0, duration: 0.7, stagger: 0.07 }, 0.6);
    initScroll();
  });

  /* ---------- Mouse: parallax leve das camadas do hero (desktop) ---------- */
  if (FINE) {
    const layers = [['.hero__lines', 14], ['.hero__mark', -18]].map(([sel, d]) => ({ d, x: gsap.quickTo(sel, 'x', { duration: 0.9, ease: 'power3' }) }));
    const tilt = { x: gsap.quickTo('[data-hero-card]', 'rotationY', { duration: 0.8, ease: 'power3' }), y: gsap.quickTo('[data-hero-card]', 'rotationX', { duration: 0.8, ease: 'power3' }) };
    gsap.set('[data-hero-card]', { transformPerspective: 1200 });
    $('.hero').addEventListener('pointermove', (e) => {
      const dx = e.clientX / innerWidth - 0.5, dy = e.clientY / innerHeight - 0.5;
      layers.forEach((l) => l.x(dx * l.d));
      tilt.x(dx * 3); tilt.y(-dy * 2);
    });
  }

  /* ---------- Tudo que depende de scroll ---------- */
  function initScroll() {
    const mm = gsap.matchMedia();
    const pinnable = '(min-width: 900px) and (min-height: 680px)';
    const notPinnable = 'not all and (min-width: 900px) and (min-height: 680px)';

    // Hero: camadas em velocidades diferentes ao sair de cena
    gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } })
      .to('.hero__copy', { yPercent: -12, opacity: 0.25 }, 0)
      .to('[data-hero-card]', { yPercent: -8 }, 0)
      .to('[data-hero-photo] img', { scale: 1.1 }, 0)
      .to('.hero__lines', { yPercent: 16 }, 0)
      .to('.hero__mark', { yPercent: 30, rotate: -10 }, 0);

    // Pulsos de luz correndo pelas fibras (pausam fora da tela)
    const pulses = gsap.timeline({ paused: true });
    $$('.hero__pulses path').forEach((p, i) => pulses.to(p, { strokeDashoffset: 0, duration: 3.6 + i * 0.7, ease: 'none', repeat: -1 }, i * 0.9));
    ST.playWhenVisible('.hero', pulses);

    /* ===== PINS (sempre primeiro, em ordem de página) ===== */

    // Dor — fixa e "resolve" cada problema conforme rola
    const items = $$('.pain__list li');
    const setSolved = (p) => items.forEach((li, i) => li.classList.toggle('is-solved', p > (i + 0.6) / (items.length + 1.6)));
    const painTimeline = (st) => gsap.timeline({ scrollTrigger: Object.assign({ scrub: 0.5, onUpdate: (s) => setSolved(s.progress) }, st) })
      .to({}, { duration: items.length })
      .to('.pain__close', { opacity: 0.45, duration: 0.6 })
      .fromTo('.pain__fix', { opacity: 0, y: 24, scale: 0.92 }, { opacity: 1, y: 0, scale: 1, duration: 1, ease: 'back.out(1.6)' }, '<');
    mm.add(pinnable, () => { painTimeline({ trigger: '.pain', start: () => 'top ' + headerOffset() + 'px', end: '+=110%', pin: true, fastScrollEnd: true }); });
    mm.add(notPinnable, () => { painTimeline({ trigger: '.pain__list', start: 'top 70%', end: 'bottom 30%' }); });

    // Prova — fixa: contador e barra andam com o scroll
    const proofNum = $('[data-proof-num]'), pv = { v: 0 };
    const proofTl = (st) => gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: st })
      .fromTo(pv, { v: 0 }, { v: 618, duration: 1, onUpdate: () => (proofNum.textContent = Math.round(pv.v)) }, 0)
      .fromTo('.meter__fill', { scaleX: 0 }, { scaleX: 1, duration: 1 }, 0)
      .from('.proof__rank', { opacity: 0, y: 14, duration: 0.3 }, 0.75);
    mm.add(pinnable, () => { proofTl({ trigger: '.proof', start: () => 'top ' + headerOffset() + 'px', end: '+=70%', pin: true, scrub: 0.6, fastScrollEnd: true }); });
    mm.add(notPinnable, () => { proofTl({ trigger: '.proof__card', start: 'top 85%', end: 'top 35%', scrub: 0.6 }); });

    // Animações genéricas (títulos, reveals, contadores, parallax, FAQ, CTA final, rodapé)
    ST.initGeneric();

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

    // Manifesto: palavras acendem conforme a rolagem
    const mf = $('[data-manifesto]');
    SplitText.create(mf, { type: 'words', autoSplit: true, onSplit: (self) => gsap.fromTo(self.words, { opacity: 0.14 }, { opacity: 1, stagger: 0.1, ease: 'none', scrollTrigger: { trigger: mf, start: 'top 80%', end: 'bottom 50%', scrub: 0.5 } }) });
    gsap.fromTo('.manifesto__mark', { rotate: -14, yPercent: 12 }, { rotate: 8, yPercent: -12, ease: 'none', scrollTrigger: { trigger: '.manifesto', start: 'top bottom', end: 'bottom top', scrub: true } });

    gsap.from(items, { opacity: 0, x: -24, duration: 0.6, stagger: 0.06, ease: 'power3.out', scrollTrigger: { trigger: '.pain__list', start: 'top 88%', once: true } });

    // Painéis e cards grandes "chegam" com escala ao entrar
    $$('.tv, .quiz, .duo__card, .trio__card').forEach((el) => gsap.fromTo(el, { scale: 0.94 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'top 55%', scrub: 0.5 } }));

    // Story: fibra desenha, pulso viaja, nós acendem, barra de etapas enche
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

    // Benefícios: fotos abrem com máscara
    $$('.bcard--photo').forEach((c) => gsap.from(c, { clipPath: 'inset(18% 6% 0% 6% round 28px)', duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: c, start: 'top 85%', once: true } }));

    // Planos: no desktop os cards saem empilhados atrás do destaque e abrem em leque
    mm.add('(min-width: 1200px)', () => {
      const cards = $$('#tab-fibra .plan'), hot = $('#tab-fibra .plan--hot'), hi = cards.indexOf(hot);
      cards.forEach((c, i) => gsap.set(c, { zIndex: 10 - Math.abs(i - hi) }));
      gsap.fromTo(cards,
        { x: (i, el) => hot.offsetLeft - el.offsetLeft, y: (i) => 30 + Math.abs(i - hi) * 16, rotate: (i) => (i - hi) * 4, scale: (i) => (i === hi ? 1 : 0.88), opacity: (i) => (i === hi ? 1 : 0.5) },
        { x: 0, y: 0, rotate: 0, scale: 1, opacity: 1, ease: 'power2.out', scrollTrigger: { trigger: '#tab-fibra .cards', start: 'top 88%', end: 'top 30%', scrub: 0.6, invalidateOnRefresh: true } });
    });
    mm.add('(max-width: 1199px)', () => { gsap.from('#tab-fibra .plan', { x: 60, opacity: 0, duration: 0.8, stagger: 0.08, ease: 'power3.out', clearProps: 'transform,opacity', scrollTrigger: { trigger: '.tabs', start: 'top 88%', once: true } }); });
    gsap.from('.tabs', { y: 20, opacity: 0, scale: 0.96, duration: 0.7, ease: 'power3.out', scrollTrigger: { trigger: '.tabs', start: 'top 92%', once: true } });

    // Quiz: lado escuro desliza, opções entram em cascata
    gsap.from('.quiz__intro', { xPercent: -8, opacity: 0, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: '.quiz', start: 'top 80%', once: true } });
    gsap.from('.quiz__step.is-active .opt', { y: 20, opacity: 0, duration: 0.6, stagger: 0.07, ease: 'power3.out', scrollTrigger: { trigger: '.quiz', start: 'top 75%', once: true } });

    // Gamer: foto revela com máscara + parallax
    gsap.fromTo('.gamer__media', { clipPath: 'inset(14% 14% 14% 14% round 36px)' }, { clipPath: 'inset(0% 0% 0% 0% round 36px)', ease: 'none', scrollTrigger: { trigger: '.gamer', start: 'top 85%', end: 'center center', scrub: 0.5 } });
    gsap.fromTo('.gamer__media img', { yPercent: -10 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: '.gamer', start: 'top bottom', end: 'bottom top', scrub: true } });

    // TV: chips correm só quando visíveis
    ST.pauseCssWhenHidden($('.chips'));

    // App: celular sobe e gira, cards da tela aparecem em cascata
    gsap.fromTo('[data-phone]', { y: 60, rotate: -8 }, { y: -30, rotate: 4, ease: 'none', scrollTrigger: { trigger: '.app', start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.from('.phone__body > *', { y: 24, opacity: 0, scale: 0.94, duration: 0.6, stagger: 0.12, ease: 'back.out(1.6)', scrollTrigger: { trigger: '.phone', start: 'top 80%', once: true } });
    const uiBar = gsap.fromTo('.ui-bar i', { scaleX: 0 }, { scaleX: 1, transformOrigin: 'left center', duration: 1.6, ease: 'power2.inOut', repeat: -1, repeatDelay: 1.2, yoyo: true, paused: true });
    ST.playWhenVisible('.phone', uiBar);
    ST.pauseCssWhenHidden($('.sim'));
    gsap.fromTo('.sim', { rotate: -12 }, { rotate: 6, ease: 'none', scrollTrigger: { trigger: '.mobile', start: 'top bottom', end: 'bottom top', scrub: true } });

    ST.pauseCssWhenHidden($('.hero'));
  }
})();
