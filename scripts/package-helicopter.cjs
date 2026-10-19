// Technical layer extraction/alignment. Artwork was generated with image_gen.
const fs=require('fs'),path=require('path');
const sharp=require(require.resolve('sharp',{paths:[process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES||'.']}));
const dir=path.join(__dirname,'../public/cenarios/rua-acacias/helicoptero');
const W=4096,H=2048,S=1.7,OX=300,OY=350;
const point=(x,y)=>[Math.round(OX+x*S),Math.round(OY+y*S)];
async function canvas(input,left,top,file){await sharp({create:{width:W,height:H,channels:4,background:'#00000000'}}).composite([{input,left,top}]).png().toFile(path.join(dir,file));}
async function run(){
 const body=await sharp(path.join(dir,'source/corpo-original.png')).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 // Remove near-opaque alpha noise inside the generated hull; retain antialiased edges.
 for(let k=3;k<body.data.length;k+=4)if(body.data[k]>=240)body.data[k]=255;
 const polygons=[[[1405,294],[1518,292],[1535,305],[1558,414],[1548,428],[1424,415],[1408,393]],[[1582,293],[1652,295],[1683,312],[1738,429],[1733,441],[1611,432],[1591,410]],[[1718,286],[1771,281],[1829,314],[1950,412],[1790,433]],[[1667,466],[1719,472],[1764,512],[1756,522],[1683,515]],[[1808,464],[1849,468],[1911,491],[1922,514],[1904,552],[1867,564],[1846,552]]];
 const mask=Buffer.from(`<svg width="${body.info.width}" height="${body.info.height}">${polygons.map(p=>`<polygon fill="white" points="${p.map(v=>v.join(',')).join(' ')}"/>`).join('')}</svg>`);
 const glass=await sharp(body.data,{raw:body.info}).composite([{input:mask,blend:'dest-in'}]).resize({width:Math.round(body.info.width*S)}).png().toBuffer();
 const scaled=await sharp(body.data,{raw:body.info}).resize({width:Math.round(body.info.width*S)}).png().toBuffer();
 await canvas(scaled,OX,OY,'corpo.png');await canvas(glass,OX,OY,'vidro.png');
 const tail=point(108,360),main=point(1365,88);
 const rotor=await sharp(path.join(dir,'source/rotor-original.png')).resize(660,660).png().toBuffer();
 // Source hub measured at (625,628) on the 1254-square source.
 await canvas(rotor,tail[0]-329,tail[1]-331,'rotor-cauda.png');
 const blade=await sharp(path.join(dir,'source/pa-original.png')).resize({width:1400}).png().toBuffer();
 // Source root measured at (70,328) on the 2172-wide source.
 await canvas(blade,main[0]-45,main[1]-211,'pas.png');
 const rect={x:point(1250,315)[0],y:point(1250,315)[1],width:Math.floor(450*S),height:Math.floor(205*S)};
 const manifest={version:1,units:'pixels',resolution:{width:W,height:H},direction:'right',layers:['corpo.png','vidro.png','rotor-cauda.png','pas.png'],bodyRect:{x:point(1100,245)[0],y:point(1100,245)[1],width:Math.round(900*S),height:Math.round(355*S)},opaqueWipeRect:rect,nose:point(2017,490),tailRotorCenter:tail,searchlight:point(1935,566),antiCollisionLight:point(1475,603),whiteStrobe:point(75,104),mainRotorAxis:main,drawOrder:['pas.png','corpo.png','vidro.png','rotor-cauda.png'],notes:['All layers use identical canvas and coordinates; rotate about declared pivots, never image center.','Glass duplicates original opaque window pixels; keep body intact beneath it to ensure a fully opaque wipe.','Main blade is one blade; repeat around mast with foreshortening for the rotor disk.','Lights are OFF in art; render lighting in code.','4096-wide delivery; body source is 2062x763, resampled 1.7x, not native 4K.','Opaque wipe uses conservative inner rectangle; scale >= max(viewWidth/rect.width,viewHeight/rect.height) and center this rectangle on viewport before switching scenes.']};
 fs.writeFileSync(path.join(dir,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
 const raw=await sharp(path.join(dir,'corpo.png')).ensureAlpha().raw().toBuffer();let minAlpha=255;
 for(let y=rect.y;y<rect.y+rect.height;y++)for(let x=rect.x;x<rect.x+rect.width;x++)minAlpha=Math.min(minAlpha,raw[(y*W+x)*4+3]);
 if(minAlpha!==255)throw Error('Wipe rectangle is not opaque: '+minAlpha);
 const checks={canvas:[W,H],opaqueWipeMinAlpha:minAlpha,layers:{}};
 for(const name of manifest.layers){const m=await sharp(path.join(dir,name)).metadata();checks.layers[name]={width:m.width,height:m.height,alpha:m.hasAlpha};if(m.width!==W||m.height!==H||!m.hasAlpha)throw Error(name);}
 fs.writeFileSync(path.join(dir,'validation.json'),JSON.stringify(checks,null,2)+'\n');
 const preview=await sharp({create:{width:W,height:H,channels:4,background:'#111b25'}}).composite(manifest.drawOrder.map(n=>({input:path.join(dir,n)}))).png().toBuffer();
 await sharp(preview).resize(1600,800).png().toFile(path.join(dir,'preview.png'));
 console.log(JSON.stringify(checks));
}
run().catch(e=>{console.error(e);process.exit(1)});
