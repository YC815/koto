import React from 'react';
import type { FuriganaToken } from './types';

export function renderWithRuby(
  content: string,
  focusedTerm: string,
  reading: string
): React.ReactNode {
  if (!content) return null;

  // 如果沒有 focusedTerm,整段都是 focusedTerm
  const target = focusedTerm || content;

  // 找到 target 第一次出現位置
  const index = content.indexOf(target);
  if (index === -1) return content; // 資料異常時的降級處理

  const before = content.slice(0, index);
  const after = content.slice(index + target.length);

  // 嘗試解析為新格式 (FuriganaToken[])
  try {
    const tokens: FuriganaToken[] = JSON.parse(reading);
    if (Array.isArray(tokens) && tokens.length > 0) {
      return (
        <>
          {before}
          {tokens.map((token, i) =>
            token.furigana ? (
              <ruby key={i} className="text-primary font-bold">
                {token.text}
                <rt className="text-xs">{token.furigana}</rt>
              </ruby>
            ) : (
              <span key={i} className="text-primary font-bold">
                {token.text}
              </span>
            )
          )}
          {after}
        </>
      );
    }
  } catch {
    // Fallback to old format (不拋出錯誤,靜默降級)
  }

  // 舊格式 (保持不變,向後相容)
  return (
    <>
      {before}
      <ruby className="text-primary font-bold">
        {target}
        <rt className="text-xs">{reading}</rt>
      </ruby>
      {after}
    </>
  );
}
