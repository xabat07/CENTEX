'use strict';
/* =====================================================================
   Centex · lógica de la app
   Todo se guarda en este dispositivo (localStorage). Lo único que se pide a internet son los logos de empresas (desactivable en Ajustes).
   Estructura del archivo:
     1. utilidades      4. gráficos        7. eventos
     2. datos           5. pantallas       8. arranque
     3. cálculos        6. formularios
   ===================================================================== */

/* ---------- 1. utilidades ---------- */
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const eur = (n, d = 2) => n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: d, maximumFractionDigits: d, useGrouping: 'always' });
const eurA = n => eur(n, Math.abs(n * 100 % 100) < 0.5 || Math.abs(n * 100 % 100) > 99.5 ? 0 : 2);
const sgn = n => (n > 0 ? '+' : n < 0 ? '−' : '');
const pct = n => sgn(n) + Math.abs(n).toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' %';
const todayISO = () => new Date().toLocaleDateString('sv-SE');
const mk = d => String(d || '').slice(0, 7);
const addM = (k, d) => { const [y, m] = k.split('-').map(Number); return new Date(y, m - 1 + d, 1).toLocaleDateString('sv-SE').slice(0, 7); };
const between = (a, b) => { const o = []; for (let k = a; k <= b && o.length < 600; k = addM(k, 1)) o.push(k); return o; };
const mLabel = (k, long) => { const [y, m] = k.split('-').map(Number); return new Date(y, m - 1, 1).toLocaleDateString('es-ES', long ? { month: 'long', year: 'numeric' } : { month: 'short', year: '2-digit' }).replace(/\./g, ''); };
const monthName = k => { const [y, m] = k.split('-').map(Number); return new Date(y, m - 1, 1).toLocaleDateString('es-ES', { month: 'long' }); };
const dLabel = d => { if (!d) return '—'; const [y, m, dd] = d.split('-').map(Number); return new Date(y, m - 1, dd).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: '2-digit' }).replace(/\./g, ''); };
const dayHead = d => {
  if (d === todayISO()) return 'Hoy';
  const y = new Date(); y.setDate(y.getDate() - 1);
  if (d === y.toLocaleDateString('sv-SE')) return 'Ayer';
  const [yy, m, dd] = d.split('-').map(Number);
  return new Date(yy, m - 1, dd).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }).replace(/\./g, '');
};
const num = v => { const n = parseFloat(String(v == null ? '' : v).trim().replace(/\s/g, '').replace(',', '.')); return isFinite(n) ? n : null; };
const fmtIn = n => (n == null ? '' : String(n).replace('.', ','));
const isIsin = s => /^[A-Z]{2}[A-Z0-9]{9}[0-9]$/.test(String(s || ''));
const isDate = s => /^\d{4}-\d{2}-\d{2}$/.test(String(s || '')) && !isNaN(new Date(s + 'T00:00:00'));
const isMonth = s => /^\d{4}-(0[1-9]|1[0-2])$/.test(String(s || ''));
function niceStep(x) { if (x <= 0) return 10; const p = Math.pow(10, Math.floor(Math.log10(x))); const f = x / p; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p; }
const fmtAx = v => (v >= 1e6 ? (v / 1e6).toString().replace('.', ',') + ' M' : v >= 1000 ? (v / 1000).toString().replace('.', ',') + 'k' : v.toString().replace('.', ',')) + ' €';
let toastT;
function toast(m) { const t = $('#toast'); t.textContent = m; t.style.display = 'block'; clearTimeout(toastT); toastT = setTimeout(() => (t.style.display = 'none'), 2800); }

const CATS = ['Comida', 'Ocio', 'Transporte', 'Compras', 'Otros'];
const catColor = c => 'var(--s' + (Math.max(CATS.indexOf(c), 0) + 1) + ')';

const ICON = {
  home: '<path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  receipt: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>',
  pie: '<path d="M12 3v9h9"/><path d="M20.5 15A9 9 0 1 1 9 3.5"/>',
  trend: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r=".6" fill="currentColor"/>',
  sliders: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
  pizza: '<path d="M12 21L4.5 7.8Q12 4 19.5 7.8z"/><circle cx="10.4" cy="10.2" r="1"/><circle cx="13.6" cy="13.4" r="1"/>',
  ticket: '<path d="M3 8a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v2.5a1.5 1.5 0 0 0 0 3V16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-2.5a1.5 1.5 0 0 0 0-3z"/><path d="M14 8.5v1M14 11.5v1M14 14.5v1"/>',
  bus: '<path d="M5 4h14a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z"/><path d="M4 11h16"/><circle cx="8" cy="19" r="1.5"/><circle cx="16" cy="19" r="1.5"/><circle cx="7.5" cy="14" r=".6" fill="currentColor"/><circle cx="16.5" cy="14" r=".6" fill="currentColor"/>',
  bag: '<path d="M5 8h14l-1 12H6z"/><path d="M9 8V7a3 3 0 0 1 6 0v1"/>',
  dots: '<circle cx="6" cy="12" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/><circle cx="18" cy="12" r="1.3" fill="currentColor"/>'
};
const icon = n => '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">' + ICON[n] + '</svg>';
// Icono de cada categoría de gasto, del color de la categoría. sm = versión pequeña para textos y formularios.
const CAT_ICON = { Comida: 'pizza', Ocio: 'ticket', Transporte: 'bus', Compras: 'bag', Otros: 'dots' };
const catIcon = (c, sm) => '<svg class="ic' + (sm ? ' sm' : '') + '" style="color:' + catColor(c) + '" viewBox="0 0 24 24" aria-hidden="true">' + ICON[CAT_ICON[c] || 'dots'] + '</svg>';

/* ---------- 2. datos ---------- */
const KEY = 'centex.v1';
// Secciones de Seguimiento: por defecto Acciones y Fondos; el usuario puede añadir y borrar las suyas.
const SECS0 = () => [{ id: 'accion', nombre: 'Acciones' }, { id: 'fondo', nombre: 'Fondos' }];
function cleanSecs(a) {
  const seen = new Set(), ok = [];
  (Array.isArray(a) ? a : []).forEach(x => {
    const id = x && typeof x.id === 'string' ? x.id.slice(0, 40) : '', nombre = x ? String(x.nombre == null ? '' : x.nombre).trim().slice(0, 30) : '';
    if (id && nombre && !seen.has(id)) { seen.add(id); ok.push({ id, nombre }); }
  });
  return ok.length ? ok : SECS0();
}
// Si alguna posición apunta a una sección que no existe (copias antiguas), la crea.
function ensureSecs(secs, seg) {
  seg.forEach(p => {
    if (!p.tipo) p.tipo = 'accion';
    if (!secs.some(s => s.id === p.tipo)) secs.push({ id: p.tipo, nombre: p.tipo === 'accion' ? 'Acciones' : p.tipo === 'fondo' ? 'Fondos' : String(p.tipo).slice(0, 30) });
  });
  return secs;
}
// Carteras (una por plataforma). Cada mes apuntado lleva el id de su cartera en «c». Datos antiguos: todo cae en «Principal».
const CART0 = () => [{ id: 'principal', nombre: 'Principal' }];
function cleanCarts(a) {
  const seen = new Set(), ok = [];
  (Array.isArray(a) ? a : []).forEach(x => {
    const id = x && typeof x.id === 'string' ? x.id.slice(0, 40) : '', nombre = x ? String(x.nombre == null ? '' : x.nombre).trim().slice(0, 30) : '';
    if (id && nombre && !seen.has(id)) { seen.add(id); ok.push({ id, nombre }); }
  });
  return ok.length ? ok : CART0();
}
function ensureCarts(carts, rows) {
  rows.forEach(r => {
    if (!r.c) r.c = carts[0].id;
    if (!carts.some(x => x.id === r.c)) carts.push({ id: r.c, nombre: 'Cartera ' + (carts.length + 1) });
  });
  return carts;
}
// Fondos con precio diario: cada uno es un ISIN dentro de una cartera, con sus compras (participaciones o importe).
function cleanFondos(a, carts) {
  const ids = new Set(), ok = [];
  (Array.isArray(a) ? a : []).forEach(x => {
    if (!x || !isIsin(x.isin)) return;
    const movs = (Array.isArray(x.movs) ? x.movs : []).filter(m => m && isDate(m.f) && (m.m === 'part' || m.m === 'eur') && typeof m.v === 'number' && isFinite(m.v) && m.v !== 0).slice(0, 300).map(m => ({ f: m.f, m: m.m, v: m.v }));
    if (!movs.length) return;
    let id = typeof x.id === 'string' && x.id ? x.id.slice(0, 40) : 'f_' + uid(); if (ids.has(id)) id = 'f_' + uid(); ids.add(id);
    ok.push({ id, isin: x.isin, c: carts.some(c => c.id === x.c) ? x.c : carts[0].id, movs });
  });
  return ok;
}
const blank = () => ({ gastos: [], cartera: [], carteras: CART0(), fondos: [], seg: [], secciones: SECS0(), objetivos: [], ajustes: { tema: 'auto', ultimaCopia: null, logos: true } });
function norm(o) {
  const b = blank(); o = o && typeof o === 'object' ? o : {};
  const seg = Array.isArray(o.seg) ? o.seg : [], cartera = Array.isArray(o.cartera) ? o.cartera : [];
  const carteras = ensureCarts(cleanCarts(o.carteras), cartera);
  return {
    gastos: Array.isArray(o.gastos) ? o.gastos : [], cartera, carteras, fondos: cleanFondos(o.fondos, carteras),
    seg, secciones: ensureSecs(cleanSecs(o.secciones), seg), objetivos: Array.isArray(o.objetivos) ? o.objetivos : [],
    ajustes: Object.assign(b.ajustes, o.ajustes || {})
  };
}
let D;
try { D = norm(JSON.parse(localStorage.getItem(KEY) || 'null')); } catch (e) { D = blank(); }
function save() { try { localStorage.setItem(KEY, JSON.stringify(D)); } catch (e) { toast('No he podido guardar en este navegador'); } }

// Reparto de la cartera de un mes: modo 'pct' (valores en %) o 'eur' (valores en €). Opcional.
function cleanRep(r) {
  if (!r || typeof r !== 'object' || !Array.isArray(r.items)) return null;
  const items = r.items.filter(i => i && String(i.n == null ? '' : i.n).trim() && (typeof i.v === 'number' ? i.v : num(i.v)) > 0).slice(0, 40).map(i => ({ n: String(i.n).trim().slice(0, 40), v: typeof i.v === 'number' ? i.v : num(i.v) }));
  return items.length ? { modo: r.modo === 'eur' ? 'eur' : 'pct', items } : null;
}
// Limpia un archivo importado: solo deja lo que tiene el formato correcto.
function cleanData(o) {
  o = o && typeof o === 'object' ? o : {};
  const s = (v, max = 200) => String(v == null ? '' : v).slice(0, max);
  const n = v => { const x = typeof v === 'number' ? v : num(v); return isFinite(x) ? x : null; };
  const arr = k => (Array.isArray(o[k]) ? o[k] : []);
  const seg = arr('seg').filter(x => x && s(x.nombre) && s(x.grupo)).map(x => ({ id: s(x.id || uid(), 40), tipo: s(x.tipo, 40).trim() || 'accion', grupo: s(x.grupo, 60), nombre: s(x.nombre, 80), ticker: s(x.ticker, 30), web: webClean(x.web), fecha: isDate(x.fecha) ? x.fecha : null, precioEntrada: n(x.precioEntrada), precioActual: n(x.precioActual), motivo: s(x.motivo, 400) }));
  const cartera = arr('cartera').filter(x => x && isMonth(x.mes)).map(x => { const o2 = { c: s(x.c, 40), mes: x.mes, aportado: n(x.aportado) || 0, valor: n(x.valor) }, rp = cleanRep(x.rep); if (rp) o2.rep = rp; return o2; });
  const carteras = ensureCarts(cleanCarts(o.carteras), cartera);
  return {
    gastos: arr('gastos').filter(x => x && isDate(x.fecha) && n(x.cant) != null).map(x => ({ id: s(x.id || uid(), 40), fecha: x.fecha, desc: s(x.desc, 80), cat: CATS.includes(x.cat) ? x.cat : 'Otros', cant: n(x.cant), pago: x.pago === 'Efectivo' ? 'Efectivo' : 'Tarjeta' })),
    cartera, carteras, fondos: cleanFondos(o.fondos, carteras),
    seg, secciones: ensureSecs(cleanSecs(o.secciones), seg),
    objetivos: arr('objetivos').filter(x => x && s(x.nombre) && n(x.meta) > 0).map(x => ({ id: s(x.id || uid(), 40), nombre: s(x.nombre, 60), meta: n(x.meta), ahorrado: n(x.ahorrado) || 0, fecha: isDate(x.fecha) ? x.fecha : null }))
  };
}

/* ---------- 3b. logos de empresas ----------
   Servicio: Ticker Logos (cdn.tickerlogos.com/<dominio>), sin cuenta. Hay que mostrar el crédito "Logos by AllInvestView".
   Se descargan una vez y se guardan en este dispositivo (clave aparte: centex.logos). Si no hay logo, círculo con iniciales. */
