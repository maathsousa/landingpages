/* Aviso de cookies e preferências de consentimento (LGPD).
   - Necessários: sempre ativos (só guarda a escolha da pessoa, no próprio navegador).
   - Medição e marketing: desligados até a pessoa aceitar.
   - A escolha vale por 12 meses e pode ser mudada a qualquer momento pelo link "Preferências de cookies".

   PARA LIGAR O RASTREAMENTO NO FUTURO:
   1. Preencha GTM_ID abaixo (ex.: 'GTM-TSHJPG7M').
   2. Libere o Google na CSP: no index.html (meta Content-Security-Policy) e nos cabeçalhos da hospedagem
      (_headers, vercel.json ou .htaccess), adicione em script-src, img-src e connect-src:
      https://www.googletagmanager.com https://*.google-analytics.com https://*.googleadservices.com https://*.google.com https://*.doubleclick.net
   3. No GTM, configure as tags respeitando o Consent Mode (analytics_storage / ad_storage). */
(function () {
  'use strict';

  var GTM_ID = '';                 // vazio = nenhuma ferramenta de rastreamento é carregada
  var CHAVE = 'netz_consentimento';
  var VERSAO = 1;                  // aumente se as categorias mudarem, para pedir o consentimento de novo
  var VALIDADE_DIAS = 365;

  var aviso = document.querySelector('[data-cookie-aviso]');
  var dialogo = document.querySelector('[data-cookie-dialogo]');
  if (!aviso || !dialogo) return;
  var chkMedicao = dialogo.querySelector('[data-cookie="medicao"]');
  var chkMarketing = dialogo.querySelector('[data-cookie="marketing"]');

  function ler() {
    try {
      var s = JSON.parse(localStorage.getItem(CHAVE));
      if (!s || s.v !== VERSAO) return null;
      if (Date.now() - s.em > VALIDADE_DIAS * 864e5) return null;
      return s;
    } catch (e) { return null; }
  }

  function gravar(medicao, marketing) {
    var s = { v: VERSAO, medicao: !!medicao, marketing: !!marketing, em: Date.now() };
    try { localStorage.setItem(CHAVE, JSON.stringify(s)); } catch (e) { /* navegação privada: vale só nesta visita */ }
    aplicar(s);
    fecharAviso();
  }

  var gtmCarregado = false;
  function aplicar(s) {
    window.gtag('consent', 'update', {
      analytics_storage: s.medicao ? 'granted' : 'denied',
      ad_storage: s.marketing ? 'granted' : 'denied',
      ad_user_data: s.marketing ? 'granted' : 'denied',
      ad_personalization: s.marketing ? 'granted' : 'denied'
    });
    window.dataLayer.push({ event: 'consentimento_atualizado', medicao: s.medicao, marketing: s.marketing });
    if (GTM_ID && (s.medicao || s.marketing) && !gtmCarregado) {
      gtmCarregado = true;
      window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
      var sc = document.createElement('script');
      sc.async = true;
      sc.src = 'https://www.googletagmanager.com/gtm.js?id=' + encodeURIComponent(GTM_ID);
      document.head.appendChild(sc);
    }
  }

  function abrirAviso() {
    aviso.hidden = false;
    document.documentElement.classList.add('tem-aviso-cookie');
    requestAnimationFrame(function () { aviso.classList.add('is-visivel'); });
  }
  function fecharAviso() {
    aviso.classList.remove('is-visivel');
    document.documentElement.classList.remove('tem-aviso-cookie');
    setTimeout(function () { aviso.hidden = true; }, 250);
  }

  function abrirPreferencias() {
    var s = ler();
    chkMedicao.checked = s ? s.medicao : false;
    chkMarketing.checked = s ? s.marketing : false;
    if (typeof dialogo.showModal === 'function') dialogo.showModal(); else dialogo.setAttribute('open', '');
  }
  function fecharPreferencias() {
    if (typeof dialogo.close === 'function') dialogo.close(); else dialogo.removeAttribute('open');
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-cookie-acao]');
    if (!b) return;
    var acao = b.getAttribute('data-cookie-acao');
    if (acao === 'aceitar') { gravar(true, true); fecharPreferencias(); }
    else if (acao === 'recusar') { gravar(false, false); fecharPreferencias(); }
    else if (acao === 'personalizar') { e.preventDefault(); abrirPreferencias(); }
    else if (acao === 'salvar') { gravar(chkMedicao.checked, chkMarketing.checked); fecharPreferencias(); }
    else if (acao === 'fechar') { fecharPreferencias(); }
  });
  /* clicar fora do conteúdo fecha o diálogo sem decidir nada */
  dialogo.addEventListener('click', function (e) { if (e.target === dialogo) fecharPreferencias(); });

  var atual = ler();
  if (atual) aplicar(atual); else abrirAviso();
})();
