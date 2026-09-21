// Canvas nítido: la resolución interna del canvas pasa a ser su tamaño en
// pantalla × la densidad de píxeles del dispositivo. Antes el juego se
// dibujaba en 700×320 y el navegador lo estiraba (borroso en celulares y en
// laptops a pantalla completa). Quien dibuja sigue usando coordenadas
// lógicas y escala con ctx.setTransform.

// Tope de píxeles para no castigar el rendimiento en pantallas 4K
const MAX_PIXELES = 2_400_000

// Ajusta canvas.width/height al tamaño real. Devuelve true si cambió (cambiar
// el tamaño borra el canvas, así que hay que volver a dibujar).
export function ajustarResolucion(canvas) {
  const dpr = window.devicePixelRatio || 1
  let w = Math.round(canvas.clientWidth * dpr)
  let h = Math.round(canvas.clientHeight * dpr)
  if (!w || !h) return false

  if (w * h > MAX_PIXELES) {
    const f = Math.sqrt(MAX_PIXELES / (w * h))
    w = Math.round(w * f)
    h = Math.round(h * f)
  }

  if (canvas.width === w && canvas.height === h) return false
  canvas.width = w
  canvas.height = h
  return true
}

// Mantiene el canvas nítido aunque cambie de tamaño (girar el celular,
// redimensionar la ventana). `alCambiar` se llama después de cada ajuste.
export function observarResolucion(canvas, alCambiar) {
  const ajustar = () => {
    if (ajustarResolucion(canvas)) alCambiar?.()
  }
  ajustar()
  const observador = new ResizeObserver(ajustar)
  observador.observe(canvas)
  return () => observador.disconnect()
}

// Para los canvas chicos de vista previa: prepara la resolución y deja el
// contexto escalado para dibujar en coordenadas lógicas (ancho × alto)
export function contextoHD(canvas, ancho, alto) {
  ajustarResolucion(canvas)
  const ctx = canvas.getContext('2d')
  ctx.setTransform(canvas.width / ancho, 0, 0, canvas.height / alto, 0, 0)
  return ctx
}
