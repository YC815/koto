import React from 'react';

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
