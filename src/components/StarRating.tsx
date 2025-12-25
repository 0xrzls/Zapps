import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number; 
  size?: number;
  className?: string;
}

export const StarRating = ({ rating, size = 20, className = '' }: StarRatingProps) => {
  
  const fillPercentage = (rating / 5) * 100;

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <span className="text-sm font-medium">{rating.toFixed(1)}</span>
      <div className="relative inline-block" style={{ width: size, height: size }}>
        <Star
          size={size}
          className="text-muted-foreground/30"
        />
        <div
          className="overflow-hidden absolute top-0 left-0"
          style={{ width: `${fillPercentage}%` }}
        >
          <Star
            size={size}
            className="fill-primary text-primary"
          />
        </div>
      </div>
    </div>
  );
};
