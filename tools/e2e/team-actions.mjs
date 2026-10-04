// Teste: conversas que citam pessoas oferecem chamá-las; materiais dizem para que servem e podem ser apresentados
// em depoimento (inclusive retomando um depoimento já encerrado).
import { createRequire } from 'module'
import { readFileSync } from 'fs'
const require = createRequire(import.meta.url)
let pw; try { pw = require('playwright') } catch { pw = require('/opt/node22/lib/node_modules/playwright') }
const BASE = process.env.BASE || 'http://127.0.0.1:4173/'
const KEY = 'invesphone-case01-v2'
let failures = 0
const check = (ok, msg) => { console.log((ok ? 'OK   ' : 'FALHA') + ' ' + msg); if (!ok) failures++ }
const ids = readFileSync(new URL('../../src/interrogation/livia.ts', import.meta.url), 'utf8').match(/^\s+id:'(\w+)',$/gm).map(l => l.match(/'(\w+)'/)[1]).filter(i => i !== 'livia')
const liviaDone = { asked: ids.filter(i => !i.startsWith('show_')), unlocked: ids, currentQuestion: null, completed: true, noted: [] }
const save = o => JSON.stringify({ version: 3, screen: 'phone', app: 'team', task: 5, clues: [], interviewed: [], orders: [], requestedMaterials: [], teamTopics: [], score: 0, ...o })
const browser = await pw.chromium.launch()
async function page(s) {
  const p = await (await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true })).newPage(); p.errs = []
  p.on('pageerror', e => p.errs.push(e.message))
  await p.goto(BASE); await p.evaluate(([k, v]) => { localStorage.setItem(k, v); localStorage.setItem('invesphone.depoimento-tutorial.v1', '1') }, [KEY, s]); await p.reload(); await p.waitForTimeout(900)
  return p
}
const send = async (p, text) => { await p.locator('.tm-chips button', { hasText: text }).click(); await p.waitForTimeout(300); await p.waitForFunction(() => !document.querySelector('.tm-msg.pending'), null, { timeout: 15000 }); await p.waitForTimeout(200) }
const member = async (p, n) => { if (await p.locator('.tm-back').count()) await p.locator('.tm-back').click(); await p.locator('.tm-card', { hasText: n }).click(); await p.waitForTimeout(250) }

