import "./globals.css";
import Link from "next/link";
import Image from "next/image";
import ScrollToTopButton from "../components/ScrollToTopButton";
import SiteHeader from "../components/SiteHeader";

export const metadata = {
  title: "Conciergerie by Isa - Services de conciergerie à Paris",
  description:
    "Conciergerie by Isa propose des services personnalisés pour simplifier le quotidien à Paris et en petite couronne.",
};

function InstagramIcon(props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" ry="5" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" />
    </svg>
  );
}

function LinkedInIcon(props) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="2" />
      <rect x="7" y="10" width="2.2" height="7" fill="currentColor" />
      <circle cx="8.1" cy="7.4" r="1.2" fill="currentColor" />
      <path d="M12 10h2.1v1c.4-.6 1.2-1.3 2.5-1.3 2 0 3.4 1.2 3.4 3.9V17h-2.2v-3.2c0-1.4-.5-2.1-1.6-2.1-1.2 0-1.9.8-1.9 2.1V17H12z" fill="currentColor" />
    </svg>
  );
}

export default function RootLayout({ children }) {
  const maintenanceMode = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true";

  if (maintenanceMode) {
    return (
      <html lang="fr">
        <body className="min-h-screen flex flex-col bg-neutral-50 text-neutral-900">
          <SiteHeader showNavigation={false} />

          {/* MAIN CONTENT */}
          <div className="flex-1">{children}</div>

          {/* FOOTER */}
          <footer className="border-t border-neutral-200 bg-white">
            <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Image
                  src="/logo-cbi.png"
                  alt="Conciergerie by Isa"
                  width={120}
                  height={40}
                />
                <span className="text-xs font-medium text-neutral-500">
                  © {new Date().getFullYear()} Conciergerie by Isa
                </span>
              </div>
              <div className="text-center sm:text-right">
                <p className="text-[11px] text-neutral-500">
                  Zones : Paris 6e, 7e, 15e, 17e et 92 - services assurés et conformes RGPD.
                </p>
                <div className="mt-2 flex items-center justify-center sm:justify-end gap-3 text-xs">
                  <a
                    href="https://www.instagram.com/conciergeriebyisa?igsh=aml3dGVicjEzZXBr"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Instagram"
                    title="Instagram"
                    className="inline-flex items-center text-neutral-600 hover:text-amber-800"
                  >
                    <InstagramIcon className="h-4 w-4" />
                  </a>
                  <a
                    href="https://www.linkedin.com/in/isabelle-haquin-conciergerie-by-isa-009106385?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="LinkedIn"
                    title="LinkedIn"
                    className="inline-flex items-center text-neutral-600 hover:text-amber-800"
                  >
                    <LinkedInIcon className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          </footer>
        </body>
      </html>
    );
  }

  return (
    <html lang="fr">
      <body className="min-h-screen flex flex-col bg-neutral-50 text-neutral-900">
        <SiteHeader />

        {/* MAIN CONTENT */}
        <div className="flex-1">
          {children}
        </div>

        {/* FOOTER */}
        <footer className="border-t border-neutral-200 bg-white">
          <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Image
                src="/logo-cbi.png"
                alt="Conciergerie by Isa"
                width={120}
                height={40}
              />
              <span className="text-xs font-medium text-neutral-500">
                © {new Date().getFullYear()} Conciergerie by Isa
              </span>
            </div>
            <div className="text-center sm:text-right">
              <p className="text-[11px] text-neutral-500">
                Zones : Paris 6e, 7e, 15e, 17e et 92 - services assurés et conformes RGPD.
              </p>
              <div className="mt-2 flex items-center justify-center sm:justify-end gap-3 text-xs">
                <a
                  href="https://www.instagram.com/conciergeriebyisa?igsh=aml3dGVicjEzZXBr"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram"
                  title="Instagram"
                  className="inline-flex items-center text-neutral-600 hover:text-amber-800"
                >
                  <InstagramIcon className="h-4 w-4" />
                </a>
                <a
                  href="https://www.linkedin.com/in/isabelle-haquin-conciergerie-by-isa-009106385?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="LinkedIn"
                  title="LinkedIn"
                  className="inline-flex items-center text-neutral-600 hover:text-amber-800"
                >
                  <LinkedInIcon className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </footer>

        <ScrollToTopButton />
      </body>
    </html>
  );
}
