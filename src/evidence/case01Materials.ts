export const case01MaterialAssets = {
  fotos_cena:[
    '/evidence/case01/scene/01-entrada.svg',
    '/evidence/case01/scene/02-sala.svg',
    '/evidence/case01/scene/03-escritorio.svg',
    '/evidence/case01/scene/04-corredor.svg',
    '/evidence/case01/scene/05-quarto.svg',
    '/evidence/case01/scene/07-canil.svg'
  ],
  fotos_painel:['/evidence/case01/scene/06-painel-teclado.svg'],
  gravacoes_depoimentos:['/evidence/case01/cartorio/indice-gravacoes.svg'],
  comprovante_lan:['/evidence/case01/docs/lan-house-recibo.svg'],
  log_alarme:['/evidence/case01/docs/log-alarme.svg'],
  registro_motel:['/evidence/case01/docs/motel-cupom.svg'],
  docs_financeiros:[
    '/evidence/case01/docs/extrato-ricardo.svg',
    '/evidence/case01/docs/carta-cobranca.svg',
    '/evidence/case01/docs/agenda-helena.svg'
  ],
  analise_cinta:[
    '/evidence/case01/docs/apreensao-dolares.svg',
    '/evidence/case01/docs/cinta-bancaria.svg',
    '/evidence/case01/docs/analise-cinta.svg'
  ]
} as const

export type Case01MaterialId = keyof typeof case01MaterialAssets
