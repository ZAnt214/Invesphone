// Teste de ponta a ponta do app Equipe: bloqueios, conversas, diligências, anexos e desbloqueio do Tel. Helena.
// Uso: npm run build && npx vite preview --port 4173 & ; node tools/e2e/team-materials.mjs
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
let pw; try { pw = require('playwright') } catch { pw = require('/opt/node22/lib/node_modules/playwright') }
const BASE = process.env.BASE || 'http://127.0.0.1:4173/'
const KEY = 'invesphone-case01-v2'
const MEMBERS = ['Sônia', 'Maurício', 'Renata', 'Paulo', 'Denise']
const ALL_CLUES = ['porta_intacta','painel_alarme','cao_canil','escritorio_revirado','valores_intactos','quarto_livia','vitimas_dormindo','agenda_helena','extrato_ricardo','carta_cobranca','lan_paga','brigas_namoro','alibi_cida','pergunta_inventario','vigia_gol','livia_codigo','inconsistencia_caio_codigo','livia_chave','caio_viu_digitando','ameaca_heranca','log_alarme','nota_motel','moto_dolares','cinta_bancaria','caio_horario','busca_dirigida','vigia_horario','caio_saiu_22h30','teo_adiantamento','livia_passou_codigo','confissao_teo']
const NEW_MATERIALS = ['Croqui da residência','Close da fechadura da porta','Foto da trava do canil','Foto comparativa do escritório','Laudo preliminar do local','Ficha do Gol que o vigia viu','Quadro de horários da noite','Matrícula do imóvel','Consulta de antecedentes dos irmãos Duarte','Croqui da Rua das Acácias','Termo de declaração da irmã de Cida','Foto da fachada da LAN house','Auto de apreensão do celular de Helena','Capa do inquérito','Modelo do termo de depoimento']
const save = o => JSON.stringify({ version: 3, screen: 'phone', app: 'team', task: 1, clues: [], interviewed: [], orders: [], requestedMaterials: [], teamTopics: [], score: 0, ...o })
let failures = 0
const check = (ok, msg) => { console.log((ok ? 'OK   ' : 'FALHA') + ' ' + msg); if (!ok) failures++ }

const ONLY = process.env.ONLY || ''
const run = id => !ONLY || ONLY === id
const browser = await pw.chromium.launch()
async function newPage(s) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true })
  const p = await ctx.newPage(); p.errs = []; p.bad = []
  p.on('pageerror', e => p.errs.push(e.message))
  p.on('response', r => { if (r.status() >= 400) p.bad.push(r.status() + ' ' + r.url()) })
  await p.goto(BASE); await p.evaluate(([k, v]) => localStorage.setItem(k, v), [KEY, s]); await p.reload(); await p.waitForTimeout(900)
  return p
}
const chips = async p => p.locator('.tm-chips button:not([disabled])').allTextContents()
async function openMember(p, name) {
  if (await p.locator('.tm-back').count()) await p.locator('.tm-back').click()
  await p.locator('.tm-card', { hasText: name }).click(); await p.waitForTimeout(300)
}
async function exhaust(p, name) {
  await openMember(p, name)
  for (let i = 0; i < 40; i++) {
    const btn = p.locator('.tm-chips button:not([disabled]):not(.done)').first()
    if (!(await btn.count())) break
    await btn.click(); await p.waitForTimeout(4200)
  }
}

// A) bloqueios: com o caso no começo, nenhum material novo pode aparecer
if (run('A')) {
  const p = await newPage(save({ task: 1 }))
  let seen = []
  for (const m of MEMBERS) { await openMember(p, m); seen = seen.concat(await chips(p)) }
  const leaked = NEW_MATERIALS.filter(n => seen.some(t => t.includes(n) && !t.includes('Capa do inquérito') && !t.includes('Modelo do termo')))
  check(leaked.length === 0, 'início do caso: nenhum material avançado aparece (' + (leaked.join(', ') || 'ok') + ')')
  check(!seen.some(t => t.includes('Auto de apreensão')), 'início do caso: auto de apreensão do celular bloqueado')
  check(!seen.some(t => t.includes('Quadro de horários')), 'início do caso: quadro de horários bloqueado')
  check(p.errs.length === 0, 'sem erros de script no início do caso')
}

