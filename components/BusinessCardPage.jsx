import Image from "next/image";
import {
  BUSINESS_CARD_CONTACT,
  BUSINESS_CARD_SERVICES,
  BUSINESS_CARD_TRUST_POINTS,
  getBusinessCardAddressLabel,
  getBusinessCardMapsUrl,
  getBusinessCardQrCodeUrl,
  getBusinessCardWhatsAppUrl,
} from "../lib/business-card";

function PhoneIcon(props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        d="M7.7 3.5c.4-.4 1-.6 1.5-.4l2.2.7c.6.2 1 .7 1 1.3l.1 2.3c0 .5-.3 1-.7 1.3l-1.4 1c.9 1.8 2.4 3.4 4.2 4.3l1-1.4c.3-.4.8-.7 1.3-.7l2.3.1c.6 0 1.1.4 1.3 1l.7 2.2c.2.6 0 1.1-.4 1.5l-1.5 1.5c-.8.8-2 1.1-3.1.8-2.4-.7-4.8-2.1-6.8-4.1s-3.4-4.3-4.1-6.8c-.3-1.1 0-2.3.8-3.1z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MailIcon(props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M4.5 7l7.5 5 7.5-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WhatsAppIcon(props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        d="M12 3.5a8.5 8.5 0 0 0-7.3 12.9L3.5 20.5l4.2-1.1A8.5 8.5 0 1 0 12 3.5z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M9.3 8.9c.2-.4.4-.4.7-.4h.5c.2 0 .4 0 .6.4l.6 1.4c.1.2.1.4 0 .6l-.4.6c-.1.2-.1.4 0 .6.4.8 1 1.5 1.8 2 .2.1.4.1.6 0l.6-.4c.2-.1.4-.1.6 0l1.4.6c.3.1.4.3.4.6v.5c0 .3 0 .5-.4.7-.5.3-1.1.5-1.7.4-1.2-.1-2.7-.9-4.1-2.2-1.3-1.4-2.1-2.9-2.2-4.1-.1-.6.1-1.2.4-1.7z"
        fill="currentColor"
      />
    </svg>
  );
}

function ContactIcon(props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <rect
        x="3"
        y="4"
        width="18"
        height="16"
        rx="3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <circle cx="9" cy="10" r="2" fill="currentColor" />
      <path
        d="M6.5 15c.8-1.3 2.1-2 3.5-2s2.7.7 3.5 2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M16.5 9.5h2.5M17.75 8.25v2.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ServicesIcon(props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        d="M7 6.5h10M7 12h10M7 17.5h10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <circle cx="5" cy="6.5" r="1" fill="currentColor" />
      <circle cx="5" cy="12" r="1" fill="currentColor" />
      <circle cx="5" cy="17.5" r="1" fill="currentColor" />
    </svg>
  );
}

function PinIcon(props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        d="M12 20s6-5.8 6-10.2A6 6 0 1 0 6 9.8C6 14.2 12 20 12 20z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10" r="2.2" fill="currentColor" />
    </svg>
  );
}

