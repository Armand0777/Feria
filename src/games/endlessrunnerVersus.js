import { EndlessRunner } from './endlessrunner'

function dibujarEtiqueta(ctx, nombre, config, offsetX, ancho) {
  ctx.save()
  ctx.fillStyle = 'rgba(0,0,0,0.5)'
  ctx.fillRect(offsetX, 0, ancho, 28)

  ctx.beginPath()
  ctx.fillStyle = config.jugador.color
  ctx.arc(offsetX + 10, 14, 4, 0, Math.PI * 2)
  ctx.fill()

  ctx.font = 'bold 11px monospace'
  ctx.fillStyle = config.jugador.color
  ctx.textAlign = 'left'
  ctx.fillText(nombre, offsetX + 20, 18)

  ctx.font = '10px monospace'
  ctx.fillStyle = '#9ca3af'
  ctx.textAlign = 'right'
  ctx.fillText('TOCA TU LADO', offsetX + ancho - 8, 18)
  ctx.textAlign = 'left'
  ctx.restore()
}

function dibujarPuntajeHeader(ctx, puntaje, config, offsetX, ancho) {
  ctx.save()
  ctx.font = 'bold 14px monospace'
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'center'
  ctx.fillText(`${puntaje}`, offsetX + ancho / 2, 44)
  ctx.textAlign = 'left'
  ctx.restore()
}

function dibujarCountdown(ctx, totalAncho, alto, configJ1, configJ2) {
  ctx.save()
  ctx.fillStyle = 'rgba(10,10,26,0.75)'
  ctx.fillRect(0, 0, totalAncho, alto)

  ctx.textAlign = 'center'
  ctx.font = 'bold 16px monospace'
  ctx.fillStyle = '#22d3ee'
  ctx.fillText('TOCA TU LADO DE LA PANTALLA PARA INICIAR', totalAncho / 2, alto / 2 - 10)

  ctx.font = 'bold 13px monospace'
  ctx.fillStyle = configJ1.jugador.color
  ctx.fillText('J1 ◄ TOCA AQUÍ', totalAncho / 4, alto / 2 + 20)

  ctx.fillStyle = configJ2.jugador.color
  ctx.fillText('TOCA AQUÍ ► J2', (totalAncho / 4) * 3, alto / 2 + 20)

  ctx.textAlign = 'left'
  ctx.restore()
}

export class EndlessRunnerVersus {
  constructor(canvas, configJ1, configJ2) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.anchoMitad = canvas.width / 2
    this.alto = canvas.height

    this.canvasJ1 = new OffscreenCanvas(this.anchoMitad - 2, this.alto)
    this.canvasJ2 = new OffscreenCanvas(this.anchoMitad - 2, this.alto)
    this.ctxJ1 = this.canvasJ1.getContext('2d')
    this.ctxJ2 = this.canvasJ2.getContext('2d')

    this.configJ1 = configJ1
    this.configJ2 = configJ2

    this.juegoJ1 = null
    this.juegoJ2 = null

    this.corriendo = false
    this.terminado = false
    this.ganador = null
    this.frameCount = 0

    this._onKeyDown = null
    this._onKeyUp = null
  }

  reset() {
    this.juegoJ1 = new EndlessRunner(this.canvasJ1, this.configJ1, this.configJ1.modoInicial)
    this.juegoJ2 = new EndlessRunner(this.canvasJ2, this.configJ2, this.configJ2.modoInicial)
    this.corriendo = false
    this.terminado = false
    this.ganador = null
    this.frameCount = 0
  }

  iniciarSiNecesario() {
    if (!this.corriendo) {
      this.juegoJ1.corriendo = true
      this.juegoJ2.corriendo = true
      this.corriendo = true
    }
  }

  presionarJ1() {
    this.iniciarSiNecesario()
    this.juegoJ1.iniciarPresion()
  }

  soltarJ1() {
    this.juegoJ1.soltarPresion()
  }

  presionarJ2() {
    this.iniciarSiNecesario()
    this.juegoJ2.iniciarPresion()
  }

  soltarJ2() {
    this.juegoJ2.soltarPresion()
  }

  // Permite controlar el versus con un solo toque/clic sobre el canvas:
  // la mitad izquierda controla a J1, la derecha a J2.
  presionarEnPosicion(x) {
    if (x < this.anchoMitad) this.presionarJ1()
    else this.presionarJ2()
  }

  soltarEnPosicion(x) {
    if (x < this.anchoMitad) this.soltarJ1()
    else this.soltarJ2()
  }

  registrarControles() {
    this._onKeyDown = (e) => {
      if (e.code === 'KeyW' || e.code === 'Space') {
        e.preventDefault()
        this.presionarJ1()
      } else if (e.code === 'ArrowUp') {
        e.preventDefault()
        this.presionarJ2()
      }
    }

    this._onKeyUp = (e) => {
      if (e.code === 'KeyW' || e.code === 'Space') {
        this.soltarJ1()
      } else if (e.code === 'ArrowUp') {
        this.soltarJ2()
      }
    }

    window.addEventListener('keydown', this._onKeyDown)
    window.addEventListener('keyup', this._onKeyUp)
  }

  limpiarControles() {
    if (this._onKeyDown) window.removeEventListener('keydown', this._onKeyDown)
    if (this._onKeyUp) window.removeEventListener('keyup', this._onKeyUp)
  }

  actualizar() {
    if (!this.corriendo || this.terminado) return

    this.frameCount++

    this.juegoJ1.actualizar()
    this.juegoJ2.actualizar()

    const j1Muerto = this.juegoJ1.terminado
    const j2Muerto = this.juegoJ2.terminado

    if (j1Muerto || j2Muerto) {
      this.terminado = true
      this.corriendo = false

      if (j1Muerto && j2Muerto) this.ganador = 'empate'
      else if (j1Muerto) this.ganador = 'j2'
      else this.ganador = 'j1'
    }
  }

  dibujar() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

    this.juegoJ1.dibujar()
    this.juegoJ2.dibujar()

    this.ctx.drawImage(this.canvasJ1, 0, 0)
    this.ctx.drawImage(this.canvasJ2, this.anchoMitad + 2, 0)

    this.ctx.fillStyle = '#1e293b'
    this.ctx.fillRect(this.anchoMitad - 1, 0, 3, this.alto)

    dibujarEtiqueta(this.ctx, 'JUGADOR 1', this.configJ1, 0, this.anchoMitad)
    dibujarEtiqueta(this.ctx, 'JUGADOR 2', this.configJ2, this.anchoMitad + 2, this.anchoMitad)

    if (this.corriendo) {
      dibujarPuntajeHeader(this.ctx, this.juegoJ1.puntaje, this.configJ1, 0, this.anchoMitad)
      dibujarPuntajeHeader(
        this.ctx,
        this.juegoJ2.puntaje,
        this.configJ2,
        this.anchoMitad + 2,
        this.anchoMitad,
      )
    }

    if (!this.corriendo && !this.terminado) {
      dibujarCountdown(this.ctx, this.canvas.width, this.canvas.height, this.configJ1, this.configJ2)
    }
  }
}
