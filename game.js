/* game.js — Belt & Bite engine: DOM + rAF, zero build step. */
"use strict";

const { THEMES, LEVELS, themeForLevel, menuForLevel, beltJammed, customersRemain, levelRoster, levelPool, randInt, choice } = GameCore;

// OpenMoji sprite set for dishes (img/food/), twemoji for everything else
const CUSTOM_FOOD = new Set(GameCore.THEMES.flatMap((t) => t.items));
function emojiCps(e) {
  return [...e].filter((c) => c !== "\uFE0F").map((c) => c.codePointAt(0).toString(16)).join("-");
}
function artEl(e) {
  const img = document.createElement("img");
  img.className = "art";
  img.alt = e;
  const food = CUSTOM_FOOD.has(e);
  img.src = (food ? "img/food/" : "img/") + emojiCps(e) + ".png";
  img.addEventListener("error", () => { img.replaceWith(artText(e)); }, { once: true });
  return img;
}
function artText(e) {
  const s = document.createElement("span");
  s.className = "art-fallback";
  s.textContent = e;
  return s;
}

const $ = (id) => document.getElementById(id);

const GRAB_R = 40;        // px: how close an item must be to a station to be grabbed
const JAM_GRACE = 2.5;    // s: belt-jam warning before the level is lost
const LINE_MAX = 5;       // items per kitchen line queue
const LOOKAHEAD = 8;      // kitchen peeks this deep for something a seated guest wants
const SURPLUS = 0.3;       // the kitchen cooks ~30% more than ordered — no scarcity
const STORE = "beltbite:v1";
const CUST_FACES = ["🧑‍🍳", "👩‍🍳", "👨‍🍳", "🧑‍🦱", "👵", "🧔", "👧", "🧓"];

const els = {
  screenStart: $("screen-start"), screenGame: $("screen-game"),
  btnPlay: $("btn-play"), btnHowto: $("btn-howto"),
  bestLine: $("best-line"),
  hudTheme: $("hud-theme"),
  levelPager: $("level-pager"), levelTrack: $("level-track"), levelDots: $("level-dots"),
  lvlPrev: $("lvl-prev"), lvlNext: $("lvl-next"),
  customersLeft: $("customers-left"), statAngry: $("stat-angry"),
  statScore: $("stat-score"),
  btnMute: $("btn-mute"), btnPause: $("btn-pause"), btnQuit: $("btn-quit"),
  lines: $("lines"), beltArea: $("belt-area"), beltTrack: $("belt-track"), beltMouth: $("belt-mouth"),
  beltItems: $("belt-items"), stations: $("stations"),
  beltCap: $("belt-cap"), beltCapPips: $("belt-cap-pips"), beltCapNum: $("belt-cap-num"),
  jamWarn: $("jam-warn"), jamFill: $("jam-fill"),
  modalHowto: $("modal-howto"), modalPause: $("modal-pause"), modalWin: $("modal-win"), modalLose: $("modal-lose"),
  winTitle: $("win-title"), winStats: $("win-stats"),
  loseTitle: $("lose-title"), loseStats: $("lose-stats"),
  btnResume: $("btn-resume"), btnNext: $("btn-next"), btnRetry: $("btn-retry")
};

let S = null;   // per-level state
let geo = null; // belt geometry
let best = 1;
let muted = false;

/* ---------------- belt loop path (rounded rect, arc-length parameterized) ---------------- */

function buildLoop(cx, cy, w, h, r) {
  r = Math.max(8, Math.min(r, Math.min(w, h) / 2 - 4));
  const x0 = cx - w / 2, y0 = cy - h / 2, x1 = cx + w / 2, y1 = cy + h / 2;
  const pts = [];
  const push = (x, y) => pts.push([x, y]);
  const pushArc = (ccx, ccy, a0, a1) => {
    const n = Math.max(12, Math.round(((a1 - a0) / (Math.PI / 2)) * 18));
    for (let i = 0; i <= n; i++) {
      const a = a0 + ((a1 - a0) * i) / n;
      push(ccx + r * Math.cos(a), ccy + r * Math.sin(a));
    }
  };
  // clockwise, starting at bottom-center — where the kitchen lines feed the belt
  push(cx, y1);
  push(x0 + r, y1);
  pushArc(x0 + r, y1 - r, Math.PI / 2, Math.PI);
  push(x0, y0 + r);
  pushArc(x0 + r, y0 + r, Math.PI, (3 * Math.PI) / 2);
  push(x1 - r, y0);
  pushArc(x1 - r, y0 + r, -Math.PI / 2, 0);
  push(x1, y1 - r);
  pushArc(x1 - r, y1 - r, 0, Math.PI / 2);
  push(cx, y1); // closes the loop

  const cum = [0];
  for (let i = 1; i < pts.length; i++) {
    cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  }
  const total = cum[cum.length - 1];

  const sample = (t) => {
    let d = ((t % 1) + 1) % 1 * total;
    let lo = 0, hi = pts.length - 1;
    while (lo < hi - 1) {
      const mid = (lo + hi) >> 1;
      if (cum[mid] <= d) lo = mid; else hi = mid;
    }
    const segLen = cum[lo + 1] - cum[lo] || 1;
    const f = (d - cum[lo]) / segLen;
    return [pts[lo][0] + (pts[lo + 1][0] - pts[lo][0]) * f,
            pts[lo][1] + (pts[lo + 1][1] - pts[lo][1]) * f];
  };

  const posToT = (p) => {
    let bestT = 0, bestD = Infinity;
    for (let i = 0; i <= 480; i++) {
      const t = i / 480, q = sample(t);
      const d = Math.hypot(q[0] - p[0], q[1] - p[1]);
      if (d < bestD) { bestD = d; bestT = t; }
    }
    return bestT;
  };

  return { total, sample, posToT };
}

