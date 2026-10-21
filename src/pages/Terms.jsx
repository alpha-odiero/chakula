import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import { APP_VERSION } from '../config/app'
import { useSeo } from '../hooks/useSeo'
import { useTranslation } from '../i18n/LocaleContext'

const SECTIONS = [
  { id: 'about', label: 'terms.nav.about' },
  { id: 'terms', label: 'terms.nav.terms' },
  { id: 'privacy', label: 'terms.nav.privacy' },
  { id: 'cookies', label: 'terms.nav.cookies' },
  { id: 'third-party', label: 'terms.nav.thirdParty' },
  { id: 'contact', label: 'terms.nav.contact' }
]

function Terms() {
  const { t } = useTranslation()
  useSeo({
    title: t('terms.seoTitle'),
    description: t('terms.seoDescription'),
    path: '/terms'
  })
  return (
    <main className="static-page">
      <PageHeader
        eyebrow={t('terms.eyebrow')}
        title={t('terms.title')}
        subtitle={t('terms.subtitle')}
      >
        <nav className="static-toc" aria-label={t('terms.navAria')}>
          <ul>
            {SECTIONS.map((section) => (
              <li key={section.id}>
                <a href={`#${section.id}`}>{t(section.label)}</a>
              </li>
            ))}
          </ul>
        </nav>
      </PageHeader>

      <section className="container static-body">
        <div className="prose">
          <h2 id="about">{t('terms.about.h2')}</h2>
          <p>{t('terms.about.p1')}</p>

          <h3>{t('terms.about.whatYouCanDo')}</h3>
          <ul>
            <li>{t('terms.about.canDo1')}</li>
            <li>{t('terms.about.canDo2')}</li>
            <li>{t('terms.about.canDo3')}</li>
            <li>{t('terms.about.canDo4')}</li>
            <li>{t('terms.about.canDo5')}</li>
            <li>{t('terms.about.canDo6')}</li>
          </ul>

          <h3>{t('terms.about.recipeLibrary')}</h3>
          <p>{t('terms.about.recipeLibraryP1')}</p>

          <h3>{t('terms.about.privacyByDesign')}</h3>
          <p>
            {t('terms.about.privacyByDesignP1')}
            <Link to="/terms#privacy">{t('terms.about.privacyPolicyLink')}</Link>
            {t('terms.about.privacyByDesignP2')}
          </p>

          <h3>{t('terms.about.version')}</h3>
          <p>{t('terms.about.versionP1', { version: APP_VERSION })}</p>

          <h2 id="terms">{t('terms.terms.h2')}</h2>
          <p>{t('terms.terms.p1')}</p>

          <h3>{t('terms.terms.useOfService')}</h3>
          <p>{t('terms.terms.useOfServiceP1')}</p>

          <h3>{t('terms.terms.recipeContent')}</h3>
          <p>{t('terms.terms.recipeContentP1')}</p>

          <h3>{t('terms.terms.ingredientsAllergens')}</h3>
          <p>{t('terms.terms.ingredientsAllergensP1')}</p>

          <h3>{t('terms.terms.notMedicalAdvice')}</h3>
          <p>{t('terms.terms.notMedicalAdviceP1')}</p>

          <h3>{t('terms.terms.availability')}</h3>
          <p>{t('terms.terms.availabilityP1')}</p>

          <h3>{t('terms.terms.changes')}</h3>
          <p>{t('terms.terms.changesP1')}</p>

          <h2 id="privacy">{t('terms.privacy.h2')}</h2>
          <p>{t('terms.privacy.p1')}</p>

          <h3>{t('terms.privacy.noAccount')}</h3>
          <p>{t('terms.privacy.noAccountP1')}</p>

          <h3>{t('terms.privacy.stored')}</h3>
          <p>{t('terms.privacy.storedP1')}</p>
          <ul>
            <li>
              <strong>{t('terms.privacy.store1Title')}</strong> — {t('terms.privacy.store1Text')}
            </li>
            <li>
              <strong>{t('terms.privacy.store2Title')}</strong> — {t('terms.privacy.store2Text')}
            </li>
            <li>
              <strong>{t('terms.privacy.store3Title')}</strong> — {t('terms.privacy.store3Text')}
            </li>
            <li>
              <strong>{t('terms.privacy.store4Title')}</strong> — {t('terms.privacy.store4Text')}
            </li>
            <li>
              <strong>{t('terms.privacy.store5Title')}</strong> — {t('terms.privacy.store5Text')}
            </li>
          </ul>
          <p>{t('terms.privacy.storedP2')}</p>

          <h3 id="cookies">{t('terms.privacy.cookies')}</h3>
          <p>{t('terms.privacy.cookiesP1')}</p>
          <p>{t('terms.privacy.cookiesP2')}</p>

          <h3>{t('terms.privacy.notifications')}</h3>
          <p>{t('terms.privacy.notificationsP1')}</p>

          <h3>{t('terms.privacy.recipeData')}</h3>
          <p>{t('terms.privacy.recipeDataP1')}</p>

          <h3 id="third-party">{t('terms.thirdParty.h3')}</h3>
          <p>{t('terms.thirdParty.p1')}</p>

          <h3 id="contact">{t('terms.contact.h3')}</h3>
          <p>{t('terms.contact.p1')}</p>
        </div>
      </section>
    </main>
  )
}

export default Terms
