'use client';

import { useState } from 'react';
import { OmniBar } from '@/components/omni-bar';
import { VocabularyList } from '@/components/vocabulary-list';
import { StagingModal } from '@/components/staging-modal';
import { parseInput } from '@/lib/parser';
import type { Vocabulary } from '@/app/generated/prisma';

type HomePageProps = {
  initialVocabs: Vocabulary[];
};

export function HomePage({ initialVocabs }: HomePageProps) {
  const [vocabs, setVocabs] = useState<Vocabulary[]>(initialVocabs);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState<{
    target: string;
    reading?: string;
    sentence?: string;
  } | null>(null);
  const [editingVocab, setEditingVocab] = useState<Vocabulary | null>(null);

  // Refresh vocabs from server
  const refreshVocabs = async () => {
    const { getVocabs } = await import('@/app/actions/vocabulary');
    const result = await getVocabs();
    if (result.success) {
      setVocabs(result.data);
    }
  };

  // Handle Enter in Omni-Bar
  const handleOmniBarEnter = (forceCreate: boolean) => {
    const parsed = parseInput(searchQuery);

    // 情境 A: 無搜尋結果 → 打開 Modal 新增
    // 情境 B: 有結果 + forceCreate → 強制打開 Modal
    // 情境 C: 有結果 + 無 forceCreate → 聚焦第一筆 (編輯)

    const hasResults = vocabs.some(
      (v) =>
        v.target.includes(searchQuery) ||
        v.reading.includes(searchQuery) ||
        v.meaning.includes(searchQuery)
    );

    if (!hasResults || forceCreate) {
      // 打開新增 Modal
      setModalData(parsed);
      setEditingVocab(null);
      setIsModalOpen(true);
    } else {
      // 聚焦第一筆 (進入編輯模式)
      const firstResult = vocabs.find(
        (v) =>
          v.target.includes(searchQuery) ||
          v.reading.includes(searchQuery) ||
          v.meaning.includes(searchQuery)
      );
      if (firstResult) {
        handleCardClick(firstResult);
      }
    }
  };

  // Handle card click (進入編輯模式)
  const handleCardClick = (vocab: Vocabulary) => {
    setEditingVocab(vocab);
    setModalData(null);
    setIsModalOpen(true);
  };

  // Handle modal close
  const handleModalClose = () => {
    setIsModalOpen(false);
    setModalData(null);
    setEditingVocab(null);
    refreshVocabs();
    setSearchQuery(''); // 清空搜尋框
  };

  const hasResults = vocabs.some(
    (v) =>
      v.target.includes(searchQuery) ||
      v.reading.includes(searchQuery) ||
      v.meaning.includes(searchQuery)
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl p-6 space-y-6">
        <OmniBar
          value={searchQuery}
          onChange={setSearchQuery}
          onEnter={handleOmniBarEnter}
          hasResults={hasResults && searchQuery.trim().length > 0}
        />

        <VocabularyList
          vocabs={vocabs}
          searchQuery={searchQuery}
          onCardClick={handleCardClick}
        />

        <StagingModal
          open={isModalOpen}
          onClose={handleModalClose}
          initialData={modalData || undefined}
          editingVocab={editingVocab}
        />
      </div>
    </div>
  );
}
