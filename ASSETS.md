# Belt & Bite — Art Asset Guide

Hand this to whoever generates the game art. Everything is a **drop-in replacement**: the
game loads sprites by emoji codepoint from `img/`, so replacing a file upgrades the game with
**zero code changes**.

---

## File naming (the rule that makes it drop-in)

Every emoji maps to a codepoint string (lowercase hex, `-` between codepoints, no `U+FE0F`).
The game looks up:

| Sprite type | Path | Example |
|---|---|---|
| Food dishes | `img/food/{codepoint}.png` | 🍣 → `img/food/1f363.png` |
| Customer faces | `img/{codepoint}.png` | 👨‍🍳 → `img/1f468-200d-1f373.png` |

So: generate → save with the right filename → done.

Current files: food set lives in `img/food/` (30 dishes). Faces live in `img/` (twemoji PNGs).
The exact expected file list can be produced with: `ls img/food` and `ls img | grep -v food`.

---

## Master style block

Paste at the top of **every** prompt so all output shares one look:

```
— Subject isolated on a transparent background, centered, square 1:1 canvas, 1024x1024.
— Cartoon style: bold clean outlines, soft cel shading, rounded friendly shapes, glossy candy colors
  (warm pink, coral, sunflower, mint, sky blue), consistent flat lighting, no photorealism, no ground
  shadows, no text, no watermark, no legs or lower body.
```

---

## Customers — cartoon characters, upper body only

Template (swap the brackets):

```
[Character description], a cartoon restaurant character, waist-up ONLY — head, shoulders, upper body,
wearing [clothing], big friendly eyes, rosy cheeks, cheerful expression, thick outlines, glossy candy
palette from the style block.
```

Suggested cast:
1. Friendly female sushi chef — teal apron, hair bun, headband
2. Cheerful male server — big mustache, sunflower-yellow polo
3. Smiling grandpa — round glasses, mint-green cardigan
4. Excited kid — messy bowl cut, strawberry-pink tee
5. Gentle grandma — pearl necklace, soft lavender sweater
6. Hip young customer — slicked-back hair, sky-blue bomber
7. Grumpy-but-lovable — thick eyebrows, orange hoodie
8. Cheerful service manager — name badge, lemon-yellow hat

> Tip: a single "8 waist-up characters in a row" character sheet can be sliced into 8 files.

---

## Food — realistic dishes

```
Realistic appetizing photo of [dish], centered, transparent background (or solid dark #26262e if the
model can't do alpha), studio lighting, high detail, slight gloss, vibrant colors, no plate, no
cutlery, no hands, square 1:1.
```

| Emoji | Filename | Dish |
|---|---|---|
| 🍣 | `1f363` | nigiri rolls — pink salmon, white rice |
| 🍙 | `1f359` | onigiri rice ball wrapped in nori |
| 🍱 | `1f371` | bento box, assorted sushi & sides |
| 🍤 | `1f364` | golden fried shrimp tempura |
| 🥟 | `1f95f` | crispy gyoza dumplings |
| 🍥 | `1f365` | narutomaki fish cake, pink spiral |
| 🍘 | `1f358` | senbei rice cracker |
| 🐙 | `1f419` | octopus |
| 🦐 | `1f990` | fresh prawn |
| 🍢 | `1f362` | glazed eel skewer (kabayaki) |
| 🌮 | `1f32e` | loaded hard-shell taco |
| 🌯 | `1f32f` | burrito, cut in half |
| 🥙 | `1f96d` | quesadilla wedge with dip |
| 🥗 | `1f957` | fresh side salad bowl |
| 🌽 | `1f33d` | grilled elote corn |
| 🍟 | `1f35f` | fries in a paper cup |
| 🍗 | `1f357` | glazed chicken leg |
| 🫘 | `1fad8` | beans in a clay pot |
| 🧀 | `1f9c0` | melted nachos |
| 🥑 | `1f951` | guacamole bowl with lime |
| 🍕 | `1f355` | pepperoni pizza slice |
| 🍝 | `1f35d` | spaghetti with tomato sauce |
| 🥖 | `1f956` | warm baguette |
| 🥨 | `1f968` | salt-topped pretzel |
| 🍦 | `1f366` | soft-serve sundae with sprinkles |
| 🍪 | `1f36a` | chocolate chip cookie |
| 🥤 | `1f964` | soda cup with straw |
| 🍜 | `1f35c` | steaming ramen bowl |
| 🥚 | `1f95a` | soft-boiled egg, cut open |

---

## Integration notes

- **Transparency**: if the model can't do alpha, generate food on solid `#26262e` (the kitchen's
  dark chip color) — it blends straight in. For the belt/stations, tell Sara and she'll add a
  matching dark panel behind items.
- **Margins**: icons display at ~30px — leave generous padding so nothing clips when scaled down.
- **Vivification filter**: the game applies `saturate(1.5) contrast(1.25)` to sprites. If the art
  is already vivid, ask Sara to dial the filter back.
- **Replacing the current set**: the OpenMoji files in `img/food/` are the ones being replaced;
  they're referenced nowhere else, so deleting or overwriting them is safe.

## Status

- [x] Food sprites generated & placed in `img/food/` (32 files — game also uses 🍛🍚🍵; 🥙 is `1f959`, not `1f96d`)
- [x] Customer characters generated & placed in `img/` (8 faces, wired by existing codepoints)
- [ ] Repeat art reviewed in `preview-icons.html`
- [ ] License note updated in `README.md` if the new art isn't OpenMoji
