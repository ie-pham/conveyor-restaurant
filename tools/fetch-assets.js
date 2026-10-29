/* Downloads the colorful sprite set (Twemoji, CC-BY 4.0) for every emoji the game
   uses and stores it in img/ so the game is self-contained and offline-friendly.
   Run: node tools/fetch-assets.js
   Attribution: Twemoji graphics by Twitter/X, licensed CC-BY 4.0. */
"use strict";
const fs = require("fs");
const path = require("path");

const SRC_DIR = path.join(__dirname, "..");
const OUT_DIR = path.join(SRC_DIR, "img");
const BASE = "https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.1.0/assets/72x72/";

const files = ["game-core.js", "game.js", "index.html", "levels-data.js", "README.md"];
let all = "";
for (const f of files) all += fs.readFileSync(path.join(SRC_DIR, f), "utf8") + "\n";

// emoji runs, including ZWJ sequences like 🧑🍳
const runs = all.match(/[\p{Extended_Pictographic}\u{200D}\u{FE0F}\u{20E3}]+/gu) || [];
const emojiList = [...new Set(runs.filter((r) => r.match(/\p{Extended_Pictographic}/u)))];

function fileFor(emoji) {
  const cps = [...emoji].filter((c) => c !== "\uFE0F").map((c) => c.codePointAt(0).toString(16));
  return cps.join("-") + ".png";
}

fs.mkdirSync(OUT_DIR, { recursive: true });
(async () => {
  let ok = 0, miss = [];
  for (const e of emojiList) {
    const f = fileFor(e);
    const out = path.join(OUT_DIR, f);
    if (fs.existsSync(out)) { ok++; continue; }
    try {
      const res = await fetch(BASE + f);
      if (!res.ok) throw new Error(String(res.status));
      fs.writeFileSync(out, Buffer.from(await res.arrayBuffer()));
      ok++;
    } catch (err) {
      miss.push(`${e} (${f}) -> ${err.message}`);
    }
  }
  console.log(`downloaded/bundled ${ok}/${emojiList.length} emoji sprites`);
  if (miss.length) { console.log("missed:"); for (const m of miss) console.log("  " + m); }
  else console.log("all sprites present");
})();
