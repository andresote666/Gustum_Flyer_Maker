/* Gustum · Menú del día — editor + exporter
   All content lives in `S` (saved in this browser). The 5 formats are rendered
   from S at their real 1080px size, scaled down for preview, and exported as PNG. */

const STORE_KEY = 'gustum-menu-v1';
const PH = 'assets/photos/';
const FONT_CSS_URL = 'https://fonts.googleapis.com/css2?family=Archivo:ital,wght@0,900;1,900&family=Barlow+Condensed:wght@600;700;800;900&family=Playfair+Display:ital,wght@1,600&display=swap';

const FORMATS = [
  { id: 'story', label: 'Historia', sub: 'Story 1080×1920', h: 1920, file: 'historia' },
  { id: 'feed', label: 'Publicación', sub: 'Feed 1080×1350', h: 1350, file: 'publicacion' },
  { id: 'c1', label: 'Carrusel 1', sub: 'Especiales', h: 1350, file: 'carrusel-1-especiales' },
  { id: 'c2', label: 'Carrusel 2', sub: 'Sopas y bebidas', h: 1350, file: 'carrusel-2-sopas' },
  { id: 'c3', label: 'Carrusel 3', sub: 'Almuerzo y dieta', h: 1350, file: 'carrusel-3-almuerzo' },
];

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

/* ---------------- state ---------------- */
const uid = () => Math.random().toString(36).slice(2, 9);
const dish = (name, price) => ({ id: uid(), name, price });

function isoDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function defaults() {
  return {
    date: isoDate(new Date()),
    especiales: [
      dish('Ceviche mixto de pescado y camarón, con chifle', '9.50'),
      dish('Lomo fino, moro de lenteja y ensalada', '12.00'),
      dish('Lomito salteado con moro de lenteja', '9.50'),
      dish('Churrasco de lomo de asado', '9.50'),
      dish('Lomo de asado, moro de lenteja y ensalada', '9.00'),
      dish('Pescado a la plancha, papas y ensalada', '8.50'),
      dish('Menestra de fréjol con lomo de asado', '8.50'),
      dish('Bistec de carne', '7.95'),
      dish('Bistec de hígado', '7.95'),
    ],
    sopas: [
      dish('Chupe de pescado con camarón', '8.50'),
      dish('Caldo de pata de res (1 litro)', '7.00'),
      dish('Caldo de bolas de carne (1 litro)', '7.00'),
    ],
    almuerzo: {
      price: '6',
      sopa: { name: 'Aguado de gallina', photo: PH + 'aguado.jpg' },
      platos: [
        { name: 'Filete de carne, moro de fréjol y ensalada', photo: PH + 'plato1.jpg' },
        { name: 'Chuleta de cerdo, menestra de lenteja y maduro', photo: PH + 'plato2.jpg' },
        { name: 'Pollo al horno en salsa de tomillo y ensalada rusa', photo: PH + 'plato3.jpg' },
      ],
    },
    dieta: {
      price: '7',
      sopa: { name: 'Crema de zambo', photo: PH + 'crema.jpg' },
      plato: { name: 'Fajita de lomito de asado en salsa de champiñones, con puré y ensalada', photo: PH + 'fajita.jpg' },
    },
    bebidas: { jugos: { photo: PH + 'jugos.jpg' }, cafe: { photo: PH + 'cafe.jpg' } },
    // the photos that appear on the carousels (exactly as many slots as the design shows)
    fotos: {
      especiales: [{ photo: PH + 'ceviche.jpg' }, { photo: PH + 'menestra.jpg' }], // Carrusel 1
      sopa: { photo: PH + 'sopa2.jpg' }, // Carrusel 2
    },
    whatsapp: '098 511 7963',
  };
}

// Earlier versions kept a photo on every dish row, but only the first ones were ever shown.
// Move those photos into the carousel photo slots and drop the rest.
function normalize(data) {
  const S = Object.assign(defaults(), data);
  if (!data.fotos) {
    const keep = (h) => (h ? { photo: h.photo, crop: h.crop } : { photo: '' });
    const withPhoto = (list) => (list || []).filter((d) => d.photo);
    const e = withPhoto(data.especiales);
    S.fotos = { especiales: [keep(e[0]), keep(e[1])], sopa: keep(withPhoto(data.sopas)[0]) };
  }
  [...S.especiales, ...S.sopas].forEach((d) => { delete d.photo; delete d.crop; });
  return S;
}

function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return normalize(JSON.parse(raw));
  } catch (e) { /* storage blocked or corrupt — fall back to the example */ }
  return defaults();
}

let S = load();
let active = 'story';
let lastDeleted = null;

const getPath = (path) => path.split('.').reduce((o, k) => o?.[k], S);
function setPath(path, value) {
  const keys = path.split('.');
  const last = keys.pop();
  keys.reduce((o, k) => o[k], S)[last] = value;
}

/* ---------------- formatting ---------------- */
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function formatDate(iso) {
  const d = new Date(iso + 'T12:00:00');
  if (isNaN(d)) return '';
  return `${DIAS[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]}`.toUpperCase();
}
function num(v) {
  const n = parseFloat(String(v ?? '').replace(',', '.').replace(/[^0-9.]/g, ''));
  return isNaN(n) ? null : n;
}
const money = (v) => { const n = num(v); return n == null ? '' : '$' + n.toFixed(2); };
const moneyShort = (v) => { const n = num(v); return n == null ? '' : '$' + (Number.isInteger(n) ? n : n.toFixed(2)); };
const filled = (list) => list.filter((d) => d.name.trim());

/* ---------------- photo framing (zoom + position) ----------------
   Every photo lives on a "holder" object: { photo, crop: { z, x, y, ar } }.
   z = zoom (1 = just fills the shape), x/y = 0–100 (which part of the photo shows),
   ar = the photo's width/height. Sizes are in % of the shape, so the same framing
   works for the small thumbnail, the preview and the 1080px export. */
const CROP0 = { z: 1, x: 50, y: 50 };
const cropOf = (h) => ({ ...CROP0, ...h.crop });

