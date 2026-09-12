# CampusKompas production readiness

Last verified: 2026-09-12

CampusKompas is softwarematig productierijp voor de huidige R8/R10-dataset. De applicatie maakt fysieke onbekendheden zichtbaar; zij claimt geen gecertificeerde route of toegankelijkheid. Onderstaande stappen zijn het praktische beheer- en herstelrunbook.

## Productieoverzicht

- GitHub: `maxcrijnen-alt/campuskompas`, branch `main`
- Vercel-project: `campuskompas`
- Publieke alias: https://campuskompas.vercel.app
- Supabase-project: `campuskompas`, regio `eu-central-1`
- Runtime: Node 24.x, pnpm 11.19.0, Next.js 16.3.4
- Data: 606 approved locaties, 576 publieke kamers, 514 nodes en 535 edges
- Routing: 606 directe endpoints, 0 inferred, 0 needs-review, 0 unavailable; één normale graphcomponent

## Verse clone

```sh
git clone https://github.com/maxcrijnen-alt/campuskompas.git
cd campuskompas
corepack enable
pnpm install --frozen-lockfile
copy .env.example .env.local
pnpm dev
```

Gebruik Node 24; `.node-version` en `engines.node` leggen de major vast. Voeg de Supabase-waarden toe aan `.env.local`. Commit nooit `.env.local`, `.env.test.local`, tokens, resetlinks of tijdelijke wachtwoorden.

