---
name: nova-lp
description: Cria uma nova landing page da NETZ Energia para uma cultura agrícola (ex.: /nova-lp soja, /nova-lp cana, /nova-lp leite), reaproveitando o modelo das LPs de café e laranja e cadastrando a página no hub. Use quando o usuário pedir uma LP nova para uma cultura, produto rural ou região.
---

# Nova landing page NETZ por cultura

Argumento: o tema (cultura, criação ou região), ex.: `soja`. Sem argumento, pergunte o tema.
Responda sempre em pt-BR. Commit/push só quando o usuário pedir.

## O que já é fixo (não perguntar)

**Empresa.** NETZ Energia vende energia por assinatura (geração distribuída compartilhada): sem obra, sem
investimento, desconto na conta de luz. Distribuidoras atendidas: Cemig, CPFL, Equatorial GO e Elektro.
Consumo mínimo de 75 kWh líquidos. Não citar % de desconto no texto (o simulador usa "até 15%").

**Conversão.** CTA principal para `https://www.netzenergia.com.br/jornada-do-cliente?utm_source=lp&utm_medium=organico&utm_campaign=<cultura>`.
WhatsApp/telefone: +55 31 3268-9333.

**Marca.** Roxo #35247C, amarelo #F0AC2F, verde #2E8074, bege #EBE7DE/#F5F3EF, roxo vivo #712AD0.
Montserrat (títulos) e Open Sans (texto), hospedadas localmente. Logo e favicon em `netz-laranja/img/`.

**Estrutura (5 seções, pouco texto, foco em conversão):**
1. Hero com vídeo real da cultura (Pexels, comprimido em 480p e 720p + poster), título
   "Energia mais barata para <o seu/a sua> <lugar da cultura>" e CTA.
2. Como funciona: diagrama usina → rede → propriedade → conta, com uma animação ligada à dor de energia da cultura.
3. Simulador na unidade de produção da cultura: conta mensal + produção + preço da unidade → economia
   em unidades de produção e custo de energia por unidade (desconto de até 15%). Nunca use métricas genéricas
   (CO2, árvores, km).
4. FAQ curta.
5. CTA final com uma cena de encerramento ligada à cultura (café: amanhecer; laranja: pôr do sol no pomar).

Sem depoimentos, sem seção "onde atendemos", sem 3D.

**Técnica (copiar da LP mais recente, hoje `netz-laranja/`):**
- HTML/CSS/JS estático em `landingpages/netz-<cultura>/`; GSAP + ScrollTrigger locais em `js/vendor/`.
- CSP rígida ('self', sem inline) na meta tag e nos 4 lugares: meta, `_headers`, `vercel.json`, `.htaccess`.
- LGPD: `js/consent.js` (Consent Mode v2, tudo negado), `GTM_ID` vazio de propósito,
  `politica-de-privacidade.html` (DPO dpo@netzenergia.com.br), `robots.txt`.
- `prefers-reduced-motion` respeitado; página legível sem JS.
- ffmpeg: `%LOCALAPPDATA%\Microsoft\WinGet\Packages\Gyan.FFmpeg*\...\bin\ffmpeg.exe` (fora do PATH).

## Memória e mapa do projeto

- **Memória geral:** `landingpages/memoria/` (comece pelo `README.md`). Lá estão todas as decisões, preferências
  e o que o usuário já rejeitou em cada LP. É obrigatório ler antes de propor qualquer coisa.
- **Grafo de conhecimento:** `landingpages/graphify-out/` mapeia as LPs, o hub e a memória.
  Leia `GRAPH_REPORT.md` para a visão geral; para perguntas pontuais use
  `graphify query "<pergunta>"` (ex.: "como o simulador calcula a economia?") em vez de abrir arquivos às cegas.
  O mapa visual fica em `graphify-out/graph.html`.

## Passo a passo

1. **Ler o modelo.** Leia `memoria/` e `graphify-out/GRAPH_REPORT.md`; depois abra `netz-laranja/index.html`,
   `css/style.css` e `js/main.js` para copiar a base técnica.
2. **Pesquisar a cultura** (WebSearch, fontes oficiais: Cepea, Conab, Embrapa, associações do setor):
   unidade de produção e preço atual (com data e fonte), onde e quando a energia pesa
   (irrigação, secagem, ordenha, resfriamento, armazenagem...), vocabulário do produtor.
3. **Entrevista curta** (AskUserQuestion, uma rodada só, com recomendação marcada):
   - paleta de destaque da cultura (proponha 2 a 3, sempre com o roxo NETZ na estrutura);
   - skill de design (ui-taste foi usada no café; impeccable + design-taste-frontend na laranja);
   - animação principal e cena final;
   - números padrão do simulador (proponha com base na pesquisa).
   Não pergunte o que já está fixo acima.
4. **Montar** `netz-<cultura>/` copiando a base técnica da laranja e trocando conteúdo, paleta, vídeo,
   ilustrações e simulador. Apague restos da cultura anterior (grep por "laranja"/"pomar"/"caixa").
5. **Conferir no navegador** (servidor `python -m http.server` na raiz; Playwright em 1440×900 e 390×844):
   sem erros no console e sem violação de CSP, simulador calcula certo, cookies aparecem, reduced-motion ok.
6. **Cadastrar no hub** (`landingpages/index.html`): novo card `card card--<cultura>` antes do "Em breve",
   com `--acento` em `hub.css`, título igual ao hero. Capture o hero em 1440×900 (esconda o aviso de cookies
   removendo a classe `tem-aviso-cookie` do `<html>` e ocultando o banner e o botão de WhatsApp; nunca use
   seletor `[class*=cookie]`, que esconde o `<html>`) e salve em `hub-img/netz-<cultura>.jpg`.
7. **Memória e grafo:** crie `memoria/project-netz-<cultura>.md` com as decisões (paleta, skill, unidade,
   fontes, o que foi rejeitado), adicione a linha no `memoria/README.md` e espelhe na memória do Claude Code
   (`project-netz-<cultura>.md` + `MEMORY.md`). Depois atualize o grafo: `/graphify . --update` na raiz.
8. **Entregar:** link local, o que foi decidido e o que ficou pendente (ex.: GTM, domínio).
