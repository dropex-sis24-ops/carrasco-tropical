# Diseño: Carrasco Tropical

El sistema fijado del sitio. Toda página nueva (y toda corrida de Hallmark) lo lee primero, y todas las páginas lo comparten. Se cambia a propósito: este archivo es la regla.

## Sistema
- Tono: confiable y de empresa de buses. Referencia de colores y distribución: flechabus.com.ar (sin copiar su marca).
- Marca: rojo y azul de la bandera del sindicato, medidos sobre el logo (`.hallmark/brand-spec.md`), sobre blanco.
- Historial: 1) afiche de terminal, descartado por parecer propaganda política; 2) estilo acogedor redondeado; 3) actual, rojo, azul marino y blanco.

## Distribución
- Barra fina gris arriba (pago con QR, Verificar pasaje, Preguntas frecuentes) y cabecera blanca: logo con "Carrasco **Tropical**" en azul y rojo, menú en azul marino con la página activa subrayada en rojo, botón azul marino "Sigue tu bus".
- Sin menú lateral en escritorio; en celular el menú es un cajón.
- Portada: foto del trópico con capa azul noche, titular en MAYÚSCULAS a la izquierda, botón rojo; debajo, banda azul noche con el buscador blanco y el botón rojo "Buscar pasajes".
- Secciones: mosaicos blancos con iconos azul marino, tablero azul noche, rutas con foto sobre fondo oscuro, banda roja con los pasos, franja gris para verificar, banda azul de cierre y pie rojo con columnas separadas por líneas blancas.
- Páginas internas con foto: azul noche a la izquierda con el título y foto a la derecha. Sin foto (mapa, normas): azul noche con una franja roja en diagonal e icono grande.

## Tokens
`css/tokens.css` es la fuente de verdad:
- Rojo `--color-accent` oklch(58% 0.225 23), hover `--color-accent-2`.
- Azul marino `--color-brand` oklch(30% 0.2 266) y azul noche `--color-night` oklch(24% 0.17 266).
- Texto `--color-ink` oklch(27% 0.025 250); blanco `--color-paper`; gris claro `--color-paper-2`.
- Montserrat para todo (titular de portada 900 en mayúsculas, títulos 700, texto 400 a 600).
- Esquinas: tarjetas 12 px, botones 8 px, campos 6 px.
Ningún color ni `font-family` literal fuera de los tokens. Nunca un degradado de azul a rojo (pasa por morado): las dos tintas se separan con formas sólidas.

## Botones
- Azul marino para acciones normales; **rojo** para Buscar y la acción principal de cada banda; azul claro para secundarias; blanco con texto rojo sobre bandas rojas o azules.

## Estados del pasaje (RF-52)
- Válido verde, Ya utilizado amarillo, Anulado gris, Inválido rojo.

## Fotos
- Del trópico de Cochabamba, a color, en `img/fotos/` con créditos en `img/fotos/creditos.json` (el pie los muestra solo).
- Faltan fotos propias del sindicato: Ivirgarzama a pie de calle, la parada y los buses.

## Contenido
- Nunca inventar cifras, testimonios ni logos. Lo que falta se muestra como `<span class="pendiente">` (por ejemplo, el WhatsApp).
- Rutas, tarifas, vehículos y horarios son de muestra hasta recibir los oficiales (cotización, punto 6.3); se cambian en `js/data.js`.

## Cómo se construye
- `node build.mjs` genera las páginas `.html` con menú, barra y pie compartidos. Se edita `build.mjs`, no los `.html`.
- `node ~/.claude/skills/hallmark/scripts/sloplint.mjs *.html --genre modern-minimal` antes de entregar: 0 FAIL.
- La guía visual está en `guia.html` (Normas de diseño).
