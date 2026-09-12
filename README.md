# CampusKompas

CampusKompas is een tweetalige, mobiele campusnavigator voor NHL Stenden Leeuwarden. De app combineert de officiële Rengerslaan 8- en Rengerslaan 10-plattegronden met lokaalzoeken, graph-routing, openingstijden en gemodereerde Hidden Gems. Studenten hebben geen account nodig.

- Productie: https://campuskompas.vercel.app
- Beheer: https://campuskompas.vercel.app/admin
- Repository: https://github.com/maxcrijnen-alt/campuskompas
- Productiestatus en runbook: [docs/PRODUCTION_READINESS.md](docs/PRODUCTION_READINESS.md)

De software is productierijp voor de huidige dataset. De routegeometrie, toegankelijkheid en enkele operationele locaties zijn nog niet fysiek door NHL Stenden gevalideerd. De app communiceert die onzekerheid expliciet en presenteert onbekende toegankelijkheid nooit als toegankelijk of ontoegankelijk.

## Lokaal starten

Vereisten: Node.js 24 en pnpm 11.19.0. Beide versies zijn in `package.json` vastgelegd; `.node-version` helpt lokale version managers dezelfde Node-major te kiezen.

```sh
corepack enable
pnpm install --frozen-lockfile
copy .env.example .env.local
pnpm dev
```

Open daarna http://127.0.0.1:3000. Vul vóór het starten de vereiste waarden in `.env.local` in. Dit bestand wordt genegeerd door Git.

## Omgevingsvariabelen

| Variabele                  | Doel                                                                       |
| -------------------------- | -------------------------------------------------------------------------- |
| `SUPABASE_URL`             | URL van het Supabase-project                                               |
| `SUPABASE_PUBLISHABLE_KEY` | Publieke sleutel voor RLS-beveiligde toegang                               |
| `SUPABASE_SECRET_KEY`      | Optionele server-only sleutel                                              |
| `SUPABASE_GATEWAY_SECRET`  | Server-only alternatief voor de secret key via de beveiligde Edge Function |
| `NEXT_PUBLIC_SITE_URL`     | Publieke origin voor onder meer wachtwoordherstel                          |
| `NEXT_TELEMETRY_DISABLED`  | Optionele Next.js-telemetrie-instelling                                    |

Gebruik precies één serverroute: `SUPABASE_SECRET_KEY`, of de ingerichte gateway met `SUPABASE_GATEWAY_SECRET`. Geef secrets nooit een `NEXT_PUBLIC_`-prefix en zet ze uitsluitend in lokale/Vercel secret stores.

Voor live E2E zijn daarnaast `TEST_ADMIN_EMAIL`, `TEST_ADMIN_PASSWORD` en `TEST_ADMIN_ID` nodig in het genegeerde `.env.test.local`.

## Architectuur

```text
app/                    Next.js-pagina's en begrensde HTTP-handlers
components/campus/      zoeken, kaart, details, routes en Hidden Gems
components/admin/       beheerdersschermen en kaart-/urenbeheer
lib/campus/             types, validatie, search en opening-hours-engine
lib/routing/            endpointresolver, graph, Dijkstra en instructies
lib/server/             Supabase-clients, data en adminautorisatie
supabase/migrations/    reproduceerbaar schema, constraints en RLS
supabase/functions/     beveiligde servergateway
scripts/                data-, routing-, search- en uren-audits
tests/                  unit-, integratie- en Playwright-tests
```

De centrale resolver vertaalt zowel `Van` als `Naar` naar één gevalideerd route-endpoint. Normalisatie bewaart betekenisvolle kamercodes; bijvoorbeeld `C0.102` en `C0.1.02` blijven verschillende lokalen. Routes gebruiken uitsluitend opgeslagen graph-edges en `map_path`-geometrie. Er bestaat geen rechte-lijnfallback door muren.

Bij rolstoelrouting zijn trappen en verified-inaccessible records verboden. Onbekende gegevens mogen als kandidaat worden gebruikt met een duidelijke waarschuwing. Een verdiepingsovergang binnen één gebouw moet een expliciete `elevator`-edge gebruiken; een gebouwovergang een expliciete `outdoor`-edge.

