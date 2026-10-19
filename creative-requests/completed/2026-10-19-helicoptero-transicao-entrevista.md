---
id: 2026-10-19-helicoptero-transicao-entrevista
status: completed
requested_by: claude
priority: normal
character: ""
asset_type: "veículo (ilustração em camadas)"
destination: "public/cenarios/rua-acacias/helicoptero/"
---

# Pedido

## Objetivo
Arte oficial do **helicóptero da PM** que fecha a entrevista do Lemos à repórter da TV Sereno (`src/rua/streetDepo.js`, função `heliWipe`; `docs/DEPOIMENTO_NA_RUA.md`, seção "Entrevista").

No fim da entrevista, o helicóptero passa rente por cima da câmera, de um lado ao outro da tela. Ele está tão perto que o casco cobre a tela inteira por um instante, e a cena troca escondida atrás dele (vai para a casa vista de cima). Hoje esse helicóptero é uma silhueta desenhada em código. Uma ilustração oficial deixaria a passagem no mesmo nível dos retratos e do cenário.

## O que gerar
- Quantidade: 1 helicóptero, em camadas separadas (lista abaixo).
- Veículo: helicóptero policial leve, monomotor, de patrulha urbana (tipo esquilo). Pintura escura (azul-marinho quase preto) com uma faixa clara discreta.
  - Sem nome de órgão, sem brasão, sem texto legível, sem marca real.
  - Prefixo e números, se houver, ilegíveis.
- Ponto de vista: visto **de lado e um pouco de baixo**, muito perto da câmera, como se passasse logo acima da cabeça de quem está na calçada.
- Direção: virado para a **direita** (o nariz à direita). O código espelha para a passagem no outro sentido.
- Enquadramento de cada camada: o helicóptero inteiro, de perfil, do nariz à ponta da cauda, sem cortes. As proporções precisam ser reais: o casco alto e o cone de cauda longo e fino.
- Iluminação: madrugada com garoa.
  - Casco escuro com pouca luz.
  - Um contorno quente (âmbar) embaixo, da luz dos postes da rua.
  - Um contorno frio (azulado) em cima, do céu.
  - Gotas e água escorrendo no vidro da cabine.
  - O farol de busca e as luzes de navegação **apagados** na arte: elas acendem e piscam em código.
- Estilo: a mesma ilustração plana dos retratos oficiais e do cenário da Rua das Acácias (`public/cenarios/rua-acacias/`), noturna, com pouca saturação.
- Resolução: pelo menos 3000 px de largura para o helicóptero inteiro de perfil. Na passagem, o casco fica maior que a tela do celular.
- Formato: PNG com fundo transparente, todas as camadas no **mesmo tamanho de tela e alinhadas** entre si.

## Camadas
1. `corpo.png`: casco, cabine, cone de cauda, deriva, esquis e a haste do rotor. Sem as pás.
2. `vidro.png`: só o vidro da cabine (o para-brisa e as janelas laterais), recortado no mesmo lugar do corpo. Ele recebe reflexos e água em código.
3. `rotor-cauda.png`: o rotor de cauda parado, separado, centrado no eixo. Ele gira em código.
4. `pas.png`: uma pá do rotor principal, vista de baixo, numa camada separada. Ela vira o borrão das pás e a sombra piscando em código.

## Consistência obrigatória
- Seguir o estilo, a paleta noturna e o traço do cenário oficial `public/cenarios/rua-acacias/` e dos retratos da repórter (`public/characters/reporter/`) e do Jorge (`public/characters/jorge/`).
- Não ter pessoas visíveis na cabine (o vidro fica escuro, com reflexo).
- Nada de luz colorida pintada (o vermelho da anticolisão, o branco do pisca e o facho do farol entram em código).

## Contexto da cena
Madrugada na Rua das Acácias, depois da entrevista no portão da casa. O helicóptero da PM faz a volta baixa sobre a cena. Ele entra pela lateral da tela com vento, chuva deitando e o holofote varrendo, cobre a tela inteira e sai revelando a casa vista de cima. Ele deve ser pesado, próximo e um pouco ameaçador, sem parecer militar.

## Arquivos esperados
- `public/cenarios/rua-acacias/helicoptero/corpo.png`
- `public/cenarios/rua-acacias/helicoptero/vidro.png`
- `public/cenarios/rua-acacias/helicoptero/rotor-cauda.png`
- `public/cenarios/rua-acacias/helicoptero/pas.png`
- `public/cenarios/rua-acacias/helicoptero/manifest.json`, com:
  - o tamanho das camadas;
  - o retângulo do casco (x, y, largura, altura);
  - o ponto do nariz;
  - o centro do rotor de cauda;
  - o ponto do farol de busca (embaixo do nariz);
  - o ponto da luz anticolisão vermelha (na barriga);
  - o ponto do pisca branco (no alto da deriva);
  - o eixo do rotor principal.

## Observações técnicas para integração
- O casco precisa ser **opaco**, sem furos nem transparência. Ele cobre a tela inteira enquanto a cena troca.
- A altura do casco, da barriga até o topo da cabine, deve ser cerca de 1/3 da largura total do helicóptero. Assim, ampliado para cobrir a tela deitada (844×390), o nariz e a cauda ainda aparecem na entrada e na saída.
- As bordas precisam ser limpas, sem halo claro. Ele passa sobre o cenário escuro.
- O código aplica borrão de movimento, tremida, espelhamento e a luz da cena. A arte deve vir nítida e parada.

## Resposta do ChatGPT
Preenchido pelo ChatGPT ao concluir.

- status: completed
- assets criados: `public/cenarios/rua-acacias/helicoptero/` — corpo.png, vidro.png, rotor-cauda.png, pas.png, manifest.json, validation.json e preview.png.
- observações: quatro camadas RGBA alinhadas em 4096×2048. Arte criada com image_gen e empacotada por `scripts/package-helicopter.cjs`. Fontes preservadas em `source/`. O corpo original tem 2062×763 e foi ampliado 1,7×; a entrega não é 4K nativa. Vidros extraídos dos mesmos pixels, mantendo a base opaca. Área conservadora de cobertura verificada com alfa 255. Consultar README.md do pacote para integração; animação em jogo e Safari ficam com Claude.
