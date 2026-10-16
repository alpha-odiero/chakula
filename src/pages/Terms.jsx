import PageHeader from '../components/PageHeader'

function Terms() {
  return (
    <main className="static-page">
      <PageHeader eyebrow="Terms" title="Terms" />
      <section className="container static-body">
        <div className="prose">
          <h2>About this application</h2>
          <p>
            Pikawise is a meal discovery application. By using Pikawise, you agree to these terms. If
            you do not agree, please do not use the application.
          </p>

          <h2>Use of the service</h2>
          <p>
            Pikawise is provided for personal, non-commercial use. You may use it to discover meals,
            view recipes, and save meal plans on your device. Please don't misuse the service or try
            to disrupt it for others.
          </p>

          <h2>Recipe content</h2>
          <p>
            Recipe content displayed in Pikawise may be provided by third parties, including
            TheMealDB. Pikawise does not author, verify, or guarantee this content. Recipes are shown
            for inspiration and should be prepared with care.
          </p>

          <h2>Ingredients and allergens</h2>
          <p>
            You are responsible for verifying that a recipe is safe and suitable for you,
            including checking ingredients, allergens, and preparation times. Do not rely solely on
            the information shown in the application.
          </p>

          <h2>Not medical or nutritional advice</h2>
          <p>
            Pikawise is not a medical, dietary, or nutritional advisory service. The information it
            displays is general recipe content, not personalized guidance. Consult a qualified
            professional for medical or dietary questions.
          </p>

          <h2>Availability</h2>
          <p>
            Pikawise depends on third-party services, including TheMealDB. Recipes may be
            unavailable at times, and the application may be offline. The application is provided
            "as is" and "as available" without warranties of any kind.
          </p>

          <h2>Changes</h2>
          <p>
            These terms may be updated from time to time. Continued use of Pikawise after changes
            means you accept the updated terms.
          </p>
        </div>
      </section>
    </main>
  )
}

export default Terms