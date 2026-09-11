import type {
  CampusData,
  Category,
  Location,
  RouteEdge,
  RouteNode,
  Text,
} from './types';
const bi = (nl: string, en = nl): Text => ({ nl, en });
const checked = '2026-09-10';
const sources = [
  {
    id: 'campus',
    title: 'NHL Stenden · Leeuwarden',
    url: 'https://www.nhlstenden.com/locaties/leeuwarden',
    verified_at: checked,
    verification_status: 'verified' as const,
  },
  {
    id: 'catering',
    title: 'NHL Stenden · Catering',
    url: 'https://www.nhlstenden.com/locaties/leeuwarden/catering',
    verified_at: checked,
    verification_status: 'verified' as const,
  },
  {
    id: 'library',
    title: 'NHL Stenden · Bibliotheek',
    url: 'https://www.nhlstenden.com/bibliotheek/over-de-bibliotheek/openingstijden',
    verified_at: checked,
    verification_status: 'verified' as const,
  },
  {
    id: 'guide',
    title: 'Campus guide No. 13 · oudere gids / older guide',
    url: 'https://etenjournal.com/wp-content/uploads/2024/04/map-nhl-stenden.pdf',
    verified_at: checked,
    verification_status: 'needs_review' as const,
  },
];
const categoryRows = [
  ['room', 'Lokaal', 'Room', 'door', 'lokaal classroom room'],
  ['library', 'Bibliotheek', 'Library', 'book', 'bieb library bibliotheek'],
  ['coffee', 'Koffie', 'Coffee', 'coffee', 'coffee koffie'],
  ['food', 'Eten', 'Food', 'food', 'food eten lunch'],
  ['canteen', 'Kantine', 'Canteen', 'food', 'kantine canteen'],
  ['cafe', 'Café', 'Café', 'coffee', 'cafe café'],
  ['study', 'Studieplek', 'Study spot', 'book', 'studeren study'],
  ['quiet', 'Stille studieplek', 'Quiet study', 'book', 'stil quiet'],
  ['group', 'Groepsplek', 'Group work', 'users', 'groep group'],
  ['info', 'Student Info', 'Student Info', 'info', 'student info help'],
  ['reception', 'Receptie', 'Reception', 'info', 'receptie reception'],
  ['service', 'Service Desk', 'Service Desk', 'info', 'ict service desk'],
  ['printer', 'Printers', 'Printers', 'printer', 'printer print'],
  ['toilet', 'Toiletten', 'Toilets', 'access', 'wc toilet restroom'],
  [
    'accessible-toilet',
    'Toegankelijk toilet',
    'Accessible toilet',
    'access',
    'rolstoel accessible toilet',
  ],
  ['elevator', 'Liften', 'Lifts', 'access', 'lift elevator'],
  ['stairs', 'Trappen', 'Stairs', 'stairs', 'trap stairs'],
  ['first-aid', 'EHBO', 'First aid', 'heart', 'ehbo first aid'],
  ['bike', 'Fietsenstalling', 'Bicycle parking', 'bike', 'fiets bike'],
  ['parking', 'Parkeren', 'Parking', 'car', 'parking parkeren'],
  ['entrance', 'Hoofdingang', 'Main entrance', 'door', 'ingang entrance'],
  ['auditorium', 'Auditorium', 'Auditorium', 'users', 'auditorium'],
  [
    'document',
    'Documentcentrum',
    'Document Centre',
    'printer',
    'documentcentrum document',
  ],
  ['outside', 'Buiten & rust', 'Outside & rest', 'leaf', 'buiten outside'],
];
const categories: Category[] = categoryRows.map(
  ([id, nl, en, icon, aliases]) => ({
    id,
    name: bi(nl, en),
    icon,
    aliases: aliases.split(' '),
    hours_relevant: [
      'library',
      'coffee',
      'food',
      'canteen',
      'cafe',
      'info',
      'reception',
      'service',
      'entrance',
      'document',
    ].includes(id),
  }),
);
const buildings = [
  {
    id: 'R8',
    name: 'Rengerslaan 8',
    address: 'Rengerslaan 8, 8917 DD Leeuwarden',
  },
  {
    id: 'R10',
    name: 'Rengerslaan 10',
    address: 'Rengerslaan 10, 8917 DD Leeuwarden',
  },
];
const floors: CampusData['floors'] = buildings.flatMap((b) =>
  [0, 1, 2, 3].map((level) => ({
    id: `${b.id}-${level}`,
    building_id: b.id,
    level,
    verification_status: 'unverified',
    geometry: [
      { x: 90, y: 100, width: 620, height: 350, kind: 'hall' },
      { x: 110, y: 120, width: 150, height: 110, kind: 'room' },
      { x: 280, y: 120, width: 160, height: 110, kind: 'room' },
      { x: 460, y: 120, width: 110, height: 110, kind: 'room' },
      { x: 590, y: 120, width: 100, height: 110, kind: 'room' },
      { x: 110, y: 330, width: 150, height: 100, kind: 'room' },
      { x: 280, y: 330, width: 60, height: 100, kind: 'room' },
      { x: 460, y: 330, width: 110, height: 100, kind: 'room' },
      { x: 590, y: 330, width: 100, height: 100, kind: 'room' },
      { x: 335, y: 450, width: 80, height: 65, kind: 'hall' },
    ],
  })),
);
const nodes: RouteNode[] = [];
const edges: RouteEdge[] = [];
const edge = (
  from: string,
  to: string,
  weight: number,
  type: RouteEdge['edge_type'] = 'corridor',
) =>
  edges.push({
    id: `${from}--${to}`,
    from_node_id: from,
    to_node_id: to,
    weight,
    edge_type: type,
    accessible: type !== 'stairs',
    accessibility_status: 'unverified',
    verification_status: 'unverified',
    bidirectional: true,
  });
