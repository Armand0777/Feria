# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# GeoRunner — Feria de Ingeniería de Sistemas

App web (React 19 + Vite 8 + Tailwind v4) con juegos para una feria universitaria: un endless runner estilo Geometry Dash (Estación 1), un Versus local de 2 jugadores, un 3 en raya (Estación 2) y una pantalla de ranking en vivo para TV. Los puntajes se guardan en Supabase.

- Producción: https://feria-opal.vercel.app/ (Vercel) · Repo: https://github.com/Armand0777/Feria
- Código, comentarios, nombres y mensajes de commit en español.

## Comandos

- `npm run dev` — Vite con `--host` (accesible desde celulares en la misma red)
- `npm run build` / `npm run preview`
- `npm run lint` — oxlint (`.oxlintrc.json`). CI corre `npm run lint -- --deny-warnings`: un warning (p. ej. `react/only-export-components`) rompe el CI aunque el lint local pase. Un solo archivo: `npx oxlint src/App.jsx`.
- No hay tests.

## Variables de entorno

`.env` (no versionado): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, leídas en `src/lib/supabase.js`.

## Arquitectura

No hay router. `src/App.jsx` es una máquina de estados sobre `pantalla` y renderiza condicionalmente:

```
configurar ─┬─ jugar ⇄ resultado
            ├─ versus-config → versus-jugar → versus-resultado
            └─ tictactoe-config → tictactoe-jugar
```

Excepción: `src/main.jsx` monta `<RankingTV />` en vez de `<App />` si la ruta es `/ranking-tv` (pantalla completa para el televisor).

App guarda el estado de sesión: `config` (jugador, modo, nivel, control, física; valores por defecto en `src/config.js`), `intento`, `mejorPuntaje`, `puntajeGuardado`, configs del versus.

### Capas

- `src/games/` — motores de canvas en JS puro, sin React:
  - `endlessrunner.js` — clase `EndlessRunner(canvas, config, modoInicial)`: física, generación de obstáculos, colisiones y dibujo. React solo usa `actualizar()`, `dibujar()`, `iniciarPresion()`, `soltarPresion()`, `reset()` y los campos `corriendo`, `terminado`, `puntaje`, `framesMuerte`. Exporta `MODOS` (cubo, nave, bola, ovni, ola, robot), `NIVELES` (facil, normal, dificil, extremo) y `dibujarForma`.
  - `endlessrunnerVersus.js` — `EndlessRunnerVersus`: dos `EndlessRunner` sobre `OffscreenCanvas` (uno por mitad) compuestos en un canvas de 900×320. Registra su propio teclado (W/Espacio = J1, ↑ = J2) y control por posición del toque.
- `src/components/` — `GameCanvas` y `VersusCanvas` son dueños del loop `requestAnimationFrame` y del input (teclado, mouse, touch). `GameCanvas` expone `presionar()`/`soltar()` por `ref` (`useImperativeHandle`) para otros controles. El resto son pantallas de UI: `ConfigPanel`, `GameSelector`, `ResultadoFinal`, `Ranking`, `VersusSelector`, `TicTacToeSelector`, `TicTacToe` (estado propio, CPU simple), `CodigoQR`, `PanelCamara`.
- `src/ia/` — control por cámara con redes neuronales (MediaPipe `@mediapipe/tasks-vision`), ver abajo.
- `src/pages/` — `RankingTV` (ruta `/ranking-tv`) y `ResultadoVersus` (que no es una ruta: la renderiza App en `versus-resultado`).
- `src/lib/audio.js` — singleton `audio`: efectos con Web Audio API y música en bucle con `<audio>` (`public/musica-fondo.mp3`). Tecla M = mute.
- `src/lib/supabase.js` — cliente Supabase.
- `src/lib/canvasHD.js` — canvas nítido: la resolución interna = tamaño en pantalla × devicePixelRatio (tope 2,4 MP). Los motores reciben su tamaño **lógico** (`{ ancho, alto }`, 700×320 / 900×320) y `dibujar()` escala con `setTransform`; nunca usar `canvas.width` como coordenada del mundo.
- `src/components/Selectores.jsx` — `SelectorModo`, `SelectorNivel` e `IconoModo` (sprite real vía `dibujarForma`), compartidos por ConfigPanel y VersusSelector. `Iconos.jsx` tiene los íconos SVG (no usar emojis en la UI).
- `src/index.css` — sistema de diseño: tokens en `:root`, clases `btn-primary|btn-secondary|btn-accent` (+ `btn-lg`/`btn-sm`), `card-dark`, `label-section`, `topbar`. Todo lo propio va dentro de `@layer base/components`: una regla fuera de capa pisa las utilidades de Tailwind v4.
- `src/lib/pasoFijo.js` — bucle de paso fijo: la simulación corre siempre a 60 pasos/s aunque la pantalla sea de 120/144 Hz o la IA baje los FPS. Los canvas llaman `actualizar()` tantas veces como diga `pasosPendientes()` y `dibujar()` una vez por cuadro.

### Control con IA (cámara)

`config.control` = `'teclado' | 'mano' | 'cara'` (se elige en `ConfigPanel`). Si no es teclado, App muestra `PanelCamara` junto al juego y le pasa callbacks que llaman al `ref` de `GameCanvas`. El teclado/clic siguen funcionando siempre.

- `src/ia/modelos.js` — carga perezosa (import dinámico) y caché de los detectores: `GestureRecognizer` (mano) y `FaceLandmarker` con blendshapes (cara). El runtime WASM se importa con `?url` (lo sirve Vite, sin CDN). Los `.task` se buscan en `public/modelos/` y si no están se bajan de storage.googleapis.com. Intenta GPU y cae a CPU. `precargarModelo()` se llama al elegir el control.
- `src/ia/controlCamara.js` — clase `ControlCamara`: abre la cámara, procesa cada cuadro (`requestVideoFrameCallback`), y traduce el resultado a `onPresionar`/`onSoltar`. Mano: presiona con `Closed_Fist` ≥ 0.5. Cara: `jawOpen` con histéresis (abre > 0.45, cierra < 0.30). Suelta tras 2 cuadros seguidos sin gesto. Emite `onLectura` con puntos, etiqueta, confianza y ms de inferencia.
- `src/components/PanelCamara.jsx` — video en espejo, esqueleto dibujado, barra de confianza y estado. Las lecturas (~30/s) se escriben directo al DOM por refs, sin re-render de React.
- La cámara exige HTTPS o `localhost` (no funciona abriendo `vite --host` por IP desde un celular).

### Motor EndlessRunner

- Canvas lógico 700×320 escalado por CSS. `SUELO_ALTO = 40`, `TECHO = 10`. Jugador 36×36 en x = 80.
- Un paso de simulación = 1/60 s (lo garantiza `pasoFijo.js`). `puntaje` suma 1 por paso.
- Cada modo tiene su física en `actualizarFisica()` y sus límites en `aplicarLimites()`. `gravedadInvertida` es global (la cambian la Bola y los orbes/pads azul y verde).
- Entidades en listas separadas: `obstaculos` (letales; `tipo` = pico, spikeTop, bloque, bloqueDoble, bloqueTriple, bloqueFlotante, ventana, sierra [variantes `orbital` y `pendulo`], picoDoble, muroFragil, laser), `pozos`, `slopes`, `pinzas`, `plataformasMoviles`, `trampolin` (pads automáticos), `orbes` (requieren tap), `imanes`, `portalesModo` (cambian de modo cada ~400–600 frames).
- `generarObstaculo()` elige por bandas de `Math.random()`. Los obstáculos complejos solo aparecen desde `nivelCfg.umbralComplejos`; `generarCombo()` arma patrones compuestos según `nivelCfg.combos`; el anti-sequía fuerza un obstáculo de techo tras 5 generaciones sin uno.
- Para agregar un obstáculo: crearlo en `generarObstaculo()`, moverlo en `actualizar()`, darle colisión en `verificarColisiones()` y dibujo en `dibujarObstaculo()`. Si no tiene `ancho`, `radio` ni `anchoBase`, agregarlo a `anchoEfectivo()`.
- Varias variantes no son un `tipo` propio sino flags sobre uno existente, y cada paso las revisa con `if (o.flag)`: `guillotina` (+ `guillotinaSuelo`) sobre `spikeTop`/`pico`, `orbital`/`pendulo` sobre `sierra`. La plataforma intermitente vive en `plataformasMoviles`.
- Muerte: `terminado = true` y `generarParticulas()` (que también detiene la música). Se animan 60 frames de explosión y `GameCanvas` muestra el overlay 1 s después.
- Campos que ajusta quien lo usa: `meta` (récord de la sesión para la barra del HUD; 0 = hitos), `mostrarHUD` y `colorFijo` (el versus los pone en false/true). `colorJugador()`: el cubo usa el color elegido; los demás modos, su color propio (en versus siempre el del jugador).
- `GameCanvas` maneja pausa (P/Esc/botón, y al ocultar la pestaña) y guarda un solo puntaje por sesión: `App.estadoGuardado` = pendiente → guardando → guardado | error.

## Verificación

Hay Playwright + Chromium en la caché de npx (`%LOCALAPPDATA%/npm-cache/_npx/*/node_modules/playwright`): sirve para probar el juego corriendo a 60 fps y sacar capturas (`docs/capturas/`). En las pruebas, **interceptar las escrituras a Supabase** (`context.route('**/*.supabase.co/rest/**')`): la base es la real de la feria. Para medir la IA con GPU real: `--use-angle=d3d11 --enable-gpu --ignore-gpu-blocklist`. CI (`.github/workflows/ci.yml`, Node 22) corre el lint estricto y `npm run build`.

## Supabase

Tabla `puntajes`: `id`, `nombre`, `color`, `puntaje`, `juego` (`'geo-runner'`), `creado_en`; el SQL de creación (checks y políticas RLS) está en el README. El único insert es `guardarPuntaje()` en `App.jsx`: se llama al salir de la sesión y desde el botón de reintento de `ResultadoFinal` (`onReintentarGuardado`); `ResultadoFinal` no toca Supabase. `Ranking` y `RankingTV` leen el top 10 (sin filtrar por `juego`) y se suscriben a INSERT por Realtime (`postgres_changes`). `RankingTV` además refresca cada 30 s y cuenta los inserts del día. `GameSelector` lee el récord histórico (top 1).

## Despliegue

Vercel, sitio estático: **cada push a `main` se publica solo en producción** (la URL que usa la feria). `vercel.json` reescribe todas las rutas a `index.html` para que `/ranking-tv` funcione. Las variables `VITE_SUPABASE_*` están configuradas en el proyecto de Vercel. `CodigoQR.jsx` tiene la URL pública hardcodeada (`URL_JUEGO`) y genera el QR con api.qrserver.com (necesita internet).
