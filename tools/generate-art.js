#!/usr/bin/env node
// Draws the Belt & Bite sprite set (32 dishes + 8 customers) as SVG and rasterises
// each to a transparent PNG with rsvg-convert. Usage: node tools/generate-art.js [outDir]
"use strict";
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const SIZE = 256;
const ROOT = path.join(__dirname, "..");
const OUT = process.argv[2] ? path.resolve(process.argv[2]) : path.join(ROOT, "img");

let seed = 7;
const rnd = () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const OL = "#4a2c2a";
const E = (cx, cy, rx, ry, fill, x = "") => `<ellipse class="o" cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" ${x}/>`;
const C = (cx, cy, r, fill, x = "") => E(cx, cy, r, r, fill, x);
const R = (x, y, w, h, r, fill, ex = "") => `<rect class="o" x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" ${ex}/>`;
const P = (d, fill, ex = "") => `<path class="o" d="${d}" fill="${fill}" ${ex}/>`;
const L = (d, stroke, w, ex = "") => `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${ex}/>`;
const T = (d, color, w) => L(d, OL, w + 28) + L(d, color, w);
const HL = (cx, cy, rx, ry, rot = 0, op = 0.55) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#fff" opacity="${op}" transform="rotate(${rot} ${cx} ${cy})"/>`;
const G = (t, inner) => `<g transform="${t}">${inner}</g>`;
const svg = (inner) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="${SIZE}" height="${SIZE}"><style>.o{stroke:${OL};stroke-width:14;stroke-linejoin:round;stroke-linecap:round}</style>${inner}</svg>`;
const NORI = "#2e4d3c";
const mirror = (inner) => G("translate(1024 0) scale(-1 1)", inner);

const shade = (hex, f) => {
  const n = parseInt(hex.slice(1), 16);
  const ch = [n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.max(0, Math.min(255, Math.round(v * f))));
  return "#" + ch.map((v) => v.toString(16).padStart(2, "0")).join("");
};

/* ---------------------------------------------------------------- food */
const nigiri = (x, y, s) => G(`translate(${x} ${y}) scale(${s})`,
  R(-190, -30, 380, 150, 70, "#fffaf0") +
  P("M-215 -20 Q-215 -140 -90 -150 Q0 -165 100 -150 Q215 -135 215 -20 Q215 20 170 30 L-170 30 Q-215 20 -215 -20Z", "#ff8670") +
  L("M-150 -100 Q-90 -40 -40 -120", "#ffd6c9", 18) + L("M-10 -135 Q40 -60 90 -135", "#ffd6c9", 18) +
  L("M110 -110 Q150 -50 185 -100", "#ffd6c9", 18) + HL(-100, -125, 70, 14, -6));

const roll = (x, y, r, col) => C(x, y, r, NORI) + C(x, y, r * 0.68, "#fffdf6") + C(x, y, r * 0.3, col);

const spiral = () => {
  const pts = [];
  for (let t = 0; t <= 3.1 * 2 * Math.PI; t += 0.12) {
    const r = 16 + t * 13.2;
    pts.push(`${(512 + r * Math.cos(t)).toFixed(1)} ${(512 + r * Math.sin(t)).toFixed(1)}`);
  }
  return "M" + pts.join(" L");
};

const along = (cx, cy, r, deg) => [cx + r * Math.cos((deg * Math.PI) / 180), cy + r * Math.sin((deg * Math.PI) / 180)];

const prawn = () => {
  const cx = 540, cy = 520, R0 = 260;
  const [tx, ty] = along(cx, cy, R0, -250);
  const tdir = [Math.sin((-250 * Math.PI) / 180), -Math.cos((-250 * Math.PI) / 180)];
  const tdeg = (Math.atan2(tdir[1], tdir[0]) * 180) / Math.PI;
  let s = G(`translate(${tx.toFixed(0)} ${ty.toFixed(0)}) rotate(${tdeg.toFixed(0)})`,
    G("rotate(-34)", E(90, 0, 80, 38, "#ff6b4a")) + G("rotate(34)", E(90, 0, 80, 38, "#ff6b4a")) + E(100, 0, 90, 38, "#ff8a65"));
  const n = 9;
  for (let i = 0; i < n; i++) {
    const a = -250 + (i * (250 - 70 - 8)) / (n - 1) * 1;
    const [x, y] = along(cx, cy, R0, a);
    const r = 58 + i * 5;
    s += C(x.toFixed(0), y.toFixed(0), r, i % 2 ? "#ff7a55" : "#ff9370");
    s += HL(+x.toFixed(0) - r * 0.2, +y.toFixed(0) - r * 0.35, r * 0.3, r * 0.12, -30, 0.45);
  }
  const [hx, hy] = along(cx, cy, R0, -62);
  s += P(`M${hx + 70} ${hy - 30} L${hx + 230} ${hy + 40} L${hx + 60} ${hy + 70}Z`, "#ff7a55");
  s += L(`M${hx + 40} ${hy - 60} Q${hx + 200} ${hy - 200} ${hx + 330} ${hy - 110}`, OL, 10);
  s += L(`M${hx + 60} ${hy - 30} Q${hx + 220} ${hy - 110} ${hx + 340} ${hy - 20}`, OL, 10);
  s += C(hx, hy, 112, "#ff8260");
  s += C(hx + 40, hy - 25, 28, "#fff") + C(hx + 48, hy - 25, 15, "#2b1d1d", 'stroke-width="0"');
  s += HL(hx - 25, hy - 60, 40, 14, -30, 0.5);
  return s;
};

const chip = (x, y, s, rot, col) => G(`translate(${x} ${y}) rotate(${rot}) scale(${s})`,
  P("M0 -150 L-140 110 L140 110Z", col, 'stroke-width="18"') + `<circle cx="-30" cy="20" r="9" fill="#c98a2b"/><circle cx="40" cy="60" r="8" fill="#c98a2b"/><circle cx="10" cy="-40" r="7" fill="#c98a2b"/>`);

const beanPile = () => {
  const cols = ["#9b2d2d", "#7a1f22", "#b83a3a"];
  const beans = [];
  for (let i = 0; i < 46; i++) {
    const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd());
    const x = 512 + Math.cos(a) * 250 * d, y = 480 - Math.abs(Math.sin(a)) * 110 * d * (1 - d * 0.2) + 20 * d;
    beans.push({ x, y, rot: rnd() * 180, c: cols[i % 3] });
  }
  return beans.sort((p, q) => p.y - q.y).map((b) =>
    E(b.x.toFixed(0), b.y.toFixed(0), 44, 30, b.c, `transform="rotate(${b.rot.toFixed(0)} ${b.x.toFixed(0)} ${b.y.toFixed(0)})"`) + HL(+b.x.toFixed(0) - 10, +b.y.toFixed(0) - 9, 15, 6, -20, 0.55)).join("");
};

const steam = (x, y, h = 170) => L(`M${x} ${y} q-45 -${h / 4} 0 -${h / 2} t0 -${h / 2}`, "#fff", 22, 'opacity="0.75"');

const FOOD = {
  "1f363": () => nigiri(430, 380, 0.88) + nigiri(600, 650, 0.88),
  "1f359": () => {
    const tri = "M512 170 Q548 170 572 215 L820 690 Q860 780 770 800 L254 800 Q164 780 204 690 L452 215 Q476 170 512 170Z";
    return `<defs><clipPath id="t"><path d="${tri}"/></clipPath></defs>` + P(tri, "#fffdf6") +
      `<g clip-path="url(#t)"><rect x="150" y="620" width="724" height="220" fill="${NORI}"/>${L("M240 668 H790", "#527f66", 12, 'opacity="0.7"')}</g>` +
      L(tri, OL, 14) + HL(430, 360, 40, 90, 20, 0.6) + C(560, 400, 16, "#e8dcc4", 'stroke-width="0"') + C(500, 520, 14, "#e8dcc4", 'stroke-width="0"');
  },
  "1f371": () =>
    R(120, 220, 784, 584, 70, "#b8302a") + R(160, 260, 704, 504, 40, "#fff1d0") +
    L("M512 262 V762", OL, 12) + L("M162 512 H512", OL, 12) +
    roll(260, 360, 62, "#ff8670") + roll(405, 360, 62, "#7fcf6b") + roll(332, 450, 52, "#ffd24a") +
    R(200, 550, 130, 180, 24, "#ffd24a") + R(345, 550, 130, 180, 24, "#ffc233") +
    L("M215 600 H315 M215 650 H315 M360 600 H460 M360 650 H460", "#e8a21c", 10) +
    E(690, 375, 130, 70, "#ff9966") + L("M610 360 Q690 410 770 360 M600 395 Q690 440 780 395", "#ffd9b8", 14) +
    E(610, 650, 70, 40, "#7bc96f") + E(740, 640, 70, 40, "#6bbb60") + E(670, 710, 70, 36, "#7bc96f") +
    C(595, 650, 14, "#4d9a47", 'stroke-width="0"') + C(630, 650, 14, "#4d9a47", 'stroke-width="0"') + C(735, 640, 14, "#4d9a47", 'stroke-width="0"') +
    HL(280, 240, 120, 10, 0, 0.35),
  "1f364": () => G("rotate(-18 512 512)",
    P("M690 470 Q760 340 880 290 Q930 360 900 450 Q960 470 940 560 Q880 600 800 560 Q740 570 690 540Z", "#ff6b4a") +
    L("M780 470 L900 340 M800 510 L930 480 M790 540 L900 560", "#ffa58f", 12) +
    E(440, 520, 300, 160, "#f2b04a") +
    L("M250 520 q40 -50 90 0 M360 460 q40 -40 90 0 M460 560 q40 -50 90 0 M570 480 q40 -40 80 0 M290 590 q40 -40 90 0", "#d98a2b", 14) +
    C(330, 580, 16, "#f7cd7a", 'stroke-width="0"') + C(520, 440, 14, "#f7cd7a", 'stroke-width="0"') + C(620, 570, 14, "#f7cd7a", 'stroke-width="0"') +
    HL(380, 440, 130, 22, -4, 0.5)),
  "1f95f": () => {
    const body = "M150 600 Q200 330 512 320 Q824 330 874 600 Q860 730 512 740 Q164 730 150 600Z";
    let pl = "";
    for (let x = 250; x <= 780; x += 88) {
      const y = 322 + 280 * Math.pow((x - 512) / 362, 2);
      pl += L(`M${x} ${(y + 8).toFixed(0)} q14 40 -16 86`, "#c79a52", 12);
    }
    return `<defs><clipPath id="g"><path d="${body}"/></clipPath></defs>` + P(body, "#fbe7bd") +
      `<g clip-path="url(#g)"><rect x="100" y="620" width="824" height="160" fill="#d98a3a"/>${L("M150 640 Q512 700 874 640", "#f0b35a", 16)}</g>` +
      L(body, OL, 14) + pl + HL(420, 400, 130, 22, -8, 0.6);
  },
  "1f365": () => {
    let sc = "";
    for (let i = 0; i < 18; i++) { const [x, y] = along(512, 512, 280, i * 20); sc += C(x.toFixed(0), y.toFixed(0), 58, "#fff"); }
    return sc + `<circle cx="512" cy="512" r="288" fill="#fff"/>` + L(spiral(), "#ff8fb1", 38) + HL(380, 330, 100, 22, -35, 0.7);
  },
  "1f358": () => `<defs><clipPath id="s"><circle cx="512" cy="512" r="330"/></clipPath></defs>` + C(512, 512, 330, "#e9b36b") +
    `<g clip-path="url(#s)">${[...Array(26)].map(() => { const a = rnd() * 6.28, d = Math.sqrt(rnd()) * 300; return `<circle cx="${(512 + Math.cos(a) * d).toFixed(0)}" cy="${(512 + Math.sin(a) * d).toFixed(0)}" r="${8 + rnd() * 10}" fill="#c98a42" opacity="0.7"/>`; }).join("")}` +
    `<g transform="rotate(-28 512 512)"><rect x="150" y="440" width="724" height="160" fill="${NORI}"/>${L("M160 480 H864", "#527f66", 10, 'opacity="0.7"')}</g></g>` +
    L("M512 182 A330 330 0 1 1 511.9 182Z", OL, 14) + HL(380, 300, 90, 26, -35, 0.55),
  "1f419": () => {
    const tl = T("M360 560 C300 660 190 650 185 770 C182 840 270 850 295 790", "#e2587f", 90) + T("M450 600 C430 720 380 790 400 870 C412 915 480 910 478 850", "#e2587f", 90);
    return tl + mirror(tl) + T("M512 610 C512 720 500 810 520 890 C535 935 600 920 590 860", "#e2587f", 90) +
      E(512, 380, 250, 240, "#ee6a90") + [[400, 240], [620, 250], [512, 190], [680, 340], [340, 340]].map(([x, y]) => C(x, y, 20, "#d94673", 'stroke-width="0"')).join("") +
      HL(400, 230, 80, 30, -30, 0.55) +
      E(420, 420, 50, 62, "#fff") + E(604, 420, 50, 62, "#fff") +
      `<ellipse cx="430" cy="430" rx="26" ry="34" fill="#2b1d1d"/><ellipse cx="594" cy="430" rx="26" ry="34" fill="#2b1d1d"/>` +
      `<circle cx="440" cy="415" r="10" fill="#fff"/><circle cx="604" cy="415" r="10" fill="#fff"/>` +
      `<ellipse cx="350" cy="510" rx="34" ry="22" fill="#ffb3c6" opacity="0.8"/><ellipse cx="674" cy="510" rx="34" ry="22" fill="#ffb3c6" opacity="0.8"/>` +
      L("M470 520 Q512 565 554 520", OL, 12);
  },
  "1f990": prawn,
  "1f362": () => G("rotate(-32 512 512)",
    L("M110 512 H914", "#e8c58c", 28) + L("M110 512 H914", OL, 4, 'opacity="0.5"') +
    [250, 450, 650].map((x) => R(x - 105, 392, 210, 240, 70, "#8a4b24") + HL(x - 30, 440, 60, 14, 0, 0.5) + C(x - 40, 560, 8, "#fff3c4", 'stroke-width="0"') + C(x + 30, 580, 8, "#fff3c4", 'stroke-width="0"') + L(`M${x + 20} 610 q10 40 -4 60`, "#8a4b24", 16)).join("")),
  "1f32e": () =>
    E(480, 440, 300, 60, "#ffb62e") + C(430, 330, 64, "#7bc96f") + C(570, 300, 70, "#6bbb60") + C(690, 350, 56, "#7bc96f") + C(320, 370, 54, "#6bbb60") +
    C(380, 300, 24, "#e63946") + C(600, 230, 26, "#e63946") + C(500, 350, 22, "#e63946") + C(720, 300, 22, "#e63946") + C(300, 330, 20, "#e63946") +
    P("M110 480 Q120 880 512 900 Q904 880 914 480Q512 540 110 480Z", "#eab04a") +
    L("M170 590 Q512 680 854 590", "#c98a2b", 12, 'opacity="0.6"') + HL(260, 700, 60, 18, 30, 0.5),
  "1f32f": () =>
    P("M180 340 Q512 270 844 340 L844 700 Q512 770 180 700Z", "#f1d9a6") +
    L("M260 380 Q512 340 760 380", "#c9a463", 14, 'opacity="0.5"') +
    E(190, 520, 90, 190, "#fffdf6") + E(190, 520, 65, 150, "#b8651b") + E(190, 440, 36, 40, "#ffd24a") + E(200, 560, 40, 46, "#7bc96f") + E(176, 640, 24, 30, "#e63946") + E(215, 500, 20, 24, "#fffdf6") +
    L("M360 480 q90 40 170 -10 M420 580 q90 40 170 -10", "#c9a463", 10) + HL(500, 330, 190, 18, 0, 0.5),
  "1f959": () =>
    P("M140 760 L560 330 Q600 300 640 330 L880 560 Q900 600 860 620 L260 810 Q160 830 140 760Z", "#ffe08a") +
    P("M150 700 L560 280 Q600 250 640 280 L880 510 Q900 550 860 570 L260 760 Q160 770 150 700Z", "#f1d9a6") +
    L("M380 500 L460 580 M470 420 L550 500 M570 340 L640 410", "#c9a463", 16) +
    P("M170 770 Q230 830 270 780 Q310 860 360 790", "#ffc233", 'stroke-width="12"') +
    R(660, 640, 250, 150, 40, "#d9dde3") + E(785, 650, 100, 36, "#e63946") + HL(740, 640, 40, 10, -10, 0.6),
  "1f957": () =>
    C(380, 390, 90, "#7bc96f") + C(520, 340, 100, "#6bbb60") + C(660, 390, 90, "#8bd47a") + C(470, 440, 70, "#8bd47a") +
    C(400, 470, 38, "#e63946") + C(600, 450, 36, "#e63946") + C(700, 470, 30, "#ff8a3d") + C(520, 470, 32, "#c8e86a") +
    HL(370, 330, 50, 18, -30, 0.5) +
    P("M130 500 Q512 570 894 500 Q880 860 512 880 Q144 860 130 500Z", "#fff") + L("M180 640 Q512 710 844 640", "#4a90d9", 28) + HL(260, 590, 50, 14, 20, 0.6),
  "1f33d": () => G("rotate(-30 512 512)",
    R(372, 130, 280, 680, 140, "#ffd23f") +
    [...Array(11)].map((_, r) => [...Array(4)].map((__, c) => `<rect x="${396 + c * 58}" y="${176 + r * 56}" width="48" height="48" rx="16" fill="${rnd() < 0.18 ? "#c27a2e" : "#ffe27a"}" stroke="#e0a72a" stroke-width="4"/>`).join("")).join("") +
    R(372, 130, 280, 680, 140, "none") +
    P("M372 620 Q300 780 440 930 Q540 840 520 700Z", "#7bc96f") + P("M652 620 Q724 780 584 930 Q484 840 504 700Z", "#6bbb60") + L("M440 740 Q450 840 440 900", "#4d9a47", 10)),
  "1f35f": () => {
    let f = "";
    for (let i = 0; i < 9; i++) {
      const x = 320 + i * 46, y = 300 + rnd() * 120;
      f += G(`rotate(${(rnd() * 24 - 12).toFixed(0)} ${x + 31} 560)`, R(x, y.toFixed(0), 62, 300, 14, i % 2 ? "#ffd54a" : "#f7c32e"));
    }
    return f + P("M300 520 L724 520 L680 880 Q675 910 640 910 L384 910 Q349 910 344 880Z", "#e63946") +
      `<polygon points="309.2,600 714.8,600 706.1,720 317.9,720" fill="#fff"/>` +
      L("M300 520 L344 880 Q349 910 384 910 L640 910 Q675 910 680 880 L724 520", OL, 14) + R(280, 496, 464, 44, 20, "#c1121f") + HL(380, 780, 14, 80, 0, 0.35);
  },
  "1f357": () => G("rotate(35 512 512)",
    R(540, 462, 270, 100, 50, "#fff3dc") + C(810, 450, 52, "#fff3dc") + C(810, 574, 52, "#fff3dc") + R(540, 462, 120, 100, 20, "#fff3dc", 'stroke-width="0"') +
    E(400, 512, 270, 230, "#c9742f") + [[300, 400], [450, 330], [350, 560], [520, 520], [250, 500]].map(([x, y]) => C(x, y, 16, "#a85a1f", 'stroke-width="0"')).join("") +
    L("M200 460 Q260 340 400 310", "#e8a45a", 18) + HL(310, 380, 90, 24, -35, 0.55)),
  "1fad8": () =>
    P("M200 520 Q190 800 380 860 Q512 900 644 860 Q834 800 824 520Z", "#c8663a") + C(190, 560, 40, "#b4552d") + C(834, 560, 40, "#b4552d") +
    L("M240 650 Q512 720 784 650", "#f4c27a", 16) + [300, 400, 512, 624, 724].map((x) => C(x, 700 + Math.abs(512 - x) * -0.05 + 20, 12, "#f4c27a", 'stroke-width="0"')).join("") +
    E(512, 520, 320, 56, "#b4552d") + beanPile() + HL(300, 780, 20, 70, 20, 0.35),
  "1f9c0": () =>
    chip(350, 560, 1.15, -50, "#f0b94a") + chip(680, 560, 1.15, 50, "#e8a93a") + chip(512, 500, 1.2, 4, "#f4c24e") +
    P("M300 480 Q330 400 440 410 Q520 350 620 410 Q730 400 740 490 Q770 540 710 560 L690 660 Q670 710 640 660 Q630 620 610 670 Q600 740 570 670 Q550 610 520 660 Q500 720 470 660 Q450 610 420 640 Q390 690 370 630 Q360 580 320 570 Q270 540 300 480Z", "#ffa526") +
    HL(430, 450, 70, 16, -10, 0.55) + C(430, 500, 38, "#7bc96f") + C(430, 500, 18, "#d6f59a") + C(620, 470, 36, "#7bc96f") + C(620, 470, 16, "#d6f59a") +
    R(500, 540, 34, 34, 8, "#e63946") + R(560, 590, 30, 30, 8, "#e63946"),
  "1f951": () =>
    C(790, 780, 120, "#9be15d") + C(790, 780, 92, "#d6f59a") + [...Array(8)].map((_, i) => { const [x, y] = along(790, 780, 88, i * 45); return L(`M790 780 L${x.toFixed(0)} ${y.toFixed(0)}`, "#9be15d", 8); }).join("") + C(790, 780, 20, "#f4f9d2", 'stroke-width="0"') + HL(740, 720, 40, 12, -40, 0.6) +
    P("M170 480 Q200 770 400 810 L624 810 Q824 770 854 480Z", "#6c625c") + R(330, 800, 70, 40, 14, "#6c625c") + R(624, 800, 70, 40, 14, "#6c625c") +
    E(512, 480, 342, 80, "#7b706a") +
    P("M230 480 Q300 290 512 290 Q724 290 794 480 Q512 570 230 480Z", "#8fc94a") +
    [[360, 400, "#e63946"], [600, 350, "#e63946"], [460, 450, "#fffdf6"], [650, 440, "#fffdf6"], [520, 340, "#4d9a47"], [400, 340, "#4d9a47"], [700, 400, "#4d9a47"]].map(([x, y, c]) => C(x, y, 17, c, 'stroke-width="0"')).join("") +
    HL(400, 340, 70, 18, -20, 0.5),
  "1f355": () =>
    R(190, 180, 644, 130, 62, "#e8a24e") + HL(330, 215, 100, 14, 0, 0.5) +
    P("M230 280 L794 280 L540 850 Q512 900 484 850Z", "#ffc94a") +
    P("M230 280 L794 280 Q780 340 740 330 Q720 380 680 340 Q640 400 600 340 Q560 380 520 340 Q480 400 440 340 Q400 390 360 340 Q320 380 290 330 Q250 330 230 280Z", "#ffe38a", 'stroke-width="0"') +
    C(400, 440, 70, "#d9433d") + C(620, 450, 64, "#d9433d") + C(510, 620, 56, "#d9433d") + C(540, 360, 34, "#d9433d") +
    [[380, 420], [420, 460], [610, 440], [640, 470], [500, 610], [530, 635]].map(([x, y]) => C(x, y, 9, "#a82d28", 'stroke-width="0"')).join("") +
    E(300, 400, 36, 18, "#7bc96f", 'transform="rotate(30 300 400)"') + E(740, 560, 36, 18, "#7bc96f", 'transform="rotate(-35 740 560)"'),
  "1f35d": () =>
    E(512, 770, 380, 110, "#fff") + E(512, 760, 320, 70, "#e8f1ff") +
    P("M190 700 Q200 330 512 320 Q830 330 834 700 Q512 800 190 700Z", "#ffd978") +
    [0, 70, 140, 210].map((o) => L(`M${230 + o * 0.1} ${460 + o} Q300 ${380 + o} 380 ${460 + o} T540 ${460 + o} T700 ${460 + o} T800 ${430 + o}`, "#e9b441", 14)).join("") +
    P("M330 430 Q400 300 512 310 Q640 300 700 430 Q620 500 512 460 Q400 500 330 430Z", "#e03c31") +
    C(450, 360, 58, "#8a4a2b") + C(580, 370, 52, "#8a4a2b") + HL(430, 340, 20, 12, -30, 0.5) + HL(565, 350, 18, 10, -30, 0.5) +
    E(512, 305, 40, 20, "#4d9a47", 'transform="rotate(-20 512 305)"'),
  "1f956": () => G("rotate(-35 512 512)",
    P("M120 512 Q120 390 250 382 L774 382 Q904 390 904 512 Q904 634 774 642 L250 642 Q120 634 120 512Z", "#dda04b") +
    [0, 1, 2, 3, 4].map((i) => { const x = 230 + i * 130; return `<path d="M${x} 410 Q${x + 70} 480 ${x + 30} 610 Q${x - 40} 530 ${x} 410Z" fill="#f6d9a0" stroke="#b87722" stroke-width="6" stroke-linejoin="round"/>`; }).join("") +
    HL(450, 420, 300, 12, 0, 0.35)),
  "1f968": () => {
    const ring = "M512 780 C300 780 150 640 190 440 C230 250 440 230 512 400 C584 230 794 250 834 440 C874 640 724 780 512 780Z";
    const salt = [[250, 410], [310, 320], [430, 290], [600, 290], [720, 320], [790, 420], [770, 560], [670, 690], [512, 740], [350, 690], [260, 570], [512, 470]]
      .map(([x, y]) => `<rect x="${x - 14}" y="${y - 6}" width="28" height="12" rx="4" fill="#fff" transform="rotate(${(rnd() * 180).toFixed(0)} ${x} ${y})"/>`).join("");
    return T(ring, "#b9702d", 78) + T("M270 640 C400 660 520 540 610 420", "#b9702d", 78) + T("M754 640 C624 660 504 540 414 420", "#b9702d", 78) +
      L(ring, "#e0a35a", 14, 'transform="translate(-6 -10)" opacity="0.7"') + salt;
  },
  "1f366": () =>
    P("M270 640 L754 640 L684 880 Q676 910 640 910 L384 910 Q348 910 340 880Z", "#ffb3d4") +
    L("M330 700 L360 880 M430 700 L440 900 M590 700 L584 900 M690 700 L664 880", "#ff8fbf", 12, 'opacity="0.7"') +
    E(512, 600, 250, 85, "#fff6e5") + E(512, 500, 200, 75, "#fff6e5") + E(512, 410, 150, 65, "#fff6e5") + E(512, 330, 95, 52, "#fff6e5") +
    L("M330 560 Q512 620 700 560 M370 470 Q512 530 650 470 M410 385 Q512 430 610 385", "#f4dcb8", 12) +
    [[400, 560, "#ff4d6d"], [620, 580, "#4dabf7"], [480, 480, "#ffd43b"], [570, 440, "#51cf66"], [440, 400, "#ff4d6d"], [600, 340, "#4dabf7"], [350, 590, "#ffd43b"], [680, 520, "#ff4d6d"], [510, 560, "#51cf66"]]
      .map(([x, y, c]) => `<rect x="${x - 17}" y="${y - 5}" width="34" height="10" rx="5" fill="${c}" transform="rotate(${(rnd() * 160).toFixed(0)} ${x} ${y})"/>`).join("") +
    R(250, 620, 524, 50, 25, "#ff8fbf") + L("M520 285 Q540 230 590 225", "#4d9a47", 14) + C(512, 262, 46, "#e63946") + HL(496, 244, 14, 8, -30, 0.7) + HL(330, 480, 20, 70, 30, 0.35),
  "1f36a": () => {
    let pts = [];
    for (let i = 0; i < 64; i++) { const a = (i / 64) * 6.2832, r = 328 + (i % 2 ? 12 : -8) + Math.sin(a * 3) * 8; pts.push(`${(512 + r * Math.cos(a)).toFixed(0)} ${(512 + r * Math.sin(a)).toFixed(0)}`); }
    const chips = [[360, 360, 70], [610, 330, 60], [450, 560, 66], [680, 560, 62], [560, 470, 54], [330, 560, 50], [520, 700, 58], [740, 410, 48], [400, 250, 40]]
      .map(([x, y, s]) => `<path class="o" stroke-width="10" fill="#5a3320" d="M${x - s * 0.5} ${y - s * 0.2} L${x - s * 0.1} ${y - s * 0.55} L${x + s * 0.5} ${y - s * 0.3} L${x + s * 0.4} ${y + s * 0.3} L${x - s * 0.2} ${y + s * 0.45}Z"/>`).join("");
    return P("M" + pts.join(" L") + "Z", "#e5b26b") +
      [...Array(22)].map(() => { const a = rnd() * 6.28, d = Math.sqrt(rnd()) * 290; return C((512 + Math.cos(a) * d).toFixed(0), (512 + Math.sin(a) * d).toFixed(0), 9 + rnd() * 8, "#c98d43", 'stroke-width="0"'); }).join("") +
      chips + HL(330, 260, 90, 18, -35, 0.5);
  },
  "1f964": () => {
    const body = "M300 380 L724 380 L670 900 Q665 930 630 930 L394 930 Q359 930 354 900Z";
    const lx = (y) => 300 + (y - 380) * 0.1038;
    return L("M560 250 L610 90 L730 60", OL, 56) + L("M560 250 L610 90 L730 60", "#ff4d5a", 28) + L("M565 225 L600 100", "#fff", 12, 'stroke-dasharray="24 30"') +
      P(body, "#fff") + `<polygon points="${lx(520)},520 ${1024 - lx(520)},520 ${1024 - lx(780)},780 ${lx(780)},780" fill="#e63946"/>` +
      L(`M${lx(580)} 650 Q420 590 512 650 T700 650`, "#fff", 18) + L("M300 380 L354 900 Q359 930 394 930 L630 930 Q665 930 670 900 L724 380", OL, 14) +
      R(280, 340, 464, 70, 30, "#d9dde3") + P("M320 345 Q330 235 512 230 Q694 235 704 345Z", "#e6eaf0") + HL(400, 280, 60, 14, -20, 0.7);
  },
  "1f35c": () =>
    P("M130 520 Q150 880 512 900 Q874 880 894 520Z", "#e63946") + L("M200 680 Q512 760 824 680", "#fff", 18, 'opacity="0.8"') +
    E(512, 520, 382, 95, "#fff") + E(512, 524, 350, 72, "#f2a65a") +
    P("M200 520 Q230 330 512 320 Q794 330 824 520 Q512 580 200 520Z", "#ffe08a") +
    [0, 1, 2, 3].map((i) => L(`M${240 + i * 12} ${480 - i * 40} Q380 ${400 - i * 40} 512 ${470 - i * 40} T800 ${470 - i * 40}`, "#e9b441", 12)).join("") +
    E(370, 450, 78, 58, "#fff") + E(370, 450, 38, 32, "#ffb020") + HL(358, 438, 14, 8, -30, 0.7) +
    C(560, 440, 56, "#fff") + L(spiral().replace(/[\d.]+ [\d.]+/g, (m) => { const [x, y] = m.split(" ").map(Number); return `${(560 + (x - 512) * 0.16).toFixed(0)} ${(440 + (y - 512) * 0.16).toFixed(0)}`; }), "#ff8fb1", 9) +
    P("M700 330 L790 290 L810 470 L720 500Z", NORI) + C(470, 380, 16, "#7bc96f") + C(640, 360, 16, "#7bc96f") + C(430, 520, 14, "#7bc96f") + C(690, 520, 14, "#7bc96f") +
    steam(400, 270) + steam(520, 250, 200) + steam(630, 270),
  "1f95a": () => {
    const egg = "M512 150 C720 150 810 420 810 560 C810 760 680 880 512 880 C344 880 214 760 214 560 C214 420 304 150 512 150Z";
    return P(egg, "#f2dcc0") + G("translate(512 560) scale(0.88) translate(-512 -560)", `<path d="${egg}" fill="#fffdf6"/>`) +
      E(512, 610, 170, 160, "#ffaa1a") + E(512, 600, 110, 100, "#ffc233") + HL(450, 540, 50, 28, -30, 0.7) +
      P("M470 740 Q480 830 512 830 Q545 830 552 740Z", "#ffaa1a", 'stroke-width="10"') + HL(335, 330, 30, 80, 25, 0.5);
  },
  "1f35b": () =>
    P("M150 560 Q170 840 512 860 Q854 840 874 560Z", "#fff") + L("M190 660 Q512 740 834 660", "#4a90d9", 24) + E(512, 560, 362, 82, "#fff") +
    P("M200 540 Q220 360 380 340 Q520 340 540 470 Q560 560 380 590 Q230 590 200 540Z", "#fffdf6") +
    [[300, 440], [380, 400], [440, 470], [330, 520]].map(([x, y]) => E(x, y, 14, 7, "#e8dcc4", `stroke-width="0" transform="rotate(30 ${x} ${y})"`)).join("") +
    P("M420 500 Q490 370 690 390 Q850 410 830 520 Q800 610 600 620 Q440 610 420 500Z", "#b8651b") +
    R(560, 440, 70, 56, 20, "#ff8a3d") + R(690, 470, 66, 52, 20, "#ff8a3d") + E(620, 550, 50, 34, "#e8c88a") + C(740, 430, 15, "#7bc96f") + C(520, 550, 14, "#7bc96f") +
    HL(500, 420, 80, 12, -8, 0.5),
  "1f35a": () =>
    P("M170 520 Q190 850 512 880 Q834 850 854 520Z", "#4a90d9") + [250, 350, 450, 570, 670, 770].map((x, i) => C(x, 700 + (i % 2) * 50, 14, "#fff", 'stroke-width="0"')).join("") +
    P("M190 520 Q200 270 512 260 Q824 270 834 520 Q512 610 190 520Z", "#fffdf6") +
    [[330, 400], [420, 330], [600, 340], [700, 410], [480, 470], [620, 480], [380, 490]].map(([x, y]) => E(x, y, 20, 9, "#eadfc8", `stroke-width="0" transform="rotate(${(rnd() * 160).toFixed(0)} ${x} ${y})"`)).join("") +
    C(512, 340, 46, "#d6336c") + HL(498, 322, 14, 8, -30, 0.6) + [[560, 420], [440, 410], [650, 470]].map(([x, y]) => C(x, y, 7, "#2b1d1d", 'stroke-width="0"')).join("") +
    L("M170 520 Q512 610 854 520", OL, 14) + HL(260, 440, 12, 80, 20, 0.5),
  "1f375": () => {
    const cup = "M240 440 L784 440 Q780 800 640 850 Q512 880 384 850 Q244 800 240 440Z";
    return `<defs><clipPath id="c"><path d="${cup}"/></clipPath></defs>` + P(cup, "#fffdf6") +
      `<g clip-path="url(#c)"><rect x="200" y="590" width="624" height="90" fill="#2ec4b6"/>${L("M230 635 Q300 600 370 635 T510 635 T650 635 T790 635", "#fff", 12, 'opacity="0.8"')}</g>` +
      L(cup, OL, 14) + E(512, 440, 272, 62, "#fffdf6") + E(512, 447, 244, 42, "#86b83c") + HL(420, 440, 60, 8, -6, 0.5) +
      HL(300, 560, 16, 70, 5, 0.6) + steam(420, 340, 150) + steam(560, 340, 150);
  },
};

