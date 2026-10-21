import { useState } from 'react'
import Icon from './Icon'
import { useToast } from './Toast'
import { getShoppingChecks, setShoppingItemChecked, saveShoppingChecks } from '../utils/storage'
import { supportsWebShare, supportsClipboard } from '../utils/platform'
import { useTranslation } from '../i18n/LocaleContext'

function InteractiveShoppingList({ plan }) {
  const { t } = useTranslation()
  const checks = getShoppingChecks()[plan.id] || {}
  const [checked, setChecked] = useState(checks)
  const toast = useToast()

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
    const lines = [t('shopping.shareTitle')]
    if (have.length) {
      lines.push(`\n${t('shopping.shareHave', { items: have.map((i) => `- ${i}`).join('\n') })}`)
    }
    if (needs.length) {
      lines.push(`\n${t('shopping.shareNeed', { items: needs.map((i) => `- ${i}`).join('\n') })}`)
    }
    const text = lines.join('\n')
    if (supportsWebShare()) {
      try {
        await navigator.share({ title: t('shopping.shareTitlePikawise'), text })
        return
      } catch {
        /* fall through to copy */
      }
    }
    if (supportsClipboard()) {
      try {
        await navigator.clipboard.writeText(text)
        toast.success(t('shopping.copiedToast'))
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
      toast.success(t('shopping.copiedToast'))
    } catch {
      toast.error(t('shopping.copyFailedToast'))
    }
  }

  return (
    <div className="shopping-panel">
      <div className="shopping-panel-header">
        <h3 className="shopping-panel-title">
          <Icon name="shoppingBag" size={20} /> {t('shopping.panelTitle')}
        </h3>
        <div className="plan-actions">
          <button type="button" className="button button--ghost button--small" onClick={copyList}>
            <Icon name="copy" size={14} /> {t('common.copy')}
          </button>
          <button type="button" className="button button--ghost button--small" onClick={clearList}>
            {t('common.clear')}
          </button>
        </div>
      </div>

      {have.length > 0 && (
        <>
          <p className="shopping-group-title">{t('shopping.alreadyHave')}</p>
          <ul>
            {have.map((item) => (
              <li key={item} className="shopping-item" aria-label={t('shopping.haveItemAria', { item })}>
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
          <p className="shopping-group-title">{t('shopping.mayNeed')}</p>
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
                  aria-label={t(
                    checked[item] ? 'shopping.markNeededAria' : 'shopping.markCollectedAria',
                    { item }
                  )}
                />
                <label htmlFor={`sh-${plan.id}-${item}`}>
                  {item.charAt(0).toUpperCase() + item.slice(1)}
                </label>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="settings-hint">{t('shopping.nothingToBuy')}</p>
      )}
    </div>
  )
}

export default InteractiveShoppingList