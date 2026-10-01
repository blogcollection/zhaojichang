import type { APIRoute } from 'astro';
import { getAirports } from '../data/airports';
import { getArticles } from '../data/articles';

export const GET: APIRoute = async () => {
  const siteUrl = 'https://zhaojichang.cyou';
  const airports = getAirports();
  const articles = getArticles();

  const staticRoutes = [
    { url: '/', priority: '1.0', changefreq: 'daily' },
    { url: '/airports/', priority: '0.9', changefreq: 'daily' },
    { url: '/cheap-airports/', priority: '0.9', changefreq: 'weekly' },
    { url: '/monthly-airports/', priority: '0.9', changefreq: 'weekly' },
    { url: '/clash-airports/', priority: '0.9', changefreq: 'weekly' },
    { url: '/shadowrocket-airports/', priority: '0.9', changefreq: 'weekly' },
    { url: '/chatgpt-airports/', priority: '0.9', changefreq: 'weekly' },
    { url: '/netflix-airports/', priority: '0.9', changefreq: 'weekly' },
    { url: '/gaming-airports/', priority: '0.9', changefreq: 'weekly' },
    { url: '/nodes/hong-kong/', priority: '0.8', changefreq: 'weekly' },
    { url: '/nodes/japan/', priority: '0.8', changefreq: 'weekly' },
    { url: '/nodes/singapore/', priority: '0.8', changefreq: 'weekly' },
    { url: '/nodes/us/', priority: '0.8', changefreq: 'weekly' },
    { url: '/nodes/taiwan/', priority: '0.8', changefreq: 'weekly' },
    { url: '/nodes/korea/', priority: '0.8', changefreq: 'weekly' },
    { url: '/blog/', priority: '0.9', changefreq: 'daily' },
  ];

  const airportRoutes = airports.map((a) => ({
    url: `/airport/${a.slug}/`,
    priority: '0.8',
    changefreq: 'weekly',
    lastmod: a.lastChecked || '2026-09-30',
  }));

  const articleRoutes = articles.map((art) => ({
    url: `/blog/${art.slug}/`,
    priority: '0.8',
    changefreq: 'monthly',
    lastmod: art.publishDate,
  }));

  const allUrls = [...staticRoutes, ...airportRoutes, ...articleRoutes];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
  .map(
    (item) => `  <url>
    <loc>${siteUrl}${item.url}</loc>
    <lastmod>${(item as any).lastmod || '2026-09-30'}</lastmod>
    <changefreq>${item.changefreq}</changefreq>
    <priority>${item.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
};
