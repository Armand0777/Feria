// Bucle de paso fijo: la simulación avanza siempre a 60 pasos por segundo,
// sin importar los Hz de la pantalla (60, 120, 144…) ni si el control con
// cámara/IA hace caer los FPS. Así el juego va igual de rápido — y suma los
// mismos puntos — en cualquier dispositivo. El dibujo se hace una vez por
// cuadro.

export const PASO_MS = 1000 / 60

// Tope de tiempo acumulado: si la pestaña estuvo oculta no queremos simular
// de golpe varios segundos atrasados
const MAX_ACUMULADO_MS = 250

// Tolerancia para el jitter de requestAnimationFrame: en una pantalla de
// 60 Hz un cuadro puede durar 16.5 ms en vez de 16.67 — sin esto a veces
// tocarían 0 pasos y al siguiente 2, y el movimiento se vería a saltos
const TOLERANCIA_MS = 2

export function crearReloj() {
  return { ultimo: null, acumulado: 0 }
}

// Devuelve cuántos pasos de simulación tocan en este cuadro. `ahora` es el
// timestamp que requestAnimationFrame le pasa al callback.
export function pasosPendientes(reloj, ahora) {
  if (reloj.ultimo === null) reloj.ultimo = ahora
  reloj.acumulado += Math.min(ahora - reloj.ultimo, MAX_ACUMULADO_MS)
  reloj.ultimo = ahora

  const pasos = Math.floor((reloj.acumulado + TOLERANCIA_MS) / PASO_MS)
  reloj.acumulado -= pasos * PASO_MS
  return pasos
}
