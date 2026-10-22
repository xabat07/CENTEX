# Centex

App personal de finanzas (gastos, cartera, seguimiento de acciones/fondos, objetivos de ahorro).
JavaScript sin frameworks ni build: los archivos se sirven tal cual. Es una PWA que se instala en el móvil.
Los datos del usuario viven solo en el `localStorage` del dispositivo. Se publica con GitHub Pages desde `main`.
Todos los textos de la app y los comentarios del código están en español.

## Reglas

- **No hagas commit ni push sin confirmación explícita del usuario antes de cada uno.** Prepara los cambios, explícalos y espera el "sí".
- Lo que llega a `main` se publica al instante en GitHub Pages: es la app de verdad.
- Una tarea de GitHub (`.github/workflows/precios.yml`) hace commits solos en `main` ("Precios de fondos y acciones") dos veces al día. Antes de subir algo, haz `git pull --rebase`.

## Publicar una versión nueva

Cada cambio de la app lleva subida de versión, en **dos sitios** (deben coincidir):

1. `sw.js` → `const VERSION = 'centex-vX.Y.Z';` (si no cambia, los móviles siguen con la versión vieja guardada).
2. `app.js` → en `vAjustes()`, la etiqueta `Centex · versión X.Y.Z` que se ve al final de Ajustes.

Mensaje de commit habitual: `vX.Y.Z: qué cambia, en lenguaje sencillo`.

## Archivos

- `index.html` – esqueleto de la página (cabecera, menú, contenedor `#view`, hoja/diálogo de formularios).
- `app.js` – toda la lógica, en secciones numeradas: utilidades, datos, cálculos, gráficos, pantallas (`vInicio`, `vGastos`, `vCartera`, `vSeg`, `vObj`, `vAjustes`), formularios (`sheet*`), eventos (`ACT`) y arranque.
- `styles.css` – diseño, móvil y ordenador, modo claro/oscuro.
- `sw.js` – service worker: guarda la app para abrirla sin internet; `data/precios.json` va primero por red.
- `manifest.webmanifest`, `icons/` – instalación como app. (Los PNG/SVG sueltos en la raíz son copias que no se usan.)
- `data/precios.json` – precios diarios de los fondos; lo escribe `tools/precios.py` desde la tarea de GitHub. No editar a mano.
- `data/acciones.json` – precios diarios de las acciones de Seguimiento (Yahoo Finance, en euros o dólares; otras monedas pasadas a euros); lo escribe `tools/acciones.py`. La lista está en `tools/acciones.txt` (ticker, `BOLSA:TICKER`, ISIN o `CLAVE = código de Yahoo`; el código de Yahoo de un ISIN se busca solo y se guarda en `yahoo`), y es pública. La app tiene un botón «Pedir precio automático» que abre esa lista en GitHub para añadir una línea. Los fondos de Cartera usan `data/precios.json` y, si no están ahí, `data/acciones.json` (solo si van en euros).

## Datos en localStorage

- `centex.v1` – datos del usuario (gastos, cartera, carteras, fondos, seguimiento, secciones, objetivos, ajustes). Pasa por `norm()` al cargar: cualquier campo nuevo debe tener valor por defecto en `blank()`/`norm()` para no romper datos ya guardados ni copias de seguridad antiguas.
- `centex.precios` – copia local de `data/precios.json`.
- `centex.acciones` – copia local de `data/acciones.json`.
- `centex.logos` – caché de logos de empresas.
- `centex.esc` – últimos valores de la pantalla Escenarios.

## Probar en local

```
python -m http.server 8000
```

y abrir <http://localhost:8000>. El service worker cachea mucho: si no ves los cambios, recarga forzando o borra la caché.
