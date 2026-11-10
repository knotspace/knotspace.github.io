import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    publishAt: z.coerce.date().optional(),
    updatedDate: z.coerce.date().optional(),
    category: z.string().default('BLOG'),
    contentType: z.enum(['article', 'trend']).optional(),
    aiGenerated: z.boolean().default(false),
    popularity: z.number().int().min(0).default(0),
    heroImage: z.string().url().or(z.string().startsWith('/')).optional(),
    blocks: z.array(z.any()).optional(),
  }).refine((post) => post.contentType !== 'trend' || post.aiGenerated, {
    message: 'Trend posts must set aiGenerated: true so they are disclosed and listed in News.',
  }),
});


const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date().optional(),
    updatedDate: z.coerce.date().optional(),
    heroImage: z.string().url().or(z.string().startsWith('/')).optional(),
    noindex: z.boolean().default(false),
    blocks: z.array(z.any()).optional(),
  }),
});

export const collections = { blog, pages };
