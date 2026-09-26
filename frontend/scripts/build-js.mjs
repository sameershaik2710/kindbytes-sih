// Copies vendor libraries into static/vendor and minifies the app scripts into static/js.
import { copyFileSync, mkdirSync } from 'node:fs';
import { transformSync } from 'esbuild';
import { readFileSync, writeFileSync } from 'node:fs';

mkdirSync('static/vendor', { recursive: true });
mkdirSync('static/js', { recursive: true });
const vendor = {
  'node_modules/three/build/three.min.js': 'static/vendor/three.min.js',
  'node_modules/qrcodejs2/qrcode.min.js': 'static/vendor/qrcode.min.js',
  'node_modules/alpinejs/dist/cdn.min.js': 'static/vendor/alpine.min.js'
};
for (const [src, dst] of Object.entries(vendor)) copyFileSync(src, dst);
for (const f of ['app.js', 'auth.js']) {
  const code = readFileSync(`frontend/src/js/${f}`, 'utf8');
  writeFileSync(`static/js/${f}`, transformSync(code, { minify: true, target: 'es2020' }).code);
}
console.log('js built');
