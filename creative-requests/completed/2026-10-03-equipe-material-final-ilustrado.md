---
id: 2026-10-03-equipe-material-final-ilustrado
status: superseded
requested_by: claude
priority: high
character: "Equipe (Maurício, Renata, Paulo, Denise) · cenário do Caso 01"
asset_type: evidence_pack_final_art
destination: public/evidence/case01/final/
supersedes: 2026-10-02-equipe-material-novo-v2-realismo
---

# Pedido DEFINITIVO — Arte final do material da equipe (24 imagens)

> **Leia tudo antes de gerar. Este pedido foi escrito para ser feito uma única vez.** Ele tem: (1) o guia de estilo, (2) as regras técnicas, (3) uma ficha completa para cada uma das 24 imagens, (4) o texto exato de cada documento e (5) uma lista de conferência final. Se algo estiver ambíguo, escolha a opção que **mais se parece com o arquivo de referência atual** indicado na ficha.

## 0. Contexto em duas linhas
O jogo (Arquivo Morto / Invesphone) é um app de investigação policial para celular, com **visual ilustrado**: os retratos dos personagens são ilustração digital **estilizada** (formas simplificadas, cores sóbrias, sombreamento suave, fundos escuros). Já existe uma versão provisória de todas as 24 imagens, feita em código por Claude. **Ela acerta o conteúdo, a composição e o canon, mas a arte é simples demais.** Este pedido é para você **refazer cada imagem com qualidade de arte final**.

**Decisões do dono do projeto (valem acima de qualquer outra instrução deste arquivo) — revisadas depois de ver a primeira entrega:**
1. **Ponto de vista de foto de verdade:** cada cena deve parecer uma **foto tirada por uma pessoa com um celular**, de pé, no local: perspectiva real, ângulo em 3/4, enquadramento imperfeito. **Não** pode parecer uma elevação frontal simétrica nem um pôster (a primeira entrega, do escritório, ficou bonita mas frontal e polida demais).
2. **Estilo mais simples, de recortes de papel**, na linha de animação de recortes (a linguagem visual de *South Park*): formas geométricas simples, **cores chapadas**, **contorno escuro fino**, sombra mínima, sem gradiente. Ao mesmo tempo precisa **combinar com os retratos dos personagens** do jogo.
3. **Qualidade de celular baixa:** **não** é para você entregar a imagem já suja. **Entregue limpa e em alta resolução**; o efeito de câmera de celular barato (baixa resolução, ruído, flash estourado, vinheta, compressão) **é aplicado por Claude por código depois**.

**Como usar as referências provisórias:** cada ficha indica o arquivo atual em `public/evidence/case01/new/...`. Ele define **somente a lista de elementos e o que cada um representa — NÃO o enquadramento (que agora é o "Ponto de vista" de cada ficha), a técnica nem o acabamento**. Reproduza os mesmos elementos, e eleve: desenho dos objetos, proporção, riqueza de detalhe, iluminação, materiais, acabamento. **Não copie os defeitos de acabamento** (formas de caixa, sombras uniformes, chapado demais). Nas fotos, os arquivos atuais já vêm com moldura de foto, plaqueta e data aplicadas por pós-processamento; **você NÃO deve desenhar moldura, plaqueta, régua nem data** (ver seção 2).

**Referência de ESTILO oficial (obrigatória, olhe antes de gerar):**
- `public/characters/livia/expressions/defensive.jpg` e as demais expressões em `public/characters/*/expressions/` — é o padrão visual do jogo: ilustração digital **estilizada**, formas limpas e simplificadas, sombreamento suave, **sem contorno preto grosso**, paleta fechada e sóbria, fundo azul-petróleo escuro.
- Imagens provisórias (só como referência de conteúdo e composição; o dono do projeto pediu "como se fosse uma foto, mas em desenho"): `public/evidence/case01/new/comodos/*.jpg` e `public/evidence/case01/new/*.jpg`.

---

## 1. GUIA DE ESTILO — "FOTO DE CELULAR DESENHADA EM RECORTES DE PAPEL"

### 1.1 Em uma frase
**"Uma foto tirada por um policial com um celular no local do crime, mas desenhada como animação de recortes de papel: formas simples, cores chapadas, contorno escuro fino, perspectiva de foto real."**

### 1.2 Estilo visual: recortes de papel (linguagem de *South Park*) + combinar com os retratos
- **Inspiração:** animação de **recortes de papel / colagem digital**, como a de *South Park*. **Referência apenas de linguagem visual** (formas básicas, cor chapada, contorno fino, sombra mínima). **Não copie** personagens, cenários, logotipos nem elementos reconhecíveis da série.
- **Âncora dos personagens:** abra `public/characters/livia/expressions/defensive.jpg` (e uma expressão de outro personagem em `public/characters/*/expressions/`). Eles já são simples, chapados e sóbrios. As cenas devem parecer **irmãs** dos retratos: mesmo clima **escuro, sério, contido**. Não pode ficar colorido demais, engraçado, infantil nem caricato. **Teste de aprovação:** ao lado de `defensive.jpg`, devem parecer do mesmo jogo.
- **Construção:** cada objeto é feito de **formas simples** (retângulos, círculos, trapézios, elipses) como **peças recortadas**, com cantos levemente irregulares ou arredondados.
- **Contorno:** **linha escura fina e uniforme** (`#0b141c`) em volta dos objetos e das divisões principais. Espessura aproximada de 0,25% da largura da imagem.
- **Cor:** **uma cor chapada por superfície**, no máximo **um tom de sombra plano** por objeto (uma forma mais escura, de borda nítida). **Sem gradiente suave, sem brilho especular realista, sem textura de madeira ou tecido.**
- **Detalhe por símbolo, não por textura:** livros = retângulos coloridos; papel = retângulo claro com 2 a 3 riscos; madeira = cor lisa com no máximo uma linha de veio; vidro = azul-claro chapado com um reflexo diagonal simples; metal = cinza chapado com uma faixa clara.
- **Riqueza vem da quantidade e da escolha dos objetos** (o ambiente precisa parecer habitado e crível), não de acabamento fotográfico.
- **Paleta:** sóbria e levemente dessaturada (seção 1.7). Fundo geral escuro; tons terrosos quentes (madeira, latão) contra azuis-petróleo e cinzas.
- Textura de papel só se for **muito sutil**; nunca realista.

### 1.3 Ponto de vista e enquadramento — OBRIGATÓRIO (corrige a primeira entrega)
A imagem tem que parecer **tirada de verdade por uma pessoa de pé, com um celular na mão**:
- **Perspectiva real de foto**: paredes e piso **convergindo**, móveis vistos em **3/4**, objetos do primeiro plano maiores. **Proibido** elevação frontal simétrica, vista "de catálogo", vista isométrica ou de cima.
- **Câmera na altura do peito/olhos (≈ 1,4 a 1,6 m)** nas cenas de cômodo; nos closes, a poucas dezenas de centímetros do objeto.
- **Enquadramento imperfeito, de quem tirou rápido:** assunto principal **levemente fora do centro**, **horizonte inclinado 2° a 4°**, **algo cortado pela borda** (canto de móvel, batente, objeto em primeiro plano), composição **assimétrica**. Nada de simetria perfeita.
- **Lente de celular:** leve grande-angular (paredes um pouco esticadas nas bordas), sem distorção exagerada.
- Mesmo com perspectiva, **mantenha o desenho simples e chapado**: pense em planos de papel inclinados em colagem, **nunca em render 3D**.
- Cada ficha da seção 3 traz o **"Ponto de vista"** exato desta cena. **Ele manda sobre a composição frontal das imagens de referência.**

### 1.4 Luz e acabamento (o efeito de câmera ruim é de Claude)
- **Iluminação chapada e uniforme**, como de flash ou luz ambiente neutra: superfícies voltadas para a câmera claras, laterais mais escuras (um único tom plano).
- **Sombras recortadas simples:** uma forma escura de borda nítida sob/atrás dos móveis e objetos. Sem sombra difusa.
- **NÃO desenhe**: vinheta, granulado, desfoque, estouro de flash, aberração cromática, baixa resolução, artefato de compressão nem "aspecto de foto ruim". **Claude aplica tudo isso por código depois**, e se você aplicar também, a imagem fica destruída. **Entregue a arte limpa, nítida e em alta resolução.**

### 1.5 Obrigatório em todas as cenas
- **Mundo de 2002**: TV de tubo, monitor CRT, telefone fixo com fio, celular grafite de antena curta e tela monocromática, abajur de pano, móveis de madeira de classe média alta. **Nenhum smartphone, tela plana, notebook fino moderno, LED, QR code, logotipo ou marca real.**
- **Escala e proporção plausíveis** dos objetos (porta ≈ 2 m, sofá ≈ 2 m, mesa ≈ 1,4 m), mesmo na versão simplificada.
- **Sem pessoas** em nenhuma imagem. **Sem sangue, corpo, ferimento ou qualquer violência.** Sem armas.

### 1.6 Proibido
- **Fotorrealismo** (não pode parecer fotografia), render 3D, gradientes suaves, sombras difusas, pintura com pincelada, estilo anime, "low poly", brilho especular realista, texturas realistas de madeira/tecido.
- Qualquer texto, letreiro, legenda, assinatura, marca d'água ou numeração desenhada na imagem — **exceto** os textos explicitamente listados na ficha (letreiro "LAN HOUSE", visor "DESARMADO", teclas 1–9, *, 0, #).
- Moldura, borda, data da câmera, **plaqueta amarela numerada, régua pericial** (Claude aplica depois, por código).
- Qualquer elemento que mude o canon (seção 6).

### 1.7 Paleta de referência (ponto de partida; variações de luz e matiz permitidas)
| Uso | Hex aproximado |
|---|---|
| Fundo escuro do jogo / contornos / sombras | `#16222c` · `#0b141c` |
| Paredes (azul-petróleo/acinzentado) | `#3f5568` · `#47586a` · `#2f414f` · `#56627a` |
| Madeira de móveis e portas | `#a97a48` · `#8a5a32` · `#9b6a3d` · `#6a4a2a` |
| Piso de tábuas | `#5d4a3a` · `#4a4036` |
| Tecidos (acentos) | vinho `#7a3f3a` · azul `#3d6a8a` · mostarda `#d6b257` · lilás `#7a85c0` |
| Latão/metal quente | `#d6b257` · `#bf9644` |
| Metal frio | `#9aa4aa` · `#c9d1d5` |
| Papel (documentos) | `#ece8dc` |

### 1.8 Composição e margem de segurança
- **4:3 horizontal.** Conteúdo importante dentro de 92% central (lembre: "algo cortado pela borda" deve ser **secundário**, nunca um elemento obrigatório da ficha).
- **Zona livre obrigatória:** o **canto inferior direito** (aprox. 20% da largura × 24% da altura) deve conter **apenas piso/solo/parede lisa**, sem objeto importante, porque ali Claude coloca a plaqueta amarela e a régua.

---

## 2. ESPECIFICAÇÕES TÉCNICAS DE ENTREGA

| Item | Cenas e plantas (15 imagens) | Documentos (9 imagens) |
|---|---|---|
| Proporção | **4:3 horizontal** | **retrato 1350 × 1920** (≈ 0,703) |
| Tamanho | **2400 × 1800 px** (mínimo aceitável 1600 × 1200) | **2025 × 2880 px** (mínimo 1350 × 1920) |
| Formato | **PNG** sem transparência | **PNG** sem transparência |
| Pasta de destino | `public/evidence/case01/final/` | `public/evidence/case01/final/` |
| Moldura / plaqueta / régua / data | **NÃO desenhar** | **NÃO desenhar** moldura extra (ver 4.1 para o cartão de papel) |

**Nomes de arquivo (exatos, minúsculas, sem acento):** os mesmos da ficha, com extensão `.png`. Subpasta `final/comodos/` para as 9 cenas de cômodo (`comodo_0X_*.png`); as demais ficam direto em `final/`.

**Pós-processamento que Claude fará (não faça você):** aplicar o **efeito de foto de celular de baixa qualidade** (resolução baixa, ruído, flash estourado, vinheta, compressão, leve aberração de lente), a data da câmera, a plaqueta amarela numerada e a régua; converter para JPG; ligar ao jogo. Por isso as cenas precisam chegar **limpas**, com a zona livre do canto inferior direito.

**Se você não conseguir garantir texto 100% correto em algum documento**, entregue assim mesmo a melhor tentativa **e avise** na seção "Resposta do ChatGPT"; Claude conferirá letra por letra e, se houver erro, a versão provisória atual permanece até a correção.

---

## 3. FICHAS DAS 13 CENAS (ilustrações com efeito de foto)

> Em todas: estilo da seção 1 (**recortes de papel + combinar com os retratos**) e **ponto de vista de foto de celular (seção 1.3)**, 4:3, 2400×1800 PNG, sem pessoas, sem texto (salvo indicado), zona livre no canto inferior direito.
> "Referência atual" = arquivo provisório com a composição a seguir (veja o arquivo antes de gerar).

> **Leitura obrigatória das fichas:** as descrições abaixo listam **os elementos** de cada cena. O **enquadramento** é o "Ponto de vista" de cada ficha (foto de celular, perspectiva real). Onde a descrição falar em luz em cone, brilhos, reflexos ou sombras suaves, **simplifique para formas chapadas** de recortes de papel (um reflexo = uma faixa clara; um feixe de luz = um polígono claro e plano; uma sombra = uma forma escura de borda nítida).

### 3.1 `comodo_01_entrada.png` — Entrada / porta principal
- **Uso no jogo:** foto nº 1 do pacote "Fotos completas da cena" (Maurício). Mostra que a entrada **não foi arrombada**.
- **Referência atual:** `public/evidence/case01/new/comodos/comodo_01_entrada.jpg`
- **Ponto de vista (foto tirada por uma pessoa):** Câmera na altura do peito, a ~2 m da porta e deslocada para a **esquerda** dela, em **3/4**: a porta aparece levemente de lado, o aparador e o espelho entram pela direita em perspectiva, o capacho em primeiro plano cortado pela borda inferior. Horizonte inclinado ~3°.
- **Cena:** hall de entrada de casa de classe média alta, noite/interior iluminado, parede azul-petróleo com listras discretas, piso de tábuas escuras.
- **Elementos (esquerda → direita):**
  1. Cabideiro de madeira na parede com prateleira de chapéu e dois casacos pendurados (um vinho, um azul-aço), um chapéu na prateleira. Arandela de parede pequena e acesa (luz quente em cone suave para baixo), ao lado da porta.
  2. **Porta principal ao centro**, madeira cor de mel, **quatro almofadas (painéis) em relevo**, batente escuro, duas dobradiças pretas visíveis na borda esquerda, **olho mágico** centralizado na parte alta, **fechadura de embutir em latão** (roseta redonda + cilindro) à direita na altura da mão, mais uma tranca/ferrolho pequeno em latão abaixo. **A porta está fechada, intacta: sem arranhões, sem lascas, sem marcas de alavanca, sem amassado, batente íntegro.**
  3. Em frente à porta: soleira de madeira e **capacho vinho** com trama discreta.
  4. À direita: **aparador de madeira** com espelho/quadro de moldura escura acima (vidro azul-claro com reflexo), sobre o aparador uma caixinha de latão, um vaso/garrafa vermelha com talo, uma maçã vermelha; **bandeja de chaves** e um **par de sapatos** na prateleira de baixo.
- **Luz:** quente, vinda da arandela; sombras de contato sob aparador e cabideiro.
- **Obrigatório:** porta visivelmente **íntegra**. **Proibido:** marcas de força, objetos caídos, bagunça.
- **Zona livre:** canto inferior direito (parte do piso).

### 3.2 `comodo_02_sala.png` — Sala
- **Uso:** foto nº 2 do pacote de cena. Mostra os **bens de valor preservados** (contradiz roubo comum).
- **Referência atual:** `public/evidence/case01/new/comodos/comodo_02_sala.jpg`
- **Ponto de vista (foto tirada por uma pessoa):** Câmera no **canto de entrada da sala**, em diagonal: o sofá em 3/4 no centro, a TV e a estante à direita em perspectiva, a janela ao fundo à esquerda; a mesa de centro parcialmente cortada pela borda inferior.
- **Cena:** sala de estar arrumada, parede azul-acinzentada com listras, piso de tábuas, **tapete vinho** retangular com franjas e leve estampa de listras verticais.
- **Elementos:**
  1. **Janela** à esquerda com cortinas vinho/rosadas, vista de céu claro + morro verde + árvore; feixe de luz suave no chão.
  2. Dois quadros na parede (paisagens estilizadas) e um quadro pequeno abaixo; **estante suspensa** com livros coloridos e, embaixo dela, três objetos pequenos de valor (**caixa de joias** dourada, **relógio de pulso em suporte**, uma bola decorativa vermelha) — **todos intactos e à vista**.
  3. **Sofá bege de três lugares** ao centro, com **três almofadas** (vermelha, mostarda, azul) e divisões de almofada; **abajur de pano** aceso sobre o encosto/atrás do sofá.
  4. **Mesa de centro** de madeira sobre o tapete com **controle remoto preto, um livro vermelho e um copo/pote**; pequeno bibelô.
  5. À direita, **estante de TV de madeira** com **TV de tubo** (tela azul-acinzentada com reflexo diagonal) e **antena de coelho**; prateleiras de baixo com aparelho de som/videocassete.
  6. À esquerda, **vaso de planta grande** e um **criado-mudo** com telefone fixo preto.
