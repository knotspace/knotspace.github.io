import { getCollection } from 'astro:content';

export async function GET({ site }) {
  const now = new Date();
  const posts = (await getCollection('blog')).filter(post => !post.data.publishAt || post.data.publishAt <= now);
  const staticPaths = ['', 'blog/', 'about/'];
  const urls = [
    ...staticPaths.map((path) => ({ loc: new URL(path, site).href })),
    ...posts.map((post) => ({
      loc: new URL(`/blog/${post.slug}/`, site).href,
      lastmod: (post.data.updatedDate ?? post.data.pubDate).toISOString(),
    })),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(({ loc, lastmod }) => `<url><loc>${loc}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}</url>`).join('')}</urlset>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
