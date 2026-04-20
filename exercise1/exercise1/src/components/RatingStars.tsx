import React from 'react';
import type { RatingStarsProps } from '../types/product';

const starPath =
  'M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z';

const starSizeByVariant: Record<NonNullable<RatingStarsProps['size']>, string> = {
  xs: '0.625rem',
  sm: '0.75rem',
  md: '0.875rem',
  lg: '1rem',
};

const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  maxRating = 5,
  reviewCount,
  size = 'md',
}) => {
  const starSize = starSizeByVariant[size];
  const stars = Array.from({ length: maxRating }, (_, i) => i + 1);

  const ratingLabel = `${rating} out of ${maxRating} stars${reviewCount ? ` (${reviewCount} reviews)` : ''}`;

  return (
    <div className="flex items-center gap-0.5 leading-none" role="img" aria-label={ratingLabel}>
      {stars.map((starValue) => {
        const filled = starValue <= Math.floor(rating);
        const hasPartialStar = rating % 1 !== 0;
        const halfFilled =
          !filled &&
          hasPartialStar &&
          starValue === Math.ceil(rating);

        return (
          <span
            key={starValue}
            className="inline-flex shrink-0 items-center justify-center"
            style={{ width: starSize, height: starSize }}
            aria-hidden="true"
          >
            {filled ? (
              <svg
                className="h-full w-full min-w-0 text-amber-400"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d={starPath} />
              </svg>
            ) : halfFilled ? (
              <span className="relative block h-full w-full min-w-0">
                <svg
                  className="absolute inset-0 h-full w-full text-slate-200"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d={starPath} />
                </svg>
                <svg
                  className="absolute left-0 top-0 h-full overflow-hidden text-amber-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  style={{ width: '50%' }}
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d={starPath} />
                </svg>
              </span>
            ) : (
              <svg
                className="h-full w-full min-w-0 text-slate-200"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d={starPath} />
              </svg>
            )}
          </span>
        );
      })}
      {reviewCount !== undefined && reviewCount > 0 && (
        <span className="ml-1 text-xs text-slate-500" aria-hidden="true">
          ({reviewCount})
        </span>
      )}
    </div>
  );
};

export default RatingStars;
