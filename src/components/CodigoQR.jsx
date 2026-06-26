// URL pública del juego — actualizar aquí si cambia el dominio de despliegue
export const URL_JUEGO = 'https://feria-opal.vercel.app/'

export default function CodigoQR({ tamano = 64 }) {
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=${tamano * 2}x${tamano * 2}&data=${encodeURIComponent(URL_JUEGO)}`

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 12,
        left: 12,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: 'rgba(15,15,24,0.85)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 10,
        padding: 6,
      }}
    >
      <img
        src={qrSrc}
        alt="Código QR para jugar"
        width={tamano}
        height={tamano}
        style={{ display: 'block', borderRadius: 4, background: '#fff' }}
      />
      <span
        style={{
          fontFamily: 'monospace',
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
