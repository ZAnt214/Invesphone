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
  check(await p.locator('.ii-retake-end').count() === 1, 'depois da resposta há VOLTAR AO ARQUIVO (sem encerrar de novo)')
  check(await p.locator('.ii-farewell').count() === 0, 'não reabre a despedida')
  await p.locator('.ii-retake-end').click(); await p.waitForTimeout(400)
  check(await p.locator('.ii-file').count() === 1 && await p.locator('.ii-retake').count() === 0, 'volta ao arquivo, sem perguntas novas pendentes')
  const o = await p.evaluate(() => document.documentElement.scrollHeight - innerHeight)
  check(o <= 1, 'arquivo sem rolagem de página')
  check(p.errs.length === 0, 'sem erros de script (' + p.errs.join('; ') + ')')
}
await browser.close()
console.log(failures ? `\n${failures} falha(s)` : '\nTodos os testes passaram')
process.exit(failures ? 1 : 0)
