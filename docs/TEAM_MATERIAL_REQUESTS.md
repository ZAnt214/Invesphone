# MECÂNICA — SOLICITAÇÃO DE MATERIAIS À EQUIPE

Status: OFICIAL  
Caso atual: Caso 01 — A Casa da Rua das Acácias

## Objetivo

O app **Equipe** não deve funcionar apenas como feed passivo de mensagens.

O jogador, como Lemos, pode solicitar materiais operacionais à equipe conforme novas linhas investigativas forem abertas.

Categorias:

- FOTO
- GRAVAÇÃO
- DOCUMENTO
- PERÍCIA

A mecânica deve reforçar a fantasia de comandar uma investigação remotamente pelo celular.

## Regra central

**Descoberta abre solicitação. Solicitação entrega material. Material abre nova ação.**

Nunca liberar um material sensível antes de haver fundamento narrativo para pedi-lo.

## Fluxo de interface

No app Equipe existem duas abas:

### Canal
Mostra:
- atualizações da equipe;
- consequências das ordens da ligação;
- pedidos feitos por Lemos;
- retorno dos materiais solicitados.

### Solicitar material
Mostra:
- materiais já disponíveis para solicitação;
- materiais ainda bloqueados;
- materiais já recebidos.

Estados:
- SOLICITAR
- AGUARDANDO BASE INVESTIGATIVA
- RECEBIDO

## Materiais do Caso 01

### Fotos completas da cena
Categoria: FOTO

Disponível após o início da varredura.

Entrega:
fotografias da entrada, sala, escritório e quarto do casal.

Não cria prova nova automaticamente; serve como material de consulta e base visual.

### Close do painel do alarme
Categoria: FOTO

Pré-requisito:
`painel_alarme`

Entrega:
fotografias do teclado/visor antes da manipulação.

### Gravações dos depoimentos
Categoria: GRAVAÇÃO

Pré-requisito:
pelo menos um depoimento realizado.

Entrega:
cópias de áudio dos depoimentos já colhidos.

Uso futuro:
comparação de versões, reprodução de trechos, análise de contradição.

### Comprovante da LAN house
Categoria: DOCUMENTO

Pré-requisito:
Rafael já ouvido.

Entrega:
`lan_paga`

Função:
confirmar o álibi de Rafael.

### Log completo do alarme
Categoria: PERÍCIA

Pré-requisito:
pelo menos quatro depoimentos iniciais.

Entrega:
`log_alarme`

Dado canônico:
23:52 — desativação por código mestre.

### Registro de entrada do motel
Categoria: DOCUMENTO

Pré-requisito:
`log_alarme`

Entrega:
`nota_motel`

Dado canônico:
00:56 — entrada registrada.

### Documentos financeiros de Ricardo
Categoria: DOCUMENTO

Disponível quando a linha financeira é aberta.

Entrega:
- `extrato_ricardo`
- `carta_cobranca`

### Análise da cinta bancária
Categoria: PERÍCIA

Pré-requisito:
linha financeira ativa + extrato de Ricardo.

Entrega:
`cinta_bancaria`

Dado canônico:
Banco Meridional · ag. 0431 · 15/10/2002 · US$ 5.000.

## Regras de design

1. O jogador pode pedir materiais opcionais sem medo de quebrar o caso.
2. Materiais obrigatórios nunca podem ficar inacessíveis por uma escolha anterior.
3. Pedidos não devem exigir espera em tempo real.
4. O retorno pode ser apresentado como se alguns minutos tivessem passado dentro da ficção.
5. O canal registra o pedido de Lemos e a resposta da equipe.
6. Se um material entrega uma pista, a pista entra no save quando o retorno é recebido.
7. Materiais visuais reais podem ser adicionados futuramente ao Arquivo sem mudar a lógica desta mecânica.
8. A equipe não deve permitir pedidos absurdos ou incompatíveis com 2002.
9. O jogador não solicita uma “solução”; solicita evidência bruta.
10. Sônia não interpreta automaticamente o material pelo jogador.

## Expansão futura

O sistema deve aceitar novos tipos de solicitação, como:

- foto ampliada de detalhe;
- laudo parcial;
- gravação específica;
- segunda via de documento;
- confronto de assinatura;
- consulta de placa;
- histórico bancário;
- fotografia de objeto apreendido;
- fita de câmera/portaria;
- transcrição;
- comparação pericial;
- retorno de testemunha;
- nova busca na residência.

Cada novo item precisa definir:

```
id
label
kind
description
availabilityCondition
resultMessage
outputClues
assetPaths (opcional)
```

## Relação com o GAME FLOW

A mecânica é transversal aos três atos.

Ato 1:
fotos, painel, gravações e comprovante da LAN.

Ato 2:
log, motel e documentos financeiros.

Ato 3:
análises finais e materiais usados para sustentar o relatório.

O jogador deve sentir que está **pedindo trabalho à equipe**, não abrindo uma loja de pistas.
