---
id: 2026-10-02-equipe-material-entregue
status: pending
requested_by: claude
priority: high
character: "Equipe (Maurício, Renata, Paulo, Denise)"
asset_type: evidence_pack
destination: public/evidence/case01/
---

# Pedido — material que a equipe entrega ao jogador durante o Caso 01

## Objetivo
Cada integrante da equipe entrega material ao jogador dentro da conversa (anexo que abre em visualizador com zoom). Hoje os 8 pacotes existem só como **SVGs provisórios** em `public/evidence/case01/` (fotos desenhadas e documentos vetoriais). Queremos a **versão final, com aparência de material policial real de 2002**, mantendo exatamente o mesmo conteúdo, nomes, datas, horários e valores dos arquivos atuais.

## O que gerar (um conjunto por diligência, mesmo ID do manifesto)

### Maurício Farias — Perito criminal (fotos de cena)
- `fotos_cena` (6 fotos): entrada, sala, escritório, corredor, quarto, canil. Foto de perícia: flash direto, plaqueta numerada amarela, régua/escala, carimbo de data e hora no canto.
  - entrada sem sinal de arrombamento; objetos de valor intactos na sala; escritório com bagunça seletiva (gaveta sem importância aberta, ponto óbvio intacto); corredor preservado; quarto documentado **sem violência gráfica** (sem corpos, sem sangue explícito); Thor (cachorro) preso no canil.
- `fotos_painel` (1 foto): close do teclado e visor do painel do alarme, tampa preservada, sem sinal de violação.

### Paulo Vieira — Investigador de campo (documentos)
- `comprovante_lan`: recibo de LAN house. Rafael Valença, 16/10/2002, sessão 21:47–01:18, terminal 07.
- `registro_motel`: cupom do Motel Imperial. Entrada 00:56, suíte 14, Gol branco, pagamento em dinheiro.

### Renata Leal — Investigadora (registros e perícia)
- `log_alarme`: impressão do log do sistema de alarme. Evento central 23:52, sistema desativado com código mestre, sem violação nem corte de linha.
- `docs_financeiros` (3 peças): extrato bancário de Ricardo (retirada de US$ 5.000 em 15/10/2002, agência 0431), carta de cobrança antiga, agenda de Helena.
- `analise_cinta` (3 peças): foto da apreensão dos dólares, a cinta bancária (Banco Meridional, agência 0431, 15/10/2002, US$ 5.000) e a nota de análise que **deixa explícito que o vínculo financeiro isolado não prova participação no homicídio**.

### Denise Rocha — Escrivã (cartório)
- `gravacoes_depoimentos`: índice de gravações por fita com trechos úteis marcados (apenas o visual; o áudio sai das falas existentes em `src/interrogation/`).

## Consistência obrigatória
- Fonte dos dados: os SVGs atuais e `docs/CASE01_EVIDENCE_ASSETS.md`, `docs/CASE01_STORY_BIBLE.md`, `docs/CASE01_CANON.json`. **Não alterar** nomes, horários, valores, bancos, números de agência/suíte/terminal.
- Mesmos IDs e mesma quantidade de peças por diligência (o jogo já referencia os nomes de arquivo).
- Nenhum material pode revelar prova futura antes do gatilho narrativo: cada peça mostra só o que o próprio documento afirma.
- Marca do órgão: **DHPP** (Homicídios). Não usar "Polícia de São Paulo" nem "Polícia Civil".
- Estilo: realista e sóbrio, sem sensacionalismo, sem gore.

## Contexto da cena
Aparece como anexo na conversa individual do integrante, depois do retorno da diligência, e abre em visualizador em tela cheia com zoom e navegação entre peças. Precisa ser **legível no iPhone** com zoom.

## Arquivos esperados
- Fotos: `public/evidence/case01/scene/01-entrada.jpg`, `02-sala.jpg`, `03-escritorio.jpg`, `04-corredor.jpg`, `05-quarto.jpg`, `06-painel-teclado.jpg`, `07-canil.jpg`
- Documentos: `public/evidence/case01/docs/lan-house-recibo.png`, `motel-cupom.png`, `log-alarme.png`, `extrato-ricardo.png`, `carta-cobranca.png`, `agenda-helena.png`, `apreensao-dolares.jpg`, `cinta-bancaria.png`, `analise-cinta.png`
- Cartório: `public/evidence/case01/cartorio/indice-gravacoes.png`

## Observações técnicas para integração
- Fotos: JPG, proporção 4:3 (1600×1200). Documentos: PNG, retrato 900×1280 (ou 1800×2560 se o texto precisar de zoom), fundo transparente ou papel liso, texto nítido e legível.
- Manter também os SVGs atuais (Claude troca as referências em `src/evidence/case01Materials.ts` e no `manifest.json` quando os arquivos chegarem; os SVGs ficam como reserva).
- Área segura de 3% nas bordas; sem marca d'água por cima do texto.

## Resposta do ChatGPT
Preenchido pelo ChatGPT ao concluir.

- status:
- assets criados:
- observações:
