# Product

Landing pages da NETZ Energia por cultura agrícola (café em `netz-cafe/`, laranja em `netz-laranja/`), usadas em campanhas de Google Ads e SEO para levar produtores rurais ao cadastro no site principal.

## Platform

web

## Stack

HTML, CSS e JavaScript estáticos, sem framework. GSAP 3.12.5 + ScrollTrigger hospedados localmente (`js/vendor/`). Fontes hospedadas localmente. CSP rígida (`'self'`, sem script ou estilo inline). Cabeçalhos de segurança em `_headers`, `vercel.json` e `.htaccess`. A hospedagem e o domínio ainda não foram definidos.

## Users

Produtores rurais (cafeicultores, citricultores) com conta de energia relevante por causa de irrigação, bombas, secadores e beneficiamento. Cerca de 75% das propriedades de laranja têm até 50 ha, mas a produção se concentra em médios e grandes. Acessam muito pelo celular, vindos de anúncio do Google. Desconfiam de promessas vagas e reconhecem na hora imagens que não são do campo deles.

## Product Purpose

Explicar em poucos segundos que a NETZ dá desconto na conta de luz da propriedade com energia solar por assinatura (geração distribuída compartilhada), sem obra, sem investimento e sem taxa de adesão, e levar a pessoa à jornada do cliente em netzenergia.com.br/jornada-do-cliente.

## Positioning

Energia mais barata para a propriedade rural sem mexer na operação. A NETZ não instala nada na fazenda: as usinas dela injetam energia na rede e o crédito aparece como desconto na conta da distribuidora.

## Operating Context

O visitante chega por anúncio de busca, muitas vezes no celular e no campo. A página precisa carregar rápido (nota do Google Ads), ser entendida sem rolar muito e ter a ação principal sempre à mão. Não há formulário na página: o cadastro acontece no site principal, mantido por uma software house terceira.

## Capabilities and Constraints

- Distribuidoras atendidas: Cemig, CPFL, Elektro e Equatorial Goiás. Consumo mínimo de 75 kWh líquidos por mês; a conta precisa estar no nome do produtor (vale para propriedade arrendada).
- Desconto de até 15% sobre a conta de energia (mesma base da calculadora do site principal).
- Regras comerciais: sem taxa de adesão, fidelidade opcional (sem fidelidade, saída em até 90 dias), créditos válidos por até 60 meses, regulamentado pela Lei 14.300/22.
- Contato: WhatsApp e telefone (31) 3268-9333, de segunda a sexta, das 10h às 17h. Encarregado de dados: dpo@netzenergia.com.br.
- O rastreamento (GTM-TSHJPG7M) ainda não está ligado. O aviso de cookies e o Consent Mode v2 já estão prontos, com tudo negado por padrão.
- Não existe vídeo próprio da NETZ no campo; usam-se vídeos de licença livre (Pexels) até haver filmagem própria.

## Brand Commitments

- Fontes da marca: Montserrat (títulos) e Open Sans (texto).
- Cores da marca NETZ: roxo #35247C, amarelo #F0AC2F, verde #2E8074. Cada landing page pode adaptar a paleta à cultura, sempre mantendo a marca reconhecível.
- Logo NETZ em branco sobre fundo escuro.
- Tom direto, falando "você", com frases curtas e vocabulário do produtor da cultura.

## Evidence on Hand

- Site e política de privacidade de netzenergia.com.br (textos de FAQ, regras comerciais e controlador dos dados).
- Pesquisa de citricultura de 12/11/2026 (Fundecitrus, Cepea/Esalq): metade dos pomares do cinturão é irrigada (50,2% em 2026), a irrigação concentra-se na seca de junho a setembro e a caixa de 40,8 kg vale R$ 28,33 (indústria, 11/11/2026).
- Cotação do café arábica Cepea/Esalq, cerca de R$ 1.600 por saca em novembro de 2026.

## Product Principles

- Uma ação principal, repetida: "Quero energia NETZ", que leva à jornada do cliente com UTM da campanha.
- Só números verdadeiros e com fonte. Nada de prometer produtividade, nem falar de doenças da lavoura ou de benefícios que a NETZ não entrega.
- Pouco texto, focado em conversão. Interatividade (simulador) traduz a economia para a unidade do produtor: saca, caixa.
- Privacidade por padrão: nenhum terceiro carregado antes do consentimento.

## Accessibility & Inclusion

Contraste WCAG AA em todo texto. Movimento reduzido respeitado (prefers-reduced-motion). Navegação por teclado com foco visível. Responsivo de 320px a telas grandes. Aceitar e recusar cookies com o mesmo destaque.
