# ARQUIVO MORTO — GAME FLOW OFICIAL DO CASO 01

## A Casa da Rua das Acácias

Status: CANÔNICO PARA ESTRUTURA DE JOGO  
Fonte narrativa: `docs/CASE01_STORY_BIBLE.md`  
Resumo canônico: `docs/CASE01_CANON.json`

Este documento define **como o Caso 01 deve ser jogado do início ao fim**. Ele não substitui a bíblia narrativa: ele organiza a experiência do jogador.

---

# 1. VISÃO GERAL

O Caso 01 deve durar como uma investigação completa, não como uma sequência de telas desconectadas.

A estrutura macro é:

**ATO 1 — INÍCIO: O que aconteceu nesta casa?**  
Capítulos 1 e início do 2.

**ATO 2 — MEIO: Quem está mentindo e por quê?**  
Resto do capítulo 2, capítulos 3 e 4.

**ATO 3 — FIM: Quem fez o quê?**  
Capítulo 5 + relatório final + epílogo.

Loop central:

**receber informação → investigar → formar hipótese → confrontar → desbloquear nova informação → atualizar o caso**

Regra obrigatória:

Nenhuma tela deve existir apenas porque "é uma função do app".  
Toda entrada do jogador numa tela precisa ter um motivo narrativo claro.

---

# 2. PRINCÍPIOS DE PROGRESSÃO

## 2.1 O jogador nunca recebe tudo de uma vez

O celular do investigador cresce junto com a investigação.

No começo:
- chamada;
- equipe;
- cena;
- poucas pessoas;
- poucas pistas.

Depois:
- depoimentos;
- telefone de Helena;
- documentos;
- alarme;
- linha do tempo;
- finanças;
- confrontos;
- relatório final.

## 2.2 Informação gera ação

Exemplos:

Encontrar `painel_alarme` não encerra nada.  
Ele desbloqueia a ação "solicitar log do alarme".

Receber `log_alarme` desbloqueia confronto de horário.

Receber `vigia_gol` + `nota_motel` desbloqueia reconstrução da janela.

Receber `cinta_bancaria` desbloqueia confronto financeiro de Téo.

## 2.3 O caso precisa mudar de natureza

Início:
"foi roubo?"

Meio:
"quem tinha acesso?"

Depois:
"quem está mentindo sobre o horário?"

Mais adiante:
"por que Téo recebeu dinheiro?"

Final:
"quem executou e quem planejou?"

## 2.4 Nenhuma revelação grande deve acontecer fora da ação do jogador

Sônia pode apontar um problema, mas não resolver o caso.

A equipe pode entregar um documento, mas o jogador precisa interpretar.

Téo pode confessar, mas apenas depois que o jogador o encurrala com evidência suficiente.

---

# 3. ESTADOS MACRO DO CASO

## ESTADO 0 — OCORRÊNCIA

O jogador ainda não assumiu o caso.

## ESTADO 1 — CENA ABERTA

O jogador sabe que há duas vítimas e uma hipótese inicial de roubo.

## ESTADO 2 — ROUBO QUESTIONADO

A cena contradiz um assalto comum.

## ESTADO 3 — PESSOAS EM VERIFICAÇÃO

O jogador começa a mapear quem estava onde.

## ESTADO 4 — ÁLIBI QUEBRADO

A janela 23:52 → 00:56 vira o centro da investigação.

## ESTADO 5 — CAIO SOB SUSPEITA

O carro e o horário colocam Caio no centro.

## ESTADO 6 — LÍVIA SOB CONTRADIÇÃO

A versão dela começa a mudar.

## ESTADO 7 — TRILHA FINANCEIRA

O caso passa a envolver dinheiro específico.

## ESTADO 8 — TÉO COMPROMETIDO

A conexão financeira leva a Téo.

## ESTADO 9 — ESTRUTURA DO PLANO

A confissão separa executor de mentor.

## ESTADO 10 — ACUSAÇÃO

O jogador precisa formalizar sua conclusão.

---

# 4. ATO 1 — INÍCIO

## Objetivo dramático

Fazer o jogador sair de:

"duplo homicídio durante roubo"

para:

