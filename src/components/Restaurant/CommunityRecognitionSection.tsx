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
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 font-neusans">
      <h3 className="text-lg font-normal font-neusans mb-4">Community Recognition</h3>
      <div className="community-recognition w-full flex flex-row items-center justify-center gap-0 my-5 lg:my-0">
        <div className="rating-column w-full border-r border-[#CACACA]">
          <div className="rating-value">
            <Image
              src={FLAG}
              height={40}
              width={40}
              className="size-6 md:size-10"
              alt="Flag icon"
            />
            <span className="font-neusans text-2xl md:text-4xl font-normal">
              {recognitionMetrics.mustRevisit}
            </span>
          </div>
          <span className="font-neusans text-[10px] lg:text-sm whitespace-pre">Must Revisit</span>
        </div>
        <div className="rating-column w-full border-r border-[#CACACA]">
          <div className="rating-value">
            <Image
              src={PHONE}
              height={40}
              width={40}
              className="size-6 md:size-10"
              alt="phone icon"
            />
            <span className="font-neusans text-2xl md:text-4xl font-normal">
              {recognitionMetrics.instaWorthy}
            </span>
          </div>
          <span className="font-neusans text-[10px] lg:text-sm whitespace-pre">Insta-Worthy</span>
        </div>
        <div className="rating-column w-full border-r border-[#CACACA]">
          <div className="rating-value">
            <Image
              src={CASH}
              height={40}
              width={40}
              className="size-6 md:size-10"
              alt="cash icon"
            />
            <span className="font-neusans text-2xl md:text-4xl font-normal">
              {recognitionMetrics.valueForMoney}
            </span>
          </div>
          <span className="font-neusans text-[10px] lg:text-sm whitespace-pre">Value for Money</span>
        </div>
        <div className="rating-column w-full">
          <div className="rating-value">
            <Image
              src={HELMET}
              height={40}
              width={40}
              className="size-6 md:size-10"
              alt="helmet icon"
            />
            <span className="font-neusans text-2xl md:text-4xl font-normal">
              {recognitionMetrics.bestService}
            </span>
          </div>
          <span className="font-neusans text-[10px] lg:text-sm whitespace-pre">Best Service</span>
        </div>
      </div>
    </div>
  );
}
