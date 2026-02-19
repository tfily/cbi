import onlinePaymentsSdk from "onlinepayments-sdk-nodejs";

const DEFAULT_PREPROD_HOST = "payment.preprod.cawl-solutions.fr";
const DEFAULT_PROD_HOST = "payment.cawl-solutions.fr";

function getCawlMode() {
  const env = (process.env.CAWL_ENV || "preprod").toLowerCase();
  return env === "prod" || env === "production" ? "prod" : "preprod";
}

function readCawlEnvVar(baseName) {
  const mode = getCawlMode();
  const scopedKey =
    mode === "prod" ? `CAWL_PROD_${baseName}` : `CAWL_PREPROD_${baseName}`;
  return process.env[scopedKey] || process.env[`CAWL_${baseName}`] || "";
}

function resolveHost() {
  const configuredHost = readCawlEnvVar("API_HOST");
  if (configuredHost) return configuredHost;
  return getCawlMode() === "prod" ? DEFAULT_PROD_HOST : DEFAULT_PREPROD_HOST;
}

let cachedClient = null;
let cachedClientKey = "";

export function getCawlClient() {
  const apiKeyId = readCawlEnvVar("API_KEY_ID");
  const secretApiKey = readCawlEnvVar("API_SECRET");
  const host = resolveHost();
  const cacheKey = `${host}|${apiKeyId}|${secretApiKey}`;

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

export function getCawlWebhookUrl() {
  return readCawlEnvVar("WEBHOOK_URL");
}

export function getCawlRuntimeConfig() {
  return {
    cawlMode: getCawlMode(),
    cawlApiHost: resolveHost(),
    merchantId: getCawlMerchantId(),
    webhookUrl: getCawlWebhookUrl(),
  };
}

export function getCawlWebhooksHelper() {
  const keyId = readCawlEnvVar("WEBHOOKS_KEY_ID");
  const secretKey = readCawlEnvVar("WEBHOOKS_KEY_SECRET");
  const currentWebhookKey = `${keyId}|${secretKey}`;

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
