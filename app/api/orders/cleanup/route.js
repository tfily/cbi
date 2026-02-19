import { NextResponse } from "next/server";
import { deleteWooOrder, listWooOrders } from "../../../../lib/woocommerce";

export const runtime = "nodejs";

function hasCawlProviderMeta(order) {
  const meta = Array.isArray(order?.meta_data) ? order.meta_data : [];
  return meta.some(
    (item) => item?.key === "payment_provider" && String(item?.value).toUpperCase() === "CAWL"
  );
}

function isOlderThanDays(dateIso, days) {
  if (!dateIso) return false;
  const target = new Date(dateIso).getTime();
  if (Number.isNaN(target)) return false;
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return target < cutoff;
}

export async function POST(request) {
  try {
    const token = request.headers.get("x-cleanup-token") || "";
    const expectedToken = process.env.ORDER_CLEANUP_API_KEY || "";
    if (!expectedToken || token !== expectedToken) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const days = Number(body?.days || process.env.ORDER_CLEANUP_DAYS || 14);
    const statuses = Array.isArray(body?.statuses) && body.statuses.length
      ? body.statuses
      : ["cancelled", "failed", "pending"];

    const candidates = await listWooOrders({
      per_page: 100,
      status: statuses.join(","),
      orderby: "date",
      order: "asc",
    });

    const filtered = (Array.isArray(candidates) ? candidates : []).filter(
      (order) =>
        hasCawlProviderMeta(order) &&
        isOlderThanDays(order?.date_created_gmt || order?.date_created, days)
    );

    const deleted = [];
    const failed = [];
    for (const order of filtered) {
      try {
        await deleteWooOrder(order.id, true);
        deleted.push(order.id);
      } catch (error) {
        failed.push({
          id: order.id,
          message: error?.message || "Delete failed",
        });
      }
    }

    return NextResponse.json({
      ok: true,
      scanned: Array.isArray(candidates) ? candidates.length : 0,
      deleted,
      failed,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Cleanup failed.", details: error?.message || "" },
      { status: 500 }
    );
  }
}
