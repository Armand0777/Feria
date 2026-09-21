// Carga de las redes neuronales de MediaPipe. La librería (y los modelos) se
// descargan solo si el jugador elige control con cámara, y cada modelo se
// crea una sola vez y se reutiliza entre partidas.
//
// El runtime WebAssembly se sirve desde nuestro propio sitio (Vite lo copia
// al build). Los modelos .task se buscan primero en /modelos/ (public/modelos)
// para funcionar sin internet en la feria; si no están, se bajan del CDN de
// Google.
import wasmLoaderPath from '@mediapipe/tasks-vision/vision_wasm_internal.js?url'
import wasmBinaryPath from '@mediapipe/tasks-vision/vision_wasm_internal.wasm?url'

export const MODELOS = {
  mano: {
    nombre: 'MediaPipe Gesture Recognizer',
    archivo: 'gesture_recognizer.task',
    remoto:
      'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task',
  },
  cara: {
    nombre: 'MediaPipe Face Landmarker',
    archivo: 'face_landmarker.task',
    remoto:
      'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
  },
}

async function rutaModelo({ archivo, remoto }) {
  const local = `/modelos/${archivo}`
  try {
    const r = await fetch(local, { method: 'HEAD' })
    // Si el archivo no existe, algunos servidores devuelven index.html con 200
    const tipo = r.headers.get('content-type') || ''
    if (r.ok && !tipo.includes('text/html')) return local
  } catch {
    // Sin copia local: usamos el CDN
  }
  return remoto
}

async function crearDetector(tipo) {
  const vision = await import('@mediapipe/tasks-vision')
  const fileset = { wasmLoaderPath, wasmBinaryPath }
  const modelAssetPath = await rutaModelo(MODELOS[tipo])

  const crear = (delegate) => {
    const baseOptions = { modelAssetPath, delegate }
    if (tipo === 'mano') {
      return vision.GestureRecognizer.createFromOptions(fileset, {
        baseOptions,
        runningMode: 'VIDEO',
        numHands: 1,
      })
    }
    return vision.FaceLandmarker.createFromOptions(fileset, {
      baseOptions,
      runningMode: 'VIDEO',
      numFaces: 1,
      outputFaceBlendshapes: true,
    })
  }

  // La GPU (WebGL) es mucho más rápida, pero no todos los equipos la
  // soportan: si falla, la misma red corre en CPU
  let detector
  try {
    detector = await crear('GPU')
  } catch {
    detector = await crear('CPU')
  }

  const conexiones =
    tipo === 'mano'
      ? vision.GestureRecognizer.HAND_CONNECTIONS
      : [...vision.FaceLandmarker.FACE_LANDMARKS_FACE_OVAL, ...vision.FaceLandmarker.FACE_LANDMARKS_LIPS]

  return { detector, conexiones }
}

const cache = {}

export function cargarModelo(tipo) {
  if (!cache[tipo]) {
    cache[tipo] = crearDetector(tipo).catch((error) => {
      // Permite reintentar (p. ej. si volvió el internet)
      delete cache[tipo]
      throw error
    })
  }
  return cache[tipo]
}

// Se llama al elegir el control en la configuración, para que la red ya esté
// lista cuando empiece la partida
export function precargarModelo(tipo) {
  if (!MODELOS[tipo]) return
  cargarModelo(tipo).catch(() => {})
}
