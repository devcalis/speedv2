# Speed Travel — Site

Site da Speed Travel Telecom (internet fibra em Cacoal e Ji-Paraná/RO).

Páginas: `index.html` (landing de vendas), `canais.html`, `movel.html`, `empresas.html`, `indique.html`, `privacidade.html`. Contratos e regulamentos em `assets/docs/`.

JS: `assets/js/site.js` é a base de todas as páginas (WhatsApp, menu, formulários, animações genéricas); `assets/js/main.js` é só da landing. Ao alterar CSS/JS, suba o `?v=` nos links dos HTML.
HTML/CSS/JS estático, sem build. Animações com GSAP 3.13 (ScrollTrigger, SplitText, MotionPath) e Lenis, via CDN.

## Rodar localmente

Abra `index.html` com qualquer servidor estático, por exemplo:

```bash
npx serve .
```

## Teste

```bash
node tests/plan-logic.test.js
```

## Antes de publicar

- Trocar as fotos provisórias (Unsplash) por fotos reais da Speed Travel.
- Preencher os placeholders em âmbar (`.ph`) com os dados do cliente.

Desenvolvido pela [Keycodes](https://keycodes.com.br/).
