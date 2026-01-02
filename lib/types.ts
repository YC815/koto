import { z } from 'zod';

export const furiganaTokenSchema = z.object({
  text: z.string(),
  furigana: z.string().nullable(),
});

export type FuriganaToken = z.infer<typeof furiganaTokenSchema>;
