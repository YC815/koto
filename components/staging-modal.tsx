'use client';

import { useEffect, useState, useTransition } from 'react';
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
import { Trash2, Sparkles } from 'lucide-react';
import { generateEntry } from '@/app/actions/ai';
import { createVocab, updateVocab, deleteVocab } from '@/app/actions/vocabulary';
import type { Vocabulary } from '@/app/generated/prisma';

const vocabularySchema = z.object({
  target: z.string().min(1, '請輸入單字'),
  reading: z.string().min(1, '請輸入讀音'),
  meaning: z.string().min(1, '請輸入釋義'),
  sentence: z.string().optional(),
});

type VocabularyForm = z.infer<typeof vocabularySchema>;

type StagingModalProps = {
  open: boolean;
  onClose: () => void;
  initialData?: {
    target: string;
    reading?: string;
    sentence?: string;
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
          target: editingVocab.target,
          reading: editingVocab.reading,
          meaning: editingVocab.meaning,
          sentence: editingVocab.sentence || '',
        }
      : {
          target: initialData?.target || '',
          reading: initialData?.reading || '',
          meaning: '',
          sentence: initialData?.sentence || '',
        },
  });

  const target = watch('target');
  const sentence = watch('sentence');

  // Update form when initialData changes (for new entries)
  useEffect(() => {
    if (!editingVocab && initialData) {
      setValue('target', initialData.target || '');
      setValue('reading', initialData.reading || '');
      setValue('sentence', initialData.sentence || '');
    }
  }, [initialData, editingVocab, setValue]);

  // 處理 AI Auto-Fill
  const handleAiFill = async () => {
    if (!target) return;

    setIsAiLoading(true);
    try {
      const result = await generateEntry(target, sentence);
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
            target: data.target,
            reading: data.reading,
            meaning: data.meaning,
            sentence: data.sentence,
          });
        } else {
          await createVocab({
            target: data.target,
            reading: data.reading,
            meaning: data.meaning,
            sentence: data.sentence,
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
          {/* Sentence Preview (如果有的話) */}
          {sentence && (
            <div className="bg-accent/30 p-3 rounded-md">
              <Label className="text-xs text-muted-foreground">例句</Label>
              <p className="text-sm mt-1">
                {sentence.split(target).map((part, i, arr) => (
                  <span key={i}>
                    {part}
                    {i < arr.length - 1 && (
                      <span className="bg-primary/20 text-primary font-bold px-1 rounded">
                        {target}
                      </span>
                    )}
                  </span>
                ))}
              </p>
            </div>
          )}

          {/* Target */}
          <div>
            <Label htmlFor="target">單字</Label>
            <Input
              id="target"
              {...register('target')}
              placeholder="例: 春"
              autoFocus={!isEditMode}
            />
            {errors.target && (
              <p className="text-xs text-destructive mt-1">{errors.target.message}</p>
            )}
          </div>

          {/* Reading */}
          <div>
            <Label htmlFor="reading">讀音</Label>
            <Input
              id="reading"
              {...register('reading')}
              placeholder="例: はる"
            />
            {errors.reading && (
              <p className="text-xs text-destructive mt-1">{errors.reading.message}</p>
            )}
          </div>

          {/* Meaning */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="meaning">釋義 (日日)</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleAiFill}
                disabled={!target || isAiLoading}
                className="h-7 text-xs"
              >
                <Sparkles className="h-3 w-3 mr-1" />
                {isAiLoading ? '生成中...' : 'AI 填寫'}
              </Button>
            </div>
            <textarea
              id="meaning"
              {...register('meaning')}
              placeholder="例: 季節の一つで、冬の次、夏の前の暖かい時期"
              className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
            {errors.meaning && (
              <p className="text-xs text-destructive mt-1">{errors.meaning.message}</p>
            )}
          </div>

          {/* Sentence (hidden input for editing) */}
          {!isEditMode && (
            <input type="hidden" {...register('sentence')} />
          )}

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
