import React from 'react';

export function renderWithRuby(
  sentence: string,
  target: string,
  reading: string
): React.ReactNode {
  if (!sentence || !target) return sentence;

  // 找到 target 第一次出現位置
  const index = sentence.indexOf(target);
  if (index === -1) return sentence;

  const before = sentence.slice(0, index);
  const after = sentence.slice(index + target.length);

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
