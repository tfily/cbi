import { NextResponse } from "next/server";

export const runtime = "nodejs";

function resolveWordPressSiteUrl() {
  return (
    process.env.WORDPRESS_SITE_URL ||
    process.env.NEXT_PUBLIC_WORDPRESS_SITE_URL ||
    ""
  ).replace(/\/$/, "");
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug") || "";
    const weekStart = searchParams.get("week_start") || "";

    if (!slug || !weekStart) {
      return NextResponse.json(
        { error: "Missing slug or week_start." },
        { status: 400 }
      );
    }

    const siteUrl = resolveWordPressSiteUrl();
    if (!siteUrl) {
      return NextResponse.json(
        { error: "WordPress site URL not configured." },
        { status: 500 }
      );
    }

    const endpoint = `${siteUrl}/wp-json/cbi/v1/availability?slug=${encodeURIComponent(
      slug
    )}&week_start=${encodeURIComponent(weekStart)}`;

    const res = await fetch(endpoint, { cache: "no-store" });
    const text = await res.text();
    const body = text ? JSON.parse(text) : {};

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to load availability.", details: body },
        { status: res.status }
      );
    }

    return NextResponse.json(body);
  } catch (error) {
    return NextResponse.json(
      { error: "Availability proxy failed.", details: error?.message || "" },
      { status: 500 }
    );
  }
}
