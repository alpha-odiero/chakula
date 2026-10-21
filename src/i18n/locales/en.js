import { common } from './fragments/common'
import { shell } from './fragments/shell'
import { discovery } from './fragments/discovery'
import { recipe } from './fragments/recipe'
import { planning } from './fragments/planning'
import { content } from './fragments/content'

// English is the source of truth: every other locale falls back to these keys.
export default {
  ...common,
  ...shell,
  ...discovery,
  ...recipe,
  ...planning,
  ...content
}
