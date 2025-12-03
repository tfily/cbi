import "./globals.css";
import Link from "next/link";
import Image from "next/image";
import ScrollToTopButton from "../components/ScrollToTopButton";

export const metadata = {
  title: "Conciergerie by Isa - Services de conciergerie à Paris",
  description:
    "Conciergerie by Isa propose des services personnalisés pour simplifier le quotidien à Paris et en petite couronne.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body className="min-h-screen flex flex-col bg-neutral-50 text-neutral-900">
        {/* NAVBAR */}
        <header className="border-b border-neutral-200 bg-white/80 backdrop-blur">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/logo-cbi.png"
                alt="Conciergerie by Isa"
                width={140}
                height={48}
                priority
              />
            </Link>

            {/* Navigation */}
            <nav className="hidden sm:flex text-sm gap-4">
              <Link href="/#services" className="hover:text-amber-800">
                Services
              </Link>
              <Link href="/#subscriptions" className="hover:text-amber-800">
                Abonnements
              </Link>
              <Link href="/#news" className="hover:text-amber-800">
                Actualités
              </Link>
              <Link href="/#contact" className="hover:text-amber-800">
                Contact
              </Link>
            </nav>

            {/* CTA */}
            <Link
              href="/#contact"
              className="inline-flex items-center px-3 py-1.5 rounded-full bg-amber-700 text-xs font-semibold text-white hover:bg-amber-800"
            >
              Demander un service
            </Link>
          </div>
        </header>

        {/* MAIN CONTENT */}
        <div className="flex-1">
          {children}
        </div>

        {/* FOOTER */}
        <footer className="border-t border-neutral-200 bg-white">
          <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Image
                src="/hero-conciergerie-1.png"
                alt="Conciergerie by Isa"
                width={120}
                height={40}
              />
              <span className="text-xs font-medium text-neutral-500">
                © {new Date().getFullYear()} Conciergerie by Isa
              </span>
            </div>
            <p className="text-[11px] text-neutral-500 text-center sm:text-right">
              Zones : Paris 6e, 7e, 15e, 17e et 92 - services assurés et conformes RGPD.
            </p>
          </div>
        </footer>

        <ScrollToTopButton />
      </body>
    </html>
  );
}
