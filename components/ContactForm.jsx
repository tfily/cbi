"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

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

async function parseJsonSafe(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

function extractPackEntries(meta) {
  if (!meta) return [];
  const entries = [];

  const fromStructured = meta.cbi_pack_prices;
  if (fromStructured) {
    try {
      const parsed =
        typeof fromStructured === "string" ? JSON.parse(fromStructured) : fromStructured;
      if (Array.isArray(parsed)) {
        parsed.forEach((item) => {
          const size = Number(item?.size || item?.pack || item?.quantity);
          const price = item?.price || item?.value || "";
          if (!Number.isNaN(size) && size > 0 && price) {
            entries.push({ size, priceLabel: String(price) });
          }
        });
      } else if (parsed && typeof parsed === "object") {
        Object.entries(parsed).forEach(([key, value]) => {
          const size = Number(String(key).replace(/\D+/g, ""));
          if (!Number.isNaN(size) && size > 0 && value) {
            entries.push({ size, priceLabel: String(value) });
          }
        });
      }
    } catch {
      // Ignore malformed JSON
    }
  }

  Object.entries(meta).forEach(([key, value]) => {
    if (!value) return;
    const patterns = [
      /^cbi_price_pack_(\d+)$/i,
      /^cbi_pack_(\d+)_price$/i,
      /^cbi_price_(\d+)x?$/i,
      /^price_pack_(\d+)$/i,
      /^pack_(\d+)_price$/i,
    ];
    for (const pattern of patterns) {
      const match = key.match(pattern);
      if (match) {
        const size = Number(match[1]);
        if (!Number.isNaN(size) && size > 1) {
          entries.push({ size, priceLabel: String(value) });
        }
        break;
      }
    }
  });

  const uniq = new Map();
  for (const entry of entries) {
    const id = `pack${entry.size}`;
    if (!uniq.has(id)) {
      uniq.set(id, {
        mode: id,
        size: entry.size,
        label: `Pack ${entry.size}`,
        priceLabel: entry.priceLabel,
        amountMinor: parsePriceToMinor(entry.priceLabel),
      });
    }
  }

  return [...uniq.values()]
    .filter((item) => item.amountMinor)
    .sort((a, b) => a.size - b.size);
}

export default function ContactForm({ services = [], subscriptions = [] }) {
  const searchParams = useSearchParams();
  const paymentsEnabled = process.env.NEXT_PUBLIC_PAYMENTS_ENABLED !== "false";
  const selectedSlug = searchParams.get("service") || "";
  const selectedSubscription = searchParams.get("subscription") || "";
  const selectedPriceMode = searchParams.get("price_mode") || "";
  const selectedDate = searchParams.get("scheduled_date") || "";
  const selectedTimeSlot = searchParams.get("time_slot") || "";
  const [serviceChoice, setServiceChoice] = useState(selectedSlug);
  const [subscriptionChoice, setSubscriptionChoice] = useState(selectedSubscription);
  const [servicePricingMode, setServicePricingMode] = useState(
    selectedPriceMode || "unit"
  );
  const [scheduledDate, setScheduledDate] = useState(selectedDate);
  const [timeSlot, setTimeSlot] = useState(selectedTimeSlot);
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
        packOptions: extractPackEntries(s.meta),
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
  const selectedServicePricing = useMemo(() => {
    if (!selectedService) return null;
    if (servicePricingMode !== "unit") {
      const packOption = (selectedService.packOptions || []).find(
        (opt) => opt.mode === servicePricingMode
      );
      if (packOption) {
        return {
          mode: packOption.mode,
          label: packOption.priceLabel || selectedService.priceLabel,
          amountMinor: packOption.amountMinor,
        };
      }
    }
    return {
      mode: "unit",
      label: selectedService.priceLabel,
      amountMinor: selectedService.priceMinor,
    };
  }, [selectedService, servicePricingMode]);

  useEffect(() => {
    const availableModes = new Set([
      "unit",
      ...((selectedService?.packOptions || []).map((p) => p.mode)),
    ]);
    if (!availableModes.has(servicePricingMode)) {
      setServicePricingMode("unit");
    }
  }, [selectedService, servicePricingMode]);

  function getBookingFromForm() {
    const form = formRef.current;
    if (!form) return null;
    const data = new FormData(form);
    return {
      name: String(data.get("name") || "").trim(),
      email: String(data.get("email") || "").trim(),
      phone: String(data.get("phone") || "").trim(),
      scheduledDate: String(data.get("scheduled_date") || "").trim(),
      timeSlot: String(data.get("time_slot") || "").trim(),
      message: String(data.get("message") || "").trim(),
    };
  }

  async function handlePayNow() {
    setPayError("");
    const payable = selectedService;
    if (!selectedServicePricing?.amountMinor) {
      setPayError(
        "Ce service n a pas de tarif configure dans WordPress. Merci de nous contacter."
      );
      return;
    }

    const booking = getBookingFromForm();
    if (!booking) return;

    if (!booking.email) {
      setPayError("Merci de renseigner votre email avant de payer.");
      return;
    }
    if (!booking.scheduledDate) {
      setPayError("Merci de choisir une date d intervention avant de payer.");
      return;
    }

    const [firstName, ...rest] = booking.name.split(" ").filter(Boolean);
    const lastName = rest.join(" ");

    setIsPaying(true);
    try {
      const res = await fetch("/api/checkout/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceName: payable.label,
          serviceSlug: payable.slug,
          itemType: "service",
          amountMinor: selectedServicePricing.amountMinor,
          pricingOption: selectedServicePricing.mode,
          pricingLabel: selectedServicePricing.label || "",
          currency: "EUR",
          customerEmail: booking.email,
          customerFirstName: firstName || "",
          customerLastName: lastName || "",
          customerPhone: booking.phone || "",
          scheduledDate: booking.scheduledDate,
          timeSlot: booking.timeSlot || "",
        }),
      });

      const payload = await parseJsonSafe(res);
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

    const booking = getBookingFromForm();
    if (!booking) return;

    if (!booking.email) {
      setPayError("Merci de renseigner votre email avant de payer.");
      return;
    }
    if (!booking.scheduledDate) {
      setPayError("Merci de choisir une date d intervention avant de payer.");
      return;
    }

    const [firstName, ...rest] = booking.name.split(" ").filter(Boolean);
    const lastName = rest.join(" ");

    setIsPaying(true);
    try {
      const res = await fetch("/api/checkout/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceName: payable.label,
          serviceSlug: payable.slug,
          subscriptionSlug: payable.slug,
          itemType: "subscription",
          amountMinor: payable.priceMinor,
          currency: "EUR",
          customerEmail: booking.email,
          customerFirstName: firstName || "",
          customerLastName: lastName || "",
          customerPhone: booking.phone || "",
          scheduledDate: booking.scheduledDate,
          timeSlot: booking.timeSlot || "",
        }),
      });

      const payload = await parseJsonSafe(res);
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

    const booking = getBookingFromForm();
    if (!booking) return;
    const payload = {
      name: booking.name,
      email: booking.email,
      phone: booking.phone,
      serviceSlug: serviceChoice || "",
      subscriptionSlug: subscriptionChoice || "",
      scheduledDate: booking.scheduledDate,
      timeSlot: booking.timeSlot,
      message: booking.message,
      pricingOption: selectedServicePricing?.mode || "unit",
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

      const response = await parseJsonSafe(res);
      if (!res.ok) {
        throw new Error(response?.error || "Envoi impossible.");
      }

      setSubmitStatus("Merci, votre demande a bien été envoyée.");
      formRef.current?.reset();
      setServiceChoice("");
      setSubscriptionChoice("");
      setScheduledDate("");
      setTimeSlot("");
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
          <label className="block text-xs font-medium mb-1">
            Date d intervention
          </label>
          <input
            type="date"
            name="scheduled_date"
            required
            value={scheduledDate}
            onChange={(event) => setScheduledDate(event.target.value)}
            className="w-full rounded-lg border border-neutral-600 bg-neutral-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">
            Créneau (optionnel)
          </label>
          <input
            type="text"
            name="time_slot"
            placeholder="Ex: 09:00-12:00"
            value={timeSlot}
            onChange={(event) => setTimeSlot(event.target.value)}
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
            <>
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
              {selectedService?.packOptions?.length ? (
                <div className="mt-3">
                  <label className="block text-xs font-medium mb-1">Tarification</label>
                  <select
                    name="service_pricing"
                    value={servicePricingMode}
                    onChange={(event) => setServicePricingMode(event.target.value)}
                    className="w-full rounded-lg border border-neutral-600 bg-neutral-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="unit">
                      Tarif unitaire{selectedService.priceLabel ? ` - ${selectedService.priceLabel}` : ""}
                    </option>
                    {selectedService.packOptions.map((pack) => (
                      <option key={pack.mode} value={pack.mode}>
                        {pack.label}
                        {pack.priceLabel ? ` - ${pack.priceLabel}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
            </>
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
            disabled={!paymentsEnabled || isPaying || !selectedServicePricing?.amountMinor}
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
