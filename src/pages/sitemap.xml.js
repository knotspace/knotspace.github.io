import { getCollection } from 'astro:content';

const escapeXml = (value) => String(value).replace(/[<>&"']/g, (character) => ({
  '<': '&lt;',
  '>': '&gt;',
  '&': '&amp;',
  '"': '&quot;',
  "'": '&apos;',
})[character]);

export async function GET({ site }) {
  const now = new Date();
  const posts = (await getCollection('blog'))
    .filter((post) => !post.data.publishAt || post.data.publishAt <= now)
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

  // Public, indexable routes only. Account, bookmarks, editor, and error pages are excluded.
  const staticPaths = [
    '/',
    '/about/',
    '/blog/',
    '/study/',
    '/study/foundation/',
    '/study/kosen/',
    '/study/mock/',
    '/study/quotes/',
    '/study/solve/',
    '/study/summary/',
    '/study/summary/biology/',
    '/study/summary/chemistry/',
    '/study/summary/civics/',
    '/study/summary/earth/',
    '/study/summary/geography/',
    '/study/summary/history/',
    '/study/summary/physics/',
    '/study/tools/',
    '/study/university/',
    '/study/why/',
    '/timer/',
  ];

  const urls = [
    ...staticPaths.map((path) => ({ loc: new URL(path, site).href })),
    ...posts.map((post) => ({
      loc: new URL(`/blog/${post.id}/`, site).href,
      lastmod: (post.data.updatedDate ?? post.data.pubDate).toISOString(),
      image: post.data.heroImage ? new URL(post.data.heroImage, site).href : null,
    })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">${urls.map(({ loc, lastmod, image }) => `
  <url>
    <loc>${escapeXml(loc)}</loc>
    ${lastmod ? `<lastmod>${escapeXml(lastmod)}</lastmod>` : ''}
    ${image ? `<image:image><image:loc>${escapeXml(image)}</image:loc></image:image>` : ''}
  </url>`).join('')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600',
    },
  });
}
