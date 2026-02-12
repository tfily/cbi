"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useRef, useState } from "react";

function cleanHtml(str) {
  return str.replace(/<[^>]+>/g, "");
}

function parsePriceToMinor(value) {
  if (value == null) return null;
  if (typeof value === "number") return Math.round(value * 100);
  const match = String(value).replace(",", ".").match(/(\d+(\.\d+)?)/);
  if (!match) return null;
  const numeric = Number(match[1]);
  if (Number.isNaN(numeric)) return null;
  return Math.round(numeric * 100);
}

export default function ContactForm({ services = [], subscriptions = [] }) {
  const searchParams = useSearchParams();
  const paymentsEnabled = process.env.NEXT_PUBLIC_PAYMENTS_ENABLED !== "false";
  const selectedSlug = searchParams.get("service") || "";
  const selectedSubscription = searchParams.get("subscription") || "";
  const [serviceChoice, setServiceChoice] = useState(selectedSlug);
  const [subscriptionChoice, setSubscriptionChoice] = useState(selectedSubscription);
  const [isPaying, setIsPaying] = useState(false);
  const [payError, setPayError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState("");
  const formRef = useRef(null);

  const options = useMemo(
    () =>
      (services || []).map((s) => ({
        slug: s.slug,
        label: cleanHtml(s.title?.rendered || ""),
        priceLabel: s.meta?.cbi_price || s.meta?.price || "",
        priceMinor: parsePriceToMinor(s.meta?.cbi_price || s.meta?.price),
      })),
    [services]
  );

  const subscriptionOptions = useMemo(
    () =>
      (subscriptions || []).map((sub) => ({
        slug: sub.slug,
        label: cleanHtml(sub.title?.rendered || ""),
        priceLabel: sub.meta?.cbi_price || "",
        priceMinor: parsePriceToMinor(sub.meta?.cbi_price),
      })),
    [subscriptions]
  );

  const selectedService = useMemo(
    () => options.find((o) => o.slug === serviceChoice),
    [options, serviceChoice]
  );
  const selectedSubscriptionOption = useMemo(
    () => subscriptionOptions.find((o) => o.slug === subscriptionChoice),
    [subscriptionOptions, subscriptionChoice]
  );

  async function handlePayNow() {
    setPayError("");
    const payable = selectedService;
    if (!payable?.priceMinor) {
      setPayError(
        "Ce service n a pas de tarif configure dans WordPress. Merci de nous contacter."
      );
      return;
    }

    const form = formRef.current;
    if (!form) return;

    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    const phone = String(data.get("phone") || "").trim();

    if (!email) {
      setPayError("Merci de renseigner votre email avant de payer.");
      return;
    }

    const [firstName, ...rest] = name.split(" ").filter(Boolean);
    const lastName = rest.join(" ");

    setIsPaying(true);
    try {
      const res = await fetch("/api/checkout/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceName: payable.label,
          serviceSlug: payable.slug,
          amountMinor: payable.priceMinor,
          currency: "EUR",
          customerEmail: email,
          customerFirstName: firstName || "",
          customerLastName: lastName || "",
          customerPhone: phone || "",
        }),
      });

      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload?.error || "Paiement indisponible.");
      }

      if (payload?.redirectUrl) {
        window.location.href = payload.redirectUrl;
      } else {
        throw new Error("Redirection de paiement indisponible.");
      }
    } catch (error) {
      setPayError(error?.message || "Une erreur est survenue.");
    } finally {
      setIsPaying(false);
    }
  }

  async function handlePaySubscription() {
    setPayError("");
    const payable = selectedSubscriptionOption;
    if (!payable?.priceMinor) {
      setPayError(
        "Cette formule n a pas de tarif configure dans WordPress. Merci de nous contacter."
      );
      return;
    }

    const form = formRef.current;
    if (!form) return;

    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    const phone = String(data.get("phone") || "").trim();

    if (!email) {
      setPayError("Merci de renseigner votre email avant de payer.");
      return;
    }

    const [firstName, ...rest] = name.split(" ").filter(Boolean);
    const lastName = rest.join(" ");

    setIsPaying(true);
    try {
      const res = await fetch("/api/checkout/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceName: payable.label,
          serviceSlug: payable.slug,
          amountMinor: payable.priceMinor,
          currency: "EUR",
          customerEmail: email,
          customerFirstName: firstName || "",
          customerLastName: lastName || "",
          customerPhone: phone || "",
        }),
      });

      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload?.error || "Paiement indisponible.");
      }

      if (payload?.redirectUrl) {
        window.location.href = payload.redirectUrl;
      } else {
        throw new Error("Redirection de paiement indisponible.");
      }
    } catch (error) {
      setPayError(error?.message || "Une erreur est survenue.");
    } finally {
      setIsPaying(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitStatus("");
    setPayError("");

    const form = formRef.current;
    if (!form) return;

    const data = new FormData(form);
    const payload = {
      name: String(data.get("name") || "").trim(),
      email: String(data.get("email") || "").trim(),
      phone: String(data.get("phone") || "").trim(),
      serviceSlug: serviceChoice || "",
      subscriptionSlug: subscriptionChoice || "",
      message: String(data.get("message") || "").trim(),
    };

    if (!payload.email || !payload.message) {
      setSubmitStatus("Merci de renseigner votre email et votre demande.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const response = await res.json();
      if (!res.ok) {
        throw new Error(response?.error || "Envoi impossible.");
      }

      setSubmitStatus("Merci, votre demande a bien été envoyée.");
      form.reset();
      setServiceChoice("");
      setSubscriptionChoice("");
    } catch (error) {
      setSubmitStatus(error?.message || "Une erreur est survenue.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      ref={formRef}
      className="space-y-4"
      onSubmit={handleSubmit}
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
              value={serviceChoice}
              onChange={(event) => setServiceChoice(event.target.value)}
              className="w-full rounded-lg border border-neutral-600 bg-neutral-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">Choisir un service</option>
              {options.map((o) => (
                <option key={o.slug} value={o.slug}>
                  {o.label}
                  {o.priceLabel ? ` – ${o.priceLabel}` : ""}
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
        <div className="space-y-3">
          <label className="block text-xs font-medium mb-1">
            Formule d abonnement (optionnel)
          </label>
          <select
            name="subscription_plan"
            value={subscriptionChoice}
            onChange={(event) => setSubscriptionChoice(event.target.value)}
            className="w-full rounded-lg border border-neutral-600 bg-neutral-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="">Je souhaite discuter d une formule</option>
            {subscriptionOptions.map((sub) => (
              <option key={sub.slug} value={sub.slug}>
                {sub.label}
                {sub.priceLabel ? ` – ${sub.priceLabel}` : ""}
              </option>
            ))}
          </select>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handlePaySubscription}
            disabled={
              !paymentsEnabled ||
              isPaying ||
              !selectedSubscriptionOption?.priceMinor
            }
            className="inline-flex items-center px-4 py-2 rounded-full border border-neutral-500 text-xs font-semibold text-neutral-200 hover:bg-neutral-800/40 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isPaying ? "Redirection..." : "Payer abonnement"}
          </button>
        </div>
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
        <div className="flex flex-wrap gap-2 justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center px-5 py-2.5 rounded-full bg-amber-600 text-sm font-semibold text-neutral-900 hover:bg-amber-500 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Envoi..." : "Envoyer la demande"}
          </button>
          <button
            type="button"
            onClick={handlePayNow}
            disabled={!paymentsEnabled || isPaying || !selectedService?.priceMinor}
            className="inline-flex items-center px-5 py-2.5 rounded-full border border-amber-500 text-sm font-semibold text-amber-200 hover:bg-amber-500/20 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isPaying ? "Redirection..." : "Payer maintenant"}
          </button>
        </div>
      </div>
      {submitStatus ? (
        <p className="text-xs text-neutral-200">{submitStatus}</p>
      ) : null}
      {payError ? (
        <p className="text-xs text-amber-200">{payError}</p>
      ) : null}
    </form>
  );
}
