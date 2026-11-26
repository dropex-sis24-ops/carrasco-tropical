// Genera las páginas HTML del sitio con el menú, la barra y el pie compartidos.
// Uso: node build.mjs   (vuelve a escribir los .html de la raíz)
import { readFileSync, writeFileSync } from 'node:fs';
import {
  SINDICATO, PARADAS, RUTAS, TIPOS, viajesDelDia, rutaDe, aHora, bs, PASAJES_DEMO,
} from './js/data.js';

const VERSION = Date.now().toString(36);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const CREDITOS = JSON.parse(readFileSync(new URL('./img/fotos/creditos.json', import.meta.url), 'utf8'));

// ---------- fotos del trópico (img/fotos, créditos en creditos.json) ----------
const FOTO = {
  portada: { slug: 'portada-carrasco', alt: 'Montañas verdes con neblina en el Parque Nacional Carrasco', lugar: 'Parque Nacional Carrasco' },
  ivirgarzama: { slug: 'ivirgarzama-satelite', alt: 'Vista satelital de Ivirgarzama, sus caminos y los ríos del trópico', lugar: 'Ivirgarzama desde el satélite' },
  tunariVista: { slug: 'villa-tunari-vista', alt: 'Villa Tunari con el río y la selva al fondo', lugar: 'Villa Tunari' },
  tunariRio: { slug: 'villa-tunari-rio', alt: 'Río ancho con selva y montañas entre nubes cerca de Villa Tunari', lugar: 'Río en Villa Tunari' },
  espiritu: { slug: 'rio-espiritu-santo', alt: 'El río Espíritu Santo visto desde el puente en Villa Tunari', lugar: 'Río Espíritu Santo' },
  chapare: { slug: 'rio-chapare', alt: 'Río Chapare con la selva en la orilla', lugar: 'Río Chapare' },
  cbba: { slug: 'cochabamba-cristo', alt: 'El Cristo de la Concordia en Cochabamba bajo un cielo azul', lugar: 'Cochabamba' },
  bulo: { slug: 'bulo-bulo', alt: 'Vista aérea de Bulo Bulo y la carretera al oriente', lugar: 'Bulo Bulo' },
  rios: { slug: 'confluencia-rios', alt: 'Ríos Chimoré, Ichilo y Mamoré vistos desde el espacio', lugar: 'Ríos Chimoré, Ichilo y Mamoré' },
};
const FOTO_RUTA = { cbba: FOTO.cbba, tunari: FOTO.tunariVista, pvillarroel: FOTO.rios, bulobulo: FOTO.bulo };
const img = (f, { cls = '', sizes = '100vw', carga = 'lazy', pos = '' } = {}) => {
  const c = CREDITOS[f.slug];
  return `<img${cls ? ` class="${cls}"` : ''} src="img/fotos/${f.slug}.jpg" alt="${esc(f.alt)}" width="${c?.ancho || 1400}" height="${c?.alto || 900}" sizes="${sizes}" loading="${carga}"${pos ? ` style="object-position: ${pos}"` : ''}>`;
};

// ---------- iconos (trazo, currentColor) ----------
const ico = {
  buscar: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
  inicio: '<path d="M4 11l8-6.5 8 6.5"/><path d="M6 9.5V20h12V9.5"/>',
  reloj: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  mapa: '<path d="M9 4.5L3.5 6.5v13L9 17.5l6 2 5.5-2v-13L15 6.5z"/><path d="M9 4.5v13M15 6.5v13"/>',
  pin: '<path d="M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0113 0c0 4.8-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
  qr: '<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4z"/><path d="M14 14h2.5v2.5H14zM17.5 17.5H20V20h-2.5zM14 19h2M19 14v2"/>',
  tarifa: '<path d="M4 7h16v10H4z"/><circle cx="12" cy="12" r="2.4"/><path d="M7 10v4M17 10v4"/>',
  ayuda: '<circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.5a2.5 2.5 0 114 2c-.9.6-1.6 1.1-1.6 2.3"/><path d="M12 16.8v.2"/>',
  chat: '<path d="M4.5 19.5l1.2-3.6A7.5 7.5 0 1112 19.5a7.6 7.6 0 01-3.7-1z"/>',
  usuario: '<circle cx="12" cy="8.5" r="3.5"/><path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  cerrar: '<path d="M6 6l12 12M18 6L6 18"/>',
  cambiar: '<path d="M8 4v15M8 19l-3-3M8 19l3-3M16 20V5M16 5l-3 3M16 5l3 3"/>',
  escudo: '<path d="M12 3.5l7 2.8v5.2c0 4.3-3 7.6-7 9-4-1.4-7-4.7-7-9V6.3z"/><path d="M9 12l2 2 4-4"/>',
  senal: '<path d="M5 19a10 10 0 010-14M19 5a10 10 0 010 14M8.5 15.5a5 5 0 010-7M15.5 8.5a5 5 0 010 7"/><circle cx="12" cy="12" r="1.3"/>',
  ticket: '<path d="M4 8a2 2 0 002-2h12a2 2 0 002 2v2a2 2 0 000 4v2a2 2 0 00-2 2H6a2 2 0 00-2-2v-2a2 2 0 000-4z"/><path d="M10 6v12" stroke-dasharray="2 2"/>',
  bus: '<rect x="4.5" y="4" width="15" height="13" rx="2.5"/><path d="M4.5 11h15M8 17v2.5M16 17v2.5"/><circle cx="8" cy="14" r=".8"/><circle cx="16" cy="14" r=".8"/>',
  asiento: '<path d="M7 4v9a2 2 0 002 2h7"/><path d="M7 13h9l2 6"/><path d="M10 15l-1 4"/>',
  flecha: '<path d="M5 12h14M13 6l6 6-6 6"/>',
};
const icon = (k, cls = 'ico') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ico[k]}</svg>`;

const NAV = [
  { href: 'index.html', id: 'inicio', txt: 'Inicio', ico: 'inicio' },
  { href: 'viajes.html', id: 'viajes', txt: 'Viajes de hoy', ico: 'reloj' },
  { href: 'mapa.html', id: 'mapa', txt: 'Mapa en vivo', ico: 'mapa' },
  { href: 'seguimiento.html', id: 'seguimiento', txt: 'Sigue tu bus', ico: 'pin' },
  { href: 'verificar.html', id: 'verificar', txt: 'Verificar pasaje', ico: 'qr' },
  { href: 'tarifas.html', id: 'tarifas', txt: 'Rutas y tarifas', ico: 'tarifa' },
];

const opcionesParadas = (sel) => ['ivirgarzama', 'chimore', 'shinahota', 'villatunari', 'colomi', 'sacaba', 'cochabamba', 'pvillarroel', 'bulobulo']
  .map((k) => `<option value="${k}"${k === sel ? ' selected' : ''}>${PARADAS[k].nombre}</option>`).join('');

function buscador({ desde = 'ivirgarzama', hasta = 'cochabamba' } = {}) {
  return `
