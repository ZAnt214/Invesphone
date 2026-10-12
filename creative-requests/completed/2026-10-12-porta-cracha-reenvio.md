---
id: 2026-10-12-porta-cracha-reenvio
status: cancelled
requested_by: claude
priority: high
character: "Porta de acesso do DHPP (close da leitora de crachá)"
asset_type: redelivery
destination: public/base/acesso/
---

# Pedido: reenviar o `fundo.png` do close da porta e alinhar a `porta-aberta.png`

## O que aconteceu
A entrega da revisão 4 (`2026-10-13-porta-cracha-close`) ficou muito boa: o estilo é o certo e a mão e o crachá já estão no jogo. Só dois problemas:

1. **`public/base/acesso/fundo.png` chegou corrompido.**
   - O arquivo tem o tamanho certo (786 444 bytes, 1600×740), mas a partir do byte 393 474 o conteúdo está trocado: os cabeçalhos dos blocos IDAT somem e o CRC do 12º bloco falha.
   - Só as primeiras **314 linhas** decodificam; a metade de baixo (o resto da porta, a fenda e o rodapé) se perdeu.
   - Provavelmente o arquivo foi gravado ou enviado em modo texto, ou montado a partir de duas cópias. Até o reenvio, o jogo usa `fundo-provisorio.png`: o topo oficial com a parte de baixo completada no código.
2. **`porta-aberta.png` não encaixa no `fundo.png`.**
   - A porta aberta tem outro batente, em outra posição e escala: o batente direito fica em x≈515–590, contra x≈580–660 no fundo, e a trava aparece em outro lugar.
   - Trocar uma pela outra faz a porta "pular". Por isso o jogo ainda não usa a porta aberta: o close fecha e a porta se abre na planta.

## O que gerar
- **`public/base/acesso/fundo.png`:** o **mesmo** fundo da revisão 4, inteiro, em 1600×740 e RGB. Se a imagem original não existir mais, gerar de novo mantendo as coordenadas do `manifest.json`: fenda em x 848, y 301, 19×146; visor, plaquinha, LEDs e porta nos mesmos lugares.
- **`public/base/acesso/porta-aberta.png`:** a mesma porta do `fundo.png`, com o **mesmo batente, a mesma trava e a mesma posição**. Só a folha de vidro gira para dentro, deixando o vão escuro. Tamanho 634×696, encaixado em (27, 0) como diz o `manifest.json`. Transparente onde a imagem deve deixar ver o fundo.

## Consistência
- Mesmo traço da revisão 4 (Lemos de costas do quadro): sem texto na arte, DHPP, 2002.
- Não alterar `mao-cracha.png` nem `cracha.png`: estão integrados e funcionando.

## Verificação antes de commitar (importante)
Abrir cada PNG e decodificar até o fim:

```
python3 -c "from PIL import Image; im=Image.open('public/base/acesso/fundo.png'); im.load(); print(im.size, im.mode)"
```

Também conferir que a imagem salva no repositório é idêntica byte a byte à gerada (mesmo `sha256sum`). Arquivos binários precisam ser enviados como binário.

## Integração (Claude)
- O jogo já procura `fundo.png` primeiro e só usa o provisório se o oficial não decodificar inteiro. Com o arquivo bom, ele entra sozinho; depois disso o provisório pode ser apagado.
- Com a porta aberta alinhada, o close passa a mostrar a porta se abrindo antes de fechar.

## Cancelado
O usuário trocou o close ilustrado por uma leitora no estilo do rádio da varredura, desenhada em código (`src/base/badgeSwipe.js`). Não é preciso reenviar nada.

## Resposta do ChatGPT
Preenchido pelo ChatGPT ao concluir.

- status:
- assets criados:
- observações:
