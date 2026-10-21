import { common } from './common'
import { shell } from './shell'
import { discovery } from './discovery'
import { recipe } from './recipe'
import { planning } from './planning'
import { content } from './content'

// Dicionário português. Qualquer chave em falta recorre ao inglês.
export default {
  ...common,
  ...shell,
  ...discovery,
  ...recipe,
  ...planning,
  ...content
}
