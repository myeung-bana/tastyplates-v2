"use client";
import React from "react";
import { FiClock } from "react-icons/fi";
import { groupOpeningHours, formatDayRange, type GroupedHours } from "@/utils/openingHoursUtils";

interface OpeningHoursDisplayProps {
  openingHours: string | object | null | undefined;
}

const OpeningHoursDisplay: React.FC<OpeningHoursDisplayProps> = ({ openingHours }) => {
  const grouped = groupOpeningHours(openingHours);
  
  if (grouped.length === 0) {
    return (
      <div className="flex items-center gap-3">
        <FiClock className="w-5 h-5 text-gray-500 flex-shrink-0" />
        <div className="flex flex-col">
          <span className="text-sm font-normal font-neusans text-gray-500">
            Opening Hours
          </span>
          <span className="text-gray-700 font-neusans font-normal">
            Not available
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3">
      <FiClock className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <span className="text-sm font-normal font-neusans text-gray-500 block mb-2">
          Opening Hours
        </span>
        <div className="space-y-1.5">
          {grouped.map((group, index) => (
            <div
              key={index}
              className={`flex items-center justify-between gap-3 py-1 px-2 rounded-md transition-colors ${
                group.isToday
                  ? "bg-orange-50 border border-orange-200"
                  : "hover:bg-gray-50"
              }`}
            >
              <span
                className={`text-sm font-neusans font-medium ${
                  group.isToday ? "text-orange-700" : "text-gray-700"
                }`}
              >
                {formatDayRange(group.days)}
              </span>
              <span
                className={`text-sm font-neusans font-normal text-right ${
                  group.isClosed
                    ? "text-gray-400"
                    : group.isToday
                    ? "text-orange-700"
                    : "text-gray-700"
                }`}
              >
                {group.isClosed ? "Closed" : group.hours}
              </span>
            </div>
          ))}
        </div>
        {grouped.some(g => g.isToday) && (
          <p className="text-xs text-orange-600 mt-2 font-neusans">
            Today's hours highlighted
          </p>
        )}
      </div>
    </div>
  );
};

export default OpeningHoursDisplay;