<form class="buscador" action="viajes.html" method="get" data-buscador>
  <label class="campo">
    <span class="campo__et">${icon('pin', 'ico ico--chico')} Desde</span>
    <select name="desde" aria-label="Ciudad de origen">${opcionesParadas(desde)}</select>
  </label>
  <button class="buscador__cambiar" type="button" data-cambiar aria-label="Intercambiar origen y destino">${icon('cambiar')}</button>
  <label class="campo">
    <span class="campo__et">${icon('pin', 'ico ico--chico')} Hasta</span>
    <select name="hasta" aria-label="Ciudad de destino">${opcionesParadas(hasta)}</select>
  </label>
  <label class="campo">
    <span class="campo__et">${icon('reloj', 'ico ico--chico')} Fecha del viaje</span>
    <input type="date" name="fecha" data-hoy aria-label="Fecha del viaje">
  </label>
  <button class="btn btn--grande buscador__ir" type="submit">${icon('buscar')} Buscar pasajes</button>
</form>`;
}

// Cabecera con foto de las páginas internas (como la de la referencia)
function cabFoto({ titulo, sub, foto, extra = '', pos = '50% 50%' }) {
  return `
<section class="cab-foto">
  <div class="cab-foto__in">
    <h1>${titulo}</h1>
    ${sub ? `<p class="lead">${sub}</p>` : ''}
  </div>
  <div class="cab-foto__img">${img(foto, { carga: 'eager', pos, sizes: '50vw' })}</div>
</section>
${extra ? `<div class="contenedor flota-sobre">${extra}</div>` : ''}`;
}

// Cabecera con degradado azul marino a rojo e icono, para páginas sin foto
function cabIcono({ titulo, sub, ico: i }) {
  return `
<section class="cab-icono">
  <div class="contenedor cab-icono__in">
    <span class="cab-icono__ico">${icon(i)}</span>
    <div><h1>${titulo}</h1>${sub ? `<p class="lead">${sub}</p>` : ''}</div>
  </div>
