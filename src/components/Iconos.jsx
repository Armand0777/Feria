// Íconos SVG propios: se ven igual en Windows, Android e iOS (los emojis no)
const TRAZOS = {
  pausa: <path d="M7 5h3v14H7zM14 5h3v14h-3z" fill="currentColor" stroke="none" />,
  play: <path d="M8 5l11 7-11 7z" fill="currentColor" stroke="none" />,
  volumen: (
    <>
      <path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" stroke="none" />
      <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" />
    </>
  ),
  silencio: (
    <>
      <path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" stroke="none" />
      <path d="M16 9l5 6M21 9l-5 6" />
    </>
  ),
  reintentar: <path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v5h5" />,
  salir: <path d="M6 6l12 12M18 6L6 18" />,
  versus: <path d="M4 4l9 9M20 4l-9 9M6 15l3 3M18 15l-3 3M4 20l3-3M20 20l-3-3" />,
  cuadricula: <path d="M9 4v16M15 4v16M4 9h16M4 15h16" />,
  ajustes: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
    </>
  ),
  volver: <path d="M15 5l-7 7 7 7" />,
}

export default function Icono({ nombre, tamano = 16 }) {
  return (
    <svg
      width={tamano}
      height={tamano}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      {TRAZOS[nombre]}
    </svg>
  )
}
