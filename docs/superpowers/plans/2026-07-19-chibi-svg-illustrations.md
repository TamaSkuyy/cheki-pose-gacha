# Procedural Chibi SVG Illustrations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the kaomoji text on each printed cheki with a procedurally-drawn inline SVG scene of 1-3 chibi characters (fan/idol/idol2 depending on `pose.mode`), generated from `chibi.js`, with colors tied to the site's existing CSS theme variables.

**Architecture:** New `chibi.js` file (loaded before `app.js`) exports `drawScene(pose)`, which composes `chibiChar()` calls (built from `ARMS`/`FACES` primitive dictionaries) positioned per `pose.mode`. `app.js`'s `renderCheki()` calls `drawScene(pose)` instead of interpolating `pose.kao`.

**Tech Stack:** Vanilla JS (no framework), verified with `node --check`, a Node script that exercises `drawScene()` against all of `poses.json`, and `rsvg-convert` for local visual self-checks (with `var(--x)` substituted to literal hex, since librsvg does not resolve CSS custom properties — confirmed during prototyping). The real browser output uses `var()` directly and needs no substitution.

## Global Constraints

- `POSES` array structure in `poses.json` is not modified (per spec).
- Gacha logic, pity system, and printing animation in `app.js` are not touched — only the `.kaomoji` line inside `renderCheki()` changes (per spec).
- Album grid keeps using `pose.kao` as its preview (per user decision — out of scope).
- No new npm dependency, no build step; `chibi.js` is plain `<script>`-loaded and additionally does `if (typeof module !== 'undefined') module.exports = {...}` so the same unmodified file works in Node for the verification script (per spec).
- Colors reference `var(--ichigo)`, `var(--soda)`, `var(--ink)`, `var(--lemon)` — the exact custom properties already defined in `style.css`'s `:root` — so illustrations stay in sync with the theme picker.

---

### Task 1: Create `chibi.js` with the full drawing system

**Files:**
- Create: `/home/sekuyy/project/cheki-pose-gacha/chibi.js`

**Interfaces:**
- Produces: `drawScene(pose)`, `configFor(pose)`, `ARMS`, `FACES` (via `module.exports` for Node; as top-level `function`/`const` declarations for the browser `<script>` context). Consumed by Task 3 (`app.js`) and Task 4 (verification script).
- Consumes: a `pose` object shaped like entries in `poses.json` — reads `pose.id`, `pose.mode` (`'solo'|'standard'|'selfie'|'group'`), `pose.cat`.

- [ ] **Step 1: Write `chibi.js`**

This exact content was prototyped and visually verified (8 sample poses rendered via `rsvg-convert`, checked for readability — see Task 2) before being placed here:

```js
function hashString(str){
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function limbSvg(sx, sy, dir, edx, edy, hdx, hdy, deco){
  const ex = sx + dir*edx, ey = sy + edy;
  const hx = ex + dir*hdx, hy = ey + hdy;
  const path = `<path d="M ${sx} ${sy} L ${ex} ${ey} L ${hx} ${hy}" stroke="#FFEFE0" stroke-width="9" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${hx}" cy="${hy}" r="6.5" fill="#FFEFE0" stroke="var(--ink)" stroke-width="2"/>`;
  return path + (deco ? deco(hx, hy, dir) : '');
}

