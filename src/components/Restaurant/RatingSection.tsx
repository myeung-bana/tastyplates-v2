import { type RatingMetrics } from "@/utils/reviewUtils";
import { useFirebaseSession } from "@/hooks/useFirebaseSession";

interface RatingSectionProps {
  ratingMetrics: RatingMetrics;
  palatesParam: string | null;
}

// Helper function to format count (1k, 14k, etc.)
function formatCount(count: number): string {
  if (count >= 1000) {
    return `${Math.floor(count / 1000)}k`;
  }
  return count.toString();
}

// Helper function to display rating value
function displayRating(rating: number): string {
  return rating > 0 ? rating.toFixed(1) : "-";
}

export default function RatingSection({ ratingMetrics, palatesParam }: RatingSectionProps) {
  const { user } = useFirebaseSession();
  const userPalates = user?.palates || null;

  return (
    <div className="bg-white rounded-2xl p-6 md:shadow-sm md:border md:border-gray-200 font-neusans">
      <h3 className="text-lg font-neusans mb-4 md:mb-6">Ratings</h3>
      
      {/* Mobile: Horizontal scroll wrapper */}
      <div className="md:hidden -mx-6 px-6">
        <div className="overflow-x-auto pb-2 hide-scrollbar">
          <div className="flex gap-4 min-w-max">
            {/* Overall Rating */}
            <div className="flex flex-col items-center min-w-[140px]">
              <h3 className="font-neusans font-semibold text-sm mb-1">Overall Score</h3>
              <div className="flex flex-col items-center">
                <div className="relative inline-block mb-2">
                  <span className="font-neusans text-gray-800 text-2xl font-bold">
                    {displayRating(ratingMetrics.overallRating)}
                  </span>
                  <div className="absolute -bottom-1 -right-4 flex items-center justify-center w-5 h-5 rounded-full bg-[#ff7c0a]">
                    <span className="text-[9px] font-bold text-white">
                      {formatCount(ratingMetrics.overallCount)}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] text-gray-500 text-center leading-tight">
                  What platform<br/>users think
                </span>
              </div>
            </div>

            <div className="w-px bg-[#CACACA] self-stretch my-2"></div>

            {/* Search Rating */}
            <div className="flex flex-col items-center min-w-[140px]">
              <h3 className="font-neusans font-semibold text-sm mb-1">Search Score</h3>
              <div className="flex flex-col items-center">
                <div className="relative inline-block mb-2">
                  <span className="font-neusans text-gray-800 text-2xl font-bold">
                    {displayRating(ratingMetrics.searchRating)}
                  </span>
                  <div className="absolute -bottom-1 -right-4 flex items-center justify-center w-5 h-5 rounded-full bg-[#ff7c0a]">
                    <span className="text-[9px] font-bold text-white">
                      {formatCount(ratingMetrics.searchCount)}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] text-gray-500 text-center leading-tight">
                  How much we<br/>think you&apos;d like
                </span>
              </div>
            </div>

            {/* My Preference - Only show when user is logged in */}
            {user && userPalates && (
              <>
                <div className="w-px bg-[#CACACA] self-stretch my-2"></div>
                
                <div className="flex flex-col items-center min-w-[140px]">
                  <h3 className="font-neusans font-semibold text-sm mb-1">Shared Score</h3>
                  <div className="flex flex-col items-center">
                    <div className="relative inline-block mb-2">
                      <span className="font-neusans text-gray-800 text-2xl font-bold">
                        {displayRating(ratingMetrics.myPreferenceRating)}
                      </span>
                      <div className="absolute -bottom-1 -right-4 flex items-center justify-center w-5 h-5 rounded-full bg-[#ff7c0a]">
                        <span className="text-[9px] font-bold text-white">
                          {formatCount(ratingMetrics.myPreferenceCount)}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-500 text-center leading-tight">
                      What shared<br/>preference users think
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Desktop: Original grid layout */}
      <div className="!hidden md:!flex rating-summary w-full">
        {/* Overall Rating */}
        <div className="rating-column">
          <h3 className="font-neusans font-semibold text-sm mb-1">Overall Score</h3>
          <div className="flex flex-col items-center">
            <div className="relative inline-block mb-3">
              <span className="font-neusans text-gray-800 text-4xl font-bold">
                {displayRating(ratingMetrics.overallRating)}
              </span>
              <div className="absolute -bottom-1 -right-5 flex items-center justify-center w-6 h-6 rounded-full bg-[#ff7c0a]">
                <span className="text-[10px] font-bold text-white">
                  {formatCount(ratingMetrics.overallCount)}
                </span>
              </div>
            </div>
            <span className="text-xs text-gray-500">
              What platform users think
            </span>
          </div>
        </div>
        
        <div className="h-[85%] border-l border-[#CACACA]"></div>
        
        {/* Search Rating */}
        <div className="rating-column font-neusans">
          <h3 className="font-neusans font-semibold text-sm mb-1">Search Score</h3>
          <div className="flex flex-col items-center">
            <div className="relative inline-block mb-3">
              <span className="font-neusans text-gray-800 text-4xl font-bold">
                {displayRating(ratingMetrics.searchRating)}
              </span>
              <div className="absolute -bottom-1 -right-5 flex items-center justify-center w-6 h-6 rounded-full bg-[#ff7c0a]">
                <span className="text-[10px] font-bold text-white">
                  {formatCount(ratingMetrics.searchCount)}
                </span>
              </div>
            </div>
            <span className="text-xs text-gray-500">
              How much we think you&apos;d like
            </span>
          </div>
        </div>

        {/* My Preference - Only show when user is logged in */}
        {user && userPalates && (
          <>
            <div className="h-[85%] border-l border-[#CACACA]"></div>
            
            <div className="rating-column font-neusans">
              <h3 className="font-neusans font-semibold text-sm mb-1">Shared Score</h3>
              <div className="flex flex-col items-center">
                <div className="relative inline-block mb-3">
                  <span className="font-neusans text-gray-800 text-4xl font-bold">
                    {displayRating(ratingMetrics.myPreferenceRating)}
                  </span>
                  <div className="absolute -bottom-1 -right-5 flex items-center justify-center w-6 h-6 rounded-full bg-[#ff7c0a]">
                    <span className="text-[10px] font-bold text-white">
                      {formatCount(ratingMetrics.myPreferenceCount)}
                    </span>
                  </div>
                </div>
                <span className="text-xs text-gray-500">
                  What shared preference users think
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}