// Auditoria estática e simulação do Caso 01: ids, desbloqueios, pistas alcançáveis, ativos e progressão.
// Uso: node tools/audit/case-audit.mjs
import { build } from 'esbuild'
import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'fs'
import { pathToFileURL } from 'url'
import { tmpdir } from 'os'
import { join } from 'path'

const out = join(tmpdir(), 'case-audit'); mkdirSync(out, { recursive: true })
const R = p => new URL('../../' + p, import.meta.url).pathname

// dados de interrogatório e pistas
await build({ entryPoints: [R('tools/audit/entry.ts')], bundle: true, format: 'esm', platform: 'node', outfile: join(out, 'data.mjs'), logLevel: 'silent' })
// dados da Equipe, extraídos do App.tsx
const app = readFileSync(R('src/App.tsx'), 'utf8')
function slice(startMarker) {
  const i = app.indexOf(startMarker); const open = app.indexOf('[', app.indexOf('=', i)); let d = 0, k = open
  for (; k < app.length; k++) { if (app[k] === '[') d++; else if (app[k] === ']') { d--; if (!d) break } }
  return app.slice(open, k + 1)
}
const mat = readFileSync(R('src/evidence/case01Materials.ts'), 'utf8')
writeFileSync(join(out, 'team.ts'), mat.replace(/^export /gm, 'export ') + `\nexport const teamDialogues:any[] = ${slice('const teamDialogues')}\nexport const teamMaterialRequests:any[] = ${slice('const teamMaterialRequests')}\n`)
await build({ entryPoints: [join(out, 'team.ts')], bundle: true, format: 'esm', platform: 'node', outfile: join(out, 'team.mjs'), logLevel: 'silent' })
const { interrogations, clues, people, acceptedProofs } = await import(pathToFileURL(join(out, 'data.mjs')))
const { teamDialogues, teamMaterialRequests } = await import(pathToFileURL(join(out, 'team.mjs')))

let problems = 0
const bad = (area, msg) => { problems++; console.log(`PROBLEMA [${area}] ${msg}`) }
const note = (msg) => console.log('  · ' + msg)
const clueIds = new Set(clues.map(c => c.id)), personIds = new Set(people.map(p => p.id))
const dupes = (arr) => arr.filter((x, i) => arr.indexOf(x) !== i)

