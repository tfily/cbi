function isEnabled(value) {
  return String(value || "").toLowerCase() === "true";
}

function trimTo160(text) {
  const value = String(text || "").trim();
  if (value.length <= 160) return value;
  return `${value.slice(0, 157)}...`;
}

async function sendViaTwilio({ to, message }) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID || "";
  const authToken = process.env.TWILIO_AUTH_TOKEN || "";
  const from = process.env.TWILIO_FROM || "";
  if (!accountSid || !authToken || !from) {
    throw new Error("Missing Twilio configuration.");
  }

  const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
  const body = new URLSearchParams({
    To: to,
    From: from,
    Body: message,
  });

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
      cache: "no-store",
    }
  );

  if (!res.ok) {
    const details = await res.text().catch(() => "");
    throw new Error(`Twilio SMS failed: ${res.status} ${details}`);
  }
  return res.json().catch(() => ({}));
}

async function sendViaWebhook(payload) {
  const url = process.env.SMS_WEBHOOK_URL || "";
  if (!url) {
    throw new Error("Missing SMS_WEBHOOK_URL.");
  }
  const token = process.env.SMS_WEBHOOK_TOKEN || "";
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!res.ok) {
    const details = await res.text().catch(() => "");
    throw new Error(`SMS webhook failed: ${res.status} ${details}`);
  }
  return res.json().catch(() => ({}));
}

export async function sendOrderSmsNotification({
  orderId,
  serviceName,
  scheduledDate,
  timeSlot,
  amount,
  currency = "EUR",
}) {
  if (!isEnabled(process.env.SMS_NOTIFICATIONS_ENABLED)) {
    return { sent: false, reason: "disabled" };
  }

  const to = process.env.SMS_NOTIFY_TO || "";
  if (!to) {
    throw new Error("Missing SMS_NOTIFY_TO.");
  }

  const pieces = [
    "CBI",
    `Commande #${orderId}`,
    serviceName ? `- ${serviceName}` : "",
    scheduledDate ? `- ${scheduledDate}` : "",
    timeSlot ? `- ${timeSlot}` : "",
    amount ? `- ${amount} ${currency}` : "",
  ].filter(Boolean);
  const message = trimTo160(pieces.join(" "));

  if (process.env.TWILIO_ACCOUNT_SID) {
    const twilio = await sendViaTwilio({ to, message });
    return { sent: true, channel: "twilio", id: twilio?.sid || "" };
  }

  const webhook = await sendViaWebhook({
    to,
    message,
    orderId,
    serviceName: serviceName || "",
    scheduledDate: scheduledDate || "",
    timeSlot: timeSlot || "",
    amount: amount || "",
    currency,
  });
  return { sent: true, channel: "webhook", id: webhook?.id || "" };
}

