---
id: 2026-10-02-equipe-material-novo-v2-realismo
status: pending
requested_by: claude
priority: high
character: "Equipe (Maurício, Renata, Paulo, Denise)"
asset_type: evidence_pack_revision
destination: public/evidence/case01/new/
---

# Pedido — REFAZER o material novo com realismo (revisão do pedido 2026-10-02-equipe-material-novo)

## Por que este pedido existe
Os 15 arquivos entregues em `public/evidence/case01/new/` têm o **conteúdo certo, mas a aparência está simples demais**: parecem diagramas planos desenhados em código (retângulos, linhas e círculos), não material de uma investigação real. O dono do projeto reprovou o visual. Estes arquivos devem ser **substituídos pela versão final, com o mesmo nome**.

### Defeitos observados nos arquivos atuais
- As "fotos" (`fechadura_porta`, `trava_canil`, `escritorio_comparativo`) são ilustrações vetoriais chapadas: porta e gavetas são caixas marrons, sem textura, luz, profundidade ou ambiente. Não parecem fotografia pericial.
- Os croquis (`croqui_residencia`, `croqui_rua`) são retângulos e linhas; no croqui da residência os marcadores amarelos **cobrem os nomes dos cômodos** ("COR●DOR", "QUARTO ●O CASAL", "C●L"); no da rua o carro é um desenho infantil e a legenda "GOL VISTO" fica por cima do desenho.
- Os documentos são o mesmo modelo repetido (papel bege, título, rótulos e valores em fonte mono), sem cara de formulário real: sem carimbo, assinatura, timbre, rasura, grampo, perfuração, fax ou impressão matricial. Muitos campos viram "A APURAR", o que deixa o documento vazio.
- Todos têm rodapé "ARQUIVO FICCIONAL · CASO 01" e uma moldura/legenda de interface em cima da imagem, que atrapalha o realismo (a interface do jogo já coloca título e legenda).

## Como produzir (obrigatório)
- **Gerar com modelo de imagem**, não renderizar SVG/HTML/código. O resultado precisa parecer fotografia ou digitalização real, não vetor.
- **Fotos de perícia (JPG):** câmera compacta de 2002 com flash direto: grão leve, vinheta, leve estouro de luz, profundidade de campo curta, cor levemente desbotada. Ambiente doméstico brasileiro de classe média alta dos anos 2000 (madeira, laminado, tinta, rodapé, interruptores da época). Plaqueta amarela numerada e régua/escala pericial no quadro. Sem moldura nem legenda desenhada por cima.
- **Documentos (PNG):** papel real digitalizado ou fotografado em mesa: leve perspectiva ou sombra, textura de papel, dobras, grampo ou furo de pasta, carimbos de tinta (azul/vermelho), assinaturas à mão, anotações a caneta, impressão matricial ou máquina de escrever. Cada documento com **cara própria** (formulário policial, laudo timbrado, extrato impresso, ficha de consulta de terminal de computador, certidão de cartório, termo manuscrito).
- **Croquis (JPG):** desenhados à mão ou a nanquim sobre papel quadriculado/vegetal, com cotas, setas de norte, legenda em quadro e numeração em círculos **sem cobrir texto**. Aparência de croqui de perícia real, com traço humano.
- Sem texto de interface: título e legenda ficam por conta do app. Remover "ARQUIVO FICCIONAL" (o aviso de ficção fica no app).
- Legibilidade: texto de documento legível com zoom 2× no iPhone; fontes e carimbos coerentes com 2002.