Lees [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) voor de volledige datastroom en [docs/DATA_SOURCES.md](docs/DATA_SOURCES.md) voor bron- en fysieke beperkingen.

## Supabase inrichten

1. Maak een Supabase-project in een passende regio.
2. Pas alle bestanden in `supabase/migrations/` in tijdstempelvolgorde toe. Gebruik bij een gekoppelde CLI `supabase db push` en controleer eerst of de remote history overeenkomt.
3. Vul `.env.local` vanuit `.env.example`.
4. Voer `pnpm seed:check` uit. Gebruik `pnpm seed` alleen bij een nieuwe inrichting; de seed is idempotent maar kan later handmatig beheerde bronrecords terugzetten.
5. Controleer de private Storage-bucket `gem-photos`. Alleen gevalideerde JPEG-, PNG- en WebP-bestanden tot 3 MB worden geaccepteerd.

De huidige productie gebruikt project `campuskompas` in `eu-central-1`. Supabase is de bron van waarheid voor database, Auth en private Storage.

## Beheer

Publieke self-registration is uitgeschakeld. `/admin` accepteert alleen een geldige Supabase-gebruiker die tevens in `admin_profiles` staat. De eigenaar kan via **Wachtwoord vergeten?** een neutrale, rate-limited reset aanvragen; de response onthult niet of een adres bestaat.

Nieuwe beheerders worden bewust geprovisioned:

1. Voeg kort vóór provisioning een vijf minuten geldige `private.registration_permits`-rij toe.
2. Voer `pnpm exec tsx scripts/provision-admin.ts ADMIN_EMAIL` uit in een beveiligde lokale omgeving.
3. Voeg de teruggegeven user-ID toe aan `public.admin_profiles`.

De Hours Admin laat een beheerder een voorziening of Hidden Gem op naam zoeken, een weekrooster, gesloten dagen, meerdere tijdblokken, uitzonderingen, bron en notities beheren en het record atomair koppelen. Iedere opgeslagen wijziging wordt met de actuele datum als **geverifieerd door beheerder** gepubliceerd; het gekozen brontype blijft zichtbaar. Hiervoor zijn geen SQL of UUID's nodig.

Ook andere beheergegevens met een verificatiestatus worden bij opslaan automatisch bevestigd. Voor routenodes en routeverbindingen bevestigt de beheerder daarbij zowel de algemene gegevens als de ingestelde toegankelijkheidsstatus.

## Verificatie

```sh
pnpm search:audit
pnpm routing:audit
pnpm routing:regression
pnpm routing:audit-accessibility
pnpm routing:audit-experience
pnpm hours:audit
pnpm database:audit
pnpm seed:check
pnpm test
pnpm test:e2e
pnpm lint
pnpm typecheck
pnpm build
```

Playwright draait standaard tegen `http://127.0.0.1:3000`; stel `PLAYWRIGHT_BASE_URL` alleen in voor een expliciete andere omgeving. Tests tegen Supabase maken herkenbare tijdelijke QA-records en ruimen die op.

## Deployment

Pushes naar GitHub `main` worden automatisch als Vercel-productiedeployment gebouwd. `vercel.json` gebruikt Frankfurt (`fra1`), een frozen pnpm-lockfile en de Next.js-build. Controleer na iedere release dat de deployment exact de verwachte Git-SHA heeft, `READY` is, de productiealias bezit en geen runtimefouten meldt.

Direct pushen naar `main` blijft een bewuste keuze van de eigenaar. Er zijn geen verplichte PR's, approvals, branch protection of blokkerende statuschecks.

## Veiligheid en operationele grenzen

RLS beschermt alle exposed tabellen. Publieke mutaties lopen via begrensde handlers en transacties; adminhandlers verifiëren telkens de Auth-user en `admin_profiles`. De fotobucket is privé. Privileged keys bereiken de browser niet.

De kaart is geen evacuatie-instrument of toegankelijkheidscertificaat. Controleer vóór officiële campusclaims alle ingangen, corridors, liften, trappen, buitenovergangen en openingstijden fysiek. Zie [docs/SECURITY.md](docs/SECURITY.md) en het production-readinessrunbook voor de resterende handmatige acties.
