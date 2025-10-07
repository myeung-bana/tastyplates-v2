'use client';
import React from 'react';

interface HashtagDisplayProps {
  content: string;
  hashtags?: string[];
  className?: string;
  onClickHashtag?: (hashtag: string) => void;
}

const HashtagDisplay: React.FC<HashtagDisplayProps> = ({
  content,
  hashtags = [],
  className = '',
  onClickHashtag
}) => {
  const renderContentWithHashtags = (): string => {
    if (!content) return '';

    // If we have explicit hashtags, use them; otherwise, try to detect inline
    const tagsToUse = Array.isArray(hashtags) ? hashtags : [];

    let processed = content;
    const uniqueTags = Array.from(new Set(tagsToUse.filter(Boolean)));

    // Replace known hashtags in text with clickable spans
    uniqueTags.forEach((tag) => {
      const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`#${escaped}\\b`, 'gi');
      processed = processed.replace(
        regex,
        `<span class="hashtag-link" data-hashtag="${tag}">#${tag}</span>`
      );
    });

    // Also convert any remaining hashtag-like tokens to clickable spans
    processed = processed.replace(
      /#[\w\u4e00-\u9fff\u3400-\u4dbf]+/g,
      (match) => {
        const tag = match.substring(1).toLowerCase();
        return `<span class="hashtag-link" data-hashtag="${tag}">#${tag}</span>`;
      }
    );

    return processed;
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('hashtag-link')) {
      const tag = target.getAttribute('data-hashtag');
      if (tag) {
        if (onClickHashtag) {
          onClickHashtag(tag);
        } else if (typeof window !== 'undefined') {
          window.location.href = `/hashtag/${tag}`;
        }
      }
    }
  };

  return (
    <div
      className={className}
      onClick={handleClick}
      dangerouslySetInnerHTML={{ __html: renderContentWithHashtags() }}
    />
  );
};

export default HashtagDisplay;