function photoGeom(c, boxAR) {
  let w = 100, h = 100;
  if (c.ar > boxAR) w = (100 * c.ar) / boxAR; else h = (100 * boxAR) / c.ar;
  w *= c.z; h *= c.z;
  return { w, h, left: (-(w - 100) * c.x) / 100, top: (-(h - 100) * c.y) / 100 };
}

function photoImg(holder, boxAR = 1) {
  const c = cropOf(holder);
  const src = esc(holder.photo);
  if (!c.ar) return `<img class="ph" src="${src}" alt="" style="left:0;top:0;width:100%;height:100%;object-fit:cover;object-position:${c.x}% ${c.y}%">`;
  const g = photoGeom(c, boxAR);
  return `<img class="ph" src="${src}" alt="" style="width:${g.w.toFixed(3)}%;height:${g.h.toFixed(3)}%;left:${g.left.toFixed(3)}%;top:${g.top.toFixed(3)}%">`;
}

const photoHolders = () => [...S.fotos.especiales, S.fotos.sopa, S.almuerzo.sopa, ...S.almuerzo.platos,
  S.dieta.sopa, S.dieta.plato, S.bebidas.jugos, S.bebidas.cafe];

// photos saved before framing existed (and the example photos) need their shape measured once
function ensureAspects() {
  const todo = photoHolders().filter((h) => h.photo && !h.crop?.ar);
  return Promise.all(todo.map((h) => new Promise((res) => {
    const im = new Image();
    im.onload = () => { h.crop = { ...cropOf(h), ar: im.naturalWidth / im.naturalHeight }; res(); };
    im.onerror = res;
    im.src = h.photo;
  }))).then(() => todo.length > 0);
}

// inner size (inside the white border) of the drink pictures, as width/height
const BOX_AR = {
  'bebidas.jugos': { footer: 66 / 76, panel: 154 / 176 },
  'bebidas.cafe': { footer: 112 / 76, panel: 264 / 176 },
};

/* ---------------- frame partials ---------------- */
const header = () => `
  <div class="f-hdr">
    <div class="f-logo">
      <img class="lg-gustu" src="assets/logo-gustu.svg" alt="">
      <img class="lg-m" src="assets/logo-m.svg" alt="">
      <img class="lg-dot" src="assets/logo-dot.svg" alt="">
      <p class="lg-tag">Comida tradicional</p>
    </div>
    <div class="f-sundate">
      <img class="f-sun" src="assets/sun.svg" alt="">
      <p class="f-date">${esc(formatDate(S.date))}</p>
    </div>
  </div>
  <div class="f-flag">
    <i></i><i class="w"></i><i class="t"></i><i class="w"></i><i></i>
    <img src="assets/star-small.svg" style="left:488.5px" alt="">
    <img src="assets/star-small.svg" style="left:532.5px" alt="">
    <img src="assets/star-small.svg" style="left:576.5px" alt="">
  </div>`;

const title = (t, swipe) => `
  <div class="f-title${swipe ? ' big' : ''}">
    <p class="f-title-t">${t}</p>${swipe ? '<p class="f-swipe">DESLIZA →</p>' : ''}
  </div>`;

const plate = (holder, size) => holder?.photo
  ? `<div class="plate" style="--s:${size}px">${photoImg(holder, 1)}</div>`
  : `<div class="plate empty" style="--s:${size}px"></div>`;

const items = (list) => filled(list).map((d) => `
  <div class="f-item" data-fit="row">
    <p class="f-iname">${esc(d.name)}</p><span class="f-lead"></span><p class="f-iprice">${money(d.price)}</p>
  </div>`).join('');

const burst = (color, text, cls) => text ? `
  <div class="f-burst ${cls}"><div class="f-burst-in">
    <img src="assets/burst-${color}.svg" alt=""><p data-fit="w">${esc(text)}</p>
  </div></div>` : '';

function almuerzo(variant) {
  const a = S.almuerzo;
  const size = variant === 'feed' ? 206 : 176;
  return `
  <div class="f-alm ${variant}">
    <div class="f-alm-head">
      <div class="f-tab"><p>ALMUERZO DE HOY</p></div>
      ${burst('orange', moneyShort(a.price), 'alm')}
    </div>
    ${a.sopa.name.trim() ? `
    <div class="f-sopa" data-fit="w">
      ${plate(a.sopa, 74)}
      <div class="f-sopa-txt"><p class="f-sopa-l">SOPA DEL DÍA:</p><p class="f-sopa-n">${esc(a.sopa.name)}</p></div>
      <p class="f-sopa-cta">·  ELIJA SU PLATO FUERTE ↓</p>
    </div>` : ''}
    <div class="f-platos">
      ${a.platos.map((p, i) => p.name.trim() ? `
        <div class="f-plato">
          <p class="f-pnum">${i + 1}</p>
          ${plate(p, size)}
          <p class="f-pname" data-fit="h">${esc(p.name)}</p>
        </div>` : '').join('')}
    </div>
  </div>`;
}

function dieta() {
  const d = S.dieta;
  if (!d.sopa.name.trim() && !d.plato.name.trim()) return '';
  const photos = [d.sopa, d.plato].filter((h) => h.photo);
  return `
  <div class="f-dieta-wrap"><div class="f-dieta">
    ${photos.length ? `<div class="f-dplates">${photos.map((p) => plate(p, 150)).join('')}</div>` : ''}
    <div class="f-dtext">
      <p class="f-dtitle">DIETA DEL DÍA</p>
      <div class="f-dbox" data-fit="h">
        ${d.sopa.name.trim() ? `<p class="f-dsopa">${esc(d.sopa.name)}</p>` : ''}
        ${d.plato.name.trim() ? `<p class="f-dplato">${esc(d.plato.name)}</p>` : ''}
      </div>
    </div>
    ${burst('blue', moneyShort(d.price), 'dieta')}
  </div></div>`;
}

