import onlinePaymentsSdk from "onlinepayments-sdk-nodejs";

const DEFAULT_PREPROD_HOST = "payment.preprod.cawl-solutions.fr";
const DEFAULT_PROD_HOST = "payment.cawl-solutions.fr";

function resolveHost() {
  if (process.env.CAWL_API_HOST) return process.env.CAWL_API_HOST;
  const env = (process.env.CAWL_ENV || "preprod").toLowerCase();
  return env === "prod" || env === "production"
    ? DEFAULT_PROD_HOST
    : DEFAULT_PREPROD_HOST;
}

let cachedClient = null;

export function getCawlClient() {
  if (cachedClient) return cachedClient;

  const apiKeyId = process.env.CAWL_API_KEY_ID;
  const secretApiKey = process.env.CAWL_API_SECRET;

  if (!apiKeyId || !secretApiKey) {
    throw new Error("Missing CAWL API credentials.");
  }

  cachedClient = onlinePaymentsSdk.init({
    integrator: process.env.CAWL_INTEGRATOR || "conciergerie-by-isa",
    host: resolveHost(),
    scheme: "https",
    port: 443,
    enableLogging: process.env.CAWL_LOGGING === "true",
    apiKeyId,
    secretApiKey,
  });

  return cachedClient;
}

let cachedWebhooksHelper = null;

export function getCawlWebhooksHelper() {
  if (cachedWebhooksHelper) return cachedWebhooksHelper;

  const keyId = process.env.CAWL_WEBHOOKS_KEY_ID;
  const secretKey = process.env.CAWL_WEBHOOKS_KEY_SECRET;

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

  return cachedWebhooksHelper;
}

export function buildHostedCheckoutRedirect(partialRedirectUrl) {
  if (!partialRedirectUrl) return null;
  return `https://payment.${partialRedirectUrl}`;
}
