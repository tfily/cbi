"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function FeedbackForm() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") || "";
  const emailFromQuery = searchParams.get("email") || "";
  const [orderSummary, setOrderSummary] = useState(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState("");
  const [rating, setRating] = useState(5);
  const [name, setName] = useState("");
  const [email, setEmail] = useState(emailFromQuery);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [allowPublish, setAllowPublish] = useState(true);

  useEffect(() => {
    setEmail(emailFromQuery);
  }, [emailFromQuery]);

  useEffect(() => {
    if (!orderId || !emailFromQuery) {
      setOrderSummary(null);
      return;
    }

    let isActive = true;
    setIsLoadingSummary(true);
    setSummaryError("");

    fetch(
      `/api/feedback?orderId=${encodeURIComponent(orderId)}&email=${encodeURIComponent(
        emailFromQuery
      )}`,
      { cache: "no-store" }
    )
      .then(async (response) => {
        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(
            result?.error || "Impossible de vérifier cette commande."
          );
        }
        return result;
      })
      .then((result) => {
        if (!isActive) return;
        const order = result?.order || null;
        setOrderSummary(order);
        if (order?.customerName) {
          setName(order.customerName);
        }
        if (order?.customerEmail) {
          setEmail(order.customerEmail);
        }
        if (order?.serviceName) {
          setTitle(`Retour sur ${order.serviceName}`);
        }
      })
      .catch((error) => {
        if (!isActive) return;
        setOrderSummary(null);
        setSummaryError(
          error?.message || "Impossible de vérifier cette commande."
        );
      })
      .finally(() => {
        if (isActive) {
          setIsLoadingSummary(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [orderId, emailFromQuery]);

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus("");

    const payload = {
      orderId,
      rating,
      name: String(name || "").trim(),
      email: String(email || "").trim(),
      title: String(title || "").trim(),
      message: String(message || "").trim(),
      allowPublish,
    };

    if (!payload.orderId || !payload.email || !payload.message) {
      setStatus("Merci de renseigner les champs obligatoires.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result?.error || "Envoi impossible.");
      }

      setStatus(
        "Merci. Votre avis a bien été envoyé et sera relu avant publication."
      );
      setRating(5);
      setTitle(orderSummary?.serviceName ? `Retour sur ${orderSummary.serviceName}` : "");
      setMessage("");
      setAllowPublish(true);
    } catch (error) {
      setStatus(error?.message || "Une erreur est survenue.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {orderSummary ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-800">
            Prestation concernée
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-neutral-500">Service</p>
              <p className="mt-1 text-sm font-semibold text-neutral-900">
                {orderSummary.serviceName || "Commande vérifiée"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-neutral-500">Commande</p>
              <p className="mt-1 text-sm font-semibold text-neutral-900">
                #{orderSummary.orderId}
              </p>
            </div>
            {orderSummary.pricingLabel ? (
              <div>
                <p className="text-xs font-medium text-neutral-500">Pack / formule</p>
                <p className="mt-1 text-sm text-neutral-800">
                  {orderSummary.pricingLabel}
                </p>
              </div>
            ) : null}
            {orderSummary.orderDate ? (
              <div>
                <p className="text-xs font-medium text-neutral-500">Date</p>
                <p className="mt-1 text-sm text-neutral-800">
                  {new Date(orderSummary.orderDate).toLocaleDateString("fr-FR")}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {isLoadingSummary ? (
        <p className="text-sm text-neutral-500">
          Vérification de votre commande en cours...
        </p>
      ) : null}

      {summaryError ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {summaryError}
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-xs font-medium mb-1">Commande</label>
          <input
            type="text"
            value={orderId}
            readOnly
            className="w-full rounded-lg border border-neutral-300 bg-neutral-100 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Note</label>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((value) => {
              const isActive = rating === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-full border text-sm font-semibold transition ${
                    isActive
                      ? "border-amber-700 bg-amber-700 text-white"
                      : "border-neutral-300 bg-white text-neutral-700 hover:border-amber-400"
                  }`}
                  aria-label={`${value} sur 5`}
                >
                  {value}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-neutral-500">
            {rating === 5
              ? "Excellent"
              : rating === 4
                ? "Très bien"
                : rating === 3
                  ? "Bien"
                  : rating === 2
                    ? "Moyen"
                    : "Insatisfait"}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-xs font-medium mb-1">Nom</label>
          <input
            type="text"
            name="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium mb-1">Titre</label>
        <input
          type="text"
          name="title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Ex : Service très fluide et rassurant"
          className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      </div>

      <div>
        <label className="block text-xs font-medium mb-1">Votre avis</label>
        <textarea
          rows={6}
          name="message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          required
          placeholder="Dites-nous ce qui s’est bien passé, ce qui peut être amélioré et si vous recommanderiez le service."
          className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      </div>

      <label className="flex items-start gap-3 text-sm text-neutral-700">
        <input
          type="checkbox"
          name="allow_publish"
          className="mt-1"
          checked={allowPublish}
          onChange={(event) => setAllowPublish(event.target.checked)}
        />
        <span>
          J&apos;autorise Conciergerie by Isa à réutiliser cet avis, après
          validation, comme témoignage client.
        </span>
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting || isLoadingSummary || !orderId || !email}
          className="inline-flex items-center rounded-full bg-amber-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-800 disabled:opacity-60"
        >
          {isSubmitting ? "Envoi..." : "Envoyer mon avis"}
        </button>
        <a
          href="/"
          className="inline-flex items-center rounded-full border border-neutral-300 px-5 py-2.5 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
        >
          Retour à l’accueil
        </a>
      </div>

      {status ? <p className="text-sm text-neutral-700">{status}</p> : null}
    </form>
  );
}
