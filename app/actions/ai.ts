'use server';

import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { furiganaTokenSchema } from '@/lib/types';

// 定義輸出的 JSON 結構 (Schema)
const vocabularySchema = z.object({
  reading: z.array(furiganaTokenSchema).describe('Array of tokens with character and its furigana reading'),
  meaning: z.string().describe('A concise Japanese definition (J-J) suitable for a native Japanese elementary school student (小学生).'),
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
    1. Break down the target into meaningful units (morphemes/words):
       - IMPORTANT: Keep katakana words together as ONE unit (e.g., "メダル", NOT "メ", "ダ", "ル")
       - Keep kanji characters separate (e.g., "金", "級")
       - Keep hiragana particles separate (e.g., "の", "を")
       - Group hiragana by meaning if they form a word
    2. For each unit:
       - "text": the character or word unit
       - "furigana": ONLY provide hiragana reading for KANJI characters.
                     MUST be null for hiragana, katakana, or any non-kanji characters.
    3. Provide a definition in Japanese (国語辞典 style). Keep it concise (1-2 sentences).
    4. Output ONLY Japanese. Do NOT output Chinese or English.
    5. The definition should be suitable for a native Japanese elementary school student (小学生).

    Example 1:
    Target: "後の祭り"
    Output:
    {
      "reading": [
        { "text": "後", "furigana": "あと" },
        { "text": "の", "furigana": null },
        { "text": "祭", "furigana": "まつ" },
        { "text": "り", "furigana": null }
      ],
      "meaning": "物事が終わった後で何かをしても手遅れであるという意味。"
    }

    Example 2:
    Target: "金メダル級"
    Output:
    {
      "reading": [
        { "text": "金", "furigana": "きん" },
        { "text": "メダル", "furigana": null },
        { "text": "級", "furigana": "きゅう" }
      ],
      "meaning": "金メダルを取るくらい、とてもすごいという意味。"
    }
  `.trim();

  try {
    const { object } = await generateObject({
      model: google('gemini-2.0-flash-exp'),
      schema: vocabularySchema,
      prompt: prompt,
      temperature: 0, // 0 = 最精確，不做創意發散
    });

    // Clean up: Remove furigana from non-kanji characters
    const cleanedReading = object.reading.map(token => {
      // If text is purely hiragana or katakana, force furigana to null
      const isKanaOnly = /^[\u3040-\u309F\u30A0-\u30FF]+$/.test(token.text);
      return {
        text: token.text,
        furigana: isKanaOnly ? null : token.furigana
      };
    });

    return {
      success: true,
      data: {
        ...object,
        reading: cleanedReading
      }
    };
  } catch (error) {
    console.error('AI Generation Failed:', error);
    // 回傳 null 讓前端知道失敗，轉為讓使用者手動輸入
    return { success: false, data: null };
  }
}
