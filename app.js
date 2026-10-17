'use strict';
/* =====================================================================
   Centex · lógica de la app
   Todo se guarda en este dispositivo (localStorage). Nada sale a internet.
   Estructura del archivo:
     1. utilidades      4. gráficos        7. eventos
     2. datos           5. pantallas       8. arranque
     3. cálculos        6. formularios
   ===================================================================== */

/* ---------- 1. utilidades ---------- */
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const eur = (n, d = 2) => n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: d, maximumFractionDigits: d });
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
const isDate = s => /^\d{4}-\d{2}-\d{2}$/.test(String(s || '')) && !isNaN(new Date(s + 'T00:00:00'));
const isMonth = s => /^\d{4}-(0[1-9]|1[0-2])$/.test(String(s || ''));
function niceStep(x) { if (x <= 0) return 10; const p = Math.pow(10, Math.floor(Math.log10(x))); const f = x / p; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p; }
const fmtAx = v => (v >= 1000 ? (v / 1000).toString().replace('.', ',') + 'k' : v.toString().replace('.', ',')) + ' €';
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
const blank = () => ({ gastos: [], cartera: [], seg: [], secciones: SECS0(), objetivos: [], ajustes: { tema: 'auto', ultimaCopia: null } });
function norm(o) {
  const b = blank(); o = o && typeof o === 'object' ? o : {};
  const seg = Array.isArray(o.seg) ? o.seg : [];
  return {
    gastos: Array.isArray(o.gastos) ? o.gastos : [], cartera: Array.isArray(o.cartera) ? o.cartera : [],
    seg, secciones: ensureSecs(cleanSecs(o.secciones), seg), objetivos: Array.isArray(o.objetivos) ? o.objetivos : [],
    ajustes: Object.assign(b.ajustes, o.ajustes || {})
  };
}
let D;
try { D = norm(JSON.parse(localStorage.getItem(KEY) || 'null')); } catch (e) { D = blank(); }
function save() { try { localStorage.setItem(KEY, JSON.stringify(D)); } catch (e) { toast('No he podido guardar en este navegador'); } }

