let currentLang = localStorage.getItem('cheki-lang') || 'id';
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

let POSES = [];
let RULES = { id: [], en: [] };
const collection = JSON.parse(localStorage.getItem('cheki-collection') || '[]');

const tray = document.getElementById('tray');
const btn = document.getElementById('btnRandom');
const flash = document.getElementById('flash');
const counter = document.getElementById('counter');
const emptyHint = document.getElementById('emptyHint');
const filterWrap = document.getElementById('filters');
const modeSelect = document.getElementById('gachaMode');
const actionsBar = document.getElementById('actionsBar');

let currentCat = 'all';
let currentMode = 'standard';
let count = parseInt(localStorage.getItem('cheki-count') || 0);
let lastIndex = -1;
let activePose = null;
let pityCounter = parseInt(localStorage.getItem('cheki-pity') || 0);
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

modeSelect.addEventListener('change', e=>{
  currentMode = e.target.value;
});

filterWrap.addEventListener('click', e=>{
  const chip = e.target.closest('.chip');
  if(!chip) return;
  filterWrap.querySelectorAll('.chip').forEach(c=>c.classList.remove('active'));
  chip.classList.add('active');
  currentCat = chip.dataset.cat;
});

function pickPose(){
  let pool = POSES.filter(p => p.mode === currentMode && (currentCat === 'all' || p.cat === currentCat));

  if(pool.length === 0) {
    return {
      id: 'empty', rarity: 'N', cat: currentCat, mode: currentMode,
      name: 'Pose Kosong!', kao: '(・_・;)',
      idol: 'Belum ada pose untuk kombinasi filter dan mode ini.',
      stickers: ['😅','']
    };
  }

  // Pity system check (Setiap 10 kali gacha = dijamin SSR)
  pityCounter++;
  localStorage.setItem('cheki-pity', pityCounter);
  if (pityCounter >= 10) {
    // Cari SSR di pool yang kefilter kategori dulu, tapi kalau kategori ini
    // emang nggak punya SSR sama sekali, lebar-in pencarian ke seluruh mode
    // yang aktif biar janji "dijamin SSR" tetap bisa ditepati.
    let ssrPool = pool.filter(p => p.rarity === 'SSR');
    if (ssrPool.length === 0) {
      ssrPool = POSES.filter(p => p.mode === currentMode && p.rarity === 'SSR');
    }
    if (ssrPool.length > 0) pool = ssrPool;
  }

  // Weighted random
  let weightSum = 0;
  const itemWeights = pool.map(p => {
    let w = 60; // N
    if (p.rarity === 'R') w = 25;
    else if (p.rarity === 'SR') w = 12;
    else if (p.rarity === 'SSR') w = 3;
    weightSum += w;
    return w;
  });

  let idx = 0;
  let selectedPose;
  let tries = 0;
  do {
    let rand = Math.random() * weightSum;
    for (let i = 0; i < pool.length; i++) {
      if (rand < itemWeights[i]) {
        idx = i;
        break;
      }
      rand -= itemWeights[i];
    }
    selectedPose = pool[idx];
    tries++;
  } while (pool.length > 1 && POSES.indexOf(selectedPose) === lastIndex && tries < 5);

  lastIndex = POSES.indexOf(selectedPose);

  if (selectedPose.rarity === 'SSR') {
    pityCounter = 0; // Reset pity after getting SSR
    localStorage.setItem('cheki-pity', pityCounter);
  }

  // Update collection
  if(selectedPose.id !== 'empty' && !collection.includes(selectedPose.id)) {
      collection.push(selectedPose.id);
      localStorage.setItem('cheki-collection', JSON.stringify(collection));
  }

  return selectedPose;
}

const CAT_LABEL = {classic:'Classic', lucu:'Lucu', sweet:'Sweet', chaos:'Chaos', custom:'Custom'};