const footer = (drinks) => `
  <div class="f-foot">
    <div class="f-wa"><p class="f-wa-l">PEDIDOS POR WHATSAPP</p><p class="f-wa-n" data-fit="w">${esc(S.whatsapp)}</p></div>
    ${drinks ? `
    <div class="f-drinks">
      ${S.bebidas.jugos.photo ? `<div class="f-rect" style="width:74px">${photoImg(S.bebidas.jugos, BOX_AR['bebidas.jugos'].footer)}</div>` : ''}
      ${S.bebidas.cafe.photo ? `<div class="f-rect" style="width:120px">${photoImg(S.bebidas.cafe, BOX_AR['bebidas.cafe'].footer)}</div>` : ''}
      <p>Jugos naturales<br>y café</p>
    </div>` : ''}
  </div>`;

const SPACER = '<div class="f-spacer"></div>';

function storyLists() {
  const e = filled(S.especiales), s = filled(S.sopas);
  if (!e.length && !s.length) return '';
  return `<div class="f-lists">
    ${e.length ? `<p class="f-head">ESPECIALES DEL DÍA</p>${items(S.especiales)}` : ''}
    ${s.length ? `<p class="f-head${e.length ? ' second' : ''}">SOPAS ESPECIALES</p>${items(S.sopas)}` : ''}
  </div>`;
}

function carousel1() {
  const photos = S.fotos.especiales.filter((h) => h.photo);
  return header() + title('ESPECIALES', true)
    + `<div class="f-lists big">${items(S.especiales)}</div>`
    + (photos.length ? `<div class="f-cplates">${photos.map((p) => plate(p, 230)).join('')}</div>` : '')
    + SPACER + footer(true);
}

function carousel2() {
  const photo = S.fotos.sopa.photo ? S.fotos.sopa : null;
  const b = S.bebidas;
  return header() + title('SOPAS', true)
    + `<div class="f-sopas">
        <div class="f-lists big">${items(S.sopas)}</div>
        ${photo ? `<div class="f-cpl">${plate(photo, 230)}</div>` : ''}
      </div>
      <div class="f-beb">
        <div class="f-tab sm"><p>PARA ACOMPAÑAR</p></div>
        <div class="f-panels">
          <div class="f-panel"><div class="f-pic" style="width:170px">${b.jugos.photo ? photoImg(b.jugos, BOX_AR['bebidas.jugos'].panel) : ''}</div><p>Jugos naturales</p></div>
          <div class="f-panel"><div class="f-pic" style="width:280px">${b.cafe.photo ? photoImg(b.cafe, BOX_AR['bebidas.cafe'].panel) : ''}</div><p>Café</p></div>
        </div>
      </div>`
    + SPACER + footer(false);
}

const BUILD = {
  story: () => header() + title('MENÚ DEL DÍA') + storyLists() + almuerzo('story') + dieta() + SPACER + footer(true),
  feed: () => header() + title('MENÚ DEL DÍA') + almuerzo('feed') + dieta() + SPACER + footer(true),
  c1: carousel1,
  c2: carousel2,
  c3: () => header() + title('MENÚ DEL DÍA') + almuerzo('feed') + dieta() + SPACER + footer(true),
};

/* ---------------- auto-fit: keep long text inside the design ---------------- */
function shrinkFont(el, overflows, minRatio) {
  let fs = parseFloat(getComputedStyle(el).fontSize);
  const min = fs * minRatio;
  while (overflows() && fs > min) { fs -= 1; el.style.fontSize = fs + 'px'; }
}

function fitRows(frame) {
  // a long dish name shrinks a little, then wraps to two lines
  frame.querySelectorAll('[data-fit="row"]').forEach((row) => {
    row.style.removeProperty('--f'); row.classList.remove('wrap');
    const over = () => row.scrollWidth > row.clientWidth + 1;
    let f = 1;
    while (over() && f > 0.9) { f -= 0.02; row.style.setProperty('--f', f.toFixed(3)); }
    if (over()) { row.style.removeProperty('--f'); row.classList.add('wrap'); }
  });
}

function fitFrame(frame) {
  frame.querySelectorAll('[data-fit]').forEach((el) => { el.style.fontSize = ''; });
  frame.querySelectorAll('[data-fit="w"]').forEach((el) => shrinkFont(el, () => el.scrollWidth > el.clientWidth + 1, 0.55));
  frame.querySelectorAll('[data-fit="h"]').forEach((el) => shrinkFont(el, () => el.scrollHeight > el.clientHeight + 1, 0.6));
  // too many dishes for the page: shrink the lists until everything fits
  let k = 1;
  for (;;) {
    frame.style.setProperty('--k', k.toFixed(3));
    fitRows(frame);
    if (frame.scrollHeight <= frame.clientHeight + 1 || k <= 0.6) break;
    k -= 0.02;
  }
  return frame.scrollHeight <= frame.clientHeight + 1;
}

/* ---------------- preview ---------------- */
const $ = (sel, root = document) => root.querySelector(sel);
const stage = $('#stage');
const tabs = $('#tabs');

function buildPreviewShell() {
  tabs.innerHTML = FORMATS.map((f) => `
    <button class="tab" role="tab" data-tab="${f.id}" aria-selected="${f.id === active}">
      <b>${f.label}</b><small>${f.sub}</small>
    </button>`).join('');
  stage.innerHTML = FORMATS.map((f) => `
    <div class="holder" data-id="${f.id}">
      <div class="scaler"><div class="scale-in"><div class="frame h${f.h}" data-frame="${f.id}"></div></div></div>
    </div>`).join('');
}

function renderFrames() {
  const problems = [];
  FORMATS.forEach((f) => {
    const holder = $(`.holder[data-id="${f.id}"]`);
    holder.className = 'holder ' + (f.id === active ? 'active' : 'offstage');
    const frame = $('.frame', holder);
    frame.innerHTML = BUILD[f.id]();
    const ok = fitFrame(frame);
    $(`.tab[data-tab="${f.id}"]`).classList.toggle('has-warn', !ok);
    if (!ok) problems.push(f.label);
  });
  const warn = $('#warn');
  warn.hidden = !problems.length;
  warn.textContent = problems.length
    ? `Hay demasiados platos para que todo quepa en: ${problems.join(', ')}. Quite uno o acorte los nombres.`
    : '';
  scalePreview();
}

