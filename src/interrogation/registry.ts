import type { InterrogationConfig } from './types'
import { liviaInterrogation } from './livia'
import { caioInterrogation } from './caio'
import { rafaelInterrogation } from './rafael'
import { cidaInterrogation } from './cida'
import { jorgeInterrogation } from './jorge'
import { teoInterrogation } from './teo'

/** Todos os depoimentos do caso, por personagem. Pessoa sem entrada aqui não tem depoimento. */
export const interrogations:Record<string,InterrogationConfig> = {
  livia:liviaInterrogation,
  caio:caioInterrogation,
  rafael:rafaelInterrogation,
  cida:cidaInterrogation,
  jorge:jorgeInterrogation,
  teo:teoInterrogation
}
