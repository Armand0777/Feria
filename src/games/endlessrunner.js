import { audio } from '../lib/audio.js'

export const MODOS = {
  cubo: { id: 'cubo', nombre: 'Cubo', icono: '⬛', color: '#6366f1', descripcion: 'Salta al hacer clic' },
  nave: { id: 'nave', nombre: 'Nave', icono: '🚀', color: '#22d3ee', descripcion: 'Mantén para subir' },
  bola: { id: 'bola', nombre: 'Bola', icono: '⚽', color: '#a855f7', descripcion: 'Clic invierte gravedad' },
  ovni: { id: 'ovni', nombre: 'OVNI', icono: '🛸', color: '#f97316', descripcion: 'Multi-salto en el aire' },
  ola: { id: 'ola', nombre: 'Ola', icono: '〰', color: '#10b981', descripcion: 'Mantén para subir en diagonal' },
  robot: { id: 'robot', nombre: 'Robot', icono: '🤖', color: '#fbbf24', descripcion: 'Más tiempo = más alto' },
}

const SUELO_ALTO = 40
const TECHO = 10

// Niveles de dificultad: controlan la curva de velocidad/frecuencia de
// obstáculos y qué combos compuestos pueden aparecer. "umbralComplejos" es
// el puntaje a partir del cual se habilitan sierra/picoDoble/etc (antes era
// un valor fijo de 300 para todos).
export const NIVELES = {
  facil: {
    id: 'facil',
    nombre: 'Fácil',
    icono: '🟢',
    color: '#22c55e',
    descripcion: 'El de siempre',
    velocidadInicial: 5,
    incrementoVelocidad: 0.3,
    framesIncrementoVel: 200,
    frecInicial: 100,
    frecMinima: 60,
    framesDecaerFrec: 400,
    umbralComplejos: 300,
    combos: [],
  },
  normal: {
    id: 'normal',
    nombre: 'Normal',
    icono: '🟡',
    color: '#fbbf24',
    descripcion: 'Un poco más exigente',
    velocidadInicial: 6,
    incrementoVelocidad: 0.35,
    framesIncrementoVel: 180,
    frecInicial: 90,
    frecMinima: 55,
    framesDecaerFrec: 350,
    umbralComplejos: 150,
    combos: ['sierraPico', 'vallePendientes'],
  },
  dificil: {
    id: 'dificil',
    nombre: 'Difícil',
    icono: '🟠',
    color: '#f97316',
    descripcion: 'Obstáculos compuestos',
    velocidadInicial: 7,
    incrementoVelocidad: 0.4,
    framesIncrementoVel: 150,
    frecInicial: 80,
    frecMinima: 50,
    framesDecaerFrec: 300,
    umbralComplejos: 50,
    combos: ['sierraPico', 'vallePendientes', 'picosCuadruples', 'cascadaPlataformas', 'gravedadAlterna'],
  },
  extremo: {
    id: 'extremo',
    nombre: 'Extremo',
    icono: '🔴',
    color: '#ef4444',
    descripcion: 'Sin piedad',
    velocidadInicial: 8,
    incrementoVelocidad: 0.5,
    framesIncrementoVel: 120,
    frecInicial: 70,
    frecMinima: 45,
    framesDecaerFrec: 250,
    umbralComplejos: 0,
    combos: [
      'sierraPico',
      'vallePendientes',
      'picosCuadruples',
      'cascadaPlataformas',
      'gravedadAlterna',
      'picoDobleSierra',
    ],
  },
}

// Robot: salto continuo mientras se mantiene presionado, interpola entre
// un mínimo (tap corto) y un máximo (sostenido hasta el tope de frames)
const ROBOT_MIN_VY = -7
const ROBOT_MAX_VY = -13
const ROBOT_MAX_FRAMES_CARGA = 18 // ≈ 0.3s a 60fps

function lerp(a, b, t) {
  const tClamp = Math.max(0, Math.min(1, t))
  return a + (b - a) * tClamp
}

// Coyote time: margen para saltar justo después de salir de una plataforma
const COYOTE_FRAMES = 6 // ≈ 0.1s a 60fps — solo Cubo y Robot

const COLORES_ORBE = {
  amarillo: '#fde047',
  rosa: '#f9a8d4',
  rojo: '#ef4444',
  azul: '#60a5fa',
  verde: '#4ade80',
  negro: '#475569',
}

const COLORES_PAD = {
  amarillo: '#fde047',
  rosa: '#f9a8d4',
  rojo: '#ef4444',
  azul: '#60a5fa',
}

function generarVentanas() {
  return Array.from({ length: Math.floor(Math.random() * 8 + 4) }, () => ({
    x: Math.random(),
    y: Math.random(),
    encendida: Math.random() > 0.4,
  }))
}

const TRAIL_CONFIG = {
  cubo: { forma: 'cuadrado', color: null, cantidad: 2, vida: 18, tamano: 8, offsetX: -2, offsetY: 0 },
  nave: { forma: 'linea', color: '#22d3ee', cantidad: 3, vida: 14, tamano: 3, offsetX: 0, offsetY: 0 },
  bola: { forma: 'circulo', color: '#a855f7', cantidad: 3, vida: 20, tamano: 6, offsetX: 0, offsetY: 0 },
  ovni: { forma: 'circulo', color: '#f97316', cantidad: 4, vida: 12, tamano: 4, offsetX: 0, offsetY: 'debajo' },
  ola: { forma: 'rombo', color: '#10b981', cantidad: 4, vida: 10, tamano: 5, offsetX: -4, offsetY: 0 },
  robot: { forma: 'cuadrado', color: '#fbbf24', cantidad: 2, vida: 22, tamano: 7, offsetX: -2, offsetY: 4 },
}

