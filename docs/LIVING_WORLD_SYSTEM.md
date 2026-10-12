# Mundo vivo

O mundo do Caso 01 não depende do jogador para parecer habitado. Cada personagem tem função, ritmo e lugares de verdade, escolhe o que fazer conforme o contexto e não repete o que acabou de fazer. As cenas soam conforme o que acontece nelas. Nada disso avança a história sozinho: o caso só anda pelos gatilhos oficiais (`docs/CASE01_GAME_FLOW.md`), e o mundo só *mostra* o que o save já tem.

## 1. Arquitetura

### `src/world/life.js` — peças comuns às três cenas

- **`choose(R, options, ctx, mem, now)`:** escolha ponderada com memória.
  - O peso pode depender do contexto: o papel, o momento do caso, um lugar livre, a distância.
  - Uma opção usada há pouco perde peso e o recupera aos poucos (`cool`).
  - A última escolhida quase nunca sai duas vezes seguidas.
- **`jitter(R, base)`:** durações irregulares, com cauda longa ocasional (às vezes alguém demora mais). Nada acontece em intervalo fixo.
- **`lineBank()`:** falas.
  - Escolhe uma fala válida no contexto que ninguém disse recentemente.
  - Espaça as falas da cena inteira (`gap`) para nunca virar enxurrada.
- **`eventLog()`:** registro curto dos acontecimentos (painel e reações).
- **`lifeDebug(rows)`:** painel de diagnóstico, só com `?debug=1`.

### `src/world/ambientAudio.js` — som ambiente gerado na hora

Sem arquivos e sem áudio licenciado. Detalhes na seção 6.

### Cenas

| Cena | Onde fica a rotina |
|---|---|
| Rua | `src/base/street.js` (pedestres, ônibus, táxi e trânsito) |
| Base | `src/base/base.js`, seção "Mundo vivo da base" (`RT`, `POOL`, `routine`, `lifeTick`) |
| Casa | `src/varredura/varredura.js` (`IDLE`, `idleJob`, `crewLine`), por cima da IA de equipe que já existia (perícia, fita, escolta, café, ordens) |

**Modelo de cada personagem:**
- tem um estado simples com começo, meio e fim;
- vai até o lugar, faz a atividade (gesto do boneco + som do lugar) e termina;
- emenda a próxima atividade, escolhida por `choose`.

**Interrupções:** conversar com o Lemos, uma ordem, uma área marcada para perícia ou um curioso no lote interrompem na hora. Depois a pessoa retoma.

## 2. Rua do DHPP

### Pedestres

Dezesseis pedestres, cada um com seu jeito: pressa (dois andam bem mais rápido), quanto conversa e quanto é curioso.

| Atividade | O que acontece |
|---|---|
| Passear | Destino do lado em que já estava indo, na maioria das vezes, e uma pausa com gesto (relógio, celular, coçar a cabeça). |
| Loja | Vai até a porta da loja (GROCERY, DINER, PAWN, LAUNDRY, BARBER ou um prédio residencial). A porta abre, ele some lá dentro por um tempo e sai pela mesma porta. Quem sai do DINER às vezes fica tomando o café na calçada. |
| Vitrine | Para diante dela, às vezes com a mão no queixo. |
| Jornal | Para na caixa de jornal e lê. |
| Telefone público | Usa o telefone (som da ficha). |
| Banco | Senta (às vezes lendo ou tomando café). |
| Ônibus (calçada de cá) | Espera sentado no banco do ponto ou em pé, olhando o relógio. |
| Táxi | Acena no meio-fio. |
| Atravessar | Vai até um trecho sem carro estacionado, espera o trânsito abrir (olhando) e atravessa. |
| Ir embora | Sai por uma das pontas e volta mais tarde, por qualquer ponta e qualquer calçada. |

- Cada lugar só atrai quem está perto.
- Cada lugar tem ocupação (um no telefone, dois no banco).

**Reações:**
- Dois que passeiam e se cruzam podem parar para conversar, com balão de reticências alternando e o leve balanço de quem fala.
- Pedestres abrem passagem quando o Lemos vem de frente e diminuem o passo perto dele.
- Quem está parado às vezes olha para o policial que passa.
- Os pombos voam quando alguém chega perto.

### Veículos

