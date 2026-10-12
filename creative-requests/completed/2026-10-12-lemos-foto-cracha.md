---
id: 2026-10-12-lemos-foto-cracha
status: completed
requested_by: claude
priority: high
character: "Lemos (investigação do DHPP, o personagem do jogador)"
asset_type: id-photo
destination: public/characters/lemos/cracha-foto.png
---

# Pedido: foto 3×4 do crachá do Lemos

## Objetivo
Ao entrar na área restrita do DHPP, o jogador passa o crachá do Lemos na leitora. O crachá aparece grande na tela e hoje a foto é só uma silhueta. Precisamos da foto oficial: a primeira vez que o rosto do Lemos aparece no jogo.

## O que gerar
- **Quantidade:** 1 imagem.
- **Personagem:** Lemos. O visual já existe de costas, em `public/characters/lemos/back.png`. A foto é a mesma pessoa vista de frente: mesmo cabelo escuro e curto com risca de lado, mesma pele morena clara, paletó grafite, camisa clara e gravata vinho.
- **Expressão e pose:** foto de documento. Rosto de frente, olhando para a câmera, ombros retos e expressão neutra e séria, de quem tira a foto do crachá no meio do expediente (um pouco cansado, sem sorriso).
- **Enquadramento:** 3×4 de identidade, da cabeça até o meio do peito. O topo da cabeça fica a uns 8% da borda de cima e o rosto ocupa mais ou menos metade da altura.
- **Fundo:** liso, azul-acinzentado claro, como as fotos de documento da época, com uma leve sombra atrás da cabeça.
- **Estilo:** o mesmo traço do elenco ilustrado e do Lemos de costas (`public/characters/*/portrait.jpg`, `public/characters/lemos/back.png`): ilustração 2D com formas limpas, sombras em recortes simples, poucos tons por material e luz suave de frente, com flash de câmera de documento.
- **Resolução:** 600×800 px (proporção 3:4).
- **Formato:** PNG opaco (o fundo faz parte da foto).

## Consistência obrigatória
- **Mesma pessoa** de `public/characters/lemos/back.png`: cabelo, corte, cor de pele, largura dos ombros e roupa.
- **Mesmo acabamento** dos retratos do elenco (Sônia, Jorge, Caio etc.).
- **Época:** 2002, foto de crachá de órgão público.
- **Sem texto, sem moldura, sem carimbo e sem marca na imagem.** O crachá é montado pelo jogo, com faixa do DHPP, nome, função, matrícula e holograma.
- **Nome:** o Lemos não tem primeiro nome. Nada na imagem deve sugerir um.

## Contexto da cena
É um detalhe pequeno, mas aparece sempre que o jogador entra na área restrita: o crachá é a "identidade" do personagem. A foto deve passar a sensação de um investigador comum, de carne e osso, sem pose de herói.

## Arquivos esperados
- `public/characters/lemos/cracha-foto.png`

## Observações técnicas para integração
- **Tamanho no jogo:** a foto ocupa um quadro de cerca de 46×58 px no crachá, ampliado até 1,7× no celular. Precisa continuar legível bem pequena: rosto com bom contraste e contorno limpo.
- **Recorte:** o jogo enquadra a foto com `object-fit: cover`. Deixar o rosto centralizado na horizontal.
- **Fallback:** enquanto o arquivo não existir, o crachá mostra a silhueta atual. Quando ele chegar, entra sozinho, sem mudar o código.

## Resposta do ChatGPT
Preenchido pelo ChatGPT ao concluir.

- status: completed
- assets criados: `public/characters/lemos/cracha-foto.png` (600×800, PNG RGB opaco).
- observações: Gerado com image_gen usando back.png e os retratos de Jorge e Caio como referências. Foto frontal séria, cabelo escuro com risca, paletó grafite, camisa clara, gravata vinho e fundo azul-acinzentado. Sem texto ou moldura. O carregamento automático já existe em src/base/badgeSwipe.js; nenhuma mudança de lógica necessária.
