/* Speed Travel — base compartilhada por todas as páginas.
   WhatsApp/tracking, menu, rolagem suave, formulários e animações genéricas.
   A landing (body[data-page="lp"]) chama ST.initGeneric() depois de criar os pins. */
(() => {
  const html = document.documentElement;
  const hasGSAP = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
  if (!hasGSAP) html.classList.add('rm'); // CDN caiu: página estática e legível
  const RM = html.classList.contains('rm');
  const FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;
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

  /* ---------- Rolagem suave ---------- */
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
    nav && nav.classList.toggle('is-scrolled', y > 10);
    const on = y > 640 && (!footer || footer.getBoundingClientRect().top > innerHeight - 40); // some no rodapé pra não cobrir links
    sticky && sticky.classList.toggle('is-on', on);
    fab && fab.classList.toggle('is-on', on);
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (burger && menu) {
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

  /* ---------- Formulários sem servidor ----------
     data-wa-form: monta a mensagem e abre o WhatsApp do próprio usuário.
     data-mail-form="email": abre o e-mail do usuário já preenchido.
     Cada campo vira uma linha "rótulo: valor" (rótulo vem de data-label). */
  const formLines = (form) => [...form.elements]
    .filter((f) => f.name && f.type !== 'checkbox' && f.type !== 'submit' && f.value.trim())
    .map((f) => `${f.dataset.label || f.name}: ${f.value.trim()}`);
  $$('[data-wa-form], [data-mail-form]').forEach((form) => {
    const done = $('[data-form-done]', form.parentElement);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      const intro = form.dataset.intro || 'Olá! Vim pelo site.';
      const body = [intro, '', ...formLines(form)].join('\n');
      trackLead(form.dataset.plan || 'Formulário');
      if (form.hasAttribute('data-wa-form')) window.open(waLink(body), '_blank', 'noopener');
      else location.href = `mailto:${form.dataset.mailForm}?subject=${encodeURIComponent(form.dataset.subject || 'Contato pelo site')}&body=${encodeURIComponent(body)}`;
      if (done) done.hidden = false;
    });
  });

  /* ---------- Canais: busca na grade ---------- */
  const search = $('[data-channel-search]');
  if (search) {
    const chans = $$('.chan'), cats = $$('.grade__cat'), empty = $('[data-channel-empty]');
    const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    search.addEventListener('input', () => {
      const q = norm(search.value.trim());
      chans.forEach((c) => { c.hidden = !!q && !norm(c.dataset.name).includes(q); });
      cats.forEach((g) => { g.hidden = $$('.chan', g).every((c) => c.hidden); });
      empty.hidden = cats.some((g) => !g.hidden);
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    });
  }

  /* ---------- Alternância de modo (ex.: Combo / Controle no Móvel) ---------- */
  $$('[data-modes]').forEach((box) => $$('[data-set-mode]', box).forEach((btn, _, all) => btn.addEventListener('click', () => {
    box.dataset.mode = btn.dataset.setMode;
    all.forEach((b) => { const on = b === btn; b.classList.toggle('is-active', on); b.setAttribute('aria-pressed', on); });
  })));

  const ST = { html, hasGSAP, RM, FINE, WA, $, $$, waLink, setWa, trackLead, lenis, nav, initGeneric: () => {} };
  window.ST = ST;
  if (!hasGSAP) return;

  gsap.registerPlugin(...[window.ScrollTrigger, window.SplitText, window.MotionPathPlugin].filter(Boolean));
  ScrollTrigger.config({ ignoreMobileResize: true }); // barra do navegador mobile não força refresh

  // Animação infinita que só roda enquanto o alvo está na tela
  ST.playWhenVisible = (trigger, anim) => ScrollTrigger.create({ trigger, start: 'top bottom', end: 'bottom top', onToggle: (st) => (st.isActive ? anim.play() : anim.pause()) });
  ST.pauseCssWhenHidden = (el) => el && ScrollTrigger.create({ trigger: el, start: 'top bottom', end: 'bottom top', onToggle: (st) => el.classList.toggle('is-paused', !st.isActive) });

  /* ---------- Mouse: luz que segue o cursor e botões magnéticos (desktop) ---------- */
  if (FINE && !RM) {
    $$('.spot').forEach((el) => {
      let raf = 0, ev;
      el.addEventListener('pointerenter', () => el.classList.add('is-lit'));
      el.addEventListener('pointerleave', () => el.classList.remove('is-lit'));
      el.addEventListener('pointermove', (e) => {
        ev = e;
        if (raf) return;
        raf = requestAnimationFrame(() => { raf = 0; const r = el.getBoundingClientRect(); el.style.setProperty('--mx', `${ev.clientX - r.left}px`); el.style.setProperty('--my', `${ev.clientY - r.top}px`); });
      });
    });
    $$('[data-magnetic]').forEach((el) => {
      const x = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3' }), y = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3' });
      el.addEventListener('pointermove', (e) => { const r = el.getBoundingClientRect(); x((e.clientX - r.left - r.width / 2) * 0.25); y((e.clientY - r.top - r.height / 2) * 0.3); });
      el.addEventListener('pointerleave', () => { x(0); y(0); });
    });
  }

  if (RM) return;

  /* ---------- Animações genéricas (qualquer página) ---------- */
  let started = false;
  ST.initGeneric = () => {
    if (started) return;
    started = true;

    // Barra de progresso de leitura
    gsap.to('.progress span', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });

    // Manchas, nuvens e estrelas em parallax
    $$('[data-speed]').forEach((b) => gsap.to(b, { yPercent: +b.dataset.speed, ease: 'none', scrollTrigger: { trigger: b.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } }));

    // Títulos: linhas sobem de dentro de uma máscara
    if (window.SplitText) $$('[data-split]').forEach((el) => SplitText.create(el, {
      type: 'lines', mask: 'lines', linesClass: 'split-line', autoSplit: true,
      onSplit: (self) => gsap.from(self.lines, { yPercent: 105, duration: 1, stagger: 0.08, ease: 'power4.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } }),
    }));

    // Reveal em lote
    ScrollTrigger.batch('[data-reveal]', {
      start: 'top 90%', once: true,
      onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 0.8, stagger: 0.07, ease: 'power3.out' }),
    });

    // Contadores
    $$('[data-count]').forEach((el) => {
      const end = +el.dataset.count, o = { v: 0 };
      el.textContent = '0';
      gsap.to(o, { v: end, duration: 1.8, ease: 'power2.out', onUpdate: () => (el.textContent = Math.round(o.v)), scrollTrigger: { trigger: el, start: 'top 92%', once: true } });
    });

    // Fotos com parallax interno (o container corta)
    $$('[data-parallax]').forEach((img) => gsap.fromTo(img, { yPercent: -8 }, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } }));

    // Ícones "pulam" pra dentro dos cards
    $$('.bcard .ico, .feat .ico, .refer .ico').forEach((ic) => gsap.from(ic, { scale: 0, rotate: -90, duration: 0.7, ease: 'back.out(2)', scrollTrigger: { trigger: ic, start: 'top 92%', once: true } }));

    // Depoimentos: as faixas correm só quando visíveis
    $$('.reviews__row').forEach((row) => ST.pauseCssWhenHidden(row));

    // FAQ: conteúdo abre suave
    $$('.faq details').forEach((d) => d.addEventListener('toggle', () => {
      if (d.open) gsap.fromTo($('p', d), { height: 0, opacity: 0 }, { height: 'auto', opacity: 1, duration: 0.45, ease: 'power2.out', clearProps: 'height', onComplete: () => ScrollTrigger.refresh() });
      else ScrollTrigger.refresh();
    }));

    // CTA final: cartão expande ao entrar + linhas de velocidade correndo
    const final = $('.final');
    if (final) {
      gsap.fromTo(final, { scale: 0.9 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: final, start: 'top bottom', end: 'top 45%', scrub: 0.5 } });
      const streams = gsap.timeline({ paused: true });
      $$('.final__lines i').forEach((l, i) => streams.fromTo(l, { xPercent: -120 }, { xPercent: 320, duration: 2.6 + i * 0.35, ease: 'none', repeat: -1 }, i * 0.3));
      ST.playWhenVisible(final, streams);
      gsap.fromTo('.final__mark', { rotate: -18, yPercent: 20 }, { rotate: 6, yPercent: -10, ease: 'none', scrollTrigger: { trigger: final, start: 'top bottom', end: 'bottom top', scrub: true } });
    }

    // Rodapé
    gsap.from('.footer__main > *, .footer__bottom', { y: 30, opacity: 0, duration: 0.8, stagger: 0.08, ease: 'power3.out', scrollTrigger: { trigger: '.footer', start: 'top 92%', once: true } });

    addEventListener('load', () => ScrollTrigger.refresh());
  };

  // Páginas internas: animações genéricas assim que as fontes carregam
  if (document.body.dataset.page !== 'lp') {
    Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 900))]).then(() => {
      gsap.from('.page-hero [data-hero-in]', { opacity: 0, y: 24, duration: 0.9, stagger: 0.08, ease: 'power3.out' });
      ST.initGeneric();
    });
  }
})();
