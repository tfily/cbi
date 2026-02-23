import { NextResponse } from "next/server";
import { getCawlWebhooksHelper } from "../../../../lib/cawl";
import { getWooOrder, updateWooOrder } from "../../../../lib/woocommerce";
import { sendOrderSmsNotification } from "../../../../lib/notifications";

export const runtime = "nodejs";

function resolveRequestBaseUrl(request) {
  const origin = request.headers.get("origin");
  if (origin) return origin;

  const forwardedHost = request.headers.get("x-forwarded-host");
  if (forwardedHost) {
    const forwardedProto = request.headers.get("x-forwarded-proto") || "https";
    return `${forwardedProto}://${forwardedHost}`;
  }

  return "";
}

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
      "ABORTED",
      "STOPPED",
      "EXPIRED",
    ].includes(normalized)
  ) {
    return "cancelled";
  }
  if (
    [
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

function readMeta(order, key) {
  return (
    (order?.meta_data || []).find((entry) => entry?.key === key)?.value || ""
  );
}

export async function POST(request) {
  try {
    const rawBody = await request.text();
    const headers = {};
    for (const [key, value] of request.headers.entries()) {
      headers[key.toLowerCase()] = value;
    }

    const requestBase = resolveRequestBaseUrl(request);
    const helper = getCawlWebhooksHelper(requestBase);
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

      // Notify admin once when payment reaches a paid state.
      if (wooStatus === "processing") {
        try {
          const order = await getWooOrder(orderId);
          const smsAlreadySent = String(readMeta(order, "cbi_sms_sent")) === "1";
          if (!smsAlreadySent) {
            const total = order?.total ? String(order.total) : "";
            const smsResult = await sendOrderSmsNotification({
              orderId,
              serviceName: readMeta(order, "service_name") || readMeta(order, "service_slug"),
              scheduledDate: readMeta(order, "scheduled_date"),
              timeSlot: readMeta(order, "time_slot"),
              amount: total,
              currency: order?.currency || "EUR",
            });
            if (smsResult?.sent) {
              await updateWooOrder(orderId, {
                meta_data: [
                  { key: "cbi_sms_sent", value: "1" },
                  { key: "cbi_sms_channel", value: smsResult.channel || "" },
                  { key: "cbi_sms_message_id", value: smsResult.id || "" },
                ],
              });
            }
          }
        } catch (smsError) {
          console.error("[CAWL] SMS notification failed:", smsError?.message || smsError);
        }
      }
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