/* ---------------- geometry ---------------- */

// If the board's content is taller than the phone frame, scale it down to fit —
// the kitchen must never be pushed below the fold.
function fitBoard() {
  const sc = els.screenGame;
  const avail = sc.clientHeight;
  const content = sc.scrollHeight;
  const s = (content > avail && avail > 0) ? avail / content : 1;
  sc.style.transformOrigin = "top left";
  sc.style.transform = s === 1 ? "" : "scale(" + s + ")";
}

function buildGeo() {
  const rect = els.beltArea.getBoundingClientRect();
  const W = rect.width, H = rect.height;
  const cx = W / 2, cy = H / 2;
  const trackW = Math.max(150, W - 190); // wide side gutters so customers sit beside the belt band
  const trackH = Math.max(120, H - 60); // always fits the area box (30px gutter top/bottom)
  const corner = Math.max(10, Math.min(44, trackW / 2 - 8, trackH / 2 - 8));
  const loop = buildLoop(cx, cy, trackW, trackH, corner);
  const x0 = cx - trackW / 2, x1 = cx + trackW / 2;
  const y0 = cy - trackH / 2, y1 = cy + trackH / 2;

  const cands = [
    [x1, y0 + trackH * 0.17], [x1, y0 + trackH * 0.83],
    [x0, y0 + trackH * 0.83], [x0, y0 + trackH * 0.17]
  ];
  cands.sort((p, q) => loop.posToT(p) - loop.posToT(q));

  const prev = geo && geo.stations;
  geo = {
    cx, cy, trackW, trackH, corner, loop,
    stations: cands.map((p, i) => {
      // Preserve station identity across rebuilds so live customers and their pods survive resize/font-load.
      if (prev && prev[i]) {
        const st = prev[i];
        st.x = p[0]; st.y = p[1];
        st.t = loop.posToT(p);
        st.side = p[0] < cx ? "left" : "right";
        return st;
      }
      return { x: p[0], y: p[1], t: loop.posToT(p), side: p[0] < cx ? "left" : "right", cust: null, pod: null };
    })
  };

  const band = 15; // half the belt thickness — the belt straddles the item path
  els.beltTrack.style.left = (x0 - band) + "px";
  els.beltTrack.style.top = (y0 - band) + "px";
  els.beltTrack.style.width = (trackW + band * 2) + "px";
  els.beltTrack.style.height = (trackH + band * 2) + "px";
  els.beltTrack.style.borderRadius = (corner + band) + "px";
  els.beltMouth.style.left = cx + "px";
  els.beltMouth.style.top = y1 + "px";
  els.beltMouth.style.transform = "translate(-50%, -50%)";
  positionStations();
}

function positionStations() {
  if (!geo) return;
  for (const st of geo.stations) {
    if (!st.pod) continue;
    st.pod.el.style.left = st.x + "px";
    st.pod.el.style.top = st.y + "px";
    st.pod.body.style.marginLeft = (st.side === "left" ? -44 : 44) + "px";
  }
}

/* ---------------- per-level state ---------------- */

function buildState(level) {
  const cfg = LEVELS[level - 1];
  const menu = menuForLevel(level);
  // Replay variety: same 62 orders and dish totals every play (identical difficulty),
  // but the guest arrival order and the kitchen's batch line get re-rolled each time.
  const base = levelRoster(level);
  const roster = [...base];
  for (let i = roster.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [roster[i], roster[j]] = [roster[j], roster[i]];
  }
  const pool = buildRuntimePool(roster);
  // startup fill: every line opens with LINE_MAX items, drawn freely from the deck front
  const lines = [];
  for (let i = 0; i < 4; i++) {
    const q = [];
    for (let j = 0; j < LINE_MAX + 1 && pool.length; j++) q.push(takeFromPool(pool, null));
    lines.push(q);
  }
  return {
    level, cfg, menu, theme: themeForLevel(level),
    phase: "playing",
    time: 0,
    served: 0, angry: 0, score: 0,
    roster, pool, rosterIdx: 0,
    belt: [],
    lines,
    jam: null
  };
}

