/* Mapa do projeto · interface. Depende de vis-network e de graph-dados.js. */
(function () {
  var pref = null;
  try { pref = localStorage.getItem('graphify-theme'); } catch (e) {}
  var t = pref === 'light' ? 'light'
    : pref === 'system' && window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light'
    : 'dark';
  document.documentElement.setAttribute('data-theme', t);
})();

document.addEventListener('DOMContentLoaded', function () {
'use strict';
/* ---------- Vocabulário em português ---------- */
const TIPO = { code: 'Código', document: 'Documento', paper: 'Artigo', image: 'Imagem', concept: 'Conceito', rationale: 'Justificativa' };
const REL = { calls: 'chama', contains: 'contém', references: 'referencia', implements: 'implementa', cites: 'cita',
  conceptually_related_to: 'relacionado a', shares_data_with: 'compartilha dados com', semantically_similar_to: 'semelhante a', rationale_for: 'justifica' };
const REL_IN = { calls: 'chamado por', contains: 'contido em', references: 'referenciado por', implements: 'implementado por', cites: 'citado por',
  conceptually_related_to: 'relacionado a', shares_data_with: 'compartilha dados com', semantically_similar_to: 'semelhante a', rationale_for: 'justificado por' };

/* Paleta das comunidades: tons terrosos distintos entre si, legíveis no claro e no escuro */
const PALETA = ['#7FAEDB', '#E58F55', '#D96C6C', '#5FBFAA', '#A3C55F', '#C8B48E', '#B394D9', '#E68FAE', '#A88462', '#6FA3A8', '#D6B04C', '#8C9BD6'];
const corDe = cid => PALETA[cid % PALETA.length];

function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
function curto(s, n) { s = String(s); return s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s; }
function cssVar(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
function hexA(hex, a) { const h = hex.replace('#',''); const r = parseInt(h.slice(0,2),16), g = parseInt(h.slice(2,4),16), b = parseInt(h.slice(4,6),16); return `rgba(${r},${g},${b},${a})`; }

const nomeComunidade = {};
LEGEND.forEach(c => { nomeComunidade[c.cid] = c.label; });

/* ---------- Dados para o vis ---------- */
function corNo(n, apagado) {
  const c = corDe(n.community);
  const a = apagado ? 0.14 : 1;
  return { background: hexA(c, a), border: hexA(c, apagado ? 0.14 : 1),
    highlight: { background: c, border: cssVar('--accent') }, hover: { background: c, border: cssVar('--accent') } };
}
function fonteNo(n, apagado) {
  const mostra = !apagado && (n.degree >= 2 || n.size >= 15);
  return { size: mostra ? (n.degree >= 5 ? 16 : 14) : 0, face: 'Inter', color: cssVar('--label'),
    strokeWidth: 4, strokeColor: cssVar('--label-stroke'), bold: { face: 'Inter', mod: '' } };
}
const nodesDS = new vis.DataSet(RAW_NODES.map((n, i) => ({
  id: n.id, label: curto(n.label, 30), color: corNo(n), size: 8 + Math.sqrt(n.degree || 1) * 6,
  font: fonteNo(n), title: n.label,
  x: 30 * Math.sqrt(i) * Math.cos(i * 2.4), y: 30 * Math.sqrt(i) * Math.sin(i * 2.4),
  community: n.community, degree: n.degree,
})));
const byId = {}; RAW_NODES.forEach(n => { byId[n.id] = n; });

function corAresta(e, apagada) {
  const base = cssVar('--edge');
  return { color: apagada ? hexA('#888888', 0.06) : base, highlight: cssVar('--accent'), hover: cssVar('--accent'), inherit: false };
}
const edgesDS = new vis.DataSet(RAW_EDGES.map((e, i) => ({
  id: i, from: e.from, to: e.to, title: (REL[e.label] || e.label) + (e.confidence === 'INFERRED' ? ' · inferida' : ''),
  dashes: e.confidence !== 'EXTRACTED' ? [5, 5] : false, width: e.confidence === 'EXTRACTED' ? 1.6 : 1.2,
  color: corAresta(e), arrows: { to: { enabled: true, scaleFactor: 0.45 } },
  _rel: e.label, _conf: e.confidence,
})));

const container = document.getElementById('graph');
const network = new vis.Network(container, { nodes: nodesDS, edges: edgesDS }, {
  physics: {
    enabled: true, solver: 'forceAtlas2Based',
    forceAtlas2Based: { gravitationalConstant: -70, centralGravity: 0.008, springLength: 120, springConstant: 0.07, damping: 0.45, avoidOverlap: 0.9 },
    stabilization: { iterations: 260, fit: true },
  },
  interaction: { hover: true, tooltipDelay: 120, hideEdgesOnDrag: true, keyboard: false, zoomSpeed: 0.7 },
  nodes: { shape: 'dot', borderWidth: 2, borderWidthSelected: 3,
    shadow: { enabled: true, color: 'rgba(0,0,0,0.28)', size: 10, x: 0, y: 3 } },
  edges: { smooth: { type: 'continuous', roundness: 0.25 }, selectionWidth: 1.5, hoverWidth: 0.6 },
});
network.once('stabilizationIterationsDone', () => {
  network.setOptions({ physics: { enabled: false } });
  network.fit({ animation: { duration: 500, easingFunction: 'easeOutCubic' } });
  document.getElementById('loading').classList.add('is-done');
});
setTimeout(() => document.getElementById('loading').classList.add('is-done'), 4000);

/* ---------- Números do topo ---------- */
document.getElementById('stats').innerHTML =
  `<span class="stat"><b>${RAW_NODES.length}</b> nós</span>` +
  `<span class="stat"><b>${RAW_EDGES.length}</b> ligações</span>` +
  `<span class="stat"><b>${LEGEND.length}</b> comunidades</span>`;

/* ---------- Tema ---------- */
const THEME_KEY = 'graphify-theme';
const themeMQ = window.matchMedia ? window.matchMedia('(prefers-color-scheme: light)') : null;
function themePref() { let p = null; try { p = localStorage.getItem(THEME_KEY); } catch (e) {} return ['light','dark','system'].includes(p) ? p : null; }
function applyTheme(pref) {
  const t = pref === 'light' ? 'light' : (pref === 'system' && themeMQ && themeMQ.matches) ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', t);
  document.querySelectorAll('[data-theme-choice]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.themeChoice === (pref || 'dark'))));
  repinta();
}
document.querySelectorAll('[data-theme-choice]').forEach(b => b.addEventListener('click', () => {
  try { localStorage.setItem(THEME_KEY, b.dataset.themeChoice); } catch (e) {}
  applyTheme(b.dataset.themeChoice);
}));
if (themeMQ) { const f = () => { if (themePref() === 'system') applyTheme('system'); }; themeMQ.addEventListener ? themeMQ.addEventListener('change', f) : themeMQ.addListener(f); }

/* ---------- Modo foco: só o nó e os vizinhos ficam acesos ---------- */
let foco = null;
function repinta() {
  const viz = foco ? new Set([foco, ...network.getConnectedNodes(foco)]) : null;
  nodesDS.update(RAW_NODES.map(n => {
    const apagado = viz ? !viz.has(n.id) : false;
    return { id: n.id, color: corNo(n, apagado), font: fonteNo(n, apagado) };
  }));
  const arestasFoco = foco ? new Set(network.getConnectedEdges(foco)) : null;
  edgesDS.update(edgesDS.get().map(e => ({ id: e.id, color: corAresta(e, arestasFoco ? !arestasFoco.has(e.id) : false),
    width: arestasFoco && arestasFoco.has(e.id) ? 2.4 : (e._conf === 'EXTRACTED' ? 1.6 : 1.2) })));
}

/* ---------- Painel de detalhes ---------- */
const right = document.getElementById('right');
const detail = document.getElementById('detail');
function vazio() {
  right.classList.add('is-empty');
  detail.innerHTML = `<div class="empty"><div class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 4.5 4 20l5.5-3.2L13 20l1.4-4.2L20 14Z"/></svg></div>
    <h2>Escolha um nó</h2><p>Clique numa bolinha do mapa ou busque pelo nome para ver o que ela é e com quem se liga.</p></div>`;
}
function mostra(id) {
  const n = byId[id]; if (!n) return;
  foco = id; repinta();
  right.classList.remove('is-empty');
  const c = corDe(n.community);
  const ligs = edgesDS.get().filter(e => e.from === id || e.to === id).map(e => {
    const saida = e.from === id, outro = saida ? e.to : e.from;
    return { outro, rel: (saida ? REL : REL_IN)[e._rel] || e._rel, inferida: e._conf !== 'EXTRACTED' };
  }).sort((a, b) => (a.inferida - b.inferida) || String(byId[a.outro]?.label).localeCompare(String(byId[b.outro]?.label)));
  const lista = ligs.map(l => {
    const o = byId[l.outro] || { label: l.outro, community: 0 };
    return `<button type="button" class="nb" data-nid="${esc(l.outro)}"><span class="dt" style="background:${corDe(o.community)}"></span>
      <span class="t">${esc(o.label)}</span><span class="r">${esc(l.rel)}${l.inferida ? '<span class="tag">inferida</span>' : ''}</span></button>`;
  }).join('');
  detail.innerHTML = `
    <div class="d-head">
      <div class="d-top"><span class="chip"><span class="dt" style="background:${c}"></span>${esc(nomeComunidade[n.community] || n.community_name || '')}</span>
        <button type="button" class="icon-btn" id="fechar" aria-label="Fechar detalhes"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>
      <h2 class="d-title">${esc(n.label)}</h2>
    </div>
    <dl class="d-meta">
      <dt>Tipo</dt><dd>${esc(TIPO[n.file_type] || n.file_type || '—')}</dd>
      <dt>Arquivo</dt><dd class="mono">${esc(n.source_file || '—')}</dd>
      <dt>Conexões</dt><dd>${n.degree}</dd>
    </dl>
    ${ligs.length ? `<div class="d-sec"><span class="eyebrow">Ligações (${ligs.length})</span>${lista}</div>` : ''}`;
  document.getElementById('fechar').onclick = limpa;
}
function limpa() { foco = null; network.unselectAll(); repinta(); vazio(); }
function vaiPara(id) {
  /* desloca para a esquerda para o nó não ficar atrás do painel de detalhes */
  const desloc = window.innerWidth > 860 ? { x: -170, y: 0 } : { x: 0, y: -120 };
  network.focus(id, { scale: 0.95, offset: desloc, animation: { duration: 450, easingFunction: 'easeInOutCubic' } });
  network.selectNodes([id]); mostra(id);
}
document.addEventListener('click', e => { const el = e.target.closest('.nb'); if (el) vaiPara(el.dataset.nid); });
network.on('click', p => { if (p.nodes.length) mostra(p.nodes[0]); else limpa(); });
network.on('hoverNode', () => { container.style.cursor = 'pointer'; });
network.on('blurNode', () => { container.style.cursor = 'default'; });
vazio();

/* ---------- Busca ---------- */
const input = document.getElementById('search');
const res = document.getElementById('search-results');
let ativo = 0, achados = [];
function desenhaBusca() {
  const q = input.value.toLowerCase().trim();
  if (!q) { res.style.display = 'none'; return; }
  achados = RAW_NODES.filter(n => n.label.toLowerCase().includes(q)).slice(0, 12);
  res.style.display = 'block';
  if (!achados.length) { res.innerHTML = '<div class="result-empty">Nenhum nó com esse nome.</div>'; return; }
  ativo = Math.min(ativo, achados.length - 1);
  res.innerHTML = achados.map((n, i) => `<button type="button" role="option" class="result${i === ativo ? ' is-active' : ''}" data-i="${i}">
    <span class="dt" style="width:9px;height:9px;border-radius:50%;flex:none;background:${corDe(n.community)}"></span>
    <span class="t">${esc(n.label)}</span><span class="c">${esc(curto(nomeComunidade[n.community] || '', 18))}</span></button>`).join('');
}
function escolhe(i) { const n = achados[i]; if (!n) return; vaiPara(n.id); input.value = ''; res.style.display = 'none'; input.blur(); }
input.addEventListener('input', () => { ativo = 0; desenhaBusca(); });
input.addEventListener('keydown', e => {
  if (e.key === 'ArrowDown') { e.preventDefault(); ativo = Math.min(ativo + 1, achados.length - 1); desenhaBusca(); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); ativo = Math.max(ativo - 1, 0); desenhaBusca(); }
  else if (e.key === 'Enter') { e.preventDefault(); escolhe(ativo); }
  else if (e.key === 'Escape') { input.value = ''; res.style.display = 'none'; input.blur(); }
});
res.addEventListener('click', e => { const b = e.target.closest('.result'); if (b) escolhe(+b.dataset.i); });
document.addEventListener('click', e => { if (!res.contains(e.target) && e.target !== input) res.style.display = 'none'; });
document.addEventListener('keydown', e => {
  if (e.key === '/' && document.activeElement !== input) { e.preventDefault(); input.focus(); }
  else if (e.key === 'Escape' && document.activeElement !== input) limpa();
});

/* ---------- Comunidades ---------- */
const ocultas = new Set();
const legendEl = document.getElementById('legend');
legendEl.innerHTML = LEGEND.map(c => `<button type="button" class="comm" aria-pressed="true" data-cid="${c.cid}">
  <span class="sw" style="background:${corDe(c.cid)}"></span><span class="n">${esc(c.label)}</span><span class="k">${c.count}</span></button>`).join('');
function aplicaFiltro() {
  nodesDS.update(RAW_NODES.map(n => ({ id: n.id, hidden: ocultas.has(n.community) })));
  legendEl.querySelectorAll('.comm').forEach(b => b.setAttribute('aria-pressed', String(!ocultas.has(+b.dataset.cid))));
  if (foco && ocultas.has(byId[foco].community)) limpa();
}
legendEl.addEventListener('click', e => {
  const b = e.target.closest('.comm'); if (!b) return;
  const cid = +b.dataset.cid; ocultas.has(cid) ? ocultas.delete(cid) : ocultas.add(cid); aplicaFiltro();
});
document.getElementById('all-on').onclick = () => { ocultas.clear(); aplicaFiltro(); };
document.getElementById('all-off').onclick = () => { LEGEND.forEach(c => ocultas.add(c.cid)); aplicaFiltro(); };

/* ---------- Zoom ---------- */
const zoom = f => network.moveTo({ scale: network.getScale() * f, animation: { duration: 250, easingFunction: 'easeOutQuad' } });
document.getElementById('z-in').onclick = () => zoom(1.25);
document.getElementById('z-out').onclick = () => zoom(0.8);
document.getElementById('z-fit').onclick = () => network.fit({ animation: { duration: 450, easingFunction: 'easeInOutCubic' } });

/* ---------- Grupos (hiperarestas) desenhados como áreas suaves ---------- */
function convexHull(pts) {
  const p = pts.slice().sort((a, b) => (a.x - b.x) || (a.y - b.y));
  if (p.length < 3) return p;
  const cross = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const build = seq => { const out = []; for (const q of seq) { while (out.length >= 2 && cross(out[out.length - 2], out[out.length - 1], q) <= 0) out.pop(); out.push(q); } out.pop(); return out; };
  const hull = build(p).concat(build(p.slice().reverse()));
  return hull.length >= 3 ? hull : p;
}
network.on('beforeDrawing', ctx => {
  const acc = cssVar('--accent');
  hyperedges.forEach(h => {
    const pos = h.nodes.filter(id => { const n = nodesDS.get(id); return n && n.hidden !== true; })
      .map(id => network.getPositions([id])[id]).filter(Boolean);
    if (pos.length < 2) return;
    const cx = pos.reduce((s, p) => s + p.x, 0) / pos.length, cy = pos.reduce((s, p) => s + p.y, 0) / pos.length;
    const hull = convexHull(pos).map(p => { const dx = p.x - cx, dy = p.y - cy, d = Math.hypot(dx, dy) || 1; return { x: p.x + dx / d * 34, y: p.y + dy / d * 34 }; });
    const ativo = !foco || h.nodes.includes(foco);
    ctx.save();
    ctx.beginPath();
    hull.forEach((p, i) => { const q = hull[(i + 1) % hull.length]; const mx = (p.x + q.x) / 2, my = (p.y + q.y) / 2; i === 0 ? ctx.moveTo(mx, my) : null; });
    for (let i = 0; i < hull.length; i++) { const p = hull[(i + 1) % hull.length], q = hull[(i + 2) % hull.length]; ctx.quadraticCurveTo(p.x, p.y, (p.x + q.x) / 2, (p.y + q.y) / 2); }
    ctx.closePath();
    ctx.globalAlpha = ativo ? 0.07 : 0.02; ctx.fillStyle = acc; ctx.fill();
    ctx.globalAlpha = ativo ? 0.45 : 0.12; ctx.strokeStyle = acc; ctx.lineWidth = 1.5; ctx.setLineDash([6, 6]); ctx.stroke();
    if (ativo) {
      const top = hull.reduce((m, p) => p.y < m.y ? p : m, hull[0]);
      ctx.setLineDash([]); ctx.globalAlpha = 1;
      ctx.font = '600 11px Inter, system-ui, sans-serif';
      const txt = curto(h.label, 44), w = ctx.measureText(txt).width + 16, x = cx - w / 2, y = top.y - 26;
      ctx.fillStyle = cssVar('--panel'); ctx.strokeStyle = hexA(acc.length === 7 ? acc : '#F0AC2F', 0.5); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, 20, 10) : ctx.rect(x, y, w, 20); ctx.fill(); ctx.stroke();
      ctx.fillStyle = acc; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, cx, y + 10.5);
    }
    ctx.restore();
  });
});

applyTheme(themePref());
});
