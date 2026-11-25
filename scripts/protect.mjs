// Monta a pasta _site com só o que vai para o ar e criptografa cada página HTML.
// Uso: SITE_USER=... SITE_PASSWORD=... node scripts/protect.mjs [pastaDeSaida]
//
// Cada .html vira uma "casca" que só mostra o conteúdo depois de decifrado no navegador
// (AES-256-GCM, chave derivada de usuário + senha com PBKDF2-SHA256). O hub (index.html da raiz)
// mostra o formulário de login; as LPs mandam quem não está logado para o hub.
// Imagens, CSS, JS e vídeos continuam públicos: só o HTML (textos e estrutura) é cifrado.

import { webcrypto as crypto } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const USER = process.env.SITE_USER;
const PASSWORD = process.env.SITE_PASSWORD;
if (!USER || !PASSWORD) {
  console.error('Faltam SITE_USER e/ou SITE_PASSWORD. Nada foi publicado.');
  process.exit(1);
}

const ROOT = process.cwd();
const OUT = path.resolve(process.argv[2] || '_site');
const SALT = 'netz-landingpages-v1';
const ITERATIONS = 600000;

// O que vai para o ar. Todo o resto (memoria/, .claude/, graphify-out/, PRODUCT.md...) fica de fora.
const include = ['index.html', 'hub.css', 'hub-img',
  ...fs.readdirSync(ROOT).filter((n) => n.startsWith('netz-') && fs.statSync(n).isDirectory())];
// Pastas publicadas abertas, sem login (páginas de campanha que vão para o público).
const PUBLICAS = ['netz-black-friday'];
const skip = (name) => name === '.impeccable' || name === '.DS_Store' || name === 'Thumbs.db' || name === 'desktop.ini';

fs.rmSync(OUT, { recursive: true, force: true });
for (const item of include) {
  if (!fs.existsSync(item)) continue;
  fs.cpSync(item, path.join(OUT, item), { recursive: true, filter: (src) => !skip(path.basename(src)) });
}

const enc = new TextEncoder();
const b64 = (buf) => Buffer.from(buf).toString('base64');
const baseKey = await crypto.subtle.importKey('raw', enc.encode(`${USER}\n${PASSWORD}`), 'PBKDF2', false, ['deriveKey']);
const key = await crypto.subtle.deriveKey(
  { name: 'PBKDF2', salt: enc.encode(SALT), iterations: ITERATIONS, hash: 'SHA-256' },
  baseKey, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);

const htmlFiles = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.html')) htmlFiles.push(p);
  }
})(OUT);
const publica = (file) => PUBLICAS.includes(path.relative(OUT, file).split(path.sep)[0]);
for (let i = htmlFiles.length - 1; i >= 0; i--) {
  if (publica(htmlFiles[i])) { console.log(`aberta (sem login): ${path.relative(OUT, htmlFiles[i])}`); htmlFiles.splice(i, 1); }
}

const shell = fs.readFileSync(path.join(ROOT, 'scripts', 'login-shell.html'), 'utf8');
for (const file of htmlFiles) {
  const rel = path.relative(OUT, file).split(path.sep).join('/');
  const depth = rel.split('/').length - 1;
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(fs.readFileSync(file, 'utf8')));
  const data = { v: 1, salt: SALT, it: ITERATIONS, iv: b64(iv), ct: b64(cipher), hub: depth === 0 ? '' : '../'.repeat(depth), isHub: rel === 'index.html' };
  const page = shell
    .replaceAll('="netz-laranja/', `="${data.hub}netz-laranja/`)
    .replace('/*__DATA__*/null', JSON.stringify(data));
  fs.writeFileSync(file, page);
  console.log(`protegido: ${rel}`);
}
console.log(`${htmlFiles.length} página(s) protegidas em ${OUT}`);
