import React, { useState } from 'react';
import { GiRoundStar } from 'react-icons/gi';

const  Star = ({ selected = false, onSelect }: {selected: boolean, onSelect: () => void}) => {
    return (
      <GiRoundStar
        color={selected ? '#31343F' : '#CACACA'}
        onClick={onSelect}
        className='cursor-pointer size-6 md:size-8'
      />
    );
  }

export default function Rating({ totalStars = 5, defaultRating = 0, onRating } :{
    totalStars: number, defaultRating: number, onRating?: any}
) {
  const [rating, setRating] = useState(defaultRating);

  const handleSelect = (star: any) => {
    setRating(star);
    onRating?.(star) //Optional callback to parent component
  };

  return (
    <div className="flex gap-2 items-center">
        <div className='flex gap-1'>
            {Array.from({ length: totalStars }, (_, i) => (
                <Star
                key={i}
                selected={i < rating}
                onSelect={() => handleSelect(i + 1)}
                />
            ))}
        </div>
        <span className='text-sm md:text-xl text-center'>{rating.toFixed(1)}</span>
    </div>
  );
}