import React from "react";
import Image from "next/image";
import { FLAG, HELMET, CASH, PHONE } from "@/constants/images";
import { CommunityRecognitionMetrics } from "@/utils/reviewUtils";

interface CommunityRecognitionSectionProps {
  metrics?: CommunityRecognitionMetrics;
}

export default function CommunityRecognitionSection({ metrics }: CommunityRecognitionSectionProps) {
  // Default values if no metrics provided
  const defaultMetrics: CommunityRecognitionMetrics = {
    mustRevisit: 0,
    instaWorthy: 0,
    valueForMoney: 0,
    bestService: 0
  };

  const recognitionMetrics = metrics || defaultMetrics;
  
  // Helper function to display value (show "-" if 0)
  const displayValue = (value: number): string => {
    return value > 0 ? value.toString() : "-";
  };
  
  const recognitionItems = [
    { 
      icon: FLAG, 
      value: recognitionMetrics.mustRevisit, 
      label: "Must Revisit",
      description: "Users will come back"
    },
    { 
      icon: PHONE, 
      value: recognitionMetrics.instaWorthy, 
      label: "Insta-Worthy",
      description: "Great for the gram"
    },
    { 
      icon: CASH, 
      value: recognitionMetrics.valueForMoney, 
      label: "Value for Money",
      description: "Worth every penny"
    },
    { 
      icon: HELMET, 
      value: recognitionMetrics.bestService, 
      label: "Best Service",
      description: "Users come back happy"
    }
  ];

  return (
    <div className="bg-white rounded-2xl p-6 md:shadow-sm md:border md:border-gray-200 font-neusans">
      <h3 className="text-lg font-neusans mb-4 md:mb-6">Community Recognition</h3>
      
      {/* Mobile: Horizontal scroll wrapper */}
      <div className="md:hidden -mx-6 px-6">
        <div className="overflow-x-auto pb-2 hide-scrollbar">
          <div className="flex gap-4 min-w-max">
            {recognitionItems.map((item, index) => (
              <div key={index} className="flex flex-col items-center min-w-[140px]">
                <h3 className="font-neusans font-semibold text-sm mb-1">{item.label}</h3>
                <div className="flex flex-col items-center">
                  {/* Score with icon badge overlay */}
                  <div className="relative inline-block mb-2">
                    <span className="font-neusans text-gray-800 text-2xl font-bold">
                      {displayValue(item.value)}
                    </span>
                    <div className="absolute -bottom-1 -right-[25px] flex items-center justify-center w-7 h-7 rounded-full">
                      <Image
                        src={item.icon}
                        width={16}
                        height={16}
                        className="w-4 h-4"
                        alt={`${item.label} icon`}
                      />
                    </div>
                  </div>
                  {/* Description text */}
                  <span className="text-[10px] text-gray-500 text-center leading-tight">
                    {item.description}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Desktop: Grid layout matching Rating section */}
      <div className="!hidden md:!flex w-full justify-evenly items-center gap-0">
        {recognitionItems.map((item, index) => (
          <React.Fragment key={index}>
            {index > 0 && <div className="h-[85%] border-l border-[#CACACA]"></div>}
            
            <div className="flex flex-col items-center flex-1">
              <h3 className="font-neusans font-semibold text-sm mb-1">{item.label}</h3>
              <div className="flex flex-col items-center">
                {/* Score with icon badge overlay */}
                <div className="relative inline-block mb-3">
                  <span className="font-neusans text-gray-800 text-4xl font-bold">
                    {displayValue(item.value)}
                  </span>
                  <div className="absolute -bottom-1 -right-[25px] flex items-center justify-center w-8 h-8 rounded-full">
                    <Image
                      src={item.icon}
                      width={20}
                      height={20}
                      className="w-5 h-5"
                      alt={`${item.label} icon`}
                    />
                  </div>
                </div>
                {/* Description text */}
                <span className="text-xs text-gray-500 text-center">
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
