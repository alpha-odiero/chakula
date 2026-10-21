import { common } from './common'
import { shell } from './shell'
import { discovery } from './discovery'
import { recipe } from './recipe'
import { planning } from './planning'
import { content } from './content'

// Kiswahili dictionary. Any key that is missing here falls back to English.
export default {
  ...common,
  ...shell,
  ...discovery,
  ...recipe,
  ...planning,
  ...content
}
