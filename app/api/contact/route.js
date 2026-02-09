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

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      phone,
      serviceSlug,
      subscriptionSlug,
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

    const payload = {
      title: `Demande - ${name || email}`,
      content: message,
      status: "publish",
      meta: {
        cbi_name: name || "",
        cbi_email: email,
        cbi_phone: phone || "",
        cbi_service_slug: serviceSlug || "",
        cbi_subscription_slug: subscriptionSlug || "",
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
