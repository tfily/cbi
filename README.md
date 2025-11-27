# Conciergerie by Isa - Headless Next.js + WordPress

This project is a headless setup for **Conciergerie by Isa**:

- Frontend: Next.js (App Router) + Tailwind CSS
- Backend: WordPress (`https://cbi-ndoo.gt.tc`) with a custom plugin and CPTs

## 1. Setup

```bash
cd next-app
npm install
```

Create `.env.local`:

```env
NEXT_PUBLIC_WORDPRESS_API_URL=https://cbi-ndoo.gt.tc/wp-json/wp/v2
NEXT_PUBLIC_WORDPRESS_SITE_URL=https://cbi-ndoo.gt.tc
```

Run dev server:

```bash
npm run dev
```

## 2. WordPress plugin

In `wp-plugin/conciergerie-by-isa/` you have a plugin that registers:

- `service` CPT → `/wp-json/wp/v2/services`
- `subscription` CPT → `/wp-json/wp/v2/subscriptions` with meta `cbi_price`
- `info_box` CPT → `/wp-json/wp/v2/info-boxes`

Activate it in your WP admin, then create:

- Services (from your pricing PDF)
- Abonnements (Bronze, Argent, Or, Premium)
- Infos clés (Horaires, Zones, Paiement, etc.)

## 3. Features

- Homepage:
  - Hero uses WordPress site title + tagline
  - Shows **one random info box** on each render
  - Lists services from CPT `service`
  - Lists subscriptions from CPT `subscription`
  - Shows latest news from regular Posts
  - Contact form with preselected service based on `?service=slug`

- Service detail pages:
  - `/services/[slug]` for each service

## 4. Git workflow

This folder is **Git-ready**:

```bash
cd next-app
git init
git add .
git commit -m "Initial commit: headless Conciergerie by Isa"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/conciergerie-by-isa.git
git push -u origin main
```

Then develop as usual with feature branches & pull requests.
