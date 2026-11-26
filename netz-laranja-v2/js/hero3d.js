/* Hero 3D da LP Laranja: a laranja se solta do galho, cai na caixa de colheita, vai inteira para o espremedor
   (que acende com a energia) e vira suco no copo, guiado pela rolagem. Mesmo padrão de netz-cafe/js/hero3d.js.
   Tudo modelado em código (Three.js local). A laranja nunca aparece cortada (pedido do usuário em 12/11/2026).
   Sem WebGL: fica img/hero-laranja-3d.webp. Com "menos movimento": cena parada na laranja, rolagem normal. */
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
  let semente = 7;
  const rnd = () => { semente = (semente * 16807) % 2147483647; return (semente - 1) / 2147483646; };

  function texturaCanvas(w, h, desenha, cor = true) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    desenha(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c);
    if (cor) t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  /* ---------- cena ---------- */
  const cena = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  cena.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  cena.environmentIntensity = 0.55;

  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 60);
  const alvo = new THREE.Vector3(0, -0.15, 0);

  const luzChave = new THREE.DirectionalLight(0xfff0d6, 2.6);
  luzChave.position.set(-3.5, 5, 4.5);
  const luzRecorte = new THREE.DirectionalLight(0xd8d0f7, 1.6);
  luzRecorte.position.set(4, 2.5, -3.5);
  const luzPreenche = new THREE.HemisphereLight(0xfff1dc, 0x35247c, 0.7);
  cena.add(luzChave, luzRecorte, luzPreenche);

  /* ---------- texturas e materiais ---------- */
  const relevoCasca = texturaCanvas(512, 256, (g, w, h) => {
    g.fillStyle = 'rgb(150,150,150)'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 6000; i++) {
      const x = rnd() * w, y = rnd() * h, r = 0.8 + rnd() * 1.6;
      const grad = g.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, 'rgba(60,60,60,0.9)'); grad.addColorStop(1, 'rgba(150,150,150,0)');
      g.fillStyle = grad; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    }
  }, false);
  relevoCasca.wrapS = THREE.RepeatWrapping;
  const texMadeira = texturaCanvas(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#c4905a'; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) {
      const y0 = (i / 40) * h;
      ctx.strokeStyle = i % 3 ? 'rgba(120,72,36,.25)' : 'rgba(232,190,140,.3)';
      ctx.lineWidth = 1 + (i % 3);
      ctx.beginPath();
      for (let x = 0; x <= w; x += 8) ctx.lineTo(x, y0 + Math.sin(x * 0.03 + i) * 2.5);
      ctx.stroke();
    }
  });
  const texSombra = texturaCanvas(128, 128, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, 'rgba(10,6,30,.8)'); g.addColorStop(0.45, 'rgba(10,6,30,.35)'); g.addColorStop(1, 'rgba(10,6,30,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  });
  const texBrilho = texturaCanvas(128, 128, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, 'rgba(255,214,140,1)'); g.addColorStop(0.35, 'rgba(240,172,47,.55)'); g.addColorStop(1, 'rgba(240,172,47,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  });
  const texEspuma = texturaCanvas(256, 256, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, '#f39a2e'); g.addColorStop(0.8, '#f8b04f'); g.addColorStop(1, '#e8780f');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 260; i++) {
      const a = i * 2.39996, r = Math.sqrt(i / 260) * w * 0.46;
      ctx.fillStyle = `rgba(255,${226 + (i % 20)},${170 + (i % 40)},${0.25 + (i % 4) * 0.1})`;
      ctx.beginPath(); ctx.arc(w / 2 + Math.cos(a) * r, h / 2 + Math.sin(a) * r, 1.5 + (i % 3), 0, Math.PI * 2); ctx.fill();
    }
  });

  const M = {
    casca: new THREE.MeshPhysicalMaterial({
      color: 0xe86a06, roughness: 0.48, clearcoat: 0.35, clearcoatRoughness: 0.4,
      sheen: 0.12, sheenColor: new THREE.Color(0xffb060), bumpMap: relevoCasca, bumpScale: 1.0
    }),
    calice: new THREE.MeshStandardMaterial({ color: 0x5c7f2c, roughness: 0.85, side: THREE.DoubleSide }),
    cabo: new THREE.MeshStandardMaterial({ color: 0x5f8f2c, roughness: 0.6 }),
    folha: new THREE.MeshPhysicalMaterial({ vertexColors: true, emissive: 0x0d1f08, roughness: 0.38, clearcoat: 0.55, clearcoatRoughness: 0.3, side: THREE.DoubleSide }),
    madeira: new THREE.MeshStandardMaterial({ map: texMadeira, roughness: 0.65 }),
    inox: new THREE.MeshStandardMaterial({ color: 0xcfd1d6, metalness: 0.9, roughness: 0.3 }),
    painel: new THREE.MeshStandardMaterial({ color: 0x140d38, metalness: 0.2, roughness: 0.35 }),
    grade: new THREE.MeshStandardMaterial({ color: 0x2a2440, metalness: 0.6, roughness: 0.4 }),
    acrilico: new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.05, clearcoat: 1, transparent: true, opacity: 0.2, side: THREE.DoubleSide, depthWrite: false }),
    vidro: new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.04, clearcoat: 1, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false }),
    suco: new THREE.MeshPhysicalMaterial({ color: 0xe8700a, roughness: 0.3, clearcoat: 0.4, emissive: 0x3a1200, emissiveIntensity: 0.5 }),
    espuma: new THREE.MeshStandardMaterial({ map: texEspuma, roughness: 0.6 }),
    jato: new THREE.MeshPhysicalMaterial({ color: 0xec760c, roughness: 0.2, clearcoat: 1, emissive: 0x4a1c00, transparent: true, opacity: 0.92 })
  };

  function sombra(largura) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ map: texSombra, transparent: true, depthWrite: false, opacity: 0 }));
    m.rotation.x = -Math.PI / 2;
    m.scale.set(largura, largura * 0.62, 1);
    m.renderOrder = -1;
    cena.add(m);
    return m;
  }
  function poseSombra(s, obj, larg, forca) {
    s.position.set(obj.position.x, PISO + 0.003, obj.position.z);
    const alt = Math.max(0, obj.position.y - PISO);
    s.material.opacity = forca * clamp01(1 - alt / 2.6) * (obj.visible ? 1 : 0);
    const k = larg * obj.scale.x * (1 + alt * 0.2);
    s.scale.set(k, k * 0.62, 1);
  }

  /* Lâmina de folha: comprida, pontuda, dobrada na nervura e curvada (deitada ao longo de +X). */
  function lamina({ L, W, dobra, curva, base, nervura, ponta = 0.75, segU = 28, segV = 10 }) {
    const pos = [], cor = [], idx = [];
    const cb = new THREE.Color(base), cn = new THREE.Color(nervura), c = new THREE.Color();
    for (let i = 0; i <= segU; i++) {
      const u = i / segU;
      const w = W * Math.pow(Math.sin(Math.PI * Math.pow(u, ponta)), 0.85);
      for (let j = 0; j <= segV; j++) {
        const v = -1 + (2 * j) / segV;
        pos.push(L * u, v * w, Math.abs(v) * w * dobra - curva * L * u * u);
        c.copy(cb).lerp(cn, Math.max(0, 1 - Math.abs(v) / 0.12) * (1 - u * 0.6));
        cor.push(c.r, c.g, c.b);
      }
    }
    for (let i = 0; i < segU; i++) for (let j = 0; j < segV; j++) {
      const a = i * (segV + 1) + j, b = a + segV + 1;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(cor, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }
  const tubo = (pontos, raio, mat) => new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pontos.map((p) => new THREE.Vector3(...p))), 32, raio, 10, false), mat);

  /* ---------- laranja (inteira, sempre) ---------- */
  const geoFruto = new THREE.SphereGeometry(1, 72, 54);
  const geoCalice = new THREE.CircleGeometry(0.13, 5);
  function criaLaranja() {
    const g = new THREE.Group();
    const corpo = new THREE.Mesh(geoFruto, M.casca);
    corpo.scale.set(1, 0.94, 1);
    const calice = new THREE.Mesh(geoCalice, M.calice);
    calice.rotation.x = -Math.PI / 2;
    calice.position.y = 0.945;
    g.add(corpo, calice);
    return g;
  }

  // laranja em destaque, presa ao galho
  const fruto = criaLaranja();
  cena.add(fruto);
  const sombraFruto = sombra(2.2);
  const galho = new THREE.Group();
  galho.add(tubo([[0, 0.94, 0], [0.01, 1.14, 0.02], [0.08, 1.32, 0.04], [0.24, 1.46, 0.02], [0.46, 1.56, -0.04], [0.8, 1.66, -0.08], [1.25, 1.72, -0.1]], 0.03, M.cabo));
  const juncao = new THREE.Vector3(0.14, 1.4, 0.03);
  [
    { L: 1.0, W: 0.21, ang: 168, roll: 0.45, curva: 0.10 },
    { L: 0.82, W: 0.18, ang: 150, roll: -0.35, curva: 0.08 },
    { L: 0.70, W: 0.16, ang: 196, roll: 0.25, curva: 0.14 },
    { L: 0.8, W: 0.19, ang: 8, roll: -0.4, curva: 0.1, x: 0.95, y: 1.68 }
  ].forEach((f) => {
    const g = new THREE.Group();
    if (f.x) g.position.set(f.x, f.y, -0.08); else g.position.copy(juncao);
    g.rotation.set(f.roll, 0, (f.ang * Math.PI) / 180);
    const folha = new THREE.Mesh(lamina({ L: f.L, W: f.W, dobra: 0.32, curva: f.curva, base: 0x357a26, nervura: 0xa8cc72 }), M.folha);
    folha.position.x = 0.06;
    g.add(folha);
    galho.add(g);
  });
  cena.add(galho);

  // laranjas e folhas pequenas ao fundo, só na abertura
  const fundo = [];
  [[-2.3, 1.2, -3, 0.24], [2.4, 1.4, -4, 0.2], [-1.7, -0.9, -2.5, 0.22], [2.2, -0.6, -2, 0.26], [-2.8, 0.2, -5, 0.2], [1.3, 2.0, -5.5, 0.18]]
    .forEach(([x, y, z, s], i) => {
      const m = criaLaranja();
      m.position.set(x, y, z); m.userData = { s, y, giro: 0.3 + i * 0.07 };
      m.rotation.set(i, i * 2, i * 0.5);
      cena.add(m); fundo.push(m);
    });
  [[-1.2, 1.7, -2.5], [2.8, 0.6, -3.5], [-2.4, -0.4, -3]].forEach(([x, y, z], i) => {
    const m = new THREE.Mesh(lamina({ L: 0.7, W: 0.16, dobra: 0.3, curva: 0.1, base: 0x357a26, nervura: 0xa8cc72 }), M.folha);
    m.position.set(x, y, z); m.userData = { s: 1, y, giro: 0.5 + i * 0.2 };
    m.rotation.set(i * 0.7, i, i * 1.3);
    cena.add(m); fundo.push(m);
  });

  /* ---------- caixa de colheita em ripas ---------- */
  const caixa = new THREE.Group();
  const W = 1.9, D = 1.25, H = 0.95;
  const ripa = (w, h, d, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M.madeira); m.position.set(x, y, z); caixa.add(m); };
  [0.16, 0.48, 0.8].forEach((y) => {
    ripa(W, 0.2, 0.05, 0, y, D / 2); ripa(W, 0.2, 0.05, 0, y, -D / 2);
    ripa(0.05, 0.2, D, W / 2, y, 0); ripa(0.05, 0.2, D, -W / 2, y, 0);
  });
  [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([a, b]) => ripa(0.09, H, 0.09, a * (W / 2 - 0.02), H / 2, b * (D / 2 - 0.02)));
  ripa(W, 0.05, D, 0, 0.03, 0);
  cena.add(caixa);
  const sombraCaixa = sombra(3.0);
  const R = 0.27; // raio das laranjas na caixa
  const vagas = [ // [x, y, z] na caixa; 0 é a vaga da laranja em destaque; 6 a 9 já vêm cheias (camada de baixo)
    [0, 0.74, 0.28], [-0.6, 0.74, 0.28], [0.6, 0.74, 0.28], [-0.6, 0.76, -0.28], [0, 0.78, -0.28], [0.6, 0.75, -0.28],
    [-0.36, 0.3, 0.28], [0.36, 0.3, 0.28], [-0.36, 0.3, -0.28], [0.36, 0.3, -0.28]
  ];
  const laranjas = vagas.map((v, i) => {
    const m = i === 0 ? fruto : criaLaranja();
    if (i) { m.rotation.set(i * 1.3, i * 2.1, i * 0.7); cena.add(m); }
    return m;
  });

  /* ---------- espremedor automático (recebe a laranja inteira) ---------- */
  const maquina = new THREE.Group();
  const corpoMaq = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.6, 1.0), M.inox);
  corpoMaq.position.y = 0.8;
  const base = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.08, 1.4), M.grade);
  base.position.set(0, 0.04, 0.18);
  const painel = new THREE.Mesh(new THREE.BoxGeometry(1.06, 0.5, 0.03), M.painel);
  painel.position.set(0, 1.28, 0.51);
  const anel = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.024, 12, 48), new THREE.MeshBasicMaterial({ color: 0xf6bc4e, transparent: true, opacity: 0.15 }));
  anel.position.set(0, 1.28, 0.53);
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.4),
    new THREE.MeshBasicMaterial({ map: texBrilho, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  halo.position.set(0, 1.28, 0.56);
  const bocal = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.14, 0.24), M.painel);
  bocal.position.set(0, 0.98, 0.6);
  const bico = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.035, 0.12, 16), M.inox);
  bico.position.set(0, 0.86, 0.64);
  const bandeja = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.05, 0.44), M.grade);
  bandeja.position.set(0, 0.1, 0.7);
  const cupula = new THREE.Mesh(new THREE.SphereGeometry(0.66, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), M.acrilico);
  cupula.position.y = 1.6;
  cupula.renderOrder = 2;
  const aro = new THREE.Mesh(new THREE.TorusGeometry(0.66, 0.035, 12, 64), M.inox);
  aro.rotation.x = Math.PI / 2;
  aro.position.y = 1.6;
  const luzMaq = new THREE.PointLight(0xf0ac2f, 0, 3, 1.6);
  luzMaq.position.set(0, 1.28, 0.9);
  maquina.add(corpoMaq, base, painel, anel, halo, bocal, bico, bandeja, cupula, aro, luzMaq);
  cena.add(maquina);
  const sombraMaquina = sombra(2.6);
  const vagasCupula = [[-0.27, 1.86, -0.15], [0.27, 1.86, -0.15], [0, 1.86, 0.24], [-0.15, 2.12, 0.02], [0.17, 2.1, 0.02]];
  const pontaBico = new THREE.Vector3(0, 0.8, 0.64);

  /* ---------- copo de suco ---------- */
  const copo = new THREE.Group();
  const perfilCopo = [[0, 0], [0.29, 0], [0.31, 0.02], [0.35, 0.78], [0.36, 0.8], [0.34, 0.8], [0.33, 0.77], [0.29, 0.06], [0, 0.05]];
  const vidroCopo = new THREE.Mesh(new THREE.LatheGeometry(perfilCopo.map(([x, y]) => new THREE.Vector2(x, y)), 56), M.vidro);
  vidroCopo.renderOrder = 3;
  const corpoSuco = new THREE.Mesh(new THREE.CylinderGeometry(0.315, 0.28, 1, 48, 1, true), M.suco);
  const fundoSuco = new THREE.Mesh(new THREE.CircleGeometry(0.28, 48), M.suco);
  fundoSuco.rotation.x = -Math.PI / 2;
  fundoSuco.position.y = 0.06;
  const topoSuco = new THREE.Mesh(new THREE.CircleGeometry(1, 48), M.espuma);
  topoSuco.rotation.x = -Math.PI / 2;
  copo.add(corpoSuco, fundoSuco, topoSuco, vidroCopo);
  cena.add(copo);
  const sombraCopo = sombra(1.6);

  const enfeite = [criaLaranja(), criaLaranja()];
  enfeite.forEach((m, i) => { m.rotation.set(0.4 + i, i * 2.2, 0.3); cena.add(m); });

  const jato = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.036, 1, 14, 1, true), M.jato);
  cena.add(jato);

  /* ---------- quadro a quadro ---------- */
  const vA = new THREE.Vector3(), vB = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0);

  function aplica(p, t) {
    /* 1. laranja no galho → solta e cai na caixa */
    const solta = seg(p, 0.16, 0.24);
    const cai = suave(seg(p, 0.17, 0.29));
    const balanco = Math.sin(t * 0.8) * 0.05 * (1 - solta);
    galho.visible = solta < 1;
    galho.position.set(0, -0.05 + suave(solta) * 3.2, 0);
    galho.rotation.set(0, -0.25, balanco);

    const entraCaixa = sai(seg(p, 0.14, 0.26));
    const levantaCaixa = suave(seg(p, 0.45, 0.53));
    const saiCaixa = suave(seg(p, 0.6, 0.68));
    caixa.visible = entraCaixa > 0 && saiCaixa < 1;
    caixa.position.set(lerp(0, -1.15, levantaCaixa) - saiCaixa * 2.4, lerp(-5.5, PISO, entraCaixa) + levantaCaixa * (0.35 - PISO) + saiCaixa * 2.2, 0);
    caixa.scale.setScalar(lerp(1, 0.7, levantaCaixa));
    caixa.rotation.set(0.12 * (1 - levantaCaixa), lerp(-0.35, -0.2, entraCaixa), -0.7 * levantaCaixa * (1 - saiCaixa));
    caixa.updateMatrixWorld();
    poseSombra(sombraCaixa, caixa, 3.0, 0.55);

    /* 3. espremedor entra deslizando pela direita, recebe as laranjas, acende e espreme */
    const entraMaq = suave(seg(p, 0.44, 0.53));
    const centraMaq = suave(seg(p, 0.61, 0.68));
    const saiMaq = suave(seg(p, 0.87, 0.94));
    maquina.visible = entraMaq > 0 && saiMaq < 1;
    maquina.position.set(lerp(lerp(3.6, 0.55, entraMaq), 0.05, centraMaq) + saiMaq * 3.4, PISO + saiMaq * 1.5, 0);
    maquina.rotation.set(0, lerp(-0.8, -0.3, entraMaq), 0);
    maquina.scale.setScalar(0.88);
    maquina.updateMatrixWorld();
    poseSombra(sombraMaquina, maquina, 2.4, 0.6);
    const ligada = seg(p, 0.62, 0.69) * (1 - seg(p, 0.88, 0.92));
    const pulso = 0.85 + Math.sin(t * 3) * 0.15;
    anel.material.opacity = 0.15 + ligada * 0.85 * pulso;
    halo.material.opacity = ligada * 0.9 * pulso;
    luzMaq.intensity = ligada * 5 * pulso;
    const trabalho = seg(p, 0.66, 0.86);
    maquina.position.x += Math.sin(t * 40) * 0.004 * (trabalho > 0 && trabalho < 1 ? 1 : 0);

    /* laranjas: no galho → caixa → voando para a cúpula → consumidas pela máquina */
    const despeja = seg(p, 0.5, 0.6);
    laranjas.forEach((m, i) => {
      // na caixa
      const chuva = i === 0 ? cai : i >= 6 ? 1 : sai(seg(p, 0.28 + (i - 1) * 0.026, 0.33 + (i - 1) * 0.026));
      vA.set(...vagas[i]).applyMatrix4(caixa.matrixWorld);
      if (i === 0) {
        vB.set(0, -0.05 + balanco * 0.5, 0); // pendurada no galho
        m.scale.setScalar(lerp(1, R * caixa.scale.x, sai(seg(p, 0.17, 0.25))));
        m.rotation.set(-0.2 + balanco, -0.4 + t * 0.15 * (1 - cai), balanco * 2);
      } else {
        vB.set(vA.x + (i % 2 ? 0.2 : -0.2), vA.y + 2.6, vA.z);
        m.scale.setScalar(R * caixa.scale.x);
      }
      m.position.lerpVectors(vB, vA, i === 0 ? cai : chuva * chuva);
      if (i === 0 && cai >= 1) m.position.copy(vA);
      m.visible = (i === 0 || (chuva > 0 && caixa.visible)) && entraCaixa > 0 || i === 0;

      // voa para a cúpula, em arco, uma de cada vez
      const ordem = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].indexOf(i);
      const q = sai(seg(despeja, ordem * 0.06, ordem * 0.06 + 0.42));
      if (q > 0) {
        const vaga = vagasCupula[i % vagasCupula.length];
        const destino = vB.set(vaga[0], vaga[1] + (i >= vagasCupula.length ? 0.3 : 0), vaga[2]).applyMatrix4(maquina.matrixWorld);
        m.position.lerpVectors(vA, destino, q);
        m.position.y += Math.sin(q * Math.PI) * 0.7;
        m.scale.setScalar(lerp(R * caixa.scale.x, 0.25 * 0.88, q) * (i >= vagasCupula.length ? 1 - seg(q, 0.85, 1) : 1));
        m.rotation.x += 0.02;
        m.visible = maquina.visible && (i < vagasCupula.length || q < 1);
        // a máquina consome as laranjas da cúpula enquanto trabalha
        if (i < vagasCupula.length && q >= 1) {
          const come = seg(trabalho, i * 0.16, i * 0.16 + 0.22);
          m.scale.multiplyScalar(1 - come);
          m.position.y -= come * 0.3 * 0.88;
          m.rotation.y = t * 2.5 + i;
          m.visible = come < 1 && maquina.visible;
        }
      }
    });
    sombraFruto.position.set(fruto.position.x, PISO + 0.003, 0);
    sombraFruto.material.opacity = 0.45 * (1 - cai);
    sombraFruto.scale.set(2.0, 1.1, 1);

    const fundoSai = sai(seg(p, 0.1, 0.24));
    fundo.forEach((m) => {
      m.visible = fundoSai < 1;
      const s = m.userData.s * (1 - fundoSai);
      m.scale.setScalar(s || 0.0001);
      m.rotation.y += 0.004 * m.userData.giro;
      m.position.y = m.userData.y + Math.sin(t * 0.6 + m.userData.giro * 10) * 0.08 + fundoSai * 1.5;
    });

    /* 4. copo entra na bandeja, enche com o jato, vai para o centro */
    const entraCopo = sai(seg(p, 0.7, 0.78));
    const centraCopo = suave(seg(p, 0.88, 0.97));
    copo.visible = entraCopo > 0;
    vA.set(0, 0.125, 0.7).applyMatrix4(maquina.matrixWorld);
    const naBandeja = vA.clone();
    naBandeja.x = lerp(-3.2, naBandeja.x, entraCopo);
    copo.position.set(lerp(naBandeja.x, 0, centraCopo), lerp(naBandeja.y, PISO, centraCopo), lerp(naBandeja.z, 0.25, centraCopo));
    copo.scale.setScalar(lerp(0.88, 1.75, centraCopo));
    copo.rotation.y = Math.sin(t * 0.4) * 0.05 * centraCopo;
    poseSombra(sombraCopo, copo, 1.6, 0.6 * (centraCopo > 0 ? 1 : 0));

    const chegam = sai(seg(p, 0.9, 0.98));
    enfeite.forEach((m, i) => {
      m.visible = chegam > 0;
      const r = i ? 0.3 : 0.36;
      m.scale.setScalar(r);
      m.position.set(lerp(i ? 3.2 : -3.2, i ? 0.98 : -1.02, chegam), PISO + r * 0.94, i ? 0.55 : 0.15);
      m.rotation.y = (1 - chegam) * (i ? -4 : 4) + i;
    });

    const enche = suave(seg(p, 0.79, 0.89));
    const nivel = lerp(0.06, 0.72, enche);
    corpoSuco.visible = fundoSuco.visible = topoSuco.visible = enche > 0.01;
    corpoSuco.scale.set(1, Math.max(0.001, nivel - 0.06), 1);
    corpoSuco.position.y = 0.06 + (nivel - 0.06) / 2;
    const raio = lerp(0.29, 0.33, (nivel - 0.06) / 0.72);
    corpoSuco.scale.x = corpoSuco.scale.z = raio / 0.315;
    topoSuco.position.y = nivel;
    topoSuco.scale.setScalar(raio - 0.005);

    const derrama = seg(p, 0.77, 0.79) * (1 - seg(p, 0.87, 0.89));
    jato.visible = derrama > 0 && maquina.visible && copo.visible;
    if (jato.visible) {
      const a = pontaBico.clone().applyMatrix4(maquina.matrixWorld);
      const b = new THREE.Vector3(copo.position.x, copo.position.y + nivel * copo.scale.y, copo.position.z);
      const fim = a.clone().lerp(b, derrama);
      const dir = fim.clone().sub(a);
      jato.position.copy(a).addScaledVector(dir, 0.5);
      jato.scale.set(1, Math.max(0.001, dir.length()), 1);
      jato.quaternion.setFromUnitVectors(UP, dir.normalize());
    }
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
    const n = p < 0.13 ? 0 : p < 0.44 ? 1 : p < 0.71 ? 2 : 3;
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

  if (!animado) { // menos movimento: uma imagem parada da laranja no galho
    aplica(0, 0.6);
    renderer.render(cena, camera);
    window.addEventListener('resize', () => { ajusta(); aplica(0, 0.6); renderer.render(cena, camera); });
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