// ---- ids duplicados e referências
dupes(clues.map(c => c.id)).forEach(d => bad('pistas', 'id duplicado ' + d))
dupes(teamDialogues.map(d => d.id)).forEach(d => bad('equipe', 'conversa duplicada ' + d))
dupes(teamMaterialRequests.map(d => d.id)).forEach(d => bad('equipe', 'diligência duplicada ' + d))
const topicIds = new Set(teamDialogues.map(d => d.id)), reqIds = new Set(teamMaterialRequests.map(d => d.id))
const members = new Set(['sonia', 'mauricio', 'renata', 'paulo', 'denise'])
for (const it of [...teamDialogues, ...teamMaterialRequests]) {
  if (!members.has(it.memberId)) bad('equipe', `${it.id}: memberId inválido ${it.memberId}`)
  for (const c of it.requiresClues ?? []) if (!clueIds.has(c)) bad('equipe', `${it.id}: requiresClues desconhecida ${c}`)
  for (const c of it.clueIds ?? []) if (!clueIds.has(c)) bad('equipe', `${it.id}: clueIds desconhecida ${c}`)
  for (const t of it.requiresTopics ?? []) if (!topicIds.has(t)) bad('equipe', `${it.id}: requiresTopics desconhecido ${t}`)
  for (const p of [...(it.requiresInterviewed ?? []), ...(it.revealsPeople ?? []), ...(it.callPeople ?? [])]) if (!personIds.has(p) || !interrogations[p]) bad('equipe', `${it.id}: pessoa sem depoimento/desconhecida ${p}`)
}
for (const r of teamMaterialRequests) {
  if (!r.assetPaths?.length) bad('materiais', `${r.id}: sem assetPaths`)
  for (const a of r.assetPaths ?? []) if (!existsSync(R('public/' + a.replace(/^\//, '')))) bad('materiais', `${r.id}: arquivo não existe ${a}`)
  if (!r.response?.text) bad('materiais', `${r.id}: sem resposta`)
}
// materiais referenciados por perguntas
for (const [pid, cfg] of Object.entries(interrogations)) {
  const ids = cfg.questions.map(q => q.id); dupes(ids).forEach(d => bad('depoimento', `${pid}: pergunta duplicada ${d}`))
  const set = new Set(ids)
  for (const q of cfg.questions) {
    for (const u of q.unlocks ?? []) if (!set.has(u)) bad('depoimento', `${pid}.${q.id}: unlocks desconhecido ${u}`)
    if (q.requiresClue && !clueIds.has(q.requiresClue)) bad('depoimento', `${pid}.${q.id}: requiresClue desconhecida ${q.requiresClue}`)
    if (q.requiresMaterial && !reqIds.has(q.requiresMaterial)) bad('depoimento', `${pid}.${q.id}: requiresMaterial desconhecido ${q.requiresMaterial}`)
    for (const h of q.highlights ?? []) {
      if (!q.answer.includes(h.phrase)) bad('depoimento', `${pid}.${q.id}: trecho "${h.phrase}" não está na resposta`)
      if (!clueIds.has(h.clue)) bad('depoimento', `${pid}.${q.id}: highlight com pista desconhecida ${h.clue}`)
    }
    for (const c of q.clues ?? []) if (!clueIds.has(c)) bad('depoimento', `${pid}.${q.id}: clues desconhecida ${c}`)
    for (const p of q.revealsPeople ?? []) if (!personIds.has(p)) bad('depoimento', `${pid}.${q.id}: revealsPeople desconhecido ${p}`)
  }
  for (const r of cfg.requiredForFinal) { const q = cfg.questions.find(x => x.id === r); if (!q) bad('depoimento', `${pid}: requiredForFinal desconhecida ${r}`); else if (q.requiresClue || q.requiresMaterial) bad('depoimento', `${pid}: ${r} é obrigatória para encerrar mas depende de prova/material`) }
  if (!set.has(cfg.finalQuestion)) bad('depoimento', `${pid}: finalQuestion desconhecida`)
  // alcance dentro do próprio depoimento (ignorando requisitos de prova)
  const reach = new Set(cfg.initial); let ch = true
  while (ch) { ch = false; for (const q of cfg.questions) if (reach.has(q.id)) for (const u of q.unlocks ?? []) if (!reach.has(u)) { reach.add(u); ch = true } }
  for (const r of cfg.requiredForFinal) if (!reach.has(r)) bad('depoimento', `${pid}: obrigatória ${r} nunca é liberada`)
  for (const q of cfg.questions) if (q.id !== cfg.finalQuestion && !reach.has(q.id)) bad('depoimento', `${pid}: pergunta ${q.id} nunca é liberada`)
}
// pistas obtidas em telas fixas do App (Alarm/Timeline/Finance/Bank/Teo)
const screenClues = [...app.matchAll(/addClue\('(\w+)'\)/g)].map(m => m[1]).filter(c => c !== 'agenda_helena')
const sources = new Map()
const addSrc = (id, s) => { if (!sources.has(id)) sources.set(id, []); sources.get(id).push(s) }
for (const [pid, cfg] of Object.entries(interrogations)) for (const q of cfg.questions) { for (const h of q.highlights ?? []) addSrc(h.clue, `${pid}.${q.id}`); for (const c of q.clues ?? []) addSrc(c, `${pid}.${q.id}`) }
for (const d of teamDialogues) for (const c of d.clueIds ?? []) addSrc(c, 'conversa ' + d.id)
for (const r of teamMaterialRequests) for (const c of r.clueIds ?? []) addSrc(c, 'diligência ' + r.id)
for (const c of screenClues) addSrc(c, 'tela do caso')
addSrc('agenda_helena', 'Tel. Helena (Agenda)')
for (const c of clues) if (!sources.has(c.id)) bad('pistas', `pista sem nenhuma fonte: ${c.id}`)
for (const a of acceptedProofs) if (!clueIds.has(a)) bad('relatório', `prova aceita desconhecida ${a}`)

// ---- simulação de progressão: o jogador faz tudo que ficar disponível, em rodadas, até estabilizar
const st = { task: 1, clues: new Set(), topics: new Set(), req: new Set(), interviewed: new Set(), discovered: new Set(['livia', 'caio', 'rafael', 'cida']), summoned: new Set(['livia', 'caio']), progress: {} }
const SUMMON_REQ = { teo: ['log_alarme', 'cinta_bancaria'] }
const gate = it => (it.minTask ?? 0) <= st.task && (it.minInterviews ?? 0) <= st.interviewed.size && !(it.requiresClues ?? []).some(c => !st.clues.has(c)) && !(it.requiresInterviewed ?? []).some(p => !st.interviewed.has(p)) && !(it.requiresTopics ?? []).some(t => !st.topics.has(t))
const prog = pid => st.progress[pid] ??= { asked: new Set(), unlocked: new Set(interrogations[pid].initial) }
const timeline = []
function advanceTask() {
  const heard = ['livia', 'rafael', 'cida', 'jorge', 'caio'].filter(p => st.interviewed.has(p)).length
  let n = st.task
  if (n === 1 && ['porta_intacta', 'painel_alarme', 'cao_canil', 'valores_intactos'].every(c => st.clues.has(c))) n = 2
  if (n === 2 && heard >= 4) n = 3
  if (n === 3 && st.clues.has('log_alarme')) n = 4
  if (n === 4 && st.clues.has('nota_motel')) n = 5
  if (n === 5 && st.clues.has('extrato_ricardo') && st.clues.has('carta_cobranca')) n = 6
  if (n === 6 && st.clues.has('cinta_bancaria') && st.discovered.has('teo')) n = 7
  if (n === 7 && st.clues.has('confissao_teo')) n = 8
  const changed = n !== st.task; st.task = n; return changed
}
// telas fixas que dão pistas sem a Equipe (Alarm/Timeline/Finance/Bank só existem como tela de tarefa; na Home atual não são abertas)
let round = 0, moved = true
while (moved && round++ < 60) {
  moved = false
  for (const t of teamDialogues) if (!st.topics.has(t.id) && gate(t)) { st.topics.add(t.id); (t.clueIds ?? []).forEach(c => st.clues.add(c)); (t.revealsPeople ?? []).forEach(p => st.discovered.add(p)); moved = true; timeline.push(`r${round} conversa ${t.id}`) }
  for (const r of teamMaterialRequests) if (!st.req.has(r.id) && gate(r)) { st.req.add(r.id); (r.clueIds ?? []).forEach(c => st.clues.add(c)); (r.revealsPeople ?? []).forEach(p => st.discovered.add(p)); moved = true; timeline.push(`r${round} diligência ${r.id}`) }
  for (const pid of Object.keys(interrogations)) {
    if (!st.discovered.has(pid) || st.task < 2 && !['livia', 'caio'].includes(pid)) continue
    if (st.task < 2) continue
    if (!st.summoned.has(pid)) { if ((SUMMON_REQ[pid] ?? []).some(c => !st.clues.has(c))) continue; st.summoned.add(pid); moved = true }
    const cfg = interrogations[pid], p = prog(pid)
    let again = true
    while (again) { again = false
      for (const q of cfg.questions) {
        if (!p.unlocked.has(q.id) || p.asked.has(q.id)) continue
        if (q.requiresClue && !st.clues.has(q.requiresClue)) continue
        if (q.requiresMaterial && !st.req.has(q.requiresMaterial)) continue
        p.asked.add(q.id); (q.unlocks ?? []).forEach(u => p.unlocked.add(u)); moved = true; again = true
        for (const h of q.highlights ?? []) st.clues.add(h.clue); for (const c of q.clues ?? []) st.clues.add(c); for (const x of q.revealsPeople ?? []) st.discovered.add(x)
        if (cfg.requiredForFinal.every(r => p.asked.has(r))) p.unlocked.add(cfg.finalQuestion)
      }
    }
    if (p.asked.has(cfg.finalQuestion) && !st.interviewed.has(pid)) { st.interviewed.add(pid); moved = true; timeline.push(`r${round} depoimento ${pid}`) }
  }
  // Tel. Helena abre com a task 3 ou com o auto de apreensão; a Agenda registra a pista
  if ((st.task >= 3 || st.req.has('termo_apreensao_celular_helena')) && !st.clues.has('agenda_helena')) { st.clues.add('agenda_helena'); moved = true; timeline.push(`r${round} Tel. Helena: agenda`) }
  if (advanceTask()) { moved = true; timeline.push(`r${round} → task ${st.task}`) }
}
console.log('\nSimulação (o jogador faz tudo que fica disponível):')
note(`rodadas: ${round - 1}, task final: ${st.task}, pistas ${st.clues.size}/${clues.length}, conversas ${st.topics.size}/${teamDialogues.length}, diligências ${st.req.size}/${teamMaterialRequests.length}, depoimentos ${st.interviewed.size}/${Object.keys(interrogations).length}`)
if (st.task < 8) bad('progressão', `a simulação para na task ${st.task}: o relatório não chega a ser liberado`)
for (const c of clues) if (!st.clues.has(c.id)) bad('alcance', `pista nunca registrada na simulação: ${c.id} (fontes: ${(sources.get(c.id) || []).join(', ')})`)
for (const t of teamDialogues) if (!st.topics.has(t.id)) bad('alcance', `conversa nunca disponível: ${t.id}`)
for (const r of teamMaterialRequests) if (!st.req.has(r.id)) bad('alcance', `diligência nunca disponível: ${r.id}`)
for (const [pid, cfg] of Object.entries(interrogations)) {
  if (!st.interviewed.has(pid)) bad('alcance', `depoimento nunca encerrado: ${pid}`)
  const p = prog(pid); for (const q of cfg.questions) if (!p.asked.has(q.id)) bad('alcance', `pergunta nunca feita: ${pid}.${q.id}`)
}
const proofs = acceptedProofs.filter(a => st.clues.has(a)).length
note(`provas aceitas alcançáveis: ${proofs}/${acceptedProofs.length}`)
console.log(problems ? `\n${problems} problema(s)` : '\nNenhum problema nos dados')
process.exit(problems ? 1 : 0)
