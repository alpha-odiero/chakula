import { useEffect } from 'react'
import {
  APP_DESCRIPTION,
  APP_OG_IMAGE,
  APP_OG_IMAGE_ALT,
  APP_TITLE,
  SITE_URL
} from '../config/app'

const DEFAULT_ROBOTS =
  'index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1'

function upsertMeta(attribute, key, content) {
  if (!content) return
  let element = document.head.querySelector(`meta[${attribute}="${key}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.appendChild(element)
  }
  element.setAttribute('content', content)
}

function upsertCanonical(href) {
  let link = document.head.querySelector('link[rel="canonical"]')
  if (!link) {
    link = document.createElement('link')
    link.rel = 'canonical'
    document.head.appendChild(link)
  }
  link.setAttribute('href', href)
}

function toAbsolute(value, fallback = '') {
  const target = value || fallback
  if (!target) return ''
  return /^https?:\/\//i.test(target) ? target : new URL(target, SITE_URL).href
}

function writeJsonLd(data) {
  const existing = document.getElementById('seo-page-jsonld')
  if (existing) existing.remove()
  if (!data) return null
  const script = document.createElement('script')
  script.type = 'application/ld+json'
  script.id = 'seo-page-jsonld'
  script.textContent = JSON.stringify(data)
  document.head.appendChild(script)
  return script
}

/**
 * Keeps the document head in sync with the current page. Every route should
 * call this so titles, descriptions, canonical URLs, social cards and
 * structured data follow client-side navigation.
 */
export function useSeo({
  title = APP_TITLE,
  description = APP_DESCRIPTION,
  path = '/',
  image = APP_OG_IMAGE,
  imageAlt = APP_OG_IMAGE_ALT,
  type = 'website',
  robots = DEFAULT_ROBOTS,
  jsonLd = null
} = {}) {
  const serializedJsonLd = jsonLd ? JSON.stringify(jsonLd) : ''

  useEffect(() => {
    const canonical = new URL(path, SITE_URL).href
    const socialImage = toAbsolute(image, APP_OG_IMAGE)

    document.title = title
    upsertMeta('name', 'description', description)
    upsertMeta('name', 'robots', robots)
    upsertCanonical(canonical)

    upsertMeta('property', 'og:title', title)
    upsertMeta('property', 'og:description', description)
    upsertMeta('property', 'og:url', canonical)
    upsertMeta('property', 'og:type', type)
    upsertMeta('property', 'og:image', socialImage)
    upsertMeta('property', 'og:image:alt', imageAlt)

    upsertMeta('name', 'twitter:title', title)
    upsertMeta('name', 'twitter:description', description)
    upsertMeta('name', 'twitter:image', socialImage)
    upsertMeta('name', 'twitter:image:alt', imageAlt)
    upsertMeta('name', 'twitter:card', 'summary_large_image')

    const script = writeJsonLd(serializedJsonLd ? JSON.parse(serializedJsonLd) : null)

    return () => {
      document.title = APP_TITLE
      upsertMeta('name', 'description', APP_DESCRIPTION)
      upsertMeta('name', 'robots', DEFAULT_ROBOTS)
      upsertCanonical(new URL('/', SITE_URL).href)
      upsertMeta('property', 'og:title', APP_TITLE)
      upsertMeta('property', 'og:description', APP_DESCRIPTION)
      upsertMeta('property', 'og:url', new URL('/', SITE_URL).href)
      upsertMeta('property', 'og:type', 'website')
      upsertMeta('property', 'og:image', APP_OG_IMAGE)
      upsertMeta('property', 'og:image:alt', APP_OG_IMAGE_ALT)
      upsertMeta('name', 'twitter:title', APP_TITLE)
      upsertMeta('name', 'twitter:description', APP_DESCRIPTION)
      upsertMeta('name', 'twitter:image', APP_OG_IMAGE)
      upsertMeta('name', 'twitter:image:alt', APP_OG_IMAGE_ALT)
      if (script && script.isConnected) script.remove()
    }
  }, [title, description, path, image, imageAlt, type, robots, serializedJsonLd])
}
