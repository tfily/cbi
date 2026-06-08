import { getCanonicalUrl } from "./site";

export const BUSINESS_CARD_CONTACT = {
  brand: "Conciergerie by Isa",
  name: "Isabelle Haquin",
  role: "Conciergerie privee",
  baseline: "Votre quotidien, simplifie avec discretion et precision.",
  legacySlogan: "Votre Serenite, Notre Tranquillite",
  zone: "Paris et proche couronne",
  email: "conciergeriebyisa@gmail.com",
  phoneDisplay: "+33 6 51 80 96 98",
  phoneHref: "+33651809698",
  whatsappHref: "+33651809698",
  addressStreet: "77 rue de Colombes",
  addressPostalCode: "92400",
  addressLocality: "Courbevoie",
  siteUrl: getCanonicalUrl("/"),
  cardUrl: getCanonicalUrl("/carte"),
  requestUrl: getCanonicalUrl("/#contact"),
  servicesUrl: getCanonicalUrl("/#services"),
  instagramUrl:
    "https://www.instagram.com/conciergeriebyisa?igsh=aml3dGVicjEzZXBr",
};

export const BUSINESS_CARD_SERVICES = [
  "Courses et livraisons",
  "Gestion des cles",
  "Garde et promenade d’animaux",
  "Pressing et blanchisserie",
  "Reservation de transports",
  "Gestion des absences",
  "Reservations et evenements",
  "Coaching d’organisation",
];

export function getBusinessCardAddressLabel() {
  return `${BUSINESS_CARD_CONTACT.addressStreet}, ${BUSINESS_CARD_CONTACT.addressPostalCode} ${BUSINESS_CARD_CONTACT.addressLocality}`;
}

export function getBusinessCardWhatsAppUrl() {
  const message =
    "Bonjour Isabelle, je vous contacte depuis votre carte de visite numerique. J’aimerais echanger au sujet d’un service de conciergerie.";
  return `https://wa.me/${BUSINESS_CARD_CONTACT.whatsappHref.replace(/\D+/g, "")}?text=${encodeURIComponent(
    message
  )}`;
}

export function getBusinessCardMapsUrl() {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    getBusinessCardAddressLabel()
  )}`;
}

export function getBusinessCardQrCodeUrl() {
  return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=0&data=${encodeURIComponent(
    BUSINESS_CARD_CONTACT.cardUrl
  )}`;
}

export function buildBusinessCardVcf() {
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${BUSINESS_CARD_CONTACT.name}`,
    `ORG:${BUSINESS_CARD_CONTACT.brand}`,
    `TITLE:${BUSINESS_CARD_CONTACT.role}`,
    `TEL;TYPE=CELL:${BUSINESS_CARD_CONTACT.phoneHref}`,
    `EMAIL;TYPE=INTERNET:${BUSINESS_CARD_CONTACT.email}`,
    `ADR;TYPE=WORK:;;${BUSINESS_CARD_CONTACT.addressStreet};${BUSINESS_CARD_CONTACT.addressLocality};;${BUSINESS_CARD_CONTACT.addressPostalCode};France`,
    `URL:${BUSINESS_CARD_CONTACT.siteUrl}`,
    `NOTE:${BUSINESS_CARD_CONTACT.baseline} - ${BUSINESS_CARD_CONTACT.zone}`,
    "END:VCARD",
  ];

  return `${lines.join("\r\n")}\r\n`;
}