- Cada carro segue o da frente na sua faixa, com velocidades diferentes, que mudam a cada volta.
- Os carros freiam para quem está atravessando. Quem espera muito pode buzinar, uma vez.
- Luz de freio acesa quando o carro desacelera ou para.
- **Ônibus** (asset oficial): passa de tempos em tempos (intervalo irregular) e para no ponto. A porta abre, quem esperava embarca, às vezes alguém desce, e ele segue. Os carros de trás esperam.
- **Táxi:** quando alguém acena, um táxi livre da faixa de cima encosta no meio-fio. A pessoa entra, a porta bate e ele volta para a faixa.
- Vida comercial: portas abrindo quando alguém entra ou sai e tambores da lavanderia girando.

### Continuidade

Enquanto o Lemos está na base, a rua não congela. Ao voltar, `street.resume()` avança a simulação pelo tempo que passou (até 2 min).

## 3. Base do DHPP

**Rotina por pessoa (`RT` em `base.js`).** Atividades com peso, duração, gesto e som, nos objetos reais da planta:

| Pessoa | Atividades |
|---|---|
| Sônia | Mesa, telefone (toca, ela atende), estante e arquivo da sala. Raramente o quadro; mais vezes quando já há assuntos conversados. Quase não sai da sala: coordena. |
| Renata | Digitar, telefone, quadro (mais visitas conforme o caso avança), copiadora, café, arquivo, conversa com a Denise. |
| Denise | Transcrever na mesa na maior parte do tempo (reservada), copiadora, preparar a sala de depoimentos (bem mais vezes quando há alguém esperando para depor), café, arquivo. |
| Paulo | Inquieto: café, telefone de pé, quadro, janela, rádio, conversa com o plantão e com a Renata. |
| Maurício | Concentrado na bancada. Mesa de luz (bem mais vezes depois que as fotos da cena foram pedidas), armário, malotes, entregar algo à Renata (raro). |
| Plantão | Balcão, telefone frequente (toca e é atendido: "DHPP, bom dia."), bebedouro. |
| Limpeza | Pano pela recepção e pelos corredores, com pausa no bebedouro. |

**Comportamento:**
- Velocidade de caminhada própria de cada um.
- Quem levanta da cadeira faz a cadeira ranger. Quem digita faz som de teclado.
- **Falas (`POOL`):**
  - Curtas e de trabalho.
  - As que dependem do caso têm condição no save: "Termo pronto pra assinar." só depois de um depoimento; "Foto por foto." na mesa de luz só depois de as fotos serem pedidas.
  - Passam pelo `lineBank`: nenhuma repete em seguida, e a cena inteira tem intervalo mínimo.
  - As conversas de fundo antigas (`CHATS`) e as frases soltas de cada um também passam por ele.

**Reações:**
- Ao entrar numa sala, às vezes alguém de lá cumprimenta o Lemos. Há intervalo mínimo; ninguém para tudo.
- Quem está perto se vira para ele.
- Um fato novo no save (uma pista registrada no aparelho, na base ou num depoimento) leva a Renata ao quadro: "Vou pôr no quadro."

**Interrupção:**
- Falar com alguém congela a atividade dele (`hold`).
- Ao fechar a conversa, quem estava fazendo algo continua. Quem estava a caminho pensa um pouco e escolhe de novo.

**Continuidade:** ao voltar da rua depois de um tempo, quem estava a caminho já chegou e as atividades andaram (`resumeBase`).

**Correção:** o passeio por pontos (Paulo, Maurício, limpeza) estava desligado por um bug (`walk:0` apagava a lista). A lista agora fica em `route`, e o passeio virou atividade da rotina.

## 4. Casa da Rua das Acácias (perícia)

A equipe já trabalhava de verdade: perícia com progresso, fita, escolta de curiosos, café para a energia, ordens arrastadas, rádio e reforços. O que faltava era o tempo morto, que antes era só "andar perto do posto".

| Quem | Tempo morto |
|---|---|
| Peritos (Maurício, auxiliar, IC) | Separar material na viatura (agachado, com estalos), revisar anotações, observar a casa de fora. |
| PMs | Ronda do perímetro (anda por vários pontos), na escuta com a central (rádio), olhar a rua. |
| Paulo | Observar a rua, anotar placas e nomes, andar pela calçada. |

