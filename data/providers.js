export const providerCategories = [
  {
    slug: "animaux",
    label: "Animaux",
    description: "Garde, promenades, visites et accompagnement du quotidien.",
    providers: [
      {
        name: "",
        services: [],
        phone: "",
        email: "",
        city: "",
        notes: "",
      },
    ],
  },
  {
    slug: "voiture",
    label: "Voiture",
    description: "Entretien, nettoyage, convoyage et assistance pratique.",
    providers: [
      {
        name: "",
        services: [],
        phone: "",
        email: "",
        city: "",
        notes: "",
      },
    ],
  },
  {
    slug: "maison",
    label: "Maison",
    description: "Menage, petits travaux, maintenance et interventions ponctuelles.",
    providers: [
      {
        name: "",
        services: [],
        phone: "",
        email: "",
        city: "",
        notes: "",
      },
    ],
  },
  {
    slug: "administratif",
    label: "Administratif",
    description: "Aide aux demarches, organisation et suivi administratif.",
    providers: [
      {
        name: "",
        services: [],
        phone: "",
        email: "",
        city: "",
        notes: "",
      },
    ],
  },
  {
    slug: "evenementiel",
    label: "Evenementiel",
    description: "Soutien logistique, reservations et coordination.",
    providers: [
      {
        name: "",
        services: [],
        phone: "",
        email: "",
        city: "",
        notes: "",
      },
    ],
  },
];

export function getVisibleProviders(categories = providerCategories) {
  return categories
    .map((category) => ({
      ...category,
      providers: (category.providers || []).filter((provider) => provider.name),
    }))
    .filter((category) => category.providers.length > 0);
}