function renderCheki(pose){
  const el = document.createElement('div');
  el.className = 'cheki';

  let captionHTML = '';
  if (pose.mode === 'solo' && pose.name !== 'Pose Kosong!') {
    captionHTML += `<div class="role-line"><span class="role-tag idol">Oshi</span><span>${pose.idol}</span></div>`;
  } else if (pose.mode === 'group' && pose.name !== 'Pose Kosong!') {
    captionHTML += `<div class="role-line"><span class="role-tag you">Kamu</span><span>${pose.you || ''}</span></div>`;
    captionHTML += `<div class="role-line"><span class="role-tag idol">Oshi 1</span><span>${pose.idol1 || ''}</span></div>`;
    captionHTML += `<div class="role-line"><span class="role-tag idol">Oshi 2</span><span>${pose.idol2 || ''}</span></div>`;
  } else {
    // standard or selfie or fallback
    if(pose.you) captionHTML += `<div class="role-line"><span class="role-tag you">Kamu</span><span>${pose.you}</span></div>`;
    if(pose.idol) captionHTML += `<div class="role-line"><span class="role-tag idol">Oshi</span><span>${pose.idol}</span></div>`;
  }

  el.innerHTML = `
    <div class="photo">
      <span class="sticker s1">${pose.stickers[0]}</span>
      <span class="sticker s2">${pose.stickers[1]}</span>
      <div style="display:flex; gap:6px; align-items:center;">
        <span class="pose-cat">${CAT_LABEL[pose.cat] || '???'}</span>
        <span class="rarity-badge rarity-${(pose.rarity || 'N').toLowerCase()}" style="margin:0">${pose.rarity || 'N'}</span>
      </div>
      <div class="kaomoji">${pose.kao}</div>
      <div class="pose-name">${pose.name}</div>
    </div>
    <div class="caption">
      ${captionHTML}
      <div class="signature">— cheki #${String(count).padStart(3,'0')} ♡</div>
    </div>`;

  activePose = pose;
  actionsBar.style.display = 'flex';

  return el;
}

btn.addEventListener('click', ()=>{
  btn.disabled = true;
  emptyHint.style.display = 'none';
  count++;
  localStorage.setItem('cheki-count', count);

  // flash pop
  flash.classList.add('pop');
  setTimeout(()=>flash.classList.remove('pop'), 180);

  // remove old cheki
  const old = tray.querySelector('.cheki');
  if(old) old.remove();

  const pose = pickPose();
  const cheki = renderCheki(pose);
  tray.appendChild(cheki);

  // trigger print animation
  requestAnimationFrame(()=>{
    cheki.classList.add('printing');
  });

  // Status message
  if (pose.rarity === 'SSR') {
    counter.innerHTML = currentLang === 'id'
      ? `Udah gacha <b>${count}</b> kali ✦ 🎉 SELAMAT! KAMU DAPAT SSR! 🎉`
      : `Pulled <b>${count}</b> times ✦ 🎉 WOW! YOU GOT SSR! 🎉`;
  } else if (pose.rarity === 'SR') {
    counter.innerHTML = currentLang === 'id'
      ? `Udah gacha <b>${count}</b> kali ✦ Wihh dapat SR nih! ✨`
      : `Pulled <b>${count}</b> times ✦ Nice, it's an SR! ✨`;
  } else {
    counter.innerHTML = currentLang === 'id'
      ? `Udah gacha <b>${count}</b> kali ✦ ${Math.max(0, 10 - pityCounter)} roll lagi menuju guaranteed SSR!`
      : `Pulled <b>${count}</b> times ✦ ${Math.max(0, 10 - pityCounter)} rolls until guaranteed SSR!`;
  }

  setTimeout(()=>{ btn.disabled = false; }, reduceMotion? 150 : 1000);
});

// v1.2 Shareability Functions
document.getElementById('btnCopyLink').addEventListener('click', () => {
  if(!activePose || !activePose.id) return;
  const url = new URL(window.location.href);
  url.searchParams.set('pose', activePose.id);
  navigator.clipboard.writeText(url.toString())
    .then(() => alert('✅ Link berhasil dicopy! Kasih ke temanmu supaya mereka dapet pose ini.'));
});

document.getElementById('btnCopyText').addEventListener('click', () => {
  if(!activePose) return;
  let txt = `📸 Pose Gacha: ${activePose.name}\n`;
  if(activePose.you) txt += `Fan: ${activePose.you}\n`;
  if(activePose.idol) txt += `Oshi: ${activePose.idol}\n`;
  if(activePose.idol1) txt += `Oshi 1: ${activePose.idol1}\n`;
  if(activePose.idol2) txt += `Oshi 2: ${activePose.idol2}\n`;
  navigator.clipboard.writeText(txt)
    .then(() => alert('✅ Instruksi berhasil dicopy!'));
});

