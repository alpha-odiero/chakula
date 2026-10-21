import { common } from './common'
import { shell } from './shell'
import { discovery } from './discovery'
import { recipe } from './recipe'
import { planning } from './planning'
import { content } from './content'

// Dictionnaire français. Toute clé absente ici retombe sur l'anglais.
export default {
  ...common,
  ...shell,
  ...discovery,
  ...recipe,
  ...planning,
  ...content
}
