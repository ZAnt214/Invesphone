---
id: 2026-10-11-rua-us-02-fachada-dhpp
status: pending
requested_by: claude
priority: high
character: ""
asset_type: environment pixel art (fachada + camadas animadas)
destination: public/base/rua/fachadas/
---

# Pedido 02 — Fachada do DHPP (centro da rua) e camadas animadas

## Objetivo
A fachada do DHPP no centro do quarteirão, como na referência aprovada. É por ela que o Lemos entra na base (tocar na porta leva o Lemos até a escadaria e ele entra).

## O que gerar
- `dhpp.png` — **170×330**, pé na calçada na última linha, transparente acima do telhado.
  - Térreo e 1º andar: pórtico de pedra clara com colunas, arco central com o **escudo do DHPP** (genérico, sem copiar brasão real), placa escura escrita **DHPP**, porta dupla de madeira escura com vidros (44×64, base no topo da escadaria), duas luminárias de parede acesas, placa com o número **87** na coluna direita.
  - Escadaria de pedra **recuada no pórtico** (5 degraus, corrimãos de ferro), o último degrau rente à calçada.
  - Dois mastros curtos inclinados para fora nas colunas, com bandeiras dos **EUA** (desenhar o mastro; o pano vem na camada animada).
  - Andares de cima em tijolo vermelho com janelas de verga de pedra, alinhadas e simétricas; cornija no alto.
  - Profundidade: o pórtico avança sobre a parede (sombra à direita e embaixo), a porta fica funda, os degraus mostram piso e espelho.
- Camadas animadas, **mesmo tamanho 170×330**, transparentes fora da parte que muda:
  - `dhpp-porta-0.png` … `dhpp-porta-3.png` — porta abrindo (0 fechada, 3 aberta, interior iluminado).
  - `dhpp-bandeiras-0.png` … `dhpp-bandeiras-3.png` — os dois panos tremulando (ciclo de 4 quadros).
  - `dhpp-luzes-0.png` — brilho quente das luminárias (halo suave em pixel art, para sobrepor).
- Fundo: transparente. Estilo: pixel art fiel à referência. Formato: PNG RGBA, alfa binário (exceto o halo das luzes, que pode ter alfa parcial).

## Consistência obrigatória
- Referência: `creative-requests/refs/2026-10-11-rua-americana-dhpp/referencia-aprovada.png` (o prédio central).
- Escala e regras: `docs/RUA_AMERICANA_ESPEC.md` e o guia do pedido 01.
- **DHPP** é o nome do órgão; nada de NYPD, Polícia Civil ou outro brasão real. Sem referências brasileiras.
- Simetria de composição (colunas, janelas e mastros espelhados), sem duplicar mecanicamente todos os detalhes.

## Contexto da cena
Centro da tela no começo do jogo. Dois policiais do DHPP ficam parados no alto da escadaria, um de cada lado da porta (são pessoas separadas, pedido 10 — não desenhar na fachada). A viatura fica parada na vaga hachurada em frente.

## Arquivos esperados
- `public/base/rua/fachadas/dhpp.png`
- `public/base/rua/fachadas/dhpp-porta-0.png` … `dhpp-porta-3.png`
- `public/base/rua/fachadas/dhpp-bandeiras-0.png` … `dhpp-bandeiras-3.png`
- `public/base/rua/fachadas/dhpp-luzes-0.png`

## Observações técnicas para integração
- O jogo desenha a fachada com o pé em y=0 da calçada, de x=556 a x=726 (centro x=641).
- Centro da porta em x=85 da imagem; topo do último degrau (onde os policiais pisam) a 22 px acima do pé da imagem.
- O toque em qualquer ponto do prédio leva o Lemos até o pé da escadaria (x=85).

## Resposta do ChatGPT
- status:
- assets criados:
- observações:
