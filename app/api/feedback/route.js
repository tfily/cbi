import { NextResponse } from "next/server";
import {
  buildOrderReviewContext,
  buildReviewTitle,
  getOrderReviewContext,
} from "../../../lib/feedback";
import { getWooOrder } from "../../../lib/woocommerce";

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
      orderId,
      rating,
      name,
      email,
      title,
      message,
      allowPublish,
    } = body || {};

    const numericRating = Number(rating);
    if (
      !orderId ||
      !email ||
      !message ||
      Number.isNaN(numericRating) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      return NextResponse.json(
        { error: "Missing or invalid required fields." },
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

    let reviewContext;
    try {
      reviewContext = await getOrderReviewContext(orderId, email);
    } catch {
      return NextResponse.json(
        { error: "Cette commande n’a pas pu être vérifiée." },
        { status: 403 }
      );
    }

    const payload = {
      title:
        title ||
        buildReviewTitle({
          orderId,
          serviceName: reviewContext.serviceName,
        }),
      content: message,
      status: "pending",
      meta: {
        cbi_order_id: String(orderId),
        cbi_rating: String(numericRating),
        cbi_customer_name: name || reviewContext.customerName || "",
        cbi_customer_email: reviewContext.customerEmail,
        cbi_feedback_message: message,
        cbi_feedback_publish_ok: allowPublish ? "1" : "0",
        cbi_service_name: reviewContext.serviceName,
        cbi_service_slug: reviewContext.serviceSlug,
        cbi_item_type: reviewContext.itemType,
        cbi_pricing_label: reviewContext.pricingLabel,
        cbi_order_date: reviewContext.orderDate,
        cbi_scheduled_date: reviewContext.scheduledDate,
        cbi_time_slot: reviewContext.timeSlot,
      },
    };

    const res = await fetch(`${restBase}/wp-json/wp/v2/cbi-feedback`, {
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
        { error: "Failed to save feedback.", details: errorBody },
        { status: res.status }
      );
    }

    const created = await res.json();
    return NextResponse.json({
      ok: true,
      id: created.id,
      status: created.status || "pending",
    });
  } catch (error) {
    console.error("[Feedback] create failed:", error);
    return NextResponse.json(
      { error: "Failed to save feedback." },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = String(searchParams.get("orderId") || "").trim();
    const email = String(searchParams.get("email") || "").trim();

    if (!orderId || !email) {
      return NextResponse.json(
        { error: "Missing order verification parameters." },
        { status: 400 }
      );
    }

    const context = await getOrderReviewContext(orderId, email);
    const order = await getWooOrder(orderId);
    const reviewContext = buildOrderReviewContext(order) || context;

    return NextResponse.json({
      ok: true,
      order: reviewContext,
    });
  } catch (error) {
    console.error("[Feedback] load failed:", error);
    return NextResponse.json(
      { error: "Impossible de vérifier cette commande." },
      { status: 403 }
    );
  }
}
