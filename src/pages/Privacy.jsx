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
            use Pikawise. Scroll, search, and cook.
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
            <li>
              <strong>Meal reminders</strong> — your reminder times, days, and quiet hours, plus a
              record of which reminders have already fired, so you are not notified twice.
            </li>
          </ul>
          <p>
            This data stays on your device. It isn't sent to Pikawise or to any third party, and you
            can remove it any time from Settings → My Stuff.
          </p>

          <h2 id="cookies">Cookies</h2>
          <p>
            Pikawise uses a few essential cookies to remember your choices on this device — never to
            track you. These cookies keep your meal plans, preferences, and shopping lists in place,
            and service worker caches keep the app working offline. The first time you visit, we show
            a short cookie notice so you know what's going on.
          </p>
          <p>
            We don't use advertising cookies, analytics trackers, or anything that can identify you
            across websites. Clearing your browser data, or removing the app, wipes everything
            Pikawise saved.
          </p>

          <h2>Notifications</h2>
          <p>
            Meal reminders are optional and off by default. If you turn them on, Pikawise asks your
            browser for permission to show notifications. Notifications are generated on your device
            from your own settings and the recipe data already on your device; no reminder details
            are sent to Pikawise or anyone else. You can turn reminders off at any time in Settings.
          </p>

          <h2>Recipe data requests</h2>
          <p>
            When you search, filter, or open a recipe, Pikawise fetches recipe data and images from a
            third-party recipe service. These requests are made directly from your browser and include
            only the search terms, filters, or recipe IDs you choose to request.
          </p>

          <h2>Third-party recipe content</h2>
          <p>
            Recipe content, including names, images, ingredients, and instructions, is provided by
            third-party recipe sources. Pikawise does not author, control, or edit this content, and
            does not claim ownership of it. Please refer to the original source&apos;s own terms for
            how their content may be used.
          </p>

          <h2>Contact</h2>
          <p>
            Pikawise is provided as-is. If you have questions about this policy, contact the
            application operator directly.
          </p>
        </div>
      </section>
    </main>
  )
}

export default Privacy