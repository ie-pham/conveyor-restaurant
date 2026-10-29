/* game-core.js — pure config + logic. Loaded by both the browser game and
 * the node test suite (exposed on globalThis, no DOM dependencies). */
(function () {
  "use strict";

  const THEMES = [
    { name: "Sushi Bar", emoji: "🍣", accent: "#2dd4bf",
      items: ["🍣", "🍙", "🍱", "🍤", "🥟", "🍥", "🍘", "🐙", "🦐", "🍢"] },
    { name: "Taco Stand", emoji: "🌮", accent: "#fb923c",
      items: ["🌮", "🌯", "🥙", "🥗", "🌽", "🍟", "🍗", "🫘", "🧀", "🥑"] },
    { name: "Pizza Parlor", emoji: "🍕", accent: "#f87171",
      items: ["🍕", "🍝", "🥖", "🍗", "🥗", "🍟", "🥨", "🍦", "🍪", "🥤"] },
    { name: "Ramen House", emoji: "🍜", accent: "#86efac",
      items: ["🍜", "🥟", "🍤", "🍗", "🍛", "🍚", "🍥", "🍵", "🥚", "🍘"] }
  ];

  // Levels are pre-generated data (tools/generate-levels.js -> levels-data.js):
  // every level is a fixed, known deck — same orders every playthrough.
  const RAW = globalThis.BELT_BITE_LEVELS || [];
  const LEVELS = RAW.map((l, i) => ({
    level: i + 1,
    menuItems: l.menuItems,
    target: l.target,
    patience: l.patience,
    beltSpeed: l.beltSpeed,
    refillMs: l.refillMs,
    maxOnBelt: l.maxOnBelt,
    qtyMax: l.qtyMax
  }));

  // The fixed customer lineup for a level (target to serve + angry slack).
  function levelRoster(level) {
    const l = RAW[level - 1];
    return l ? l.roster.map(([type, qty]) => ({ type, qty })) : [];
  }

  function randInt(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function choice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function themeForLevel(level) { return THEMES[(level - 1) % THEMES.length]; }

  function menuForLevel(level) {
    return themeForLevel(level).items.slice(0, LEVELS[level - 1].menuItems);
  }

  // Kitchen stock: exactly a roster's orders, in roster order (each customer's
  // items are a contiguous chunk, tagged with which customer they were booked for).
  function makePool(roster) {
    const pool = [];
    roster.forEach((c, src) => {
      for (let i = 0; i < c.qty; i++) pool.push({ type: c.type, src });
    });
    return pool;
  }

  function poolTypeCounts(pool) {
    const m = new Map();
    for (const t of pool) m.set(t.type, (m.get(t.type) || 0) + 1);
    return m;
  }

  // True when the belt is at capacity and NONE of its items match an active want.
  function beltJammed(belt, wants, maxOnBelt) {
    if (belt.length < maxOnBelt) return false;
    const want = new Set(wants.filter(Boolean));
    if (want.size === 0) return false; // nobody seated; not a jam, just quiet
    return belt.every((item) => !want.has(item.type));
  }

  // The shift is over when the customer book is empty and no one is seated anymore —
  // leftover plates (e.g. a stormed-out order already circling) must never block the finish.
  function customersRemain(rosterIdx, rosterLen, occupiedSeats) {
    return rosterIdx < rosterLen || occupiedSeats > 0;
  }

  // Sanity checks over the level table; returns array of issue strings.
  // Levels are one per theme, all hard (full 10-item menu, demands up to 10, 45 customers).
  function verifyLevels() {
    const issues = [];
    if (LEVELS.length !== 4) issues.push("need exactly 4 levels (one per theme)");
    let prev = null;
    for (const l of LEVELS) {
      if (prev && l.level !== prev.level + 1) issues.push(`level numbers not sequential: ${l.level}`);
      if (l.menuItems !== 10) issues.push(`L${l.level} menuItems ${l.menuItems}`);
      if (l.qtyMax !== 10) issues.push(`L${l.level} qtyMax ${l.qtyMax}`);
      if (l.target !== 60) issues.push(`L${l.level} target ${l.target}`);
      if (l.patience < 15 || l.patience > 110) issues.push(`L${l.level} patience ${l.patience}`);
      if (l.maxOnBelt !== 35) issues.push(`L${l.level} maxOnBelt ${l.maxOnBelt}`);
      if (l.beltSpeed < 60 || l.beltSpeed > 220) issues.push(`L${l.level} beltSpeed ${l.beltSpeed}`);
      if (l.refillMs < 1500 || l.refillMs > 2600) issues.push(`L${l.level} refillMs ${l.refillMs}`);
      if (prev) {
        if (l.patience > prev.patience) issues.push(`L${l.level} patience not decreasing`);
        if (l.beltSpeed < prev.beltSpeed) issues.push(`L${l.level} beltSpeed not increasing`);
        if (l.refillMs > prev.refillMs) issues.push(`L${l.level} refillMs not decreasing`);
      }
      // deck validation: fixed roster fits its level and the kitchen stock is exact
      const roster = levelRoster(l.level);
      const menu = new Set(menuForLevel(l.level));
      if (roster.length !== l.target + 2) issues.push(`L${l.level} roster size ${roster.length}`);
      const totals = new Map();
      for (const c of roster) {
        if (!menu.has(c.type)) issues.push(`L${l.level} roster type not on menu: ${c.type}`);
        if (c.qty < 1 || c.qty > l.qtyMax) issues.push(`L${l.level} roster qty ${c.qty}`);
        totals.set(c.type, (totals.get(c.type) || 0) + c.qty);
      }
      const deckTotal = [...totals.values()].reduce((a, b) => a + b, 0);
      if (deckTotal < 24) issues.push(`L${l.level} deck too small to fill 4 kitchen lines: ${deckTotal}`);
      const pool = poolTypeCounts(makePool(roster));
      for (const [t, n] of totals) {
        if (pool.get(t) !== n) issues.push(`L${l.level} deck mismatch for ${t}`);
      }
      prev = l;
    }
    return issues;
  }

  globalThis.GameCore = {
    THEMES,
    LEVELS,
    themeForLevel,
    menuForLevel,
    beltJammed,
    customersRemain,
    levelRoster,
    makePool,
    poolTypeCounts,
    randInt,
    choice,
    verifyLevels
  };
})();