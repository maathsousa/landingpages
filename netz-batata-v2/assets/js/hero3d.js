/* Hero 3D da LP Batata: o pé de batata é arrancado da terra, as batatas passam lavando pela esteira,
   caem no cesto da fritadeira (que acende com a energia NETZ) e saem fritas na caixinha, guiado pela rolagem.
   Mesmo padrão de netz-cafe/js/hero3d.js e netz-laranja/js/hero3d.js (ver memoria/padrao-hero-3d.md).
   Tudo modelado em código (Three.js local, sem modelos baixados). A batata nunca aparece sendo cortada:
   entra inteira no óleo e sai como fritas.
   Sem WebGL: fica assets/img/hero-batata-3d.webp. Com "menos movimento": cena parada no pé de batata. */
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
  const reduz = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let tentativas = 0;
  (function espera() {
    if ((window.gsap && window.ScrollTrigger) || reduz || ++tentativas > 60) init(!reduz && !!window.gsap && !!window.ScrollTrigger);
    else setTimeout(espera, 50);
  })();
}
comeca();

function init(animado) {
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
  let semente = 11;
  const rnd = () => { semente = (semente * 16807) % 2147483647; return (semente - 1) / 2147483646; };

  function texturaCanvas(w, h, desenha) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    desenha(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }
  function suavizaCostura(g) {
    g.computeVertexNormals();
    const pos = g.attributes.position, nor = g.attributes.normal, grupos = new Map();
    for (let i = 0; i < pos.count; i++) {
      const k = pos.getX(i).toFixed(4) + ',' + pos.getY(i).toFixed(4) + ',' + pos.getZ(i).toFixed(4);
      (grupos.get(k) || grupos.set(k, []).get(k)).push(i);
    }
    const n = new THREE.Vector3();
    grupos.forEach((ids) => {
      if (ids.length < 2) return;
      n.set(0, 0, 0);
      ids.forEach((i) => { n.x += nor.getX(i); n.y += nor.getY(i); n.z += nor.getZ(i); });
      n.normalize();
      ids.forEach((i) => nor.setXYZ(i, n.x, n.y, n.z));
    });
    return g;
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
  const luzRecorte = new THREE.DirectionalLight(0xf0ac2f, 1.8);
  luzRecorte.position.set(4, 2.5, -3.5);
  cena.add(luzChave, luzRecorte, new THREE.HemisphereLight(0xfff1dc, 0x35247c, 0.7));

  /* ---------- texturas ---------- */
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
  const texGrade = texturaCanvas(128, 128, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = '#d8d6dc'; ctx.lineWidth = 5;
    for (let i = 0; i <= 8; i++) {
      const k = (i / 8) * w;
      ctx.beginPath(); ctx.moveTo(k, 0); ctx.lineTo(k, h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, k); ctx.lineTo(w, k); ctx.stroke();
    }
  });
  const texOleo = texturaCanvas(256, 256, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w * 0.4, h * 0.4, 0, w / 2, h / 2, w * 0.7);
    g.addColorStop(0, '#f6c454'); g.addColorStop(0.6, '#d9962a'); g.addColorStop(1, '#a8661a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  });

  /* ---------- materiais ---------- */
  const M = {
    terra: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }),
    caule: new THREE.MeshStandardMaterial({ color: 0x4d7a2a, roughness: 0.6 }),
    raiz: new THREE.MeshStandardMaterial({ color: 0xcdb08a, roughness: 0.8 }),
    folha: new THREE.MeshPhysicalMaterial({ vertexColors: true, emissive: 0x0d1f08, roughness: 0.45, clearcoat: 0.35, side: THREE.DoubleSide }),
    inox: new THREE.MeshStandardMaterial({ color: 0xcfd1d6, metalness: 0.9, roughness: 0.3 }),
    painel: new THREE.MeshStandardMaterial({ color: 0x160f38, metalness: 0.2, roughness: 0.35 }),
    borracha: new THREE.MeshStandardMaterial({ color: 0x2a2440, roughness: 0.7 }),
    ripa: new THREE.MeshStandardMaterial({ color: 0x4a4366, roughness: 0.6 }),
    oleo: new THREE.MeshPhysicalMaterial({ map: texOleo, roughness: 0.12, clearcoat: 1, emissive: 0x3a2000, emissiveIntensity: 0.6 }),
    grade: new THREE.MeshStandardMaterial({ map: texGrade, transparent: true, alphaTest: 0.4, metalness: 0.7, roughness: 0.35, side: THREE.DoubleSide }),
    frita: new THREE.MeshStandardMaterial({ color: 0xeab04b, roughness: 0.55, emissive: 0x2a1400, emissiveIntensity: 0.4 }),
    papel: new THREE.MeshStandardMaterial({ color: 0x35247c, roughness: 0.55, side: THREE.DoubleSide }),
    faixa: new THREE.MeshStandardMaterial({ color: 0xf0ac2f, roughness: 0.45, side: THREE.DoubleSide }),
    bolha: new THREE.MeshStandardMaterial({ color: 0xffe2a0, roughness: 0.2, transparent: true, opacity: 0.7 })
  };

  function sombra(largura) {
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
    s.material.opacity = forca * clamp01(1 - alt / 2.6) * (obj.visible ? 1 : 0);
    const k = larg * obj.scale.x * (1 + alt * 0.2);
    s.scale.set(k, k * 0.62, 1);
  }

  /* Folíolo: lâmina oval, dobrada na nervura (deitada ao longo de +X), com a nervura clara por vértice. */
  function lamina({ L, W, dobra, curva, base, nervura, ponta = 0.62, segU = 20, segV = 8 }) {
    const pos = [], cor = [], idx = [];
    const cb = new THREE.Color(base), cn = new THREE.Color(nervura), c = new THREE.Color();
    for (let i = 0; i <= segU; i++) {
      const u = i / segU;
      const w = W * Math.pow(Math.sin(Math.PI * Math.pow(u, ponta)), 0.8);
      for (let j = 0; j <= segV; j++) {
        const v = -1 + (2 * j) / segV;
        pos.push(L * u, v * w, Math.abs(v) * w * dobra - curva * L * u * u);
        c.copy(cb).lerp(cn, Math.max(0, 1 - Math.abs(v) / 0.14) * (1 - u * 0.5));
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
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pontos.map((p) => new THREE.Vector3(...p))), 24, raio, 8, false), mat);

  /* ---------- batata (inteira, irregular, com olhos e pintinhas) ---------- */
  function geometriaBatata(sem) {
    const g = new THREE.SphereGeometry(1, 48, 36);
    const pos = g.attributes.position, cores = [], v = new THREE.Vector3();
    const olhos = Array.from({ length: 6 }, (_, i) => new THREE.Vector3(Math.sin(i * 2.4 + sem), Math.cos(i * 1.7 + sem * 2) * 0.8, Math.sin(i * 3.1 + sem * 3)).normalize());
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      let r = 1 + 0.07 * Math.sin(3 * v.x + sem) * Math.sin(2 * v.y + sem * 2) * Math.sin(2.5 * v.z + 1)
                + 0.04 * Math.sin(5 * v.x + 2 * sem) * Math.cos(4 * v.z + sem);
      let olho = 0;
      olhos.forEach((d) => { const k = v.dot(d); if (k > 0.965) olho = Math.max(olho, (k - 0.965) / 0.035); });
      r -= 0.07 * olho;
      pos.setXYZ(i, v.x * r * 1.28, v.y * r * 0.82, v.z * r * 0.92);
      const pinta = Math.sin(v.x * 41 + sem) * Math.sin(v.y * 37) * Math.sin(v.z * 43 + sem) > 0.86 ? 0.82 : 1;
      const tom = (0.9 + 0.1 * Math.sin(v.x * 7 + v.z * 5 + sem)) * pinta * (1 - 0.25 * olho);
      cores.push(tom, tom * 0.96, tom * 0.9);
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(cores, 3));
    return suavizaCostura(g);
  }
  const geosBatata = [0, 1, 2].map((k) => geometriaBatata(k * 1.9 + 0.4));
  const SUJA = new THREE.Color(0x6e4a2c), LIMPA = new THREE.Color(0xd9ab6c);
  function criaBatata(i, limpa = false) {
    const m = new THREE.Mesh(geosBatata[i % 3], new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.72, color: limpa ? LIMPA : SUJA }));
    m.rotation.set(i * 1.3, i * 2.1, i * 0.7);
    return m;
  }

  /* ---------- camalhão de terra com o pé de batata ---------- */
  const camalhao = new THREE.Mesh((() => {
    const g = new THREE.SphereGeometry(1.6, 48, 20, 0, Math.PI * 2, 0, Math.PI / 2);
    const pos = g.attributes.position, cores = [], v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const n = 1 + 0.05 * Math.sin(v.x * 6) * Math.sin(v.z * 5) + 0.03 * Math.sin(v.x * 17 + v.z * 13);
      pos.setXYZ(i, v.x * n, v.y * 0.5 * n, v.z * n * 0.85);
      const t = 0.75 + 0.25 * Math.sin(v.x * 23 + v.z * 19) * Math.sin(v.y * 31);
      cores.push(0.1 * t, 0.055 * t, 0.03 * t); // terra escura (cores lineares)
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(cores, 3));
    return suavizaCostura(g);
  })(), M.terra);
  cena.add(camalhao);
  const sombraCamalhao = sombra(3.6);
  const TOPO_CAMALHAO = 0.8;

  const planta = new THREE.Group();
  const hastes = [[[0, 0, 0], [-0.08, 0.4, 0.05], [-0.3, 0.85, 0.1], [-0.5, 1.15, 0.12]],
    [[0, 0, 0], [0.05, 0.45, -0.05], [0.18, 0.95, -0.1], [0.3, 1.3, -0.08]],
    [[0, 0, 0], [0.1, 0.35, 0.1], [0.45, 0.7, 0.2], [0.7, 0.95, 0.25]]];
  hastes.forEach((pts) => {
    planta.add(tubo(pts, 0.035, M.caule));
    const ponta = new THREE.Vector3(...pts[pts.length - 1]);
    const dir = ponta.clone().sub(new THREE.Vector3(...pts[pts.length - 2])).normalize();
    // folha composta: um folíolo na ponta e pares ao longo da haste
    [[0, 0, 0.42, 0.2], [-0.12, 1.1, 0.3, 0.14], [-0.12, -1.1, 0.3, 0.14], [-0.3, 1.3, 0.26, 0.12], [-0.3, -1.3, 0.26, 0.12]].forEach(([recuo, ang, L, W], k) => {
      const f = new THREE.Group();
      f.position.copy(ponta).addScaledVector(dir, recuo);
      f.rotation.set(0.3 * (k % 2 ? 1 : -1), Math.atan2(-dir.z, dir.x), Math.atan2(dir.y, Math.hypot(dir.x, dir.z)) + ang);
      f.add(new THREE.Mesh(lamina({ L, W, dobra: 0.28, curva: 0.12, base: 0x3f7a22, nervura: 0x9bc46a }), M.folha));
      planta.add(f);
    });
  });
  // estolões (raízes) com as batatas na ponta, escondidas dentro do camalhão
  const ancoras = [[-0.55, -0.45, 0.15], [0.5, -0.5, -0.1], [-0.1, -0.62, 0.3], [0.22, -0.36, 0.34], [0.05, -0.55, -0.35]];
  ancoras.forEach(([x, y, z]) => planta.add(tubo([[0, 0, 0], [x * 0.3, y * 0.5, z * 0.3], [x * 0.8, y * 0.9, z * 0.8], [x, y, z]], 0.012, M.raiz)));
  cena.add(planta);

  const batatas = ancoras.map((_, i) => { const m = criaBatata(i); cena.add(m); return m; });
  const R = 0.2; // escala da batata
  const soltas = [criaBatata(3, true), criaBatata(1, true)]; // duas batatas limpas na frente do camalhão
  soltas.forEach((m) => cena.add(m));

  // batatas e folhas pequenas ao fundo, só na abertura
  const fundo = [];
  [[-2.3, 1.2, -3, 0.16], [2.4, 1.4, -4, 0.14], [-1.7, -0.6, -2.5, 0.15], [2.2, -0.4, -2, 0.17], [-2.8, 0.3, -5, 0.14], [1.4, 2.0, -5.5, 0.12]]
    .forEach(([x, y, z, s], i) => {
      const m = criaBatata(i, true);
      m.position.set(x, y, z); m.userData = { s, y, giro: 0.3 + i * 0.07 };
      cena.add(m); fundo.push(m);
    });

  /* ---------- lavadora: esteira com jato d'água ---------- */
  const lavadora = new THREE.Group();
  const caixa3 = (w, h, d, x, y, z, mat) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); lavadora.add(m); return m; };
  const COMP = 2.6, TOPO_ESTEIRA = 0.78;
  caixa3(COMP, 0.12, 0.06, 0, 0.74, 0.46, M.inox); caixa3(COMP, 0.12, 0.06, 0, 0.74, -0.46, M.inox);
  caixa3(COMP, 0.03, 0.86, 0, 0.75, 0, M.borracha);
  [[-1.2, 0.4], [1.2, 0.4], [-1.2, -0.4], [1.2, -0.4]].forEach(([x, z]) => {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.7, 12), M.inox); p.position.set(x, 0.35, z); lavadora.add(p);
  });
  [-1.3, 1.3].forEach((x) => { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.9, 20), M.inox); r.rotation.x = Math.PI / 2; r.position.set(x, 0.74, 0); lavadora.add(r); });
  const ripas = Array.from({ length: 14 }, () => caixa3(0.05, 0.014, 0.84, 0, TOPO_ESTEIRA, 0, M.ripa));
  // arco do jato: dois postes, travessa e a barra de bicos
  [[0.46], [-0.46]].forEach(([z]) => { caixa3(0.06, 0.55, 0.05, -0.38, 1.05, z, M.inox); caixa3(0.06, 0.55, 0.05, 0.38, 1.05, z, M.inox); });
  caixa3(0.86, 0.06, 1.0, 0, 1.34, 0, M.inox);
  const barra = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.9, 12), M.inox);
  barra.rotation.x = Math.PI / 2; barra.position.set(0, 1.27, 0); lavadora.add(barra);
  const N_AGUA = 160;
  const aguaGeo = new THREE.BufferGeometry();
  aguaGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N_AGUA * 3), 3));
  const agua = new THREE.Points(aguaGeo, new THREE.PointsMaterial({ color: 0xd6efff, size: 0.035, transparent: true, opacity: 0, depthWrite: false }));
  agua.frustumCulled = false;
  lavadora.add(agua);
  const fasesAgua = Array.from({ length: N_AGUA }, () => [rnd(), rnd() - 0.5, rnd() - 0.5]);
  cena.add(lavadora);
  const sombraLavadora = sombra(3.4);

  /* ---------- fritadeira elétrica com cesto ---------- */
  const fritadeira = new THREE.Group();
  const corpo = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.0, 1.15), M.inox);
  corpo.position.y = 0.5;
  const poco = new THREE.Mesh(new THREE.BoxGeometry(1.08, 0.02, 0.84), M.painel);
  poco.position.y = 1.005;
  const oleo = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.76), M.oleo);
  oleo.rotation.x = -Math.PI / 2; oleo.position.y = 1.018;
  const painelF = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.36, 0.03), M.painel);
  painelF.position.set(0, 0.56, 0.58);
  const anel = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.022, 12, 48), new THREE.MeshBasicMaterial({ color: 0xf6bc4e, transparent: true, opacity: 0.15 }));
  anel.position.set(-0.22, 0.56, 0.6);
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.4),
    new THREE.MeshBasicMaterial({ map: texBrilho, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  halo.position.set(-0.22, 0.56, 0.62);
  const botao = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.06, 20), M.inox);
  botao.rotation.x = Math.PI / 2; botao.position.set(0.25, 0.56, 0.61);
  const luzF = new THREE.PointLight(0xf0ac2f, 0, 3, 1.6);
  luzF.position.set(0, 1.3, 0.6);
  const brilhoOleo = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.8),
    new THREE.MeshBasicMaterial({ map: texBrilho, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  brilhoOleo.rotation.x = -Math.PI / 2; brilhoOleo.position.y = 1.03;
  // cesto de arame: fundo, quatro lados, aro e cabo
  const cesto = new THREE.Group();
  const CW = 0.86, CH = 0.42, CD = 0.66;
  const ladoCesto = (w, h, x, y, z, rx, ry) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), M.grade); m.position.set(x, y, z); m.rotation.set(rx, ry, 0); cesto.add(m); };
  ladoCesto(CW, CD, 0, 0, 0, -Math.PI / 2, 0);
  ladoCesto(CW, CH, 0, CH / 2, CD / 2, 0, 0); ladoCesto(CW, CH, 0, CH / 2, -CD / 2, 0, 0);
  ladoCesto(CD, CH, CW / 2, CH / 2, 0, 0, Math.PI / 2); ladoCesto(CD, CH, -CW / 2, CH / 2, 0, 0, Math.PI / 2);
  [[CW, 0, CD / 2], [CW, 0, -CD / 2], [CD, CW / 2, 0], [CD, -CW / 2, 0]].forEach(([L, x, z], k) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(k < 2 ? L : 0.03, 0.03, k < 2 ? 0.03 : L), M.inox); b.position.set(x, CH, z); cesto.add(b);
  });
  const cabo = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.7, 12), M.inox);
  cabo.rotation.x = -1.0; cabo.position.set(0, CH + 0.18, CD / 2 + 0.28); cesto.add(cabo);
  const pega = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.22, 12), M.painel);
  pega.rotation.x = -1.0; pega.position.set(0, CH + 0.37, CD / 2 + 0.55); cesto.add(pega);
  fritadeira.add(corpo, poco, oleo, brilhoOleo, painelF, anel, halo, botao, luzF, cesto);
  // bolhas no óleo
  const N_BOLHA = 40;
  const bolhas = new THREE.InstancedMesh(new THREE.SphereGeometry(0.03, 8, 6), M.bolha, N_BOLHA);
  const fasesBolha = Array.from({ length: N_BOLHA }, () => [rnd(), rnd() - 0.5, rnd() - 0.5, 0.5 + rnd()]);
  fritadeira.add(bolhas);
  cena.add(fritadeira);
  const sombraFritadeira = sombra(2.6);
  const vagasCesto = [[-0.24, 0.16, -0.14], [0.24, 0.16, -0.14], [0, 0.16, 0.16], [-0.26, 0.16, 0.18], [0.27, 0.17, 0.16]];

  /* ---------- fritas e a caixinha ---------- */
  const N_FRITA = 30;
  const fritas = new THREE.InstancedMesh(new THREE.BoxGeometry(0.06, 0.06, 0.62), M.frita, N_FRITA);
  fritas.frustumCulled = false;
  cena.add(fritas);
  const vagasFrita = Array.from({ length: N_FRITA }, (_, i) => ({
    cesto: [(rnd() - 0.5) * 0.7, 0.06 + (i % 3) * 0.06, (rnd() - 0.5) * 0.25, rnd() * 0.6 - 0.3],
    caixa: [(rnd() - 0.5) * 0.5, 0.72 + rnd() * 0.18, (rnd() - 0.5) * 0.3, (rnd() - 0.5) * 0.5, (rnd() - 0.5) * 0.4],
    giro: rnd() * 6
  }));
  const caixinha = new THREE.Group();
  const copoCaixa = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.42, 0.9, 4, 1, true), M.papel);
  copoCaixa.rotation.y = Math.PI / 4; copoCaixa.scale.set(1, 1, 0.62); copoCaixa.position.y = 0.45;
  const fundoCaixa = new THREE.Mesh(new THREE.PlaneGeometry(0.59, 0.37), M.papel);
  fundoCaixa.rotation.x = -Math.PI / 2; fundoCaixa.position.y = 0.01;
  const faixa = new THREE.Mesh(new THREE.CylinderGeometry(0.585, 0.565, 0.12, 4, 1, true), M.faixa);
  faixa.rotation.y = Math.PI / 4; faixa.scale.set(1.005, 1, 0.625); faixa.position.y = 0.66;
  caixinha.add(copoCaixa, fundoCaixa, faixa);
  cena.add(caixinha);
  const sombraCaixinha = sombra(1.8);
  const enfeite = [criaBatata(0, true), criaBatata(2, true)];
  enfeite.forEach((m) => cena.add(m));

  /* ---------- quadro a quadro ---------- */
  const vA = new THREE.Vector3(), vB = new THREE.Vector3();
  const tmpM = new THREE.Matrix4(), tmpQ = new THREE.Quaternion(), tmpE = new THREE.Euler(), tmpS = new THREE.Vector3(1, 1, 1), tmpV = new THREE.Vector3();

  function aplica(p, t) {
    /* 1. camalhão com o pé de batata; a planta é arrancada e mostra as batatas */
    const balanco = Math.sin(t * 0.9) * 0.04;
    const afunda = suave(seg(p, 0.16, 0.24));
    camalhao.visible = afunda < 1;
    camalhao.position.set(0, PISO - afunda * 2.2, 0);
    sombraCamalhao.position.set(0, PISO + 0.003, 0.1);
    sombraCamalhao.scale.set(3.6, 2.2, 1);
    sombraCamalhao.material.opacity = 0.5 * (1 - afunda);
    const arranca = suave(seg(p, 0.15, 0.23));
    const sobePlanta = suave(seg(p, 0.25, 0.31));
    planta.visible = sobePlanta < 1;
    planta.position.set(0, PISO + TOPO_CAMALHAO + arranca * 1.05 + sobePlanta * 3.2, 0);
    planta.rotation.set(balanco * 0.5, -0.2 + arranca * 0.4, balanco);
    planta.updateMatrixWorld();
    soltas.forEach((m, i) => {
      m.visible = afunda < 1;
      m.scale.setScalar(R * 1.1);
      m.position.set(i ? 0.95 : -0.85, PISO + 0.17 - afunda * 2.2, i ? 0.95 : 1.05);
    });

    /* 2. a lavadora entra pela esquerda; as batatas caem na esteira e passam pelo jato */
    const entraLav = suave(seg(p, 0.19, 0.28));
    const ladoLav = suave(seg(p, 0.45, 0.53));
    const saiLav = suave(seg(p, 0.6, 0.68));
    lavadora.visible = entraLav > 0 && saiLav < 1;
    lavadora.position.set(lerp(-4.2, 0, entraLav) - ladoLav * 1.2 - saiLav * 3, PISO, 0);
    lavadora.scale.setScalar(lerp(1, 0.72, ladoLav));
    lavadora.rotation.set(0.1 * (1 - ladoLav), lerp(0.5, -0.18, entraLav), 0);
    lavadora.updateMatrixWorld();
    poseSombra(sombraLavadora, lavadora, 3.4, 0.5);
    const lava = seg(p, 0.31, 0.45);
    const movEsteira = lava + seg(p, 0.48, 0.58) * 0.4;
    ripas.forEach((r, i) => { r.position.x = ((((i / ripas.length) + movEsteira * 1.6) % 1) - 0.5) * (COMP - 0.1); });
    const jato = seg(p, 0.3, 0.33) * (1 - seg(p, 0.45, 0.48));
    agua.material.opacity = jato * 0.8;
    const arrPos = aguaGeo.attributes.position;
    fasesAgua.forEach(([f, x, z], i) => {
      const vida = (f + t * 1.4) % 1;
      arrPos.setXYZ(i, x * 0.7, 1.25 - vida * 0.46, z * 0.8);
    });
    arrPos.needsUpdate = true;

    /* 3. a fritadeira entra pela direita, recebe as batatas, acende (energia) e frita */
    const entraFrit = suave(seg(p, 0.44, 0.53));
    const centraFrit = suave(seg(p, 0.61, 0.68));
    const saiFrit = suave(seg(p, 0.87, 0.94));
    fritadeira.visible = entraFrit > 0 && saiFrit < 1;
    fritadeira.position.set(lerp(lerp(3.6, 0.75, entraFrit), 0.35, centraFrit) + saiFrit * 3.4, PISO + saiFrit * 1.5, 0);
    fritadeira.rotation.set(0, lerp(-0.8, -0.32, entraFrit), 0);
    fritadeira.scale.setScalar(0.88);
    const ligada = seg(p, 0.62, 0.69) * (1 - seg(p, 0.88, 0.92));
    const pulso = 0.85 + Math.sin(t * 3) * 0.15;
    anel.material.opacity = 0.15 + ligada * 0.85 * pulso;
    halo.material.opacity = ligada * 0.9 * pulso;
    luzF.intensity = ligada * 5 * pulso;
    const mergulha = suave(seg(p, 0.63, 0.67)) * (1 - suave(seg(p, 0.75, 0.79)));
    brilhoOleo.material.opacity = ligada * 0.55 * pulso;
    cesto.position.set(0, lerp(1.22, 0.62, mergulha), 0);
    fritadeira.position.x += Math.sin(t * 38) * 0.003 * mergulha;
    fritadeira.updateMatrixWorld();
    poseSombra(sombraFritadeira, fritadeira, 2.4, 0.6);
    fasesBolha.forEach(([f, x, z, s], i) => {
      const vida = (f + t * s) % 1;
      const k = mergulha * ligada > 0.05 ? Math.sin(vida * Math.PI) * mergulha : 0;
      tmpV.set(x * 0.9, 1.02 + vida * 0.05, z * 0.66);
      tmpS.setScalar(Math.max(0.0001, k * (0.6 + s * 0.5)));
      tmpM.compose(tmpV, tmpQ.identity(), tmpS);
      bolhas.setMatrixAt(i, tmpM);
    });
    bolhas.instanceMatrix.needsUpdate = true;

    /* batatas: no estolão → caem na esteira → lavam → voam para o cesto → somem no óleo */
    const despeja = seg(p, 0.5, 0.6);
    batatas.forEach((m, i) => {
      const [ax, ay, az] = ancoras[i];
      vA.set(ax, ay, az).applyMatrix4(planta.matrixWorld); // pendurada na planta
      const xIni = -1.05 + i * 0.22, xFim = 0.42 + (i % 3) * 0.24, z = i % 2 ? 0.2 : -0.2;
      const anda = sai(seg(lava, i * 0.06, 0.6 + i * 0.08));
      const xEst = lerp(xIni, xFim, anda);
      vB.set(xEst, TOPO_ESTEIRA + R * 0.82, z).applyMatrix4(lavadora.matrixWorld); // na esteira
      const cai = suave(seg(p, 0.24 + i * 0.01, 0.3 + i * 0.01));
      m.position.lerpVectors(vA, vB, cai);
      m.position.y += Math.sin(cai * Math.PI) * 0.35;
      m.scale.setScalar(R * (1 - cai * 0) * (cai > 0 ? lavadora.scale.x * 0.28 + 0.72 : 1));
      const limpa = clamp01((xEst + 0.3) / 0.5) * (cai >= 1 ? 1 : 0);
      m.material.color.copy(SUJA).lerp(LIMPA, limpa);
      m.rotation.set(i * 1.3 + anda * 3, i * 2.1, i * 0.7 + cai * 2);
      m.visible = p < 0.25 ? arranca > 0.02 : true;

      const q = sai(seg(despeja, i * 0.08, i * 0.08 + 0.42));
      if (q > 0) {
        const [cx, cy, cz] = vagasCesto[i];
        vA.set(cx, cy, cz).applyMatrix4(cesto.matrixWorld);
        m.position.lerpVectors(vB, vA, q);
        m.position.y += Math.sin(q * Math.PI) * 0.75;
        m.scale.setScalar(lerp(R * lavadora.scale.x, R * 0.88, q));
      }
      if (p > 0.665) m.visible = false; // dentro do óleo viram fritas
      if (!fritadeira.visible && q > 0) m.visible = false;
    });

    /* 4. o cesto sobe com as fritas, que vão para a caixinha; a caixinha vem para o centro */
    const entraCaixa = sai(seg(p, 0.7, 0.78));
    const centraCaixa = suave(seg(p, 0.88, 0.97));
    caixinha.visible = entraCaixa > 0;
    caixinha.position.set(lerp(lerp(-3.4, -1.05, entraCaixa), 0, centraCaixa), PISO, lerp(0.35, 0.2, centraCaixa));
    caixinha.scale.setScalar(lerp(0.95, 1.65, centraCaixa));
    caixinha.rotation.y = -0.35 + Math.sin(t * 0.4) * 0.05 * centraCaixa;
    caixinha.updateMatrixWorld();
    poseSombra(sombraCaixinha, caixinha, 1.7, 0.6);
    const servem = seg(p, 0.79, 0.88);
    for (let i = 0; i < N_FRITA; i++) {
      const v = vagasFrita[i];
      const visivel = p > 0.665 && (fritadeira.visible || servem >= 1) && caixinha.visible !== false;
      if (!visivel) { tmpM.makeScale(0, 0, 0); fritas.setMatrixAt(i, tmpM); continue; }
      vA.set(v.cesto[0], v.cesto[1], v.cesto[2]).applyMatrix4(cesto.matrixWorld);
      const q = sai(seg(servem, (i / N_FRITA) * 0.45, (i / N_FRITA) * 0.45 + 0.4));
      vB.set(v.caixa[0], v.caixa[1], v.caixa[2]).applyMatrix4(caixinha.matrixWorld);
      tmpV.lerpVectors(vA, vB, q);
      tmpV.y += Math.sin(q * Math.PI) * 0.6;
      tmpE.set(lerp(Math.PI / 2, -Math.PI / 2 + 0.02 + v.caixa[3] * 0.3, q) + (q > 0 && q < 1 ? q * 4 : 0), v.cesto[3] + q * v.giro, lerp(0, v.caixa[4], q));
      tmpQ.setFromEuler(tmpE);
      tmpS.setScalar(lerp(0.88, caixinha.scale.x, q));
      tmpM.compose(tmpV, tmpQ, tmpS);
      fritas.setMatrixAt(i, tmpM);
    }
    fritas.instanceMatrix.needsUpdate = true;

    const chegam = sai(seg(p, 0.9, 0.98));
    enfeite.forEach((m, i) => {
      m.visible = chegam > 0;
      const r = i ? 0.26 : 0.31;
      m.scale.setScalar(r);
      m.position.set(lerp(i ? 3.2 : -3.2, i ? 1.15 : -1.15, chegam), PISO + r * 0.8, i ? 0.6 : 0.3);
      m.rotation.y = (1 - chegam) * (i ? -4 : 4) + i;
    });

    const fundoSai = sai(seg(p, 0.1, 0.24));
    fundo.forEach((m) => {
      m.visible = fundoSai < 1;
      m.scale.setScalar(m.userData.s * (1 - fundoSai) || 0.0001);
      m.rotation.y += 0.004 * m.userData.giro;
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

  if (!animado) { // menos movimento: uma imagem parada do pé de batata
    aplica(0, 0.6);
    renderer.render(cena, camera);
    window.addEventListener('resize', () => { ajusta(); aplica(0, 0.6); renderer.render(cena, camera); });
    return;
  }

  hero.classList.add('is-anim');
  ajusta();
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
