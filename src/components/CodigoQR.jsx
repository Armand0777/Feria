// URL pública del juego — actualizar aquí si cambia el dominio de despliegue
export const URL_JUEGO = 'https://feria-opal.vercel.app/'

// Dos formas: `flotante` (esquina fija, para la pantalla de TV) o como
// tarjeta dentro de la página (inicio). En celulares no se muestra: quien lo
// ve ya está jugando desde el teléfono.
export default function CodigoQR({ tamano = 64, flotante = true }) {
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=${tamano * 2}x${tamano * 2}&data=${encodeURIComponent(URL_JUEGO)}`

  const imagen = (
    <img
      src={qrSrc}
      alt="Código QR para jugar"
      width={tamano}
      height={tamano}
      style={{ display: 'block', borderRadius: 4, background: '#fff', padding: 3, flexShrink: 0 }}
    />
  )

  if (!flotante) {
    return (
      <div className="card-dark hidden items-center gap-4 md:flex">
        {imagen}
        <div>
          <span className="label-section">Juega desde tu celular</span>
          <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>
            Escanea el código con la cámara y juega en tu teléfono. Tu puntaje entra al mismo ranking.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="hidden md:flex"
      style={{
        position: 'fixed',
        bottom: 12,
        left: 12,
        zIndex: 50,
        alignItems: 'center',
        gap: 8,
        background: 'rgba(15,15,24,0.85)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 10,
        padding: 6,
      }}
    >
      {imagen}
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: '#94a3b8',
          maxWidth: 70,
          lineHeight: 1.3,
        }}
      >
        Escanea y juega
      </span>
    </div>
  )
}