// Limpia un archivo importado: solo deja lo que tiene el formato correcto.
function cleanData(o) {
  o = o && typeof o === 'object' ? o : {};
  const s = (v, max = 200) => String(v == null ? '' : v).slice(0, max);
  const n = v => { const x = typeof v === 'number' ? v : num(v); return isFinite(x) ? x : null; };
  const arr = k => (Array.isArray(o[k]) ? o[k] : []);
  const seg = arr('seg').filter(x => x && s(x.nombre) && s(x.grupo)).map(x => ({ id: s(x.id || uid(), 40), tipo: s(x.tipo, 40).trim() || 'accion', grupo: s(x.grupo, 60), nombre: s(x.nombre, 80), ticker: s(x.ticker, 30), fecha: isDate(x.fecha) ? x.fecha : null, precioEntrada: n(x.precioEntrada), precioActual: n(x.precioActual), motivo: s(x.motivo, 400) }));
  return {
    gastos: arr('gastos').filter(x => x && isDate(x.fecha) && n(x.cant) != null).map(x => ({ id: s(x.id || uid(), 40), fecha: x.fecha, desc: s(x.desc, 80), cat: CATS.includes(x.cat) ? x.cat : 'Otros', cant: n(x.cant), pago: x.pago === 'Efectivo' ? 'Efectivo' : 'Tarjeta' })),
    cartera: arr('cartera').filter(x => x && isMonth(x.mes)).map(x => ({ mes: x.mes, aportado: n(x.aportado) || 0, valor: n(x.valor) })),
    seg, secciones: ensureSecs(cleanSecs(o.secciones), seg),
    objetivos: arr('objetivos').filter(x => x && s(x.nombre) && n(x.meta) > 0).map(x => ({ id: s(x.id || uid(), 40), nombre: s(x.nombre, 60), meta: n(x.meta), ahorrado: n(x.ahorrado) || 0, fecha: isDate(x.fecha) ? x.fecha : null }))
  };
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
function carteraRows() {
  let acum = 0;
  return D.cartera.slice().sort((a, b) => (a.mes < b.mes ? -1 : 1)).map(r => {
    acum += r.aportado || 0;
    const valor = r.valor == null ? null : r.valor, gan = valor == null ? null : valor - acum;
    return { mes: r.mes, ap: r.aportado || 0, acum, valor, gan, rent: valor == null || acum <= 0 ? null : (gan / acum) * 100 };
  });
}
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

/* ---------- 5. pantallas ---------- */
const ui = { gMes: null, q: '', segTipo: 'accion', cmpA: null, cmpB: null, cRango: 'todo' };
const ROUTES = ['inicio', 'gastos', 'cartera', 'seguimiento', 'objetivos', 'ajustes'];
const NAV = [['inicio', 'Inicio', 'home'], ['gastos', 'Gastos', 'receipt'], ['cartera', 'Cartera', 'pie'], ['seguimiento', 'Seguimiento', 'trend'], ['objetivos', 'Objetivos', 'target']];
const FAB = { inicio: ['Nuevo gasto', 'addGasto'], gastos: ['Nuevo gasto', 'addGasto'], cartera: ['Apuntar mes', 'addMes'], seguimiento: ['Añadir', 'addSeg'], objetivos: ['Nuevo objetivo', 'addObj'] };
const route = () => { const r = (location.hash || '').replace(/^#\/?/, ''); return ROUTES.includes(r) ? r : 'inicio'; };

const vh = (t, sub, r) => '<div class="vh"><div><h1>' + t + '</h1>' + (sub ? '<p class="sub">' + sub + '</p>' : '') + '</div>' + (FAB[r] ? '<button class="btn" data-act="' + FAB[r][1] + '">' + icon('plus') + FAB[r][0] + '</button>' : '') + '</div>';
const deltaPill = (v, p) => v == null ? '' : '<span class="pill ' + (v > 0 ? 'good' : v < 0 ? 'bad' : 'flat') + '">' + (v > 0 ? '▲' : v < 0 ? '▼' : '') + ' ' + sgn(v) + eur(Math.abs(v)) + (p != null ? ' · ' + pct(p) : '') + '</span>';

function vInicio() {
  const has = D.gastos.length || D.cartera.length || D.seg.length || D.objetivos.length;
  const hoy = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  if (!has) {
    return { html: '<div class="page">' + vh('Bienvenido', hoy, 'inicio') +
      '<div class="card welcome"><h2>Tu dinero, en un solo sitio</h2><p>Apunta tus gastos, sigue tu cartera y marca objetivos de ahorro. Todo se guarda en este dispositivo y nadie más lo ve.</p>' +
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
function vCartera() {
  const all = carteraRows(), cr = all.filter(r => r.valor != null), lc = cr[cr.length - 1];
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
    '<button class="item plain" data-act="editMes" data-id="' + r.mes + '"><span class="t"><b>' + esc(mLabel(r.mes, true)) + '</b><small>Aportado ' + eur(r.ap) + ' · Total ' + eur(r.acum) + '</small></span><span class="r">' + (r.valor == null ? '—' : eur(r.valor)) + (r.gan == null ? '' : '<small class="' + (r.gan >= 0 ? 'dn-t' : 'up-t') + '">' + (r.gan >= 0 ? '▲ ' : '▼ ') + sgn(r.gan) + eur(Math.abs(r.gan)) + '</small>') + '</span></button>').join('') + '</div></div>' : empty('Aún no hay meses apuntados. Una vez al mes: lo que aportaste y lo que marca MyInvestor.');
  return { html: '<div class="page">' + vh('Cartera', 'Tu cartera real en MyInvestor', 'cartera') + sum + chips + per +
    '<div class="card"><div class="card-head"><h2>Evolución</h2></div><div class="legend"><span><i style="background:var(--s1)"></i>Valor de la cartera</span><span><i style="background:var(--s2)"></i>Total aportado</span></div><div class="chart" id="chCartera"></div></div>' + list + '</div>',
    after() { drawLine($('#chCartera'), rows); } };
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
    return '<button class="item plain" data-act="editSeg" data-id="' + esc(p.id) + '"><span class="t"><b>' + esc(p.nombre) + '</b><small>' + esc(p.ticker || '') + (p.precioEntrada != null ? ' · entrada ' + eur(p.precioEntrada) : '') + '</small></span><span class="r">' + (p.precioActual != null ? eur(p.precioActual) : '<small>sin precio</small>') + (r != null ? '<small class="' + (r >= 0 ? 'dn-t' : 'up-t') + '">' + (r >= 0 ? '▲ ' : '▼ ') + pct(r) + '</small>' : '') + '</span></button>';
  }).join('') + '</div>').join('') + '</div>' : empty('Aún no hay nada en «' + esc(secName(tipo)) + '». Toca + para añadir la primera posición.');
  return { html: '<div class="page">' + vh('Seguimiento', 'Paper trading: sin dinero real', 'seguimiento') + chips + head + sum + body + '</div>' };
}

function vObj() {
  const body = D.objetivos.length ? D.objetivos.map(o => {
    const p = Math.min(100, (o.ahorrado / o.meta) * 100), falta = Math.max(o.meta - o.ahorrado, 0), done = o.ahorrado >= o.meta;
    let extra = '';
    if (o.fecha && !done) { const m = monthsLeft(o.fecha); extra = m > 0 ? ' · ' + eur(falta / m, 0) + ' al mes hasta ' + esc(dLabel(o.fecha)) : ' · la fecha ya ha pasado'; }
    return '<div class="card goal"><div class="goal-top"><div><h3>' + esc(o.nombre) + '</h3><p class="meta">Meta ' + eur(o.meta, 0) + (o.fecha ? ' · para ' + esc(dLabel(o.fecha)) : '') + '</p></div>' + (done ? '<span class="pill good">✓ Conseguido</span>' : '<span class="pill flat">' + Math.round(p) + ' %</span>') + '</div>' +
      '<div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + Math.round(p) + '" aria-label="Progreso de ' + esc(o.nombre) + '"><i style="width:' + p + '%"></i></div>' +
      '<div class="goal-nums"><b class="num">' + eur(o.ahorrado) + '</b><span class="num">' + (done ? 'Meta superada' : 'Faltan ' + eur(falta) + extra) + '</span></div>' +
      '<div class="btn-row"><button class="btn sm" data-act="aportar" data-id="' + esc(o.id) + '">Aportar</button><button class="btn sm ghost" data-act="editObj" data-id="' + esc(o.id) + '">Editar</button></div></div>';
  }).join('') : empty('Aún no tienes objetivos. Toca + y crea el primero, por ejemplo el colchón de emergencia.');
  return { html: '<div class="page">' + vh('Objetivos', 'Lo que quieres conseguir', 'objetivos') + body + '</div>' };
}

function vAjustes() {
  const t = D.ajustes.tema, standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  const u = D.ajustes.ultimaCopia;
  return { html: '<div class="page"><div class="vh"><div><h1>Ajustes</h1><p class="sub">Apariencia y tus datos</p></div></div>' +
    '<div class="card set"><div class="setrow"><div><b>Apariencia</b><p>Automático sigue el modo de tu móvil.</p></div><div class="seg" role="group" aria-label="Tema">' + [['auto', 'Auto'], ['claro', 'Claro'], ['oscuro', 'Oscuro']].map(a => '<button data-act="tema" data-v="' + a[0] + '" aria-pressed="' + (t === a[0]) + '">' + a[1] + '</button>').join('') + '</div></div></div>' +
    '<div class="card set"><h2>Tus datos</h2><p class="sub" style="margin-bottom:6px">Se guardan solo en este dispositivo. Si borras los datos del navegador o cambias de móvil, se pierden: haz copias de vez en cuando.</p>' +
    '<div class="setrow"><div><b>Copia de seguridad</b><p>' + (u ? 'Última copia: ' + esc(dLabel(u)) : 'Aún no has hecho ninguna.') + '</p></div><button class="btn sm" data-act="export">Descargar</button></div>' +
    '<div class="setrow"><div><b>Restaurar o importar</b><p>Desde un archivo de copia de Centex.</p></div><button class="btn sm ghost" data-act="pickFile">Elegir archivo</button></div>' +
    '<div class="setrow"><div><b>Gastos para Excel</b><p>Un archivo CSV con todos tus gastos.</p></div><button class="btn sm ghost" data-act="exportCsv">Descargar</button></div>' +
    '<div class="setrow"><div><b>Borrar todo</b><p>Elimina todos los datos de este dispositivo.</p></div><button class="btn sm danger" data-act="wipe">Borrar…</button></div></div>' +
    '<div class="card"><h2>Tenerla como una app</h2>' + (standalone ? '<p class="sub" style="margin-bottom:0">Ya estás usando Centex como app.</p>' :
      '<p class="sub">Añádela a tu pantalla de inicio y se abrirá a pantalla completa.</p><ol class="steps"><li><b>iPhone (Safari):</b> botón compartir → «Añadir a pantalla de inicio».</li><li><b>Android (Chrome):</b> menú ⋮ → «Instalar aplicación» o «Añadir a pantalla de inicio».</li></ol>') + '</div>' +
    '<p style="text-align:center;color:var(--muted);font-size:12.5px;font-weight:600;padding:6px">Centex · versión 1.3</p></div>' };
}

const VIEWS = { inicio: vInicio, gastos: vGastos, cartera: vCartera, seguimiento: vSeg, objetivos: vObj, ajustes: vAjustes };

function render() {
  const r = route(), v = VIEWS[r]();
  document.querySelectorAll('.nav-link').forEach(a => { if (a.dataset.r === r) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  const view = $('#view'); view.innerHTML = v.html; if (v.after) v.after();
  const f = FAB[r], fab = $('#fab');
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

function sheetMes(mes) {
  const r = mes ? D.cartera.find(x => x.mes === mes) : null;
  const v = r || { mes: mk(todayISO()), aportado: '', valor: '' };
  openSheet(r ? 'Editar mes' : 'Apuntar un mes',
    '<div class="form"><p class="sub" style="margin:0">Una vez al mes: lo que aportaste y el valor que marca MyInvestor.</p>' +
    '<div class="fld"><label for="cMes">Mes</label><input id="cMes" name="mes" type="month" placeholder="2026-10" value="' + v.mes + '"' + (r ? ' readonly' : '') + '></div>' +
    '<div class="row2"><div class="fld"><label for="cAp">Aportado ese mes (€)</label><input id="cAp" name="ap" inputmode="decimal" autocomplete="off" placeholder="0" value="' + (r ? fmtIn(v.aportado) : '') + '"></div><div class="fld"><label for="cVal">Valor de la cartera (€)</label><input id="cVal" name="val" inputmode="decimal" autocomplete="off" placeholder="0,00" value="' + (r ? fmtIn(v.valor) : '') + '"></div></div>' +
    actions(r ? delBtn('mes', mes) : '', 'Guardar mes') + '</div>',
    fd => {
      const m = String(fd.get('mes') || ''), ap = num(fd.get('ap')), val = num(fd.get('val'));
      if (!isMonth(m)) return 'Pon un mes válido (por ejemplo 2026-10).';
      if (ap == null || ap < 0) return 'Pon lo aportado (puede ser 0).';
      if (val == null || val < 0) return 'Pon el valor de la cartera.';
      D.cartera = D.cartera.filter(x => x.mes !== m); D.cartera.push({ mes: m, aportado: ap, valor: val });
      save(); render(); toast('Mes guardado');
    });
}

function sheetSeg(id) {
  const p = id ? D.seg.find(x => x.id === id) : null;
  const v = p || { tipo: ui.segTipo, grupo: '', nombre: '', ticker: '', fecha: '', precioEntrada: '', precioActual: '', motivo: '' };
  const groups = [...new Set(D.seg.map(x => x.grupo))];
  openSheet(p ? 'Editar posición' : 'Añadir al seguimiento',
    '<div class="form"><div class="fld"><span class="lb">Sección</span><div class="opts" role="radiogroup" aria-label="Sección">' + D.secciones.map(x => opt('tipo', x.id, v.tipo === x.id, esc(x.nombre))).join('') + '</div></div>' +
    '<div class="fld"><label for="sNombre">Nombre</label><input id="sNombre" name="nombre" maxlength="80" autocomplete="off" value="' + esc(v.nombre) + '"></div>' +
    '<div class="row2"><div class="fld"><label for="sGrupo">Sector o tipo</label><input id="sGrupo" name="grupo" list="dlGrupos" maxlength="60" autocomplete="off" placeholder="Tecnología, Value…" value="' + esc(v.grupo) + '"><datalist id="dlGrupos">' + groups.map(g => '<option value="' + esc(g) + '">').join('') + '</datalist></div><div class="fld"><label for="sTicker">Ticker o ISIN</label><input id="sTicker" name="ticker" maxlength="30" autocomplete="off" value="' + esc(v.ticker) + '"></div></div>' +
    '<div class="row2"><div class="fld"><label for="sEnt">Precio de entrada (€)</label><input id="sEnt" name="pent" inputmode="decimal" autocomplete="off" value="' + fmtIn(v.precioEntrada) + '"></div><div class="fld"><label for="sAct">Precio actual (€)</label><input id="sAct" name="pact" inputmode="decimal" autocomplete="off" value="' + fmtIn(v.precioActual) + '"></div></div>' +
    '<div class="fld"><label for="sFecha">Fecha de entrada</label><input id="sFecha" name="fecha" type="date" value="' + esc(v.fecha || '') + '"></div>' +
    '<div class="fld"><label for="sMotivo">Motivo corto</label><input id="sMotivo" name="motivo" maxlength="400" autocomplete="off" value="' + esc(v.motivo) + '"></div>' +
    actions(p ? delBtn('seg', id) : '', p ? 'Guardar' : 'Añadir') + '</div>',
    fd => {
      const nombre = String(fd.get('nombre') || '').trim(), grupo = String(fd.get('grupo') || '').trim();
      if (!nombre || !grupo) return 'Pon al menos el nombre y el sector o tipo.';
      const f = fd.get('fecha');
      const o = { id: p ? p.id : uid(), tipo: D.secciones.some(x => x.id === fd.get('tipo')) ? fd.get('tipo') : D.secciones[0].id, grupo: grupo.slice(0, 60), nombre: nombre.slice(0, 80), ticker: String(fd.get('ticker') || '').trim().slice(0, 30), fecha: isDate(f) ? f : null, precioEntrada: num(fd.get('pent')), precioActual: num(fd.get('pact')), motivo: String(fd.get('motivo') || '').trim().slice(0, 400) };
      if (p) D.seg[D.seg.indexOf(p)] = o; else D.seg.push(o);
      ui.segTipo = o.tipo; save(); render(); toast(p ? 'Posición actualizada' : 'Añadido al seguimiento');
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
      if (fd.get('modo') === 'reemplazar') { D.gastos = c.gastos; D.cartera = c.cartera; D.seg = c.seg; D.secciones = c.secciones; D.objetivos = c.objetivos; }
      else {
        const has = (arr, id) => arr.some(x => x.id === id);
        c.gastos.forEach(x => { if (!has(D.gastos, x.id)) D.gastos.push(x); });
        c.secciones.forEach(x => { if (!D.secciones.some(y => y.id === x.id)) D.secciones.push(x); });
        c.seg.forEach(x => { if (!has(D.seg, x.id)) D.seg.push(x); });
        ensureSecs(D.secciones, D.seg);
        c.objetivos.forEach(x => { if (!has(D.objetivos, x.id)) D.objetivos.push(x); });
        c.cartera.forEach(x => { D.cartera = D.cartera.filter(y => y.mes !== x.mes); D.cartera.push(x); });
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
  else if (kind === 'mes') D.cartera = D.cartera.filter(x => x.mes !== id);
  else if (kind === 'seg') D.seg = D.seg.filter(x => x.id !== id);
  else if (kind === 'obj') D.objetivos = D.objetivos.filter(x => x.id !== id);
  else if (kind === 'sec') { if (D.secciones.length <= 1) return; D.seg = D.seg.filter(x => x.tipo !== id); D.secciones = D.secciones.filter(x => x.id !== id); }
  else if (kind === 'all') { const a = D.ajustes; D = blank(); D.ajustes = a; }
  save(); closeSheet(); render(); toast(kind === 'all' ? 'Todo borrado' : kind === 'sec' ? 'Sección borrada' : 'Borrado');
}
const ACT = {
  fab() { const f = FAB[route()]; if (f) ACT[f[1]](); },
  addGasto() { sheetGasto(); }, addMes() { sheetMes(); }, addSeg() { sheetSeg(); }, addObj() { sheetObj(); },
  editGasto(el) { sheetGasto(el.dataset.id); }, editMes(el) { sheetMes(el.dataset.id); }, editSeg(el) { sheetSeg(el.dataset.id); },
  editObj(el) { sheetObj(el.dataset.id); }, aportar(el) { sheetAportar(el.dataset.id); }, precios() { sheetPrecios(); },
  goSettings() { location.hash = '#/ajustes'; }, closeSheet() { closeSheet(); }, wipe() { sheetWipe(); },
  gMes(el) { ui.gMes = el.dataset.m; render(); },
  cRango(el) { ui.cRango = el.dataset.r; render(); },
  segTipo(el) { ui.segTipo = el.dataset.t; render(); },
  addSec() { sheetSecs(); setTimeout(() => { const i = $('#scNueva'); if (i) i.focus(); }, 60); }, editSecs() { sheetSecs(); },
  tema(el) { D.ajustes.tema = el.dataset.v; save(); applyTheme(); render(); },
  pickFile() { $('#fileIn').value = ''; $('#fileIn').click(); },
  export() {
    download('centex-copia-' + todayISO() + '.json', JSON.stringify({ app: 'centex', version: 1, exportado: new Date().toISOString(), gastos: D.gastos, cartera: D.cartera, seg: D.seg, secciones: D.secciones, objetivos: D.objetivos }, null, 2), 'application/json');
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
});
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
if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) navigator.serviceWorker.register('sw.js').catch(() => {});
