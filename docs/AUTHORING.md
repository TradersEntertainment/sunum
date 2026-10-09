# Authoring slides

This is how slides in this presentation are built. Read it before adding or changing a slide.
`js/slides/30-heaps.js` is the reference implementation: copy its patterns.

## How the page loads
- `index.html` loads classic `<script>` files in order: core, algorithms, views, slides, notes. There are no ES modules, so it also works from `file://`.
- Wrap every file in an IIFE (`(function () { 'use strict'; … })();`). Classic scripts share one global scope, so a stray top-level `const` in two files breaks the second file.
- These globals are available:

| Global | Purpose |
|---|---|
| `Deck` | Slide registry and navigation |
| `Anim` | Tweens |
| `U` | DOM helpers |
| `L` | Bilingual text |
| `I18n` | Language state |
| `FX` | Bursts and ripples |
| `Viz` | Captions, tables, SVG text, arrows, stamps, legend |
| `CodeView` | Pseudocode panel |
| `HeapScene` | Heap tree + array scene |
| `Algo.*` | Pure algorithm modules |

## The stage
- Everything is laid out on a fixed **1920×1080 stage** that is scaled to the screen. Use plain px values.
- A slide's content goes in `.slide-body`, which is about **1700 px wide × 750 px tall**. Position things absolutely inside it (`left/top` from 0,0).
- Nothing may stick out of the stage. The progress bar sits below the body.
- Readability on a projector:
  - Body text ≥ 26 px.
  - Labels ≥ 20 px.
  - Keys in tree nodes ≥ 34 px.
- Turkish text runs about 20% longer than English, so leave slack.

## Declaring a slide
```js
Deck.add({
  id: 'gauss',                 // unique, a-z0-9-
  act: 'simplify',             // see "Acts and colours" below
  title: { en: 'Gaussian elimination', tr: 'Gauss eliminasyonu' },
  steps: 3,                    // number of clicks on this slide
  bare: false,                 // true = no automatic eyebrow + title header
  transition: 'wipe',          // or 'zoom' (section intros) / 'fade'
  html: `…markup…`,            // goes inside .slide-body
  init(ctx) { … },             // build the scene in its step-0 state (synchronous is best)
  async step(n, ctx) { … },    // animate from state n-1 to state n (n = 1..steps)
  enter(ctx) { … },            // optional: start ambient loops
  leave(ctx) { … },            // optional
});
```
- **`ctx`** holds:

  | Field | What it is |
  |---|---|
  | `ctx.el` | The slide `<section>` |
  | `ctx.$(sel)` / `ctx.$$(sel)` | Queries inside the slide |
  | `ctx.data` | A free object for your scene |
  | `ctx.step` | The current step |
  | `ctx.loop(fn)` | Ambient loop, described below |

- **Fragments need no JS.** Give an element `data-step="n"` and it appears at click n.
  - `data-anim="fade|zoom|pop|left|right|blur"` changes how it appears; the default is rise + fade.
  - `data-hide="n"` hides it at click n.
  - `data-in="up|left|right|zoom|pop|fade|blur"` animates it in when the slide is entered.
  - Stagger with `style="--d:200ms"`.
- **SVG strokes can draw themselves.** Add `pathLength="1" data-draw`, together with `data-step` or on its own for entrance.

## Determinism rules (important)
Going back a step or jumping to a slide **rebuilds the slide from scratch**. It runs `init`, then `step(1..k)` in *instant mode*, where every `Anim` tween and wait finishes immediately. So:

1. All motion uses `Anim.to / Anim.run / Anim.wait / Anim.tween / Anim.stagger / Viz.draw`. Never use `setTimeout`, `setInterval` or a raw `requestAnimationFrame` inside `init`/`step`.
2. Never use `Math.random()`. Use fixed data, or `U.shuffle(arr, seed)`.
3. Compute positions from your own model, not from `getBoundingClientRect()`.
4. Effects that only decorate are fine (`FX.burst`, `FX.ripple`), but guard them with `if (!Anim.isInstant())`.
5. Whatever `step(n)` leaves behind (classes, transforms, text) must be the same whether it was animated or replayed instantly. Don't leave timers pending.
6. CSS transitions on class toggles are fine. The deck turns them off during rebuilds.

## Ambient loops
```js
enter(ctx) { ctx.loop(async (A) => { await A.to(el, {rot: 360}, {dur: 4000}); Anim.set(el, {rot: 0}); }); }
```
- Use only `A.to / A.wait / A.run` inside, which are ambient tweens that ignore instant mode.
- Mark looping elements with `data-ambient`.
- Never let a loop and a `step()` animate the same element.

## Anim cheat sheet
- **`Anim.set(el, {x, y, scale, rot, opacity})`** sets a transform instantly. It works for HTML and SVG.
- **`await Anim.to(el, {x, y, scale, rot, opacity}, {dur, delay, ease, arc})`** animates.
  - `ease` is one of `'inOut'` (default), `'out'`, `'in'`, `'outBack'`, `'outElastic'`, `'linear'`, `'inOutSine'`.
  - `arc: px` bends the path, which is good for swaps (use opposite signs for the two items).