- **Obrigatório:** TV, relógio, joias e aparelho de som **visíveis e intactos**, ambiente **arrumado**. **Proibido:** bagunça, gavetas abertas, objetos caídos.

### 3.3 `comodo_03_cozinha.png` — Cozinha
- **Uso:** foto do pacote de cena; mostra que a cozinha **não foi tocada**.
- **Referência atual:** `public/evidence/case01/new/comodos/comodo_03_cozinha.jpg`
- **Ponto de vista (foto tirada por uma pessoa):** Da **porta da cozinha**, diagonal para o fundo: geladeira à direita em 3/4, mesa e bancos no centro, balcão e janela ao fundo; o batente da porta aparece cortado na borda esquerda.
- **Cena:** cozinha clara (parede creme com **azulejo branco-acinzentado** quadriculado até a altura do balcão), piso cinza-oliva.
- **Elementos:** janela ao centro com **cortinas vermelhas** e vista externa; sob ela um parapeito de madeira; **panelas penduradas** (3 cacarolas) acima da janela; **relógio de parede** redondo; **armário alto de madeira** à esquerda; **balcão com gabinete azul-petróleo** e tampo cinza, sobre ele **fruteira** (maçã vermelha, laranja, folha verde), **leiteira/chaleira**, pano de prato; **geladeira branca** à direita com **ímãs** (um amarelo, um vermelho) e puxadores cinza; **mesa de madeira com toalha vermelha listrada**, com **dois bancos** (assento mostarda), sobre a mesa um **livro/caderno**, **maçã** e **pão**; tapete azul pequeno embaixo.
- **Obrigatório:** tudo em ordem, nada fora do lugar. **Proibido:** utensílios no chão, gavetas abertas.

### 3.4 `comodo_04_escritorio.png` — Escritório (cena-chave)
- **Uso:** foto nº 3 do pacote de cena. **É a cena mais importante**: mostra o escritório **revirado de forma seletiva** enquanto **tudo que vale dinheiro continua à vista**.
- **Referência atual:** `public/evidence/case01/new/comodos/comodo_04_escritorio.jpg`
- **Ponto de vista (foto tirada por uma pessoa):** Da **porta do escritório**, um pouco acima da altura da mesa, em diagonal: a escrivaninha em 3/4 (o lado esquerdo mais perto da câmera), a estante cortada na borda esquerda, o **cofre** visível no fundo da parede direita, a **cadeira em primeiro plano, parcialmente cortada**, e papéis no chão em primeiro plano. (Todos os elementos obrigatórios da ficha continuam visíveis.)
- **Cena:** escritório doméstico, parede azul-petróleo escura com listras, piso de tábuas.
- **Elementos:**
  1. **Estante de madeira alta** à esquerda, **4 prateleiras totalmente cheias de livros** de lombadas variadas (com etiquetas), arrumadas.
  2. Quadro grande de paisagem na parede ao centro; **janelinha** com vista e um pequeno vaso verde no parapeito; **COFRE DE PAREDE** à direita: porta de aço cinza-claro quadrada, com **disco giratório (dial)** numerado e uma haste/indicador, **FECHADO e intacto**.
  3. **Escrivaninha grande de madeira** ao centro, com dois pedestais de gavetas; **gaveta central (principal) FECHADA**, com puxador/fechadura pequena; **as duas gavetas laterais superiores ABERTAS**, com **papéis saindo e amassados**.
  4. **Sobre a mesa, bens de valor à vista e intocados:** **abajur** aceso, **notebook cinza fechado** (modelo grosso de 2002), **porta-retrato/caixinha escura**, **relógio de mesa redondo** (ou relógio de pulso em suporte), uma garrafa/garrafinha.
  5. **Cadeira giratória de escritório** (azul-aço, encosto arredondado, haste e 3 rodízios) **ligeiramente afastada e inclinada**, na frente da mesa.
  6. **Papéis espalhados pelo chão** (6 a 8 folhas, com linhas de texto abstratas), uma **pasta de arquivo amarela** aberta, uma **lixeira cinza** à direita com um papel amassado.
- **Obrigatório:** gavetas laterais abertas + papéis fora do lugar + **cofre fechado + gaveta principal fechada + relógio, notebook e abajur intactos à vista**. O contraste "revirado × intacto" é o ponto da imagem.
- **Proibido:** cofre aberto/arrombado, gaveta principal aberta, objetos de valor no chão, sangue.

### 3.5 `comodo_05_corredor.png` — Corredor
- **Uso:** foto do pacote de cena; circulação **preservada**.
- **Referência atual:** `public/evidence/case01/new/comodos/comodo_05_corredor.jpg`
- **Ponto de vista (foto tirada por uma pessoa):** De uma **ponta do corredor**, olhando para o fundo, com **perspectiva de fuga real** (paredes, teto e piso convergem): portas dos dois lados, quadros nas paredes, luminária de teto, passadeira vinho no piso. Ponto de fuga levemente fora do centro.
- **Cena:** corredor (pelo ponto de vista acima, **com perspectiva de fuga**), piso de tábuas com **passadeira vinho** comprida e franjas.
- **Elementos:** **quatro portas de madeira** (quatro painéis cada, puxador latão), espaçadas ao longo da parede, **todas fechadas**; entre elas **três quadros** (paisagens azul-acinzentada, verde-oliva e rosa); **luminária de teto** no centro (cúpula de vidro creme) com cone de luz suave; um **banco/aparador baixo** à esquerda com vasinho vermelho e garrafa; um **pequeno móvel** à direita com telefone/objeto escuro.
- **Obrigatório:** tudo em ordem, portas fechadas. **Proibido:** objetos caídos, portas arrombadas.

### 3.6 `comodo_06_quarto_casal.png` — Quarto do casal (sem pessoas, sem violência)
- **Uso:** foto do pacote de cena; local dos fatos, **sem nenhum conteúdo gráfico**.
- **Referência atual:** `public/evidence/case01/new/comodos/comodo_06_quarto_casal.jpg`
- **Ponto de vista (foto tirada por uma pessoa):** Da **porta do quarto**, no pé da cama, em diagonal: a cama em 3/4, o criado-mudo da direita com o celular visível, a janela com a lua ao fundo; o guarda-roupa cortado na borda esquerda.
- **Cena:** quarto, parede azul-petróleo, **janela noturna à direita** (céu azul-escuro, **lua crescente**, árvore) com cortinas vinho; piso de tábuas.
- **Elementos:** **cama de casal** de madeira com **cabeceira alta de painéis** e roupa de cama **azul-cinza clara, com travesseiros e dobras na colcha (levemente desarrumada, como de quem estava dormindo)**; **dois criados-mudos**; sobre o da **esquerda um abajur de pano aceso**; sobre o da **direita um celular antigo grafite de antena curta, tela monocromática verde-clara** (aparelho de 2002, **sem tela sensível, sem câmera**); **guarda-roupa de madeira** à esquerda; **chinelos** no chão ao lado da cama; um **pufe lilás** aos pés da cama.
- **Obrigatório:** **nenhuma pessoa, nenhum corpo, nenhuma mancha, nenhum sinal de violência.** O celular de Helena é o objeto discreto de interesse.
- **Proibido:** sangue, silhuetas, armas, bagunça.

### 3.7 `comodo_07_quarto_livia.png` — Quarto de Lívia
- **Uso:** foto do pacote de cena; o quarto de Lívia está **preservado** (assimetria narrativa importante).
- **Referência atual:** `public/evidence/case01/new/comodos/comodo_07_quarto_livia.jpg`
- **Ponto de vista (foto tirada por uma pessoa):** Da **porta do quarto**, em diagonal: a cama arrumada à esquerda em 3/4, a mesa com o computador ao fundo à direita, a janela à esquerda.
- **Cena:** quarto de jovem de 19 anos em 2002, parede azul-acinzentada, **janela** à esquerda com cortinas lilás e vista de morro/árvore.
- **Elementos:** três quadros/pôsteres coloridos (rosa-vermelho, azul, mostarda); **prateleira** com livros e pequenos objetos; **cama de solteiro bem arrumada** (colcha lilás, travesseiro branco); **mesa/estante de estudo** de madeira à direita com **computador de tubo (CRT)** de tela azulada, teclado, papéis e um bloco de notas, **lixeira verde** ao lado; **pufe/tapete rosa-arroxeado** no chão; **mochila** e **tênis** perto da mesa; uma **almofada**.
- **Obrigatório:** **tudo arrumado e intacto.** **Proibido:** gavetas abertas, roupas pelo chão, qualquer sinal de busca.