"essa cena foi montada por alguém que conhecia a casa".

---

# 5. CENA 01 — CHAMADA ÀS 04:27

ID: `call_intro`

Tela:
chamada recebida da Sônia.

Objetivo:
colocar o jogador dentro do caso sem menu ou tutorial externo.

Informação inicial:
- duas vítimas;
- Campo Belo;
- Ricardo e Helena Valença;
- Lívia encontrou os corpos;
- casa aparentemente revirada.

Interação:
o jogador escolhe respostas de Lemos.

Ações opcionais dentro da ligação:
- isolar rua;
- acionar perícia;
- separar Lívia e Caio;
- preservar casa;
- pedir log;
- preservar painel.

Efeito:
as ordens geram mensagens posteriores da equipe.

Fim:
Sônia entrega o acompanhamento para Lemos.

Desbloqueia:
`brief_case`

---

# 6. CENA 02 — ABERTURA DO DHPP

ID: `brief_case`

Tela:
home do aparelho + cartão "Caso 01".

Objetivo:
dar ao jogador orientação clara.

O cartão deve responder:

- onde;
- quem;
- hipótese atual;
- tarefa imediata.

Texto de tarefa:
"Revise a cena antes de ouvir qualquer versão."

Ação principal:
"Abrir cena"

Desbloqueia:
`scene_sweep`

---

# 7. CENA 03 — VARREDURA DA CASA

ID: `scene_sweep`

Tela:
planta/ambiente investigável.

Hotspots obrigatórios:
- porta intacta;
- painel do alarme;
- Thor preso;
- escritório revirado;
- valores intactos;
- quarto da Lívia;
- vítimas surpreendidas.

Ritmo:
não exigir que o jogador toque em tudo em ordem fixa.

Sônia pode mandar uma mensagem depois de 3 achados:
"Não olha só pro que mexeram. Olha pro que deixaram."

Gatilho de conclusão:
todos os hotspots essenciais vistos.

Conclusão lógica mostrada no caderno:
"Roubo comum não explica a cena."

Desbloqueia:
- app Pistas;
- pessoas iniciais;
- `first_versions`

Virada 1 começa a se formar.

---

# 8. CENA 04 — PRIMEIRO RETORNO DA EQUIPE

ID: `team_scene_return`

Formato:
mensagens curtas no app Equipe.

Mensagens:
- acesso restrito;
- perícia processando quarto;
- painel preservado;
- pedido de log enviado.

Função:
mostrar que as ordens do jogador tiveram consequência.

Se o jogador não deu determinada ordem na chamada:
Sônia pode informar que a equipe executou a ação crítica por protocolo, mas sem premiar o jogador.

Não travar o caso por escolha operacional.

---

# 9. CENA 05 — PRIMEIRAS VERSÕES

ID: `first_versions`

Capítulo:
Versões.

Pessoas disponíveis:
- Lívia;
- Rafael;
- Cida;
- Jorge;
- Caio.

O jogador não precisa concluir todos de uma vez.

Ordem livre parcial:
qualquer um pode ser iniciado.

Porém:
Lívia e Caio devem ser mantidos separados.

Objetivo:
construir mapa de pessoas e horários.

---

# 10. CENA 06 — DEPOIMENTO INICIAL DE LÍVIA

ID: `livia_first`

Perguntas abertas inicialmente:
- hora de chegada;
- estava com Caio;
- onde estavam;
- o que viu ao entrar;
- o que fez depois;
- porta;
- relação com os pais.

Ela não é apresentada como suspeita principal.

O jogador deve sentir:
"ela está cansada e pode estar confusa."

Pistas possíveis:
- porta intacta;
- brigas_namoro;
- livia_codigo.

Não liberar confrontos fortes ainda.

Saída:
"versão registrada"

---

# 11. CENA 07 — RAFAEL

ID: `rafael_first`

Objetivo:
dar contexto familiar e remover um suspeito.

Descobertas:
- estava na LAN house;
- pais e Lívia discutiam;
- pai não gostava de Caio;
- Thor normalmente não ficava preso à noite;
- Lívia perguntou sobre patrimônio/inventário.

Depois:
registro da LAN house chega.