/* ----------------------------------------------------------- customers */
const face = ({ mouth = "open", brow = "#3a2a20", browW = 14, browY = 0, eyeR = 1, freckles = false, cheeks = true } = {}) => {
  const ey = 430, rx = 28 * eyeR, ry = 38 * eyeR;
  let s = [430, 594].map((x) => `<ellipse cx="${x}" cy="${ey}" rx="${rx}" ry="${ry}" fill="#2b1d1d"/><circle cx="${x + 9}" cy="${ey - 14}" r="${10 * eyeR}" fill="#fff"/><circle cx="${x - 8}" cy="${ey + 12}" r="${5 * eyeR}" fill="#fff"/>`).join("");
  if (browW) s += L(`M385 ${375 + browY} Q430 ${350 + browY} 472 ${372 + browY}`, brow, browW) + L(`M552 ${372 + browY} Q594 ${350 + browY} 639 ${375 + browY}`, brow, browW);
  if (cheeks) s += `<ellipse cx="362" cy="500" rx="38" ry="24" fill="#ff8fa3" opacity="0.55"/><ellipse cx="662" cy="500" rx="38" ry="24" fill="#ff8fa3" opacity="0.55"/>`;
  if (freckles) s += [[350, 470], [380, 484], [352, 498], [674, 470], [644, 484], [672, 498]].map(([x, y]) => C(x, y, 5, "#b8794a", 'stroke-width="0"')).join("");
  s += L("M498 478 Q512 490 526 478", "#a8643d", 8, 'opacity="0.8"');
  if (mouth === "open") s += P("M452 505 Q512 605 572 505Z", "#7a2a2a", 'stroke-width="10"') + E(512, 560, 28, 12, "#ff7f8f", 'stroke-width="0"');
  else if (mouth === "smile") s += L("M452 520 Q512 580 572 520", OL, 12);
  else if (mouth === "smirk") s += L("M462 530 Q520 570 578 510", OL, 12);
  else if (mouth === "flat") s += L("M468 560 Q512 545 556 560", "#2b1d1d", 10);
  return s;
};