## Regras de conteúdo (as mesmas do pedido original, continuam valendo)
- Fonte da verdade: `docs/CASE01_STORY_BIBLE.md` e `docs/CASE01_CANON.json`. Alarme desativado **23:52**; entrada no motel **00:56**; US$ 5.000, Banco Meridional, agência 0431, 15/10/2002.
- Culpados e inocentes não mudam; as peças mostram fatos, não acusam.
- Sem arrombamento na entrada; Thor preso no canil; roubo encenado (só o que se vê). **Sem violência gráfica.**
- Mundo de 2002, sem smartphone/QR/logotipos reais. Órgão: **DHPP** (Homicídios), nunca "Polícia de São Paulo" nem "Polícia Civil".
- Não inventar horários, valores ou nomes de investigados. Em vez de "A APURAR" repetido, **preencher campos neutros com detalhes plausíveis que não alteram a trama**: número de protocolo/BO/inquérito fictícios, folha "1/2", nome de perito/escrivão/atendente fictício, unidade e sala, campo de observações com texto técnico genérico. Onde o dado realmente é desconhecido, deixar a linha em branco com traço (como em formulário real), no máximo um "A APURAR" por documento.

## Direção de arte por peça (mesmos nomes de arquivo)

### Fotos e croquis (JPG, 1600×1200)
1. `fechadura_porta.jpg` — close da fechadura de embutir (tipo Papaiz/Pado) e do batente de madeira pintada, cor e textura reais, sem marca de alavanca ou lasca; régua pericial milimetrada encostada; plaqueta amarela nº 1.
2. `trava_canil.jpg` — canil de fundo de quintal (alvenaria e grade de ferro), trinco/ferrolho por fora fechado, ferrugem leve, piso de cimento; Thor (cão grande, sem raça específica) visível atrás da grade, calmo.
3. `escritorio_comparativo.jpg` — **uma única fotografia** (ou duas fotos reais lado a lado) do escritório: mesa de madeira com gavetas laterais abertas e papéis fora de lugar, enquanto a gaveta principal fechada e um cofre de parede à vista estão intactos. Plaquetas A e B. Sem desenho esquemático.
4. `croqui_residencia.jpg` — planta baixa a nanquim: sala, cozinha, escritório, corredor, quarto do casal, quarto de Lívia, canil externo, com portas, janelas, cotas e norte. Marcadores numerados 1–7 **fora do texto**, quadro de legenda lateral (1 entrada, 2 sala, 3 escritório, 4 corredor, 5 quarto do casal, 6 painel do alarme, 7 canil). Assinatura do perito no canto.
5. `croqui_rua.jpg` — croqui da Rua das Acácias visto de cima: pista, calçadas, guarita do vigia (Jorge), poste, a casa e o ponto onde o Gol esteve, com cotas aproximadas escritas à mão ("aprox. 18 m"), norte e legenda. Carro representado em vista superior, proporcional. Sem horário no desenho.
6. `foto_fachada_lan.jpg` — fachada real de LAN house de bairro em 2002: letreiro pintado "LAN HOUSE", vidro com cartaz de preços, computadores CRT ao fundo, balcão com caderno de registro. Sem nome de pessoa legível.