const ARMS = {
  down:  (sx,sy,dir) => limbSvg(sx,sy,dir, 6,20, 2,18),
  wave:  (sx,sy,dir) => limbSvg(sx,sy,dir, 14,-6, 8,-16),
  point: (sx,sy,dir) => limbSvg(sx,sy,dir, 16,-2, 16,-6),
  salute:(sx,sy,dir) => limbSvg(sx,sy,dir, 8,-16, -2,-22),
  crossarm: (sx,sy,dir) => limbSvg(sx,sy,dir, -4,2, -22,6),
  peace: (sx,sy,dir) => limbSvg(sx,sy,dir, 16,-10, 4,-18, (hx,hy,dir)=>
    `<path d="M ${hx-3*dir} ${hy-9} L ${hx-1*dir} ${hy-1} M ${hx+3*dir} ${hy-9} L ${hx+1*dir} ${hy-1}" stroke="#FFEFE0" stroke-width="3" stroke-linecap="round"/>`),
  fingerheart: (sx,sy,dir) => limbSvg(sx,sy,dir, 10,-2, 2,-8, (hx,hy)=>
    `<path d="M ${hx-4} ${hy-1} Q ${hx-4} ${hy-5} ${hx} ${hy-2} Q ${hx+4} ${hy-5} ${hx+4} ${hy-1} L ${hx} ${hy+4} Z" fill="var(--ichigo)"/>`),
  catpaw: (sx,sy,dir) => limbSvg(sx,sy,dir, 12,-10, 4,-14, (hx,hy)=>
    `<circle cx="${hx-2.5}" cy="${hy-3}" r="1.3" fill="var(--ink)"/><circle cx="${hx+2.5}" cy="${hy-3}" r="1.3" fill="var(--ink)"/><circle cx="${hx}" cy="${hy-4.5}" r="1.3" fill="var(--ink)"/>`),
  flex: (sx,sy,dir) => limbSvg(sx,sy,dir, 18,4, 6,-14, (hx,hy,dir)=>
    `<path d="M ${hx+4*dir} ${hy-2} L ${hx+9*dir} ${hy-4} M ${hx+4*dir} ${hy+3} L ${hx+9*dir} ${hy+2}" stroke="var(--ink)" stroke-width="2" stroke-linecap="round"/>`),
};

function eyeArc(cx,cy){ return `<path d="M ${cx-4} ${cy-1} Q ${cx} ${cy-5} ${cx+4} ${cy-1}" stroke="var(--ink)" stroke-width="2.4" fill="none" stroke-linecap="round"/>`; }

const FACES = {
  happy: (cx,cy) => `${eyeArc(cx-9,cy-2)}${eyeArc(cx+9,cy-2)}<path d="M ${cx-6} ${cy+11} Q ${cx} ${cy+15} ${cx+6} ${cy+11}" stroke="var(--ink)" stroke-width="2.4" fill="none" stroke-linecap="round"/>`,
  wink: (cx,cy) => `${eyeArc(cx-9,cy-2)}<circle cx="${cx+9}" cy="${cy-2}" r="2.6" fill="var(--ink)"/><path d="M ${cx-6} ${cy+11} Q ${cx} ${cy+15} ${cx+6} ${cy+11}" stroke="var(--ink)" stroke-width="2.4" fill="none" stroke-linecap="round"/>`,
  shock: (cx,cy) => `<circle cx="${cx-9}" cy="${cy-2}" r="4" fill="var(--ink)"/><circle cx="${cx+9}" cy="${cy-2}" r="4" fill="var(--ink)"/><ellipse cx="${cx}" cy="${cy+12}" rx="3" ry="4" fill="var(--ink)"/>`,
  smug: (cx,cy) => `<line x1="${cx-13}" y1="${cy-3}" x2="${cx-5}" y2="${cy-5}" stroke="var(--ink)" stroke-width="2.4" stroke-linecap="round"/><line x1="${cx+5}" y1="${cy-5}" x2="${cx+13}" y2="${cy-3}" stroke="var(--ink)" stroke-width="2.4" stroke-linecap="round"/><path d="M ${cx-5} ${cy+12} Q ${cx+2} ${cy+15} ${cx+8} ${cy+9}" stroke="var(--ink)" stroke-width="2.4" fill="none" stroke-linecap="round"/>`,
  cat: (cx,cy) => `<path d="M ${cx-13} ${cy+1} L ${cx-9} ${cy-4} L ${cx-5} ${cy+1}" stroke="var(--ink)" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M ${cx+5} ${cy+1} L ${cx+9} ${cy-4} L ${cx+13} ${cy+1}" stroke="var(--ink)" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M ${cx-4} ${cy+12} Q ${cx-2} ${cy+9} ${cx} ${cy+12} Q ${cx+2} ${cy+9} ${cx+4} ${cy+12}" stroke="var(--ink)" stroke-width="2" fill="none" stroke-linecap="round"/>`,
  sad: (cx,cy) => `<path d="M ${cx-13} ${cy-4} Q ${cx-9} ${cy-1} ${cx-5} ${cy-4}" stroke="var(--ink)" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M ${cx+5} ${cy-4} Q ${cx+9} ${cy-1} ${cx+13} ${cy-4}" stroke="var(--ink)" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M ${cx+11} ${cy+2} Q ${cx+13} ${cy+7} ${cx+10} ${cy+7} Q ${cx+9} ${cy+5} ${cx+11} ${cy+2} Z" fill="var(--soda)"/><path d="M ${cx-6} ${cy+13} Q ${cx} ${cy+10} ${cx+6} ${cy+13}" stroke="var(--ink)" stroke-width="2.4" fill="none" stroke-linecap="round"/>`,
};

