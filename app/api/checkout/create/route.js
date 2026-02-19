import { NextResponse } from "next/server";
import {
  getCawlClient,
  buildHostedCheckoutRedirect,
  getCawlMerchantIdForBaseUrl,
  getCawlWebhookUrl,
  getCawlRuntimeConfig,
} from "../../../../lib/cawl";
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

function buildReturnUrl(request, orderId) {
  const isDev = process.env.NODE_ENV !== "production";
  const requestBase = resolveRequestBaseUrl(request);
  const configuredBase =
    process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || "";
  const base = requestBase || configuredBase || (isDev ? "http://localhost:3000" : "");
  if (!base) return "";
  return `${base.replace(/\/$/, "")}/payment/return?orderId=${orderId}`;
}

export async function POST(request) {
  try {
    const requestBase = resolveRequestBaseUrl(request);
    const cawlRuntime = getCawlRuntimeConfig(requestBase);
    const debugRuntimeConfig = {
      nodeEnv: process.env.NODE_ENV,
      cawlEnv: cawlRuntime.cawlMode,
      cawlApiHost: cawlRuntime.cawlApiHost,
      merchantId: cawlRuntime.merchantId || "",
      paymentsEnabled: process.env.PAYMENTS_ENABLED !== "false",
    };

    if (process.env.CHECKOUT_DEBUG === "true") {
      console.info("[CAWL] checkout runtime config:", debugRuntimeConfig);
    }

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
      subscriptionSlug,
      itemType = "service",
      pricingOption = "unit",
      pricingLabel = "",
      amount,
      amountMinor,
      currency = "EUR",
      customerEmail,
      customerFirstName,
      customerLastName,
      customerPhone,
      scheduledDate,
      timeSlot,
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
    if (!scheduledDate) {
      return NextResponse.json(
        { error: "Missing scheduledDate." },
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
        { key: "subscription_slug", value: subscriptionSlug || "" },
        { key: "service_name", value: serviceName },
        { key: "item_type", value: itemType || "service" },
        { key: "pricing_option", value: pricingOption || "unit" },
        { key: "pricing_label", value: pricingLabel || "" },
        { key: "scheduled_date", value: scheduledDate },
        { key: "time_slot", value: timeSlot || "" },
        { key: "payment_provider", value: "CAWL" },
      ],
    };

    const order = await createWooOrder(orderPayload);

    const client = getCawlClient(requestBase);
    const merchantId = getCawlMerchantIdForBaseUrl(requestBase);
    if (!merchantId) {
      return NextResponse.json(
        { error: "Missing CAWL_MERCHANT_ID." },
        { status: 400 }
      );
    }

    const returnUrl = buildReturnUrl(request, order.id);
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
        returnUrl,
      },
    };

    const webhookUrl = getCawlWebhookUrl(requestBase);
    if (webhookUrl) {
      hostedCheckoutRequest.feedbacks = {
        webhooksUrls: [webhookUrl],
      };
    }

    const hostedCheckoutResponse = await client.hostedCheckout.createHostedCheckout(
      merchantId,
      hostedCheckoutRequest
    );

    const isCawlSuccess =
      hostedCheckoutResponse?.isSuccess === undefined ||
      hostedCheckoutResponse?.isSuccess === true;
    const hostedCheckout =
      hostedCheckoutResponse?.body || hostedCheckoutResponse || {};

    if (!isCawlSuccess) {
      const cawlError = hostedCheckoutResponse?.body || {};
      await updateWooOrder(order.id, {
        status: "failed",
        meta_data: [
          { key: "cawl_last_error", value: JSON.stringify(cawlError) },
          { key: "cawl_last_status", value: String(hostedCheckoutResponse?.status || "") },
        ],
      }).catch(() => {});

      return NextResponse.json(
        {
          error: "CAWL authorization failed for this merchant.",
          details: cawlError,
          runtime: process.env.CHECKOUT_DEBUG === "true" ? debugRuntimeConfig : undefined,
          orderId: order.id,
        },
        { status: hostedCheckoutResponse?.status || 403 }
      );
    }

    const redirectUrl =
      hostedCheckout.redirectUrl ||
      buildHostedCheckoutRedirect(hostedCheckout?.partialRedirectUrl);
    const exposeDebug =
      process.env.NODE_ENV !== "production" ||
      process.env.CHECKOUT_DEBUG === "true";

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
      rawHostedCheckout: exposeDebug ? hostedCheckoutResponse : undefined,
      returnUrl: exposeDebug ? returnUrl : undefined,
      orderId: order.id,
    });
  } catch (error) {
    console.error("[CAWL] create checkout failed:", error);
    const exposeDebug =
      process.env.NODE_ENV !== "production" ||
      process.env.CHECKOUT_DEBUG === "true";
    const details =
      exposeDebug && error
        ? {
            message: error.message,
            name: error.name,
            status: error.status,
            body: error.body,
          }
        : undefined;
    return NextResponse.json(
      {
        error: "Failed to create checkout.",
        details,
        runtime: process.env.CHECKOUT_DEBUG === "true" ? debugRuntimeConfig : undefined,
      },
      { status: 500 }
    );
  }
}
