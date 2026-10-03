// Partida completa pela interface, do primeiro toque ao final "CASO ENCERRADO".
// Joga como uma pessoa: segue o cartão da Home, vasculha a cena, chama e ouve cada pessoa que aparece,
// esgota as conversas e diligências da Equipe, e monta o relatório. Registra o ritmo e acusa travas.
// Uso: npm run build && npx vite preview --port 4173 & ; node tools/e2e/full-playthrough.mjs
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
let pw; try { pw = require('playwright') } catch { pw = require('/opt/node22/lib/node_modules/playwright') }
const BASE = process.env.BASE || 'http://127.0.0.1:4173/'
const KEY = 'invesphone-case01-v2'
const t0 = Date.now()
const stamp = () => String(Math.round((Date.now() - t0) / 1000)).padStart(4) + 's'
let failures = 0
const log = m => console.log(stamp() + '  ' + m)
const check = (ok, msg) => { console.log((ok ? 'OK   ' : 'FALHA') + ' ' + msg); if (!ok) failures++ }

const browser = await pw.chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true })
const p = await ctx.newPage()
const errs = [], bad = []
p.on('pageerror', e => errs.push(e.message))
p.on('response', r => { if (r.status() >= 400) bad.push(r.status() + ' ' + r.url()) })
await p.goto(BASE); await p.evaluate(() => localStorage.clear()); await p.reload()

const state = async () => JSON.parse(await p.evaluate(k => localStorage.getItem(k), KEY) || '{}')
const noPageScroll = async where => {
  const o = await p.evaluate(() => document.documentElement.scrollHeight - innerHeight)
  if (o > 1) check(false, `rolagem de página em: ${where} (+${o}px)`)
}
const goHome = async () => {
  for (let i = 0; i < 4; i++) {
    if (await p.locator('.hm-alert').count()) return
    const back = p.locator('.tm-back, .page-head button, .task-head button, .subback').first()
    if (await back.count()) { await back.click(); await p.waitForTimeout(350) } else break
  }
  await p.locator('.hm-alert').waitFor({ timeout: 4000 })
}

// ---------- depoimento ----------
async function interview(name) {
  const dismiss = async () => { const t = p.locator('.ii-tut-actions .go'); if (await t.count()) { const sk = p.locator('.ii-tut-actions .skip'); if ((await sk.innerText().catch(() => '')).trim()) await sk.click().catch(() => {}); else await t.click().catch(() => {}) } }
  await p.locator('.ii').first().waitFor({ timeout: 8000 })
  await dismiss()
  const blocked = []
  let asks = 0
  for (let guard = 0; guard < 80; guard++) {
    await p.waitForTimeout(250)
    await dismiss()
    if (await p.locator('.ii-farewell').count()) break
    if (await p.locator('.ii-file').count()) break
    const sents = p.locator('button.ii-sent:not([disabled])')
    if (await sents.count()) {
      const n = await sents.count()
      for (let i = 0; i < n; i++) { const s = p.locator('button.ii-sent:not([disabled])').first(); if (await s.count()) await s.click() }
      await p.locator('.ii-next').click(); continue
    }
    const asksBtn = p.locator('.iv-ask')
    const total = await asksBtn.count()
    if (total) {
      await asksBtn.first().click(); asks++
      await p.waitForFunction(() => !document.querySelector('.ii-question') , null, { timeout: 60000 })
      continue
    }
    const next = p.locator('.iq-pager button[aria-label="Mais perguntas"]:not([disabled])')
    if (await next.count()) { await next.click(); continue }
    const empty = (await p.locator('.ii-empty').first().textContent().catch(() => '')) || ''
    if (empty) { blocked.push(empty); break }
  }
  log(`${name}: ${asks} perguntas feitas` + (blocked.length ? ` · TRAVADO: ${blocked[0]}` : ''))
  if (await p.locator('.ii-farewell').count()) await p.locator('.ii-farewell').click()
  await p.waitForTimeout(500)
  return { asks, blocked }
}

// ---------- pessoas ----------
async function peopleRound() {
  let any = false
  await goHome()
  await p.locator('.hm-orb', { hasText: 'Pessoas' }).click(); await p.waitForTimeout(400)
  await noPageScroll('lista de pessoas')
  for (let guard = 0; guard < 12; guard++) {
    const s = await state()
    const cards = p.locator('.people-list button:not([disabled])')
    const n = await cards.count()
    let acted = false
    for (let i = 0; i < n; i++) {
      const c = cards.nth(i)
      const text = await c.innerText()
      const nome = text.split('\n')[0].trim()
      if (text.includes('Depoimento registrado')) continue
      if (text.includes('CHAMAR')) { log(`chamando ${nome}`); await c.click(); await p.waitForTimeout(300); acted = true; break }
      log(`ouvindo ${nome}`)
      await c.click(); await interview(nome); any = true; acted = true
      break
    }
    if (!acted) break
    if (!(await p.locator('.people-list').count())) { // voltou para a Home ou outra tela
      await goHome(); await p.locator('.hm-orb', { hasText: 'Pessoas' }).click(); await p.waitForTimeout(400)
    }
  }
  return any
}