function scalePreview() {
  const f = FORMATS.find((x) => x.id === active);
  const wide = window.innerWidth > 960;
  const availW = stage.clientWidth || 400;
  // computer: the picture fills the room left between the tabs and the buttons
  const availH = wide ? Math.max(stage.clientHeight - 18, 150) : Infinity;
  const s = Math.min(availW / 1080, availH / f.h, 1);
  const holder = $(`.holder[data-id="${active}"]`);
  const scaler = $('.scaler', holder);
  scaler.style.width = 1080 * s + 'px';
  scaler.style.height = f.h * s + 'px';
  $('.scale-in', holder).style.transform = `scale(${s})`;
}

function setActive(id) {
  active = id;
  tabs.querySelectorAll('.tab').forEach((t) => t.setAttribute('aria-selected', t.dataset.tab === id));
  FORMATS.forEach((f) => { $(`.holder[data-id="${f.id}"]`).className = 'holder ' + (f.id === id ? 'active' : 'offstage'); });
  scalePreview();
}

tabs.addEventListener('click', (e) => {
  const t = e.target.closest('[data-tab]');
  if (t) setActive(t.dataset.tab);
});
new ResizeObserver(() => scalePreview()).observe(stage);
window.addEventListener('resize', scalePreview);

/* ---------------- editor ---------------- */
const editor = $('#editor');

const ICON = {
  cam: '<svg viewBox="0 0 24 24"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',
  up: '<svg viewBox="0 0 24 24"><path d="M12 19V5m0 0-6 6m6-6 6 6"/></svg>',
  down: '<svg viewBox="0 0 24 24"><path d="M12 5v14m0 0-6-6m6 6 6-6"/></svg>',
  del: '<svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6m4-6v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
  plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
};

const attr = (s) => esc(s);

function photoPicker(path, holder, big) {
  const has = !!holder.photo;
  return `
  <div class="photo${has ? ' has' : ''}${big ? ' lg' : ''}">
    <button type="button" class="photo-btn" data-photo="${path}" aria-label="${has ? 'Ajustar foto' : 'Agregar foto'}">
      ${has ? photoImg(holder, 1) : `${ICON.cam}<span>Foto</span>`}
    </button>
    ${has ? `<button type="button" class="photo-x" data-unphoto="${path}" aria-label="Quitar foto">✕</button>` : ''}
  </div>`;
}

function rowHTML(key, d, i, len) {
  return `
  <div class="row">
    <label class="name"><span class="sr">Nombre del plato</span>
      <textarea rows="1" class="grow" data-k="${key}.${i}.name" placeholder="Nombre del plato">${esc(d.name)}</textarea></label>
    <label class="price"><span class="cur">$</span><span class="sr">Precio</span>
      <input type="text" inputmode="decimal" data-k="${key}.${i}.price" value="${attr(d.price)}" placeholder="0.00"></label>
    <div class="row-actions">
      <button type="button" class="icon" data-act="up" data-list="${key}" data-i="${i}" ${i === 0 ? 'disabled' : ''} aria-label="Subir">${ICON.up}</button>
      <button type="button" class="icon" data-act="down" data-list="${key}" data-i="${i}" ${i === len - 1 ? 'disabled' : ''} aria-label="Bajar">${ICON.down}</button>
      <button type="button" class="icon danger" data-act="del" data-list="${key}" data-i="${i}" aria-label="Eliminar plato">${ICON.del}</button>
    </div>
  </div>`;
}

// a labelled group of photo slots: what you see here is exactly what appears on the flyer
const photoSlots = (title, hint, slots, showTab) => `
  <div class="sub photo-area" data-show="${showTab}">
    <p class="sub-title">${title}</p>
    <p class="photo-area-hint">${hint} Toque una foto para acercarla o moverla.</p>
    <div class="photo-slots">
      ${slots.map(([path, h, label]) => `<div class="slot">${photoPicker(path + '.photo', h, true)}<span class="lbl">${label}</span></div>`).join('')}
    </div>
  </div>`;

const card = (n, title, hint, body) => `
  <div class="card">
    <div class="card-head"><span class="num">${n}</span><h2>${title}</h2></div>
    ${hint ? `<p class="hint">${hint}</p>` : ''}
    ${body}
  </div>`;

function namedPhoto(path, label, value, multiline, placeholder) {
  const input = multiline
    ? `<textarea class="grow" data-k="${path}.name" rows="2" placeholder="${placeholder}">${esc(value.name)}</textarea>`
    : `<input type="text" data-k="${path}.name" value="${attr(value.name)}" placeholder="${placeholder}">`;
  return `
  <div class="field-photo">
    ${photoPicker(path + '.photo', value, true)}
    <label><span class="lbl">${label}</span>${input}</label>
  </div>`;
}

