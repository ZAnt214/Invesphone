import assert from 'node:assert/strict'
import { CAMERA_PRIORITY, createCameraControl, damp, deadZoneTarget } from '../src/camera/cameraDirector.js'

const near = (actual, expected, tolerance = 1e-6) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} não está próximo de ${expected}`)

// O alvo dentro da zona não desloca a câmera; fora dela desloca só o necessário.
assert.deepEqual(
  deadZoneTarget({ x: 100, y: 100 }, { x: 110, y: 108 }, { viewportW: 200, viewportH: 100, zoneX: 20, zoneY: 10 }),
  { x: 100, y: 100, desiredX: 110, desiredY: 108, zoneX: 20, zoneY: 10 },
)
const outside = deadZoneTarget(
  { x: 100, y: 100 },
  { x: 160, y: 130 },
  { viewportW: 200, viewportH: 100, zoneX: 20, zoneY: 10, dirX: 1, lookAheadX: 20 },
)
assert.equal(outside.x, 160)
assert.equal(outside.y, 120)
assert.equal(outside.desiredX, 180)

// O amortecimento exponencial produz o mesmo resultado em 1 s a 30 e 60 FPS.
const simulate = fps => {
  let value = 0
  for (let i = 0; i < fps; i++) value = damp(value, 100, 5, 1 / fps)
  return value
}
near(simulate(30), simulate(60), 1e-9)

// Controle manual tem carência e depois devolve a câmera ao acompanhamento.
const control = createCameraControl({ manualHold: 1000 })
assert.equal(control.beginManual(100), true)
assert.equal(control.focus({ id: 'ambient', priority: CAMERA_PRIORITY.ambient, duration: 100 }, 500), false)
assert.equal(control.resolve(500).mode, 'manual')
assert.equal(control.resolve(1101).mode, 'follow')

// Eventos narrativos não-interrompíveis vencem gesto manual; focos contextuais podem ser interrompidos.
control.focus({ id: 'story', priority: CAMERA_PRIORITY.narrative, duration: 1000, interruptible: false }, 2000)
assert.equal(control.beginManual(2100), false)
assert.equal(control.resolve(2100).focus.id, 'story')
control.cancelFocus('story')
control.focus({ id: 'object', priority: CAMERA_PRIORITY.context, duration: 1000, interruptible: true }, 3000)
assert.equal(control.beginManual(3100), true)
assert.equal(control.resolve(3100).mode, 'manual')

// Redução de movimento encurta mudanças automáticas, sem remover o foco semântico.
const calm = createCameraControl({ reducedMotion: true })
calm.focus({ id: 'calm', priority: CAMERA_PRIORITY.critical, duration: 1200 }, 4000)
assert.equal(calm.resolve(4159).focus.id, 'calm')
assert.equal(calm.resolve(4161).mode, 'follow')

console.log('camera-system-test: 13 verificações aprovadas')
