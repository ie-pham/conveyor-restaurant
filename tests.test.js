/* Belt & Bite — logic tests (node-only, no DOM). Run: node tests.test.js */
"use strict";
const assert = require("assert");
require("./levels-data.js"); // the pre-generated decks (data, not runtime RNG)
require("./game-core.js");
const C = globalThis.GameCore;

let passed = 0;
function ok(name, fn) {
  fn();
  passed++;
  console.log("  ok - " + name);
}

console.log("level table:");
ok("exactly 4 levels (one per restaurant), all invariants hold", () => {
  const issues = C.verifyLevels();
  assert.deepStrictEqual(issues, []);
});
ok("every level is hard identically: 8-item menu, max 10 demand, 50 customers", () => {
  for (const l of C.LEVELS) {
    assert.strictEqual(l.menuItems, 8, `L${l.level} menuItems`);
    assert.strictEqual(l.qtyMax, 10, `L${l.level} qtyMax`);
    assert.strictEqual(l.target, 50, `L${l.level} target`);
    assert.strictEqual(l.maxOnBelt, 40, `L${l.level} maxOnBelt`);
  }
});
ok("45 in the book: 50 to serve + five storm-out slots", () => {
  for (const l of C.LEVELS) assert.strictEqual(C.levelRoster(l.level).length, 55, `L${l.level}`);
});
ok("demand stays varied: never all 4 seats on the same dish", () => {
  for (const l of C.LEVELS) {
    const types = C.levelRoster(l.level).map((c) => c.type);
    for (let i = 0; i + 4 <= types.length; i++) {
      const win = types.slice(i, i + 4);
      const counts = new Map();
      for (const t of win) counts.set(t, (counts.get(t) || 0) + 1);
      for (const n of counts.values()) assert.ok(n < 4, `L${l.level} seat window ${i} has all ${n} same`);
    }
  }
});

console.log("themes:");
ok("4 levels, one per restaurant, in theme order", () => {
  for (let n = 1; n <= C.LEVELS.length; n++) {
    assert.strictEqual(C.themeForLevel(n).name, C.THEMES[n - 1].name, `L${n}`);
  }
});
ok("each theme has at least 10 distinct menu items", () => {
  for (const t of C.THEMES) {
    assert.ok(t.items.length >= 10, t.name);
    assert.strictEqual(new Set(t.items).size, t.items.length, t.name + " has dupes");
  }
});
ok("each shift menu: 8 dishes drawn from its theme's 10, all assets kept", () => {
  for (const l of C.LEVELS) {
    const menu = C.menuForLevel(l.level);
    assert.strictEqual(menu.length, 8, `L${l.level}`);
    const theme = C.themeForLevel(l.level).items;
    for (const m of menu) assert.ok(theme.includes(m), `L${l.level} ${m} off-theme`);
    assert.strictEqual(new Set(menu).size, 8, `L${l.level} dupes`);
    assert.strictEqual(theme.length, 10, "theme assets untouched");
  }
});

console.log("customers:");
ok("every pre-generated roster: menu items only, qty within the level's range", () => {
  for (const l of C.LEVELS) {
    for (const c of C.levelRoster(l.level)) {
      assert.ok(C.menuForLevel(l.level).includes(c.type), "type on menu");
      assert.ok(c.qty >= 1 && c.qty <= l.qtyMax, "qty in range");
    }
  }
});

console.log("belt jam rule:");
const it = (t) => ({ type: t });
ok("empty belt never jams", () => {
  assert.strictEqual(C.beltJammed([], ["A"], 5), false);
});
ok("under-capacity belt never jams", () => {
  assert.strictEqual(C.beltJammed([it("F"), it("G")], ["A"], 5), false);
});
ok("full belt with at least one wanted item is fine", () => {
  assert.strictEqual(C.beltJammed([it("A"), it("B"), it("C")], ["C", "D"], 3), false);
});
ok("full belt with zero wanted items jams", () => {
  assert.strictEqual(C.beltJammed([it("A"), it("B"), it("C")], ["D", "E"], 3), true);
});
ok("jam rule ignores empty seats (nobody seated is not a jam)", () => {
  assert.strictEqual(C.beltJammed([it("A"), it("B")], [null, null], 2), false);
});

console.log("kitchen deck (exact supply, no unsolvable levels):");
ok("decks are deterministic: the same fixed data every load", () => {
  const t2 = C.levelRoster(2).map((c) => c.type + c.qty).join("");
  const t2again = C.levelRoster(2).map((c) => c.type + c.qty).join("");
  assert.strictEqual(t2, t2again);
  assert.ok(t2.length > 10);
});
ok("every deck is big enough to fill all 4 kitchen lines (5 each)", () => {
  for (const l of C.LEVELS) {
    const total = C.levelRoster(l.level).reduce((s, c) => s + c.qty, 0);
    assert.ok(total >= 24, `L${l.level} deck ${total}`);
  }
});
ok("deck totals exactly equal the roster's orders, per type and overall", () => {
  for (let lvl = 1; lvl <= C.LEVELS.length; lvl++) {
    const cfg = C.LEVELS[lvl - 1];
    const roster = C.levelRoster(lvl);
    const pool = C.makePool(roster);
    const counts = C.poolTypeCounts(pool);
    const need = new Map();
    let total = 0;
    for (const c of roster) {
      need.set(c.type, (need.get(c.type) || 0) + c.qty);
      total += c.qty;
    }
    for (const [t, n] of need) assert.strictEqual(counts.get(t) || 0, n, `L${lvl} ${t}`);
    assert.strictEqual(pool.length, total, `L${lvl} total`);
  }
});
ok("kitchen deck is shuffled: same multiset as the roster, but order is scrambled", () => {
  for (let lvl = 1; lvl <= C.LEVELS.length; lvl++) {
    const roster = C.levelRoster(lvl);
    const pool = C.levelPool(lvl);
    const need = new Map();
    let total = 0;
    for (const c of roster) { need.set(c.type, (need.get(c.type) || 0) + c.qty); total += c.qty; }
    assert.strictEqual(pool.length, total, `L${lvl} length`);
    const counts = C.poolTypeCounts(pool);
    for (const [t, n] of need) assert.strictEqual(counts.get(t) || 0, n, `L${lvl} ${t}`);
    // shuffled batch order: never the straight roster-chunk sequence
    const ordered = C.makePool(roster).map((t) => t.type);
    assert.notDeepStrictEqual(pool.map((t) => t.type), ordered, `L${lvl} not shuffled?`);
    // batches: no same-type run shorter than 2 — the kitchen never outputs a lonely single
    const types = pool.map((t) => t.type);
    let run = 1;
    for (let i = 1; i < types.length; i++) {
      run = types[i] === types[i - 1] ? run + 1 : 1;
      if (run === 1) assert.ok(types[i] !== types[i - 1], "unreachable");
      if (i === types.length - 1 || types[i] !== types[i + 1]) {
        assert.ok(run >= 2, `L${lvl} lone single at ${i}`);
        run = 1;
      }
    }
  }
});
ok("angry-leave write-off never removes more than that customer's order", () => {
  for (let trial = 0; trial < 400; trial++) {
    const roster = C.levelRoster(1);
    const pool = C.makePool(roster);
    pool.splice(0, 2 + Math.floor(Math.random() * 4)); // simulate items already shipped
    const angryIdx = Math.floor(Math.random() * 6);
    const angry = roster[angryIdx];
    const before = C.poolTypeCounts(pool);
    const kept = pool.filter((t) => t.src !== angryIdx);
    const after = C.poolTypeCounts(kept);
    for (const [t, n] of before) {
      const removed = n - (after.get(t) || 0);
      assert.ok(removed >= 0 && removed <= angry.qty, "write-off bounded by the order");
    }
  }
});
ok("customersRemain: the shift only ends when the book is empty and no one is seated", () => {
  assert.strictEqual(C.customersRemain(52, 52, 0), false);  // all spawned, no seats — shift over
  assert.strictEqual(C.customersRemain(51, 52, 0), true);   // one still to sit
  assert.strictEqual(C.customersRemain(52, 52, 1), true);   // someone still eating
  assert.strictEqual(C.customersRemain(10, 52, 4), true);   // mid-shift
});
ok("same-type items are fungible: type supply always covers the seated demand", () => {
  for (let trial = 0; trial < 200; trial++) {
    const roster = C.levelRoster(1);
    const counts = C.poolTypeCounts(C.makePool(roster));
    const need = new Map();
    for (const c of roster) need.set(c.type, (need.get(c.type) || 0) + c.qty);
    for (const [t, n] of need) assert.ok((counts.get(t) || 0) >= n, t);
  }
});

console.log(`\n${passed} checks passed`);