### 3.8 `comodo_08_canil.png` — Canil (noite, quintal)
- **Uso:** foto do pacote de cena (e referência de "Thor estava preso"). O canil está **trancado por fora**, com Thor dentro e **calmo** (sem sinal de contenção improvisada).
- **Referência atual:** `public/evidence/case01/new/comodos/comodo_08_canil.jpg`
- **Ponto de vista (foto tirada por uma pessoa):** A ~2 m do canil, câmera na altura do peito, ângulo **levemente de cima para baixo**, canil deslocado para o **lado esquerdo** do quadro, trinco visível na lateral direita da grade; a casa ao fundo em perspectiva. Cena noturna, tons escuros, com a frente do canil bem visível.
- **Cena:** quintal de casa à noite. Céu azul-petróleo com **estrelas** e **lua crescente** no alto à esquerda; **cerca de tábuas de madeira** atravessando o fundo; **gramado verde-escuro** com tufos de grama; à direita, **fundos da casa** (parede bege, **janela acesa** amarela com cone de luz suave no gramado, **porta de madeira** escura com maçaneta).
- **Elementos principais (centro-esquerda):** **canil de alvenaria** com **telhado de duas águas** (triângulo marrom-terracota) e **frente de grade de ferro** (grade quadriculada metálica cinza, moldura metálica). **Dentro, atrás da grade, Thor**: cão **grande**, sem raça definida, **pelagem marrom**, focinho claro (areia), orelhas pequenas e erguidas, **coleira vermelha com plaquinha dourada**, sentado e **calmo**, olhos amarelados, olhando para a frente.
- **À direita do canil, na lateral da grade, o FERROLHO/TRINCO metálico FECHADO por fora** (barra de aço deslizante encaixada na argola), com **um cadeado pequeno dourado pendurado**; ao lado, no chão, uma **bolinha vermelha** e à esquerda uma **vasilha de água azul**.
- **Obrigatório:** trinco **por fora e fechado**, Thor **dentro e calmo**, sem corda/improviso. **Proibido:** cão agitado, canil aberto, ferimento, sangue.
- **Zona livre:** canto inferior direito (gramado).

### 3.9 `comodo_09_painel_alarme.png` — Painel do alarme (close)
- **Uso:** "Close do painel do alarme" (Maurício). Mostra que o painel **não foi violado/forçado**.
- **Referência atual:** `public/evidence/case01/new/comodos/comodo_09_painel_alarme.jpg`
- **Ponto de vista (foto tirada por uma pessoa):** **Close** a ~40 cm, **de lado (≈15°)**, o painel levemente inclinado no quadro e a parede em perspectiva suave, como foto tirada com a câmera do celular na mão.
- **Cena:** close de um **teclado de alarme residencial de parede** de 2002, sobre parede cinza-azulada lisa.
- **Elementos:** caixa **cinza-claro** com moldura escura; faixa branca no topo; **visor LCD verde-claro** com o texto exato **`DESARMADO`** em fonte monoespaçada escura; abaixo do visor **três LEDs** (o da esquerda **verde aceso**, os outros dois apagados); **teclado numérico de 12 teclas** em grade 3×4: **1 2 3 / 4 5 6 / 7 8 9 / * 0 #**, teclas cinza com relevo e sombra.
- **Obrigatório:** painel **inteiro e limpo**: tampa no lugar, **sem arranhões, sem fios soltos, sem parafusos faltando**. **Proibido:** qualquer outro texto, marca, logotipo, horário no visor.
- **Zona livre:** canto inferior direito (parede lisa).

### 3.10 `fechadura_porta.png` — Close da fechadura
- **Uso:** "Close da fechadura da porta" (Maurício). Prova de que **não houve arrombamento**.
- **Referência atual:** `public/evidence/case01/new/fechadura_porta.jpg`
- **Ponto de vista (foto tirada por uma pessoa):** **Close** a ~30 cm, **um pouco de baixo e de lado (≈20°)**: a porta inclinada no quadro e a roseta aparecendo como elipse leve.
- **Cena:** close muito próximo: porta de madeira **pintada de azul-acinzentado** (`#42586a`), com **dois painéis em relevo** de cada lado (bordas chanfradas mais claras) e uma faixa central; **ao centro, fechadura de embutir em latão**: **roseta externa grande** (círculo de latão envelhecido) → **anel** mais escuro → **disco/cilindro dourado** claro → **placa interna acinzentada** com **buraco de chave** (forma clássica: círculo + fenda vertical), brilhos curvos suaves, sombra de contato projetada para baixo-direita sobre a porta.
- **Obrigatório:** metal e madeira **perfeitos**: **sem arranhão, sem lasca, sem marca de alavanca, sem amassado, sem tinta descascada.**
- **Zona livre:** canto inferior direito (parte do painel da porta, lisa).

### 3.11 `trava_canil.png` — Close do trinco do canil
- **Uso:** "Foto da trava do canil" (Maurício). Mostra a trava **fechada por fora**, normal, sem contenção improvisada.
- **Referência atual:** `public/evidence/case01/new/trava_canil.jpg`
- **Ponto de vista (foto tirada por uma pessoa):** **Close** a ~40 cm, **em ângulo (≈25°)** em relação à tela: a malha em perspectiva leve, o trinco no centro-direita.
- **Cena:** close: **tela/grade de arame galvanizado** (malha quadriculada fina, reflexos prateados) cobrindo toda a imagem; **dois postes redondos de metal galvanizado** verticais ao centro-direita (brilho claro na esquerda, tom médio no centro, escuro na direita); **trinco de ferrolho em aço**: uma **placa retangular** fixa no poste da direita com **4 parafusos**, uma **barra deslizante** horizontal encaixada na **argola/bucha** do poste da esquerda (**fechada**), com **puxador curvo em gancho**; **leve ferrugem** discreta nas juntas. Ao fundo, desfocado/chapado: **parede bege de alvenaria** (canto superior esquerdo), **gramado** verde-escuro, **balde azul de plástico** e **vasilha vermelha** no chão.
- **Obrigatório:** trinco **fechado e íntegro**, sem corrente/corda extra. **Thor não aparece.**
- **Zona livre:** canto inferior direito.

### 3.12 `escritorio_comparativo.png` — Escritório, foto comparativa
- **Uso:** "Foto comparativa do escritório" (Maurício): **gavetas laterais abertas × valores e cofre intactos**.
- **Referência atual:** `public/evidence/case01/new/escritorio_comparativo.jpg`
- **Ponto de vista (foto tirada por uma pessoa):** Da altura do peito, a ~1,5 m, **deslocada para a esquerda**, em 3/4 leve: a escrivaninha ocupa a metade inferior, uma das gavetas laterais abertas em primeiro plano, a parede ao fundo.
- **Cena:** **a escrivaninha** em primeiro plano (a escrivaninha ocupa a metade inferior), parede azul-petróleo escura ao fundo.
- **Elementos:** **tampo de madeira** com borda mais clara; sobre ele **abajur de pano** aceso (esquerda), **notebook cinza fechado** (centro-esquerda), **relógio de mesa redondo** (centro-direita), uma **garrafinha** (direita) — **tudo intacto**; na parede atrás: **persiana/ripas** à esquerda, **quadro de paisagem**, **quadrinho** à direita e uma **poltrona/cadeira** de espaldar escuro. Frente da escrivaninha, com **dois pedestais de gavetas laterais** (esquerdo e direito) e **uma gaveta principal larga no centro, logo abaixo do tampo**: **a gaveta principal está FECHADA**, com **pequena fechadura/puxador de latão bem visível**; **as gavetas LATERAIS estão ABERTAS** (pelo menos uma aberta em cada pedestal), com **papéis saindo e amassados**; as demais gavetas laterais ficam fechadas. O contraste que a imagem precisa mostrar é: gavetas "sem importância" abertas e bagunçadas × gaveta principal fechada e valores intactos sobre a mesa.
- **Nota:** o cofre de parede não aparece neste quadro (aparece em `comodo_04_escritorio`).
- **Zona livre:** canto inferior direito.

