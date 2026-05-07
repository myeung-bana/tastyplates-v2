import React from "react";
import Image from "next/image";
import {
  COMMUNITY_MUST_REVISIT,
  COMMUNITY_INSTA_WORTHY,
  COMMUNITY_VALUE_FOR_MONEY,
  COMMUNITY_GOOD_SERVICE,
} from "@/constants/images";
import { CommunityRecognitionMetrics } from "@/utils/reviewUtils";

interface CommunityRecognitionSectionProps {
  metrics?: CommunityRecognitionMetrics;
}

export default function CommunityRecognitionSection({ metrics }: CommunityRecognitionSectionProps) {
  const defaultMetrics: CommunityRecognitionMetrics = {
    mustRevisit: 0,
    instaWorthy: 0,
    valueForMoney: 0,
    bestService: 0,
  };

  const recognitionMetrics = metrics || defaultMetrics;

  const displayValue = (value: number): string => {
    return value > 0 ? value.toString() : "-";
  };

  const recognitionItems = [
    {
      icon: COMMUNITY_MUST_REVISIT,
      value: recognitionMetrics.mustRevisit,
      label: "Must Revisit",
      description: "Users will come back",
    },
    {
      icon: COMMUNITY_INSTA_WORTHY,
      value: recognitionMetrics.instaWorthy,
      label: "Insta-Worthy",
      description: "Great for the gram",
    },
    {
      icon: COMMUNITY_VALUE_FOR_MONEY,
      value: recognitionMetrics.valueForMoney,
      label: "Value for Money",
      description: "Worth every penny",
    },
    {
      icon: COMMUNITY_GOOD_SERVICE,
      value: recognitionMetrics.bestService,
      label: "Best Service",
      description: "Users come back happy",
    },
  ];

  return (
    <div className="bg-white rounded-2xl p-6 md:shadow-sm md:border md:border-gray-200 font-neusans">
      <h3 className="text-lg font-neusans mb-4 md:mb-6">Community Recognition</h3>

      {/* Mobile — ~20% larger than original for legibility */}
      <div className="md:hidden -mx-6 px-6">
        <div className="overflow-x-auto pb-2 hide-scrollbar">
          <div className="flex gap-4 min-w-max">
            {recognitionItems.map((item, index) => (
              <React.Fragment key={item.label}>
                {index > 0 && <div className="w-px bg-[#CACACA] self-stretch my-1" />}
                <div className="flex flex-col items-center min-w-[132px]">
                  <h3 className="font-neusans font-semibold text-sm mb-0.5">{item.label}</h3>
                  <div className="flex flex-col items-center">
                    <div className="relative inline-block mb-1">
                      <span className="font-neusans text-gray-800 text-2xl font-bold">
                        {displayValue(item.value)}
                      </span>
                      <div className="absolute -bottom-0.5 -right-4 flex items-center justify-center w-5 h-5">
                        <Image
                          src={item.icon}
                          width={14}
                          height={14}
                          className="w-3.5 h-3.5"
                          alt=""
                        />
                      </div>
                    </div>
                    <span className="text-[11px] text-gray-500 text-center leading-tight">
                      {item.description}
                    </span>
                  </div>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Desktop — mirrors RatingSection: rating-summary + rating-column, text-2xl value */}
      <div className="!hidden md:!flex rating-summary w-full">
        {recognitionItems.map((item, index) => (
          <React.Fragment key={item.label}>
            {index > 0 && <div className="h-[85%] border-l border-[#CACACA]" />}
            <div className="rating-column font-neusans">
              <h3 className="font-neusans font-semibold text-xs mb-0.5">{item.label}</h3>
              <div className="flex flex-col items-center">
                <div className="relative inline-block mb-1.5">
                  <span className="font-neusans text-gray-800 text-2xl font-bold">
                    {displayValue(item.value)}
                  </span>
                  <div className="absolute -bottom-0.5 -right-4 flex items-center justify-center w-5 h-5">
                    <Image
                      src={item.icon}
                      width={14}
                      height={14}
                      className="w-3.5 h-3.5"
                      alt=""
                    />
                  </div>
                </div>
                <span className="text-[10px] text-gray-500 leading-tight text-center">
                  {item.description}
                </span>
              </div>
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