const person = ({ skin, shirt, back = "", front = "", torsoExtra = "", neckExtra = "", features, ears = true }) =>
  back + R(442, 600, 140, 170, 50, shade(skin, 0.88)) +
  P("M160 980 Q150 770 330 725 L694 725 Q874 770 864 980Z", shirt) + torsoExtra +
  (ears ? C(322, 440, 40, skin) + C(702, 440, 40, skin) : "") +
  E(512, 410, 195, 205, skin) + features + front;

const SKIN = { a: "#ffd9b8", b: "#f2b98b", c: "#f5cba7", d: "#f7c9a0", e: "#e0ac82", f: "#c68642", g: "#a86b3c" };

const pearls = () => {
  let s = "";
  for (let i = 0; i <= 8; i++) {
    const t = i / 8, x = (1 - t) ** 2 * 410 + 2 * t * (1 - t) * 512 + t * t * 614, y = (1 - t) ** 2 * 732 + 2 * t * (1 - t) * 850 + t * t * 732;
    s += C(x.toFixed(0), y.toFixed(0), 17, "#fff", 'stroke-width="8"');
  }
  return s;
};

const CUST = {
  // 🧑‍🍳 friendly female sushi chef
  "1f9d1-200d-1f373": () => person({
    skin: SKIN.a, shirt: "#fff", back: C(512, 160, 88, "#2b2233"),
    torsoExtra: P("M380 735 L644 735 L676 980 L348 980Z", "#2ec4b6") + L("M400 735 Q512 800 624 735", "#1f9a8e", 16),
    front: P("M318 390 Q312 215 512 205 Q712 215 706 390 Q650 300 512 300 Q374 300 318 390Z", "#2b2233") +
      P("M316 345 Q512 250 708 345 L704 392 Q512 306 320 392Z", "#fff") + HL(430, 250, 50, 10, -12, 0.35),
    features: face({ mouth: "open", brow: "#2b2233" }),
  }),
  // 👨‍🍳 cheerful male server, big mustache, yellow polo
  "1f468-200d-1f373": () => person({
    skin: SKIN.b, shirt: "#ffc94a",
    torsoExtra: P("M440 725 L512 800 L584 725 L620 742 L512 850 L404 742Z", "#ffe28a") + L("M512 800 V975", OL, 8) + C(512, 860, 12, "#fff", 'stroke-width="6"') + C(512, 920, 12, "#fff", 'stroke-width="6"'),
    front: P("M322 400 Q310 210 512 200 Q714 210 702 400 Q690 300 512 290 Q334 300 322 400Z", "#5a3420"),
    features: face({ mouth: "none", brow: "#5a3420" }) + L("M470 565 Q512 590 554 565", OL, 10) +
      P("M512 492 Q470 462 420 478 Q392 520 450 524 Q490 520 512 508 Q534 520 574 524 Q632 520 604 478 Q554 462 512 492Z", "#5a3420"),
  }),
  // 🧓 smiling grandpa, round glasses, mint cardigan
  "1f9d3": () => person({
    skin: SKIN.c, shirt: "#8fe3c0",
    torsoExtra: P("M440 725 L512 850 L584 725Z", "#fff") + L("M440 725 L512 850 M584 725 L512 850", OL, 10) + C(512, 890, 13, "#fff", 'stroke-width="7"') + C(512, 950, 13, "#fff", 'stroke-width="7"'),
    front: P("M322 440 Q282 330 336 270 Q326 350 348 405Z", "#f4f4f4") + P("M702 440 Q742 330 688 270 Q698 350 676 405Z", "#f4f4f4") + HL(470, 260, 50, 14, -10, 0.6),
    features: face({ mouth: "open", brow: "#f4f4f4", browW: 0, cheeks: true }) +
      E(430, 358, 56, 17, "#f4f4f4") + E(594, 358, 56, 17, "#f4f4f4") +
      C(430, 432, 64, "#fff", 'fill-opacity="0.18" stroke-width="10"') + C(594, 432, 64, "#fff", 'fill-opacity="0.18" stroke-width="10"') + L("M494 428 Q512 414 530 428", OL, 10),
  }),
  // 👧 excited kid, bowl cut, pink tee
  "1f467": () => person({
    skin: SKIN.d, shirt: "#ff7aa8",
    torsoExtra: P("M430 725 Q512 800 594 725", "#e85d8e", 'stroke-width="10"'),
    front: P("M312 440 Q296 190 512 186 Q728 190 712 440 Q704 340 650 336 Q512 300 374 336 Q320 340 312 440Z", "#3a2a20") + HL(430, 240, 60, 12, -10, 0.3),
    features: face({ mouth: "open", brow: "#3a2a20", eyeR: 1.15, freckles: true, browY: 10 }) + `<rect x="498" y="506" width="26" height="22" rx="5" fill="#fff"/>`,
  }),
  // 👵 gentle grandma, pearls, lavender sweater
  "1f475": () => person({
    skin: SKIN.c, shirt: "#b9a1e0", back: C(512, 168, 86, "#e9e6f2"),
    torsoExtra: pearls(),
    front: P("M316 430 Q298 220 512 205 Q726 220 708 430 Q690 310 512 300 Q334 310 316 430Z", "#e9e6f2") + L("M380 300 Q440 250 500 290 M530 280 Q600 250 660 300", "#cfc9de", 10),
    features: face({ mouth: "smile", brow: "#bdb8cc" }),
  }),
  // 🧑‍🦱 hip young customer, slicked-back hair, sky-blue bomber
  "1f9d1-200d-1f9b1": () => person({
    skin: SKIN.f, shirt: "#6cb8ee",
    back: "",
    torsoExtra: R(430, 712, 164, 64, 30, "#2f6fa8") + L("M512 776 V975", OL, 10) + L("M330 760 Q300 850 310 960", "#4a9ad8", 10, 'opacity="0.6"'),
    front: P("M360 262 Q420 110 600 140 Q730 170 704 300 Q600 220 470 244Z", "#1f2a44") + P("M320 400 Q300 200 520 190 Q760 190 706 400 Q690 300 600 270 Q450 250 360 310 Q330 340 320 400Z", "#1f2a44") + HL(520, 160, 70, 10, -8, 0.3),
    features: face({ mouth: "smirk", brow: "#1f2a44", browY: -4 }),
  }),
  // 🧔 grumpy-but-lovable, thick brows, orange hoodie
  "1f9d4": () => person({
    skin: SKIN.e, shirt: "#ff8a3d",
    back: P("M300 770 Q276 600 400 620 L624 620 Q748 600 724 770Z", "#e8691c"),
    torsoExtra: L("M452 770 V870", "#fff3dc", 10) + C(452, 880, 14, "#fff3dc", 'stroke-width="7"') + L("M572 770 V870", "#fff3dc", 10) + C(572, 880, 14, "#fff3dc", 'stroke-width="7"'),
    front: P("M322 400 Q310 215 512 205 Q714 215 702 400 Q690 320 512 310 Q334 320 322 400Z", "#5a3a24") +
      P("M322 470 Q330 700 512 712 Q694 700 702 470 Q660 565 512 565 Q364 565 322 470Z", "#5a3a24") + HL(430, 640, 60, 10, 10, 0.2) + L("M468 585 Q512 568 556 585", "#2b1d1d", 10),
    features: face({ mouth: "none", brow: "#3a2418", browW: 30, browY: 18, cheeks: false }),
  }),
  // 👩‍🍳 cheerful service manager, name badge, lemon-yellow hat
  "1f469-200d-1f373": () => person({
    skin: SKIN.g, shirt: "#ff8a80",
    back: P("M298 440 Q286 180 512 172 Q738 180 726 440 L744 650 Q700 712 650 650 L650 440 L374 440 L374 650 Q324 712 280 650Z", "#1c1620"),
    torsoExtra: P("M430 725 L512 820 L594 725 L624 750 L512 870 L400 750Z", "#fff") + R(610, 800, 120, 74, 14, "#fff") + `<rect x="610" y="800" width="120" height="24" rx="12" fill="#4a90d9" stroke="${OL}" stroke-width="10"/><circle cx="650" cy="848" r="9" fill="#ff8a80"/><rect x="672" y="840" width="42" height="9" rx="4" fill="#bbb"/>`,
    front: P("M322 335 Q330 185 512 180 Q694 185 702 335Z", "#ffe45c") + P("M296 338 Q512 300 728 338 Q748 378 704 378 Q512 348 320 378 Q276 378 296 338Z", "#f5d130") + HL(430, 230, 60, 12, -12, 0.6),
    features: face({ mouth: "open", brow: "#1c1620" }),
  }),
};

/* ------------------------------------------------------------- render */
const rasterise = (markup, file) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const png = execFileSync("rsvg-convert", ["-w", String(SIZE), "-h", String(SIZE)], { input: svg(markup), maxBuffer: 1 << 26 });
  fs.writeFileSync(file, png);
};

let n = 0;
for (const [cp, draw] of Object.entries(FOOD)) { rasterise(draw(), path.join(OUT, "food", cp + ".png")); n++; }
for (const [cp, draw] of Object.entries(CUST)) { rasterise(draw(), path.join(OUT, cp + ".png")); n++; }
console.log(`wrote ${n} sprites to ${OUT}`);