</section>`;
}

function pagina({ id, titulo, desc, cuerpo, mapa = false }) {
  const navLat = NAV.map((n) => `<li><a href="${n.href}"${n.id === id ? ' aria-current="page"' : ''}>${icon(n.ico)}<span>${n.txt}</span></a></li>`).join('');
  const navTop = NAV.filter((n) => n.id !== 'verificar').map((n) => `<a href="${n.href}"${n.id === id ? ' aria-current="page"' : ''}>${n.txt}</a>`).join('');
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(titulo)} | Carrasco Tropical</title>
<meta name="description" content="${esc(desc)}">
<link rel="icon" href="img/logo-carrasco-tropical.jpg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
${mapa ? '<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin="">\n' : ''}<link rel="stylesheet" href="css/site.css?v=${VERSION}">
</head>
<body data-pagina="${id}">
<a class="saltar" href="#contenido">Saltar al contenido</a>
<div class="marco">
<aside class="lateral" id="lateral" aria-label="Menú principal">
  <div class="lateral__cab">
    <a class="lateral__marca" href="index.html"><img src="img/logo-carrasco-tropical.jpg" alt="" width="48" height="48"><span>Carrasco<br>Tropical</span></a>
    <button class="lateral__cerrar" type="button" data-menu-cerrar aria-label="Cerrar menú">${icon('cerrar')}</button>
  </div>
  <a class="btn lateral__buscar" href="viajes.html">${icon('buscar')} Buscar pasajes</a>
  <nav><ul class="lateral__lista">${navLat}
    <li><a href="seguimiento.html#preguntas">${icon('ayuda')}<span>Preguntas frecuentes</span></a></li>
    <li><span class="lateral__pendiente" title="El número lo confirma el sindicato">${icon('chat')}<span>WhatsApp</span><em class="pendiente">por confirmar</em></span></li>
  </ul></nav>
  <a class="lateral__pasajero" href="#" aria-disabled="true" title="Disponible con la app del pasajero">${icon('usuario')} Soy pasajero</a>
</aside>
<div class="principal">
<div class="utilidad">
  <div class="utilidad__in">
    <p>Paga tu pasaje con <strong>QR desde cualquier banco</strong></p>
    <nav aria-label="Ayuda"><a href="verificar.html">Verificar pasaje</a><a href="seguimiento.html#preguntas">Preguntas frecuentes</a></nav>
  </div>
</div>
<header class="barra">
  <div class="barra__in">
    <button class="barra__menu" type="button" data-menu-abrir aria-controls="lateral" aria-expanded="false" aria-label="Abrir menú">${icon('menu')}</button>
    <a class="marca" href="index.html"><img src="img/logo-carrasco-tropical.jpg" alt="" width="40" height="40"><span>Carrasco <b>Tropical</b></span></a>
    <nav class="barra__nav" aria-label="Secciones">${navTop}</nav>
    <div class="barra__acc">
      <a class="btn btn--chico" href="seguimiento.html">${icon('pin')} Sigue tu bus</a>
    </div>
  </div>
</header>
<main id="contenido">
${cuerpo}
</main>
${pie()}
</div>
</div>
${mapa ? '<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>\n' : ''}<script type="module" src="js/app.js?v=${VERSION}"></script>
</body>
</html>
`;
}

function pie() {
  const creditos = Object.values(CREDITOS).map((c) => `<a href="${esc(c.pagina)}">${esc(c.autor || 'Wikimedia Commons')}</a> (${esc(c.licencia)})`).join(', ');
  return `<section class="banda-azul">
  <div class="contenedor banda-azul__in">
    <p class="banda-azul__tit">Viaja con el sindicato del trópico.<br>Pasaje con QR y bus en vivo.</p>
    <a class="btn btn--blanco" href="viajes.html">${icon('buscar')} Buscar pasajes</a>
  </div>
</section>
<footer class="pie">
  <div class="contenedor pie__in">
    <div class="pie__marca">
      <p class="pie__logo"><img src="img/logo-carrasco-tropical.jpg" alt="" width="56" height="56"><span>Carrasco Tropical</span></p>
      <p>${SINDICATO.nombre}. Pasajes con QR y la flota en vivo, del trópico a la ciudad.</p>
    </div>
    <nav class="pie__col" aria-label="Navegación del pie">
      <p class="pie__tit">Navegación</p>
      <ul>${NAV.map((n) => `<li><a href="${n.href}">${n.txt}</a></li>`).join('')}<li><a href="guia.html">Normas de diseño</a></li></ul>
    </nav>
    <div class="pie__col">
      <p class="pie__tit">Sindicato</p>
      <ul class="pie__datos">
        <li>${icon('pin')}<span><small>Sede</small>${SINDICATO.sede}</span></li>
        <li>${icon('escudo')}<span><small>Personería jurídica</small>${SINDICATO.resolucion}</span></li>
        <li>${icon('chat')}<span><small>WhatsApp</small><span class="pendiente">Por confirmar</span></span></li>
      </ul>
    </div>
  </div>
  <div class="contenedor pie__base">
    <p>© 2026 ${SINDICATO.corto}. Rutas, horarios, tarifas y vehículos de muestra hasta recibir los datos oficiales de la directiva.</p>
    <p class="pie__creditos">Fotos de Wikimedia Commons: ${creditos}. Mapa: <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>.</p>
  </div>
</footer>`;
}

// ---------- piezas pre-renderizadas (se ven sin JavaScript; app.js las actualiza en vivo) ----------
const hoy = viajesDelDia(new Date());
const nombre = (k) => PARADAS[k].nombre;

function filaTablero(v) {
  const r = rutaDe(v.ruta);
  return `<tr>
  <td class="t-int">${v.interno}</td>
  <td class="t-ruta">${nombre(v.desde)} a ${nombre(v.hasta)}</td>
  <td class="t-hora num">${aHora(v.sale)}</td>
  <td class="t-en num">${aHora(v.llega)}</td>
  <td class="t-veh">${r.vehiculo}</td>
  <td class="t-precio num">${bs(r.tarifa.general)}</td>
  <td><span class="t-est">Programado</span></td>
</tr>`;
}

