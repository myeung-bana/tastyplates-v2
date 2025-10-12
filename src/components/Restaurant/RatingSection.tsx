import { type RatingMetrics } from "@/utils/reviewUtils";
import { useSession } from "next-auth/react";

interface RatingSectionProps {
  ratingMetrics: RatingMetrics;
  palatesParam: string | null;
}

export default function RatingSection({ ratingMetrics, palatesParam }: RatingSectionProps) {
  const { data: session } = useSession();
  const userPalates = session?.user?.palates || null;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 font-neusans">
      <h3 className="text-lg font-neusans mb-4">Rating</h3>
      <div className="rating-summary w-full">
        <div className="rating-column">
          <h3 className="font-neusans">Overall Rating</h3>
          <div className="rating-value">
            <span className="text-[#E36B00] text-lg md:text-2xl font-normal">
              {ratingMetrics.overallRating.toFixed(1)}
            </span>
          </div>
          <span className="review-count">
            {ratingMetrics.overallCount > 0
              ? `${ratingMetrics.overallCount} reviews`
              : "No reviews yet"}
          </span>
        </div>
        
        <div className="h-[85%] border-l border-[#CACACA]"></div>
        
        <div className="rating-column font-neusans">
          <h3 className="font-neusans">Search Rating</h3>
          <div className="rating-value">
            <span className="text-[#E36B00] text-lg md:text-2xl font-normal">
              {ratingMetrics.searchRating.toFixed(1)}
            </span>
          </div>
          <span className="review-count">
            {palatesParam 
              ? (ratingMetrics.searchCount > 0
                  ? `${ratingMetrics.searchCount} reviews from ${palatesParam}`
                  : `No reviews from ${palatesParam}`)
              : "No search term provided"}
          </span>
        </div>

        {/* My Preference - Only show when user is logged in */}
        {session?.user && userPalates && (
          <>
            <div className="h-[85%] border-l border-[#CACACA]"></div>
            
            <div className="rating-column font-neusans">
              <h3 className="font-neusans">My Preference</h3>
              <div className="rating-value">
                  <span className="text-[#E36B00] text-lg md:text-2xl font-normal">
                    {ratingMetrics.myPreferenceRating.toFixed(1)}
                  </span>
              </div>
              <span className="review-count">
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