### 3.13 `foto_fachada_lan.png` — Fachada da LAN house (noite)
- **Uso:** "Foto da fachada da LAN house" (Paulo). Documenta o local onde o recibo foi emitido.
- **Referência atual:** `public/evidence/case01/new/foto_fachada_lan.jpg` — **ATENÇÃO: a referência atual tem um carro branco na rua. NÃO desenhe carro nenhum.** (Um Gol branco aparece no caso como o carro de Caio; ele **não pode** aparecer junto da LAN house, senão a imagem sugere uma ligação falsa.)
- **Ponto de vista (foto tirada por uma pessoa):** Da **calçada oposta**, câmera na altura dos olhos, **levemente de lado (≈20° em relação à fachada)**, em perspectiva, enquadramento um pouco torto, o poste de luz cortado na borda direita. **Sem carro, sem pessoas.**
- **Cena:** noite, rua de bairro. Céu azul-marinho muito escuro com poucas estrelas. **Prédio comercial térreo** de fachada azul-acinzentada (platibanda mais escura no topo). **Letreiro retangular** acima, painel escuro com moldura, **texto exato `LAN HOUSE`** em maiúsculas amarelo-dourado (`#f2c94c`), fonte grossa e legível; **vitrine grande** à esquerda com vidro azul-claro iluminado, **quatro monitores CRT** bege alinhados (telas azul-claras acesas) sobre um **balcão de madeira**, e um **cartaz de papel** colado no canto superior esquerdo do vidro (**apenas linhas cinza abstratas, sem texto nem números legíveis**); **porta cinza** à direita com maçaneta dourada e moldura escura; **calçada** cinza e **rua** escura com **faixa central tracejada amarela** (sem nenhum veículo); à direita um **poste de luz** com **luminária alaranjada** projetando **cone de luz suave** sobre a calçada e a porta.
- **Obrigatório:** o letreiro "LAN HOUSE" correto, **sem nenhum carro, sem nenhuma pessoa**, sem nome de pessoa legível.
- **Zona livre:** canto inferior direito (rua escura).

---

## 3-B. FICHAS DAS 2 PLANTAS (croquis periciais)

> Estilo: **desenho técnico limpo e legível**, no mesmo clima sóbrio do jogo (pode ter acabamento um pouco mais refinado que a referência), sobre **cartão cor creme `#ece8dc`** (sem quadrícula, sem textura, sem sombra, sem dobra), com margem escura `#16222c` de 10 px ao redor (como um cartão sobre o fundo do jogo). Traços em **preto-azulado `#1c1c20`**, espessura média nas paredes, fina nas cotas; letras em **fonte manuscrita legível** (estilo "Caveat"); marcadores em **círculos amarelos `#f1c93a`** com número escuro, **NUNCA cobrindo texto**. 4:3 horizontal, 2400×1800. Todos os textos abaixo são **exatos**.

### 3.14 `croqui_residencia.png` — Croqui nº 01 — Residência
- **Referência atual:** `public/evidence/case01/new/croqui_residencia.jpg` (siga o layout; melhore o acabamento: espessura de linha uniforme, portas e janelas bem desenhadas, mobiliário simples bem proporcionado).
- **Layout:** planta baixa da casa **à esquerda** (retângulo grande de paredes grossas), **legenda à direita (parte superior)**, **bloco de carimbo à direita (parte inferior)**; **canil** como retângulo com grade **abaixo** da casa; **rosa-dos-ventos/seta norte** (círculo com seta e a letra `N`) no canto superior direito.
- **Cotas:** horizontal acima da casa `aprox. 17 m`; vertical à esquerda `aprox. 12 m` (texto rotacionado).
- **Cômodos (rótulos exatos, em maiúsculas):** **SALA**, **COZINHA**, **ESCRITÓRIO** (fileira de cima, esquerda→direita); **QUARTO DO CASAL**, **CORREDOR**, **QUARTO DE LÍVIA** (fileira de baixo, esquerda→direita); **CANIL** (fora, embaixo); texto pequeno `quintal / fundos`. Mobiliário com rótulos pequenos: `sofá` (sala), `mesa` (escritório), `cama` (quarto do casal), `cama` (quarto de Lívia). Portas (arcos de abertura) e janelas (retângulos duplos nas paredes) coerentes.
- **Marcadores (círculos amarelos numerados), posicionados FORA dos rótulos:** 1 — na entrada principal (parede da esquerda da sala); 2 — na sala; 3 — no escritório; 4 — no corredor; 5 — no quarto do casal; 6 — junto ao painel do alarme (canto superior esquerdo da sala); 7 — ao lado do canil.
- **Legenda (título `LEGENDA` + 7 linhas, cada uma com o círculo numerado e o texto exato):**
  1. `Entrada principal — sem arrombamento`
  2. `Sala — bens de valor preservados`
  3. `Escritório — gavetas laterais abertas`
  4. `Corredor — circulação preservada`
  5. `Quarto do casal`
  6. `Painel do alarme (teclado)`
  7. `Canil — Thor no interior`
- **Bloco de carimbo (retângulo com divisória):** linha 1 `DHPP · HOMICÍDIOS` (fonte de máquina de escrever, maior); depois `Croqui nº 01 — Residência`; `Rua das Acácias, Campo Belo`; `Perito: Maurício Farias` (em azul-caneta `#1b3a8a`); `Caso 01 · 17/10/2002 · sem escala`.
- **Obrigatório:** nenhum marcador sobre texto; todo texto legível; nenhum nome de culpado; sem horário.

### 3.15 `croqui_rua.png` — Croqui nº 02 — Rua das Acácias
- **Referência atual:** `public/evidence/case01/new/croqui_rua.jpg`
- **Layout (vista de cima):** **faixa superior:** cinco lotes retangulares **tracejados** em cinza (os dois da esquerda com o rótulo pequeno `lote`), o **lote da casa** (4º da esquerda) com **contorno grosso**, uma planta pequena interna cinza com a palavra `CASA` (manuscrito grande) e embaixo `(residência do Caso 01)`; **calçada** (faixa bege) → **pista** (cinza, com **faixa central amarela tracejada**, palavra `RUA DAS ACÁCIAS` grande no meio, e pequeno `sentido →` à direita) → **calçada** inferior.
- **Elementos:** **guarita** (casinha de telhado triangular) no lote da esquerda, rótulo `GUARITA` acima e `(vigia Jorge)` abaixo; **poste** (círculo preto com haste) na calçada, rótulo `POSTE`; **quatro árvores** (círculos verdes) na calçada; **carro em vista superior, branco**, estacionado na pista (corpo retangular arredondado, dois vidros azulados, quatro rodas escuras), rótulo azul `GOL branco` acima e `(ponto onde foi visto estacionado)` abaixo, em azul `#1b3a8a`; **duas linhas de visada tracejadas azuis**: da guarita ao carro e do carro à porta da casa.
- **Cotas (texto exato):** `aprox. 38 m` (da guarita ao Gol, com o rótulo `da guarita ao Gol`) e `aprox. 14 m` (do Gol à porta da casa, com o rótulo `do Gol à porta da casa`).
- **Marcadores amarelos:** 1 — guarita; 2 — poste; 3 — carro; 4 — casa (acima do lote). **Fora dos textos.**
- **Legenda (abaixo, à esquerda, em quadro, em duas colunas):** `LEGENDA` / 1 `Guarita do vigia (Jorge)` · 2 `Poste de iluminação` · 3 `Ponto do Gol (visto)` · 4 `Residência — Caso 01`.
- **Bloco de carimbo (embaixo à direita):** `DHPP · HOMICÍDIOS` / `Croqui nº 02 — Rua das Acácias` / `Posição da guarita, poste e veículo` / `Perito: Maurício Farias` (azul) / `Caso 01 · 17/10/2002 · sem escala`. Seta norte `N` no canto superior direito.
- **Obrigatório:** **sem horário no desenho**; o carro é **só um carro branco genérico de hatch pequeno em vista superior** (o texto diz "GOL branco"). **Proibido:** nome de culpado, indicação de quem estava dentro do carro.

---

## 4. DOCUMENTOS (9 imagens) — GUIA PRÓPRIO

### 4.1 Estilo comum dos documentos (leia antes de qualquer ficha)
O dono do projeto reprovou o realismo anterior ("muito realista, com linhagem e aparência muito realista") e aprovou o visual **simplificado**. Portanto, **sem aspecto de papel escaneado ou fotografado**. Um acabamento **um pouco mais refinado** que a referência é permitido (tipografia mais bonita, carimbos bem feitos, uma sombra mínima sob o cartão), desde que continue **limpo, plano e simples**:

