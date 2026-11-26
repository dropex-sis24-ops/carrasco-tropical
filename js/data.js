// Datos del sitio. Rutas, tarifas, vehículos y horarios son DE MUESTRA:
// se reemplazan por los oficiales que entregue la directiva (cotización, punto 6.3).
// Este módulo lo usan el navegador (js/app.js) y el generador (build.mjs).

export const SINDICATO = {
  nombre: 'Sindicato de Transportes Carrasco Tropical',
  corto: 'Carrasco Tropical',
  resolucion: 'Resolución Suprema N° 204268',
  sede: 'Ivirgarzama, provincia Carrasco, Cochabamba, Bolivia',
};

// Coordenadas aproximadas [lat, lng]
export const PARADAS = {
  ivirgarzama: { nombre: 'Ivirgarzama', pos: [-17.033, -64.85] },
  chimore: { nombre: 'Chimoré', pos: [-16.993, -65.133] },
  shinahota: { nombre: 'Shinahota', pos: [-16.99, -65.25] },
  villatunari: { nombre: 'Villa Tunari', pos: [-16.9725, -65.4203] },
  colomi: { nombre: 'Colomi', pos: [-17.35, -65.87] },
  sacaba: { nombre: 'Sacaba', pos: [-17.4, -66.04] },
  cochabamba: { nombre: 'Cochabamba', pos: [-17.3935, -66.157] },
  pvillarroel: { nombre: 'Puerto Villarroel', pos: [-16.839, -64.788] },
  bulobulo: { nombre: 'Bulo Bulo', pos: [-17.26, -64.37] },
};

// Puntos intermedios del camino (no son paradas) para dibujar la ruta
const VIA = {
  sillar: [-17.2, -65.67],
  ivi_pv: [-16.94, -64.83],
  ivi_bb: [-17.14, -64.62],
};

export const RUTAS = [
  {
    id: 'cbba', nombre: 'Ivirgarzama a Cochabamba', desde: 'ivirgarzama', hasta: 'cochabamba',
    paradas: ['ivirgarzama', 'chimore', 'shinahota', 'villatunari', 'colomi', 'sacaba', 'cochabamba'],
    trazo: ['ivirgarzama', 'chimore', 'shinahota', 'villatunari', VIA.sillar, 'colomi', 'sacaba', 'cochabamba'],
    minutos: 270, cada: 45, primera: '04:30', ultima: '19:30', vehiculo: 'Bus',
    tarifa: { general: 35, estudiante: 25, mayor: 25 },
  },
  {
    id: 'tunari', nombre: 'Ivirgarzama a Villa Tunari', desde: 'ivirgarzama', hasta: 'villatunari',
    paradas: ['ivirgarzama', 'chimore', 'shinahota', 'villatunari'],
    trazo: ['ivirgarzama', 'chimore', 'shinahota', 'villatunari'],
    minutos: 75, cada: 20, primera: '05:00', ultima: '20:00', vehiculo: 'Minibús',
    tarifa: { general: 12, estudiante: 8, mayor: 8 },
  },
  {
    id: 'pvillarroel', nombre: 'Ivirgarzama a Puerto Villarroel', desde: 'ivirgarzama', hasta: 'pvillarroel',
    paradas: ['ivirgarzama', 'pvillarroel'],
    trazo: ['ivirgarzama', VIA.ivi_pv, 'pvillarroel'],
    minutos: 40, cada: 30, primera: '05:30', ultima: '19:00', vehiculo: 'Minibús',
    tarifa: { general: 6, estudiante: 4, mayor: 4 },
  },
  {
    id: 'bulobulo', nombre: 'Ivirgarzama a Bulo Bulo', desde: 'ivirgarzama', hasta: 'bulobulo',
    paradas: ['ivirgarzama', 'bulobulo'],
    trazo: ['ivirgarzama', VIA.ivi_bb, 'bulobulo'],
    minutos: 60, cada: 40, primera: '05:20', ultima: '19:20', vehiculo: 'Minibús',
    tarifa: { general: 10, estudiante: 7, mayor: 7 },
  },
];

export const TIPOS = [
  { id: 'general', nombre: 'General' },
  { id: 'estudiante', nombre: 'Estudiante' },
  { id: 'mayor', nombre: 'Adulto mayor' },
];

