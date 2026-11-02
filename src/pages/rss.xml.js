import { getCollection } from 'astro:content';
export async function GET(context) {
  const posts = (await getCollection('blog')).sort((a,b)=>b.data.pubDate.valueOf()-a.data.pubDate.valueOf());
  const site = context.site ?? new URL('https://knotspace.github.io');
  const esc = (s='') => String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&apos;');
  const items = posts.map(post => `<item><title>${esc(post.data.title)}</title><link>${new URL(`blog/${post.slug}/`,site)}</link><guid>${new URL(`blog/${post.slug}/`,site)}</guid><description>${esc(post.data.description)}</description><pubDate>${post.data.pubDate.toUTCString()}</pubDate></item>`).join('');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>KNOT</title><link>${site}</link><description>Web制作や日々の興味を記録する個人ブログ。</description><language>ja</language>${items}</channel></rss>`, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