/* ---------------- customer lifecycle ---------------- */

function makePod(st) {
  const el = document.createElement("div");
  el.className = "station";
  const body = document.createElement("div");
  body.className = "pod-body";
  const cust = document.createElement("div"); cust.className = "cust";
  const want = document.createElement("div"); want.className = "want";
  const patience = document.createElement("div"); patience.className = "patience";
  const fill = document.createElement("div"); fill.className = "patience-fill";
  patience.appendChild(fill);
  body.append(cust, want, patience);
  el.appendChild(body);
  els.stations.appendChild(el);
  st.pod = { el, body, cust, want, fill };
  setVacant(st);
  positionStations();
}

function setVacant(st) {
  st.cust = null;
  st.pod.el.classList.add("vacant");
  st.pod.cust.textContent = "";
  st.pod.cust.appendChild(artEl("🪑"));
  st.pod.want.textContent = "· · ·";
  st.pod.fill.style.width = "0%";
}

function spawnCustomer() {
  if (S.rosterIdx >= S.roster.length) return; // all booked customers are seated or gone
  const idx = geo.stations.findIndex((s) => !s.cust);
  if (idx < 0) return;
  const st = geo.stations[idx];
  const book = S.roster[S.rosterIdx];
  const cust = { type: book.type, qty: book.qty, patience: S.cfg.patience, src: S.rosterIdx };
  S.rosterIdx++;
  st.cust = cust;
  st.pod.el.classList.remove("vacant", "leave-happy", "leave-angry");
  st.pod.cust.textContent = "";
  st.pod.cust.appendChild(artEl(choice(CUST_FACES)));
  st.pod.want.textContent = "";
  const big = document.createElement("big");
  big.appendChild(artEl(cust.type));
  st.pod.want.appendChild(big);
  st.pod.want.appendChild(document.createTextNode(" ×" + cust.qty));
  st.pod.fill.className = "patience-fill";
  st.pod.el.classList.add("arrive");
  setTimeout(() => st.pod.el.classList.remove("arrive"), 450);
  sfx("arrive");
}

function leaveHappy(st, cust) {
  st.cust = null;
  st.pod.el.classList.add("leave-happy");
  setTimeout(() => {
    st.pod.el.classList.remove("leave-happy");
    if (!st.cust) setVacant(st); // a replacement may already be seated — don't wipe them
  }, 560);
  S.served++;
  const pf = Math.max(0, cust.patience / S.cfg.patience);
  const pts = Math.round((cust.qty * 20 + pf * 40) * (1 + S.level * 0.1));
  S.score += pts;
  popup(st.x, st.y, "+" + pts);
  sfx("serve");
  spawnCustomer(); // keep all four seats filled — replacement is instant
  checkEnd();
}

function leaveAngry(st) {
  if (!st.cust) return;
  const src = st.cust.src;
  st.cust = null;
  // their un-shipped order is written off — the kitchen doesn't produce waste for nothing
  if (S.pool.length) S.pool = S.pool.filter((t) => t.src !== src);
  // their already-dealt food is written off from the kitchen lines too, so it
  // can never orphan the board at the end of the level.
  for (let i = 0; i < S.lines.length; i++) {
    const before = S.lines[i].length;
    S.lines[i] = S.lines[i].filter((t) => t.src !== src);
    if (S.lines[i].length !== before) updateLineUI(i);
  }
  // their plate may already be circling the belt — pull it so it can't orphan the finish
  const stray = S.belt.filter((b) => b.src === src);
  S.belt = S.belt.filter((b) => b.src !== src);
  for (const b of stray) b.el.remove();
  st.pod.el.classList.add("leave-angry");
  setTimeout(() => {
    st.pod.el.classList.remove("leave-angry");
    if (!st.cust) setVacant(st); // a replacement may already be seated — don't wipe them
  }, 560);
  S.angry++;
  popup(st.x, st.y, "😡", true);
  sfx("angry");
  spawnCustomer(); // keep all four seats filled
  checkEnd();
}

/* ---------------- belt items ---------------- */

function mkItemEl(type) {
  const el = document.createElement("div");
  el.className = "belt-item";
  el.appendChild(artEl(type));
  els.beltItems.appendChild(el);
  el.classList.add("pop");
  setTimeout(() => el.classList.remove("pop"), 240);
  return el;
}

