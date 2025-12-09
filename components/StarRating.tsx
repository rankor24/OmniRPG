import React from 'react';
import { StarIcon } from './icons';

interface StarRatingProps {
  rating: number;
  onRatingChange: (newRating: number) => void;
  size?: string;
  className?: string;
}

const StarRating: React.FC<StarRatingProps> = ({ rating, onRatingChange, size = 'h-5 w-5', className = '' }) => {
  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => onRatingChange(star === rating ? 0 : star)}
          className="transition-transform duration-150 ease-in-out hover:scale-125 btn-boop"
          aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
        >
          <StarIcon className={`${size} ${rating >= star ? 'text-accent' : 'text-gray-600'}`} filled={rating >= star} />
        </button>
      ))}
    </div>
  );
};

export default StarRating;