"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

export default function FeedbackForm() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") || "";
  const emailFromQuery = searchParams.get("email") || "";
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState("");
  const [rating, setRating] = useState("5");

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus("");

    const formData = new FormData(event.currentTarget);
    const payload = {
      orderId,
      rating,
      name: String(formData.get("name") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      title: String(formData.get("title") || "").trim(),
      message: String(formData.get("message") || "").trim(),
      allowPublish: formData.get("allow_publish") === "on",
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

      setStatus("Merci. Votre avis a bien été envoyé.");
      event.currentTarget.reset();
      setRating("5");
    } catch (error) {
      setStatus(error?.message || "Une erreur est survenue.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
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
          <select
            value={rating}
            onChange={(event) => setRating(event.target.value)}
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="5">5 - Excellent</option>
            <option value="4">4 - Très bien</option>
            <option value="3">3 - Bien</option>
            <option value="2">2 - Moyen</option>
            <option value="1">1 - Insatisfait</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-xs font-medium mb-1">Nom</label>
          <input
            type="text"
            name="name"
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Email</label>
          <input
            type="email"
            name="email"
            defaultValue={emailFromQuery}
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
          placeholder="Ex : Service très fluide et rassurant"
          className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      </div>

      <div>
        <label className="block text-xs font-medium mb-1">Votre avis</label>
        <textarea
          rows={6}
          name="message"
          required
          placeholder="Dites-nous ce qui s’est bien passé, ce qui peut être amélioré et si vous recommanderiez le service."
          className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      </div>

      <label className="flex items-start gap-3 text-sm text-neutral-700">
        <input type="checkbox" name="allow_publish" className="mt-1" />
        <span>
          J&apos;autorise Conciergerie by Isa à réutiliser cet avis, après
          validation, comme témoignage client.
        </span>
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
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
