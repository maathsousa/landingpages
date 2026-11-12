(function () {
  'use strict';

  var root = document.documentElement;
  var movimento = root.classList.contains('motion');

  /* ---------- Links para a jornada do cliente com UTM ----------
     Mantém gclid/UTMs que chegam do Google Ads; senão usa os padrões desta LP. */
  (function utm() {
    var entrada = new URLSearchParams(window.location.search);
    var padrao = { utm_source: 'lp', utm_medium: 'landing', utm_campaign: 'laranja' };
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

  /* ---------- Simulador: economia em caixas de laranja ----------
     economia anual = conta mensal × 15% × 12
     caixas equivalentes = economia anual ÷ preço da caixa (40,8 kg)
     energia por caixa = (conta mensal × 12) ÷ produção da safra */
  (function simulador() {
    var campo = document.querySelector('[data-sim-valor]');
    var barra = document.querySelector('[data-sim-range]');
    var campoProd = document.querySelector('[data-sim-producao]');
    var campoPreco = document.querySelector('[data-sim-preco]');
    if (!campo || !barra || !campoProd || !campoPreco) return;

    var DESCONTO = 0.15, MIN = 100, MAX = 50000, SLOTS = 24;
    var ajuda = document.querySelector('[data-sim-ajuda]');
    var ajudaPadrao = ajuda.textContent;
    var el = {
      economia: document.querySelector('[data-sim-economia]'),
      qtd: document.querySelector('[data-sim-qtd]'),
      qtdUn: document.querySelector('[data-sim-qtd-un]'),
      escala: document.querySelector('[data-sim-escala]'),
      hoje: document.querySelector('[data-sim-hoje]'),
      netz: document.querySelector('[data-sim-netz]'),
      pilha: document.querySelector('[data-sim-pilha]')
    };

    var caixas = [];
    for (var k = 0; k < SLOTS; k++) {
      var d = document.createElement('div');
      d.className = 'caixa is-oculta';
      d.innerHTML = '<svg class="caixa__vazia"><use href="#caixa"/></svg><svg class="caixa__cheia"><use href="#caixa"/></svg>';
      el.pilha.appendChild(d);
      caixas.push(d);
    }

    function reais(v) { return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
    function qtdTxt(v) { return v < 10 ? v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : Math.round(v).toLocaleString('pt-BR'); }
    function lerReais(i) { var s = i.value.replace(/\D/g, ''); return s ? parseInt(s, 10) / 100 : 0; }
    function lerInteiro(i) { var s = i.value.replace(/\D/g, ''); return s ? parseInt(s, 10) : 0; }
    function escalaDe(n) {
      if (n <= SLOTS) return 1;
      var passos = [2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000];
      for (var i = 0; i < passos.length; i++) if (n / passos[i] <= SLOTS) return passos[i];
      return 20000;
    }

    var atual = { economia: 0, qtd: 0, hoje: 0, netz: 0 };
    var raf, fim;
    function escreve(v, temProd) {
      el.economia.textContent = reais(v.economia);
      el.qtd.textContent = qtdTxt(v.qtd);
      el.hoje.textContent = temProd ? reais(v.hoje) : '—';
      el.netz.textContent = temProd ? reais(v.netz) : '—';
    }
    function anima(alvo, temProd) {
      cancelAnimationFrame(raf); clearTimeout(fim);
      if (!movimento) { atual = alvo; escreve(alvo, temProd); return; }
      /* garante o valor final mesmo com a aba em segundo plano */
      fim = setTimeout(function () { cancelAnimationFrame(raf); atual = alvo; escreve(alvo, temProd); }, 620);
      var de = Object.assign({}, atual), t0 = performance.now(), dur = 550;
      (function passo(t) {
        var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
        Object.keys(alvo).forEach(function (c) { atual[c] = de[c] + (alvo[c] - de[c]) * e; });
        escreve(atual, temProd);
        if (p < 1) raf = requestAnimationFrame(passo);
      })(t0);
    }

    /* só aparecem as caixas da economia; a última pode estar parcialmente cheia */
    function pintaPilha(n) {
      var unidade = escalaDe(n), cheio = n / unidade;
      var visiveis = Math.min(SLOTS, Math.ceil(cheio - 0.001)), nova = 0;
      caixas.forEach(function (c, i) {
        var f = Math.max(0, Math.min(1, cheio - i));
        c.style.setProperty('--corte', ((1 - f) * 100).toFixed(1) + '%');
        var mostrar = i < visiveis, estava = !c.classList.contains('is-oculta');
        c.classList.toggle('is-oculta', !mostrar);
        if (mostrar && !estava && movimento) {
          c.style.setProperty('--d', (nova++ * 45) + 'ms');
          c.classList.remove('is-nova'); void c.offsetWidth; c.classList.add('is-nova');
        }
      });
      el.escala.textContent = unidade === 1 ? 'Cada ícone = 1 caixa de 40,8 kg' : 'Cada ícone = ' + unidade.toLocaleString('pt-BR') + ' caixas de 40,8 kg';
    }

    function calcula() {
      var gasto = lerReais(campo), producao = lerInteiro(campoProd), preco = lerReais(campoPreco);
      var economia = gasto * DESCONTO * 12;
      var qtd = preco > 0 ? economia / preco : 0;
      var hoje = producao > 0 ? (gasto * 12) / producao : 0;
      barra.value = Math.max(MIN, Math.min(MAX, gasto));
      barra.style.setProperty('--fill', ((barra.value - MIN) / (MAX - MIN) * 100).toFixed(1) + '%');
      var baixo = gasto > 0 && gasto < MIN;
      ajuda.classList.toggle('is-alerta', baixo);
      ajuda.textContent = baixo ? 'Contas muito baixas podem não atingir o consumo mínimo de 75 kWh.' : ajudaPadrao;
      el.qtdUn.textContent = Math.round(qtd * 10) / 10 === 1 ? 'caixa' : 'caixas';
      pintaPilha(qtd);
      anima({ economia: economia, qtd: qtd, hoje: hoje, netz: hoje * (1 - DESCONTO) }, producao > 0);
    }

    function mascaraReais(input) {
      input.addEventListener('input', function () {
        var s = input.value.replace(/\D/g, '').slice(0, 9);
        input.value = s ? reais(parseInt(s, 10) / 100) : '';
        calcula();
      });
    }
    mascaraReais(campo);
    mascaraReais(campoPreco);
    campoProd.addEventListener('input', function () {
      var s = campoProd.value.replace(/\D/g, '').slice(0, 8);
      campoProd.value = s ? parseInt(s, 10).toLocaleString('pt-BR') : '';
      calcula();
    });
    barra.addEventListener('input', function () { campo.value = reais(parseFloat(barra.value)); calcula(); });

    /* os números e as caixas já nascem preenchidos (nunca mostra R$ 0,00);
       quando o simulador entra na tela, as caixas só caem de novo, como animação */
    var comMovimento = movimento;
    movimento = false; calcula(); movimento = comMovimento;
    if ('IntersectionObserver' in window && movimento) {
      var io = new IntersectionObserver(function (ents) {
        if (!ents[0].isIntersecting) return;
        io.disconnect();
        caixas.forEach(function (c) { c.classList.add('is-oculta'); });
        var preco = lerReais(campoPreco);
        pintaPilha(preco > 0 ? lerReais(campo) * DESCONTO * 12 / preco : 0);
      }, { threshold: 0.35 });
      io.observe(el.pilha);
    }
  })();

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

  /* ---------- Como funciona: a laranja amadurece com a rolagem ---------- */
  var secComo = document.querySelector('[data-como]');
  var casca = document.querySelector('[data-fruta-casca]');
  var fruta = document.querySelector('[data-fruta]');
  var etapas = document.querySelectorAll('.etapa');
  var marcos = document.querySelectorAll('[data-trilha] span');
  /* verde do fruto novo → amarelado → laranja madura */
  var cor = gsap.utils.interpolate(['#5E8F2A', '#9DAA2C', '#E7A426', '#F28C1E']);
  /* cresce a partir do topo, para o fruto continuar preso ao galho */
  gsap.set(fruta, { svgOrigin: '200 166' });  /* ponto do cálice */

  var flor = document.querySelector('[data-flor]');
  function amadurece(p) {
    var q = Math.max(0, (p - 0.2) / 0.8);               /* 0 na florada, 1 na colheita */
    casca.setAttribute('fill', cor(q));
    casca.style.fill = cor(q);
    var esc = p < 0.2 ? 0.06 : 0.12 + q * 0.88, op = p < 0.15 ? 0 : 1;
    gsap.set(fruta, { scale: esc, opacity: op });
    var f = p < 0.15 ? 1 : Math.max(0, 1 - (p - 0.15) / 0.12);
    gsap.set(flor, { opacity: f, scale: 0.8 + f * 0.2 });
    var idx = Math.min(3, Math.floor(p * 4 + 0.0001));
    marcos.forEach(function (m, i) { m.classList.toggle('is-on', i === idx); });
    return idx;
  }

  var mm = gsap.matchMedia();
  mm.add('(min-width: 960px)', function () {
    secComo.classList.add('is-pin');
    var atualIdx = -1;
    var st = ScrollTrigger.create({
      trigger: '[data-como-stage]', start: 'top top', end: '+=2000', pin: true, scrub: 0.6,
      onUpdate: function (self) {
        var idx = amadurece(self.progress);
        if (idx !== atualIdx) { atualIdx = idx; etapas.forEach(function (e, i) { e.classList.toggle('is-ativo', i === idx); }); }
      }
    });
    amadurece(0);
    etapas[0].classList.add('is-ativo');
    return function () { st.kill(); secComo.classList.remove('is-pin'); etapas.forEach(function (e) { e.classList.remove('is-ativo'); }); amadurece(1); };
  });
  mm.add('(max-width: 959px)', function () {
    amadurece(0);
    ScrollTrigger.create({ trigger: '.fruta', start: 'top 85%', end: 'bottom 30%', scrub: 0.4, onUpdate: function (self) { amadurece(self.progress); } });
    gsap.fromTo(etapas, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: ease, stagger: 0.1, scrollTrigger: { trigger: '.etapas', start: 'top 85%', once: true } });
  });

  /* ---------- CTA final: o sol se põe atrás do pomar ---------- */
  gsap.timeline({ scrollTrigger: { trigger: '[data-poente]', start: 'top 80%', end: 'bottom bottom', scrub: 0.8 } })
    .fromTo('[data-sol]', { y: -230 }, { y: 70, ease: 'none' }, 0)
    .fromTo('[data-noite]', { opacity: 0 }, { opacity: 0.55, ease: 'none' }, 0);

  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