function dish(i) {
  if (!S || S.phase !== "playing") return;
  if (S.belt.length >= S.cfg.maxOnBelt) { beltNudge(); sfx("block"); return; }
  const line = S.lines[i];
  if (!line.length) { lineNudge(i); sfx("block"); return; }
  const item = line.shift();
  if (!item) return;
  S.belt.push({ type: item.type, src: item.src, t: 0, el: mkItemEl(item.type) });
  updateLineUI(i);
  sfx("dish");
  updateHUD();
  // Dishing can trip the jam rule the instant the belt hits capacity.
  S.jam = null;
  if (S.belt.length >= S.cfg.maxOnBelt) {
    const want = activeWants();
    const beltOk = S.belt.some((b) => want.has(b.type));
    const linesOk = S.lines.some((l) => l.some((it) => want.has(it.type)));
    if (!beltOk && !linesOk) S.jam = { t: 0 };
  }
}

function consume(item, st, pos) {
  const idx = S.belt.indexOf(item);
  if (idx >= 0) S.belt.splice(idx, 1);
  item.el.classList.add("grab");
  item.el.style.setProperty("--gx", (st.x - pos[0]) + "px");
  item.el.style.setProperty("--gy", (st.y - pos[1]) + "px");
  item.el.style.transform = "translate(var(--gx), var(--gy)) scale(0.3)";
  item.el.style.zIndex = "20";
  setTimeout(() => item.el.remove(), 210);
  const cust = st.cust;
  if (!cust) return;
  cust.qty--;
  cust.patience = S.cfg.patience; // every bite restarts the clock — only a stall drains patience
  if (cust.qty <= 0) {
    leaveHappy(st, cust);
  } else {
    st.pod.want.textContent = "";
    const big = document.createElement("big");
    big.appendChild(artEl(cust.type));
    st.pod.want.appendChild(big);
    st.pod.want.appendChild(document.createTextNode(" ×" + cust.qty));
    sfx("grab");
  }
  updateHUD();
}

function activeWants() {
  return new Set(geo.stations.map((s) => s.cust && s.cust.type).filter(Boolean));
}

/* ---------------- kitchen lines ---------------- */

// Deal the next dish from the exact deck: prefer a nearby item a seated customer
// wants (depth-bounded lookahead), otherwise the deck's front (the next customer's order).
// Rebuild the kitchen's production line fresh for this play: every guest's dishes, plus
// a surplus of spare plates (~30% — src -1, owned by no one so they can't be written off),
// grouped into 3-5 batches (never a lonely single) and the batches shuffled.
function buildRuntimePool(roster) {
  const byType = new Map();
  roster.forEach((c, src) => {
    if (!byType.has(c.type)) byType.set(c.type, []);
    for (let i = 0; i < c.qty; i++) byType.get(c.type).push({ type: c.type, src });
  });
  for (const plates of byType.values()) {
    const extra = Math.ceil(plates.length * SURPLUS);
    for (let i = 0; i < extra; i++) plates.push({ type: plates[0].type, src: -1 });
  }
  const batches = [];
  for (const plates of byType.values()) {
    for (let i = 0; i < plates.length; ) {
      let n = Math.min(3 + randInt(0, 2), plates.length - i);
      if (i + n === plates.length - 1) n += 1; // never leave a lonely single
      batches.push(plates.slice(i, i + n));
      i += n;
    }
  }
  for (let i = batches.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [batches[i], batches[j]] = [batches[j], batches[i]];
  }
  return batches.flat();
}

// Deal the next dish strictly from the deck's front — the kitchen just cooks down its
// production line, so much of it is food no seated guest has ordered yet. (Deck stays exact;
// src lets us write off a stormed-out customer's food.)
function takeFromPool(pool, want) {
  if (!pool.length) return null;
  if (want && want.size) {
    const depth = Math.min(LOOKAHEAD, pool.length);
    for (let i = 0; i < depth; i++) {
      if (want.has(pool[i].type)) return pool.splice(i, 1)[0];
    }
  }
  return pool.shift();
}



function updateLineUI(i) {
  const lineEl = els.lines.children[i];
  const q = S.lines[i];
  const qEl = lineEl.querySelector(".queue");
  qEl.textContent = "";
  // render everything in the queue; the fixed-height container clips the overflow tail
  for (let k = 0; k < q.length; k++) {
    const c = document.createElement("div");
    c.className = "chip";
    c.appendChild(artEl(q[k].type));
    qEl.appendChild(c);
  }
}

/* ---------------- update loop ---------------- */

