import React, { useState } from 'react';
import { GiRoundStar } from 'react-icons/gi';

const  Star = ({ selected = false, onSelect }: {selected: boolean, onSelect: () => void}) => {
    return (
      <GiRoundStar
        color={selected ? '#31343F' : '#CACACA'}
        onClick={onSelect}
        className='cursor-pointer h-[26px] w-[26px]'
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
    <div className="flex gap-2">
        <div className='flex gap-1'>
            {Array.from({ length: totalStars }, (_, i) => (
                <Star
                key={i}
                selected={i < rating}
                onSelect={() => handleSelect(i + 1)}
                />
            ))}
        </div>
        <span className='text-xl'>{rating.toFixed(1)}</span>
    </div>
  );
}