- **Cartão de papel liso** `#ece8dc` com cantos levemente arredondados (raio ≈ 6 px na escala 1350), ocupando a imagem com **margem de 14 px** (na escala 1350×1920; proporcional em 2025×2880) sobre **fundo azul-petróleo escuro `#16222c`**.
- **Zero efeito de realismo:** sem textura de papel, sem fibras, sem granulado, sem dobras, sem manchas de café, sem sombra pesada, sem rotação/perspectiva, sem grampo, sem fita, sem desfoque de tinta. Tudo **reto, nítido e plano**.
- **Tipografia:** títulos e cabeçalhos em **máquina de escrever** (estilo "Special Elite"); corpo em **Courier** (estilo "Courier Prime"); consultas de terminal em **monoespaçada pixelada** (estilo "VT323"); anotações manuscritas em **caneta azul `#1b3a8a`** (estilo "Caveat"); assinaturas em script manuscrito azul.
- **Cabeçalho padrão DHPP** (nos documentos timbrados): à esquerda o **escudo** (contorno de escudo navy `#1d2a52` com **estrela cheia** dentro), ao lado `DHPP` (Courier **negrito grande**, navy), abaixo `HOMICÍDIOS · <SETOR>` em caixa alta espaçada e `Estado de São Paulo · Brasil` pequeno; à direita, **bloco de identificação** do documento em 3 linhas alinhadas à direita; **linha dupla navy** separando o cabeçalho do corpo.
- **Carimbos planos** (retângulos com borda, texto em máquina de escrever, ligeiramente inclinados −4° a −12°, **cor sólida sem textura**): azul `#2a3f9a` ou vermelho `#8a1f1f`. **Assinaturas e anotações** em azul-caneta.
- **Legibilidade:** todo o texto deve ser **nítido e legível com zoom 2× no iPhone**. Corpo ≥ 1,3% da altura da imagem.
- **Proibido:** qualquer texto além do listado; logotipos reais; "ARQUIVO FICCIONAL"; marca d'água; valores em dinheiro (exceto onde indicado); nome de culpado em lugar não previsto.
- **Fidelidade do texto:** copie os textos **exatamente**, **com acentos, pontuação e quebras de linha**. Nomes e números **não podem mudar**.

### 4.2 `laudo_preliminar_local.png`
- **Referência:** `public/evidence/case01/new/laudo_preliminar_local.jpg`
- **Uso:** Maurício, "Laudo preliminar do local". Descreve o local **sem apontar autoria**.
- **Cabeçalho:** `DHPP` / `HOMICÍDIOS · PERÍCIA` / `Estado de São Paulo · Brasil`; bloco à direita: `LAUDO Nº 0427/02-L1` · `fl. 1/2` · `17 de outubro de 2002`.
- **Título (centro, máquina de escrever grande):** `LAUDO PERICIAL PRELIMINAR DE LOCAL`
- **Quadro de identificação (borda fina):**
  - `Ocorrência:` Caso 01 · Residência da Rua das Acácias, Campo Belo
  - `Requisição:` Delegada Sônia Prado · `Perito:` Maurício Farias
  - `Natureza:` exame preliminar de local de morte
  (rótulos em negrito)
- **Seções (título em negrito espaçado + parágrafo justificado):**
  - `I — HISTÓRICO` — Aos dezessete dias do mês de outubro de dois mil e dois, o signatário compareceu à residência acima referida, a fim de proceder ao exame preliminar do local, com registro fotográfico e croqui anexos.
  - `II — ABERTURAS` — A porta principal não apresenta sinais de arrombamento. Fechadura e batente íntegros, sem marcas de alavanca, lascas ou deformações visíveis. Demais aberturas, no exame preliminar, sem vestígios de violação.
  - `III — AMBIENTES` — Sala com bens de valor aparentes preservados (relógio, joias e equipamentos eletrônicos). Escritório com gavetas laterais abertas e papéis revirados, enquanto a gaveta principal e o cofre de parede permanecem fechados. Circulação interna sem alteração relevante.
  - `IV — ÁREA EXTERNA` — O canil, nos fundos, encontra-se fechado pelo lado de fora. O cão da residência (Thor) foi localizado em seu interior, sem sinais de contenção improvisada.
  - `V — CONCLUSÃO PRELIMINAR` — O presente laudo descreve o estado observado do local e não atribui autoria ou participação a qualquer pessoa. Outros exames dependem de análise laboratorial.
- **Rodapé esquerdo:** linha de assinatura com `Maurício Farias · Perito Criminal`, com a assinatura em script azul `M. Farias` **acima da linha** (sem tocar o texto abaixo). Rodapé pequeno cinza: `DHPP · Rua do Homicídio, s/n · Tel. (11) 3000-0000`.
- **Carimbo (canto inferior direito, azul, inclinado ≈ −7°):** `DHPP · PERÍCIA` e, abaixo menor, `RECEBIDO · 17/10/2002`.

### 4.3 `ficha_veiculo_gol.png`
- **Referência:** `public/evidence/case01/new/ficha_veiculo_gol.jpg`
- **Uso:** Renata, "Ficha do Gol que o vigia viu". Consulta de terminal **impressa em formulário contínuo**.
- **Visual:** folha de **formulário contínuo** verde-claríssima `#f2f6ec` (sem listras de textura), com **duas colunas de furos de trator**: círculos **escuros chapados** `#16222c` (diâm. ≈ 26 px) alinhados nas duas bordas laterais, a cada ≈ 58 px. Texto em **monoespaçada pixelada (VT323)** cor `#1d2230`, alinhado à esquerda, começando perto do topo.
- **Texto exato (preserve alinhamento, caixa alta, sem acentos, linhas em branco):**
```
DHPP - SISTEMA DE CONSULTAS            17/10/2002
================================================
CONSULTA DE VEICULOS - RENAVAM/PLACA

PLACA ........: DXK-4471
MARCA/MODELO .: VW/GOL 1.0
ANO FAB/MOD ..: 1998/1998
COR ..........: BRANCA
COMBUSTIVEL ..: GASOLINA
MUNICIPIO ....: SAO PAULO - SP

PROPRIETARIO .: CAIO DUARTE
SITUACAO .....: REGULAR
RESTRICOES ...: NADA CONSTA
ALIENACAO ....: NAO

------------------------------------------------
OPERADOR: MAT. 55.201  TERMINAL 03
CONSULTA SOLICITADA POR: R. LEAL
FIM DA CONSULTA
```
- **Carimbo azul (embaixo, direita, inclinado ≈ −5°):** `DHPP · INTELIGÊNCIA` e abaixo menor `CONFERIDO`.
- **Anotação manuscrita azul (embaixo, esquerda, levemente inclinada −2°):** `conferir c/ vigia — Gol visto na rua` — **não pode encostar nem ser coberta pelo carimbo** (deixe 40 px de folga).

### 4.4 `quadro_horarios.png`
- **Referência:** `public/evidence/case01/new/quadro_horarios.jpg`
- **Uso:** Renata, "Quadro de horários da noite". Folha de caderno **limpa e plana** (sem linhas de caderno visíveis, sem margem vermelha), cor `#f4f1e4`, com **cinco furos de fichário** circulares escuros chapados à esquerda (a cada ≈ 250 px, diâm. ≈ 46 px, cor `#16222c`).
- **Conteúdo manuscrito (azul `#1b3a8a`, letra feminina inclinada, texto exato, posições aproximadas de cima para baixo):**
  1. Título (topo, grande): `Noite de 16 p/ 17/10 — quadro de horários`; abaixo à direita, menor: `R. Leal · Caso 01`
  2. Linha em cinza a lápis: `__:__  ?`
  3. `23:52   alarme desativado` e logo abaixo, menor e recuado: `(código mestre — log)`
  4. **Faixa de marca-texto amarelo** (retângulo `#ffe63c`, ~55%, levemente inclinado −0,6°) cobrindo a "janela" entre os dois horários; dentro, em **vermelho `#b22222`**: `1h04 sem explicação  ?` (grande) e abaixo `o que aconteceu aqui dentro?`
  5. **Seta azul fina** vertical à esquerda ligando 23:52 a 00:56.
  6. `00:56   entrada no motel` com um **visto (✓)** à esquerda, e abaixo, menor: `(nota — suíte 14)`
  7. Duas linhas em cinza a lápis: `__:__  ?` `__:__  ?`
  8. Rodapé, cinza escuro, menor: `conferir Caio x Jorge x Téo`
- **Importante:** **somente** 23:52 e 00:56 preenchidos; nenhum outro horário.

### 4.5 `matricula_imovel.png`
- **Referência:** `public/evidence/case01/new/matricula_imovel.jpg`
- **Uso:** Renata, "Matrícula do imóvel". **Sem nenhum valor em dinheiro.**
- **Papel:** cartão cor `#e8e2d0` (levemente mais escuro que os demais).
- **Cabeçalho centralizado** com linha dupla embaixo: `REGISTRO DE IMÓVEIS DA COMARCA DE SÃO PAULO` (máquina de escrever, espaçado) / `14º OFICIAL · CAPITAL` / `Livro 2 — Registro Geral` (pequeno, cinza).
- **Título:** `CERTIDÃO DE MATRÍCULA`; à direita, em duas linhas: `Matrícula nº` / **`78.421`** (grande, negrito). Acima à direita, minúsculo: `Via do requerente · Emol.: pagos` (**não pode tocar o cabeçalho**).
- **Quadro com linhas finas acima e abaixo:**
  - `IMÓVEL` — Prédio residencial e respectivo terreno, situado na Rua das Acácias, Campo Belo, 31º Subdistrito — Santo Amaro, São Paulo/SP.
  - `CARACTERÍSTICAS` — Terreno com frente para a via pública; casa térrea com área construída conforme planta aprovada; fundos com dependência de serviço.
