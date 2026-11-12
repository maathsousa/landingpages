/* Galho de laranjeira 3D procedural (Three.js), feito só em código: nenhuma foto ou modelo externo.
   Referências visuais: laranja com cabinho verde e folhas lanceoladas brilhantes; flor de laranjeira
   com 5 pétalas brancas grossas, estames amarelos e botões fechados.
   Ocupa a área do desenho do "Como funciona" (viewBox 400x440). O main.js informa o estado do ciclo
   (cor e escala do fruto, visibilidade do fruto e da flor) por window.netzFruta3d; sem WebGL, o SVG continua. */
import * as THREE from './vendor/three.module.min.js';

const canvas = document.querySelector('[data-fruta3d]');
const palco = canvas && canvas.closest('.fruta-palco');
const semMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (canvas && palco) iniciar();

function iniciar() {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  } catch (e) { return; } /* sem WebGL: fica o desenho em SVG */

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const cena = new THREE.Scene();
  /* 1 unidade = 128 px do viewBox; o centro do fruto fica em (200, 290) */
  const camera = new THREE.OrthographicCamera(-200 / 128, 200 / 128, 290 / 128, -150 / 128, 0.1, 10);
  camera.position.set(0, 0, 4);

  cena.add(new THREE.HemisphereLight(0xfff1dc, 0x35247c, 1.1));
  const sol = new THREE.DirectionalLight(0xfff0d6, 2.4);
  sol.position.set(-2.2, 2.6, 3);
  cena.add(sol);
  const contorno = new THREE.DirectionalLight(0xd8d0f7, 0.9);
  contorno.position.set(2.5, -1, -2);
  cena.add(contorno);

  /* ---------- utilitários ---------- */
  let semente = 7;
  const rnd = () => { semente = (semente * 16807) % 2147483647; return (semente - 1) / 2147483646; };

  /* Lâmina (folha ou pétala): comprida, pontuda, dobrada na nervura e curvada no comprimento.
     Fica deitada ao longo de +X. As cores por vértice desenham a nervura central. */
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

  function tubo(pontos, raio, mat) {
    const curva = new THREE.CatmullRomCurve3(pontos.map((p) => new THREE.Vector3(...p)));
    return new THREE.Mesh(new THREE.TubeGeometry(curva, 32, raio, 10, false), mat);
  }

  /* ---------- fruto ---------- */
  function relevoCasca() {
    const c = document.createElement('canvas');
    c.width = 1024; c.height = 512;
    const g = c.getContext('2d');
    g.fillStyle = 'rgb(150,150,150)';
    g.fillRect(0, 0, c.width, c.height);
    for (let i = 0; i < 14000; i++) {
      const x = rnd() * c.width, y = rnd() * c.height, r = 1.2 + rnd() * 2.6;
      const grad = g.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, 'rgba(60,60,60,0.9)');
      grad.addColorStop(1, 'rgba(150,150,150,0)');
      g.fillStyle = grad;
      g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = THREE.RepeatWrapping;
    t.anisotropy = 4;
    return t;
  }

  const casca = new THREE.MeshPhysicalMaterial({
    color: 0xf28c1e, roughness: 0.52, clearcoat: 0.25, clearcoatRoughness: 0.45,
    sheen: 0.3, sheenColor: new THREE.Color(0xffd3a0), bumpMap: relevoCasca(), bumpScale: 1.0
  });
  const fruto = new THREE.Group();
  const corpo = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 64), casca);
  corpo.scale.set(1, 0.95, 1);
  fruto.add(corpo);
  const calice = new THREE.Mesh(
    new THREE.CircleGeometry(0.13, 5),
    new THREE.MeshStandardMaterial({ color: 0x5c7f2c, roughness: 0.85, side: THREE.DoubleSide })
  );
  calice.rotation.x = -Math.PI / 2;
  calice.position.y = 0.952;
  fruto.add(calice);
  const pivo = new THREE.Group();
  pivo.add(fruto);
  cena.add(pivo);

  /* ---------- ramo: cabinho verde e folhas (fixos; o fruto pende dele) ---------- */
  const ramo = new THREE.Group();
  cena.add(ramo);
  const verdeCabo = new THREE.MeshStandardMaterial({ color: 0x5f8f2c, roughness: 0.6 });
  /* sobe do topo do fruto (0, 0.95) e se curva para a direita, como na referência */
  ramo.add(tubo([[0, 0.94, 0], [0.01, 1.14, 0.02], [0.08, 1.32, 0.04], [0.24, 1.46, 0.02], [0.46, 1.56, -0.04], [0.66, 1.66, -0.08]], 0.024, verdeCabo));

  const folhaMat = new THREE.MeshPhysicalMaterial({
    vertexColors: true, emissive: 0x0d1f08, roughness: 0.38, clearcoat: 0.55, clearcoatRoughness: 0.3, side: THREE.DoubleSide
  });
  const juncao = new THREE.Vector3(0.14, 1.4, 0.03);
  /* três folhas abrindo para a esquerda e para cima, como na foto do fruto */
  [
    { L: 1.0, W: 0.21, ang: 168, roll: 0.45, curva: 0.10 },
    { L: 0.82, W: 0.18, ang: 150, roll: -0.35, curva: 0.08 },
    { L: 0.70, W: 0.16, ang: 196, roll: 0.25, curva: 0.14 }
  ].forEach((f) => {
    const g = new THREE.Group();
    g.position.copy(juncao);
    g.rotation.set(f.roll, 0, (f.ang * Math.PI) / 180);
    const peciolo = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.016, 0.1, 8), verdeCabo);
    peciolo.rotation.z = -Math.PI / 2;
    peciolo.position.x = 0.05;
    g.add(peciolo);
    const folha = new THREE.Mesh(lamina({ L: f.L, W: f.W, dobra: 0.32, curva: f.curva, base: 0x357a26, nervura: 0xa8cc72 }), folhaMat);
    folha.position.x = 0.09;
    g.add(folha);
    ramo.add(g);
  });

  /* ---------- florada: flor aberta + botões (some quando o fruto aparece) ---------- */
  const florada = new THREE.Group();
  cena.add(florada);
  const petalaMat = new THREE.MeshPhysicalMaterial({
    vertexColors: true, roughness: 0.4, sheen: 0.6, sheenColor: new THREE.Color(0xffffff),
    emissive: 0x6f6c66, side: THREE.DoubleSide, transparent: true   /* branco cerado, sem ficar cinza na sombra */
  });
  const amarelo = new THREE.MeshStandardMaterial({ color: 0xf2b21e, roughness: 0.5, transparent: true });
  const filete = new THREE.MeshStandardMaterial({ color: 0xf7f2dc, roughness: 0.6, transparent: true });
  const pistiloMat = new THREE.MeshStandardMaterial({ color: 0xc9d65a, roughness: 0.5, transparent: true });
  const materiaisFlor = [petalaMat, amarelo, filete, pistiloMat];

  const flor = new THREE.Group();
  flor.position.set(0, 0.86, 0.04);           /* presa na ponta do cabinho, onde o fruto nasce depois */
  flor.rotation.x = 0.38;                       /* olhando para a frente e um pouco para baixo */
  for (let k = 0; k < 5; k++) {
    const p = new THREE.Mesh(lamina({ L: 0.56, W: 0.21, dobra: 0.45, curva: -0.36, base: 0xfffef9, nervura: 0xf1f3e2, ponta: 0.55 }), petalaMat);
    p.rotation.z = (k * 2 * Math.PI) / 5 + 0.3;
    p.position.z = 0.02;
    flor.add(p);
  }
  for (let k = 0; k < 16; k++) {                /* estames com anteras amarelas */
    const a = (k / 16) * Math.PI * 2 + rnd() * 0.3, r = 0.04 + rnd() * 0.03, h = 0.2 + rnd() * 0.06;
    const fio = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.008, h, 6), filete);
    fio.position.set(Math.cos(a) * r, Math.sin(a) * r, h / 2);
    fio.rotation.x = Math.PI / 2;
    flor.add(fio);
    const antera = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), amarelo);
    antera.scale.set(1, 1.5, 1);
    antera.position.set(Math.cos(a) * (r + 0.07), Math.sin(a) * (r + 0.07), h);  /* abertos para fora, como na foto */
    flor.add(antera);
  }
  const pistilo = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.024, 0.22, 10), pistiloMat);
  pistilo.rotation.x = Math.PI / 2;
  pistilo.position.z = 0.11;
  flor.add(pistilo);
  const estigma = new THREE.Mesh(new THREE.SphereGeometry(0.036, 12, 10), pistiloMat);
  estigma.position.z = 0.23;
  flor.add(estigma);
  florada.add(flor);


  /* ---------- o visitante gira o galho arrastando (mouse ou dedo) ---------- */
  const mundo = new THREE.Group();
  cena.add(mundo);
  mundo.add(pivo, ramo, florada);
  let giro = 0, vel = 0, arrastando = false, xAnt = 0;
  canvas.addEventListener('pointerdown', (e) => {
    arrastando = true; xAnt = e.clientX; vel = 0;
    canvas.setPointerCapture(e.pointerId);
    canvas.classList.add('is-arrastando');
    pedirQuadro();
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!arrastando) return;
    vel = (e.clientX - xAnt) * 0.012;
    xAnt = e.clientX;
    giro += vel;
    pedirQuadro();
  });
  const soltar = () => {
    if (!arrastando) return;
    arrastando = false;
    canvas.classList.remove('is-arrastando');
    if (semMovimento) vel = 0;            /* sem inércia para quem pediu menos movimento */
    pedirQuadro();
  };
  canvas.addEventListener('pointerup', soltar);
  canvas.addEventListener('pointercancel', soltar);

  /* ---------- estado vindo do main.js (padrão: laranja madura, sem flor) ---------- */
  let visivel = false, pedido = false, ultimo = 0;
  const estado = { c: '#F28C1E', s: 1, o: 1, f: 0 };
  function aplicar(e) {
    if (!e) return;
    if (e.c) casca.color.setStyle(e.c);
    ['s', 'o', 'f'].forEach((k) => { if (typeof e[k] === 'number') estado[k] = e[k]; });
    pivo.scale.setScalar(Math.max(estado.s, 0.001));
    pivo.position.y = 1 - estado.s;            /* cresce a partir do topo: continua preso ao cabinho */
    pivo.visible = estado.o > 0.01;
    florada.visible = estado.f > 0.01;
    florada.scale.setScalar(0.8 + estado.f * 0.2);
    materiaisFlor.forEach((m) => { m.opacity = estado.f; });
    pedirQuadro();
  }
  window.netzFruta3d = aplicar;
  aplicar(window.__fruta3d);

  function ajustar() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    pedirQuadro();
  }

  function pedirQuadro() { if (!pedido) { pedido = true; requestAnimationFrame(quadro); } }
  function quadro(t) {
    pedido = false;
    const dt = ultimo ? Math.min(0.05, (t - ultimo) / 1000) : 0;
    ultimo = t;
    if (!semMovimento) {
      fruto.rotation.y += dt * 0.35;             /* o fruto gira devagar */
      ramo.rotation.z = Math.sin(t / 1700) * 0.012; /* as folhas balançam de leve */
      flor.rotation.z = Math.sin(t / 2100) * 0.05;
    }
    if (!arrastando && vel) {                /* inércia ao soltar */
      giro += vel; vel *= 0.92;
      if (Math.abs(vel) < 0.0005) vel = 0;
    }
    mundo.rotation.y = giro;
    renderer.render(cena, camera);
    if ((visivel && !semMovimento) || arrastando || vel) pedirQuadro();
    else ultimo = 0;
  }

  new IntersectionObserver((ents) => {
    visivel = ents[0].isIntersecting;
    if (visivel) pedirQuadro();
  }, { rootMargin: '100px' }).observe(palco);
  new ResizeObserver(ajustar).observe(canvas);

  ajustar();
  palco.classList.add('tem-3d');
}
