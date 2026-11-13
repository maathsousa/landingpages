# project-netz-cafe

> Contexto da Netz Energia e decisões da landing page para produtores de café (pasta netz-cafe/)


A Netz Energia vende energia por assinatura (geração distribuída compartilhada): sem obra, sem investimento, desconto na conta. Atende as distribuidoras Cemig, CPFL, Equatorial GO e Elektro. Consumo mínimo de 75 kWh líquidos. O site netzenergia.com.br é mantido por uma software house terceira.

As landing pages servem para levar clientes à jornada do cliente: https://www.netzenergia.com.br/jornada-do-cliente (com UTMs). WhatsApp/telefone: +55 31 3268-9333.

Identidade: roxo #35247C, amarelo #F0AC2F, verde #2E8074, bege #EBE7DE/#F5F3EF, roxo vivo #712AD0. Fontes Montserrat (títulos) e Open Sans (texto). O site tem o GTM-TSHJPG7M.

LP de café (revisão 2026-11-11): o usuário pediu uma paleta inspirada na Cooxupé (cooperativa de café): verde-floresta #273A16/#1F2718, cáqui #927D5E, creme #F4F0E6, com o amarelo NETZ como acento e sol. Também pediu menos seções (hero, grão/como funciona, vantagens+quem pode, FAQ, amanhecer) e sol nascendo no final. Depois o usuário rejeitou os grãos caindo e o grão girando: preferiu o diagrama explicativo da NETZ (usina → rede → fazenda → conta) com uma animação de irrigação na fazenda. A seção de benefícios e a faixa "quem pode contratar" foram removidas e deram lugar a um simulador focado na produção de café: conta mensal, produção (sacas) e preço da saca, com desconto de até 15%, mostrando a economia em sacas e o custo de energia por saca. O usuário rejeitou métricas genéricas do site (CO2, km, árvores): o que importa é a economia na produção de café.

Decisões da LP de café (2026-11-11): HTML/CSS/JS estático em landingpages/netz-cafe/, animações elegantes de scroll (sem 3D), sem depoimentos, sem a seção "onde atendemos", sem % de desconto. Domínio e rastreamento ficam para depois; existe a ideia de um domínio separado com vários subdomínios para outras LPs (por cultura ou região).

Hero com vídeo (2026-11-11): o usuário quer vídeo em que se entenda que é café (vídeo aéreo abstrato foi rejeitado). Não existe vídeo gratuito de trator irrigando café; o atual é do Pexels (Diego Castro Calderon, fileiras com cerejas, 26,7 s), comprimido para 4,7 MB/2,6 MB. O ffmpeg foi instalado via winget (Gyan.FFmpeg, em %LOCALAPPDATA%\Microsoft\WinGet\Packages\...\bin\ffmpeg.exe, fora do PATH do shell).

Segurança e LGPD (2026-11-12): CSP rígida ('self', sem inline) na meta tag e em _headers/vercel.json/.htaccess; fontes e GSAP hospedados localmente. Aviso de cookies em js/consent.js com Consent Mode v2 (tudo negado por padrão); GTM_ID está vazio de propósito. Para ligar o GTM é preciso preencher GTM_ID E liberar os domínios do Google na CSP (nos 4 lugares). Aviso de privacidade em politica-de-privacidade.html; o DPO é dpo@netzenergia.com.br e a página diz que hoje não há medição/marketing (precisa ser atualizada quando ligarem).

**Why:** usar campanhas de Google Ads e SEO para atrair produtores rurais.
**How to apply:** em novas LPs, reusar este modelo e paleta. Ver [[feedback-skill-landing-pages]].
