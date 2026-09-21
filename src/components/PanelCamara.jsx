import { useEffect, useRef, useState } from 'react'
import { BOCA_ABRE, ControlCamara } from '../ia/controlCamara'
import { MODELOS } from '../ia/modelos'

const INSTRUCCIONES = {
  mano: [
    { icono: '✊', gesto: 'Cierra el puño', accion: 'presionar · saltar' },
    { icono: '🖐', gesto: 'Abre la mano', accion: 'soltar' },
  ],
  cara: [
    { icono: '😮', gesto: 'Abre la boca', accion: 'presionar · saltar' },
    { icono: '😐', gesto: 'Ciérrala', accion: 'soltar' },
  ],
}

const COLOR_SUELTO = '#22d3ee'
const COLOR_PRESIONANDO = '#22c55e'

function mensajeError(error) {
  switch (error?.name) {
    case 'SinContextoSeguro':
      return 'La cámara solo funciona con HTTPS o en localhost.'
    case 'NotAllowedError':
      return 'No se dio permiso para usar la cámara. Actívalo desde el candado de la barra de direcciones.'
    case 'NotFoundError':
    case 'OverconstrainedError':
      return 'No se encontró ninguna cámara en este equipo.'
    case 'NotReadableError':
      return 'La cámara está siendo usada por otra aplicación.'
    case 'SinWebGL':
      return 'Este equipo tiene desactivada la aceleración gráfica (WebGL), que la red neuronal necesita. Actívala en la configuración del navegador.'
    case 'ErrorInferencia':
      return 'La red neuronal dejó de funcionar en este equipo.'
    default:
      return 'No se pudo cargar la red neuronal. ¿Hay conexión a internet?'
  }
}

