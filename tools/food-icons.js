/* Generates the custom cartoon food-icon set (img/food/*.svg) + a preview page.
   Usage: node tools/food-icons.js
   Sara's own vector art — free to bundle, no licensing concerns. */
"use strict";
const fs = require("fs");
const path = require("path");

const OUT = path.join(__dirname, "..", "img", "food");
const O = "#2b2730"; // cartoon outline

function svg(inner, vb) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb || "0 0 100 100"}">` +
    `<g stroke="${O}" stroke-width="7" stroke-linejoin="round" stroke-linecap="round" fill="none">${inner}</g></svg>`;
}

const FILE = "0 0 100 100";
const icons = [];

function icon(emoji, name, body) {
  icons.push({ emoji, name, body });
}

/* ---------- sushi bar ---------- */
icon("🍣", "Sushi roll", `
  <rect x="24" y="14" width="52" height="72" rx="9" fill="#fdf4e8"/>
  <rect x="18" y="18" width="64" height="26" rx="9" fill="#ff9b63"/>
  <rect x="16" y="44" width="14" height="42" rx="3" fill="#1c4a2e"/>
  <rect x="42" y="20" width="16" height="8" rx="3" fill="#f2b8a0"/>
  <rect x="64" y="24" width="14" height="10" rx="3" fill="#f2b8a0"/>
  <rect x="24" y="84" width="52" height="3" fill="#dfd3c0"/>`);
icon("🍙", "Onigiri", `
  <path d="M50 18 L28 78 L72 78 Z" fill="#f9f3e6"/>
  <rect x="20" y="60" width="60" height="24" rx="6" fill="#1c4a2e"/>
  <ellipse cx="50" cy="48" rx="10" ry="7" fill="#ffd9b0" stroke="none"/>`);
icon("🍱", "Bento box", `
  <rect x="15" y="26" width="70" height="58" rx="8" fill="#e63946"/>
  <rect x="15" y="12" width="70" height="16" rx="8" fill="#a82633"/>
  <rect x="46" y="22" width="26" height="12" fill="#e63946"/>
  <circle cx="32" cy="40" r="11" fill="#fdf3e0"/>
  <circle cx="60" cy="44" r="10" fill="#ff9b63"/>
  <rect x="18" y="58" width="64" height="4" fill="#a82633"/>`);
icon("🍤", "Fried shrimp", `
  <path d="M62 66 C64 40 58 30 48 18 S40 30 34 46 L30 60" fill="#efac2f"/>
  <path d="M55 58 C52 40 44 34 38 26 S36 40 34 52" fill="#f8c84f"/>
  <path d="M30 60 L26 74 M30 60 L34 74 M30 60 L38 72" fill="#efac2f"/>
  <rect x="40" y="12" width="14" height="6" rx="3" fill="#fff2dd" stroke="#efac2f"/>`);
icon("🥟", "Gyoza", `
  <path d="M15 55 L85 55 M85 55 C78 70 64 82 50 84 C34 76 22 66 15 55 Z" fill="#e9a83b"/>
  <path d="M22 62 C30 54 42 48 50 46 M42 48 C46 44 50 42 52 41" fill="#c97f1e"/>
  <rect x="20" y="52" width="60" height="4" rx="2" fill="#c97f1e"/>
  <rect x="70" y="52" width="12" height="4" rx="2" fill="#c97f1e"/>`);
icon("🍥", "Narutomaki", `
  <circle cx="50" cy="50" r="38" fill="#ffb6d1"/>
  <path d="M30 26 C38 34 48 30 56 40 C62 54 58 66 54 74 L40 82 M36 78 C32 66 26 50 22 40 L28 34"
        fill="none" stroke-width="7" stroke="#ffffff"/>
  <circle cx="50" cy="50" r="6" fill="#ffb6d1" stroke="none"/>`);
