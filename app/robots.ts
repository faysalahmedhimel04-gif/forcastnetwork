import type { MetadataRoute } from 'next'

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://forcastnetwork.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard', '/create', '/profile', '/login', '/signup'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
