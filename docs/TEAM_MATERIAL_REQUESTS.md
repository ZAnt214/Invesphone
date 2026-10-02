# MECÂNICA — EQUIPE OPERACIONAL, CONVERSAS E DILIGÊNCIAS

Status: OFICIAL  
Caso atual: Caso 01 — A Casa da Rua das Acácias

## Conceito

O app **Equipe** funciona como uma lista de contatos reais da investigação.

O jogador não abre um catálogo de provas. Ele fala com pessoas.

Cada integrante tem:
- nome;
- cargo;
- especialidade;
- jeito próprio de falar;
- histórico individual;
- assuntos que podem ser discutidos;
- memória dos assuntos já discutidos;
- diligências e materiais específicos;
- novas opções que aparecem conforme o caso muda.

A fantasia é: **Lemos coordena uma equipe real pelo telefone enquanto a investigação acontece.**

---

# 1. LOOP DA EQUIPE

O loop não é:

pedido → resposta → próximo pedido.

O loop correto é:

**fato novo → conversa → interpretação profissional → nova hipótese/necessidade → diligência → retorno → nova conversa**

Exemplo:

Rafael diz que estava na LAN  
→ Lemos fala com Paulo sobre essa versão  
→ Paulo explica como consegue verificar sem depender da palavra de Rafael  
→ surge a ação "Buscar comprovante da LAN house"  
→ Paulo retorna com o documento  
→ o álibi de Rafael ganha sustentação.

Outro exemplo:

Painel do alarme encontrado  
→ Lemos pergunta a Maurício se houve violação  
→ Maurício explica que não há sinal de força  
→ surge a ação "Close do painel do alarme"  
→ material é recebido  
→ a investigação passa a tratar acesso legítimo/código como linha real.

---

# 2. CONVERSAS SÃO PARTE DA INVESTIGAÇÃO

Conversar com a equipe não é decoração.

Os diálogos:
- contextualizam a evidência;
- ajudam o jogador a pensar sem entregar a solução;
- diferenciam opinião profissional de prova;
- liberam diligências;
- introduzem novas perguntas;
- registram mudanças de direção do caso.

Assuntos concluídos ficam salvos em `teamTopics`.

Ao voltar à conversa:
- mensagens antigas continuam ali;
- o assunto já discutido não reaparece como botão;
- novos assuntos podem ter sido liberados por pistas/depoimentos obtidos desde a última visita.

---

# 3. PERSONALIDADE DOS INTEGRANTES

## Sônia Prado — Delegada

Função:
coordenação, prioridades e leitura estratégica.

Jeito:
- curta;
- direta;
- experiente;
- não dramatiza;
- não entrega a resposta;
- frequentemente separa "impressão" de "prova".

Exemplo:
> "Impressão, sim. Prova, ainda não."

Papel narrativo:
ajudar o jogador a não casar cedo demais com uma hipótese.

Assuntos progressivos:
- primeira leitura da cena;
- possibilidade de roubo encenado;
- janela do álibi;
- separação dos papéis no final.

Não possui catálogo de materiais.

---

## Maurício Farias — Perito criminal

Função:
cena e vestígios.

Jeito:
- técnico;
- observador;
- fala do que viu fisicamente;
- evita especular sobre culpado;
- compara padrões de cena.

Exemplo:
> "Eu não chamaria isso de busca às cegas."

Assuntos progressivos:
- leitura inicial da residência;
- painel do alarme;
- Thor no canil;
- bagunça seletiva.

Diligências:
- fotos completas da cena;
- close do painel.

---

## Renata Leal — Investigadora

Função:
inteligência, registros e cruzamentos.

Jeito:
- analítica;
- pensa em horário e correlação;
- sempre procura fonte independente;
- não confunde coincidência com vínculo.

Exemplo:
> "Ainda são duas peças separadas."

Assuntos progressivos:
- quais registros cruzar;
- histórico do alarme;
- Gol + horário do alarme;
- dinheiro de Ricardo;
- origem da cinta bancária.

Diligências:
- log completo do alarme;
- documentos financeiros;
- análise da cinta.

