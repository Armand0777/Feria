# GeoRunner — Feria de Ingeniería de Sistemas

App web (React 19 + Vite 8 + Tailwind v4) con juegos para una feria universitaria: un endless runner estilo Geometry Dash (Estación 1), un Versus local de 2 jugadores, un 3 en raya (Estación 2) y una pantalla de ranking en vivo para TV. Los puntajes se guardan en Supabase.

- Producción: https://feria-opal.vercel.app/ (Vercel) · Repo: https://github.com/Armand0777/Feria
- Código, comentarios, nombres y mensajes de commit en español.

## Comandos

- `npm run dev` — Vite con `--host` (accesible desde celulares en la misma red)
- `npm run build` / `npm run preview`
- `npm run lint` — oxlint (`.oxlintrc.json`)
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
- `src/pages/` — `RankingTV` (ruta `/ranking-tv`) y `ResultadoVersus`.
- `src/lib/audio.js` — singleton `audio`: efectos con Web Audio API y música en bucle con `<audio>` (`public/musica-fondo.mp3`). Tecla M = mute.
- `src/lib/supabase.js` — cliente Supabase.
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
- Muerte: `terminado = true` y `generarParticulas()` (que también detiene la música). Se animan 60 frames de explosión y `GameCanvas` muestra el overlay 1 s después.

## Supabase

Tabla `puntajes`: `id`, `nombre`, `color`, `puntaje`, `juego` (`'geo-runner'`), `creado_en`. Se inserta desde `App.jsx` (al salir) y `ResultadoFinal.jsx` (botón guardar). `Ranking` y `RankingTV` leen el top 10 y se suscriben a INSERT por Realtime (`postgres_changes`). `RankingTV` además refresca cada 30 s y cuenta los inserts del día.

## Despliegue

Vercel, sitio estático. `CodigoQR.jsx` tiene la URL pública hardcodeada (`URL_JUEGO`) y genera el QR con api.qrserver.com (necesita internet).