function tarjetaViaje(v) {
  const r = rutaDe(v.ruta);
  const h = Math.floor(r.minutos / 60); const m = r.minutos % 60;
  return `<article class="viaje">
  <div class="viaje__veh">
    <span class="viaje__avatar">${icon('bus')}</span>
    <p class="viaje__int">Interno <strong>${v.interno}</strong></p>
    <p class="viaje__placa num">${v.placa}</p>
    <p class="viaje__tipo">${r.vehiculo}</p>
  </div>
  <div class="viaje__trayecto">
    <div class="viaje__punto"><p class="viaje__hora num">${aHora(v.sale)}</p><p class="viaje__lugar">${nombre(v.desde)}</p></div>
    <div class="viaje__linea" aria-hidden="true"><span>${h ? `${h} h ` : ''}${m ? `${m} min` : ''}</span></div>
    <div class="viaje__punto viaje__punto--fin"><p class="viaje__hora num">${aHora(v.llega)}</p><p class="viaje__lugar">${nombre(v.hasta)}</p></div>
  </div>
  <div class="viaje__compra">
    <p class="viaje__precio-et">Pasaje general</p>
    <p class="viaje__precio num">${bs(r.tarifa.general)}</p>
    <p class="viaje__libres">${v.libres} asientos libres</p>
    <button class="btn" type="button" data-elegir="${v.id}">Elegir asiento</button>
  </div>
</article>`;
}

// ---------- INICIO ----------
const proximos = hoy.filter((v) => v.sale >= 6 * 60).slice(0, 8);
const inicio = pagina({
  id: 'inicio', mapa: true,
  titulo: 'Pasajes con QR y buses en vivo',
  desc: 'Compra tu pasaje con QR bancario y sigue en el mapa los buses del Sindicato de Transportes Carrasco Tropical, Ivirgarzama.',
  cuerpo: `
<section class="portada">
  <div class="portada__img">${img(FOTO.portada, { carga: 'eager', pos: '50% 40%' })}</div>
  <div class="contenedor portada__in">
    <h1>Viaja por el trópico, sin filas</h1>
    <p class="lead">Compra tu pasaje con QR y mira dónde viene tu bus.</p>
    <a class="btn btn--rojo" href="viajes.html">${icon('reloj')} Viajes de hoy</a>
  </div>
</section>
<div class="banda-busqueda"><div class="contenedor">${buscador()}</div></div>

<section class="contenedor ventajas" aria-label="Por qué viajar con el sindicato">
  <div class="ventaja"><span class="ventaja__ico">${icon('qr')}</span><div><p class="ventaja__tit">Paga con QR</p><p>Desde cualquier app de banco.</p></div></div>
  <div class="ventaja"><span class="ventaja__ico">${icon('ticket')}</span><div><p class="ventaja__tit">Pasaje seguro</p><p>Con código QR que no se copia.</p></div></div>
  <div class="ventaja"><span class="ventaja__ico">${icon('mapa')}</span><div><p class="ventaja__tit">Bus en vivo</p><p>Ubicación cada 5 a 10 segundos.</p></div></div>
  <div class="ventaja"><span class="ventaja__ico">${icon('senal')}</span><div><p class="ventaja__tit">Sin señal, igual</p><p>Se sincroniza al volver la red.</p></div></div>
</section>

<section class="contenedor seccion">
  <div class="sec-cab">
    <h2>Próximas salidas</h2>
    <p>Desde la parada de Ivirgarzama y de regreso, en tiempo real.</p>
  </div>
  <div class="tablero">
    <div class="tablero__cab"><p><span class="vivo" aria-hidden="true"></span>Tablero de salidas</p><p class="tablero__reloj num" data-reloj>--:--:--</p></div>
    <div class="tablero__scroll">
    <table>
      <thead><tr><th>Interno</th><th>Ruta</th><th>Sale</th><th data-col-en>Llega</th><th>Vehículo</th><th>Precio</th><th>Estado</th></tr></thead>
      <tbody data-tablero>${proximos.map(filaTablero).join('')}</tbody>
    </table>
    </div>
  </div>
  <p class="centro"><a class="btn btn--grande" href="viajes.html">Ver todos los viajes de hoy</a></p>
</section>

<section class="contenedor seccion casa">
  <figure class="casa__foto">
    ${img(FOTO.ivirgarzama, { sizes: '(min-width: 68rem) 50vw, 100vw' })}
    <figcaption>${FOTO.ivirgarzama.lugar}</figcaption>
  </figure>
  <div class="casa__texto">
    <h2>Nuestra casa es Ivirgarzama</h2>
    <p class="lead">En el corazón de la provincia Carrasco, entre ríos y selva. De nuestra parada salen las cuatro rutas del sindicato.</p>
    <ul class="casa__datos">
      <li>${icon('pin')} Ivirgarzama, Cochabamba</li>
      <li>${icon('escudo')} ${SINDICATO.resolucion}</li>
    </ul>
    <a class="btn btn--suave" href="tarifas.html">Ver rutas y paradas</a>
  </div>
</section>

<section class="contenedor seccion envivo">
  <div class="envivo__texto">
    <h2>Mira dónde viene tu bus</h2>
    <p class="lead">Cada vehículo del sindicato aparece en el mapa mientras está en ruta.</p>
    <p class="envivo__cifra"><strong class="num" data-en-ruta>Varios</strong> vehículos en ruta ahora</p>
    <a class="btn" href="mapa.html">Abrir el mapa</a>
  </div>
  <div class="envivo__mapa"><div class="mapa mapa--portada" data-mapa="flota" role="img" aria-label="Mapa con los vehículos del sindicato en ruta"></div></div>
</section>

<section class="banda-oscura">
  <div class="banda-oscura__img">${img(FOTO.tunariRio, { pos: '50% 40%' })}</div>
  <div class="contenedor">
  <div class="sec-cab sec-cab--fila">
    <div><h2>Rutas populares</h2><p>Todas salen de Ivirgarzama. Elige tu destino.</p></div>
    <a class="btn btn--rojo" href="tarifas.html">Ver rutas y tarifas</a>
  </div>
  <div class="destinos">
    ${RUTAS.map((r) => `<a class="destino" href="viajes.html?desde=${r.desde}&amp;hasta=${r.hasta}">
      ${img(FOTO_RUTA[r.id], { cls: 'destino__img', sizes: '(min-width: 68rem) 25vw, 50vw' })}
      <span class="destino__info">
        <span class="destino__nombre">${nombre(r.hasta)}</span>
        <span class="destino__meta">Cada ${r.cada} min, desde ${bs(r.tarifa.general)}</span>
      </span>
    </a>`).join('')}
  </div>
  </div>
</section>

<section class="pasos-sec">
  <div class="contenedor seccion">
    <div class="sec-cab sec-cab--centro">
      <h2>Viajar es fácil</h2>
      <p>En tres pasos, desde tu celular o en la parada.</p>
    </div>
    <ol class="pasos">
      <li><span class="pasos__n">1</span><span class="pasos__ico">${icon('buscar')}</span><h3>Busca tu viaje</h3><p>Origen, destino y hora, con los asientos libres.</p></li>
      <li><span class="pasos__n">2</span><span class="pasos__ico">${icon('asiento')}</span><h3>Elige tu asiento</h3><p>Ventana o pasillo, y pagas con QR o en efectivo.</p></li>
      <li><span class="pasos__n">3</span><span class="pasos__ico">${icon('pin')}</span><h3>Sigue tu bus</h3><p>Con el código de tu pasaje, y compártelo con tu familia.</p></li>
    </ol>
    <p class="centro"><a class="btn btn--grande" href="viajes.html">${icon('buscar')} Buscar pasajes ahora</a></p>
  </div>
</section>

<section class="verifica-banda">
  <div class="contenedor verifica">
    <div>
      <h2>¿Tu pasaje es auténtico?</h2>
      <p>Escribe el código o escanea el QR con tu celular.</p>
    </div>
    <form class="forma-linea" action="verificar.html" method="get">
      <label class="visually-hidden" for="cod-ini">Código del pasaje</label>
      <input id="cod-ini" name="codigo" placeholder="CT-2611-0412" autocomplete="off" spellcheck="false">
      <button class="btn" type="submit">Verificar</button>
    </form>
  </div>
</section>`,
});

