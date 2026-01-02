'use client';

import { useEffect, useState, useTransition } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FuriganaEditor } from '@/components/furigana-editor';
import { Trash2, Sparkles } from 'lucide-react';
import { generateEntry } from '@/app/actions/ai';
import { createVocab, updateVocab, deleteVocab } from '@/app/actions/vocabulary';
import type { Vocabulary } from '@/app/generated/prisma';
import type { FuriganaToken } from '@/lib/types';

type StagingModalProps = {
  open: boolean;
  onClose: () => void;
  initialData?: {
    content: string;
    focusedTerm?: string;
  };
  editingVocab?: Vocabulary | null;
};

export function StagingModal({
  open,
  onClose,
  initialData,
  editingVocab,
}: StagingModalProps) {
  const [isPending, startTransition] = useTransition();
  const [isAiLoading, setIsAiLoading] = useState(false);

  // State
  const [content, setContent] = useState('');
  const [focusedTerm, setFocusedTerm] = useState('');
  const [tokens, setTokens] = useState<FuriganaToken[]>([]);
  const [meaning, setMeaning] = useState('');

  const isEditMode = !!editingVocab;

  // 初始化 state (新增模式)
  useEffect(() => {
    if (!open) {
      // Modal 關閉時重置
      setContent('');
      setFocusedTerm('');
      setTokens([]);
      setMeaning('');
      return;
    }

    if (editingVocab) {
      // 編輯模式: 載入既有資料
      setContent(editingVocab.content);
      setFocusedTerm(editingVocab.focusedTerm || '');
      setMeaning(editingVocab.meaning);

      // 解析 reading JSON
      try {
        const parsedTokens = JSON.parse(editingVocab.reading);
        if (Array.isArray(parsedTokens)) {
          setTokens(parsedTokens);
        } else {
          setTokens([]);
        }
      } catch {
        // 舊格式 (純文字): 留空，提示使用者點 AI 填寫
        setTokens([]);
      }
    } else if (initialData) {
      // 新增模式 + 有初始資料
      setContent(initialData.content || '');
      setFocusedTerm(initialData.focusedTerm || '');
      setTokens([]);
      setMeaning('');
    }
  }, [open, editingVocab, initialData]);

  // 處理 Textarea 選取
  const handleTextSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    const selected = target.value.substring(
      target.selectionStart,
      target.selectionEnd
    );
    if (selected.trim()) {
      setFocusedTerm(selected);
    }
  };

  // 處理 AI Auto-Fill
  const handleAiFill = async () => {
    if (!content) return;

    setIsAiLoading(true);
    try {
      const result = await generateEntry(content, focusedTerm);
      if (result.success && result.data) {
        setTokens(result.data.reading);
        setMeaning(result.data.meaning);
      } else {
        alert('AI 生成失敗，請手動輸入');
      }
    } catch (error) {
      console.error('AI generation error:', error);
      alert('AI 生成失敗，請手動輸入');
    } finally {
      setIsAiLoading(false);
    }
  };

  // 提交表單
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 驗證
    if (!content.trim()) {
      alert('請輸入內容');
      return;
    }
    if (tokens.length === 0) {
      alert('請先點擊「AI 填寫」標注讀音');
      return;
    }
    if (!meaning.trim()) {
      alert('請輸入釋義');
      return;
    }

    startTransition(async () => {
      try {
        const data = {
          content,
          focusedTerm,
          reading: JSON.stringify(tokens),
          meaning,
        };

        if (isEditMode && editingVocab) {
          await updateVocab(editingVocab.id, data);
        } else {
          await createVocab(data);
        }

        onClose();
      } catch (error) {
        console.error('Failed to save vocabulary:', error);
        alert('儲存失敗');
      }
    });
  };

  // 刪除單字
  const handleDelete = () => {
    if (!editingVocab) return;
    if (!confirm('確定要刪除這個單字嗎？')) return;

    startTransition(async () => {
      try {
        await deleteVocab(editingVocab.id);
        onClose();
      } catch (error) {
        console.error('Failed to delete vocabulary:', error);
        alert('刪除失敗');
      }
    });
  };

  // Keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && !e.nativeEvent.isComposing) {
      onClose();
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && !e.nativeEvent.isComposing) {
      e.preventDefault();
      onSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent onKeyDown={handleKeyDown} className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? '編輯單字' : '新增單字'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* 完整內容 */}
          <div>
            <Label htmlFor="content">完整內容</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onSelect={handleTextSelect}
              placeholder="例: 金メダル級"
              className="min-h-20"
              autoFocus={!isEditMode}
            />
            {focusedTerm && (
              <div className="mt-2 text-xs text-muted-foreground">
                已選取重點字: <span className="text-primary font-bold">{focusedTerm}</span>
              </div>
            )}
          </div>

          {/* 讀音標注 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>讀音標注</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleAiFill}
                disabled={!content || isAiLoading}
                className="h-7 text-xs"
              >
                <Sparkles className="h-3 w-3 mr-1" />
                {isAiLoading ? '生成中...' : 'AI 填寫'}
              </Button>
            </div>

            <FuriganaEditor tokens={tokens} onChange={setTokens} />
          </div>

          {/* 釋義 */}
          <div>
            <Label htmlFor="meaning">釋義 (日日)</Label>
            <Textarea
              id="meaning"
              value={meaning}
              onChange={(e) => setMeaning(e.target.value)}
              placeholder="例: 金メダルを取るくらい、とてもすごいという意味。"
              className="min-h-20"
            />
          </div>

          <DialogFooter className="flex justify-between items-center">
            {isEditMode && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={isPending}
                className="mr-auto"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                刪除
              </Button>
            )}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isPending}
              >
                取消
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? '儲存中...'
                  : isEditMode
                  ? '更新'
                  : '新增'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
