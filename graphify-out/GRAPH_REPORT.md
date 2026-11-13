# Graph Report - landingpages  (2026-11-13)

## Corpus Check
- Corpus is ~13,953 words - fits in a single context window. You may not need a graph.

## Summary
- 128 nodes · 186 edges · 14 communities (8 shown, 6 thin omitted)
- Extraction: 82% EXTRACTED · 18% INFERRED · 0% AMBIGUOUS · INFERRED: 34 edges (avg confidence: 0.89)
- Token cost: 280,152 input · 0 output

## Community Hubs (Navigation)
- LP Café: seções e conversão
- LP Laranja: seções e conversão
- Hub e memória de decisões
- Lógica JS do café
- Lógica JS da laranja
- Cookies LGPD (café)
- Cookies LGPD (laranja)
- Simuladores por cultura
- Headers Vercel (café)
- Headers Vercel (laranja)
- Fontes e números verdadeiros

## God Nodes (most connected - your core abstractions)
1. `LP NETZ Café (netz-cafe/index.html)` - 13 edges
2. `Projeto LP NETZ café (decisões)` - 11 edges
3. `Projeto LP NETZ laranja (decisões)` - 9 edges
4. `LP NETZ Laranja (citricultores)` - 9 edges
5. `Aviso de privacidade e cookies NETZ Laranja` - 9 edges
6. `Aviso de privacidade e cookies (LGPD) NETZ Café` - 8 edges
7. `calcula()` - 6 edges
8. `calcula()` - 6 edges
9. `Simulador de economia em caixas de laranja` - 6 edges
10. `Jornada do cliente netzenergia.com.br` - 5 edges

## Surprising Connections (you probably didn't know these)
- `Segurança e LGPD da LP café (CSP, consent.js, GTM_ID vazio)` --semantically_similar_to--> `CSP rígida ('self', sem inline)`  [INFERRED] [semantically similar]
  memoria/project-netz-cafe.md → PRODUCT.md
- `Projeto LP NETZ café (decisões)` --references--> `Jornada do cliente netzenergia.com.br`  [INFERRED]
  memoria/project-netz-cafe.md → PRODUCT.md
- `Seção Como funciona: diagrama SVG usina/rede/fazenda/conta` --conceptually_related_to--> `Energia solar por assinatura (geração distribuída compartilhada)`  [INFERRED]
  netz-cafe/index.html → PRODUCT.md
- `LP NETZ Café (netz-cafe/index.html)` --references--> `GSAP 3.12.5 + ScrollTrigger local`  [EXTRACTED]
  netz-cafe/index.html → PRODUCT.md
- `Segurança e LGPD da LP café (CSP, consent.js, GTM_ID vazio)` --references--> `Aviso de cookies com Consent Mode v2 (negado por padrão)`  [INFERRED]
  memoria/project-netz-cafe.md → PRODUCT.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Fluxo de conversão: LP → CTA → jornada do cliente** — product_landing_pages_por_cultura, netz_cafe_index_cta_jornada, product_cta_unica, product_jornada_do_cliente [INFERRED 0.85]
- **Privacidade por padrão / LGPD (CSP, consentimento, aviso)** — product_csp_rigida, product_consent_mode_v2, netz_cafe_index_aviso_cookies, netz_cafe_politica_de_privacidade_aviso, memoria_project_netz_cafe_seguranca_lgpd [INFERRED 0.85]
- **Simuladores de economia na unidade do produtor** — product_simulador_unidade_produtor, memoria_project_netz_cafe_simulador_sacas, memoria_project_netz_laranja_simulador_caixas, netz_cafe_index_simulador [INFERRED 0.85]
- **Funil de conversão para a jornada do cliente** — netz_laranja_index_hero, netz_laranja_index_simulador, netz_laranja_index_poente, netz_laranja_index_cta_jornada, netz_laranja_index_whatsapp [INFERRED 0.85]
- **Conformidade LGPD e consentimento de cookies** — netz_laranja_index_cookie_consent, netz_laranja_politica_de_privacidade_categorias_cookies, netz_laranja_politica_de_privacidade_lgpd, netz_laranja_politica_de_privacidade_direitos_titular, netz_laranja_politica_de_privacidade_dpo [INFERRED 0.85]