function renderEditor() {
  const a = S.almuerzo, d = S.dieta, b = S.bebidas;
  editor.innerHTML = [
    card(1, 'Fecha', 'Elija el día del menú.', `
      <div class="inline">
        <input type="date" data-k="date" value="${attr(S.date)}" style="max-width:260px">
        <button type="button" class="btn btn-small" data-day="0">Hoy</button>
        <button type="button" class="btn btn-small" data-day="1">Mañana</button>
      </div>
      <p class="date-out" id="dateOut">${esc(formatDate(S.date))}</p>`),

    card(2, 'Especiales del día', 'Escriba el plato y su precio.', `
      <div class="rows">${S.especiales.map((x, i) => rowHTML('especiales', x, i, S.especiales.length)).join('')}</div>
      <button type="button" class="btn btn-add" data-add="especiales">${ICON.plus} Agregar plato especial</button>
      ${photoSlots('Fotos del Carrusel 1', 'Estas 2 fotos salen en el Carrusel 1, debajo de la lista de especiales.',
        S.fotos.especiales.map((h, i) => ['fotos.especiales.' + i, h, 'Foto ' + (i + 1)]), 'c1')}`),

    card(3, 'Sopas especiales', 'Escriba la sopa y su precio.', `
      <div class="rows">${S.sopas.map((x, i) => rowHTML('sopas', x, i, S.sopas.length)).join('')}</div>
      <button type="button" class="btn btn-add" data-add="sopas">${ICON.plus} Agregar sopa</button>
      ${photoSlots('Foto del Carrusel 2', 'Esta foto sale en el Carrusel 2, al lado de la lista de sopas.',
        [['fotos.sopa', S.fotos.sopa, 'Foto']], 'c2')}`),

    card(4, 'Almuerzo de hoy', 'Un precio para todo el almuerzo: sopa + un plato a elegir.', `
      <label><span class="lbl">Precio del almuerzo</span>
        <span class="price price-big"><span class="cur">$</span><input type="text" inputmode="decimal" data-k="almuerzo.price" value="${attr(a.price)}"></span></label>
      <div class="sub">${namedPhoto('almuerzo.sopa', 'Sopa del día', a.sopa, false, 'Ej: Aguado de gallina')}</div>
      ${a.platos.map((p, i) => `<div class="sub"><p class="sub-title">Plato ${i + 1}</p>${namedPhoto(`almuerzo.platos.${i}`, 'Descripción', p, true, 'Ej: Filete de carne, moro y ensalada')}</div>`).join('')}`),

    card(5, 'Dieta del día', '', `
      <label><span class="lbl">Precio de la dieta</span>
        <span class="price price-big"><span class="cur">$</span><input type="text" inputmode="decimal" data-k="dieta.price" value="${attr(d.price)}"></span></label>
      <div class="sub">${namedPhoto('dieta.sopa', 'Sopa', d.sopa, false, 'Ej: Crema de zambo')}</div>
      <div class="sub">${namedPhoto('dieta.plato', 'Plato fuerte', d.plato, true, 'Ej: Fajita de lomito con puré')}</div>`),

    card(6, 'Bebidas y contacto', '', `
      <div class="inline" style="gap:28px">
        <div class="field-photo">${photoPicker('bebidas.jugos.photo', b.jugos, true)}<span class="lbl">Foto jugos</span></div>
        <div class="field-photo">${photoPicker('bebidas.cafe.photo', b.cafe, true)}<span class="lbl">Foto café</span></div>
      </div>
      <label><span class="lbl">WhatsApp para pedidos</span>
        <input type="tel" data-k="whatsapp" value="${attr(S.whatsapp)}"></label>`),

    `<details class="more">
      <summary>Más opciones</summary>
      <div class="inline">
        <button type="button" class="btn btn-small" data-backup="save">Guardar copia de seguridad</button>
        <button type="button" class="btn btn-small" data-backup="open">Abrir copia de seguridad</button>
        <button type="button" class="btn-link" data-reset>Volver al menú de ejemplo</button>
      </div>
    </details>`,
  ].join('');
}

/* typing: update state + preview, keep focus */
let renderTimer;
function scheduleRender() {
  clearTimeout(renderTimer);
  renderTimer = setTimeout(renderFrames, 120);
}

// dish names: one tidy box that grows to show the whole name; Enter does not add new lines
function grow(el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 4 + 'px'; }
const growAll = () => editor.querySelectorAll('textarea.grow').forEach(grow);
editor.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.target.matches('textarea.grow')) { e.preventDefault(); e.target.blur(); }
});
window.addEventListener('resize', growAll);

editor.addEventListener('input', (e) => {
  const k = e.target.dataset.k;
  if (!k) return;
  if (e.target.matches('textarea.grow')) grow(e.target);
  setPath(k, e.target.value);
  if (k === 'date') $('#dateOut').textContent = formatDate(S.date);
  save();
  scheduleRender();
});

editor.addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  // carousel photo slots: show that carousel in the preview so she sees where the photo goes
  const area = btn.closest('[data-show]');
  if (area) setActive(area.dataset.show);
  const { act, list, add, photo, unphoto, day, backup } = btn.dataset;
  const i = +btn.dataset.i;

  if (act === 'up' || act === 'down') {
    const arr = S[list], j = act === 'up' ? i - 1 : i + 1;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    commit();
  } else if (act === 'del') {
    lastDeleted = { list, i, item: S[list][i] };
    S[list].splice(i, 1);
    commit();
    toast(`Se quitó «${lastDeleted.item.name || 'plato'}».`, 'Deshacer', () => {
      S[lastDeleted.list].splice(lastDeleted.i, 0, lastDeleted.item);
      commit();
    });
  } else if (add) {
    S[add].push(dish('', ''));
    commit();
    const inputs = editor.querySelectorAll(`[data-k^="${add}."][data-k$=".name"]`);
    inputs[inputs.length - 1]?.focus();
  } else if (photo) {
    const holder = photo.replace(/\.photo$/, '');
    if (getPath(photo)) openCropper(holder, btn);
    else pickPhoto(holder);
  } else if (unphoto) {
    removePhoto(unphoto.replace(/\.photo$/, ''));
  } else if (day !== undefined) {
    const d = new Date(); d.setDate(d.getDate() + +day);
    S.date = isoDate(d);
    commit();
  } else if (backup === 'save') {
    const blob = new Blob([JSON.stringify(S)], { type: 'application/json' });
    downloadBlob(blob, `gustum-menu-copia-${S.date}.json`);
  } else if (backup === 'open') {
    $('#backupPick').value = '';
    $('#backupPick').click();
  } else if ('reset' in btn.dataset) {
    if (confirm('¿Volver al menú de ejemplo? Se perderán los cambios.')) { S = defaults(); commit(); }
  }
});

function commit() {
  save();
  renderEditor();
  growAll();
  renderFrames();
  ensureAspects().then((changed) => { if (changed) { save(); renderEditor(); growAll(); renderFrames(); } });
}

