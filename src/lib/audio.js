// Motor de audio para GeoRunner
// Los efectos se generan con Web Audio API — la música de fondo usa un
// archivo de audio (ver RUTA_MUSICA) reproducido en bucle con <audio>

const RUTA_MUSICA = '/musica-fondo.mp3'

export class AudioEngine {
  constructor() {
    this.ctx = null
    this.habilitado = true
    this.volumenMaster = 0.4
    this.volumenMusica = 0.35
    this.musica = null
    this.musicaDebeSonar = false
  }

  init() {
    if (this.ctx) return
    this.ctx = new (window.AudioContext || window.webkitAudioContext)()
  }

  _crearMusica() {
    if (this.musica) return
    this.musica = new Audio(RUTA_MUSICA)
    this.musica.loop = true
    this.musica.volume = this.volumenMusica
  }

  // Se llama al comenzar la partida (primera presión). Si el archivo de
  // música todavía no existe en /public, el play() simplemente falla en
  // silencio — no rompe nada mientras tanto.
  iniciarMusica() {
    this._crearMusica()
    this.musicaDebeSonar = true
    if (!this.habilitado) return
    this.musica.currentTime = 0
    this.musica.volume = this.volumenMusica
    this.musica.play().catch(() => {})
  }

  // Se llama al morir/perder. Por defecto hace un fade-out corto en vez de
  // cortar de golpe.
  detenerMusica({ fade = true } = {}) {
    this.musicaDebeSonar = false
    if (!this.musica) return

    if (!fade) {
      this.musica.pause()
      return
    }

    const pasos = 10
    const volInicial = this.musica.volume
    let i = 0
    const intervalo = setInterval(() => {
      i++
      if (!this.musica) {
        clearInterval(intervalo)
        return
      }
      this.musica.volume = Math.max(0, volInicial * (1 - i / pasos))
      if (i >= pasos) {
        clearInterval(intervalo)
        this.musica.pause()
        this.musica.currentTime = 0
      }
    }, 30)
  }

  get listo() {
    return this.ctx && this.ctx.state === 'running' && this.habilitado
  }

  _tocar({
    frecuencia = 440,
    tipo = 'square',
    duracion = 0.15,
    volumen = 0.3,
    ataque = 0.01,
    decaimiento = 0.1,
    frecFinal = null,
    distorsion = false,
  }) {
    if (!this.listo) return

    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()

    if (distorsion) {
      const wave = this.ctx.createWaveShaper()
      wave.curve = this._curvaDistorsion(200)
      wave.oversample = '2x'
      gain.connect(wave)
      wave.connect(this.ctx.destination)
    } else {
      gain.connect(this.ctx.destination)
    }

    osc.connect(gain)
    osc.type = tipo

    const t = this.ctx.currentTime
    const vol = volumen * this.volumenMaster

    osc.frequency.setValueAtTime(frecuencia, t)
    if (frecFinal) {
      osc.frequency.exponentialRampToValueAtTime(frecFinal, t + duracion)
    }

    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(vol, t + ataque)
    gain.gain.exponentialRampToValueAtTime(0.001, t + ataque + decaimiento)

    osc.start(t)
    osc.stop(t + duracion + 0.05)
  }

  _curvaDistorsion(cantidad) {
    const muestras = 256
    const curva = new Float32Array(muestras)
    for (let i = 0; i < muestras; i++) {
      const x = (i * 2) / muestras - 1
      curva[i] = ((Math.PI + cantidad) * x) / (Math.PI + cantidad * Math.abs(x))
    }
    return curva
  }

  _secuencia(notas) {
    if (!this.listo) return
    notas.forEach(({ frecuencia, duracion, delay, tipo = 'square', volumen = 0.2 }) => {
      setTimeout(() => {
        this._tocar({
          frecuencia,
          tipo,
          duracion,
          volumen,
          ataque: 0.005,
          decaimiento: duracion * 0.8,
        })
      }, delay * 1000)
    })
  }

  muerte() {
    this._tocar({
      frecuencia: 440,
      frecFinal: 60,
      tipo: 'sawtooth',
      duracion: 0.4,
      volumen: 0.35,
      ataque: 0.01,
      decaimiento: 0.35,
      distorsion: true,
    })
    setTimeout(() => {
      this._tocar({
        frecuencia: 120,
        tipo: 'sawtooth',
        duracion: 0.2,
        volumen: 0.2,
        ataque: 0.001,
        decaimiento: 0.18,
        distorsion: true,
      })
    }, 80)
  }

  cambioModo(modoNuevo) {
    const jingles = {
      cubo: [{ f: 523, d: 0 }, { f: 659, d: 0.08 }, { f: 784, d: 0.16 }],
      nave: [{ f: 880, d: 0 }, { f: 988, d: 0.06 }, { f: 1047, d: 0.12 }],
      bola: [{ f: 392, d: 0 }, { f: 523, d: 0.07 }, { f: 659, d: 0.14 }],
      ovni: [{ f: 659, d: 0 }, { f: 784, d: 0.06 }, { f: 1047, d: 0.12 }],
      ola: [{ f: 440, d: 0 }, { f: 587, d: 0.08 }, { f: 740, d: 0.16 }],
      robot: [{ f: 349, d: 0 }, { f: 440, d: 0.07 }, { f: 523, d: 0.14 }],
    }
    const notas = jingles[modoNuevo] || jingles.cubo
    notas.forEach((n) => {
      setTimeout(() => {
        this._tocar({
          frecuencia: n.f,
          tipo: 'square',
          duracion: 0.1,
          volumen: 0.2,
          ataque: 0.005,
          decaimiento: 0.08,
        })
      }, n.d * 1000)
    })
  }

  portal() {
    this._tocar({
      frecuencia: 200,
      frecFinal: 1200,
      tipo: 'sine',
      duracion: 0.3,
      volumen: 0.3,
      ataque: 0.01,
      decaimiento: 0.28,
    })
  }

  checkpoint() {
    this._secuencia([
      { frecuencia: 659, duracion: 0.1, delay: 0, tipo: 'square', volumen: 0.25 },
      { frecuencia: 880, duracion: 0.15, delay: 0.1, tipo: 'square', volumen: 0.25 },
    ])
  }

  inicio() {
    this._secuencia([
      { frecuencia: 440, duracion: 0.08, delay: 0, tipo: 'square', volumen: 0.2 },
      { frecuencia: 440, duracion: 0.08, delay: 0.3, tipo: 'square', volumen: 0.2 },
      { frecuencia: 880, duracion: 0.15, delay: 0.6, tipo: 'square', volumen: 0.3 },
    ])
  }

  invertirGravedad() {
    this._tocar({
      frecuencia: 300,
      frecFinal: 150,
      tipo: 'sine',
      duracion: 0.2,
      volumen: 0.22,
      ataque: 0.01,
      decaimiento: 0.18,
    })
  }

  toggleMute() {
    this.habilitado = !this.habilitado

    if (this.musica && this.musicaDebeSonar) {
      if (this.habilitado) this.musica.play().catch(() => {})
      else this.musica.pause()
    }

    return this.habilitado
  }
}

export const audio = new AudioEngine()
