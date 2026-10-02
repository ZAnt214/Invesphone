---
id: 2026-10-02-equipe-material-novo
status: pending
requested_by: claude
priority: high
character: "Equipe (Maurício, Renata, Paulo, Denise)"
asset_type: evidence_pack_new
destination: public/evidence/case01/new/
---

# Pedido — NOVO material que a equipe entrega ao jogador ao longo do Caso 01

## Objetivo
Os 8 pacotes atuais (fotos da cena, painel, LAN house, motel, log do alarme, documentos financeiros, cinta e índice de gravações) já existem e **não devem ser refeitos**. Este pedido é por **material novo**: peças que cada integrante entrega em momentos diferentes da investigação, dando corpo ao caso, apoiando a leitura do jogador e incluindo pistas falsas ou neutras para que nem tudo pareça prova.

Cada peça chega **depois de uma conversa e de uma diligência** na conversa do integrante (anexo que abre em visualizador com zoom). Nenhuma peça pode revelar prova futura antes do gatilho.

## Regras de conteúdo (obrigatórias)
- Fonte da verdade: `docs/CASE01_STORY_BIBLE.md` e `docs/CASE01_CANON.json`. Horários fixos: alarme desativado **23:52**; entrada no motel **00:56**. Dinheiro: **US$ 5.000, Banco Meridional, agência 0431, 15/10/2002**.
- Culpados e inocentes **não mudam** (Lívia mentora; Caio e Téo executores; Rafael, Cida e Jorge inocentes). Nenhuma peça deve acusar ninguém: mostra fatos, não conclusões.
- Sem arrombamento na entrada principal; Thor estava preso no canil; o roubo é encenação (a peça só mostra o que se vê).
- Sem violência gráfica (nada de corpos, sangue ou ferimentos).
- Mundo de 2002: papel, máquina de escrever/matricial, fax, telefone fixo, sem smartphone, sem QR code, sem logotipos reais.
- Órgão: **DHPP** (Homicídios). Não usar "Polícia de São Paulo" nem "Polícia Civil". Marca d'água DHPP / HOMICÍDIOS discreta, nunca sobre o texto.
- **Não inventar** horários, valores, nomes de investigados ou números além dos listados. Onde faltar dado, usar campo em branco ou "a apurar". Nomes de terceiros (parentes, atendentes, escrivães) podem ser fictícios e neutros.
- Cada peça deve ter `id` único e nome de arquivo exatamente como listado abaixo.

## O que gerar

### Maurício Farias — Perito criminal (cena e vestígios)
Gatilho geral: depois de `fotos_cena` e da conversa `mauricio_cena`.
1. `croqui_residencia` — planta baixa da casa em croqui pericial (sala, cozinha, escritório, corredor, quarto do casal, quarto de Lívia, canil), com marcadores amarelos numerados nos pontos fotografados e legenda. Gatilho: `mauricio_cena`.
2. `fechadura_porta` — foto em close da fechadura e batente da porta principal, sem marcas de força, com escala. Gatilho: pista `porta_intacta`.
3. `trava_canil` — foto em close do trinco do canil (por fora) com Thor ao fundo, sem contenção improvisada. Gatilho: conversa `mauricio_canil`.
4. `escritorio_comparativo` — duas fotos lado a lado: gavetas sem importância abertas × gaveta principal e cofre à vista intactos, com legenda técnica neutra. Gatilho: conversa `mauricio_busca`.
5. `laudo_preliminar_local` — laudo de uma página: descrição do local, estado das aberturas, vestígios coletados. Linguagem técnica, sem apontar autor. Gatilho: ter ouvido ao menos 2 depoimentos e conversado com Maurício.

### Renata Leal — Investigadora (registros e cruzamentos)
6. `ficha_veiculo_gol` — consulta de veículo: Gol branco ano 1998, proprietário Caio Duarte (placa fictícia, sem número real). Gatilho: pista `vigia_gol`.
7. `quadro_horarios` — quadro de horários da noite do crime, feito à mão pela Renata em prancheta: apenas 23:52 (alarme) e 00:56 (motel) preenchidos, com a janela entre eles destacada e as demais linhas "a apurar". Gatilho: `log_alarme` + `nota_motel`.
8. `matricula_imovel` — certidão de matrícula do imóvel da Rua das Acácias, Campo Belo (proprietários Ricardo e Helena Valença; sem valores em dinheiro). Gatilho: pista `pergunta_inventario`.
9. `consulta_antecedentes` — resultado de consulta a antecedentes de Caio e de Téo Duarte: "nada consta" (sem registros anteriores). Gatilho: depois de ouvir Téo. Serve como material neutro que não incrimina nem inocenta.

