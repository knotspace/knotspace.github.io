
import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    category: z.string().default('BLOG'),
    heroImage: z.string().url().or(z.string().startsWith('/')).optional(),
  }),
});

export const collections = { blog };