- **Colegas parados por perto trocam uma informação** que o estado da cena confirma (`crewLine`):
  - "Fita firme no portão." só com fita esticada;
  - "Ainda tem área marcada lá dentro." só com área marcada;
  - "O que achamos já foi pra foto." só depois de um achado; antes disso, "Nada fotografado ainda.".
- **Tudo é interrompível:** ordem, área marcada (o perito larga o tempo morto na hora) ou curioso no lote.
- **O chip da equipe não mostra ícone de atividade no tempo morto.** O ícone só aparece para o que é mecânica (perícia, fita, café, escolta, posto).

## 5. Aparelho (Invesphone)

- **Continuidade com a base e a casa:** o aparelho recarrega os fatos do caso e mantém a tela atual quando:
  - o save muda em outra aba;
  - a página volta do cache do navegador (iOS/PWA);
  - a aba volta a ficar visível.

  Antes, uma aba aberta do aparelho regravava o save inteiro e podia apagar o que a base tinha acabado de registrar.
- **Confirmação de leitura:** enquanto envia, aparece o relógio de "enviando…". O ✓✓ de lida aparece quando o integrante começa a responder. O "está digitando…" com os três pontos já existia.
- **Nenhuma notificação nova sem gatilho:**
  - os contadores continuam vindo de `teamNews` (o que de fato ficou disponível);
  - as mensagens continuam saindo de `teamDialogues` e `teamMaterialRequests`, com os horários do roteiro.

## 6. Som ambiente (`ambientAudio.js`)

| Lugar | Leito contínuo | Sons pontuais (vêm do que acontece) |
|---|---|---|
| Rua | Ar da cidade; trânsito ao longe; motor que cresce conforme os carros perto da câmera | Sininho e porta das lojas, ficha do telefone, freio e porta pneumática do ônibus, partida do ônibus, porta do táxi batendo, buzina de quem espera o pedestre, asas dos pombos, passos do Lemos, passarinhos da manhã |
| Base | Ar-condicionado; o ambiente da sala | Teclado de quem digita, telefone tocando e sendo atendido, copiadora, papel, xícara no café e no bebedouro, rádio do Paulo, cadeira rangendo |
| Casa | Sistema `SND` de antes: chuva, grilos, rádio, sirene etc. | O tempo morto usa os sons que já existiam (estalos de material, rádio) |

**Regras:**
- Lado (pan) e volume pela distância até o centro da câmera (rua) ou até o Lemos (base).
- Cada tipo tem intervalo mínimo próprio. Tom e volume variam um pouco a cada vez. No máximo 6 sons pontuais simultâneos.
- Usa o mesmo contexto e a mesma chave de som ligado/desligado dos efeitos do jogo (`src/sfx.ts`, Ajustes); desligar ali silencia o ambiente também.
- Só começa depois de um toque (regra do iOS): o botão de entrar na cena destrava.
- Some com a aba oculta.

## 7. Persistência

- A rotina não é salva: é reconstruída ao abrir a cena, sem nada perceptível (cada um começa numa atividade da sua rotina).
- Entre rua e base, cada lado avança o tempo que passou (`resume` / `resumeBase`).
- O que importa para a história fica no save oficial (`invesphone-case01-v2`), lido de novo em `focus`, `storage` e `visibilitychange` pela base e, agora, também pelo aparelho.

## 8. Otimização

- **Rua:**
  - a simulação inteira custa cerca de 0,03 ms por passo (Chromium, CPU normal);
  - conversas são checadas duas vezes por segundo;
  - lista de desenho reaproveitada;
  - corte do que está fora da tela;
  - quem está dentro de loja ou fora da rua não é desenhado.
- **Base:** decisões só ao terminar uma atividade; o caminho é calculado uma vez por atividade (BFS na grade).
- **Casa:** o perito ocioso checa se há área marcada a cada 10 passos, escalonado por pessoa.
- **Som:** leitos são 2 ou 3 fontes contínuas; os pontuais são curtos e limitados.
- **Qualidade baixa:** continua cortando efeitos visuais (ver `docs/GRAPHICS_UPGRADE.md`). A simulação é a mesma em todas as qualidades: é barata, e cortar a vida mudaria o jogo.

## 9. Diagnóstico

