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
    }

    this.obstaculos = []
    this.portalesModo = []
    this.particulas = []
    this.plataformasMoviles = []
    this.orbes = []
    this.trampolin = []
    this.imanes = []
    this.sobrePlataforma = false
    this.plataformaActual = null
    this.squashTimer = 0
    this.puntaje = 0
    this.velocidad = this.config.juego.velocidadInicial
    this.frameCount = 0
    this.corriendo = false
    this.terminado = false

    this.gravedadInvertida = false
    this.timerInversion = 0

    this.frecuenciaObstaculo = 100
    this.proximoObstaculo = 100
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

    switch (this.modoActual) {
      case 'cubo':
        if (this.jugador.enSuelo) this.saltar()
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
          // Cada salto en el aire pierde fuerza (se va "quedando sin combustible")
          const fuerza = -9 * (1 - this.jugador.saltosAire * 0.18)
          this.aplicarImpulso(fuerza, 3)
          this.jugador.saltosAire++
          this.jugador.enSuelo = false
          audio.salto()
        }
        break
      case 'ola':
        this.jugador.presionando = true
        break
      case 'robot':
        this.jugador.presionando = true
        this.jugador.tiempoPresion = 0
        break
    }
  }

  soltarPresion() {
    switch (this.modoActual) {
      case 'robot':
        if (this.jugador.presionando) {
          const carga = this.jugador.tiempoPresion / 60
          audio.saltoRobot(carga)
          // Curva no lineal: cargar poco da un salto chico desproporcionado,
          // cargar mucho da un salto grande desproporcionado — la decisión importa más
          const impulso = Math.max(-16, -8 - carga ** 1.6 * 8.5)
          this.aplicarImpulso(impulso, 4)
          this.jugador.enSuelo = false
          this.jugador.presionando = false
        }
        break
      case 'nave':
      case 'ola':
        this.jugador.presionando = false
        break
    }
  }

  saltar() {
    if (this.jugador.enSuelo) {
      this.aplicarImpulso(this.config.juego.altoDeSalto, 3)
      this.jugador.enSuelo = false
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

    // Mientras dura el impulso suavizado de un salto, no se le suma gravedad
    // encima (si no, el salto se sentiría igual de brusco que antes)
    const impulsoActivo = j.impulsoRestante > 0
    if (impulsoActivo) {
      j.velocidadY += j.impulsoIncremento
      j.impulsoRestante--
    }

    switch (this.modoActual) {
      case 'cubo':
        if (!impulsoActivo) j.velocidadY += gravedad
        if (!j.enSuelo) j.rotacion += 3
        break

      case 'nave': {
        // Easing: la velocidad se acerca suavemente a un objetivo en vez de
        // sumar/restar de golpe, da una curva más fluida al subir/bajar
        const objetivoNave = j.presionando ? -9 : 7
        j.velocidadY += (objetivoNave - j.velocidadY) * 0.15
        j.velocidadY = Math.max(-9, Math.min(9, j.velocidadY))
        j.rotacion = j.velocidadY * 2
        break
      }

      case 'bola':
        if (this.gravedadInvertida) j.velocidadY -= gravedad
        else j.velocidadY += gravedad
        j.rotacion += 4
        break

      case 'ovni':
        if (!impulsoActivo) j.velocidadY += gravedad * 0.6
        j.rotacion = Math.sin(this.frameCount * 0.1) * 5
        break

      case 'ola': {
        // Easing en vez de cambio instantáneo de dirección
        const objetivoOla = j.presionando ? -7 : 7
        j.velocidadY += (objetivoOla - j.velocidadY) * 0.25
        j.rotacion = j.presionando ? -30 : 30
        break
      }

      case 'robot':
        if (j.presionando && j.enSuelo) {
          // cargando el salto, sin gravedad
        } else if (impulsoActivo) {
          // ya se aplicó arriba; solo gira en el aire
          if (!j.enSuelo) j.rotacion += 4
        } else {
          j.velocidadY += gravedad
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

  aplicarLimites() {
    const j = this.jugador
    const suelo = this.canvas.height - SUELO_ALTO - j.alto

    if (this.modoActual === 'bola') {
      if (j.y >= suelo) {
        j.y = suelo
        j.velocidadY *= -1
        this.squashTimer = 8
      }
      if (j.y <= TECHO) {
        j.y = TECHO
        j.velocidadY *= -1
        this.squashTimer = 8
      }
    } else if (this.modoActual === 'nave' || this.modoActual === 'ola') {
      const max = this.canvas.height - 50
      if (j.y < TECHO) j.y = TECHO
      if (j.y > max) j.y = max
    } else {
      if (j.y >= suelo) {
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
    }
  }

  generarObstaculo() {
    const rand = Math.random()
    const suelo = this.canvas.height - SUELO_ALTO
    const esPrincipiante = this.puntaje < 300

    if (rand < 0.18) {
      // Pico simple
      this.obstaculos.push({
        tipo: 'pico',
        x: this.canvas.width,
        y: suelo - 50,
        ancho: 40,
        alto: 50,
      })
    } else if (rand < 0.3) {
      // Bloque doble
      this.obstaculos.push({
        tipo: 'bloqueDoble',
        x: this.canvas.width,
        y: suelo - 68,
        ancho: 34,
        alto: 68,
      })
    } else if (rand < 0.4 && !esPrincipiante) {
      // Sierra circular (no en modo principiante)
      const radio = 22 + Math.random() * 12
      this.obstaculos.push({
        tipo: 'sierra',
        x: this.canvas.width,
        y: suelo - radio * 2,
        radio,
        rotacion: 0,
        velocidadRotacion: 0.05 + Math.random() * 0.04,
      })
    } else if (rand < 0.48 && !esPrincipiante) {
      // Pico doble techo + suelo
      let altoSuelo = 45 + Math.random() * 25
      const altoTecho = 40 + Math.random() * 20
      const huecoMinimo = 80
      const alturaDisponible = this.canvas.height - SUELO_ALTO
      const huecoReal = alturaDisponible - altoSuelo - altoTecho
      if (huecoReal < huecoMinimo) altoSuelo = alturaDisponible - altoTecho - huecoMinimo

      this.obstaculos.push({
        tipo: 'picoDoble',
        x: this.canvas.width,
        anchoBase: 44,
        altoSuelo,
        altoTecho,
      })
    } else if (rand < 0.56 && !esPrincipiante) {
      // Láser intermitente (mata solo cuando está encendido)
      this.obstaculos.push({
        tipo: 'laser',
        x: this.canvas.width,
        y: 0,
        ancho: 14,
        alto: this.canvas.height - SUELO_ALTO,
        cicloEncendido: 45,
        cicloApagado: 35,
        cicloTimer: 0,
        fase: Math.floor(Math.random() * 80),
        encendido: false,
      })
    } else if (rand < 0.64) {
      // Trampolín (siempre puede aparecer — es positivo)
      this.trampolin.push({
        tipo: 'trampolin',
        x: this.canvas.width,
        y: suelo - 14,
        ancho: 56,
        alto: 14,
        animando: false,
        frameAnimacion: 0,
      })
    } else if (rand < 0.72 && !esPrincipiante) {
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
    } else if (rand < 0.8 && !esPrincipiante) {
      // Orbe de salto
      this.orbes.push({
        tipo: 'orbe',
        x: this.canvas.width,
        y: 60 + Math.random() * 140,
        radio: 14,
        pulsacion: 0,
        activado: false,
      })
    } else if (rand < 0.88 && !esPrincipiante) {
      // Imán invertido: no mata, desestabiliza atrayendo al jugador hacia su centro
      this.imanes.push({
        tipo: 'iman',
        x: this.canvas.width,
        y: this.canvas.height / 2,
        radio: 70,
        pulsacion: 0,
      })
    } else if (rand < 0.95 && !esPrincipiante) {
      // Muro frágil: se rompe si cae encima (plataforma de un solo uso),
      // mata si lo toca de costado
      this.obstaculos.push({
        tipo: 'muroFragil',
        x: this.canvas.width,
        y: suelo - 40,
        ancho: 36,
        alto: 40,
      })
    } else {
      // Pico simple de respaldo
      this.obstaculos.push({
        tipo: 'pico',
        x: this.canvas.width,
        y: suelo - 50,
        ancho: 40,
        alto: 50,
      })
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

  colisionTrampolin(t) {
    const cayendo = this.jugador.velocidadY > 0
    const enX = this.jugador.x + this.jugador.ancho > t.x && this.jugador.x < t.x + t.ancho
    const enY =
      this.jugador.y + this.jugador.alto >= t.y &&
      this.jugador.y + this.jugador.alto <= t.y + t.alto + 6

    if (cayendo && enX && enY) {
      this.aplicarImpulso(this.config.juego.altoDeSalto * 2, 4)
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

  colisionOrbe(o) {
    if (o.activado) return false

    const jcx = this.jugador.x + this.jugador.ancho / 2
    const jcy = this.jugador.y + this.jugador.alto / 2
    const distancia = Math.sqrt((jcx - o.x) ** 2 + (jcy - o.y) ** 2)

    if (distancia < o.radio + 16) {
      o.activado = true
      this.aplicarImpulso(this.config.juego.altoDeSalto - 3, 3)
      this.jugador.enSuelo = false

      for (let i = 0; i < 8; i++) {
        this.particulas.push({
          x: o.x,
          y: o.y,
          vx: (Math.random() - 0.5) * 8,
          vy: (Math.random() - 0.5) * 8,
          vida: 1.0,
          color: '#fde047',
        })
      }
      audio.salto()
      return true
    }
    return false
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

    for (const o of this.orbes) {
      this.colisionOrbe(o)
    }

    this.actualizarColisionPlataforma()

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
      } else if (obs.tipo === 'laser') {
        const margen = 4
        colision =
          obs.encendido &&
          this.jugador.x + margen < obs.x + obs.ancho &&
          this.jugador.x + this.jugador.ancho - margen > obs.x &&
          this.jugador.y + margen < obs.y + obs.alto &&
          this.jugador.y + this.jugador.alto - margen > obs.y
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

    if (this.frameCount % 200 === 0) this.velocidad += 0.3

    if (this.frameCount % 400 === 0 && this.frecuenciaObstaculo > 60) {
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
      if (o.tipo === 'sierra') {
        o.rotacion += o.velocidadRotacion
      } else if (o.tipo === 'laser') {
        o.cicloTimer++
        const ciclo = o.cicloEncendido + o.cicloApagado
        o.encendido = (o.cicloTimer + o.fase) % ciclo < o.cicloEncendido
      }
    })

    this.imanes.forEach((m) => {
      m.x -= this.velocidad
    })
    this.imanes = this.imanes.filter((m) => m.x + m.radio * 2 > 0)

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

    if (this.modoActual === 'robot' && this.jugador.presionando && this.jugador.enSuelo) {
      this.jugador.tiempoPresion = Math.min(this.jugador.tiempoPresion + 1, 60)
    }

    this.actualizarParallax()
    this.actualizarFisica()
    this.aplicarImanes()
    this.jugador.y += this.jugador.velocidadY
    this.actualizarColisionPlataforma()
    this.actualizarTrail()
    this.aplicarLimites()

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

    this.verificarColisiones()
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

  dibujarLaser(obs) {
    const ctx = this.ctx
    ctx.save()

    if (obs.encendido) {
      ctx.fillStyle = '#ef4444'
      ctx.shadowBlur = 16
      ctx.shadowColor = '#ef4444'
      ctx.fillRect(obs.x, obs.y, obs.ancho, obs.alto)
      ctx.fillStyle = '#fecaca'
      ctx.fillRect(obs.x + obs.ancho / 2 - 1.5, obs.y, 3, obs.alto)
    } else {
      ctx.strokeStyle = '#ef444455'
      ctx.lineWidth = 1.5
      ctx.setLineDash([3, 5])
      ctx.strokeRect(obs.x, obs.y, obs.ancho, obs.alto)
      ctx.setLineDash([])
    }

    ctx.restore()
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
      case 'laser':
        this.dibujarLaser(obs)
        break
      case 'muroFragil':
        this.dibujarMuroFragil(obs)
        break
    }
  }

  dibujarTrampolin(t) {
    const ctx = this.ctx
    const comprimir = t.animando ? Math.sin(t.frameAnimacion * 0.4) * 4 : 0

    ctx.fillStyle = '#22c55e'
    ctx.shadowBlur = 12
    ctx.shadowColor = '#22c55e'
    ctx.beginPath()
    ctx.roundRect(t.x, t.y + comprimir, t.ancho, t.alto - comprimir, 4)
    ctx.fill()

    ctx.strokeStyle = '#86efac'
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

    ctx.fillStyle = '#22c55e'
    ctx.font = 'bold 14px monospace'
    ctx.textAlign = 'center'
    ctx.fillText('↑', t.x + t.ancho / 2, t.y - 8)
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

    ctx.save()
    ctx.translate(o.x, o.y)
    ctx.scale(escala, escala)

    ctx.beginPath()
    ctx.arc(0, 0, o.radio + 6, 0, Math.PI * 2)
    ctx.fillStyle = '#fde04722'
    ctx.fill()

    ctx.beginPath()
    ctx.arc(0, 0, o.radio, 0, Math.PI * 2)
    ctx.fillStyle = '#fde047'
    ctx.shadowBlur = 18
    ctx.shadowColor = '#fde047'
    ctx.fill()

    ctx.beginPath()
    ctx.arc(-o.radio * 0.3, -o.radio * 0.3, o.radio * 0.35, 0, Math.PI * 2)
    ctx.fillStyle = '#ffffff55'
    ctx.shadowBlur = 0
    ctx.fill()

    ctx.fillStyle = '#78350f'
    ctx.font = `bold ${Math.round(o.radio)}px monospace`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('↑', 0, 1)
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
    const pct = j.tiempoPresion / 60

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