function chibiChar(cfg){
  const { cx, cy, role, la, ra, face, tilt, mirror, scale } = cfg;
  const s = scale || 1;
  const skin = '#FFEFE0';
  const outfit = role === 'idol' ? 'var(--ichigo)' : 'var(--soda)';
  const hair = 'var(--ink)';
  const accent = 'var(--lemon)';

  const backHair = role === 'idol' ? `
    <ellipse cx="-34" cy="-48" rx="11" ry="21" transform="rotate(-18 -34 -48)" fill="${hair}"/>
    <ellipse cx="34" cy="-48" rx="11" ry="21" transform="rotate(18 34 -48)" fill="${hair}"/>` : '';

  const legs = `
    <rect x="-16" y="24" width="12" height="26" rx="6" fill="${skin}" stroke="var(--ink)" stroke-width="3"/>
    <rect x="4" y="24" width="12" height="26" rx="6" fill="${skin}" stroke="var(--ink)" stroke-width="3"/>
    <rect x="-17" y="44" width="14" height="8" rx="3" fill="var(--ink)"/>
    <rect x="3" y="44" width="14" height="8" rx="3" fill="var(--ink)"/>`;

  const skirt = role === 'idol' ? `<path d="M -22 6 L -34 22 L 34 22 L 22 6 Z" fill="${accent}" stroke="var(--ink)" stroke-width="3" stroke-linejoin="round"/>` : '';

  const torso = `<rect x="-20" y="-30" width="40" height="42" rx="15" fill="${outfit}" stroke="var(--ink)" stroke-width="3"/>`;

  const bow = role === 'idol' ? `<circle cx="0" cy="-28" r="4" fill="${accent}" stroke="var(--ink)" stroke-width="2"/>` : '';

  const head = `<circle cx="0" cy="-58" r="30" fill="${skin}" stroke="var(--ink)" stroke-width="3"/>`;

  const frontHair = `<path d="M -30 -58 Q -32 -92 0 -92 Q 32 -92 30 -58 Q 30 -74 0 -76 Q -30 -74 -30 -58 Z" fill="${hair}"/>`;

  const blush = `
    <ellipse cx="-15" cy="-50" rx="4.5" ry="2.5" fill="var(--ichigo)" opacity=".45"/>
    <ellipse cx="15" cy="-50" rx="4.5" ry="2.5" fill="var(--ichigo)" opacity=".45"/>`;

  const faceFn = FACES[face] || FACES.happy;
  const faceSvg = faceFn(0, -58);

  const armLeft = (ARMS[la] || ARMS.down)(-20, -18, -1);
  const armRight = (ARMS[ra] || ARMS.down)(20, -18, 1);

  return `<g transform="translate(${cx} ${cy}) rotate(${tilt||0}) scale(${(mirror?-1:1)*s} ${s})">${backHair}${legs}${skirt}${torso}${bow}${head}${frontHair}${blush}${faceSvg}${armLeft}${armRight}</g>`;
}

