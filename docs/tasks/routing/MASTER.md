Je werkt verder aan de bestaande CampusKompas-codebase.

Begin NIET opnieuw.

Inspecteer de huidige implementatie, database-integratie, zoekfunctie, routing engine, kaartlagen en Supabase-schema voordat je wijzigingen maakt.

Deze opdracht heeft één absolute prioriteit:

ELKE GELDIGE CAMPUSLOCATIE MOET ALS STARTPUNT ÉN BESTEMMING KUNNEN WORDEN GEBRUIKT

De gewenste hoofdflow is:

1. Student vult bestemming in.
2. Student vult locatie in waar hij nu is.
3. CampusKompas berekent de beste looproute.
4. Student ziet de route op de kaart en krijgt begrijpelijke route-instructies.

Voorbeeld:

Bestemming:
F3.025

Huidige locatie:
iShop

Resultaat:
de beste route van iShop naar F3.025.

Dit moet uiteindelijk gelden voor ALLE betrouwbare lokalen en voorzieningen in CampusKompas.

⸻

1. BELANGRIJKE BEVINDINGEN UIT DATABASE-AUDIT

Ga ervan uit dat de huidige productie-/Supabase-data ongeveer deze situatie heeft:

* 606 locaties totaal;
* 576 rooms;
* alle 576 rooms zijn aan een location gekoppeld;
* 217 locaties hebben momenteel geen node_id;
* ongeveer 215 room-locations missen een expliciete route-node;
* 382 locaties zitten via hun eigen node rechtstreeks in de hoofdcomponent van de routegraph;
* 7 locaties met een node zitten buiten de hoofdcomponent;
* de hoofdcomponent bevat ongeveer 460 route nodes;
* daarnaast bestaat minimaal één aparte routecomponent van ongeveer 54 nodes;
* er zijn nog enkele losse nodes;
* de huidige voorbeeldroute bevat:
    * bestemming F3.025 met geldige node;
    * iShop 0.26 zonder node_id.

Dit is een kernprobleem.

Een locatie die zoekbaar is maar niet routeerbaar is NIET acceptabel.

⸻

2. EINDDOEL

Na deze opdracht moet gelden:

Voor iedere publieke, goedgekeurde en bruikbare locatie:

* locatie is zoekbaar;
* locatie kan als bestemming worden gekozen;
* locatie kan als startpunt worden gekozen;
* locatie kan naar de routegraph worden vertaald;
* er kan een route naar/van worden berekend als fysiek bereikbaar;
* als directe endpoint-node ontbreekt wordt een veilige fallback gebruikt;
* de UI maakt geen onderscheid tussen “locatie met node” en “locatie zonder node”.

De student mag dit technische verschil nooit merken.

⸻

3. MAAK VAN “VAN” EN “NAAR” DEZELFDE UNIVERSELE SEARCH

Controleer de huidige implementatie.

De zoekfunctie voor:

“Huidige locatie / Van”

en:

“Bestemming / Naar”

moet dezelfde centrale location search gebruiken.

Niet twee aparte datasets.

Niet:

* één lijst alleen met QR/startpunten;
* één lijst met alle lokalen.

Beide velden moeten kunnen zoeken door:

* lokalen;
* voorzieningen;
* ingangen;
* bibliotheek;
* koffie;
* Student Info;
* iShop;
* Hidden Gems indien logisch;
* andere routeerbare POI’s.

Voorbeeld:

Van:
0.26

Naar:
F3.025

moet werken.

Maar ook:

Van:
F3.025

Naar:
Bibliotheek

moet werken.

En:

Van:
Bibliotheek

Naar:
iShop

moet werken.

⸻

4. MAAK EEN CENTRALE ENDPOINT RESOLVER

Bouw geen routinglogica verspreid over React components.

Maak één centrale functie/module.

Conceptueel bijvoorbeeld:

resolveLocationToRouteEndpoint(location)

Return bijvoorbeeld:

{
locationId,
nodeId,
resolutionType,
confidence,
distanceToNode,
floorId,
buildingId
}

Mogelijke resolution types:

direct
nearest-corridor
room-entrance
fallback
unavailable

Routing gebruikt ALTIJD deze resolver.

