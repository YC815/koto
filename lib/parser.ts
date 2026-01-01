export function parseInput(text: string): {
  target: string;
  reading?: string;
  sentence?: string;
} {
  // Pattern 1: "...text...[target]...more text..." → extract bracketed word as target, whole text as sentence
  const bracketInSentenceMatch = text.match(/(.+)\[(.+?)\](.+)/);
  if (bracketInSentenceMatch) {
    const before = bracketInSentenceMatch[1];
    const target = bracketInSentenceMatch[2];
    const after = bracketInSentenceMatch[3];
    return {
      target: target.trim(),
      sentence: (before + target + after).trim(),
    };
  }

  // Pattern 2: "target[reading]" → extract both target and reading
  const bracketMatch = text.match(/^(.+?)\[(.+?)\]$/);
  if (bracketMatch) {
    return {
      target: bracketMatch[1].trim(),
      reading: bracketMatch[2].trim(),
    };
  }

  // Pattern 3: Pure text "target" → just target
  return {
    target: text.trim(),
  };
}
