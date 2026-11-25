/* Hero 3D da LP Black Friday NETZ: "Do sol à conta", guiado pela rolagem.
   A conta de luz em destaque dá lugar à usina solar da NETZ (o sol acende as placas) → a energia corre em pulsos
   amarelos pela mesma rede (torre de transmissão) até uma casa e um comércio, que acendem → a conta volta, ganha a
   etiqueta "BLACK FRIDAY −50%" e uma faixa de energia troca R$ 500 por R$ 250 → no fim, a conta pela metade entre
   a casa e o comércio iluminados. Mesmo padrão das outras LPs (ver memoria/padrao-hero-3d.md). Tudo modelado em código.
   (O cofrinho da primeira versão foi recusado pelo usuário em 24/11/2026: "ficou esquisito".)
   Sem WebGL: fica img/hero-black-friday-3d.webp. Com "menos movimento": cena parada na conta. */
import * as THREE from './vendor/three.module.min.js';
import { RoomEnvironment } from './vendor/RoomEnvironment.js';

let hero, canvas;

// Só uma vez por página, com o HTML pronto e depois do GSAP (a tela de login do site publicado recria este script).
let buscas = 0;
function comeca() {
  if (window.__netzHero3d) return;
  hero = document.querySelector('[data-hero3d]');
  canvas = hero && hero.querySelector('[data-hero-canvas]');
  if (!hero || !canvas) { if (++buscas < 100) setTimeout(comeca, 100); return; }
  window.__netzHero3d = true;
  let tentativas = 0;
  (function espera() {
    if ((window.gsap && window.ScrollTrigger) || !document.documentElement.classList.contains('motion') || ++tentativas > 60) init();
    else setTimeout(espera, 50);
  })();
}
comeca();

