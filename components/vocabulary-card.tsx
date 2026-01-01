import { Card, CardContent } from '@/components/ui/card';
import { renderWithRuby } from '@/lib/ruby';
import type { Vocabulary } from '@/app/generated/prisma';

type VocabularyCardProps = {
  vocab: Vocabulary;
  onClick?: () => void;
};

export function VocabularyCard({ vocab, onClick }: VocabularyCardProps) {
  const hasSentence = vocab.sentence && vocab.sentence.trim().length > 0;

  return (
    <Card
      className="cursor-pointer hover:bg-accent/50 transition-colors"
      onClick={onClick}
    >
      <CardContent className="p-4">
        {hasSentence ? (
          // Case 1: 有例句 - 顯示完整句子，標註 ruby tag
          <div className="space-y-2">
            <p className="text-base leading-relaxed">
              {renderWithRuby(vocab.sentence, vocab.target, vocab.reading)}
            </p>
            <p className="text-sm text-muted-foreground">{vocab.meaning}</p>
          </div>
        ) : (
          // Case 2: 純單字 - 置中顯示，furigana 在上方
          <div className="flex flex-col items-center justify-center space-y-2 py-2">
            <ruby className="text-3xl font-bold text-primary">
              {vocab.target}
              <rt className="text-sm">{vocab.reading}</rt>
            </ruby>
            <p className="text-sm text-muted-foreground text-center">
              {vocab.meaning}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
