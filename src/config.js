// Configuración del juego: el estudiante puede editar estos valores durante la feria
const config = {
  // Modo de personaje con el que arranca la partida (cubo, nave, bola, ovni, ola, robot)
  modoInicial: 'cubo',
  // Nivel de dificultad (facil, normal, dificil, extremo)
  nivel: 'facil',
  jugador: {
    // Nombre que se muestra y se guarda en el ranking
    nombre: 'Jugador1',
    // Color del cubo y su brillo neón
    color: '#6366f1',
    // Color de fondo del canvas, oscuro estilo Geometry Dash
    colorFondo: '#0a0a1a',
  },
  juego: {
    // Velocidad de desplazamiento de los obstáculos al iniciar la partida
    velocidadInicial: 5,
    // Fuerza de gravedad aplicada al cubo en cada frame
    gravedad: 0.55,
    // Velocidad vertical aplicada al saltar (salto fijo, negativa = hacia arriba)
    altoDeSalto: -9.5,
  },
}

export default config
