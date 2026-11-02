import { Badge } from '@mitdrone/ui';
import { formatDate } from '@mitdrone/utils';
import { BadgeCheck } from 'lucide-react';

import { RatingStars } from './rating-stars';
import { ReviewForm } from './review-form';

import type { Review } from '@mitdrone/types';

export function ReviewsSection({
  productId,
  slug,
  rating,
  count,
  reviews,
}: {
  productId: string;
  slug: string;
  rating: number;
  count: number;
  reviews: Review[];
}) {
  return (
    <section id="reviews" aria-labelledby="reviews-heading" className="scroll-mt-40 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 id="reviews-heading" className="text-2xl font-semibold tracking-tight">
            Customer reviews
          </h2>
          <div className="flex items-center gap-3">
            <span className="text-3xl font-semibold">{rating ? rating.toFixed(1) : '–'}</span>
            <RatingStars rating={rating} count={count} />
          </div>
        </div>
        <ReviewForm productId={productId} slug={slug} />
      </div>
      {reviews.length === 0 ? (
        <p className="text-muted-foreground">
          No reviews yet. Be the first to share your experience.
        </p>
      ) : (
        <ul className="divide-y">
          {reviews.map((review) => (
            <li key={review.id} className="space-y-2 py-5">
              <div className="flex flex-wrap items-center gap-2">
                <RatingStars rating={review.rating} />
                <p className="font-medium">{review.title}</p>
                {review.verifiedPurchase ? (
                  <Badge variant="success" className="gap-1">
                    <BadgeCheck className="size-3" aria-hidden="true" /> Verified purchase
                  </Badge>
                ) : null}
              </div>
              <p className="text-sm">{review.body}</p>
              <p className="text-muted-foreground text-xs">
                {review.authorName} · {formatDate(review.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
