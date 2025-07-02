import React, { useEffect, useState } from 'react';
import { GiRoundStar } from 'react-icons/gi';

const Star = ({ fill = 0, onSelect }: { fill: number, onSelect: (e: React.MouseEvent<HTMLDivElement>) => void }) => {
    return (
      <div
        className='size-6 md:size-8 relative cursor-pointer'
        onClick={onSelect}
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
          }}
        >
          <GiRoundStar
            color='#31343F'
            className='size-6 md:size-8'
          />
        </div>
      </div>
    );
  }

export default function Rating({ totalStars = 5, defaultRating = 0, onRating }: {
    totalStars: number, defaultRating: number, onRating?: any}
) {
  const [rating, setRating] = useState(defaultRating);

   useEffect(() => {
    setRating(defaultRating);
  }, [defaultRating]);

  const handleSelect = (index: number, e: React.MouseEvent<HTMLDivElement>) => {
    const { left, width } = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const clickPosition = e.clientX - left;
    const fraction = clickPosition / width > 0.5 ? 1 : 0.5;
    const newRating = index + fraction;
    setRating(newRating);
    onRating?.(newRating);
  };

  const getStarFill = (index: number) => {
    if (rating > index) {
      return Math.min(1, rating - index);
    }
    return 0;
  };

  return (
    <div className="flex gap-2 items-center">
        <div className='flex gap-1'>
            {Array.from({ length: totalStars }, (_, i) => (
                <Star
                key={i}
                fill={getStarFill(i)}
                onSelect={(e) => handleSelect(i, e)}
                />
            ))}
        </div>
        <span className='text-sm md:text-xl'>
            {rating}
        </span>
    </div>
  );
}