for (const f of floors) {
  for (const [suffix, x, y, type] of [
    ['west', 180, 280, 'corridor'],
    ['centre', 375, 280, 'corridor'],
    ['east', 620, 280, 'corridor'],
    ['lift', 675, 280, 'elevator'],
    ['stairs', 125, 280, 'staircase'],
    ['entry', 375, 495, 'main_entrance'],
  ] as const) {
    if (suffix === 'entry' && f.level !== 0) continue;
    nodes.push({
      id: `${f.id}-${suffix}`,
      building_id: f.building_id,
      floor_id: f.id,
      x,
      y,
      node_type: type,
      label: bi(
        suffix === 'lift'
          ? 'Lift'
          : suffix === 'stairs'
            ? 'Trap'
            : suffix === 'entry'
              ? 'Ingang'
              : 'Gang',
        suffix === 'lift'
          ? 'Lift'
          : suffix === 'stairs'
            ? 'Stairs'
            : suffix === 'entry'
              ? 'Entrance'
              : 'Corridor',
      ),
      accessible: suffix !== 'stairs',
      accessibility_status: 'unverified',
      verification_status: 'unverified',
    });
  }
  edge(`${f.id}-west`, `${f.id}-centre`, 195);
  edge(`${f.id}-centre`, `${f.id}-east`, 245);
  edge(`${f.id}-east`, `${f.id}-lift`, 55);
  edge(`${f.id}-west`, `${f.id}-stairs`, 55);
  if (f.level === 0) edge(`${f.id}-centre`, `${f.id}-entry`, 215);
  if (f.level > 0) {
    edge(
      `${f.id}-lift`,
      `${f.building_id}-${f.level - 1}-lift`,
      180,
      'elevator',
    );
    edge(
      `${f.id}-stairs`,
      `${f.building_id}-${f.level - 1}-stairs`,
      110,
      'stairs',
    );
  }
}
edge('R8-0-entry', 'R10-0-entry', 500, 'outdoor');
type Entry = [
  string,
  string,
  string,
  string,
  string,
  number,
  number,
  string,
  string,
  string?,
];
const rows: Entry[] = [
  [
    'library',
    'Bibliotheek',
    'Library',
    'R8',
    'library',
    0,
    180,
    'library',
    'Boeken, onderzoek en ruimte om te studeren.',
    '0.25',
  ],
  [
    'cafe-if',
    'Café IF',
    'Café IF',
    'R8',
    'cafe',
    0,
    375,
    'catering',
    'Café bij de ingang, tegenover de bibliotheek.',
  ],
  [
    'central-brew',
    'Central Brew',
    'Central Brew',
    'R8',
    'coffee',
    0,
    620,
    'catering',
    'Koffie in de centrale hal.',
  ],
  [
    'canteen',
    'Canteen',
    'Canteen',
    'R8',
    'canteen',
    0,
    180,
    'catering',
    'Verschillende foodcounters op campus.',
  ],
  [
    'student-info',
    'Student Info',
    'Student Info',
    'R8',
    'info',
    0,
    375,
    'guide',
    'Hulp bij praktische vragen over je studie.',
    '0.44',
  ],
  [
    'ishop',
    'iShop (voormalig)',
    'iShop (former)',
    'R8',
    'service',
    0,
    620,
    'guide',
    'Historisch routepunt op R8. De actuele Campus Store is samengevoegd met het Document Center op R10; de exacte actuele kaartpositie moet nog worden bevestigd.',
    '0.26',
  ],
  [
    'brandstof',
    'Café Brandstof',
    'Café Brandstof',
    'R10',
    'cafe',
    0,
    180,
    'catering',
    'Een plek voor een drankje of lunch.',
  ],
  [
    'espresso',
    'Espresso Bar',
    'Espresso Bar',
    'R10',
    'coffee',
    0,
    375,
    'catering',
    'Koffie en thee in de centrale hal.',
  ],
  [
    'food-court',
    'Food Court',
    'Food Court',
    'R10',
    'food',
    0,
    620,
    'catering',
    'Maaltijden en zitplaatsen rond de kuil.',
  ],
  [
    'service-desk',
    'Service Desk',
    'Service Desk',
    'R10',
    'service',
    0,
    180,
    'guide',
    'Hulp bij ICT en faciliteiten in de centrale hal.',
  ],
  [
    'document-centre',
    'Documentcentrum (voormalig)',
    'Document Centre (former)',
    'R10',
    'document',
    0,
    375,
    'guide',
    'Historisch routepunt. Het Document Center is samengevoegd in de Campus Store op R10; de actuele baliepositie moet nog worden bevestigd.',
    'E0.006',
  ],
  [
    'F3025',
    'F3.025',
    'F3.025',
    'R10',
    'room',
    3,
    620,
    'guide',
    'Zone F, derde verdieping. Nummeringsvoorbeeld in de campusgids; actuele lokaalstatus nog te bevestigen.',
    'F3.025',
  ],
];
const english: Record<string, string> = {
  library: 'Books, research and space to study.',
  'cafe-if': 'Café near the entrance, opposite the library.',
  'central-brew': 'Coffee in the central hall.',
  canteen: 'A selection of food counters on campus.',
  'student-info': 'Help with practical questions about your studies.',
  ishop:
    'Historic R8 route point. The current Campus Store was merged with the Document Center at R10; its exact current map position still needs confirmation.',
  brandstof: 'A place for a drink or lunch.',
  espresso: 'Coffee and tea in the central hall.',
  'food-court': 'Meals and seating around the central pit.',
  'service-desk': 'IT and facilities help in the central hall.',
  'document-centre':
    'Historic route point. The Document Center was merged into the Campus Store at R10; the current desk position still needs confirmation.',
  F3025:
    'Zone F, third floor. Numbering example in the campus guide; current room status requires confirmation.',
};
const locations: Location[] = rows.map(
  ([id, nl, en, b, cat, level, x, source, description, room], i) => {
    const f = `${b}-${level}`,
      y = i % 6 < 3 ? 230 : 330,
      corridor = x === 180 ? 'west' : x === 375 ? 'centre' : 'east';
    nodes.push({
      id: `loc-${id}`,
      building_id: b,
      floor_id: f,
      x,
      y,
      node_type: 'room_entrance',
      label: bi(nl, en),
      accessible: true,
      accessibility_status: 'unverified',
      verification_status: 'unverified',
    });
    edge(`${f}-${corridor}`, `loc-${id}`, 50);
    return {
      id,
      name: bi(nl, en),
      description: bi(description, english[id]),
      building_id: b,
      floor_id: f,
      category_id: cat,
      room_code: room,
      aliases: [nl, en, ...(room ? [room] : [])],
      node_id: `loc-${id}`,
      x,
      y,
      status: 'approved',
      routing_status: 'direct',
      endpoint_source: 'existing_mapping',
      verification_status: source === 'guide' ? 'needs_review' : 'verified',
      source_id: source,
      ...(id === 'library' || id === 'student-info'
        ? { hours_id: id === 'library' ? 'library' : 'student-info-contact' }
        : {}),
    };
  },
);
for (const b of buildings)
  locations.push({
    id: `${b.id}_MAIN`,
    name: bi(`Hoofdingang ${b.id}`, `Main entrance ${b.id}`),
    description: bi(
      'Ingangspositie is schematisch.',
      'Entrance position is schematic.',
    ),
    building_id: b.id,
    floor_id: `${b.id}-0`,
    category_id: 'entrance',
    aliases: [`receptie ${b.id}`, `reception ${b.id}`],
    node_id: `${b.id}-0-entry`,
    x: 375,
    y: 495,
    status: 'approved',
    routing_status: 'direct',
    endpoint_source: 'existing_mapping',
    verification_status: 'needs_review',
    source_id: 'guide',
    hours_id: b.id,
  });