function update(dt) {
  // belt advances clockwise
  for (const item of S.belt) {
    item.t = (item.t + (S.cfg.beltSpeed * dt) / geo.loop.total) % 1;
  }
  // grabbing: items are eaten by the first matching station they pass
  for (const item of [...S.belt]) {
    const p = geo.loop.sample(item.t);
    for (const st of geo.stations) {
      const c = st.cust;
      if (!c || c.patience <= 0 || c.type !== item.type) continue;
      if (Math.hypot(p[0] - st.x, p[1] - st.y) < GRAB_R) { consume(item, st, p); break; }
    }
  }
  // patience
  for (const st of geo.stations) {
    const c = st.cust;
    if (!c) continue;
    c.patience -= dt;
    if (c.patience <= 0) leaveAngry(st);
  }
  // last-mile: with 8 guests left, the kitchen reparts the deck so their orders
  // come first — the finale is never buried under surplus leftovers
  if (!S.finalized && S.roster.length - S.rosterIdx <= 8) {
    S.finalized = true;
    const need = new Set();
    for (let i = S.rosterIdx; i < S.roster.length; i++) need.add(i);
    S.pool = S.pool.filter((t) => need.has(t.src)).concat(S.pool.filter((t) => !need.has(t.src)));
  }
  // kitchen line fills — pre-made dishes slide in instantly, no waiting
  for (let i = 0; i < 4; i++) {
    if (S.lines[i].length < LINE_MAX + 1 && S.pool.length) {
      S.lines[i].push(takeFromPool(S.pool, activeWants()));
      updateLineUI(i);
    }
  }
  // belt jam rule
  const wantTypes = geo.stations.map((s) => s.cust && s.cust.type);
  const wantSet = new Set(wantTypes.filter(Boolean));
  const wantedOnBelt = S.belt.some((b) => wantSet.has(b.type));
  const wantedInLines = S.lines.some((l) => l.some((it) => wantSet.has(it.type)));
  // a jam only counts when there's no wanted dish anywhere — belt AND lines are dry
  const jammed = !wantedOnBelt && !wantedInLines && beltJammed(S.belt, wantTypes, S.cfg.maxOnBelt);
  if (jammed) {
    if (!S.jam) S.jam = { t: 0 };
    S.jam.t += dt;
    if (S.jam.t >= JAM_GRACE) { lose("jam"); return; }
  } else {
    S.jam = null;
  }
  checkEnd();
}

function render() {
  if (!S || !geo) return;
  // belt items
  for (const item of S.belt) {
    const p = geo.loop.sample(item.t);
    item.el.style.left = (p[0] - 15) + "px";
    item.el.style.top = (p[1] - 15) + "px";
    item.el.style.zIndex = p[1] > geo.cy ? 2 : 1;
  }
  // patience bars
  for (const st of geo.stations) {
    const c = st.cust;
    const fill = st.pod.fill;
    if (c) {
      const f = Math.max(0, c.patience / S.cfg.patience);
      fill.style.width = (f * 100) + "%";
      fill.className = "patience-fill" + (f < 0.3 ? " low" : f < 0.55 ? " mid" : "");
    }
  }
  // jam warning
  const jamActive = !!S.jam;
  els.jamWarn.classList.toggle("hidden", !jamActive);
  if (jamActive) els.jamFill.style.width = (Math.min(1, S.jam.t / JAM_GRACE) * 100) + "%";
  updateHUD();
}

function updateHUD() {
  els.customersLeft.textContent = `Customers left: ${Math.max(0, S.cfg.target - S.served)}`;
  els.statAngry.textContent = `😤 ${S.angry}/3`;
  els.statAngry.classList.toggle("low", S.angry >= 2);
  els.statScore.textContent = `⭐ ${S.score}`;
  syncBeltCap();
}

function syncBeltCap() {
  if (!S) return;
  els.beltCapNum.textContent = `${S.belt.length}/${S.cfg.maxOnBelt}`;
  els.beltCap.classList.toggle("full", S.belt.length >= S.cfg.maxOnBelt);
}

function buildBeltCap() {
  syncBeltCap();
}

/* ---------------- end conditions ---------------- */

function checkEnd() {
  if (S.phase !== "playing") return;
  const occupied = geo.stations.filter((s) => s.cust).length;
  // The level ends when the shift is over: target served and nobody left to seat —
  // leftover plates (e.g. a stormed-out order already on the belt) don't block the finish.
  if (S.served >= S.cfg.target && !customersRemain(S.rosterIdx, S.roster.length, occupied)) win();
  else if (S.served < S.cfg.target && S.angry >= 3) lose("angry");
}

function win() {
  S.phase = "won";
  best = Math.max(best, Math.min(LEVELS.length, S.level + 1));
  save();
  sfx("win");
  els.winTitle.textContent = S.level === LEVELS.length
    ? "🏆 You ran every restaurant the whole shift!"  
    : `${themeForLevel(S.level).emoji} Level ${S.level} complete!`;
  els.winStats.innerHTML = `Served <b>${S.served}</b> (target ${S.cfg.target}) · Angry <b>${S.angry}</b><br>Score <b>${S.score}</b>`;
  els.btnNext.textContent = S.level < LEVELS.length ? "Next level →" : "Back to menu";
  els.modalWin.classList.remove("hidden");
  updateHUD();
}

function lose(kind) {
  S.phase = "lost";
  sfx("lose");
  els.loseTitle.textContent = kind === "jam" ? "💥 Belt jam!" : "😡 Customers stormed out!";
  const reason = kind === "jam"
    ? "The belt filled up with dishes nobody ordered."
    : "Three customers ran out of patience.";
  els.loseStats.innerHTML = `Served <b>${S.served}</b> / ${S.cfg.target} · Score <b>${S.score}</b><br>${reason}`;
  els.modalLose.classList.remove("hidden");
  updateHUD();
}

/* ---------------- screens ---------------- */

function showStart() {
  S = null;
  els.screenStart.classList.remove("hidden");
  els.screenGame.classList.add("hidden");
  for (const m of [els.modalPause, els.modalWin, els.modalLose, els.modalHowto]) m.classList.add("hidden");
  buildLevelGrid();
}

function startLevel(n) {
  S = buildState(n);
  document.body.style.setProperty("--accent", S.theme.accent);
  els.screenStart.classList.add("hidden");
  els.screenGame.classList.remove("hidden");
  for (const m of [els.modalPause, els.modalWin, els.modalLose, els.modalHowto]) m.classList.add("hidden");
  els.beltItems.textContent = "";
  els.stations.textContent = "";
  buildGeo();
  buildBeltCap();
  geo.stations.forEach(makePod);
  for (let i = 0; i < 4; i++) spawnCustomer(); // four customers seated immediately
  for (let i = 0; i < 4; i++) updateLineUI(i);
  els.hudTheme.textContent = `${S.theme.emoji} Level ${n} · ${S.theme.name}`;
  updateHUD();
  fitBoard();
  sfx("start");
  last = performance.now();
}

function togglePause() {
  if (!S || (S.phase !== "playing" && S.phase !== "paused")) return;
  if (S.phase === "playing") {
    S.phase = "paused";
    els.modalPause.classList.remove("hidden");
  } else {
    S.phase = "playing";
    els.modalPause.classList.add("hidden");
    last = performance.now();
  }
}

function toggleMute() {
  muted = !muted;
  syncMute();
  save();
}

function syncMute() { els.btnMute.textContent = muted ? "🔇" : "🔊"; }

const PAGE_SIZE = 12;
let levelPage = 0;
let pageCount = 0;
let suppressClickUntil = 0; // set briefly after a drag so a swipe isn't read as a tile tap

function buildLevelGrid() {
  els.levelTrack.textContent = "";
  els.levelDots.textContent = "";
  pageCount = Math.ceil(LEVELS.length / PAGE_SIZE);
  levelPage = Math.max(0, Math.min(pageCount - 1, Math.floor((best - 1) / PAGE_SIZE)));
  for (let p = 0; p < pageCount; p++) {
    const pageEl = document.createElement("div");
    pageEl.className = "level-page";
    const from = p * PAGE_SIZE + 1;
    const to = Math.min(LEVELS.length, from + PAGE_SIZE - 1);
    for (let i = from; i <= to; i++) pageEl.appendChild(makeLevelTile(i));
    els.levelTrack.appendChild(pageEl);
    const dot = document.createElement("button");
    dot.className = "lvl-dot";
    dot.setAttribute("aria-label", `Page ${p + 1}`);
    dot.addEventListener("click", () => setLevelPage(p));
    els.levelDots.appendChild(dot);
  }
  setLevelPage(levelPage);
  els.bestLine.textContent = best >= LEVELS.length
    ? "All kitchens cleared — you run this town. 🏆"
    : `Levels cleared: ${best - 1} · next up Level ${best}`;
}

function makeLevelTile(i) {
  const t = document.createElement("button");
  const locked = i > best;
  t.className = "lvl-tile" + (locked ? " locked" : "") + (i === best ? " current" : "");
  t.innerHTML = i + `<small>${locked ? "🔒" : themeForLevel(i).emoji}</small>`;
  t.title = themeForLevel(i).name;
  t.addEventListener("click", () => {
    if (Date.now() < suppressClickUntil) return;
    if (i <= best) startLevel(i);
  });
  return t;
}

function setLevelPage(p) {
  levelPage = Math.max(0, Math.min(pageCount - 1, p));
  els.levelTrack.style.transform = `translateX(-${levelPage * 100}%)`;
  for (let i = 0; i < els.levelDots.children.length; i++) {
    els.levelDots.children[i].classList.toggle("active", i === levelPage);
  }
  els.lvlPrev.disabled = levelPage === 0;
  els.lvlNext.disabled = levelPage === pageCount - 1;
}

