'use client';

import { useMemo } from 'react';
import Fuse from 'fuse.js';
import { VocabularyCard } from './vocabulary-card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Vocabulary } from '@/app/generated/prisma';

type VocabularyListProps = {
  vocabs: Vocabulary[];
  searchQuery: string;
  onCardClick?: (vocab: Vocabulary) => void;
  isLoading?: boolean;
};

export function VocabularyList({
  vocabs,
  searchQuery,
  onCardClick,
  isLoading = false,
}: VocabularyListProps) {
  const fuse = useMemo(
    () =>
      new Fuse(vocabs, {
        keys: ['target', 'reading', 'meaning'],
        threshold: 0.3,
        ignoreLocation: true,
      }),
    [vocabs]
  );

  const filtered = useMemo(() => {
    if (!searchQuery || searchQuery.trim() === '') return vocabs;
    return fuse.search(searchQuery).map((r) => r.item);
  }, [fuse, searchQuery, vocabs]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (filtered.length === 0 && searchQuery) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>找不到符合「{searchQuery}」的單字</p>
        <p className="text-sm mt-2">按下 Enter 來新增此單字</p>
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>還沒有任何單字</p>
        <p className="text-sm mt-2">在上方輸入框輸入單字並按 Enter 開始記錄</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {filtered.map((vocab) => (
        <VocabularyCard
          key={vocab.id}
          vocab={vocab}
          onClick={() => onCardClick?.(vocab)}
        />
      ))}
    </div>
  );
}
