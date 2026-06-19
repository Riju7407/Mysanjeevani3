'use client';

import { useMemo } from 'react';
import DOMPurify from 'dompurify';

interface SafeHTMLProps {
  html: string;
  className?: string;
  allowedTags?: string[];
  allowedAttributes?: Record<string, string[]>;
}

export default function SafeHTML({
  html,
  className = '',
  allowedTags = ['b', 'i', 'u', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'span'],
  allowedAttributes = {
    span: ['style'],
  },
}: SafeHTMLProps) {
  const sanitized = useMemo(() => {
    if (!html) return '';
    
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: allowedTags,
      ALLOWED_ATTR: Object.values(allowedAttributes).flat(),
      KEEP_CONTENT: true,
    });
  }, [html, allowedTags, allowedAttributes]);

  return (
    <div
      className={`prose prose-sm max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitized }}
      style={{
        wordBreak: 'break-word',
        overflowWrap: 'break-word',
      }}
    />
  );
}
