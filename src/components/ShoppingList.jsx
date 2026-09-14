import { useState } from 'react'
import Icon from './Icon'
import { getShoppingChecks, setShoppingItemChecked, saveShoppingChecks } from '../utils/storage'
import { supportsWebShare, supportsClipboard } from '../utils/platform'

function InteractiveShoppingList({ plan }) {
  const checks = getShoppingChecks()[plan.id] || {}
  const [checked, setChecked] = useState(checks)
  const [message, setMessage] = useState(null)

  const shopping = plan.shopping || { required: [], have: [], need: [] }

  const toggle = (itemId) => {
    const next = { ...checked }
    if (next[itemId]) delete next[itemId]
    else next[itemId] = true
    setChecked(next)
    setShoppingItemChecked(plan.id, itemId, Boolean(next[itemId]))
  }

  const clearList = () => {
    const all = getShoppingChecks()
    delete all[plan.id]
    saveShoppingChecks(all)
    setChecked({})
  }

  const needs = (shopping.need || []).filter((item) => !checked[item])
  const have = (shopping.have || []).filter((item) => !checked[item])

  const copyList = async () => {
    const lines = ['Shopping List']
    if (have.length) lines.push(`\nAlready have:\n${have.map((i) => `- ${i}`).join('\n')}`)
    if (needs.length) lines.push(`\nNeed:\n${needs.map((i) => `- ${i}`).join('\n')}`)
    const text = lines.join('\n')
    if (supportsWebShare()) {
      try {
        await navigator.share({ title: 'Chakula Shopping List', text })
        return
      } catch {
        /* fall through to copy */
      }
    }
    if (supportsClipboard()) {
      try {
        await navigator.clipboard.writeText(text)
        setMessage('Shopping list copied!')
        setTimeout(() => setMessage(null), 2500)
        return
      } catch {
        /* fall through */
      }
    }
    try {
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setMessage('Shopping list copied!')
      setTimeout(() => setMessage(null), 2500)
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="shopping-panel">
      <div className="shopping-panel-header">
        <h3 className="shopping-panel-title">
          <Icon name="shoppingBag" size={20} /> Shopping List
        </h3>
        <div className="plan-actions">
          <button type="button" className="button button--ghost button--small" onClick={copyList}>
            <Icon name="copy" size={14} /> Copy
          </button>
          <button type="button" className="button button--ghost button--small" onClick={clearList}>
            Clear
          </button>
        </div>
      </div>
      {message && <p className="share-confirmation" role="status">{message}</p>}

      {have.length > 0 && (
        <>
          <p className="shopping-group-title">You already have</p>
          <ul>
            {have.map((item) => (
              <li key={item} className="shopping-item" aria-label={`You already have ${item}`}>
                <span className="shopping-check" aria-hidden="true">
                  <Icon name="check" size={16} />
                </span>
                <span>{item.charAt(0).toUpperCase() + item.slice(1)}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      {shopping.need.length > 0 ? (
        <>
          <p className="shopping-group-title">You may need</p>
          <ul>
            {shopping.need.map((item) => (
              <li
                key={item}
                className={`shopping-item${checked[item] ? ' shopping-item--checked' : ''}`}
              >
                <input
                  type="checkbox"
                  id={`sh-${plan.id}-${item}`}
                  checked={Boolean(checked[item])}
                  onChange={() => toggle(item)}
                  aria-label={`Mark ${item} as ${checked[item] ? 'needed' : 'collected'}`}
                />
                <label htmlFor={`sh-${plan.id}-${item}`}>
                  {item.charAt(0).toUpperCase() + item.slice(1)}
                </label>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="settings-hint">Nothing to buy — you already have every ingredient listed.</p>
      )}
    </div>
  )
}

export default InteractiveShoppingList