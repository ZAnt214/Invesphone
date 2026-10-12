import assert from 'node:assert/strict'
import { CAMERA_PRIORITY, createCameraControl, createLead, damp, deadZoneTarget } from '../src/camera/cameraDirector.js'

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

// Espaço à frente: cresce devagar andando, inverte sem chicotear e, parado, guarda uma fração em vez de voltar ao centro.
{
  const lead = createLead({ rate: 2, restRate: 1.3, rest: .3, maxSpeed: 100 })
  for (let i = 0; i < 60 * 6; i++) lead.update(1, 0, true, 1 / 60, 200, 0)
  assert.ok(lead.x > 190 && lead.x <= 200, `lead andando: ${lead.x}`)
  // inversão: passa por valores intermediários, sem salto de uma só vez
  const steps = []
  for (let i = 0; i < 30; i++) { const before = lead.x; lead.update(-1, 0, true, 1 / 60, 200, 0); steps.push(Math.abs(lead.x - before)) }
  assert.ok(Math.max(...steps) <= 100 / 60 + 1e-9, `inversão brusca: ${Math.max(...steps)}`)
  // parou: mantém ~30% do espaço, na direção em que olha, e não volta ao centro
  for (let i = 0; i < 60 * 20; i++) lead.update(-1, 0, false, 1 / 60, 200, 0, -1)
  near(lead.x, -60, 2)
  // a 30 e a 60 FPS o resultado é o mesmo
  const run = fps => { const l = createLead({ rate: 2, maxSpeed: 1e9 }); for (let i = 0; i < fps; i++) l.update(1, 0, true, 1 / fps, 200, 0); return l.x }
  near(run(30), run(60), 1e-6)
}

console.log('camera-system-test: 17 verificações aprovadas')
