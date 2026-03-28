"use client";

import { palateOptions } from "@/constants/formOptions";

interface CuisinePillSelectorProps {
  selectedPalates: Set<string>;
  onSelectedPalatesChange: (next: Set<string>) => void;
  onReset?: () => void;
  showSelectionMeta?: boolean;
}

/**
 * Shared cuisine selector used by mobile SearchMenu and /restaurants CuisineFilter.
 * Selection behavior intentionally mirrors SearchMenu:
 * single selection only (one region OR one cuisine), click again to reset.
 */
export default function CuisinePillSelector({
  selectedPalates,
  onSelectedPalatesChange,
  onReset,
  showSelectionMeta = true,
}: CuisinePillSelectorProps) {
  const handlePalateSelection = (palateKey: string) => {
    const isOnlySelection = selectedPalates.size === 1 && selectedPalates.has(palateKey);
    if (isOnlySelection) {
      onSelectedPalatesChange(new Set());
      return;
    }
    onSelectedPalatesChange(new Set([palateKey]));
  };

  const handleReset = () => {
    onSelectedPalatesChange(new Set());
    onReset?.();
  };

  return (
    <div className="pt-1">
      {showSelectionMeta && selectedPalates.size > 0 && (
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-gray-500">{selectedPalates.size} selected</span>
          <button
            onClick={handleReset}
            className="text-xs text-[#ff7c0a] hover:text-[#e66b00] font-medium underline"
          >
            Reset
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={handleReset}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
            selectedPalates.size === 0
              ? "bg-[#ff7c0a] text-white border border-[#ff7c0a]"
              : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
          }`}
        >
          All Cuisines
        </button>
      </div>

      <div className="space-y-4">
        {palateOptions.map((region) => (
          <div key={region.key}>
            <h4 className="text-xs font-medium text-gray-500 mb-2">{region.label}</h4>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handlePalateSelection(region.key)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                  selectedPalates.has(region.key)
                    ? "bg-[#ff7c0a] text-white border border-[#ff7c0a]"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
                }`}
              >
                All {region.label}
              </button>

              {region.children?.map((cuisine) => (
                <button
                  key={cuisine.key}
                  onClick={() => handlePalateSelection(cuisine.key)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                    selectedPalates.has(cuisine.key)
                      ? "bg-[#ff7c0a] text-white border border-[#ff7c0a]"
                      : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <img
                    src={cuisine.flag || ""}
                    alt=""
                    className="w-3.5 h-2.5 object-cover rounded-sm flex-shrink-0"
                  />
                  <span className={selectedPalates.has(cuisine.key) ? "text-white" : ""}>{cuisine.label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