const LOGO_KEY = 'centex.logos', LOGO_MAX = 120, LOGO_MISS_MS = 7 * 864e5;
const TICKER_DOM = { AAPL: 'apple.com', MSFT: 'microsoft.com', GOOGL: 'google.com', GOOG: 'google.com', AMZN: 'amazon.com', TSLA: 'tesla.com', NVDA: 'nvidia.com', META: 'meta.com', NFLX: 'netflix.com', QCOM: 'qualcomm.com', AMD: 'amd.com', INTC: 'intel.com', MNST: 'monsterbevcorp.com', KO: 'coca-colacompany.com', PEP: 'pepsico.com', BE: 'bloomenergy.com', HCA: 'hcahealthcare.com', DIS: 'disney.com', V: 'visa.com', MA: 'mastercard.com', JPM: 'jpmorganchase.com', WMT: 'walmart.com', NKE: 'nike.com', MCD: 'mcdonalds.com', SBUX: 'starbucks.com', ADBE: 'adobe.com', CRM: 'salesforce.com', ORCL: 'oracle.com', IBM: 'ibm.com', AVGO: 'broadcom.com', TSM: 'tsmc.com', ASML: 'asml.com', SAP: 'sap.com', ITX: 'inditex.com', SAN: 'santander.com', BBVA: 'bbva.com', TEF: 'telefonica.com', IBE: 'iberdrola.com', REP: 'repsol.com', AMS: 'amadeus.com', CABK: 'caixabank.com', PYPL: 'paypal.com', UBER: 'uber.com', PLTR: 'palantir.com', COIN: 'coinbase.com' };
const NAME_DOM = { monster: 'monsterbevcorp.com', nextil: 'nextil.com', alphabet: 'google.com', facebook: 'meta.com', ishares: 'ishares.com', vanguard: 'vanguard.com', amundi: 'amundi.com', blackrock: 'blackrock.com', fidelity: 'fidelity.com', ssga: 'ssga.com', xtrackers: 'dws.com', invesco: 'invesco.com' };
const SLUG_STOP = ['inc', 'corp', 'corporation', 'incorporated', 'co', 'company', 'sa', 'plc', 'ag', 'nv', 'se', 'ltd', 'group', 'holdings', 'holding', 'the', 'de', 'la', 'el', 'sl', 'sas'];
const slugName = n => String(n || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/).filter(w => w && !SLUG_STOP.includes(w));
function webClean(v) {
  const t = String(v == null ? '' : v).trim().toLowerCase().replace(/^[a-z]+:\/\//, '').replace(/^www\./, '').split(/[\/?#\s]/)[0].slice(0, 80);
  return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(t) ? t : '';
}
// Posibles dominios de una empresa, por orden de fiabilidad: web escrita a mano > ticker conocido > nombre.
function logoCands(nombre, ticker, web) {
  const out = [], add = d => { if (d && !out.includes(d)) out.push(d); };
  add(webClean(web));
  const tk = String(ticker || '').trim().toUpperCase().replace(/\..*$/, '');
  if (/^[A-Z]{1,5}$/.test(tk)) add(TICKER_DOM[tk]);
  const w = slugName(nombre), j = w.join('');
  for (const k of Object.keys(NAME_DOM)) if (j.startsWith(k)) add(NAME_DOM[k]);
  if (j.length >= 3) add(j + '.com');
  return out.slice(0, 4);
}
let LC = {};
try { LC = JSON.parse(localStorage.getItem(LOGO_KEY) || '{}') || {}; } catch (e) { LC = {}; }
function lcSave() {
  const ks = Object.keys(LC); if (ks.length > LOGO_MAX) ks.slice(0, ks.length - LOGO_MAX).forEach(k => { delete LC[k]; });
  try { localStorage.setItem(LOGO_KEY, JSON.stringify(LC)); } catch (e) { /* sin sitio: se vuelve a pedir */ }
}
const initials = n => { const w = String(n || '?').trim().split(/\s+/); return ((w[0] || '?')[0] + (w.length > 1 ? w[1][0] : '')).toUpperCase(); };
const hueOf = n => { let h = 0; for (const c of String(n)) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };
function logoHTML(nombre, cands, small) {
  return '<span class="lg' + (small ? ' sm' : '') + '" aria-hidden="true" style="--h:' + hueOf(nombre) + '"' + (cands.length ? ' data-lg="' + esc(cands.join(',')) + '"' : '') + '>' + esc(initials(nombre)) + '</span>';
}
const posLogo = p => logoHTML(p.nombre, logoCands(p.nombre, p.ticker, p.web));
function applyLogo(el) {
  if (!el.dataset.lg || el.classList.contains('has')) return;
  for (const d of el.dataset.lg.split(',')) {
    const v = LC[d];
    if (typeof v === 'string') { el.classList.add('has'); el.textContent = ''; const im = new Image(); im.alt = ''; im.src = v; el.appendChild(im); return; }
    if (typeof v === 'number' && Date.now() + v < LOGO_MISS_MS) continue;   // sin logo conocido (negativo = hora del fallo)
    if (!LQ.failed.has(d)) { lqPush(d); return; }
  }
}
const LQ = { q: [], run: false, failed: new Set(), until: 0 };
function lqPush(d) { if (!LQ.q.includes(d)) LQ.q.push(d); if (!LQ.run) { LQ.run = true; setTimeout(lqPump, 50); } }
async function lqPump() {
  while (LQ.q.length && D.ajustes.logos) {
    if (Date.now() < LQ.until) break;
    const d = LQ.q.shift();
    try {
      const r = await fetch('https://cdn.tickerlogos.com/' + encodeURIComponent(d), { referrerPolicy: 'origin' });
      if (r.status === 429) { LQ.until = Date.now() + 60000; LQ.failed.add(d); }
      else if (r.status === 404) LC[d] = -Date.now();
      else if (r.ok && /^image\//.test(r.headers.get('content-type') || '')) {
        const b = await r.blob();
        if (b.size > 60000) LC[d] = -Date.now();
        else LC[d] = await new Promise((ok, no) => { const f = new FileReader(); f.onload = () => ok(f.result); f.onerror = no; f.readAsDataURL(b); });
      } else LQ.failed.add(d);
      lcSave();
    } catch (e) { LQ.failed.add(d); }   // sin conexión: se reintenta al reabrir la app
    document.querySelectorAll('.lg[data-lg]:not(.has)').forEach(applyLogo);
    await new Promise(ok => setTimeout(ok, 160));
  }
  LQ.run = false;
}
function hydrateLogos() { if (D.ajustes.logos) document.querySelectorAll('.lg[data-lg]').forEach(applyLogo); }
const CREDIT = '<a href="https://www.allinvestview.com/tools/ticker-logos/" target="_blank" rel="noopener">Logos by AllInvestView</a>';

/* ---------- 3c. precios diarios de los fondos ----------
   Una tarea de GitHub guarda cada día el último precio de los fondos en data/precios.json (mismo sitio que la app).
   Aquí se leen, se guardan en el móvil para tenerlos sin internet, y con las participaciones que apuntas se calcula el valor de cada día. */
const PKEY = 'centex.precios';
let PR = {};
try { PR = JSON.parse(localStorage.getItem(PKEY) || '{}') || {}; } catch (e) { PR = {}; }
const pDates = isin => Object.keys((PR[isin] || {}).precios || {}).sort();
function priceAt(isin, d) {   // último precio con fecha <= d
  const ps = (PR[isin] || {}).precios || {}; let best = null;
  for (const k of Object.keys(ps)) if (k <= d && (best === null || k > best)) best = k;
  return best === null ? null : { f: best, p: ps[best] };
}
// Compras del fondo convertidas a participaciones. Si se apuntó un importe y ese día no hay precio guardado (el histórico empieza en octubre de 2026), se usa el primer precio y se marca como aproximado.
function fondoUnits(fo) {
  const ds = pDates(fo.isin), first = ds.length ? PR[fo.isin].precios[ds[0]] : null;
  return fo.movs.slice().sort((a, b) => (a.f < b.f ? -1 : a.f > b.f ? 1 : 0)).map(m => {
    if (m.m === 'part') return { f: m.f, u: m.v, aprox: false };
    const pa = priceAt(fo.isin, m.f);
    if (pa) return { f: m.f, u: m.v / pa.p, aprox: false };
    if (first != null) return { f: m.f, u: m.v / first, aprox: true };
    return { f: m.f, u: 0, aprox: true };
  });
}
const unitsAt = (us, d) => us.reduce((a, x) => (x.f <= d ? a + x.u : a), 0);
// Valor día a día de un grupo de fondos. Empieza el día en que todos tienen ya precio; si un fondo no publica un día, se arrastra su último precio.
function serieFondos(fondos) {
  const per = fondos.filter(fo => pDates(fo.isin).length).map(fo => ({ fo, us: fondoUnits(fo) }));
  if (!per.length) return [];
  const start = per.reduce((a, x) => { const f = pDates(x.fo.isin)[0]; return f > a ? f : a; }, '');
  const dates = [...new Set(per.flatMap(x => pDates(x.fo.isin)))].filter(d => d >= start).sort();
  return dates.map(d => ({ d, v: per.reduce((a, x) => { const pa = priceAt(x.fo.isin, d); return a + (pa ? unitsAt(x.us, d) * pa.p : 0); }, 0) }));
}
async function loadPrecios() {
  try {
    const r = await fetch('data/precios.json', { cache: 'no-store' });
    if (!r.ok) return;
    const j = await r.json();
    if (!j || typeof j !== 'object') return;
    const clean = {};
    for (const isin of Object.keys(j)) {
      if (!isIsin(isin) || !j[isin] || typeof j[isin].precios !== 'object') continue;
      const ps = {}; for (const d of Object.keys(j[isin].precios)) { const p = j[isin].precios[d]; if (isDate(d) && typeof p === 'number' && isFinite(p) && p > 0) ps[d] = p; }
      clean[isin] = { nombre: String(j[isin].nombre || isin).slice(0, 90), moneda: 'EUR', precios: ps };
    }
    if (JSON.stringify(clean) === JSON.stringify(PR)) return;
    PR = clean; try { localStorage.setItem(PKEY, JSON.stringify(PR)); } catch (e) { /* nada */ }
    if (route() === 'cartera' && !document.querySelector('#sheet[open]')) render();
  } catch (e) { /* sin conexión: se usan los precios guardados */ }
}

/* ---------- 3. cálculos ---------- */
function monthRange() {
  const now = mk(todayISO()), ks = D.gastos.map(g => mk(g.fecha));
  if (!ks.length) return [now];
  const first = ks.reduce((a, b) => (a < b ? a : b)), last = ks.reduce((a, b) => (a > b ? a : b));
  return between(first, last > now ? last : now);
}
const totMonth = k => D.gastos.filter(x => mk(x.fecha) === k).reduce((s, x) => s + x.cant, 0);
const totCat = (k, c) => D.gastos.filter(x => mk(x.fecha) === k && x.cat === c).reduce((s, x) => s + x.cant, 0);
// Filas mes a mes de UNA cartera (lista de meses suyos).
function rowsOne(list) {
  let acum = 0;
  return list.slice().sort((a, b) => (a.mes < b.mes ? -1 : 1)).map(r => {
    acum += r.aportado || 0;
    const valor = r.valor == null ? null : r.valor, gan = valor == null ? null : valor - acum;
    return { mes: r.mes, ap: r.aportado || 0, acum, valor, gan, rent: valor == null || acum <= 0 ? null : (gan / acum) * 100, rep: r.rep || null };
  });
}
// cid = id de una cartera, o nada / 'total' para la suma de todas. En el total, si una cartera no tiene dato un mes, se arrastra su último valor.
function carteraRows(cid) {
  const ids = D.carteras.map(c => c.id);
  if (cid && ids.includes(cid)) return rowsOne(D.cartera.filter(x => x.c === cid));
  if (ids.length === 1) return rowsOne(D.cartera);
  const per = ids.map(id => rowsOne(D.cartera.filter(x => x.c === id)));
  const months = [...new Set(per.flatMap(p => p.map(r => r.mes)))].sort();
  return months.map(mes => {
    let ap = 0, acum = 0, valor = null;
    per.forEach(p => {
      const r = p.find(x => x.mes === mes); if (r) ap += r.ap;
      const upto = p.filter(x => x.mes <= mes), last = upto[upto.length - 1];
      if (last) acum += last.acum;
      const lv = upto.filter(x => x.valor != null).pop(); if (lv) valor = (valor || 0) + lv.valor;
    });
    const gan = valor == null ? null : valor - acum;
    return { mes, ap, acum, valor, gan, rent: valor == null || acum <= 0 ? null : (gan / acum) * 100, rep: null };
  });
}
// Reparto de un mes en € y en %, sea cual sea el modo en que se apuntó. Lo no apuntado sale como «Sin asignar».
function repartoDe(r) {
  if (!r || !r.rep || !Array.isArray(r.rep.items) || !r.rep.items.length || !(r.valor > 0)) return null;
  const eurMode = r.rep.modo === 'eur';
  const items = r.rep.items.map(i => { const imp = eurMode ? i.v : (i.v * r.valor) / 100; return { n: i.n, imp, pct: (imp / r.valor) * 100 }; });
  const resto = r.valor - items.reduce((a, b) => a + b.imp, 0);
  if (resto > r.valor * 0.005) items.push({ n: 'Sin asignar', imp: resto, pct: (resto / r.valor) * 100, resto: true });
  return items;
}
// Escenarios: interés compuesto mes a mes. La rentabilidad anual se reparte en 12 meses y la aportación entra a final de cada mes.
const rmOf = r => Math.pow(1 + r / 100, 1 / 12) - 1;
const fvOf = (p, a, rm, n) => (rm === 0 ? p + a * n : p * Math.pow(1 + rm, n) + (a * (Math.pow(1 + rm, n) - 1)) / rm);
const rentPos = p => { const e = p.precioEntrada, a = p.precioActual; return e > 0 && a > 0 ? ((a - e) / e) * 100 : null; };
const monthsLeft = f => { const t = todayISO(), a = t.split('-').map(Number), b = f.split('-').map(Number); return (b[0] - a[0]) * 12 + (b[1] - a[1]); };

/* ---------- 4. gráficos (SVG dibujado a mano) ---------- */
const empty = m => '<div class="empty">' + m + '</div>';
function drawStack(el, months) {
  if (!el) return;
  const rows = months.map(k => { const o = { k, t: totMonth(k) }; CATS.forEach(c => (o[c] = totCat(k, c))); return o; });
  const mx = Math.max(0, ...rows.map(o => o.t));
  if (!mx) { el.innerHTML = empty('Todavía no hay gastos. Apunta el primero con el botón + y aquí verás cómo se reparte cada mes.'); return; }
  const W = Math.max(el.clientWidth, 260), H = 240, L = 50, R = 8, T = 22, B = 28;
  const step = niceStep(mx / 4), top = Math.ceil(mx / step) * step, iw = W - L - R, ih = H - T - B, band = iw / rows.length, bw = Math.min(44, band * 0.62);
  const y = v => T + ih - (v / top) * ih;
  let s = '<svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Gasto por mes y categoría">';
  for (let v = 0; v <= top + 1e-9; v += step) s += '<line class="grid" x1="' + L + '" x2="' + (W - R) + '" y1="' + y(v) + '" y2="' + y(v) + '"/><text x="' + (L - 8) + '" y="' + (y(v) + 4) + '" text-anchor="end">' + fmtAx(Math.round(v * 100) / 100) + '</text>';
  rows.forEach((o, i) => {
    const cx = L + band * i + band / 2; let acc = 0;
    CATS.forEach(c => { if (!o[c]) return; const y1 = y(acc + o[c]), y0 = y(acc); s += '<rect x="' + (cx - bw / 2) + '" y="' + y1 + '" width="' + bw + '" height="' + Math.max(y0 - y1, 1) + '" rx="3" style="fill:' + catColor(c) + ';stroke:var(--surface);stroke-width:2"/>'; acc += o[c]; });
    if (i === rows.length - 1 && o.t) s += '<text class="val" x="' + cx + '" y="' + (y(o.t) - 7) + '" text-anchor="middle">' + eurA(o.t) + '</text>';
    if (rows.length <= 8 || i % 2 === rows.length % 2) s += '<text x="' + cx + '" y="' + (H - 8) + '" text-anchor="middle">' + esc(mLabel(o.k)) + '</text>';
    const tip = mLabel(o.k, true) + '\nTotal ' + eur(o.t) + CATS.filter(c => o[c]).map(c => '\n' + c + ': ' + eur(o[c])).join('');
    s += '<rect x="' + (L + band * i) + '" y="' + T + '" width="' + band + '" height="' + ih + '" fill="transparent" data-tip="' + esc(tip) + '"/>';
  });
  el.innerHTML = s + '<line class="axis" x1="' + L + '" x2="' + (W - R) + '" y1="' + y(0) + '" y2="' + y(0) + '"/></svg>';
}
function drawCompare(el, a, b) {
  if (!el) return;
  const rows = CATS.map(c => ({ c, a: totCat(a, c), b: b ? totCat(b, c) : 0 }));
  const mx = Math.max(0, ...rows.flatMap(r => [r.a, r.b]));
  if (!mx) { el.innerHTML = empty('Ninguno de los dos meses tiene gastos todavía.'); return; }
  const W = Math.max(el.clientWidth, 260), LB = 84, RB = 72, RH = b ? 50 : 34, H = rows.length * RH + 4, sc = (W - LB - RB) / mx;
  let s = '<svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Comparación por categoría">';
  rows.forEach((r, i) => {
    const t = i * RH + 2;
    s += '<text class="lab" x="0" y="' + (t + RH / 2 + 4) + '">' + r.c + '</text>';
    const ya = b ? t + 8 : t + 10;
    s += '<rect x="' + LB + '" y="' + ya + '" width="' + Math.max(r.a * sc, r.a ? 3 : 0) + '" height="12" rx="4" style="fill:var(--pa)"/><text x="' + (LB + r.a * sc + 7) + '" y="' + (ya + 10) + '">' + (r.a ? eurA(r.a) : '—') + '</text>';
    if (b) s += '<rect x="' + LB + '" y="' + (t + 25) + '" width="' + Math.max(r.b * sc, r.b ? 3 : 0) + '" height="12" rx="4" style="fill:var(--pb)"/><text x="' + (LB + r.b * sc + 7) + '" y="' + (t + 35) + '">' + (r.b ? eurA(r.b) : '—') + '</text>';
    const d = r.a - r.b;
    const tip = r.c + '\n' + mLabel(a) + ': ' + eur(r.a) + (b ? '\n' + mLabel(b) + ': ' + eur(r.b) + '\nDiferencia: ' + sgn(d) + eur(Math.abs(d)) : '');
    s += '<rect x="0" y="' + t + '" width="' + W + '" height="' + RH + '" fill="transparent" data-tip="' + esc(tip) + '"/>';
  });
  el.innerHTML = s + '</svg>';
}
function drawDaily(el, pts) {
  if (!el) return;
  if (pts.length < 2) { el.innerHTML = empty('La gráfica se empezará a ver cuando haya al menos dos días de precios guardados. Los precios se van sumando solos cada día.'); return; }
  const W = Math.max(el.clientWidth, 260), H = 220, L = 54, R = 70, T = 16, B = 28, iw = W - L - R, ih = H - T - B, n = pts.length;
  const vs = pts.map(p => p.v), mn = Math.min(...vs), mx = Math.max(...vs), span = Math.max(mx - mn, mx * 0.002, 1), step = niceStep(span / 3);
  const lo = Math.floor((mn - span * 0.15) / step) * step, top = Math.ceil((mx + span * 0.15) / step) * step;
  const x = i => L + (iw * i) / (n - 1), y = v => T + ih - ((v - lo) / (top - lo)) * ih;
  let s = '<svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Valor estimado día a día">';
  for (let v = lo; v <= top + 1e-9; v += step) s += '<line class="grid" x1="' + L + '" x2="' + (W - R) + '" y1="' + y(v) + '" y2="' + y(v) + '"/><text x="' + (L - 8) + '" y="' + (y(v) + 4) + '" text-anchor="end">' + fmtAx(Math.round(v * 100) / 100) + '</text>';
  s += '<path d="' + pts.map((p, i) => (i ? 'L' : 'M') + x(i) + ' ' + y(p.v)).join(' ') + '" fill="none" style="stroke:var(--s1);stroke-width:2.5;stroke-linejoin:round"/>';
  pts.forEach((p, i) => {
    if (n <= 40 || i === n - 1) s += '<circle cx="' + x(i) + '" cy="' + y(p.v) + '" r="' + (i === n - 1 ? 4.5 : 3) + '" style="fill:var(--s1);stroke:var(--surface);stroke-width:2"/>';
    const dv = i ? p.v - pts[i - 1].v : null;
    s += '<rect x="' + (x(i) - iw / n / 2) + '" y="' + T + '" width="' + iw / n + '" height="' + ih + '" fill="transparent" data-tip="' + esc(dLabel(p.d) + '\nValor: ' + eur(p.v) + (dv == null ? '' : '\nVs. día anterior: ' + sgn(dv) + eur(Math.abs(dv)))) + '"/>';
  });
  [0, Math.floor((n - 1) / 2), n - 1].filter((v, i, a) => a.indexOf(v) === i).forEach(i => { s += '<text x="' + Math.min(Math.max(x(i), L + 20), W - R) + '" y="' + (H - 8) + '" text-anchor="middle">' + esc(dLabel(pts[i].d)) + '</text>'; });
  s += '<text class="val" x="' + (x(n - 1) + 11) + '" y="' + (y(pts[n - 1].v) + 4) + '">' + eur(Math.round(pts[n - 1].v), 0) + '</text>';
  el.innerHTML = s + '</svg>';
}
function drawLine(el, src) {
  if (!el) return;
  const rows = (src || carteraRows()).filter(r => r.valor != null);
  if (!rows.length) { el.innerHTML = empty('Apunta tu primer mes en Cartera y aquí verás cómo evoluciona lo aportado frente al valor.'); return; }
  const W = Math.max(el.clientWidth, 260), H = 240, L = 50, R = 70, T = 16, B = 28, iw = W - L - R, ih = H - T - B, n = rows.length;
  const mx = Math.max(...rows.flatMap(r => [r.valor, r.acum]), 1), step = niceStep(mx / 4), top = Math.ceil(mx / step) * step;
  const x = i => (n === 1 ? L + iw / 2 : L + (iw * i) / (n - 1)), y = v => T + ih - (v / top) * ih;
  let s = '<svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Valor de la cartera frente a lo aportado">';
  for (let v = 0; v <= top + 1e-9; v += step) s += '<line class="grid" x1="' + L + '" x2="' + (W - R) + '" y1="' + y(v) + '" y2="' + y(v) + '"/><text x="' + (L - 8) + '" y="' + (y(v) + 4) + '" text-anchor="end">' + fmtAx(Math.round(v * 100) / 100) + '</text>';
  const path = f => rows.map((r, i) => (i ? 'L' : 'M') + x(i) + ' ' + y(r[f])).join(' ');
  s += '<path d="' + path('acum') + '" fill="none" style="stroke:var(--s2);stroke-width:2.5;stroke-linejoin:round"/><path d="' + path('valor') + '" fill="none" style="stroke:var(--s1);stroke-width:2.5;stroke-linejoin:round"/>';
  rows.forEach((r, i) => {
    s += '<circle cx="' + x(i) + '" cy="' + y(r.acum) + '" r="4.5" style="fill:var(--s2);stroke:var(--surface);stroke-width:2"/><circle cx="' + x(i) + '" cy="' + y(r.valor) + '" r="4.5" style="fill:var(--s1);stroke:var(--surface);stroke-width:2"/>';
    if (n <= 8 || i % 2 === (n - 1) % 2) s += '<text x="' + x(i) + '" y="' + (H - 8) + '" text-anchor="middle">' + esc(mLabel(r.mes)) + '</text>';
    const tip = mLabel(r.mes, true) + '\nValor: ' + eur(r.valor) + '\nAportado en total: ' + eur(r.acum) + '\nGanancia: ' + sgn(r.gan) + eur(Math.abs(r.gan)) + (r.rent != null ? ' (' + pct(r.rent) + ')' : '');
    s += '<rect x="' + (x(i) - iw / n / 2) + '" y="' + T + '" width="' + iw / n + '" height="' + ih + '" fill="transparent" data-tip="' + esc(tip) + '"/>';
  });
  const last = rows[n - 1]; let y1 = y(last.valor) + 4, y2 = y(last.acum) + 4;
  if (Math.abs(y1 - y2) < 15) { if (y1 <= y2) { y1 -= 8; y2 += 8; } else { y1 += 8; y2 -= 8; } }
  s += '<text class="val" x="' + (x(n - 1) + 11) + '" y="' + y1 + '">' + eurA(last.valor) + '</text><text x="' + (x(n - 1) + 11) + '" y="' + y2 + '">' + eurA(last.acum) + '</text>';
  el.innerHTML = s + '<line class="axis" x1="' + L + '" x2="' + (W - R) + '" y1="' + y(0) + '" y2="' + y(0) + '"/></svg>';
}

const shortEur = v => (v >= 1e6 ? (v / 1e6).toLocaleString('es-ES', { maximumFractionDigits: 1 }) + ' M €' : eur(Math.round(v), 0));
function drawProj(el, rows) {
  if (!el) return;
  const W = Math.max(el.clientWidth, 260), H = 240, L = 56, R = 72, T = 16, B = 28, iw = W - L - R, ih = H - T - B, n = rows.length;
  const mx = Math.max(...rows.flatMap(r => [r.valor, r.aport]), 1), step = niceStep(mx / 4), top = Math.ceil(mx / step) * step;
  const x = i => (n === 1 ? L + iw / 2 : L + (iw * i) / (n - 1)), y = v => T + ih - (Math.max(v, 0) / top) * ih;
  let s = '<svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Cómo crecería el dinero año a año">';
  for (let v = 0; v <= top + 1e-9; v += step) s += '<line class="grid" x1="' + L + '" x2="' + (W - R) + '" y1="' + y(v) + '" y2="' + y(v) + '"/><text x="' + (L - 8) + '" y="' + (y(v) + 4) + '" text-anchor="end">' + fmtAx(Math.round(v * 100) / 100) + '</text>';
  const path = f => rows.map((r, i) => (i ? 'L' : 'M') + x(i) + ' ' + y(r[f])).join(' ');
  s += '<path d="' + path('aport') + '" fill="none" style="stroke:var(--s2);stroke-width:2.5;stroke-linejoin:round"/><path d="' + path('valor') + '" fill="none" style="stroke:var(--s1);stroke-width:2.5;stroke-linejoin:round"/>';
  const total = rows[n - 1].y, stepY = [1, 2, 5, 10, 20, 50].find(k => total / k <= 5) || 50;
  rows.forEach((r, i) => {
    if (n <= 12) s += '<circle cx="' + x(i) + '" cy="' + y(r.aport) + '" r="3.5" style="fill:var(--s2);stroke:var(--surface);stroke-width:2"/><circle cx="' + x(i) + '" cy="' + y(r.valor) + '" r="3.5" style="fill:var(--s1);stroke:var(--surface);stroke-width:2"/>';
    if ((Number.isInteger(r.y) && r.y % stepY === 0) || (i === n - 1 && !Number.isInteger(r.y))) s += '<text x="' + x(i) + '" y="' + (H - 8) + '" text-anchor="middle">' + (i === 0 ? 'Hoy' : r.y.toLocaleString('es-ES', { maximumFractionDigits: 1 }) + ' a.') + '</text>';
    const gan = r.valor - r.aport;
    const tip = (i === 0 ? 'Hoy' : 'Dentro de ' + r.y.toLocaleString('es-ES', { maximumFractionDigits: 1 }) + (r.y === 1 ? ' año' : ' años')) + '\nTendrías: ' + eur(r.valor, 0) + '\nHabrías aportado: ' + eur(r.aport, 0) + '\nGanancia: ' + sgn(gan) + eur(Math.abs(gan), 0);
    s += '<rect x="' + (x(i) - iw / Math.max(n - 1, 1) / 2) + '" y="' + T + '" width="' + iw / Math.max(n - 1, 1) + '" height="' + ih + '" fill="transparent" data-tip="' + esc(tip) + '"/>';
  });
  const last = rows[n - 1]; let y1 = y(last.valor) + 4, y2 = y(last.aport) + 4;
  if (Math.abs(y1 - y2) < 15) { if (y1 <= y2) { y1 -= 8; y2 += 8; } else { y1 += 8; y2 -= 8; } }
  s += '<text class="val" x="' + (x(n - 1) + 11) + '" y="' + y1 + '">' + shortEur(last.valor) + '</text><text x="' + (x(n - 1) + 11) + '" y="' + y2 + '">' + shortEur(last.aport) + '</text>';
  el.innerHTML = s + '<line class="axis" x1="' + L + '" x2="' + (W - R) + '" y1="' + y(0) + '" y2="' + y(0) + '"/></svg>';
}

/* ---------- 5. pantallas ---------- */
const ui = { gMes: null, q: '', segTipo: 'accion', cmpA: null, cmpB: null, cRango: 'todo', cart: 'total', objTab: 'obj', sim: null, escTipo: 'inv', inm: null };
// Escenarios de inmueble: tiene muchos campos, así que se recuerda lo último que pusiste (aparte de tus datos y copias).
const INM0 = { precio: '150000', impCompra: '4', otros: '2500', reforma: '0', ltv: '80', tipo: '3', plazo: '25', alquiler: '800', vacio: '1', gestion: '0', subida: '2', comunidad: '40', ibi: '300', seguro: '150', mant: '400', anios: '15', revalor: '2', gastosVenta: '4', impAlq: '20', impGan: '19', alt: '7' };
try {
  const sv = JSON.parse(localStorage.getItem('centex.esc') || 'null');
  if (sv && typeof sv === 'object') {
    if (sv.tipo === 'inm') ui.escTipo = 'inm';
    if (sv.inm && typeof sv.inm === 'object') { ui.inm = Object.assign({}, INM0); Object.keys(INM0).forEach(k => { if (typeof sv.inm[k] === 'string') ui.inm[k] = sv.inm[k].slice(0, 20); }); }
  }
} catch (e) { /* sin datos guardados */ }
const persistEsc = () => { try { localStorage.setItem('centex.esc', JSON.stringify({ tipo: ui.escTipo, inm: ui.inm })); } catch (e) { /* no pasa nada */ } };
const ROUTES = ['inicio', 'gastos', 'cartera', 'seguimiento', 'objetivos', 'ajustes'];
const NAV = [['inicio', 'Inicio', 'home'], ['gastos', 'Gastos', 'receipt'], ['cartera', 'Cartera', 'pie'], ['seguimiento', 'Seguimiento', 'trend'], ['objetivos', 'Objetivos', 'target']];
const FAB = { inicio: ['Nuevo gasto', 'addGasto'], gastos: ['Nuevo gasto', 'addGasto'], cartera: ['Apuntar mes', 'addMes'], seguimiento: ['Añadir', 'addSeg'], objetivos: ['Nuevo objetivo', 'addObj'] };
const fabOf = r => (r === 'objetivos' && ui.objTab === 'esc' ? null : FAB[r]);
const route = () => { const r = (location.hash || '').replace(/^#\/?/, ''); return ROUTES.includes(r) ? r : 'inicio'; };

const vh = (t, sub, r) => '<div class="vh"><div><h1>' + t + '</h1>' + (sub ? '<p class="sub">' + sub + '</p>' : '') + '</div>' + (fabOf(r) ? '<button class="btn" data-act="' + fabOf(r)[1] + '">' + icon('plus') + fabOf(r)[0] + '</button>' : '') + '</div>';
const deltaPill = (v, p) => v == null ? '' : '<span class="pill ' + (v > 0 ? 'good' : v < 0 ? 'bad' : 'flat') + '">' + (v > 0 ? '▲' : v < 0 ? '▼' : '') + ' ' + sgn(v) + eur(Math.abs(v)) + (p != null ? ' · ' + pct(p) : '') + '</span>';

function vInicio() {
  const has = D.gastos.length || D.cartera.length || D.seg.length || D.objetivos.length;
  const hoy = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  if (!has) {
    return { html: '<div class="page">' + vh('Bienvenido', hoy, 'inicio') +
      '<div class="card welcome"><h2>Tu dinero, en un solo sitio</h2><p>Apunta tus gastos, sigue tu cartera y marca objetivos de ahorro. Tus datos se guardan en este dispositivo y nadie más los ve. Solo los logos de empresas se piden online (puedes quitarlos en Ajustes).</p>' +
      '<div class="btn-row"><button class="btn" data-act="addGasto">' + icon('plus') + 'Apuntar mi primer gasto</button><button class="btn ghost" data-act="pickFile">Importar mis datos</button></div></div></div>' };
  }
  const cur = mk(todayISO()), prev = addM(cur, -1), day = +todayISO().slice(8, 10);
  const t = totMonth(cur), nCur = D.gastos.filter(x => mk(x.fecha) === cur).length;
  const pHas = D.gastos.some(x => mk(x.fecha) === prev);
  const pTo = D.gastos.filter(x => mk(x.fecha) === prev && +x.fecha.slice(8, 10) <= day).reduce((s, x) => s + x.cant, 0);
  let dl;
  if (!nCur && !pHas) dl = 'Aún no hay gastos apuntados este mes.';
  else if (!pHas) dl = 'Sin datos del mes pasado para comparar.';
  else { const df = t - pTo; dl = df === 0 ? 'Igual que en los mismos días de ' + monthName(prev) : '<span class="' + (df > 0 ? 'up' : 'dn') + '">' + (df > 0 ? '▲ ' : '▼ ') + eur(Math.abs(df)) + (df > 0 ? ' más' : ' menos') + '</span> que en los mismos días de ' + monthName(prev); }
  const topC = CATS.map(c => [c, totCat(cur, c)]).sort((a, b) => b[1] - a[1])[0];
  const hero = '<div class="hero"><div class="l">Gastado en ' + monthName(cur) + '</div><div class="big">' + eur(t) + '</div><div class="d">' + dl + '</div>' +
    '<div class="mini"><div><b>' + eur(day ? t / day : 0) + '</b><span>media diaria</span></div><div><b>' + nCur + '</b><span>gasto' + (nCur === 1 ? '' : 's') + '</span></div><div><b>' + (topC && topC[1] > 0 ? topC[0] : '—') + '</b><span>categoría top</span></div></div></div>';

  const cr = carteraRows().filter(r => r.valor != null), lc = cr[cr.length - 1];
  const cartCard = '<div class="card stat"><div class="card-head"><div class="l">Cartera real</div><a class="link" href="#/cartera">Ver</a></div>' + (lc ?
    '<div class="v">' + eur(lc.valor) + '</div>' + deltaPill(lc.gan, lc.rent) + '<div class="d">sobre ' + eur(lc.acum) + ' aportados · ' + esc(mLabel(lc.mes)) + '</div>' :
    '<div class="v">—</div><div class="d">Apunta tu primer mes en la pestaña Cartera.</div>') + '</div>';

  const gl = D.objetivos.slice(0, 2);
  const goalCard = '<div class="card"><div class="card-head"><h2>Objetivos</h2><a class="link" href="#/objetivos">Ver</a></div>' + (gl.length ? gl.map(o => {
    const p = Math.min(100, (o.ahorrado / o.meta) * 100);
    return '<div class="minigoal"><div class="h"><b>' + esc(o.nombre) + '</b><span>' + Math.round(p) + ' %</span></div><div class="bar"><i style="width:' + p + '%"></i></div></div>';
  }).join('') : '<p class="sub" style="margin:0">Crea tu primer objetivo de ahorro, por ejemplo el colchón de emergencia.</p>') + '</div>';

  const rs = D.seg.map(rentPos).filter(r => r != null), avg = rs.length ? rs.reduce((a, b) => a + b, 0) / rs.length : null;
  const segCard = '<div class="card stat"><div class="card-head"><div class="l">Seguimiento sin dinero real</div><a class="link" href="#/seguimiento">Ver</a></div><div class="v">' + D.seg.length + ' posiciones</div>' +
    (avg != null ? '<span class="pill ' + (avg >= 0 ? 'good' : 'bad') + '">' + (avg >= 0 ? '▲' : '▼') + ' ' + pct(avg) + ' de media</span>' : '<div class="d" style="margin-top:0">Pon el precio actual para ver la rentabilidad.</div>') + '</div>';

  const months = monthRange(), opts = months.slice().reverse();
  if (!ui.cmpA || !months.includes(ui.cmpA)) ui.cmpA = months.includes(cur) ? cur : months[months.length - 1];
  if (ui.cmpB === undefined || (ui.cmpB && (!months.includes(ui.cmpB) || ui.cmpB === ui.cmpA))) ui.cmpB = null;
  if (ui.cmpB === null && !ui._cmpTouched) ui.cmpB = months.includes(addM(ui.cmpA, -1)) ? addM(ui.cmpA, -1) : null;
  const so = sel => opts.map(k => '<option value="' + k + '"' + (k === sel ? ' selected' : '') + '>' + esc(mLabel(k)) + '</option>').join('');
  const ta = totMonth(ui.cmpA), tb = ui.cmpB ? totMonth(ui.cmpB) : 0;
  const cmpSum = ui.cmpB ? '<b>' + esc(mLabel(ui.cmpA)) + '</b> ' + eur(ta) + ' &nbsp;·&nbsp; <b>' + esc(mLabel(ui.cmpB)) + '</b> ' + eur(tb) + ' &nbsp;·&nbsp; <span class="' + (ta > tb ? 'up-t' : ta < tb ? 'dn-t' : '') + '">' + (ta > tb ? '▲ ' : ta < tb ? '▼ ' : '') + sgn(ta - tb) + eur(Math.abs(ta - tb)) + (tb > 0 ? ' (' + pct(((ta - tb) / tb) * 100) + ')' : '') + '</span>' : '<b>' + esc(mLabel(ui.cmpA, true)) + '</b> ' + eur(ta);
  const bkp = backupDue() ? '<div class="banner"><span>' + (D.ajustes.ultimaCopia ? 'Hace más de un mes que no haces copia de seguridad.' : 'Aún no has hecho ninguna copia de seguridad de tus datos.') + '</span><button class="btn sm ghost" data-act="export">Hacer copia</button></div>' : '';

  const html = '<div class="page">' + vh('Inicio', hoy, 'inicio') + hero + bkp +
    '<div class="grid2">' + cartCard + goalCard + '</div>' +
    '<div class="card"><div class="card-head"><h2>Gasto por mes</h2></div><div class="legend">' + CATS.map(c => '<span><i style="background:' + catColor(c) + '"></i>' + c + '</span>').join('') + '</div><div class="chart" id="chMeses"></div></div>' +
    '<div class="card"><h2>Comparar dos meses</h2><p class="sub">Mira en qué categorías gastaste más o menos.</p>' +
    '<div class="row2" style="margin-bottom:12px"><div class="fld"><label for="cmpA">Mes A</label><select id="cmpA">' + so(ui.cmpA) + '</select></div><div class="fld"><label for="cmpB">Mes B</label><select id="cmpB"><option value="">Ninguno</option>' + so(ui.cmpB) + '</select></div></div>' +
    '<p style="font-size:14px;margin-bottom:10px">' + cmpSum + '</p><div class="legend"><span><i style="background:var(--pa)"></i>' + esc(mLabel(ui.cmpA)) + '</span>' + (ui.cmpB ? '<span><i style="background:var(--pb)"></i>' + esc(mLabel(ui.cmpB)) + '</span>' : '') + '</div><div class="chart" id="chCmp"></div></div>' +
    segCard + '</div>';
  return { html, after() { drawStack($('#chMeses'), months); drawCompare($('#chCmp'), ui.cmpA, ui.cmpB); } };
}

function backupDue() {
  const n = D.gastos.length + D.cartera.length + D.objetivos.length;
  if (n < 5) return false;
  const u = D.ajustes.ultimaCopia;
  if (!u) return true;
  return (new Date(todayISO()) - new Date(u)) / 864e5 > 30;
}

function gastoRowHTML(x) {
  const c = catColor(x.cat);
  return '<button class="item" data-act="editGasto" data-id="' + esc(x.id) + '"><span class="badge" style="background:color-mix(in srgb,' + c + ' 18%,var(--surface))">' + catIcon(x.cat) + '</span>' +
    '<span class="t"><b>' + esc(x.desc || x.cat) + '</b><small>' + esc(x.cat) + ' · ' + esc(x.pago) + '</small></span><span class="r">' + eur(x.cant) + '</span></button>';
}
function gListHTML() {
  let list = D.gastos.filter(x => ui.gMes === 'todos' || mk(x.fecha) === ui.gMes);
  const q = ui.q.trim().toLowerCase();
  if (q) list = list.filter(x => (x.desc + ' ' + x.cat).toLowerCase().includes(q));
  list.sort((a, b) => (a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : 0));
  const tot = list.reduce((s, x) => s + x.cant, 0);
  let summary = '';
  if (list.length) {
    const by = CATS.map(c => [c, list.filter(x => x.cat === c).reduce((s, x) => s + x.cant, 0)]).filter(a => a[1] > 0).sort((a, b) => b[1] - a[1]);
    summary = '<div class="card"><div class="total-line"><b>' + eur(tot) + '</b><span>' + list.length + ' gasto' + (list.length > 1 ? 's' : '') + '</span></div>' +
      '<div class="splitbar" aria-hidden="true">' + by.map(a => '<span style="width:' + (a[1] / tot) * 100 + '%;background:' + catColor(a[0]) + '"></span>').join('') + '</div>' +
      '<div class="splitleg">' + by.map(a => '<div><span>' + catIcon(a[0], true) + a[0] + '</span><span class="num">' + eur(a[1]) + ' <em>' + Math.round((a[1] / tot) * 100) + '%</em></span></div>').join('') + '</div></div>';
  }
  let body;
  if (!list.length) body = empty(D.gastos.length ? 'No hay gastos con ese filtro. Prueba otro mes o borra la búsqueda.' : 'Aún no hay gastos. Toca + para apuntar el primero.');
  else {
    const days = [...new Set(list.map(x => x.fecha))];
    body = '<div class="card"><div class="list">' + days.map(d => {
      const items = list.filter(x => x.fecha === d), dt = items.reduce((s, x) => s + x.cant, 0);
      return '<div class="day"><span>' + esc(dayHead(d)) + '</span><span class="num">' + eur(dt) + '</span></div>' + items.map(gastoRowHTML).join('');
    }).join('') + '</div></div>';
  }
  return summary + body;
}
function vGastos() {
  const cur = mk(todayISO());
  const months = [...new Set(D.gastos.map(x => mk(x.fecha)))]; if (!months.includes(cur)) months.push(cur);
  months.sort().reverse();
  if (!ui.gMes || (ui.gMes !== 'todos' && !months.includes(ui.gMes))) ui.gMes = cur;
  const chips = '<div class="chips" role="group" aria-label="Mes">' + [['todos', 'Todos']].concat(months.map(k => [k, mLabel(k)])).map(c => '<button class="chip" data-act="gMes" data-m="' + c[0] + '" aria-pressed="' + (ui.gMes === c[0]) + '">' + esc(c[1]) + '</button>').join('') + '</div>';
  const html = '<div class="page">' + vh('Gastos', 'Lo que gastas, mes a mes', 'gastos') + chips +
    '<div class="search">' + icon('search') + '<input id="q" type="search" placeholder="Buscar por descripción o categoría" value="' + esc(ui.q) + '" aria-label="Buscar gastos" autocomplete="off"></div>' +
    '<div id="gList" style="display:flex;flex-direction:column;gap:14px">' + gListHTML() + '</div>' +
    '<details class="card"><summary>Total entre dos fechas</summary><div class="body"><div class="row2"><div class="fld"><label for="rDesde">Desde</label><input id="rDesde" type="date"></div><div class="fld"><label for="rHasta">Hasta</label><input id="rHasta" type="date"></div></div><p id="rTotal" style="font-size:14px;color:var(--ink2)">Elige las dos fechas.</p></div></details></div>';
  return { html };
}

const C_RANGOS = [['todo', 'Todo'], ['12', 'Últimos 12 meses'], ['6', 'Últimos 6 meses'], ['3', 'Últimos 3 meses']];
// Reparto del total: suma lo último apuntado de cada cartera; lo de una cartera sin reparto cuenta como «Sin asignar».
function repTotal() {
  const m = new Map(); let tot = 0, any = false;
  const add = (n, imp, resto) => { const e = m.get(n) || { n, imp: 0, resto }; e.imp += imp; m.set(n, e); tot += imp; };
  D.carteras.forEach(c => {
    const rs = carteraRows(c.id), lr = rs.slice().reverse().find(r => repartoDe(r)), lv = rs.filter(r => r.valor != null).pop();
    if (lr) { any = true; repartoDe(lr).forEach(i => add(i.resto ? 'Sin asignar' : i.n, i.imp, !!i.resto)); const rest = lv && lv !== lr ? lv.valor - lr.valor : 0; if (rest > 0.005) add('Sin asignar', rest, true); }
    else if (lv && lv.valor > 0) add('Sin asignar', lv.valor, true);
  });
  if (!any || !(tot > 0)) return null;
  return [...m.values()].sort((a, b) => (a.resto ? 1 : 0) - (b.resto ? 1 : 0) || b.imp - a.imp).map(i => Object.assign(i, { pct: (i.imp / tot) * 100 }));
}
function vCartera() {
  const cids = D.carteras.map(c => c.id), multi = cids.length > 1;
  if (!multi) ui.cart = cids[0]; else if (ui.cart !== 'total' && !cids.includes(ui.cart)) ui.cart = 'total';
  const isTot = multi && ui.cart === 'total', cName = (D.carteras.find(c => c.id === ui.cart) || {}).nombre || '';
  const cartChips = multi ? '<div class="chips" role="group" aria-label="Cartera">' + [['total', 'Total']].concat(D.carteras.map(c => [c.id, c.nombre])).map(c => '<button class="chip" style="text-transform:none" data-act="cCart" data-c="' + esc(c[0]) + '" aria-pressed="' + (ui.cart === c[0]) + '">' + esc(c[1]) + '</button>').join('') + '<button class="chip" style="text-transform:none" data-act="addCart" aria-label="Nueva cartera">+ Nueva</button></div>' : '';
  const cartHead = '<div style="display:flex;justify-content:flex-end"><button class="btn sm ghost" data-act="' + (multi ? 'editCarts' : 'addCart') + '">' + (multi ? 'Carteras' : '+ Añadir otra cartera') + '</button></div>';
  const all = carteraRows(isTot ? 'total' : ui.cart), cr = all.filter(r => r.valor != null), lc = cr[cr.length - 1];
  // Filtro por periodo: se cuenta hacia atrás desde el último mes apuntado.
  if (!C_RANGOS.some(c => c[0] === ui.cRango)) ui.cRango = 'todo';
  const nR = ui.cRango === 'todo' ? 0 : +ui.cRango;
  const from = nR && all.length ? addM(all[all.length - 1].mes, -(nR - 1)) : null;
  const rows = from ? all.filter(r => r.mes >= from) : all;
  const chips = all.length > 3 ? '<div class="chips" role="group" aria-label="Periodo">' + C_RANGOS.map(c => '<button class="chip" data-act="cRango" data-r="' + c[0] + '" style="text-transform:none" aria-pressed="' + (ui.cRango === c[0]) + '">' + c[1] + '</button>').join('') + '</div>' : '';
  // Resumen del periodo: lo aportado y lo ganado desde el último valor anterior al periodo.
  let per = '';
  if (from && chips) {
    const withV = rows.filter(r => r.valor != null), lastV = withV[withV.length - 1];
    if (lastV) {
      const before = all.filter(r => r.mes < from && r.valor != null), base = before.length ? before[before.length - 1] : null, baseMes = base ? base.mes : '';
      const apPer = all.filter(r => r.mes > baseMes && r.mes <= lastV.mes).reduce((s, r) => s + r.ap, 0);
      const gan = lastV.valor - (base ? base.valor : 0) - apPer;
      per = '<p style="font-size:14px;color:var(--ink2);font-weight:600;padding:0 2px">Últimos ' + nR + ' meses · aportado ' + eur(apPer) + ' · ' + (gan >= 0 ? 'ganancia ' : 'pérdida ') + '<span class="' + (gan >= 0 ? 'dn-t' : 'up-t') + '">' + (gan >= 0 ? '▲ ' : '▼ ') + sgn(gan) + eur(Math.abs(gan)) + '</span></p>';
    }
  }
  const sum = lc ? '<div class="card stat"><div class="l">Valor actual · ' + esc(mLabel(lc.mes, true)) + '</div><div class="v">' + eur(lc.valor) + '</div>' + deltaPill(lc.gan, lc.rent) +
    '<div class="d">Has aportado ' + eur(lc.acum) + ' en total.</div></div>' : '';
  const list = rows.length ? '<div class="card"><div class="list">' + rows.slice().reverse().map(r =>
    '<' + (isTot ? 'div' : 'button') + ' class="item plain"' + (isTot ? '' : ' data-act="editMes" data-id="' + r.mes + '" data-c="' + esc(ui.cart) + '"') + '><span class="t"><b>' + esc(mLabel(r.mes, true)) + '</b><small>Aportado ' + eur(r.ap) + ' · Total ' + eur(r.acum) + '</small></span><span class="r">' + (r.valor == null ? '—' : eur(r.valor)) + (r.gan == null ? '' : '<small class="' + (r.gan >= 0 ? 'dn-t' : 'up-t') + '">' + (r.gan >= 0 ? '▲ ' : '▼ ') + sgn(r.gan) + eur(Math.abs(r.gan)) + '</small>') + '</span></' + (isTot ? 'div' : 'button') + '>').join('') + '</div>' + (isTot ? '<p class="sub" style="margin:8px 2px 0">Suma de todas tus carteras. Para apuntar o corregir un mes, entra en su cartera.</p>' : '') + '</div>' : empty('Aún no hay meses apuntados. Una vez al mes: lo que aportaste y lo que marca tu plataforma.');
  // Total: cuánto hay en cada cartera
  const porC = isTot ? D.carteras.map(c => { const rs = carteraRows(c.id).filter(r => r.valor != null); return { c, l: rs[rs.length - 1] }; }) : [], totV = porC.reduce((a, x) => a + (x.l ? x.l.valor : 0), 0);
  const porCard = isTot ? '<div class="card"><div class="card-head"><h2>Por cartera</h2></div><div class="list">' + porC.map(x => '<button class="item plain" data-act="cCart" data-c="' + esc(x.c.id) + '"><span class="t"><b>' + esc(x.c.nombre) + '</b><small>' + (x.l ? 'Aportado ' + eur(x.l.acum) + ' · ' + (totV > 0 ? (x.l.valor / totV * 100).toLocaleString('es-ES', { maximumFractionDigits: 1 }) + ' % del total' : '') : 'Sin meses apuntados') + '</small></span><span class="r">' + (x.l ? eur(x.l.valor) + (x.l.gan == null ? '' : '<small class="' + (x.l.gan >= 0 ? 'dn-t' : 'up-t') + '">' + (x.l.gan >= 0 ? '▲ ' : '▼ ') + sgn(x.l.gan) + eur(Math.abs(x.l.gan)) + '</small>') : '—') + '</span></button>').join('') + '</div></div>' : '';
  // En qué está invertido: el reparto del último mes que lo tenga apuntado.
  const lastRep = isTot ? null : all.slice().reverse().find(r => repartoDe(r)), rp = isTot ? repTotal() : lastRep ? repartoDe(lastRep) : null;
  // Día a día: fondos con precio diario (de esta cartera, o de todas en el Total)
  const fl = isTot ? D.fondos : D.fondos.filter(f => f.c === ui.cart), serie = serieFondos(fl);
  const hayPrecios = Object.keys(PR).some(isIsin);
  const fRows = fl.map(fo => { const us = fondoUnits(fo), u = unitsAt(us, '9999-12-31'), ds = pDates(fo.isin), pa = ds.length ? priceAt(fo.isin, ds[ds.length - 1]) : null; return { fo, u, pa, val: pa ? u * pa.p : null, aprox: us.some(x => x.aprox) }; });
  const uFmt = u => u.toLocaleString('es-ES', { maximumFractionDigits: 4 });
  let dia = '';
  if (fl.length) {
    const ult = serie[serie.length - 1], ant = serie[serie.length - 2], dv = ult && ant ? ult.v - ant.v : null;
    dia = '<div class="card"><div class="card-head"><h2>Día a día</h2>' + (isTot ? '' : '<button class="btn sm ghost" data-act="addFondo">+ Fondo</button>') + '</div>' +
      (ult ? '<p class="sub" style="margin:0">Valor estimado de tus fondos a ' + esc(dLabel(ult.d)) + ': <b class="num">' + eur(ult.v) + '</b>' + (dv != null ? ' · <span class="' + (dv >= 0 ? 'dn-t' : 'up-t') + '">' + (dv >= 0 ? '▲ ' : '▼ ') + sgn(dv) + eur(Math.abs(dv)) + ' vs. día anterior</span>' : '') + '</p>' : '') +
      '<div class="chart" id="chDia"></div><div class="list">' + fRows.map(r => '<button class="item plain" data-act="editFondo" data-id="' + esc(r.fo.id) + '"><span class="t"><b>' + esc((PR[r.fo.isin] || {}).nombre || r.fo.isin) + '</b><small>' + uFmt(r.u) + ' participaciones' + (r.pa ? ' · ' + eur(r.pa.p) + ' a ' + esc(dLabel(r.pa.f)) : ' · sin precio todavía') + (r.aprox ? ' · aprox.' : '') + '</small></span><span class="r">' + (r.val == null ? '—' : eur(r.val)) + '</span></button>').join('') + '</div>' +
      '<p class="sub" style="margin:8px 2px 0">Es una estimación: participaciones por el último precio publicado (puede ir 1-3 días retrasado). El valor real es el que apuntas cada mes.</p></div>';
  } else if (!isTot && hayPrecios) {
    dia = '<div class="card"><div class="card-head"><h2>Día a día</h2></div><p class="sub" style="margin:0 0 10px">Apunta tus fondos (participaciones o el importe que pusiste) y verás cómo fluctúa su valor cada día, con los precios que se guardan solos.</p><button class="btn" data-act="addFondo">' + icon('plus') + 'Añadir fondo</button></div>';
  }
  const repCard = rp ? '<div class="card"><div class="card-head"><h2>En qué está invertido</h2></div><p class="sub" style="margin:0">' + (isTot ? 'Según el último reparto apuntado de cada cartera' : 'Según ' + esc(mLabel(lastRep.mes, true))) + '</p>' +
    '<div class="splitbar" aria-hidden="true">' + rp.map((i, k) => '<span style="width:' + Math.max(i.pct, 0) + '%;background:' + (i.resto ? 'var(--line2)' : 'var(--s' + (k % 5 + 1) + ')') + '"></span>').join('') + '</div>' +
    '<div class="splitleg">' + rp.map((i, k) => { const fc = i.resto ? [] : logoCands(i.n, '', '').filter(d => Object.values(NAME_DOM).includes(d)); return '<div><span>' + (fc.length ? logoHTML(i.n, fc, true) : '<i class="dot" style="background:' + (i.resto ? 'var(--line2)' : 'var(--s' + (k % 5 + 1) + ')') + '"></i>') + esc(i.n) + '</span><span class="num">' + eur(i.imp) + ' <em>' + i.pct.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' %</em></span></div>'; }).join('') + (D.ajustes.logos && rp.some(i => !i.resto && logoCands(i.n, '', '').some(d => Object.values(NAME_DOM).includes(d))) ? '<p class="credit">' + CREDIT + '</p>' : '') + '</div></div>' : '';
  return { html: '<div class="page">' + vh('Cartera', multi ? 'Tus carteras, plataforma por plataforma' : 'Lo que tienes invertido, mes a mes', 'cartera') + cartChips + cartHead + sum + porCard + dia + chips + per +
    '<div class="card"><div class="card-head"><h2>Evolución</h2></div><div class="legend"><span><i style="background:var(--s1)"></i>Valor de la cartera</span><span><i style="background:var(--s2)"></i>Total aportado</span></div><div class="chart" id="chCartera"></div></div>' + repCard + list + '</div>',
    after() { drawLine($('#chCartera'), rows); drawDaily($('#chDia'), serie); } };
}

const secName = id => { const x = D.secciones.find(y => y.id === id); return x ? x.nombre : id; };
function vSeg() {
  if (!D.secciones.some(x => x.id === ui.segTipo)) ui.segTipo = D.secciones[0].id;
  const tipo = ui.segTipo, items = D.seg.filter(p => p.tipo === tipo);
  const groups = [...new Set(items.map(p => p.grupo))];
  const rs = items.map(rentPos).filter(r => r != null), avg = rs.length ? rs.reduce((a, b) => a + b, 0) / rs.length : null;
  const chips = '<div class="chips" role="group" aria-label="Sección">' + D.secciones.map(x => '<button class="chip" style="text-transform:none" data-act="segTipo" data-t="' + esc(x.id) + '" aria-pressed="' + (tipo === x.id) + '">' + esc(x.nombre) + '</button>').join('') + '<button class="chip" style="text-transform:none" data-act="addSec" aria-label="Nueva sección">+ Nueva</button></div>';
  const head = '<div style="display:flex;justify-content:flex-end;align-items:center;gap:10px;flex-wrap:wrap">' + (items.length ? '<button class="btn sm ghost" data-act="precios">Actualizar precios</button>' : '') + '<button class="btn sm ghost" data-act="editSecs">Secciones</button></div>';
  const sum = items.length ? '<p style="font-size:14px;color:var(--ink2);font-weight:600;padding:0 2px">' + items.length + ' en seguimiento' + (avg != null ? ' · rentabilidad media <span class="' + (avg >= 0 ? 'dn-t' : 'up-t') + '">' + (avg >= 0 ? '▲ ' : '▼ ') + pct(avg) + '</span>' : ' · sin precios actuales todavía') + '</p>' : '';
  const body = items.length ? '<div class="card">' + groups.map(g => '<div class="grp">' + esc(g) + '</div><div class="list">' + items.filter(p => p.grupo === g).map(p => {
    const r = rentPos(p);
    return '<button class="item plain" data-act="editSeg" data-id="' + esc(p.id) + '">' + posLogo(p) + '<span class="t"><b>' + esc(p.nombre) + '</b><small>' + esc(p.ticker || '') + (p.precioEntrada != null ? ' · entrada ' + eur(p.precioEntrada) : '') + '</small></span><span class="r">' + (p.precioActual != null ? eur(p.precioActual) : '<small>sin precio</small>') + (r != null ? '<small class="' + (r >= 0 ? 'dn-t' : 'up-t') + '">' + (r >= 0 ? '▲ ' : '▼ ') + pct(r) + '</small>' : '') + '</span></button>';
  }).join('') + '</div>').join('') + '</div>' : empty('Aún no hay nada en «' + esc(secName(tipo)) + '». Toca + para añadir la primera posición.');
  return { html: '<div class="page">' + vh('Seguimiento', 'Paper trading: sin dinero real', 'seguimiento') + chips + head + sum + body + (items.length && D.ajustes.logos ? '<p class="credit">' + CREDIT + '</p>' : '') + '</div>' };
}

/* Inmueble: simulación mes a mes. Devuelve lo que pones, lo que te sobra cada año, lo que te queda al vender y la TIR. */
const INM_RULES = {
  precio: [1, 1e8, 'Precio de compra'], impCompra: [0, 30, 'Impuesto de compra'], otros: [0, 1e7, 'Notaría, registro y gestoría'], reforma: [0, 1e7, 'Reforma inicial'],
  ltv: [0, 100, 'Hipoteca (% del precio)'], tipo: [0, 30, 'Interés anual'], plazo: [1, 40, 'Años de hipoteca'],
  alquiler: [0, 1e6, 'Alquiler al mes'], vacio: [0, 12, 'Meses al año sin inquilino'], gestion: [0, 50, 'Gestión del alquiler'], subida: [-10, 20, 'Subida anual'],
  comunidad: [0, 1e5, 'Comunidad'], ibi: [0, 1e6, 'IBI'], seguro: [0, 1e6, 'Seguro'], mant: [0, 1e6, 'Mantenimiento'],
  anios: [1, 50, 'Años que lo tendrías'], revalor: [-20, 30, 'Revalorización anual'], gastosVenta: [0, 30, 'Gastos de venta'], impAlq: [0, 60, 'Impuesto del alquiler'], impGan: [0, 60, 'Impuesto de la ganancia'], alt: [-50, 100, 'Rentabilidad alternativa']
};
function inmParse(S) {
  const p = {};
  for (const k of Object.keys(INM_RULES)) {
    const [lo, hi, lab] = INM_RULES[k], raw = String(S[k] == null ? '' : S[k]).trim();
    if (raw === '') { if (k === 'precio' || k === 'anios') return { err: 'Pon «' + lab + '» para empezar.' }; if (k === 'plazo' && num(S.ltv) > 0) return { err: 'Pon «' + lab + '» (la hipoteca necesita un plazo).' }; p[k] = 0; continue; }
    const v = num(raw);
    if (v == null || v < lo || v > hi) return { err: 'Revisa «' + lab + '»: tiene que ser un número entre ' + lo.toLocaleString('es-ES') + ' y ' + hi.toLocaleString('es-ES') + '.' };
    p[k] = v;
  }
  return { p };
}
function irrAnual(cf) {
  const npv = r => { let t = 0, f = 1; const q = 1 / (1 + r); for (let i = 0; i < cf.length; i++) { t += cf[i] * f; f *= q; } return t; };
  let lo = -0.2, hi = 0.5, a = npv(lo), b = npv(hi);
  if (!(a * b < 0)) return null;
  for (let k = 0; k < 200; k++) { const m = (lo + hi) / 2, v = npv(m); if ((v > 0) === (a > 0)) { lo = m; a = v; } else hi = m; }
  return (Math.pow(1 + (lo + hi) / 2, 12) - 1) * 100;
}
function inmCalc(p) {
  const loan = (p.precio * p.ltv) / 100, i = p.tipo / 1200, nPay = Math.round(p.plazo * 12);
  const cuota = loan <= 0 ? 0 : i === 0 ? loan / nPay : (loan * i) / (1 - Math.pow(1 + i, -nPay));
  const impC = (p.precio * p.impCompra) / 100, entrada = p.precio - loan, cash0 = entrada + impC + p.otros + p.reforma, coste = p.precio + impC + p.otros + p.reforma;
  const n = Math.round(p.anios * 12), gastosAnio = p.comunidad * 12 + p.ibi + p.seguro + p.mant;
  let bal = loan, y = { rent: 0, gastos: 0, gest: 0, int: 0, cap: 0, tax: 0, flow: 0 }, acc = { rent: 0, gastos: 0, int: 0 }, sumFlow = 0, neg = 0;
  const cf = [-cash0];
  for (let t = 1; t <= n; t++) {
    const g = Math.pow(1 + p.subida / 100, Math.floor((t - 1) / 12));
    const rentM = (p.alquiler * g * (12 - p.vacio)) / 12, gastosM = (gastosAnio / 12) * g, gestM = (rentM * p.gestion) / 100;
    let pay = 0, intM = 0, capM = 0;
    if (t <= nPay && bal > 0) { intM = bal * i; capM = Math.min(cuota - intM, bal); bal -= capM; pay = intM + capM; }
    acc.rent += rentM; acc.gastos += gastosM + gestM; acc.int += intM;
    let tax = 0;
    if (t % 12 === 0 || t === n) { tax = (p.impAlq / 100) * Math.max(0, acc.rent - acc.gastos - acc.int); acc = { rent: 0, gastos: 0, int: 0 }; }
    const flow = rentM - gastosM - gestM - pay - tax;
    if (t <= 12) { y.rent += rentM; y.gastos += gastosM; y.gest += gestM; y.int += intM; y.cap += capM; y.tax += tax; y.flow += flow; }
    sumFlow += flow; if (flow < 0) neg -= flow; cf.push(flow);
  }
  const venta = p.precio * Math.pow(1 + p.revalor / 100, n / 12), gV = (venta * p.gastosVenta) / 100;
  const gan = venta - gV - coste, taxG = (p.impGan / 100) * Math.max(0, gan), neto = venta - gV - bal - taxG;
  cf[n] += neto;
  const profit = neto + sumFlow - cash0, invertido = cash0 + neg;
  return { loan, cuota, impC, entrada, cash0, coste, n, venta, gV, deuda: bal, taxG, neto, profit, invertido, roi: invertido > 0 ? (profit / invertido) * 100 : null, tir: irrAnual(cf), y,
    bruta: p.precio > 0 ? ((p.alquiler * 12) / p.precio) * 100 : 0, neta: coste > 0 ? ((p.alquiler * (12 - p.vacio)) - gastosAnio - (p.alquiler * (12 - p.vacio) * p.gestion) / 100) / coste * 100 : 0, coc: cash0 > 0 ? (y.flow / cash0) * 100 : null };
}

const objTabs = () => '<div class="chips" role="group" aria-label="Apartado">' + [['obj', 'Mis objetivos'], ['esc', 'Escenarios']].map(c => '<button class="chip" style="text-transform:none" data-act="objTab" data-t="' + c[0] + '" aria-pressed="' + (ui.objTab === c[0]) + '">' + c[1] + '</button>').join('') + '</div>';
function invFormHTML() {
  if (!ui.sim) {
    const lv = carteraRows().filter(r => r.valor != null).pop();
    ui.sim = { ini: lv ? fmtIn(Math.round(lv.valor)) : '', mes: lv && lv.ap > 0 ? fmtIn(Math.round(lv.ap)) : '', anios: '10', rent: '7', infl: '', meta: '' };
  }
  const S = ui.sim, f = (id, label, val, ph, help) => '<div class="fld"><label for="' + id + '">' + label + '</label><input id="' + id + '" inputmode="decimal" autocomplete="off" placeholder="' + ph + '" value="' + esc(val) + '">' + (help ? '<span class="help">' + help + '</span>' : '') + '</div>';
  return '<div class="card"><h2>Inversión</h2><p class="sub">Pon unos números y mira cuánto podrías tener con fondos, acciones u otra inversión. Es una simulación, no una promesa.</p><div id="escForm" role="group" aria-label="Datos de la simulación" style="display:flex;flex-direction:column;gap:12px">' +
    '<div class="row2">' + f('esIni', 'Dinero que tienes (€)', S.ini, '0', S.ini ? 'Es tu cartera actual; cámbialo si quieres.' : '') + f('esMes', 'Aportación al mes (€)', S.mes, '0') + '</div>' +
    '<div class="row2">' + f('esAn', 'Durante cuántos años', S.anios, '10') + f('esRent', 'Rentabilidad anual (%)', S.rent, '7', 'Un ejemplo, no una predicción.') + '</div>' +
    '<div class="row2">' + f('esMeta', 'Meta (€, opcional)', S.meta, 'Ej. 20000', 'Te digo cuánto aportar al mes.') + f('esInfl', 'Inflación anual (%, opcional)', S.infl, 'Ej. 2', 'Para ver el resultado en euros de hoy.') + '</div>' +
    '</div></div><div id="escOut" style="display:flex;flex-direction:column;gap:14px"></div>';
}
const INM_GRUPOS = [
  ['La compra', 'Lo que pagas para hacerte con la vivienda.', [['precio', 'Precio de compra (€)', '150000'], ['impCompra', 'Impuesto de compra (%)', '4', 'En Euskadi el general de vivienda usada es el 4 %, pero depende de tu caso. Confírmalo con tu Hacienda Foral.'], ['otros', 'Notaría, registro y gestoría (€)', '2500'], ['reforma', 'Reforma inicial (€)', '0']]],
  ['La hipoteca', 'Pon 0 en el porcentaje si pagas todo al contado.', [['ltv', 'Lo que presta el banco (% del precio)', '80'], ['tipo', 'Interés anual (%)', '3'], ['plazo', 'Años de hipoteca', '25']]],
  ['El alquiler', 'Lo que cobras y lo que cuesta alquilar.', [['alquiler', 'Alquiler al mes (€)', '800'], ['vacio', 'Meses al año sin inquilino', '1', 'Para vacíos y cambios de inquilino.'], ['gestion', 'Gestión o agencia (% del alquiler)', '0'], ['subida', 'Subida anual del alquiler y los gastos (%)', '2']]],
  ['Gastos de la vivienda', 'Lo que pagas tú, tenga o no tenga inquilino.', [['comunidad', 'Comunidad al mes (€)', '40'], ['ibi', 'IBI al año (€)', '300'], ['seguro', 'Seguro al año (€)', '150'], ['mant', 'Mantenimiento y averías al año (€)', '400']]],
  ['La venta y los impuestos', 'Cuánto tiempo la tendrías y qué pasaría al venderla.', [['anios', 'Años que la tendrías', '15'], ['revalor', 'Revalorización anual (%)', '2', 'Un ejemplo, no una predicción.'], ['gastosVenta', 'Gastos de venta (%)', '4', 'Agencia, plusvalía municipal, etc.'], ['impAlq', 'Impuesto sobre el beneficio del alquiler (%)', '20', 'Depende de tu caso y de tu comunidad.'], ['impGan', 'Impuesto sobre la ganancia al vender (%)', '19', 'Depende de tu caso y de tu comunidad.']]],
  ['Para comparar', 'Con qué quieres comparar el inmueble.', [['alt', 'Rentabilidad alternativa (%)', '7', 'Por ejemplo, la de un fondo indexado.']]]
];
function inmFormHTML() {
  if (!ui.inm) ui.inm = Object.assign({}, INM0);
  const f = x => '<div class="fld" style="justify-content:flex-end"><label for="im_' + x[0] + '">' + x[1] + '</label><input id="im_' + x[0] + '" inputmode="decimal" autocomplete="off" placeholder="' + x[2] + '" value="' + esc(ui.inm[x[0]]) + '"></div>';
  const grupos = INM_GRUPOS.map(g => {
    const rows = []; for (let k = 0; k < g[2].length; k += 2) {
      const par = g[2].slice(k, k + 2);
      rows.push('<div style="display:flex;flex-direction:column;gap:6px"><div class="row2">' + par.map(f).join('') + (par.length === 1 ? '<div></div>' : '') + '</div>' + par.filter(x => x[3]).map(x => '<span class="help" style="font-size:12px;color:var(--muted);font-weight:600"><b>' + x[1].replace(/ \(.*\)$/, '') + ':</b> ' + x[3] + '</span>').join('') + '</div>');
    }
    return '<div class="card"><h2>' + g[0] + '</h2><p class="sub" style="margin-bottom:10px">' + g[1] + '</p><div style="display:flex;flex-direction:column;gap:12px">' + rows.join('') + '</div></div>';
  }).join('');
  return '<p class="sub" style="padding:0 2px;font-size:14px;color:var(--ink2)">Los números de abajo son un ejemplo: cámbialos por los de la vivienda que estés mirando. Se guardan en este móvil para la próxima vez.</p><div id="escForm" role="group" aria-label="Datos del inmueble" style="display:flex;flex-direction:column;gap:14px">' + grupos + '</div><div id="escOut" style="display:flex;flex-direction:column;gap:14px"></div>';
}
function vEsc() {
  const tipo = ui.escTipo === 'inm' ? 'inm' : 'inv';
  const seg = '<div><div class="seg" role="group" aria-label="Tipo de escenario"><button data-act="escTipo" data-t="inv" aria-pressed="' + (tipo === 'inv') + '">Inversión</button><button data-act="escTipo" data-t="inm" aria-pressed="' + (tipo === 'inm') + '">Inmueble</button></div></div>';
  const sub = tipo === 'inm' ? 'Mira si te sale a cuenta comprar una vivienda para alquilarla' : 'Calcula cómo podría crecer tu dinero';
  return { html: '<div class="page">' + vh('Objetivos', sub, 'objetivos') + objTabs() + seg + (tipo === 'inm' ? inmFormHTML() : invFormHTML()) + '</div>', after() { renderEsc(); } };
}
function readEsc() {
  if (ui.escTipo === 'inm') { const o = Object.assign({}, ui.inm || INM0); Object.keys(INM0).forEach(k => { const el = $('#im_' + k); if (el) o[k] = el.value; }); ui.inm = o; persistEsc(); }
  else readInv();
}
function renderEsc() { if (ui.escTipo === 'inm') renderInm(); else renderInv(); }
function readInv() { const v = id => (($('#' + id) || {}).value || ''); ui.sim = { ini: v('esIni'), mes: v('esMes'), anios: v('esAn'), rent: v('esRent'), infl: v('esInfl'), meta: v('esMeta') }; }
function renderInv() {
  const out = $('#escOut'); if (!out || !ui.sim) return;
  const S = ui.sim, opt0 = t => (String(t).trim() === '' ? 0 : num(t));
  const ini = opt0(S.ini), mes = opt0(S.mes), an = num(S.anios), r = num(S.rent), inf = opt0(S.infl), meta = String(S.meta).trim() === '' ? null : num(S.meta);
  const bad = m => { out.innerHTML = empty(m); };
  if (ini == null || ini < 0 || mes == null || mes < 0) return bad('Revisa el dinero que tienes y la aportación: tienen que ser números de 0 o más.');
  if (!ini && !mes) return bad('Pon el dinero que tienes o lo que aportas al mes para empezar.');
  if (an == null || an < 0.5 || an > 60) return bad('Pon los años que quieres simular (entre 0,5 y 60).');
  if (r == null || r < -50 || r > 100) return bad('Pon la rentabilidad anual como un número entre −50 y 100.');
  if (inf == null || inf < 0 || inf > 50) return bad('La inflación tiene que estar entre 0 y 50.');
  if (meta != null && !(meta > 0)) return bad('La meta tiene que ser mayor que 0, o déjala vacía.');
  const n = Math.round(an * 12), rm = rmOf(r), final = fvOf(ini, mes, rm, n), aport = ini + mes * n, gan = final - aport, anTxt = an === 1 ? '1 año' : an.toLocaleString('es-ES', { maximumFractionDigits: 1 }) + ' años';
  const rows = []; for (let m = 0; m <= n; m += 12) rows.push({ y: m / 12, valor: fvOf(ini, mes, rm, m), aport: ini + mes * m });
  if (n % 12) rows.push({ y: n / 12, valor: final, aport });
  const rtxt = x => x.toLocaleString('es-ES', { maximumFractionDigits: 1 }) + ' %';
  let h = '<div class="card stat"><div class="l">Dentro de ' + anTxt + ' tendrías</div><div class="v">' + eur(final, 0) + '</div><span class="pill ' + (gan > 0 ? 'good' : gan < 0 ? 'bad' : 'flat') + '">' + (gan > 0 ? '▲' : gan < 0 ? '▼' : '') + ' ' + sgn(gan) + eur(Math.abs(gan), 0) + (aport > 0 ? ' · ' + pct((gan / aport) * 100) : '') + '</span>' +
    '<div class="d">Habrías aportado ' + eur(aport, 0) + ' en total' + (gan > 0 ? ' y el resto (' + eur(gan, 0) + ') lo habría puesto la rentabilidad.' : '.') + '</div>' +
    (inf > 0 ? '<div class="d">En euros de hoy, con ' + rtxt(inf) + ' de inflación al año: <b>' + eur(final / Math.pow(1 + inf / 100, n / 12), 0) + '</b></div>' : '') + '</div>';
  if (meta != null) {
    const pw = Math.pow(1 + rm, n), need = rm === 0 ? (meta - ini) / n : ((meta - ini * pw) * rm) / (pw - 1), ahora = mes > 0 ? ' (ahora pones ' + eur(mes, 0) + ')' : '';
    h += '<div class="card"><h2>Para llegar a ' + eur(meta, 0) + '</h2><p style="font-size:14px;margin:0">' + (need <= 0 ? 'Solo con lo que ya tienes llegarías a tu meta, sin aportar nada más.' : final >= meta ? 'Llegarías a tu meta. Te bastaría con aportar <b>' + eur(need, 0) + ' al mes</b>' + ahora + '.' : 'Necesitarías aportar <b>' + eur(need, 0) + ' al mes</b>' + ahora + ', es decir, ' + eur(need - mes, 0) + ' más al mes.') + '</p></div>';
  }
  const sc = [r - 3, r, r + 3].filter(x => x >= -50 && x <= 100);
  h += '<div class="card"><h2>¿Y si la rentabilidad fuera otra?</h2><p class="sub">Nadie sabe qué rentabilidad saldrá. Mira el abanico.</p><div class="splitleg">' + sc.map(x => '<div><span>' + (x === r ? '<b>Con tu ' + rtxt(x) + '</b>' : 'Con ' + rtxt(x)) + '</span><span class="num">' + eur(fvOf(ini, mes, rmOf(x), n), 0) + '</span></div>').join('') + '</div></div>';
  h += '<div class="card"><div class="card-head"><h2>Cómo crecería</h2></div><div class="legend"><span><i style="background:var(--s1)"></i>Lo que tendrías</span><span><i style="background:var(--s2)"></i>Lo que habrías aportado</span></div><div class="chart" id="chEsc"></div></div>' +
    '<p class="sub" style="text-align:center;padding:0 8px;font-size:12.5px;color:var(--muted)">Simulación sencilla: la rentabilidad real cambia cada año y puede ser negativa. No es una promesa ni un consejo de inversión.</p>';
  out.innerHTML = h; drawProj($('#chEsc'), rows);
}
function renderInm() {
  const out = $('#escOut'); if (!out || !ui.inm) return;
  const pr = inmParse(ui.inm); if (pr.err) { out.innerHTML = empty(pr.err); return; }
  const p = pr.p, R = inmCalc(p), pc1 = x => x.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' %', sg = v => (Math.round(v) < 0 ? '−' : Math.round(v) > 0 ? '+' : '') + eur(Math.abs(v), 0);
  const cls = v => (Math.round(v) > 0 ? 'dn-t' : Math.round(v) < 0 ? 'up-t' : ''), anTxt = p.anios === 1 ? '1 año' : p.anios.toLocaleString('es-ES', { maximumFractionDigits: 1 }) + ' años';
  const row = (l, v, b, c) => '<div><span>' + (b ? '<b>' + l + '</b>' : l) + '</span><span class="num' + (c ? ' ' + c : '') + '">' + (b ? '<b>' + v + '</b>' : v) + '</span></div>';
  const tirTxt = R.tir == null ? 'La rentabilidad anual (TIR) no se puede calcular con estos números: con ellos no recuperarías el dinero que pones.' : '<b>' + pc1(R.tir) + ' al año</b> de rentabilidad media de todo el dinero que pones y recibes (TIR), frente a ' + pc1(p.alt) + ' de tu alternativa: ' + (R.tir > p.alt + 0.05 ? 'en números, sale mejor el inmueble.' : R.tir < p.alt - 0.05 ? 'en números, sale mejor tu alternativa.' : 'prácticamente igual.');
  let h = '<div class="card stat"><div class="l">Si la vendes dentro de ' + anTxt + ', te quedarían</div><div class="v">' + eur(R.neto, 0) + '</div>' +
    '<span class="pill ' + (Math.round(R.profit) > 0 ? 'good' : Math.round(R.profit) < 0 ? 'bad' : 'flat') + '">' + (R.profit > 0 ? '▲' : R.profit < 0 ? '▼' : '') + ' ' + sg(R.profit) + ' de ganancia total' + (R.roi != null ? ' · ' + pct(R.roi) : '') + '</span>' +
    '<div class="d">Es lo que queda tras pagar la hipoteca pendiente, los gastos de venta y los impuestos. En total habrás puesto ' + eur(R.invertido, 0) + ' de tu bolsillo (entrada, gastos y lo que falte cada mes). La ganancia incluye también lo que te sobre del alquiler.</div>' +
    '<div class="d" style="margin-top:8px">' + tirTxt + '</div></div>';
  h += '<div class="card"><h2>Para comprarla, pones</h2><div class="splitleg" style="margin-top:10px">' + row('Entrada (lo que no presta el banco)', eur(R.entrada, 0)) + row('Impuesto de compra', eur(R.impC, 0)) + row('Notaría, registro y gestoría', eur(p.otros, 0)) + (p.reforma > 0 ? row('Reforma', eur(p.reforma, 0)) : '') + row('Total al empezar', eur(R.cash0, 0), true) + '</div>' +
    (R.loan > 0 ? '<p style="font-size:14px;margin:12px 0 0">Hipoteca de <b>' + eur(R.loan, 0) + '</b>: cuota de <b>' + eur(R.cuota, 2) + ' al mes</b> durante ' + p.plazo.toLocaleString('es-ES', { maximumFractionDigits: 1 }) + ' años.</p>' : '<p style="font-size:14px;margin:12px 0 0">Sin hipoteca: lo pagas todo al contado.</p>') + '</div>';
  const y = R.y, devuelve = y.cap;
  h += '<div class="card"><h2>El primer año, en números</h2><p class="sub" style="margin-bottom:10px">Con los años el alquiler y los gastos suben, y la parte de la cuota que son intereses baja.</p><div class="splitleg">' +
    row('Alquiler cobrado', eur(y.rent, 0), false, 'dn-t') + row('Gastos de la vivienda', '−' + eur(y.gastos, 0)) + (y.gest > 0 ? row('Gestión del alquiler', '−' + eur(y.gest, 0)) : '') +
    (R.loan > 0 ? row('Intereses de la hipoteca', '−' + eur(y.int, 0)) + row('Capital que devuelves al banco', '−' + eur(devuelve, 0)) : '') + (y.tax > 0 ? row('Impuestos del alquiler', '−' + eur(y.tax, 0)) : '') +
    row('Te sobra (o te falta) en el año', sg(y.flow), true, cls(y.flow)) + '</div>' +
    '<p style="font-size:14px;margin:12px 0 0">Eso son <b class="' + cls(y.flow) + '">' + sg(y.flow / 12) + ' al mes</b>. ' + (R.loan > 0 ? 'Ojo: el capital que devuelves no es un gasto perdido, es dinero tuyo que pasa a ser parte de la vivienda.' : '') + '</p></div>';
  h += '<div class="card"><h2>Rentabilidad del alquiler</h2><div class="splitleg" style="margin-top:10px">' + row('Bruta (alquiler al año ÷ precio)', pc1(R.bruta)) + row('Neta (sin hipoteca ni impuestos)', pc1(R.neta)) + row('Año 1 sobre lo que pones', R.coc == null ? '—' : pc1(R.coc)) + '</div>' +
    '<p class="sub" style="margin:10px 0 0">La <b>bruta</b> es la que salen en los anuncios. La <b>neta</b> descuenta gastos y vacíos y cuenta también lo que pagas al comprar. La última mide el año 1 frente a tu dinero puesto, con la hipoteca ya pagada.</p></div>';
  h += '<div class="card"><h2>Al venderla, dentro de ' + anTxt + '</h2><div class="splitleg" style="margin-top:10px">' + row('Valor de venta (con ' + pc1(p.revalor) + ' al año)', eur(R.venta, 0)) + row('Gastos de venta', '−' + eur(R.gV, 0)) + (R.loan > 0 ? row('Hipoteca pendiente', '−' + eur(R.deuda, 0)) : '') + (R.taxG > 0 ? row('Impuesto sobre la ganancia', '−' + eur(R.taxG, 0)) : '') + row('Te quedan', eur(R.neto, 0), true) + '</div></div>';
  const sc = [p.revalor - 2, p.revalor, p.revalor + 2].filter(x => x >= -20 && x <= 30);
  h += '<div class="card"><h2>¿Y si la vivienda se revalorizara de otra forma?</h2><p class="sub" style="margin-bottom:10px">Nadie sabe cuánto subirá o bajará. Es lo que más cambia el resultado.</p><div class="splitleg">' + sc.map(x => { const q = inmCalc(Object.assign({}, p, { revalor: x })); return '<div><span>' + (x === p.revalor ? '<b>Con tus ' + pc1(x) + '</b>' : 'Con ' + pc1(x)) + '</span><span class="num">' + eur(q.neto, 0) + ' <em>' + (q.tir == null ? 'sin TIR' : 'TIR ' + pc1(q.tir)) + '</em></span></div>'; }).join('') + '</div></div>';
  h += '<p class="sub" style="text-align:center;padding:0 8px;font-size:12.5px;color:var(--muted)">Simulación sencilla: usa los valores que has puesto, con la hipoteca a interés fijo y sin impagos ni obras grandes. Los impuestos dependen de cada caso y comunidad; consulta a un asesor antes de decidir. No es un consejo de inversión.</p>';
  out.innerHTML = h;
}
function vObj() {
  if (ui.objTab === 'esc') return vEsc();
  const body = D.objetivos.length ? D.objetivos.map(o => {
    const p = Math.min(100, (o.ahorrado / o.meta) * 100), falta = Math.max(o.meta - o.ahorrado, 0), done = o.ahorrado >= o.meta;
    let extra = '';
    if (o.fecha && !done) { const m = monthsLeft(o.fecha); extra = m > 0 ? ' · ' + eur(falta / m, 0) + ' al mes hasta ' + esc(dLabel(o.fecha)) : ' · la fecha ya ha pasado'; }
    return '<div class="card goal"><div class="goal-top"><div><h3>' + esc(o.nombre) + '</h3><p class="meta">Meta ' + eur(o.meta, 0) + (o.fecha ? ' · para ' + esc(dLabel(o.fecha)) : '') + '</p></div>' + (done ? '<span class="pill good">✓ Conseguido</span>' : '<span class="pill flat">' + Math.round(p) + ' %</span>') + '</div>' +
      '<div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + Math.round(p) + '" aria-label="Progreso de ' + esc(o.nombre) + '"><i style="width:' + p + '%"></i></div>' +
      '<div class="goal-nums"><b class="num">' + eur(o.ahorrado) + '</b><span class="num">' + (done ? 'Meta superada' : 'Faltan ' + eur(falta) + extra) + '</span></div>' +
      '<div class="btn-row"><button class="btn sm" data-act="aportar" data-id="' + esc(o.id) + '">Aportar</button><button class="btn sm ghost" data-act="editObj" data-id="' + esc(o.id) + '">Editar</button></div></div>';
  }).join('') : empty('Aún no tienes objetivos. Toca + y crea el primero, por ejemplo el colchón de emergencia.');
  return { html: '<div class="page">' + vh('Objetivos', 'Lo que quieres conseguir', 'objetivos') + objTabs() + body + '</div>' };
}

function vAjustes() {
  const t = D.ajustes.tema, standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  const u = D.ajustes.ultimaCopia;
  return { html: '<div class="page"><div class="vh"><div><h1>Ajustes</h1><p class="sub">Apariencia y tus datos</p></div></div>' +
    '<div class="card set"><div class="setrow"><div><b>Apariencia</b><p>Automático sigue el modo de tu móvil.</p></div><div class="seg" role="group" aria-label="Tema">' + [['auto', 'Auto'], ['claro', 'Claro'], ['oscuro', 'Oscuro']].map(a => '<button data-act="tema" data-v="' + a[0] + '" aria-pressed="' + (t === a[0]) + '">' + a[1] + '</button>').join('') + '</div></div></div>' +
    '<div class="card set"><div class="setrow"><div><b>Logos de empresas</b><p>Los pide a Ticker Logos (así sabe qué empresas sigues, nunca tus importes) y los guarda aquí. ' + CREDIT + '</p></div><div class="seg" role="group" aria-label="Logos">' + [['1', 'Sí'], ['0', 'No']].map(a => '<button data-act="logos" data-v="' + a[0] + '" aria-pressed="' + ((D.ajustes.logos !== false) === (a[0] === '1')) + '">' + a[1] + '</button>').join('') + '</div></div></div>' +
    '<div class="card set"><h2>Tus datos</h2><p class="sub" style="margin-bottom:6px">Se guardan solo en este dispositivo. Si borras los datos del navegador o cambias de móvil, se pierden: haz copias de vez en cuando.</p>' +
    '<div class="setrow"><div><b>Copia de seguridad</b><p>' + (u ? 'Última copia: ' + esc(dLabel(u)) : 'Aún no has hecho ninguna.') + '</p></div><button class="btn sm" data-act="export">Descargar</button></div>' +
    '<div class="setrow"><div><b>Restaurar o importar</b><p>Desde un archivo de copia de Centex.</p></div><button class="btn sm ghost" data-act="pickFile">Elegir archivo</button></div>' +
    '<div class="setrow"><div><b>Gastos para Excel</b><p>Un archivo CSV con todos tus gastos.</p></div><button class="btn sm ghost" data-act="exportCsv">Descargar</button></div>' +
    '<div class="setrow"><div><b>Borrar todo</b><p>Elimina todos los datos de este dispositivo.</p></div><button class="btn sm danger" data-act="wipe">Borrar…</button></div></div>' +
    '<div class="card"><h2>Tenerla como una app</h2>' + (standalone ? '<p class="sub" style="margin-bottom:0">Ya estás usando Centex como app.</p>' :
      '<p class="sub">Añádela a tu pantalla de inicio y se abrirá a pantalla completa.</p><ol class="steps"><li><b>iPhone (Safari):</b> botón compartir → «Añadir a pantalla de inicio».</li><li><b>Android (Chrome):</b> menú ⋮ → «Instalar aplicación» o «Añadir a pantalla de inicio».</li></ol>') + '</div>' +
    '<p style="text-align:center;color:var(--muted);font-size:12.5px;font-weight:600;padding:6px">Centex · versión 1.9</p></div>' };
}

const VIEWS = { inicio: vInicio, gastos: vGastos, cartera: vCartera, seguimiento: vSeg, objetivos: vObj, ajustes: vAjustes };

function render() {
  const r = route(), v = VIEWS[r]();
  document.querySelectorAll('.nav-link').forEach(a => { if (a.dataset.r === r) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  const view = $('#view'); view.innerHTML = v.html; if (v.after) v.after();
  hydrateLogos();
  const f = fabOf(r), fab = $('#fab');
  if (f) { fab.hidden = false; fab.dataset.act = f[1]; $('#fabTx').textContent = f[0]; fab.setAttribute('aria-label', f[0]); } else fab.hidden = true;
  const names = { inicio: 'Inicio', gastos: 'Gastos', cartera: 'Cartera', seguimiento: 'Seguimiento', objetivos: 'Objetivos', ajustes: 'Ajustes' };
  document.title = names[r] + ' · Centex';
}

/* ---------- 6. formularios (hojas emergentes) ---------- */
let sheetFn = null;
function openSheet(title, html, fn) {
  $('#sheetTitle').textContent = title; $('#sheetBody').innerHTML = html; sheetFn = fn || null;
  const d = $('#sheet'); if (!d.open) d.showModal();
  d.scrollTop = 0;
}
function closeSheet() { const d = $('#sheet'); if (d.open) d.close(); sheetFn = null; }
function sheetErr(m) { const e = $('#sheetErr'); if (e) e.textContent = m; }
const opt = (name, value, checked, label) => '<label class="opt"><input type="radio" name="' + name + '" value="' + esc(value) + '"' + (checked ? ' checked' : '') + '><span>' + label + '</span></label>';
const actions = (del, label) => '<div class="err" id="sheetErr" role="alert"></div><div class="sheet-actions">' + del + '<button class="btn" type="submit">' + label + '</button></div>';
const delBtn = (kind, id) => '<button type="button" class="btn danger" data-act="sheetDel" data-kind="' + kind + '" data-id="' + esc(id) + '">Borrar</button>';

function sheetGasto(id) {
  const g = id ? D.gastos.find(x => x.id === id) : null;
  const v = g || { fecha: todayISO(), desc: '', cat: 'Comida', cant: '', pago: 'Tarjeta' };
  openSheet(g ? 'Editar gasto' : 'Nuevo gasto',
    '<div class="form"><div class="fld amount"><label for="fCant">Cantidad (€)</label><input id="fCant" name="cant" inputmode="decimal" autocomplete="off" placeholder="0,00" value="' + (g ? fmtIn(v.cant) : '') + '"></div>' +
    '<div class="fld"><span class="lb">Categoría</span><div class="opts" role="radiogroup" aria-label="Categoría">' + CATS.map(c => opt('cat', c, v.cat === c, catIcon(c, true) + c)).join('') + '</div></div>' +
    '<div class="fld"><label for="fDesc">Descripción</label><input id="fDesc" name="desc" autocomplete="off" maxlength="80" placeholder="Menú, cine, bus…" value="' + esc(v.desc) + '"></div>' +
    '<div class="row2"><div class="fld"><label for="fFecha">Fecha</label><input id="fFecha" name="fecha" type="date" value="' + v.fecha + '"></div><div class="fld"><span class="lb">Pago</span><div class="opts" role="radiogroup" aria-label="Forma de pago">' + ['Tarjeta', 'Efectivo'].map(p => opt('pago', p, v.pago === p, p)).join('') + '</div></div></div>' +
    actions(g ? delBtn('gasto', id) : '', g ? 'Guardar' : 'Añadir gasto') + '</div>',
    fd => {
      const cant = num(fd.get('cant')), fecha = fd.get('fecha');
      if (!(cant > 0)) return 'Pon una cantidad mayor que 0.';
      if (!isDate(fecha)) return 'Pon una fecha válida.';
      const o = { id: g ? g.id : uid(), fecha, desc: String(fd.get('desc') || '').trim().slice(0, 80), cat: CATS.includes(fd.get('cat')) ? fd.get('cat') : 'Otros', cant: Math.round(cant * 100) / 100, pago: fd.get('pago') === 'Efectivo' ? 'Efectivo' : 'Tarjeta' };
      if (g) D.gastos[D.gastos.indexOf(g)] = o; else D.gastos.push(o);
      save(); ui.gMes = mk(fecha); render(); toast(g ? 'Gasto actualizado' : 'Gasto guardado');
    });
  setTimeout(() => { const i = $('#fCant'); if (i && !g) i.focus(); }, 60);
}

const repRow = (n, v, modo) => '<div class="reprow"><input name="rn" list="dlRep" maxlength="40" autocomplete="off" placeholder="Fondo o activo" aria-label="Nombre del fondo o activo" value="' + esc(n) + '"><input name="rv" inputmode="decimal" autocomplete="off" placeholder="' + (modo === 'eur' ? '€' : '%') + '" aria-label="' + (modo === 'eur' ? 'Importe en euros' : 'Porcentaje') + '" value="' + fmtIn(v) + '"><button type="button" class="btn ghost" data-act="delRep" aria-label="Quitar">' + icon('x') + '</button></div>';
function sheetMes(mes, cid) {
  const multi = D.carteras.length > 1, r = mes ? D.cartera.find(x => x.mes === mes && x.c === (cid || D.carteras[0].id)) : null;
  const c0 = r ? r.c : (D.carteras.some(c => c.id === ui.cart) ? ui.cart : D.carteras[0].id);
  const v = r || { mes: mk(todayISO()), aportado: '', valor: '' };
  // Reparto: al editar, el de ese mes; en un mes nuevo, los mismos fondos del último mes que lo tenga (con sus % si estaba en %).
  const prev = carteraRows(c0).filter(x => x.rep && x.mes !== (r ? r.mes : '')).pop();
  const vacio = { modo: 'pct', items: [{ n: '', v: '' }, { n: '', v: '' }] };
  const base = r ? (r.rep || vacio) : prev ? { modo: prev.rep.modo, items: prev.rep.items.map(i => ({ n: i.n, v: prev.rep.modo === 'pct' ? i.v : '' })) } : vacio;
  const names = [...new Set(D.cartera.flatMap(x => (x.rep && x.rep.items || []).map(i => i.n)).concat(D.seg.filter(p => p.tipo === 'fondo').map(p => p.nombre)))];
  openSheet(r ? 'Editar mes' : 'Apuntar un mes',
    '<div class="form"><p class="sub" style="margin:0">Una vez al mes: lo que aportaste y el valor que marca tu plataforma.</p>' +
    (multi ? (r ? '<input type="hidden" name="cart" value="' + esc(c0) + '"><p style="margin:0;font-weight:700">Cartera: ' + esc(D.carteras.find(c => c.id === c0).nombre) + '</p>' : '<div class="fld"><span class="lb">Cartera</span><div class="opts" role="radiogroup" aria-label="Cartera">' + D.carteras.map(c => opt('cart', c.id, c.id === c0, esc(c.nombre))).join('') + '</div></div>') : '<input type="hidden" name="cart" value="' + esc(c0) + '">') +
    '<div class="fld"><label for="cMes">Mes</label><input id="cMes" name="mes" type="month" placeholder="2026-10" value="' + v.mes + '"' + (r ? ' readonly' : '') + '></div>' +
    '<div class="row2"><div class="fld"><label for="cAp">Aportado ese mes (€)</label><input id="cAp" name="ap" inputmode="decimal" autocomplete="off" placeholder="0" value="' + (r ? fmtIn(v.aportado) : '') + '"></div><div class="fld"><label for="cVal">Valor de la cartera (€)</label><input id="cVal" name="val" inputmode="decimal" autocomplete="off" placeholder="0,00" value="' + (r ? fmtIn(v.valor) : '') + '"></div></div>' +
    '<div class="fld"><span class="lb">¿En qué está invertido? (opcional)</span><div class="opts" role="radiogroup" aria-label="Cómo apuntar el reparto">' + opt('repModo', 'pct', base.modo !== 'eur', 'En %') + opt('repModo', 'eur', base.modo === 'eur', 'En €') + '</div>' +
    '<div id="repRows" style="display:flex;flex-direction:column;gap:8px;margin-top:4px">' + base.items.map(i => repRow(i.n, i.v, base.modo)).join('') + '</div>' +
    '<datalist id="dlRep">' + names.map(n => '<option value="' + esc(n) + '">').join('') + '</datalist>' +
    '<button type="button" class="btn sm ghost" data-act="addRep" style="align-self:flex-start">' + icon('plus') + 'Añadir fondo o activo</button>' +
    '<span class="help">Apunta cada uno con su porcentaje o su importe, como te sea más cómodo. Lo que no apuntes aparece como «Sin asignar». Al cambiar de % a €, los números se convierten solos con el valor de la cartera.</span></div>' +
    actions(r ? delBtn('mes', c0 + '|' + mes) : '', 'Guardar mes') + '</div>',
    fd => {
      const m = String(fd.get('mes') || ''), ap = num(fd.get('ap')), val = num(fd.get('val')), cc = String(fd.get('cart') || '');
      if (!D.carteras.some(c => c.id === cc)) return 'Elige una cartera.';
      if (!isMonth(m)) return 'Pon un mes válido (por ejemplo 2026-10).';
      if (ap == null || ap < 0) return 'Pon lo aportado (puede ser 0).';
      if (val == null || val < 0) return 'Pon el valor de la cartera.';
      const modo = fd.get('repModo') === 'eur' ? 'eur' : 'pct', rn = fd.getAll('rn'), rv = fd.getAll('rv'), items = [], seen = new Set();
      for (let k = 0; k < rn.length; k++) {
        const nombre = String(rn[k] || '').trim().slice(0, 40), raw = String(rv[k] || '').trim();
        if (!raw) continue; // fila sin cantidad: se ignora
        if (!nombre) return 'Falta el nombre de uno de los fondos o activos.';
        const x = num(raw);
        if (x == null || !(x > 0)) return 'Pon un ' + (modo === 'eur' ? 'importe' : 'porcentaje') + ' mayor que 0 para «' + nombre + '».';
        if (seen.has(nombre.toLowerCase())) return '«' + nombre + '» está repetido.';
        seen.add(nombre.toLowerCase()); items.push({ n: nombre, v: x });
      }
      const suma = items.reduce((a, b) => a + b.v, 0);
      if (modo === 'pct' && suma > 100.05) return 'Los porcentajes suman ' + suma.toLocaleString('es-ES', { maximumFractionDigits: 1 }) + ' %: no pueden pasar de 100 %.';
      if (modo === 'eur' && suma > val + 0.01) return 'Los importes suman ' + eur(suma) + ', más que el valor de la cartera (' + eur(val) + ').';
      const row = { c: cc, mes: m, aportado: ap, valor: val }; if (items.length) row.rep = { modo, items };
      D.cartera = D.cartera.filter(x => !(x.mes === m && x.c === cc)); D.cartera.push(row); ui.cart = multi ? (ui.cart === 'total' ? 'total' : cc) : cc;
      save(); render(); toast('Mes guardado');
    });
}

function sheetSeg(id) {
  const p = id ? D.seg.find(x => x.id === id) : null;
  const v = p || { tipo: ui.segTipo, grupo: '', nombre: '', ticker: '', fecha: '', precioEntrada: '', precioActual: '', motivo: '', web: '' };
  const groups = [...new Set(D.seg.map(x => x.grupo))];
  openSheet(p ? 'Editar posición' : 'Añadir al seguimiento',
    '<div class="form"><div class="fld"><span class="lb">Sección</span><div class="opts" role="radiogroup" aria-label="Sección">' + D.secciones.map(x => opt('tipo', x.id, v.tipo === x.id, esc(x.nombre))).join('') + '</div></div>' +
    '<div class="fld"><label for="sNombre">Nombre</label><input id="sNombre" name="nombre" maxlength="80" autocomplete="off" value="' + esc(v.nombre) + '"></div>' +
    '<div class="row2"><div class="fld"><label for="sGrupo">Sector o tipo</label><input id="sGrupo" name="grupo" list="dlGrupos" maxlength="60" autocomplete="off" placeholder="Tecnología, Value…" value="' + esc(v.grupo) + '"><datalist id="dlGrupos">' + groups.map(g => '<option value="' + esc(g) + '">').join('') + '</datalist></div><div class="fld"><label for="sTicker">Ticker o ISIN</label><input id="sTicker" name="ticker" maxlength="30" autocomplete="off" value="' + esc(v.ticker) + '"></div></div>' +
    '<div class="row2"><div class="fld"><label for="sEnt">Precio de entrada (€)</label><input id="sEnt" name="pent" inputmode="decimal" autocomplete="off" value="' + fmtIn(v.precioEntrada) + '"></div><div class="fld"><label for="sAct">Precio actual (€)</label><input id="sAct" name="pact" inputmode="decimal" autocomplete="off" value="' + fmtIn(v.precioActual) + '"></div></div>' +
    '<div class="fld"><label for="sFecha">Fecha de entrada</label><input id="sFecha" name="fecha" type="date" value="' + esc(v.fecha || '') + '"></div>' +
    '<div class="fld"><label for="sWeb">Web de la empresa (opcional)</label><input id="sWeb" name="web" maxlength="80" autocomplete="off" inputmode="url" placeholder="qualcomm.com" value="' + esc(v.web || '') + '"><span class="help">Solo sirve para encontrar su logo. Si sale bien sin ponerla, déjala vacía.</span></div>' +
    '<div class="fld"><label for="sMotivo">Motivo corto</label><input id="sMotivo" name="motivo" maxlength="400" autocomplete="off" value="' + esc(v.motivo) + '"></div>' +
    actions(p ? delBtn('seg', id) : '', p ? 'Guardar' : 'Añadir') + '</div>',
    fd => {
      const nombre = String(fd.get('nombre') || '').trim(), grupo = String(fd.get('grupo') || '').trim();
      if (!nombre || !grupo) return 'Pon al menos el nombre y el sector o tipo.';
      const f = fd.get('fecha');
      const o = { id: p ? p.id : uid(), tipo: D.secciones.some(x => x.id === fd.get('tipo')) ? fd.get('tipo') : D.secciones[0].id, grupo: grupo.slice(0, 60), nombre: nombre.slice(0, 80), ticker: String(fd.get('ticker') || '').trim().slice(0, 30), web: webClean(fd.get('web')), fecha: isDate(f) ? f : null, precioEntrada: num(fd.get('pent')), precioActual: num(fd.get('pact')), motivo: String(fd.get('motivo') || '').trim().slice(0, 400) };
      if (p) D.seg[D.seg.indexOf(p)] = o; else D.seg.push(o);
      ui.segTipo = o.tipo; save(); render(); toast(p ? 'Posición actualizada' : 'Añadido al seguimiento');
    });
}

const movRow = (f, m, v) => '<div class="fld"><div class="movrow"><input name="mf" type="date" aria-label="Fecha" value="' + esc(f) + '"><select name="mt" aria-label="Qué apuntas"><option value="part"' + (m === 'part' ? ' selected' : '') + '>Participaciones</option><option value="eur"' + (m === 'eur' ? ' selected' : '') + '>Importe (€)</option></select><div class="movq"><input name="mv" inputmode="decimal" autocomplete="off" placeholder="Cantidad" aria-label="Cantidad" value="' + fmtIn(v) + '"><button type="button" class="btn ghost" data-act="delMov" aria-label="Quitar">' + icon('x') + '</button></div></div></div>';
function sheetFondo(id) {
  const fo = id ? D.fondos.find(x => x.id === id) : null, isins = Object.keys(PR).filter(isIsin);
  if (!fo && !isins.length) { toast('Aún no tengo los precios. Abre la app con internet y prueba de nuevo.'); return; }
  const multi = D.carteras.length > 1, c0 = fo ? fo.c : (D.carteras.some(c => c.id === ui.cart) ? ui.cart : D.carteras[0].id);
  const v = fo || { isin: isins.find(i => !D.fondos.some(x => x.isin === i && x.c === c0)) || isins[0], c: c0, movs: [{ f: todayISO(), m: 'part', v: '' }] };
  openSheet(fo ? 'Editar fondo' : 'Añadir fondo',
    '<div class="form">' +
    (fo ? '<input type="hidden" name="isin" value="' + esc(fo.isin) + '"><p style="margin:0;font-weight:700">' + esc((PR[fo.isin] || {}).nombre || fo.isin) + '</p>' : '<div class="fld"><span class="lb">Fondo</span><div class="opts" role="radiogroup" aria-label="Fondo">' + isins.map(i => opt('isin', i, i === v.isin, esc(PR[i].nombre))).join('') + '</div></div>') +
    (multi ? (fo ? '<input type="hidden" name="cart" value="' + esc(c0) + '">' : '<div class="fld"><span class="lb">Cartera</span><div class="opts" role="radiogroup" aria-label="Cartera">' + D.carteras.map(c => opt('cart', c.id, c.id === c0, esc(c.nombre))).join('') + '</div></div>') : '<input type="hidden" name="cart" value="' + esc(c0) + '">') +
    '<div class="fld"><span class="lb">Tus compras</span><span class="help" style="margin:0 0 6px">Primero, lo que ya tienes: fecha de hoy y las participaciones que ves en tu plataforma. Luego, cada vez que compres, otra fila con su fecha, en participaciones o en importe (la app calcula las participaciones con el precio de ese día). Una venta va en negativo.</span>' +
    '</div><div id="movRows" style="display:flex;flex-direction:column;gap:8px">' + v.movs.map(m => movRow(m.f, m.m, m.v)).join('') + '</div>' +
    '<button type="button" class="btn sm ghost" data-act="addMov" style="align-self:flex-start">' + icon('plus') + 'Añadir compra</button>' +
    actions(fo ? delBtn('fondo', id) : '', fo ? 'Guardar' : 'Añadir fondo') + '</div>',
    fd => {
      const isin = String(fd.get('isin') || ''), cc = String(fd.get('cart') || '');
      if (!isIsin(isin) || !PR[isin]) return 'Elige un fondo.';
      if (!D.carteras.some(c => c.id === cc)) return 'Elige una cartera.';
      if (!fo && D.fondos.some(x => x.isin === isin && x.c === cc)) return 'Ese fondo ya está en esta cartera: tócalo en la lista para añadirle compras.';
      const fs = fd.getAll('mf'), ts = fd.getAll('mt'), vs = fd.getAll('mv'), movs = [];
      for (let k = 0; k < fs.length; k++) {
        const raw = String(vs[k] || '').trim(); if (!raw) continue; // fila sin cantidad: se ignora
        const x = num(raw);
        if (!isDate(fs[k])) return 'Pon la fecha de cada compra.';
        if (x == null || x === 0) return 'Pon una cantidad (distinta de 0) en cada compra.';
        movs.push({ f: fs[k], m: ts[k] === 'eur' ? 'eur' : 'part', v: x });
      }
      if (!movs.length) return 'Apunta al menos una compra.';
      const us = fondoUnits({ isin, movs }); let acc = 0;
      for (const u of us) { acc += u.u; if (acc < -1e-9) return 'Con esas ventas te quedarías con participaciones negativas el ' + dLabel(u.f) + '.'; }
      const o = { id: fo ? fo.id : 'f_' + uid(), isin, c: cc, movs };
      if (fo) D.fondos[D.fondos.indexOf(fo)] = o; else D.fondos.push(o);
      save(); render(); toast(fo ? 'Fondo actualizado' : 'Fondo añadido');
    });
}

function sheetCarts() {
  openSheet('Carteras',
    '<div class="form"><p class="sub" style="margin:0">Una cartera por plataforma (MyInvestor, Trade Republic, cripto…). Cambia su nombre, bórrala o crea una nueva. El fondo de emergencia mejor no lo apuntes aquí: no es inversión y te estropearía la rentabilidad del total.</p>' +
    D.carteras.map(x => {
      const n = D.cartera.filter(r => r.c === x.id).length;
      return '<div class="fld"><label for="ct_' + esc(x.id) + '">' + (n ? n + ' mes' + (n === 1 ? '' : 'es') + ' apuntado' + (n === 1 ? '' : 's') : 'Sin meses apuntados') + '</label><div style="display:flex;gap:8px"><input id="ct_' + esc(x.id) + '" name="n_' + esc(x.id) + '" maxlength="30" autocomplete="off" style="flex:1" value="' + esc(x.nombre) + '">' +
        (D.carteras.length > 1 ? '<button type="button" class="btn sm danger" data-act="sheetDel" data-kind="cart" data-id="' + esc(x.id) + '">Borrar</button>' : '') + '</div>' +
        (n && D.carteras.length > 1 ? '<span class="help">Si la borras, también se borran sus ' + n + ' mes' + (n === 1 ? '' : 'es') + '.</span>' : '') + '</div>';
    }).join('') +
    '<div class="fld"><label for="ctNueva">Nueva cartera</label><input id="ctNueva" name="nueva" maxlength="30" autocomplete="off" placeholder="Trade Republic"></div>' +
    actions('', 'Guardar') + '</div>',
    fd => {
      const names = D.carteras.map(x => [x, String(fd.get('n_' + x.id) || '').trim()]);
      if (names.some(a => !a[1])) return 'Ninguna cartera puede quedarse sin nombre.';
      const nueva = String(fd.get('nueva') || '').trim();
      const all = names.map(a => a[1].toLowerCase()).concat(nueva ? [nueva.toLowerCase()] : []);
      if (new Set(all).size !== all.length) return 'Hay dos carteras con el mismo nombre.';
      names.forEach(a => { a[0].nombre = a[1].slice(0, 30); });
      if (nueva) { const x = { id: 'c_' + uid(), nombre: nueva.slice(0, 30) }; D.carteras.push(x); ui.cart = x.id; }
      save(); render(); toast(nueva ? 'Cartera creada' : 'Carteras guardadas');
    });
}

function sheetSecs() {
  openSheet('Secciones de seguimiento',
    '<div class="form"><p class="sub" style="margin:0">Cambia el nombre de una sección, bórrala o crea una nueva (por ejemplo, Cripto).</p>' +
    D.secciones.map(x => {
      const n = D.seg.filter(p => p.tipo === x.id).length;
      return '<div class="fld"><label for="sc_' + esc(x.id) + '">' + (n ? n + ' posición' + (n === 1 ? '' : 'es') : 'Sin posiciones') + '</label><div style="display:flex;gap:8px"><input id="sc_' + esc(x.id) + '" name="n_' + esc(x.id) + '" maxlength="30" autocomplete="off" style="flex:1" value="' + esc(x.nombre) + '">' +
        (D.secciones.length > 1 ? '<button type="button" class="btn sm danger" data-act="sheetDel" data-kind="sec" data-id="' + esc(x.id) + '">Borrar</button>' : '') + '</div>' +
        (n && D.secciones.length > 1 ? '<span class="help">Si la borras, también se borran sus ' + n + ' posición' + (n === 1 ? '' : 'es') + '.</span>' : '') + '</div>';
    }).join('') +
    '<div class="fld"><label for="scNueva">Nueva sección</label><input id="scNueva" name="nueva" maxlength="30" autocomplete="off" placeholder="Cripto"></div>' +
    actions('', 'Guardar') + '</div>',
    fd => {
      const names = D.secciones.map(x => [x, String(fd.get('n_' + x.id) || '').trim()]);
      if (names.some(a => !a[1])) return 'Ninguna sección puede quedarse sin nombre.';
      const nueva = String(fd.get('nueva') || '').trim();
      const all = names.map(a => a[1].toLowerCase()).concat(nueva ? [nueva.toLowerCase()] : []);
      if (new Set(all).size !== all.length) return 'Hay dos secciones con el mismo nombre.';
      names.forEach(a => { a[0].nombre = a[1].slice(0, 30); });
      if (nueva) { const x = { id: 's_' + uid(), nombre: nueva.slice(0, 30) }; D.secciones.push(x); ui.segTipo = x.id; }
      save(); render(); toast(nueva ? 'Sección creada' : 'Secciones guardadas');
    });
}

function sheetPrecios() {
  const items = D.seg.filter(p => p.tipo === ui.segTipo);
  openSheet('Actualizar precios',
    '<div class="form"><p class="sub" style="margin:0">Pon el precio de hoy de cada uno. Déjalo vacío si no lo sabes.</p>' +
    items.map(p => '<div class="pricerow"><div><b>' + esc(p.nombre) + '</b><small>' + (p.precioEntrada != null ? 'Entrada ' + eur(p.precioEntrada) : 'Sin precio de entrada') + '</small></div><input name="p_' + esc(p.id) + '" inputmode="decimal" autocomplete="off" aria-label="Precio actual de ' + esc(p.nombre) + '" placeholder="€" value="' + fmtIn(p.precioActual) + '"></div>').join('') +
    actions('', 'Guardar precios') + '</div>',
    fd => {
      for (const p of items) { const raw = fd.get('p_' + p.id); const n = num(raw); if (String(raw || '').trim() && (n == null || n < 0)) return 'Revisa el precio de ' + p.nombre + '.'; }
      items.forEach(p => { p.precioActual = num(fd.get('p_' + p.id)); });
      save(); render(); toast('Precios actualizados');
    });
}

function sheetObj(id) {
  const o = id ? D.objetivos.find(x => x.id === id) : null;
  const v = o || { nombre: '', meta: '', ahorrado: '', fecha: '' };
  openSheet(o ? 'Editar objetivo' : 'Nuevo objetivo',
    '<div class="form"><div class="fld"><label for="oNom">Nombre</label><input id="oNom" name="nombre" maxlength="60" autocomplete="off" placeholder="Colchón de emergencia" value="' + esc(v.nombre) + '"></div>' +
    '<div class="row2"><div class="fld"><label for="oMeta">Meta (€)</label><input id="oMeta" name="meta" inputmode="decimal" autocomplete="off" value="' + fmtIn(v.meta) + '"></div><div class="fld"><label for="oAh">Ya ahorrado (€)</label><input id="oAh" name="ahorrado" inputmode="decimal" autocomplete="off" placeholder="0" value="' + (o ? fmtIn(v.ahorrado) : '') + '"></div></div>' +
    '<div class="fld"><label for="oFecha">Fecha límite (opcional)</label><input id="oFecha" name="fecha" type="date" value="' + esc(v.fecha || '') + '"><span class="help">Con fecha, te digo cuánto tienes que ahorrar al mes.</span></div>' +
    actions(o ? delBtn('obj', id) : '', o ? 'Guardar' : 'Crear objetivo') + '</div>',
    fd => {
      const nombre = String(fd.get('nombre') || '').trim(), meta = num(fd.get('meta')), ah = fd.get('ahorrado') === '' ? 0 : num(fd.get('ahorrado')), f = fd.get('fecha');
      if (!nombre) return 'Ponle un nombre al objetivo.';
      if (!(meta > 0)) return 'La meta tiene que ser mayor que 0.';
      if (ah == null || ah < 0) return 'Revisa lo que llevas ahorrado.';
      const n = { id: o ? o.id : uid(), nombre: nombre.slice(0, 60), meta, ahorrado: ah, fecha: isDate(f) ? f : null };
      if (o) D.objetivos[D.objetivos.indexOf(o)] = n; else D.objetivos.push(n);
      save(); render(); toast(o ? 'Objetivo actualizado' : 'Objetivo creado');
    });
}

function sheetAportar(id) {
  const o = D.objetivos.find(x => x.id === id); if (!o) return;
  openSheet('Aportar a «' + o.nombre + '»',
    '<div class="form"><div class="fld amount"><label for="aCant">Cantidad (€)</label><input id="aCant" name="cant" inputmode="decimal" autocomplete="off" placeholder="0,00"></div>' +
    '<div class="fld"><div class="opts" role="radiogroup" aria-label="Acción">' + opt('modo', 'mas', true, 'Aportar') + opt('modo', 'menos', false, 'Retirar') + '</div></div>' +
    actions('', 'Guardar') + '</div>',
    fd => {
      const c = num(fd.get('cant')); if (!(c > 0)) return 'Pon una cantidad mayor que 0.';
      o.ahorrado = Math.max(0, Math.round((o.ahorrado + (fd.get('modo') === 'menos' ? -c : c)) * 100) / 100);
      save(); render(); toast(o.ahorrado >= o.meta ? '¡Objetivo conseguido!' : 'Guardado');
    });
  setTimeout(() => { const i = $('#aCant'); if (i) i.focus(); }, 60);
}

function sheetImport(data) {
  const c = cleanData(data), n = c.gastos.length + c.cartera.length + c.seg.length + c.objetivos.length;
  if (!n) { toast('Ese archivo no tiene datos de Centex'); return; }
  const have = D.gastos.length + D.cartera.length + D.seg.length + D.objetivos.length;
  openSheet('Importar datos',
    '<div class="form"><p style="margin:0;font-weight:600">El archivo trae <b>' + c.gastos.length + '</b> gastos, <b>' + c.cartera.length + '</b> meses de cartera, <b>' + c.seg.length + '</b> posiciones y <b>' + c.objetivos.length + '</b> objetivos.</p>' +
    (have ? '<div class="fld"><span class="lb">¿Qué hacemos con lo que ya tienes?</span><div class="opts" role="radiogroup">' + opt('modo', 'combinar', true, 'Combinar') + opt('modo', 'reemplazar', false, 'Reemplazar todo') + '</div><span class="help">Combinar añade lo nuevo sin tocar lo que ya tienes.</span></div>' : '<input type="hidden" name="modo" value="reemplazar">') +
    actions('', 'Importar') + '</div>',
    fd => {
      if (fd.get('modo') === 'reemplazar') { D.gastos = c.gastos; D.cartera = c.cartera; D.carteras = c.carteras; D.fondos = c.fondos; D.seg = c.seg; D.secciones = c.secciones; D.objetivos = c.objetivos; }
      else {
        const has = (arr, id) => arr.some(x => x.id === id);
        c.gastos.forEach(x => { if (!has(D.gastos, x.id)) D.gastos.push(x); });
        c.secciones.forEach(x => { if (!D.secciones.some(y => y.id === x.id)) D.secciones.push(x); });
        c.seg.forEach(x => { if (!has(D.seg, x.id)) D.seg.push(x); });
        ensureSecs(D.secciones, D.seg);
        c.objetivos.forEach(x => { if (!has(D.objetivos, x.id)) D.objetivos.push(x); });
        c.carteras.forEach(x => { if (!D.carteras.some(y => y.id === x.id)) D.carteras.push(x); });
        c.fondos.forEach(x => { if (!D.fondos.some(y => y.id === x.id || (y.isin === x.isin && y.c === x.c))) D.fondos.push(x); });
        c.cartera.forEach(x => { D.cartera = D.cartera.filter(y => !(y.mes === x.mes && y.c === x.c)); D.cartera.push(x); });
      }
      save(); render(); toast('Datos importados');
    });
}

function sheetWipe() {
  openSheet('Borrar todo', '<div class="form"><p style="margin:0;font-weight:600">Se borrarán todos tus gastos, tu cartera, tu seguimiento y tus objetivos de este dispositivo. No se puede deshacer, salvo que tengas una copia de seguridad.</p>' +
    '<div class="sheet-actions"><button type="button" class="btn ghost" data-act="closeSheet">Cancelar</button><button type="button" class="btn danger" data-act="sheetDel" data-kind="all">Borrar todo</button></div></div>');
}

/* ---------- 7. eventos ---------- */
function download(name, text, type) {
  const b = new Blob([text], { type }), a = document.createElement('a');
  a.href = URL.createObjectURL(b); a.download = name; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
}
function doDelete(kind, id) {
  if (kind === 'gasto') D.gastos = D.gastos.filter(x => x.id !== id);
  else if (kind === 'mes') { const [cc, mm] = String(id).split('|'); D.cartera = D.cartera.filter(x => !(x.mes === mm && x.c === cc)); }
  else if (kind === 'fondo') D.fondos = D.fondos.filter(x => x.id !== id);
  else if (kind === 'cart') { if (D.carteras.length <= 1) return; D.fondos = D.fondos.filter(x => x.c !== id); D.cartera = D.cartera.filter(x => x.c !== id); D.carteras = D.carteras.filter(x => x.id !== id); ui.cart = 'total'; }
  else if (kind === 'seg') D.seg = D.seg.filter(x => x.id !== id);
  else if (kind === 'obj') D.objetivos = D.objetivos.filter(x => x.id !== id);
  else if (kind === 'sec') { if (D.secciones.length <= 1) return; D.seg = D.seg.filter(x => x.tipo !== id); D.secciones = D.secciones.filter(x => x.id !== id); }
  else if (kind === 'all') { const a = D.ajustes; D = blank(); D.ajustes = a; ui.inm = null; ui.escTipo = 'inv'; ui.cart = 'total'; try { localStorage.removeItem('centex.esc'); } catch (e) { /* nada */ } }
  save(); closeSheet(); render(); toast(kind === 'all' ? 'Todo borrado' : kind === 'sec' ? 'Sección borrada' : kind === 'cart' ? 'Cartera borrada' : 'Borrado');
}
const ACT = {
  fab() { const f = fabOf(route()); if (f) ACT[f[1]](); },
  addGasto() { sheetGasto(); }, addMes() { sheetMes(); }, addSeg() { sheetSeg(); }, addObj() { sheetObj(); },
  editGasto(el) { sheetGasto(el.dataset.id); }, editMes(el) { sheetMes(el.dataset.id, el.dataset.c); }, editSeg(el) { sheetSeg(el.dataset.id); },
  editObj(el) { sheetObj(el.dataset.id); }, aportar(el) { sheetAportar(el.dataset.id); }, precios() { sheetPrecios(); },
  goSettings() { location.hash = '#/ajustes'; }, closeSheet() { closeSheet(); }, wipe() { sheetWipe(); },
  gMes(el) { ui.gMes = el.dataset.m; render(); },
  addFondo() { sheetFondo(); }, editFondo(el) { sheetFondo(el.dataset.id); },
  addMov() { const b = $('#movRows'); b.insertAdjacentHTML('beforeend', movRow(todayISO(), 'part', '')); const i = b.lastElementChild.querySelector('input[name="mv"]'); if (i) i.focus(); },
  delMov(el) { const row = el.closest('.fld'); if (row) row.remove(); },
  cCart(el) { ui.cart = el.dataset.c; render(); window.scrollTo(0, 0); },
  addCart() { sheetCarts(); setTimeout(() => { const i = $('#ctNueva'); if (i) i.focus(); }, 60); }, editCarts() { sheetCarts(); },
  cRango(el) { ui.cRango = el.dataset.r; render(); },
  segTipo(el) { ui.segTipo = el.dataset.t; render(); },
  escTipo(el) { ui.escTipo = el.dataset.t === 'inm' ? 'inm' : 'inv'; persistEsc(); render(); },
  objTab(el) { ui.objTab = el.dataset.t === 'esc' ? 'esc' : 'obj'; render(); },
  addRep() {
    const box = $('#repRows'), modo = (document.querySelector('input[name="repModo"]:checked') || {}).value;
    box.insertAdjacentHTML('beforeend', repRow('', '', modo)); const i = box.lastElementChild.querySelector('input'); if (i) i.focus();
  },
  delRep(el) { const row = el.closest('.reprow'); if (row) row.remove(); },
  addSec() { sheetSecs(); setTimeout(() => { const i = $('#scNueva'); if (i) i.focus(); }, 60); }, editSecs() { sheetSecs(); },
  logos(el) { D.ajustes.logos = el.dataset.v === '1'; save(); render(); },
  tema(el) { D.ajustes.tema = el.dataset.v; save(); applyTheme(); render(); },
  pickFile() { $('#fileIn').value = ''; $('#fileIn').click(); },
  export() {
    download('centex-copia-' + todayISO() + '.json', JSON.stringify({ app: 'centex', version: 1, exportado: new Date().toISOString(), gastos: D.gastos, cartera: D.cartera, carteras: D.carteras, fondos: D.fondos, seg: D.seg, secciones: D.secciones, objetivos: D.objetivos }, null, 2), 'application/json');
    D.ajustes.ultimaCopia = todayISO(); save(); render(); toast('Copia descargada');
  },
  exportCsv() {
    if (!D.gastos.length) { toast('Aún no tienes gastos'); return; }
    const q = v => '"' + String(v).replace(/"/g, '""') + '"';
    const rows = D.gastos.slice().sort((a, b) => (a.fecha < b.fecha ? -1 : 1)).map(g => [g.fecha, q(g.desc), g.cat, String(g.cant).replace('.', ','), g.pago].join(';'));
    download('centex-gastos-' + todayISO() + '.csv', '﻿Fecha;Descripción;Categoría;Cantidad (€);Forma de pago\n' + rows.join('\n'), 'text/csv');
    toast('CSV descargado');
  },
  sheetDel(el) {
    if (!el.dataset.sure) { el.dataset.sure = '1'; el.textContent = '¿Seguro? Toca otra vez'; setTimeout(() => { if (el.isConnected) { delete el.dataset.sure; el.textContent = el.dataset.kind === 'all' ? 'Borrar todo' : 'Borrar'; } }, 3500); return; }
    doDelete(el.dataset.kind, el.dataset.id);
  }
};
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (el && ACT[el.dataset.act]) { e.preventDefault(); ACT[el.dataset.act](el, e); return; }
  if (e.target === $('#sheet')) closeSheet();
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.id === 'cmpA') { ui.cmpA = t.value; ui._cmpTouched = true; render(); }
  else if (t.id === 'cmpB') { ui.cmpB = t.value || null; ui._cmpTouched = true; render(); }
  else if (t.id === 'rDesde' || t.id === 'rHasta') rango();
  else if (t.name === 'repModo') convertRep(t.value);
  else if (t.id === 'fileIn' && t.files && t.files[0]) {
    const f = t.files[0];
    if (f.size > 5e6) { toast('El archivo es demasiado grande'); return; }
    const rd = new FileReader();
    rd.onload = () => { try { sheetImport(JSON.parse(rd.result)); } catch (err) { toast('No he podido leer ese archivo'); } };
    rd.readAsText(f);
  }
});
document.addEventListener('input', e => {
  if (e.target.id === 'q') { ui.q = e.target.value; $('#gList').innerHTML = gListHTML(); }
  else if (e.target.closest && e.target.closest('#escForm')) { readEsc(); renderEsc(); }
});
// Al cambiar el reparto de % a € (o al revés), convierte lo ya escrito usando el valor de la cartera.
function convertRep(modo) {
  const total = num(($('#cVal') || {}).value), inputs = [...document.querySelectorAll('#repRows input[name="rv"]')];
  let sinConvertir = false;
  inputs.forEach(inp => {
    inp.placeholder = modo === 'eur' ? '€' : '%'; inp.setAttribute('aria-label', modo === 'eur' ? 'Importe en euros' : 'Porcentaje');
    const x = num(inp.value); if (x == null) return;
    if (!(total > 0)) { sinConvertir = true; return; }
    inp.value = fmtIn(modo === 'eur' ? Math.round(x * total) / 100 : Math.round((x / total) * 1000) / 10);
  });
  if (sinConvertir) toast('Pon el valor de la cartera para convertir los números');
}
function rango() {
  const d = $('#rDesde').value, h = $('#rHasta').value, out = $('#rTotal');
  if (!d || !h) { out.textContent = 'Elige las dos fechas.'; return; }
  if (d > h) { out.textContent = 'La fecha de inicio es posterior a la final.'; return; }
  const l = D.gastos.filter(x => x.fecha >= d && x.fecha <= h), t = l.reduce((s, x) => s + x.cant, 0);
  out.innerHTML = 'Del ' + esc(dLabel(d)) + ' al ' + esc(dLabel(h)) + ': <b>' + eur(t) + '</b> en ' + l.length + ' gasto' + (l.length === 1 ? '' : 's');
}
$('#sheetForm').addEventListener('submit', e => {
  e.preventDefault();
  if (!sheetFn) return;
  const msg = sheetFn(new FormData(e.target));
  if (typeof msg === 'string') sheetErr(msg); else closeSheet();
});
$('#sheet').addEventListener('close', () => { sheetFn = null; });

const tip = $('#tip');
function showTip(e) {
  const t = e.target.closest && e.target.closest('[data-tip]');
  if (!t) { tip.style.display = 'none'; return; }
  const p = e.touches ? e.touches[0] : e;
  tip.textContent = t.getAttribute('data-tip'); tip.style.display = 'block';
  const w = tip.offsetWidth, h = tip.offsetHeight;
  tip.style.left = Math.max(8, Math.min(p.clientX + 14, innerWidth - w - 8)) + 'px';
  tip.style.top = Math.max(8, Math.min(p.clientY - h - 14 < 8 ? p.clientY + 18 : p.clientY - h - 14, innerHeight - h - 8)) + 'px';
}
document.addEventListener('mousemove', showTip);
document.addEventListener('touchstart', showTip, { passive: true });
let rz; window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(render, 150); });
window.addEventListener('hashchange', () => { window.scrollTo(0, 0); render(); });

/* ---------- 8. arranque ---------- */
function applyTheme() {
  const t = D.ajustes.tema, root = document.documentElement;
  if (t === 'claro') root.dataset.theme = 'light'; else if (t === 'oscuro') root.dataset.theme = 'dark'; else delete root.dataset.theme;
  requestAnimationFrame(() => { const c = getComputedStyle(root).getPropertyValue('--bg').trim(); if (c) $('#metaTheme').setAttribute('content', c); });
}
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);

$('#navItems').innerHTML = NAV.map(n => '<a class="nav-link" data-r="' + n[0] + '" href="#/' + n[0] + '">' + icon(n[2]) + '<span>' + n[1] + '</span></a>').join('');
$('#gearTop').innerHTML = icon('sliders');
$('#gearSide').innerHTML = icon('sliders') + '<span>Ajustes</span>';
$('#sheetX').innerHTML = icon('x');
$('#fabIc').innerHTML = icon('plus');

applyTheme();
render();
loadPrecios();
if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) navigator.serviceWorker.register('sw.js').catch(() => {});