- **`await Anim.run(p => …, {dur, ease})`** gives you progress p from 0 to 1 for anything else: counters, clip-paths, attributes.
- **`await Anim.wait(ms)`** pauses. **`Anim.stagger(list, (item, i, delay) => Anim.to(…, {delay}), gapMs)`** staggers.
- **`Viz.draw(path)`** animates an SVG path drawing itself. Create hidden arrows with `Viz.hiddenPath({d, class, 'marker-end': 'url(#arrow-cmp)'})`.
  - Arrowhead marker ids: `arrow-line`, `arrow-ink`, `arrow-muted`, `arrow-ok`, `arrow-bad`, `arrow-cmp`, `arrow-swap`, `arrow-star`, `arrow-simplify`, `arrow-represent`, `arrow-reduce`.
- **`FX.count(el, from, to, {dur})`** counts up a number. **`FX.burst(x, y)`** and **`FX.ripple(x, y, '--ok')`** take stage coordinates.

## Bilingual text
- Every visible string goes through **`L('English', 'Türkçe')`**, which returns paired `<span lang>` elements.
- In SVG use **`Viz.text(parent, x, y, en, tr, attrs)`**.
- Write Turkish naturally, the way a Turkish CS student would say it. Keep the English technical terms students use (heap, array, AVL, 2-3 tree, pivot). Use correct characters: ç ğ ı İ ö ş ü.
- Numbers use a real minus sign (U.num(-3) → −3).

## Visual language
- **Colour tokens.** Use `var(--…)` only, never hex:

  | Group | Tokens |
  |---|---|
  | Text | `--ink`, `--ink-2`, `--muted` |
  | Lines | `--line` (blueprint blue) |
  | Panels | `--panel`, `--panel-border` |
  | Nodes | `--node-fill`, `--node-stroke`, `--node-text` |

- **Acts and colours:**
  - `simplify` (teal `--simplify`): presorting, Gauss, BST problem, AVL.
  - `represent` (violet `--represent`): 2-3 trees, heaps (the heap act uses `heap`, gold `--star`), Horner, binary exponentiation.
  - `reduce` (amber `--reduce`): reduction, lcm/gcd, counting paths.
  - `opening`, `closing`, `appendix`: neutral.
  - Inside a slide, `var(--act)` is that slide's act colour.
- **State colours** are the same everywhere:
  - `--cmp`: sky blue, "looking at / comparing".
  - `--swap`: magenta, "moving".
  - `--ok`: green, "correct / done / sorted".
  - `--bad`: red, "violation".

  Every state also gets a shape cue (✓/✗ stamp, dashed ring, lock), so it never depends on colour alone. Tree-node classes: `.node.cmp|swap|ok|bad|focus|dim|sorted|max|new` (see `css/scenes.css`).
- **Components:**

  | Component | Use |
  |---|---|
  | `.panel` (+ `.ticks`) | Cards with drafting-corner marks |
  | `.badge-o` | Complexity badges, e.g. Θ(n log n). Add `.bad` / `.ok` for red / green |
  | `.pill` | Pill labels |
  | `Viz.stamp(true\|false, attrs)` | ✓ / ✗ stamp |
  | `.caption` + `new Viz.Caption(el).set(html)` | Narration line |
  | `Viz.K(value, 'cmp'\|'swap'\|'ok'\|'bad'\|'star')` | Coloured key inside a caption |
  | `Viz.legend(['cmp','swap','ok'])` | State legend |
  | `new CodeView(el, lines, title).line(n)` | Pseudocode with a line cursor |
  | `new Viz.TraceTable(el, title).add(values, m)` | Trace table |
  | `.formula`, `.lead`, `.txt`, `.small`, `.mono`, `.hand` | Type styles |

- **Type:**
  - Display: Bricolage Grotesque (`var(--font-display)`).
  - Body: IBM Plex Sans.
  - Code and numbers: IBM Plex Mono (`var(--font-mono)`).
  - Annotations, in small doses: Caveat (`var(--font-hand)`).
- **No emoji.** Use the SVG icons and stamps instead.
- **Motion:**
  - A single move takes 400–800 ms; one click plays at most about 3 s of animation.
  - The talk is about 10 minutes, so keep each slide to 2–5 clicks.
  - The animation must explain the idea to someone who can't read the English.

## Testing your slides
```
node --test tests/*.test.js               # unit tests for js/algo
NODE_PATH=/opt/node-tools/node_modules node tools/shots.js --ids=gauss,presorting --steps=all --out=<dir> [--lang=tr] [--theme=light] [--w=1280 --h=720]
```
- `shots.js` jumps straight to each step (instant rebuild) and takes a screenshot. It prints any console errors.
- Look at the PNGs: check for overlaps, text overflow, unreadable contrast, TR text that doesn't fit, and the light theme.
- To see the real animations, open `index.html#<slide-id>` and press → on a slide.
