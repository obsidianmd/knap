'use client';

import { Copy } from 'lucide-react';
import { useState } from 'react';

export function CodeCopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
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
      <Copy aria-hidden="true" size={14} strokeWidth={1.75} />
    </button>
  );
}
