/*
  Consentimento de cookies (LGPD) — NETZ Energia
  ------------------------------------------------
  - Categorias: necessários (sempre), análise e marketing (opcionais, desligados por padrão).
  - A escolha fica salva no navegador do visitante (localStorage) por 12 meses.
  - Scripts de terceiros só rodam após o aceite da categoria. Para incluir um, use:
      <script type="text/plain" data-consent="analytics" data-src="URL-ou-arquivo.js"></script>
  - Outros scripts podem reagir à escolha ouvindo o evento:
      window.addEventListener('netz:consent', e => console.log(e.detail));
  - Mude CONSENT_VERSION quando as categorias ou a política mudarem: todos verão o aviso de novo.
*/
(function () {
  'use strict';
  var KEY = 'netz_cookie_consent';
  var CONSENT_VERSION = 1;
  var VALIDADE_MS = 365 * 24 * 60 * 60 * 1000; // 12 meses

  var banner = document.getElementById('cookieBanner');
  var dialog = document.getElementById('cookieDialog');
  if (!banner || !dialog) return;
  var form = dialog.querySelector('form');

  function ler() {
    try {
      var c = JSON.parse(localStorage.getItem(KEY));
      if (!c || c.v !== CONSENT_VERSION) return null;
      if (Date.now() - new Date(c.data).getTime() > VALIDADE_MS) return null;
      return c;
    } catch (e) { return null; }
  }

  function salvar(analytics, marketing) {
    var c = { v: CONSENT_VERSION, data: new Date().toISOString(), analytics: !!analytics, marketing: !!marketing };
    try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) { /* modo privado: vale só nesta visita */ }
    aplicar(c);
    fecharTudo();
  }

  // Ativa os scripts bloqueados das categorias aceitas (uma única vez cada).
  function aplicar(c) {
    var bloqueados = document.querySelectorAll('script[type="text/plain"][data-consent]');
    Array.prototype.forEach.call(bloqueados, function (s) {
      if (!c[s.getAttribute('data-consent')] || s.hasAttribute('data-ativado')) return;
      var novo = document.createElement('script');
      if (s.getAttribute('data-src')) novo.src = s.getAttribute('data-src');
      novo.async = true;
      s.setAttribute('data-ativado', '');
      s.parentNode.insertBefore(novo, s.nextSibling);
    });
    window.netzConsent = c;
    window.dispatchEvent(new CustomEvent('netz:consent', { detail: c }));
  }

  function mostrarBanner() {
    banner.hidden = false;
    document.body.classList.add('has-cookie-banner');
    requestAnimationFrame(function () { banner.classList.add('show'); });
  }

  function fecharTudo() {
    banner.classList.remove('show');
    document.body.classList.remove('has-cookie-banner');
    setTimeout(function () { banner.hidden = true; }, 300);
    if (dialog.open) dialog.close();
  }

  function abrirPreferencias() {
    var c = ler() || { analytics: false, marketing: false };
    form.analytics.checked = !!c.analytics;
    form.marketing.checked = !!c.marketing;
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  }

  document.addEventListener('click', function (e) {
    var abrir = e.target.closest('[data-cookie-open]');
    if (abrir) { e.preventDefault(); abrirPreferencias(); return; }
    var btn = e.target.closest('[data-cookie]');
    if (!btn) return;
    var acao = btn.getAttribute('data-cookie');
    if (acao === 'accept') salvar(true, true);
    else if (acao === 'reject') salvar(false, false);
    else if (acao === 'save') salvar(form.analytics.checked, form.marketing.checked);
  });

  // Clique fora do diálogo fecha sem salvar (o aviso continua até a pessoa escolher).
  dialog.addEventListener('click', function (e) { if (e.target === dialog) dialog.close(); });

  var atual = ler();
  if (atual) aplicar(atual);
  else mostrarBanner();
})();
