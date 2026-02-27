"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";

export default function GoogleAnalytics({ gaId }) {
  const pathname = usePathname();

  useEffect(() => {
    if (!gaId || typeof window === "undefined" || !window.gtag) return;
    const query = window.location.search || "";
    const pagePath = `${pathname || ""}${query}`;
    window.gtag("config", gaId, { page_path: pagePath });
  }, [gaId, pathname]);

  if (!gaId) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${gaId}');
        `}
      </Script>
    </>
  );
}
