import BusinessCardPage from "../../components/BusinessCardPage";
import { getCanonicalUrl } from "../../lib/site";

export const metadata = {
  title: "Carte de visite numerique - Conciergerie by Isa",
  description:
    "Carte de visite numerique d’Isabelle Haquin, conciergerie privee a Paris et proche couronne. Appel, email, WhatsApp, services et ajout aux contacts.",
  alternates: {
    canonical: getCanonicalUrl("/carte"),
  },
  openGraph: {
    title: "Carte de visite numerique - Conciergerie by Isa",
    description:
      "Contactez Isabelle Haquin en un geste : appel, email, WhatsApp, services et ajout aux contacts.",
    url: getCanonicalUrl("/carte"),
  },
};

export default function CartePage() {
  return <BusinessCardPage />;
}
