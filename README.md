# Centex

App personal para llevar gastos, cartera, seguimiento de acciones/fondos y objetivos de ahorro.
Funciona en el navegador y se puede instalar en el móvil (PWA). No necesita servidor ni cuenta:
los datos se guardan en el propio dispositivo (`localStorage`).

## Archivos

| Archivo | Para qué sirve |
|---|---|
| `index.html` | Estructura de la página |
| `styles.css` | Diseño (colores, tipografía, móvil y ordenador, modo oscuro) |
| `app.js` | Toda la lógica: datos, pantallas, gráficos, formularios, copia de seguridad |
| `sw.js` | Service worker: permite abrir la app sin internet |
| `manifest.webmanifest` | Nombre e iconos para instalarla en la pantalla de inicio |
| `icons/` | Iconos de la app |

## Probarla en local

```
python3 -m http.server 8000
```

y abrir <http://localhost:8000>.

## Publicar una actualización

1. Cambia lo que quieras en los archivos.
2. En `sw.js`, sube el número de `VERSION` (por ejemplo `centex-v1.0.1`) para que los móviles se actualicen.
3. Sube los cambios al repositorio.

## Copias de seguridad

Ajustes → Copia de seguridad descarga un archivo `.json` con todos los datos.
Ajustes → Restaurar o importar lo vuelve a cargar.
