'use server';

import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';

// 定義輸出的 JSON 結構 (Schema)
const vocabularySchema = z.object({
  reading: z.string().describe('The hiragana reading of the target word. e.g. あとのまつり'),
  meaning: z.string().describe('A concise Japanese definition (J-J) suitable for a native high school student.'),
});

export async function generateEntry(content: string, focusedTerm?: string) {
  // 如果有 focusedTerm,針對它生成;如果沒有,針對整段 content 生成
  const target = focusedTerm || content;
  const contextLine = focusedTerm ? `Full Context: "${content}"` : 'Full Context: None (target is the complete input)';

  const prompt = `
    You are a Japanese dictionary assistant for "KOTO", a vocabulary app.

    Target: "${target}"
    ${contextLine}

    Instructions:
    1. Identify the reading (Furigana) of the target. If context is provided, use the correct reading for that context (handle homonyms).
    2. Provide a definition in Japanese (国語辞典 style). Keep it concise (1-2 sentences).
    3. Output ONLY Japanese. Do NOT output Chinese or English.
    4. The definition should be suitable for a native Japanese high school student.
  `.trim();

  try {
    const { object } = await generateObject({
      model: google('gemini-2.0-flash-exp'),
      schema: vocabularySchema,
      prompt: prompt,
      temperature: 0, // 0 = 最精確，不做創意發散
    });

    return { success: true, data: object };
  } catch (error) {
    console.error('AI Generation Failed:', error);
    // 回傳 null 讓前端知道失敗，轉為讓使用者手動輸入
    return { success: false, data: null };
  }
}
