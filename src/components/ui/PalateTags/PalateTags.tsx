import React from "react";
import Image from "next/image";
import { palateFlagMap } from "@/utils/palateFlags";

interface PalateTagsProps {
  palateNames: string[];
  maxTags?: number;
  className?: string;
}

const PalateTags: React.FC<PalateTagsProps> = ({ 
  palateNames, 
  maxTags = 2, 
  className = "" 
}) => {
  if (!palateNames || palateNames.length === 0) {
    return null;
  }

  const displayTags = palateNames.slice(0, maxTags);

  return (
    <div className={`flex space-x-1 mb-2 ${className}`}>
      {displayTags.map((tag: string, index: number) => (
        <span 
          key={index} 
          className="flex items-center space-x-1 bg-gray-100 px-2 py-1 rounded-full text-xs"
        >
          {palateFlagMap[tag.toLowerCase()] && (
            <Image
              src={palateFlagMap[tag.toLowerCase()] || '/default-image.png'}
              alt={`${tag} flag`}
              width={12}
              height={8}
              className="w-3 h-2 rounded object-cover"
            />
          )}
          <span>{tag}</span>
        </span>
      ))}
    </div>
  );
};

export default PalateTags;