function removePhoto(holderPath) {
  const h = getPath(holderPath);
  h.photo = '';
  delete h.crop;
  commit();
}

/* photos: shrink before storing so the browser can keep them */
let pendingPhoto = null;
function pickPhoto(holderPath) {
  pendingPhoto = holderPath;
  $('#filePick').value = '';
  $('#filePick').click();
}
$('#filePick').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file || !pendingPhoto) return;
  try {
    const { url, ar } = await shrinkImage(file, 900);
    const h = getPath(pendingPhoto);
    h.photo = url;
    h.crop = { ...CROP0, ar };
    commit();
    openCropper(pendingPhoto); // new photo: let her frame it right away
  } catch (err) {
    toast('No se pudo abrir esa foto. Pruebe con otra.');
  }
});

function shrinkImage(file, max) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const r = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * r);
      c.height = Math.round(img.height * r);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve({ url: c.toDataURL('image/jpeg', 0.84), ar: c.width / c.height });
    };
    img.onerror = reject;
    img.src = url;
  });
}

$('#backupPick').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    S = normalize(JSON.parse(await file.text()));
    commit();
    toast('Copia abierta ✓');
  } catch (err) {
    toast('Ese archivo no es una copia del menú.');
  }
});

/* ---------------- photo adjuster ---------------- */
const cropper = $('#cropper');
const cropStage = $('#cropStage');
const cropBox = $('#cropBox');
const cropGhost = $('#cropGhost');
const zoomIn = $('#zoomRange');
let crop = null; // { path, holder, ar (shape), returnFocus }

const shapeAR = (path) => BOX_AR[path]?.panel ?? 1;

function openCropper(path, returnFocus) {
  const holder = getPath(path);
  if (!holder?.photo) return;
  holder.crop = cropOf(holder);
  crop = { path, holder, ar: shapeAR(path), returnFocus: returnFocus || document.activeElement };
  cropBox.classList.toggle('round', crop.ar === 1);
  cropper.hidden = false;
  document.body.classList.add('modal-open');
  drawCrop();
  $('#cropDone').focus();
}

function closeCropper() {
  if (!crop) return;
  cropper.hidden = true;
  document.body.classList.remove('modal-open');
  const path = crop.path;
  crop = null;
  commit();
  // put focus back on the same photo button (the editor was redrawn)
  editor.querySelector(`[data-photo="${path}.photo"]`)?.focus();
}

function drawCrop() {
  const c = crop.holder.crop;
  if (!c.ar) { ensureAspects().then(() => crop && drawCrop()); }
  const sw = cropStage.clientWidth, sh = cropStage.clientHeight;
  const max = Math.min(sw - 48, sh - 48);
  const bw = crop.ar >= 1 ? max : max * crop.ar;
  const bh = crop.ar >= 1 ? max / crop.ar : max;
  const bl = (sw - bw) / 2, bt = (sh - bh) / 2;
  Object.assign(cropBox.style, { width: bw + 'px', height: bh + 'px', left: bl + 'px', top: bt + 'px' });
  cropBox.innerHTML = photoImg(crop.holder, crop.ar);
  // faded full photo around the shape, so she can see what is left out
  if (c.ar) {
    const g = photoGeom(c, crop.ar);
    cropGhost.src = crop.holder.photo;
    Object.assign(cropGhost.style, {
      width: (g.w * bw) / 100 + 'px', height: (g.h * bh) / 100 + 'px',
      left: bl + (g.left * bw) / 100 + 'px', top: bt + (g.top * bh) / 100 + 'px',
    });
    cropGhost.hidden = false;
  } else {
    cropGhost.hidden = true;
  }
  zoomIn.value = c.z;
  $('#zoomOut').disabled = c.z <= 1;
  $('#zoomMore').disabled = c.z >= 4;
  crop.box = { bw, bh };
}

let cropRenderTimer;
function cropChanged() {
  drawCrop();
  clearTimeout(cropRenderTimer);
  cropRenderTimer = setTimeout(renderFrames, 150);
  save();
}

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
function setZoom(z) {
  crop.holder.crop.z = clamp(+z, 1, 4);
  cropChanged();
}

// drag to move: the photo follows the finger
let drag = null;
cropStage.addEventListener('pointerdown', (e) => {
  if (!crop) return;
  cropStage.setPointerCapture(e.pointerId);
  drag = { x: e.clientX, y: e.clientY, cx: crop.holder.crop.x, cy: crop.holder.crop.y };
  cropStage.classList.add('dragging');
});
cropStage.addEventListener('pointermove', (e) => {
  if (!drag || !crop) return;
  const c = crop.holder.crop;
  const g = photoGeom(c, crop.ar);
  const ovx = ((g.w - 100) / 100) * crop.box.bw; // how many px of photo are hidden sideways
  const ovy = ((g.h - 100) / 100) * crop.box.bh;
  if (ovx > 0.5) c.x = clamp(drag.cx - ((e.clientX - drag.x) / ovx) * 100, 0, 100);
  if (ovy > 0.5) c.y = clamp(drag.cy - ((e.clientY - drag.y) / ovy) * 100, 0, 100);
  cropChanged();
});
const endDrag = () => { drag = null; cropStage.classList.remove('dragging'); };
cropStage.addEventListener('pointerup', endDrag);
cropStage.addEventListener('pointercancel', endDrag);
cropStage.addEventListener('wheel', (e) => {
  if (!crop) return;
  e.preventDefault();
  setZoom(crop.holder.crop.z - e.deltaY * 0.002);
}, { passive: false });
cropStage.addEventListener('keydown', (e) => {
  const c = crop?.holder.crop;
  if (!c) return;
  const step = { ArrowLeft: [-4, 0], ArrowRight: [4, 0], ArrowUp: [0, -4], ArrowDown: [0, 4] }[e.key];
  if (!step) return;
  e.preventDefault();
  c.x = clamp(c.x + step[0], 0, 100);
  c.y = clamp(c.y + step[1], 0, 100);
  cropChanged();
});

