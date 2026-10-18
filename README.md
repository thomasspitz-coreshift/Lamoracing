# LAMO Racing Car — site officiel (refonte)

Refonte complète de [lamoracingcar.com](https://www.lamoracingcar.com) : écurie de sport automobile professionnelle basée à Montauban depuis 2007.

Direction artistique : la rigueur éditoriale de [coreshift.fr](https://coreshift.fr) au service de l’identité LAMO (noir piste, rouge LAMO `hsl(7 100% 50%)`, logo officiel, typographie condensée Bebas Neue pour les moments de marque), avec Geist / Geist Mono pour le texte et les données « télémétrie ».

## Pages

| URL | Contenu |
| --- | --- |
| `/` | Hero vidéo (montage des reels Paul Ricard), télémétrie animée, chiffres clés, circuits, offres, parc automobile, « Pourquoi LAMO » (scroll interactif), écosystème, simulateur, palmarès, contact, FAQ |
| `/ecurie/equipe/` | Staff technique, valeurs, palmarès, recrutement pilotes |
| `/ecurie/structure/` | Histoire, infos clés, circuits, palmarès complet 2008 → 2024, plan d’accès |
| `/ecurie/prestations/` | Formules clés en main, compétition, coaching, GT Porsche, véhicules, devis |
| `/simulateur/` | Simulateur ex-Tech One Racing (Pierre Gasly), déroulé d’une session, réservation |
| `/atelier/` | Préparation course, entretien toutes marques, demande de devis |
| `/boutique/` | Boutique « bientôt disponible » |
| `/contact/` | Coordonnées, statut de l’écurie, formulaire, carte |
| `/media/photos/` | Galerie + visionneuse plein écran |
| `/media/videos/` | Les 4 reels du Paul Ricard |
| `404.html` | Page « sortie de piste » |

Les URL reprennent celles du site actuel : pas de perte de référencement. `/accueil` redirige vers `/`.

## Stack

- [Vite](https://vite.dev) multi-pages, HTML / CSS / JavaScript sans framework : pages légères, rapides et indexables.
- En-tête, pied de page, formulaire et FAQ partagés via `partials/` (balise `<!-- @include nom -->`, voir `vite.config.js`).
- [Lenis](https://lenis.darkroom.engineering) pour le défilement fluide ; animations natives (IntersectionObserver), désactivées si l’utilisateur préfère réduire les animations.
- Polices auto-hébergées (`@fontsource`) : aucune requête vers Google Fonts.
- Carte Google Maps chargée uniquement au clic (pas de cookie tiers avant consentement).

```bash
npm install
npm run dev       # développement — http://localhost:5173
npm run build     # production → dist/
npm run preview   # prévisualiser dist/
```

## Mise en ligne (Netlify recommandé)

`netlify.toml` est prêt : build `npm run build`, publication `dist/`, cache long des assets, redirection `/accueil`.

Le formulaire de contact utilise **Netlify Forms** (`data-netlify="true"`) : les demandes arrivent dans le tableau de bord Netlify et peuvent être transférées par e-mail à `laurent@lamoracingcar.com`. Hors Netlify, le formulaire bascule automatiquement sur un e-mail pré-rempli.

## Médias

- `public/img/` : photos d’origine du site, converties en WebP (≈ 1,7 Mo au total contre ≈ 15 Mo auparavant).
- `public/video/hero-*.mp4` : montage de 14 s tiré des reels (version 16:9 desktop, 9:16 mobile).
- `public/video/reel-jour-*.mp4` : reels recompressés (≈ 3,5 Mo chacun contre ≈ 50 Mo).
- Crédits photos : [@vl_production_motorsport](https://www.instagram.com/vl_production_motorsport/).

## Points à valider avec l’écurie

- **Chiffres** : « 10+ années », « 6+ pilotes », « 50+ podiums » repris du site actuel (l’écurie existe depuis 2007 : le chiffre des années peut être mis à jour).
- **Palmarès** : la page Équipe du site actuel indique « Champion de France » en 2021, 2022 et 2023, ce qui n’apparaît pas dans le palmarès détaillé de la page Structure. Les deux listes sont reprises telles quelles : à harmoniser.
- **Photos du staff** : les fiches équipe utilisent des monogrammes ; elles accueilleront des portraits dès qu’ils seront fournis.
- **Panneau « Ingénierie piste »** de l’accueil : les temps au tour et messages radio sont des exemples illustratifs, signalés comme tels.
- **Mentions légales / politique de confidentialité** : à fournir (raison sociale, SIRET, hébergeur).
- **Boutique** : prête à accueillir un catalogue (Shopify, Stripe Payment Links…) le moment venu.

---

Design & développement : [Coreshift](https://coreshift.fr)
