import PageHeader from '../components/PageHeader'
import Icon from '../components/Icon'
import { DEVELOPER } from '../config/developer'
import { useSeo } from '../hooks/useSeo'
import { useTranslation } from '../i18n/LocaleContext'

const LINKS = [
  { key: 'portfolio', label: 'Portfolio', labelKey: 'developer.links.portfolio', icon: 'briefcase' },
  { key: 'github', label: 'GitHub', icon: 'leaf' },
  { key: 'linkedin', label: 'LinkedIn', icon: 'user' }
]

// The bio and the "why" copy live in src/config/developer.js. They are mapped
// to dictionary keys here so the page can be translated without touching the
// config; anything unknown falls back to the original English text.
const COPY_KEYS = {
  [DEVELOPER.bio]: 'developer.bio',
  [DEVELOPER.why]: 'developer.why'
}

const INTEREST_KEYS = {
  'Full-Stack Development': 'developer.interest.fullStack',
  'Backend Engineering': 'developer.interest.backend',
  'AI Automation': 'developer.interest.ai',
  'DevOps': 'developer.interest.devops',
  'Cybersecurity': 'developer.interest.cybersecurity',
  'Digital Product Design': 'developer.interest.productDesign'
}

function Developer() {
  const { t } = useTranslation()
  useSeo({
    title: t('developer.seoTitle'),
    description: t('developer.seoDescription'),
    path: '/developer'
  })
  const hasLinks = LINKS.some((link) => Boolean(DEVELOPER[link.key]))
  const bioKey = COPY_KEYS[DEVELOPER.bio]
  const whyKey = COPY_KEYS[DEVELOPER.why]

  return (
    <main className="developer-page">
      <PageHeader eyebrow={t('developer.eyebrow')} title={t('developer.title')}>
        <p className="page-subtitle">{DEVELOPER.tagline}</p>
      </PageHeader>

      <section className="container">
        <article className="developer-card">
          <div className="developer-avatar" aria-hidden="true">
            <Icon name="user" size={44} />
          </div>
          <div className="developer-info">
            <h2>{DEVELOPER.name}</h2>
            <p className="developer-role">{DEVELOPER.role}</p>
          </div>
        </article>

        <div className="developer-section">
          <h2 className="settings-group-title">
            <Icon name="info" size={20} /> {t('developer.about')}
          </h2>
          <p className="developer-text">{bioKey ? t(bioKey) : DEVELOPER.bio}</p>
        </div>

        <div className="developer-section">
          <h2 className="settings-group-title">
            <Icon name="sparkles" size={20} /> {t('developer.whyTitle')}
          </h2>
          <p className="developer-text">{whyKey ? t(whyKey) : DEVELOPER.why}</p>
        </div>

        <div className="developer-section">
          <h2 className="settings-group-title">
            <Icon name="bolt" size={20} /> {t('developer.interests')}
          </h2>
          <ul className="developer-interests">
            {DEVELOPER.interests.map((interest) => {
              const interestKey = INTEREST_KEYS[interest]
              return (
                <li key={interest} className="chip">{interestKey ? t(interestKey) : interest}</li>
              )
            })}
          </ul>
        </div>

        {hasLinks && (
          <div className="developer-section">
            <h2 className="settings-group-title">
              <Icon name="link" size={20} /> {t('developer.connect')}
            </h2>
            <div className="developer-links">
              {LINKS.filter((link) => Boolean(DEVELOPER[link.key])).map((link) => (
                <a
                  key={link.key}
                  className="button button--secondary"
                  href={DEVELOPER[link.key]}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Icon name={link.icon} size={16} />
                  {link.labelKey ? t(link.labelKey) : link.label}
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="developer-note">
          <p>{t('developer.note')}</p>
        </div>
      </section>
    </main>
  )
}

export default Developer