// 1) a conversa cita Jorge: oferece chamar, e depois ouvir
{
  const p = await page(save({ task: 1, discoveredPeople: ['livia', 'caio', 'rafael', 'cida'], teamTopics: [] }))
  await member(p, 'Paulo')
  await send(p, 'O que você conseguiu da rua')
  check(await p.locator('.tm-people button', { hasText: 'Chamar Jorge' }).count() === 1, 'Paulo cita Jorge: oferece "Chamar Jorge para depoimento"')
  await p.locator('.tm-people button', { hasText: 'Chamar Jorge' }).click(); await p.waitForTimeout(300)
  check(await p.locator('.tm-people button', { hasText: 'Ouvir Jorge' }).count() === 1, 'depois de chamar, vira "Ouvir Jorge"')
  const s = JSON.parse(await p.evaluate(k => localStorage.getItem(k), KEY))
  check((s.summonedPeople || []).includes('jorge'), 'Jorge ficou convocado no save')
  await p.locator('.tm-people button', { hasText: 'Ouvir Jorge' }).click(); await p.waitForTimeout(800)
  check(await p.locator('.ii').count() === 1, 'abre o depoimento de Jorge direto da conversa')
  check(p.errs.length === 0, 'sem erros de script (' + p.errs.join('; ') + ')')
}
// 2) material com utilidade e apresentação a um depoimento encerrado
{
  const p = await page(save({ clues: ['porta_intacta', 'livia_chave'], interviewed: ['livia'], teamTopics: ['mauricio_cena', 'mauricio_porta'], discoveredPeople: ['livia', 'caio', 'rafael', 'cida'], liviaInterrogation: liviaDone }))
  await member(p, 'Maurício')
  await send(p, 'Close da fechadura')
  check((await p.locator('.tm-use').first().innerText()).includes('Para apresentar a Lívia'), 'material mostra PARA QUE SERVE')
  const btn = p.locator('.tm-people button', { hasText: 'Retomar depoimento de Lívia' })
  check(await btn.count() === 1, 'oferece retomar o depoimento de Lívia com o material')
  await btn.click(); await p.waitForTimeout(900)
  check(await p.locator('.ii-retake').count() === 1, 'depoimento encerrado mostra RETOMAR DEPOIMENTO')
  await p.locator('.ii-retake').click(); await p.waitForTimeout(500)
  const ask = p.locator('.iv-ask', { hasText: 'fechadura' })
  check(await ask.count() === 1 && (await ask.innerText()).includes('Apresentar'), 'pergunta de apresentar o material aparece')
  await ask.click(); await p.waitForFunction(() => !document.querySelector('.ii-question'), null, { timeout: 60000 }); await p.waitForTimeout(500)
  // a resposta traz a prova de apoio: tocar na frase a registra
  const sent = p.locator('button.ii-sent:not([disabled])'); const n = await sent.count()
  for (let i = 0; i < n; i++) await p.locator('button.ii-sent:not([disabled])').first().click()
  check(JSON.parse(await p.evaluate(k => localStorage.getItem(k), KEY)).clues.includes('livia_porta_aberta'), 'a resposta registra a prova de apoio "Lívia sugere porta deixada aberta"')
  await p.locator('.ii-next').click(); await p.waitForTimeout(400)
  check(await p.locator('.ii-retake-end').count() === 1, 'depois da resposta há VOLTAR AO ARQUIVO (sem encerrar de novo)')
  check(await p.locator('.ii-farewell').count() === 0, 'não reabre a despedida')
  await p.locator('.ii-retake-end').click(); await p.waitForTimeout(400)
  check(await p.locator('.ii-file').count() === 1 && await p.locator('.ii-retake').count() === 0, 'volta ao arquivo, sem perguntas novas pendentes')
  const o = await p.evaluate(() => document.documentElement.scrollHeight - innerHeight)
  check(o <= 1, 'arquivo sem rolagem de página')
  check(p.errs.length === 0, 'sem erros de script (' + p.errs.join('; ') + ')')
}
// 3) provas de apoio no relatório: pessoa descartada, contagem e tela sem rolagem
for (const [w, h] of [[390, 844], [375, 667]]) {
  const p = await (await browser.newContext({ viewport: { width: w, height: h }, hasTouch: true })).newPage(); p.errs = []
  p.on('pageerror', e => p.errs.push(e.message))
  await p.goto(BASE)
  await p.evaluate(([k, v]) => localStorage.setItem(k, v), [KEY, save({ screen: 'task', app: 'home', task: 8, interviewed: ['livia', 'caio', 'rafael', 'cida', 'jorge', 'teo'], clues: ['log_alarme', 'nota_motel', 'cinta_bancaria', 'confissao_teo', 'agenda_helena', 'valores_intactos', 'lan_paga', 'rafael_lan_confirmada', 'livia_porta_aberta'], discoveredPeople: ['livia', 'caio', 'rafael', 'cida', 'jorge', 'teo'] })]); await p.reload(); await p.waitForTimeout(1000)
  check(await p.locator('.choices small.cleared').count() === 1, `${w}x${h}: Rafael aparece como descartado pelas provas no relatório`)
  check((await p.locator('.support-note').innerText()).includes('2/8'), `${w}x${h}: relatório conta as provas de apoio (2/8)`)
  const fit = await p.evaluate(() => { const b = document.querySelector('.task-body'); return b.scrollHeight - b.clientHeight })
  check(fit <= 1, `${w}x${h}: relatório cabe sem rolar (${fit}px)`)
  for (const [g, t] of [['Executores', 'Caio'], ['Executores', 'Téo'], ['Mentor', 'Lívia'], ['Motivo', 'Herança']]) await p.locator(`h3:has-text("${g}") + .choices button`, { hasText: t }).click()
  const pr = p.locator('.proof-grid button'); for (let i = 0; i < 3; i++) await pr.nth(i).click()
  await p.locator('.primary', { hasText: 'Assinar relatório' }).click(); await p.waitForTimeout(500)
  check((await p.locator('body').innerText()).includes('2/8 provas de apoio'), `${w}x${h}: final mostra as provas de apoio`)
  const over = await p.evaluate(() => document.documentElement.scrollHeight - innerHeight)
  check(over <= 1, `${w}x${h}: final sem rolagem de página`)
  check(p.errs.length === 0, `${w}x${h}: sem erros de script`)
}
// 4) as provas de apoio abrem conversas novas e marcam descartados em Pessoas
{
  const p = await page(save({ task: 5, clues: ['lan_paga', 'rafael_lan_confirmada', 'alibi_cida', 'cida_alibi_termo', 'livia_porta_aberta', 'caio_sem_intervalo'], interviewed: ['livia', 'caio', 'rafael', 'cida'], discoveredPeople: ['livia', 'caio', 'rafael', 'cida'], teamTopics: [] }))
  await member(p, 'Denise'); check((await p.locator('.tm-chips').innerText()).includes('tirar Rafael e Cida'), 'Denise oferece fechar Rafael e Cida com as provas de apoio')
  await member(p, 'Sônia'); check((await p.locator('.tm-chips').innerText()).includes('cedendo em pontos diferentes'), 'Sônia comenta as versões cedendo (porta de Lívia + horário de Caio)')
  const q = await page(save({ app: 'interrogate', task: 5, clues: ['lan_paga', 'rafael_lan_confirmada'], interviewed: ['rafael'], discoveredPeople: ['livia', 'caio', 'rafael', 'cida'] }))
  check((await q.locator('.people-list').innerText()).includes('descartado pelas provas'), 'Pessoas marca Rafael como descartado pelas provas')
}
// 5) a conversa segue a ordem real, não o horário do roteiro, e os horários nunca voltam no tempo
{
  const p = await page(save({ task: 4, clues: ['log_alarme', 'vigia_gol'], interviewed: ['livia', 'caio', 'rafael', 'cida'], discoveredPeople: ['livia', 'caio', 'rafael', 'cida'], teamTopics: [] }))
  await member(p, 'Paulo')
  await send(p, 'Vou direto no motel'.slice(0, 0) || 'motel')   // roteiro tardio primeiro
  await send(p, 'O que você conseguiu da rua')                      // roteiro cedo depois
  const texts = await p.locator('.tm-msg.in p').allInnerTexts()
  check(texts[texts.length - 1].includes('Jorge'), 'a conversa mais recente aparece por último, mesmo com horário de roteiro anterior')
  const times = (await p.locator('.tm-msg p span').allInnerTexts()).map(t => t.replace(/[^0-9:]/g, '').slice(0, 5)).filter(t => /^\d\d:\d\d$/.test(t))
  check(times.every((t, i) => i === 0 || t >= times[i - 1]), 'horários crescentes na conversa (' + times.slice(-4).join(' ') + ')')
}
// 6) a leva de anotações da Home é fixa: o que foi feito fica riscado no lugar e só a leva inteira feita é trocada
{
  const batch = [{ id: 'depo-livia', done: 'Interrogatório de Lívia concluído' }, { id: 'call-rafael', done: 'Rafael chamado para depoimento' }, { id: 'call-cida', done: 'Cida chamado para depoimento' }]
  const p = await page(save({ app: 'home', task: 2, clues: ['porta_intacta', 'painel_alarme', 'cao_canil', 'valores_intactos'], interviewed: ['livia'], discoveredPeople: ['livia', 'caio', 'rafael', 'cida'], guideBatch: batch, guideDoneIds: [] }))
  check(await p.locator('.hm-guide li.done').count() === 1 && (await p.locator('.hm-guide li.done').innerText()).includes('Lívia concluído'), 'Home risca no lugar a anotação feita (Lívia interrogada)')
  const open = await p.locator('.hm-guide li button').allInnerTexts()
  check(open.length === 2 && open.some(t => t.includes('Rafael')) && open.some(t => t.includes('Cida')), 'a leva continua com as outras duas, sem repor a anotação riscada por outra')
  const txt = await p.locator('.hm-guide').innerText()
  check(!/missão|tarefa|%|\d+\/\d+/i.test(txt), 'sem cara de missão: sem contagem, porcentagem nem "tarefa"')
  // fazendo as outras duas, a leva inteira fica riscada e depois é trocada por uma nova
  await p.evaluate(k => { const s = JSON.parse(localStorage.getItem(k)); s.summonedPeople = ['livia', 'caio', 'rafael', 'cida']; s.interviewed = ['livia', 'rafael', 'cida']; localStorage.setItem(k, JSON.stringify(s)) }, KEY)
  await p.reload(); await p.waitForTimeout(900)
  check(await p.locator('.hm-guide li.done').count() === 3 && await p.locator('.hm-guide li button').count() === 0, 'com tudo feito, as três anotações aparecem riscadas')
  await p.waitForTimeout(3300)
  const after = JSON.parse(await p.evaluate(k => localStorage.getItem(k), KEY))
  check(after.guideBatch.every(b => !batch.some(o => o.id === b.id)) && (after.guideDoneIds || []).length === 0, 'a leva é trocada por uma nova (' + after.guideBatch.map(b => b.id).join(', ') + ')')
  check(await p.locator('.hm-guide li.done').count() === 0 && await p.locator('.hm-guide li button').count() >= 1, 'a leva nova chega sem nada riscado')
}
await browser.close()
console.log(failures ? `\n${failures} falha(s)` : '\nTodos os testes passaram')
process.exit(failures ? 1 : 0)