Start- en eindlocatie gebruiken exact dezelfde logica.

⸻

5. DIRECTE NODE HEEFT VOORRANG

Als een location een geldige node_id heeft:

gebruik die.

Maar valideer:

* node bestaat;
* node hoort bij juiste verdieping;
* node zit in de bruikbare routegraph;
* node heeft bereikbaarheid naar de hoofdgraph.

Als node_id verwijst naar:

* ontbrekende node;
* verkeerde verdieping;
* disconnected legacy graph;

behandel hem niet blind als geldig.

⸻

6. AUTOMATISCHE FALLBACK VOOR LOCATIES ZONDER NODE_ID

Dit is cruciaal.

Voor de 217 locaties zonder node_id:

de app mag NIET zeggen:

“Geen route beschikbaar”

zolang we de locatie betrouwbaar aan een nabijgelegen corridor kunnen koppelen.

Gebruik daarvoor beschikbare kaartcoördinaten / location x-y / room geometry.

Zoek de dichtstbijzijnde geschikte route-node OP DEZELFDE VERDIEPING.

Alleen nodes van bruikbare types:

* corridor;
* room_entrance;
* waypoint;
* eventueel connector afhankelijk van situatie.

Gebruik niet automatisch:

* trap-node als room endpoint;
* elevator node;
* node op andere verdieping;
* willekeurige disconnected node.

⸻

7. MAXIMUM FALLBACK-AFSTAND

Nearest-node mag niet blind de dichtstbijzijnde node kiezen.

Introduceer een redelijke maximumafstand.

Bijvoorbeeld in map-coordinate units afhankelijk van huidige kaartdata.

Als locatie absurd ver van iedere corridor-node staat:

markeer als niet betrouwbaar gekoppeld.

Doel:

voorkom routes die op een compleet verkeerde gang eindigen.

Documenteer de gekozen threshold.

⸻

8. NOG BETER: ROOM-ENTRANCE ENDPOINTS

Waar praktisch mogelijk:

maak voor lokalen een room entrance / endpoint.

Ideale structuur:

room/location
→ entrance node
→ corridor graph

In plaats van:

room
→ willekeurige dichtstbijzijnde corridor.

Als kaartdata voldoende informatie bevat:

genereer of koppel room entrance nodes.

Als dat automatisch niet betrouwbaar kan:

gebruik nearest corridor als tijdelijke fallback.

Zorg dat architectuur room entrance nodes ondersteunt.

⸻

9. BATCH FIX BESTAANDE LOCATIES

Maak een migration/data-fix script dat alle bestaande locations analyseert.

Per location:

1. heeft geldige node?
    → behouden.
2. heeft geen node?
    → zoek veilige endpoint kandidaat.
3. kandidaat voldoende betrouwbaar?
    → koppel location aan endpoint.
4. geen betrouwbare kandidaat?
    → markeer intern als routing_needs_review.

Voeg indien nuttig velden toe zoals:

routing_status

waarden:

direct
inferred
needs_review
unavailable

en bijvoorbeeld:

routing_node_source

waarden:

manual
import
nearest_node
admin

Gebruik migrations voor schemawijzigingen.

Maak reproduceerbare scripts voor datafixes.

Geen losse handmatige databasewijzigingen.

⸻

10. VERBIND DE ROUTEGRAPH

Analyseer alle route_nodes en route_edges als graph.

Vind connected components.

Er hoort uiteindelijk één hoofdcomponent te bestaan voor de normale campusrouting, inclusief:

* R8;
* R10;
* verdiepingen;
* verticale verbindingen;
* verbinding tussen gebouwen.

De database-audit heeft laten zien dat er naast de hoofdcomponent een component van ongeveer 54 nodes bestaat plus losse nodes.

Identificeer deze exact.

Classificeer ze:

* legacy duplicate;
* daadwerkelijk los deel gebouw;
* foutieve import;
* ontbrekende edge;
* ongebruikte testdata.

Los dit structureel op.

Verwijder geen data zonder te begrijpen wat het is.

Als oude legacy routegraph ongebruikt is:

archiveer/verwijder hem via migration als veilig.

Als verbinding ontbreekt:

voeg correcte edge toe als kaartdata dit ondersteunt.

⸻

11. GEEN ROUTE NAAR DISCONNECTED COMPONENT

Een location mag niet gekoppeld blijven aan een node die in een geïsoleerde legacy component zit als er een betere node in de hoofdgraph beschikbaar is.

Re-resolve deze locations.

De audit vond ongeveer 7 locations met nodes buiten de hoofdcomponent.

Fix ze.

Na implementatie:

alle normale publieke routeerbare locations moeten eindigen in dezelfde bruikbare routegraph.

⸻

12. GRAPH HEALTH CHECK

Maak een herbruikbare health-check script/test.

Bijvoorbeeld:

npm run routing:audit

Output:

* totaal locations;
* totaal route nodes;
* totaal route edges;
* locations direct mapped;
* locations inferred;
* locations needs_review;
* locations unavailable;
* aantal connected components;
* grootte hoofdcomponent;
* public locations buiten hoofdcomponent;
* rooms zonder route endpoint;
* invalid node references.

Doel:

dit probleem mag later nooit stilletjes terugkomen.

Laat command non-zero exit code geven als kritieke fouten bestaan.

⸻

13. DOELSTELLING DEKKING

Na de fix moet gelden:

100% van geldige publiek zoekbare lokalen heeft een route endpoint.

Voor overige publieke voorzieningen:

streef eveneens naar 100%.

Alleen een location die aantoonbaar niet betrouwbaar op de kaart kan worden geplaatst mag routing_needs_review zijn.

Zo’n location mag niet als volledig routeerbaar worden gepresenteerd.

Maar probeer bestaande kaartdata maximaal te benutten voordat je iets als unavailable markeert.

⸻

14. ROOM CODE SEARCH FIX

Controleer room normalization.

De database bevat roomcodes die bij slechte normalization ambigu worden.

Voorbeeld:

C1.001
D1.001
F1.001
G1.001
H1.001

mogen NIET allemaal normaliseren naar enkel:

1001

als daardoor zoneletters verloren gaan.

Canonical room normalization moet relevante letters behouden.

Voorbeelden:

F3.025
F3025
f 3 025

→ dezelfde F3.025-room.

Maar:

C1.001

en:

F1.001

zijn NIET hetzelfde lokaal.

Fix normalization zodat letters/zones niet verdwijnen.

⸻

15. DUPLICATE SEARCH RESULT ANALYSE

Er zijn momenteel veel groepen waarbij een te agressieve normalized code meerdere echte kamers samenvoegt.

Dit is gevaarlijk.

Een student die:

F1.001

zoekt moet direct F1.001 krijgen.

Niet:

C1.001
D1.001
F1.001
G1.001
H1.001

als ononderscheidbare matches.

Test room parsing uitgebreid.

⸻

16. CANONICAL ROOM FORMAT

Definieer duidelijke canonical vorm.

Bijvoorbeeld:

R10 zones:

F3.025

R8 kamers:

0.26
1.14

of de daadwerkelijke officiële notatie.

Sla canonical code centraal op.

Maak search tokens daarnaast tolerant.

Een search query mag punctuation/spaces negeren zonder semantische letters weg te gooien.

⸻

17. STARTLOCATIEFLOW

De primaire route-interface moet worden:

BESTEMMING

[ Zoek lokaal of plek ]

HUIDIGE LOCATIE

[ Waar ben je nu? ]

Daarna:

[ Toon route ]

Of een vergelijkbare UX.

Bestemming mag eventueel eerst worden gekozen zoals nu.

Maar gebruiker moet vervolgens een VOLLEDIGE startlocatie kunnen zoeken.

Niet alleen:

* hoofdingang;
* QR;
* huidige vooraf ingestelde locaties.

⸻

18. STARTLOCATIE SEARCH UX

Als student “ishop” invoert:

toon:

iShop
R8 · begane grond · 0.26

Als student “0.26” invoert:

toon iShop / 0.26 indien dit dezelfde locatie is.

Als student:

“bibliotheek”

typt:

toon correcte locatie.

Als student een lokaal typt:

toon lokaal.

Startlocatie en bestemming gebruiken dezelfde result cards.

⸻

19. SWAP BUTTON

Voeg tussen Van en Naar een knop toe:

⇅

Hiermee worden start en bestemming omgewisseld.

Dit is standaard navigatie-UX en zeer handig.

Behoud URL state correct.

⸻

20. ROUTE PAS BEREKENEN BIJ GELDIGE ENDPOINTS

Gebruik geen half-geldige route.

Flow:

location gekozen
→ resolve endpoint
→ endpoint validatie
→ route calculation.

Als endpoint echt niet beschikbaar is:

toon nette fout:

“Voor deze locatie kunnen we nog geen betrouwbare looproute tonen.”

Met optie:

“Bekijk locatie op kaart”

en:

“Klopt dit niet? Laat het weten”

Geen technical node_id errors tonen.

⸻

21. ROUTE DOOR MUREN VERBIEDEN

Nearest-node fallback betekent NIET dat je rechtstreeks een lijn van room coordinate naar willekeurige corridor mag tekenen alsof je door een muur loopt.

De routegraph blijft leidend.

Visualisatie:

* room marker;
* korte connector naar room entrance/corridor;
* vanaf daar normale graph route.

Als exacte deuropening onbekend is:

toon eventueel route tot dichtstbijzijnde gangpositie.

Gebruik tekst zoals:

“Bestemming bevindt zich bij deze gang”

alleen wanneer nodig.

⸻

22. ROUTE VISUALISATIE

De route moet één duidelijke lijn zijn.

Markeer:

START
BESTEMMING

Bij verdiepingwissels:

route wordt per floor getoond.

Routekaart moet automatisch naar relevante segment zoomen.

Niet de hele campus in één miniatuur tonen als gebruiker maar één gang nodig heeft.

⸻

23. ROUTE INSTRUCTIES UIT GRAPH GENEREREN

Gebruik graph metadata om eenvoudige stappen te maken.

Voorbeelden:

“Loop rechtdoor door de gang.”

“Ga rechts.”

“Neem de trap naar verdieping 2.”

“Neem de lift naar verdieping 3.”

“Ga naar Rengerslaan 10.”

“Je bestemming ligt aan de rechterzijde.”

Geen node IDs.

Geen technische routewoorden.

⸻

24. LOOPTIJD

Bereken looptijd alleen als routeafstand redelijk bruikbaar is.

Gebruik bijvoorbeeld een configureerbare loopsnelheid.

Maar geef geen schijnprecisie.

Beter:

“± 4 min”

dan:

“3 min 47 sec”.

Vertical transitions mogen extra tijd toevoegen.

Rolstoelroute kan eigen parameters gebruiken als nuttig.

⸻

25. TOEGANKELIJKE ROUTING — HUIDIG PROBLEEM

De audit laat zien dat maar een klein deel van corridor edges accessible=true heeft terwijl honderden andere corridor edges accessible=false en tegelijk accessibility_status=unverified zijn.

Dit is waarschijnlijk semantisch fout.

false mag NIET hetzelfde betekenen als:

“nog niet gecontroleerd”.

Maak onderscheid tussen:

accessible = true
accessible = false
accessible = unknown

Als schema boolean is:

pas dit aan naar nullable boolean of gebruik accessibility_status als echte bron.

Bijvoorbeeld:

accessibility_status:
verified_accessible
verified_inaccessible
unverified

⸻

26. ROLSTOELROUTE MAG ONBEKENDE CORRIDORS NIET AUTOMATISCH ALS ONTOEGANKELIJK ZIEN

Normale horizontale gangen zijn vermoedelijk routeerbaar, maar mogen niet zonder bewijs als officieel toegankelijk worden geclaimd.

Maak logica expliciet.

Trappen:

altijd uitgesloten van wheelchair route.

Lift:

alleen gebruiken als niet bekend is dat hij ontoegankelijk is.

Onbekende corridor:

kan technisch worden gebruikt als “niet-gevalideerde toegankelijke route” als dat productmatig verantwoord is, maar communiceer dan:

“Toegankelijkheid van delen van deze route is nog niet volledig geverifieerd.”

Bouw semantiek netjes.

⸻

27. ACCESSIBILITY AUDIT

Maak vergelijkbaar command:

npm run routing:audit-accessibility

