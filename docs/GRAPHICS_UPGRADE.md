# Aprimoramento gráfico (out/2026)

Evolução da qualidade visual das três cenas em canvas — rua do DHPP, planta da base e casa da Rua das Acácias — e dos efeitos do interrogatório, sem trocar a direção de arte, os assets oficiais nem o motor (Canvas 2D).

## 1. Estado anterior

### Base (`src/base/base.js`) e casa (`src/varredura/varredura.js`)

Já eram maduras:
- passe de luz em resolução baixa (luz multiplicada por sala);
- halos e brilho de lâmpadas;
- luz de contorno nos personagens;
- reflexo no piso encerado;
- sombra projetada das pessoas a partir da lâmpada mais próxima;
- poeira nos fachos de sol;
- profundidade de campo 2D (tilt-shift com cópias desfocadas guardadas);
- clima de cor por sala;
- nível de detalhe por zoom;
- na casa: chuva, poças, névoa, respingos, folhas e pássaros.

### Rua (`src/base/street.js`, `streetArt.js`)

Recém-entregue na direção Beat Cop (`docs/RUA_BEATCOP_BASE.md`) e chapada:
- fachadas sem relevo, nem recuo de portas e vitrines;
- nenhuma sombra projetada, só elipses sob os pés;
- becos lidos como faixas escuras;
- escala de pixel fracionária (pixels de tamanhos irregulares);
- vários assets oficiais do ChatGPT parados no repositório sem uso: caçamba, pallet, alarme, vapor do bueiro, bueiro, boca de lobo, manchas e lixo.

### Qualidade gráfica (`src/characters/quality.ts`)

Só afetava os retratos e algumas animações CSS. As cenas não liam a escolha do jogador.

### Pós-processamento WebGL (`src/base/post.js`)

Fica desligado por padrão (só com `?fx=gl`), porque no Safari a cópia do canvas para a textura trava a GPU. O padrão é o pós-processamento 2D.

## 2. Problemas encontrados

| Onde | Problema |
|---|---|
| Rua | Profundidade quase nula. Objetos "colados", sem sombra. Becos sem fundo. Pixel irregular (escala 1,03 etc.). Vinheta duplicada (canvas + `#vig` da base). |
| Base | A sombra de contato dos móveis ficava toda sob a pegada, escondida pelo próprio sprite, e era em retângulos duros: sofá e poltronas pareciam flutuar. |
| Casa | Poças eram elipses chapadas. Chuva numa camada só. Gradientes novos a cada quadro (poças, vinheta, fachos de janela). |
| Todas | Nenhuma integração com a qualidade baixa/média/alta. Nenhuma ferramenta para medir o custo por quadro. |

## 3. O que foi feito

### Rua do DHPP (`streetArt.js`, `street.js`)

**Regra única de luz:** sol da manhã do alto à esquerda, a mesma direção das sombras da planta da base.

**Fachadas** (camada estática, custo zero por quadro):
- Tudo que sai da parede projeta sombra para a direita e para baixo, na proporção do quanto sai: vergas, peitoris, cornijas e dentículos, frisos, toldos, letreiros, aparelhos de ar, escadas de incêndio, calhas, mastros, arandelas e o poste da barbearia.
- Recuos escurecem no alto e à esquerda: janelas, portas, vitrines e o pórtico do DHPP.
- As pilastras de tijolo nas pontas dos prédios têm face clara e face escura.
- A viga do térreo faz sombra no alto da loja.
- O toldo tem caimento, sanefa, avesso e sombra larga na vitrine.
- Luz geral de cada fachada: o céu clareia o alto e a base escurece (oclusão).
- Janelas: vidro com reflexo do céu e interior discreto atrás (persiana, cortina ou planta), mantendo moldura branca e vidro azul.
- Tijolo com tons variados, junta que pega luz e escorridos discretos.

**DHPP:**
- embasamento de granito;
- pórtico recuado com batentes;
- arandelas acesas dos dois lados da porta, que iluminam a fachada e o chão;
- sombra do letreiro e dos mastros;
- o pano das bandeiras projeta sombra na fachada.

O letreiro, a porta e as bandeiras continuam sendo os da base.

**Becos** com profundidade:
- paredes laterais em fuga (a esquerda na sombra, a direita pegando sol);
- fundo com porta de serviço e lâmpada;
- chão molhado com poça refletindo a faixa de céu;
- escurecimento para o fundo, facho de luz entrando pelo alto, fios cruzando e escada de incêndio na lateral;
- caçamba, pallet e alarme oficiais dentro, escurecidos.