Pistas:
- lan_paga;
- pergunta_inventario.

Conclusão:
Rafael deixa de ser linha prioritária.

---

# 12. CENA 08 — CIDA

ID: `cida_first`

Objetivo:
mostrar rotina doméstica.

Descobertas:
- Thor preso é incomum;
- Helena mantinha a casa organizada;
- escritório revirado parece seletivo;
- discussões familiares estavam piores.

Pista:
alibi_cida.

Conclusão:
Cida é testemunha de rotina, não suspeita.

---

# 13. CENA 09 — JORGE

ID: `jorge_first`

Objetivo:
inserir o carro.

Descoberta:
viu um Gol compatível com o de Caio próximo da rua.

Limitação explícita:
não viu com certeza quem estava dentro.

Pista:
vigia_gol.

Não transformar isso em prova total.

---

# 14. CENA 10 — CAIO

ID: `caio_first`

Versão:
- estava com Lívia;
- passaram a noite juntos;
- foram ao motel;
- não esteve na casa;
- não sabe o código;
- Téo não tem relação.

Comportamento:
mais defensivo que Lívia.

O jogador ainda não tem documento suficiente para desmontá-lo.

Saída:
"aguardar verificação de horário"

---

# 15. GATILHO — FIM DO ATO 1

Condições recomendadas:
- cena investigada;
- pelo menos 4 depoimentos iniciais feitos;
- `vigia_gol` obtido ou solicitado;
- pedido do log já ativo.

Evento:
mensagem da Inteligência.

"Log do alarme chegou."

Tela:
notificação de alta prioridade.

Virada 1 consolidada:

**Isso provavelmente não foi um roubo aleatório.**

Desbloqueia:
Capítulo 3 — A Janela.

---

# 16. ATO 2 — MEIO

## Objetivo dramático

Transformar a investigação de ambiente em investigação de versões.

Pergunta central:

**Quem está mentindo sobre o intervalo da madrugada?**

---

# 17. CENA 11 — LOG DO ALARME

ID: `alarm_log`

Tela:
registro técnico simples.

Itens:
vários eventos.

O jogador precisa identificar:
23:52 — desativação por código mestre.

Pista:
log_alarme.

Ao selecionar corretamente:

Sônia:
"Agora me diz onde Lívia e Caio estavam às 23:52."

Desbloqueia:
- confronto de horário;
- solicitação de comprovante do motel;
- timeline.

---

# 18. CENA 12 — RETORNO AO DEPOIMENTO DE LÍVIA

ID: `livia_confront_access`

Agora aparecem perguntas novas com base em pistas:

- porta intacta + chave;
- quem sabia o código;
- Caio sabia?;
- como Caio poderia saber?

Progressão ideal:

Lívia:
"Caio não sabia."

Depois:
"Ele me viu digitando uma vez."

Pistas:
- inconsistencia_caio_codigo;
- livia_chave;
- caio_viu_digitando.

Função:
primeira mudança objetiva de versão.

O jogo não chama isso de "mentira confirmada" ainda.

---

# 19. CENA 13 — DOCUMENTO DO MOTEL

ID: `motel_receipt`

Formato:
documento/nota.

Registro:
00:56.

Pista:
nota_motel.

Interação:
o jogador encaixa o documento na linha do tempo.

Visual central:

23:52 — alarme  
? — intervalo não explicado  
00:56 — motel

O jogo destaca:

**64 minutos sem cobertura documental.**

Essa é a "janela".

---

# 20. CENA 14 — RECONSTRUÇÃO DA MADRUGADA

ID: `timeline_rebuild`

Tela:
linha do tempo manipulável.

Eventos disponíveis:
- Rafael na LAN;
- Gol visto;
- alarme 23:52;
- motel 00:56;
- retorno de Lívia.

O jogador ordena.

Objetivo:
perceber que Caio poderia estar na região antes do motel.

Conclusão:
o álibi "juntos a noite toda" é insuficiente.

Virada 2:

**O álibi de Lívia e Caio não cobre o período crítico.**

Estado:
CAIO SOB SUSPEITA.

---

# 21. CENA 15 — CONFRONTO DE CAIO

