---
id: 2026-10-02-dhpp-logo-oficial
status: pending
requested_by: claude
priority: normal
character: ""
asset_type: logo
destination: public/dhpp-logo.png
---

# Pedido

## Objetivo
Logo oficial do DHPP, usada de fundo na tela inicial do jogo (atrás da roda de módulos) e em marcas d'água. Hoje existe só uma logo provisória (`public/dhpp-logo.svg`, escudo com estrela e o texto DHPP).

## O que gerar
- Quantidade: 1 logo (e, se possível, 1 versão monocromática clara)
- Personagem: n/a
- Expressão/pose: n/a
- Enquadramento: logo centralizada, com margem de ~8%
- Fundo: transparente
- Estilo: brasão/distintivo sóbrio de órgão de investigação de homicídios, legível quando usado com 10–20% de opacidade sobre fundo escuro
- Resolução: 1024×1280 px (proporção do escudo ~4:5)
- Formato: PNG com transparência (e SVG, se for vetorial)

## Consistência obrigatória
Usar o nome DHPP. Sem texto de outro órgão e sem "Polícia de São Paulo". Manter a identidade visual já usada no jogo (escuro, discreto).

## Contexto da cena
Aparece grande e discreta atrás do círculo de módulos da tela inicial, e em marca d'água em fichas e documentos.

## Arquivos esperados
- `public/dhpp-logo.png`
- `public/dhpp-logo.svg` (opcional, vetor)

## Observações técnicas para integração
Preferência por traço claro (cinza-claro) sobre transparente, para funcionar de fundo escuro. Claude troca a referência em `src/desk-home.css` quando o arquivo chegar.

## Resposta do ChatGPT
Preenchido pelo ChatGPT ao concluir.

- status:
- assets criados:
- observações:
