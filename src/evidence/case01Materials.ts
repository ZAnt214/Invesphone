export const case01MaterialAssets = {
  fotos_cena:[
    '/evidence/case01/new/comodos/comodo_01_entrada.jpg',
    '/evidence/case01/new/comodos/comodo_02_sala.jpg',
    '/evidence/case01/new/comodos/comodo_03_cozinha.jpg',
    '/evidence/case01/new/comodos/comodo_04_escritorio.jpg',
    '/evidence/case01/new/comodos/comodo_05_corredor.jpg',
    '/evidence/case01/new/comodos/comodo_06_quarto_casal.jpg',
    '/evidence/case01/new/comodos/comodo_07_quarto_livia.jpg',
    '/evidence/case01/new/comodos/comodo_08_canil.jpg'
  ],
  fotos_painel:['/evidence/case01/new/comodos/comodo_09_painel_alarme.jpg'],
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
  ],
  croqui_residencia:['/evidence/case01/new/croqui_residencia.jpg'],
  fechadura_porta:['/evidence/case01/new/fechadura_porta.jpg'],
  trava_canil:['/evidence/case01/new/trava_canil.jpg'],
  escritorio_comparativo:['/evidence/case01/new/escritorio_comparativo.jpg'],
  laudo_preliminar_local:['/evidence/case01/new/laudo_preliminar_local.jpg'],
  ficha_veiculo_gol:['/evidence/case01/new/ficha_veiculo_gol.jpg'],
  quadro_horarios:['/evidence/case01/new/quadro_horarios.jpg'],
  matricula_imovel:['/evidence/case01/new/matricula_imovel.jpg'],
  consulta_antecedentes:['/evidence/case01/new/consulta_antecedentes.jpg'],
  croqui_rua:['/evidence/case01/new/croqui_rua.jpg'],
  termo_declaracao_terceiro_cida:['/evidence/case01/new/termo_declaracao_terceiro_cida.jpg'],
  foto_fachada_lan:['/evidence/case01/new/foto_fachada_lan.jpg'],
  termo_apreensao_celular_helena:['/evidence/case01/new/termo_apreensao_celular_helena.jpg'],
  capa_inquerito:['/evidence/case01/new/capa_inquerito.jpg'],
  termo_depoimento_modelo:['/evidence/case01/new/termo_depoimento_modelo.jpg']
} as const

export type Case01MaterialId = keyof typeof case01MaterialAssets