/* ---------------- misc UI ---------------- */

function popup(x, y, text, bad) {
  const d = document.createElement("div");
  d.className = "score-pop" + (bad ? " bad" : "");
  d.textContent = text;
  d.style.left = x + "px";
  d.style.top = y + "px";
  els.beltArea.appendChild(d);
  setTimeout(() => d.remove(), 900);
}

function beltNudge() {
  const el = els.beltArea;
  el.classList.remove("nudge");
  void el.offsetWidth;
  el.classList.add("nudge");
}

function lineNudge(i) {
  const el = els.lines.children[i];
  el.classList.remove("nudge");
  void el.offsetWidth;
  el.classList.add("nudge");
}

/* ---------------- audio ---------------- */

let actx = null;
function ensureAudio() {
  if (!actx) {
    try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { /* no audio */ }
  }
  if (actx && actx.state === "suspended") actx.resume();
}

function tone(freq, dur, type, vol, when, slide) {
  if (!actx || muted) return;
  const t0 = actx.currentTime + (when || 0);
  const o = actx.createOscillator(), g = actx.createGain();
  o.type = type || "sine";
  o.frequency.setValueAtTime(freq, t0);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol || 0.16, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g); g.connect(actx.destination);
  o.start(t0); o.stop(t0 + dur + 0.03);
}

function sfx(name) {
  if (muted || !actx) return;
  switch (name) {
    case "arrive": tone(520, 0.09, "sine", 0.1); break;
    case "dish": tone(600, 0.08, "triangle", 0.16, 0, 260); break;
    case "block": tone(170, 0.1, "square", 0.08); break;
    case "grab": tone(880, 0.07, "sine", 0.14); tone(1320, 0.1, "sine", 0.09, 0.06); break;
    case "serve": tone(660, 0.09, "triangle", 0.15); tone(990, 0.14, "triangle", 0.13, 0.09); break;
    case "angry": tone(140, 0.22, "sawtooth", 0.14, 0, -30); tone(110, 0.22, "sawtooth", 0.1, 0.12, -20); break;
    case "win": [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.16, "triangle", 0.15, i * 0.12)); break;
    case "lose": [400, 300, 220, 150].forEach((f, i) => tone(f, 0.2, "sawtooth", 0.1, i * 0.16, -40)); break;
    case "start": tone(440, 0.1, "triangle", 0.12); tone(660, 0.12, "triangle", 0.12, 0.1); break;
  }
}

/* ---------------- input ---------------- */

function bind() {
  els.btnPlay.addEventListener("click", () => startLevel(best));
  els.btnHowto.addEventListener("click", () => els.modalHowto.classList.remove("hidden"));
  els.btnMute.addEventListener("click", toggleMute);
  els.btnPause.addEventListener("click", (e) => { e.stopPropagation(); togglePause(); });
  els.btnQuit.addEventListener("click", showStart);
  els.btnResume.addEventListener("click", togglePause);
  els.btnNext.addEventListener("click", () => { S.level < LEVELS.length ? startLevel(S.level + 1) : showStart(); });
  els.btnRetry.addEventListener("click", () => { if (S) startLevel(S.level); });
  els.lvlPrev.addEventListener("click", () => setLevelPage(levelPage - 1));
  els.lvlNext.addEventListener("click", () => setLevelPage(levelPage + 1));

  // a horizontal swipe (mouse or touch) means "next/back page" — same as the arrow buttons
  let swipeStartX = null;
  els.levelPager.addEventListener("pointerdown", (e) => { swipeStartX = e.clientX; });
  const finishSwipe = (e) => {
    if (swipeStartX === null) return;
    const dx = e.clientX - swipeStartX;
    swipeStartX = null;
    if (Math.abs(dx) <= 10) return; // just a tap on a tile
    if (dx < 0) setLevelPage(levelPage + 1);
    else setLevelPage(levelPage - 1);
    suppressClickUntil = Date.now() + 300; // the swipe isn't a tile tap either
  };
  els.levelPager.addEventListener("pointerup", finishSwipe);
  els.levelPager.addEventListener("pointercancel", () => { swipeStartX = null; });

  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-close]");
    if (!el) return;
    const modal = $(el.dataset.close);
    if (modal) modal.classList.add("hidden");
    if (el.hasAttribute("data-restart")) {
      startLevel(S ? S.level : best);
    } else if (el.hasAttribute("data-menu")) {
      showStart();
    }
  });

  window.addEventListener("keydown", (e) => {
    if (e.repeat) return;
    const k = e.key.toLowerCase();
    if (k >= "1" && k <= "4") dish(Number(k) - 1);
    else if (k === "p") togglePause();
    else if (k === "m") toggleMute();
    else if (k === "r" && S) startLevel(S.level);
    else if (k === "enter") {
      if (!els.modalWin.classList.contains("hidden")) els.btnNext.click();
      else if (!els.modalLose.classList.contains("hidden")) els.btnRetry.click();
      else if (!els.modalHowto.classList.contains("hidden")) els.modalHowto.classList.add("hidden");
      else if (!els.modalPause.classList.contains("hidden")) togglePause();
    }
  });

  // rebuild geometry whenever the belt's box changes (window resize, fonts loading, dvh shifts)
  new ResizeObserver(() => { if (S && geo) { buildGeo(); fitBoard(); } }).observe(els.beltArea);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (S && geo) { buildGeo(); fitBoard(); } });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && S && S.phase === "playing") togglePause();
  });
  document.addEventListener("pointerdown", ensureAudio);
}