icon("🍘", "Rice cracker", `
  <circle cx="50" cy="50" r="38" fill="#ecc27a"/>
  <path d="M24 50 L76 50 M50 24 L50 76" fill="none" stroke="#c8973f" stroke-width="5"/>
  <path d="M36 36 L64 36 M36 64 L64 64" fill="none" stroke="#c8973f" stroke-width="5"/>
  <circle cx="20" cy="50" r="3" fill="#c8973f" stroke="none"/>
  <circle cx="80" cy="50" r="3" fill="#c8973f" stroke="none"/>`);
icon("🍚", "Rice bowl", `
  <path d="M18 78 C34 40 50 32 66 40 L82 78 Z" fill="#6a2334"/>
  <path d="M14 80 C34 56 50 48 66 56 L86 80 Z" fill="#fdf7ea"/>
  <ellipse cx="50" cy="40" rx="26" ry="16" fill="#fdf7ea"/>
  <path d="M30 46 C38 38 50 34 62 36 L68 44" fill="none" stroke="#e8d9c2" stroke-width="6"/>
  <circle cx="50" cy="40" r="4" fill="#e86a3a" stroke="none"/>`);
icon("🦐", "Prawn", `
  <path d="M66 76 C62 52 56 40 48 26 40 20 L36 18" fill="#fb8c4a"/>
  <path d="M46 28 C40 40 34 44 30 46 M30 46 C28 40 30 32 36 26" fill="#ffffff" stroke-width="5"/>
  <path d="M34 20 L20 18 M32 20 L24 28 M58 64 L52 72" fill="#fb8c4a"/>`);
icon("🥢", "Chopsticks", `
  <rect x="16" y="70" width="68" height="22" rx="5" fill="#c22f4c"/>
  <rect x="20" y="72" width="60" height="4" fill="#961f3a"/>
  <g transform="rotate(-8 45 46)"><rect x="34" y="8" width="72" height="12" rx="4" fill="#9c6b35"/></g>
  <g transform="rotate(6 58 46)"><rect x="28" y="6" width="74" height="12" rx="4" fill="#b9833f"/></g>`);

/* ---------- taco stand ---------- */
icon("🌮", "Taco", `
  <path d="M18 74 L82 74 M82 74 C76 46 66 34 50 32 C34 42 20 62 18 74 Z" fill="#e3a84f"/>
  <path d="M30 64 C40 52 50 48 60 50 L66 58 C66 66 60 68 52 70" fill="#ffd23f"/>
  <path d="M28 68 C34 58 40 52 46 52 L52 58" fill="none" stroke="#3f9b33" stroke-width="6"/>
  <path d="M22 66 C26 62 30 58 34 62 L38 66" fill="none" stroke="#3f9b33" stroke-width="5"/>
  <path d="M40 60 C44 56 48 58 52 62" fill="none" stroke="#d63c3c" stroke-width="5"/>
  <path d="M56 60 C60 58 62 60 64 62" fill="none" stroke="#d63c3c" stroke-width="5"/>`);
icon("🌯", "Burrito", `
  <rect x="14" y="30" width="72" height="44" rx="16" fill="#d99a3f"/>
  <rect x="14" y="46" width="72" height="12" fill="#8a5a2b"/>
  <path d="M60 30 C86 30 84 52 62 74 L34 74 C20 60 22 44 24 36" fill="none" stroke="#39a7d6" stroke-width="9"/>
  <rect x="16" y="58" width="20" height="16" rx="6" fill="#39a7d6"/>
  <path d="M30 66 C44 62 58 64 66 72" fill="none" stroke="#7a4a26" stroke-width="5"/>
  <path d="M30 52 C46 54 60 52 70 48" fill="none" stroke="#4f9b33" stroke-width="6"/>`);
icon("🥑", "Avocado", `
  <path d="M50 30 C36 34 26 48 20 66 M20 70 C36 86 56 88 78 82 C88 62 86 42 72 30 L50 30 Z" fill="#5fae3d"/>
  <circle cx="50" cy="58" r="16" fill="#7a4a26"/>
  <circle cx="50" cy="58" r="6" fill="#5f2f1c"/>
  <path d="M50 30 C42 44 52 48 58 40" fill="none" stroke="#3c7d2b" stroke-width="5"/>`);
