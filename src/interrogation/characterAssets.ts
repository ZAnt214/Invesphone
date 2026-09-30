import type { Expression } from './CharacterPortrait'
import p0 from './liviaAssetChunks/part0'
import p1 from './liviaAssetChunks/part1'
import p2 from './liviaAssetChunks/part2'
import p3 from './liviaAssetChunks/part3'
import p4 from './liviaAssetChunks/part4'
import p5a from './liviaAssetChunks/part5a'
import p5b from './liviaAssetChunks/part5b'
import p5c from './liviaAssetChunks/part5c'
import p5d from './liviaAssetChunks/part5d'

const liviaTail = 'e8Huh7we+Huh7ge6Hvh7Ie8HvB7weyHuh7we8HvB7oe6Huh7qe6Hvh7we6Hsn/52V/6G0VH/2Q=='
const liviaOfficial = `data:image/jpeg;base64,${p0+p1+p2+p3+p4+p5a+p5b+p5c+p5d+liviaTail}`

export const characterAssets:Record<string,Partial<Record<Expression,string>> & {default:string}> = {
  livia:{
    default:liviaOfficial,
    neutral:liviaOfficial,
    tired:liviaOfficial,
    uncomfortable:liviaOfficial,
    defensive:liviaOfficial,
    nervous:liviaOfficial,
    shaken:liviaOfficial
  }
}
