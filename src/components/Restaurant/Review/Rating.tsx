import React, { useEffect, useState } from 'react';
import { GiRoundStar } from 'react-icons/gi';

const Star = ({
  fill = 0,
  onSelect,
  onHover,
}: {
  fill: number,
  onSelect: (e: React.MouseEvent<HTMLDivElement>) => void,
  onHover: (e: React.MouseEvent<HTMLDivElement>) => void,
}) => {
  return (
    <div
      className='size-6 md:size-8 relative cursor-pointer'
      onClick={onSelect}
      onMouseMove={onHover}
    >
      <GiRoundStar
        color='#CACACA'
        className='size-6 md:size-8'
      />
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: `${fill * 100}%`,
          overflow: 'hidden',
          opacity: 1,
        }}
      >
        <GiRoundStar
          color='#31343F'
          className='size-6 md:size-8'
        />
      </div>
    </div>
  );
};

export default function Rating({
  totalStars = 5,
  defaultRating = 0,
  onRating,
}: {
  totalStars: number,
  defaultRating: number,
  onRating?: (value: number) => void,
}) {
  const [rating, setRating] = useState(defaultRating);
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  useEffect(() => {
    setRating(defaultRating);
  }, [defaultRating]);

  const handleSelect = (index: number, e: React.MouseEvent<HTMLDivElement>) => {
    const { left, width } = e.currentTarget.getBoundingClientRect();
    const clickPosition = e.clientX - left;
    const fraction = clickPosition / width > 0.5 ? 1 : 0.5;
    const newRating = index + fraction;
    setRating(newRating);
    onRating?.(newRating);
  };

  const handleHover = (index: number, e: React.MouseEvent<HTMLDivElement>) => {
    const { left, width } = e.currentTarget.getBoundingClientRect();
    const hoverPosition = e.clientX - left;
    const fraction = hoverPosition / width > 0.5 ? 1 : 0.5;
    setHoverRating(index + fraction);
  };

  const handleLeave = () => {
    setHoverRating(null);
  };

  const getStarFill = (index: number) => {
    const activeRating = hoverRating ?? rating;
    if (activeRating > index) {
      return Math.min(1, activeRating - index);
    }
    return 0;
  };

  return (
    <div className="flex gap-2 items-center" onMouseLeave={handleLeave}>
      <div className='flex gap-1'>
        {Array.from({ length: totalStars }, (_, i) => (
          <Star
            key={i}
            fill={getStarFill(i)}
            onSelect={(e) => handleSelect(i, e)}
            onHover={(e) => handleHover(i, e)}
          />
        ))}
      </div>
      <span className='text-sm md:text-xl'>
        {rating}
      </span>
    </div>
  );
}