icon("🫓", "Tortilla", `
  <circle cx="50" cy="52" r="40" fill="#f1d49c"/>
  <path d="M22 40 C38 28 52 30 66 36 L76 48 M30 58 C40 66 54 68 70 62 L78 50" fill="none" stroke="#cf9f54" stroke-width="5"/>
  <path d="M14 60 C30 72 58 78 84 70 L86 54" fill="none" stroke="#cf9f54" stroke-width="5"/>`);
icon("🧀", "Cheese wedge", `
  <path d="M30 80 L30 28 L88 28 L88 66 L70 66 L58 80 L44 68 L30 80 Z" fill="#ffd23f"/>
  <circle cx="52" cy="50" r="7" fill="#e8a61c"/>
  <circle cx="70" cy="66" r="6" fill="#e8a61c"/>
  <circle cx="42" cy="64" r="5" fill="#e8a61c"/>
  <circle cx="62" cy="38" r="4" fill="#e8a61c"/>`);
icon("🌶️", "Chili pepper", `
  <path d="M42 26 C36 38 30 54 26 72 C30 84 46 86 48 78 Z" fill="#e8311f"/>
  <path d="M44 26 C36 16 30 12 28 16 Z" fill="#3f9b33"/>
  <rect x="42" y="8" width="8" height="10" rx="3" fill="#2c7d2b"/>
  <path d="M34 40 C32 50 34 60 36 66" fill="none" stroke="#5e140d" stroke-width="5"/>`);
icon("🍖", "Steak & bone", `
  <rect x="30" y="74" width="10" height="18" rx="4" fill="#f6eadf"/>
  <rect x="52" y="74" width="10" height="18" rx="4" fill="#f6eadf"/>
  <path d="M28 62 C20 44 28 26 44 22 C62 20 76 26 78 40 L80 56 C76 68 62 74 50 72 Z" fill="#a5613d"/>
  <path d="M40 38 C50 30 60 32 66 40 C64 52 54 56 44 52 Z" fill="#7c4328"/>`);
icon("🍗", "Drumstick", `
  <ellipse cx="50" cy="56" rx="26" ry="30" fill="#c07b3a"/>
  <rect x="44" y="80" width="14" height="14" rx="6" fill="#f7ecdf"/>
  <path d="M36 34 C42 26 52 24 62 28 L70 36" fill="none" stroke="#8a4f1f" stroke-width="5"/>
  <path d="M30 52 C26 60 26 70 30 76" fill="none" stroke="#8a4f1f" stroke-width="5"/>`);
icon("🫘", "Bean pot", `
  <path d="M20 78 C34 44 50 40 66 44 L80 78 Z" fill="#6b3d20"/>
  <path d="M14 80 C34 58 50 50 66 58 L86 80 Z" fill="#efe2c8"/>
  <circle cx="36" cy="64" r="11" fill="#7a4a26"/>
  <circle cx="58" cy="66" r="11" fill="#7a4a26"/>
  <circle cx="48" cy="52" r="9" fill="#8a5430"/>
  <circle cx="62" cy="50" r="8" fill="#7a4a26"/>`);
icon("🌽", "Corn cob", `
  <rect x="24" y="26" width="52" height="48" rx="14" fill="#ffd75f"/>
  <path d="M18 30 C8 22 6 34 6 48 L8 60 C10 70 16 70 20 60 Z" fill="#3f9b33"/>
  <path d="M82 30 C92 22 94 34 94 48 L92 60 C90 70 84 70 80 60 Z" fill="#3f9b33"/>
  <circle cx="36" cy="40" r="5" fill="#f2b23c" stroke="none"/><circle cx="54" cy="38" r="5" fill="#f2b23c" stroke="none"/>
  <circle cx="44" cy="54" r="5" fill="#f2b23c" stroke="none"/><circle cx="62" cy="50" r="5" fill="#f2b23c" stroke="none"/>
  <circle cx="34" cy="62" r="5" fill="#f2b23c" stroke="none"/><circle cx="52" cy="64" r="5" fill="#f2b23c" stroke="none"/>`);

