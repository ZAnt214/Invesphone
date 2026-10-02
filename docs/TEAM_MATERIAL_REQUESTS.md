# MECÂNICA — EQUIPE OPERACIONAL E SOLICITAÇÕES

Status: OFICIAL  
Caso atual: Caso 01 — A Casa da Rua das Acácias

## Conceito

O app **Equipe** é um diretório de contatos operacionais do caso.

O jogador não entra em um catálogo genérico de pedidos. Ele escolhe **com qual integrante falar** e conversa com essa pessoa em um canal individual.

Cada integrante:
- tem nome;
- função;
- especialidade;
- histórico próprio de mensagens;
- solicitações compatíveis com a sua área;
- respostas próprias.

A fantasia é: **Lemos coordena uma equipe real pelo telefone**.

---

## Integrantes

### Sônia Prado
Cargo: Delegada  
Especialidade: coordenação do caso

Responsável por:
- prioridades;
- direção investigativa;
- decisões;
- orientação;
- autorização e organização da equipe.

Ela não entrega a solução.  
Pode orientar Lemos sobre qual linha merece atenção.

Pedido inicial:
- pedir leitura/orientação da delegada.

### Maurício Farias
Cargo: Perito criminal  
Especialidade: cena e vestígios

Responsável por:
- fotografias da cena;
- close de objetos;
- painel do alarme;
- vestígios;
- coleta;
- laudos e observações técnicas.

Pedidos atuais:
- fotos completas da cena;
- close do painel do alarme.

### Renata Leal
Cargo: Investigadora  
Especialidade: inteligência e registros

Responsável por:
- log do alarme;
- consulta de veículos;
- cruzamento de registros;
- linhas financeiras;
- registros bancários;
- análise da cinta bancária.

Pedidos atuais:
- log completo do alarme;
- documentos financeiros de Ricardo;
- análise da cinta bancária.

### Paulo Vieira
Cargo: Investigador  
Especialidade: diligências de campo

Responsável por:
- localizar testemunhas;
- falar com estabelecimentos;
- buscar comprovantes;
- verificar endereços;
- motel;
- LAN house;
- checagens externas.

Pedidos atuais:
- comprovante da LAN house;
- registro de entrada do motel.

### Denise Rocha
Cargo: Escrivã  
Especialidade: cartório e depoimentos

Responsável por:
- gravações;
- transcrições;
- organização de depoimentos;
- documentação formal;
- cópias de termos.

Pedido atual:
- gravações dos depoimentos.

---

## Interface

Ao abrir **Equipe**:

1. mostrar os integrantes do caso;
2. mostrar cargo e especialidade;
3. mostrar a última mensagem daquela pessoa;
4. indicar quando existe uma nova solicitação possível;
5. ao tocar, abrir conversa individual.

Dentro da conversa:
- histórico daquela pessoa;
- mensagens enviadas por Lemos;
- respostas do integrante;
- seção contextual "O que pedir a [nome]";
- pedidos bloqueados aparecem como indisponíveis até haver base investigativa;
- pedidos recebidos permanecem visíveis como concluídos.

Não existe mais uma aba global "Solicitar material".

---

## Regra central

**A necessidade investigativa determina com quem Lemos fala.**

Exemplos:

- quer foto ou laudo da cena → Maurício;
- quer log do alarme → Renata;
- quer confirmação da LAN house → Paulo;
- quer gravação de depoimento → Denise;
- quer definir prioridade → Sônia.

O jogador aprende naturalmente a função de cada integrante e passa a saber quem procurar.

---

## Progressão

Pedidos continuam obedecendo a requisitos narrativos.

Exemplos:

- painel encontrado → Maurício pode fornecer close do painel;
- Rafael ouvido → Paulo pode verificar a LAN;
- primeiras versões colhidas → Renata pode puxar o log;
- log recebido → Paulo pode verificar o motel;
- linha financeira aberta → Renata pode buscar documentos;
- extrato cruzado → Renata pode analisar a cinta.

Nenhum integrante deve oferecer uma prova que Lemos ainda não tem motivo para procurar.

---

## Regras

1. Não criar catálogo central de provas.
2. Não permitir que qualquer pessoa faça qualquer coisa.
3. Toda solicitação tem um responsável claro.
4. Conversas devem parecer humanas, não retorno de API.
5. O integrante pode dizer que algo não está disponível ainda.
6. Não exigir espera real.
7. A resposta pode simular passagem de minutos dentro da ficção.
8. Material recebido pode registrar pista no save.
9. Sônia orienta, mas não resolve deduções.
10. Especialidades devem respeitar a polícia e a tecnologia de 2002.

---

## Modelo de solicitação futura

```
id
memberId
label
kind
description
availabilityCondition
requestMessage
responseMessage
outputClues
assetPaths (opcional)
```

## Fonte de verdade

Esta mecânica substitui o modelo antigo "Canal / Solicitar material".

O app Equipe deve ser tratado como **contatos + conversas individuais + solicitações por especialidade**.
