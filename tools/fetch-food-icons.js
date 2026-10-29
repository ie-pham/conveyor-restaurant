/* Downloads the food icon set from OpenMoji (hfg-gmuend, CC BY-SA 4.0) into img/food/.
   The 30 menu dishes (from game-core themes) become {cps}.png — same filenames the
   game's food path expects, so a swap is a file swap. Run: node tools/fetch-food-icons.js */
"use strict";
const fs = require("fs");
const path = require("path");
require(path.join(__dirname, "..", "game-core.js"));
const C = globalThis.GameCore;

const OUT = path.join(__dirname, "..", "img", "food");
const BASE = "https://cdn.jsdelivr.net/gh/hfg-gmuend/openmoji@15.0.0/color/618x618/";

const foods = [...new Set(C.THEMES.flatMap((t) => t.items))];

function dash(e) {
  return [...e].filter((c) => c !== "\uFE0F").map((c) => c.codePointAt(0).toString(16)).join("-");
}
function bar(e) {
  return [...e].filter((c) => c !== "\uFE0F").map((c) => c.codePointAt(0).toString(16)).join("_");
}

fs.mkdirSync(OUT, { recursive: true });
(async () => {
  let ok = 0, miss = [];
  for (const e of foods) {
    const d = dash(e), b = bar(e);
    const out = path.join(OUT, d + ".png");
    if (!fs.existsSync(out)) {
      try {
        const res = await fetch(BASE + b.toUpperCase() + ".png");
        if (!res.ok) throw new Error(String(res.status));
        fs.writeFileSync(out, Buffer.from(await res.arrayBuffer()));
      } catch (err) { miss.push(`${e} (${b}) -> ${err.message}`); }
    }
    ok++;
  }
  // preview page so the icons can be eyeballed side by side
  let preview = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Belt &amp; Bite — food icon preview</title>
<style>body{font-family:sans-serif;background:#20202a;color:#eee;margin:2rem}
.grid{display:grid;grid-template-columns:repeat(6,1fr);gap:1rem}
.card{background:#2b2b36;border-radius:12px;padding:1rem;text-align:center}
.card img{width:64px;height:64px;margin:.4rem;filter:saturate(1.4) contrast(1.2)}
.card .n{font-size:.75rem;color:#ddd}</style></head><body><h1>Food icons — ${foods.length} (Noto Emoji)</h1><div class="grid">`;
  for (const e of foods) {
    preview += `<div class="card"><img src="img/food/${dash(e)}.png" alt=""><div class="n">${e}</div></div>`;
  }
  fs.writeFileSync(path.join(__dirname, "..", "preview-icons.html"), preview + `</div></body></html>`);
  // prune icons that no menu uses anymore
  const active = new Set(foods.map(dash));
  let pruned = 0;
  for (const f of fs.readdirSync(OUT)) {
    if (!active.has(f.replace(/\.png$/, ""))) { fs.unlinkSync(path.join(OUT, f)); pruned++; }
  }
  console.log(`ready ${ok} icons; missed: ${miss.length ? miss.join(" | ") : "none"}; pruned ${pruned}`);
})();