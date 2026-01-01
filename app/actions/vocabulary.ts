'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export type VocabularyInput = {
  target: string;
  reading: string;
  meaning: string;
  sentence?: string;
};

export async function createVocab(data: VocabularyInput) {
  try {
    const vocab = await db.vocabulary.create({
      data: {
        target: data.target,
        reading: data.reading,
        meaning: data.meaning,
        sentence: data.sentence || '',
      },
    });
    revalidatePath('/');
    return { success: true, data: vocab };
  } catch (error) {
    console.error('Failed to create vocabulary:', error);
    return { success: false, error: 'Failed to create vocabulary' };
  }
}

export async function updateVocab(id: string, data: VocabularyInput) {
  try {
    const vocab = await db.vocabulary.update({
      where: { id },
      data: {
        target: data.target,
        reading: data.reading,
        meaning: data.meaning,
        sentence: data.sentence || '',
      },
    });
    revalidatePath('/');
    return { success: true, data: vocab };
  } catch (error) {
    console.error('Failed to update vocabulary:', error);
    return { success: false, error: 'Failed to update vocabulary' };
  }
}

export async function getVocabs() {
  try {
    const vocabs = await db.vocabulary.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: vocabs };
  } catch (error) {
    console.error('Failed to fetch vocabularies:', error);
    return { success: false, data: [] };
  }
}

export async function deleteVocab(id: string) {
  try {
    await db.vocabulary.delete({
      where: { id },
    });
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete vocabulary:', error);
    return { success: false, error: 'Failed to delete vocabulary' };
  }
}