- **Depois:**
  - `PROPRIETÁRIOS` — Ricardo Valença e Helena Valença, casados.
  - `REGISTRO ANTERIOR` — Matrícula nº 41.100, deste Oficial.
  - `AVERBAÇÕES` — Sem ônus, hipoteca ou penhora registrados até a presente data.
- **Parágrafo:** CERTIFICO que a presente certidão é reprodução fiel da matrícula acima, extraída nos termos do art. 19 da Lei nº 6.015/73, e que nela constam os atos registrados até esta data. O referido é verdade e dou fé.
- `São Paulo, 17 de outubro de 2002.`
- **Rodapé:** linha de assinatura `O Escrevente Autorizado` com assinatura azul `J. Almeida` acima da linha; **carimbo azul retangular** `14º REGISTRO DE IMÓVEIS` + `SÃO PAULO · CAPITAL`; **selo redondo vermelho** de borda dupla com `SELO` / `DE` / `AUTENTICIDADE` (3 linhas), inclinado ≈ 8°, no canto inferior direito. Nada se sobrepõe ao texto.

### 4.6 `consulta_antecedentes.png`
- **Referência:** `public/evidence/case01/new/consulta_antecedentes.jpg`
- **Uso:** Renata, "Consulta de antecedentes dos irmãos Duarte". Mesmo visual de terminal impresso da ficha do Gol (4.3): formulário contínuo verde-claríssimo, furos de trator, VT323.
- **Texto exato:**
```
DHPP - SISTEMA DE CONSULTAS            17/10/2002
================================================
CONSULTA DE ANTECEDENTES CRIMINAIS

NOME .........: CAIO DUARTE
RESULTADO ....: NADA CONSTA
OBSERVACAO ...: SEM REGISTROS ANTERIORES

------------------------------------------------

NOME .........: TEO DUARTE
RESULTADO ....: NADA CONSTA
OBSERVACAO ...: SEM REGISTROS ANTERIORES

------------------------------------------------
OPERADOR: MAT. 55.201  TERMINAL 03
CONSULTA SOLICITADA POR: R. LEAL
FIM DA CONSULTA
```
- **Carimbo vermelho grande (embaixo, ≈ −6°):** `NADA CONSTA` (grande) e abaixo menor `DHPP · INTELIGÊNCIA`.

### 4.7 Observação sobre os croquis
`croqui_rua` e `croqui_residencia` são plantas, não documentos de texto: ver a seção 3-B.

### 4.8 `termo_declaracao_terceiro_cida.png`
- **Referência:** `public/evidence/case01/new/termo_declaracao_terceiro_cida.jpg`
- **Uso:** Paulo, "Termo de declaração da irmã de Cida". Confirma o álibi de Cida **sem destacar**.
- **Cabeçalho DHPP:** `HOMICÍDIOS · CARTÓRIO`; bloco à direita: `TERMO Nº 0431/02` · `Inquérito do Caso 01` · `fl. 14`.
- **Título:** `TERMO DE DECLARAÇÃO` (máquina de escrever, centralizado).
- **Parágrafo:** Aos dezessete dias do mês de outubro de dois mil e dois, nesta unidade do DHPP, perante a escrivã de plantão, compareceu a pessoa abaixo qualificada, que, advertida das penas da lei, declarou:
- **Campos (rótulo impresso + linha; preenchimento manuscrito em azul SOBRE a linha, sem atravessá-la):**
  - `Nome:` → *Rosa Maria dos Santos*
  - `Parentesco com Cida:` → *irmã (Aparecida)*
  - `Endereço:` → *Rua dos Ipês, 212 — Jabaquara*
- `Às perguntas, **respondeu**:` seguido de **5 linhas pautadas**; as 4 primeiras preenchidas à mão, **cada frase inteira dentro de UMA linha** (não pode quebrar para a linha de baixo), a 5ª em branco:
  1. *Que a sra. Cida esteve em sua casa na noite de 16/10/2002,*
  2. *onde jantou com a família e dormiu, só saindo na manhã seguinte.*
  3. *Que estavam presentes o marido e dois filhos da declarante.*
  4. *Que não viu a sra. Cida sair em momento algum da noite.*
- **Parágrafo final:** Nada mais disse nem lhe foi perguntado. Lido o presente termo e achado conforme, vai devidamente assinado.
- **Rodapé:** duas linhas de assinatura: esquerda `Declarante` (assinatura azul `Rosa M. Santos` **acima** da linha) e direita `Denise Rocha · Escrivã` (assinatura azul `D. Rocha` acima da linha). Entre elas, acima, um **quadrado de impressão digital** pequeno com a legenda `POLEGAR D.` e um **desenho de digital** concêntrico azul; e um **carimbo vermelho** `DHPP · CARTÓRIO` + `CONFERE COM O ORIGINAL`, inclinado ≈ −6°. **Nada sobrepõe texto.**

### 4.9 `termo_apreensao_celular_helena.png`
- **Referência:** `public/evidence/case01/new/termo_apreensao_celular_helena.jpg`
- **Uso:** Denise, "Auto de apreensão do celular de Helena". Cadeia de custódia.
- **Cabeçalho DHPP:** `HOMICÍDIOS · CARTÓRIO`; bloco: `AUTO Nº 0417/02` · `Cadeia de custódia` · `fl. 22`.
- **Título:** `AUTO DE EXIBIÇÃO E APREENSÃO`
- **Parágrafo:** Aos dezessete dias de outubro de 2002, na residência da Rua das Acácias, Campo Belo, foi apreendido o objeto abaixo descrito, que foi lacrado e acondicionado para análise:
- **Tabela (rótulo em negrito à esquerda, valor à direita, linhas pontilhadas):**
  - `Item nº` — 01 (um)
  - `Descrição` — Aparelho celular, cor grafite, antena curta, pertencente a Helena Valença
  - `Local` — Quarto do casal · Rua das Acácias, Campo Belo
  - `Estado` — Desligado; sem avarias aparentes
  - `Lacre nº` — 000417
  - `Responsável` — Maurício Farias · Perito Criminal
- **Etiqueta de cadeia de custódia (caixa com borda, fundo levemente mais claro):** título `ETIQUETA DE CADEIA DE CUSTÓDIA`; texto `Caso 01 · Item 01` / `Lacre 000417 · Recebido na escrivania`; à direita um **código de barras linear** (barras pretas verticais; **sem QR code**).
- **Testemunhas:** `Testemunhas do ato:` seguido de `1. ____________  2. ____________` com os nomes manuscritos **sobre** as linhas (sem cobrir o rótulo): `Cláudio Pires` e `Ivone Prado`.
- **Rodapé:** duas linhas de assinatura: `Responsável pela apreensão` (assinatura azul `M. Farias` acima) e `Denise Rocha · Escrivã (custódia)` (assinatura azul `D. Rocha` acima). **Carimbo vermelho** `LACRADO` (grande) + `DHPP · 17/10/2002`, inclinado ≈ −12°, **sem tocar** os nomes das testemunhas nem as assinaturas.

### 4.10 `capa_inquerito.png`
- **Referência:** `public/evidence/case01/new/capa_inquerito.jpg`
- **Uso:** Denise, "Capa do inquérito". Capa de pasta, também usada como cabeçalho do Arquivo.
- **Fundo:** **papel pardo liso** `#c9b48a` (sem textura, sem mancha), com uma **faixa superior mais escura** (92 px na escala 1350) e linha separadora fina — a "aba" da pasta. Sem sombra lateral, sem mancha, sem fita.
- **Etiqueta principal (caixa creme `#e6dcc0` com borda marrom-escura `#3a2a14` grossa),** no alto:
  - à esquerda o **escudo** DHPP grande; ao lado `DHPP` (máquina de escrever, muito grande) e embaixo `HOMICÍDIOS` espaçado;
  - linha divisória; `INQUÉRITO POLICIAL` (espaçado); **`Nº 0427/2002`** (grande).
- **Campos (rótulo em negrito à esquerda; valor à direita com linha pontilhada embaixo; 6 linhas):**
  `ASSUNTO:` Morte de duas pessoas — Caso 01 · `LOCAL:` Rua das Acácias, Campo Belo · `VÍTIMAS:` Ricardo e Helena Valença · `INSTAURAÇÃO:` 17/10/2002 · `AUTORIDADE:` Delegada Sônia Prado · `ESCRIVÃ:` Denise Rocha