// ---------- VIAJES ----------
const viajes = pagina({
  id: 'viajes',
  titulo: 'Viajes de hoy',
  desc: 'Salidas de hoy del Sindicato Carrasco Tropical: horarios, asientos libres y precio por tramo.',
  cuerpo: `
${cabFoto({ titulo: 'Viajes de hoy', foto: FOTO.tunariRio, pos: '50% 45%', extra: buscador() })}
<section class="contenedor resultados">
  <div class="sentidos" role="tablist" aria-label="Sentido del viaje">
    <button type="button" role="tab" aria-selected="true" data-sentido="ida"><strong>Ida</strong> <span data-et-ida>Ivirgarzama a Cochabamba</span></button>
    <button type="button" role="tab" aria-selected="false" data-sentido="vuelta"><strong>Vuelta</strong> <span data-et-vuelta>Cochabamba a Ivirgarzama</span></button>
  </div>
  <div class="resultados__grid">
    <div>
      <div class="resultados__cab">
        <div><h2 data-res-titulo>${hoy.filter((v) => v.desde === 'ivirgarzama' && v.hasta === 'cochabamba').length} viajes disponibles</h2><p data-res-sub>Ivirgarzama a Cochabamba, hoy</p></div>
        <label class="filtro"><span class="visually-hidden">Filtrar por número interno o placa</span>${icon('buscar')}<input type="search" placeholder="Interno o placa" data-filtro></label>
      </div>
      <div class="lista-viajes" data-lista>
        ${hoy.filter((v) => v.desde === 'ivirgarzama' && v.hasta === 'cochabamba').map(tarjetaViaje).join('')}
      </div>
      <p class="vacio" data-vacio hidden>${icon('bus')} No hay salidas para ese tramo y fecha. Prueba otra hora o cambia origen o destino.</p>
      <p class="centro"><button class="btn btn--suave" type="button" data-mas hidden>Mostrar más salidas</button></p>
    </div>
    <aside class="lateral-info">
      <section class="info-bloque">
        <h2 class="info-tit">${icon('escudo')} Compra segura</h2>
        <ul class="info-lista">
          <li><strong>Pasaje al instante</strong><span>Impreso por el conductor o en tu celular.</span></li>
          <li><strong>Tarifa oficial</strong><span>El precio por tramo y tipo de pasajero.</span></li>
          <li><strong>Directo al sindicato</strong><span>El pago QR llega a la cuenta del sindicato.</span></li>
        </ul>
      </section>
      <section class="info-bloque">
        <h2 class="info-tit">${icon('tarifa')} Formas de pago</h2>
        <ul class="etiquetas"><li>${icon('qr')} QR bancario</li><li>${icon('tarifa')} Efectivo</li></ul>
      </section>
      <section class="info-bloque info-bloque--suave">
        <h2 class="info-tit">¿Ya tienes pasaje?</h2>
        <p>Sigue tu bus en vivo con el código impreso.</p>
        <a class="btn" href="seguimiento.html">${icon('pin')} Sigue tu bus</a>
      </section>
    </aside>
  </div>
</section>
<dialog class="dialogo" data-dialogo aria-labelledby="dlg-tit">
  <form method="dialog" class="dialogo__in">
    <div class="dialogo__cab"><h2 id="dlg-tit">Tu pasaje</h2><button class="icono-btn" value="cerrar" aria-label="Cerrar">${icon('cerrar')}</button></div>
    <div data-dlg-cuerpo></div>
  </form>
</dialog>`,
});

