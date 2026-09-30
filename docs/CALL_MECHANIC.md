# Mecânica de Ligações — Invesphone

Esta é a mecânica padrão de chamadas do projeto **Arquivo Morto / Invesphone** e deve ser reutilizada em futuras ligações, interrogatórios remotos e contatos com a equipe.

## Princípio

A chamada não deve ser apenas uma sequência de textos. Ela funciona como uma cena interativa em que:

1. um personagem fala;
2. a fala aparece com efeito de digitação/transcrição;
3. o jogador escolhe uma resposta;
4. a resposta do jogador aparece como fala do personagem Lemos;
5. a próxima fala do NPC depende da escolha feita;
6. em momentos contextuais, o jogador pode dar uma ordem operacional;
7. a ordem é pronunciada por Lemos dentro da própria ligação;
8. o NPC confirma verbalmente a ordem;
9. somente depois da confirmação a ação é registrada;
10. o efeito da ordem reaparece mais tarde no jogo, por exemplo no app Equipe.

## Regras de diálogo

- Toda resposta do jogador deve conversar diretamente com a fala anterior.
- A próxima fala do NPC deve reagir à escolha do jogador.
- Evitar opções genéricas que levem à mesma resposta sem adaptação.
- As escolhas podem mudar o caminho da conversa, mas não devem quebrar a progressão principal do caso.
- As falas devem ser curtas, naturais e compatíveis com uma conversa telefônica.
- O jogador deve sempre sentir que Lemos está realmente participando da conversa.

## Fluxo de uma troca

NPC fala → transcrição termina → opções de resposta aparecem → jogador escolhe → Lemos fala → NPC responde de acordo com a escolha → próxima troca.

## Ações / ordens durante a chamada

Quando fizer sentido, exibir a opção **DAR ORDEM** junto das respostas.

A ordem não pode funcionar como um botão de sistema silencioso.

Fluxo obrigatório:

NPC fala → jogador abre DAR ORDEM → escolhe a ordem → Lemos fala a ordem em voz textual → NPC confirma que vai executá-la → ação é registrada → diálogo normal continua.

Exemplo:

Sônia:
> A porta está intacta e o cachorro estava preso no canil.

Jogador escolhe:
> DAR ORDEM → Solicitar log do alarme

Lemos:
> Pede pra central puxar o log completo do alarme, principalmente as últimas ativações e desativações.

Sônia:
> Vou pedir agora. Assim que a central devolver o histórico, te encaminho.

Depois disso, o jogo registra a ordem e o app Equipe pode mostrar o resultado operacional.

## Consequências

Ordens podem gerar:

- mensagens posteriores da equipe;
- pistas antecipadas;
- relatórios;
- desbloqueio de conteúdo;
- mudança de tempo de obtenção de uma pista;
- pequenas diferenças de pontuação;
- novas opções de diálogo;
- novas tarefas.

Uma ordem importante não deve impedir permanentemente o progresso do caso caso o jogador não a escolha. O conteúdo essencial pode reaparecer por outra via, porém com atraso ou menor benefício.

## Interface

- NPC alinhado como interlocutor principal.
- Lemos visualmente diferenciado e alinhado à direita.
- Mesmo alinhado à direita, o texto de Lemos sempre digita da esquerda para a direita.
- Efeito de digitação/transcrição em todas as falas.
- Som de digitação discreto sincronizado com os caracteres.
- Enquanto há escolha disponível, mostrar estado de espera em vez de animação de fala.
- Ordens aparecem como opção contextual, não como menu permanente.
- Após uma ordem, voltar às respostas normais da conversa.

## Áudio

- O ringtone toca apenas enquanto a chamada está entrando.
- Deve parar imediatamente ao atender ou recusar.
- Não usar TTS artificial como voz definitiva.
- Caso haja voz no futuro, preferir gravação/voz gerada natural processada como chamada telefônica.
- A transcrição textual continua sendo a principal forma de acompanhar a conversa.

## Encerramento

A última troca deve ter uma conclusão natural.

Jogador responde → NPC dá uma última resposta quando fizer sentido → chamada encerra automaticamente → fluxo segue para a próxima tela.

Nunca deixar a chamada aberta indefinidamente após a última fala.

## Uso futuro

Reaplicar esta mecânica em:

- chamadas da Sônia;
- contatos com policiais em campo;
- testemunhas;
- suspeitos;
- familiares;
- perícia;
- inteligência;
- chamadas recebidas inesperadas;
- ligações feitas pelo próprio jogador;
- situações em que uma ordem durante a conversa tenha consequência futura.

A lógica deve continuar baseada em **conversa + decisão + reação + consequência**.
