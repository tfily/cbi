export default function ReviewStars({ rating = 0, className = "" }) {
  const normalizedRating = Math.max(0, Math.min(5, Number(rating) || 0));

  return (
    <div
      className={`flex items-center gap-1 ${className}`.trim()}
      aria-label={`${normalizedRating} sur 5`}
    >
      {Array.from({ length: 5 }, (_, index) => {
        const active = index < normalizedRating;
        return (
          <span
            key={index}
            className={active ? "text-amber-500" : "text-neutral-300"}
            aria-hidden="true"
          >
            ★
          </span>
        );
      })}
    </div>
  );
}