const ARM_KEYS = Object.keys(ARMS);
const FACE_KEYS = Object.keys(FACES);

function defaultCharConfig(pose, tag){
  const seed = hashString(pose.id + ':' + tag);
  return {
    la: ARM_KEYS[seed % ARM_KEYS.length],
    ra: ARM_KEYS[Math.floor(seed / 7) % ARM_KEYS.length],
    face: FACE_KEYS[Math.floor(seed / 13) % FACE_KEYS.length],
    tilt: (seed % 17) - 8,
  };
}

function defaultConfigFromHash(pose){
  return {
    fan: defaultCharConfig(pose, 'fan'),
    idol: defaultCharConfig(pose, 'idol'),
    idol2: defaultCharConfig(pose, 'idol2'),
    scene: pose.cat === 'sweet' ? 'heart' : null,
  };
}

const POSE_OVERRIDES = {
  'chaos-boss':        { fan:{la:'crossarm',ra:'point',face:'smug'}, idol:{la:'crossarm',ra:'crossarm',face:'smug'} },
  'chaos-gravity':     { fan:{la:'wave',ra:'down',face:'shock',tilt:-10}, idol:{la:'down',ra:'wave',face:'shock',tilt:10} },
  'chaos-glitch':      { fan:{la:'point',ra:'down',face:'shock',tilt:9}, idol:{la:'down',ra:'point',face:'shock',tilt:-9} },
  'selfie-legendary':  { fan:{la:'peace',ra:'peace',face:'happy'}, idol:{la:'fingerheart',ra:'fingerheart',face:'happy'} },
  'solo-centerstage':  { idol:{la:'wave',ra:'fingerheart',face:'smug',tilt:6} },
  'group-ginyu':       { fan:{la:'flex',ra:'flex',face:'smug'}, idol:{la:'flex',ra:'flex',face:'smug'}, idol2:{la:'flex',ra:'flex',face:'smug'} },
  'group-finale':      { fan:{la:'wave',ra:'wave',face:'happy'}, idol:{la:'wave',ra:'wave',face:'happy'}, idol2:{la:'wave',ra:'wave',face:'happy'} },
  'lucu-kabedon':      { fan:{la:'down',ra:'down',face:'shock'}, idol:{la:'point',ra:'down',face:'smug'}, scene:'kabedon' },
  'sweet-flowercrown': { fan:{la:'fingerheart',ra:'down',face:'happy'}, idol:{la:'down',ra:'down',face:'wink'}, scene:'heart' },
  'lucu-sleep':        { fan:{la:'point',ra:'down',face:'shock'}, idol:{la:'down',ra:'down',face:'sad'} },
  'chaos-drama':       { fan:{la:'salute',ra:'down',face:'sad'}, idol:{la:'wave',ra:'down',face:'shock'} },
  'selfie-dogfilter':  { fan:{la:'catpaw',ra:'catpaw',face:'cat'}, idol:{la:'catpaw',ra:'catpaw',face:'cat'} },
  'selfie-nightshot':  { fan:{la:'point',ra:'down',face:'shock'}, idol:{la:'down',ra:'point',face:'shock'} },
  'solo-selfcrown':    { idol:{la:'fingerheart',ra:'fingerheart',face:'smug'} },
  'solo-badass':       { idol:{la:'crossarm',ra:'crossarm',face:'smug'} },
  'group-syncjump':    { fan:{la:'wave',ra:'wave',face:'happy'}, idol:{la:'wave',ra:'wave',face:'happy'}, idol2:{la:'wave',ra:'wave',face:'happy'} },
  'group-piggyback':   { fan:{la:'flex',ra:'flex',face:'happy'}, idol:{la:'peace',ra:'down',face:'happy'}, idol2:{la:'wave',ra:'down',face:'happy'} },
  'classic-cool':      { fan:{la:'crossarm',ra:'crossarm',face:'smug',tilt:-4}, idol:{la:'crossarm',ra:'crossarm',face:'smug',tilt:4} },
};

