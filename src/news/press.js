/* O que o Lemos diz à imprensa (docs/JORNAL_SERENO.md).
   A cena da entrevista é outra etapa; aqui ficam as falas possíveis em cada momento e a gravação no save do caso
   (`press: {e1:'cedo', ...}`). A edição do Jornal Sereno daquele momento publica o que estiver gravado. */
import { readCase, writeCase } from '../case/caseSave';

/** Momentos em que a imprensa pergunta. A chave é a edição que publica a resposta. */
export const PRESS={
  e1:{where:'no portão da casa',q:'Doutor! Foi assalto? O que aconteceu lá dentro?',opts:[
    {id:'cedo',tag:'Cauteloso',say:'Ainda é cedo. Ninguém vai especular agora.'},
    {id:'aberto',tag:'Deixa a dúvida no ar',say:'Não descartamos nenhuma hipótese. Nem roubo, nem outra coisa.'},
    {id:'apelo',tag:'Pede testemunhas',say:'Quem passou pela Rua das Acácias esta noite e viu alguma coisa, procure o DHPP.'},
    {id:'vaza',tag:'Revela uma pista',leak:true,need:F=>F.arromb,say:'Não houve arrombamento. Quem entrou não precisou forçar nada.'},
    {id:'ausente',tag:'Não atender',say:null}]},
  e2:{where:'na saída do DHPP',q:'A filha é suspeita? Ela vai ser ouvida de novo?',opts:[
    {id:'test',tag:'Protege a testemunha',say:'Ela é testemunha, como todo mundo que conhecia a família.'},
    {id:'ninguem',tag:'Põe pressão',say:'Ninguém está descartado. Ninguém.'},
    {id:'nada',tag:'Sem comentários',say:'O depoimento é sigiloso. Sem comentários.'}]},
  e4:{where:'na porta do DHPP',q:'É verdade que sumiu dinheiro da casa? Quanto era?',opts:[
    {id:'segue',tag:'Confirma a linha',say:'Estamos seguindo o dinheiro. É tudo o que posso dizer.'},
    {id:'valor',tag:'Revela uma pista',leak:true,say:'Eram cinco mil dólares, sacados dias antes.'},
    {id:'nada',tag:'Sem comentários',say:'Não comento valores.'}]}
};

export const pressOpt=(moment,id)=>{const P=PRESS[moment];return P&&id?P.opts.find(o=>o.id===id)||null:null;};

/** Grava o que o Lemos disse em `moment`. `facts` (opcional) confere se ele já sabe o que está falando.
    Devolve false se a fala não existe ou ainda não pode ser dita. Não sobrescreve: a primeira resposta é a que saiu. */
export function pressSay(moment,id,facts){
  const o=pressOpt(moment,id);if(!o)return false;
  if(o.need&&facts&&!o.need(facts))return false;
  const g=readCase(),cur=(g.press&&typeof g.press==='object')?g.press:{};
  if(cur[moment])return false;
  writeCase(c=>({...c,press:{...((c.press&&typeof c.press==='object')?c.press:{}),[moment]:id}}));
  return true;
}