/* ---------- pizza parlor ---------- */
icon("🍕", "Pizza slice", `
  <path d="M28 82 C34 64 42 46 50 42 C56 40 62 46 68 58 L78 82 Z" fill="#f1c40f"/>
  <path d="M76 82 C82 66 86 54 84 44 C82 38 76 34 68 36 Z" fill="#e0a44c"/>
  <circle cx="44" cy="58" r="8" fill="#d63c3c"/>
  <circle cx="58" cy="70" r="8" fill="#d63c3c"/>
  <circle cx="62" cy="52" r="7" fill="#d63c3c"/>
  <circle cx="40" cy="66" r="5" fill="#ff7b45"/>
  <path d="M34 42 C46 44 56 42 60 48" fill="none" stroke="#fff2cc" stroke-width="5"/>`);
icon("🍅", "Tomato", `
  <circle cx="50" cy="54" r="36" fill="#e33b2f"/>
  <path d="M50 16 C44 10 36 14 34 24 C36 30 42 30 46 26 Z" fill="#3f9b33"/>
  <rect x="46" y="8" width="8" height="8" rx="3" fill="#2c7d2b"/>
  <circle cx="50" cy="48" r="4" fill="#ffb37a" stroke="none"/>
  <circle cx="62" cy="64" r="5" fill="#a8231a" stroke="none"/>`);
icon("🫒", "Olive", `
  <ellipse cx="50" cy="50" rx="34" ry="42" fill="#2f6b2f"/>
  <ellipse cx="50" cy="50" rx="24" ry="30" fill="#3f8a33"/>
  <path d="M50 8 L50 0 M46 -4 L42 -10" fill="#1f4a1f"/>
  <circle cx="50" cy="56" r="8" fill="#d63c3c"/>`);
icon("🍄", "Mushroom", `
  <path d="M20 62 C14 44 16 30 30 24 C46 22 60 24 64 30 L72 40 C78 52 82 58 80 62 Z" fill="#c98f5a"/>
  <rect x="42" y="54" width="16" height="34" rx="7" fill="#f3e6d2"/>
  <circle cx="34" cy="34" r="6" fill="#f6ead8"/>
  <circle cx="52" cy="28" r="5" fill="#f6ead8"/>
  <circle cx="66" cy="38" r="6" fill="#f6ead8"/>
  <circle cx="44" cy="48" r="4" fill="#f6ead8"/>`);
icon("🥓", "Bacon", `
  <path d="M18 60 C30 40 40 46 48 40 C54 34 58 38 64 48 C66 54 62 62 54 68 L40 76" fill="#d96a6a"/>
  <path d="M28 34 C40 24 48 34 54 42 C60 52 66 66 70 78 Z" fill="#c95a52"/>
  <path d="M24 50 C34 44 44 50 50 56 M30 38 C38 34 44 40 48 46 M58 52 C62 46 68 48 72 54" fill="none" stroke="#fbe7d0" stroke-width="6"/>`);
icon("🥬", "Lettuce leaf", `
  <path d="M18 66 C10 48 12 32 24 18 C40 12 58 14 66 22 C78 34 84 48 82 66 C76 78 62 84 48 82 C30 78 22 72 18 66 Z" fill="#67c74e"/>
  <path d="M30 34 C38 28 48 26 58 30 C60 38 50 42 42 40 M46 50 C42 58 40 64 44 70" fill="none" stroke="#3f9b33" stroke-width="6"/>`);