// Dibuja sobre el video los puntos que detectó la red: el esqueleto de la
// mano (21 puntos) o el contorno de la cara y los labios
function dibujarLectura(canvas, video, lectura) {
  if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
  }
  const ctx = canvas.getContext('2d')
  const w = canvas.width
  const h = canvas.height
  ctx.clearRect(0, 0, w, h)
  if (!lectura.puntos) return

  const color = lectura.activo ? COLOR_PRESIONANDO : COLOR_SUELTO
  ctx.strokeStyle = color
  ctx.lineWidth = 3
  ctx.shadowBlur = 8
  ctx.shadowColor = color
  ctx.beginPath()
  for (const { start, end } of lectura.conexiones) {
    const a = lectura.puntos[start]
    const b = lectura.puntos[end]
    ctx.moveTo(a.x * w, a.y * h)
    ctx.lineTo(b.x * w, b.y * h)
  }
  ctx.stroke()
  ctx.shadowBlur = 0

  // La cara tiene 478 puntos: con las líneas basta. La mano solo 21.
  if (lectura.puntos.length <= 21) {
    ctx.fillStyle = '#ffffff'
    for (const p of lectura.puntos) {
      ctx.beginPath()
      ctx.arc(p.x * w, p.y * h, 4, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

export default function PanelCamara({ tipo, onPresionar, onSoltar }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const etiquetaRef = useRef(null)
  const porcentajeRef = useRef(null)
  const barraRef = useRef(null)
  const estadoRef = useRef(null)
  const msRef = useRef(null)
  const accionesRef = useRef({ onPresionar, onSoltar })

  const [estado, setEstado] = useState('cargando')
  const [error, setError] = useState(null)

  useEffect(() => {
    accionesRef.current = { onPresionar, onSoltar }
  })

  useEffect(() => {
    // Las lecturas llegan ~30 veces por segundo: se escriben directo en el
    // DOM en vez de pasar por el estado de React, para no re-renderizar
    const mostrarLectura = (lectura) => {
      dibujarLectura(canvasRef.current, videoRef.current, lectura)
      const pct = Math.round(lectura.confianza * 100)
      const color = lectura.activo ? COLOR_PRESIONANDO : COLOR_SUELTO
      etiquetaRef.current.textContent = lectura.etiqueta
      porcentajeRef.current.textContent = `${pct}%`
      barraRef.current.style.width = `${pct}%`
      barraRef.current.style.background = color
      estadoRef.current.textContent = lectura.activo ? '▲ PRESIONANDO' : 'SUELTO'
      estadoRef.current.style.color = lectura.activo ? COLOR_PRESIONANDO : 'var(--muted)'
      msRef.current.textContent = `${lectura.ms.toFixed(0)} ms`
    }

    const mostrarError = (e) => {
      setError(mensajeError(e))
      setEstado('error')
    }

    const control = new ControlCamara(tipo, {
      onPresionar: () => accionesRef.current.onPresionar?.(),
      onSoltar: () => accionesRef.current.onSoltar?.(),
      onLectura: mostrarLectura,
      onError: mostrarError,
    })

    control
      .iniciar(videoRef.current)
      .then(() => {
        if (!control.detenido) setEstado('listo')
      })
      .catch((e) => {
        if (control.detenido) return
        console.error(e)
        mostrarError(e)
      })

    return () => control.detener()
  }, [tipo])

  return (
    <div className="card-dark" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="label-section" style={{ margin: 0 }}>
          🧠 CONTROL CON IA · {tipo === 'mano' ? 'MANO' : 'CARA'}
        </span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color:
              estado === 'listo' ? 'var(--success)' : estado === 'error' ? 'var(--danger)' : 'var(--gold)',
          }}
        >
          {estado === 'listo' ? '● EN VIVO' : estado === 'error' ? '● SIN CÁMARA' : '● CARGANDO'}
        </span>
      </div>

      {/* Video en espejo + lo que "ve" la red */}
      <div
        style={{
          position: 'relative',
          aspectRatio: '4 / 3',
          borderRadius: 8,
          overflow: 'hidden',
          background: '#000',
        }}
      >
        <video
          ref={videoRef}
          playsInline
          muted
          style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
        />
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: 'scaleX(-1)',
          }}
        />
        {estado !== 'listo' && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: 16,
              textAlign: 'center',
              background: 'rgba(10,10,26,0.85)',
            }}
          >
            {estado === 'cargando' ? (
              <>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold)' }}>
                  Cargando red neuronal y cámara…
                </p>
                <p style={{ fontSize: 11, color: 'var(--muted)' }}>La primera vez tarda unos segundos</p>
              </>
            ) : (
              <>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--danger)' }}>{error}</p>
                <p style={{ fontSize: 11, color: 'var(--muted)' }}>Puedes seguir jugando con teclado o clic.</p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Lectura en vivo de la red */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700 }}>
          <span ref={etiquetaRef}>—</span>
          <span ref={porcentajeRef} style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
            0%
          </span>
        </div>
        <div
          style={{
            position: 'relative',
            height: 6,
            marginTop: 6,
            borderRadius: 3,
            overflow: 'hidden',
            background: 'var(--surface2)',
          }}
        >
          <div ref={barraRef} style={{ width: '0%', height: '100%', background: COLOR_SUELTO }} />
          {tipo === 'cara' && (
            <div
              title="Umbral para presionar"
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: `${BOCA_ABRE * 100}%`,
                width: 2,
                background: '#ffffffaa',
              }}
            />
          )}
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 6,
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'var(--muted)',
          }}
        >
          <span ref={estadoRef}>SUELTO</span>
          <span>
            {tipo === 'mano' ? 'confianza' : 'apertura'} · inferencia <span ref={msRef}>–</span>
          </span>
        </div>
      </div>

      {/* Instrucciones */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {INSTRUCCIONES[tipo].map(({ icono, gesto, accion }) => (
          <div
            key={gesto}
            style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--muted)' }}
          >
            <span>
              {icono} {gesto}
            </span>
            <span style={{ color: 'var(--accent2)' }}>{accion}</span>
          </div>
        ))}
      </div>

      <p style={{ fontSize: 10, color: 'var(--muted)', lineHeight: 1.4 }}>
        Red neuronal: {MODELOS[tipo].nombre}. Todo se procesa en este navegador; el video no se envía a
        ningún servidor.
      </p>
    </div>
  )
}
