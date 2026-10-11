/* Assets oficiais da rua americana (direção aprovada em 11/10/2026: docs/DIRECAO_RUA_AMERICANA_DHPP.md).
   Fonte única dos nomes, tamanhos e convenções que os pedidos ao ChatGPT (creative-requests/inbox/2026-10-11-rua-us-*)
   e o jogo usam. Tudo em public/base/rua/. 1 pixel da arte = 1 unidade lógica da rua (metade de um pixel da referência).
   Enquanto um arquivo não chega, o jogo desenha um provisório no mesmo retângulo; quando chega, ele entra sozinho
   (a lista do que existe é feita no build: __RUA_ART__ em vite.config.ts). */

export const RUA_DIR='/base/rua/';

// folha de pessoa: quadros de 26x44, pé no centro da última linha (x=13, y=43), virada para a direita
export const NPC_FRAME={w:26,h:44,footX:13,footY:43};
export const NPC_ROWS={idleLado:0,andarLado:1,andarBaixo:2,andarCima:3,paradoFrente:4,acao:5,gesto:6,distintivo:7};
export const NPC_COUNTS=[4,8,6,6,4,6,4,4];

/* fachadas: largura exata do lote, 330 de altura, pé (calçada) na última linha, transparente acima do telhado.
   As camadas animadas (porta, bandeiras, neon, luz) têm o MESMO tamanho da fachada, transparentes fora da parte que muda. */
export const FACHADAS={
  'dhpp':{w:170},'diner':{w:132},'grocery':{w:136},'pawn-shop':{w:136},'laundry':{w:132},
  'predio-oeste':{w:120},'predio-leste':{w:120},'beco-oeste':{w:58},'beco-leste':{w:58},'esquina-oeste':{w:110},'esquina-leste':{w:110}
};
export const FACHADA_H=330;
export const CAMADAS={ // camadas animadas: nome -> quadros
  'dhpp-porta':4,'dhpp-bandeiras':4,'dhpp-luzes':1,'diner-neon':2,'pawn-shop-neon':2,'laundry-neon':2,'laundry-maquinas':2
};

// carros: vista 3/4 do alto (teto e lateral), virados para a direita, rodas na última linha; folha com os quadros lado a lado
export const VEICULOS={
  'viatura-dhpp':{w:154,h:50,frames:4},   // 0-1 rodando, 2-3 parada com o giroflex alternando
  'taxi':{w:150,h:52,frames:2},
  'sedan-bordo':{w:152,h:46,frames:2},
  'sedan-azul':{w:156,h:46,frames:2},
  'sedan-verde':{w:150,h:46,frames:2},
  'sedan-bege':{w:148,h:46,frames:2},
  'perua-madeira':{w:160,h:48,frames:2},
  'furgao-marrom':{w:142,h:58,frames:2},
  'onibus':{w:300,h:84,frames:2}
};

// mobiliário: pé no centro da última linha
export const PROPS={
  'lixeira':[16,24],'lixeira-cheia':[18,26],'sacos-lixo':[30,18],'cacamba':[46,32],'caixa-papelao':[14,12],'pallet':[24,8],
  'caixa-correio':[16,30],'hidrante':[10,18],'parquimetro':[6,30],'poste-luz':[16,120],'placa-proibido':[12,44],'placa-onibus':[12,46],
  'telefone-publico':[22,46],'jornal-azul':[14,24],'jornal-vermelho':[14,24],'alarme-incendio':[8,38],'banco':[40,16]
};
export const SEMAFORO={w:18,h:96,frames:3}; // verde, amarelo, vermelho
export const PLACAS_RUA=['n-9th-st','w-oak-st']; // placas/placa-<id>.png 44x8

export const CHAO={
  'calcada':[64,50],'meio-fio':[64,6],'asfalto':[128,160],'faixa-branca':[24,3],'faixa-amarela':[64,5],'vaga-dhpp':[180,40],
  'bueiro':[20,8],'boca-de-lobo':[24,6],'faixa-pedestres':[30,160]
};
export const DECALS={'manchas':{w:32,h:12,n:6},'lixo-chao':{w:10,h:6,n:8}};
export const EFEITOS={'vapor-bueiro':{w:24,h:40,n:6},'fumaca-escape':{w:12,h:8,n:4},'pombo':{w:10,h:8,n:8},'poste-luz-brilho':{w:40,h:40,n:1}};

export const PEDESTRES=['executivo','operario','mulher-vestido-vermelho','mulher-loira','jovem-jaqueta','idoso-chapeu','entregador',
  'senhora-carrinho','jaqueta-couro','estudante','corredor','mulher-executiva'];
export const GUARDAS=['guarda-dhpp-a','guarda-dhpp-b'];

/* caminhos: o que o jogo procura em public/base/rua/ */
export const PATH={
  fachada:id=>`fachadas/${id}.png`, camada:(id,i)=>`fachadas/${id}-${i}.png`,
  veiculo:id=>`veiculos/${id}.png`, prop:id=>`props/${id}.png`, semaforo:()=>'props/semaforo.png', placa:id=>`props/placa-${id}.png`,
  chao:id=>`chao/${id}.png`, decal:id=>`chao/${id}.png`, efeito:id=>`efeitos/${id}.png`,
  npc:id=>`npcs/${id}.png`, lemos:()=>'personagens/lemos-rua.png', ceu:()=>'fundo/ceu.png'
};