### Paulo Vieira — Investigador de campo (rua e testemunhas)
10. `croqui_rua` — croqui da Rua das Acácias com a guarita de Jorge, a casa, o poste e o ponto onde o Gol foi visto estacionado, com distâncias aproximadas e sem horário no desenho. Gatilho: conversa `paulo_jorge`.
11. `termo_declaracao_terceiro_cida` — termo de declaração de um familiar de Cida (nome fictício) confirmando que ela estava com a família na noite do crime. Gatilho: pista `alibi_cida`. Material que **inocenta** Cida sem destacar.
12. `foto_fachada_lan` — foto da fachada da LAN house e do balcão com o livro de sessões (sem texto legível além do nome do estabelecimento). Gatilho: `comprovante_lan`.

### Denise Rocha — Escrivã (depoimentos e cartório)
13. `termo_apreensao_celular_helena` — auto de apreensão do celular de Helena Valença (item, hora, local, assinaturas), com etiqueta de cadeia de custódia. **Libera o app "Tel. Helena".** Gatilho: depois de Lívia ouvida e da conversa com Denise sobre o primeiro depoimento.
14. `capa_inquerito` — capa do inquérito do Caso 01 (DHPP, número, data de instauração, escrivã responsável), usada como cabeçalho do Arquivo. Gatilho: início do caso.
15. `termo_depoimento_modelo` — modelo em branco do termo de depoimento assinado (cabeçalho DHPP, campos, linha de assinatura), para uso futuro nos depoimentos. Gatilho: primeiro depoimento concluído.

## Propostas que MUDAM a lógica das provas (não gerar sem aprovação do dono)
Ficam registradas só para decisão do projeto. Não criar arquivos para estas até haver aprovação:
- extrato de ligações do telefone fixo da casa e do celular de Lívia, com ligação para Caio na noite do crime;
- câmera de comércio da região com o Gol passando perto da casa;
- laudo de papiloscopia/digitais no painel do alarme.

## Consistência obrigatória
Todos os arquivos devem ter o mesmo universo visual dos materiais já entregues (`public/evidence/case01/`) e das imagens do elenco. Conferir `docs/CASE01_EVIDENCE_ASSETS.md` antes de criar, para não repetir peças.

## Contexto da cena
Aparece como anexo na conversa individual do integrante, depois do retorno da diligência, e abre em visualizador em tela cheia com zoom e navegação entre as peças. Precisa ser legível no iPhone com zoom.

## Arquivos esperados
Todos em `public/evidence/case01/new/`:
- Fotos e croquis (JPG, 1600×1200): `croqui_residencia.jpg`, `fechadura_porta.jpg`, `trava_canil.jpg`, `escritorio_comparativo.jpg`, `croqui_rua.jpg`, `foto_fachada_lan.jpg`
- Documentos (PNG, 900×1280, texto nítido): `laudo_preliminar_local.png`, `ficha_veiculo_gol.png`, `quadro_horarios.png`, `matricula_imovel.png`, `consulta_antecedentes.png`, `termo_declaracao_terceiro_cida.png`, `termo_apreensao_celular_helena.png`, `capa_inquerito.png`, `termo_depoimento_modelo.png`

## Observações técnicas para integração
- Claude registra cada peça como nova diligência em `src/App.tsx` (com `memberId`, gatilho em `requiresClues`/`requiresTopics`, e `assetPaths`), cria as conversas correspondentes e atualiza `public/evidence/case01/manifest.json` e `src/evidence/case01Materials.ts`.
- Se uma peça precisar de trechos de depoimento, Claude fornece o texto em arquivo separado; não inventar falas.
- Área segura de 3% nas bordas e texto legível com zoom de 2×.

## Resposta do ChatGPT
Preenchido pelo ChatGPT ao concluir.

- status:
- assets criados:
- observações:
