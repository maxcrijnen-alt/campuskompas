# Security verification

## Toegangsmodel

- Alle exposed tabellen hebben RLS. Anonieme clients lezen alleen publieke campusdata, gepubliceerde tips en approved Hidden Gems.
- Publieke clients hebben geen directe mutatiepolicy. Schrijfacties lopen via begrensde serverhandlers en databasefuncties.
- Adminpolicies gebruiken `private.is_admin()` met een actuele rij in `admin_profiles`; `user_metadata` verleent nooit rechten.
- Nieuwe Auth-users vereisen een eenmalige, vijf minuten geldige registration permit. Publieke self-registration blijft gesloten.
- Iedere admin-API-call gebruikt `auth.getUser()` en controleert daarna opnieuw `admin_profiles`.

## Password reset

`/admin` geeft altijd dezelfde resetreactie, ook voor een onbekend of niet-adminadres. De handler gebruikt een device-rate-limit van drie aanvragen per uur en verstuurt alleen voor een bestaande Auth-user met adminprofiel. De callback gaat naar `/admin/reset-password`.

De recoverypagina houdt het access token alleen in React-state en verwijdert de URL-fragment direct. De updatehandler valideert het token bij Supabase, controleert adminstatus en vereist 12–72 tekens met kleine letter, hoofdletter, cijfer en symbool. Public registration blijft onafhankelijk hiervan dicht.

## Secrets en servergateway

- Geen serversecret staat in clientprops of een `NEXT_PUBLIC_`-variabele.
- `.env*`, `.vercel`, testresultaten, traces, screenshots en lokale toegangsbestanden worden genegeerd.
- De gatewaycredential is willekeurig; alleen de SHA-256-hash staat in `server_credentials`.
- De Edge Function verwijdert binnenkomende Authorization-headers, controleert haar eigen credential en accepteert alleen allowlisted backendpaden.
- Een Supabase secret/service-role key mag uitsluitend in een lokale of Vercel secret store staan.

## Storage en publieke writes

- `gem-photos` is privé. Bestandsnamen zijn willekeurig; maximaal 3 MB; alleen gevalideerde JPEG, PNG en WebP.
- Pending afbeeldingen vereisen adminautorisatie en worden niet via de publieke fotohandler geleverd.
- API-writes valideren origin, requestgrootte en payload. Databasequeries zijn geparametriseerd.
- Rate limits en votes zijn transactioneel. `(gem_id, device_hash)` voorkomt dubbele stemmen per device-ID.

## Advisor-beoordeling

De drie `RLS enabled, no policy`-meldingen zijn bewust:

- `private.rate_limits` wordt uitsluitend door security-definer/serverlogica gebruikt;
- `private.registration_permits` wordt uitsluitend voor gecontroleerde provisioning gebruikt;
- `public.server_credentials` bevat alleen de gatewayhash en is deny-all voor API-rollen.

Een permissive policy toevoegen zou deze tabellen minder veilig maken.

De multiple-permissive-policymeldingen ontstaan doordat authenticated beheerders zowel een publieke SELECT-policy als `admin_all` kunnen matchen. De voorwaarden gebruiken gecachte `(select private.is_admin())`-checks en de dataset is klein. Het ombouwen naar aparte anon/authenticated leespolicies en drie mutatiepolicies per tabel zou meer policy-oppervlak en migratierisico toevoegen zonder gemeten bottleneck; daarom blijven de correcte semantics behouden.

De negen unused-indexmeldingen zijn nog geen verwijderbewijs. De database is jong en klein. De indexes ondersteunen foreign keys, floor/room lookup of toekomstige adminqueues en moderatie. Herbeoordeel met voldoende representatieve productiebelasting.

## Handmatige Supabase-instelling

Leaked Password Protection staat nog uit en is volgens Supabase beschikbaar op Pro en hoger. Handmatige actie vereist: open **Supabase Dashboard → Authentication → Sign In / Providers → Email → Password security**, schakel **Prevent use of leaked passwords** in en sla op. Controleer daarna de Security Advisor opnieuw.

Remediation: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

## Operationele grenzen

Direct pushen naar GitHub `main` zonder verplichte PR, approval, branch protection of required checks is een bewuste keuze van de eigenaar en geen applicatiebeveiligingsfout. Vóór institutionele uitrol blijven admin-MFA, back-ups, retentie, privacyafspraken en fysieke campusvalidatie operationele beslissingen.

De kaart is geen evacuatie-instrument of toegankelijkheidscertificaat. Onbekende accessibilitydata mag niet als accessible of inaccessible worden gelabeld.
