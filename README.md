# CampusKompas

Vind je weg op campus Leeuwarden. Een tweetalige, mobiele campusapp met originele NHL Stenden-plattegronden, zoeken, afzonderlijke routevoorbeelden, voorzieningen en gemodereerde studententips. Geen studentenaccounts, geen officieel NHL Stenden-logo in de appbranding.

## Direct gebruiken

Openbaar: https://campuskompas.vercel.app. Beheer: https://campuskompas.vercel.app/admin. Zes browsertests zijn tegen de openbare Vercel-site geslaagd, waaronder alle acht verdiepingskaarten en de echte Supabase-inzendings- en moderatieflow.

De app is gekoppeld aan het nieuwe Supabase-project **campuskompas**, regio **eu-central-1 (Frankfurt)**. De lokale `.env.local` bevat de verbinding; dit bestand wordt niet gecommit. Het beheerdersaccount is aangemaakt voor de eigenaar; de persoonlijke inloggegevens staan alleen in het genegeerde bestand `admin-access.txt`. Er is geen e-mail verstuurd.

```sh
cd campuskompas
npm install
npm run dev
```

Open http://127.0.0.1:3000. Beheer: http://127.0.0.1:3000/admin.

De vastgelegde pakketbeheerder van het project is pnpm. Met pnpm: `pnpm install`, `pnpm dev`. Node.js 22.13+ vereist. Deze omgeving gebruikt Node 24. Na `next build`: `npm start` start de productieversie.

## Wat werkt

- Zoeken op lokaal, naam, aliassen, NL/EN, categorie en goedgekeurde Hidden Gems; fuzzy matching en recente zoekopdrachten.
- Acht originele verdiepingskaarten, pan/zoom/pinch, gebouw- en verdiepingkeuze, locatiepanelen, deelbare links, QR-startpunten. Schematische SVG-routevoorbeelden staan in een aparte weergave.
- Klikbare informatiepunten op de originele kaart en plekknoppen eronder openen openingstijden uit Supabase. Ontbrekende dagen of tijden worden expliciet als niet bevestigd getoond, met een link naar de officiële bron wanneer beschikbaar.
- Zelfstandige Dijkstra-engine met meerdere verdiepingen, trappen, liften en buitenverbindingen. Geen schijnprecisie in afstanden of looptijden.
- Rolstoeloptie vereist bevestigde toegankelijkheid van alle nodes en edges. In de initiële dataset bestaat bewust **geen geverifieerde toegankelijke route**.
- Echte anonieme inzendingen, foto-upload naar privéopslag, moderatie, featured-status en gededupliceerde likes.
- Admin Auth met databasebeheerde autorisatie, locatie-/lokaal-/kaart-/route-/tip-/urenbeheer en QR-export.
- Kaarteditor voor toevoegen/verplaatsen van routepunten, verbinden van punten, verplaatsen/koppelen van locaties en JSON-vectorgeometrie.
- Manifest, PNG-iconen, mobiele navigatie, keyboardalternatieven, NL/EN en foutafhandeling.

## Belangrijk vóór campusgebruik

Dit is een werkende technische applicatie met **nog niet gevalideerde campusgeometrie**. Kaarten zijn eigen schematische vectoren, geen kopieën van externe PDF-pagina's. Routes zijn zichtbaar als voorbeelden gemarkeerd. Ze mogen niet als echte loopinstructies worden gebruikt voordat NHL Stenden de gegevens heeft gecontroleerd.

Het beperkte register bevat vijf uit de gids herleidbare lokaalnummers. F3.025 is het expliciete nummeringsvoorbeeld uit de gids, geen bevestiging van actueel lokaalgebruik. Er worden geen ontbrekende lokalen verzonnen. De acht verdiepingen zijn uitbreidbare records; op sommige verdiepingen zijn nog geen locaties geregistreerd.

Actuele officiële bronnen bevestigen de gebouwen, bibliotheek en horeca-namen. Openingstijden R8/R10/bibliotheek volgen de officiële website, niet de oudere gids. De uitzonderingenkalender is nog niet compleet: daarom geen live “Nu open”-claim. Zie [DATA_SOURCES](docs/DATA_SOURCES.md).

## Architectuur

Next.js 16.3.4 App Router, React 19, strict TypeScript, Tailwind 4, Base UI/Shadcn, Lucide, Supabase/PostgreSQL/Auth/Storage. Sites-publicatie gebruikt de aanvullende Vinext/Workers-build. De primaire `build` blijft echte Next.js voor Vercel.

