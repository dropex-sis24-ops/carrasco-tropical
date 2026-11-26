import {
  PARADAS, RUTAS, TIPOS, viajesDelDia, rutaDe, aHora, bs, pad, puntoEn, trazo, hash, PASAJES_DEMO,
} from './data.js';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const nombre = (k) => PARADAS[k]?.nombre ?? k;
const ahoraMin = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60; };
const params = new URLSearchParams(location.search);
const HOY = viajesDelDia(new Date());
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

/* ---------- menú lateral móvil ---------- */
const lateral = $('#lateral');
const abrir = $('[data-menu-abrir]');
abrir?.addEventListener('click', () => { lateral.setAttribute('data-abierto', ''); abrir.setAttribute('aria-expanded', 'true'); $('a', lateral)?.focus(); });
$('[data-menu-cerrar]')?.addEventListener('click', cerrarMenu);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && lateral?.hasAttribute('data-abierto')) cerrarMenu(); });
function cerrarMenu() { lateral.removeAttribute('data-abierto'); abrir?.setAttribute('aria-expanded', 'false'); abrir?.focus(); }

/* ---------- líneas de cartel ajustadas al ancho ---------- */
function ajustar() {
  for (const el of $$('.fit')) {
    el.style.fontSize = '';
    const ancho = el.parentElement.clientWidth;
    const actual = parseFloat(getComputedStyle(el).fontSize);
    el.style.display = 'inline-block';
    const w = el.scrollWidth;
    el.style.display = '';
    if (w > 0 && ancho > 0) el.style.fontSize = `${(actual * ancho) / w}px`;
  }
}
(document.fonts?.ready ?? Promise.resolve()).then(ajustar);
let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(ajustar, 150); });

