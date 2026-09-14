import PageHeader from '../components/PageHeader'
import Icon from '../components/Icon'
import { DEVELOPER } from '../config/developer'

const LINKS = [
  { key: 'portfolio', label: 'Portfolio', icon: 'briefcase' },
  { key: 'github', label: 'GitHub', icon: 'leaf' },
  { key: 'linkedin', label: 'LinkedIn', icon: 'user' }
]

function Developer() {
  const hasLinks = LINKS.some((link) => Boolean(DEVELOPER[link.key]))

  return (
    <main className="developer-page">
      <PageHeader eyebrow="Developer" title="Built by Alpha Odiero">
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
            <Icon name="info" size={20} /> About
          </h2>
          <p className="developer-text">{DEVELOPER.bio}</p>
        </div>

        <div className="developer-section">
          <h2 className="settings-group-title">
            <Icon name="sparkles" size={20} /> Why Chakula
          </h2>
          <p className="developer-text">{DEVELOPER.why}</p>
        </div>

        <div className="developer-section">
          <h2 className="settings-group-title">
            <Icon name="bolt" size={20} /> Interests
          </h2>
          <ul className="developer-interests">
            {DEVELOPER.interests.map((interest) => (
              <li key={interest} className="chip">{interest}</li>
            ))}
          </ul>
        </div>

        {hasLinks && (
          <div className="developer-section">
            <h2 className="settings-group-title">
              <Icon name="link" size={20} /> Connect
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
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="developer-note">
          <p>
            Chakula is a free, offline-capable progressive web app. Ideas, recipe suggestions, and
            the meal plan generator are provided for general use and are not professional dietary
            advice.
          </p>
        </div>
      </section>
    </main>
  )
}

export default Developer