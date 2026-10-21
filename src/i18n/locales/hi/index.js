import { common } from './common'
import { shell } from './shell'
import { discovery } from './discovery'
import { recipe } from './recipe'
import { planning } from './planning'
import { content } from './content'

// हिन्दी शब्दकोश। यहाँ न होने वाली कुंजी अंग्रेज़ी पर लौट जाती है।
export default {
  ...common,
  ...shell,
  ...discovery,
  ...recipe,
  ...planning,
  ...content
}