## Communities (14 total, 6 thin omitted)

### Community 0 - "LP Café: seções e conversão"
Cohesion: 0.10
Nodes (23): Hero com vídeo de cafezal (Pexels, Diego Castro Calderon), Aviso e diálogo de preferências de cookies, Botões "Quero energia NETZ" (data-cta), Seção Como funciona: diagrama SVG usina/rede/fazenda/conta, FAQ: Dúvidas de quem toca a fazenda, Hero com vídeo de cafezal, Dados estruturados JSON-LD (Organization, Service, FAQPage), LP NETZ Café (netz-cafe/index.html) (+15 more)

### Community 1 - "LP Laranja: seções e conversão"
Cohesion: 0.11
Nodes (25): LP NETZ Laranja (citricultores), Como funciona: laranja amadurece com a rolagem, Aviso e diálogo de preferências de cookies, CTA Quero energia NETZ (jornada do cliente), Desconto de até 15% (mín. 75 kWh/mês), Energia por caixa colhida (hoje vs NETZ), 4 etapas: cadastro, plano, NETZ cuida, desconto, FAQ: dúvidas de quem cuida do pomar (+17 more)

### Community 2 - "Hub e memória de decisões"
Cohesion: 0.23
Nodes (11): Card "Em breve: próxima cultura", Hub de landing pages NETZ ("Uma página para cada cultura"), Projeto LP NETZ café (decisões), Paleta café inspirada na Cooxupé (verde-floresta, cáqui, creme + amarelo NETZ), Projeto LP NETZ laranja (decisões), Paleta laranja: roxo #35247C, laranja #F28C1E, verde-folha #3F7D2C, Repositório github.com/maathsousa/landingpages, Skill /nova-lp <cultura> (+3 more)

### Community 3 - "Lógica JS do café"
Cohesion: 0.28
Nodes (10): anima(), calcula(), escalaDe(), escreve(), lerInteiro(), lerReais(), mascaraReais(), pintaPilha() (+2 more)

### Community 4 - "Lógica JS da laranja"
Cohesion: 0.28
Nodes (10): anima(), calcula(), escalaDe(), escreve(), lerInteiro(), lerReais(), mascaraReais(), pintaPilha() (+2 more)

### Community 5 - "Cookies LGPD (café)"
Cohesion: 0.36
Nodes (5): abrirPreferencias(), aplicar(), fecharAviso(), gravar(), ler()

### Community 6 - "Cookies LGPD (laranja)"
Cohesion: 0.36
Nodes (5): abrirPreferencias(), aplicar(), fecharAviso(), gravar(), ler()

### Community 7 - "Simuladores por cultura"
Cohesion: 0.47
Nodes (3): Simulador em caixas de 40,8 kg (R$ 28,33), Simulador de economia (conta, sacas, preço da saca), Desconto de até 15% na conta de energia

## Knowledge Gaps
- **16 isolated node(s):** `GTM-TSHJPG7M (rastreamento ainda desligado)`, `Produtores rurais (cafeicultores, citricultores)`, `Distribuidoras atendidas: Cemig, CPFL, Elektro, Equatorial Goiás`, `Vídeos de licença livre (Pexels)`, `Evidências: Cepea/Esalq e Fundecitrus (preço da saca/caixa, irrigação)` (+11 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 33 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `LP NETZ Café (netz-cafe/index.html)` connect `LP Café: seções e conversão` to `Hub e memória de decisões`, `Simuladores por cultura`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **What connects `GTM-TSHJPG7M (rastreamento ainda desligado)`, `Produtores rurais (cafeicultores, citricultores)`, `Distribuidoras atendidas: Cemig, CPFL, Elektro, Equatorial Goiás` to the rest of the system?**
  _16 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `LP Café: seções e conversão` be split into smaller, more focused modules?**
  _Cohesion score 0.09852216748768473 - nodes in this community are weakly interconnected._
- **Why does `Projeto LP NETZ café (decisões)` connect `Hub e memória de decisões` to `LP Café: seções e conversão`, `Simuladores por cultura`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **Should `LP Laranja: seções e conversão` be split into smaller, more focused modules?**
  _Cohesion score 0.10826210826210826 - nodes in this community are weakly interconnected._