icon("🥖", "Baguette", `
  <rect x="10" y="40" width="80" height="26" rx="12" fill="#d29a5b"/>
  <rect x="18" y="44" width="64" height="4" rx="2" fill="#c58a4b"/>
  <path d="M28 42 L40 62 M46 42 L56 64 M66 42 L80 58 M78 44 L86 60" fill="none" stroke="#a86f2f" stroke-width="5"/>
  <rect x="6" y="44" width="8" height="18" rx="4" fill="#a86f2f"/>
  <rect x="86" y="44" width="8" height="18" rx="4" fill="#a86f2f"/>`);

/* ---------- ramen house ---------- */
icon("🍜", "Ramen bowl", `
  <path d="M14 74 C30 44 50 40 70 44 L86 74 Z" fill="#e63946"/>
  <path d="M10 76 C30 50 50 46 70 50 L90 76 Z" fill="#fdf7ea"/>
  <path d="M24 54 C36 48 46 46 56 48 L64 54 M30 62 C42 58 54 60 62 66 L68 70 M52 52 C58 48 64 50 68 56" fill="none" stroke="#f2c744" stroke-width="7"/>
  <path d="M56 30 C50 24 46 20 44 16 C44 22 46 26 46 30 Z" fill="#fdf7ea"/>
  <circle cx="46" cy="26" r="10" fill="#ff9b3d"/>
  <circle cx="46" cy="26" r="4" fill="#ffc86e" stroke="none"/>`);
icon("🥚", "Egg", `
  <path d="M50 18 C36 24 26 38 20 58 C24 78 36 82 48 82 C58 80 70 74 78 60 C82 42 80 30 74 22 L50 18 Z" fill="#fdf6e9"/>
  <path d="M44 30 C40 38 42 44 46 50 C48 56 46 60 44 62" fill="none" stroke="#f2e3c4" stroke-width="6"/>
  <circle cx="50" cy="44" r="6" fill="#f7ecd2" stroke="none"/>`);
icon("🫑", "Bell pepper", `
  <path d="M50 22 C38 28 30 40 26 58 C30 74 44 80 58 82 C70 78 78 66 82 56 C84 40 82 30 76 24 Z" fill="#4fae3c"/>
  <path d="M50 46 C40 42 34 34 32 30 C34 26 42 24 50 24 Z" fill="#3c8a2e"/>
  <rect x="46" y="10" width="8" height="10" rx="3" fill="#2c6e24"/>
  <path d="M40 40 C38 50 42 60 44 70 M60 40 C62 50 58 60 56 72" fill="none" stroke="#3c8a2e" stroke-width="5"/>
  <circle cx="50" cy="54" r="5" fill="#ffd23f" stroke="none"/>`);

/* ---------- write files ---------- */
fs.mkdirSync(OUT, { recursive: true });
function fileFor(e) {
  return [...e].filter((c) => c !== "\uFE0F").map((c) => c.codePointAt(0).toString(16)).join("-") + ".svg";
}
let preview = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Belt &amp; Bite — icon preview</title>
<style>body{font-family:sans-serif;background:#20202a;color:#eee;margin:2rem}
.grid{display:grid;grid-template-columns:repeat(6,1fr);gap:1rem}
.card{background:#33333d;border-radius:12px;padding:1rem;text-align:center;width:110px}
.card img{width:56px;height:56px;image-rendering:auto;margin:.4rem}
.card .n{font-size:.75rem;color:#cfc} .card .e{font-size:1.4rem;opacity:.9}</style></head><body><h1>Food icon preview — ${icons.length} icons</h1><div class="grid">`;
for (const it of icons) {
  const f = fileFor(it.emoji);
  fs.writeFileSync(path.join(OUT, f), svg(it.body));
  preview += `<div class="card"><img src="img/food/${f}" alt="${it.name}"><div class="n">${it.name}</div><div class="e">${it.emoji}</div></div>`;
}
preview += `</div></body></html>`;
fs.writeFileSync(path.join(__dirname, "..", "preview-icons.html"), preview);
console.log(`wrote ${icons.length} icons + preview-icons.html`);