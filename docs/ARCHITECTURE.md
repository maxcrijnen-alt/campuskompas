# CampusKompas-architectuur

CampusKompas is een Next.js 16 App Router-app met strict TypeScript. Vercel host de publieke applicatie; Supabase levert PostgreSQL, Auth en private Storage. Studenten gebruiken de app anoniem. Alleen vooraf ingerichte beheerders kunnen `/admin` openen.

## Datastroom

`lib/server/data.ts` leest de publieke campustabellen gelijktijdig via de publishable Supabase-client en RLS. Tabellen met meer dan 500 records worden gepagineerd. De server geeft één consistente `CampusData`-snapshot aan `CampusApp`; zoeken en routeberekening verlopen daarna lokaal zonder extra request per resultaat of route. Een geconfigureerde databasefout geeft een expliciete unavailable-state en schakelt niet over op mockdata.

De huidige dataset is begrensd: 606 locaties, 514 nodes en 535 edges. Deze snapshotarchitectuur voorkomt N+1-verkeer en maakt zoeken en Dijkstra-berekening direct. Bij substantiële groei moet de payload opnieuw worden gemeten en eventueel per gebouw/floor of via een versioned dataset-endpoint worden geladen.

Hidden Gems worden afzonderlijk via `/api/gems` geladen, zodat moderatiewijzigingen de campusgraph niet beïnvloeden. Adminpagina's gebruiken gerichte serverhandlers en laden alleen de tabellen die hun scherm nodig heeft.

## Location → endpoint → graph → kaart

1. `lib/campus/search.ts` normaliseert een naam, alias, legacy-ID of kamercode en geeft expliciet `resolved`, `ambiguous` of `missing` terug.
2. `lib/routing/endpoints.ts` is de enige centrale resolver voor zowel start als bestemming. Hij valideert nodebestaan, gebouw, verdieping en graphcomponent.
3. `lib/routing/graph.ts` berekent het kortste pad over opgeslagen, bidirectionele of directionele edges.
4. `lib/routing/experience.ts` verdeelt het pad in floor-stages en transitions en berekent een conservatieve relatieve looptijd.
5. `lib/routing/instructions.ts` maakt mensentaal uit edge- en floor-metadata.
6. De kaart rendert alleen opgeslagen `map_path`-segmenten op de bijbehorende officiële floor image. Een ontbrekend pad levert een no-route-state; er wordt geen rechte lijn door muren getekend.

Directe endpoints zijn databasekoppelingen. De huidige 606 goedgekeurde locaties gebruiken allemaal een directe mapping. De resolver ondersteunt gecontroleerde fallbacktypes, maar productie gebruikt momenteel 0 inferred, 0 needs-review en 0 unavailable endpoints.

## Search en deep links

`Van` en `Naar` delen dezelfde endpoint-gevalideerde locatie-universe. De roomnormalisatie bewaart letters, zones en puntstructuur. `F3.025`, `F3025` en `f 3 025` verwijzen naar dezelfde locatie. `C0.102` in R10 en `C0.1.02` in R8 blijven verschillend; de compacte vorm `C0102` blijft bewust ambigu zonder gebouwcontext.

Canonical locatie-ID's staan in URL-parameters. Legacy iShop-links, QR-startpunten, route-stage en geldige oude links blijven ondersteund. Een normale sessie zonder context start expliciet op `R8-0`; deep links bepalen altijd hun eigen gebouw en verdieping.

## Accessibility

Nodes en edges hebben los van de gewone verificatiestatus een accessibility-status. `accessibility_status=unverified` betekent onbekend, ongeacht de legacy boolean `accessible`.

Wheelchair-routing:

- verbiedt iedere `stairs`-edge;
- verbiedt verified-inaccessible nodes en edges;
- accepteert onbekende delen alleen als kandidaat en toont daarbij een waarschuwing;
- accepteert een verdiepingsovergang binnen één gebouw alleen via een expliciete `elevator`-edge;
- accepteert een gebouwovergang alleen via een expliciete `outdoor`-edge.

Een liftinstructie komt uit de echte transition-edge, bijvoorbeeld “Neem de lift naar verdieping 3.” R8 heeft in de huidige graph een samenhangende liftkandidaat. De R10-liftchain is niet volledig verbonden met de relevante endpointcorridors; de app meldt daar dat geen betrouwbare trapvrije route kan worden bevestigd.

## Openingstijden

`lib/campus/hours.ts` is de centrale Europe/Amsterdam-engine voor weekroosters, meerdere periodes, gesloten dagen, datumuitzonderingen, volgende opening en DST. Een exception overschrijft de normale weekdag. Alleen semantisch relevante categorieën krijgen een compact hours-blok.

`opening_hours` bewaart type, status, bronsoort, bronbeschrijving, optionele HTTPS-URL, verificatiedatum, reviewhorizon en tweetalige notities. `official_web` vereist een URL. `manual_admin` kan niet als verified worden opgeslagen. `admin_save_opening_hours_link` slaat het record en de gekozen locatie/Hidden Gem atomair op.

## Hidden Gems

Een inzending kan verwijzen naar een bestaande canonical locatie of een voorstel bevatten met context `r8`, `r10`, `campus_outdoor` of `other`. Externe voorstellen krijgen geen fictief gebouw, verdieping, route-node, coördinaten of routeactie. Na moderatie kan een beheerder het voorstel publiceren zonder route of later vervangen door één gevalideerde canonical locatie.

Foto's krijgen willekeurige namen in de private bucket `gem-photos`. Pending foto's zijn alleen voor moderators beschikbaar; publieke levering werkt pas na goedkeuring. Likes gebruiken een gehashte device-ID en een unieke databaseconstraint.

## Auth en serverrechten

De browser gebruikt uitsluitend de publishable key. Publieke writes gaan via same-origin, payload-begrensde handlers met Zod-validatie en transactionele rate limiting. Privileged serverwerk gebruikt een secret key of de allowlisted Supabase Edge Function-gateway.

Iedere adminrequest valideert de Supabase access token opnieuw met `auth.getUser()` en controleert daarna `admin_profiles`. Publieke signup vereist een kort geldige permit en staat normaal dicht. Password reset is generiek, rate-limited en alleen voor een provisioned admin; recoverytokens blijven in het browsergeheugen en worden direct uit de URL verwijderd.

## Reproduceerbaarheid en deployment

Alle structurele databasewijzigingen staan in `supabase/migrations/`. De lokale versies en namen moeten exact overeenkomen met `supabase_migrations.schema_migrations`; toegepaste migrations worden nooit opnieuw uitgevoerd om history cosmetisch te veranderen.

GitHub `main` bouwt automatisch naar het Vercel-project `campuskompas`. `package.json` en `.node-version` pinnen Node 24; `packageManager` en `vercel.json` pinnen pnpm 11.19.0. De productiealias is `campuskompas.vercel.app` en de Functions-regio is `fra1`.
