import type { MetadataRoute } from 'next'

// Use your production domain. You can also set NEXT_PUBLIC_SITE_URL in your hosting platform.
const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://forcastnetwork.com'

export default function sitemap(): MetadataRoute.Sitemap {
  // Static routes (public pages)
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/forecasts`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/leaderboard`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/analysts`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/signup`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]

  // Note: Dynamic routes (/forecasts/[id], /analysts/[username]) are discovered by crawlers
  // or can be added later via generateSitemaps() once you have a way to list public content.

  return staticRoutes
}
