/* Hero 3D da LP Café: o grão é moído, vira café na cafeteira e cai na xícara, guiado pela rolagem.
   Tudo é modelado em código (Three.js local, sem modelos baixados). Sem WebGL, fica a imagem estática do HTML;
   com "menos movimento" ligado, a cena aparece parada no grão e a página rola normalmente. */
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

  function texturaCanvas(w, h, desenha) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    desenha(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  /* Normais suaves também na costura da esfera e do torno (vértices duplicados na mesma posição). */
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

  const luzChave = new THREE.DirectionalLight(0xffe2b8, 2.6);
  luzChave.position.set(-3.5, 5, 4.5);
  const luzRecorte = new THREE.DirectionalLight(0xf0ac2f, 2.2);
  luzRecorte.position.set(4, 2.5, -3.5);
  const luzPreenche = new THREE.HemisphereLight(0xfff4e0, 0x1f2718, 0.55);
  cena.add(luzChave, luzRecorte, luzPreenche);

  /* ---------- materiais ---------- */
  const texMadeira = texturaCanvas(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#7a4a28'; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 46; i++) {
      const y0 = (i / 46) * h;
      ctx.strokeStyle = i % 3 ? 'rgba(60,32,16,.28)' : 'rgba(150,98,58,.25)';
      ctx.lineWidth = 1 + (i % 4);
      ctx.beginPath();
      for (let x = 0; x <= w; x += 8) ctx.lineTo(x, y0 + Math.sin(x * 0.03 + i) * 3 + Math.sin(x * 0.11 + i * 2) * 1.2);
      ctx.stroke();
    }
  });
  const texCrema = texturaCanvas(256, 256, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, '#5a2f14'); g.addColorStop(0.55, '#8a5528'); g.addColorStop(0.85, '#a9733d'); g.addColorStop(1, '#6a3a18');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 400; i++) {
      ctx.fillStyle = `rgba(${200 + (i % 40)},${150 + (i % 30)},${90 + (i % 20)},${0.05 + (i % 5) * 0.02})`;
      const a = i * 2.39996, r = Math.sqrt(i / 400) * w * 0.46;
      ctx.beginPath(); ctx.arc(w / 2 + Math.cos(a) * r, h / 2 + Math.sin(a) * r, 1 + (i % 3), 0, Math.PI * 2); ctx.fill();
    }
  });
  const texSombra = texturaCanvas(128, 128, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, 'rgba(0,0,0,.75)'); g.addColorStop(0.45, 'rgba(0,0,0,.35)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  });
  const texBrilho = texturaCanvas(128, 128, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, 'rgba(255,214,140,1)'); g.addColorStop(0.35, 'rgba(240,172,47,.55)'); g.addColorStop(1, 'rgba(240,172,47,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  });

  const M = {
    grao: new THREE.MeshPhysicalMaterial({ color: 0x5a331b, roughness: 0.4, clearcoat: 0.55, clearcoatRoughness: 0.35, vertexColors: true }),
    madeira: new THREE.MeshStandardMaterial({ map: texMadeira, roughness: 0.6 }),
    madeiraEscura: new THREE.MeshStandardMaterial({ color: 0x3e2414, roughness: 0.5 }),
    ferro: new THREE.MeshStandardMaterial({ color: 0x2e2c2a, metalness: 0.85, roughness: 0.35 }),
    latao: new THREE.MeshStandardMaterial({ color: 0xc2924a, metalness: 1, roughness: 0.28, side: THREE.DoubleSide }),
    aluminio: new THREE.MeshStandardMaterial({ color: 0xd9d7d0, metalness: 1, roughness: 0.24, flatShading: true, side: THREE.DoubleSide }),
    baquelite: new THREE.MeshStandardMaterial({ color: 0x151311, roughness: 0.42 }),
    porcelana: new THREE.MeshPhysicalMaterial({ color: 0xf7f3ea, roughness: 0.2, clearcoat: 0.8, clearcoatRoughness: 0.15, side: THREE.DoubleSide }),
    cafe: new THREE.MeshPhysicalMaterial({ map: texCrema, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.08 }),
    jato: new THREE.MeshPhysicalMaterial({ color: 0x3a1c0b, roughness: 0.15, clearcoat: 1, transparent: true, opacity: 0.95 }),
    po: new THREE.MeshStandardMaterial({ color: 0x4a2a16, roughness: 0.95 }),
    vidro: new THREE.MeshStandardMaterial({ color: 0x14110e, metalness: 0.3, roughness: 0.12 })
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

  /* ---------- grão de café ---------- */
  function geometriaGrao() {
    const g = new THREE.SphereGeometry(1, 80, 60);
    const pos = g.attributes.position, cores = [], v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      let X = v.x * 0.72, Y = v.y, Z = v.z * 0.62;
      if (Z > 0) Z *= 0.58; // lado chato do grão
      const centro = 0.09 * Math.sin(Y * 2.4); // o sulco faz um "S"
      const k = (X - centro) / 0.095;
      const sulco = Math.exp(-k * k) * Math.max(0, v.z) * (1 - Math.pow(Math.abs(v.y), 6));
      Z -= 0.3 * sulco;
      pos.setXYZ(i, X, Y, Z);
      const tom = (0.86 + 0.14 * Math.sin(v.x * 11.3 + v.y * 7.1) * Math.sin(v.z * 9.7 + v.y * 3.3)) * (1 - 0.6 * sulco);
      cores.push(tom, tom * 0.97, tom * 0.94);
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(cores, 3));
    return suavizaCostura(g);
  }
  const geoGrao = geometriaGrao();
  const grao = new THREE.Mesh(geoGrao, M.grao);
  cena.add(grao);
  const sombraGrao = sombra(2.2);

  // grãos menores ao fundo, só na abertura
  const fundo = [];
  [[-2.3, 1.2, -3, 0.32], [2.4, 1.5, -4, 0.28], [-1.6, -0.9, -2.5, 0.26], [2.1, -0.6, -2, 0.3], [-2.8, 0.1, -5, 0.24], [1.2, 2.0, -5.5, 0.22], [3.0, 0.4, -6, 0.26]]
    .forEach(([x, y, z, s], i) => {
      const m = new THREE.Mesh(geoGrao, M.grao);
      m.position.set(x, y, z); m.userData = { s, y, giro: 0.3 + i * 0.07 };
      m.rotation.set(i, i * 2, i * 0.5);
      cena.add(m); fundo.push(m);
    });

  /* ---------- moedor manual de madeira ---------- */
  const moedor = new THREE.Group();
  const caixa = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.2, 1.5), M.madeira);
  caixa.position.y = 0.72;
  const base = new THREE.Mesh(new THREE.BoxGeometry(1.66, 0.12, 1.66), M.madeiraEscura);
  base.position.y = 0.06;
  const tampo = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 1.6), M.madeiraEscura);
  tampo.position.y = 1.36;
  const gaveta = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.34, 0.05), M.madeiraEscura);
  gaveta.position.set(0, 0.46, 0.77);
  const puxador = new THREE.Mesh(new THREE.SphereGeometry(0.07, 20, 14), M.latao);
  puxador.position.set(0, 0.46, 0.83);
  const funil = new THREE.Mesh(new THREE.LatheGeometry(
    [[0.12, 0], [0.18, 0.03], [0.42, 0.2], [0.56, 0.4], [0.6, 0.46], [0.58, 0.47]].map(([x, y]) => new THREE.Vector2(x, y)), 56), M.latao);
  funil.position.y = 1.4;
  const eixo = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.6, 16), M.ferro);
  eixo.position.y = 1.7;
  const manivela = new THREE.Group();
  manivela.position.y = 1.98;
  const porca = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.07, 6), M.ferro);
  const braco = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.05, 0.1), M.ferro);
  braco.position.x = 0.42;
  const pegador = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.065, 0.34, 20), M.madeiraEscura);
  pegador.position.set(0.82, 0.2, 0);
  const pontaPegador = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 12), M.madeiraEscura);
  pontaPegador.position.set(0.82, 0.38, 0);
  manivela.add(porca, braco, pegador, pontaPegador);
  const bico = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.06, 0.26, 24, 1, true), M.latao);
  bico.position.y = -0.12; // saída do pó, por baixo
  moedor.add(caixa, base, tampo, gaveta, puxador, funil, eixo, manivela, bico);
  cena.add(moedor);
  const sombraMoedor = sombra(2.6);

  /* ---------- cafeteira italiana (oito faces) ---------- */
  const moka = new THREE.Group();
  const torno8 = (perfil) => new THREE.LatheGeometry(perfil.map(([x, y]) => new THREE.Vector2(x, y)), 8, Math.PI / 8);
  const corpoMoka = new THREE.Mesh(torno8([[0, 0], [0.5, 0], [0.57, 0.03], [0.61, 0.09], [0.58, 0.4], [0.56, 0.7], [0.49, 0.78],
    [0.46, 0.84], [0.46, 0.88], [0.52, 0.92], [0.57, 0.99], [0.62, 1.3], [0.66, 1.6], [0.66, 1.66]]), M.aluminio);
  // tampa com dobradiça do lado da alça: abre para receber o pó
  const tampa = new THREE.Group();
  tampa.position.set(0.62, 1.66, 0);
  const cascoTampa = new THREE.Mesh(torno8([[0.67, 0], [0.6, 0.04], [0.46, 0.11], [0.24, 0.17], [0, 0.19]]), M.aluminio);
  cascoTampa.position.x = -0.62;
  tampa.add(cascoTampa);
  // por dentro: o filtro e o montinho de pó que vai crescendo
  const filtro = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.58, 0.03, 8, 1, false, Math.PI / 8), M.ferro);
  filtro.position.y = 1.5;
  const monte = new THREE.Mesh(new THREE.SphereGeometry(0.5, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2), M.po);
  monte.position.y = 1.51;
  const curvaAlca = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.58, 1.58, 0), new THREE.Vector3(0.96, 1.56, 0), new THREE.Vector3(1.1, 1.32, 0),
    new THREE.Vector3(1.0, 1.02, 0), new THREE.Vector3(0.6, 1.0, 0)]);
  const alca = new THREE.Mesh(new THREE.TubeGeometry(curvaAlca, 40, 0.075, 14, false), M.baquelite);
  const botaoTampa = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 0.13, 16), M.baquelite);
  botaoTampa.position.set(-0.62, 0.24, 0);
  tampa.add(botaoTampa);
  const bicoMoka = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.36, 4), new THREE.MeshStandardMaterial({ color: 0xd9d7d0, metalness: 1, roughness: 0.24 }));
  bicoMoka.rotation.z = Math.PI / 2;
  bicoMoka.scale.set(1, 1, 0.55);
  bicoMoka.position.set(-0.74, 1.6, 0);
  const valvula = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.08, 12), M.latao);
  valvula.rotation.x = Math.PI / 2;
  valvula.position.set(0.18, 0.42, 0.56);
  moka.add(corpoMoka, tampa, filtro, monte, alca, bicoMoka, valvula);
  const pontaBico = new THREE.Vector3(-0.92, 1.6, 0); // de onde sai o café
  cena.add(moka);
  const sombraMoka = sombra(2.2);

  // fogão por indução: onde a energia aparece
  const fogao = new THREE.Group();
  const placa = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.08, 48), M.vidro);
  placa.position.y = -0.04;
  const anel = new THREE.Mesh(new THREE.TorusGeometry(0.66, 0.03, 12, 64),
    new THREE.MeshBasicMaterial({ color: 0xf6bc4e, transparent: true, opacity: 0 }));
  anel.rotation.x = -Math.PI / 2;
  anel.position.y = 0.005;
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6),
    new THREE.MeshBasicMaterial({ map: texBrilho, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  halo.rotation.x = -Math.PI / 2;
  halo.position.y = 0.01;
  const luzFogo = new THREE.PointLight(0xf0ac2f, 0, 4, 1.6);
  luzFogo.position.y = 0.3;
  fogao.add(placa, anel, halo, luzFogo);
  cena.add(fogao);

  /* ---------- xícara com pires ---------- */
  const xicara = new THREE.Group();
  const perfilXicara = [[0, 0], [0.36, 0], [0.4, 0.02], [0.42, 0.06], [0.5, 0.3], [0.6, 0.62], [0.62, 0.66],
    [0.6, 0.67], [0.58, 0.65], [0.56, 0.6], [0.47, 0.3], [0.4, 0.13], [0, 0.11]];
  const corpoXicara = new THREE.Mesh(suavizaCostura(new THREE.LatheGeometry(perfilXicara.map(([x, y]) => new THREE.Vector2(x, y)), 72)), M.porcelana);
  const asa = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.045, 16, 48, Math.PI * 1.45), M.porcelana);
  asa.rotation.z = -Math.PI * 0.725;
  asa.position.set(0.66, 0.36, 0);
  const pires = new THREE.Mesh(suavizaCostura(new THREE.LatheGeometry(
    [[0, 0], [0.7, 0], [0.86, 0.04], [0.98, 0.1], [1.0, 0.12], [0.97, 0.13], [0.84, 0.08], [0.45, 0.05], [0, 0.05]]
      .map(([x, y]) => new THREE.Vector2(x, y)), 72)), M.porcelana);
  pires.position.y = -0.05;
  const liquido = new THREE.Mesh(new THREE.CircleGeometry(1, 56), M.cafe);
  liquido.rotation.x = -Math.PI / 2;
  xicara.add(corpoXicara, asa, pires, liquido);
  cena.add(xicara);
  const sombraXicara = sombra(2.6);
  const raioInterno = (y) => { // raio interno da xícara na altura y
    const p = [[0.13, 0.4], [0.3, 0.47], [0.6, 0.56], [0.65, 0.58]];
    for (let i = 1; i < p.length; i++) if (y <= p[i][0]) return lerp(p[i - 1][1], p[i][1], (y - p[i - 1][0]) / (p[i][0] - p[i - 1][0]));
    return 0.58;
  };

  /* ---------- jato de café ---------- */
  const jato = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 1, 14, 1, true), M.jato);
  cena.add(jato);

  /* ---------- pó de café caindo (posições calculadas pelo progresso, sem física) ---------- */
  const N_PO = 520;
  const po = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.022, 0), M.po, N_PO);
  const sementes = Array.from({ length: N_PO }, (_, i) => ({
    atraso: (i * 0.618034) % 1, ang: i * 2.39996, raio: Math.sqrt(((i * 0.7548) % 1)) * 0.11, giro: i * 1.7, esc: 0.6 + ((i * 0.381966) % 1) * 0.9
  }));
  cena.add(po);
  const tmpM = new THREE.Matrix4(), tmpQ = new THREE.Quaternion(), tmpE = new THREE.Euler(), tmpV = new THREE.Vector3(), tmpS = new THREE.Vector3();

  /* ---------- vapor ---------- */
  function criaVapor(n, largura) {
    const g = new THREE.BufferGeometry();
    const p = new Float32Array(n * 3), fase = new Float32Array(n), lado = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      p[i * 3] = (((i * 0.618) % 1) - 0.5) * largura; p[i * 3 + 2] = (((i * 0.382) % 1) - 0.5) * largura * 0.6;
      fase[i] = (i * 0.7548) % 1; lado[i] = ((i * 0.5698) % 1) - 0.5;
    }
    g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    g.setAttribute('aFase', new THREE.BufferAttribute(fase, 1));
    g.setAttribute('aLado', new THREE.BufferAttribute(lado, 1));
    const mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false,
      uniforms: { uTempo: { value: 0 }, uForca: { value: 0 }, uEscala: { value: 400 } },
      vertexShader: `
        attribute float aFase; attribute float aLado;
        uniform float uTempo; uniform float uEscala;
        varying float vVida;
        void main() {
          float vida = fract(uTempo * 0.2 + aFase);
          vVida = vida;
          vec3 p = position;
          p.y += vida * 1.5;
          p.x += sin(vida * 5.0 + aFase * 12.0) * 0.14 * vida + aLado * vida * 0.3;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = uEscala * (0.14 + vida * 0.36) / -mv.z;
        }`,
      fragmentShader: `
        uniform float uForca; varying float vVida;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          float a = smoothstep(0.5, 0.0, d) * sin(vVida * 3.14159) * 0.13 * uForca;
          gl_FragColor = vec4(1.0, 0.97, 0.92, a);
        }`
    });
    const pts = new THREE.Points(g, mat);
    pts.frustumCulled = false;
    cena.add(pts);
    return pts;
  }
  const vaporMoka = criaVapor(40, 0.3);
  const vaporXicara = criaVapor(46, 0.6);

  /* ---------- quadro a quadro ---------- */
  function poseSombra(s, obj, larg, forca) {
    s.position.set(obj.position.x, PISO + 0.003, obj.position.z);
    const alt = Math.max(0, obj.position.y - PISO);
    s.material.opacity = forca * clamp01(1 - alt / 2.6) * (obj.visible ? 1 : 0);
    const k = larg * obj.scale.x * (1 + alt * 0.2);
    s.scale.set(k, k * 0.62, 1);
  }

  function aplica(p, t) {
    /* 1. grão em destaque → cai no funil do moedor */
    const desce = suave(seg(p, 0.16, 0.28));
    const some = seg(p, 0.27, 0.31);
    const funilTopo = PISO + 1.88;
    grao.visible = some < 1;
    grao.scale.setScalar(lerp(1, 0.24, sai(seg(p, 0.16, 0.24))) * (1 - some));
    grao.position.set(0, lerp(0.15, funilTopo + 0.15, desce) - some * 0.35, lerp(0, 0.1, desce));
    grao.rotation.set(-0.2 + Math.sin(t * 0.5) * 0.08, -0.3 + Math.sin(t * 0.45) * 0.45 + desce * 4, 0.3 + desce * 1.2);
    const baseGrao = grao.position.clone(); baseGrao.y -= grao.scale.y;
    sombraGrao.position.set(baseGrao.x, PISO + 0.003, 0);
    sombraGrao.material.opacity = 0.5 * (1 - desce) * (grao.visible ? 1 : 0);
    sombraGrao.scale.set(2.0, 1.1, 1);

    const fundoSai = sai(seg(p, 0.1, 0.24));
    fundo.forEach((m) => {
      m.visible = fundoSai < 1;
      m.scale.setScalar(m.userData.s * (1 - fundoSai));
      m.rotation.y += 0.004 * m.userData.giro;
      m.position.y = m.userData.y + Math.sin(t * 0.6 + m.userData.giro * 10) * 0.08 + fundoSai * 1.5;
    });

    /* 2. moedor entra e a manivela gira. Depois ele sobe menor, de lado, e inclina em direção à cafeteira */
    const entraMoedor = sai(seg(p, 0.14, 0.27));
    const sobeMoedor = suave(seg(p, 0.44, 0.53));
    const saiMoedor = suave(seg(p, 0.6, 0.68));
    moedor.visible = entraMoedor > 0 && saiMoedor < 1;
    const moendo = seg(p, 0.3, 0.46);
    moedor.position.set(lerp(0, -0.62, sobeMoedor) - saiMoedor * 2.4,
      lerp(-5.5, PISO, entraMoedor) + sobeMoedor * (0.62 - PISO) + saiMoedor * 2.2,
      Math.sin(moendo * 60) * 0.008 * (moendo > 0 && moendo < 1 ? 1 : 0));
    moedor.scale.setScalar(lerp(1, 0.5, sobeMoedor));
    moedor.rotation.set(0, lerp(-0.6, -0.35, entraMoedor) + sobeMoedor * 0.25, -0.32 * sobeMoedor * (1 - saiMoedor));
    manivela.rotation.y = moendo * Math.PI * 2 * 4 + seg(p, 0.5, 0.6) * Math.PI * 3;
    poseSombra(sombraMoedor, moedor, 2.6, 0.55);

    /* 3. cafeteira entra deslizando pela direita já no fogão, abre a tampa, recebe o pó,
          fecha, vai para o centro, esquenta (energia) e despeja na xícara */
    const entraMoka = suave(seg(p, 0.44, 0.53));
    const abreTampa = suave(seg(p, 0.48, 0.52)) * (1 - suave(seg(p, 0.6, 0.64)));
    const centraMoka = suave(seg(p, 0.61, 0.68));
    const ergueMoka = suave(seg(p, 0.7, 0.79));
    const saiMoka = suave(seg(p, 0.87, 0.94));
    const xBase = lerp(lerp(3.6, 0.3, entraMoka), 0.05, centraMoka);
    moka.visible = entraMoka > 0 && saiMoka < 1;
    moka.position.set(lerp(xBase, 0.8, ergueMoka) + saiMoka * 3, PISO + ergueMoka * 1.45 + saiMoka * 2.5, 0);
    moka.rotation.set(0, lerp(-0.9, -0.12, entraMoka), ergueMoka * 0.98);
    moka.scale.setScalar(0.92);
    tampa.rotation.z = -1.75 * abreTampa;
    poseSombra(sombraMoka, moka, 2.0, 0.6);

    fogao.visible = entraMoka > 0 && ergueMoka < 1;
    const fogaoSai = seg(p, 0.7, 0.77);
    fogao.position.set(xBase, PISO - fogaoSai * 4, 0);
    fogao.scale.setScalar(0.92);
    const calor = seg(p, 0.62, 0.69) * (1 - fogaoSai);
    const pulso = 0.85 + Math.sin(t * 3) * 0.15;
    anel.material.opacity = calor * pulso;
    halo.material.opacity = calor * 0.9 * pulso;
    luzFogo.intensity = calor * 7 * pulso;

    vaporMoka.position.set(moka.position.x, moka.position.y + 1.8 * 0.92, 0.02);
    vaporMoka.material.uniforms.uForca.value = seg(p, 0.65, 0.7) * (1 - seg(p, 0.7, 0.74));

    /* pó: sai do bico do moedor em arco e cai dentro da cafeteira aberta */
    const queda = seg(p, 0.5, 0.6);
    monte.visible = queda > 0;
    monte.scale.set(1, lerp(0.04, 0.32, queda), 1);
    moedor.updateMatrixWorld();
    const origem = new THREE.Vector3(0, -0.24, 0).applyMatrix4(moedor.matrixWorld);
    const destino = new THREE.Vector3(moka.position.x - 0.05, moka.position.y + 1.52 * 0.92, 0);
    for (let i = 0; i < N_PO; i++) {
      const s = sementes[i];
      const q = queda * 1.7 - s.atraso * 0.7;
      if (q <= 0 || q >= 1 || !moka.visible || !moedor.visible) {
        tmpM.makeScale(0, 0, 0);
      } else {
        const espalha = s.raio * (0.35 + q * 1.1);
        tmpV.set(lerp(origem.x, destino.x, Math.sqrt(q)) + Math.cos(s.ang) * espalha,
          lerp(origem.y, destino.y, q * q),
          lerp(origem.z, destino.z, q) + Math.sin(s.ang) * espalha * 0.6);
        tmpE.set(s.giro + q * 6, s.giro, q * 4);
        tmpQ.setFromEuler(tmpE);
        tmpS.setScalar(s.esc);
        tmpM.compose(tmpV, tmpQ, tmpS);
      }
      po.setMatrixAt(i, tmpM);
    }
    po.instanceMatrix.needsUpdate = true;

    /* 4. xícara entra, enche, vai para o centro e solta vapor */
    const entraXicara = sai(seg(p, 0.7, 0.79));
    const centraXicara = suave(seg(p, 0.87, 0.97));
    xicara.visible = entraXicara > 0;
    xicara.position.set(lerp(-1.05, 0, centraXicara), lerp(-5.5, PISO, entraXicara), lerp(0, 0.2, centraXicara));
    xicara.scale.setScalar(lerp(1, 1.45, centraXicara));
    xicara.rotation.y = -0.5 + centraXicara * 0.35 + Math.sin(t * 0.4) * 0.04 * centraXicara;
    poseSombra(sombraXicara, xicara, 2.4, 0.6);

    const enche = suave(seg(p, 0.79, 0.89));
    const nivel = lerp(0.12, 0.57, enche);
    liquido.visible = enche > 0.01;
    liquido.position.y = nivel;
    liquido.scale.setScalar(raioInterno(nivel) - 0.005);

    const derrama = seg(p, 0.78, 0.8) * (1 - seg(p, 0.87, 0.89));
    jato.visible = derrama > 0 && moka.visible && xicara.visible;
    if (jato.visible) {
      moka.updateMatrixWorld();
      const a = pontaBico.clone().applyMatrix4(moka.matrixWorld);
      const b = new THREE.Vector3(xicara.position.x, xicara.position.y + nivel * xicara.scale.y, xicara.position.z);
      const fim = a.clone().lerp(b, derrama);
      const dir = fim.clone().sub(a);
      const comp = Math.max(0.001, dir.length());
      jato.position.copy(a).addScaledVector(dir, 0.5);
      jato.scale.set(1, comp, 1);
      jato.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    }

    vaporXicara.position.set(xicara.position.x, xicara.position.y + 0.66 * xicara.scale.y, xicara.position.z);
    vaporXicara.scale.setScalar(xicara.scale.x);
    vaporXicara.material.uniforms.uForca.value = seg(p, 0.88, 0.96);
    vaporMoka.material.uniforms.uTempo.value = t;
    vaporXicara.material.uniforms.uTempo.value = t;
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
    const escala = renderer.getDrawingBufferSize(new THREE.Vector2()).y / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
    vaporMoka.material.uniforms.uEscala.value = escala;
    vaporXicara.material.uniforms.uEscala.value = escala;
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

  if (!animado) { // menos movimento: uma imagem parada do grão
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
