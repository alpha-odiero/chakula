import { common } from './common'
import { shell } from './shell'
import { discovery } from './discovery'
import { recipe } from './recipe'
import { planning } from './planning'
import { content } from './content'

// Diccionario español. Cualquier clave ausente recurre al inglés.
export default {
  ...common,
  ...shell,
  ...discovery,
  ...recipe,
  ...planning,
  ...content
}
