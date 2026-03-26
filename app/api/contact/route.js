import { NextResponse } from "next/server";

export const runtime = "nodejs";

function getWpRestBase() {
  return (
    process.env.WORDPRESS_SITE_URL ||
    process.env.NEXT_PUBLIC_WORDPRESS_SITE_URL ||
    ""
  ).replace(/\/$/, "");
}

function getAuthHeader() {
  const user = process.env.WP_CONTACT_USER;
  const pass = process.env.WP_CONTACT_APP_PASSWORD;
  if (!user || !pass) return null;
  const token = Buffer.from(`${user}:${pass}`).toString("base64");
  return `Basic ${token}`;
}

function formatLine(label, value) {
  if (!value) return "";
  return `${label}: ${value}`;
}

function formatFrequency(value) {
  const map = {
    one_off: "Besoin ponctuel",
    weekly: "Chaque semaine",
    monthly: "Chaque mois",
    custom: "Rythme a definir",
  };
  return map[value] || value || "";
}

function formatUrgency(value) {
  const map = {
    asap: "Des que possible",
    this_week: "Cette semaine",
    this_month: "Ce mois-ci",
    flexible: "Flexible",
  };
  return map[value] || value || "";
}

function formatPreferredContact(value) {
  const map = {
    phone: "Telephone",
    email: "Email",
    whatsapp: "WhatsApp",
  };
  return map[value] || value || "";
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      phone,
      serviceSlug,
      subscriptionSlug,
      scheduledDate,
      timeSlot,
      requestType,
      customServiceTitle,
      customServiceDetails,
      location,
      frequency,
      budget,
      preferredContact,
      urgency,
      message,
    } = body || {};

    if (!email || !message) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    const restBase = getWpRestBase();
    if (!restBase) {
      return NextResponse.json(
        { error: "WordPress site URL not configured." },
        { status: 500 }
      );
    }

    const authHeader = getAuthHeader();
    if (!authHeader) {
      return NextResponse.json(
        { error: "WordPress credentials not configured." },
        { status: 500 }
      );
    }

    const isCustomRequest = requestType === "custom_service";

    const contentSections = [
      isCustomRequest ? "Demande de service sur-mesure" : "Demande de service",
      "",
      formatLine("Nom", name || ""),
      formatLine("Email", email),
      formatLine("Telephone", phone || ""),
      formatLine("Date souhaitee", scheduledDate || ""),
      formatLine("Creneau", timeSlot || ""),
      formatLine("Service", serviceSlug || ""),
      formatLine("Abonnement", subscriptionSlug || ""),
      formatLine("Service sur-mesure", customServiceTitle || ""),
      formatLine("Lieu", location || ""),
      formatLine("Frequence", formatFrequency(frequency)),
      formatLine("Budget", budget || ""),
      formatLine(
        "Contact prefere",
        formatPreferredContact(preferredContact)
      ),
      formatLine("Urgence", formatUrgency(urgency)),
      "",
      "Message client:",
      message,
      customServiceDetails
        ? `\nDetails complementaires:\n${customServiceDetails}`
        : "",
    ].filter(Boolean);

    const payload = {
      title: isCustomRequest
        ? `Service sur-mesure - ${customServiceTitle || name || email}`
        : `Demande - ${name || email}`,
      content: contentSections.join("\n"),
      status: "publish",
      meta: {
        cbi_name: name || "",
        cbi_email: email,
        cbi_phone: phone || "",
        cbi_service_slug: serviceSlug || "",
        cbi_subscription_slug: subscriptionSlug || "",
        cbi_request_type: isCustomRequest ? "custom_service" : "standard",
        cbi_scheduled_date: scheduledDate || "",
        cbi_time_slot: timeSlot || "",
        cbi_custom_service_title: customServiceTitle || "",
        cbi_custom_service_details: customServiceDetails || "",
        cbi_location: location || "",
        cbi_frequency: frequency || "",
        cbi_budget: budget || "",
        cbi_preferred_contact: preferredContact || "",
        cbi_urgency: urgency || "",
      },
    };

    const res = await fetch(`${restBase}/wp-json/wp/v2/contact-requests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    if (!res.ok) {
      const errorBody = await res.text().catch(() => "");
      return NextResponse.json(
        { error: "Failed to create contact request.", details: errorBody },
        { status: res.status }
      );
    }

    const created = await res.json();
    return NextResponse.json({ ok: true, id: created.id });
  } catch (error) {
    console.error("[Contact] create failed:", error);
    return NextResponse.json(
      { error: "Failed to create contact request." },
      { status: 500 }
    );
  }
}
