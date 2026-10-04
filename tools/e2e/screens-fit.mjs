// Nenhuma tela rola a página nem passa da largura, em 390×844 e 375×667.
import { createRequire } from 'module'
import { readFileSync } from 'fs'
const require = createRequire(import.meta.url)
let pw; try { pw = require('playwright') } catch { pw = require('/opt/node22/lib/node_modules/playwright') }
const BASE = process.env.BASE || 'http://127.0.0.1:4173/'
const KEY = 'invesphone-case01-v2'
let failures = 0
const ALL = ['livia','caio','rafael','cida','jorge','teo']
const allClues = [...readFileSync(new URL('../../src/case01.ts', import.meta.url), 'utf8').matchAll(/\{id:'(\w+)',title:/g)].map(m => m[1])
const base = { version: 3, screen: 'phone', app: 'home', task: 8, orders: [], score: 1000, requestedMaterials: [], teamTopics: [], clues: allClues, interviewed: ALL, discoveredPeople: ALL, summonedPeople: ALL }
const SCREENS = [
  ['ligação chegando', { screen: 'incoming' }], ['chamada perdida', { screen: 'missed' }],
  ['home (começo)', { task: 1, clues: [], interviewed: [], discoveredPeople: ['livia','caio','rafael','cida'], summonedPeople: ['livia','caio'] }],
  ['home (meio)', { task: 5, guideBatch: [{ id: 'depo-livia', done: 'Interrogatório de Lívia concluído' }, { id: 'call-rafael', done: 'Rafael chamado para depoimento' }, { id: 'team-renata', done: 'Conversas com Renata em dia' }], guideDoneIds: ['depo-livia'], interviewed: ['livia','caio','rafael','cida'], discoveredPeople: ALL, summonedPeople: ['livia','caio','rafael','cida'] }],
  ['home (fim)', {}],
  ['equipe (lista)', { app: 'team' }], ['pessoas', { app: 'interrogate' }], ['pistas', { app: 'clues' }], ['arquivo', { app: 'chapters' }], ['ajustes', { app: 'settings' }],
  ['tel. helena', { app: 'victim' }], ['relatório', { screen: 'task' }],
  ['final A', { screen: 'ending', ending: 'A' }], ['final B', { screen: 'ending', ending: 'B' }], ['final C', { screen: 'ending', ending: 'C' }],
  ['depoimento (Lívia)', { app: 'livia', task: 3, clues: [], interviewed: [] }], ['depoimento (Téo)', { app: 'depo', depoId: 'teo', task: 3, clues: [], interviewed: [] }],
  ['depoimento encerrado (arquivo)', { app: 'depo', depoId: 'cida' }],
]
const browser = await pw.chromium.launch()
for (const [w, h] of [[390, 844], [375, 667]]) {
  for (const [name, patch] of SCREENS) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: true })
    const p = await ctx.newPage(); const errs = []
    p.on('pageerror', e => errs.push(e.message))
    await p.goto(BASE)
    const save = { ...base, ...patch }
    await p.evaluate(([k, v]) => { localStorage.setItem(k, v); localStorage.setItem('invesphone.depoimento-tutorial.v1', '1') }, [KEY, JSON.stringify(save)])
    await p.reload(); await p.waitForTimeout(1300)
    if (name === 'depoimento encerrado (arquivo)') { // marca o depoimento como encerrado a partir do que o jogo salvou
      await p.evaluate(([k, ids]) => { const s = JSON.parse(localStorage.getItem(k)); s.depositions = { ...(s.depositions || {}), cida: { asked: ids, unlocked: ids, currentQuestion: null, completed: true, noted: [] } }; localStorage.setItem(k, JSON.stringify(s)) }, [KEY, ['where','confirm','climate','visits','dog','office','confront_office','untold']]); await p.reload(); await p.waitForTimeout(1200)
    }
    const m = await p.evaluate(() => ({ v: document.documentElement.scrollHeight - innerHeight, hz: document.documentElement.scrollWidth - innerWidth,
      // conteúdo cortado (overflow escondido) em blocos de texto da tela
      clip: [...document.querySelectorAll('main *')].filter(e => { const cs = getComputedStyle(e); return cs.overflowY === 'hidden' && e.scrollHeight > e.clientHeight + 3 && e.clientHeight > 0 && !cs.webkitLineClamp && !/^(IMG|CANVAS|SVG|svg)$/.test(e.tagName) && cs.display !== '-webkit-box' && !e.className.toString().match(/cp|ii-stage|camera|fx|mark|bg|ambient|scene|spot/) }).slice(0, 3).map(e => (e.className || e.tagName).toString().slice(0, 40)) }))
    const ok = m.v <= 1 && m.hz <= 1 && !errs.length && !m.clip.length
    if (!ok) failures++
    console.log((ok ? 'OK   ' : 'FALHA') + ` ${w}×${h} ${name}` + (ok ? '' : ` (vertical +${m.v}px, horizontal +${m.hz}px${errs.length ? ', erro: ' + errs[0] : ''}${m.clip.length ? ', cortado: ' + m.clip.join(' | ') : ''})`))
    await ctx.close()
  }
}
await browser.close()
console.log(failures ? `\n${failures} tela(s) com problema` : '\nTodas as telas cabem')
process.exit(failures ? 1 : 0)
