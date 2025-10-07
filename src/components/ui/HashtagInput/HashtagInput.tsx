'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { HashtagUtils } from '@/utils/hashtagUtils';

interface HashtagInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  showSuggestions?: boolean;
  className?: string;
}

const HashtagInput: React.FC<HashtagInputProps> = ({
  value,
  onChange,
  placeholder = 'Write your review... Use #hashtags to categorize your content',
  maxLength = 1000,
  showSuggestions = true,
  className = '',
}) => {
  const [cursorPosition, setCursorPosition] = useState(0);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const hashtags = useMemo(() => HashtagUtils.extractHashtags(value), [value]);

  useEffect(() => {
    if (!showSuggestions) {
      setOpen(false);
      return;
    }
    const beforeCursor = value.substring(0, cursorPosition);
    const match = beforeCursor.match(/#[\w\u4e00-\u9fff\u3400-\u4dbf]*$/);
    if (match) {
      const partial = match[0].substring(1);
      const next = HashtagUtils.getSuggestedHashtags(value, hashtags)
        .filter((s) => s.toLowerCase().startsWith(partial.toLowerCase()))
        .slice(0, 6);
      setSuggestions(next);
      setOpen(next.length > 0);
    } else {
      setOpen(false);
    }
  }, [cursorPosition, hashtags, showSuggestions, value]);

  const insertSuggestion = (suggestion: string) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const before = value.substring(0, start);
    const after = value.substring(end);
    const match = before.match(/#[\w\u4e00-\u9fff\u3400-\u4dbf]*$/);
    if (!match) return;
    const tagStart = start - match[0].length;
    const newValue = value.substring(0, tagStart) + `#${suggestion} ` + after;
    onChange(newValue);
    setTimeout(() => {
      if (!textareaRef.current) return;
      const pos = tagStart + suggestion.length + 2;
      textareaRef.current.selectionStart = pos;
      textareaRef.current.selectionEnd = pos;
      textareaRef.current.focus();
    }, 0);
    setOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => {
          if (e.target.value.length <= maxLength) onChange(e.target.value);
        }}
        onSelect={() => setCursorPosition(textareaRef.current?.selectionStart || 0)}
        onKeyUp={() => setCursorPosition(textareaRef.current?.selectionStart || 0)}
        onClick={() => setCursorPosition(textareaRef.current?.selectionStart || 0)}
        placeholder={placeholder}
        rows={6}
        className="w-full p-3 border border-gray-300 rounded-lg resize-vertical focus:ring-2 focus:ring-[#E36B00] focus:border-transparent"
      />

      {/* Hashtag chips and counter */}
      <div className="flex justify-between items-center mt-2 text-sm text-gray-500">
        <div className="flex flex-wrap gap-2">
          {hashtags.map((h) => (
            <span key={h} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">#{h}</span>
          ))}
        </div>
        <span className={value.length > maxLength * 0.9 ? 'text-red-500' : ''}>
          {value.length}/{maxLength}
        </span>
      </div>

      {/* Suggestions */}
      {open && suggestions.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-44 overflow-y-auto">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => insertSuggestion(s)}
              className="w-full px-3 py-2 text-left hover:bg-gray-100"
            >
              #{s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default HashtagInput;