Rapporteer:

* corridors verified accessible;
* corridors unknown;
* corridors verified inaccessible;
* lifts;
* stairs;
* public locations met mogelijke wheelchair route;
* public locations zonder wheelchair route.

⸻

28. INTER-BUILDING ROUTING

Controleer dat R8 ↔ R10 daadwerkelijk onderdeel is van de hoofdcomponent.

De database bevat outdoor/interbuilding edges.

Test expliciet:

R8 locatie
→ R10 locatie

en omgekeerd.

Zorg dat een route niet faalt omdat gebouwen als aparte graphs behandeld worden.

⸻

29. MULTI-FLOOR TESTS

Test:

R8 verdieping 0
→ R8 verdieping 3

R10 verdieping 0
→ R10 verdieping 3

R8 verdieping 2
→ R10 verdieping 3

met:

normale route

en:

toegankelijke route.

⸻

30. ISHOP → F3.025 MOET EEN VERPLICHTE REGRESSIETEST WORDEN

De huidige live URL gebruikt ongeveer:

?from=loc-ishop&to=F3025

De database heeft:

iShop
R8
0.26
momenteel zonder expliciete node_id

en:

F3.025
R10
verdieping 3
met geldige node.

Na deze fix moet deze route betrouwbaar werken.

Maak dit een expliciete integration/E2E test.

Controleer ook oude loc-ishop deep links.

Backward compatibility behouden als mogelijk.

⸻

31. DEEP LINKS NORMALISEREN

Gebruik liefst stabiele location IDs.

Als legacy URL gebruikt:

loc-ishop

maar canonical database ID:

ishop

maak compatibility mapping.

Nieuwe gedeelde URLs moeten canonical IDs gebruiken.

Oude URLs mogen niet ineens stukgaan.

⸻

32. HIDDEN GEM BRÛZE

Er is nu één goedgekeurde Hidden Gem:

BRÛZE / Bruze.

Deze is al goedgekeurd.

Controleer de koppeling.

De inzending is momenteel gekoppeld aan:

R10_MAIN

Hoofdingang R10.

Dit is niet nauwkeurig genoeg.

Maak een eigen locatie voor Café BRÛZE als de daadwerkelijke positie betrouwbaar vastgesteld kan worden.

Gebruik actuele betrouwbare broninformatie.

De officiële context geeft aan dat BRÛZE bij Rengerslaan 10 / bij de bushalte zit.

Koppel de Hidden Gem daarna aan de echte BRÛZE location.

NIET aan alleen de hoofdingang als een specifiekere locatie betrouwbaar beschikbaar is.

⸻

33. BRÛZE MOET OOK GEWOON ZOEKBAAR WORDEN

Voeg indien betrouwbaar:

BRÛZE

toe als normale campus location/POI.

Categorie bijvoorbeeld:

coffee / food / cafe.

Hidden Gem blijft een communitylaag bovenop die location.

Dus:

Location:
Café BRÛZE

Hidden Gem:
studententip over BRÛZE

De gem beschrijft de plek.

De locatie bepaalt de kaartpositie/routing.

Dit zijn twee verschillende concepten.

⸻

34. HIDDEN GEM ROUTE HIERHEEN

Wanneer gebruiker een gem opent:

“Bekijk op kaart”

en:

“Route hierheen”

moeten naar de gekoppelde echte location gaan.

Niet naar een generieke building entrance.

⸻

35. GEEN FAKE LOCATIES

Voor automatisch endpoint-koppelen:

gebruik alleen bestaande kaart/location coordinates.

Verzin geen kamerpositie.

Als locatie geen betrouwbare coordinate heeft:

markeer routing_needs_review.

Maar check eerst of position data via room/floor map data beschikbaar is.

⸻

36. ADMIN ROUTING STATUS

Breid admin uit zodat locatie duidelijk toont:

Route:
✓ Direct gekoppeld

of:

~ Automatisch gekoppeld

of:

! Controle nodig

Admin moet kunnen:

* endpoint-node handmatig kiezen;
* inferred endpoint vervangen;
* locatie als verified markeren.

⸻

37. ADMIN GRAPH HEALTH

Voeg een kleine routing health sectie toe.

