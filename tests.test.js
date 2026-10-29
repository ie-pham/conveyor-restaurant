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
ok("every level is hard identically: 10-item menu, max 10 demand, 45 customers", () => {
  for (const l of C.LEVELS) {
    assert.strictEqual(l.menuItems, 10, `L${l.level} menuItems`);
    assert.strictEqual(l.qtyMax, 10, `L${l.level} qtyMax`);
    assert.strictEqual(l.target, 45, `L${l.level} target`);
    assert.strictEqual(l.maxOnBelt, 13, `L${l.level} maxOnBelt`);
  }
});
ok("a long shift: 45 customers per level leaves room for two storm-outs", () => {
  for (const l of C.LEVELS) assert.strictEqual(C.levelRoster(l.level).length, 47, `L${l.level}`);
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
ok("menu for a level slices the theme to the level's item count", () => {
  for (const l of C.LEVELS) {
    const menu = C.menuForLevel(l.level);
    assert.strictEqual(menu.length, l.menuItems);
    for (const m of menu) assert.ok(C.themeForLevel(l.level).items.includes(m));
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
    assert.ok(total >= 20, `L${l.level} deck ${total}`);
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
ok("deck front chunk = the next customer's order (nothing buried)", () => {
  for (let lvl = 1; lvl <= C.LEVELS.length; lvl++) {
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