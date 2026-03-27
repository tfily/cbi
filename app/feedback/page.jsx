import { Suspense } from "react";
import FeedbackForm from "../../components/FeedbackForm";

export default function FeedbackPage() {
  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900">
      <section className="max-w-3xl mx-auto px-4 py-16">
        <div className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700 mb-3">
            Retour d'expérience
          </p>
          <h1 className="text-3xl font-bold mb-3">Donner votre avis</h1>
          <p className="text-sm text-neutral-600 mb-8">
            Votre retour nous aide à améliorer le service et à affiner nos
            prestations futures.
          </p>

          <Suspense
            fallback={
              <p className="text-sm text-neutral-500">
                Chargement du formulaire...
              </p>
            }
          >
            <FeedbackForm />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
