import { getCollection } from 'astro:content';

export async function GET(context) {
  const now = new Date();
  const posts = (await getCollection('blog'))
    .filter((post) => !post.data.aiGenerated && post.data.contentType !== 'trend' && (!post.data.publishAt || post.data.publishAt <= now))
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

  const site = context.site ?? new URL('https://knotspace.github.io');
  const feedUrl = new URL('rss.xml', site).href;
  const xmlEntities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' };
  const esc = (value = '') => String(value).replace(/[&<>"']/g, (char) => xmlEntities[char]);

  const items = posts.map((post) => {
    const url = new URL(`blog/${post.id}/`, site).href;
    return `<item>
      <title>${esc(post.data.title)}</title>
      <link>${esc(url)}</link>
      <guid isPermaLink="true">${esc(url)}</guid>
      <description>${esc(post.data.description)}</description>
      <category>${esc(post.data.category)}</category>
      <pubDate>${post.data.pubDate.toUTCString()}</pubDate>
    </item>`;
  }).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>KNOT｜Web制作・PCソフト・読書の個人ブログ</title>
    <link>${esc(site.href)}</link>
    <description>Web制作、PC・アプリ、本・読書、勉強など、日々の興味を記録するKNOTの個人ブログ。</description>
    <language>ja-JP</language>
    <atom:link href="${esc(feedUrl)}" rel="self" type="application/rss+xml" />
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <generator>Astro</generator>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600',
    },
  });
}
