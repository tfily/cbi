"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

function cleanHtml(str) {
  const noTags = String(str || "").replace(/<[^>]+>/g, "");
  return noTags
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;|&rsquo;|&#8217;/g, "’")
    .replace(/&ldquo;|&#8220;/g, "“")
    .replace(/&rdquo;|&#8221;/g, "”")
    .replace(/&eacute;/g, "é")
    .replace(/&egrave;/g, "è")
    .replace(/&ecirc;/g, "ê")
    .replace(/&agrave;/g, "à")
    .replace(/&ccedil;/g, "ç");
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

function parseBooleanMeta(value) {
  if (typeof value === "boolean") return value;
  const normalized = String(value || "").trim().toLowerCase();
  return ["1", "true", "yes", "on", "oui"].includes(normalized);
}

function normalizeKey(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function formatEuroLabel(value) {
  if (value == null || value === "") return "";
  const raw = String(value).trim();
  if (!raw) return "";
  if (raw.includes("€")) return raw;
  if (/eur/i.test(raw)) return raw.replace(/eur/gi, "€");
  const numeric = Number(raw.replace(",", "."));
  if (!Number.isNaN(numeric)) {
    const fixed = Number.isInteger(numeric)
      ? String(numeric)
      : numeric.toFixed(2).replace(/\.00$/, "").replace(".", ",");
    return `${fixed}€`;
  }
  return `${raw}€`;
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

function buildApiErrorMessage(response, payload, fallback) {
  const cawlErrorId = payload?.details?.errors?.[0]?.id;
  const detailed =
    payload?.error ||
    payload?.details?.message ||
    payload?.details?.error ||
    payload?.raw;
  if (detailed) {
    if (cawlErrorId) return `${detailed} (${cawlErrorId})`;
    return detailed;
  }
  return `${fallback} (HTTP ${response.status})`;
}

function startOfWeekMonday(inputYmd) {
  if (!inputYmd) return "";
  const date = new Date(`${inputYmd}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const dayOfMonth = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${dayOfMonth}`;
}

function isWeekendDate(inputYmd) {
  if (!inputYmd) return false;
  const date = new Date(`${inputYmd}T00:00:00`);
  if (Number.isNaN(date.getTime())) return false;
  const day = date.getDay();
  return day === 0 || day === 6;
}

function buildDefaultWorkingSlots() {
  const slots = [];
  for (let hour = 8; hour < 20; hour += 1) {
    const start = String(hour).padStart(2, "0");
    const end = String(hour + 1).padStart(2, "0");
    slots.push({
      slot: `${start}:00-${end}:00`,
      capacity: 1,
      booked: 0,
      remaining: 1,
      state: "available",
    });
  }
  return slots;
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

function FormModeBanner({ formTheme, modeSummary }) {
  return (
    <div className={`rounded-2xl border px-4 py-4 shadow-sm ${formTheme.panelClassName}`}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <span
            className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] ${formTheme.badgeClassName}`}
          >
            {formTheme.eyebrow}
          </span>
          <div>
            <p className="text-lg font-semibold">{formTheme.title}</p>
            {formTheme.description ? (
              <p className={`text-sm ${formTheme.accentSoftTextClassName}`}>
                {formTheme.description}
              </p>
            ) : null}
          </div>
        </div>
        <p className={`max-w-md text-sm md:text-right ${formTheme.accentTextClassName}`}>
          {modeSummary}
        </p>
      </div>
    </div>
  );
}

function IdentityFields({ fieldClassName }) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div>
        <label className="block text-xs font-medium mb-1">Nom complet</label>
        <input type="text" name="name" required className={fieldClassName} />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1">Email</label>
        <input type="email" name="email" required className={fieldClassName} />
      </div>
    </div>
  );
}

function SchedulingFields({
  fieldClassName,
  scheduledDate,
  setScheduledDate,
  timeSlot,
  setTimeSlot,
  availableSlots,
  slotsLoading,
}) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div>
        <label className="block text-xs font-medium mb-1">Date d'intervention</label>
        <input
          type="date"
          name="scheduled_date"
          required
          value={scheduledDate}
          onChange={(event) => setScheduledDate(event.target.value)}
          className={fieldClassName}
        />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1">Créneau (optionnel)</label>
        {availableSlots.length > 0 ? (
          <select
            name="time_slot"
            value={timeSlot}
            onChange={(event) => setTimeSlot(event.target.value)}
            className={fieldClassName}
          >
            <option value="">Choisir un créneau</option>
            {availableSlots.map((slot) => (
              <option key={slot.slot} value={slot.slot}>
                {slot.slot}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            name="time_slot"
            placeholder={slotsLoading ? "Chargement des créneaux..." : "Ex : 09:00-10:00"}
            value={timeSlot}
            onChange={(event) => setTimeSlot(event.target.value)}
            className={fieldClassName}
          />
        )}
      </div>
    </div>
  );
}

function ServiceFields({
  fieldClassName,
  isCustomRequest,
  options,
  serviceChoice,
  setServiceChoice,
  selectedService,
  selectedServicePricing,
  selectedServiceHeadlinePrice,
  servicePricingMode,
  setServicePricingMode,
  formTheme,
}) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div>
        <label className="block text-xs font-medium mb-1">Téléphone</label>
        <input type="tel" name="phone" className={fieldClassName} />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1">Type de service</label>
        {isCustomRequest ? (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-sky-500/40 bg-sky-950/20 px-3 py-2 text-sm text-sky-100">
            <span>Mode sur-mesure actif. Décrivez votre besoin dans les champs ci-dessous.</span>
            <a
              href="/#contact"
              className="shrink-0 text-xs font-semibold text-sky-200 hover:underline"
            >
              Revenir au catalogue
            </a>
          </div>
        ) : options.length ? (
          <>
            <select
              name="service_type"
              value={serviceChoice}
              onChange={(event) => setServiceChoice(event.target.value)}
              className={fieldClassName}
            >
              <option value="">Choisir un service</option>
              {options.map((option) => (
                <option key={option.slug} value={option.slug}>
                  {option.label}
                  {option.priceKind === "fee" && option.priceLabel
                    ? ` - Frais de service ${formatEuroLabel(option.priceLabel)}`
                    : option.priceLabel
                      ? ` - Prix unitaire ${formatEuroLabel(option.priceLabel)}`
                      : option.bookingFeeMinor
                        ? ` - Frais de service ${formatEuroLabel(
                            (option.bookingFeeMinor / 100).toFixed(2)
                          )}`
                        : ""}
                </option>
              ))}
            </select>
            {selectedService?.invoiceOnly ? (
              <p className="mt-2 text-xs text-amber-200">
                Ce service est traité sur devis. Utilisez le contact ci-dessous.
              </p>
            ) : null}
            {selectedServicePricing?.bookingFeeMinor ? (
              <p className={`mt-2 text-xs ${formTheme.accentSoftTextClassName}`}>
                Frais de réservation transport inclus :{" "}
                {(selectedServicePricing.bookingFeeMinor / 100).toFixed(2)} €
              </p>
            ) : null}
            {selectedServiceHeadlinePrice ? (
              <p className={`mt-2 text-xs ${formTheme.accentSoftTextClassName}`}>
                {selectedServiceHeadlinePrice}
              </p>
            ) : null}
            {selectedService?.packOptions?.length ? (
              <div className="mt-3">
                <label className="block text-xs font-medium mb-1">Tarification</label>
                <select
                  name="service_pricing"
                  value={servicePricingMode}
                  onChange={(event) => setServicePricingMode(event.target.value)}
                  className={fieldClassName}
                >
                  <option value="unit">
                    Prix unitaire
                    {selectedService.priceLabel
                      ? ` - ${formatEuroLabel(selectedService.priceLabel)}`
                      : ""}
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
            className={fieldClassName}
            placeholder="Ex : courses, pressing, garde d'animaux..."
          />
        )}
      </div>
    </div>
  );
}

function CustomRequestFields({ fieldClassName, isCustomRequest }) {
  if (!isCustomRequest) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <label className="block text-xs font-medium mb-1">Service recherché</label>
        <input
          type="text"
          name="custom_service_title"
          required={isCustomRequest}
          placeholder="Ex : accompagnement événement, aide ponctuelle, mission exceptionnelle"
          className={fieldClassName}
        />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1">Lieu / secteur</label>
        <input
          type="text"
          name="location"
          placeholder="Ville, quartier ou adresse approximative"
          className={fieldClassName}
        />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1">Fréquence</label>
        <select name="frequency" className={fieldClassName} defaultValue="">
          <option value="">Ponctuel ou récurrent ?</option>
          <option value="one_off">Besoin ponctuel</option>
          <option value="weekly">Chaque semaine</option>
          <option value="monthly">Chaque mois</option>
          <option value="custom">Rythme à définir</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium mb-1">Budget estimatif</label>
        <input
          type="text"
          name="budget"
          placeholder="Ex : 80-120 € ou sur devis"
          className={fieldClassName}
        />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1">Préférence de contact</label>
        <select name="preferred_contact" className={fieldClassName} defaultValue="">
          <option value="">Choisir</option>
          <option value="phone">Téléphone</option>
          <option value="email">Email</option>
          <option value="whatsapp">WhatsApp</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium mb-1">Urgence</label>
        <select name="urgency" className={fieldClassName} defaultValue="">
          <option value="">Choisir</option>
          <option value="asap">Dès que possible</option>
          <option value="this_week">Cette semaine</option>
          <option value="this_month">Ce mois-ci</option>
          <option value="flexible">Flexible</option>
        </select>
      </div>
      <div className="md:col-span-2">
        <label className="block text-xs font-medium mb-1">
          Détails du service sur-mesure
        </label>
        <textarea
          rows={4}
          name="custom_service_details"
          placeholder="Contexte, contraintes, attentes, volume estimé, horaires, personnes concernées..."
          className={fieldClassName}
        />
      </div>
    </div>
  );
}

function SubscriptionFields({
  fieldClassName,
  subscriptionOptions,
  subscriptionChoice,
  setSubscriptionChoice,
  selectedSubscriptionOption,
  handlePaySubscription,
  paymentsEnabled,
  isPaying,
  formTheme,
}) {
  if (!subscriptionOptions.length) return null;

  return (
    <div className="space-y-3">
      <label className="block text-xs font-medium mb-1">
        Formule d'abonnement (optionnel)
      </label>
      <select
        name="subscription_plan"
        value={subscriptionChoice}
        onChange={(event) => setSubscriptionChoice(event.target.value)}
        className={fieldClassName}
      >
        <option value="">Je souhaite discuter d'une formule</option>
        {subscriptionOptions.map((sub) => (
          <option key={sub.slug} value={sub.slug}>
            {sub.label}
            {sub.priceLabel ? ` – ${sub.priceLabel}` : ""}
          </option>
        ))}
      </select>
      {selectedSubscriptionOption ? (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handlePaySubscription}
            disabled={
              !paymentsEnabled || isPaying || !selectedSubscriptionOption.priceMinor
            }
            className={`inline-flex items-center px-4 py-2 rounded-full border text-xs font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed ${formTheme.payButtonClassName}`}
          >
            {isPaying ? "Redirection..." : "Payer l'abonnement"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function MessageField({ fieldClassName, formMode }) {
  const placeholder =
    formMode === "subscription"
      ? "Précisez la date de démarrage souhaitée, vos attentes et votre rythme."
      : formMode === "service"
        ? "Précisez la date souhaitée, l'adresse, les horaires et toute contrainte utile."
        : formMode === "custom"
          ? "Décrivez la mission, le contexte, les personnes concernées et vos attentes."
          : "Précisez votre besoin, vos disponibilités et toute information utile.";

  return (
    <div>
      <label className="block text-xs font-medium mb-1">Votre demande</label>
      <textarea
        rows={4}
        name="message"
        className={fieldClassName}
        placeholder={placeholder}
      />
    </div>
  );
}

function FormActions({
  formMode,
  formTheme,
  isSubmitting,
  isPaying,
  handlePayNow,
  paymentsEnabled,
  selectedServicePricing,
  selectedService,
}) {
  return (
    <div className="flex items-center justify-between gap-4 pt-2">
      <p className="text-[11px] text-neutral-400">
        Les informations saisies sont utilisées uniquement pour traiter votre demande,
        conformément à la réglementation en vigueur sur la protection des données.
      </p>
      <div className="flex flex-wrap gap-2 justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className={`inline-flex items-center px-5 py-2.5 rounded-full text-sm font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed ${formTheme.submitButtonClassName}`}
        >
          {isSubmitting
            ? "Envoi..."
            : formMode === "subscription"
              ? "Demander des informations sur la formule"
              : formMode === "service"
                ? "Envoyer la réservation"
                : formMode === "custom"
                  ? "Envoyer la demande sur-mesure"
                  : "Envoyer la demande"}
        </button>
        {formMode === "service" ? (
          <button
            type="button"
            onClick={handlePayNow}
            disabled={
              !paymentsEnabled ||
              isPaying ||
              !selectedServicePricing?.amountMinor ||
              selectedService?.invoiceOnly
            }
            className={`inline-flex items-center px-5 py-2.5 rounded-full border text-sm font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed ${formTheme.payButtonClassName}`}
          >
            {isPaying ? "Redirection..." : "Payer maintenant"}
          </button>
        ) : null}
        {selectedService?.invoiceOnly ? (
          <a
            href={selectedService.contactUrl || "#contact"}
            className="inline-flex items-center px-5 py-2.5 rounded-full border border-neutral-500 text-sm font-semibold text-neutral-200 hover:bg-neutral-800/40 transition"
          >
            Contacter pour devis
          </a>
        ) : null}
      </div>
    </div>
  );
}

export default function ContactForm({ services = [], subscriptions = [] }) {
  const searchParams = useSearchParams();
  const paymentsEnabled = process.env.NEXT_PUBLIC_PAYMENTS_ENABLED !== "false";
  const selectedSlug = searchParams.get("service") || "";
  const selectedSubscription = searchParams.get("subscription") || "";
  const customRequestParam = searchParams.get("custom_request");
  const initialCustomRequest =
    customRequestParam === "1" ||
    customRequestParam === "2" ||
    selectedSlug === "custom-request";
  const selectedPriceMode = searchParams.get("price_mode") || "";
  const selectedDate = searchParams.get("scheduled_date") || "";
  const selectedTimeSlot = searchParams.get("time_slot") || "";
  const [serviceChoice, setServiceChoice] = useState(selectedSlug);
  const [subscriptionChoice, setSubscriptionChoice] = useState(selectedSubscription);
  const [isCustomRequest, setIsCustomRequest] = useState(initialCustomRequest);
  const [servicePricingMode, setServicePricingMode] = useState(
    selectedPriceMode || "unit"
  );
  const [scheduledDate, setScheduledDate] = useState(selectedDate);
  const [timeSlot, setTimeSlot] = useState(selectedTimeSlot);
  const [isPaying, setIsPaying] = useState(false);
  const [payError, setPayError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState("");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const formRef = useRef(null);

  const options = useMemo(
    () =>
      (services || []).map((s) => ({
        normalizedLabel: normalizeKey(cleanHtml(s.title?.rendered || "")),
        slug: s.slug,
        label: cleanHtml(s.title?.rendered || ""),
        priceLabel: s.meta?.cbi_price || s.meta?.price || "",
        priceMinor: parsePriceToMinor(s.meta?.cbi_price || s.meta?.price),
        invoiceOnly:
          parseBooleanMeta(s.meta?.cbi_invoice_only) ||
          String(s.meta?.cbi_payment_mode || "").toLowerCase() === "invoice" ||
          /coach/i.test(String(s.slug || "")),
        contactUrl: s.meta?.cbi_invoice_contact_url || "#contact",
        priceKind: String(s.meta?.cbi_price_kind || "").toLowerCase(),
        bookingFeeMinor:
          parsePriceToMinor(s.meta?.cbi_booking_fee) ||
          (normalizeKey(cleanHtml(s.title?.rendered || "")) ===
          "reservation de transports"
            ? 500
            : 0),
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

  useEffect(() => {
    if (!selectedSubscription) return;
    if ((subscriptionOptions || []).some((o) => o.slug === selectedSubscription)) {
      setSubscriptionChoice(selectedSubscription);
      return;
    }
    const aliases = {
      proactif: "premium",
      offre_signature: "premium",
      offresignature: "premium",
    };
    const aliasSlug = aliases[normalizeKey(selectedSubscription).replace(/\s+/g, "_")];
    if (aliasSlug && (subscriptionOptions || []).some((o) => o.slug === aliasSlug)) {
      setSubscriptionChoice(aliasSlug);
      return;
    }
    const normalizedQuery = normalizeKey(selectedSubscription);
    const aliasMatch = (subscriptionOptions || []).find((o) =>
      normalizeKey(o.label).includes(normalizedQuery)
    );
    if (aliasMatch) {
      setSubscriptionChoice(aliasMatch.slug);
    }
  }, [selectedSubscription, subscriptionOptions]);

  useEffect(() => {
    if (selectedSlug === "custom-request") {
      setIsCustomRequest(true);
      setServiceChoice("");
    }
  }, [selectedSlug]);

  const selectedService = useMemo(
    () => options.find((o) => o.slug === serviceChoice),
    [options, serviceChoice]
  );
  const selectedSubscriptionOption = useMemo(
    () => subscriptionOptions.find((o) => o.slug === subscriptionChoice),
    [subscriptionOptions, subscriptionChoice]
  );
  const formMode = useMemo(() => {
    if (isCustomRequest) return "custom";
    if (selectedSubscriptionOption) return "subscription";
    if (selectedService) return "service";
    return "request";
  }, [isCustomRequest, selectedService, selectedSubscriptionOption]);
  const formTheme = useMemo(() => {
    const themes = {
      request: {
        panelClassName:
          "border-neutral-700/80 bg-neutral-950/70 text-neutral-100",
        badgeClassName:
          "border-neutral-600 bg-neutral-900 text-neutral-200",
        eyebrow: "Demande simple",
        title: "Parlez-nous de votre besoin",
        description: "",
        accentTextClassName: "text-neutral-200",
        accentSoftTextClassName: "text-neutral-400",
        focusRingClassName: "focus:ring-neutral-400",
        inputBorderClassName: "border-neutral-600",
        inputBgClassName: "bg-neutral-900",
        submitButtonClassName:
          "bg-neutral-100 text-neutral-950 hover:bg-white",
        payButtonClassName:
          "border-neutral-500 text-neutral-200 hover:bg-neutral-800/40",
      },
      service: {
        panelClassName:
          "border-amber-500/40 bg-amber-950/20 text-amber-50",
        badgeClassName:
          "border-amber-400/40 bg-amber-500/15 text-amber-100",
        eyebrow: "Réservation de service",
        title: "Préparez votre réservation",
        description: "",
        accentTextClassName: "text-amber-100",
        accentSoftTextClassName: "text-amber-200/80",
        focusRingClassName: "focus:ring-amber-500",
        inputBorderClassName: "border-amber-500/35",
        inputBgClassName: "bg-neutral-950",
        submitButtonClassName:
          "bg-amber-600 text-neutral-950 hover:bg-amber-500",
        payButtonClassName:
          "border-amber-500 text-amber-200 hover:bg-amber-500/20",
      },
      subscription: {
        panelClassName:
          "border-emerald-500/40 bg-emerald-950/20 text-emerald-50",
        badgeClassName:
          "border-emerald-400/40 bg-emerald-500/15 text-emerald-100",
        eyebrow: "Abonnement",
        title: "Activez votre formule",
        description: "",
        accentTextClassName: "text-emerald-100",
        accentSoftTextClassName: "text-emerald-200/80",
        focusRingClassName: "focus:ring-emerald-500",
        inputBorderClassName: "border-emerald-500/35",
        inputBgClassName: "bg-neutral-950",
        submitButtonClassName:
          "bg-emerald-500 text-neutral-950 hover:bg-emerald-400",
        payButtonClassName:
          "border-emerald-500 text-emerald-200 hover:bg-emerald-500/20",
      },
      custom: {
        panelClassName:
          "border-sky-500/40 bg-sky-950/20 text-sky-50",
        badgeClassName:
          "border-sky-400/40 bg-sky-500/15 text-sky-100",
        eyebrow: "Demande sur-mesure",
        title: "Décrivez votre mission",
        description: "",
        accentTextClassName: "text-sky-100",
        accentSoftTextClassName: "text-sky-200/80",
        focusRingClassName: "focus:ring-sky-500",
        inputBorderClassName: "border-sky-500/35",
        inputBgClassName: "bg-neutral-950",
        submitButtonClassName:
          "bg-sky-500 text-neutral-950 hover:bg-sky-400",
        payButtonClassName:
          "border-sky-500 text-sky-200 hover:bg-sky-500/20",
      },
    };
    return themes[formMode];
  }, [formMode]);
  const fieldClassName = `w-full rounded-lg border ${formTheme.inputBorderClassName} ${formTheme.inputBgClassName} px-3 py-2 text-sm focus:outline-none focus:ring-2 ${formTheme.focusRingClassName}`;
  const selectedServicePricing = useMemo(() => {
    if (!selectedService) return null;
    const bookingFeeMinor = Number(selectedService.bookingFeeMinor || 0);
    const isTransportReservation =
      selectedService.normalizedLabel === "reservation de transports";
    const baseUnitMinor = isTransportReservation
      ? 0
      : Number(selectedService.priceMinor || 0);
    if (servicePricingMode !== "unit") {
      const packOption = (selectedService.packOptions || []).find(
        (opt) => opt.mode === servicePricingMode
      );
      if (packOption) {
        const amountMinor = Number(packOption.amountMinor || 0) + bookingFeeMinor;
        return {
          mode: packOption.mode,
          label: packOption.priceLabel || selectedService.priceLabel,
          amountMinor,
          bookingFeeMinor,
        };
      }
    }
    const amountMinor = Number(selectedService.priceMinor || 0) + bookingFeeMinor;
    return {
      mode: "unit",
      label: selectedService.priceLabel,
      amountMinor: baseUnitMinor + bookingFeeMinor,
      bookingFeeMinor,
    };
  }, [selectedService, servicePricingMode]);

  const selectedServiceHeadlinePrice = useMemo(() => {
    if (!selectedService) return "";
    if (selectedService.priceKind === "fee" && selectedService.priceLabel) {
      return `Frais de service ${formatEuroLabel(selectedService.priceLabel)}`;
    }
    if (selectedService.priceLabel) {
      return `Prix unitaire ${formatEuroLabel(selectedService.priceLabel)}`;
    }
    if (selectedService.bookingFeeMinor) {
      return `Frais de service ${formatEuroLabel(
        (selectedService.bookingFeeMinor / 100).toFixed(2)
      )}`;
    }
    return "";
  }, [selectedService]);
  const modeSummary = useMemo(() => {
    if (formMode === "subscription" && selectedSubscriptionOption) {
      return `Formule sélectionnée : ${selectedSubscriptionOption.label}${
        selectedSubscriptionOption.priceLabel
          ? ` • ${selectedSubscriptionOption.priceLabel}`
          : ""
      }`;
    }
    if (formMode === "service" && selectedService) {
      return `Service sélectionné : ${selectedService.label}${
        selectedServiceHeadlinePrice ? ` • ${selectedServiceHeadlinePrice}` : ""
      }`;
    }
    if (formMode === "custom") {
      return "Vous êtes en mode sur-mesure : détaillez le besoin, le contexte et les contraintes.";
    }
    return "Aucun service imposé : nous utiliserons votre message pour orienter la demande.";
  }, [
    formMode,
    selectedService,
    selectedServiceHeadlinePrice,
    selectedSubscriptionOption,
  ]);

  useEffect(() => {
    const availableModes = new Set([
      "unit",
      ...((selectedService?.packOptions || []).map((p) => p.mode)),
    ]);
    if (!availableModes.has(servicePricingMode)) {
      setServicePricingMode("unit");
    }
  }, [selectedService, servicePricingMode]);

  useEffect(() => {
    const slug = subscriptionChoice || serviceChoice;
    const weekStart = startOfWeekMonday(scheduledDate);
    if (!slug || !scheduledDate || !weekStart) {
      setAvailableSlots([]);
      return;
    }

    let cancelled = false;
    async function loadSlots() {
      setSlotsLoading(true);
      try {
        const res = await fetch(
          `/api/availability?slug=${encodeURIComponent(slug)}&week_start=${encodeURIComponent(
            weekStart
          )}`
        );
        const payload = await parseJsonSafe(res);
        if (!res.ok) throw new Error(payload?.error || "Indisponible");
        const dayData = (payload?.days || []).find((day) => day?.date === scheduledDate);
        const apiSlots = Array.isArray(dayData?.slots) ? dayData.slots : [];
        const slotsSource =
          !isWeekendDate(scheduledDate) && apiSlots.length === 0
            ? buildDefaultWorkingSlots()
            : apiSlots;
        const slots = slotsSource.filter(
          (slot) =>
            slot?.slot &&
            String(slot.state || "").toLowerCase() !== "full" &&
            Number(slot.remaining || 0) > 0
        );
        if (!cancelled) setAvailableSlots(slots);
      } catch {
        if (!cancelled) setAvailableSlots([]);
      } finally {
        if (!cancelled) setSlotsLoading(false);
      }
    }

    loadSlots();
    return () => {
      cancelled = true;
    };
  }, [serviceChoice, subscriptionChoice, scheduledDate]);

  useEffect(() => {
    if (!timeSlot) return;
    if (!availableSlots.length) return;
    const found = availableSlots.some((slot) => slot.slot === timeSlot);
    if (!found) setTimeSlot("");
  }, [availableSlots, timeSlot]);

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
      customServiceTitle: String(data.get("custom_service_title") || "").trim(),
      customServiceDetails: String(data.get("custom_service_details") || "").trim(),
      location: String(data.get("location") || "").trim(),
      frequency: String(data.get("frequency") || "").trim(),
      budget: String(data.get("budget") || "").trim(),
      preferredContact: String(data.get("preferred_contact") || "").trim(),
      urgency: String(data.get("urgency") || "").trim(),
    };
  }

  async function handlePayNow() {
    setPayError("");
    const payable = selectedService;
    if (!selectedServicePricing?.amountMinor) {
      setPayError(
        "Ce service n'a pas de tarif configuré dans WordPress. Merci de nous contacter."
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
      setPayError("Merci de choisir une date d'intervention avant de payer.");
      return;
    }
    if (isWeekendDate(booking.scheduledDate)) {
      setPayError("Les interventions ne sont pas disponibles le week-end.");
      return;
    }
    if (availableSlots.length > 0 && !booking.timeSlot) {
      setPayError("Merci de choisir un créneau disponible avant de payer.");
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
        throw new Error(
          buildApiErrorMessage(res, payload, "Paiement indisponible.")
        );
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
        "Cette formule n'a pas de tarif configuré dans WordPress. Merci de nous contacter."
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
      setPayError("Merci de choisir une date d'intervention avant de payer.");
      return;
    }
    if (isWeekendDate(booking.scheduledDate)) {
      setPayError("Les interventions ne sont pas disponibles le week-end.");
      return;
    }
    if (availableSlots.length > 0 && !booking.timeSlot) {
      setPayError("Merci de choisir un créneau disponible avant de payer.");
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
        throw new Error(
          buildApiErrorMessage(res, payload, "Paiement indisponible.")
        );
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
      serviceSlug: isCustomRequest ? "" : serviceChoice || "",
      subscriptionSlug: subscriptionChoice || "",
      scheduledDate: booking.scheduledDate,
      timeSlot: booking.timeSlot,
      message: booking.message,
      pricingOption: selectedServicePricing?.mode || "unit",
      requestType: isCustomRequest ? "custom_service" : "standard",
      customServiceTitle: booking.customServiceTitle,
      customServiceDetails: booking.customServiceDetails,
      location: booking.location,
      frequency: booking.frequency,
      budget: booking.budget,
      preferredContact: booking.preferredContact,
      urgency: booking.urgency,
    };

    if (!payload.email || !payload.message) {
      setSubmitStatus("Merci de renseigner votre email et votre demande.");
      return;
    }
    if (payload.requestType === "custom_service" && !payload.customServiceTitle) {
      setSubmitStatus("Merci de préciser le service sur-mesure recherché.");
      return;
    }
    if (isWeekendDate(payload.scheduledDate)) {
      setSubmitStatus("Les interventions ne sont pas disponibles le week-end.");
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
        throw new Error(buildApiErrorMessage(res, response, "Envoi impossible."));
      }

      setSubmitStatus("Merci, votre demande a bien été envoyée.");
      formRef.current?.reset();
      setServiceChoice("");
      setSubscriptionChoice("");
      setScheduledDate("");
      setTimeSlot("");
      setIsCustomRequest(false);
    } catch (error) {
      setSubmitStatus(error?.message || "Une erreur est survenue.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form ref={formRef} className="space-y-4" onSubmit={handleSubmit}>
      <FormModeBanner formTheme={formTheme} modeSummary={modeSummary} />
      <IdentityFields fieldClassName={fieldClassName} />
      <SchedulingFields
        fieldClassName={fieldClassName}
        scheduledDate={scheduledDate}
        setScheduledDate={setScheduledDate}
        timeSlot={timeSlot}
        setTimeSlot={setTimeSlot}
        availableSlots={availableSlots}
        slotsLoading={slotsLoading}
      />
      <ServiceFields
        fieldClassName={fieldClassName}
        isCustomRequest={isCustomRequest}
        options={options}
        serviceChoice={serviceChoice}
        setServiceChoice={setServiceChoice}
        selectedService={selectedService}
        selectedServicePricing={selectedServicePricing}
        selectedServiceHeadlinePrice={selectedServiceHeadlinePrice}
        servicePricingMode={servicePricingMode}
        setServicePricingMode={setServicePricingMode}
        formTheme={formTheme}
      />
      <CustomRequestFields
        fieldClassName={fieldClassName}
        isCustomRequest={isCustomRequest}
      />
      <SubscriptionFields
        fieldClassName={fieldClassName}
        subscriptionOptions={subscriptionOptions}
        subscriptionChoice={subscriptionChoice}
        setSubscriptionChoice={setSubscriptionChoice}
        selectedSubscriptionOption={selectedSubscriptionOption}
        handlePaySubscription={handlePaySubscription}
        paymentsEnabled={paymentsEnabled}
        isPaying={isPaying}
        formTheme={formTheme}
      />
      <MessageField fieldClassName={fieldClassName} formMode={formMode} />
      <FormActions
        formMode={formMode}
        formTheme={formTheme}
        isSubmitting={isSubmitting}
        isPaying={isPaying}
        handlePayNow={handlePayNow}
        paymentsEnabled={paymentsEnabled}
        selectedServicePricing={selectedServicePricing}
        selectedService={selectedService}
      />
      {submitStatus ? (
        <p className="text-xs text-neutral-200">{submitStatus}</p>
      ) : null}
      {payError ? (
        <p className="text-xs text-amber-200">{payError}</p>
      ) : null}
    </form>
  );
}
