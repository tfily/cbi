import { getWooOrder } from "../../../lib/woocommerce";

const STATUS_LABELS = {
  pending: "En attente de confirmation",
  processing: "Paiement confirmé",
  completed: "Paiement confirmé",
  failed: "Paiement refusé",
  cancelled: "Paiement annulé",
  "on-hold": "Paiement en vérification",
};

const STATUS_BADGES = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  processing: "bg-emerald-100 text-emerald-800 border-emerald-200",
  completed: "bg-emerald-100 text-emerald-800 border-emerald-200",
  failed: "bg-rose-100 text-rose-800 border-rose-200",
  cancelled: "bg-neutral-200 text-neutral-700 border-neutral-300",
  "on-hold": "bg-blue-100 text-blue-800 border-blue-200",
};

export default async function PaymentReturnPage({ searchParams }) {
  const orderId = searchParams?.orderId || "";

  if (!orderId) {
    return (
      <main className="min-h-screen bg-neutral-50 text-neutral-900">
        <section className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
          <h1 className="text-3xl font-bold">Paiement</h1>
          <p className="text-sm text-neutral-700">
            Nous n avons pas pu identifier votre commande. Merci de nous contacter si
            nécessaire.
          </p>
          <a
            href="/#contact"
            className="inline-flex items-center px-5 py-2.5 rounded-full bg-amber-700 text-white text-sm font-semibold"
          >
            Contacter la conciergerie
          </a>
        </section>
      </main>
    );
  }

  let order = null;
  try {
    order = await getWooOrder(orderId);
  } catch (error) {
    console.error("[WooCommerce] Failed to load order:", error);
  }

  const status = order?.status || "pending";
  const statusLabel = STATUS_LABELS[status] || "Paiement en cours de traitement";
  const badgeStyle =
    STATUS_BADGES[status] || "bg-neutral-100 text-neutral-700 border-neutral-200";

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900">
      <section className="max-w-3xl mx-auto px-4 py-16 space-y-6">
        <div className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm space-y-3">
          <p className="uppercase tracking-[0.25em] text-xs text-amber-700">
            Retour de paiement
          </p>
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${badgeStyle}`}
          >
            {statusLabel}
          </span>
          <h1 className="text-3xl md:text-4xl font-bold">{statusLabel}</h1>
          <p className="text-sm text-neutral-600">
            Commande n° {order?.id || orderId}
          </p>
          {order?.date_created && (
            <p className="text-xs text-neutral-500">
              Créée le {new Date(order.date_created).toLocaleDateString("fr-FR")}
            </p>
          )}
        </div>

        {order?.line_items?.length ? (
          <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Récapitulatif</h2>
            <div className="space-y-3 text-sm text-neutral-700">
              {order.line_items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4"
                >
                  <div>
                    <p className="font-medium text-neutral-900">{item.name}</p>
                    <p className="text-xs text-neutral-500">
                      Quantité: {item.quantity}
                    </p>
                  </div>
                  <p className="font-semibold text-neutral-900">
                    {item.total} {order.currency}
                  </p>
                </div>
              ))}
              <div className="border-t border-neutral-200 pt-3 flex items-center justify-between text-sm font-semibold text-neutral-900">
                <span>Total</span>
                <span>
                  {order.total} {order.currency}
                </span>
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <a
            href="/#contact"
            className="inline-flex items-center px-5 py-2.5 rounded-full bg-amber-700 text-white text-sm font-semibold"
          >
            Contacter la conciergerie
          </a>
          <a
            href="/"
            className="inline-flex items-center px-5 py-2.5 rounded-full border border-amber-700 text-amber-800 text-sm font-semibold"
          >
            Retour à l accueil
          </a>
        </div>
      </section>
    </main>
  );
}