// ---------- MAPA ----------
const mapa = pagina({
  id: 'mapa', mapa: true,
  titulo: 'Mapa en vivo de la flota',
  desc: 'Ubicación en tiempo real de los vehículos del Sindicato Carrasco Tropical.',
  cuerpo: `
${cabIcono({ titulo: 'Mapa en vivo', sub: 'Los vehículos del sindicato que están en ruta ahora.', ico: 'mapa' })}
<section class="contenedor mapa-pag">
  <div class="mapa-pag__cab">
    <div class="chips" role="group" aria-label="Filtrar por ruta">
      <button type="button" aria-pressed="true" data-ruta-filtro="todas">Todas</button>
      ${RUTAS.map((r) => `<button type="button" aria-pressed="false" data-ruta-filtro="${r.id}">${nombre(r.hasta)}</button>`).join('')}
    </div>
  </div>
  <div class="mapa-pag__grid">
    <div class="mapa-caja"><div class="mapa mapa--grande" data-mapa="flota-completa" role="img" aria-label="Mapa con todos los vehículos en ruta"></div></div>
    <aside class="flota">
      <div class="flota__cab"><h2><span class="num" data-en-ruta>Varios</span> en ruta</h2><p class="num" data-reloj>--:--:--</p></div>
      <ul class="flota__lista" data-flota><li class="pendiente">La lista se actualiza con JavaScript activado.</li></ul>
    </aside>
  </div>
</section>`,
});

// ---------- SEGUIMIENTO ----------
const faqs = [
  ['¿Dónde está el código de mi pasaje?', 'Debajo del QR, en tu pasaje impreso o en el que recibiste por WhatsApp. Empieza con CT.'],
  ['¿Puedo compartir el seguimiento?', 'Sí. Usa el botón Compartir enlace y tu familia verá el bus en vivo, sin ver tus datos.'],
  ['¿Cada cuánto se mueve el bus en el mapa?', 'El celular del conductor envía su posición cada 5 a 10 segundos mientras el turno está activo.'],
  ['¿Y si el bus pasa por un tramo sin señal?', 'El mapa muestra la última posición conocida y se pone al día cuando vuelve la señal.'],
  ['Perdí mi pasaje, ¿qué hago?', 'Pide al conductor o en la parada que lo busquen por fecha, hora y vehículo: todos los cobros quedan registrados.'],
];
const consulta = ({ data, id, boton, ico: i, ayuda }) => `
<form class="consulta" ${data}>
  <label for="${id}">Código del pasaje</label>
  <div class="consulta__fila">
    <input id="${id}" name="codigo" placeholder="CT-2611-0412" autocomplete="off" spellcheck="false" required>
    <button class="btn" type="submit">${icon(i)} ${boton}</button>
  </div>
  <p class="consulta__ayuda">${ayuda}</p>
</form>`;
const seguimiento = pagina({
  id: 'seguimiento', mapa: true,
  titulo: 'Sigue tu bus',
  desc: 'Ingresa el código de tu pasaje y sigue tu bus en vivo.',
  cuerpo: `
${cabFoto({ titulo: 'Sigue tu bus', sub: 'Escribe el código de tu pasaje y mira dónde está tu bus.', foto: FOTO.espiritu, pos: '50% 55%',
    extra: consulta({ data: 'data-seguir', id: 'cod-seg', boton: 'Seguir', ico: 'buscar', ayuda: 'Para probar usa <button type="button" class="enlace" data-demo="CT-2611-0412">CT-2611-0412</button>.' }) })}
<section class="contenedor seguir-res" data-seguir-res hidden>
  <div class="seguir-res__grid">
    <div class="mapa-caja"><div class="mapa mapa--seguir" data-mapa="seguir" role="img" aria-label="Mapa con la trayectoria de tu bus"></div></div>
    <div class="seguir-res__datos" data-seguir-datos></div>
  </div>
</section>
<section class="contenedor faq" id="preguntas">
  <h2>Preguntas frecuentes</h2>
  ${faqs.map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join('')}
</section>`,
});