- **Canto inferior esquerdo:** **etiqueta de papel** (retângulo creme com borda cinza, levemente inclinado −2°): `PRAZO PARA CONCLUSÃO` / **`30 dias`**.
- **Canto inferior direito:** **carimbo vermelho** `EM ANDAMENTO` + `DHPP · 17/10/2002`, inclinado ≈ −9°.

### 4.11 `termo_depoimento_modelo.png`
- **Referência:** `public/evidence/case01/new/termo_depoimento_modelo.jpg`
- **Uso:** Denise, "Modelo do termo de depoimento". **Formulário em branco**, como fotocópia limpa: papel cinza-claro `#dcdcd6`, tudo em **tons de cinza** (sem cor), sem manuscrito, sem carimbo.
- **Cabeçalho DHPP:** `HOMICÍDIOS · CARTÓRIO`; bloco: `TERMO DE DEPOIMENTO` · `Modelo DHPP-07` · `fl. ____`.
- **Título:** `TERMO DE DEPOIMENTO`
- **Campos em branco com linha:** duas colunas `Inquérito nº` e `Data:`; seção `QUALIFICAÇÃO` (negrito espaçado); `Nome:`; duas colunas `Idade:` e `Profissão:`; `Endereço:`; `Relação com os fatos:`.
- **Texto:** Advertido(a) das penas da lei, o(a) depoente declarou o que segue:
- **9 linhas pautadas em branco** para o depoimento.
- **Texto:** Lido e achado conforme, vai assinado pelo(a) depoente, pela autoridade e pelo(a) escrivão(ã).
- **Rodapé:** três linhas de assinatura lado a lado: `Depoente` · `Autoridade` · `Escrivão(ã)`. Furos de fichário **chapados e escuros** na borda esquerda (3), sem sombra.

---

## 5. ORDEM SUGERIDA DE PRODUÇÃO E COMO ENTREGAR
1. Gere primeiro **`comodo_04_escritorio`**, **`comodo_08_canil`** e **`laudo_preliminar_local`** como teste de estilo, e confira com a lista da seção 7 antes de continuar o resto (evita refazer 24 imagens).
2. Depois: demais cômodos → fechadura / trava / comparativo / fachada → croquis → demais documentos.
3. Salve cada arquivo no caminho da seção 2, com o nome exato da ficha.
4. Ao terminar, preencha a seção "Resposta do ChatGPT" no fim deste arquivo (status, lista de arquivos, qualquer divergência), e **mova** este arquivo de `creative-requests/inbox/` para `creative-requests/completed/` se o fluxo permitir.

Arquivos esperados (24):
- `public/evidence/case01/final/comodos/`: `comodo_01_entrada.png`, `comodo_02_sala.png`, `comodo_03_cozinha.png`, `comodo_04_escritorio.png`, `comodo_05_corredor.png`, `comodo_06_quarto_casal.png`, `comodo_07_quarto_livia.png`, `comodo_08_canil.png`, `comodo_09_painel_alarme.png`
- `public/evidence/case01/final/`: `fechadura_porta.png`, `trava_canil.png`, `escritorio_comparativo.png`, `foto_fachada_lan.png`, `croqui_residencia.png`, `croqui_rua.png`, `laudo_preliminar_local.png`, `ficha_veiculo_gol.png`, `quadro_horarios.png`, `matricula_imovel.png`, `consulta_antecedentes.png`, `termo_declaracao_terceiro_cida.png`, `termo_apreensao_celular_helena.png`, `capa_inquerito.png`, `termo_depoimento_modelo.png`

---

## 6. CANON QUE NÃO PODE SER VIOLADO (fonte: `docs/CASE01_STORY_BIBLE.md` e `docs/CASE01_CANON.json`)
- Alarme desativado às **23:52** (código mestre); entrada no motel às **00:56**; dinheiro **US$ 5.000**, **Banco Meridional**, agência **0431**, **15/10/2002**. (Só aparecem nas peças listadas; não escreva esses números em nenhuma outra.)
- **Não houve arrombamento.** Thor estava **preso no canil, por fora**. O **roubo foi encenado**: escritório mexido **de forma seletiva**, **valores intactos** (relógio, joias, eletrônicos, cofre), **quarto de Lívia preservado**.
- **Sem violência gráfica**: nenhuma pessoa, corpo, sangue, ferimento ou arma em nenhuma imagem.
- **Mundo de 2002**: sem smartphone, sem QR code, sem tela plana, sem logotipo real.
- **Órgão: DHPP (Homicídios).** Nunca escrever "Polícia de São Paulo" nem "Polícia Civil".
- As peças **mostram fatos, não acusam ninguém**. Nenhum culpado ou inocente pode ser identificado visualmente. Nenhum nome de investigado além dos **já listados** nos textos.
- **Não criar** (propostas ainda não aprovadas): extrato de ligações, câmera de comércio, laudo de digitais.

---

## 7. LISTA DE CONFERÊNCIA (confira CADA imagem antes de entregar)

**Cenas e plantas**
- [ ] 4:3, 2400×1800 (≥ 1600×1200), PNG, sem moldura, sem borda, sem data, **sem plaqueta, sem régua**.
- [ ] **Estilo de recortes de papel**: formas simples, cor chapada, contorno escuro fino, sombra plana, sem gradiente. **Combina com `defensive.jpg`** (teste lado a lado). Não parece fotografia nem render 3D.
- [ ] **Ponto de vista da ficha respeitado**: perspectiva real em 3/4, assimétrica, horizonte levemente inclinado, algo secundário cortado pela borda. **Não é elevação frontal simétrica.**
- [ ] Arte **limpa e nítida**: sem vinheta, granulado, desfoque, flash estourado nem aspecto de foto ruim (Claude aplica).
- [ ] **Sem pessoas**, sem sangue, sem armas.
- [ ] Nenhum texto desenhado além dos permitidos (`LAN HOUSE`, `DESARMADO`, teclas, rótulos dos croquis).
- [ ] **Zona livre** no canto inferior direito.
- [ ] Elementos obrigatórios da ficha presentes; elementos proibidos ausentes.
- [ ] Fachada da LAN **sem nenhum carro**.
- [ ] Escritório: gavetas laterais abertas **e** gaveta principal + cofre **fechados** + relógio/notebook/abajur à vista.
- [ ] Porta e fechadura **sem nenhuma marca de força**.
- [ ] Canil: trinco **por fora e fechado**; Thor dentro e calmo.

**Documentos**
- [ ] 1350×1920 (ideal 2025×2880), PNG, cartão liso sobre fundo `#16222c`, **sem textura/dobra/sombra/rotação**.
- [ ] **Texto idêntico ao da ficha**, letra por letra (confira nomes, números, acentos, datas).
- [ ] Nenhum carimbo, assinatura ou manuscrito **sobrepondo** texto impresso.
- [ ] Manuscrito azul **dentro das linhas**; cada frase inteira numa linha.
- [ ] Nenhum valor em dinheiro fora do previsto; **sem QR code**.
- [ ] "DHPP" correto; nenhum órgão proibido.

## 8. Contexto da cena (para ajustar o tom)
Estas imagens aparecem como **anexos dentro da conversa do integrante da equipe** (app Equipe, estilo mensageiro) e abrem em visualizador de tela cheia com zoom (pinça) no iPhone. As fotos de cena aparecem como **fotos de celular de baixa qualidade** (Claude aplica o efeito). Os documentos aparecem como **cartões de papel** sobre o fundo escuro do jogo. A emoção geral é de **investigação sóbria**: nada espalhafatoso, nada de suspense exagerado.

## 9. Observações técnicas finais para integração
- Claude só precisa dos arquivos no caminho e nome certos; **não é necessário alterar código** (Claude troca os caminhos, aplica moldura/plaqueta/régua/data e converte para JPG).
- Se uma imagem precisar de ajuste pequeno (um texto errado, um objeto fora do lugar), **entregue o resto e liste a divergência** em vez de atrasar o lote inteiro.
- Se achar que alguma ficha pede algo que viola o canon ou outra ficha, **siga o canon** (seção 6) e registre a observação.

## Resposta do ChatGPT
Preenchido pelo ChatGPT ao concluir.

- status:
- assets criados:
- observações:

> **Encerrado (Claude):** o ChatGPT não manteve consistência de estilo entre tentativas. As 13 cenas foram feitas por código em `tools/scene-render/` (perspectiva real, técnica dos retratos, efeito de celular). Os documentos e croquis ficaram com a versão simplificada de Claude. Este pedido não precisa ser executado.
