# CLAUDE.md — CodeTypeShell

Contexto para agentes de IA (Claude Code / extensión de VS Code) que trabajen en este repositorio. Léelo entero antes de proponer cambios.

## Qué es el proyecto

**CodeTypeShell** es un test de mecanografía **para programadores**: en lugar de palabras sueltas, el usuario escribe fragmentos de código real (Java, Python, C++…) respetando sintaxis, símbolos e indentación. Es un micro-SaaS web inspirado en **MonkeyType**: minimalista, sencillo y directo al grano.

- **Nombre:** el nombre visible actual es `>CodeTypeShell_`. En el código y en las notas aparecen también *TypeCodeTortoise* y *TypeCodeTurt* (la carpeta). La mascota es una tortuga (`multimedia/tort.svg`, `turt.svg`). **No renombres nada sin preguntar**: el nombre definitivo aún no está cerrado.
- **Autor:** Marcos, estudiante del doble grado de Matemáticas e Ingeniería del Software (Uniovi). Es su **primer proyecto web grande**.

## Objetivos del autor (guían todas las decisiones)

1. **Control creativo total.** La estética y las decisiones de diseño son suyas. El proyecto debe huir de la estética "vibe coded" o genérica de plantilla (gradientes morados, tarjetas con sombras suaves, emojis decorativos, Tailwind por defecto, iconos genéricos…). Además de decisión total en cuanto la estructura del código y metodología con el que crear las cosas.
2. **Aprendizaje profesional.** Quiere entender lo que se hace, no solo que funcione. Esto incluye programación y arquitectura, pero también SEO, marketing y captación de visitas.
3. **Monetización con Google AdSense** como primera aproximación. No espera grandes ingresos: es para aprender cómo funciona.

## Cómo debe trabajar el agente

- **Explica el porqué** de cada cambio no trivial, en pocas líneas. Si hay varias formas razonables de hacer algo, propónlas brevemente y deja que el autor elija.
- **No cambies la estética** (colores, fuentes, tamaños, animaciones, layout) sin que se pida. Si crees que algo visual mejoraría, sugiérelo en lugar de hacerlo.
- **Cambios pequeños y acotados.** No refactorices ni reformatees archivos enteros si la tarea es puntual. No añadas funcionalidades que no se han pedido.
- **Sin frameworks ni dependencias** (React, Tailwind, jQuery, bundlers, npm…) salvo petición expresa. El proyecto es HTML + CSS + JavaScript vanilla a propósito.
- **Respuestas directas:** sin relleno. Si se pide desarrollar ideas, entonces sí se puede proponer y expandir.
- Antes de dar por terminada una tarea, comprueba que no rompes nada de lo que se describe en "Funcionamiento del juego".

## Stack y ejecución

- HTML5 + CSS3 + JavaScript (ES2020+, clases), **sin build ni dependencias**.
- Fuentes de Google Fonts (pixel/retro): `Press Start 2P` (principal), además de Silkscreen, Pixelify Sans, VT323, Tiny5 y Jersey 10 cargadas para pruebas.
- **Ejecución:** hay que servirlo con un servidor local, porque `fetch()` de los JSON **no funciona con `file://`**. Por ejemplo, la extensión *Live Server* de VS Code o `python -m http.server` en la raíz.
- No hay tests automáticos: las pruebas son manuales en el navegador.

## Estructura

```
index.html          Página principal (única página real por ahora)
js/
  typing.js         Clase TypingGame: núcleo del juego (carga de código, input, pintado, caret, timer, fin de partida)
  score.js          Clase ScoreTracker: puntuación, modo y tiempo inicial
  effects.js        Sonidos (acierto, fallo, línea completada) y screenShake
  gameMenu.js       Clase GameMenu: hover/foco de los botones de modo (cambia icono X.svg ↔ XSelected.svg)
  java.json, python.json, cpp.json   Fragmentos de código para escribir
style/
  style.css         Variables de color, tipografía y estilos de componentes
  format.css        Layout de la página (grid + flexbox); cada regla lleva comentada su especificidad
  crt.css           Efecto de monitor CRT, activado con la clase `crt` en <body>
multimedia/         SVG de iconos (con variante *Selected.svg) y sonidos .wav
```

Los scripts se cargan con `defer` en este orden: `effects.js` → `score.js` → `gameRecorder.js` (clase `GameRecord`: registro de pulsaciones) → `chart.js` (clase `StatsChart`: gráfica SVG de las stats) → `typing.js` → `gameMenu.js`. No hay módulos ES: las funciones y clases son globales, así que **respeta el orden** si añades scripts o pasas a usar `import`/`export`.

## Funcionamiento del juego

- `TypingGame.loadCode()` hace `fetch("js/<lenguaje>.json")`, elige uno de sus `scripts` al azar y construye las líneas: `indentacion.repeat(nivel) + piezas.join(" ")`.
- Formato de los JSON de código:
  ```json
  { "lenguaje": "java", "indentacion": "    ",
    "scripts": [
      { "lineas": [ { "nivel": 0, "piezas": ["public", "class", "Main", "{"] } ] }
    ] }
  ```
  Las `piezas` se unen con un espacio. Para añadir un lenguaje: crea `js/<nombre>.json` y añade un `<li>` con ese mismo nombre en `#lista` de `index.html`.
- El `<textarea id="text-to-type">` es readonly y transparente. En la primera pulsación se crea encima un `<pre id="typing-prompt">` con un `<span>` por carácter y un caret propio (`#typing-caret`).
  - Acierto → el carácter pasa a `<mark>`. Fallo → `<em>` con la tecla pulsada (`.incorrect-space` si fue un espacio).
  - **La indentación se salta automáticamente** (`firstNonSpaceIndex`). Enter solo avanza si la línea está completa. Backspace puede volver a la línea anterior.
- Teclado: un único listener `keydown` global en `typing.js`. Ignora Ctrl, Alt y Meta, y también ignora las teclas mientras el diálogo de lenguajes está abierto.
- Puntuación (`ScoreTracker`): al completar una línea se suma `100 × aciertos_de_la_línea × modificador`. Cada fallo resta 0.1 al modificador, y este se reinicia en cada línea. El marcador se muestra con estilo arcade a 6 dígitos (`000420`).
- Modo `time`: el contador empieza en la primera pulsación y añade `.low-time` cuando quedan 5 s o menos. Al llegar a 0 se ejecuta `endGame()`, que pone la clase `.finished` en `#typing-area`: se oculta el área de código y se muestra `#stats`.
- Selector de lenguaje: un `<dialog>` abierto con `showModal()` y posicionado bajo el botón; es un listbox accesible con flechas, Enter y Espacio.
- Selector de tiempo (`#Tiempo`): el botón elegido lleva `aria-pressed="true"` y se ve en verde. Al pulsarlo se guarda en `ScoreTracker.setStartTime()` y se llama a `restart()`, que pone el reloj con `getStartTime()`.
- Gráfica de stats (`StatsChart`): siempre se divide en 15 intervalos (`StatsChart.INTERVALS`), con los datos de `GameRecord.getPerInterval()`. Con 30 s cada intervalo abarca 2 s, y con 60 s abarca 4 s.

## Estética y diseño

- **Hacker-retro moderno:** terminal/arcade de los 80 con acabado limpio y actual. Las fuentes pixel, el verde fósforo, el cursor que parpadea (`.blink`) y el efecto CRT son seña de identidad.
- Paleta (en `style.css`, usa siempre las variables y nunca colores sueltos):
  - `--gris-oscuro: #20272e` (fondo de la página)
  - `--negro: #13171b` (área de código y paneles)
  - `--negro_oscuro: #000000`
  - `--verde-brillante: #39ff88` (acento, enlaces, hover y caret)
  - `--blanco: #ffffff` (texto)
  - `--gris-claro: #b1b1b1` (texto pendiente de escribir y botones en reposo)
- Interfaz en minúsculas y en inglés (`time`, `lines`, `score`, `reset`…), con mínimos elementos en pantalla, como en MonkeyType.
- Respeta `prefers-reduced-motion` en cualquier animación nueva (ya se hace en `shakeScreen`).

## Convenciones de código

- **Comentarios en español** y breves, con el formato `/* … */` encima de cada método, como en el código existente.
- Identificadores mayoritariamente en inglés y camelCase. Hay algunos en español (`saltoLinea`, `letraAcierto`, `letraFallo`): no los renombres salvo que se pida.
- Clases JS para cada componente (`TypingGame`, `ScoreTracker`, `GameMenu`). Busca los elementos por id y comprueba que existan antes de usarlos.
- **HTML semántico y accesible.** Es un requisito de la asignatura y del autor: `aria-*` correctos, `alt=""` + `aria-hidden` en los iconos decorativos, `<output aria-live>` para valores dinámicos, navegación completa con teclado y foco visible.
- CSS: `format.css` es para el layout y `style.css` para la apariencia. En `format.css`, **cada regla lleva un comentario `/*Especificidad: XYZ*/`**: mantenlo en las reglas nuevas. Usa unidades relativas (`rem`, `em`).
- HTML con etiquetas vacías al estilo XHTML (`<meta … />`) e indentación de 4 espacios.

## Estado actual y pendientes conocidos

Son cosas detectadas en el código. **No las arregles por iniciativa propia**: avísalas si afectan a la tarea en curso.

- Solo funciona el modo `time`. Los botones `lines`, `script` y `freestyle` no tienen lógica todavía (`ScoreTracker.mode` está fijo). Los tiempos 15/30/60 sí funcionan.
- El panel `#stats` tiene valores de ejemplo escritos a mano (Score, CPM, Accuracy, Errors). Falta calcularlos, y además le falta cerrar `</ul>`.
- Los enlaces del `<nav>` apuntan a páginas de una práctica antigua (`ciclista.html`, `equipo.html`, `etapa.html`). Las páginas Stats, Ranking, Config y About us aún no existen.
- `<meta name="description">` tiene el texto de relleno "COMPLETAR POR EL ESTUDIANTE", y el footer es provisional.
- El mensaje de error de `loadCode()` dice siempre "java.json", sea cual sea el lenguaje.
- `fail()` crea un `Audio` nuevo en cada fallo, mientras que los demás sonidos se reutilizan.
- `shakeScreen()` y `ScoreTracker.startTracking()` están definidos pero no se usan.
- El id `lenguage-button` tiene una errata (debería ser *language*). Si lo cambias, actualiza también `typing.js`.
- `crt.css` incluye en un comentario un ejemplo de interruptor para la futura página Config, que guarda la preferencia en `localStorage`.

## Hoja de ruta orientativa

1. Completar los modos de juego y la selección de tiempo, y calcular las estadísticas reales.
2. Crear las páginas Config (CRT, sonido, tema…), Stats y About; Ranking más adelante, ya que requiere backend.
3. Ampliar el banco de fragmentos de código por lenguaje y elegirlos al azar.
4. SEO básico: metadatos, Open Graph, `sitemap.xml`, `robots.txt`, rendimiento y Lighthouse.
5. Despliegue (hosting estático) y, después, AdSense.
   - Necesita una página de privacidad y un banner de consentimiento de cookies (RGPD).
   - Los anuncios **nunca** deben estar dentro del área de juego ni provocar saltos de layout (CLS) mientras se escribe.