function ArrowIcon(props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        d="M6 12h12M13 7l5 5-5 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function KeyMark() {
  return (
    <div className="relative h-24 w-24 rounded-[2rem] border border-[#ddc9a4] bg-[linear-gradient(145deg,#f8eedc_0%,#f4e5c8_55%,#ebd3a6_100%)] shadow-[0_18px_45px_rgba(49,37,20,0.12)]">
      <svg
        viewBox="0 0 120 120"
        aria-hidden="true"
        className="absolute inset-0 h-full w-full text-[#7f6240]"
      >
        <circle
          cx="40"
          cy="46"
          r="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
        />
        <path
          d="M53 57l23 23m0 0h12m-12 0v10m0-10h10"
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function ActionLink({ href, icon: Icon, label, tone = "light", download = false }) {
  const classes =
    tone === "primary"
      ? "border-[#7d5f3a] bg-[#7d5f3a] text-white shadow-[0_14px_30px_rgba(125,95,58,0.22)] hover:bg-[#6b4f30]"
      : tone === "dark"
        ? "border-neutral-900 bg-neutral-900 text-white hover:bg-neutral-800"
        : "border-[#d8c3a0] bg-white/90 text-neutral-900 hover:bg-[#fbf5ea]";

  return (
    <a
      href={href}
      download={download}
      className={`inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition ${classes}`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>{label}</span>
    </a>
  );
}

function DetailRow({ icon: Icon, label, value, href }) {
  const content = (
    <>
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[#ead9bb] bg-[#fffaf1] text-[#7d5f3a]">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-500">
          {label}
        </span>
        <span className="block text-sm text-neutral-900">{value}</span>
      </span>
    </>
  );

  if (!href) {
    return <div className="flex items-center gap-3">{content}</div>;
  }

  return (
    <a
      href={href}
      className="flex items-center gap-3 rounded-2xl border border-transparent p-1 transition hover:border-[#ead9bb] hover:bg-[#fffaf1]"
    >
      {content}
    </a>
  );
}

export default function BusinessCardPage() {
  const addressLabel = getBusinessCardAddressLabel();
  const whatsappUrl = getBusinessCardWhatsAppUrl();
  const mapsUrl = getBusinessCardMapsUrl();
  const qrCodeUrl = getBusinessCardQrCodeUrl();

  return (
    <main className="cbi-business-card-page min-h-screen bg-[#f7f1e6] text-neutral-900">
      <section className="relative overflow-hidden border-b border-[#e2d1b3] bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.92),_rgba(248,238,221,0.94)_48%,_rgba(236,218,184,0.98)_100%)]">
        <div className="absolute inset-0 opacity-60">
          <div className="absolute right-[-4rem] top-[-3rem] h-40 w-40 rounded-full border border-[#ddc9a4] bg-white/45" />
          <div className="absolute left-[-2rem] top-24 h-24 w-24 rounded-full border border-[#ebd9ba] bg-white/35" />
        </div>
        <div className="relative mx-auto max-w-5xl px-4 py-8 md:px-6 md:py-12">
          <div className="grid gap-6 lg:grid-cols-[1.18fr_0.82fr]">
            <div className="rounded-[2rem] border border-[#e4d2b2] bg-white/88 p-5 shadow-[0_24px_60px_rgba(55,40,17,0.08)] backdrop-blur-[2px] md:p-8">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Image
                      src="/logo-cbi.png"
                      alt={BUSINESS_CARD_CONTACT.brand}
                      width={112}
                      height={36}
                      priority
                    />
                    <span className="rounded-full border border-[#e8d6b7] bg-[#fff9ef] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7d5f3a]">
                      Carte numerique
                    </span>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#8d6b43]">
                      {BUSINESS_CARD_CONTACT.role}
                    </p>
                    <h1 className="mt-2 text-3xl font-bold leading-tight text-neutral-950 md:text-5xl">
                      {BUSINESS_CARD_CONTACT.name}
                    </h1>
                    <p className="mt-3 max-w-xl text-base leading-relaxed text-neutral-700 md:text-lg">
                      {BUSINESS_CARD_CONTACT.baseline}
                    </p>
                  </div>
                </div>
                <div className="hidden sm:block">
                  <KeyMark />
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <ActionLink
                  href={`tel:${BUSINESS_CARD_CONTACT.phoneHref}`}
                  icon={PhoneIcon}
                  label="Appeler"
                  tone="primary"
                />
                <ActionLink
                  href={`mailto:${BUSINESS_CARD_CONTACT.email}`}
                  icon={MailIcon}
                  label="Envoyer un email"
                  tone="dark"
                />
                <ActionLink
                  href={whatsappUrl}
                  icon={WhatsAppIcon}
                  label="WhatsApp"
                />
                <ActionLink
                  href={BUSINESS_CARD_CONTACT.requestUrl}
                  icon={ArrowIcon}
                  label="Demander un service"
                />
                <ActionLink
                  href={BUSINESS_CARD_CONTACT.servicesUrl}
                  icon={ServicesIcon}
                  label="Voir les services"
                />
                <ActionLink
                  href="/carte/vcard"
                  icon={ContactIcon}
                  label="Ajouter aux contacts"
                  download
                />
              </div>

              <div className="mt-6 grid gap-3 rounded-[1.75rem] border border-[#ead9bb] bg-[#fffaf1] p-4 sm:grid-cols-2">
                <DetailRow
                  icon={PhoneIcon}
                  label="Telephone"
                  value={BUSINESS_CARD_CONTACT.phoneDisplay}
                  href={`tel:${BUSINESS_CARD_CONTACT.phoneHref}`}
                />
                <DetailRow
                  icon={MailIcon}
                  label="Email"
                  value={BUSINESS_CARD_CONTACT.email}
                  href={`mailto:${BUSINESS_CARD_CONTACT.email}`}
                />
                <DetailRow
                  icon={PinIcon}
                  label="Zone"
                  value={BUSINESS_CARD_CONTACT.zone}
                />
                <DetailRow
                  icon={PinIcon}
                  label="Adresse"
                  value={addressLabel}
                  href={mapsUrl}
                />
              </div>
            </div>

            <aside className="flex flex-col gap-4">
              <div className="rounded-[2rem] border border-[#e4d2b2] bg-white/92 p-5 shadow-[0_18px_45px_rgba(55,40,17,0.08)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#8d6b43]">
                  Bloc confiance
                </p>
                <div className="mt-4 grid gap-3">
                  {BUSINESS_CARD_TRUST_POINTS.map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-[#eedfca] bg-[#fffaf1] px-4 py-3 text-sm font-medium text-neutral-800"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[2rem] border border-[#e4d2b2] bg-white/92 p-5 shadow-[0_18px_45px_rgba(55,40,17,0.08)]">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#8d6b43]">
                    QR code
                  </p>
                  <h2 className="mt-2 text-lg font-semibold text-neutral-950">
                    Partager la carte
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-700">
                    Scannez ce QR code pour ouvrir directement la carte
                    numerique sur mobile ou l’integrer a votre version imprimee.
                  </p>
                </div>
                <div className="mt-5 rounded-[1.5rem] border border-[#ecdfc9] bg-[#fffdf7] p-4">
                  <img
                    src={qrCodeUrl}
                    alt="QR code vers la carte numerique Conciergerie by Isa"
                    className="mx-auto h-52 w-52 rounded-2xl border border-[#ead9bb] bg-white p-3"
                  />
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-8 md:px-6 md:py-10">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[2rem] border border-[#e4d2b2] bg-white p-5 shadow-[0_18px_45px_rgba(55,40,17,0.06)] md:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#8d6b43]">
                  Services
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-neutral-950">
                  Prestations proposees
                </h2>
              </div>
              <a
                href={BUSINESS_CARD_CONTACT.servicesUrl}
                className="cbi-card-hide-print inline-flex items-center gap-2 rounded-full border border-[#ddc9a4] bg-[#fff9ef] px-4 py-2 text-sm font-semibold text-[#7d5f3a] transition hover:bg-white"
              >
                Explorer
                <ArrowIcon className="h-4 w-4" />
              </a>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              {BUSINESS_CARD_SERVICES.map((item) => (
                <span
                  key={item}
                  className="inline-flex rounded-full border border-[#ead8b7] bg-[#fffaf1] px-4 py-2 text-sm font-medium text-neutral-800"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-[#e4d2b2] bg-[linear-gradient(180deg,#fffdf8_0%,#fbf3e4_100%)] p-5 shadow-[0_18px_45px_rgba(55,40,17,0.06)] md:p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#8d6b43]">
              Coordonnees
            </p>
            <div className="mt-4 space-y-3">
              <DetailRow
                icon={PhoneIcon}
                label="Appel direct"
                value={BUSINESS_CARD_CONTACT.phoneDisplay}
                href={`tel:${BUSINESS_CARD_CONTACT.phoneHref}`}
              />
              <DetailRow
                icon={MailIcon}
                label="Contact"
                value={BUSINESS_CARD_CONTACT.email}
                href={`mailto:${BUSINESS_CARD_CONTACT.email}`}
              />
              <DetailRow
                icon={PinIcon}
                label="Google Maps"
                value={addressLabel}
                href={mapsUrl}
              />
              <DetailRow
                icon={ArrowIcon}
                label="Site"
                value={BUSINESS_CARD_CONTACT.siteUrl}
                href={BUSINESS_CARD_CONTACT.siteUrl}
              />
              {BUSINESS_CARD_CONTACT.instagramUrl ? (
                <DetailRow
                  icon={WhatsAppIcon}
                  label="Instagram"
                  value="@conciergeriebyisa"
                  href={BUSINESS_CARD_CONTACT.instagramUrl}
                />
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="cbi-card-print-only mx-auto hidden max-w-[780px] px-4 pb-10">
        <div className="rounded-[28px] border border-[#d8c3a0] bg-white p-6">
          <div className="flex items-start justify-between gap-5">
            <div>
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[#8d6b43]">
              {BUSINESS_CARD_CONTACT.brand}
            </p>
              <h2 className="mt-2 text-2xl font-bold text-neutral-950">
                {BUSINESS_CARD_CONTACT.name}
              </h2>
              <p className="mt-1 text-sm text-neutral-700">
                {BUSINESS_CARD_CONTACT.role} • {BUSINESS_CARD_CONTACT.zone}
              </p>
              <p className="mt-3 text-sm text-neutral-700">
                {BUSINESS_CARD_CONTACT.baseline}
              </p>
              <div className="mt-4 space-y-1 text-sm text-neutral-900">
                <p>{BUSINESS_CARD_CONTACT.phoneDisplay}</p>
                <p>{BUSINESS_CARD_CONTACT.email}</p>
                <p>{addressLabel}</p>
                <p>{BUSINESS_CARD_CONTACT.siteUrl}</p>
              </div>
              <p className="mt-4 text-xs leading-relaxed text-neutral-500">
                Base compacte prevue pour la declinaison carte papier imprimeur
                avec QR code vers la carte numerique.
              </p>
            </div>
            <img
              src={qrCodeUrl}
              alt="QR code vers la carte numerique"
              className="h-36 w-36 rounded-2xl border border-[#ead9bb] bg-white p-2"
            />
          </div>
        </div>
      </section>
    </main>
  );
}
