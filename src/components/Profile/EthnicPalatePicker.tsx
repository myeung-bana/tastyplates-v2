"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Key } from "@react-types/shared";
import { FiGlobe, FiX } from "react-icons/fi";
import type { CuisineOption } from "@/utils/cuisineUtils";
import { findCuisineOptionByKey } from "@/utils/cuisineUtils";
import "@/styles/components/cuisine-filter.scss";
import "@/styles/components/_ethnic-palate-picker.scss";
import { useHaptic } from "@/hooks/useHaptic";
import { cn } from "@/lib/utils";

const CHILD_PILL_BASE =
  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border bg-white text-gray-600 border-gray-200 hover:border-gray-300 font-neusans";
const CHILD_PILL_ACTIVE =
  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border bg-[#ff7c0a] border-[#ff7c0a] font-neusans text-white [&_span]:text-white";
const FOOTER_RESET =
  "flex-1 flex items-center justify-center gap-2 px-6 py-2.5 bg-white border border-gray-300 rounded-[50px] hover:bg-gray-50 transition-colors font-normal text-sm font-neusans cursor-pointer";
const FOOTER_APPLY =
  "flex-1 flex items-center justify-center gap-2 px-6 py-2.5 bg-[#ff7c0a] border border-[#ff7c0a] text-white rounded-[50px] hover:bg-[#e66d08] transition-colors font-normal text-sm font-neusans cursor-pointer";

const CLOSE_ANIM_MS = 520;

type EthnicPalatePickerProps = {
  cuisineOptions: CuisineOption[];
  value: Set<Key>;
  onChange: (keys: Set<Key>) => void;
  maxSelections: number;
  disabled?: boolean;
  loading?: boolean;
  error?: string | null;
};

function labelsForKeys(options: CuisineOption[], keys: Set<Key>): string[] {
  const out: string[] = [];
  keys.forEach((k) => {
    const opt = findCuisineOptionByKey(options, String(k));
    if (opt?.label) out.push(opt.label);
  });
  return out;
}

export default function EthnicPalatePicker({
  cuisineOptions,
  value,
  onChange,
  maxSelections,
  disabled = false,
  loading = false,
  error,
}: EthnicPalatePickerProps) {
  const [mounted, setMounted] = useState(false);
  const [portalActive, setPortalActive] = useState(false);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [draft, setDraft] = useState<Set<Key>>(() => new Set(value));
  const { trigger: haptic } = useHaptic();
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setMounted(true), []);

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const scheduleCloseUnmount = useCallback(() => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      setPortalActive(false);
      closeTimerRef.current = null;
    }, CLOSE_ANIM_MS);
  }, [clearCloseTimer]);

  const openSheet = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled || loading) return;
    clearCloseTimer();
    haptic("light");
    setPortalActive(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setSheetExpanded(true));
    });
  };

  const closeSheet = useCallback(() => {
    setSheetExpanded(false);
    scheduleCloseUnmount();
  }, [scheduleCloseUnmount]);

  useEffect(() => {
    if (sheetExpanded) {
      setDraft(new Set(value));
    }
  }, [sheetExpanded, value]);

  useEffect(() => {
    if (!portalActive) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [portalActive]);

  useEffect(
    () => () => {
      clearCloseTimer();
      document.body.style.overflow = "";
    },
    [clearCloseTimer]
  );

  const selectedCount = value.size;
  const triggerLabel = useMemo(() => {
    if (loading) return "Loading cuisines…";
    const labels = labelsForKeys(cuisineOptions, value);
    if (labels.length === 0) return "Choose ethnic palates…";
    if (labels.length === 1) return labels[0];
    return `${labels[0]} + ${labels[1]}`;
  }, [cuisineOptions, value, loading]);

  const toggleChildKey = (key: Key) => {
    setDraft((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
        haptic("light");
        return next;
      }
      if (next.size >= maxSelections) {
        haptic("warning");
        return next;
      }
      next.add(key);
      haptic("light");
      return next;
    });
  };

  const apply = () => {
    haptic("success");
    onChange(new Set(draft));
    closeSheet();
  };

  const resetDraft = () => {
    haptic("light");
    setDraft(new Set());
  };

  const modal = (
    <div
      className={cn(
        "ethnic-palate-picker__modal",
        portalActive && "ethnic-palate-picker__modal--visible",
        sheetExpanded && "ethnic-palate-picker__modal--open"
      )}
      role="dialog"
      aria-modal
      aria-labelledby="ethnic-palate-sheet-title"
    >
      <div
        className="ethnic-palate-picker__overlay"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          closeSheet();
        }}
        aria-hidden
      />
      <div className="ethnic-palate-picker__panel font-neusans">
        <div className="cuisine-filter__header">
          <h2
            id="ethnic-palate-sheet-title"
            className="cuisine-filter__title font-neusans"
          >
            Select Your Ethnic Palates
          </h2>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              closeSheet();
            }}
            className="cuisine-filter__close"
            aria-label="Close"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <div className="cuisine-filter__body">
          <p className="text-sm text-gray-500 -mt-2 mb-2">
            Select up to {maxSelections} cuisines that match your taste.
          </p>

          <div className="cuisine-filter__section">
            <h3 className="cuisine-filter__section-title font-neusans">
            {draft.size > 0
              ? `${draft.size} of ${maxSelections} selected`
              : ""}
            </h3>
            <div className="cuisine-filter__palate-section space-y-4">
              {!loading && cuisineOptions.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No cuisine regions available. Check your connection and try
                  again.
                </p>
              ) : null}
              {cuisineOptions.map((region) => (
                <div key={region.key}>
                  <h4 className="text-xs font-medium text-gray-500 mb-2">
                    {region.label}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {region.children?.map((child) => {
                      const active = draft.has(child.key);
                      return (
                        <button
                          key={String(child.key)}
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleChildKey(child.key);
                          }}
                          className={
                            active ? CHILD_PILL_ACTIVE : CHILD_PILL_BASE
                          }
                        >
                          {child.flag ? (
                            // eslint-disable-next-line @next/next/no-img-element -- small flag thumb from API
                            <img
                              src={child.flag}
                              alt=""
                              className="w-3.5 h-2.5 object-cover rounded-sm flex-shrink-0"
                            />
                          ) : null}
                          <span className={active ? "text-white" : undefined}>
                            {child.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="cuisine-filter__footer">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              resetDraft();
            }}
            className={FOOTER_RESET}
          >
            Clear
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              apply();
            }}
            className={FOOTER_APPLY}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={disabled || loading}
        onClick={openSheet}
        className={cn(
          "flex items-center gap-2 w-full sm:w-auto max-w-full justify-center min-h-[44px]",
          "px-4 py-2 rounded-[50px] font-normal text-sm font-neusans",
          "bg-white border border-gray-400 text-gray-800",
          "hover:bg-gray-50 transition-colors",
          (disabled || loading) && "opacity-50 pointer-events-none"
        )}
      >
        <FiGlobe className="w-4 h-4 shrink-0 text-gray-600" aria-hidden />
        <span className="truncate text-left text-gray-800">{triggerLabel}</span>
        {selectedCount > 0 && (
          <span
            className="ml-0.5 flex h-5 min-w-[1.25rem] shrink-0 items-center justify-center rounded-full bg-gray-700 px-1 text-[11px] font-medium text-white"
            aria-hidden
          >
            {selectedCount}
          </span>
        )}
      </button>

      {error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : null}

      {mounted && portalActive ? createPortal(modal, document.body) : null}
    </div>
  );
}