ID: `caio_timeline_confront`

O jogador pode usar:
- vigia_gol;
- log_alarme;
- nota_motel.

Caio:
primeiro tenta desacreditar Jorge.
Depois diz que passaram "rodando" antes do motel.
Pode admitir ter estado na região sem admitir entrada.

Objetivo:
não conseguir confissão.

Resultado:
contradição maior.

Nova pergunta:
"Por que alguém que não esteve na casa precisa ajustar tanto o horário?"

Desbloqueia:
- aprofundar motivo;
- finanças;
- segundo confronto com Lívia.

---

# 22. CENA 16 — TELEFONE/AGENDA DE HELENA

ID: `helena_phone`

Objetivo:
humanizar vítimas e trazer evidência de conflito.

Conteúdo:
- mensagem de Rafael;
- mensagem de Lívia;
- agenda de Helena;
- registros que mostram preocupação com o namoro.

Pista:
agenda_helena.

Importante:
o telefone não deve virar um parque de apps sem propósito.

Cada item relevante precisa se conectar ao caso.

---

# 23. CENA 17 — MOTIVO FAMILIAR

ID: `livia_family_confront`

Perguntas desbloqueadas:
- seu pai ameaçou você?;
- por que perguntou sobre inventário?;
- sua mãe queria conversar?;
- o relacionamento estava piorando?

Descoberta:
ameaça de cortar herança.

Pista:
ameaca_heranca.

Estado:
LÍVIA SOB CONTRADIÇÃO.

Ainda não chamar Lívia de mentora.

Possibilidades que o jogador deve considerar:
- Lívia está protegendo Caio;
- Lívia sabia de algo;
- Lívia pode ter ajudado;
- Lívia pode estar apenas escondendo o namorado.

---

# 24. TRANSIÇÃO PARA "SIGA O DINHEIRO"

Evento:
equipe financeira manda atualização.

Conteúdo:
- movimentação de Ricardo;
- carta de cobrança;
- referência aos US$ 5.000.

O jogador inicialmente vê duas linhas:

A. problema financeiro de Ricardo;  
B. dinheiro retirado da casa.

O jogo deve permitir considerar A antes de descartá-la.

---

# 25. CENA 18 — DOCUMENTOS FINANCEIROS

ID: `financial_docs`

Documentos:
- extrato_ricardo;
- carta_cobranca;
- agenda_helena.

Interação:
marcar documentos relevantes.

O jogador precisa perceber:
o suposto assalto deixou bens, mas uma quantia específica desapareceu.

Pergunta de Sônia:
"Se queriam dinheiro, por que deixaram o resto?"

---

# 26. CENA 19 — FALSA LINHA DE DÍVIDA

ID: `debt_false_lead`

Duração:
curta.

Objetivo:
dar sensação de investigação real.

A equipe verifica:
credor / cobrança / negócio.

Resultado:
sem conexão consistente com a residência ou horários.

Regra:
não gastar tempo excessivo.

Mensagem:
"Linha financeira externa sem vínculo com a cena."

Essa falsa pista é oficialmente descartada.

---

# 27. CENA 20 — TÉO APARECE

ID: `teo_entry`

Forma:
informação de inteligência + pessoa adicionada ao caso.

Gatilho:
dinheiro ou compra relacionada à moto.

O jogador abre perfil de Téo.

Primeira leitura:
irmão de Caio, situação financeira incompatível com gasto recente.

Não acusar ainda.

Desbloqueia:
primeiro depoimento de Téo.

---

# 28. CENA 21 — PRIMEIRO DEPOIMENTO DE TÉO

ID: `teo_first`

Versão:
- viu Caio antes ou depois;
- não foi à casa;
- não sabe dos Valença;
- dinheiro veio de outra fonte.

Tom:
seco.

Objetivo:
obter negativas que poderão ser quebradas depois.

Não liberar confissão.

---

# 29. CENA 22 — CINTA BANCÁRIA

ID: `bank_band`

Descoberta:
dinheiro associado a Téo carrega cinta:

Banco Meridional  
ag. 0431  
15/10/2002  
US$ 5.000

Pista:
cinta_bancaria.

