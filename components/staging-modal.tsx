'use client';

import { useEffect, useState, useTransition, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Sparkles } from 'lucide-react';
import { generateEntry } from '@/app/actions/ai';
import { createVocab, updateVocab, deleteVocab } from '@/app/actions/vocabulary';
import type { Vocabulary } from '@/app/generated/prisma';

const vocabularySchema = z.object({
  content: z.string().min(1, '請輸入內容'),
  focusedTerm: z.string().optional(),
  reading: z.string().min(1, '請輸入讀音'),
  meaning: z.string().min(1, '請輸入釋義'),
});

type VocabularyForm = z.infer<typeof vocabularySchema>;

type StagingModalProps = {
  open: boolean;
  onClose: () => void;
  initialData?: {
    content: string;
    focusedTerm?: string;
    reading?: string;
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
  const [selectedText, setSelectedText] = useState('');
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const isEditMode = !!editingVocab;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<VocabularyForm>({
    resolver: zodResolver(vocabularySchema),
    defaultValues: editingVocab
      ? {
          content: editingVocab.content,
          focusedTerm: editingVocab.focusedTerm || '',
          reading: editingVocab.reading,
          meaning: editingVocab.meaning,
        }
      : {
          content: initialData?.content || '',
          focusedTerm: initialData?.focusedTerm || '',
          reading: initialData?.reading || '',
          meaning: '',
        },
  });

  const content = watch('content');

  // Update form when initialData changes (for new entries)
  useEffect(() => {
    if (!editingVocab && initialData) {
      setValue('content', initialData.content || '');
      setValue('focusedTerm', initialData.focusedTerm || '');
      setValue('reading', initialData.reading || '');
    }
  }, [initialData, editingVocab, setValue]);

  // 監聽文字選取
  const handleTextSelect = () => {
    if (!contentRef.current) return;

    const start = contentRef.current.selectionStart;
    const end = contentRef.current.selectionEnd;
    const selected = content.substring(start, end);

    if (selected.trim()) {
      setSelectedText(selected.trim());
      setValue('focusedTerm', selected.trim());
    } else {
      setSelectedText('');
      setValue('focusedTerm', '');
    }
  };

  // 處理 AI Auto-Fill
  const handleAiFill = async () => {
    const currentContent = watch('content');
    const currentFocused = watch('focusedTerm');

    if (!currentContent) return;

    setIsAiLoading(true);
    try {
      const result = await generateEntry(currentContent, currentFocused);
      if (result.success && result.data) {
        setValue('reading', result.data.reading);
        setValue('meaning', result.data.meaning);
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
  const onSubmit = (data: VocabularyForm) => {
    startTransition(async () => {
      try {
        if (isEditMode && editingVocab) {
          await updateVocab(editingVocab.id, {
            content: data.content,
            focusedTerm: data.focusedTerm,
            reading: data.reading,
            meaning: data.meaning,
          });
        } else {
          await createVocab({
            content: data.content,
            focusedTerm: data.focusedTerm,
            reading: data.reading,
            meaning: data.meaning,
          });
        }
        reset();
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

  // Keyboard shortcuts (ignore if IME is composing)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && !e.nativeEvent.isComposing) {
      onClose();
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSubmit(onSubmit)();
    }
  };

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open, reset]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent onKeyDown={handleKeyDown} className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? '編輯單字' : '新增單字'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* 完整內容 */}
          <div>
            <Label htmlFor="content">完整內容</Label>
            <Textarea
              id="content"
              ref={contentRef}
              {...register('content')}
              onSelect={handleTextSelect}
              placeholder="貼上句子、片語或單字..."
              className="min-h-20"
              autoFocus={!isEditMode}
            />
            {selectedText && (
              <div className="mt-2 text-xs text-muted-foreground">
                已選取重點字: <span className="text-primary font-bold">{selectedText}</span>
              </div>
            )}
            {errors.content && (
              <p className="text-xs text-destructive mt-1">{errors.content.message}</p>
            )}
          </div>

          {/* 隱藏的 focusedTerm */}
          <input type="hidden" {...register('focusedTerm')} />

          {/* 讀音 + AI 按鈕 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="reading">讀音</Label>
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
            <Input
              id="reading"
              {...register('reading')}
              placeholder="例: はる"
            />
            {errors.reading && (
              <p className="text-xs text-destructive mt-1">{errors.reading.message}</p>
            )}
          </div>

          {/* 釋義 */}
          <div>
            <Label htmlFor="meaning">釋義 (日日)</Label>
            <Textarea
              id="meaning"
              {...register('meaning')}
              placeholder="例: 季節の一つで、冬の次、夏の前の暖かい時期"
              className="min-h-20"
            />
            {errors.meaning && (
              <p className="text-xs text-destructive mt-1">{errors.meaning.message}</p>
            )}
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
