const ArticleCardSkeleton = () => (
  <div className="overflow-hidden animate-pulse">
    <div className="relative aspect-[4.5/6] overflow-hidden rounded-2xl mb-2 bg-gray-300" />
    <div className="px-0">
      <div className="h-4 bg-gray-300 rounded w-full mb-1" />
      <div className="h-4 bg-gray-200 rounded w-4/5 mb-2" />
      <div className="h-3 bg-gray-200 rounded w-1/3" />
    </div>
  </div>
);

export default ArticleCardSkeleton;