// ---------- equipe ----------
async function teamRound() {
  await goHome()
  await p.locator('.hm-orb', { hasText: 'Equipe' }).click(); await p.waitForTimeout(400)
  let did = 0
  for (const name of ['Sônia', 'Maurício', 'Renata', 'Paulo', 'Denise']) {
    if (await p.locator('.tm-back').count()) await p.locator('.tm-back').click()
    await p.locator('.tm-card', { hasText: name }).click(); await p.waitForTimeout(250)
    for (let i = 0; i < 40; i++) {
      const btn = p.locator('.tm-chips button:not([disabled]):not(.done)').first()
      if (!(await btn.count())) break
      const label = (await btn.innerText()).replace(/\n/g, ' · ')
      await btn.click(); await p.waitForTimeout(250)
      await p.waitForFunction(() => !document.querySelector('.tm-msg.pending'), null, { timeout: 15000 })
      await p.waitForTimeout(150)
      did++; log(`  ${name}: ${label}`)
    }
  }
  await noPageScroll('Equipe')
  return did
}

// ============ partida ============
log('começo: primeiro toque')
await p.getByText('Pular ligação').click()
await p.locator('.hm-alert').waitFor({ timeout: 6000 })
let s = await state()
check(s.task === 1, 'depois da ligação o caso está na cena (task 1)')
await noPageScroll('Home')

log('cena: seguindo o cartão da Home')
await p.locator('.hm-alert').click(); await p.waitForTimeout(500)
const spots = p.locator('.scene-map button')
const ns = await spots.count()
for (let i = 0; i < ns; i++) await spots.nth(i).click()
await p.locator('.scene-conclusion .primary').click(); await p.waitForTimeout(500)
s = await state()
check(s.task === 2, 'varredura da cena libera as versões (task 2): task=' + s.task)

log('versões')
await p.locator('.hm-alert').click(); await p.waitForTimeout(500)   // task 2 → Pessoas
for (let guard = 0; guard < 12; guard++) {
  const cards = p.locator('.people-list button:not([disabled])')
  const n = await cards.count(); let acted = false
  for (let i = 0; i < n; i++) {
    const c = cards.nth(i); const text = await c.innerText(); const nome = text.split('\n')[0].trim()
    if (text.includes('Depoimento registrado')) continue
    if (text.includes('CHAMAR')) { log(`chamando ${nome}`); await c.click(); await p.waitForTimeout(300); acted = true; break }
    log(`ouvindo ${nome}`); await c.click(); await interview(nome); acted = true; break
  }
  if (!acted) break
  if (!(await p.locator('.people-list').count())) { await goHome(); await p.locator('.hm-alert').click(); await p.waitForTimeout(500) }
  s = await state()
  if (s.task >= 3) break
}
s = await state()
log(`depois das primeiras versões: task=${s.task}, pistas=${s.clues.length}, ouvidos=${s.interviewed.join(',')}`)
check(s.task >= 3, 'ouvir as pessoas iniciais leva ao retorno técnico (task ≥ 3)')

// ciclos: equipe → pessoas até chegar ao relatório
let lastKey = ''
for (let cycle = 1; cycle <= 8; cycle++) {
  s = await state()
  if (s.task >= 8) break
  log(`ciclo ${cycle}: task=${s.task} pistas=${s.clues.length} descobertas=${(s.discoveredPeople || []).join(',')}`)
  const a = await teamRound()
  const b = await peopleRound()
  s = await state()
  const key = `${s.task}|${s.clues.length}|${s.interviewed.length}|${(s.requestedMaterials || []).length}|${(s.teamTopics || []).length}`
  if (key === lastKey && !a && !b) { check(false, `sem progresso no ciclo ${cycle} (task=${s.task}) — possível trava`); break }
  lastKey = key
}
s = await state()
check(s.task >= 8, `investigação chega ao relatório (task=${s.task})`)
log(`antes do relatório: pistas=${s.clues.length}, materiais=${(s.requestedMaterials || []).length}, conversas=${(s.teamTopics || []).length}, ouvidos=${s.interviewed.join(',')}`)

// relatório
await goHome()
await p.locator('.hm-alert').click(); await p.waitForTimeout(500)
await noPageScroll('Relatório (cabe sem rolar a página?)')
const sel = async (group, text) => p.locator(`h3:has-text("${group}") + .choices button`, { hasText: text }).click()
await sel('Executores', 'Caio'); await sel('Executores', 'Téo')
await sel('Mentor', 'Lívia'); await sel('Motivo', 'Herança')
const proofs = p.locator('.proof-grid button')
const np = await proofs.count()
check(np >= 3, `há ao menos 3 provas aceitas no relatório (${np})`)
for (let i = 0; i < np; i++) await proofs.nth(i).click()
await p.locator('.primary', { hasText: 'Assinar relatório' }).click(); await p.waitForTimeout(600)
const end = await p.locator('body').innerText()
check(end.includes('CASO ENCERRADO'), 'final A: CASO ENCERRADO')
s = await state()
check(s.ending === 'A', 'save registra o final A')

check(errs.length === 0, 'sem erros de script na partida (' + (errs.join('; ') || 'ok') + ')')
check(bad.length === 0, 'nenhuma requisição com erro HTTP (' + (bad.join('; ') || 'ok') + ')')
log('fim da partida')
await browser.close()
console.log(failures ? `\n${failures} falha(s)` : '\nPartida completa sem travas')
process.exit(failures ? 1 : 0)