---

## Paulo Vieira — Investigador de campo

Função:
rua, testemunhas e estabelecimentos.

Jeito:
- prático;
- linguagem simples;
- conhece diferença entre boato e testemunha útil;
- prefere documento a lembrança quando consegue.

Exemplo:
> "Eu usaria o carro, não inventaria ocupante."

Assuntos progressivos:
- situação da rua;
- credibilidade de Jorge;
- álibi de Rafael;
- registro do motel.

Diligências:
- comprovante da LAN;
- registro do motel.

---

## Denise Rocha — Escrivã

Função:
depoimentos, gravações e consistência de versões.

Jeito:
- atenta a formulação;
- percebe mudança de versão;
- não interpreta nervosismo como culpa;
- compara palavra, horário e repetição.

Exemplo:
> "Isso é mudança, não esquecimento."

Assuntos progressivos:
- comportamento de Lívia;
- comparação Lívia/Caio;
- mudanças de versão.

Diligências:
- separar gravações dos depoimentos.

---

# 4. DESBLOQUEIOS PROGRESSIVOS

Novas conversas aparecem quando surge base factual.

Exemplos:

`painel_alarme`
→ libera conversa com Maurício sobre o painel.

`cao_canil`
→ libera conversa com Maurício sobre Thor.

Lívia entrevistada
→ libera conversa com Denise sobre o primeiro depoimento.

Lívia + Caio entrevistados
→ libera comparação de versões com Denise.

4 depoimentos
→ Renata pode discutir histórico completo do alarme.

`vigia_gol` + `log_alarme`
→ libera conversa com Renata sobre correlação de horário.

`log_alarme`
→ libera conversa com Paulo sobre encontrar registro independente do motel.

`extrato_ricardo`
→ libera conversa sobre origem da cinta.

`cinta_bancaria` + `confissao_teo`
→ libera conversa final com Sônia sobre separar papéis.

---

# 5. DILIGÊNCIAS TAMBÉM DEPENDEM DE CONVERSA

Uma diligência pode exigir:
- fato/pista;
- entrevista;
- fase do caso;
- conversa prévia com o agente.

Exemplo:

Não basta ter ouvido Rafael.

Para aparecer "Buscar comprovante da LAN", Lemos primeiro conversa com Paulo sobre como verificar o álibi.

Isso faz o pedido nascer de uma conversa real, e não de um menu mágico.

---

# 6. INTERFACE

## Lista de equipe

Mostra:
- nome;
- cargo;
- especialidade;
- última mensagem;
- contador de novos assuntos/diligências disponíveis.

O contador não significa "missões".
Ele significa **há algo novo que pode ser discutido ou solicitado**.

## Conversa individual

Ordem:

1. cabeçalho da pessoa;
2. histórico;
3. seção "Conversar sobre o caso";
4. seção "Diligências e materiais", quando houver algo disponível.

Novos assuntos aparecem conforme o caso progride.

Assuntos já discutidos permanecem no histórico, mas somem da lista de opções.

Diligências recebidas continuam registradas.

---

# 7. REGRAS DE ESCRITA

1. Agentes não falam como API.
2. Não responder "Solicitação recebida".
3. Não dizer "material disponível".
4. Não listar metadados como resposta humana.
5. Cada pessoa tem vocabulário próprio.
6. Respostas podem conter dúvida e limite de certeza.
7. Opinião profissional nunca vale automaticamente como prova.
8. Nenhum agente sabe fatos que ainda não descobriu.
9. Nenhum agente resolve o caso para Lemos.
10. Conversas precisam reagir ao estágio atual da investigação.
11. Não repetir o mesmo texto em momentos diferentes.
12. Quando uma evidência contradiz uma fala antiga, a conversa pode mudar de tom.

---

# 8. MODELO DE ASSUNTO

```
id
memberId
label
availabilityCondition
requiresTopics
userLine
agentLine
unlocks (opcional)
```

# 9. MODELO DE DILIGÊNCIA

