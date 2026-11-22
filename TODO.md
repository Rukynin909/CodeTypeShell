# TODO — CodeTypeShell

Lista de tareas por página. Marca con `[x]` lo que vayas terminando.

---

## Start (`index.html`)

### 1. Reestilizar el menú de juego
- [ ] Bocetar el nuevo menú (en papel o Figma) antes de tocar CSS
- [ ] Agrupar en una sola barra: **modo** (`time` · `lines` · `script` · `freestyle`) | **opciones del modo** (`15` · `30` · `60`…) | **lenguaje**
- [ ] Marcar el modo/opción activos de forma persistente (no solo en hover), con `aria-pressed` o `aria-checked`
- [ ] Mostrar solo las opciones que tienen sentido para el modo elegido (p. ej. tiempos solo en `time`)
- [ ] Revisar foco visible y navegación completa con teclado (Tab, flechas)
- [ ] Ocultar o atenuar el menú mientras se está escribiendo (estilo MonkeyType) y mostrarlo al terminar
- [ ] Corregir la errata `lenguage-button` → `language-button` (y su uso en `typing.js`)

### 2. Modos de juego y selección de tiempo
- [ ] `time`: conectar los botones 15/30/60 con `ScoreTracker.startTime`
- [ ] `lines`: terminar la partida al completar N líneas (definir N y si es configurable)
- [ ] `script`: terminar al completar el fragmento entero
- [ ] `freestyle`: sin límite, terminar con `reset` o una tecla (p. ej. Esc)
- [ ] Hacer que `ScoreTracker.mode` deje de estar fijo y que `TypingGame` lo consulte al decidir el fin de partida
- [ ] Bloquear el cambio de modo/lenguaje durante una partida en curso (o reiniciarla al cambiar)

### 3. Registro de partida en JSON
- [ ] Diseñar el esquema del registro, por ejemplo:
  `{ version, fecha (ISO 8601), modo, duracion, lenguaje, fragmentoId, score, cpm, wpm, precision, aciertos, fallos, lineasCompletadas }`
- [ ] Contar durante la partida las métricas necesarias (pulsaciones totales, aciertos, fallos, tiempo real)
- [ ] Crear el método/clase que construya el registro al llamar a `endGame()` (decidir: clase `GameRecord` nueva o método en `ScoreTracker`)
- [ ] Guardar el historial en `localStorage` (array de registros, con límite de tamaño)
- [ ] Añadir un campo `version` al esquema para poder migrar datos si cambia
- [ ] Exportar el historial como archivo `.json` descargable (lo usará también Stats)

### 4. Panel de fin de partida (`#stats`)
- [ ] Cerrar el `</ul>` que falta
- [ ] Sustituir los valores de ejemplo por los reales (Score, CPM, Accuracy, Errors) leyendo el registro de partida
- [ ] Rellenar `#stats-mode` con el lenguaje y modo reales (ahora está fijo "Java / Time:15s")
- [ ] Usar `<output aria-live>` para los valores dinámicos
- [ ] Generar la gráfica real de la partida (SVG dinámico) en lugar de `grafica.svg`
  - [ ] Guardar muestras por segundo (CPM y errores) durante la partida
  - [ ] Dibujar la línea con `<svg>` + `<polyline>` desde JS
- [ ] Hacer funcionar `#restart-button` (y quizá un atajo de teclado tipo Tab+Enter)

### 5. Banco de fragmentos de código
- [ ] Cambiar el formato de los JSON a un array de fragmentos por lenguaje (cada uno con `id`)
- [ ] Escribir varios fragmentos por lenguaje (Java, Python, C++)
- [ ] Elegir uno al azar, sin repetir el anterior
- [ ] Corregir el mensaje de error de `loadCode()` (siempre dice "java.json")

### 6. Sonido y efectos
- [ ] Reutilizar el `Audio` en `fail()` como en los demás sonidos
- [ ] Decidir si se usa `shakeScreen()` (y en qué momento) o se elimina

### 7. Limpieza y SEO de la página
- [ ] Escribir el `<meta name="description">` real
- [ ] Revisar `<title>` y añadir metadatos Open Graph
- [ ] Quitar del `<nav>` los enlaces de la práctica antigua y apuntar a Stats, Ranking, Config y About us
- [ ] Footer definitivo

---

## Stats
_Sin tareas todavía._

## Ranking
_Sin tareas todavía._

## Config
_Sin tareas todavía._

## About us
_Sin tareas todavía._
