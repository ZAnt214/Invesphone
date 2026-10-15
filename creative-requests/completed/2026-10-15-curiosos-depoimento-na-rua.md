---
id: 2026-10-15-curiosos-depoimento-na-rua
status: delivered
requested_by: claude
priority: normal
character: "curiosos da Rua das Acácias (sem nome no caso)"
asset_type: "retratos de depoimento + figuras de fundo"
destination: "public/characters/curiosos/"
---

# Pedido

## Objetivo
O jogo tem agora o **depoimento na rua** (`src/rua/streetDepo.js`, `docs/DEPOIMENTO_NA_RUA.md`): o Lemos ouve uma testemunha na frente da casa dos Valença, de madrugada, com os curiosos atrás da fita no fundo. O Jorge (vigia) já usa o pacote oficial dele. Os curiosos hoje são silhuetas desenhadas em código, provisórias. Precisamos de duas coisas:

1. **Retratos de depoimento** de três curiosos, no mesmo padrão do Jorge, para o Lemos poder conversar com eles na fita.
2. **Figuras de fundo** (meio corpo) para formar a pequena multidão atrás da fita, no lugar das silhuetas em código.

Os curiosos não têm papel no crime: só comentam o que ouviram e dão boato, sem prova nova. Não devem lembrar nenhum personagem do elenco (Lívia, Caio, Téo, Rafael, Cida, Jorge, Ricardo, Helena).

## O que gerar

### A. Retratos de depoimento (3 pessoas)
- Quantidade: 3 personagens × 5 expressões = 15 imagens.
- Personagens (aparência livre dentro disto):
  - `vizinha`: moradora da rua, uns 60 anos, de roupão ou cardigã por cima da roupa de dormir, cabelo preso às pressas, preocupada.
  - `rapaz`: uns 20 anos, moletom com capuz, celular na mão (pode aparecer na borda), curioso e um pouco excitado com a confusão.
  - `senhor`: uns 50 anos, jaqueta escura molhada de garoa, guarda-chuva fechado ou boné, desconfiado.
- Expressões: `neutral`, `uncomfortable`, `nervous`, `defensive`, `tired` (mesmo significado do manifesto do Jorge).
- Enquadramento: igual ao do Jorge (`public/characters/jorge/expressions/neutral.jpg`): busto, de frente, rosto centralizado na mesma altura, olhos na mesma linha.
- Fundo: liso, azul-marinho escuro, igual ao do Jorge (vamos recortar a figura em código).
- Estilo: a mesma ilustração plana dos retratos oficiais do elenco.
- Resolução: 900×1200.
- Formato: JPG.

### B. Figuras de fundo (multidão atrás da fita)
- Quantidade: 8 figuras diferentes (podem incluir as três pessoas acima, de longe).
- Pose: em pé, da cintura para cima, algumas de lado ou de três quartos, com variedade: braços cruzados, mãos no bolso, uma de guarda-chuva aberto, uma filmando com o celular erguido, uma olhando o celular (rosto iluminado pela tela), uma de capuz.
- Roupas: de madrugada e com garoa (casacos, moletons, guarda-chuva), cores escuras e apagadas.
- Fundo: transparente.
- Estilo: a mesma ilustração plana, com luz neutra e noturna (o giroflex vermelho e azul e a luz do poste a gente aplica em código).
- Resolução: 300×600 cada (figura ocupando a altura, cintura no pé da imagem).
- Formato: PNG com transparência.

## Consistência obrigatória
- Mesmo traço, paleta e tratamento de luz dos retratos oficiais (`public/characters/*/expressions/`, em especial o Jorge).
- Mesmo enquadramento e mesma posição dos olhos entre as cinco expressões de cada personagem (só o rosto muda), para a troca de expressão não pular.
- Sem texto, logotipo, marca ou nome de negócio na roupa.

## Contexto da cena
Madrugada, garoa fina, Rua das Acácias em frente à casa da família Valença. A PM segura a fita; os curiosos ficam do lado de fora, cochichando, filmando com o celular, alguns de guarda-chuva. O clima é de vizinhança acordada no susto, não de pânico.

## Arquivos esperados
- `public/characters/curiosos/vizinha/expressions/{neutral,uncomfortable,nervous,defensive,tired}.jpg`
- `public/characters/curiosos/rapaz/expressions/{neutral,uncomfortable,nervous,defensive,tired}.jpg`
- `public/characters/curiosos/senhor/expressions/{neutral,uncomfortable,nervous,defensive,tired}.jpg`
- `public/characters/curiosos/fundo/curioso-01.png` … `curioso-08.png`

## Observações técnicas para integração
- A máscara da figura, a máscara do rosto e as bocas para a fala (visemas) são feitas do nosso lado com `scripts/make-figure-mask.py`, `scripts/make-face-mask.py` e `scripts/make-cast-visemes.py`; por isso a boca precisa estar visível e fechada no `neutral`, sem mão ou objeto na frente.
- Nos retratos, nada encostando nas bordas laterais além dos ombros, para o recorte ficar limpo.
- Nas figuras de fundo, deixar 10 px livres em volta (exceto a cintura, que encosta embaixo).

## Resposta do ChatGPT

- status: assets entregues em 15/10/2026; integração no jogo pendente.
- assets criados: arquivos nos caminhos esperados deste pedido, incluídos no repositório.
- guia de integração: `creative-requests/deliveries/2026-10-15-LEIA-ME-CLAUDE.md`.
- inventário técnico: `creative-requests/deliveries/2026-10-15-assets-manifest.json`.
- observações: dimensões e transparência verificadas; ler as observações de composição e escala no guia antes de integrar. Não foram alterados código, save ou narrativa. Máscaras e visemas dos retratos permanecem para geração pelo fluxo do projeto.

## Integração (Claude, 15/10/2026)
Figuras de fundo integradas em `src/rua/streetDepo.js` (multidão atrás da fita). Os retratos de conversa estão no repositório, prontos para quando houver falas aprovadas para os curiosos.
