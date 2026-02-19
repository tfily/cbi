import onlinePaymentsSdk from "onlinepayments-sdk-nodejs";

const DEFAULT_PREPROD_HOST = "payment.preprod.cawl-solutions.fr";
const DEFAULT_PROD_HOST = "payment.cawl-solutions.fr";

function isLocalBaseUrl(baseUrl) {
  if (!baseUrl) return false;
  try {
    const url = new URL(baseUrl);
    return ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  } catch {
    return String(baseUrl).includes("localhost");
  }
}

function resolveBaseUrl(explicitBaseUrl = "") {
  return (
    explicitBaseUrl ||
    process.env.APP_BASE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    ""
  );
}

function getCawlMode(explicitBaseUrl = "") {
  const env = (process.env.CAWL_ENV || "preprod").toLowerCase();
  if (env === "prod" || env === "production") return "prod";
  if (env === "preprod") return "preprod";
  if (env === "auto") {
    const baseUrl = resolveBaseUrl(explicitBaseUrl);
    if (isLocalBaseUrl(baseUrl)) return "preprod";
    return "prod";
  }
  return "preprod";
}

function readCawlEnvVar(baseName, explicitBaseUrl = "") {
  const mode = getCawlMode(explicitBaseUrl);
  const scopedKey =
    mode === "prod" ? `CAWL_PROD_${baseName}` : `CAWL_PREPROD_${baseName}`;
  return process.env[scopedKey] || process.env[`CAWL_${baseName}`] || "";
}

function resolveHost(explicitBaseUrl = "") {
  const configuredHost = readCawlEnvVar("API_HOST", explicitBaseUrl);
  if (configuredHost) return configuredHost;
  return getCawlMode(explicitBaseUrl) === "prod"
    ? DEFAULT_PROD_HOST
    : DEFAULT_PREPROD_HOST;
}

let cachedClient = null;
let cachedClientKey = "";

export function getCawlClient(explicitBaseUrl = "") {
  const mode = getCawlMode(explicitBaseUrl);
  const apiKeyId = readCawlEnvVar("API_KEY_ID", explicitBaseUrl);
  const secretApiKey = readCawlEnvVar("API_SECRET", explicitBaseUrl);
  const host = resolveHost(explicitBaseUrl);
  const cacheKey = `${mode}|${host}|${apiKeyId}|${secretApiKey}`;

  if (cachedClient && cachedClientKey === cacheKey) return cachedClient;

  if (!apiKeyId || !secretApiKey) {
    throw new Error("Missing CAWL API credentials.");
  }

  cachedClient = onlinePaymentsSdk.init({
    integrator: process.env.CAWL_INTEGRATOR || "conciergerie-by-isa",
    host,
    scheme: "https",
    port: 443,
    enableLogging: process.env.CAWL_LOGGING === "true",
    apiKeyId,
    secretApiKey,
  });
  cachedClientKey = cacheKey;

  return cachedClient;
}

let cachedWebhooksHelper = null;
let cachedWebhookKey = "";

export function getCawlMerchantId() {
  return readCawlEnvVar("MERCHANT_ID");
}

export function getCawlMerchantIdForBaseUrl(explicitBaseUrl = "") {
  return readCawlEnvVar("MERCHANT_ID", explicitBaseUrl);
}

export function getCawlWebhookUrl(explicitBaseUrl = "") {
  return readCawlEnvVar("WEBHOOK_URL", explicitBaseUrl);
}

export function getCawlRuntimeConfig(explicitBaseUrl = "") {
  return {
    cawlMode: getCawlMode(explicitBaseUrl),
    cawlApiHost: resolveHost(explicitBaseUrl),
    merchantId: readCawlEnvVar("MERCHANT_ID", explicitBaseUrl),
    webhookUrl: readCawlEnvVar("WEBHOOK_URL", explicitBaseUrl),
    baseUrl: resolveBaseUrl(explicitBaseUrl),
  };
}

export function getCawlWebhooksHelper(explicitBaseUrl = "") {
  const mode = getCawlMode(explicitBaseUrl);
  const keyId = readCawlEnvVar("WEBHOOKS_KEY_ID", explicitBaseUrl);
  const secretKey = readCawlEnvVar("WEBHOOKS_KEY_SECRET", explicitBaseUrl);
  const currentWebhookKey = `${mode}|${keyId}|${secretKey}`;

  if (cachedWebhooksHelper && cachedWebhookKey === currentWebhookKey) {
    return cachedWebhooksHelper;
  }

  if (!keyId || !secretKey) {
    throw new Error("Missing CAWL webhook key configuration.");
  }

  onlinePaymentsSdk.webhooks.inMemorySecretKeyStore.storeSecretKey(
    keyId,
    secretKey
  );

  cachedWebhooksHelper = onlinePaymentsSdk.webhooks.init({
    getSecretKey: (requestedKeyId) =>
      onlinePaymentsSdk.webhooks.inMemorySecretKeyStore.getSecretKey(
        requestedKeyId
      ),
  });
  cachedWebhookKey = currentWebhookKey;

  return cachedWebhooksHelper;
}

export function buildHostedCheckoutRedirect(partialRedirectUrl) {
  if (!partialRedirectUrl) return null;
  return `https://payment.${partialRedirectUrl}`;
}
