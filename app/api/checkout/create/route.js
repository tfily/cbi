import { NextResponse } from "next/server";
import { getCawlClient, buildHostedCheckoutRedirect } from "../../../../lib/cawl";
import { createWooOrder, updateWooOrder } from "../../../../lib/woocommerce";

export const runtime = "nodejs";

function normalizeAmountToMinor(value) {
  if (value == null) return null;
  if (typeof value === "number") {
    return Math.round(value * 100);
  }
  const numeric = Number(String(value).replace(",", "."));
  if (Number.isNaN(numeric)) return null;
  return Math.round(numeric * 100);
}

function buildReturnUrl(orderId) {
  const isDev = process.env.NODE_ENV !== "production";
  const base =
    process.env.APP_BASE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    (isDev ? "http://localhost:3000" : "");
  if (!base) return "";
  return `${base.replace(/\/$/, "")}/payment/return?orderId=${orderId}`;
}

export async function POST(request) {
  try {
    if (process.env.PAYMENTS_ENABLED === "false") {
      return NextResponse.json(
        { error: "Payments are currently disabled." },
        { status: 403 }
      );
    }
    const body = await request.json();
    const {
      serviceName,
      serviceSlug,
      amount,
      amountMinor,
      currency = "EUR",
      customerEmail,
      customerFirstName,
      customerLastName,
      customerPhone,
    } = body || {};

    const amountMinorValue =
      typeof amountMinor === "number"
        ? Math.round(amountMinor)
        : normalizeAmountToMinor(amount);

    if (!serviceName || !amountMinorValue || !customerEmail) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    const productId = Number(process.env.WC_DEFAULT_PRODUCT_ID || 0);
    if (!productId) {
      return NextResponse.json(
        { error: "Missing WC_DEFAULT_PRODUCT_ID." },
        { status: 400 }
      );
    }

    const orderPayload = {
      status: "pending",
      currency,
      set_paid: false,
      billing: {
        first_name: customerFirstName || "",
        last_name: customerLastName || "",
        email: customerEmail,
        phone: customerPhone || "",
      },
      line_items: [
        {
          product_id: productId,
          quantity: 1,
          total: (amountMinorValue / 100).toFixed(2),
          name: serviceName,
        },
      ],
      meta_data: [
        { key: "service_slug", value: serviceSlug || "" },
        { key: "service_name", value: serviceName },
        { key: "payment_provider", value: "CAWL" },
      ],
    };

    const order = await createWooOrder(orderPayload);

    const client = getCawlClient();
    const merchantId = process.env.CAWL_MERCHANT_ID;
    if (!merchantId) {
      return NextResponse.json(
        { error: "Missing CAWL_MERCHANT_ID." },
        { status: 400 }
      );
    }

    const hostedCheckoutRequest = {
      order: {
        amountOfMoney: {
          currencyCode: currency,
          amount: amountMinorValue,
        },
        customer: {
          contactDetails: {
            emailAddress: customerEmail,
            phoneNumber: customerPhone || undefined,
          },
          billingAddress: {
            countryCode: "FR",
          },
        },
        references: {
          merchantReference: `wc_${order.id}`,
        },
      },
      hostedCheckoutSpecificInput: {
        locale: "fr_FR",
        returnUrl: buildReturnUrl(order.id),
      },
    };

    if (process.env.CAWL_WEBHOOK_URL) {
      hostedCheckoutRequest.feedbacks = {
        webhooksUrls: [process.env.CAWL_WEBHOOK_URL],
      };
    }

    const hostedCheckoutResponse = await client.hostedCheckout.createHostedCheckout(
      merchantId,
      hostedCheckoutRequest
    );

    const hostedCheckout =
      hostedCheckoutResponse?.body || hostedCheckoutResponse || {};

    const redirectUrl =
      hostedCheckout.redirectUrl ||
      buildHostedCheckoutRedirect(hostedCheckout?.partialRedirectUrl);
    const isDev = process.env.NODE_ENV !== "production";

    await updateWooOrder(order.id, {
      meta_data: [
        { key: "cawl_hosted_checkout_id", value: hostedCheckout.hostedCheckoutId },
        {
          key: "cawl_partial_redirect_url",
          value: hostedCheckout.partialRedirectUrl || "",
        },
      ],
    });

    return NextResponse.json({
      redirectUrl,
      hostedCheckoutId: hostedCheckout?.hostedCheckoutId || null,
      partialRedirectUrl: hostedCheckout?.partialRedirectUrl || null,
      rawHostedCheckout: isDev ? hostedCheckoutResponse : undefined,
      orderId: order.id,
    });
  } catch (error) {
    console.error("[CAWL] create checkout failed:", error);
    const isDev = process.env.NODE_ENV !== "production";
    const details =
      isDev && error
        ? {
            message: error.message,
            name: error.name,
            status: error.status,
            body: error.body,
          }
        : undefined;
    return NextResponse.json(
      { error: "Failed to create checkout.", details },
      { status: 500 }
    );
  }
}