// ---------- utilidades ----------
export const pad = (n) => String(n).padStart(2, '0');
export const aMin = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
export const aHora = (min) => { const m = ((Math.round(min) % 1440) + 1440) % 1440; return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`; };
export const bs = (n) => `Bs ${n.toFixed(2).replace('.', ',')}`;

function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
export function hash(str) { let h = 2166136261; for (const c of str) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }

const LETRAS = 'BCDFGHJKLMNPRSTVWXYZ';
// Cada ruta usa su propio grupo de internos y los rota por orden de salida,
// así un mismo vehículo nunca aparece en dos viajes a la vez.
const POOLS = { cbba: [0, 13], tunari: [14, 25], pvillarroel: [26, 33], bulobulo: [34, 41] };
for (const k in POOLS) { const [a, b] = POOLS[k]; POOLS[k] = Array.from({ length: b - a + 1 }, (_, i) => a + i); }
export const FLOTA = Array.from({ length: 42 }, (_, i) => {
  const r = rng(1000 + i);
  const placa = `${1000 + Math.floor(r() * 8999)}-${LETRAS[Math.floor(r() * 20)]}${LETRAS[Math.floor(r() * 20)]}${LETRAS[Math.floor(r() * 20)]}`;
  return { interno: i + 1, placa };
});

const coord = (p) => (typeof p === 'string' ? PARADAS[p].pos : p);
export const trazo = (ruta) => ruta.trazo.map(coord);

// Viajes del día (ida desde Ivirgarzama y vuelta), deterministas por fecha
export function viajesDelDia(fecha = new Date()) {
  const clave = `${fecha.getFullYear()}-${fecha.getMonth()}-${fecha.getDate()}`;
  const r = rng(hash(clave));
  const lista = [];
  let n = 0;
  const turno = Object.fromEntries(RUTAS.map((x) => [x.id, Math.floor(r() * 5)]));
  for (const ruta of RUTAS) {
    const salidas = [];
    for (const sentido of ['ida', 'vuelta']) {
      const ini = aMin(ruta.primera) + (sentido === 'vuelta' ? Math.round(ruta.cada / 2) : 0);
      for (let t = ini; t <= aMin(ruta.ultima); t += ruta.cada) salidas.push([t, sentido]);
    }
    salidas.sort((a, b) => a[0] - b[0]);
    for (const [t, sentido] of salidas) {
      {
        const v = FLOTA[POOLS[ruta.id][turno[ruta.id]++ % POOLS[ruta.id].length]];
        lista.push({
          id: `${ruta.id}-${sentido}-${t}`,
          ruta: ruta.id, sentido,
          desde: sentido === 'ida' ? ruta.desde : ruta.hasta,
          hasta: sentido === 'ida' ? ruta.hasta : ruta.desde,
          sale: t, llega: t + ruta.minutos,
          interno: v.interno, placa: v.placa,
          libres: 2 + Math.floor(r() * (ruta.vehiculo === 'Bus' ? 38 : 13)),
          n: n++,
        });
      }
    }
  }
  return lista.sort((a, b) => a.sale - b.sale);
}

export const rutaDe = (id) => RUTAS.find((r) => r.id === id);

// Posición a lo largo del trazo para un avance 0..1
export function puntoEn(ruta, avance, sentido = 'ida') {
  let pts = trazo(ruta);
  if (sentido === 'vuelta') pts = [...pts].reverse();
  const seg = [];
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    seg.push(d); total += d;
  }
  let falta = Math.min(Math.max(avance, 0), 1) * total;
  for (let i = 0; i < seg.length; i++) {
    if (falta <= seg[i]) {
      const f = seg[i] ? falta / seg[i] : 0;
      return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f];
    }
    falta -= seg[i];
  }
  return pts[pts.length - 1];
}

// Códigos de demostración para seguimiento y verificación
export const PASAJES_DEMO = {
  'CT-2611-0412': { estado: 'valido' },
  'CT-2611-0388': { estado: 'usado', primerUso: '06:42', lugar: 'Control Chimoré' },
  'CT-2511-1290': { estado: 'anulado', motivo: 'Anulado por el administrador: cobro duplicado' },
};