## Vereiste omgeving

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SITE_URL`
- één van `SUPABASE_SECRET_KEY` of `SUPABASE_GATEWAY_SECRET`
- optioneel `NEXT_TELEMETRY_DISABLED=1`

Voor E2E: `TEST_ADMIN_EMAIL`, `TEST_ADMIN_PASSWORD`, `TEST_ADMIN_ID` in `.env.test.local`. Productie- en Preview-waarden worden in Vercel beheerd.

## Migrations en seed

`supabase/migrations/` is de volledige schemahistory. Vergelijk vóór een push de lokale timestamp/naamcombinaties met `supabase_migrations.schema_migrations`. Wanneer ze overeenkomen: niets repareren, geen oude DDL opnieuw uitvoeren en geen history metadata herschrijven.

Voor een nieuw project:

1. pas migrations chronologisch toe;
2. controleer RLS en Storage;
3. voer `pnpm seed:check` uit;
4. voer alleen bij initiële inrichting `pnpm seed` uit;
5. draai alle audits.

De provenance-migrations ondersteunen `official_web`, `physical_signage`, `staff_confirmation` en `manual_admin`. Een officiële webbron vereist HTTPS. Een opgeslagen Hours Admin-wijziging wordt bevestigd door de ingelogde beheerder en krijgt automatisch `verified` met de huidige datum; `manual_admin` blijft zichtbaar als de werkelijke herkomst.

De generieke adminopslag bevestigt automatisch bronnen, verdiepingen, locaties, routenodes en routeverbindingen. Bij routenodes en routeverbindingen wordt ook de door de beheerder ingestelde toegankelijkheidsstatus bevestigd. Hidden Gems behouden hun eigen goedkeurings- en locatiereviewworkflow.

## Verificatiecommando's

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

Start voor lokale E2E eerst `pnpm dev`. Gebruik `PLAYWRIGHT_BASE_URL` alleen wanneer bewust een andere omgeving wordt getest. De suite gebruikt tijdelijke herkenbare records en moet die altijd opruimen.

## Adminlogin en wachtwoordherstel

1. Open `/admin`.
2. Log in met een vooraf geprovisioned adminadres.
3. Gebruik **Wachtwoord vergeten?** wanneer een nieuw wachtwoord nodig is.
4. De publieke response blijft generiek; open de meest recente e-mail en stel een sterk wachtwoord in.
5. Controleer na intrekken van toegang dat de rij uit `admin_profiles` is verwijderd.

Publieke registratie hoort altijd geblokkeerd te blijven. Een Auth-user zonder `admin_profiles`-rij heeft geen beheertoegang.

## Openingstijden aanpassen

Voor “Central Brew heeft vanaf morgen nieuwe openingstijden”:

1. open `/admin/opening-hours`;
2. zoek `Central Brew` op naam;
3. kies een bestaand urenrecord of maak een nieuw record;
4. vul weekdagen, eventueel meerdere blokken en uitzonderingen in;
5. kies hours type en brontype, voeg bronbeschrijving en zo nodig URL toe;
6. kies verificatiestatus en datum;
7. controleer de preview en kies **Opslaan en koppelen**;
8. open de publieke locatie en controleer de compacte status en het weekrooster.

Gebruik `manual_admin` wanneer jij als beheerder de bron bent en beschrijf concreet waarop de wijziging is gebaseerd. De app markeert de opgeslagen wijziging als **geverifieerd door beheerder**. Kies `official_web`, signage of medewerkerbevestiging wanneer dat de werkelijke bron is.

## Hidden Gems modereren

Open `/admin/gems`, controleer inhoud, foto en locatiemodus, en keur daarna goed of af. Een canonical locatie mag routeacties krijgen. Een `r8`/`r10`-voorstel blijft routevrij totdat een beheerder het aan één gevalideerde locatie koppelt. `campus_outdoor` en `other` mogen gepubliceerd worden zonder fictief gebouw, verdieping, node of route.

BRÛZE gebruikt dezelfde generieke architectuur. De huidige Gem blijft approved content met `needs_review`-locatie en urencontext; er is geen route zolang het exacte kaartpunt niet is bevestigd.

## Route- en accessibilitybeheer

- Gebruik altijd de centrale endpointresolver; maak geen endpointlogica in React-componenten.
- Voeg graphwijzigingen alleen via een migration of reproduceerbaar importscript toe.
- Controleer na iedere wijziging componenten, 606-location coverage en kritieke pairs.
- Markeer accessibility alleen verified na fysieke controle.
- Binnen hetzelfde gebouw gebruikt wheelchair-routing uitsluitend een echte liftedge voor floor changes; tussen gebouwen uitsluitend een outdoor-edge.
- Ontbrekende R10-topologie blijft een geverifieerde beperking en mag niet worden ingevuld op basis van aannames.

## Deployment

Een push naar `origin/main` start automatisch een Vercel-productiedeployment. Controleer na de push:

1. de deployment bevat exact de finale Git-SHA;
2. target is `production` en status is `READY`;
3. `campuskompas.vercel.app` staat in de aliases;
4. homepage, map, Gems, admin en resetpagina geven een normale response;
5. Vercel toont geen nieuwe runtimefouten.

Direct pushen naar `main` is bewust toegestaan. Voeg geen verplichte PR-, approval- of branch-protectionflow toe.

## Basisherstel

- **Mislukte deployment:** behoud de vorige READY-deployment, los lokaal op, draai build/tests en push een nieuwe commit. Force-push niet.
- **Database unavailable:** controleer Supabase-status en Vercel environment variables. De publieke app toont een unavailable-state en gebruikt geen mockbackend.
- **Gatewaycredential verdacht:** genereer een nieuw random credential, vervang databasehash en Vercel-secret gecoördineerd en verwijder daarna het oude credential.
- **Adminaccount intrekken:** verwijder de betreffende `admin_profiles`-rij; roteer het wachtwoord bij vermoeden van accountmisbruik.
- **Onjuiste uren:** zet het record op `needs_review`/`unverified` of ontkoppel het; publiceer geen geschatte tijden.
- **Onjuiste Gem/foto:** archiveer of reject in admin en verwijder de private foto volgens het bewaarbeleid.

## Advisorbeslissingen

- `private.rate_limits`, `private.registration_permits` en `public.server_credentials` blijven RLS deny-all zonder publieke policy.
- Multiple permissive SELECT-policies blijven behouden zolang geen gemeten databasebottleneck een veilige herstructurering rechtvaardigt.
- Negen ongebruikte indexes blijven staan totdat representatieve productiebelasting redundantie aantoont.
- **Handmatige actie vereist:** zet in Supabase Auth bij de Email-provider **Prevent use of leaked passwords** aan. Deze functie vereist volgens Supabase een Pro-plan of hoger. Controleer daarna de Security Advisor.

## Performancegrens

De server leest campustabellen parallel en pagineert vanaf 500 records; zoeken en routeberekening veroorzaken geen N+1-requests. De huidige volledige snapshot is passend voor 606 locaties en maakt interacties direct. Meet responsegrootte en latency opnieuw bij sterke datasetgroei; splits dan data per gebouw/floor of gebruik een versioned dataset-endpoint zonder de centrale resolver te dupliceren.

## Remaining physical / operational verification

- R10-liftchain en aansluiting op de huidige endpointcorridors;
- fysieke rolstoelvalidatie van ingangen, deuren, corridors, liften en buitenovergangen;
- exacte huidige Campus Store-balie/ingang in R10;
- bevestiging of Document Centre nog een afzonderlijke publieke balie heeft;
- exact BRÛZE-kaartpunt en ingang bij Rengerslaan 1;
- actuele brondata voor horeca- en service-uren waar officiële pagina's geen volledig rooster geven;
- Supabase Leaked Password Protection inschakelen;
- privacyretentie, back-ups en optionele admin-MFA als organisatorische keuzes.

Deze punten blokkeren de software-release niet zolang CampusKompas de onzekerheid zichtbaar houdt en geen fysieke zekerheid verzint.
