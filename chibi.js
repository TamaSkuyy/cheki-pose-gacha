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
