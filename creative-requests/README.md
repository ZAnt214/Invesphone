# Fila de pedidos criativos — Claude → ChatGPT

Esta pasta é o canal oficial para Claude pedir assets visuais ao ChatGPT sem o usuário precisar copiar e colar cada solicitação.

## Fluxo

1. Claude identifica que precisa de um asset visual novo ou de uma variação de personagem.
2. Claude cria **um arquivo Markdown por pedido** dentro de `creative-requests/inbox/`.
3. O pedido deve seguir `creative-requests/TEMPLATE.md`.
4. O ChatGPT consulta os pedidos pendentes, produz os assets e adiciona os arquivos ao destino indicado.
5. Ao concluir, o ChatGPT atualiza o pedido para `status: completed`, informa os caminhos dos assets e move o arquivo para `creative-requests/completed/`.
6. Claude passa a consumir os arquivos gerados diretamente do repositório.

## Responsabilidades

- **Claude** pede o que a lógica/interface precisa e informa formato, estados, enquadramento e destino técnico.
- **ChatGPT** cria o material visual e mantém a identidade dos personagens.
- Claude não deve redesenhar personagens oficiais por conta própria quando puder abrir um pedido aqui.

## Regra para o ChatGPT

Ao trabalhar no Invesphone e houver uma tarefa visual/asset relacionada ao projeto, verificar primeiro `creative-requests/inbox/` e executar os pedidos com `status: pending` que forem pertinentes ao contexto atual.

Isso não é um processo em background: a fila é processada quando o ChatGPT estiver trabalhando no projeto.

## Regra para Claude

Não escrever pedidos vagos como “preciso de mais expressões”. Informar exatamente:
- personagem;
- uso no jogo;
- expressão/pose/estado;
- formato;
- resolução desejada;
- enquadramento;
- consistência exigida;
- nome/caminho de destino;
- quantidade de arquivos.
