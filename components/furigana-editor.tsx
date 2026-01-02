'use client';

import { Input } from '@/components/ui/input';
import type { FuriganaToken } from '@/lib/types';

type FuriganaEditorProps = {
  tokens: FuriganaToken[];
  onChange: (tokens: FuriganaToken[]) => void;
};

export function FuriganaEditor({ tokens, onChange }: FuriganaEditorProps) {
  const handleChange = (index: number, value: string) => {
    const newTokens = [...tokens];
    newTokens[index].furigana = value || null;
    onChange(newTokens);
  };

  if (tokens.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-4 text-center">
        點擊「AI 填寫」自動標注讀音
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2 py-4 px-2 border rounded-md bg-muted/30">
      {tokens.map((token, i) =>
        token.furigana !== null ? (
          // 漢字: 上方 input + 下方大字
          <div key={i} className="inline-flex flex-col items-center gap-1">
            <Input
              value={token.furigana || ''}
              onChange={(e) => handleChange(i, e.target.value)}
              className="w-16 h-7 text-xs text-center px-1"
              placeholder="よみ"
            />
            <span className="text-3xl font-bold text-primary">{token.text}</span>
          </div>
        ) : (
          // 假名/片假名: 直接顯示
          <span key={i} className="text-3xl self-end pb-1">
            {token.text}
          </span>
        )
      )}
    </div>
  );
}
