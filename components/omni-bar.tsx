'use client';

import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

type OmniBarProps = {
  value: string;
  onChange: (value: string) => void;
  onEnter: (forceCreate: boolean) => void;
  hasResults: boolean;
};

export function OmniBar({ value, onChange, onEnter, hasResults }: OmniBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [showHint, setShowHint] = useState(false);

  // CMD+K to focus
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const forceCreate = e.shiftKey || e.metaKey || e.ctrlKey;
      onEnter(forceCreate);
      setShowHint(false);
    }
  };

  // Show hint when has results
  useEffect(() => {
    if (hasResults && value.trim().length > 0) {
      setShowHint(true);
    } else {
      setShowHint(false);
    }
  }, [hasResults, value]);

  return (
    <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b pb-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="搜尋或新增單字... (CMD+K)"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="pl-10 h-12 text-base"
          autoFocus
        />
      </div>

      {showHint && (
        <div className="mt-2 text-xs text-muted-foreground text-center">
          <span className="inline-flex items-center gap-1">
            按 <kbd className="px-1.5 py-0.5 bg-muted rounded border">Enter</kbd> 檢視
            第一筆 | 按{' '}
            <kbd className="px-1.5 py-0.5 bg-muted rounded border">Shift+Enter</kbd>{' '}
            強制新增
          </span>
        </div>
      )}
    </div>
  );
}
