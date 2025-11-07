import React from 'react'
import { Star } from 'lucide-react'

interface Review {
  id: string
  stars: number
  textReview: string
  reviewerName?: string
  createdAt: string
  isVisible?: boolean
}

interface ReviewsDisplayProps {
  reviews: Review[]
  averageRating?: number
  totalReviews?: number
  showAll?: boolean
  maxDisplay?: number
}

export const ReviewsDisplay: React.FC<ReviewsDisplayProps> = ({
  reviews,
  averageRating,
  totalReviews,
  showAll = false,
  maxDisplay = 3
}) => {
  const visibleReviews = reviews.filter(r => r.isVisible !== false)
  const displayReviews = showAll ? visibleReviews : visibleReviews.slice(0, maxDisplay)

  return (
    <div className="space-y-4">
      {averageRating !== undefined && (
        <div className="flex items-center space-x-4 mb-6">
          <div className="flex items-center space-x-2">
            <Star className="w-6 h-6 text-gold fill-current" />
            <span className="text-2xl font-bold text-navy">{averageRating.toFixed(1)}</span>
          </div>
          {totalReviews !== undefined && (
            <span className="text-gray-600">
              Based on {totalReviews} review{totalReviews !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      )}

      <div className="space-y-4">
        {displayReviews.length > 0 ? (
          displayReviews.map((review) => (
            <div key={review.id} className="border-b border-gray-200 pb-4 last:border-0">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className="flex items-center">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < review.stars
                            ? 'text-gold fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  {review.reviewerName && (
                    <span className="text-sm font-semibold text-navy">
                      {review.reviewerName}
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(review.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-gray-700 text-sm">{review.textReview}</p>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-center py-4">No reviews yet.</p>
        )}
      </div>

      {!showAll && visibleReviews.length > maxDisplay && (
        <button className="text-gold hover:text-navy font-semibold text-sm">
          View all {visibleReviews.length} reviews
        </button>
      )}
    </div>
  )
}

export default ReviewsDisplay