/* ---------------- persistence ---------------- */

function loadStore() {
  try {
    const s = JSON.parse(localStorage.getItem(STORE) || "{}");
    best = Math.max(1, Math.min(LEVELS.length, s.best || 1));
    muted = !!s.muted;
  } catch (e) { /* first run */ }
  syncMute();
}
function save() {
  try { localStorage.setItem(STORE, JSON.stringify({ best, muted })); } catch (e) { /* private mode */ }
}

/* ---------------- loop + boot ---------------- */

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
  last = now;
  if (S && S.phase === "playing") {
    S.time += dt;
    update(dt);
  }
  render();
  requestAnimationFrame(frame);
}

function buildLines() {
  els.lines.textContent = "";
  for (let i = 0; i < 4; i++) {
    const div = document.createElement("div");
    div.className = "line";
    const queue = document.createElement("div");
    queue.className = "queue";
    div.appendChild(queue);
    div.addEventListener("click", () => dish(i));
    els.lines.appendChild(div);
  }
}

/* demo hooks: ?demo= plays level 1 chaotically for screenshots;
   ?bot= plays level 1 "intelligently" (only dishes wanted dishes) as an end-to-end smoke test.
   ?sim=  same as bot but drives update() itself on a fixed 60Hz virtual clock — used by the
   headless verification run, since rAF timestamps don't advance under virtual-time-budget. */
function demoMode(bot, sim) {
  if (sim) { simMode(); return; }
  startLevel(1);
  if (bot) {
    setInterval(() => {
      if (!S || S.phase !== "playing") return;
      if (S.belt.length >= S.cfg.maxOnBelt) return;
      const want = activeWants();
      for (let i = 0; i < 4; i++) {
        const front = S.lines[i][0];
        if (front && want.has(front.type) && S.belt.length < S.cfg.maxOnBelt) { dish(i); return; }
      }
    }, 320);
  } else {
    setInterval(() => { if (S && S.phase === "playing") dish(randInt(0, 3)); }, 550);
  }
}

function simMode() {
  const lvl = Math.max(1, Math.min(50, parseInt(new URLSearchParams(location.search).get("lvl"), 10) || 1));
  startLevel(lvl);
  if (new URLSearchParams(location.search).has("testwin")) S.cfg.target = 1; // test aid: force a fast win
  const DT = 1 / 60;
  let ticks = 0;
  setInterval(() => {
    if (!S) return;
    if (S.phase === "playing") {
      S.time += DT;
      update(DT);
      const want = activeWants();
      const churn = new URLSearchParams(location.search).has("churn");
      if (S.belt.length < S.cfg.maxOnBelt) {
        for (let j = 0; j < 4; j++) {
          const front = S.lines[j][0];
          if (front && (churn || want.has(front.type))) { dish(j); break; }
        }
      }
    } else if (S.phase === "won" || S.phase === "lost") {
      clearInterval(this); // freeze at the end-state so headless dumps can inspect the overlay
      return;
    }
    render();
    if (++ticks > 60 * 60) clearInterval(this);
  }, 16);
  const probe = setInterval(() => {
    if (S) {
      const lined = S.lines.reduce((a, l) => a + l.length, 0);
      const seated = geo.stations.filter((s) => s.cust).length;
      document.title = `probe served=${S.served}/${S.cfg.target} angry=${S.angry} score=${S.score} belt=${S.belt.length} phase=${S.phase} seated=${seated} pool=${S.pool.length} lined=${lined}`;
    }
  }, 2000);
  setTimeout(() => clearInterval(probe), 60000);
}

function boot() {
  loadStore();
  buildLines();
  buildLevelGrid();
  bind();
  const params = new URLSearchParams(location.search);
  const sim = params.has("sim");
  if (!sim) requestAnimationFrame(frame);
  if (params.has("demo") || params.has("bot") || sim) demoMode(params.has("bot"), sim);
}

boot();