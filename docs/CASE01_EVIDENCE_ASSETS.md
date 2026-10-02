# CASE 01 — PACOTE OFICIAL DE EVIDÊNCIAS

Status: **ARQUIVOS VISUAIS PRONTOS PARA IMPLEMENTAÇÃO**

Base pública:
`/evidence/case01/`

Manifesto:
`public/evidence/case01/manifest.json`

Registro TypeScript:
`src/evidence/case01Materials.ts`

## Regra principal

Quando uma tela, conversa, diligência, pista ou visualizador precisar de um dos materiais abaixo, **use o arquivo existente**.

Não gerar placeholder.
Não redesenhar o documento dentro do componente.
Não alterar nomes, datas, horários ou valores sem mudar primeiro a bíblia do caso.

## Maurício Farias — Perícia

### Fotos completas da cena

Diligência: `fotos_cena`

Arquivos:
- `scene/01-entrada.svg`
- `scene/02-sala.svg`
- `scene/03-escritorio.svg`
- `scene/04-corredor.svg`
- `scene/05-quarto.svg`
- `scene/07-canil.svg`

Leituras visuais:
- entrada sem arrombamento;
- objetos de valor permanecem;
- escritório com busca seletiva;
- circulação interna preservada;
- quarto documentado sem violência gráfica;
- Thor localizado preso no canil.

### Painel do alarme

Diligência: `fotos_painel`

Arquivo:
- `scene/06-painel-teclado.svg`

Mostra teclado, visor e tampa preservados antes da manipulação.

## Paulo Vieira — Campo

### LAN house

Diligência: `comprovante_lan`

Arquivo:
- `docs/lan-house-recibo.svg`

Dados oficiais:
- Rafael Valença;
- 16/10/2002;
- sessão 21:47–01:18;
- terminal 07.

### Motel

Diligência: `registro_motel`

Arquivo:
- `docs/motel-cupom.svg`

Dados oficiais:
- Motel Imperial;
- entrada 00:56;
- suíte 14;
- Gol branco;
- pagamento em dinheiro.

## Renata Leal — Inteligência

### Log do alarme

Diligência: `log_alarme`

Arquivo:
- `docs/log-alarme.svg`

Evento central:
- 23:52;
- sistema desativado;
- código mestre;
- sem violação/corte de linha.

### Documentos financeiros

Diligência: `docs_financeiros`

Arquivos:
- `docs/extrato-ricardo.svg`
- `docs/carta-cobranca.svg`
- `docs/agenda-helena.svg`

O extrato contém a retirada de US$ 5.000 em 15/10/2002, agência 0431.

A carta existe para permitir ao jogador separar dívida antiga de movimentação relevante.

A agenda dá contexto familiar e financeiro; não deve ser tratada sozinha como prova de autoria.

### Cruzamento da cinta

Diligência: `analise_cinta`

Arquivos:
- `docs/apreensao-dolares.svg`
- `docs/cinta-bancaria.svg`
- `docs/analise-cinta.svg`

A nota de análise cruza:
- Banco Meridional;
- agência 0431;
- 15/10/2002;
- US$ 5.000.

O documento deixa explícito que o vínculo financeiro, isoladamente, não prova participação no homicídio.

## Denise Rocha — Cartório

### Gravações dos depoimentos

Diligência: `gravacoes_depoimentos`

Arquivo visual:
- `cartorio/indice-gravacoes.svg`

O índice organiza os depoimentos por fita e marca trechos úteis.

Para reprodução de trechos, a fonte de verdade são as falas já existentes em `src/interrogation/`. Não escrever um segundo depoimento diferente só para o áudio.

## Uso na interface

Os caminhos já estão ligados às diligências por `assetPaths` em `src/App.tsx`.

Ao implementar anexos:
1. material ainda não recebido não aparece;
2. depois do retorno do agente, mostrar miniatura/anexo na conversa;
3. toque abre visualizador em tela cheia;
4. conjuntos de fotos/documentos permitem avançar e voltar;
5. preservar zoom para leitura;
6. o jogador pode voltar à conversa sem perder o estado;
7. registrar pista continua dependendo da mecânica do caso, não apenas de abrir o arquivo.

## Formato

Os arquivos visuais atuais são SVG porque:
- ficam nítidos no iPhone;
- texto de documentos continua legível com zoom;
- pesam pouco;
- podem ser usados diretamente em `<img>`;
- são simples de versionar no GitHub.

Se no futuro uma evidência fotográfica ganhar versão raster mais realista, manter o mesmo ID e atualizar o manifesto sem mudar a lógica narrativa.

## Conteúdo pendente separado

As gravações de depoimento ainda usam as falas do sistema de interrogatório como fonte de verdade. O índice visual está pronto; uma futura camada de áudio deve gerar os trechos a partir dessas falas, sem alterar o conteúdo.

Todo o restante listado no manifesto está pronto como arquivo visual.
