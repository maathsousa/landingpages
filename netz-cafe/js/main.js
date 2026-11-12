(function () {
  'use strict';

  var root = document.documentElement;

  /* ---------- Links para a jornada do cliente com UTM ----------
     Mantém gclid/UTMs que chegam do Google Ads; senão usa os padrões da LP. */
  (function utm() {
    var entrada = new URLSearchParams(window.location.search);
    var padrao = { utm_source: 'lp', utm_medium: 'landing', utm_campaign: 'cafe' };
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
  function atualizaTopo() { topo.classList.toggle('is-solido', window.scrollY > 40); }
  atualizaTopo();
  window.addEventListener('scroll', atualizaTopo, { passive: true });

  /* ---------- Vídeo do hero: parado para quem pediu menos movimento ---------- */
  var video = document.querySelector('[data-hero-video]');
  if (video && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    video.removeAttribute('autoplay');
    video.pause();
  }

  /* ---------- Passos x diagrama ---------- */
  var diagrama = document.querySelector('.diagrama');
  var grupos = diagrama ? diagrama.querySelectorAll('.d-grupo') : [];
  var passos = document.querySelectorAll('[data-passo]');
  function ativaPasso(n) {
    passos.forEach(function (p) { p.classList.toggle('is-ativo', p.getAttribute('data-passo') === String(n)); });
    if (!diagrama) return;
    diagrama.classList.add('tem-ativo');
    grupos.forEach(function (g) {
      var partes = (g.getAttribute('data-parte') || '').split(' ');
      g.classList.toggle('is-ativo', partes.indexOf(String(n)) > -1);
    });
  }

  /* ---------- Simulador de economia em sacas de café ----------
     economia anual = conta mensal × 15% × 12
     sacas equivalentes = economia anual ÷ preço da saca
     energia por saca = (conta mensal × 12) ÷ produção da safra */
  (function simulador() {
    var campo = document.querySelector('[data-sim-valor]');
    var barra = document.querySelector('[data-sim-range]');
    var campoProd = document.querySelector('[data-sim-producao]');
    var campoPreco = document.querySelector('[data-sim-preco]');
    if (!campo || !barra || !campoProd || !campoPreco) return;

    var DESCONTO = 0.15, MIN = 100, MAX = 30000, SLOTS = 24;
    var ajuda = document.querySelector('[data-sim-ajuda]');
    var ajudaPadrao = ajuda.textContent;
    var el = {
      economia: document.querySelector('[data-sim-economia]'),
      sacas: document.querySelector('[data-sim-sacas]'),
      sacasUn: document.querySelector('[data-sim-sacas-un]'),
      escala: document.querySelector('[data-sim-escala]'),
      hoje: document.querySelector('[data-sim-hoje]'),
      netz: document.querySelector('[data-sim-netz]'),
      pilha: document.querySelector('[data-sim-pilha]')
    };
    var semMovimento = !root.classList.contains('motion');

    /* monta a pilha de sacos uma vez */
    var sacos = [];
    for (var k = 0; k < SLOTS; k++) {
      var d = document.createElement('div');
      d.className = 'saco is-oculto';
      d.innerHTML = '<svg class="saco__vazio"><use href="#saco"/></svg><svg class="saco__cheio"><use href="#saco"/></svg>';
      el.pilha.appendChild(d);
      sacos.push(d);
    }

    function reais(v) { return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
    function sacasTxt(v) { return v < 10 ? v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : Math.round(v).toLocaleString('pt-BR'); }
    function lerReais(input) { var d = input.value.replace(/\D/g, ''); return d ? parseInt(d, 10) / 100 : 0; }
    function lerInteiro(input) { var d = input.value.replace(/\D/g, ''); return d ? parseInt(d, 10) : 0; }

    function escalaDe(n) {
      if (n <= SLOTS) return 1;
      var passos = [2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000];
      for (var i = 0; i < passos.length; i++) if (n / passos[i] <= SLOTS) return passos[i];
      return 10000;
    }

    var atual = { economia: 0, sacas: 0, hoje: 0, netz: 0 };
    var raf, fim, tinhaSacos = false;

    function escreve(v, temProducao) {
      el.economia.textContent = reais(v.economia);
      el.sacas.textContent = sacasTxt(v.sacas);
      el.hoje.textContent = temProducao ? reais(v.hoje) : '—';
      el.netz.textContent = temProducao ? reais(v.netz) : '—';
    }

    function anima(alvo, temProducao) {
      cancelAnimationFrame(raf);
      clearTimeout(fim);
      if (semMovimento) { atual = alvo; escreve(alvo, temProducao); return; }
      fim = setTimeout(function () { cancelAnimationFrame(raf); atual = alvo; escreve(alvo, temProducao); }, 620);
      var de = Object.assign({}, atual), t0 = performance.now(), dur = 550;
      (function passo(t) {
        var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
        Object.keys(alvo).forEach(function (c) { atual[c] = de[c] + (alvo[c] - de[c]) * e; });
        escreve(atual, temProducao);
        if (p < 1) raf = requestAnimationFrame(passo);
      })(t0);
    }

    function pintaPilha(n) {
      var unidade = escalaDe(n);
      var cheio = n / unidade;
      /* só aparecem os sacos da economia; o último pode estar parcialmente cheio */
      var visiveis = Math.min(SLOTS, Math.ceil(cheio - 0.001));
      var novo = 0;
      sacos.forEach(function (s, i) {
        var f = Math.max(0, Math.min(1, cheio - i));
        s.style.setProperty('--corte', ((1 - f) * 100).toFixed(1) + '%');
        var mostrar = i < visiveis;
        var estava = !s.classList.contains('is-oculto');
        s.classList.toggle('is-oculto', !mostrar);
        if (mostrar && !estava && !semMovimento) {
          s.style.setProperty('--d', (novo++ * 45) + 'ms');
          s.classList.remove('is-novo'); void s.offsetWidth; s.classList.add('is-novo');
        }
      });
      tinhaSacos = visiveis > 0;
      el.escala.textContent = unidade === 1 ? 'Cada saco = 1 saca de 60 kg' : 'Cada saco = ' + unidade.toLocaleString('pt-BR') + ' sacas de 60 kg';
    }

    function calcula() {
      var gasto = lerReais(campo), producao = lerInteiro(campoProd), preco = lerReais(campoPreco);
      var economia = gasto * DESCONTO * 12;
      var sacas = preco > 0 ? economia / preco : 0;
      var hoje = producao > 0 ? (gasto * 12) / producao : 0;

      barra.value = Math.max(MIN, Math.min(MAX, gasto));
      barra.style.setProperty('--fill', ((barra.value - MIN) / (MAX - MIN) * 100).toFixed(1) + '%');
      ajuda.classList.toggle('is-alerta', gasto > 0 && gasto < MIN);
      ajuda.textContent = gasto > 0 && gasto < MIN ? 'Contas muito baixas podem não atingir o consumo mínimo de 75 kWh.' : ajudaPadrao;

      el.sacasUn.textContent = Math.round(sacas * 10) / 10 === 1 ? 'saca' : 'sacas';
      pintaPilha(sacas);
      anima({ economia: economia, sacas: sacas, hoje: hoje, netz: hoje * (1 - DESCONTO) }, producao > 0);
    }

    function mascaraReais(input) {
      input.addEventListener('input', function () {
        var d = input.value.replace(/\D/g, '').slice(0, 9);
        input.value = d ? reais(parseInt(d, 10) / 100) : '';
        calcula();
      });
    }
    mascaraReais(campo);
    mascaraReais(campoPreco);
    campoProd.addEventListener('input', function () {
      var d = campoProd.value.replace(/\D/g, '').slice(0, 7);
      campoProd.value = d ? parseInt(d, 10).toLocaleString('pt-BR') : '';
      calcula();
    });
    barra.addEventListener('input', function () {
      campo.value = reais(parseFloat(barra.value));
      calcula();
    });

    /* começa vazio e enche quando o simulador aparece na tela */
    escreve(atual, true);
    pintaPilha(0);
    if ('IntersectionObserver' in window && !semMovimento) {
      var io = new IntersectionObserver(function (ents) {
        if (ents[0].isIntersecting) { io.disconnect(); calcula(); }
      }, { threshold: 0.35 });
      io.observe(el.pilha);
    } else {
      calcula();
    }
  })();

  if (!root.classList.contains('motion') || !window.gsap || !window.ScrollTrigger) return;

  root.classList.add('gsap-ok');
  gsap.registerPlugin(ScrollTrigger);
  var ease = 'expo.out';

  /* ---------- Hero: entrada única + parallax ---------- */
  var heroImg = document.querySelector('.hero__img');
  gsap.timeline({ defaults: { ease: ease } })
    .to(heroImg, { scale: 1, duration: 2.2 }, 0)
    .fromTo('[data-hero]', { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, stagger: 0.09 }, 0.15);
  gsap.to(heroImg, { yPercent: 10, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  /* ---------- Textos ---------- */
  gsap.utils.toArray('[data-reveal]').forEach(function (el) {
    gsap.fromTo(el, { y: 24, opacity: 0 }, {
      y: 0, opacity: 1, duration: 0.9, ease: ease,
      scrollTrigger: { trigger: el, start: 'top 88%', once: true }
    });
  });

  /* ---------- Como funciona: o passo no centro da tela acende o trecho do diagrama ---------- */
  passos.forEach(function (p) {
    ScrollTrigger.create({
      trigger: p, start: 'top 62%', end: 'bottom 62%',
      onToggle: function (st) { if (st.isActive) ativaPasso(p.getAttribute('data-passo')); }
    });
  });
  ScrollTrigger.create({
    trigger: '.como', start: 'top 80%', once: true,
    onEnter: function () { if (!document.querySelector('.passo.is-ativo')) ativaPasso(1); }
  });

  /* ---------- Amanhecer: o sol nasce atrás do cafezal ---------- */
  gsap.timeline({
    scrollTrigger: { trigger: '[data-amanhecer]', start: 'top 85%', end: 'bottom bottom', scrub: 0.8 }
  })
    .fromTo('[data-sol]', { y: 330 }, { y: 0, ease: 'power1.out' }, 0)
    .fromTo('[data-aurora]', { opacity: 0 }, { opacity: 1, ease: 'none' }, 0)
    .fromTo('[data-estrelas]', { opacity: 1 }, { opacity: 0, ease: 'none' }, 0);

  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
