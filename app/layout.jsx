import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "Conciergerie by Isa - Services de conciergerie à Paris",
  description:
    "Conciergerie by Isa propose des services personnalisés pour simplifier le quotidien à Paris et en petite couronne.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body className="bg-neutral-50 text-neutral-900">
        <header className="border-b border-neutral-200 bg-white/80 backdrop-blur">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-sm font-semibold tracking-wide uppercase">
                Conciergerie by Isa
              </span>
            </Link>
            <nav className="hidden sm:flex text-sm gap-4">
              <a href="#services" className="hover:text-amber-800">
                Services
              </a>
              <a href="#subscriptions" className="hover:text-amber-800">
                Abonnements
              </a>
              <a href="#news" className="hover:text-amber-800">
                Actualités
              </a>
              <a href="#contact" className="hover:text-amber-800">
                Contact
              </a>
            </nav>
            <a
              href="#contact"
              className="inline-flex items-center px-3 py-1.5 rounded-full bg-amber-700 text-xs font-semibold text-white hover:bg-amber-800"
            >
              Demander un service
            </a>
          </div>
        </header>
        {children}
        <footer className="border-t border-neutral-200 bg-white">
          <div className="max-w-5xl mx-auto px-4 py-6 text-xs text-neutral-500 flex flex-wrap justify-between gap-2">
            <p>© {new Date().getFullYear()} Conciergerie by Isa. Tous droits réservés.</p>
            <p>Zones: Paris 6e, 7e, 15e, 17e et 92 - RGPD et assurance responsabilité civile.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
