import { type RatingMetrics } from "@/utils/reviewUtils";
import { useFirebaseSession } from "@/hooks/useFirebaseSession";

interface RatingSectionProps {
  ratingMetrics: RatingMetrics;
  palatesParam: string | null;
}

export default function RatingSection({ ratingMetrics, palatesParam }: RatingSectionProps) {
  const { user } = useFirebaseSession();
  const userPalates = user?.palates || null;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 font-neusans">
      <h3 className="text-lg font-neusans mb-4">Rating</h3>
      <div className="rating-summary w-full">
        <div className="rating-column">
          <h3 className="font-neusans font-normal text-sm">Overall Rating</h3>
          <div className="rating-value">
            <span className="font-neusans text-[#ff7c0a] text-lg md:text-2xl font-normal">
              {ratingMetrics.overallRating.toFixed(1)}
            </span>
          </div>
          <span className="review-count font-neusans text-sm font-normal">
            {ratingMetrics.overallCount > 0
              ? `${ratingMetrics.overallCount} reviews`
              : "No reviews yet"}
          </span>
        </div>
        
        <div className="h-[85%] border-l border-[#CACACA]"></div>
        
        <div className="rating-column font-neusans">
          <h3 className="font-neusans font-normal text-sm">Search Rating</h3>
          <div className="rating-value">
            <span className="font-neusans text-[#ff7c0a] text-lg md:text-2xl font-normal">
              {ratingMetrics.searchRating.toFixed(1)}
            </span>
          </div>
          <span className="review-count font-neusans text-sm font-normal">
            {palatesParam 
              ? (ratingMetrics.searchCount > 0
                  ? `${ratingMetrics.searchCount} reviews from ${palatesParam}`
                  : `No reviews from ${palatesParam}`)
              : "No search term provided"}
          </span>
        </div>

        {/* My Preference - Only show when user is logged in */}
        {user && userPalates && (
          <>
            <div className="h-[85%] border-l border-[#CACACA]"></div>
            
            <div className="rating-column font-neusans">
              <h3 className="font-neusans font-normal text-sm">My Preference</h3>
              <div className="rating-value">
                  <span className="font-neusans text-[#ff7c0a] text-lg md:text-2xl font-normal">
                    {ratingMetrics.myPreferenceRating.toFixed(1)}
                  </span>
              </div>
              <span className="review-count font-neusans text-sm font-normal">
                {ratingMetrics.myPreferenceCount > 0
                  ? `${ratingMetrics.myPreferenceCount} reviews from similar palates`
                  : "No reviews from similar palates"}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}