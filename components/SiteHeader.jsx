"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

const NAV_ITEMS = [
  { href: "/about", label: "À propos" },
  { href: "/#services", label: "Services" },
  { href: "/#subscriptions", label: "Abonnements" },
  { href: "/#news", label: "Actualités" },
  { href: "/#contact", label: "Contact" },
];

export default function SiteHeader({ showNavigation = true }) {
  const [open, setOpen] = useState(false);
  const whatsappNumber = String(
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || ""
  ).replace(/\D/g, "");
  const whatsappHref = whatsappNumber ? `https://wa.me/${whatsappNumber}` : "/#contact";
  const whatsappIsConfigured = Boolean(whatsappNumber);

  return (
    <header className="border-b border-[rgba(36,31,26,0.12)] bg-[rgba(250,247,241,0.94)] backdrop-blur">
      <div className="max-w-5xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
            <Image
              src="/logo-cbi.png"
              alt="Conciergerie by Isa"
              width={140}
              height={48}
              priority
            />
          </Link>

          {showNavigation ? (
            <button
              type="button"
              className="sm:hidden inline-flex items-center rounded-full border border-[rgba(31,27,23,0.18)] px-3 py-1.5 text-xs font-semibold text-[var(--cbi-text-main)]"
              onClick={() => setOpen((prev) => !prev)}
              aria-expanded={open}
              aria-label="Menu"
            >
              {open ? "Fermer" : "Menu"}
            </button>
          ) : null}

          {showNavigation ? (
            <nav className="hidden sm:flex text-sm gap-4">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-[var(--cbi-text-muted)] transition hover:text-[var(--cbi-text-main)]"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          ) : null}

          {showNavigation ? (
            <div className="hidden sm:flex items-center gap-2">
              <a
                href={whatsappHref}
                target={whatsappIsConfigured ? "_blank" : undefined}
                rel={whatsappIsConfigured ? "noopener noreferrer" : undefined}
                className="cbi-cta-secondary px-3 py-1.5 text-xs"
              >
                Nous joindre
              </a>
              <Link
                href="/#contact"
                className="cbi-cta-primary px-3 py-1.5 text-xs"
              >
                Parler de votre besoin
              </Link>
            </div>
          ) : <span className="hidden sm:block" />}
        </div>

        {showNavigation && open ? (
          <div className="sm:hidden mt-3 space-y-2 rounded-2xl border border-[rgba(36,31,26,0.12)] bg-[var(--cbi-bg-warm)] p-3 shadow-[0_16px_36px_rgba(31,27,23,0.08)]">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-lg px-2 py-2 text-sm text-[var(--cbi-text-main)] transition hover:bg-[rgba(36,31,26,0.05)]"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/#contact"
              className="cbi-cta-primary mt-1 px-3 py-1.5 text-xs"
              onClick={() => setOpen(false)}
            >
              Parler de votre besoin
            </Link>
            <a
              href={whatsappHref}
              target={whatsappIsConfigured ? "_blank" : undefined}
              rel={whatsappIsConfigured ? "noopener noreferrer" : undefined}
              className="cbi-cta-secondary mt-1 px-3 py-1.5 text-xs"
              onClick={() => setOpen(false)}
            >
              Nous joindre
            </a>
          </div>
        ) : null}
      </div>
    </header>
  );
}