```
app/                    pagina's en beveiligde HTTP-handlers
components/campus/      zoekfunctie, kaartlagen, details, routes, gems
components/admin/       beheer en kaarteditor
lib/campus/             centrale types, branding, data, validatie, uren
lib/routing/            pure routing, normalisatie en instructies
lib/server/             Supabase, authenticatie en begrensde requests
supabase/migrations/    reproduceerbaar schema en policies
supabase/functions/     beveiligde servergateway
tests/                  unit-, live-integratie- en browsertests
```

Geometry, locations en graph zijn afzonderlijke modellen. Coordinaatruimte: 800×600 schematische eenheden. Een edge-weight is een relatieve routekost, geen afstand in meters. Een room entrance moet aan het einde van een gang liggen. Wijziging van officiële kaarten hoeft de routingcode niet te veranderen.

## Supabase op een nieuwe omgeving

1. Maak een eigen Supabase-project in een passende regio.
2. Pas alle SQL-bestanden in `supabase/migrations` in tijdstempelvolgorde toe, via de CLI of SQL-editor. Met een gekoppelde CLI: `supabase db push` (controleer eerst `supabase db push --help`).
3. Kopieer `.env.example` naar `.env.local`. Vul `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` en **óf** `SUPABASE_SECRET_KEY` **óf** de servergateway-verbinding in. Gebruik geen `NEXT_PUBLIC_`-prefix voor secrets.
4. `npm run seed:check` valideert zonder writes. `npm run seed` schrijft de brondata idempotent. **Gebruik seed alleen bij inrichting:** upserts kunnen later handmatig aangepaste bronrecords overschrijven.
5. Privébucket `gem-photos` wordt door de migration aangemaakt. Geen publieke Storage policies. Maximaal 3 MB; JPEG, PNG of WebP; servercontrole op MIME en bestandskenmerken; willekeurige bestandsnamen.

### Waarom een servergateway?

De Supabase-MCP geeft geen geheime servicekey terug. Daarom is de gekoppelde omgeving ingericht met een eigen servercredential. Alleen de SHA-256-hash staat in de database. De Supabase Edge Function controleert dit credential, beperkt toegestane API-paden en voert serverwerk uit met zijn ingebouwde servicekey. Browsercode ontvangt dit credential nooit. Een normale `SUPABASE_SECRET_KEY` kan later dezelfde datalaag zonder gateway gebruiken.

De gateway heeft platform-JWT-controle uitgeschakeld omdat hij **eigen verplichte authenticatie** doet. Zonder het servercredential volgt 401; er is geen openbare privileged proxy. Rotatie: genereer een nieuw random credential, update de hash in `server_credentials` en de serveromgeving gelijktijdig. Deploy daarna opnieuw.

## Beheerder toevoegen

Er is geen publieke registratie. Een database-trigger weigert nieuwe Auth-gebruikers tenzij de eigenaar vooraf een eenmalige, vijf minuten geldige permit verstrekt. Daardoor werken ook directe anonieme signup-aanvragen niet. Een Auth-identiteit alleen geeft nog geen beheerdersrechten.

1. Voeg als database-eigenaar kort voor provisioning toe:
   `insert into private.registration_permits(email) values ('YOUR_ADMIN_EMAIL');`
2. Voer `pnpm exec tsx scripts/provision-admin.ts YOUR_ADMIN_EMAIL` uit. Dit creëert een Auth-identiteit en schrijft een random wachtwoord naar het genegeerde lokale toegangsbestand. Het overschrijft dat bestand; bewaar bestaande toegangsgegevens veilig.
3. Voeg de teruggegeven UUID toe:
   `insert into public.admin_profiles(user_id) values ('RETURNED_USER_UUID');`

Alle admin-API-aanvragen doen `auth.getUser()` plus een actuele `admin_profiles`-controle. Zelf benoemen tot admin is niet mogelijk. Sessiecookie: HttpOnly, SameSite=Strict, Secure op HTTPS, beperkte levensduur; na verlopen opnieuw inloggen. Verwijder `admin_profiles` om app-toegang onmiddellijk in te trekken.

## Kaarten, routes en data bijwerken

