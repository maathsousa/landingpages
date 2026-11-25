(function () {
  'use strict';

  var root = document.documentElement;
  var movimento = root.classList.contains('motion');
  var encerrada = root.classList.contains('bf-encerrada');

  /* ---------- Links para a jornada do cliente com UTM ----------
     Mantém gclid/UTMs que chegam do Google Ads; senão usa os padrões desta LP. */
  (function utm() {
    var entrada = new URLSearchParams(window.location.search);
    var padrao = { utm_source: 'lp', utm_medium: 'landing', utm_campaign: 'black-friday-2026-prorrogada' };
    document.querySelectorAll('[data-cta]').forEach(function (a) {
      var url = new URL(a.getAttribute('href'));
      Object.keys(padrao).forEach(function (k) { url.searchParams.set(k, entrada.get(k) || padrao[k]); });
      ['utm_term', 'utm_content', 'gclid', 'gbraid', 'wbraid'].forEach(function (k) {
        if (entrada.get(k)) url.searchParams.set(k, entrada.get(k));
      });
      a.setAttribute('href', url.toString());
    });
  })();

  /* ---------- Topo sólido e WhatsApp depois da primeira tela ---------- */
  var topo = document.querySelector('[data-topo]');
  var whats = document.querySelector('.whats');
  function atualizaTopo() {
    topo.classList.toggle('is-solido', window.scrollY > 40);
    if (whats) whats.classList.toggle('is-escondido', window.scrollY < window.innerHeight * 0.6);
  }
  atualizaTopo();
  window.addEventListener('scroll', atualizaTopo, { passive: true });

  /* ---------- Prazo estendido da campanha: assinaturas até 10/12/2026, 23h59 de Brasília ---------- */
  (function prazo() {
    if (encerrada) return;
    var FIM = Date.UTC(2026, 11, 11, 2, 59, 59);
    var dias = Math.ceil((FIM - Date.now()) / 86400000);
    var heroPrazo = document.querySelector('[data-prazo]');
    var num = document.querySelector('[data-contagem-num]');
    var txt = document.querySelector('[data-contagem-txt]');
    var resto = 'para assinar com 50% de economia na primeira conta';
    if (dias <= 1) {
      if (heroPrazo) heroPrazo.innerHTML = '<strong>Último dia:</strong> assinaturas até hoje, 10 de dezembro, às 23h59.';
      if (num) num.textContent = 'Hoje';
      if (txt) txt.textContent = 'é o último dia ' + resto;
    } else {
      var plural = dias + ' dias';
      if (heroPrazo) heroPrazo.innerHTML = '<strong>Faltam ' + plural + '.</strong> Prazo estendido até 10 de dezembro.';
      if (num) num.textContent = plural;
      if (txt) txt.textContent = resto;
    }
  })();

  /* ---------- Simulador ----------
     primeira conta (Black Friday) = conta mensal × 50%
     contas seguintes = conta mensal × 15% por mês
     primeiro ano = primeira conta + 11 contas seguintes
     Depois do prazo: só o desconto de até 15% (12 meses). */
  (function simulador() {
    var campo = document.querySelector('[data-sim-valor]');
    var barra = document.querySelector('[data-sim-range]');
    if (!campo || !barra) return;
    var MIN = 100, MAX = 5000, BF = 0.5, MES = 0.15;
    var ajuda = document.querySelector('[data-sim-ajuda]');
    var ajudaPadrao = ajuda.textContent;
    var el = {
      hoje: document.querySelector('[data-sim-hoje]'),
      netz: document.querySelector('[data-sim-netz]'),
      economia: document.querySelector('[data-sim-economia]'),
      mes: document.querySelector('[data-sim-mes]'),
      ano: document.querySelector('[data-sim-ano]'),
      barraNetz: document.querySelector('[data-sim-barra-netz]')
    };
    var reais = function (v) { return 'R$ ' + Math.round(v).toLocaleString('pt-BR'); };
    var lerReais = function (t) { var n = parseInt(String(t).replace(/\D/g, ''), 10); return isNaN(n) ? 0 : n; };
    var atual = { economia: 0, netz: 0, mes: 0, ano: 0 };
    var tween = null;

    function escreve(v) {
      el.economia.textContent = reais(v.economia);
      el.netz.textContent = reais(v.netz);
      el.mes.textContent = reais(v.mes);
      el.ano.textContent = reais(v.ano);
    }
    function calcula(conta, animar) {
      var fator = encerrada ? MES : BF;
      var alvo = {
        economia: conta * fator,
        netz: conta * (1 - fator),
        mes: conta * MES,
        ano: encerrada ? conta * MES * 12 : conta * BF + conta * MES * 11
      };
      el.hoje.textContent = reais(conta);
      el.barraNetz.style.width = ((1 - fator) * 100) + '%';
      if (animar && movimento) {
        // contagem própria (termina sempre no valor exato)
        if (tween) cancelAnimationFrame(tween);
        var de = Object.assign({}, atual), t0 = performance.now(), DUR = 600;
        (function passo(agora) {
          var k = Math.min(1, (agora - t0) / DUR), e = 1 - Math.pow(1 - k, 3);
          Object.keys(alvo).forEach(function (c) { atual[c] = de[c] + (alvo[c] - de[c]) * e; });
          if (k >= 1) Object.assign(atual, alvo);
          escreve(atual);
          tween = k < 1 ? requestAnimationFrame(passo) : null;
        })(t0);
      } else {
        Object.assign(atual, alvo);
        escreve(atual);
      }
    }
    function deCampo() {
      var v = lerReais(campo.value);
      campo.value = v ? v.toLocaleString('pt-BR') : '';
      if (v < MIN || v > MAX) {
        ajuda.textContent = v < MIN ? 'Digite um valor a partir de R$ 100.' : 'Para contas acima de R$ 5.000, fale com a NETZ: o cálculo é feito sob medida.';
        ajuda.classList.add('is-erro');
        v = Math.min(MAX, Math.max(MIN, v || MIN));
      } else {
        ajuda.textContent = ajudaPadrao;
        ajuda.classList.remove('is-erro');
      }
      barra.value = v;
      calcula(v, true);
    }
    campo.addEventListener('input', deCampo);
    barra.addEventListener('input', function () {
      var v = parseInt(barra.value, 10);
      campo.value = v.toLocaleString('pt-BR');
      ajuda.textContent = ajudaPadrao;
      ajuda.classList.remove('is-erro');
      calcula(v, true);
    });
    calcula(500, false);
  })();

  /* sem movimento: passos acesos e cidade iluminada, sem animação */
  var passos = document.querySelector('[data-passos]');
  var itens = passos ? passos.querySelectorAll('[data-passo]') : [];
  var janelas = document.querySelectorAll('[data-janelas] rect');
  function marcaPassos(p) {
    passos.style.setProperty('--progresso', p.toFixed(3));
    itens.forEach(function (it, i) { it.classList.toggle('is-on', p >= i / (itens.length - 1) - 0.02); });
  }
  function acende(p) {
    janelas.forEach(function (j, i) { j.classList.toggle('is-acesa', p >= (i + 1) / (janelas.length + 1)); });
  }

  if (!movimento || !window.gsap || !window.ScrollTrigger) {
    if (passos) marcaPassos(1);
    acende(1);
    return;
  }

  root.classList.add('gsap-ok');
  gsap.registerPlugin(ScrollTrigger);
  var ease = 'expo.out';

  /* ---------- Hero: entrada única dos textos (a cena 3D fica em js/hero3d.js) ---------- */
  gsap.fromTo('[data-hero]', { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, stagger: 0.09, ease: ease, delay: 0.15 });

  /* ---------- Textos ---------- */
  gsap.utils.toArray('[data-reveal]').forEach(function (n) {
    gsap.fromTo(n, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: ease, scrollTrigger: { trigger: n, start: 'top 88%', once: true } });
  });

  /* ---------- Como assinar: a linha dos passos se acende com a rolagem ---------- */
  if (passos) {
    marcaPassos(0);
    ScrollTrigger.create({
      trigger: passos, start: 'top 80%', end: 'bottom 55%', scrub: 0.6,
      onUpdate: function (st) { marcaPassos(st.progress); }
    });
  }

  /* ---------- Final: as janelas da cidade e do campo acendem uma a uma ---------- */
  acende(0);
  ScrollTrigger.create({
    trigger: '[data-final]', start: 'top 85%', end: 'center center', scrub: 0.5,
    onUpdate: function (st) { acende(st.progress); }
  });

  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