```
id
memberId
label
kind
description
availabilityCondition
requiresTopics
requestMessage
responseMessage
outputClues
assetPaths (opcional)
```

# 10. FONTE DE VERDADE

O app Equipe deve ser tratado como:

**contatos individuais + conversas progressivas + diligências por especialidade + memória**

Nunca voltar ao modelo:
**Canal / Solicitar material** ou **lista de pedidos genérica**.


# 11. DESCOBERTA PROGRESSIVA DE PESSOAS

O elenco do caso **não fica todo disponível desde o início**.

Existem três estados diferentes:

1. **Descoberta** — o nome entrou no radar da investigação.
2. **Chamada** — Lemos decidiu convocar essa pessoa para depoimento.
3. **Ouvida** — o depoimento foi realizado e ficou registrado.

Descobrir alguém nunca abre automaticamente o interrogatório.

## Fontes de descoberta

Uma pessoa pode ser descoberta por:
- conversa com a equipe;
- diligência;
- documento;
- telefone apreendido;
- depoimento de outra pessoa;
- cruzamento de registros.

## Cadeias

Exemplo — Jorge:

Paulo procura testemunhas da rua  
→ informa a Lemos que localizou **Jorge, vigia da rua**  
→ Jorge aparece em Pessoas como **NOVO CONTATO**  
→ jogador escolhe **CHAMAR**  
→ Jorge fica disponível para depoimento  
→ o que Jorge disser pode abrir novas linhas.

Exemplo — Téo:

Caio é ouvido  
→ pergunta sobre o irmão pode revelar **Téo Duarte**  
→ Téo entra no radar.

Existe também uma rota independente:
linha financeira  
→ Renata cruza a origem do dinheiro  
→ identifica **Téo Duarte** ligado à quantia  
→ Téo entra no radar mesmo se Caio não tiver falado dele.

Isso evita uma única rota obrigatória para descobrir uma pessoa importante.

## Depoimentos revelando nomes

Perguntas de depoimento podem declarar `revealsPeople`.

Quando a resposta é concluída:
- a pessoa citada entra em `discoveredPeople`;
- aparece no app Pessoas;
- ainda não está convocada;
- o jogador decide se quer chamar.

Uma nova pessoa pode, em seu próprio depoimento, revelar outra.

Portanto a mecânica suporta cadeias:

**Pessoa A → cita B → jogador chama B → B cita C → jogador decide chamar C.**

## Regras

- Nome citado casualmente não precisa virar contato investigável.
- Use `revealsPeople` apenas quando houver identidade suficiente e relevância investigativa.
- A equipe deve explicar por que o novo nome interessa.
- Não chamar automaticamente.
- Não marcar automaticamente como suspeito.
- Uma pessoa descoberta pode ser testemunha, familiar, funcionário, proprietário de estabelecimento ou suspeito.
- A interface não deve revelar pessoas ainda desconhecidas.
- Textos, pistas e tarefas não podem mencionar como conhecido um personagem que ainda não foi descoberto.
- Pessoas centrais devem ter, quando possível, mais de uma rota plausível de descoberta para evitar travar o caso.

## Save

`discoveredPeople`: nomes formalmente conhecidos pela investigação.

`summonedPeople`: pessoas que Lemos escolheu chamar.

`interviewed`: pessoas cujo depoimento foi concluído.

## Fonte de verdade

A progressão de pessoas segue:

**descoberta → decisão do jogador → convocação → depoimento → possíveis novas descobertas**.


# 12. ARQUIVOS DE EVIDÊNCIA JÁ PRODUZIDOS

Os materiais visuais associados às diligências já foram produzidos.

Fonte:
`docs/CASE01_EVIDENCE_ASSETS.md`

Manifesto:
`public/evidence/case01/manifest.json`

No código, cada `TeamMaterialRequest` pode carregar `assetPaths`.

Quando o agente retornar uma diligência:
- anexar os arquivos indicados;
- não substituir por texto genérico;
- não criar evidência duplicada;
- manter o material associado ao histórico daquele contato.

Os arquivos são parte da narrativa e devem ser examináveis pelo jogador.