- `?debug=1` em `/base/` mostra um painel no canto:
  - **Rua:** quantos pedestres estão visíveis, carros, estado do ônibus e do táxi; de cada pedestre, o estado, o destino e o gesto; os últimos acontecimentos.
  - **Base:** relógio, assuntos conversados, depoimentos e quem espera; de cada pessoa, a atividade, o tempo restante, o caminho e a fala; os últimos acontecimentos.
- `?perf=1` mostra tempo de CPU por quadro e fps (`src/perfHud.js`).
- Nada disso aparece para o jogador sem o parâmetro na URL.

## 10. Testes executados

| Teste | Como | Resultado |
|---|---|---|
| A — parado na rua | Lemos parado, 60 s | Pedestres entram e saem das lojas, olham vitrine, atravessam, esperam e pegam o ônibus. |
| B — parado na base | 40 s | Cada pessoa em atividade da sua função; o telefone do plantão toca e é atendido. |
| C — interromper | Falar com o Paulo a caminho do quadro | A atividade congela; ao fechar, ele termina e emenda o café. |
| D — sair e voltar | Rua ↔ base | Estados coerentes; as atividades andaram. |
| E — progressão | Uma pista gravada no save por outra aba | A Renata vai ao quadro. O aparelho recarrega sem sobrescrever o que a base gravou. |
| F — repetição | 10 min simulados de rua e 2,5 min reais de base | Nenhum pedestre preso andando, nenhum carro parado mais de 9 s (ônibus no ponto e travessia), boa distribuição de atividades; 12 falas na base sem nenhuma repetida (uma a cada ~12 s). |
| Casa | 50 s de jogo em 4× | Peritos, PMs e Paulo alternando tempo morto coerente, trocas de informação entre colegas, sem erros. |

**Regressões:**
- fluxo rua → DHPP → rua em 844×390, 390×844 e 375×667;
- quadro do caso e NPCs da base;
- trânsito sem sobreposição;
- `npm run build`.

**G — iPhone:** não houve acesso a um aparelho real. Pendente conferir no Safari/PWA:
- o som (destrava no toque e respeita o modo silencioso do sistema);
- o desempenho, com `?perf=1`;
- a memória.

## 11. Assets

Nenhum asset novo foi necessário:
- a rua e a base usam os bonecos da planta, desenhados em código com gestos (celular, café, braços cruzados, alongar, ler, mão no queixo, relógio, coçar a cabeça) e o quadro sentado;
- carros, ônibus, táxi e mobiliário são os oficiais;
- na casa, os quadros de andar e de agachar.

Pedestres carregando sacolas ou guarda-chuva, ou acenando com um braço só, seriam quadros novos do boneco da planta, que é desenhado em código. Isso é com o Claude, não com o ChatGPT. Ficou como próxima possibilidade.

## 12. Próximas possibilidades

- Paulo saindo da base para a viatura e aparecendo na rua (mesmo personagem nas duas cenas).
- Carro estacionado indo embora e outro estacionando no lugar.
- Na base, o telefone tocando numa mesa vazia e alguém atravessando a sala para atender.
- Reações da equipe na casa a cada achado (alguém se aproxima para olhar), sem atrasar a perícia.
- Quadros de boneco com sacola ou guarda-chuva para a rua.

## Rua: eventos espontâneos (12/10/2026)

O diretor de eventos da rua (`events()` em `street.js`) sorteia a cada ~15 s: sair da vaga, estacionar, entrega (furgão + entregador), corredor, viatura com sirene. Pedestres usam os semáforos (botão → vermelho dos carros → travessia). Postos fixos (guardas, comerciantes) ficam em `staff` e só trocam de pose. Detalhes em `docs/RUA_BEATCOP_BASE.md`.

## Névoa e vento (12/10/2026)

Na rua (`street.js`): um vento suave com rajadas (`wv`) empurra faixas largas de névoa leve (baixas sobre a rua e a calçada, ralas diante das fachadas), folhas soltas no ar, a fumaça dos escapamentos e o vapor dos bueiros; as árvores, as bandeiras e os varais do primeiro plano balançam conforme ele. Uma bruma clara no alto das fachadas dá distância. Qualidade baixa e `prefers-reduced-motion` deixam só a bruma parada.