zoomIn.addEventListener('input', () => setZoom(zoomIn.value));
$('#zoomOut').addEventListener('click', () => setZoom(crop.holder.crop.z - 0.25));
$('#zoomMore').addEventListener('click', () => setZoom(crop.holder.crop.z + 0.25));
$('#cropReset').addEventListener('click', () => {
  Object.assign(crop.holder.crop, { z: 1, x: 50, y: 50 });
  cropChanged();
});
$('#cropChange').addEventListener('click', () => pickPhoto(crop.path));
$('#cropRemove').addEventListener('click', () => {
  const path = crop.path;
  cropper.hidden = true;
  document.body.classList.remove('modal-open');
  crop = null;
  removePhoto(path);
});
$('#cropDone').addEventListener('click', closeCropper);
cropper.addEventListener('click', (e) => { if (e.target === cropper) closeCropper(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && crop) closeCropper(); });
window.addEventListener('resize', () => { if (crop) drawCrop(); });

/* ---------------- big viewer: zoom into the preview ---------------- */
const viewer = $('#viewer');
const vScroll = $('#viewerScroll');
const vSize = $('#viewerSize');
const vIn = $('#viewerIn');
let view = null; // { id, h, z, fit }

function openViewer(id = active) {
  const f = FORMATS.find((x) => x.id === id);
  const copy = $(`.frame[data-frame="${id}"]`).cloneNode(true);
  copy.removeAttribute('data-frame');
  vIn.replaceChildren(copy);
  $('#viewerTitle').textContent = `${f.label} · ${f.sub}`;
  const first = !view;
  viewer.hidden = false;
  document.body.classList.add('modal-open');
  view = { id, h: f.h };
  view.fit = viewerFit();
  view.z = view.fit;
  zoomViewer(view.fit);
  if (first) $('#vIn').focus();
}

const viewerFit = () => Math.min((vScroll.clientWidth - 24) / 1080, (vScroll.clientHeight - 24) / view.h);

function zoomViewer(z, cx = 0.5, cy = 0.5) {
  const max = 2;
  z = clamp(z, view.fit, max);
  // keep the same spot in the middle of the screen while zooming
  const sw = vScroll.clientWidth, sh = vScroll.clientHeight;
  const oldW = vSize.offsetWidth || 1, oldH = vSize.offsetHeight || 1;
  const px = (vScroll.scrollLeft + sw * cx) / oldW, py = (vScroll.scrollTop + sh * cy) / oldH;
  view.z = z;
  vSize.style.width = 1080 * z + 'px';
  vSize.style.height = view.h * z + 'px';
  vIn.style.transform = `scale(${z})`;
  vScroll.scrollLeft = px * 1080 * z - sw * cx;
  vScroll.scrollTop = py * view.h * z - sh * cy;
  $('#vOut').disabled = z <= view.fit + 0.001;
  $('#vFit').disabled = z <= view.fit + 0.001;
  $('#vIn').disabled = z >= max - 0.001;
}

function closeViewer() {
  viewer.hidden = true;
  document.body.classList.remove('modal-open');
  view = null;
  vIn.replaceChildren();
  $('#openViewer').focus();
}

function stepViewer(dir) {
  const i = FORMATS.findIndex((f) => f.id === view.id);
  const next = FORMATS[(i + dir + FORMATS.length) % FORMATS.length].id;
  setActive(next);
  openViewer(next);
}

$('#openViewer').addEventListener('click', () => openViewer());
stage.addEventListener('click', () => openViewer());
$('#viewerClose').addEventListener('click', closeViewer);
$('#vIn').addEventListener('click', () => zoomViewer(view.z * 1.5));
$('#vOut').addEventListener('click', () => zoomViewer(view.z / 1.5));
$('#vFit').addEventListener('click', () => zoomViewer(view.fit));
$('#vPrev').addEventListener('click', () => stepViewer(-1));
$('#vNext').addEventListener('click', () => stepViewer(1));

// double-click / double-tap: zoom in on that spot (or back to whole image when fully zoomed)
vScroll.addEventListener('dblclick', (e) => {
  const r = vScroll.getBoundingClientRect();
  const cx = (e.clientX - r.left) / r.width, cy = (e.clientY - r.top) / r.height;
  zoomViewer(view.z >= 1.99 ? view.fit : view.z * 2, cx, cy);
});
// mouse: drag to move around (fingers already scroll natively)
let vDrag = null;
vScroll.addEventListener('pointerdown', (e) => {
  if (e.pointerType !== 'mouse') return;
  vDrag = { x: e.clientX, y: e.clientY, l: vScroll.scrollLeft, t: vScroll.scrollTop };
  vScroll.classList.add('dragging');
});
window.addEventListener('pointermove', (e) => {
  if (!vDrag) return;
  vScroll.scrollLeft = vDrag.l - (e.clientX - vDrag.x);
  vScroll.scrollTop = vDrag.t - (e.clientY - vDrag.y);
});
window.addEventListener('pointerup', () => { vDrag = null; vScroll.classList.remove('dragging'); });
document.addEventListener('keydown', (e) => {
  if (!view) return;
  if (e.key === 'Escape') closeViewer();
  else if (e.key === '+' || e.key === '=') zoomViewer(view.z * 1.5);
  else if (e.key === '-') zoomViewer(view.z / 1.5);
});
// phone address bar showing/hiding resizes the screen: keep her zoom, only update "whole image" size
window.addEventListener('resize', () => {
  if (!view) return;
  const wasFit = view.z <= view.fit + 0.001;
  view.fit = viewerFit();
  zoomViewer(wasFit ? view.fit : view.z);
});

/* ---------------- saving ---------------- */
let saveTimer;
const status = $('#saveStatus');
function save() {
  status.textContent = 'Guardando…';
  status.classList.remove('err');
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(S));
      status.textContent = 'Guardado ✓';
    } catch (e) {
      status.textContent = '⚠ No se pudo guardar';
      status.classList.add('err');
    }
  }, 300);
}