// ---------- VERIFICAR ----------
const verificar = pagina({
  id: 'verificar',
  titulo: 'Verificar pasaje',
  desc: 'Confirma si un pasaje del Sindicato Carrasco Tropical es auténtico.',
  cuerpo: `
${cabFoto({ titulo: 'Verificar pasaje', sub: 'Confirma en segundos si un pasaje es auténtico.', foto: FOTO.chapare, pos: '50% 60%',
    extra: consulta({ data: 'data-verificar', id: 'cod-ver', boton: 'Verificar', ico: 'qr', ayuda: 'Escanear el QR del pasaje abre esta página.' }) })}
<section class="contenedor verif" aria-live="polite">
  <div data-verif-res></div>
  <div class="verif__demo info-bloque">
    <h2 class="info-tit">Códigos para probar</h2>
    <ul>${Object.entries(PASAJES_DEMO).map(([k, v]) => `<li><button type="button" class="enlace num" data-demo="${k}">${k}</button> ${({ valido: 'válido', usado: 'ya utilizado', anulado: 'anulado' })[v.estado]}</li>`).join('')}
      <li><button type="button" class="enlace num" data-demo="CT-0000-0000">CT-0000-0000</button> inválido</li></ul>
    <p>La verificación pública no muestra datos personales del pasajero.</p>
  </div>
</section>`,
});

// ---------- TARIFAS ----------
const tarifas = pagina({
  id: 'tarifas',
  titulo: 'Rutas, paradas y tarifas',
  desc: 'Rutas, paradas, horarios y tarifas del Sindicato Carrasco Tropical.',
  cuerpo: `
${cabFoto({ titulo: 'Rutas y tarifas', sub: 'Tarifas de muestra. Las oficiales las publica la directiva antes del lanzamiento.', foto: FOTO.tunariVista, pos: '50% 60%' })}
<section class="contenedor tarifas">
  ${RUTAS.map((r) => `<article class="ruta" id="${r.id}">
    <div class="ruta__foto">${img(FOTO_RUTA[r.id], { sizes: '(min-width: 68rem) 30vw, 100vw' })}</div>
    <div class="ruta__cuerpo">
      <h2>${r.nombre}</h2>
      <ul class="ruta__datos">
        <li>${icon('reloj')}<span><small>Frecuencia</small>Cada ${r.cada} minutos</span></li>
        <li>${icon('bus')}<span><small>Primera y última salida</small><span class="num">${r.primera} y ${r.ultima}</span></span></li>
        <li>${icon('mapa')}<span><small>Duración aproximada</small>${r.minutos >= 60 ? `${Math.floor(r.minutos / 60)} h ${r.minutos % 60 ? `${r.minutos % 60} min` : ''}` : `${r.minutos} min`}, en ${r.vehiculo.toLowerCase()}</span></li>
      </ul>
      <p class="ruta__paradas"><strong>Paradas:</strong> ${r.paradas.map(nombre).join(', ')}</p>
      <table class="tabla-tarifa">
        <caption class="visually-hidden">Tarifa de ${r.nombre} por tipo de pasajero</caption>
        <thead><tr><th scope="col">Tramo</th>${TIPOS.map((t) => `<th scope="col" class="num">${t.nombre}</th>`).join('')}</tr></thead>
        <tbody>
          <tr><th scope="row">${nombre(r.desde)} a ${nombre(r.hasta)}</th>${TIPOS.map((t) => `<td class="num">${bs(r.tarifa[t.id])}</td>`).join('')}</tr>
          ${r.paradas.length > 3 ? `<tr><th scope="row">Hasta ${nombre(r.paradas[2])}</th>${TIPOS.map((t) => `<td class="num">${bs(Math.max(3, Math.round(r.tarifa[t.id] * 0.35)))}</td>`).join('')}</tr>` : ''}
        </tbody>
      </table>
      <a class="btn btn--suave" href="viajes.html?desde=${r.desde}&amp;hasta=${r.hasta}">Ver las salidas de hoy</a>
    </div>
  </article>`).join('')}
</section>`,
});