**Chão:**
- lajotas com bisel, tom variado, trincas e chicletes;
- manchas e lixo oficiais, em pouca quantidade;
- sombra de contato larga no pé das fachadas;
- canteiros das árvores com grade;
- meio-fio com o alto claro e a face na sombra;
- sarjeta com folhas e bocas de lobo oficiais;
- asfalto com manchas de tom, remendos, trincas seladas, faixas de rodagem mais lisas e pingos de óleo nas pistas e nas vagas;
- pintura das faixas gasta;
- bueiros oficiais.

**Por quadro:**
- **Sombras projetadas** de pessoas, Lemos, mobiliário, árvores e carros: a silhueta de cada sprite, inclinada na direção do sol (`SUN` em `streetArt.js`), numa camada de meia resolução composta uma vez. Ficam macias, não somam escuro onde se cruzam e custam pouco.
- **Contato:** elipse escura justa sob pés, rodas e objetos.
- **Carros oficiais com volume:** versão guardada de cada folha, com o teto pegando o céu e a parte de baixo escurecida, sem alterar o desenho. Sombra de chassi em duas camadas.
- **Luzes que emitem**, somadas com `lighter`: neon OPEN e WE BUY (com uma tremida rara), arandelas do DHPP, vitrines do diner e da lavanderia, e o giroflex da viatura parada (vermelho e azul em sincronia com os quadros oficiais, iluminando calçada e fachada).
- **Árvores** com o mesmo `bush` da planta; a copa balança 1 px com o vento.
- **Vapor** do bueiro com o efeito oficial de 6 quadros.
- **Fachos de luz** da manhã e poeira que só aparece dentro deles (qualidade alta).
- Anel de retorno no ponto tocado.

**Câmera:**
- **Escala inteira de pixel**: cada pixel da arte vira um bloco igual de pixels da tela, nada tremido nem torto.
- Em telas 3x (iPhone) a escala é 2 e o enquadramento sobe para manter o letreiro e as bandeiras fora do cabeçalho.

**Otimização:**
- lista de desenho reaproveitada entre quadros (sem criar funções por quadro), com ordenação por inserção (quase ordenada);
- corte do que está fora da tela;
- gradientes guardados por tamanho de tela;
- fumaça limitada a 40 partículas;
- camada estática refeita uma vez quando os PNGs oficiais terminam de carregar.

**Movimento reduzido:** sem balanço das árvores, sem deriva da poeira, sem tremida do neon e sem "respiração" dos fachos.

### Base (`base.js`)

- **Oclusão de ambiente dos móveis**, pintada uma vez no piso com o desfoque de sombra do canvas (funciona no Safari, ao contrário de `ctx.filter`). É uma mancha larga e uma faixa justa que passam um pouco da frente da pegada. Sofá, poltrona, mesas e estantes deixaram de flutuar.
- **Qualidade integrada** (seção 4).

### Casa (`varredura.js`)

- **Poças** com desenho guardado:
  - contorno orgânico de três lobos, halo de chão molhado e reflexo do céu;
  - borda de lá mais clara, borda de cá escura;
  - só refeitas quando a cor do céu muda;
  - por quadro só os brilhos que correm.
- **Chuva em duas profundidades:** gotas de longe finas e curtas; uma em cada três de perto, mais longa e clara. Mesmo número de gotas.
- **Sem alocação por quadro** nos gradientes da vinheta e dos fachos de sol das janelas (guardados; a força vem do alpha).
- **Qualidade integrada.**

### Interrogatório (`RoomFx.tsx`)

- Poeira no facho da luminária respeita a qualidade:
  - baixa: 24 partículas a 30 fps;
  - média: 45;
  - alta: 70.
- Já pausava com a aba oculta e respeitava movimento reduzido.
- Retratos, visemas, máscaras e expressões não foram tocados.

### Diagnóstico (`src/perfHud.js`)

Com `?perf=1` na URL (casa ou base) aparece no canto:
- CPU por quadro (média e p95);
- fps real;
- tamanho do canvas e DPR;
- qualidade;
- na rua: sprites desenhados, sombras e partículas;
- na casa: gotas, partículas, detalhe e zoom.

Mede embrulhando `requestAnimationFrame`. Desligado, não muda nada.

## 4. Qualidade (Ajustes → baixa / média / alta)

É a mesma escolha de `src/characters/quality.ts`. Nada muda sozinho: a preferência do jogador é só lida, e a troca vale na hora.

| | Baixa | Média | Alta |
|---|---|---|---|
| Resolução do canvas (base, rua, casa) | até 2x, ampliado sem suavizar | nativa (até 3x) | nativa (até 3x) |
| Rua: sombras projetadas, luzes que emitem, giroflex, vapor, volume dos carros | não | sim | sim |
| Rua: fachos de luz e poeira | não | não | sim |
| Base: profundidade de campo (cópias desfocadas) | não | não | sim |
| Base: poeira nos fachos e no ar | não | metade | toda |
| Base: reflexo no piso e luz de contorno | não | sim | sim |
| Casa: chuva | metade | toda | toda |
| Casa: névoa | 1 camada | 2 camadas | 2 camadas |
| Casa: vapor das poças | não | sim | sim |
| Interrogatório: poeira | 24 a 30 fps | 45 | 70 |

## 5. Recursos avaliados e recusados

- **WebGL como padrão:** continua opcional (`?fx=gl`). No Safari, subir o canvas para textura a cada quadro trava a GPU, e não há ganho visual que compense no iPhone. O equivalente em 2D cobre o essencial: brilho somado, clima de cor, vinheta CSS e profundidade de campo em cópias guardadas.
- **`ctx.filter` (blur):** não existe no Safari. Usamos o desfoque da sombra do canvas, feito uma vez.
- **Normal maps nos sprites:** os assets oficiais são pixel art plana. Iluminar por normal mudaria a leitura do desenho, e a regra é não alterar a identidade visual. A luz entra por camadas (sombra, contato, emissão), sem repintar o sprite.
- **Aberração cromática e bloom forte:** deixam a pixel art suja. Ficou só o brilho localizado das fontes de luz.
- **Anti-aliasing tradicional:** recusado. A rua passou a usar escala inteira de pixel.
- **Luzes da rua acesas e chuva na rua:** o roteiro marca a manhã seca no DHPP. Postes ficam apagados; só as arandelas, os neons das lojas abertas e o giroflex emitem luz.

## 6. Testes executados

- `npm run build`: ok.
- Fluxo rua → entrar no DHPP → sair para a rua em 844×390, 390×844 e 375×667: ok, sem erros.
- Trânsito: os 6 carros andam; menor distância entre carros da mesma faixa de 534 px (o maior carro, o ônibus, tem 360).
- Regressões do quadro do caso e dos NPCs da base: ok.
- Casa: cena, poças e chuva sem erros.
- Invesphone (ligação e tela inicial) em 390×844 e 375×667: sem erros.
- Capturas no mesmo enquadramento antes e depois: rua (2x e 3x), base (recepção, visão geral) e casa (quintal com poça).

## 7. Medições

Chromium sem GPU, CPU estrangulada 4×, 844×390. Tempo de CPU por quadro em ms (média / p95).

**Antes:**

| Cena | Média | p95 |
|---|---|---|
| Rua (plana) | 3,3 | 6,0 |
| Base, recepção | 16,7 | 28,5 |
| Base, visão geral | 15,7 | 25,1 |
| Casa, visão geral | 19,5 | 29,7 |
| Casa, quarto | 24,1 | 33,1 |

**Depois, por qualidade (tela 2x):**

| Qualidade | Rua média | Rua p95 | Base média | Base p95 |
|---|---|---|---|---|
| Baixa | 4,8 | 8,9 | 14,2 | 20,0 |
| Média | 7,6 | 10,5 | 15,4 | 27,3 |
| Alta | 10,1 | 15,5 | 18,9 | 25,1 |

**Depois, tela 3x, alta:** rua 9,5 / 12,8; base 29,9 / 55,3.

**Casa (alta), depois:** 22,4 / 33,8 (visão geral) e 22,6 / 34,6 (quarto).

**Leitura:** no Chromium sem GPU, 80% do tempo é rasterização em software (perfil de CPU). O custo real no iPhone, com rasterização na GPU, é bem menor e não pode ser deduzido destes números. A baixa corta a área desenhada em telas 3x (2,25× menos pixels), a alavanca que mais pesa.

## 8. Limitações

- Safari real e iPhone não foram testados aqui. Desempenho (60/30 fps), memória das texturas e a camada de sombras em meia resolução precisam de conferência no aparelho; use `?perf=1`.
- As árvores da rua são desenhadas em código no traço da planta (não há asset oficial de árvore da rua).
- A rua não tem ciclo de dia: é sempre a manhã do caso.

## 9. Próximas oportunidades

- Asset oficial de árvore de calçada e de marquise do DHPP (pedido ao ChatGPT, se o usuário quiser).
- Reflexo dos carros e das pessoas nas poças da casa.
- Cache da luz da base por sala quando nada se move (hoje o passe de luz roda a cada quadro).
- Medir no iPhone e ajustar os limites da qualidade média.