function init() {
  const root = document.documentElement;
  const animado = root.classList.contains('motion') && !!window.gsap && !!window.ScrollTrigger;
  const encerrada = root.classList.contains('bf-encerrada');

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (e) {
    return; // sem WebGL: fica a imagem estática
  }
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  /* ---------- utilidades ---------- */
  const clamp01 = (v) => Math.min(1, Math.max(0, v));
  const seg = (p, a, b) => clamp01((p - a) / (b - a));
  const suave = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const sai = (t) => 1 - Math.pow(1 - t, 3);
  const lerp = (a, b, t) => a + (b - a) * t;
  const PISO = -1.2;
  const UP = new THREE.Vector3(0, 1, 0);

  function texturaCanvas(w, h, desenha) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    t.redesenha = () => { desenha(c.getContext('2d'), w, h); t.needsUpdate = true; };
    t.redesenha();
    return t;
  }
  const arred = (ctx, x, y, w, h, r) => { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); };

  /* ---------- cena ---------- */
  const cena = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  cena.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  cena.environmentIntensity = 0.6;

  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 60);
  const alvo = new THREE.Vector3(0, -0.15, 0);
  const luzChave = new THREE.DirectionalLight(0xfff4e6, 2.4);
  luzChave.position.set(-3.5, 5, 4.5);
  const luzRecorte = new THREE.DirectionalLight(0x8a5cff, 2.2);
  luzRecorte.position.set(4, 2.5, -3.5);
  cena.add(luzChave, luzRecorte, new THREE.HemisphereLight(0xffffff, 0x1b1530, 0.6));

  /* ---------- texturas ---------- */
  function desenhaConta(ctx, w, h, promo) {
    ctx.fillStyle = '#fbfaf6'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#ecebf2'; ctx.fillRect(0, 0, w, 150);
    ctx.fillStyle = '#2b2440'; ctx.font = '800 44px Montserrat, sans-serif'; ctx.fillText('CONTA DE LUZ', 40, 78);
    ctx.fillStyle = '#7a7490'; ctx.font = '600 24px "Open Sans", sans-serif'; ctx.fillText('Distribuidora de energia · Mês de referência', 40, 118);
    ctx.fillStyle = '#4a4168'; ctx.font = '700 22px Montserrat, sans-serif'; ctx.fillText('CONSUMO DOS ÚLTIMOS MESES', 40, 200);
    [58, 72, 64, 88, 80, 96].forEach((v, i) => { ctx.fillStyle = i === 5 ? '#4B3AA0' : '#c9c4da'; ctx.fillRect(48 + i * 62, 340 - v * 1.2, 40, v * 1.2); });
    ctx.fillStyle = '#d9d6e2';
    [[40, 380, 520], [40, 412, 430], [40, 444, 480], [40, 476, 360], [40, 508, 450]].forEach(([x, y, l]) => ctx.fillRect(x, y, l, 12));
    ctx.fillStyle = promo ? '#fff3d6' : '#f1eefa'; arred(ctx, 30, 548, 540, 150, 18); ctx.fill();
    ctx.fillStyle = '#4a4168'; ctx.font = '700 24px Montserrat, sans-serif'; ctx.fillText('TOTAL A PAGAR', 56, 598);
    if (promo) {
      ctx.fillStyle = '#8a84a0'; ctx.font = '700 30px Montserrat, sans-serif'; ctx.fillText('R$ 500,00', 340, 598);
      ctx.fillRect(336, 586, 156, 4);
      ctx.fillStyle = '#35247C'; ctx.font = '800 78px Montserrat, sans-serif'; ctx.fillText('R$ 250,00', 52, 676);
    } else {
      ctx.fillStyle = '#1b1530'; ctx.font = '800 78px Montserrat, sans-serif'; ctx.fillText('R$ 500,00', 52, 676);
    }
    ctx.fillStyle = '#2b2440';
    for (let x = 40, i = 0; x < 560; i++) { const l = [3, 6, 2, 4, 8, 3, 5][i % 7]; ctx.fillRect(x, 724, l, 52); x += l + [3, 5, 2, 4][i % 4]; }
  }
  const texConta = texturaCanvas(600, 800, (ctx, w, h) => desenhaConta(ctx, w, h, false));
  const texPromo = texturaCanvas(600, 800, (ctx, w, h) => desenhaConta(ctx, w, h, true));
  const texEtiqueta = texturaCanvas(380, 190, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#F0AC2F'; arred(ctx, 6, 6, w - 12, h - 12, 28); ctx.fill();
    ctx.fillStyle = '#0E0B18';
    ctx.font = '800 28px Montserrat, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('BLACK FRIDAY', w / 2, 56);
    ctx.font = '800 104px Montserrat, sans-serif'; ctx.fillText('−50%', w / 2, 160);
  });
  const texPainel = texturaCanvas(256, 180, (ctx, w, h) => {
    ctx.fillStyle = '#1a2b5e'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(190,210,255,.45)'; ctx.lineWidth = 2;
    for (let i = 0; i <= 6; i++) { const x = (i / 6) * w; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let j = 0; j <= 4; j++) { const y = (j / 4) * h; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    ctx.strokeStyle = '#cfd1d6'; ctx.lineWidth = 6; ctx.strokeRect(0, 0, w, h);
  });
  const texToldo = texturaCanvas(256, 64, (ctx, w, h) => {
    for (let i = 0; i < 8; i++) { ctx.fillStyle = i % 2 ? '#F0AC2F' : '#35247C'; ctx.fillRect((i / 8) * w, 0, w / 8 + 1, h); }
  });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { texConta.redesenha(); texPromo.redesenha(); texEtiqueta.redesenha(); });
  const texSombra = texturaCanvas(128, 128, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, 'rgba(0,0,0,.8)'); g.addColorStop(0.45, 'rgba(0,0,0,.35)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  });
  const texBrilho = texturaCanvas(128, 128, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, 'rgba(255,224,150,1)'); g.addColorStop(0.3, 'rgba(240,172,47,.6)'); g.addColorStop(1, 'rgba(240,172,47,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  });

  /* ---------- materiais ---------- */
  const M = {
    papel: new THREE.MeshStandardMaterial({ map: texConta, roughness: 0.85, side: THREE.DoubleSide }),
    promo: new THREE.MeshStandardMaterial({ map: texPromo, roughness: 0.85, side: THREE.DoubleSide, transparent: true, opacity: 0, depthWrite: false }),
    etiqueta: new THREE.MeshStandardMaterial({ map: texEtiqueta, transparent: true, roughness: 0.4, side: THREE.DoubleSide }),
    painel: new THREE.MeshStandardMaterial({ map: texPainel, roughness: 0.25, metalness: 0.4, emissive: 0xf0ac2f, emissiveIntensity: 0 }),
    metal: new THREE.MeshStandardMaterial({ color: 0x9a9cad, metalness: 0.85, roughness: 0.35 }),
    cabo: new THREE.MeshStandardMaterial({ color: 0x4a4560, roughness: 0.5 }),
    parede: new THREE.MeshStandardMaterial({ color: 0xd9d3c7, roughness: 0.8 }),
    telhado: new THREE.MeshStandardMaterial({ color: 0x35247c, roughness: 0.6 }),
    toldo: new THREE.MeshStandardMaterial({ map: texToldo, roughness: 0.6, side: THREE.DoubleSide }),
    moeda: new THREE.MeshStandardMaterial({ color: 0xd99620, metalness: 1, roughness: 0.38, envMapIntensity: 0.7 }),
    pulso: new THREE.MeshBasicMaterial({ color: 0xffd27a }),
    sol: new THREE.MeshBasicMaterial({ color: 0xffc23d }),
    faixa: new THREE.MeshBasicMaterial({ map: texBrilho, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })
  };
  const JANELA_APAGADA = new THREE.Color(0x2a2440), JANELA_ACESA = new THREE.Color(0xf6bc4e);

  function sombra() {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ map: texSombra, transparent: true, depthWrite: false, opacity: 0 }));
    m.rotation.x = -Math.PI / 2;
    m.renderOrder = -1;
    cena.add(m);
    return m;
  }
  function poseSombra(s, obj, larg, forca) {
    s.position.set(obj.position.x, PISO + 0.003, obj.position.z);
    const alt = Math.max(0, obj.position.y - PISO);
    s.material.opacity = forca * clamp01(1 - alt / 3) * (obj.visible ? 1 : 0);
    const k = larg * obj.scale.x * (1 + alt * 0.2);
    s.scale.set(k, k * 0.62, 1);
  }
  function barra(a, b, r, mat) { // cilindro entre dois pontos
    const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b), d = vb.clone().sub(va);
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, d.length(), 8), mat);
    m.position.copy(va).addScaledVector(d, 0.5);
    m.quaternion.setFromUnitVectors(UP, d.normalize());
    return m;
  }
  function brilho(tam) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(tam, tam), M.faixa.clone());
    return m;
  }

  /* ---------- a conta (com a versão "pela metade" por cima, revelada pela faixa de energia) ---------- */
  const conta = new THREE.Group();
  const folha = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 2.0, 6, 10), M.papel);
  const folhaPromo = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 2.0), M.promo);
  folhaPromo.position.z = 0.002;
  const etiqueta = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.31), M.etiqueta);
  etiqueta.position.set(0.42, 0.5, 0.006);
  const faixa = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.5), M.faixa);
  faixa.position.z = 0.01;
  conta.add(folha, folhaPromo, etiqueta, faixa);
  cena.add(conta);
  const sombraConta = sombra();

  /* ---------- usina solar: três placas sobre estruturas ---------- */
  const usina = new THREE.Group();
  [-0.95, 0, 0.95].forEach((x) => {
    const placa = new THREE.Group();
    placa.position.set(x, 0.62, 0);
    placa.rotation.x = 0.62;
    const tampo = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.035, 0.6), [M.metal, M.metal, M.painel, M.metal, M.metal, M.metal]);
    placa.add(tampo);
    usina.add(placa);
    usina.add(barra([x - 0.3, 0, 0.05], [x - 0.3, 0.55, 0.05], 0.025, M.metal), barra([x + 0.3, 0, 0.05], [x + 0.3, 0.55, 0.05], 0.025, M.metal));
    usina.add(barra([x - 0.3, 0, -0.2], [x - 0.3, 0.78, -0.2], 0.025, M.metal), barra([x + 0.3, 0, -0.2], [x + 0.3, 0.78, -0.2], 0.025, M.metal));
  });
  cena.add(usina);
  const sombraUsina = sombra();
  const sol = new THREE.Group();
  const nucleo = new THREE.Mesh(new THREE.SphereGeometry(0.3, 32, 24), M.sol);
  const aura = brilho(2.3);
  sol.add(nucleo, aura);
  cena.add(sol);

  /* ---------- torre de transmissão (treliça) ---------- */
  const torre = new THREE.Group();
  const H = 2.2;
  [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([a, b]) => torre.add(barra([a * 0.36, 0, b * 0.36], [a * 0.1, H, b * 0.1], 0.025, M.metal)));
  [0.45, 0.95, 1.45, 1.85].forEach((y, i) => {
    const r = lerp(0.36, 0.1, y / H) + 0.01;
    torre.add(barra([-r, y, r], [r, y, r], 0.015, M.metal), barra([-r, y, -r], [r, y, -r], 0.015, M.metal));
    torre.add(barra([-r, y, r], [-r, y, -r], 0.015, M.metal), barra([r, y, r], [r, y, -r], 0.015, M.metal));
    if (i < 3) { const r2 = lerp(0.36, 0.1, [0.95, 1.45, 1.85][i] / H); torre.add(barra([-r, y, r], [r2, [0.95, 1.45, 1.85][i], r2], 0.012, M.metal)); }
  });
  torre.add(barra([-0.6, 2.0, 0], [0.6, 2.0, 0], 0.02, M.metal), barra([-0.42, 1.7, 0], [0.42, 1.7, 0], 0.02, M.metal));
  cena.add(torre);
  const sombraTorre = sombra();

  /* ---------- casa e comércio, com janelas que acendem ---------- */
  function janela(w, h, x, y, z) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: JANELA_APAGADA.clone() }));
    m.position.set(x, y, z);
    return m;
  }
  const casa = new THREE.Group();
  const corpoCasa = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.72, 0.8), M.parede);
  corpoCasa.position.y = 0.36;
  const telhado = new THREE.Mesh(new THREE.ConeGeometry(0.78, 0.48, 4), M.telhado);
  telhado.rotation.y = Math.PI / 4; telhado.scale.set(1, 1, 0.82); telhado.position.y = 0.96;
  const janelasCasa = [janela(0.22, 0.22, -0.26, 0.44, 0.401), janela(0.22, 0.22, 0.26, 0.44, 0.401), janela(0.2, 0.34, 0, 0.17, 0.401)];
  casa.add(corpoCasa, telhado, ...janelasCasa);
  cena.add(casa);
  const sombraCasa = sombra();

  const loja = new THREE.Group();
  const corpoLoja = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.82, 0.8), M.parede);
  corpoLoja.position.y = 0.41;
  const placaLoja = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.14, 0.84), M.telhado);
  placaLoja.position.y = 0.88;
  const toldo = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.26), M.toldo);
  toldo.position.set(0, 0.68, 0.52); toldo.rotation.x = -0.9;
  const janelasLoja = [janela(0.82, 0.32, -0.12, 0.34, 0.401), janela(0.22, 0.42, 0.46, 0.21, 0.401)];
  loja.add(corpoLoja, placaLoja, toldo, ...janelasLoja);
  cena.add(loja);
  const sombraLoja = sombra();

  /* ---------- cabos e pulsos de energia (posições da etapa da rede) ---------- */
  const P = {
    usina: new THREE.Vector3(-1.45, PISO, -0.3), torre: new THREE.Vector3(0.05, PISO, -0.5),
    casa: new THREE.Vector3(1.05, PISO, 0.15), loja: new THREE.Vector3(1.95, PISO, -0.35)
  };
  const ESC = { usina: 0.55, torre: 0.75, casa: 0.72, loja: 0.62 };
  const pontoTorre = (lado) => new THREE.Vector3(P.torre.x + lado * 0.6 * ESC.torre, PISO + 2.0 * ESC.torre, P.torre.z);
  const curvas = [
    [new THREE.Vector3(P.usina.x + 0.95 * ESC.usina + 0.2, PISO + 0.78 * ESC.usina, P.usina.z), pontoTorre(-1)],
    [pontoTorre(1), new THREE.Vector3(P.casa.x - 0.1, PISO + 1.12 * ESC.casa, P.casa.z)],
    [pontoTorre(1), new THREE.Vector3(P.loja.x - 0.2, PISO + 0.95 * ESC.loja, P.loja.z)]
  ].map(([a, b]) => {
    const meio = a.clone().lerp(b, 0.5); meio.y -= 0.4; // fio caído
    return new THREE.QuadraticBezierCurve3(a, meio, b);
  });
  const cabos = curvas.map((c) => {
    const g = new THREE.TubeGeometry(c, 40, 0.012, 6, false);
    const m = new THREE.Mesh(g, M.cabo);
    cena.add(m);
    return m;
  });
  const N_PULSO = 4;
  const pulsos = curvas.map(() => Array.from({ length: N_PULSO }, () => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 10), M.pulso);
    const b = brilho(0.36); m.add(b);
    cena.add(m);
    return m;
  }));

  /* ---------- moedas ao fundo, só na abertura ---------- */
  const geoMoeda = new THREE.CylinderGeometry(0.15, 0.15, 0.035, 36);
  const fundo = [[-1.1, 2.1, -5.5, 1.3], [2.5, 1.5, -4, 1.2], [-1.3, -1.2, -4.5, 1.2], [2.2, -0.5, -2, 1.5], [0.9, 2.2, -6, 1.0], [1.4, 2.1, -5.5, 1.0], [0.4, -1.0, -3.5, 1.2]]
    .map(([x, y, z, s], i) => {
      const m = new THREE.Mesh(geoMoeda, M.moeda);
      m.position.set(x, y, z); m.userData = { s, y, giro: 0.4 + i * 0.13 };
      m.rotation.set(1.2 + i, i, 0.4);
      cena.add(m);
      return m;
    });

  /* ---------- quadro a quadro ---------- */
  function aplica(p, t) {
    const pulso = 0.85 + Math.sin(t * 3) * 0.15;

    /* 0 → 1. a conta sai para cima; volta na etapa da rede, ganha a etiqueta e cai pela metade; no fim vai ao centro */
    const sobe = suave(seg(p, 0.14, 0.24));
    const volta = suave(seg(p, 0.58, 0.66));
    const centro = suave(seg(p, 0.74, 0.86));
    const balanco = Math.sin(t * 0.5) * 0.05;
    const x0 = 0, y0 = 0.25, z0 = 0.25;
    let x = lerp(x0, 0.4, sobe), y = lerp(y0, 3.6, sobe), z = z0, s = 1.05;
    if (volta > 0) { x = lerp(-0.4, -1.05, volta); y = lerp(3.4, 0.75, volta); z = 1.2; s = lerp(0.5, 0.5, volta); }
    if (centro > 0) { x = lerp(-1.05, 0, centro); y = lerp(0.75, 0.15, centro); z = lerp(1.2, 0.7, centro); s = lerp(0.5, 0.92, centro); }
    conta.position.set(x, y, z);
    conta.scale.setScalar(s);
    conta.rotation.set(-0.08 + balanco * 0.6, -0.3 + Math.sin(t * 0.45) * 0.14 + centro * 0.2, 0.06 - volta * 0.1 + centro * 0.08);
    conta.visible = sobe < 1 || volta > 0;
    sombraConta.position.set(conta.position.x, PISO + 0.003, conta.position.z);
    sombraConta.scale.set(2.2 * s, 1.2 * s, 1);
    sombraConta.material.opacity = 0.45 * clamp01(1 - (conta.position.y - PISO) / 3) * (conta.visible ? 1 : 0);

    const cola = encerrada ? 0 : sai(seg(p, 0.62, 0.67));
    etiqueta.visible = cola > 0;
    etiqueta.scale.setScalar(Math.max(0.001, cola * (1 + 0.18 * Math.sin(cola * Math.PI))));
    etiqueta.rotation.z = -0.14 + (1 - cola) * 0.6;
    const varre = encerrada ? 0 : seg(p, 0.66, 0.72);
    faixa.position.y = lerp(1.15, -1.15, varre);
    faixa.material.opacity = Math.sin(varre * Math.PI) * 0.95;
    M.promo.opacity = suave(seg(varre, 0.35, 0.85));

    /* 1. a usina entra pela direita; o sol nasce e acende as placas */
    const entraU = suave(seg(p, 0.14, 0.26));
    const redeU = suave(seg(p, 0.44, 0.52));
    const saiU = suave(seg(p, 0.72, 0.8));
    usina.visible = entraU > 0 && saiU < 1;
    usina.position.set(lerp(lerp(3.6, 0.1, entraU), P.usina.x, redeU) - saiU * 3, PISO, lerp(0, P.usina.z, redeU));
    usina.scale.setScalar(lerp(1, ESC.usina, redeU));
    usina.rotation.y = lerp(-0.6, -0.28, entraU) + redeU * 0.1;
    poseSombra(sombraUsina, usina, 3.4, 0.5);
    const nasce = sai(seg(p, 0.2, 0.3));
    sol.visible = nasce > 0 && saiU < 1;
    sol.position.set(lerp(-0.55, -1.25, redeU) - saiU * 2, lerp(-0.2, 1.55, nasce) + redeU * 0.1, -1.4);
    sol.scale.setScalar(Math.max(0.001, nasce * lerp(1, 0.7, redeU)));
    aura.material.opacity = nasce * 0.85 * pulso;
    aura.lookAt(camera.position);
    M.painel.emissiveIntensity = seg(p, 0.27, 0.36) * (0.16 + 0.08 * pulso) * (1 - saiU);

    /* 2. a torre sobe; a casa e o comércio entram; os cabos se estendem e os pulsos correm */
    const entraT = suave(seg(p, 0.44, 0.52));
    const saiT = suave(seg(p, 0.72, 0.8));
    torre.visible = entraT > 0 && saiT < 1;
    torre.position.set(P.torre.x - saiT * 3.2, lerp(PISO - 2.6, PISO, entraT), P.torre.z);
    torre.scale.setScalar(ESC.torre);
    torre.rotation.y = 0;
    poseSombra(sombraTorre, torre, 1.2, 0.4);

    const entraCasas = suave(seg(p, 0.46, 0.54));
    const finalCasas = suave(seg(p, 0.74, 0.86));
    casa.visible = loja.visible = entraCasas > 0;
    casa.position.set(lerp(lerp(3.8, P.casa.x, entraCasas), -1.25, finalCasas), PISO, lerp(P.casa.z, -0.7, finalCasas));
    casa.scale.setScalar(lerp(ESC.casa, 0.8, finalCasas));
    casa.rotation.y = lerp(-0.5, -0.32, entraCasas) + finalCasas * 0.75;
    loja.position.set(lerp(lerp(4.6, P.loja.x, entraCasas), 1.3, finalCasas), PISO, lerp(P.loja.z, -0.85, finalCasas));
    loja.scale.setScalar(lerp(ESC.loja, 0.74, finalCasas));
    loja.rotation.y = lerp(-0.5, -0.3, entraCasas) - finalCasas * 0.2;
    poseSombra(sombraCasa, casa, 1.6, 0.5);
    poseSombra(sombraLoja, loja, 1.9, 0.5);

    const estende = seg(p, 0.52, 0.58) * (1 - seg(p, 0.71, 0.75));
    cabos.forEach((c) => {
      const n = c.geometry.index.count;
      c.visible = estende > 0;
      c.geometry.setDrawRange(0, Math.floor(n * estende / 6) * 6);
    });
    const corre = encerrada ? seg(p, 0.56, 0.6) : seg(p, 0.56, 0.6) * (1 - seg(p, 0.71, 0.75));
    pulsos.forEach((lista, k) => lista.forEach((m, i) => {
      m.visible = corre > 0.01 && estende >= 1;
      const u = ((t * 0.45 + i / N_PULSO + k * 0.13) % 1);
      curvas[k].getPoint(u, m.position);
      m.scale.setScalar(corre);
      m.children[0].material.opacity = corre * 0.9;
      m.children[0].lookAt(camera.position);
    }));
    const acende = seg(p, 0.58, 0.64);
    [...janelasCasa, ...janelasLoja].forEach((j, i) => {
      const k = clamp01(acende * 5 - i * 0.7);
      j.material.color.copy(JANELA_APAGADA).lerp(JANELA_ACESA, k);
    });

    const fundoSai = sai(seg(p, 0.1, 0.24));
    fundo.forEach((m) => {
      m.visible = fundoSai < 1;
      m.scale.setScalar(Math.max(0.001, m.userData.s * (1 - fundoSai)));
      m.rotation.y += 0.006 * m.userData.giro;
      m.position.y = m.userData.y + Math.sin(t * 0.6 + m.userData.giro * 10) * 0.08 + fundoSai * 1.5;
    });
  }

  /* ---------- tamanho ---------- */
  function ajusta() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, w < 700 ? 1.5 : 1.75));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const dist = camera.aspect < 0.85 ? 10.5 / (camera.aspect / 0.85) ** 0.6 : 10.5;
    camera.position.set(0, 0.95, dist);
    camera.lookAt(alvo);
    camera.updateProjectionMatrix();
  }

  /* ---------- etapas de texto ---------- */
  const etapas = Array.from(hero.querySelectorAll('[data-etapa]'));
  const marcos = Array.from(hero.querySelectorAll('[data-marco]'));
  let etapaAtual = -1;
  function marcaEtapa(p) {
    const n = p < 0.13 ? 0 : p < 0.71 ? 1 : 2; // usina e rede dividem a mesma etapa de texto
    hero.classList.toggle('ja-rolou', p > 0.02);
    if (n === etapaAtual) return;
    etapaAtual = n;
    etapas.forEach((e) => { const on = Number(e.dataset.etapa) === n; e.classList.toggle('is-ativo', on); e.inert = !on; });
    marcos.forEach((m) => m.classList.toggle('is-ativo', Number(m.dataset.marco) === n));
  }

  /* ---------- liga tudo ---------- */
  hero.classList.add('is-3d');
  ajusta();
  let alvoP = 0, p = 0, ultimo = performance.now(), tempo = 0;

  if (!animado) { // menos movimento: uma imagem parada da conta
    const quadro = () => { ajusta(); aplica(0, 0.6); renderer.render(cena, camera); };
    quadro();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(quadro);
    window.addEventListener('resize', quadro);
    return;
  }

  etapas.forEach((e) => { if (e.dataset.etapa !== '0') e.inert = true; });
  marcaEtapa(0);
  window.ScrollTrigger.create({
    trigger: hero, start: 'top top', end: 'bottom bottom',
    onUpdate: (st) => { alvoP = st.progress; marcaEtapa(alvoP); }
  });
  window.ScrollTrigger.refresh();

  let visivel = true, quadro = 0;
  function laco(agora) {
    quadro = 0;
    const dt = Math.min(0.05, (agora - ultimo) / 1000);
    ultimo = agora;
    tempo += dt;
    p += (alvoP - p) * (1 - Math.exp(-dt * 7));
    if (Math.abs(alvoP - p) < 0.0002) p = alvoP;
    aplica(p, tempo);
    renderer.render(cena, camera);
    if (visivel && !document.hidden) quadro = requestAnimationFrame(laco);
  }
  function liga() { if (!quadro && visivel && !document.hidden) { ultimo = performance.now(); quadro = requestAnimationFrame(laco); } }

  new IntersectionObserver((ent) => { visivel = ent[0].isIntersecting; liga(); }).observe(hero);
  document.addEventListener('visibilitychange', liga);
  window.addEventListener('resize', ajusta);
  liga();
}
