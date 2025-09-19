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
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold mb-4">Community Recognition</h3>
      <div className="w-full flex flex-col lg:flex-row items-center justify-center gap-6 my-5 lg:gap-0 lg:my-0">
        <div className="flex items-center w-full">
          <div className="rating-column w-full border-r border-[#CACACA]">
            <Image
              src={FLAG}
              height={40}
              width={40}
              className="size-6 md:size-10"
              alt="Flag icon"
            />
            <div className="rating-value">
              <span className="text-lg md:text-xl font-medium">
                {recognitionMetrics.mustRevisit}
              </span>
            </div>
            <span className="text-[10px] lg:text-sm whitespace-pre">Must Revisit</span>
          </div>
          <div className="rating-column w-full lg:border-r border-[#CACACA]">
            <Image
              src={PHONE}
              height={40}
              width={40}
              className="size-6 md:size-10"
              alt="phone icon"
            />
            <div className="rating-value">
              <span className="text-lg md:text-xl font-medium">
                {recognitionMetrics.instaWorthy}
              </span>
            </div>
            <span className="text-[10px] lg:text-sm whitespace-pre">Insta-Worthy</span>
          </div>
        </div>
        <div className="flex items-center w-full">
          <div className="rating-column w-full border-r border-[#CACACA]">
            <Image
              src={CASH}
              height={40}
              width={40}
              className="size-6 md:size-10"
              alt="cash icon"
            />
            <div className="rating-value">
              <span className="text-lg md:text-xl font-medium">
                {recognitionMetrics.valueForMoney}
              </span>
            </div>
            <span className="text-[10px] lg:text-sm whitespace-pre">Value for Money</span>
          </div>
          <div className="rating-column w-full">
            <Image
              src={HELMET}
              height={40}
              width={40}
              className="size-6 md:size-10"
              alt="helmet icon"
            />
            <div className="rating-value">
              <span className="text-lg md:text-xl font-medium">
                {recognitionMetrics.bestService}
              </span>
            </div>
            <span className="text-[10px] lg:text-sm whitespace-pre">Best Service</span>
          </div>
        </div>
      </div>
    </div>
  );
}
