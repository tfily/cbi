# Carte de visite numerique CBI

## URL

- page principale : `/carte`
- alias court : `/isa`
- vCard : `/carte/vcard`

## Fichiers modifies

- `app/carte/page.jsx`
- `app/carte/vcard/route.js`
- `app/isa/page.jsx`
- `components/BusinessCardPage.jsx`
- `lib/business-card.js`
- `app/globals.css`

## Logique

- La carte numerique est implementée dans le front public Next.js car ce depot est un site headless public, pas un theme WordPress local.
- Les coordonnees, liens, services et messages CTA sont centralises dans `lib/business-card.js`.
- Le bouton `Ajouter aux contacts` telecharge une vraie vCard `.vcf`.
- Le QR code utilise par defaut `api.qrserver.com` avec l’URL publique de `/carte`.
- Une version compacte existe comme base de declinaison pour une carte papier imprimeur avec QR code vers `/carte`.
- L’URL affichee sur la carte suit automatiquement l’URL publique du site via `APP_BASE_URL` ou `NEXT_PUBLIC_SITE_URL`. En production, elle affichera donc l’adresse du site en ligne.

## Modifier les coordonnees

Editez `lib/business-card.js` :

- `BUSINESS_CARD_CONTACT.email`
- `BUSINESS_CARD_CONTACT.phoneDisplay`
- `BUSINESS_CARD_CONTACT.phoneHref`
- `BUSINESS_CARD_CONTACT.addressStreet`
- `BUSINESS_CARD_CONTACT.addressPostalCode`
- `BUSINESS_CARD_CONTACT.addressLocality`
- `BUSINESS_CARD_CONTACT.instagramUrl`

## Remplacer le QR code

Par defaut, le composant construit une image distante via `getBusinessCardQrCodeUrl()`.

Pour utiliser un QR code local ou heberge ailleurs :

1. ajoutez l’image dans `public/`
2. remplacez l’usage de `qrCodeUrl` dans `components/BusinessCardPage.jsx`
3. gardez l’URL cible `/carte`

## Maintenance

- Pour modifier les services affiches : editez `BUSINESS_CARD_SERVICES` dans `lib/business-card.js`
- Pour modifier les preuves de confiance : editez `BUSINESS_CARD_TRUST_POINTS`
- Pour changer l’URL de demande de service : modifiez `requestUrl`
- Pour changer l’URL de la section services : modifiez `servicesUrl`
- Pour changer l’URL publique affichee sur la carte : configurez `APP_BASE_URL` ou `NEXT_PUBLIC_SITE_URL`
