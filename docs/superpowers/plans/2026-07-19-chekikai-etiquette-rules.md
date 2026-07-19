# Chekikai Etiquette Rules Modal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `📜` button that opens a modal listing 7 chekikai etiquette rules, sourced from a new `rules.json` file, translated ID/EN in sync with the app's existing language toggle.

**Architecture:** Follows the existing `.modal-overlay`/`.modal-content` pattern already used by Album and Custom Pose. Rule text lives in `rules.json` (mirrors the `poses.json` split) and is fetched once at startup alongside pose data.

**Tech Stack:** Vanilla HTML/CSS/JS, no build step, no test framework — this project verifies changes with `node --check` (JS syntax), `python3 -m json.tool` (JSON validity), and manual verification via a local static server (`python3 -m http.server`), since `fetch()` requires a server and cannot run from `file://`.

## Global Constraints

- No gacha logic, pose data, or pity system may be touched — this feature is purely informational (per spec's "Out of Scope").
- No `localStorage` persistence for this feature (per spec).
- No backdrop-click-to-close — stay consistent with existing Album/Custom Pose modals, which only close via the `×` button (per spec's Data Flow step 4).
- Rule content is 7 items, emoji-prefixed, in both `id` and `en`, matching the tone already drafted and approved in `docs/superpowers/specs/2026-07-19-chekikai-etiquette-rules-design.md`.

---

### Task 1: Create `rules.json`

**Files:**
- Create: `/home/sekuyy/project/cheki-pose-gacha/rules.json`

**Interfaces:**
- Produces: a JSON object `{ "id": string[], "en": string[] }`, each array containing exactly 7 strings, consumed by `loadRules()` in Task 4.

- [ ] **Step 1: Write `rules.json`**

```json
{
  "id": [
    "🙏 Selalu minta izin sopan sebelum motret bareng oshi",
    "✋ No touching tanpa izin — rangkulan/gandengan cuma kalau oshi inisiatif atau venue ngebolehin",
    "⏱️ Patuhi waktu chekikai yang dikasih panitia, jangan monopoli",
    "🤫 Ikuti aturan venue soal ngobrol, request pose, atau kasih fanletter",
    "📵 Jangan candid / rekam di luar sesi resmi tanpa izin",
    "😊 Sampein terima kasih di akhir sesi walau cuma sebentar",
    "💌 Kalau oshi keliatan capek atau nggak nyaman, jangan maksa pose aneh-aneh"
  ],
  "en": [
    "🙏 Always ask politely before taking a photo with your oshi",
    "✋ No touching without permission — hand-holding/hugs only if the idol initiates or the venue allows it",
    "⏱️ Respect the time slot given by the organizers, don't hog it",
    "🤫 Follow venue rules about talking, requesting poses, or giving fan letters",
    "📵 Don't take candid photos/videos outside the official session without permission",
    "😊 Say thank you at the end of the session, even if it's brief",
    "💌 If your oshi looks tired or uncomfortable, don't force weird poses"
  ]
}
```

- [ ] **Step 2: Validate JSON**

Run: `cd /home/sekuyy/project/cheki-pose-gacha && python3 -m json.tool rules.json`
Expected: pretty-printed JSON is echoed back with no error.

- [ ] **Step 3: Confirm structure**

Run:
```bash
cd /home/sekuyy/project/cheki-pose-gacha && python3 -c "
import json
d = json.load(open('rules.json'))
assert set(d.keys()) == {'id', 'en'}
assert len(d['id']) == 7 and len(d['en']) == 7
assert all(isinstance(s, str) and s for s in d['id'] + d['en'])
print('rules.json OK:', len(d['id']), 'id /', len(d['en']), 'en')
"
```
Expected: `rules.json OK: 7 id / 7 en`

- [ ] **Step 4: Commit**

```bash
cd /home/sekuyy/project/cheki-pose-gacha
git add rules.json
git commit -m "$(cat <<'EOF'
feat: add chekikai etiquette rules data

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Add rules modal + trigger button to `index.html`

**Files:**
- Modify: `/home/sekuyy/project/cheki-pose-gacha/index.html`

**Interfaces:**
- Produces DOM elements consumed by Task 4's JS: `#btnRules` (trigger), `#rulesModal` (overlay, toggled via `.open` class), `#btnCloseRules` (close button), `#rulesList` (`<ul>` populated at render time).
- Consumes: `data-i18n="rulesTitle"` mechanism already provided by `applyLang()` in `app.js` (Task 4 adds the `rulesTitle` dictionary entries).

- [ ] **Step 1: Add the modal markup**

In `index.html`, find the existing Custom Pose modal block:

```html
  <!-- Modal Custom Pose -->
  <div class="modal-overlay" id="customModal">
    <div class="modal-content">
      <div class="modal-header">
        <h2 data-i18n="customTitle">✍️ Buat Pose Sendiri</h2>
        <button class="btn-close" id="btnCloseCustom">&times;</button>
      </div>
      <form id="customForm" style="display:flex; flex-direction:column; gap:.8rem;">
        <input type="text" id="cpName" placeholder="Nama Pose (ex: Kamehameha)" required style="padding:.5rem; border:2px solid var(--ink); border-radius:4px; font-family:inherit;">
        <input type="text" id="cpKao" placeholder="Kaomoji (ex: 💥(°□°）)" required style="padding:.5rem; border:2px solid var(--ink); border-radius:4px; font-family:inherit;">
        <input type="text" id="cpYou" placeholder="Gaya Kamu (ex: Gaya nembak ki)" style="padding:.5rem; border:2px solid var(--ink); border-radius:4px; font-family:inherit;">
        <input type="text" id="cpIdol" placeholder="Gaya Oshi (ex: Pura-pura kena tembak)" style="padding:.5rem; border:2px solid var(--ink); border-radius:4px; font-family:inherit;">
        <button type="submit" class="btn-random" data-i18n="customSave" style="padding:.6rem;">Simpan Pose</button>
      </form>
    </div>
  </div>
```

Immediately after that closing `</div>` (and before the `<div class="tray" ...>` block), insert:

```html

  <!-- Modal Rules -->
  <div class="modal-overlay" id="rulesModal">
    <div class="modal-content">
      <div class="modal-header">
        <h2 data-i18n="rulesTitle">📜 Etika Chekikai</h2>
        <button class="btn-close" id="btnCloseRules">&times;</button>
      </div>
      <ul class="rules-list" id="rulesList"></ul>
    </div>
  </div>
```

- [ ] **Step 2: Add the trigger button**

Find this block:

```html
    <div style="display:flex; gap:.5rem;">
      <button class="btn-random" id="btnRandom" data-i18n="btnRandom">🎲 Gacha Pose!</button>
      <button class="btn-random" id="btnAlbum" style="padding:.85rem; background:#fff; color:var(--ink);" title="Album">📚</button>
    </div>
```

Replace it with:

```html
    <div style="display:flex; gap:.5rem;">
      <button class="btn-random" id="btnRandom" data-i18n="btnRandom">🎲 Gacha Pose!</button>
      <button class="btn-random" id="btnAlbum" style="padding:.85rem; background:#fff; color:var(--ink);" title="Album">📚</button>
      <button class="btn-random" id="btnRules" style="padding:.85rem; background:#fff; color:var(--ink);" title="Etika Chekikai">📜</button>
    </div>
```

- [ ] **Step 3: Verify markup is well-formed**

Run: `cd /home/sekuyy/project/cheki-pose-gacha && python3 -c "
import re
html = open('index.html').read()
for id_ in ['btnRules', 'rulesModal', 'btnCloseRules', 'rulesList']:
    assert f'id=\"{id_}\"' in html, f'{id_} missing'
assert html.count('modal-overlay') == 3
print('index.html markup OK')
"`
Expected: `index.html markup OK`

- [ ] **Step 4: Commit**

```bash
cd /home/sekuyy/project/cheki-pose-gacha
git add index.html
git commit -m "$(cat <<'EOF'
feat: add rules modal markup and trigger button

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Style the rules list in `style.css`

**Files:**
- Modify: `/home/sekuyy/project/cheki-pose-gacha/style.css`

**Interfaces:**
- Consumes: `.rules-list` class name from Task 2's `<ul class="rules-list" id="rulesList">`.
- Produces: visual styling for `.rules-list` and its `<li>` children, consumed by Task 4's `renderRules()` (which creates plain `<li>` elements with no extra classes).

- [ ] **Step 1: Add the CSS block**

In `style.css`, find:

```css
.rarity-badge.rarity-r{background:var(--soda)}
.rarity-badge.rarity-sr{background:#ffb8e6}
.rarity-badge.rarity-ssr{background:linear-gradient(135deg,var(--lemon),#ff8fb0)}

/* ── footer ── */
```

Replace it with:

```css
.rarity-badge.rarity-r{background:var(--soda)}
.rarity-badge.rarity-sr{background:#ffb8e6}
.rarity-badge.rarity-ssr{background:linear-gradient(135deg,var(--lemon),#ff8fb0)}

.rules-list{
  list-style:none;
  display:flex;
  flex-direction:column;
  gap:.65rem;
}
.rules-list li{
  font-size:.85rem;
  line-height:1.5;
  background:#fff;
  border:2px solid var(--ink);
  border-radius:10px;
  padding:.55rem .7rem;
}

/* ── footer ── */
```

- [ ] **Step 2: Verify the rule is present**

Run: `cd /home/sekuyy/project/cheki-pose-gacha && grep -c "\.rules-list" style.css`
Expected: `2` (the container rule and the `li` rule)

- [ ] **Step 3: Commit**

```bash
cd /home/sekuyy/project/cheki-pose-gacha
git add style.css
git commit -m "$(cat <<'EOF'
feat: style rules list modal content

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Wire up rules loading, rendering, and modal open/close in `app.js`

**Files:**
- Modify: `/home/sekuyy/project/cheki-pose-gacha/app.js`

**Interfaces:**
- Consumes: `#btnRules`, `#rulesModal`, `#btnCloseRules`, `#rulesList` from Task 2; `.rules-list li` styling from Task 3; `rules.json` shape `{ id: string[], en: string[] }` from Task 1.
- Produces: `let RULES = { id: [], en: [] }` (module-level), `async function loadRules()`, `function renderRules()` — both usable by later features if needed.

- [ ] **Step 1: Add `rulesTitle` to the dictionary**

Find:

```js
const DICT = {
  id: {
    title: 'Gacha Pose', subtitle: 'Biar ga mati gaya pas ketemu oshi!', mode: 'Mode:',
    m_std: '📸 Standard (Kamu + Oshi)', m_selfie: '🤳 Duo Selfie', m_solo: '💁 Solo Idol', m_grp: '🧑‍🤝‍🧑 Group Cheki',
    btnRandom: '🎲 Gacha Pose!', btnCustom: '✍️ Tambah Pose', cat_all: 'Semua', cat_custom: 'Custom',
    albumTitle: '📚 Buku Koleksi Pose', customTitle: '✍️ Buat Pose Sendiri', customSave: 'Simpan Pose'
  },
  en: {
    title: 'Pose Gacha', subtitle: 'No more awkward poses with your oshi!', mode: 'Mode:',
    m_std: '📸 Standard (Fan + Oshi)', m_selfie: '🤳 Duo Selfie', m_solo: '💁 Solo Idol', m_grp: '🧑‍🤝‍🧑 Group Cheki',
    btnRandom: '🎲 Draw Pose!', btnCustom: '✍️ Custom Pose', cat_all: 'All', cat_custom: 'Custom',
    albumTitle: '📚 Pose Collection', customTitle: '✍️ Create Custom Pose', customSave: 'Save Pose'
  }
};
```

Replace it with:

```js
const DICT = {
  id: {
    title: 'Gacha Pose', subtitle: 'Biar ga mati gaya pas ketemu oshi!', mode: 'Mode:',
    m_std: '📸 Standard (Kamu + Oshi)', m_selfie: '🤳 Duo Selfie', m_solo: '💁 Solo Idol', m_grp: '🧑‍🤝‍🧑 Group Cheki',
    btnRandom: '🎲 Gacha Pose!', btnCustom: '✍️ Tambah Pose', cat_all: 'Semua', cat_custom: 'Custom',
    albumTitle: '📚 Buku Koleksi Pose', customTitle: '✍️ Buat Pose Sendiri', customSave: 'Simpan Pose',
    rulesTitle: '📜 Etika Chekikai'
  },
  en: {
    title: 'Pose Gacha', subtitle: 'No more awkward poses with your oshi!', mode: 'Mode:',
    m_std: '📸 Standard (Fan + Oshi)', m_selfie: '🤳 Duo Selfie', m_solo: '💁 Solo Idol', m_grp: '🧑‍🤝‍🧑 Group Cheki',
    btnRandom: '🎲 Draw Pose!', btnCustom: '✍️ Custom Pose', cat_all: 'All', cat_custom: 'Custom',
    albumTitle: '📚 Pose Collection', customTitle: '✍️ Create Custom Pose', customSave: 'Save Pose',
    rulesTitle: '📜 Chekikai Etiquette'
  }
};
```

- [ ] **Step 2: Add the `RULES` state variable**

Find:

```js
let POSES = [];
const collection = JSON.parse(localStorage.getItem('cheki-collection') || '[]');
```

Replace it with:

```js
let POSES = [];
let RULES = { id: [], en: [] };
const collection = JSON.parse(localStorage.getItem('cheki-collection') || '[]');
```

- [ ] **Step 3: Add `renderRules()` and the open/close listeners**

Find:

```js
document.getElementById('btnCloseAlbum').addEventListener('click', () => {
  document.getElementById('albumModal').classList.remove('open');
});
```

Immediately after it (before the `// v1.4 Custom Pose Functions` comment), insert:

```js

// v1.5 Chekikai Etiquette Rules
function renderRules(){
  const list = document.getElementById('rulesList');
  list.innerHTML = '';
  (RULES[currentLang] || []).forEach(rule => {
    const li = document.createElement('li');
    li.textContent = rule;
    list.appendChild(li);
  });
}

document.getElementById('btnRules').addEventListener('click', () => {
  renderRules();
  document.getElementById('rulesModal').classList.add('open');
});

document.getElementById('btnCloseRules').addEventListener('click', () => {
  document.getElementById('rulesModal').classList.remove('open');
});
```

- [ ] **Step 4: Re-render rules live on language toggle**

Find:

```js
function applyLang() {
  document.getElementById('btnLang').innerHTML = currentLang === 'id' ? '🇮🇩 ID' : '🇬🇧 EN';
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if(DICT[currentLang] && DICT[currentLang][key]) el.innerHTML = DICT[currentLang][key];
  });
  document.getElementById('btnDownload').innerHTML = currentLang === 'id' ? '💾 Simpan PNG' : '💾 Save PNG';
  document.getElementById('btnCopyLink').innerHTML = currentLang === 'id' ? '🔗 Copy Link' : '🔗 Copy Link';
  document.getElementById('btnCopyText').innerHTML = currentLang === 'id' ? '📋 Copy Instruksi' : '📋 Copy Text';
}
```

Replace it with:

```js
function applyLang() {
  document.getElementById('btnLang').innerHTML = currentLang === 'id' ? '🇮🇩 ID' : '🇬🇧 EN';
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if(DICT[currentLang] && DICT[currentLang][key]) el.innerHTML = DICT[currentLang][key];
  });
  document.getElementById('btnDownload').innerHTML = currentLang === 'id' ? '💾 Simpan PNG' : '💾 Save PNG';
  document.getElementById('btnCopyLink').innerHTML = currentLang === 'id' ? '🔗 Copy Link' : '🔗 Copy Link';
  document.getElementById('btnCopyText').innerHTML = currentLang === 'id' ? '📋 Copy Instruksi' : '📋 Copy Text';
  if (document.getElementById('rulesModal').classList.contains('open')) renderRules();
}
```

- [ ] **Step 5: Load `rules.json` and fetch it concurrently with `poses.json`**

Find:

```js
// v1.5 Pose data loaded from poses.json (async)
async function loadPoses(){
  const res = await fetch('poses.json');
  const basePoses = await res.json();
  const savedCustom = JSON.parse(localStorage.getItem('cheki-custom') || '[]');
  POSES = [...basePoses, ...savedCustom];
}

async function init(){
  btn.disabled = true;
  await loadPoses();
  btn.disabled = false;

  applyLang();
```

Replace it with:

```js
// v1.5 Pose data loaded from poses.json (async)
async function loadPoses(){
  const res = await fetch('poses.json');
  const basePoses = await res.json();
  const savedCustom = JSON.parse(localStorage.getItem('cheki-custom') || '[]');
  POSES = [...basePoses, ...savedCustom];
}

async function loadRules(){
  const res = await fetch('rules.json');
  RULES = await res.json();
}

async function init(){
  btn.disabled = true;
  await Promise.all([loadPoses(), loadRules()]);
  btn.disabled = false;

  applyLang();
```

- [ ] **Step 6: Verify JS syntax**

Run: `cd /home/sekuyy/project/cheki-pose-gacha && node --check app.js`
Expected: no output, exit code 0.

- [ ] **Step 7: Verify the new symbols exist exactly once**

Run:
```bash
cd /home/sekuyy/project/cheki-pose-gacha && node -e "
const src = require('fs').readFileSync('app.js', 'utf8');
const checks = {
  'let RULES': (src.match(/let RULES = /g)||[]).length,
  'loadRules def': (src.match(/async function loadRules/g)||[]).length,
  'renderRules def': (src.match(/function renderRules/g)||[]).length,
  'btnRules listener': (src.match(/getElementById\('btnRules'\)/g)||[]).length,
  'btnCloseRules listener': (src.match(/getElementById\('btnCloseRules'\)/g)||[]).length,
  'Promise.all loadPoses+loadRules': (src.match(/Promise\.all\(\[loadPoses\(\), loadRules\(\)\]\)/g)||[]).length,
};
let ok = true;
for (const [k,v] of Object.entries(checks)) {
  const pass = v === 1;
  if (!pass) ok = false;
  console.log((pass ? 'OK  ' : 'FAIL') + '  ' + k + ' = ' + v);
}
process.exit(ok ? 0 : 1);
"
```
Expected: all six lines print `OK` with count `1`.

- [ ] **Step 8: Commit**

```bash
cd /home/sekuyy/project/cheki-pose-gacha
git add app.js
git commit -m "$(cat <<'EOF'
feat: load and render chekikai etiquette rules

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: End-to-end manual verification over a local server

**Files:** none (verification only).

**Interfaces:** none — this task exercises Tasks 1–4 together as a user would.

- [ ] **Step 1: Start a local static server**

Run: `cd /home/sekuyy/project/cheki-pose-gacha && python3 -m http.server 8642 &`
Expected: server starts, prints `Serving HTTP on :: port 8642 ...`.

- [ ] **Step 2: Confirm all files serve with 200**

Run:
```bash
for f in index.html style.css app.js poses.json rules.json; do
  echo -n "$f: "
  curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:8642/$f"
done
```
Expected: every line ends in `200`.

- [ ] **Step 3: Manually verify in a real browser**

Open `http://localhost:8642/` in a browser (the user's Zen browser, or any browser — this step cannot be automated in this environment) and check:
- The `📜` button appears next to `🎲 Gacha Pose!` and `📚`.
- Clicking `📜` opens a modal titled "📜 Etika Chekikai" with 7 rule items, each in its own rounded card.
- Clicking `×` closes it.
- Clicking the `🇮🇩 ID` / `🇬🇧 EN` toggle while the rules modal is open updates both the title and all 7 rule strings to English/Indonesian in place.
- Opening `📚` Album and `✍️ Tambah Pose` still work as before (no regression).
- Gacha button still works, pity/rarity display unaffected (no regression).
- Browser console has no errors.

- [ ] **Step 4: Stop the local server**

Run: `pkill -f "http.server 8642"`
Expected: server process terminated, no error needed if already stopped.

---

## Self-Review Notes

- **Spec coverage:** rules.json (Task 1) ✓, modal markup + button (Task 2) ✓, styling (Task 3) ✓, load/render/open/close/i18n-live-update (Task 4) ✓, error handling for missing `rules.json` is implicit — `RULES` stays `{id:[],en:[]}` until `loadRules()` resolves, and `renderRules()` on an empty array just renders an empty list, matching the spec's "Error Handling" section. Testing commands from the spec (`node --check`, `python3 -m json.tool`, manual local-server check) are covered in Tasks 1, 4, and 5.
- **Placeholder scan:** none found — all steps have literal code/commands and exact expected output.
- **Type consistency:** `RULES` is `{ id: string[], en: string[] }` everywhere it's referenced (Task 1's JSON shape, Task 4's declaration and `loadRules()`/`renderRules()` usage). Element IDs (`btnRules`, `rulesModal`, `btnCloseRules`, `rulesList`) match exactly between Task 2 (HTML) and Task 4 (JS).