- **Branding:** `lib/campus/brand.ts` beheert naam, kleuren en teksten. Pas bij een officiële theme ook de PWA-iconen aan.
- **Nieuwe verdieping:** maak een floor met uniek `(building_id, level)`; daarna nodes en locaties. Nieuwe gebouwen zijn records in `buildings`.
- **Officiële kaart:** zet goedgekeurde brongeometrie om naar het JSON Shape-model (`room`, `hall`, `outside`) in de floor-editor. SVG/CAD/PDF vereist conversie naar dit model; er is geen automatische CAD-parser.
- **Marker/node:** kies `/admin/maps`, voeg/verplaats punten. Numerieke X/Y-velden bieden een keyboardalternatief. Een nieuwe locatie maak je eerst bij Locations en koppel je daarna aan een node.
- **Edge:** verbind twee nodes. Pas type, relatieve kosten, toegankelijkheid en verificatiestatus aan bij Route edges. Verbindingen tussen verdiepingen zijn expliciete lift-/trap-edges; tussen gebouwen een outdoor-edge.
- **Lokaal:** location met room_code én rooms-record koppelen. Publicatie via status `approved`.
- **Openingstijden:** weektijden onder ISO-weekdag 0–6 (zondag=0); ontbrekend/null betekent onbekend, lege lijst gesloten. `exceptions` overschrijft de weekdag per datum. Alleen geverifieerde, maximaal 30 dagen oude data met gecontroleerde uitzonderingenperiode krijgt een live status. Tijdzone Europe/Amsterdam; overnacht open intervallen splits je over twee dagen.
- **QR:** koppel actieve code aan route_node_id. Export geeft een PNG met `/map?from=qr:CODE`. Controleer fysieke positie en toegankelijkheid vóór plaatsing.
- **Gems:** alleen approved wordt publiek. Review foto, tekst en locatie vóór goedkeuring. Communitytekst blijft in de oorspronkelijke taal.

## Tests

```sh
npm run lint
npm run typecheck
npm test
npm run seed:check
npx playwright install chromium
npm run test:e2e
npm run build
```

Voor live tests: `.env.local` en `.env.test.local` met `TEST_ADMIN_EMAIL`, `TEST_ADMIN_PASSWORD`, `TEST_ADMIN_ID`. De tests maken uitsluitend herkenbare tijdelijke QA-records en ruimen deze op. Geen live tests overslaan wanneer je database/security wijzigt. In deze Windows-omgeving kan `PLAYWRIGHT_CHANNEL=msedge` de aanwezige Edge gebruiken. Start de developmentserver voor E2E.

Browserchecks omvatten lokaal zoeken, routefasen, toegankelijke foutmelding, QR, taalbehoud, 320px layout, keyboardselectie, axe, publieke afscherming, echte foto-inzending, admin-goedkeuring, publieke zichtbaarheid, likes en QR-export. Een axe-test is geen volledige WCAG-audit; screenreader- en fysieke toegankelijkheidstests blijven nodig vóór officiële uitrol.

## Deployment

**Vercel:** project `campuskompas` in `maxcrijnen-alts-projects`, openbare origin `https://campuskompas.vercel.app`. `vercel.json` configureert Next.js en de build. De Supabase-instellingen staan in Production en Preview; `SUPABASE_GATEWAY_SECRET` is een Secret. `.vercelignore` sluit lokale toegangsbestanden en werkmappen uit. Publicaties vanuit de connector bevatten uitsluitend applicatiebestanden. Er is nog geen automatische GitHub-koppeling. Gebruik bij nieuwe publicaties dezelfde projectnaam en team.

**Originele plattegronden:** de acht kaarten in `public/maps/` zijn ongewijzigde paginarenders uit de NHL Stenden-gids. Zie `public/maps/README.md` voor de bron en paginanummers. Deze kaarten worden standaard getoond, met inzoomen en PDF-bronlink. De routeprototypeweergave staat apart; de oorspronkelijke schematische routecoördinaten zijn niet op de echte kaarten gelegd.

**Sites:** `pnpm run build:sites` maakt de aparte Worker-build. Hosting-ID staat in `.openai/hosting.json`; alle secrets staan in de hostingomgeving. In deze Windows-runtime crasht lokale workerd-start door een native runtimeprobleem; Next.js preview en de Worker-productiebuild werken wel.

## Privacy en beveiliging

Geen analytics actief. `lib/campus/analytics.ts` biedt een optionele adapter. Registreer geen vrije zoektekst, persoonlijke gegevens of precieze studentlocaties. Het anonieme like-cookie is een willekeurig ID; de database bewaart alleen een hash. Cookies kunnen gewist worden: likes zijn sociale indicatie, geen fraudeproof stemming.

Anti-spam: honeypot, minimum invultijd, lengte-/payloadlimieten, servercontrole en transactionele database-rate-limit. Rate-limitregistraties ouder dan twee dagen worden tijdens gebruik opgeschoond. Foto's kunnen persoonsgegevens bevatten; moderatie en bewaarbeleid moeten door de eigenaar worden vastgesteld.

RLS staat op alle exposed tabellen. Public kan nooit status, routegraph of adminlidmaatschap wijzigen. Privileged tables hebben bewust geen publieke policies. Input wordt als tekst weergegeven, zonder `dangerouslySetInnerHTML`.

Supabase kan op het gratis plan melden dat leaked-password protection uitstaat. Het aangemaakte wachtwoord is cryptografisch willekeurig; externe wachtwoordlekcontrole is niet geconfigureerd. Zie `docs/SECURITY.md` voor verificatie en resterende operationele aandachtspunten.