function mergeChar(base, override){ return override ? { ...base, ...override } : base; }

function configFor(pose){
  const base = defaultConfigFromHash(pose);
  const override = POSE_OVERRIDES[pose.id];
  if (!override) return base;
  return {
    fan: mergeChar(base.fan, override.fan),
    idol: mergeChar(base.idol, override.idol),
    idol2: mergeChar(base.idol2, override.idol2),
    scene: override.scene !== undefined ? override.scene : base.scene,
  };
}

function sceneProp(scene){
  if (scene === 'heart') return `<path d="M150 40 C120 8,58 28,58 70 C58 112,150 155,150 155 C150 155,242 112,242 70 C242 28,180 8,150 40 Z" fill="var(--ichigo)" opacity=".14"/>`;
  if (scene === 'kabedon') return `<rect x="0" y="0" width="46" height="200" fill="var(--ink)" opacity=".08"/><line x1="10" y1="20" x2="30" y2="60" stroke="var(--ink)" stroke-width="2" opacity=".2"/><line x1="20" y1="80" x2="6" y2="120" stroke="var(--ink)" stroke-width="2" opacity=".2"/>`;
  if (scene === 'penlight') return `<circle cx="30" cy="170" r="16" fill="var(--lemon)" opacity=".25"/><rect x="26" y="150" width="8" height="45" rx="4" fill="var(--lemon)" opacity=".55"/><circle cx="270" cy="170" r="16" fill="var(--soda)" opacity=".25"/><rect x="266" y="150" width="8" height="45" rx="4" fill="var(--soda)" opacity=".55"/>`;
  return '';
}

function characterConfigsForMode(mode, cfg){
  if (mode === 'solo') return [{ key:'idol', c: cfg.idol }];
  if (mode === 'group') return [{ key:'idol', c: cfg.idol }, { key:'fan', c: cfg.fan }, { key:'idol2', c: cfg.idol2 }];
  return [{ key:'fan', c: cfg.fan }, { key:'idol', c: cfg.idol }];
}

function drawScene(pose){
  const mode = ['solo','standard','selfie','group'].includes(pose.mode) ? pose.mode : 'solo';
  const cfg = configFor(pose);
  const chars = characterConfigsForMode(mode, cfg);

  let positions;
  if (mode === 'solo') {
    positions = [{ cx:150, cy:145, mirror:false, scale:1.05 }];
  } else if (mode === 'group') {
    positions = [
      { cx:62, cy:150, mirror:false, scale:.82 },
      { cx:150, cy:143, mirror:false, scale:.9 },
      { cx:238, cy:150, mirror:true, scale:.82 },
    ];
  } else {
    positions = [
      { cx:98, cy:145, mirror:false, scale:1 },
      { cx:202, cy:145, mirror:true, scale:1 },
    ];
  }

  const role = { fan:'fan', idol:'idol', idol2:'idol' };
  const bodies = chars.map((ch, i) => chibiChar({
    ...ch.c,
    role: role[ch.key],
    cx: positions[i].cx,
    cy: positions[i].cy,
    mirror: positions[i].mirror,
    scale: positions[i].scale,
  })).join('');

  return `<svg viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${sceneProp(cfg.scene)}${bodies}</svg>`;
}

