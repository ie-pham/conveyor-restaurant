# Belt & Bite 🍽️

A tiny conveyor-belt restaurant game. No build step — open `index.html` in a browser and play.

## How to run

- **Double-click `index.html`** (or `open index.html`), or
- `python3 -m http.server 8000` and visit `http://localhost:8000` (any static server works)

## How to play

- Four customers sit at a looping belt. Each wants a set amount of **one** dish.
- You're the server. The kitchen has **4 lines of dishes in random order** — tap a line
  (or press `1`–`4`) and its front dish pops onto the belt at the delivery mouth.
- The belt loops forever. A dish is served when it passes a customer who ordered it;
  anything else just keeps rolling around.
- Customers have patience bars. An empty bar means they storm out — **5 angry customers = game over**.
- The belt holds a max number of dishes. If it's full and **none of the dishes match what
  anyone wants**, the belt jams and you lose (a short warning gives a new customer's order
  a chance to save you).
- Serve the daily target (50 customers) to clear a level, then the theme changes:
  sushi → tacos → pizza → ramen, cycling every level.
- 50 levels. Guests can demand up to 10 of a single dish at the top levels, and the belt
  capacity limit grows proportionally (2 slots per possible demanded item + 2, capped at 20).
- Every level is a **fixed, pre-generated puzzle**: the customer orders (and thus the
  kitchen's entire supply) are the same every playthrough, and the kitchen only ever makes
  exactly what its roster orders. Play it clean and the last dish is eaten as you finish.

Controls: `1–4` dish · `P` pause · `M` mute · `R` restart level · `Enter` advance dialogs

## Files

| file | purpose |
|------|---------|
| `index.html` | markup + dialogs |
| `style.css` | theming (accent color swaps per restaurant) |
| `game-core.js` | pure rules + data loader (shared with tests) |
| `levels-data.js` | pre-generated level decks (do not edit by hand) |
| `tools/generate-levels.js` | regenerates level decks — `node tools/generate-levels.js` |
| `game.js` | engine: belt simulation, customers, jam rule, audio |
| `tests.test.js` | node logic tests — `node tests.test.js` |

`?demo` in the URL auto-plays level 1 (handy for screenshots). `?sim=1&lvl=N` runs a bot at a level; add `&churn=1` for a bot that dishes everything.

## Art & assets

- Dish icons and the 8 customer faces: original vector art drawn for this game
  (`node tools/generate-art.js` regenerates `img/food/` and the face PNGs; needs `rsvg-convert`).
  Judge against `preview-icons.html`.
- Other UI glyphs: **Twemoji** graphics by Twitter/X, Inc and contributors, licensed under
  **CC-BY 4.0** (bundled locally under `img/`; regenerate with `node tools/fetch-assets.js`).
- Fonts: [Fredoka](https://fonts.google.com/specimen/Fredoka) (OFL) via Google Fonts, with system fallbacks.