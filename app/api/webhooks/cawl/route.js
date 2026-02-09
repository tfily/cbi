import { NextResponse } from "next/server";
import { getCawlWebhooksHelper } from "../../../../lib/cawl";
import { updateWooOrder } from "../../../../lib/woocommerce";

export const runtime = "nodejs";

function extractMerchantReference(event) {
  return (
    event?.payment?.references?.merchantReference ||
    event?.payment?.paymentOutput?.references?.merchantReference ||
    event?.merchantReference ||
    ""
  );
}

function extractPaymentStatus(event) {
  return (
    event?.payment?.status ||
    event?.payment?.statusOutput?.statusCode ||
    event?.status ||
    ""
  );
}

function mapStatusToWoo(status) {
  const normalized = String(status).toUpperCase();
  if (
    [
      "CAPTURED",
      "PAID",
      "AUTHORIZED",
      "COMPLETED",
      "CHARGED",
      "PENDING_CAPTURE",
    ].includes(normalized)
  ) {
    return "processing";
  }
  if (
    [
      "CANCELLED",
      "CANCELED",
      "REJECTED",
      "REFUSED",
      "FAILED",
      "REVERSED",
      "CHARGEBACKED",
    ].includes(normalized)
  ) {
    return "failed";
  }
  if (["PENDING", "CREATED", "REDIRECTED", "PENDING_PAYMENT"].includes(normalized)) {
    return "pending";
  }
  return "on-hold";
}

export async function POST(request) {
  try {
    const rawBody = await request.text();
    const headers = {};
    for (const [key, value] of request.headers.entries()) {
      headers[key.toLowerCase()] = value;
    }

    const helper = getCawlWebhooksHelper();
    const event = await helper.unmarshal(rawBody, headers);

    const merchantReference = extractMerchantReference(event);
    const orderIdMatch = merchantReference.match(/wc_(\d+)/);
    const orderId = orderIdMatch ? Number(orderIdMatch[1]) : null;
    const eventType = event?.type || "unknown";
    const paymentStatus = extractPaymentStatus(event) || "unknown";

    if (orderId) {
      const wooStatus = mapStatusToWoo(paymentStatus);
      await updateWooOrder(orderId, {
        status: wooStatus,
        meta_data: [
          { key: "cawl_last_event", value: eventType },
          { key: "cawl_last_status", value: paymentStatus },
        ],
      });
    }

    console.info("[CAWL] webhook event:", {
      orderId,
      eventType,
      paymentStatus,
      merchantReference,
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[CAWL] webhook error:", error);
    return NextResponse.json({ error: "Webhook failed." }, { status: 400 });
  }
}
