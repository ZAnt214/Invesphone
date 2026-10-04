// Partida completa pela interface, do primeiro toque ao final "CASO ENCERRADO".
// Joga como uma pessoa que só obedece ao guia de PRÓXIMOS PASSOS da Home: toca no primeiro passo disponível,
// faz o que ele pede (conversar com a equipe, chamar e interrogar, retomar depoimento) e repete até o relatório.
// Registra o ritmo e acusa travas, como um passo do guia que não muda nada.
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
const skip = {}   // pessoa cujo depoimento travou → só tenta de novo quando surgir pista nova
const goHome = async () => {
  for (let i = 0; i < 4; i++) {
    if (await p.locator('.hm-guide').count()) return
    const back = p.locator('.ii-back, .ii-filebar button, .tm-back, .page-head button, .task-head button, .subback').first()
    if (await back.count()) { await back.click(); await p.waitForTimeout(350) } else break
  }
  await p.locator('.hm-guide').waitFor({ timeout: 4000 })
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
    if (await p.locator('.ii-retake').count()) { await p.locator('.ii-retake').click(); await p.waitForTimeout(400); continue }
    if (await p.locator('.ii-retake-end').count() && !(await p.locator('.iv-ask').count()) && !(await p.locator('button.ii-sent:not([disabled])').count())) { await p.locator('.ii-retake-end').click(); await p.waitForTimeout(300); break }
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

// ---------- conversa aberta pelo guia ----------
async function exhaustOpenChat() {
  let did = 0
  for (let i = 0; i < 40; i++) {
    const btn = p.locator('.tm-chips button:not([disabled]):not(.done)').first()
    if (!(await btn.count())) break
    const label = (await btn.innerText()).replace(/\n/g, ' · ')
    await btn.click(); await p.waitForTimeout(250)
    await p.waitForFunction(() => !document.querySelector('.tm-msg.pending'), null, { timeout: 15000 })
    await p.waitForTimeout(150)
    did++; log('    ' + label)
  }
  await noPageScroll('Equipe')
  return did
}

// ============ partida ============
log('começo: primeiro toque')
await p.getByText('Pular ligação').click()
await p.locator('.hm-guide').waitFor({ timeout: 6000 })
let s = await state()
check(s.task === 1, 'depois da ligação o caso está no começo (task 1)')
await noPageScroll('Home')
const first = await p.locator('.hm-guide li').first().innerText()
check(first.includes('Maurício'), 'o primeiro passo do guia manda falar com o Maurício')

const sig = st => JSON.stringify([st.task, st.clues.length, st.interviewed, (st.teamTopics || []).length, (st.requestedMaterials || []).length, st.summonedPeople, (st.discoveredPeople || []).length, st.depositions ? Object.values(st.depositions).map(d => d.asked.length) : 0, st.liviaInterrogation?.asked.length])
let guard = 0, lastTitle = '', lastSig = '', repeats = 0
const seenSteps = []
while (guard++ < 120) {
  s = await state()
  if (s.task >= 8) break
  await goHome(); await noPageScroll('Home')
  const rows = p.locator('.hm-guide li button:not([disabled])')
  // leva toda riscada: a Home troca por uma nova depois de alguns segundos
  for (let w = 0; w < 16 && !(await rows.count()); w++) await p.waitForTimeout(500)
  if (!(await rows.count())) { check(false, `guia sem passo disponível (task=${s.task})`); break }
  const row = rows.first()
  const title = (await row.locator('b').innerText()).trim()
  const tag = (await row.locator('em').innerText()).trim()
  if (title === lastTitle && sig(s) === lastSig) { if (++repeats >= 2) { check(false, `passo do guia sem efeito: "${title}" (task=${s.task})`); break } } else repeats = 0
  lastTitle = title; lastSig = sig(s)
  seenSteps.push(tag.replace('AGORA · ', '') + ' | ' + title)
  log(`guia → ${tag.replace('AGORA · ', '')}: ${title}`)
  await row.click(); await p.waitForTimeout(500)
  if (await p.locator('.tm-chat').count()) await exhaustOpenChat()
  else if (await p.locator('.ii').count()) await interview(title.replace(/ aguarda.*/, '').replace('Retome o depoimento de ', ''))
}
s = await state()
check(s.task >= 8, `seguindo só o guia, a investigação chega ao relatório (task=${s.task}, ${guard} passos)`)
check(seenSteps.some(x => x.startsWith('INTERROGATÓRIO')), 'o guia mandou interrogar pessoas')
check(seenSteps.some(x => x.startsWith('NOVA PESSOA')), 'o guia mandou chamar pessoas novas')
check(seenSteps.some(x => x.startsWith('EQUIPE')), 'o guia mandou abrir conversas da Equipe')
log(`antes do relatório: pistas=${s.clues.length}, materiais=${(s.requestedMaterials || []).length}, conversas=${(s.teamTopics || []).length}, ouvidos=${s.interviewed.join(',')}`)

// relatório
await goHome()
await p.locator('.hm-guide li button').first().click(); await p.waitForTimeout(500)
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