Interação:
cruzar com movimentação de Ricardo.

Conclusão:
dinheiro de Téo se conecta à quantia que estava na casa.

Virada:
TÉO COMPROMETIDO.

---

# 30. FIM DO ATO 2

O jogador agora deve saber:

- a cena foi montada;
- alguém conhecia a casa;
- Caio esteve próximo;
- motel não cobre o período;
- Lívia muda detalhes;
- existe motivo familiar e patrimonial;
- Téo recebeu dinheiro ligado à casa.

Mas ainda falta responder:

**quem planejou?**

---

# 31. ATO 3 — FIM

## Objetivo dramático

Converter evidência dispersa em papéis claros.

---

# 32. CENA 23 — PREPARAÇÃO DO CONFRONTO FINAL

ID: `teo_pressure_setup`

Tela:
dossiê rápido.

O jogo mostra evidências selecionáveis:
- log;
- Gol;
- motel;
- dinheiro;
- cinta;
- Caio;
- acesso.

O jogador escolhe a ordem de pressão.

A ordem pode mudar pequenas falas, mas não o resultado canônico.

---

# 33. CENA 24 — TÉO QUEBRA

ID: `teo_break`

Estrutura em estágios.

## Estágio 1
Téo nega.

## Estágio 2
Admite que Caio o chamou.

## Estágio 3
Admite que esteve na região.

## Estágio 4
Confrontado com dinheiro, admite participação.

## Estágio 5
Explica que não precisaram arrombar.

## Estágio 6
Lívia aparece pela primeira vez explicitamente como facilitadora.

Frase-chave:

"A Lívia deixou tudo pronto. O código, o cachorro…"

Pista:
confissao_teo.

Importante:
não transformar Téo em narrador que explica o caso inteiro.

O jogador deve completar as conexões.

---

# 34. CENA 25 — SILÊNCIO DEPOIS DA CONFISSÃO

ID: `post_confession`

Duração:
curta.

Sem música triunfal.

Sônia manda:

"Agora separa o que você sabe do que você consegue provar."

Isso abre a fase final.

---

# 35. CENA 26 — QUADRO FINAL DO CASO

ID: `final_board`

Tela:
resumo investigativo, não um puzzle complicado.

Colunas:

PESSOAS  
HORÁRIOS  
ACESSO  
DINHEIRO  
MOTIVO  
PROVAS

Objetivo:
permitir revisão antes da acusação.

O jogador pode tocar em qualquer pista para rever origem.

Não adicionar pista nova aqui.

---

# 36. CENA 27 — RELATÓRIO DE ACUSAÇÃO

ID: `accusation_report`

O jogador escolhe:

## Executores
- Caio
- Téo
- outros possíveis nomes

Resposta correta:
Caio + Téo.

## Mentor/facilitador
Resposta correta:
Lívia.

## Motivo
Resposta correta:
herança + conflito familiar/relacionamento.

## Provas
Selecionar pelo menos 3 das aceitas:

- log_alarme
- nota_motel
- cinta_bancaria
- confissao_teo
- agenda_helena
- valores_intactos

Não mostrar "certo/errado" enquanto preenche.

Botão:
"Protocolar relatório"

Confirmação séria:
"Depois de protocolado, o relatório encerra sua participação operacional no caso."

---

# 37. CENA 28 — RESULTADO

## Final A — Caso Encerrado

Condição:
executores corretos + Lívia correta + motivo correto + provas suficientes.

Tom:
conclusão profissional.

Sônia:
"Bom trabalho. Você não parou no primeiro culpado que apareceu."

## Final B — Meia Justiça

Condição:
Caio + Téo corretos, mas Lívia não identificada como mentora.

Tom:
incômodo.

Sônia:
"Você fechou quem entrou na casa. Não necessariamente quem colocou os dois lá."

## Final C — Arquivado

Condição:
executores errados.

Tom:
frio.

Relatório não sustenta a acusação.

Sem "game over" caricatural.

---

# 38. CENA 29 — EPÍLOGO

ID: `epilogue`

Formato:
cartões curtos, um por personagem relevante.

