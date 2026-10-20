import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import { APP_VERSION } from '../config/app'

const SECTIONS = [
  { id: 'about', label: 'About this app' },
  { id: 'terms', label: 'Terms of use' },
  { id: 'privacy', label: 'Privacy policy' },
  { id: 'cookies', label: 'Cookies' },
  { id: 'third-party', label: 'Third-party content' },
  { id: 'contact', label: 'Contact' }
]

function Terms() {
  return (
    <main className="static-page">
      <PageHeader
        eyebrow="About & policies"
        title="About & policies"
        subtitle="About Pikawise, how you may use it, and what it does with your data — everything in one place."
      >
        <nav className="static-toc" aria-label="Sections">
          <ul>
            {SECTIONS.map((section) => (
              <li key={section.id}>
                <a href={`#${section.id}`}>{section.label}</a>
              </li>
            ))}
          </ul>
        </nav>
      </PageHeader>

      <section className="container static-body">
        <div className="prose">
          <h2 id="about">About this app</h2>
          <p>
            Pikawise was built for anyone who stands in front of the fridge and thinks,
            &quot;So... what&apos;s for dinner?&quot; Whether you&apos;re stuck in a food rut,
            working with a nearly-empty pantry, or just curious what people eat around the world,
            Pikawise gets you from craving to recipe in seconds.
          </p>

          <h3>What you can do</h3>
          <ul>
            <li>Search for meals by name or a single ingredient.</li>
            <li>Browse recipes by category, cuisine, or ingredient.</li>
            <li>Get a random meal when you can&apos;t decide.</li>
            <li>Build your own balanced meal plan from the foods you already have.</li>
            <li>Save meal plans and turn them into a shopping list.</li>
            <li>View complete recipes with ingredients, measurements, and instructions.</li>
          </ul>

          <h3>Recipe library</h3>
          <p>
            Pikawise brings together a world of recipes — from quick breakfasts to slow weekend
            dinners — and presents them in one clean, consistent place. Recipes and photos are
            gathered from public recipe sources and shown for inspiration. Pikawise curates how they
            are presented, but does not author the original dishes and does not claim ownership of
            them.
          </p>

          <h3>Privacy by design</h3>
          <p>
            Pikawise does not require an account and does not collect or transmit your personal
            data. Your meal plans, preferences, and shopping lists are stored only in your browser
            on your device. See the <Link to="/terms#privacy">Privacy Policy</Link> for details.
          </p>

          <h3>Version</h3>
          <p>
            You&apos;re using Pikawise v{APP_VERSION} — a progressive web app that works offline and
            keeps your plans, preferences, and reminders on your device.
          </p>

          <h2 id="terms">Terms of use</h2>
          <p>
            Pikawise is a meal discovery application. By using Pikawise, you agree to these terms.
            If you do not agree, please do not use the application.
          </p>

          <h3>Use of the service</h3>
          <p>
            Pikawise is provided for personal, non-commercial use. You may use it to discover meals,
            view recipes, and save meal plans on your device. Please don&apos;t misuse the service or
            try to disrupt it for others.
          </p>

          <h3>Recipe content</h3>
          <p>
            Recipe content displayed in Pikawise may be provided by third-party recipe sources.
            Pikawise does not author, verify, or guarantee this content, and does not claim
            ownership of it. Recipes are shown for inspiration and should be prepared with care.
          </p>

          <h3>Ingredients and allergens</h3>
          <p>
            You are responsible for verifying that a recipe is safe and suitable for you, including
            checking ingredients, allergens, and preparation times. Do not rely solely on the
            information shown in the application.
          </p>

          <h3>Not medical or nutritional advice</h3>
          <p>
            Pikawise is not a medical, dietary, or nutritional advisory service. The information it
            displays is general recipe content, not personalized guidance. Consult a qualified
            professional for medical or dietary questions.
          </p>

          <h3>Availability</h3>
          <p>
            Pikawise depends on third-party recipe services. Recipes may be unavailable at times,
            and the application may be offline. The application is provided &ldquo;as is&rdquo; and
            &ldquo;as available&rdquo; without warranties of any kind.
          </p>

          <h3>Changes</h3>
          <p>
            These terms may be updated from time to time. Continued use of Pikawise after changes
            means you accept the updated terms.
          </p>

          <h2 id="privacy">Privacy policy</h2>
          <p>
            Pikawise is a meal discovery app. This policy explains what information is stored or
            shared when you use it. The short version: Pikawise is designed to work privately on
            your device, and it doesn&apos;t need an account or your personal details.
          </p>

          <h3>No account required</h3>
          <p>
            You don&apos;t need to create an account, sign in, or hand over any personal information
            to use Pikawise. Scroll, search, and cook.
          </p>

          <h3>What is stored on your device</h3>
          <p>Pikawise stores the following data locally in your browser:</p>
          <ul>
            <li>
              <strong>Meal plans and shopping lists</strong> — the plans you build and the items you
              tick off, so they&apos;re still there when you&apos;re offline.
            </li>
            <li>
              <strong>Preferences</strong> — things like your theme (light or dark), dietary
              preference, and how many meals you plan per day.
            </li>
            <li>
              <strong>Install prompt preferences</strong> — whether you dismissed the installation
              prompt, so we don&apos;t nag you about it.
            </li>
            <li>
              <strong>Cookie consent</strong> — your choice about the cookie notice, so we only ask
              you once.
            </li>
            <li>
              <strong>Meal reminders</strong> — your reminder times, days, and quiet hours, plus a
              record of which reminders have already fired, so you are not notified twice.
            </li>
          </ul>
          <p>
            This data stays on your device. It isn&apos;t sent to Pikawise or to any third party,
            and you can remove it any time from Settings → My Stuff.
          </p>

          <h3 id="cookies">Cookies</h3>
          <p>
            Pikawise uses a few essential cookies to remember your choices on this device — never to
            track you. These cookies keep your meal plans, preferences, and shopping lists in
            place, and service worker caches keep the app working offline. The first time you
            visit, we show a short cookie notice so you know what&apos;s going on.
          </p>
          <p>
            We don&apos;t use advertising cookies, analytics trackers, or anything that can identify
            you across websites. Clearing your browser data, or removing the app, wipes everything
            Pikawise saved.
          </p>

          <h3>Notifications</h3>
          <p>
            Meal reminders are optional and off by default. If you turn them on, Pikawise asks your
            browser for permission to show notifications. Notifications are generated on your device
            from your own settings and the recipe data already on your device; no reminder details
            are sent to Pikawise or anyone else. You can turn reminders off at any time in Settings.
          </p>

          <h3>Recipe data requests</h3>
          <p>
            When you search, filter, or open a recipe, Pikawise fetches recipe data and images from
            a third-party recipe service. These requests are made directly from your browser and
            include only the search terms, filters, or recipe IDs you choose to request.
          </p>

          <h3 id="third-party">Third-party recipe content</h3>
          <p>
            Recipe content, including names, images, ingredients, and instructions, is provided by
            third-party recipe sources. Pikawise does not author, control, or edit this content, and
            does not claim ownership of it. Please refer to the original source&apos;s own terms
            for how their content may be used.
          </p>

          <h3 id="contact">Contact</h3>
          <p>
            Pikawise is provided as-is. If you have questions about this policy, contact the
            application operator directly.
          </p>
        </div>
      </section>
    </main>
  )
}

export default Terms
