// Package original portrait pixels over the imagegen underpaint. No portraits are overwritten.
const fs = require('fs');
const path = require('path');
const sharp = require(require.resolve('sharp', {paths:[process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES || '.']}));
const W=900,H=1200,dir=path.join(__dirname,'../public/characters/reporter/hair');
const expressions=['neutral','asking','insisting','surprised','satisfied','annoyed'];
const specs=[
 ['lateral-esq',[287,278],[235,373],.94,[[285,230],[323,244],[296,317],[265,368],[244,425],[227,469],[218,410],[216,343],[233,294]]],
 ['lateral-dir',[608,279],[656,365],.94,[[585,233],[621,242],[653,291],[674,337],[674,403],[652,469],[645,419],[646,370],[622,323]]],
 ['topo-esq',[371,189],[283,247],.9,[[291,184],[342,144],[396,129],[414,161],[364,199],[318,231],[283,283],[249,308],[251,250],[271,217]]],
 ['topo-centro',[447,157],[446,97],.88,[[355,130],[399,106],[442,90],[477,92],[506,109],[515,148],[477,180],[447,179],[419,154],[383,156]]],
 ['topo-dir',[535,183],[596,202],.92,[[501,116],[546,113],[575,140],[602,167],[625,214],[645,276],[617,271],[595,232],[556,206],[520,183]]],
 ['fio-frontal-esq',[323,300],[283,549],.22,[[320,281],[331,294],[318,343],[305,383],[290,423],[276,458],[271,483],[274,513],[291,560],[280,549],[263,520],[257,489],[258,463],[269,434],[282,406],[296,375],[308,333]]],
 ['fio-frontal-dir',[572,300],[601,529],.24,[[565,282],[580,299],[589,337],[600,377],[611,412],[625,452],[631,480],[627,503],[613,526],[598,541],[608,520],[618,497],[618,474],[610,448],[598,421],[588,389],[578,349]]]
];
function inside(x,y,p){let c=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if((a[1]>y)!=(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])c=!c;}return c;}
async function run(){
 const under=await sharp(path.join(dir,'source/underpaint.png')).resize(W,H,{fit:'fill'}).removeAlpha().raw().toBuffer();
 const manifest={version:1,character:'reporter',resolution:{width:W,height:H},baseFormat:'png',weightChannel:'red',weightOutsideStrand:0,zeroWindReconstruction:'exact decoded RGB with base.png; JPEG is compatibility only',expressions:{},motion:{units:'source pixels',recommendedTipDisplacement:{breeze:1.5,helicopter:5},rootPinned:true,notes:'Pinned bun; flexible temple locks. Calibrate amplitude in Safari.'}};
 const validation={expressions:{}};
 const thumbs=[];
 for(const exp of expressions){
  const out=path.join(dir,exp);fs.mkdirSync(out,{recursive:true});
  const original=await sharp(path.join(dir,'../expressions',exp+'.jpg')).removeAlpha().raw().toBuffer();
  const base=Buffer.from(original),used=new Uint8Array(W*H),strands=[],layers=[];
  // Foreground locks claim their pixels before broad side sections.
  const masks=specs.map(()=>new Uint8Array(W*H));
  for(let si=specs.length-1;si>=0;si--){const s=specs[si];for(let y=80;y<565;y++)for(let x=210;x<680;x++){
   const p=y*W+x,k=p*3,r=original[k],g=original[k+1],b=original[k+2];
   const hair=r<150 && !(r>90&&r-g>47&&g-b>20) && Math.max(Math.abs(r-24),Math.abs(g-33),Math.abs(b-38))>12;
   if(!used[p]&&hair&&inside(x,y,s[4])){masks[si][p]=1;used[p]=1;}
  }}
  for(let si=0;si<specs.length;si++){
   const [name,root,tip,stiffness]=specs[si],rgba=Buffer.alloc(W*H*4),weight=Buffer.alloc(W*H);let pixels=0;
   const dx=tip[0]-root[0],dy=tip[1]-root[1],den=dx*dx+dy*dy;
   for(let p=0;p<W*H;p++)if(masks[si][p]){
    pixels++;const k=p*3,j=p*4;original.copy(rgba,j,k,k+3);rgba[j+3]=255;
    under.copy(base,k,k,k+3);
    const t=Math.max(0,Math.min(1,((p%W-root[0])*dx+(Math.floor(p/W)-root[1])*dy)/den));
    weight[p]=Math.round(255*t*t*(3-2*t));
   }
   const stem=`strand-${String(si+1).padStart(2,'0')}-${name}`;
   await sharp(rgba,{raw:{width:W,height:H,channels:4}}).png().toFile(path.join(out,stem+'.png'));
   await sharp(weight,{raw:{width:W,height:H,channels:1}}).png().toFile(path.join(out,stem+'-weight.png'));
   strands.push({file:`${exp}/${stem}.png`,weight:`${exp}/${stem}-weight.png`,root,tip,stiffness,zIndex:si+1,pixels});layers.push(rgba);
  }
  await sharp(base,{raw:{width:W,height:H,channels:3}}).png().toFile(path.join(out,'base.png'));
  await sharp(base,{raw:{width:W,height:H,channels:3}}).jpeg({quality:98,chromaSubsampling:'4:4:4'}).toFile(path.join(out,'base.jpg'));
  let changed=0,error=0;const reconstructed=Buffer.from(base);
  for(const a of layers)for(let p=0;p<W*H;p++)if(a[p*4+3])a.copy(reconstructed,p*3,p*4,p*4+3);
  for(let k=0;k<original.length;k++){if(reconstructed[k]!==original[k])error++;if(!used[Math.floor(k/3)]&&base[k]!==original[k])changed++;}
  if(error||changed)throw Error('Pixel preservation failure '+exp);
  validation.expressions[exp]={zeroWindDifferingChannels:error,changedChannelsOutsideHair:changed,strands:strands.length,layerPixels:strands.map(s=>s.pixels)};
  manifest.expressions[exp]={base:`${exp}/base.png`,compatibilityJpeg:`${exp}/base.jpg`,original:`../expressions/${exp}.jpg`,strands};
  thumbs.push(await sharp(reconstructed,{raw:{width:W,height:H,channels:3}}).resize(225,300).png().toBuffer());
 }
 fs.writeFileSync(path.join(dir,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
 fs.writeFileSync(path.join(dir,'validation.json'),JSON.stringify(validation,null,2)+'\n');
 await sharp({create:{width:675,height:600,channels:3,background:'#182126'}}).composite(thumbs.map((input,i)=>({input,left:(i%3)*225,top:Math.floor(i/3)*300}))).png().toFile(path.join(dir,'reference-expressions.png'));
 console.log(JSON.stringify(validation,null,2));
}
run().catch(e=>{console.error(e);process.exit(1)});