No final A:
- Caio: responsabilizado como executor.
- Téo: responsabilizado como executor e colaborador/confesso.
- Lívia: responsabilizada como mentora/facilitadora.
- Rafael: retirado da investigação.
- Cida: testemunha.
- Jorge: testemunha.
- Ricardo e Helena: caso formalmente reconstruído.
- Sônia: encerra o arquivo com Lemos.

No final B:
Lívia permanece como ponto não resolvido.

No final C:
texto enfatiza insuficiência da conclusão.

Depois:
"CASO 01 ARQUIVADO"

Opções:
- Rever caso
- Novo jogo
- Voltar ao arquivo

---

# 39. CONTROLE DE DESBLOQUEIOS

## Apps/telas iniciais

Disponíveis:
- Equipe
- Caso
- Pistas
- Cena

Bloqueados:
- Financeiro
- Linha do tempo avançada
- Relatório final

## Após primeiras versões

Desbloquear:
- Pessoas/Depoimentos completos
- Telefone de Helena
- Arquivo

## Após log

Desbloquear:
- Timeline
- confronto por evidência

## Após nota do motel

Desbloquear:
- reconstrução da janela
- segundo Caio

## Após pista de herança

Desbloquear:
- motivo/patrimônio no caderno

## Após dinheiro

Desbloquear:
- financeiro
- Téo

## Após confissão

Desbloquear:
- quadro final
- relatório de acusação

---

# 40. REGRAS DE RETORNO A PERSONAGENS

Um personagem deve poder ser interrogado novamente quando uma nova pista relevante surgir.

Exemplo:

Lívia inicial:
perguntas gerais.

Depois de porta/chave:
confronto de acesso.

Depois de código:
confronto de alarme.

Depois de herança:
confronto de motivo.

Caio inicial:
álibi.

Depois de Gol:
localização.

Depois de motel:
horário.

Depois de Téo:
relação com irmão.

Téo inicial:
nega.

Depois de dinheiro:
origem.

Depois de cinta:
pressão.

Nunca substituir um interrogatório anterior; adicionar nova camada.

---

# 41. NOTIFICAÇÕES E EVENTOS ASSÍNCRONOS SIMULADOS

O jogo pode usar notificações para parecer vivo.

Exemplos:

"Perícia enviou atualização."
"Inteligência: log disponível."
"Equipe externa: veículo identificado."
"Financeiro: cruzamento concluído."
"Sônia está ligando."

Regra:
notificações devem ser disparadas por progresso, não por tempo real obrigatório.

O jogador não deve precisar esperar minutos de verdade.

---

# 42. CHAMADAS DURANTE O CASO

Além da abertura, usar chamadas em pontos de virada.

## Chamada 2
Depois da cena.

Sônia pergunta qual detalhe menos combina com roubo.

## Chamada 3
Depois da janela 23:52 → 00:56.

Sônia:
"Agora você tem um buraco no álibi. Usa isso."

## Chamada 4
Depois da cinta bancária.

Sônia:
"Se esse dinheiro saiu daquela casa, Téo acabou de entrar de vez no caso."

## Chamada 5
Após confissão.

Curta.

"Fecha o relatório. Sem pressa. Só coloca o que você consegue sustentar."

Essas chamadas podem reutilizar a mecânica de diálogo/ações já criada.

---

# 43. FUNÇÃO DE CADA SISTEMA

## Equipe
receber atualizações e consequências de ordens.

## Pistas
consultar fatos já descobertos.

## Depoimentos
obter versão, contradição e confissão.

## Telefone de Helena
contexto familiar e prova documental.

## Arquivo
documentos e registros.

## Timeline
cruzar horários.

## Financeiro
rastrear dinheiro.

## Capítulos
mostrar progresso, não servir como menu principal.

## Relatório
apenas no fim.

---

# 44. O QUE NÃO FAZER

- Não liberar todos os apps desde o primeiro minuto.
- Não transformar cada capítulo em lista de tarefas seca.
- Não mostrar barra "70% do caso resolvido".
- Não marcar alguém como "culpado" automaticamente.
- Não exigir visita a telas sem motivo.
- Não criar puzzles abstratos desconectados da investigação.
- Não deixar Sônia resolver deduções pelo jogador.
- Não revelar Lívia cedo demais.
- Não usar "missão concluída" em tom arcade.
- Não travar o jogo por uma escolha operacional na ligação.