// ---------- NORMAS DE DISEÑO ----------
const colores = [
  ['--color-accent', 'Rojo bandera', 'Botón Buscar, acciones destacadas, pie de página.', 'claro'],
  ['--color-brand', 'Azul marino', 'Botones, iconos, enlaces, cabeceras.', 'claro'],
  ['--color-night', 'Azul noche', 'Banda de búsqueda, tablero, fondos oscuros.', 'claro'],
  ['--color-ink', 'Texto', 'Títulos y textos.', 'claro'],
  ['--color-paper', 'Blanco', 'Fondo y tarjetas.', ''],
  ['--color-paper-2', 'Gris claro', 'Barra superior, secciones alternas, campos.', ''],
  ['--color-brand-soft', 'Azul claro', 'Elemento activo, botones suaves.', ''],
  ['--color-success', 'Verde', 'Pasaje válido, en vivo.', 'claro'],
];
const guia = pagina({
  id: 'guia',
  titulo: 'Normas de diseño',
  desc: 'Tipografías, colores, controles y reglas de uso del sitio del Sindicato Carrasco Tropical.',
  cuerpo: `
${cabIcono({ titulo: 'Normas de diseño', sub: 'Rojo, azul marino y blanco, los colores de la bandera del sindicato.', ico: 'escudo' })}
<section class="contenedor guia">

  <article class="guia__bloque">
    <h2>Colores</h2>
    <ul class="muestras">${colores.map(([tok, n, uso, cl]) => `<li class="muestra">
      <span class="muestra__color${cl ? ' muestra__color--claro' : ''}" style="background: var(${tok})"><span>${n}</span></span>
      <p class="num muestra__hex" data-hex="${tok}">${tok}</p><p>${uso}</p></li>`).join('')}</ul>
    <p class="guia__regla">Blanco en casi toda la pantalla. Azul marino para la estructura y los botones; rojo para la acción principal (Buscar) y para bandas puntuales: el pie y la sección de pasos.</p>
  </article>

  <article class="guia__bloque">
    <h2>Tipografías</h2>
    <div class="tipos-guia">
      <div class="tipo-guia"><p class="tipo-guia__muestra tipo-guia__muestra--display">Viaja por el trópico</p><p><strong>Montserrat</strong> 800 y 900 en mayúsculas para el titular de portada; 700 para títulos de sección.</p></div>
      <div class="tipo-guia"><p class="tipo-guia__muestra tipo-guia__muestra--body">Compra tu pasaje con QR y mira dónde viene tu bus.</p><p><strong>Montserrat</strong> 400, 500 y 600 para todo lo que se lee: textos, etiquetas, botones.</p></div>
    </div>
    <p class="guia__regla">Una sola familia, Montserrat. Solo el titular de portada va en mayúsculas; el resto en minúscula de oración.</p>
  </article>

  <article class="guia__bloque">
    <h2>Controles</h2>
    <div class="guia__controles">
      <a class="btn" href="viajes.html">Buscar pasajes</a>
      <a class="btn btn--rojo" href="viajes.html">Buscar</a>
      <a class="btn btn--suave" href="tarifas.html">Ver tarifas</a>
      <label class="campo"><span class="campo__et">Código del pasaje</span><input placeholder="CT-2611-0412"></label>
    </div>
    <p class="guia__regla">Botones de 48 px con esquinas de 8 px. Azul marino para acciones normales, rojo para Buscar y la acción principal de cada banda, azul claro para las secundarias. Campos con borde gris y esquinas de 6 px.</p>
  </article>

  <article class="guia__bloque">
    <h2>Estados del pasaje</h2>
    <div class="estados-guia">
      <div class="veredicto veredicto--valido"><p class="veredicto__palabra">Válido</p></div>
      <div class="veredicto veredicto--usado"><p class="veredicto__palabra">Ya utilizado</p></div>
      <div class="veredicto veredicto--anulado"><p class="veredicto__palabra">Anulado</p></div>
      <div class="veredicto veredicto--invalido"><p class="veredicto__palabra">Inválido</p></div>
    </div>
    <p class="guia__regla">Verde, amarillo, gris y rojo, como pide la cotización (RF-52).</p>
  </article>

  <article class="guia__bloque">
    <h2>Formas y fotos</h2>
    <ul class="info-lista">
      <li><strong>Esquinas</strong><span>Tarjetas de 12 px, botones de 8 px, campos de 6 px.</span></li>
      <li><strong>Sombras</strong><span>Suaves, solo en tarjetas que flotan (buscador, tarjetas de viaje).</span></li>
      <li><strong>Fotos</strong><span>Del trópico de Cochabamba, a color; en portada con capa oscura y degradado a azul noche.</span></li>
      <li><strong>Logo</strong><span>En sus colores originales, sobre fondo claro, mínimo 40 px.</span></li>
    </ul>
  </article>
</section>`,
});

const paginas = { 'index.html': inicio, 'viajes.html': viajes, 'mapa.html': mapa, 'seguimiento.html': seguimiento, 'verificar.html': verificar, 'tarifas.html': tarifas, 'guia.html': guia };
for (const [f, html] of Object.entries(paginas)) writeFileSync(new URL(f, import.meta.url), html);
console.log('Páginas generadas:', Object.keys(paginas).join(', '));
