interface ArticleCardSkeletonProps {
  /** Match homepage large article cards */
  large?: boolean;
}

const ArticleCardSkeleton = ({ large }: ArticleCardSkeletonProps) => (
  <div className="overflow-hidden animate-pulse">
    <div
      className={`relative overflow-hidden rounded-2xl mb-2 bg-gray-300 ${
        large ? "aspect-video" : "aspect-[4.5/6]"
      }`}
    />
    <div className="px-0">
      <div
        className={`bg-gray-300 rounded w-full mb-1 ${
          large ? "h-5 md:h-6" : "h-4"
        }`}
      />
      <div
        className={`bg-gray-200 rounded w-4/5 mb-2 ${
          large ? "h-5 md:h-6" : "h-4"
        }`}
      />
      <div className={`bg-gray-200 rounded w-1/3 ${large ? "h-4" : "h-3"}`} />
    </div>
  </div>
);

export default ArticleCardSkeleton;