---

# 45. RITMO

## Primeiro terço
descoberta rápida.

O jogador deve receber feedback frequente.

## Segundo terço
mais aberto.

Pode alternar entre pessoas, documentos e timeline.

## Último terço
afunila.

Menos novas linhas, mais confrontos.

A sensação deve ser:

começo = expansão  
meio = comparação  
fim = convergência

---

# 46. DURAÇÃO RELATIVA

Não fixar minutos rígidos, mas proporção aproximada:

- Ato 1: 30%
- Ato 2: 45%
- Ato 3: 25%

O meio deve ser a parte mais rica.

---

# 47. MODELO DE CENA PARA IMPLEMENTAÇÃO

Cada cena futura deve ter:

```
id
chapter
act
entryCondition
playerGoal
availableActions
requiredClues
optionalClues
dialogue
outputClues
stateChanges
unlocks
teamFollowup
exitCondition
```

Isso evita lógica narrativa espalhada pelo JSX.

---

# 48. FLUXO RESUMIDO

```
CHAMADA 04:27
↓
ABRIR CASO
↓
VARREDURA DA CASA
↓
PRIMEIRAS VERSÕES
↓
ROUBO NÃO FECHA
↓
LOG 23:52
↓
CONFRONTAR ACESSO/CÓDIGO
↓
NOTA DO MOTEL 00:56
↓
RECONSTRUIR JANELA
↓
CAIO SOB SUSPEITA
↓
CONFLITO + HERANÇA
↓
DOCUMENTOS FINANCEIROS
↓
TÉO
↓
CINTA BANCÁRIA
↓
CONFRONTO FINAL DE TÉO
↓
CONFISSÃO
↓
QUADRO FINAL
↓
RELATÓRIO
↓
A / B / C
↓
EPÍLOGO
```

---

# 49. CRITÉRIO DE PRONTO DO CASO 01

O Caso 01 só deve ser considerado completo quando:

- cada cena acima possui implementação ou equivalente funcional;
- toda pista importante tem origem clara;
- toda nova pista provoca consequência;
- retornos aos interrogatórios funcionam;
- o jogador nunca precisa adivinhar qual tela abrir sem indicação;
- a história respeita a bíblia;
- os três finais são alcançáveis;
- nenhuma informação obrigatória depende de conteúdo opcional;
- save restaura o estado correto;
- o jogador consegue explicar ao final:
  - por que não foi roubo;
  - como entraram;
  - quando aconteceu;
  - por que o motel não fecha;
  - por que Caio é ligado à casa;
  - por que Téo entra no caso;
  - por que Lívia é mais que uma testemunha;
  - qual foi o motivo;
  - qual papel cada culpado teve.

---

# 50. FONTE DE VERDADE DE GAMEPLAY

Para conteúdo narrativo:
`docs/CASE01_STORY_BIBLE.md`

Para fatos imutáveis:
`docs/CASE01_CANON.json`

Para ordem, gatilhos e progressão:
`docs/CASE01_GAME_FLOW.md`

Quando houver conflito entre o fluxo atual no código e este documento, o código deve ser ajustado gradualmente para refletir este game flow, sem apagar mecânicas já boas.


# 51. SOLICITAÇÃO DE MATERIAIS À EQUIPE

O app Equipe possui uma mecânica ativa de solicitação de materiais.

Fonte específica:
`docs/TEAM_MATERIAL_REQUESTS.md`

Ela atravessa o fluxo do caso e segue a regra:

**descoberta → pedido → material → nova ação**

Exemplos:
- painel encontrado → pedir fotos do painel;
- Rafael ouvido → pedir comprovante da LAN;
- primeiras versões concluídas → pedir log do alarme;
- log recebido → pedir registro do motel;
- linha financeira aberta → pedir documentos de Ricardo;
- extrato cruzado → pedir análise da cinta.

O jogador nunca deve conseguir pedir uma prova futura sem ter fundamento narrativo para saber que ela existe.
