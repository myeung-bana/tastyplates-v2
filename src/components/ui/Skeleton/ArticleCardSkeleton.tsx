interface ArticleCardSkeletonProps {
  /** Match homepage large article cards (16:9 cover + larger type) */
  large?: boolean;
}

const ArticleCardSkeleton = ({ large }: ArticleCardSkeletonProps) => {
  const isLarge = !!large;

  return (
    <div className="overflow-hidden animate-pulse font-neusans">
      <div
        className={`relative overflow-hidden rounded-2xl mb-2 bg-gray-200 ${
          isLarge ? "aspect-video" : "aspect-[4/3]"
        }`}
      >
        {/* Category pill — mirrors ArticleCard */}
        <span className="absolute bottom-2 left-2 h-5 w-16 rounded-full bg-white/70" />
      </div>
      <div className="px-0 space-y-2">
        <div
          className={`bg-gray-300 rounded w-full ${
            isLarge ? "h-4 md:h-5" : "h-3.5"
          }`}
        />
        <div
          className={`bg-gray-200 rounded w-[92%] ${
            isLarge ? "h-4 md:h-5" : "h-3.5"
          }`}
        />
        <div
          className={`bg-gray-200 rounded w-1/3 ${
            isLarge ? "h-3 md:h-3.5" : "h-2.5"
          }`}
        />
      </div>
    </div>
  );
};

export default ArticleCardSkeleton;