if (typeof module !== 'undefined') module.exports = { drawScene, configFor, ARMS, FACES };
```

- [ ] **Step 2: Verify syntax**

Run: `cd /home/sekuyy/project/cheki-pose-gacha && node --check chibi.js`
Expected: no output, exit code 0.

---

### Task 2: Verify all 77 poses render without `undefined`/`NaN`, and spot-check visually

**Files:** none (verification only, plus temporary files in the scratchpad).

**Interfaces:**
- Consumes: `drawScene` from Task 1's `chibi.js`, pose data from `poses.json`.

- [ ] **Step 1: Run the full-pose sweep**

Run:
```bash
cd /home/sekuyy/project/cheki-pose-gacha && node -e "
const { drawScene } = require('./chibi.js');
const poses = JSON.parse(require('fs').readFileSync('poses.json'));
let bad = [];
poses.forEach(p => {
  const svg = drawScene(p);
  if (typeof svg !== 'string' || svg.includes('undefined') || svg.includes('NaN')) bad.push(p.id);
});
console.log('total poses:', poses.length, '| bad:', bad.length, bad);
"
```
Expected: `total poses: 77 | bad: 0 []`

- [ ] **Step 2: Rasterize a handful of samples for a self-check**

This step was already run once during design (Task 1's code is the result of that check), but re-run it here against the real, in-place `chibi.js` to confirm nothing drifted when it was transcribed into the file:

```bash
cd /home/sekuyy/project/cheki-pose-gacha
node -e "
const { drawScene } = require('./chibi.js');
const poses = JSON.parse(require('fs').readFileSync('poses.json'));
const fs = require('fs');
const sample = ['chaos-boss','sweet-flowercrown','solo-centerstage','group-ginyu','selfie-dogfilter','classic-peace'];
const colorMap = { '--ichigo':'#FF5C8A','--soda':'#7ED3E8','--cream':'#FFF6EC','--ink':'#3B2E3A','--lemon':'#FFD966','--mint':'#A8E6C3' };
const literalize = svg => svg.replace(/var\((--[a-z]+)\)/g, (m,v) => colorMap[v] || '#000');
sample.forEach(id => {
  const pose = poses.find(p => p.id === id);
  fs.writeFileSync('/tmp/chibi-check-' + id + '.svg', literalize(drawScene(pose)));
});
console.log('written', sample.length, 'sample SVGs to /tmp');
"
for f in /tmp/chibi-check-*.svg; do
  rsvg-convert -w 300 -h 200 --background-color=white "$f" -o "${f%.svg}.png"
done
ls /tmp/chibi-check-*.png
```
Expected: 6 PNG files listed, one per sample id.

- [ ] **Step 3: Visually inspect via the Read tool**

Read each of the 6 generated PNGs (`/tmp/chibi-check-<id>.png`) and confirm: two (or one/three, per mode) distinguishable chibi figures, idol has twintails+skirt+pink outfit, fan has plain hair+blue outfit, faces/gestures are visible, no rendering glitches (stray coordinates, overlapping garbage, missing shapes).
Expected: figures look like the ones already confirmed during Task 1's design prototyping (clean silhouettes, readable poses).

---

### Task 3: Wire `chibi.js` into the app

**Files:**
- Modify: `/home/sekuyy/project/cheki-pose-gacha/index.html`
- Modify: `/home/sekuyy/project/cheki-pose-gacha/app.js`
- Modify: `/home/sekuyy/project/cheki-pose-gacha/style.css`

**Interfaces:**
- Consumes: `drawScene(pose)` from Task 1's `chibi.js` (loaded as a global function via `<script>`, no import needed).

- [ ] **Step 1: Load `chibi.js` before `app.js`**

In `index.html`, find:

```html
<script src="https://html2canvas.hertzen.com/dist/html2canvas.min.js"></script>
<script src="app.js"></script>
```

Replace with:

```html
<script src="https://html2canvas.hertzen.com/dist/html2canvas.min.js"></script>
<script src="chibi.js"></script>
<script src="app.js"></script>
```

- [ ] **Step 2: Call `drawScene` in `renderCheki`**

In `app.js`, find:

```js
      <div class="kaomoji">${pose.kao}</div>
```

Replace with:

```js
      <div class="kaomoji">${drawScene(pose)}</div>
