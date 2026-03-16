import { type RatingMetrics } from "@/utils/reviewUtils";
import { useAuthenticationStatus } from "@nhost/nextjs";
import { useNhostSession } from "@/hooks/useNhostSession";
import { FiLock } from "react-icons/fi";

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
  const { isAuthenticated } = useAuthenticationStatus();
  const { user } = useNhostSession();
  const userPalates = (user as any)?.palates || null;

  return (
    <div className="bg-white rounded-2xl p-6 md:shadow-sm md:border md:border-gray-200 font-neusans">
      <h3 className="text-lg font-neusans mb-4 md:mb-6">Ratings</h3>
      
      {/* Mobile: Horizontal scroll wrapper */}
      <div className="md:hidden -mx-6 px-6">
        <div className="overflow-x-auto pb-2 hide-scrollbar">
          <div className="flex gap-3 min-w-max">
            {/* Overall Rating */}
            <div className="flex flex-col items-center min-w-[110px]">
              <h3 className="font-neusans font-semibold text-xs mb-0.5">Overall Score</h3>
              <div className="flex flex-col items-center">
                <div className="relative inline-block mb-1">
                  <span className="font-neusans text-gray-800 text-xl font-bold">
                    {displayRating(ratingMetrics.overallRating)}
                  </span>
                  <div className="absolute -bottom-0.5 -right-3 flex items-center justify-center w-4 h-4 rounded-full bg-[#ff7c0a]">
                    <span className="text-[8px] font-bold text-white">
                      {formatCount(ratingMetrics.overallCount)}
                    </span>
                  </div>
                </div>
                <span className="text-[9px] text-gray-500 text-center leading-tight">
                  What platform<br/>users think
                </span>
              </div>
            </div>

            <div className="w-px bg-[#CACACA] self-stretch my-1"></div>

            {/* Search Rating */}
            <div className="flex flex-col items-center min-w-[110px]">
              <h3 className="font-neusans font-semibold text-xs mb-0.5">Search Score</h3>
              <div className="flex flex-col items-center">
                <div className="relative inline-block mb-1">
                  {isAuthenticated ? (
                    <>
                      <span className="font-neusans text-gray-800 text-xl font-bold">
                        {displayRating(ratingMetrics.searchRating)}
                      </span>
                      <div className="absolute -bottom-0.5 -right-3 flex items-center justify-center w-4 h-4 rounded-full bg-[#ff7c0a]">
                        <span className="text-[8px] font-bold text-white">
                          {formatCount(ratingMetrics.searchCount)}
                        </span>
                      </div>
                    </>
                  ) : (
                    <FiLock className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <span className="text-[9px] text-gray-500 text-center leading-tight">
                  {isAuthenticated
                    ? <>How much we<br/>think you&apos;d like</>
                    : <>Sign in to see<br/>your score</>
                  }
                </span>
              </div>
            </div>

            <div className="w-px bg-[#CACACA] self-stretch my-1"></div>

            {/* Authentic Score */}
            <div className="flex flex-col items-center min-w-[110px]">
              <h3 className="font-neusans font-semibold text-xs mb-0.5">Authentic Score</h3>
              <div className="flex flex-col items-center">
                <div className="relative inline-block mb-1">
                  <span className="font-neusans text-gray-800 text-xl font-bold">
                    {displayRating(ratingMetrics.authenticRating)}
                  </span>
                  <div className="absolute -bottom-0.5 -right-3 flex items-center justify-center w-4 h-4 rounded-full bg-[#ff7c0a]">
                    <span className="text-[8px] font-bold text-white">
                      {formatCount(ratingMetrics.authenticCount)}
                    </span>
                  </div>
                </div>
                <span className="text-[9px] text-gray-500 text-center leading-tight">
                  How authentic<br />this restaurant is
                </span>
              </div>
            </div>

            <div className="w-px bg-[#CACACA] self-stretch my-1"></div>

            {/* My Preference - Only show when user is logged in */}
            {user && userPalates && (
              <>
                <div className="w-px bg-[#CACACA] self-stretch my-1"></div>
                
                <div className="flex flex-col items-center min-w-[110px]">
                  <h3 className="font-neusans font-semibold text-xs mb-0.5">Shared Score</h3>
                  <div className="flex flex-col items-center">
                    <div className="relative inline-block mb-1">
                      <span className="font-neusans text-gray-800 text-xl font-bold">
                        {displayRating(ratingMetrics.myPreferenceRating)}
                      </span>
                      <div className="absolute -bottom-0.5 -right-3 flex items-center justify-center w-4 h-4 rounded-full bg-[#ff7c0a]">
                        <span className="text-[8px] font-bold text-white">
                          {formatCount(ratingMetrics.myPreferenceCount)}
                        </span>
                      </div>
                    </div>
                    <span className="text-[9px] text-gray-500 text-center leading-tight">
                      What shared<br/>preference users think
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Desktop: Compact grid layout to fit container */}
      <div className="!hidden md:!flex rating-summary w-full">
        {/* Overall Rating */}
        <div className="rating-column">
          <h3 className="font-neusans font-semibold text-xs mb-0.5">Overall Score</h3>
          <div className="flex flex-col items-center">
            <div className="relative inline-block mb-1.5">
              <span className="font-neusans text-gray-800 text-2xl font-bold">
                {displayRating(ratingMetrics.overallRating)}
              </span>
              <div className="absolute -bottom-0.5 -right-4 flex items-center justify-center w-5 h-5 rounded-full bg-[#ff7c0a]">
                <span className="text-[9px] font-bold text-white">
                  {formatCount(ratingMetrics.overallCount)}
                </span>
              </div>
            </div>
            <span className="text-[10px] text-gray-500 leading-tight">
              What platform users think
            </span>
          </div>
        </div>
        
        <div className="h-[85%] border-l border-[#CACACA]"></div>
        
        {/* Search Rating */}
        <div className="rating-column font-neusans">
          <h3 className="font-neusans font-semibold text-xs mb-0.5">Search Score</h3>
          <div className="flex flex-col items-center">
            <div className="relative inline-block mb-1.5">
              {isAuthenticated ? (
                <>
                  <span className="font-neusans text-gray-800 text-2xl font-bold">
                    {displayRating(ratingMetrics.searchRating)}
                  </span>
                  <div className="absolute -bottom-0.5 -right-4 flex items-center justify-center w-5 h-5 rounded-full bg-[#ff7c0a]">
                    <span className="text-[9px] font-bold text-white">
                      {formatCount(ratingMetrics.searchCount)}
                    </span>
                  </div>
                </>
              ) : (
                <FiLock className="w-6 h-6 text-gray-400" />
              )}
            </div>
            <span className="text-[10px] text-gray-500 leading-tight">
              {isAuthenticated
                ? "How much we think you\u2019d like"
                : "Sign in to see your score"
              }
            </span>
          </div>
        </div>

        <div className="h-[85%] border-l border-[#CACACA]"></div>

        {/* Authentic Score */}
        <div className="rating-column font-neusans">
          <h3 className="font-neusans font-semibold text-xs mb-0.5">Authentic Score</h3>
          <div className="flex flex-col items-center">
            <div className="relative inline-block mb-1.5">
              <span className="font-neusans text-gray-800 text-2xl font-bold">
                {displayRating(ratingMetrics.authenticRating)}
              </span>
              <div className="absolute -bottom-0.5 -right-4 flex items-center justify-center w-5 h-5 rounded-full bg-[#ff7c0a]">
                <span className="text-[9px] font-bold text-white">
                  {formatCount(ratingMetrics.authenticCount)}
                </span>
              </div>
            </div>
            <span className="text-[10px] text-gray-500 leading-tight">
              How authentic this restaurant is
            </span>
          </div>
        </div>

        <div className="h-[85%] border-l border-[#CACACA]"></div>

        {/* My Preference - Only show when user is logged in */}
        {user && userPalates && (
          <>
            <div className="h-[85%] border-l border-[#CACACA]"></div>
            
            <div className="rating-column font-neusans">
              <h3 className="font-neusans font-semibold text-xs mb-0.5">Shared Score</h3>
              <div className="flex flex-col items-center">
                <div className="relative inline-block mb-1.5">
                  <span className="font-neusans text-gray-800 text-2xl font-bold">
                    {displayRating(ratingMetrics.myPreferenceRating)}
                  </span>
                  <div className="absolute -bottom-0.5 -right-4 flex items-center justify-center w-5 h-5 rounded-full bg-[#ff7c0a]">
                    <span className="text-[9px] font-bold text-white">
                      {formatCount(ratingMetrics.myPreferenceCount)}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] text-gray-500 leading-tight">
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