Bijvoorbeeld:

Routing coverage
98.7%

Locations:
606

Direct:
389

Inferred:
210

Needs review:
7

Disconnected:
0

Doelstelling:

praktisch 100%.

⸻

38. SEARCH EN ROUTING MOETEN DATA-DRIVEN BLIJVEN

Hardcode geen lijst van 606 locaties in React.

Gebruik centrale data layer.

Als Supabase beschikbaar is:

gebruik actuele location data.

Fallback local seed mag alleen voor development/read-only fallback waar bestaande architectuur dit ondersteunt.

Geen twee verschillende waarheden creëren.

⸻

39. PERFORMANCE

606 locaties is klein genoeg voor snelle search.

Maar bouw netjes:

* normalized search index;
* memoization waar logisch;
* geen honderden losse database calls;
* laad relevante routegraph efficiënt.

Route calculation moet vrijwel instant voelen.

⸻

40. TEST ALLE LOCATIES AUTOMATISCH

Schrijf een test/script dat iedere public approved location doorloopt.

Voor elke location:

resolveLocationToRouteEndpoint(location)

Assertions:

* returns endpoint;
* endpoint exists;
* endpoint floor/building logisch;
* endpoint belongs to main routegraph.

Daarna eventueel sample routing:

hoofdingang/main anchor
→ location

voor iedere location.

Rapporteer alle failures.

Dit is zeer belangrijk.

⸻

41. PAIRWISE ROUTING HOEFT NIET 606² VOLLEDIG TE TESTEN

Dat zou onnodig zijn.

Als alle endpoints in dezelfde connected component zitten, volgt connectivity theoretisch.

Test daarom:

* iedere location endpoint zit in main component;
* representative routes per gebouw/floor;
* random sample pairs;
* critical known pairs.

Voeg deterministic seed toe voor random tests.

⸻

42. KRITIEKE TESTPAIRS

Test minimaal:

iShop → F3.025
F3.025 → iShop

Bibliotheek → F3.025
F3.025 → Bibliotheek

R8 hoofdingang → hoog R8 lokaal
R10 hoofdingang → hoog R10 lokaal

R8 lokaal → R10 lokaal
R10 lokaal → R8 lokaal

same-floor room → room
multi-floor room → room

normale route
toegankelijke route.

⸻

43. UI PRIORITEIT

Na technische routing fix:

pas UX zo aan dat hoofdflow direct duidelijk is.

De kerninterface moet uiteindelijk ongeveer voelen als:

Waar wil je heen?
[ F3.025 ]

Waar ben je nu?
[ iShop ]

⇅

[ Toon route ]

Niet letterlijk verplicht deze layout als bestaande UX beter is.

Maar functioneel moet dit de primaire ervaring zijn.

⸻

44. STARTPUNT VIA QR BLIJFT BESTAAN

QR is een shortcut.

Als gebruiker een QR opent:

Van:
automatisch ingevuld

Naar:
leeg zoekveld met focus.

Bijvoorbeeld:

Je bent bij:
R10 Hoofdingang

Waar wil je heen?

[ Zoek lokaal of plek ]

Maar QR mag NIET de enige goede manier zijn om een startpunt te kiezen.

⸻

45. “KIES OP KAART”

Als gebruiker startpunt op kaart kiest:

selecteer alleen geldige locations/endpoints waar mogelijk.

Als vrije map coordinate toegestaan is:

resolve die coordinate naar dichtstbijzijnde geldige graph node op die floor.

Laat duidelijk zien:

“Startpunt op kaart”

in plaats van te claimen dat de app GPS-locatie kent.

⸻

46. CURRENT LOCATION TERMINOLOGIE

Gebruik in UI:

“Huidige locatie”

maar claim geen automatische detectie.

Als handmatig gekozen:

“Startpunt”

Als QR:

“Je bent hier”

Als browser GPS alleen campusniveau detecteert:

gebruik dat nooit om exacte indoor positie te verzinnen.

⸻

47. NO ROUTE STATE

Als route werkelijk niet bestaat:

toon:

“Voor deze combinatie kunnen we nog geen betrouwbare route maken.”

Daaronder:

* Bekijk bestemming
* Kies ander startpunt
* Meld probleem

Log deze failure als analytics/debug event.

⸻

48. ROUTING DEBUG MODE

Maak development-only debug mogelijkheid.

Bijvoorbeeld:

?debugRouting=1

Toon:

* location id;
* resolved node;
* resolution type;
* graph component;
* route nodes;
* edge types.

Nooit standaard zichtbaar voor studenten.

Heel handig voor verdere kaartvalidatie.

⸻

49. DATABASE INTEGRITY CONSTRAINTS

Waar mogelijk:

* node references moeten naar bestaande route nodes verwijzen;
* building/floor consistency valideren;
* canonical room codes moeten correct geïndexeerd zijn;
* duplicate canonical room codes voorkomen binnen dezelfde geldige namespace.

Gebruik migrations.

⸻

50. MIGRATIONS

Alle database schemawijzigingen via Supabase migrations.

Bij data backfills:

maak reproduceerbare data migration/script.

Geen directe productiehandmatige wijzigingen als structurele oplossing.

⸻

51. DOCUMENTATIE

Update README / docs met:

Routing architecture

Location
→ endpoint resolution
→ graph
→ shortest path
→ instructions
→ map rendering

Leg uit:

* direct endpoint;
* inferred endpoint;
* verification;
* connected components;
* accessibility semantics;
* routing audit command.

⸻

52. BELANGRIJKE PRODUCTREGEL

Een locatie is pas “compleet” wanneer deze:

* gevonden kan worden;
* op kaart kan worden getoond;
* als routebestemming kan worden gebruikt;
* als routestart kan worden gebruikt.

Pas deze definitie overal toe.

⸻

53. NIET DOEN

Niet:

* simpel alle ontbrekende node_id waarden naar één ingang zetten;
* alle kamers op dezelfde corridor-node plaatsen;
* locatieletters weg-normaliseren;
* inaccessible=false gebruiken voor unknown;
* disconnected nodes negeren;
* fake routing success tonen;
* routing door muren visualiseren;
* errors verbergen met mock data.

Los oorzaak op.

⸻

54. DEFINITION OF DONE

Deze opdracht is pas klaar wanneer:

* alle 576 betrouwbare rooms een route endpoint hebben of expliciet als onbetrouwbaar gemarkeerd zijn;
* praktisch alle 606 publieke locaties routeerbaar zijn;
* alle normale routeerbare locations in één connected graph zitten;
* geen location naar legacy disconnected graph wijst;
* Van-zoekfunctie alle relevante locations ondersteunt;
* Naar-zoekfunctie alle relevante locations ondersteunt;
* Van en Naar dezelfde centrale search/resolution gebruiken;
* swap werkt;
* iShop → F3.025 werkt;
* F3.025 → iShop werkt;
* R8 → R10 werkt;
* R10 → R8 werkt;
* multi-floor werkt;
* toegankelijkheidssemantiek is gecorrigeerd;
* Brûze aan een specifieke correcte location gekoppeld is indien betrouwbaar mogelijk;
* room normalization letters/zones behoudt;
* deep links blijven werken;
* automated routing audit bestaat;
* test suite slaagt;
* lint slaagt;
* typecheck slaagt;
* production build slaagt.

⸻

55. RAPPORTAGE AAN HET EINDE

Rapporteer exact:

1. hoeveel locations totaal;
2. hoeveel directe endpoint mappings;
3. hoeveel inferred endpoint mappings;
4. hoeveel needs_review;
5. hoeveel niet routeerbaar;
6. hoeveel connected graph components vóór en na fix;
7. hoeveel locaties buiten main component vóór en na;
8. routing coverage percentage;
9. accessibility coverage;
10. welke room normalization bugs opgelost zijn;
11. resultaat iShop → F3.025;
12. resultaat R8 → R10;
13. wat met BRÛZE is gedaan;
14. tests;
15. lint;
16. typecheck;
17. production build.

Doel:

CampusKompas moet na deze wijziging daadwerkelijk een universele indoor A→B navigator worden voor de beschikbare NHL Stenden-campusdata.

Begin nu met inspecteren en voer daarna de volledige implementatie uit. Stop niet na het schrijven van een plan.