/* ---------------- toast ---------------- */
let toastTimer;
function toast(msg, actionLabel, action) {
  const t = $('#toast');
  t.innerHTML = `<span>${esc(msg)}</span>${actionLabel ? `<button type="button">${esc(actionLabel)}</button>` : ''}`;
  t.hidden = false;
  if (actionLabel) t.querySelector('button').onclick = () => { t.hidden = true; action(); };
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, 6000);
}

/* ---------------- export ---------------- */
let fontEmbedCSS = null;
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

const blobToDataURL = (blob) => new Promise((res, rej) => {
  const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(blob);
});

// Inline the brand fonts once so every exported PNG uses them.
async function prepareFonts() {
  const css = await (await fetch(FONT_CSS_URL)).text();
  const blocks = css.split(/(?=\/\*)/).filter((b) => /\/\*\s*(latin|latin-ext)\s*\*\//.test(b));
  const out = await Promise.all(blocks.map(async (b) => {
    const m = b.match(/url\((https:[^)]+)\)/);
    if (!m) return b;
    const data = await blobToDataURL(await (await fetch(m[1])).blob());
    return b.replace(m[1], data);
  }));
  return out.join('\n');
}

async function renderPNG(id) {
  const f = FORMATS.find((x) => x.id === id);
  const node = $(`.frame[data-frame="${id}"]`);
  const opts = { width: 1080, height: f.h, pixelRatio: 1, backgroundColor: '#fbf1dd' };
  if (fontEmbedCSS) opts.fontEmbedCSS = fontEmbedCSS;
  if (isSafari) await htmlToImage.toBlob(node, opts); // Safari needs a warm-up pass to paint images
  return htmlToImage.toBlob(node, opts);
}

const fileName = (f) => `gustum-${S.date}-${f.file}.png`;

function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

const note = $('#dlNote');
const dlButtons = [$('#dlOne'), $('#dlAll')];
function busy(on, msg = '') {
  dlButtons.forEach((b) => { b.disabled = on; });
  note.textContent = msg;
}

/* One way to save, chosen by device:
   - phones/tablets: the phone's own share menu ("Guardar imagen" → Photos, WhatsApp, Instagram)
   - computers: normal download to the Downloads folder */
const canShareFiles = !!(navigator.canShare && navigator.canShare({ files: [new File([''], 'x.png', { type: 'image/png' })] }));
const useShare = canShareFiles && matchMedia('(pointer: coarse)').matches;
if (useShare) {
  $('#dlOneLabel').textContent = 'Guardar esta imagen';
  $('#dlAllLabel').textContent = 'Guardar las 5 imágenes';
}

const toFile = async (f) => new File([await renderPNG(f.id)], fileName(f), { type: 'image/png' });

// iPhones only open the share menu right after a tap. Making the images takes a few seconds,
// so if the phone says "too late", the button asks for one more tap and shares immediately.
let readyToShare = null; // { btn, files, label }
async function shareFiles(btn, files) {
  try {
    await navigator.share({ files });
    busy(false, '');
  } catch (e) {
    if (e.name === 'AbortError') { busy(false, ''); return; }
    if (e.name === 'NotAllowedError') {
      const label = btn.querySelector('span');
      readyToShare = { btn, files, label: label.textContent };
      label.textContent = 'Listo — toque aquí para guardar';
      busy(false, '');
      return;
    }
    files.forEach((f) => downloadBlob(f, f.name)); // share failed for another reason: download instead
    busy(false, '✓ Imágenes descargadas.');
  }
}

async function deliver(btn, formats) {
  if (readyToShare?.btn === btn) {
    const { files, label } = readyToShare;
    readyToShare = null;
    btn.querySelector('span').textContent = label;
    return shareFiles(btn, files);
  }
  if (readyToShare) { readyToShare.btn.querySelector('span').textContent = readyToShare.label; readyToShare = null; }
  try {
    const files = [];
    for (const [n, f] of formats.entries()) {
      busy(true, formats.length > 1 ? `Creando imagen ${n + 1} de ${formats.length}…` : `Creando «${f.label}»…`);
      files.push(await toFile(f));
    }
    if (useShare) return shareFiles(btn, files);
    for (const file of files) {
      downloadBlob(file, file.name);
      await new Promise((r) => setTimeout(r, 400));
    }
    busy(false, files.length > 1 ? '✓ Listas las 5 imágenes. Están en la carpeta Descargas.' : `✓ Listo: ${files[0].name}`);
  } catch (e) { console.error(e); busy(false, '⚠ Algo falló. Intente otra vez.'); }
}

$('#dlOne').addEventListener('click', (e) => deliver(e.currentTarget, [FORMATS.find((x) => x.id === active)]));
$('#dlAll').addEventListener('click', (e) => deliver(e.currentTarget, FORMATS));

/* mobile: floating "see images" button */
const jump = $('#jump');
jump.addEventListener('click', () => $('#preview').scrollIntoView({ behavior: 'smooth' }));
new IntersectionObserver(([en]) => jump.classList.toggle('hide', en.isIntersecting), { threshold: 0.15 }).observe($('#preview'));

/* ---------------- boot ---------------- */
buildPreviewShell();
renderEditor();
growAll();
const FONTS = ['900 50px Archivo', 'italic 900 50px Archivo', '600 30px "Barlow Condensed"', '700 30px "Barlow Condensed"',
  '800 30px "Barlow Condensed"', 'italic 600 16px "Playfair Display"'];
Promise.all([ensureAspects(), ...FONTS.map((f) => document.fonts.load(f))]).catch(() => {}).then(() => {
  renderEditor();
  growAll();
  renderFrames();
  // images (svg/photos) don't change layout, but re-fit once everything has loaded
  window.addEventListener('load', renderFrames);
});
prepareFonts()
  .then((css) => { fontEmbedCSS = css; })
  .catch(() => { /* fall back to html-to-image's own font embedding */ })
  .finally(() => busy(false, ''));