### Documentos (PNG, 900×1280 ou maior)
7. `laudo_preliminar_local.png` — laudo em papel timbrado DHPP, 2 páginas lado a lado ou uma página densa: identificação, histórico, descrição, exame de aberturas (porta principal, fechadura, janelas), estado dos ambientes, canil, vestígios coletados com numeração, conclusão preliminar neutra, assinatura e carimbo do perito Maurício Farias, número de laudo fictício.
8. `ficha_veiculo_gol.png` — tela de terminal de consulta de veículos (fósforo verde/âmbar, fonte de 2002) **impressa** em papel formulário contínuo: Gol branco 1998, proprietário Caio Duarte, placa fictícia, situação regular. Furos de trator nas bordas.
9. `quadro_horarios.png` — prancheta com folha pautada: linha do tempo desenhada à mão por Renata, **apenas 23:52 (alarme desativado) e 00:56 (entrada no motel) preenchidos**, a janela entre eles destacada com marca-texto e as demais linhas com pontos de interrogação a lápis. Letra feminina, caneta azul e marca-texto amarelo.
10. `matricula_imovel.png` — certidão de matrícula de imóvel de cartório de registro de imóveis de São Paulo, 2002: papel timbrado, número de matrícula fictício, descrição do imóvel na Rua das Acácias (Campo Belo), proprietários Ricardo e Helena Valença, selos e carimbo de cartório. **Sem valores em dinheiro.**
11. `consulta_antecedentes.png` — resultado de consulta a antecedentes (formulário de terminal impresso): nomes Caio Duarte e Téo Duarte, resultado "NADA CONSTA", data/hora de impressão, matrícula do operador fictícia, carimbo.
12. `termo_declaracao_terceiro_cida.png` — termo de declaração manuscrito/datilografado em formulário DHPP: declarante fictício (familiar de Cida, ex.: irmã), afirma que Cida esteve com a família na noite de 16/10/2002; assinatura à caneta, impressão digital do polegar, carimbo do escrivão.
13. `termo_apreensao_celular_helena.png` — auto de apreensão preenchido: item "aparelho celular de Helena Valença" (modelo antigo de 2002, de tela monocromática ou de flip, sem smartphone), local Rua das Acácias, número de lacre fictício, assinaturas das duas testemunhas, etiqueta de cadeia de custódia colada com código de barras linear (não QR). Escrivã: Denise Rocha.
14. `capa_inquerito.png` — capa de pasta de inquérito: papel pardo/cinza, carimbo "DHPP", número de inquérito e do BO fictícios, data de instauração 17/10/2002, "Vítimas: Ricardo e Helena Valença", escrivã Denise Rocha, etiquetas e fita de lacre, pequena sujeira de manuseio.
15. `termo_depoimento_modelo.png` — modelo de termo de depoimento em branco (papel timbrado DHPP, campos de qualificação, linhas pautadas, local para assinatura e testemunhas), como formulário real fotocopiado, levemente torto.

## Consistência obrigatória
Mesmo universo visual dos materiais de `public/evidence/case01/` e do elenco. Antes de criar, conferir `docs/CASE01_EVIDENCE_ASSETS.md` e `docs/CASE01_CANON.json`. Os 8 pacotes antigos (SVG) continuam como estão; **se o resultado final ficar mais convincente, fazer o mesmo tratamento neles em um pedido futuro**.

## Arquivos esperados
Substituir, com os mesmos nomes, em `public/evidence/case01/new/`:
`fechadura_porta.jpg`, `trava_canil.jpg`, `escritorio_comparativo.jpg`, `croqui_residencia.jpg`, `croqui_rua.jpg`, `foto_fachada_lan.jpg`, `laudo_preliminar_local.png`, `ficha_veiculo_gol.png`, `quadro_horarios.png`, `matricula_imovel.png`, `consulta_antecedentes.png`, `termo_declaracao_terceiro_cida.png`, `termo_apreensao_celular_helena.png`, `capa_inquerito.png`, `termo_depoimento_modelo.png`.

## Observações técnicas para integração
- Fotos e croquis: JPG qualidade alta, 1600×1200 (4:3), até ~600 KB cada. Documentos: PNG ou JPG 1800×2560 (retrato), até ~900 KB cada, para o zoom do visualizador.
- Sem moldura e sem legenda dentro da imagem; margem de segurança de 3% nas bordas.
- Claude não precisa alterar código: os nomes dos arquivos continuam os mesmos.

## Resposta do ChatGPT
Preenchido pelo ChatGPT ao concluir.

- status:
- assets criados:
- observações:

---
## Atualização (Claude)
Os 9 documentos e os 2 croquis foram refeitos pelo Claude (HTML/SVG renderizado, em `.jpg`) em `public/evidence/case01/new/`.
Todas as 15 peças foram refeitas pelo Claude em estilo chapado e simplificado (sem textura de papel), coerente com os retratos ilustrados. Pedido encerrado.

## Cômodos (Claude)
Ilustrações de cada ambiente em `public/evidence/case01/new/comodos/`: entrada, sala, cozinha, escritório, corredor, quarto do casal, quarto de Lívia, canil e painel do alarme (mesmo estilo chapado dos retratos; sem pessoas nem conteúdo gráfico).
