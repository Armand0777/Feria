// Control del juego con la cámara: cada cuadro del video pasa por una red
// neuronal y el resultado se traduce en "presionar" / "soltar", exactamente
// las mismas dos señales que produce el teclado. El motor del juego no se
// entera de que lo controla una IA.
import { cargarModelo } from './modelos'

// Mano: el Gesture Recognizer clasifica la mano en 7 gestos; solo el puño
// cuenta como "presionar", con al menos esta confianza
const CONFIANZA_MINIMA_PUNO = 0.5

// Cara: "jawOpen" va de 0 (boca cerrada) a 1 (bien abierta). Dos umbrales
// distintos (histéresis) evitan que tiemble justo en el límite
export const BOCA_ABRE = 0.45
const BOCA_CIERRA = 0.3

// Para soltar exigimos 2 cuadros seguidos sin el gesto: un cuadro dudoso de
// la red no corta el salto a la mitad. Presionar, en cambio, es inmediato.
const CUADROS_PARA_SOLTAR = 2

const NOMBRES_GESTO = {
  None: '✋ Mano (sin gesto)',
  Closed_Fist: '✊ Puño',
  Open_Palm: '🖐 Mano abierta',
  Pointing_Up: '☝ Apuntando',
  Thumb_Up: '👍 Pulgar arriba',
  Thumb_Down: '👎 Pulgar abajo',
  Victory: '✌ Victoria',
  ILoveYou: '🤟 Te quiero',
}

function errorConNombre(name, message) {
  const error = new Error(message)
  error.name = name
  return error
}

export class ControlCamara {
  constructor(tipo, { onPresionar, onSoltar, onLectura }) {
    this.tipo = tipo
    this.onPresionar = onPresionar
    this.onSoltar = onSoltar
    this.onLectura = onLectura

    this.video = null
    this.stream = null
    this.modelo = null
    this.detenido = false
    this.activo = false
    this.cuadrosSinGesto = 0
    this.idCuadro = null
    this.usaVideoFrameCallback = false
  }

  async iniciar(video) {
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      throw errorConNombre('SinContextoSeguro', 'La cámara requiere HTTPS o localhost')
    }

    // Cámara y modelo en paralelo: mientras la persona acepta el permiso,
    // la red neuronal ya se va descargando
    const [stream, modelo] = await Promise.all([
      navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      }),
      cargarModelo(this.tipo),
    ])

    if (this.detenido) {
      stream.getTracks().forEach((t) => t.stop())
      return
    }

    this.stream = stream
    this.modelo = modelo
    this.video = video
    video.srcObject = stream
    try {
      await video.play()
    } catch (error) {
      // play() se aborta si nos detuvieron mientras arrancaba: no es un error
      if (this.detenido) return
      throw error
    }
    if (this.detenido) return

    this.usaVideoFrameCallback = typeof video.requestVideoFrameCallback === 'function'
    this.programar()
  }

  detener() {
    this.detenido = true
    if (this.idCuadro !== null) {
      if (this.usaVideoFrameCallback) this.video.cancelVideoFrameCallback(this.idCuadro)
      else cancelAnimationFrame(this.idCuadro)
      this.idCuadro = null
    }
    // Nunca dejar el juego "presionado" al apagar la cámara
    if (this.activo) {
      this.activo = false
      this.onSoltar?.()
    }
    this.stream?.getTracks().forEach((t) => t.stop())
    if (this.video) this.video.srcObject = null
  }

  // Procesa cada cuadro nuevo del video (requestVideoFrameCallback), o en
  // cada repintado si el navegador no lo soporta
  programar() {
    if (this.usaVideoFrameCallback) {
      this.idCuadro = this.video.requestVideoFrameCallback(() => this.procesar())
    } else {
      this.idCuadro = requestAnimationFrame(() => this.procesar())
    }
  }

  procesar() {
    if (this.detenido) return

    if (this.video.readyState >= 2) {
      const inicio = performance.now()
      const lectura = this.tipo === 'mano' ? this.leerMano(inicio) : this.leerCara(inicio)
      lectura.ms = performance.now() - inicio
      this.aplicar(lectura.gesto)
      lectura.activo = this.activo
      lectura.conexiones = this.modelo.conexiones
      this.onLectura?.(lectura)
    }

    this.programar()
  }

  leerMano(ahora) {
    const r = this.modelo.detector.recognizeForVideo(this.video, ahora)
    const puntos = r.landmarks?.[0] ?? null
    const gesto = r.gestures?.[0]?.[0] ?? null

    return {
      puntos,
      etiqueta: gesto ? (NOMBRES_GESTO[gesto.categoryName] ?? gesto.categoryName) : 'Sin mano a la vista',
      confianza: gesto?.score ?? 0,
      gesto: gesto?.categoryName === 'Closed_Fist' && gesto.score >= CONFIANZA_MINIMA_PUNO,
    }
  }

  leerCara(ahora) {
    const r = this.modelo.detector.detectForVideo(this.video, ahora)
    const puntos = r.faceLandmarks?.[0] ?? null
    const categorias = r.faceBlendshapes?.[0]?.categories ?? []
    const apertura = categorias.find((c) => c.categoryName === 'jawOpen')?.score ?? 0
    const abierta = this.activo ? apertura > BOCA_CIERRA : apertura > BOCA_ABRE

    return {
      puntos,
      etiqueta: !puntos ? 'Sin cara a la vista' : abierta ? '😮 Boca abierta' : '😐 Boca cerrada',
      confianza: apertura,
      gesto: abierta,
    }
  }

  aplicar(hayGesto) {
    if (hayGesto) {
      this.cuadrosSinGesto = 0
      if (!this.activo) {
        this.activo = true
        this.onPresionar?.()
      }
    } else if (this.activo) {
      this.cuadrosSinGesto++
      if (this.cuadrosSinGesto >= CUADROS_PARA_SOLTAR) {
        this.activo = false
        this.onSoltar?.()
      }
    }
  }
}
