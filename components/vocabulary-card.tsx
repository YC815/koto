import { Card, CardContent } from '@/components/ui/card';
import { renderWithRuby } from '@/lib/ruby';
import type { Vocabulary } from '@/app/generated/prisma';

type VocabularyCardProps = {
  vocab: Vocabulary;
  onClick?: () => void;
};

export function VocabularyCard({ vocab, onClick }: VocabularyCardProps) {
  return (
    <Card
      className="cursor-pointer hover:bg-accent/50 transition-colors"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="space-y-2">
          <p className="text-base leading-relaxed">
            {renderWithRuby(vocab.content, vocab.focusedTerm, vocab.reading)}
          </p>
          <p className="text-sm text-muted-foreground">{vocab.meaning}</p>
        </div>
      </CardContent>
    </Card>
  );
}
