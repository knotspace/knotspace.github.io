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
    popularity: z.number().int().min(0).default(0),
    heroImage: z.string().url().or(z.string().startsWith('/')).optional(),
  }),
});

export const collections = { blog };
