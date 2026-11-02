import { Star } from 'lucide-react';

export function RatingStars({
  rating,
  count,
  className,
}: {
  rating: number;
  count?: number;
  className?: string;
}) {
  if (!rating) return <span className="text-muted-foreground text-xs">No reviews yet</span>;
  return (
    <span
      className={`text-muted-foreground inline-flex items-center gap-1 text-xs ${className ?? ''}`}
    >
      <span role="img" aria-label={`Rated ${rating} out of 5`} className="inline-flex">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={`size-3.5 ${rating >= i - 0.25 ? 'fill-warning text-warning' : 'text-muted-foreground/40'}`}
            aria-hidden="true"
          />
        ))}
      </span>
      <span>{rating.toFixed(1)}</span>
      {count !== undefined ? <span>({count})</span> : null}
    </span>
  );
}
