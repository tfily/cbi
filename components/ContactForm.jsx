"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

function cleanHtml(str) {
  return str.replace(/<[^>]+>/g, "");
}

export default function ContactForm({ services = [], subscriptions = [] }) {
  const searchParams = useSearchParams();
  const selectedSlug = searchParams.get("service") || "";
  const selectedSubscription = searchParams.get("subscription") || "";

  const options = useMemo(
    () =>
      (services || []).map((s) => ({
        slug: s.slug,
        label: cleanHtml(s.title?.rendered || ""),
      })),
    [services]
  );

  const subscriptionOptions = useMemo(
    () =>
      (subscriptions || []).map((sub) => ({
        slug: sub.slug,
        label: cleanHtml(sub.title?.rendered || ""),
        price: sub.meta?.cbi_price || "",
      })),
    [subscriptions]
  );

  return (
    <form
      className="space-y-4"
      action="https://formspree.io/f/your-form-id"
      method="POST"
    >
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium mb-1">Nom complet</label>
          <input
            type="text"
            name="name"
            required
            className="w-full rounded-lg border border-neutral-600 bg-neutral-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Email</label>
          <input
            type="email"
            name="email"
            required
            className="w-full rounded-lg border border-neutral-600 bg-neutral-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium mb-1">Téléphone</label>
          <input
            type="tel"
            name="phone"
            className="w-full rounded-lg border border-neutral-600 bg-neutral-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Type de service</label>
          {options.length ? (
            <select
              name="service_type"
              defaultValue={selectedSlug}
              className="w-full rounded-lg border border-neutral-600 bg-neutral-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">Choisir un service</option>
              {options.map((o) => (
                <option key={o.slug} value={o.slug}>
                  {o.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              name="service_type"
              className="w-full rounded-lg border border-neutral-600 bg-neutral-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="Ex: courses, pressing, garde d animaux..."
            />
          )}
        </div>
      </div>

      {subscriptionOptions.length > 0 && (
        <div>
          <label className="block text-xs font-medium mb-1">
            Formule d abonnement (optionnel)
          </label>
          <select
            name="subscription_plan"
            defaultValue={selectedSubscription}
            className="w-full rounded-lg border border-neutral-600 bg-neutral-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="">Je souhaite discuter d une formule</option>
            {subscriptionOptions.map((sub) => (
              <option key={sub.slug} value={sub.slug}>
                {sub.label}
                {sub.price ? ` – ${sub.price}` : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="block text-xs font-medium mb-1">Votre demande</label>
        <textarea
          rows={4}
          name="message"
          className="w-full rounded-lg border border-neutral-600 bg-neutral-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          placeholder="Précisez la date souhaitée, l adresse, les horaires, etc."
        />
      </div>

      <div className="flex items-center justify-between gap-4 pt-2">
        <p className="text-[11px] text-neutral-400">
          Les informations saisies sont utilisées uniquement pour traiter votre demande,
          conformément à la réglementation en vigueur sur la protection des données.
        </p>
        <button
          type="submit"
          className="inline-flex items-center px-5 py-2.5 rounded-full bg-amber-600 text-sm font-semibold text-neutral-900 hover:bg-amber-500 transition"
        >
          Envoyer la demande
        </button>
      </div>
    </form>
  );
}
