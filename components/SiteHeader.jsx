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
    <header className="border-b border-neutral-200 bg-white/90 backdrop-blur">
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
              className="sm:hidden inline-flex items-center rounded-full border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-700"
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
                <Link key={item.href} href={item.href} className="hover:text-amber-800">
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
                className="inline-flex items-center px-3 py-1.5 rounded-full border border-emerald-700 text-xs font-semibold text-emerald-800 hover:bg-emerald-50"
              >
                Nous joindre
              </a>
              <Link
                href="/#contact"
                className="inline-flex items-center px-3 py-1.5 rounded-full bg-amber-700 text-xs font-semibold text-white hover:bg-amber-800"
              >
                Parler de votre besoin
              </Link>
            </div>
          ) : <span className="hidden sm:block" />}
        </div>

        {showNavigation && open ? (
          <div className="sm:hidden mt-3 space-y-2 rounded-xl border border-neutral-200 bg-white p-3">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-lg px-2 py-2 text-sm text-neutral-800 hover:bg-neutral-100"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/#contact"
              className="mt-1 inline-flex items-center px-3 py-1.5 rounded-full bg-amber-700 text-xs font-semibold text-white hover:bg-amber-800"
              onClick={() => setOpen(false)}
            >
              Parler de votre besoin
            </Link>
            <a
              href={whatsappHref}
              target={whatsappIsConfigured ? "_blank" : undefined}
              rel={whatsappIsConfigured ? "noopener noreferrer" : undefined}
              className="mt-1 inline-flex items-center px-3 py-1.5 rounded-full border border-emerald-700 text-xs font-semibold text-emerald-800 hover:bg-emerald-50"
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