```

- [ ] **Step 3: Restyle `.kaomoji` as an SVG container**

In `style.css`, find:

```css
.kaomoji{
  font-size:clamp(1.5rem,5.5vw,2rem);
  font-weight:700;
  text-align:center;
  line-height:1.3;
  word-break:keep-all;
}
```

Replace with:

```css
.kaomoji{
  display:flex;
  justify-content:center;
  width:100%;
}
.kaomoji svg{
  width:100%;
  height:auto;
  display:block;
}
```

- [ ] **Step 4: Verify JS/CSS syntax and wiring**

Run:
```bash
cd /home/sekuyy/project/cheki-pose-gacha
node --check app.js && echo "app.js OK"
grep -q 'chibi.js' index.html && echo "chibi.js script tag present"
grep -q 'drawScene(pose)' app.js && echo "drawScene call present"
grep -q '.kaomoji svg' style.css && echo ".kaomoji svg rule present"
```
Expected: all four confirmation lines print.

---

### Task 4: End-to-end verification over a local server + Artifact gallery for user review

**Files:** none (verification + a temporary Artifact publish).

- [ ] **Step 1: Start a local server and confirm all files serve**

```bash
cd /home/sekuyy/project/cheki-pose-gacha
(python3 -m http.server 8642 >/tmp/http-chibi.log 2>&1 &) && sleep 1
for f in index.html style.css app.js chibi.js poses.json rules.json; do
  echo -n "$f: "; curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:8642/$f"
done
```
Expected: every file returns `200`.

- [ ] **Step 2: Stop the server**

Run: `pkill -f "http.server 8642"`

- [ ] **Step 3: Publish an Artifact gallery for visual review**

Build a small self-contained HTML file embedding `chibi.js` verbatim plus the real `:root` CSS variables from `style.css`, rendering ~8-10 sample poses (mix of `POSE_OVERRIDES` entries and hash-default poses, covering solo/standard/selfie/group) in a grid with pose name/mode/rarity labels. Publish via the `Artifact` tool so the user can review real rendered output (with working `var()` colors, unlike the `rsvg-convert` self-check) before considering this done.

- [ ] **Step 4: Manual confirmation checklist (for the user, in a real browser)**

- Gacha a few poses across different modes (standard/selfie/solo/group) — illustration appears instead of kaomoji text.
- Switch the theme picker color — idol outfit color updates live.
- Album (`📚`) still shows kaomoji text previews (unchanged, per scope).
- Download PNG / copy link / copy text still work.
- No console errors.

---

## Self-Review Notes

- **Spec coverage:** `chibi.js` with `ARMS`/`FACES`/`chibiChar`/`POSE_OVERRIDES`/`configFor`/`drawScene` (Task 1) ✓, Node-loadable via `module.exports` (Task 1) ✓, wiring into `index.html`/`app.js`/`style.css` (Task 3) ✓, `POSES` structure untouched, gacha/pity/printing untouched, album stays kaomoji (Task 3 touches only `.kaomoji`) ✓, verification loop over all 77 poses for `undefined`/`NaN` (Task 2) ✓, visual review via rasterized samples + Artifact gallery (Task 2 + Task 4) ✓.
- **Placeholder scan:** none — every step has literal code or literal commands with expected output. The one thing intentionally left flexible is the exact Artifact HTML in Task 4 Step 3 (built at execution time, not hand-typed here), since it's a presentation-only deliverable with no consumers in later tasks — nothing depends on its exact markup.
- **Type consistency:** `ARMS`/`FACES` keys used in `POSE_OVERRIDES` (`crossarm`, `point`, `smug`, `wave`, `down`, `shock`, `peace`, `fingerheart`, `happy`, `flex`, `catpaw`, `cat`, `salute`, `sad`, `wink`) all exist in the `ARMS`/`FACES` objects defined earlier in the same file — checked by inspection. `chibiChar` reads `cfg.la/ra/face/tilt/mirror/scale/cx/cy/role`, and `drawScene` is the only caller, always supplying all of those fields — no gaps.
- **Already executed once:** Task 1's code and Task 2's verification were run for real during design (not just planned) — 77/77 poses passed the `undefined`/`NaN` check and 8 samples were visually inspected via `rsvg-convert` + `Read` before this plan was written. Task 3 and Task 4 are the remaining unexecuted work.
