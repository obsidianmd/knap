'use client';

import { Check, Copy } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export function CodeCopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(resetTimer.current), []);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.clearTimeout(resetTimer.current);
      resetTimer.current = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      aria-label={copied ? 'Copied' : 'Copy code'}
      className="doc-code-copy"
      data-copied={copied || undefined}
      onClick={copyCode}
      title={copied ? 'Copied' : 'Copy code'}
      type="button"
    >
      {copied
        ? <Check aria-hidden="true" size={15} strokeWidth={2} />
        : <Copy aria-hidden="true" size={14} strokeWidth={1.75} />}
    </button>
  );
}
