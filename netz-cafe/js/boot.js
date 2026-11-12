/* Roda no <head>, antes de pintar a tela. Fica em arquivo próprio para a CSP não precisar liberar script inline. */
(function () {
  'use strict';

  /* Animações: esconde os elementos animados só quando o movimento está liberado; sem JS tudo aparece normalmente. */
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.classList.add('motion');
    setTimeout(function () { document.documentElement.classList.add('motion-fallback'); }, 2500);
  }

  /* Google Consent Mode v2: tudo negado por padrão, até a pessoa escolher no aviso de cookies.
     Não carrega nada do Google; só deixa o padrão pronto para quando o GTM for ligado em js/consent.js. */
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  window.gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    functionality_storage: 'granted',
    security_storage: 'granted',
    wait_for_update: 500
  });
})();