const weekly = (open: string, close: string, friday = close) =>
  Object.fromEntries(
    [0, 1, 2, 3, 4, 5, 6].map((day) => [
      String(day),
      day === 0 || day === 6 ? [] : [[open, day === 5 ? friday : close]],
    ]),
  ) as Record<string, [string, string][]>;
export const seed: CampusData = {
  buildings,
  floors,
  locations,
  categories,
  nodes,
  edges,
  sources,
  qr: buildings.map((b) => ({
    code: `${b.id}_MAIN_ENTRANCE`,
    route_node_id: `${b.id}-0-entry`,
    label: `Hoofdingang ${b.id}`,
    active: true,
  })),
  hours: [
    {
      id: 'R8',
      weekly: weekly('07:30', '18:00'),
      source_url: sources[0].url,
      source_type: 'official_web' as const,
      source_description:
        'Official NHL Stenden Leeuwarden campus page for Rengerslaan 8 building access.',
      hours_kind: 'building_access' as const,
      display_note: bi(
        'Gebouwuren; vakanties en extreem weer kunnen afwijken.',
        'Building hours; holidays and extreme weather may differ.',
      ),
      verification_status: 'verified' as const,
      exceptions_reviewed_through: '2026-10-11',
    },
    {
      id: 'R10',
      weekly: weekly('07:30', '22:00', '18:00'),
      source_url: sources[0].url,
      source_type: 'official_web' as const,
      source_description:
        'Official NHL Stenden Leeuwarden campus page for Rengerslaan 10 building access.',
      hours_kind: 'building_access' as const,
      display_note: bi(
        'Gebouwuren; vakanties en extreem weer kunnen afwijken.',
        'Building hours; holidays and extreme weather may differ.',
      ),
      verification_status: 'verified' as const,
      exceptions_reviewed_through: '2026-10-11',
    },
    {
      id: 'library',
      weekly: weekly('08:30', '17:00'),
      source_url: sources[2].url,
      source_type: 'official_web' as const,
      source_description: 'Official NHL Stenden library opening-hours page.',
      hours_kind: 'physical_opening' as const,
      display_note: bi(
        'Tijdens de herfstvakantie, 12 t/m 16 oktober 2026, is de bibliotheek geopend van 09:00 tot 13:00.',
        'During the autumn break, 12–16 October 2026, the library is open from 09:00 to 13:00.',
      ),
      verification_status: 'verified' as const,
      exceptions_reviewed_through: '2026-10-16',
      exceptions: Object.fromEntries(
        [12, 13, 14, 15, 16].map((day) => [
          `2026-10-${day}`,
          [['09:00', '13:00'] as [string, string]],
        ]),
      ),
    },
    {
      id: 'student-info-contact',
      weekly: weekly('08:30', '16:30'),
      source_url:
        'https://www.nhlstenden.com/werken-en-studeren/kom-in-contact',
      source_type: 'official_web' as const,
      source_description: 'Official NHL Stenden Student Info contact page.',
      hours_kind: 'service_contact' as const,
      display_note: bi(
        'Dit zijn telefoontijden. WhatsApp is op werkdagen bereikbaar van 09:30 tot 16:30; fysieke balie-uren zijn niet bevestigd.',
        'These are phone hours. WhatsApp is available on weekdays from 09:30 to 16:30; physical desk hours are not confirmed.',
      ),
      verification_status: 'verified' as const,
      exceptions_reviewed_through: '2026-10-11',
    },
    {
      id: 'bruze',
      weekly: {},
      source_url: sources[1].url,
      source_type: 'official_web' as const,
      source_description:
        'Official NHL Stenden Leeuwarden catering page; weekdays remain unspecified.',
      hours_kind: 'physical_opening' as const,
      display_note: bi(
        'De officiële cateringpagina noemt 09:00–18:00, maar vermeldt geen weekdagen. Daarom tonen we geen open/gesloten-claim.',
        'The official catering page states 09:00–18:00 but does not specify weekdays, so no open/closed claim is shown.',
      ),
      verification_status: 'needs_review' as const,
      exceptions_reviewed_through: null,
    },
  ].map((hours) => ({
    exceptions: {},
    ...hours,
    verified_at: checked,
    timezone: 'Europe/Amsterdam' as const,
  })),
  tips: [
    {
      id: 'room-code',
      title: bi('Een lokaalnummer lezen', 'Read a room number'),
      body: bi(
        'F3.025? F is de zone, 3 de verdieping en 025 het lokaalnummer. Bij R8 staat de verdieping vóór de punt. Controleer altijd je gebouw.',
        'F3.025? F is the zone, 3 the floor and 025 the room number. At R8, the number before the dot indicates the floor. Always check the building.',
      ),
      icon: 'door',
      published: true,
    },
    {
      id: 'buildings',
      title: bi('R8 of R10? Even checken.', 'R8 or R10? Check first.'),
      body: bi(
        'Rengerslaan 8 en 10 liggen tegenover elkaar. Kijk vóór vertrek naar het gebouw bij je lokaal. De campusverbinding loopt buiten.',
        'Rengerslaan 8 and 10 face each other. Check the building before heading to your room. The campus connection is outside.',
      ),
      icon: 'map',
      published: true,
    },
    {
      id: 'help',
      title: bi(
        'Je hoeft het niet alleen te weten',
        'You don’t have to know everything',
      ),
      body: bi(
        'Student Info helpt met praktische studievragen. Kun je een lokaal niet vinden? Vraag bij de receptie naar de actuele locatie.',
        'Student Info helps with practical study questions. Can’t find a room? Ask reception for its current location.',
      ),
      icon: 'info',
      published: true,
    },
    {
      id: 'study',
      title: bi('Een tussenuur voor jezelf', 'A break between classes'),
      body: bi(
        'In de bibliotheek kun je studeren en bronnen zoeken. Bekijk de actuele openingstijden; in vakanties kunnen die afwijken.',
        'Visit the library to study and find resources. Check current hours; holiday opening times may differ.',
      ),
      icon: 'book',
      published: true,
    },
    {
      id: 'qr',
      title: bi('Scan. Zoek. Op weg.', 'Scan. Search. Go.'),
      body: bi(
        'Een CampusKompas QR-code vult je startpunt in. Controleer het label en kies daarna je bestemming. QR-locaties worden pas na campusvalidatie geplaatst.',
        'A CampusKompas QR code sets your starting point. Check the label, then select your destination. QR locations are placed only after campus validation.',
      ),
      icon: 'qr',
      published: true,
    },
    {
      id: 'install',
      title: bi('Je campus in je broekzak', 'Your campus in your pocket'),
      body: bi(
        'Open het deelmenu in Safari en kies Zet op beginscherm. In Chrome vind je Installeren of Toevoegen aan startscherm in het menu.',
        'In Safari, open Share and choose Add to Home Screen. In Chrome, use Install or Add to Home screen from the menu.',
      ),
      icon: 'phone',
      published: true,
    },
  ],
};