/* ---------- reloj ---------- */
function reloj() { const d = new Date(); for (const el of $$('[data-reloj]')) el.textContent = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`; }
reloj(); setInterval(reloj, 1000);

/* ---------- buscador ---------- */
const hoyISO = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
for (const f of $$('[data-buscador]')) {
  const fecha = $('[data-hoy]', f);
  fecha.value = params.get('fecha') || hoyISO();
  fecha.min = hoyISO();
  if (params.get('desde')) f.desde.value = params.get('desde');
  if (params.get('hasta')) f.hasta.value = params.get('hasta');
  $('[data-cambiar]', f).addEventListener('click', () => { const a = f.desde.value; f.desde.value = f.hasta.value; f.hasta.value = a; });
}

/* ---------- viajes entre dos paradas cualesquiera ---------- */
function tramos(desde, hasta, lista = HOY) {
  const res = [];
  for (const ruta of RUTAS) {
    const i = ruta.paradas.indexOf(desde); const j = ruta.paradas.indexOf(hasta);
    if (i < 0 || j < 0 || i === j) continue;
    const sentido = i < j ? 'ida' : 'vuelta';
    const n = ruta.paradas.length - 1;
    const fr = (k) => (sentido === 'ida' ? k / n : (n - k) / n);
    const parcial = Math.abs(j - i) / n;
    for (const v of lista) {
      if (v.ruta !== ruta.id || v.sentido !== sentido) continue;
      res.push({
        ...v, desde, hasta,
        sale: v.sale + ruta.minutos * fr(i), llega: v.sale + ruta.minutos * fr(j),
        precio: (t) => (parcial === 1 ? ruta.tarifa[t] : Math.max(3, Math.round(ruta.tarifa[t] * parcial))),
      });
    }
  }
  return res.sort((a, b) => a.sale - b.sale);
}

/* ---------- tablero de salidas (inicio) ---------- */
const tablero = $('[data-tablero]');
if (tablero) {
  const th = $('[data-col-en]'); if (th) th.textContent = 'Sale en';
  const pintar = () => {
    const t = ahoraMin();
    const prox = HOY.filter((v) => v.sale >= t - 2).slice(0, 8);
    const lista = prox.length ? prox : HOY.slice(0, 8);
    tablero.innerHTML = lista.map((v) => {
      const r = rutaDe(v.ruta);
      const falta = v.sale - t;
      let est = 'En parada'; let k = 'parada';
      if (!prox.length) { est = 'Mañana'; k = 'manana'; } else if (falta <= 0) { est = 'Salió'; k = 'salio'; } else if (falta <= 10) { est = 'Abordando'; k = 'abordando'; }
      const mins = Math.max(0, Math.ceil(falta));
      const en = !prox.length ? '' : falta <= 0 ? 'ya salió' : mins >= 60 ? `en ${Math.floor(mins / 60)} h ${pad(mins % 60)}` : `en ${mins} min`;
      return `<tr><td class="t-int">${v.interno}</td><td class="t-ruta">${nombre(v.desde)} a ${nombre(v.hasta)}</td><td class="t-hora num">${aHora(v.sale)}</td><td class="t-en num">${en}</td><td class="t-veh">${r.vehiculo}</td><td class="t-precio num">${bs(r.tarifa.general)}</td><td><span class="t-est" data-est="${k}">${est}</span></td></tr>`;
    }).join('');
  };
  pintar(); setInterval(pintar, 1000);
}

/* ---------- flota simulada en vivo ---------- */
// Posición de cada viaje en curso según la hora: lo mismo que mostraría el GPS del conductor.
function enRuta(t = ahoraMin()) {
  return HOY.filter((v) => v.sale <= t && v.llega >= t).map((v) => {
    const ruta = rutaDe(v.ruta);
    const avance = (t - v.sale) / ruta.minutos;
    const h = hash(v.id + Math.floor(t * 6));
    const detenido = h % 23 === 0;
    const vel = detenido ? 0 : 38 + (h % 45);
    return { ...v, ruta, avance, pos: puntoEn(ruta, avance, v.sentido), vel, detenido };
  });
}

function crearMapa(el, { interactivo = true } = {}) {
  if (!window.L) { el.innerHTML = '<p class="pendiente" style="padding:16px">El mapa necesita conexión a internet.</p>'; return null; }
  const m = L.map(el, { zoomControl: interactivo, scrollWheelZoom: false, attributionControl: true });
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '© OpenStreetMap' }).addTo(m);
  const todas = Object.values(PARADAS).map((p) => p.pos);
  m.fitBounds(todas, { padding: [24, 24] });
  return m;
}
const iconoBus = (txt, cls = '', punto = false) => (punto
  ? L.divIcon({ className: '', html: `<div class="bus-punto ${cls}"></div>`, iconSize: [12, 12], iconAnchor: [6, 6] })
  : L.divIcon({ className: '', html: `<div class="bus-marca ${cls}">${txt}</div>`, iconSize: [34, 24], iconAnchor: [17, 12] }));
const iconoParada = (base) => L.divIcon({ className: '', html: `<div class="parada-marca${base ? ' parada-marca--base' : ''}"></div>`, iconSize: base ? [16, 16] : [12, 12], iconAnchor: base ? [8, 8] : [6, 6] });

function dibujarRutas(m, filtro = 'todas') {
  const capa = L.layerGroup().addTo(m);
  for (const r of RUTAS) {
    if (filtro !== 'todas' && r.id !== filtro) continue;
    L.polyline(trazo(r), { color: getComputedStyle(document.documentElement).getPropertyValue('--color-ink').trim() || '#222', weight: 3, opacity: 0.75 }).addTo(capa);
  }
  for (const [k, p] of Object.entries(PARADAS)) {
    L.marker(p.pos, { icon: iconoParada(k === 'ivirgarzama'), keyboard: false }).bindTooltip(p.nombre).addTo(capa);
  }
  return capa;
}

function mapaFlota(el, { lista } = {}) {
  const m = crearMapa(el);
  if (!m) return;
  let filtro = 'todas'; let sel = null;
  let capaRutas = dibujarRutas(m);
  const marcas = new Map();
  const pintar = () => {
    const buses = enRuta().filter((b) => filtro === 'todas' || b.ruta.id === filtro);
    for (const n of $$('[data-en-ruta]')) n.textContent = buses.length;
    const vivos = new Set();
    for (const b of buses) {
      vivos.add(b.id);
      const cls = b.id === sel ? 'bus-marca--sel' : (b.detenido ? 'bus-marca--rojo' : '');
      const punto = m.getZoom() < 10 && b.id !== sel;
      let mk = marcas.get(b.id);
      if (!mk) { mk = L.marker(b.pos, { icon: iconoBus(b.interno, cls, punto), keyboard: false }).addTo(m); marcas.set(b.id, mk); }
      else { mk.setLatLng(b.pos); mk.setIcon(iconoBus(b.interno, cls, punto)); }
      mk.bindTooltip(`Interno ${b.interno}, ${b.placa}<br>${nombre(b.desde)} a ${nombre(b.hasta)}<br>${b.detenido ? 'Detenido' : `${b.vel} km/h`}`);
    }
    for (const [id, mk] of marcas) if (!vivos.has(id)) { mk.remove(); marcas.delete(id); }
    if (lista) {
      lista.innerHTML = buses.length ? buses.map((b) => `<li><button type="button" data-bus="${b.id}" aria-pressed="${b.id === sel}">
        <span class="flota__int">${b.interno}</span>
        <span><span class="flota__ruta">${nombre(b.desde)} a ${nombre(b.hasta)}</span><span class="flota__meta num">${b.placa}, salió ${aHora(b.sale)}</span></span>
        <span class="flota__vel num"${b.detenido ? ' data-alerta' : ''}>${b.detenido ? 'Detenido' : `${b.vel} km/h`}</span></button></li>`).join('')
        : '<li class="flota__meta" style="padding:12px 0">No hay vehículos en ruta a esta hora.</li>';
    }
  };
  lista?.addEventListener('click', (e) => {
    const b = e.target.closest('[data-bus]'); if (!b) return;
    sel = b.dataset.bus; const mk = marcas.get(sel);
    if (mk) m.setView(mk.getLatLng(), 11);
    pintar();
  });
  for (const c of $$('[data-ruta-filtro]')) {
    c.addEventListener('click', () => {
      filtro = c.dataset.rutaFiltro;
      $$('[data-ruta-filtro]').forEach((x) => x.setAttribute('aria-pressed', String(x === c)));
      capaRutas.remove(); capaRutas = dibujarRutas(m, filtro);
      const r = rutaDe(filtro);
      m.fitBounds(r ? trazo(r) : Object.values(PARADAS).map((p) => p.pos), { padding: [24, 24] });
      pintar();
    });
  }
  m.on('zoomend', pintar);
  pintar(); setInterval(pintar, 5000);
}

const mPortada = $('[data-mapa="flota"]'); if (mPortada) mapaFlota(mPortada);
const mGrande = $('[data-mapa="flota-completa"]'); if (mGrande) mapaFlota(mGrande, { lista: $('[data-flota]') });

/* ---------- viajes de hoy ---------- */
const listaV = $('[data-lista]');
if (listaV) {
  const desde0 = params.get('desde') || 'ivirgarzama';
  const hasta0 = params.get('hasta') || 'cochabamba';
  const fechaSel = params.get('fecha') || hoyISO();
  const esHoy = fechaSel === hoyISO();
  const [fy, fm, fd] = fechaSel.split('-').map(Number);
  const lista = esHoy ? HOY : viajesDelDia(new Date(fy, fm - 1, fd));
  let sentido = 'ida'; let visibles = 12; let texto = '';
  const etFecha = esHoy ? 'hoy' : new Date(fy, fm - 1, fd).toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric', month: 'long' });
  $('[data-et-ida]').textContent = `${nombre(desde0)} a ${nombre(hasta0)}`;
  $('[data-et-vuelta]').textContent = `${nombre(hasta0)} a ${nombre(desde0)}`;
  let actuales = [];

  const icoBus = '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4.5" y="4" width="15" height="13" rx="2.5"/><path d="M4.5 11h15M8 17v2.5M16 17v2.5"/><circle cx="8" cy="14" r=".8"/><circle cx="16" cy="14" r=".8"/></svg>';
  const tarjeta = (v) => {
    const dur = Math.round(v.llega - v.sale); const h = Math.floor(dur / 60); const mi = dur % 60;
    const pasado = esHoy && v.sale < ahoraMin();
    return `<article class="viaje"${pasado ? ' data-pasado' : ''}>
      <div class="viaje__veh"><span class="viaje__avatar">${icoBus}</span><p class="viaje__int">Interno <strong>${v.interno}</strong></p><p class="viaje__placa num">${v.placa}</p><p class="viaje__tipo">${rutaDe(v.ruta).vehiculo}</p></div>
      <div class="viaje__trayecto">
        <div class="viaje__punto"><p class="viaje__hora num">${aHora(v.sale)}</p><p class="viaje__lugar">${nombre(v.desde)}</p></div>
        <div class="viaje__linea" aria-hidden="true"><span>${h ? `${h} h ` : ''}${mi ? `${mi} min` : ''}</span></div>
        <div class="viaje__punto viaje__punto--fin"><p class="viaje__hora num">${aHora(v.llega)}</p><p class="viaje__lugar">${nombre(v.hasta)}</p></div>
      </div>
      <div class="viaje__compra">
        <p class="viaje__precio-et">Pasaje general</p>
        <p class="viaje__precio num">${bs(v.precio('general'))}</p>
        <p class="viaje__libres">${pasado ? 'Ya salió' : `${v.libres} asientos libres`}</p>
        <button class="btn" type="button" data-elegir="${v.id}"${pasado ? ' disabled' : ''}>Elegir asiento</button>
      </div></article>`;
  };

  const pintar = () => {
    const [a, b] = sentido === 'ida' ? [desde0, hasta0] : [hasta0, desde0];
    let todos = tramos(a, b, lista);
    if (texto) todos = todos.filter((v) => String(v.interno) === texto || v.placa.toLowerCase().includes(texto.toLowerCase()));
    // en el día de hoy, las salidas ya pasadas van al final
    if (esHoy) { const t = ahoraMin(); todos = [...todos.filter((v) => v.sale >= t), ...todos.filter((v) => v.sale < t)]; }
    actuales = todos;
    $('[data-res-titulo]').textContent = `${todos.length} ${todos.length === 1 ? 'viaje disponible' : 'viajes disponibles'}`;
    $('[data-res-sub]').textContent = `${nombre(a)} a ${nombre(b)}, ${etFecha}`;
    listaV.innerHTML = todos.slice(0, visibles).map(tarjeta).join('');
    $('[data-vacio]').hidden = todos.length > 0;
    $('[data-mas]').hidden = todos.length <= visibles;
  };
  pintar();

  $$('[data-sentido]').forEach((b) => b.addEventListener('click', () => {
    sentido = b.dataset.sentido; visibles = 12;
    $$('[data-sentido]').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
    pintar();
  }));
  $('[data-mas]').addEventListener('click', () => { visibles += 12; pintar(); });
  $('[data-filtro]').addEventListener('input', (e) => { texto = e.target.value.trim(); visibles = 12; pintar(); });

  // diálogo de compra
  const dlg = $('[data-dialogo]'); const cuerpo = $('[data-dlg-cuerpo]');
  listaV.addEventListener('click', (e) => {
    const b = e.target.closest('[data-elegir]'); if (!b) return;
    const v = actuales.find((x) => x.id === b.dataset.elegir); if (!v) return;
    const plano = planoAsientos(v);
    let asiento = null;
    const tipoSel = () => $('input[name="tipo"]:checked', cuerpo).value;
    cuerpo.innerHTML = `
      <p><strong>${nombre(v.desde)} a ${nombre(v.hasta)}</strong>, sale ${aHora(v.sale)}. Interno ${v.interno}, placa ${v.placa}.</p>
      <div class="compra">
        <fieldset class="asientos">
          <legend>Elige tu asiento</legend>
          <ul class="asientos__ley" aria-hidden="true"><li><span class="asiento-mini"></span>Libre</li><li><span class="asiento-mini asiento-mini--ocupado"></span>Ocupado</li><li><span class="asiento-mini asiento-mini--tuyo"></span>Tu asiento</li></ul>
          <div class="bus-plano bus-plano--${plano.cols === 4 ? 'bus' : 'mini'}">
            <p class="bus-plano__frente">Conductor <span>Puerta</span></p>
            <div class="bus-plano__filas">${plano.filas.map((fila) => `<div class="bus-plano__fila">${fila.map((n) => n === null
              ? '<span class="bus-plano__pasillo" aria-hidden="true"></span>'
              : `<button type="button" class="asiento" data-asiento="${n}" aria-pressed="false"${plano.ocupados.has(n) ? ' disabled aria-label="Asiento ' + n + ', ocupado"' : ' aria-label="Asiento ' + n + ', libre"'}>${n}</button>`).join('')}</div>`).join('')}</div>
          </div>
        </fieldset>
        <div class="compra__lado">
          <fieldset class="compra__tipo"><legend>Tipo de pasajero</legend>
          <div class="tipos">${TIPOS.map((t, i) => `<label><input type="radio" name="tipo" value="${t.id}"${i ? '' : ' checked'}><span>${t.nombre}</span><small class="num">${bs(v.precio(t.id))}</small></label>`).join('')}</div></fieldset>
          <dl class="particulares compra__resumen">
            <div><dt>Asiento</dt><dd data-asiento-sel>Sin elegir</dd></div>
            <div><dt>Libres</dt><dd class="num">${plano.total - plano.ocupados.size} de ${plano.total}</dd></div>
          </dl>
          <div class="dialogo__total"><span>Total</span><strong class="num" data-total>${bs(v.precio('general'))}</strong></div>
          <button class="btn" type="button" data-emitir disabled>Elige un asiento</button>
          <p class="pasaje__nota">Al lanzar el sistema, aquí aparece el QR del banco del sindicato por el monto exacto.</p>
        </div>
      </div>`;
    const emitir = $('[data-emitir]', cuerpo);
    cuerpo.addEventListener('change', () => { $('[data-total]', cuerpo).textContent = bs(v.precio(tipoSel())); });
    $('.bus-plano', cuerpo).addEventListener('click', (ev) => {
      const s = ev.target.closest('[data-asiento]'); if (!s || s.disabled) return;
      $$('[data-asiento]', cuerpo).forEach((x) => x.setAttribute('aria-pressed', String(x === s)));
      asiento = Number(s.dataset.asiento);
      $('[data-asiento-sel]', cuerpo).textContent = `N° ${asiento}${plano.ventana.has(asiento) ? ', ventana' : ', pasillo'}`;
      emitir.disabled = false; emitir.textContent = 'Generar pasaje de muestra';
    });
    emitir.addEventListener('click', () => {
      if (!asiento) return;
      const d = new Date();
      const cod = `CT-${pad(d.getDate())}${pad(d.getMonth() + 1)}-${String(hash(v.id + Date.now()) % 10000).padStart(4, '0')}`;
      const t = tipoSel();
      const tipo = TIPOS.find((x) => x.id === t).nombre;
      cuerpo.innerHTML = `<div class="pasaje">
        <div class="pasaje__datos"><strong>${nombre(v.desde)} a ${nombre(v.hasta)}</strong>
          <span>${aHora(v.sale)}, ${d.toLocaleDateString('es-BO')}</span>
          <span class="pasaje__asiento">Asiento <b class="num">${asiento}</b></span>
          <span>${tipo}, ${bs(v.precio(t))}</span>
          <span>Interno ${v.interno}, ${v.placa}</span><span class="num">N° ${cod}</span></div>
        ${qrMuestra(cod)}</div>
        <p class="pasaje__nota">Pasaje de muestra, no válido para viajar.</p>
        <a class="btn" href="seguimiento.html?codigo=${encodeURIComponent(cod)}">Seguir este bus</a>`;
    }, { once: true });
    dlg.showModal();
  });
}

// Plano del vehículo: bus 40 asientos (2 + pasillo + 2), minibús 15 (2 + pasillo + 1).
// Los ocupados salen del número de asientos libres del viaje, siempre los mismos para ese viaje.
function planoAsientos(v) {
  const esBus = rutaDe(v.ruta).vehiculo === 'Bus';
  const cols = esBus ? 4 : 3; const total = esBus ? 40 : 15;
  const filas = []; const ventana = new Set(); let n = 1;
  for (let f = 0; f < total / cols; f++) {
    const fila = [];
    for (let c = 0; c < cols; c++) {
      if (c === 2) fila.push(null);
      if (c === 0 || c === cols - 1) ventana.add(n);
      fila.push(n++);
    }
    filas.push(fila);
  }
  const libres = Math.min(v.libres, total);
  const orden = Array.from({ length: total }, (_, i) => i + 1).sort((a, b) => hash(v.id + a) - hash(v.id + b));
  const ocupados = new Set(orden.slice(0, total - libres));
  return { cols, total, filas, ventana, ocupados };
}

function qrMuestra(txt) {
  let s = hash(txt); const n = 21; let r = '';
  const fijo = (x, y) => (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    let on;
    if (fijo(x, y)) { const cx = x > 13 ? x - 14 : x; const cy = y > 13 ? y - 14 : y; on = cx === 0 || cx === 6 || cy === 0 || cy === 6 || (cx > 1 && cx < 5 && cy > 1 && cy < 5); }
    else { s = (s * 1664525 + 1013904223) >>> 0; on = s % 2 === 0; }
    if (on) r += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
  }
  return `<svg class="pasaje__qr" viewBox="0 0 21 21" shape-rendering="crispEdges" role="img" aria-label="Código QR de muestra">${r}</svg>`;
}

/* ---------- sigue tu bus ---------- */
const fSeg = $('[data-seguir]');
if (fSeg) {
  let mapa = null; let capa = null; let timer = null;
  const formato = /^CT-\d{4}-\d{4}$/;
  const seguir = (codigo) => {
    codigo = codigo.trim().toUpperCase();
    $('.consulta__error', fSeg)?.remove();
    if (!formato.test(codigo)) {
      fSeg.insertAdjacentHTML('beforeend', '<p class="consulta__error" role="alert">El código tiene la forma CT-0000-0000. Revisa tu pasaje.</p>');
      return;
    }
    history.replaceState(null, '', `?codigo=${encodeURIComponent(codigo)}`);
    fSeg.codigo.value = codigo;
    const res = $('[data-seguir-res]'); res.hidden = false;
    if (!mapa) mapa = crearMapa($('[data-mapa="seguir"]'));
    const elegir = () => {
      const buses = enRuta();
      if (buses.length) return buses[hash(codigo) % buses.length];
      const t = ahoraMin(); const prox = HOY.find((v) => v.sale > t) || HOY[0];
      return { ...prox, ruta: rutaDe(prox.ruta), avance: 0, pos: puntoEn(rutaDe(prox.ruta), 0, prox.sentido), vel: 0, detenido: true, espera: true };
    };
    const id = elegir().id;
    const pintar = () => {
      const b = enRuta().find((x) => x.id === id) || elegir();
      const t = ahoraMin();
      const falta = Math.max(0, Math.round(b.llega - t));
      $('[data-seguir-datos]').innerHTML = `
        <div><p class="eta-et">${b.espera ? 'Sale a las' : 'Llega a ' + esc(nombre(b.hasta)) + ' en'}</p>
        <p class="eta num">${b.espera ? aHora(b.sale) : falta >= 60 ? `${Math.floor(falta / 60)} h ${falta % 60} min` : `${falta} min`}</p></div>
        <dl class="particulares">
          <div><dt>Pasaje</dt><dd class="num">${esc(codigo)}</dd></div>
          <div><dt>Viaje</dt><dd>${nombre(b.desde)} a ${nombre(b.hasta)}, salió ${aHora(b.sale)}</dd></div>
          <div><dt>Vehículo</dt><dd>Interno ${b.interno}, placa ${b.placa}</dd></div>
          <div><dt>Ahora</dt><dd>${b.espera ? 'En parada' : b.detenido ? 'Detenido' : `${b.vel} km/h`}, actualizado ${aHora(t)}</dd></div>
        </dl>
        <button class="btn btn--marco" type="button" data-compartir>Compartir enlace</button>`;
      $('[data-compartir]').addEventListener('click', async (e) => {
        const url = location.href;
        try { if (navigator.share) await navigator.share({ title: 'Sigue mi bus', url }); else { await navigator.clipboard.writeText(url); e.target.textContent = 'Enlace copiado'; } } catch { /* cancelado */ }
      });
      if (!mapa) return;
      capa?.remove(); capa = L.layerGroup().addTo(mapa);
      const ink = getComputedStyle(document.documentElement).getPropertyValue('--color-ink').trim();
      const red = getComputedStyle(document.documentElement).getPropertyValue('--color-accent').trim();
      const pasos = 40; const hecho = []; const resto = [];
      for (let i = 0; i <= pasos; i++) { const a = i / pasos; (a <= b.avance ? hecho : resto).push(puntoEn(b.ruta, a, b.sentido)); }
      hecho.push(b.pos); resto.unshift(b.pos);
      L.polyline(resto, { color: ink, weight: 3, dashArray: '6 6' }).addTo(capa);
      if (hecho.length > 1) L.polyline(hecho, { color: red, weight: 5 }).addTo(capa);
      for (const k of b.ruta.paradas) L.marker(PARADAS[k].pos, { icon: iconoParada(k === b.desde), keyboard: false }).bindTooltip(PARADAS[k].nombre).addTo(capa);
      L.marker(b.pos, { icon: iconoBus(b.interno, 'bus-marca--sel'), keyboard: false }).addTo(capa);
      if (!pintar.centrado) { mapa.fitBounds(trazo(b.ruta), { padding: [24, 24] }); pintar.centrado = true; }
    };
    pintar.centrado = false;
    clearInterval(timer); pintar(); timer = setInterval(pintar, 5000);
    setTimeout(() => mapa?.invalidateSize(), 50);
  };
  fSeg.addEventListener('submit', (e) => { e.preventDefault(); seguir(fSeg.codigo.value); });
  $$('[data-demo]').forEach((b) => b.addEventListener('click', () => seguir(b.dataset.demo)));
  if (params.get('codigo')) seguir(params.get('codigo'));
}

/* ---------- verificar pasaje ---------- */
const fVer = $('[data-verificar]');
if (fVer) {
  const out = $('[data-verif-res]');
  const vacio = () => { out.innerHTML = '<div class="veredicto veredicto--vacio"><p>Escribe un código o escanea el QR del pasaje para ver si es auténtico.</p></div>'; };
  const verificar = (codigo) => {
    codigo = codigo.trim().toUpperCase();
    if (!codigo) return vacio();
    history.replaceState(null, '', `?codigo=${encodeURIComponent(codigo)}`);
    fVer.codigo.value = codigo;
    const p = PASAJES_DEMO[codigo];
    const estado = p?.estado || 'invalido';
    const palabra = { valido: 'Válido', usado: 'Ya utilizado', anulado: 'Anulado', invalido: 'Inválido' }[estado];
    let filas = '';
    if (estado === 'valido') filas = `<div><dt>Tramo</dt><dd>Ivirgarzama a Cochabamba</dd></div><div><dt>Fecha</dt><dd>${new Date().toLocaleDateString('es-BO')}, 13:30</dd></div><div><dt>Monto</dt><dd>${bs(35)}, pago QR</dd></div><div><dt>Emitido por</dt><dd>Interno 12</dd></div>`;
    if (estado === 'usado') filas = `<div><dt>Primer uso</dt><dd>${p.primerUso}, ${p.lugar}</dd></div><div><dt>Tramo</dt><dd>Ivirgarzama a Villa Tunari</dd></div>`;
    if (estado === 'anulado') filas = `<div><dt>Motivo</dt><dd>${p.motivo}</dd></div>`;
    if (estado === 'invalido') filas = '<div><dt>Resultado</dt><dd>Este código no corresponde a ningún pasaje emitido por el sindicato. Puede ser falsificado.</dd></div>';
    out.innerHTML = `<div class="veredicto veredicto--${estado}"><p class="veredicto__palabra">${palabra}</p><p class="num">${esc(codigo)}</p><dl class="particulares">${filas}</dl></div>`;
    ajustar();
  };
  fVer.addEventListener('submit', (e) => { e.preventDefault(); verificar(fVer.codigo.value); });
  $$('[data-demo]').forEach((b) => b.addEventListener('click', () => verificar(b.dataset.demo)));
  if (params.get('codigo')) verificar(params.get('codigo')); else vacio();
}
