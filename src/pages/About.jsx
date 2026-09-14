import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import Icon from '../components/Icon'
import { APP_VERSION } from '../config/app'

function About() {
  return (
    <main className="static-page">
      <PageHeader eyebrow="About" title="About Chakula">
        <p className="page-subtitle">
          Discover meals. Cook what you have. Eat a little better every day.
        </p>
      </PageHeader>
      <section className="container static-body">
        <div className="prose">
          <p>
            Chakula was built for anyone who stands in front of the fridge and thinks,
            "So... what's for dinner?" Whether you're stuck in a food rut, working with a
            nearly-empty pantry, or just curious what people eat around the world, Chakula gets
            you from craving to recipe in seconds.
          </p>

          <h2>What you can do</h2>
          <ul>
            <li>Search for meals by name or a single ingredient.</li>
            <li>Browse recipes by category, cuisine, or ingredient.</li>
            <li>Get a random meal when you can't decide.</li>
            <li>Build your own balanced meal plan from the foods you already have.</li>
            <li>Save meal plans and turn them into a shopping list.</li>
            <li>View complete recipes with ingredients, measurements, and instructions.</li>
          </ul>

          <h2>Recipe data</h2>
          <p>
            Recipes and images are provided through{' '}
            <a href="https://www.themealdb.com" target="_blank" rel="noopener noreferrer">
              TheMealDB
            </a>
            , a free, community-supported recipe database. Chakula shows recipes as provided by
            TheMealDB and credits their original sources where available.
          </p>

          <h2>Privacy by design</h2>
          <p>
            Chakula does not require an account and does not collect or transmit your personal data.
            Your meal plans, preferences, and shopping lists are stored only in your browser on your
            device. See the <Link to="/privacy">Privacy Policy</Link> for details.
          </p>

          <h2>Version</h2>
          <p>Chakula v{APP_VERSION} — a progressive web app built with React, Vite, and TheMealDB.</p>
        </div>
      </section>
    </main>
  )
}

export default About