// B) fluxo completo: todas as conversas e diligências, anexos e imagens
if (run('B')) {
  const p = await newPage(save({ task: 8, clues: ALL_CLUES, interviewed: ['livia','caio','rafael','cida','jorge','teo'], discoveredPeople: ['livia','caio','rafael','cida','jorge','teo'] }))
  for (const m of MEMBERS) await exhaust(p, m)
  let received = 0
  const labels = []
  for (const m of MEMBERS) {
    await openMember(p, m)
    labels.push(...(await p.locator('.tm-chips button.done').allTextContents()))
    const n = await p.locator('.tm-attach').count()
    for (let i = 0; i < n; i++) {
      const btn = p.locator('.tm-attach button').nth(i)
      await btn.scrollIntoViewIfNeeded(); await btn.click(); await p.waitForTimeout(300)
      const total = (await p.locator('.ev-viewer header span').textContent().catch(() => '')) || ''
      const pages = total.includes('/') ? Number(total.split('/')[1]) : 1
      for (let k = 0; k < pages; k++) {
        const ok = await p.evaluate(() => { const im = document.querySelector('.ev-stage img'); return !!im && im.complete && im.naturalWidth > 100 })
        check(ok, `${m}: anexo ${i + 1} peça ${k + 1}/${pages} carregou`)
        received++
        if (k < pages - 1) { await p.locator('.ev-viewer footer button[aria-label="Próxima"]').click(); await p.waitForTimeout(250) }
      }
      await p.locator('.ev-viewer header button').click(); await p.waitForTimeout(150)
    }
  }
  for (const n of NEW_MATERIALS) check(labels.some(l => l.includes(n)), 'recebido na conversa: ' + n)
  check(labels.length >= 23, `total de diligências concluídas: ${labels.length} (esperado ≥ 23)`)
  check(p.bad.length === 0, 'nenhuma imagem com erro HTTP (' + (p.bad.join('; ') || 'ok') + ')')
  check(p.errs.length === 0, 'sem erros de script no fluxo completo (' + (p.errs.join('; ') || 'ok') + ')')
}

// C) Tel. Helena: bloqueado no começo e liberado pelo auto de apreensão
if (run('C')) {
  const p = await newPage(save({ task: 1, interviewed: ['livia','caio'], discoveredPeople: ['livia','caio','rafael','cida'] }))
  const toHome = async () => { const s = JSON.parse(await p.evaluate(k => localStorage.getItem(k), KEY)); s.app = 'home'; await p.evaluate(([k, v]) => localStorage.setItem(k, v), [KEY, JSON.stringify(s)]); await p.reload(); await p.waitForTimeout(900) }
  await toHome()
  check(await p.locator('.hm-orb.lock[aria-label^="Tel. Helena"]').count() === 1, 'Tel. Helena bloqueado antes da apreensão')
  const s = JSON.parse(await p.evaluate(k => localStorage.getItem(k), KEY)); s.app = 'team'; await p.evaluate(([k, v]) => localStorage.setItem(k, v), [KEY, JSON.stringify(s)]); await p.reload(); await p.waitForTimeout(900)
  await openMember(p, 'Denise')
  await p.locator('.tm-chips button', { hasText: 'Como a Lívia se comportou' }).click(); await p.waitForTimeout(4200)
  await p.locator('.tm-chips button', { hasText: 'Auto de apreensão do celular' }).click(); await p.waitForTimeout(4200)
  await toHome()
  check(await p.locator('.hm-orb.lock[aria-label^="Tel. Helena"]').count() === 0, 'Tel. Helena liberado depois do auto de apreensão')
  await p.locator('.hm-orb', { hasText: 'Tel. Helena' }).locator('.hm-orb-btn').click(); await p.waitForTimeout(500)
  check((await p.locator('body').innerText()).includes('DISPOSITIVO APREENDIDO'), 'Tel. Helena abre o aparelho apreendido')
}
// D) bloqueio intermediário: sem ouvir o Téo nem ter a pergunta do inventário, esses materiais não aparecem
if (run('D')) {
  const p = await newPage(save({ task: 5, clues: ['log_alarme', 'nota_motel', 'vigia_gol'], interviewed: ['livia', 'caio'], teamTopics: ['mauricio_cena'], discoveredPeople: ['livia', 'caio', 'rafael', 'cida'] }))
  await openMember(p, 'Renata'); const r = (await chips(p)).join(' | ')
  check(r.includes('Monta a noite num quadro'), 'Renata oferece o quadro de horários com alarme + motel')
  check(!r.includes('irmãos Duarte') && !r.includes('antecedentes'), 'Renata não oferece antecedentes sem ter ouvido o Téo')
  check(!r.includes('imóvel'), 'Renata não oferece a matrícula sem a pergunta sobre inventário')
  await openMember(p, 'Paulo'); const pa = (await chips(p)).join(' | ')
  check(!pa.includes('álibi da Cida') && !pa.includes('fachada'), 'Paulo não oferece termo de Cida nem fachada da LAN sem as pistas')
  check(p.errs.length === 0, 'sem erros de script no teste intermediário')
}
await browser.close()
console.log(failures ? `\n${failures} falha(s)` : '\nTodos os testes passaram')
process.exit(failures ? 1 : 0)