document.getElementById('btnDownload').addEventListener('click', () => {
  const el = tray.querySelector('.cheki');
  if(!el || !window.html2canvas) {
    alert('Loading script... coba sebentar lagi!');
    return;
  }

  // Temporarily remove animation for capturing
  const oldTransform = el.style.transform;
  const oldAnimation = el.style.animation;
  const oldOpacity = el.style.opacity;

  el.style.animation = 'none';
  el.style.transform = 'translateY(0) rotate(-1.4deg)'; // tetapkan rotasi sedikit supaya estetik
  el.style.opacity = '1'; // FIX: karena default CSS-nya opacity: 0

  // Beri jeda sedikit agar browser menerapkan style CSS yang baru sebelum di-capture
  setTimeout(() => {
    html2canvas(el, { backgroundColor: null, scale: 2, logging: false }).then(canvas => {
      const link = document.createElement('a');
      link.download = `cheki-${activePose.id || 'gacha'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      // Restore styling
      el.style.transform = oldTransform;
      el.style.animation = oldAnimation;
      el.style.opacity = oldOpacity;
    });
  }, 100);
});

// v1.3 Collection Book Functions
document.getElementById('btnAlbum').addEventListener('click', () => {
  const grid = document.getElementById('albumGrid');
  grid.innerHTML = '';
  POSES.forEach(p => {
    const isUnlocked = collection.includes(p.id) || p.cat === 'custom';
    const div = document.createElement('div');
    div.className = `album-item ${isUnlocked ? '' : 'locked'}`;
    div.innerHTML = `
      <span class="rarity-badge rarity-${p.rarity.toLowerCase()}">${p.rarity}</span>
      <div style="font-size:1.6rem; margin: .2rem 0">${isUnlocked ? p.kao : '❓'}</div>
      <strong class="pose-title">${isUnlocked ? p.name : 'Unknown Pose'}</strong>
    `;
    grid.appendChild(div);
  });
  document.getElementById('albumModal').classList.add('open');
});

document.getElementById('btnCloseAlbum').addEventListener('click', () => {
  document.getElementById('albumModal').classList.remove('open');
});

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

// v1.4 Custom Pose Functions
document.getElementById('btnCustomPose').addEventListener('click', () => {
  document.getElementById('customModal').classList.add('open');
});
document.getElementById('btnCloseCustom').addEventListener('click', () => {
  document.getElementById('customModal').classList.remove('open');
});
document.getElementById('customForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const cpName = document.getElementById('cpName').value;
  const cpKao = document.getElementById('cpKao').value;
  const cpYou = document.getElementById('cpYou').value;
  const cpIdol = document.getElementById('cpIdol').value;

  const newPose = {
    id: 'custom-' + Date.now(), rarity: 'SR', mode: 'standard', cat: 'custom',
    name: cpName, kao: cpKao, you: cpYou, idol: cpIdol, stickers: ['✨','🎨']
  };
  POSES.push(newPose);

  const customSaved = JSON.parse(localStorage.getItem('cheki-custom') || '[]');
  customSaved.push(newPose);
  localStorage.setItem('cheki-custom', JSON.stringify(customSaved));

  if(!collection.includes(newPose.id)){
    collection.push(newPose.id);
    localStorage.setItem('cheki-collection', JSON.stringify(collection));
  }

  document.getElementById('customModal').classList.remove('open');
  document.getElementById('customForm').reset();
  alert(currentLang==='id'?'Custom pose berhasil disimpan!':'Custom pose saved!');
});

// v1.4 Theme Picker
const savedTheme = localStorage.getItem('cheki-theme');
if (savedTheme && savedTheme !== 'default') document.body.classList.add(savedTheme);
document.querySelectorAll('.theme-dot').forEach(btn => {
  btn.addEventListener('click', () => {
    document.body.className = '';
    const t = btn.getAttribute('data-theme');
    if (t !== 'default') document.body.classList.add(t);
    localStorage.setItem('cheki-theme', t);
  });
});

// v1.4 i18n Application
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
document.getElementById('btnLang').addEventListener('click', () => {
  currentLang = currentLang === 'id' ? 'en' : 'id';
  localStorage.setItem('cheki-lang', currentLang);
  applyLang();
});

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

  // Auto-load pose from URL if exists
  const urlParams = new URLSearchParams(window.location.search);
  const poseId = urlParams.get('pose');
  if(poseId) {
    const targetPose = POSES.find(p => p.id === poseId);
    if(targetPose) {
      emptyHint.style.display = 'none';
      count = 1;
      const cheki = renderCheki(targetPose);
      tray.appendChild(cheki);
      cheki.classList.add('printing');
      counter.innerHTML = `Pose di-share temanmu ✦`;

      // Select correct dropdowns
      modeSelect.value = targetPose.mode;
      currentMode = targetPose.mode;

      // Highlight correct category chip
      document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      const targetChip = document.querySelector(`.chip[data-cat="${targetPose.cat}"]`);
      if(targetChip) targetChip.classList.add('active');
      currentCat = targetPose.cat;
    }
  }
}

window.addEventListener('DOMContentLoaded', init);
