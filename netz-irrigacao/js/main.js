(function () {
  'use strict';

  var root = document.documentElement;
  var movimento = root.classList.contains('motion');

  /* ---------- Links para a jornada do cliente com UTM ----------
     Mantém gclid/UTMs que chegam do Google Ads; senão usa os padrões desta LP. */
  (function utm() {
    var entrada = new URLSearchParams(window.location.search);
    var padrao = { utm_source: 'lp', utm_medium: 'organico', utm_campaign: 'irrigacao' };
    document.querySelectorAll('[data-cta]').forEach(function (a) {
      var url = new URL(a.getAttribute('href'));
      Object.keys(padrao).forEach(function (k) { url.searchParams.set(k, entrada.get(k) || padrao[k]); });
      ['utm_term', 'utm_content', 'gclid', 'gbraid', 'wbraid'].forEach(function (k) {
        if (entrada.get(k)) url.searchParams.set(k, entrada.get(k));
      });
      a.setAttribute('href', url.toString());
    });
  })();

  /* ---------- Topo sólido ao rolar ---------- */
  var topo = document.querySelector('[data-topo]');
  var whats = document.querySelector('.whats');
  var hero = document.querySelector('.hero');
  function atualizaTopo() {
    topo.classList.toggle('is-solido', window.scrollY > 40);
    if (whats && hero) whats.classList.toggle('is-escondido', window.scrollY < hero.offsetHeight * 0.6);
  }
  atualizaTopo();
  window.addEventListener('scroll', atualizaTopo, { passive: true });

  /* ---------- Vídeo do hero: parado para quem pediu menos movimento ---------- */
  var video = document.querySelector('[data-hero-video]');
  if (video && !movimento) { video.removeAttribute('autoplay'); video.pause(); }

  /* setor de círculo (em graus, 0 = 12 horas, sentido horário) como caminho SVG */
  function setor(cx, cy, r, graus) {
    if (graus >= 359.99) return 'M' + cx + ' ' + cy + 'm-' + r + ' 0a' + r + ' ' + r + ' 0 1 0 ' + (2 * r) + ' 0a' + r + ' ' + r + ' 0 1 0 -' + (2 * r) + ' 0';
    if (graus <= 0) return 'M' + cx + ' ' + cy + 'Z';
    var a = (graus - 90) * Math.PI / 180;
    var x = cx + r * Math.cos(a), y = cy + r * Math.sin(a);
    return 'M' + cx + ' ' + cy + 'L' + cx + ' ' + (cy - r) + 'A' + r + ' ' + r + ' 0 ' + (graus > 180 ? 1 : 0) + ' 1 ' + x.toFixed(2) + ' ' + y.toFixed(2) + 'Z';
  }

  /* ---------- Simulador: economia da irrigação ----------
     economia anual = conta mensal × 15% × 12
     economia por hectare = economia anual ÷ área irrigada
     energia por hectare = (conta mensal × 12) ÷ área irrigada
     pivôs = área ÷ 65 ha (média nacional ANA/Inpe) */
  (function simulador() {
    var campo = document.querySelector('[data-sim-valor]');
    var barra = document.querySelector('[data-sim-range]');
    var campoArea = document.querySelector('[data-sim-area]');
    if (!campo || !barra || !campoArea) return;

    var DESCONTO = 0.15, MIN = 1000, MAX = 200000, HA_PIVO = 65, MAX_ICONES = 12;
    var ajuda = document.querySelector('[data-sim-ajuda]');
    var ajudaPadrao = ajuda.textContent;
    var atalhos = document.querySelectorAll('[data-atalho]');
    var el = {
      economia: document.querySelector('[data-sim-economia]'),
      ha: document.querySelector('[data-sim-ha]'),
      hoje: document.querySelector('[data-sim-hoje]'),
      netz: document.querySelector('[data-sim-netz]'),
      pivosTxt: document.querySelector('[data-sim-pivos-txt]'),
      pivos: document.querySelector('[data-sim-pivos]'),
      fatia: document.querySelector('[data-fatia]'),
      braco: document.querySelector('[data-fatia-braco]')
    };
    var GRAUS = 360 * DESCONTO;

    function reais(v) { return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
    function lerReais(i) { var s = i.value.replace(/\D/g, ''); return s ? parseInt(s, 10) / 100 : 0; }
    function lerInteiro(i) { var s = i.value.replace(/\D/g, ''); return s ? parseInt(s, 10) : 0; }

    /* a fatia de 15% do pivô se abre e o braço para na borda dela */
    function abreFatia(p) {
      var g = GRAUS * p;
      el.fatia.setAttribute('d', setor(110, 110, 100, g));
      el.braco.style.transform = 'rotate(' + g + 'deg)';
    }
    function giraFatia() {
      if (!movimento) { abreFatia(1); return; }
      var t0 = performance.now(), dur = 900;
      (function passo(t) {
        var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
        abreFatia(e);
        if (p < 1) requestAnimationFrame(passo);
      })(t0);
    }

    var qtdPivos = -1;
    function pintaPivos(area) {
      var n = area > 0 ? Math.max(1, Math.round(area / HA_PIVO)) : 0;
      el.pivosTxt.textContent = n === 0 ? 'Informe a área irrigada' : 'Cerca de ' + n.toLocaleString('pt-BR') + (n === 1 ? ' pivô' : ' pivôs') + ' de 65 ha';
      if (n === qtdPivos) return;
      var antes = Math.max(0, Math.min(qtdPivos, MAX_ICONES));
      qtdPivos = n;
      var mostrar = Math.min(n, MAX_ICONES);
      el.pivos.innerHTML = '';
      for (var i = 0; i < mostrar; i++) {
        var d = document.createElement('div');
        d.className = 'mini' + (movimento && i >= antes ? ' is-novo' : '');
        d.style.setProperty('--d', (-i * 0.7) + 's');
        d.style.setProperty('--e', ((i - antes) * 50) + 'ms');
        d.innerHTML = '<svg viewBox="0 0 40 40"><use href="#mini-pivo"/></svg>';
        el.pivos.appendChild(d);
      }
      if (n > MAX_ICONES) {
        var mais = document.createElement('span');
        mais.className = 'pivos__mais';
        mais.textContent = '+' + (n - MAX_ICONES).toLocaleString('pt-BR');
        el.pivos.appendChild(mais);
      }
    }

    var atual = { economia: 0, ha: 0, hoje: 0, netz: 0 };
    var raf, fim;
    function escreve(v, temArea) {
      el.economia.textContent = reais(v.economia);
      el.ha.textContent = temArea ? reais(v.ha) : '—';
      el.hoje.textContent = temArea ? reais(v.hoje) : '—';
      el.netz.textContent = temArea ? reais(v.netz) : '—';
    }
    function anima(alvo, temArea) {
      cancelAnimationFrame(raf); clearTimeout(fim);
      if (!movimento) { atual = alvo; escreve(alvo, temArea); return; }
      /* garante o valor final mesmo com a aba em segundo plano */
      fim = setTimeout(function () { cancelAnimationFrame(raf); atual = alvo; escreve(alvo, temArea); }, 620);
      var de = Object.assign({}, atual), t0 = performance.now(), dur = 550;
      (function passo(t) {
        var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
        Object.keys(alvo).forEach(function (c) { atual[c] = de[c] + (alvo[c] - de[c]) * e; });
        escreve(atual, temArea);
        if (p < 1) raf = requestAnimationFrame(passo);
      })(t0);
    }

    function calcula(deAtalho) {
      var gasto = lerReais(campo), area = lerInteiro(campoArea);
      var economia = gasto * DESCONTO * 12;
      var hoje = area > 0 ? (gasto * 12) / area : 0;
      barra.value = Math.max(MIN, Math.min(MAX, gasto));
      barra.style.setProperty('--fill', ((barra.value - MIN) / (MAX - MIN) * 100).toFixed(1) + '%');
      var baixo = gasto > 0 && gasto < 100;
      ajuda.classList.toggle('is-alerta', baixo);
      ajuda.textContent = baixo ? 'Contas muito baixas podem não atingir o consumo mínimo de 75 kWh.' : ajudaPadrao;
      if (!deAtalho) atalhos.forEach(function (b) { b.classList.remove('is-on'); });
      pintaPivos(area);
      anima({ economia: economia, ha: area > 0 ? economia / area : 0, hoje: hoje, netz: hoje * (1 - DESCONTO) }, area > 0);
    }

    function mascaraReais(input) {
      input.addEventListener('input', function () {
        var s = input.value.replace(/\D/g, '').slice(0, 10);
        input.value = s ? reais(parseInt(s, 10) / 100) : '';
        calcula();
      });
    }
    mascaraReais(campo);
    campoArea.addEventListener('input', function () {
      var s = campoArea.value.replace(/\D/g, '').slice(0, 7);
      campoArea.value = s ? parseInt(s, 10).toLocaleString('pt-BR') : '';
      calcula();
    });
    barra.addEventListener('input', function () { campo.value = reais(parseFloat(barra.value)); calcula(); });
    atalhos.forEach(function (b) {
      b.addEventListener('click', function () {
        var v = b.getAttribute('data-atalho').split(',');
        campo.value = reais(parseFloat(v[0]));
        campoArea.value = parseInt(v[1], 10).toLocaleString('pt-BR');
        atalhos.forEach(function (x) { x.classList.toggle('is-on', x === b); });
        calcula(true);
        giraFatia();
      });
    });

    /* os números já nascem preenchidos (nunca mostra R$ 0,00);
       quando o simulador entra na tela, a fatia do pivô se abre */
    var comMovimento = movimento;
    movimento = false; calcula(true); movimento = comMovimento;
    abreFatia(1);
    if ('IntersectionObserver' in window && movimento) {
      abreFatia(0);
      var io = new IntersectionObserver(function (ents) {
        if (!ents[0].isIntersecting) return;
        io.disconnect();
        giraFatia();
      }, { threshold: 0.4 });
      io.observe(el.fatia.ownerSVGElement);
    }
  })();

  /* ---------- Como funciona: estado do pivô (sem animação fica completo) ---------- */
  var secComo = document.querySelector('[data-como]');
  var setorPivo = document.querySelector('[data-setor]');
  var braco = document.querySelector('[data-braco]');
  var etapas = document.querySelectorAll('.etapa');
  var marcos = document.querySelectorAll('[data-trilha] span');
  /* p = 0 → braço às 12 horas e nada irrigado; p = 1 → volta completa */
  function giraPivo(p) {
    var g = Math.max(0, Math.min(1, p)) * 360;
    setorPivo.setAttribute('d', setor(220, 220, 190, g));
    braco.style.transform = 'rotate(' + (g - 90) + 'deg)';
    var idx = Math.min(3, Math.floor(p * 4 + 0.0001));
    marcos.forEach(function (m, i) { m.classList.toggle('is-on', i === idx); });
    return idx;
  }
  giraPivo(1);

  if (!movimento || !window.gsap || !window.ScrollTrigger) return;

  root.classList.add('gsap-ok');
  gsap.registerPlugin(ScrollTrigger);
  var ease = 'expo.out';

  /* ---------- Hero: entrada única + parallax ---------- */
  gsap.timeline({ defaults: { ease: ease } })
    .to(video, { scale: 1, duration: 2.2 }, 0)
    .fromTo('[data-hero]', { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, stagger: 0.09 }, 0.15);
  gsap.to(video, { yPercent: 10, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  /* ---------- Textos ---------- */
  gsap.utils.toArray('[data-reveal]').forEach(function (n) {
    gsap.fromTo(n, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: ease, scrollTrigger: { trigger: n, start: 'top 88%', once: true } });
  });

  /* ---------- Como funciona: o pivô dá uma volta com a rolagem ---------- */
  var mm = gsap.matchMedia();
  mm.add('(min-width: 960px)', function () {
    secComo.classList.add('is-pin');
    var atualIdx = -1;
    var st = ScrollTrigger.create({
      trigger: '[data-como-stage]', start: 'top top', end: '+=2200', pin: true, scrub: 0.6,
      onUpdate: function (self) {
        var idx = giraPivo(self.progress);
        if (idx !== atualIdx) { atualIdx = idx; etapas.forEach(function (e, i) { e.classList.toggle('is-ativo', i === idx); }); }
      }
    });
    giraPivo(0);
    etapas[0].classList.add('is-ativo');

    /* o círculo inclina seguindo o mouse, como se a câmera do drone acompanhasse */
    var tela = document.querySelector('[data-pivo-tela]');
    var svg = document.querySelector('[data-pivo]');
    function inclina(e) {
      var r = tela.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      svg.style.setProperty('--ry', (x * 14).toFixed(2) + 'deg');
      svg.style.setProperty('--rx', (-y * 14).toFixed(2) + 'deg');
    }
    function solta() { svg.style.setProperty('--rx', '0deg'); svg.style.setProperty('--ry', '0deg'); }
    secComo.addEventListener('pointermove', inclina);
    secComo.addEventListener('pointerleave', solta);

    return function () {
      st.kill(); secComo.classList.remove('is-pin');
      secComo.removeEventListener('pointermove', inclina); secComo.removeEventListener('pointerleave', solta); solta();
      etapas.forEach(function (e) { e.classList.remove('is-ativo'); }); giraPivo(1);
    };
  });
  mm.add('(max-width: 959px)', function () {
    giraPivo(0);
    ScrollTrigger.create({ trigger: '.pivo', start: 'top 85%', end: 'bottom 25%', scrub: 0.4, onUpdate: function (self) { giraPivo(self.progress); } });
    gsap.fromTo(etapas, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: ease, stagger: 0.1, scrollTrigger: { trigger: '.etapas', start: 'top 85%', once: true } });
  });

  /* ---------- CTA final: o sol se põe, a noite cai e as luzes do pivô acendem ---------- */
  gsap.timeline({ scrollTrigger: { trigger: '[data-noite-sec]', start: 'top 85%', end: 'bottom bottom', scrub: 0.8 } })
    .fromTo('[data-sol]', { y: -260 }, { y: 120, ease: 'none' }, 0)
    .fromTo('[data-escuro]', { opacity: 0 }, { opacity: 1, ease: 'none' }, 0)
    .fromTo('[data-estrelas]', { opacity: 0 }, { opacity: 1, ease: 'none' }, 0.4)
    .fromTo('[data-lua]', { opacity: 0, y: 60 }, { opacity: 1, y: 0, ease: 'none' }, 0.3)
    .fromTo('[data-lampada]', { opacity: 0 }, { opacity: 1, stagger: 0.08, ease: 'none' }, 0.55);

  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