export function dibujarForma(ctx, modo, x, y, ancho, alto, color, rotacion, squash = 0) {
  const cx = x + ancho / 2
  const cy = y + alto / 2

  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(((rotacion || 0) * Math.PI) / 180)
  ctx.shadowBlur = 14
  ctx.shadowColor = color

  switch (modo) {
    case 'cubo': {
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.roundRect(-ancho / 2, -alto / 2, ancho, alto, 6)
      ctx.fill()
      ctx.shadowBlur = 0
      ctx.strokeStyle = 'rgba(255,255,255,0.4)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(-ancho / 2, -alto / 2)
      ctx.lineTo(ancho / 2, alto / 2)
      ctx.stroke()
      break
    }

    case 'nave': {
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.moveTo(ancho / 2, 0)
      ctx.lineTo(-ancho / 2, -alto / 2)
      ctx.lineTo(-ancho / 2, alto / 2)
      ctx.closePath()
      ctx.fill()
      ctx.shadowBlur = 0

      ctx.fillStyle = 'rgba(255,255,255,0.4)'
      ctx.fillRect(-ancho / 2 - 6, -alto / 4, 6, alto / 2)

      ctx.strokeStyle = color
      ctx.lineWidth = 2
      ctx.globalAlpha = 0.6
      ctx.beginPath()
      ctx.moveTo(-ancho / 2 - 8, 0)
      ctx.lineTo(-ancho / 2 - 18, 0)
      ctx.stroke()
      ctx.globalAlpha = 0.3
      ctx.beginPath()
      ctx.moveTo(-ancho / 2 - 18, 0)
      ctx.lineTo(-ancho / 2 - 28, 0)
      ctx.stroke()
      ctx.globalAlpha = 1
      break
    }

    case 'bola': {
      const radio = ancho / 2
      // Squash & stretch al rebotar en suelo/techo
      ctx.scale(1 + squash * 0.3, 1 - squash * 0.3)
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(0, 0, radio, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0

      ctx.fillStyle = 'rgba(255,255,255,0.2)'
      ctx.beginPath()
      ctx.arc(0, 0, radio * 0.5, 0, Math.PI * 2)
      ctx.fill()

      ctx.strokeStyle = 'rgba(255,255,255,0.3)'
      ctx.lineWidth = 1.5
      for (let i = 0; i < 4; i++) {
        const ang = (Math.PI / 2) * i
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.lineTo(Math.cos(ang) * radio, Math.sin(ang) * radio)
        ctx.stroke()
      }
      break
    }

    case 'ovni': {
      const w2 = ancho * 1.2
      const h2 = alto * 0.6

      ctx.fillStyle = color
      ctx.beginPath()
      ctx.ellipse(0, 0, w2 / 2, h2 / 2, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0

      ctx.fillStyle = 'rgba(255,255,255,0.5)'
      ctx.beginPath()
      ctx.ellipse(0, -h2 / 4, w2 / 4, h2 / 2, 0, Math.PI, Math.PI * 2)
      ctx.fill()

      const parpadeo = Math.abs(Math.sin(Date.now() * 0.005))
      ctx.fillStyle = `rgba(255,255,255,${0.4 + 0.4 * parpadeo})`
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath()
        ctx.arc(i * (w2 / 4), h2 / 2, 2, 0, Math.PI * 2)
        ctx.fill()
      }
      break
    }

    case 'ola': {
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.moveTo(0, -alto / 2)
      ctx.lineTo(ancho / 2, 0)
      ctx.lineTo(0, alto / 2)
      ctx.lineTo(-ancho / 2, 0)
      ctx.closePath()
      ctx.fill()
      ctx.shadowBlur = 0

      const opacidades = [0.5, 0.3, 0.2, 0.1]
      opacidades.forEach((op, i) => {
        const offset = -(i + 1) * (ancho * 0.7)
        const escala = 1 - (i + 1) * 0.15
        ctx.globalAlpha = op
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.moveTo(offset, (-alto / 2) * escala)
        ctx.lineTo(offset + (ancho / 2) * escala, 0)
        ctx.lineTo(offset, (alto / 2) * escala)
        ctx.lineTo(offset - (ancho / 2) * escala, 0)
        ctx.closePath()
        ctx.fill()
      })
      ctx.globalAlpha = 1
      break
    }

    case 'robot': {
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.roundRect(-ancho / 2, -alto / 2 + 6, ancho, alto - 6, 4)
      ctx.fill()
      ctx.shadowBlur = 0

      const cabezaAncho = ancho * 0.7
      const cabezaAlto = alto * 0.4
      const cabezaY = -alto / 2 - cabezaAlto + 6

      ctx.fillStyle = color
      ctx.strokeStyle = 'rgba(0,0,0,0.3)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.roundRect(-cabezaAncho / 2, cabezaY, cabezaAncho, cabezaAlto, 3)
      ctx.fill()
      ctx.stroke()

      ctx.fillStyle = 'white'
      const ojoY = cabezaY + cabezaAlto / 2 - 2
      ctx.fillRect(-cabezaAncho / 4 - 2, ojoY, 4, 4)
      ctx.fillRect(cabezaAncho / 4 - 2, ojoY, 4, 4)

      ctx.strokeStyle = color
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(0, cabezaY)
      ctx.lineTo(0, cabezaY - 10)
      ctx.stroke()
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(0, cabezaY - 12, 2, 0, Math.PI * 2)
      ctx.fill()
      break
    }
  }

  ctx.restore()
}

function elegirModoAleatorioDistinto(actual) {
  const modos = Object.keys(MODOS).filter((m) => m !== actual)
  return modos[Math.floor(Math.random() * modos.length)]
}

export class EndlessRunner {
  constructor(canvas, config, modoInicial = 'cubo') {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.config = config
    this.modoActual = modoInicial

    this.estrellas = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radio: 1 + Math.random(),
      opacidad: 0.3 + Math.random() * 0.7,
    }))

    this.lineasVelocidad = Array.from({ length: 8 }, (_, i) => ({
      x: Math.random() * canvas.width,
      y: (canvas.height / 8) * i + 10,
      largo: 60 + Math.random() * 60,
      opacidad: 0.04 + Math.random() * 0.04,
    }))

    this.reset()
  }

  reset() {
    this.jugador = {
      x: 80,
      y: this.canvas.height - SUELO_ALTO - 36,
      ancho: 36,
      alto: 36,
      velocidadY: 0,
      enSuelo: true,
      rotacion: 0,
      saltosAire: 0,
      presionando: false,
      tiempoPresion: 0,
      impulsoRestante: 0,
      impulsoIncremento: 0,
      frameUltimoSaltoOvni: -999,
      coyoteTimer: 0,
    }

    this.obstaculos = []
    this.portalesModo = []
    this.particulas = []
    this.plataformasMoviles = []
    this.orbes = []
    this.trampolin = []
    this.imanes = []
    this.slopes = []
    this.pozos = []
    this.sobrePlataforma = false
    this.plataformaActual = null
    this.squashTimer = 0
    this.puntaje = 0

    this.nivelActual = this.config.nivel || 'facil'
    this.nivelCfg = NIVELES[this.nivelActual] || NIVELES.facil

    this.velocidad = this.config.juego.velocidadInicial
    this.frameCount = 0
    this.corriendo = false
    this.terminado = false

    this.gravedadInvertida = false
    this.timerInversion = 0

    this.frecuenciaObstaculo = this.nivelCfg.frecInicial
    this.proximoObstaculo = this.nivelCfg.frecInicial
    this.proximoPortalModo = 300

    this.mensajeModo = null
    this.mensajeModoTimer = 0

    this.trail = []

    this.edificios = Array.from({ length: 6 }, (_, i) => ({
      x: i * 180,
      ancho: 60 + Math.random() * 80,
      alto: 40 + Math.random() * 80,
      color: '#1a1a3e',
      ventanas: generarVentanas(),
    }))

    this.nubes = Array.from({ length: 5 }, (_, i) => ({
      x: i * 200 + Math.random() * 100,
      y: 20 + Math.random() * 60,
      radio: 18 + Math.random() * 22,
      opacidad: 0.06 + Math.random() * 0.08,
    }))

    this.plataformas = Array.from({ length: 4 }, (_, i) => ({
      x: i * 250 + Math.random() * 100,
      y: 60 + Math.random() * 100,
      ancho: 40 + Math.random() * 60,
      alto: 8,
      color: '#2d2d5e',
    }))
  }

  iniciarPresion() {
    audio.init()

    this.corriendo = true
    if (this.intentarActivarOrbes()) return

    switch (this.modoActual) {
      case 'cubo':
        // presionando=true habilita el rebote automático: mientras se
        // mantenga sostenido, el cubo vuelve a saltar cada vez que toca
        // el suelo (igual que en Geometry Dash real)
        this.jugador.presionando = true
        this.saltar()
        break
      case 'nave':
        this.jugador.presionando = true
        break
      case 'bola':
        this.gravedadInvertida = !this.gravedadInvertida
        audio.invertirGravedad()
        break
      case 'ovni':
        if (this.jugador.saltosAire < 3) {
          // Doble-tap rápido (<6 frames ≈ 100ms) = más altura, como en GD
          const framesDesdeUltimo = this.frameCount - this.jugador.frameUltimoSaltoOvni
          const boost = framesDesdeUltimo < 6 ? 1.3 : 1.0
          const signo = this.gravedadInvertida ? -1 : 1
          // Cada salto en el aire pierde fuerza (se va "quedando sin combustible")
          const fuerza = -9 * boost * signo * (1 - this.jugador.saltosAire * 0.18)
          this.aplicarImpulso(fuerza, 3)
          this.jugador.saltosAire++
          this.jugador.enSuelo = false
          this.jugador.frameUltimoSaltoOvni = this.frameCount
          audio.salto()
        }
        break
      case 'ola':
        this.jugador.presionando = true
        break
      case 'robot':
        // El robot despega de inmediato al presionar; la altura sube
        // mientras se mantiene sostenido (no se "calcula" al soltar)
        if (this.jugador.enSuelo || this.jugador.coyoteTimer > 0) {
          this.jugador.presionando = true
          this.jugador.tiempoPresion = 0
          this.jugador.enSuelo = false
          this.jugador.coyoteTimer = 0
          audio.salto()
        }
        break
    }
  }

  soltarPresion() {
    switch (this.modoActual) {
      case 'robot':
        if (this.jugador.presionando) {
          const carga = this.jugador.tiempoPresion / ROBOT_MAX_FRAMES_CARGA
          audio.saltoRobot(carga)
          this.jugador.presionando = false
        }
        break
      case 'cubo':
      case 'nave':
      case 'ola':
        this.jugador.presionando = false
        break
    }
  }

  saltar() {
    if (this.jugador.enSuelo || this.jugador.coyoteTimer > 0) {
      const signo = this.gravedadInvertida ? -1 : 1
      this.aplicarImpulso(this.config.juego.altoDeSalto * signo, 3)
      this.jugador.enSuelo = false
      this.jugador.coyoteTimer = 0
      this.jugador.saltosAire = 0
      audio.salto()
    }
  }

  // Suaviza el inicio de un salto/impulso en lugar de asignar la velocidad de
  // golpe: arranca al 45% del objetivo y lo alcanza en `frames` (evita el
  // efecto "teletransporte" del salto brusco).
  aplicarImpulso(velocidadObjetivo, frames = 3) {
    const j = this.jugador
    const inicio = velocidadObjetivo * 0.45
    j.velocidadY = inicio
    j.impulsoRestante = frames
    j.impulsoIncremento = (velocidadObjetivo - inicio) / frames
  }

  actualizarFisica() {
    const j = this.jugador
    const gravedad = this.config.juego.gravedad
    // Signo de gravedad global — lo usan Cubo/OVNI/Robot además de Bola,
    // para que los orbes Azul/Verde (invertir gravedad) tengan efecto en
    // cualquier modo, no solo en Bola
    const signoGrav = this.gravedadInvertida ? -1 : 1

    // Mientras dura el impulso suavizado de un salto, no se le suma gravedad
    // encima (si no, el salto se sentiría igual de brusco que antes)
    const impulsoActivo = j.impulsoRestante > 0
    if (impulsoActivo) {
      j.velocidadY += j.impulsoIncremento
      j.impulsoRestante--
    }

    switch (this.modoActual) {
      case 'cubo':
        if (!impulsoActivo) j.velocidadY += gravedad * signoGrav
        if (!j.enSuelo) j.rotacion += 3
        break

      case 'nave': {
        // Easing: la velocidad se acerca suavemente a un objetivo en vez de
        // sumar/restar de golpe, da una curva más fluida al subir/bajar
        const objetivoNave = (j.presionando ? -9 : 7) * signoGrav
        j.velocidadY += (objetivoNave - j.velocidadY) * 0.15
        j.velocidadY = Math.max(-9, Math.min(9, j.velocidadY))
        j.rotacion = j.velocidadY * 2
        break
      }

      case 'bola':
        if (!impulsoActivo) {
          if (this.gravedadInvertida) j.velocidadY -= gravedad
          else j.velocidadY += gravedad
        }
        j.rotacion += 4
        break

      case 'ovni':
        if (!impulsoActivo) j.velocidadY += gravedad * 0.6 * signoGrav
        j.rotacion = Math.sin(this.frameCount * 0.1) * 5
        break

      case 'ola':
        // Sin gravedad acumulativa: velocidad diagonal fija, cambio
        // instantáneo de dirección — es el comportamiento real de Wave en GD
        // (la Wave es inmune a la inversión de gravedad de los orbes)
        j.velocidadY = j.presionando ? -6 : 6
        j.rotacion = j.presionando ? -30 : 30
        break

      case 'robot':
        if (j.presionando) {
          // Sube mientras se mantiene presionado, interpolando entre el
          // mínimo (tap corto) y el máximo (sostenido hasta el tope)
          const t = j.tiempoPresion / ROBOT_MAX_FRAMES_CARGA
          j.velocidadY = lerp(ROBOT_MIN_VY, ROBOT_MAX_VY, t) * signoGrav
          j.rotacion += 4
        } else {
          j.velocidadY += gravedad * signoGrav
          if (!j.enSuelo) j.rotacion += 4
        }
        break
    }
  }

  actualizarParallax() {
    this.edificios.forEach((e) => {
      e.x -= this.velocidad * 0.15
      if (e.x + e.ancho < 0) {
        e.x = this.canvas.width + Math.random() * 100
        e.ancho = 60 + Math.random() * 80
        e.alto = 40 + Math.random() * 80
        e.ventanas = generarVentanas()
      }
    })

    this.nubes.forEach((n) => {
      n.x -= this.velocidad * 0.3
      if (n.x + n.radio * 2 < 0) {
        n.x = this.canvas.width + Math.random() * 50
        n.y = 20 + Math.random() * 60
      }
    })

    this.plataformas.forEach((p) => {
      p.x -= this.velocidad * 0.6
      if (p.x + p.ancho < 0) {
        p.x = this.canvas.width + Math.random() * 80
        p.y = 60 + Math.random() * 100
        p.ancho = 40 + Math.random() * 60
      }
    })
  }

  actualizarTrail() {
    const cfg = TRAIL_CONFIG[this.modoActual]
    if (!cfg) return

    if (this.corriendo && !this.terminado) {
      const color = cfg.color ?? this.config.jugador.color
      const offsetY = cfg.offsetY === 'debajo' ? this.jugador.alto : cfg.offsetY

      for (let i = 0; i < cfg.cantidad; i++) {
        this.trail.push({
          x: this.jugador.x + cfg.offsetX + (Math.random() - 0.5) * 4,
          y: this.jugador.y + this.jugador.alto / 2 + offsetY + (Math.random() - 0.5) * 4,
          vida: cfg.vida,
          vidaMax: cfg.vida,
          tamano: cfg.tamano * (0.8 + Math.random() * 0.4),
          color,
          forma: cfg.forma,
          vx: -this.velocidad * 0.3 + (Math.random() - 0.5),
          vy: (Math.random() - 0.5) * 0.5,
        })
      }
    }

    this.trail = this.trail.filter((p) => p.vida > 0)
    this.trail.forEach((p) => {
      p.vida--
      p.x += p.vx
      p.y += p.vy
      p.tamano *= 0.96
    })
  }

  // ¿El jugador está en una zona X donde el suelo no existe (pozo)?
  estaSobrePozo() {
    return this.pozos.some(
      (p) => this.jugador.x + this.jugador.ancho > p.x && this.jugador.x < p.x + p.ancho,
    )
  }

  aplicarLimites() {
    const j = this.jugador
    const suelo = this.canvas.height - SUELO_ALTO - j.alto
    const sobrePozo = this.estaSobrePozo()

    if (this.modoActual === 'bola') {
      // La bola se posa en la superficie (como el cubo) y solo cambia de
      // dirección por el tap del jugador — no rebota sola al tocar el suelo
      const estabaEnSuelo = j.enSuelo
      if (!this.gravedadInvertida) {
        if (j.y >= suelo && !sobrePozo) {
          j.y = suelo
          j.velocidadY = 0
          j.enSuelo = true
        } else {
          j.enSuelo = false
        }
      } else {
        if (j.y <= TECHO) {
          j.y = TECHO
          j.velocidadY = 0
          j.enSuelo = true
        } else {
          j.enSuelo = false
        }
      }
      if (!estabaEnSuelo && j.enSuelo) this.squashTimer = 8
    } else if (this.modoActual === 'nave' || this.modoActual === 'ola') {
      const max = this.canvas.height - 50
      if (j.y < TECHO) j.y = TECHO
      if (j.y > max) j.y = max
    } else if (!this.gravedadInvertida) {
      if (j.y >= suelo && !sobrePozo) {
        j.y = suelo
        j.velocidadY = 0
        j.enSuelo = true
        j.saltosAire = 0
        j.rotacion = Math.round(j.rotacion / 90) * 90
      } else {
        j.enSuelo = false
      }
      if (j.y <= TECHO) {
        j.y = TECHO
        j.velocidadY = 0
      }
    } else {
      // Gravedad invertida (orbe azul/verde): el techo pasa a ser "el suelo"
      if (j.y <= TECHO) {
        j.y = TECHO
        j.velocidadY = 0
        j.enSuelo = true
        j.saltosAire = 0
        j.rotacion = Math.round(j.rotacion / 90) * 90
      } else {
        j.enSuelo = false
      }
      if (j.y >= suelo) {
        j.y = suelo
        j.velocidadY = 0
      }
    }

    if (j.enSuelo) j.coyoteTimer = COYOTE_FRAMES
    else if (j.coyoteTimer > 0) j.coyoteTimer--
  }

  generarObstaculo() {
    const suelo = this.canvas.height - SUELO_ALTO
    const esPrincipiante = this.puntaje < this.nivelCfg.umbralComplejos
    const combosDisponibles = this.nivelCfg.combos

    if (!esPrincipiante && combosDisponibles.length > 0 && Math.random() < 0.22) {
      const id = combosDisponibles[Math.floor(Math.random() * combosDisponibles.length)]
      this.generarCombo(id, suelo)
      return
    }

    const rand = Math.random()
    const techoY = TECHO

    // — Disponibles desde el nivel Fácil (sin gate de esPrincipiante) —
    if (rand < 0.1) {
      // Pico simple
      this.obstaculos.push({ tipo: 'pico', x: this.canvas.width, y: suelo - 50, ancho: 40, alto: 50 })
    } else if (rand < 0.18) {
      // Bloque doble
      this.obstaculos.push({
        tipo: 'bloqueDoble',
        x: this.canvas.width,
        y: suelo - 68,
        ancho: 34,
        alto: 68,
      })
    } else if (rand < 0.23) {
      // Bloque triple — pared más alta, exige un salto bien cargado
      this.obstaculos.push({
        tipo: 'bloqueTriple',
        x: this.canvas.width,
        y: suelo - 84,
        ancho: 34,
        alto: 84,
      })
    } else if (rand < 0.29) {
      // Pico colgante del techo
      this.obstaculos.push({ tipo: 'spikeTop', x: this.canvas.width, y: techoY, ancho: 40, alto: 50 })
    } else if (rand < 0.34) {
      // Sierra de techo — misma sierra de siempre, pegada arriba
      const radio = 20 + Math.random() * 10
      this.obstaculos.push({
        tipo: 'sierra',
        x: this.canvas.width,
        y: techoY,
        radio,
        rotacion: 0,
        velocidadRotacion: 0.05 + Math.random() * 0.04,
      })
    } else if (rand < 0.39) {
      // Bloque colgante del techo
      this.obstaculos.push({ tipo: 'bloque', x: this.canvas.width, y: techoY, ancho: 34, alto: 50 })
    } else if (rand < 0.44) {
      // Bloque flotante en pleno aire — letal por cualquier lado, no es plataforma
      this.obstaculos.push({
        tipo: 'bloqueFlotante',
        x: this.canvas.width,
        y: 90 + Math.random() * 90,
        ancho: 34,
        alto: 34,
      })
    } else if (rand < 0.49) {
      // Ventana: un marco flotante — solo es seguro pasar por el hueco central
      this.obstaculos.push({
        tipo: 'ventana',
        x: this.canvas.width,
        y: 80 + Math.random() * 70,
        ancho: 70,
        alto: 110,
        grosor: 14,
      })
    } else if (rand < 0.53) {
      // Sierra doble vertical: una arriba, una abajo, se pasa por el medio
      const radio = 20
      this.obstaculos.push({
        tipo: 'sierra',
        x: this.canvas.width,
        y: techoY,
        radio,
        rotacion: 0,
        velocidadRotacion: 0.06,
      })
      this.obstaculos.push({
        tipo: 'sierra',
        x: this.canvas.width,
        y: suelo - radio * 2,
        radio,
        rotacion: 0,
        velocidadRotacion: 0.06,
      })
    } else if (rand < 0.57) {
      // Pozo: un tramo sin suelo — hay que saltarlo o cruzar volando
      this.pozos.push({ tipo: 'pozo', x: this.canvas.width, ancho: 90 + Math.random() * 40 })
    } else if (rand < 0.65) {
      // Pad automático (siempre puede aparecer — es positivo, no requiere input)
      const variantes = esPrincipiante ? ['amarillo'] : ['amarillo', 'rosa', 'rojo', 'azul']
      const variante = variantes[Math.floor(Math.random() * variantes.length)]
      this.trampolin.push({
        tipo: 'trampolin',
        variante,
        x: this.canvas.width,
        y: suelo - 14,
        ancho: 56,
        alto: 14,
        animando: false,
        frameAnimacion: 0,
      })
    }
    // — Obstáculos complejos: solo a partir del umbral de cada nivel —
    else if (rand < 0.71 && !esPrincipiante) {
      // Sierra circular de suelo
      const radio = 22 + Math.random() * 12
      this.obstaculos.push({
        tipo: 'sierra',
        x: this.canvas.width,
        y: suelo - radio * 2,
        radio,
        rotacion: 0,
        velocidadRotacion: 0.05 + Math.random() * 0.04,
      })
    } else if (rand < 0.77 && !esPrincipiante) {
      // Pico doble techo + suelo
      let altoSuelo = 45 + Math.random() * 25
      const altoTecho = 40 + Math.random() * 20
      const huecoMinimo = 80
      const alturaDisponible = this.canvas.height - SUELO_ALTO
      const huecoReal = alturaDisponible - altoSuelo - altoTecho
      if (huecoReal < huecoMinimo) altoSuelo = alturaDisponible - altoTecho - huecoMinimo

      this.obstaculos.push({ tipo: 'picoDoble', x: this.canvas.width, anchoBase: 44, altoSuelo, altoTecho })
    } else if (rand < 0.82 && !esPrincipiante) {
      // Picos triples — la estructura más icónica de GD
      for (let i = 0; i < 3; i++) {
        this.obstaculos.push({
          tipo: 'pico',
          x: this.canvas.width + i * 40,
          y: suelo - 50,
          ancho: 40,
          alto: 50,
        })
      }
    } else if (rand < 0.87 && !esPrincipiante) {
      // Pendiente (slope): rampa sólida de 45°
      const direccion = Math.random() < 0.5 ? 1 : -1
      this.slopes.push({ tipo: 'slope', x: this.canvas.width, anchoBase: 70, altoMax: 38, direccion })
    } else if (rand < 0.9 && !esPrincipiante) {
      // Plataforma móvil
      const yBase = 70 + Math.random() * 120
      this.plataformasMoviles.push({
        tipo: 'plataformaMovil',
        x: this.canvas.width,
        y: yBase,
        yBase,
        ancho: 80 + Math.random() * 40,
        alto: 12,
        amplitud: 30 + Math.random() * 30,
        frecuencia: 0.03 + Math.random() * 0.02,
        fase: Math.random() * Math.PI * 2,
        frameCount: 0,
      })
    } else if (rand < 0.94 && !esPrincipiante) {
      // Orbe — requiere que el jugador presione al tocarlo
      const variantes = ['amarillo', 'rosa', 'rojo', 'azul', 'verde', 'negro']
      const variante = variantes[Math.floor(Math.random() * variantes.length)]
      this.orbes.push({
        tipo: 'orbe',
        variante,
        x: this.canvas.width,
        y: 60 + Math.random() * 140,
        radio: 14,
        pulsacion: 0,
        activado: false,
      })
    } else if (rand < 0.97 && !esPrincipiante) {
      // Imán invertido: no mata, desestabiliza
      this.imanes.push({ tipo: 'iman', x: this.canvas.width, y: this.canvas.height / 2, radio: 70, pulsacion: 0 })
    } else if (!esPrincipiante) {
      // Muro frágil: se rompe si cae encima, mata si lo toca de costado
      this.obstaculos.push({ tipo: 'muroFragil', x: this.canvas.width, y: suelo - 40, ancho: 36, alto: 40 })
    } else {
      // Pico simple de respaldo
      this.obstaculos.push({ tipo: 'pico', x: this.canvas.width, y: suelo - 50, ancho: 40, alto: 50 })
    }
  }

  // Obstáculos compuestos: combinan elementos ya existentes en patrones más
  // exigentes, siempre con un camino limpio garantizado (ningún combo es
  // imposible de librar).
  generarCombo(id, suelo) {
    switch (id) {
      case 'sierraPico': {
        // Pico de suelo + sierra flotante poco después: hay que ajustar la
        // altura del aterrizaje antes de que llegue la sierra
        this.obstaculos.push({ tipo: 'pico', x: this.canvas.width, y: suelo - 50, ancho: 40, alto: 50 })
        const radio = 20
        this.obstaculos.push({
          tipo: 'sierra',
          x: this.canvas.width + 110,
          y: suelo - 40 - radio * 2 - 20,
          radio,
          rotacion: 0,
          velocidadRotacion: 0.06,
        })
        break
      }

      case 'vallePendientes': {
        // Dos pendientes enfrentadas formando un valle — el jugador se
        // desliza hacia abajo y enseguida hacia arriba sin perder ritmo
        const anchoBase = 70
        const altoMax = 38
        this.slopes.push({ tipo: 'slope', x: this.canvas.width, anchoBase, altoMax, direccion: -1 })
        this.slopes.push({
          tipo: 'slope',
          x: this.canvas.width + anchoBase,
          anchoBase,
          altoMax,
          direccion: 1,
        })
        break
      }

      case 'picosCuadruples': {
        // 4 picos seguidos — más de lo que libra un salto normal — con un
        // pad rojo (salto alto) justo antes que garantiza la altura extra
        this.trampolin.push({
          tipo: 'trampolin',
          variante: 'rojo',
          x: this.canvas.width,
          y: suelo - 14,
          ancho: 56,
          alto: 14,
          animando: false,
          frameAnimacion: 0,
        })
        const inicioX = this.canvas.width + 56 + 40
        for (let i = 0; i < 4; i++) {
          this.obstaculos.push({
            tipo: 'pico',
            x: inicioX + i * 40,
            y: suelo - 50,
            ancho: 40,
            alto: 50,
          })
        }
        break
      }

      case 'cascadaPlataformas': {
        // Foso de picos debajo + 3 plataformas estáticas escalonadas como
        // camino seguro por arriba
        for (let i = 0; i < 4; i++) {
          this.obstaculos.push({
            tipo: 'pico',
            x: this.canvas.width + i * 40,
            y: suelo - 50,
            ancho: 40,
            alto: 50,
          })
        }
        const alturas = [60, 100, 140]
        alturas.forEach((altura, i) => {
          const y = suelo - altura
          this.plataformasMoviles.push({
            tipo: 'plataformaMovil',
            x: this.canvas.width + i * 70,
            y,
            yBase: y,
            ancho: 60,
            alto: 12,
            amplitud: 0,
            frecuencia: 0,
            fase: 0,
            frameCount: 0,
          })
        })
        break
      }

      case 'gravedadAlterna': {
        // Dos orbes de gravedad cercanos: obligan a invertir y volver a
        // invertir en poco espacio
        this.orbes.push({
          tipo: 'orbe',
          variante: 'azul',
          x: this.canvas.width,
          y: suelo - 60,
          radio: 14,
          pulsacion: 0,
          activado: false,
        })
        this.orbes.push({
          tipo: 'orbe',
          variante: 'verde',
          x: this.canvas.width + 140,
          y: TECHO + 60,
          radio: 14,
          pulsacion: 0,
          activado: false,
        })
        break
      }

      case 'picoDobleSierra': {
        // Pico doble con una sierra justo en el centro del hueco — el hueco
        // se agranda respecto al normal para dejar margen real a los lados
        const altoTecho = 45
        const huecoMinimoExtra = 110
        const alturaDisponible = this.canvas.height - SUELO_ALTO
        let altoSuelo = 50
        const huecoReal = alturaDisponible - altoSuelo - altoTecho
        if (huecoReal < huecoMinimoExtra) altoSuelo = alturaDisponible - altoTecho - huecoMinimoExtra

        this.obstaculos.push({
          tipo: 'picoDoble',
          x: this.canvas.width,
          anchoBase: 44,
          altoSuelo,
          altoTecho,
        })

        const centroHueco = altoTecho + (alturaDisponible - altoSuelo - altoTecho) / 2
        this.obstaculos.push({
          tipo: 'sierra',
          x: this.canvas.width + 6,
          y: centroHueco - 16,
          radio: 16,
          rotacion: 0,
          velocidadRotacion: 0.07,
        })
        break
      }
    }
  }

  generarPortalModo() {
    const modoDestino = elegirModoAleatorioDistinto(this.modoActual)
    this.portalesModo.push({
      tipo: 'portalModo',
      x: this.canvas.width,
      y: this.canvas.height / 2 - 50,
      ancho: 40,
      alto: 100,
      modoDestino,
      activado: false,
    })
  }

  activarPortalModo(portal) {
    audio.portal()
    setTimeout(() => audio.cambioModo(portal.modoDestino), 250)

    const colorAnterior = MODOS[this.modoActual].color
    const colorNuevo = MODOS[portal.modoDestino].color
    this.modoActual = portal.modoDestino

    for (let i = 0; i < 12; i++) {
      this.particulas.push({
        x: this.jugador.x + this.jugador.ancho / 2,
        y: this.jugador.y + this.jugador.alto / 2,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        vida: 1.0,
        color: i % 2 === 0 ? colorAnterior : colorNuevo,
      })
    }

    this.mensajeModo = `¡MODO ${MODOS[portal.modoDestino].nombre.toUpperCase()}!`
    this.mensajeModoTimer = 90
  }

  generarParticulas() {
    for (let i = 0; i < 16; i++) {
      this.particulas.push({
        x: this.jugador.x + this.jugador.ancho / 2,
        y: this.jugador.y + this.jugador.alto / 2,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        vida: 1.0,
        color: MODOS[this.modoActual].color,
      })
    }
  }

  // Colisión triangular real para el pico de suelo: el rectángulo que
  // encierra al triángulo no cuenta como sólido completo — solo mata si el
  // jugador realmente entra en el área triangular (puedes pasar "rozando"
  // la punta sin morir, como en Geometry Dash).
  colisionPico(obs) {
    const j = this.jugador
    const margen = 4
    const jx1 = j.x + margen
    const jx2 = j.x + j.ancho - margen
    const jy1 = j.y + margen
    const jy2 = j.y + j.alto - margen

    if (jx2 < obs.x || jx1 > obs.x + obs.ancho || jy2 < obs.y || jy1 > obs.y + obs.alto) {
      return false
    }

    const apiceX = obs.x + obs.ancho / 2
    const apiceY = obs.y
    const baseY = obs.y + obs.alto
    const puntoX = Math.min(jx2, Math.max(jx1, j.x + j.ancho / 2))
    const puntoY = jy2

    let lineaY
    if (puntoX < apiceX) {
      const t = (puntoX - obs.x) / (apiceX - obs.x)
      lineaY = baseY + (apiceY - baseY) * t
    } else {
      const t = (puntoX - apiceX) / (obs.x + obs.ancho - apiceX)
      lineaY = apiceY + (baseY - apiceY) * t
    }

    return puntoY >= lineaY
  }

  // Mismo principio que colisionPico() pero para el pico que cuelga del
  // techo (apunta hacia abajo).
  colisionSpikeTop(obs) {
    const j = this.jugador
    const margen = 4
    const jx1 = j.x + margen
    const jx2 = j.x + j.ancho - margen
    const jy1 = j.y + margen
    const jy2 = j.y + j.alto - margen

    if (jx2 < obs.x || jx1 > obs.x + obs.ancho || jy2 < obs.y || jy1 > obs.y + obs.alto) {
      return false
    }

    const apiceX = obs.x + obs.ancho / 2
    const apiceY = obs.y + obs.alto
    const baseY = obs.y
    const puntoX = Math.min(jx2, Math.max(jx1, j.x + j.ancho / 2))
    const puntoY = jy1

    let lineaY
    if (puntoX < apiceX) {
      const t = (puntoX - obs.x) / (apiceX - obs.x)
      lineaY = baseY + (apiceY - baseY) * t
    } else {
      const t = (puntoX - apiceX) / (obs.x + obs.ancho - apiceX)
      lineaY = apiceY + (baseY - apiceY) * t
    }

    return puntoY <= lineaY
  }

  colisionSierra(obs) {
    const cx = obs.x + obs.radio
    const cy = obs.y + obs.radio
    const jcx = this.jugador.x + this.jugador.ancho / 2
    const jcy = this.jugador.y + this.jugador.alto / 2
    const distancia = Math.sqrt((jcx - cx) ** 2 + (jcy - cy) ** 2)
    const radioJugador = Math.min(this.jugador.ancho, this.jugador.alto) / 2 - 4
    return distancia < obs.radio + radioJugador
  }

  colisionPicoDoble(obs) {
    const h = this.canvas.height
    const margen = 4
    const jx1 = this.jugador.x + margen
    const jx2 = this.jugador.x + this.jugador.ancho - margen
    const jy1 = this.jugador.y + margen
    const jy2 = this.jugador.y + this.jugador.alto - margen

    const enX = jx1 < obs.x + obs.anchoBase && jx2 > obs.x

    const picoSueloY = h - SUELO_ALTO - obs.altoSuelo
    const colSuelo = enX && jy2 > picoSueloY

    const colTecho = enX && jy1 < obs.altoTecho

    return colSuelo || colTecho
  }

  // Ventana: el marco mata, el hueco interior es completamente seguro
  colisionVentana(obs) {
    const j = this.jugador
    const margen = 4
    const jx1 = j.x + margen
    const jx2 = j.x + j.ancho - margen
    const jy1 = j.y + margen
    const jy2 = j.y + j.alto - margen

    const enExterior = jx2 > obs.x && jx1 < obs.x + obs.ancho && jy2 > obs.y && jy1 < obs.y + obs.alto
    if (!enExterior) return false

    const ix1 = obs.x + obs.grosor
    const ix2 = obs.x + obs.ancho - obs.grosor
    const iy1 = obs.y + obs.grosor
    const iy2 = obs.y + obs.alto - obs.grosor
    const dentroDelHueco = jx1 >= ix1 && jx2 <= ix2 && jy1 >= iy1 && jy2 <= iy2

    return !dentroDelHueco
  }

  colisionTrampolin(t) {
    const cayendo = this.jugador.velocidadY > 0
    const enX = this.jugador.x + this.jugador.ancho > t.x && this.jugador.x < t.x + t.ancho
    const enY =
      this.jugador.y + this.jugador.alto >= t.y &&
      this.jugador.y + this.jugador.alto <= t.y + t.alto + 6

    if (cayendo && enX && enY) {
      // Pad automático: se activa solo al pisarlo, sin requerir input
      const base = this.config.juego.altoDeSalto
      const signo = this.gravedadInvertida ? -1 : 1

      switch (t.variante) {
        case 'rosa':
          this.aplicarImpulso(base * 0.55 * signo, 4)
          break
        case 'rojo':
          this.aplicarImpulso(base * 1.5 * signo, 4)
          break
        case 'azul': {
          this.gravedadInvertida = !this.gravedadInvertida
          const nuevoSigno = this.gravedadInvertida ? -1 : 1
          // El pad azul sí da un leve impulso (a diferencia del orbe azul)
          this.aplicarImpulso(base * nuevoSigno * 0.8, 4)
          break
        }
        default:
          this.aplicarImpulso(base * signo, 4)
          break
      }

      this.jugador.enSuelo = false
      this.jugador.saltosAire = 0
      t.animando = true
      t.frameAnimacion = 0
      audio.salto()
      return true
    }
    return false
  }

  actualizarColisionPlataforma() {
    this.sobrePlataforma = false
    this.plataformaActual = null

    if (this.jugador.velocidadY < 0) return

    for (const p of this.plataformasMoviles) {
      const enX =
        this.jugador.x + this.jugador.ancho - 4 > p.x && this.jugador.x + 4 < p.x + p.ancho
      const pieJugador = this.jugador.y + this.jugador.alto
      const enY =
        pieJugador >= p.y && pieJugador <= p.y + p.alto + 8 && this.jugador.y < p.y

      if (enX && enY) {
        this.jugador.y = p.y - this.jugador.alto
        this.jugador.velocidadY = 0
        this.jugador.enSuelo = true
        this.jugador.saltosAire = 0
        this.sobrePlataforma = true
        this.plataformaActual = p
        break
      }
    }
  }

  // Altura de la superficie de una pendiente en una coordenada X del mundo
  superficieSlope(s, x) {
    const suelo = this.canvas.height - SUELO_ALTO
    const f = Math.max(0, Math.min(1, (x - s.x) / s.anchoBase))
    return s.direccion === 1 ? suelo - f * s.altoMax : suelo - (1 - f) * s.altoMax
  }

  actualizarColisionSlope() {
    if (this.jugador.velocidadY < 0) return

    for (const s of this.slopes) {
      const j = this.jugador
      if (j.x + j.ancho < s.x || j.x > s.x + s.anchoBase) continue

      const superficieY = this.superficieSlope(s, j.x + j.ancho / 2)
      const pie = j.y + j.alto

      if (pie >= superficieY - 4 && pie <= superficieY + 14) {
        j.y = superficieY - j.alto
        j.velocidadY = 0
        j.enSuelo = true
        j.saltosAire = 0
        break
      }
    }
  }

  colisionSlope(s) {
    const j = this.jugador
    if (j.x + j.ancho < s.x || j.x > s.x + s.anchoBase) return false

    const superficieY = this.superficieSlope(s, j.x + j.ancho / 2)
    const pie = j.y + j.alto
    // Si el pie está claramente por debajo de la superficie, no logró
    // posarse encima — chocó de costado o por abajo
    return pie > superficieY + 14
  }

  // Los orbes solo se activan con la pulsación del jugador al estar en rango
  // (no automáticamente al tocarlos) — se llama desde iniciarPresion().
  // La Ola es el único modo incompatible con los orbes, igual que en GD real.
  intentarActivarOrbes() {
    if (this.modoActual === 'ola') return false

    let activoAlguno = false

    for (const o of this.orbes) {
      if (o.activado) continue

      const jcx = this.jugador.x + this.jugador.ancho / 2
      const jcy = this.jugador.y + this.jugador.alto / 2
      const distancia = Math.sqrt((jcx - o.x) ** 2 + (jcy - o.y) ** 2)
      if (distancia >= o.radio + 16) continue

      o.activado = true
      const signo = this.gravedadInvertida ? -1 : 1
      const base = this.config.juego.altoDeSalto

      switch (o.variante) {
        case 'rosa':
          this.aplicarImpulso(base * 0.55 * signo, 3)
          this.jugador.enSuelo = false
          break
        case 'rojo':
          this.aplicarImpulso(base * 1.5 * signo, 3)
          this.jugador.enSuelo = false
          break
        case 'azul':
          // Invierte gravedad sin impulso — la posición Y no cambia
          this.gravedadInvertida = !this.gravedadInvertida
          break
        case 'verde': {
          this.gravedadInvertida = !this.gravedadInvertida
          const nuevoSigno = this.gravedadInvertida ? -1 : 1
          this.aplicarImpulso(base * nuevoSigno, 3)
          this.jugador.enSuelo = false
          break
        }
        case 'negro':
          // Impulso hacia la superficie actual (dirección de la gravedad)
          this.aplicarImpulso(-base * signo, 3)
          this.jugador.enSuelo = false
          break
        default:
          this.aplicarImpulso(base * signo, 3)
          this.jugador.enSuelo = false
          break
      }

      const color = COLORES_ORBE[o.variante] || COLORES_ORBE.amarillo
      for (let i = 0; i < 8; i++) {
        this.particulas.push({
          x: o.x,
          y: o.y,
          vx: (Math.random() - 0.5) * 8,
          vy: (Math.random() - 0.5) * 8,
          vida: 1.0,
          color,
        })
      }
      audio.salto()
      activoAlguno = true
    }

    return activoAlguno
  }

  colisionMuroFragil(obs) {
    const cayendo = this.jugador.velocidadY >= 0
    const enX = this.jugador.x + this.jugador.ancho > obs.x && this.jugador.x < obs.x + obs.ancho
    const pieJugador = this.jugador.y + this.jugador.alto
    const enYTope = pieJugador >= obs.y && pieJugador <= obs.y + 10 && this.jugador.y < obs.y

    if (cayendo && enX && enYTope) {
      this.jugador.velocidadY = -4
      this.generarRoturaMuro(obs)
      return true
    }
    return false
  }

  generarRoturaMuro(obs) {
    for (let i = 0; i < 10; i++) {
      this.particulas.push({
        x: obs.x + obs.ancho / 2,
        y: obs.y,
        vx: (Math.random() - 0.5) * 8,
        vy: -Math.random() * 6,
        vida: 1.0,
        color: '#94a3b8',
      })
    }
    audio.salto()
  }

  aplicarImanes() {
    // Si el jugador está firmemente parado en una superficie, el imán no
    // debe "despegarlo" — solo desestabiliza mientras está en el aire
    if (this.jugador.enSuelo) return

    for (const m of this.imanes) {
      const jcx = this.jugador.x + this.jugador.ancho / 2
      const jcy = this.jugador.y + this.jugador.alto / 2
      const dist = Math.sqrt((jcx - m.x) ** 2 + (jcy - m.y) ** 2)
      if (dist < m.radio) {
        this.jugador.velocidadY += (m.y - jcy) * 0.025
      }
    }
  }

  verificarColisiones() {
    for (const t of this.trampolin) {
      this.colisionTrampolin(t)
    }

    this.actualizarColisionPlataforma()
    this.actualizarColisionSlope()

    // Muros frágiles: si el jugador cae encima se rompen (no matan) y se
    // quitan de la lista antes de que el chequeo letal genérico los vea
    this.obstaculos = this.obstaculos.filter((obs) => {
      if (obs.tipo === 'muroFragil') return !this.colisionMuroFragil(obs)
      return true
    })

    for (const obs of this.obstaculos) {
      let colision = false

      if (obs.tipo === 'pico') {
        colision = this.colisionPico(obs)
      } else if (obs.tipo === 'spikeTop') {
        colision = this.colisionSpikeTop(obs)
      } else if (obs.tipo === 'sierra') {
        colision = this.colisionSierra(obs)
      } else if (obs.tipo === 'picoDoble') {
        colision = this.colisionPicoDoble(obs)
      } else if (obs.tipo === 'ventana') {
        colision = this.colisionVentana(obs)
      } else {
        const margen = 4
        colision =
          this.jugador.x + margen < obs.x + obs.ancho &&
          this.jugador.x + this.jugador.ancho - margen > obs.x &&
          this.jugador.y + margen < obs.y + obs.alto &&
          this.jugador.y + this.jugador.alto - margen > obs.y
      }

      if (colision) {
        this.terminado = true
        audio.muerte()
        this.generarParticulas()
        return
      }
    }

    for (const s of this.slopes) {
      if (this.colisionSlope(s)) {
        this.terminado = true
        audio.muerte()
        this.generarParticulas()
        return
      }
    }

    for (const p of this.portalesModo) {
      const colision =
        this.jugador.x + 4 < p.x + p.ancho &&
        this.jugador.x + this.jugador.ancho - 4 > p.x &&
        this.jugador.y + 4 < p.y + p.alto &&
        this.jugador.y + this.jugador.alto - 4 > p.y

      if (colision) {
        this.activarPortalModo(p)
        this.portalesModo = this.portalesModo.filter((pm) => pm !== p)
        break
      }
    }
  }

  actualizar() {
    if (!this.corriendo || this.terminado) return

    this.frameCount++
    this.puntaje++

    if (this.frameCount % this.nivelCfg.framesIncrementoVel === 0) {
      this.velocidad += this.nivelCfg.incrementoVelocidad
    }

    if (this.frameCount % this.nivelCfg.framesDecaerFrec === 0 && this.frecuenciaObstaculo > this.nivelCfg.frecMinima) {
      this.frecuenciaObstaculo -= 2
    }

    if (this.frameCount >= this.proximoObstaculo) {
      this.generarObstaculo()
      this.proximoObstaculo = this.frameCount + this.frecuenciaObstaculo
    }

    if (this.frameCount >= this.proximoPortalModo) {
      this.generarPortalModo()
      this.proximoPortalModo = this.frameCount + 400 + Math.random() * 200
    }

    this.obstaculos = this.obstaculos.filter((o) => o.x + o.ancho > 0)
    this.portalesModo = this.portalesModo.filter((p) => p.x + p.ancho > 0)
    this.obstaculos.forEach((o) => (o.x -= this.velocidad))
    this.portalesModo.forEach((p) => (p.x -= this.velocidad))

    this.obstaculos.forEach((o) => {
      if (o.tipo === 'sierra') o.rotacion += o.velocidadRotacion
    })

    this.imanes.forEach((m) => {
      m.x -= this.velocidad
    })
    this.imanes = this.imanes.filter((m) => m.x + m.radio * 2 > 0)

    this.slopes.forEach((s) => {
      s.x -= this.velocidad
    })
    this.slopes = this.slopes.filter((s) => s.x + s.anchoBase > 0)

    this.pozos.forEach((p) => {
      p.x -= this.velocidad
    })
    this.pozos = this.pozos.filter((p) => p.x + p.ancho > 0)

    if (this.squashTimer > 0) this.squashTimer--

    this.trampolin.forEach((t) => {
      t.x -= this.velocidad
    })
    this.trampolin = this.trampolin.filter((t) => t.x + t.ancho > 0)

    this.orbes.forEach((o) => {
      o.x -= this.velocidad
      if (o.activado) o._framesMuerto = (o._framesMuerto || 0) + 1
    })
    this.orbes = this.orbes.filter((o) => o.x + o.radio > 0 && !(o.activado && o._framesMuerto > 30))

    this.plataformasMoviles.forEach((p) => {
      p.x -= this.velocidad
      p.frameCount++
      p.y = p.yBase + Math.sin(p.frameCount * p.frecuencia + p.fase) * p.amplitud
    })
    this.plataformasMoviles = this.plataformasMoviles.filter((p) => p.x + p.ancho > 0)

    if (this.modoActual === 'robot' && this.jugador.presionando) {
      this.jugador.tiempoPresion++
      if (this.jugador.tiempoPresion >= ROBOT_MAX_FRAMES_CARGA) {
        this.jugador.tiempoPresion = ROBOT_MAX_FRAMES_CARGA
        this.jugador.presionando = false
      }
    }

    this.actualizarParallax()
    this.actualizarFisica()
    this.aplicarImanes()
    this.jugador.y += this.jugador.velocidadY
    this.actualizarColisionPlataforma()
    this.actualizarColisionSlope()
    this.actualizarTrail()
    this.aplicarLimites()

    // Rebote automático del cubo: si se mantiene presionado, salta de
    // nuevo en el instante en que toca el suelo (no hace falta soltar
    // y volver a presionar para cada salto)
    if (this.modoActual === 'cubo' && this.jugador.presionando && this.jugador.enSuelo) {
      this.saltar()
    }

    this.lineasVelocidad.forEach((l) => {
      l.x -= this.velocidad * 2
      if (l.x + l.largo < 0) l.x = this.canvas.width
    })

    this.particulas = this.particulas.filter((p) => p.vida > 0)
    this.particulas.forEach((p) => {
      p.x += p.vx
      p.y += p.vy
      p.vida -= 0.05
    })

    if (this.mensajeModoTimer > 0) this.mensajeModoTimer--
    else this.mensajeModo = null

    // Caer fuera de la pantalla por un pozo también mata (igual que en GD)
    if (!this.terminado && this.jugador.y > this.canvas.height + 20) {
      this.terminado = true
      audio.muerte()
      this.generarParticulas()
    }

    if (!this.terminado) this.verificarColisiones()
  }

  dibujarFondo() {
    const ctx = this.ctx
    const w = this.canvas.width
    const h = this.canvas.height
    const colorFondo = this.config.jugador.colorFondo

    ctx.fillStyle = colorFondo
    ctx.fillRect(0, 0, w, h)

    this.estrellas.forEach((s) => {
      ctx.globalAlpha = s.opacidad
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(s.x, s.y, s.radio, 0, Math.PI * 2)
      ctx.fill()
    })
    ctx.globalAlpha = 1

    this.edificios.forEach((e) => {
      ctx.fillStyle = e.color
      ctx.fillRect(e.x, h - 40 - e.alto, e.ancho, e.alto)

      const tamVentana = 5
      const margen = 8
      e.ventanas.forEach((v) => {
        const vx = e.x + margen + v.x * (e.ancho - margen * 2 - tamVentana)
        const vy = h - 40 - e.alto + margen + v.y * (e.alto - margen * 2 - tamVentana)
        ctx.fillStyle = v.encendida ? '#fbbf2466' : '#ffffff11'
        ctx.fillRect(vx, vy, tamVentana, tamVentana)
      })
    })

    this.nubes.forEach((n) => {
      ctx.globalAlpha = n.opacidad
      ctx.fillStyle = '#7c6fff'
      ctx.beginPath()
      ctx.arc(n.x, n.y, n.radio, 0, Math.PI * 2)
      ctx.arc(n.x + n.radio * 0.8, n.y - n.radio * 0.3, n.radio * 0.7, 0, Math.PI * 2)
      ctx.arc(n.x + n.radio * 1.5, n.y, n.radio * 0.8, 0, Math.PI * 2)
      ctx.fill()
    })
    ctx.globalAlpha = 1

    this.plataformas.forEach((p) => {
      ctx.fillStyle = p.color
      ctx.beginPath()
      ctx.roundRect(p.x, p.y, p.ancho, p.alto, 3)
      ctx.fill()
      ctx.fillStyle = '#ffffff08'
      ctx.fillRect(p.x + 2, p.y, p.ancho - 4, 2)
    })

    ctx.strokeStyle = '#ffffff'
    this.lineasVelocidad.forEach((l) => {
      ctx.globalAlpha = l.opacidad
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(l.x, l.y)
      ctx.lineTo(l.x + l.largo, l.y)
      ctx.stroke()
    })
    ctx.globalAlpha = 1
  }

  dibujarSuelo() {
    const ctx = this.ctx
    const w = this.canvas.width
    const h = this.canvas.height

    ctx.fillStyle = '#1e293b'
    ctx.fillRect(0, h - SUELO_ALTO, w, SUELO_ALTO)

    ctx.save()
    ctx.shadowBlur = 8
    ctx.shadowColor = '#6366f1'
    ctx.strokeStyle = '#6366f1'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(0, h - SUELO_ALTO)
    ctx.lineTo(w, h - SUELO_ALTO)
    ctx.stroke()
    ctx.restore()

    // Pozos: se "borra" el suelo en ese tramo para mostrar el vacío
    this.pozos.forEach((p) => {
      ctx.fillStyle = this.config.jugador.colorFondo
      ctx.fillRect(p.x, h - SUELO_ALTO, p.ancho, SUELO_ALTO)

      ctx.save()
      ctx.shadowBlur = 10
      ctx.shadowColor = '#ef4444'
      ctx.strokeStyle = '#ef444499'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(p.x, h - SUELO_ALTO)
      ctx.lineTo(p.x, h)
      ctx.moveTo(p.x + p.ancho, h - SUELO_ALTO)
      ctx.lineTo(p.x + p.ancho, h)
      ctx.stroke()
      ctx.restore()
    })
  }

  dibujarPico(obs) {
    const ctx = this.ctx
    ctx.save()
    ctx.shadowBlur = 12
    ctx.shadowColor = '#f97316'
    ctx.fillStyle = '#f97316'
    ctx.beginPath()
    ctx.moveTo(obs.x, obs.y + obs.alto)
    ctx.lineTo(obs.x + obs.ancho / 2, obs.y)
    ctx.lineTo(obs.x + obs.ancho, obs.y + obs.alto)
    ctx.closePath()
    ctx.fill()
    ctx.restore()
  }

  dibujarSpikeTop(obs) {
    const ctx = this.ctx
    ctx.save()
    ctx.shadowBlur = 12
    ctx.shadowColor = '#f97316'
    ctx.fillStyle = '#f97316'
    ctx.beginPath()
    ctx.moveTo(obs.x, obs.y)
    ctx.lineTo(obs.x + obs.ancho / 2, obs.y + obs.alto)
    ctx.lineTo(obs.x + obs.ancho, obs.y)
    ctx.closePath()
    ctx.fill()
    ctx.restore()
  }

  dibujarBloque(obs) {
    const ctx = this.ctx
    ctx.save()
    ctx.shadowBlur = 10
    ctx.shadowColor = '#a855f7'
    ctx.fillStyle = '#a855f7'
    ctx.beginPath()
    ctx.roundRect(obs.x, obs.y, obs.ancho, obs.alto, 6)
    ctx.fill()
    ctx.restore()
  }

  dibujarBloqueDoble(obs) {
    const ctx = this.ctx
    ctx.save()
    ctx.shadowBlur = 10
    ctx.shadowColor = '#a855f7'
    ctx.fillStyle = '#a855f7'
    ctx.beginPath()
    ctx.roundRect(obs.x, obs.y, 34, 34, 6)
    ctx.fill()
    ctx.beginPath()
    ctx.roundRect(obs.x, obs.y + 34, 34, 34, 6)
    ctx.fill()
    ctx.restore()
  }

  dibujarBloqueTriple(obs) {
    const ctx = this.ctx
    const segAlto = obs.alto / 3
    ctx.save()
    ctx.shadowBlur = 10
    ctx.shadowColor = '#a855f7'
    ctx.fillStyle = '#a855f7'
    for (let i = 0; i < 3; i++) {
      ctx.beginPath()
      ctx.roundRect(obs.x, obs.y + i * segAlto, obs.ancho, segAlto - 2, 5)
      ctx.fill()
    }
    ctx.restore()
  }

  dibujarBloqueFlotante(obs) {
    const ctx = this.ctx
    ctx.save()
    ctx.shadowBlur = 12
    ctx.shadowColor = '#ec4899'
    ctx.fillStyle = '#ec4899'
    ctx.beginPath()
    ctx.roundRect(obs.x, obs.y, obs.ancho, obs.alto, 6)
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.4)'
    ctx.lineWidth = 1.5
    ctx.shadowBlur = 0
    ctx.beginPath()
    ctx.moveTo(obs.x + 6, obs.y + 6)
    ctx.lineTo(obs.x + obs.ancho - 6, obs.y + obs.alto - 6)
    ctx.stroke()
    ctx.restore()
  }

  dibujarVentana(obs) {
    const ctx = this.ctx
    ctx.save()
    ctx.shadowBlur = 14
    ctx.shadowColor = '#22d3ee'
    ctx.strokeStyle = '#22d3ee'
    ctx.lineWidth = obs.grosor
    ctx.strokeRect(
      obs.x + obs.grosor / 2,
      obs.y + obs.grosor / 2,
      obs.ancho - obs.grosor,
      obs.alto - obs.grosor,
    )
    ctx.shadowBlur = 0
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'
    ctx.lineWidth = 1
    ctx.strokeRect(
      obs.x + obs.grosor,
      obs.y + obs.grosor,
      obs.ancho - obs.grosor * 2,
      obs.alto - obs.grosor * 2,
    )
    ctx.restore()
  }

  dibujarSierra(obs) {
    const ctx = this.ctx
    const cx = obs.x + obs.radio
    const cy = obs.y + obs.radio
    const r = obs.radio
    const dientes = 10

    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(obs.rotacion)

    ctx.beginPath()
    ctx.arc(0, 0, r, 0, Math.PI * 2)
    ctx.fillStyle = '#ef4444'
    ctx.shadowBlur = 14
    ctx.shadowColor = '#ef4444'
    ctx.fill()

    ctx.fillStyle = '#fca5a5'
    for (let i = 0; i < dientes; i++) {
      const angulo = (i / dientes) * Math.PI * 2
      const siguienteAngulo = ((i + 0.5) / dientes) * Math.PI * 2
      ctx.beginPath()
      ctx.moveTo(Math.cos(angulo) * r, Math.sin(angulo) * r)
      ctx.lineTo(Math.cos(siguienteAngulo) * (r + 8), Math.sin(siguienteAngulo) * (r + 8))
      ctx.lineTo(
        Math.cos(angulo + (Math.PI * 2) / dientes) * r,
        Math.sin(angulo + (Math.PI * 2) / dientes) * r,
      )
      ctx.closePath()
      ctx.fill()
    }

    ctx.beginPath()
    ctx.arc(0, 0, r * 0.25, 0, Math.PI * 2)
    ctx.fillStyle = '#7f1d1d'
    ctx.shadowBlur = 0
    ctx.fill()

    ctx.restore()
  }

  dibujarPicoDoble(obs) {
    const ctx = this.ctx
    const h = this.canvas.height

    ctx.fillStyle = '#f97316'
    ctx.shadowBlur = 10
    ctx.shadowColor = '#f97316'
    ctx.beginPath()
    ctx.moveTo(obs.x, h - SUELO_ALTO)
    ctx.lineTo(obs.x + obs.anchoBase / 2, h - SUELO_ALTO - obs.altoSuelo)
    ctx.lineTo(obs.x + obs.anchoBase, h - SUELO_ALTO)
    ctx.closePath()
    ctx.fill()

    ctx.beginPath()
    ctx.moveTo(obs.x, 0)
    ctx.lineTo(obs.x + obs.anchoBase / 2, obs.altoTecho)
    ctx.lineTo(obs.x + obs.anchoBase, 0)
    ctx.closePath()
    ctx.fill()

    ctx.strokeStyle = '#f9731630'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 6])
    ctx.beginPath()
    ctx.moveTo(obs.x + obs.anchoBase / 2, obs.altoTecho)
    ctx.lineTo(obs.x + obs.anchoBase / 2, h - SUELO_ALTO - obs.altoSuelo)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.shadowBlur = 0
  }

  dibujarMuroFragil(obs) {
    const ctx = this.ctx
    ctx.save()
    ctx.fillStyle = '#94a3b8'
    ctx.shadowBlur = 8
    ctx.shadowColor = '#94a3b8'
    ctx.beginPath()
    ctx.roundRect(obs.x, obs.y, obs.ancho, obs.alto, 4)
    ctx.fill()
    ctx.shadowBlur = 0

    ctx.strokeStyle = '#475569'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(obs.x + 6, obs.y + 6)
    ctx.lineTo(obs.x + obs.ancho / 2, obs.y + obs.alto / 2)
    ctx.lineTo(obs.x + obs.ancho - 8, obs.y + 10)
    ctx.moveTo(obs.x + obs.ancho / 2, obs.y + obs.alto / 2)
    ctx.lineTo(obs.x + 10, obs.y + obs.alto - 6)
    ctx.stroke()
    ctx.restore()
  }

  dibujarSlope(s) {
    const ctx = this.ctx
    const suelo = this.canvas.height - SUELO_ALTO

    ctx.save()
    ctx.fillStyle = '#0ea5e9'
    ctx.shadowBlur = 8
    ctx.shadowColor = '#0ea5e9'
    ctx.beginPath()
    if (s.direccion === 1) {
      ctx.moveTo(s.x, suelo)
      ctx.lineTo(s.x + s.anchoBase, suelo)
      ctx.lineTo(s.x + s.anchoBase, suelo - s.altoMax)
    } else {
      ctx.moveTo(s.x, suelo - s.altoMax)
      ctx.lineTo(s.x, suelo)
      ctx.lineTo(s.x + s.anchoBase, suelo)
    }
    ctx.closePath()
    ctx.fill()

    ctx.shadowBlur = 0
    ctx.strokeStyle = '#7dd3fc'
    ctx.lineWidth = 2
    ctx.beginPath()
    if (s.direccion === 1) {
      ctx.moveTo(s.x, suelo)
      ctx.lineTo(s.x + s.anchoBase, suelo - s.altoMax)
    } else {
      ctx.moveTo(s.x, suelo - s.altoMax)
      ctx.lineTo(s.x + s.anchoBase, suelo)
    }
    ctx.stroke()
    ctx.restore()
  }

  dibujarIman(m) {
    const ctx = this.ctx
    m.pulsacion += 0.05
    ctx.save()
    for (let i = 0; i < 3; i++) {
      const r = m.radio * (0.4 + i * 0.3) + Math.sin(m.pulsacion + i) * 4
      ctx.globalAlpha = 0.15 - i * 0.03
      ctx.strokeStyle = '#a855f7'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(m.x, m.y, r, 0, Math.PI * 2)
      ctx.stroke()
    }
    ctx.globalAlpha = 1
    ctx.fillStyle = '#a855f7'
    ctx.shadowBlur = 14
    ctx.shadowColor = '#a855f7'
    ctx.beginPath()
    ctx.arc(m.x, m.y, 8, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  dibujarObstaculo(obs) {
    switch (obs.tipo) {
      case 'pico':
        this.dibujarPico(obs)
        break
      case 'spikeTop':
        this.dibujarSpikeTop(obs)
        break
      case 'bloque':
        this.dibujarBloque(obs)
        break
      case 'bloqueDoble':
        this.dibujarBloqueDoble(obs)
        break
      case 'sierra':
        this.dibujarSierra(obs)
        break
      case 'picoDoble':
        this.dibujarPicoDoble(obs)
        break
      case 'muroFragil':
        this.dibujarMuroFragil(obs)
        break
      case 'bloqueTriple':
        this.dibujarBloqueTriple(obs)
        break
      case 'bloqueFlotante':
        this.dibujarBloqueFlotante(obs)
        break
      case 'ventana':
        this.dibujarVentana(obs)
        break
    }
  }

  dibujarTrampolin(t) {
    const ctx = this.ctx
    const comprimir = t.animando ? Math.sin(t.frameAnimacion * 0.4) * 4 : 0
    const color = COLORES_PAD[t.variante] || COLORES_PAD.amarillo
    const icono = t.variante === 'azul' ? '⇅' : '↑'

    ctx.fillStyle = color
    ctx.shadowBlur = 12
    ctx.shadowColor = color
    ctx.beginPath()
    ctx.roundRect(t.x, t.y + comprimir, t.ancho, t.alto - comprimir, 4)
    ctx.fill()

    ctx.strokeStyle = color + 'aa'
    ctx.lineWidth = 2
    ctx.shadowBlur = 0
    const segmentos = 4
    for (let i = 0; i <= segmentos; i++) {
      const px = t.x + (i / segmentos) * t.ancho
      ctx.beginPath()
      ctx.moveTo(px, t.y + comprimir)
      ctx.lineTo(px + 4, t.y - 4)
      ctx.stroke()
    }

    ctx.fillStyle = color
    ctx.font = 'bold 14px monospace'
    ctx.textAlign = 'center'
    ctx.fillText(icono, t.x + t.ancho / 2, t.y - 8)
    ctx.textAlign = 'left'

    if (t.animando) {
      t.frameAnimacion++
      if (t.frameAnimacion > 20) {
        t.animando = false
        t.frameAnimacion = 0
      }
    }
  }

  dibujarPlataformaMovil(p) {
    const ctx = this.ctx

    ctx.fillStyle = '#7c3aed'
    ctx.shadowBlur = 10
    ctx.shadowColor = '#7c3aed'
    ctx.beginPath()
    ctx.roundRect(p.x, p.y, p.ancho, p.alto, 4)
    ctx.fill()

    ctx.fillStyle = '#a78bfa'
    ctx.shadowBlur = 0
    ctx.fillRect(p.x + 4, p.y + 1, p.ancho - 8, 3)

    ctx.fillStyle = '#c4b5fd'
    ctx.font = '10px monospace'
    ctx.textAlign = 'center'
    ctx.fillText('↕', p.x + 10, p.y - 4)
    ctx.fillText('↕', p.x + p.ancho - 10, p.y - 4)
    ctx.textAlign = 'left'
  }

  dibujarOrbe(o) {
    if (o.activado) return

    const ctx = this.ctx
    o.pulsacion += 0.08
    const escala = 1 + Math.sin(o.pulsacion) * 0.12
    const color = COLORES_ORBE[o.variante] || COLORES_ORBE.amarillo
    const iconos = { amarillo: '↑', rosa: '↑', rojo: '↑', azul: '⇄', verde: '⇄', negro: '↓' }
    const icono = iconos[o.variante] || '↑'

    ctx.save()
    ctx.translate(o.x, o.y)
    ctx.scale(escala, escala)

    ctx.beginPath()
    ctx.arc(0, 0, o.radio + 6, 0, Math.PI * 2)
    ctx.fillStyle = color + '22'
    ctx.fill()

    ctx.beginPath()
    ctx.arc(0, 0, o.radio, 0, Math.PI * 2)
    ctx.fillStyle = color
    ctx.shadowBlur = 18
    ctx.shadowColor = color
    ctx.fill()

    ctx.beginPath()
    ctx.arc(-o.radio * 0.3, -o.radio * 0.3, o.radio * 0.35, 0, Math.PI * 2)
    ctx.fillStyle = '#ffffff55'
    ctx.shadowBlur = 0
    ctx.fill()

    ctx.fillStyle = '#1f2937'
    ctx.font = `bold ${Math.round(o.radio)}px monospace`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(icono, 0, 1)
    ctx.textBaseline = 'alphabetic'
    ctx.textAlign = 'left'

    ctx.restore()
  }

  dibujarPortalModo(portal) {
    const ctx = this.ctx
    const modo = MODOS[portal.modoDestino]
    const parpadeo = 0.6 + 0.4 * Math.sin(Date.now() * 0.008)

    ctx.save()
    ctx.globalAlpha = parpadeo
    ctx.shadowBlur = 20
    ctx.shadowColor = modo.color
    ctx.strokeStyle = modo.color
    ctx.lineWidth = 3
    ctx.strokeRect(portal.x, portal.y, portal.ancho, portal.alto)
    ctx.globalAlpha = 1
    ctx.shadowBlur = 0

    ctx.textAlign = 'center'
    ctx.fillStyle = modo.color
    ctx.font = '28px sans-serif'
    ctx.fillText(modo.icono, portal.x + portal.ancho / 2, portal.y + portal.alto / 2)
    ctx.font = '10px monospace'
    ctx.fillText(modo.nombre.toUpperCase(), portal.x + portal.ancho / 2, portal.y + portal.alto / 2 + 22)
    ctx.textAlign = 'left'
    ctx.restore()
  }

  dibujarParticulas() {
    const ctx = this.ctx
    this.particulas.forEach((p) => {
      ctx.save()
      ctx.globalAlpha = Math.max(0, p.vida)
      ctx.fillStyle = p.color
      ctx.fillRect(p.x - 3, p.y - 3, 6, 6)
      ctx.restore()
    })
  }

  dibujarBarraCarga() {
    const ctx = this.ctx
    const j = this.jugador
    const pct = j.tiempoPresion / ROBOT_MAX_FRAMES_CARGA

    ctx.save()
    ctx.fillStyle = '#1e293b'
    ctx.fillRect(j.x, j.y - 10, j.ancho, 4)
    ctx.fillStyle = '#fbbf24'
    ctx.fillRect(j.x, j.y - 10, j.ancho * pct, 4)
    ctx.restore()
  }

  dibujarTrail() {
    const ctx = this.ctx
    this.trail.forEach((p) => {
      const alpha = p.vida / p.vidaMax
      ctx.globalAlpha = alpha * 0.7
      ctx.fillStyle = p.color
      ctx.shadowBlur = 6
      ctx.shadowColor = p.color

      switch (p.forma) {
        case 'cuadrado':
          ctx.fillRect(p.x - p.tamano / 2, p.y - p.tamano / 2, p.tamano, p.tamano)
          break
        case 'circulo':
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.tamano / 2, 0, Math.PI * 2)
          ctx.fill()
          break
        case 'rombo':
          ctx.beginPath()
          ctx.moveTo(p.x, p.y - p.tamano / 2)
          ctx.lineTo(p.x + p.tamano / 2, p.y)
          ctx.lineTo(p.x, p.y + p.tamano / 2)
          ctx.lineTo(p.x - p.tamano / 2, p.y)
          ctx.closePath()
          ctx.fill()
          break
        case 'linea':
          ctx.strokeStyle = p.color
          ctx.lineWidth = p.tamano
          ctx.beginPath()
          ctx.moveTo(p.x, p.y - p.tamano)
          ctx.lineTo(p.x, p.y + p.tamano)
          ctx.stroke()
          break
      }

      ctx.shadowBlur = 0
      ctx.globalAlpha = 1
    })
  }

  dibujarMensajeModo() {
    const ctx = this.ctx
    const color = MODOS[this.modoActual].color

    ctx.save()
    ctx.globalAlpha = Math.min(1, this.mensajeModoTimer / 30)
    ctx.font = 'bold 22px monospace'
    ctx.fillStyle = color
    ctx.shadowBlur = 10
    ctx.shadowColor = color
    ctx.textAlign = 'center'
    ctx.fillText(this.mensajeModo, this.canvas.width / 2, 60)
    ctx.textAlign = 'left'
    ctx.restore()
  }

  dibujarUI() {
    const ctx = this.ctx
    const w = this.canvas.width

    ctx.save()

    // Barra superior semitransparente
    ctx.fillStyle = '#00000055'
    ctx.fillRect(0, 0, w, 28)

    // Puntaje
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 13px Inter, system-ui'
    ctx.textAlign = 'left'
    ctx.fillText(this.puntaje.toString().padStart(5, '0'), 12, 18)

    // Barra de progreso
    const pct = Math.min(100, Math.floor(this.puntaje / 20))
    const barX = 80
    const barW = w - 200
    const barH = 3
    ctx.fillStyle = '#ffffff15'
    ctx.beginPath()
    ctx.roundRect(barX, 12, barW, barH, 2)
    ctx.fill()
    ctx.fillStyle = '#22d3ee'
    ctx.shadowBlur = 4
    ctx.shadowColor = '#22d3ee'
    ctx.beginPath()
    ctx.roundRect(barX, 12, (barW * pct) / 100, barH, 2)
    ctx.fill()
    ctx.shadowBlur = 0

    // Porcentaje
    ctx.fillStyle = '#22d3ee'
    ctx.font = 'bold 11px Inter, system-ui'
    ctx.textAlign = 'left'
    ctx.fillText(`${pct}%`, barX + barW + 8, 18)

    // Badge del modo actual
    const modo = MODOS[this.modoActual]
    if (modo) {
      const badgeX = w - 72
      ctx.fillStyle = `${modo.color}22`
      ctx.beginPath()
      ctx.roundRect(badgeX, 6, 64, 18, 9)
      ctx.fill()
      ctx.fillStyle = modo.color
      ctx.font = 'bold 10px Inter, system-ui'
      ctx.textAlign = 'center'
      ctx.fillText(`${modo.icono} ${modo.nombre.toUpperCase()}`, badgeX + 32, 18)
      ctx.textAlign = 'left'
    }

    // Indicador de sonido (M)
    const iconoAudio = audio.habilitado ? '♪' : '✕'
    ctx.fillStyle = audio.habilitado ? '#22d3ee' : '#64748b'
    ctx.font = '10px Inter, system-ui'
    ctx.textAlign = 'right'
    ctx.fillText(`[M] ${iconoAudio}`, w - 80, 18)
    ctx.textAlign = 'left'

    // Velocidad (pequeño, debajo del puntaje)
    ctx.fillStyle = '#64748b'
    ctx.font = '10px monospace'
    ctx.fillText(`vel ${this.velocidad.toFixed(1)}`, 12, this.canvas.height - 8)

    ctx.restore()
  }

  dibujar() {
    this.dibujarFondo()
    this.dibujarSuelo()
    this.slopes.forEach((s) => this.dibujarSlope(s))
    this.trampolin.forEach((t) => this.dibujarTrampolin(t))
    this.plataformasMoviles.forEach((p) => this.dibujarPlataformaMovil(p))
    this.orbes.forEach((o) => this.dibujarOrbe(o))
    this.imanes.forEach((m) => this.dibujarIman(m))
    this.dibujarTrail()

    if (!this.terminado) {
      dibujarForma(
        this.ctx,
        this.modoActual,
        this.jugador.x,
        this.jugador.y,
        this.jugador.ancho,
        this.jugador.alto,
        MODOS[this.modoActual].color,
        this.jugador.rotacion,
        this.modoActual === 'bola' ? this.squashTimer / 8 : 0,
      )
    } else {
      this.dibujarParticulas()
    }

    this.obstaculos.forEach((o) => this.dibujarObstaculo(o))
    this.portalesModo.forEach((p) => this.dibujarPortalModo(p))

    if (this.modoActual === 'robot' && this.jugador.presionando) {
      this.dibujarBarraCarga()
    }

    if (this.mensajeModo) {
      this.dibujarMensajeModo()
    }

    this.dibujarUI()
  }
}
