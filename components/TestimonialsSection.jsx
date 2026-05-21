import ReviewStars from "./ReviewStars";

function formatReviewDate(date) {
  if (!date) return "";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });
}

export default function TestimonialsSection({
  eyebrow = "Avis clients",
  title,
  intro,
  reviews = [],
  showService = true,
  className = "",
}) {
  if (!Array.isArray(reviews) || reviews.length === 0) {
    return null;
  }

  return (
    <section className={className}>
      <div className="mb-6 max-w-2xl">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-800">
          {eyebrow}
        </p>
        {title ? (
          <h2 className="text-2xl font-bold text-neutral-950">{title}</h2>
        ) : null}
        {intro ? (
          <p className="mt-3 text-sm leading-relaxed text-neutral-600">{intro}</p>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {reviews.map((review) => (
          <article
            key={review.id}
            className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-neutral-950">
                  {review.customerName || "Client vérifié"}
                </p>
                {review.date ? (
                  <p className="text-xs text-neutral-500">
                    {formatReviewDate(review.date)}
                  </p>
                ) : null}
              </div>
              <ReviewStars rating={review.rating} className="text-sm" />
            </div>

            {showService && review.serviceName ? (
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-amber-800">
                {review.serviceName}
                {review.pricingLabel ? ` · ${review.pricingLabel}` : ""}
              </p>
            ) : null}

            <blockquote className="text-sm leading-relaxed text-neutral-700">
              “{review.message}”
            </blockquote>
          </article>
        ))}
      </div>
    </section>
  );
}
