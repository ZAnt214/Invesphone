export type Clue = {
  id: string
  title: string
  description: string
  category: 'local'|'depoimento'|'documento'|'digital'|'financeiro'
}

export type Person = {
  id: string
  name: string
  role: string
  initials: string
  photo?: string
}

export const disclaimer = 'Caso ficcional livremente inspirado em um crime real ocorrido em São Paulo em 2002. Nomes, lugares e detalhes foram alterados. Qualquer semelhança com pessoas reais é mera coincidência.'

export const people: Person[] = [
  { id:'sonia', name:'Sônia Prado', role:'Delegada · DHPP', initials:'SP', photo:'sonia.jpg' },
  { id:'livia', name:'Lívia Valença', role:'Filha do casal · 19 anos', initials:'LV' },
  { id:'caio', name:'Caio Duarte', role:'Namorado de Lívia · 21 anos', initials:'CD' },
  { id:'teo', name:'Téo Duarte', role:'Irmão de Caio', initials:'TD' },
  { id:'rafael', name:'Rafael Valença', role:'Filho do casal', initials:'RV' },
  { id:'cida', name:'Cida', role:'Funcionária da família', initials:'CI' },
  { id:'jorge', name:'Jorge', role:'Vigia da rua', initials:'JO' },
]

export const clues: Clue[] = [
  {id:'porta_intacta',title:'Porta intacta',description:'Sem sinais claros de arrombamento na entrada principal.',category:'local'},
  {id:'painel_alarme',title:'Painel do alarme',description:'Sistema doméstico com uso recente do código mestre.',category:'digital'},
  {id:'cao_canil',title:'Thor estava preso',description:'O cão da família foi colocado no canil antes da ocorrência.',category:'local'},
  {id:'escritorio_revirado',title:'Escritório revirado',description:'Gavetas abertas e papéis espalhados como em uma busca apressada.',category:'local'},
  {id:'valores_intactos',title:'Valores intactos',description:'Relógio, joias e eletrônicos de valor permaneceram na casa.',category:'local'},
  {id:'quarto_livia',title:'Quarto de Lívia',description:'Quarto preservado apesar da bagunça em outras áreas da residência.',category:'local'},
  {id:'vitimas_dormindo',title:'Ataque durante o sono',description:'A posição das vítimas sugere que foram surpreendidas no quarto.',category:'local'},
  {id:'agenda_helena',title:'Agenda de Helena',description:'Anotações mostram tensão crescente sobre o namoro de Lívia.',category:'documento'},
  {id:'extrato_ricardo',title:'Extrato de Ricardo',description:'Movimentação financeira recente chama atenção da equipe.',category:'financeiro'},
  {id:'carta_cobranca',title:'Carta de cobrança',description:'Documento encontrado entre os papéis de Ricardo.',category:'documento'},
  {id:'lan_paga',title:'LAN house paga',description:'Registro confirma a presença de Rafael fora de casa no horário relevante.',category:'documento'},
  {id:'brigas_namoro',title:'Brigas pelo namoro',description:'Relatos confirmam conflito familiar envolvendo Lívia e Caio.',category:'depoimento'},
  {id:'alibi_cida',title:'Álibi de Cida',description:'Cida estava com familiares e foi confirmada por terceiros.',category:'depoimento'},
  {id:'pergunta_inventario',title:'Pergunta sobre inventário',description:'Lívia havia feito perguntas sobre herança antes das mortes.',category:'depoimento'},
  {id:'vigia_gol',title:'Gol visto na rua',description:'Jorge viu o Gol de Caio próximo à casa antes do horário declarado.',category:'depoimento'},
  {id:'livia_codigo',title:'Lívia conhece o código',description:'Lívia admite que sabia o código do alarme, além dos pais.',category:'depoimento'},
  {id:'inconsistencia_caio_codigo',title:'Caio e o código',description:'Lívia nega ter passado o código a Caio, mas diz que ele a viu digitando.',category:'depoimento'},
  {id:'livia_chave',title:'Lívia tem a chave',description:'A porta não foi forçada e Lívia tem chave, mas insiste que não estava lá quando foi aberta.',category:'depoimento'},
  {id:'caio_viu_digitando',title:'Caio viu o código',description:'Lívia admite que Caio a viu digitando o código do alarme.',category:'depoimento'},
  {id:'ameaca_heranca',title:'Ameaça da herança',description:'O pai ameaçou cortar a parte de Lívia na herança se ela continuasse com Caio.',category:'depoimento'},
  {id:'log_alarme',title:'Log do alarme',description:'23:52 — sistema desativado com o código mestre.',category:'digital'},
  {id:'nota_motel',title:'Nota do motel',description:'Entrada registrada às 00:56, incompatível com parte do álibi.',category:'documento'},
  {id:'moto_dolares',title:'Moto e dólares',description:'Investigação conecta dinheiro em espécie a Téo.',category:'financeiro'},
  {id:'cinta_bancaria',title:'Cinta bancária',description:'Banco Meridional · ag. 0431 · 15/10/2002 · US$ 5.000.',category:'financeiro'},
  {id:'confissao_teo',title:'Confissão de Téo',description:'Téo admite participação e descreve a entrada facilitada na casa.',category:'depoimento'},
]

export const chapters = [
  {number:1,title:'O Silêncio da Casa',summary:'A cena não se comporta como um roubo comum.'},
  {number:2,title:'Versões',summary:'Depoimentos começam a se contradizer.'},
  {number:3,title:'A Janela',summary:'Horários documentados quebram o álibi.'},
  {number:4,title:'Siga o Dinheiro',summary:'A trilha financeira aproxima a investigação de Téo.'},
  {number:5,title:'A Última Versão',summary:'As peças apontam papéis diferentes no mesmo crime.'},
]

export const teamMessages = [
  {time:'04:31',from:'Sônia',text:'Casa isolada. Quero primeiro o que não combina com roubo.'},
  {time:'04:36',from:'Em Campo',text:'Porta principal sem dano aparente. O cachorro estava preso no canil.'},
  {time:'04:42',from:'Perícia',text:'Objetos de valor continuam na residência. O cenário parece seletivo.'},
  {time:'05:18',from:'Inteligência',text:'Log do alarme solicitado. Também estamos checando o Gol de Caio.'},
]

export const victimMessages = [
  {contact:'Rafael',time:'Ontem · 22:14',incoming:'mãe, vou ficar mais um pouco na lan',outgoing:'Não demore. Seu pai já está dormindo.'},
  {contact:'Lívia',time:'Ontem · 18:42',incoming:'mãe podemos conversar quando eu voltar?',outgoing:'Amanhã. Hoje não.'},
]

export const acceptedProofs = ['log_alarme','nota_motel','cinta_bancaria','confissao_teo','agenda_helena','valores_intactos']
