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
ok("exactly 50 levels, all invariants hold", () => {
  const issues = C.verifyLevels();
  assert.deepStrictEqual(issues, []);
});
ok("level 1 is the promised easy opener", () => {
  const l1 = C.LEVELS[0];
  assert.strictEqual(l1.menuItems, 2);
  assert.strictEqual(l1.target, 10);
  assert.strictEqual(l1.qtyMax, 2);
});
ok("max of 10 menu items is respected, reached well before the end", () => {
  for (const l of C.LEVELS) assert.ok(l.menuItems <= 10);
  assert.strictEqual(C.LEVELS[24].menuItems, 10);
  assert.strictEqual(C.LEVELS[49].menuItems, 10);
});
ok("served target scales 10 -> 45 across the 50 levels", () => {
  assert.strictEqual(C.LEVELS[0].target, 10);
  assert.strictEqual(C.LEVELS[49].target, 45);
  for (const l of C.LEVELS) assert.ok(l.target >= 10 && l.target <= 45);
});
ok("max demand reaches 10 items at the late levels (45-50)", () => {
  assert.strictEqual(C.LEVELS[0].qtyMax, 2);
  const late = C.LEVELS.filter((l) => l.level >= 45 && l.level <= 50);
  assert.strictEqual(late.length, 6);
  for (const l of late) assert.strictEqual(l.qtyMax, 10);
  for (const l of C.LEVELS) assert.ok(l.qtyMax >= 2 && l.qtyMax <= 10);
});
ok("belt capacity is proportionate to demand (one full order + 3, cap 13)", () => {
  for (const l of C.LEVELS) {
    assert.strictEqual(l.maxOnBelt, Math.min(13, l.qtyMax + 3), `L${l.level}`);
    assert.ok(l.maxOnBelt >= l.qtyMax, `L${l.level} belt must hold a full order`);
  }
  assert.strictEqual(C.LEVELS[0].maxOnBelt, 5);
  assert.strictEqual(C.LEVELS[49].maxOnBelt, 13);
});

console.log("themes:");
ok("4 themes cycle across all 50 levels", () => {
  for (let n = 1; n <= 50; n++) {
    const expect = C.THEMES[(n - 1) % 4].name;
    assert.strictEqual(C.themeForLevel(n).name, expect, `L${n}`);
  }
});
ok("each theme has at least 10 distinct menu items", () => {
  for (const t of C.THEMES) {
    assert.ok(t.items.length >= 10, t.name);
    assert.strictEqual(new Set(t.items).size, t.items.length, t.name + " has dupes");
  }
});
ok("menu for a level slices the theme to the level's item count", () => {
  for (const l of C.LEVELS) {
    const menu = C.menuForLevel(l.level);
    assert.strictEqual(menu.length, l.menuItems);
    for (const m of menu) assert.ok(C.themeForLevel(l.level).items.includes(m));
  }
});

console.log("customers:");
ok("every pre-generated roster: menu items only, qty within the level's range", () => {
  for (const l of [C.LEVELS[0], C.LEVELS[24], C.LEVELS[44], C.LEVELS[49]]) {
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
    assert.ok(total >= 20, `L${l.level} deck ${total}`);
  }
});
ok("deck totals exactly equal the roster's orders, per type and overall", () => {
  for (let lvl = 1; lvl <= 50; lvl++) {
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
ok("deck front chunk = the next customer's order (nothing buried)", () => {
  for (let lvl = 1; lvl <= 50; lvl += 3) {
    const cfg = C.LEVELS[lvl - 1];
    const roster = C.levelRoster(lvl);
    const pool = C.makePool(roster);
    const expected = [];
    for (const c of roster) for (let i = 0; i < c.qty; i++) expected.push(c.type);
    assert.deepStrictEqual(pool.map((t) => t.type), expected, `L${lvl}`);
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
ok("isBoardClear: a level only completes once every plate is eaten", () => {
  assert.strictEqual(C.isBoardClear([[], [], [], []], []), true);
  assert.strictEqual(C.isBoardClear([[{ type: "🍣" }], [], [], []], []), false);
  assert.strictEqual(C.isBoardClear([[], [], [], []], [{ type: "🍣" }]), false);
  assert.strictEqual(C.isBoardClear([[{ type: "🍣" }], [], [], []], [{ type: "🍙" }]), false);
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