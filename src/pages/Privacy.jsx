import PageHeader from '../components/PageHeader'

function Privacy() {
  return (
    <main className="static-page">
      <PageHeader eyebrow="Privacy" title="Privacy Policy" />
      <section className="container static-body">
        <div className="prose">
          <h2>Overview</h2>
          <p>
            Pikawise is a meal discovery app. This policy explains what information is stored or
            shared when you use it. The short version: Pikawise is designed to work privately on
            your device, and it doesn't need an account or your personal details.
          </p>

          <h2>No account required</h2>
          <p>
            You don't need to create an account, sign in, or hand over any personal information to
            use Chakula. Scroll, search, and cook.
          </p>

          <h2>What is stored on your device</h2>
          <p>Pikawise stores the following data locally in your browser:</p>
          <ul>
            <li>
              <strong>Meal plans and shopping lists</strong> — the plans you build and the items you
              tick off, so they're still there when you're offline.
            </li>
            <li>
              <strong>Preferences</strong> — things like your theme (light or dark), dietary
              preference, and how many meals you plan per day.
            </li>
            <li>
              <strong>Install prompt preferences</strong> — whether you dismissed the installation
              prompt, so we don't nag you about it.
            </li>
            <li>
              <strong>Cookie consent</strong> — your choice about the cookie notice, so we only ask
              you once.
            </li>
          </ul>
          <p>
            This data stays on your device. It isn't sent to Pikawise or to any third party, and you
            can remove it any time from Settings → Data &amp; storage.
          </p>

          <h2 id="cookies">Cookies and local storage</h2>
          <p>
            Chakula uses a few small bits of browser storage to remember who you are on this device
            — never to track you. These are "essential" types of storage: local storage for the data
            listed above, and service worker caches that keep the app working offline. The first
            time you visit, we show a short cookie notice so you know what's going on.
          </p>
          <p>
            We don't use advertising cookies, analytics trackers, or anything that can identify you
            across websites. Clearing your browser data, or removing the app, wipes everything
            Chakula saved.
          </p>

          <h2>API communication</h2>
          <p>
            When you search, filter, or open a recipe, Chakula communicates directly with TheMealDB,
            a third-party recipe provider, to fetch recipe data and images. Requests are made from
            your browser to TheMealDB's public API. Only the search terms, filters, or recipe IDs you
            request are sent as part of these requests.
          </p>

          <h2>Third-party recipe provider</h2>
          <p>
            Recipe content, including names, images, ingredients, and instructions, is provided by
            TheMealDB. Chakula does not control or edit this content. Please review TheMealDB's own
            terms and privacy policy for how they handle data.
          </p>

          <h2>Contact</h2>
          <p>
            Chakula is provided as-is. If you have questions about this policy, contact the
            application operator directly.
          </p>
        </div>
      </section>
    </main>
  )
}

export default Privacy