import type { Locale } from './types';

export type LocalizedText = Record<Locale, string>;

export type FirstYearSectionId = 'start' | 'leisure' | 'future';
export type FirstYearFilterId =
  | 'all'
  | FirstYearSectionId
  | 'nearby-events'
  | 'tips';

export type FirstYearContentBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: string[] };

export type FirstYearInfoItem = {
  id: string;
  title: LocalizedText;
  content: Record<Locale, [FirstYearContentBlock, ...FirstYearContentBlock[]]>;
  section: FirstYearSectionId;
  keywords: string[];
  icon: string;
  source?: {
    url: string;
    label: LocalizedText;
    type:
      | 'official'
      | 'academic'
      | 'organization'
      | 'professional-literature'
      | 'study-information';
  };
  internalLink?: {
    href: string;
    label: LocalizedText;
  };
};

export type FirstYearEvent = {
  id: string;
  title: LocalizedText;
  startDate: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  category: LocalizedText;
  location?: LocalizedText;
  sourceUrl: string;
  sourceLabel: LocalizedText;
  status: 'scheduled' | 'cancelled';
  keywords?: string[];
};

export type FirstYearEventState =
  | 'upcoming'
  | 'today'
  | 'ongoing'
  | 'past'
  | 'cancelled';

export const firstYearSections: Array<{
  id: Exclude<FirstYearFilterId, 'all'>;
  title: LocalizedText;
  description: LocalizedText;
}> = [
  {
    id: 'start',
    title: { nl: 'Starten bij NHL Stenden', en: 'Starting at NHL Stenden' },
    description: {
      nl: 'De belangrijkste begrippen, regels en voorzieningen voor je start.',
      en: 'The main concepts, rules and facilities for getting started.',
    },
  },
  {
    id: 'leisure',
    title: { nl: 'Leisure & Events', en: 'Leisure & Events' },
    description: {
      nl: 'Een korte basis over vrije tijd en evenementen.',
      en: 'A concise introduction to leisure and events.',
    },
  },
  {
    id: 'future',
    title: { nl: 'Jouw toekomst', en: 'Your future' },
    description: {
      nl: 'Actuele informatie over werk en doorstuderen na de Associate degree.',
      en: 'Current information about work and further study after the Associate degree.',
    },
  },
  {
    id: 'nearby-events',
    title: { nl: 'Evenementen in de buurt', en: 'Events nearby' },
    description: {
      nl: 'Actuele evenementen in en rond Leeuwarden, automatisch gesorteerd op datum.',
      en: 'Current events in and around Leeuwarden, automatically sorted by date.',
    },
  },
  {
    id: 'tips',
    title: { nl: 'Handige eerstejaars-tips', en: 'Useful first-year tips' },
    description: {
      nl: 'Praktische hulp voor lokalen, voorzieningen, routes en de Campus Tour.',
      en: 'Practical help with rooms, facilities, routes and the Campus Tour.',
    },
  },
];

export const firstYearFilters: Array<{
  id: FirstYearFilterId;
  label: LocalizedText;
}> = [
  { id: 'all', label: { nl: 'Alles', en: 'All' } },
  ...firstYearSections.map(({ id, title }) => ({ id, label: title })),
];

const rightsUrl =
  'https://www.nhlstenden.com/rechten-en-plichten-tijdens-je-studie';
const programmeStructureUrl =
  'https://www.nhlstenden.com/hbo-opleidingen/leisure-and-events-management-associate-degree-voltijd/studieopbouw';

export const firstYearInfoItems: FirstYearInfoItem[] = [
  {
    id: 'nhl-stenden',
    title: { nl: 'NHL Stenden', en: 'NHL Stenden' },
    content: {
      nl: [
        {
          type: 'paragraph',
          text: 'NHL Stenden Hogeschool is een internationale hogeschool met locaties in Nederland en daarbuiten. Studenten kunnen er verschillende opleidingen volgen en krijgen veel aandacht voor praktijkgericht leren. Samenwerken, persoonlijke ontwikkeling en voorbereiding op de beroepspraktijk staan centraal.',
        },
      ],
      en: [
        {
          type: 'paragraph',
          text: 'NHL Stenden University of Applied Sciences is an international university of applied sciences with locations in the Netherlands and abroad. Students can follow a range of programmes with a strong focus on practice-based learning. Collaboration, personal development and preparation for professional practice are central.',
        },
      ],
    },
    section: 'start',
    keywords: ['hogeschool', 'university', 'opleiding', 'praktijkgericht'],
    icon: 'compass',
  },
  {
    id: 'dbe',
    title: {
      nl: 'Design Based Education (DBE)',
      en: 'Design Based Education (DBE)',
    },
    content: {
      nl: [
        {
          type: 'paragraph',
          text: 'Op NHL Stenden wordt gebruikgemaakt van Design Based Education (DBE). Maar wat houdt dat eigenlijk in?',
        },
        {
          type: 'paragraph',
          text: 'DBE is een vorm van onderwijs waarin studenten leren door te doen. Studenten werken aan praktijkgerichte projecten waardoor ze vaardigheden die ze tijdens hun studie ontwikkelen direct leren toepassen.',
        },
        {
          type: 'paragraph',
          text: 'Je leert daardoor niet alleen uit boeken, maar ook door te onderzoeken, ontwerpen, testen en verbeteren. Het doel is dat studenten leren hoe ze hun kennis en vaardigheden kunnen gebruiken om oplossingen te vinden voor echte vraagstukken.',
        },
      ],
      en: [
        {
          type: 'paragraph',
          text: 'NHL Stenden uses Design Based Education (DBE). But what does that actually mean?',
        },
        {
          type: 'paragraph',
          text: 'DBE is a form of education in which students learn by doing. Students work on practice-based projects and directly apply the skills they develop during their studies.',
        },
        {
          type: 'paragraph',
          text: 'You learn not only from books, but also by researching, designing, testing and improving. The aim is to learn how to use knowledge and skills to find solutions to real-life questions.',
        },
      ],
    },
    section: 'start',
    keywords: [
      'dbe',
      'design based education',
      'design thinking',
      'praktijk',
      'prototypes',
      'testen',
      'experimenteren',
    ],
    icon: 'sparkles',
    source: {
      url: 'https://www.nhlstenden.com/studeren-bij-nhl-stenden/over-ons-onderwijssysteem',
      label: {
        nl: 'Officiële NHL Stenden-bron',
        en: 'Official NHL Stenden source',
      },
      type: 'official',
    },
  },
  {
    id: 'oer',
    title: {
      nl: 'Onderwijs- en Examenregeling (OER)',
      en: 'Education and Examination Regulations (OER)',
    },
    content: {
      nl: [
        {
          type: 'paragraph',
          text: 'De Onderwijs- en Examenregeling (OER) bevat de belangrijkste regels van je opleiding. Hierin staat onder andere hoe het onderwijs en de examens zijn geregeld, welke eisen je moet behalen en welke rechten en plichten je als student hebt.',
        },
      ],
      en: [
        {
          type: 'paragraph',
          text: 'The Education and Examination Regulations (OER) contain the main rules for your programme. They explain how education and examinations are organised, which requirements you must meet and which rights and responsibilities you have as a student.',
        },
      ],
    },
    section: 'start',
    keywords: ['oer', 'examen', 'regels', 'rechten', 'plichten', 'regulations'],
    icon: 'book',
    source: {
      url: rightsUrl,
      label: {
        nl: 'Officiële informatie — NHL Stenden',
        en: 'Official information — NHL Stenden',
      },
      type: 'official',
    },
  },
  {
    id: 'exam-board',
    title: { nl: 'Examencommissie', en: 'Examination board' },
    content: {
      nl: [
        {
          type: 'paragraph',
          text: 'De examencommissie zorgt ervoor dat examens en toetsing volgens de regels verlopen. De commissie behandelt onder andere verzoeken van studenten, bijzondere situaties en vragen rondom examens en studievoortgang.',
        },
      ],
      en: [
        {
          type: 'paragraph',
          text: 'The examination board ensures that examinations and assessments follow the applicable rules. The board handles matters including student requests, exceptional circumstances and questions about examinations and study progress.',
        },
      ],
    },
    section: 'start',
    keywords: [
      'examencommissie',
      'examen',
      'toetsing',
      'studievoortgang',
      'examination board',
    ],
    icon: 'users',
    source: {
      url: rightsUrl,
      label: {
        nl: 'Regelingen en contactroute — NHL Stenden',
        en: 'Regulations and contact route — NHL Stenden',
      },
      type: 'official',
    },
  },
  {
    id: 'study-facilities',
    title: { nl: 'Studiefaciliteiten', en: 'Study facilities' },
    content: {
      nl: [
        {
          type: 'paragraph',
          text: 'NHL Stenden biedt verschillende studiefaciliteiten om studenten te helpen bij hun studie. Denk aan bibliotheken, studieplekken, computers, online leeromgevingen en begeleiding. Zo kunnen studenten op verschillende manieren zelfstandig en samen studeren.',
        },
      ],
      en: [
        {
          type: 'paragraph',
          text: 'NHL Stenden offers various study facilities to support students in their studies. These include libraries, study areas, computers, online learning environments and guidance. This gives students different ways to study independently and together.',
        },
      ],
    },
    section: 'start',
    keywords: [
      'bibliotheek',
      'studieplek',
      'computers',
      'library',
      'facilities',
    ],
    icon: 'book',
    internalLink: {
      href: '/map?to=library',
      label: { nl: 'Bekijk bibliotheek op kaart', en: 'View library on map' },
    },
  },
  {
    id: 'ppo-portfolio',
    title: { nl: 'PPO & Portfolio', en: 'PPO & Portfolio' },
    content: {
      nl: [
        {
          type: 'paragraph',
          text: 'Gedurende je opleiding bouw je zelf een portfolio op. Je portfolio laat jouw persoonlijke en professionele ontwikkeling zien. Het bestaat uit eigen werk, opdrachten, resultaten en ander bewijs waarmee je kunt laten zien hoe je je hebt ontwikkeld.',
        },
        {
          type: 'paragraph',
          text: 'Dit komt samen met je persoonlijke professionele ontwikkeling. Je werkt aan je persoonlijke groei en professionele vaardigheden.',
        },
        {
          type: 'paragraph',
          text: 'Je portfolio vormt bewijs van die ontwikkeling. Dat bewijs kan bijvoorbeeld bestaan uit opdrachten, feedback en reflecties.',
        },
        {
          type: 'paragraph',
          text: 'PPO — Persoonlijke Professionele Ontwikkeling is de term die het projectteam gebruikt. De actuele voltijdinformatie bevestigt praktijkopdrachten en leren door reflectie, maar noemt PPO of portfolio niet expliciet.',
        },
      ],
      en: [
        {
          type: 'paragraph',
          text: 'During your programme, you build your own portfolio. Your portfolio shows your personal and professional development. It contains your own work, assignments, results and other evidence that demonstrates how you have developed.',
        },
        {
          type: 'paragraph',
          text: 'This comes together with your personal professional development. You work on your personal growth and professional skills.',
        },
        {
          type: 'paragraph',
          text: 'Your portfolio provides evidence of that development. This evidence may include assignments, feedback and reflections.',
        },
        {
          type: 'paragraph',
          text: 'PPO — Personal Professional Development is the term used by the project team. The current full-time programme information confirms practical assignments and learning through reflection, but does not explicitly use PPO or portfolio.',
        },
      ],
    },
    section: 'start',
    keywords: [
      'ppo',
      'portfolio',
      'persoonlijke professionele ontwikkeling',
      'feedback',
      'reflectie',
    ],
    icon: 'users',
    source: {
      url: programmeStructureUrl,
      label: {
        nl: 'Actuele studieopbouw — NHL Stenden',
        en: 'Current programme structure — NHL Stenden',
      },
      type: 'official',
    },
  },
  {
    id: 'what-is-leisure',
    title: { nl: 'Wat is Leisure?', en: 'What is Leisure?' },
    content: {
      nl: [
        {
          type: 'paragraph',
          text: 'De term Leisure verwijst naar vrijetijdsbesteding. In de vroegmoderne tijd werd vrije tijd voornamelijk gezien als een luxe en was die dus niet vanzelfsprekend.',
        },
        {
          type: 'paragraph',
          text: 'Na de Industriële Revolutie veranderde dit. Werktijden werden steeds duidelijker vastgelegd, werkdagen werden korter en er ontstond een duidelijkere scheiding tussen werk en vrije tijd.',
        },
        {
          type: 'paragraph',
          text: 'Naarmate mensen meer vrije tijd kregen, groeide ook de behoefte aan vrijetijdsbesteding en ontstonden verschillende vormen van leisure, zoals sociale activiteiten, hobby’s en andere manieren om vrije tijd te besteden.',
        },
        {
          type: 'paragraph',
          text: 'Leisure omvat activiteiten die mensen in hun vrije tijd doen voor bijvoorbeeld ontspanning, plezier of persoonlijke ontwikkeling.',
        },
      ],
      en: [
        {
          type: 'paragraph',
          text: 'The term leisure refers to how people spend their free time. In the early modern period, free time was mainly seen as a luxury and was therefore not taken for granted.',
        },
        {
          type: 'paragraph',
          text: 'This changed after the Industrial Revolution. Working hours became more clearly defined, working days became shorter and a clearer separation developed between work and free time.',
        },
        {
          type: 'paragraph',
          text: 'As people gained more free time, the need for leisure activities also grew. Different forms of leisure emerged, including social activities, hobbies and other ways of spending free time.',
        },
        {
          type: 'paragraph',
          text: 'Leisure includes activities people do in their free time for purposes such as relaxation, enjoyment or personal development.',
        },
      ],
    },
    section: 'leisure',
    keywords: [
      'leisure',
      'vrije tijd',
      'vrijetijdsbesteding',
      'industrial revolution',
    ],
    icon: 'sparkles',
    source: {
      url: 'https://studenttheses.uu.nl/server/api/core/bitstreams/2009b384-021b-49e0-a466-d4c21e08204d/content',
      label: {
        nl: 'Academische bron — Universiteit Utrecht',
        en: 'Academic source — Utrecht University',
      },
      type: 'academic',
    },
  },
  {
    id: 'function-of-leisure',
    title: {
      nl: 'Wat is de functie van Leisure?',
      en: 'What is the function of Leisure?',
    },
    content: {
      nl: [
        {
          type: 'paragraph',
          text: 'Leisure kan verschillende functies hebben en bijvoorbeeld bijdragen aan persoonlijke ontwikkeling. Je kunt nieuwe interesses ontdekken, nieuwe ervaringen opdoen en ontdekken wie je bent buiten studie en werk.',
        },
        {
          type: 'paragraph',
          text: 'Leisure heeft ook een sociale functie. Vrijetijdsactiviteiten kunnen mensen met elkaar in contact brengen en bijdragen aan het opbouwen en onderhouden van sociale relaties.',
        },
        {
          type: 'paragraph',
          text: 'Daarnaast kan vrije tijd ruimte geven voor ontspanning en herstel van dagelijkse verplichtingen en inspanning. Daarmee kan leisure bijdragen aan welzijn en kwaliteit van leven.',
        },
      ],
      en: [
        {
          type: 'paragraph',
          text: 'Leisure can have different functions and can, for example, contribute to personal development. You can discover new interests, gain new experiences and learn who you are outside study and work.',
        },
        {
          type: 'paragraph',
          text: 'Leisure also has a social function. Leisure activities can bring people into contact with one another and help build and maintain social relationships.',
        },
        {
          type: 'paragraph',
          text: 'Free time can also provide room for relaxation and recovery from everyday obligations and effort. In this way, leisure can contribute to wellbeing and quality of life.',
        },
      ],
    },
    section: 'leisure',
    keywords: ['leisure', 'vrije tijd', 'ontwikkeling', 'sociaal', 'welzijn'],
    icon: 'heart',
    source: {
      url: 'https://www.worldleisure.org/about-us/',
      label: {
        nl: 'World Leisure Organization',
        en: 'World Leisure Organization',
      },
      type: 'organization',
    },
  },
  {
    id: 'events-definition',
    title: { nl: 'Wat zijn evenementen?', en: 'What are events?' },
    content: {
      nl: [
        {
          type: 'paragraph',
          text: 'Een evenement is een vooraf georganiseerde en tijdelijke gebeurtenis die gericht is op een bepaalde doelgroep en een specifiek doel heeft.',
        },
        {
          type: 'paragraph',
          text: 'Evenementen kunnen worden onderverdeeld in verschillende groepen, zoals:',
        },
        {
          type: 'list',
          items: [
            'culturele evenementen',
            'sportevenementen',
            'publieke evenementen',
            'sociale evenementen',
            'netwerkevenementen',
            'zakelijke evenementen',
          ],
        },
        {
          type: 'paragraph',
          text: 'Een evenement kan binnen meerdere categorieën vallen. Dit is afhankelijk van het doel, de doelgroep en de inhoud.',
        },
      ],
      en: [
        {
          type: 'paragraph',
          text: 'An event is a pre-organised and temporary occurrence aimed at a particular target group and with a specific purpose.',
        },
        {
          type: 'paragraph',
          text: 'Events can be divided into different groups, such as:',
        },
        {
          type: 'list',
          items: [
            'cultural events',
            'sports events',
            'public events',
            'social events',
            'networking events',
            'business events',
          ],
        },
        {
          type: 'paragraph',
          text: 'An event can fall into several categories. This depends on its purpose, target group and content.',
        },
      ],
    },
    section: 'leisure',
    keywords: ['evenement', 'evenementen', 'event', 'events', 'doelgroep'],
    icon: 'compass',
    source: {
      url: 'https://www.projectmanagement10edruk.nl/documenten/wat_is_een_evenement.pdf',
      label: {
        nl: 'Vakliteratuur — Projectmanagement',
        en: 'Professional literature — Project Management',
      },
      type: 'professional-literature',
    },
  },
  {
    id: 'career-after-ad',
    title: {
      nl: 'Jouw toekomst na de Associate degree',
      en: 'Your future after the Associate degree',
    },
    content: {
      nl: [
        {
          type: 'paragraph',
          text: 'De Associate degree Leisure & Events Management bereidt je voor op functies in de vrijetijdsindustrie. NHL Stenden noemt op de actuele voltijdpagina onder andere:',
        },
        {
          type: 'list',
          items: [
            'assistent-manager bij een theater of beursorganisatie',
            'stagemanager bij poppodia',
            'evenementencoördinator of eventplanner',
            'sport- of recreatiecoördinator',
            'projectcoördinator',
          ],
        },
        {
          type: 'paragraph',
          text: 'Na de Associate degree kun je ook doorstromen naar het derde jaar van de bacheloropleiding. Bekijk de officiële pagina voor de actuele mogelijkheden.',
        },
      ],
      en: [
        {
          type: 'paragraph',
          text: 'The Leisure & Events Management Associate degree prepares you for roles in the leisure industry. On its current full-time programme page, NHL Stenden lists roles including:',
        },
        {
          type: 'list',
          items: [
            'assistant manager at a theatre or exhibition organisation',
            'stage manager at a music venue',
            'event coordinator or event planner',
            'sports or recreation coordinator',
            'project coordinator',
          ],
        },
        {
          type: 'paragraph',
          text: 'After the Associate degree, you can also progress to the third year of the bachelor programme. Check the official page for the latest options.',
        },
      ],
    },
    section: 'future',
    keywords: ['toekomst', 'beroepen', 'doorstuderen', 'carrière', 'career'],
    icon: 'compass',
    source: {
      url: 'https://www.nhlstenden.com/hbo-opleidingen/leisure-and-events-management-associate-degree-voltijd/jouw-toekomst',
      label: {
        nl: 'Jouw toekomst — NHL Stenden voltijd',
        en: 'Your future — NHL Stenden full-time',
      },
      type: 'official',
    },
  },
  {
    id: 'study-choice-123',
    title: {
      nl: 'Na deze studie — Studiekeuze123',
      en: 'After this programme — Studiekeuze123',
    },
    content: {
      nl: [
        {
          type: 'paragraph',
          text: 'Studiekeuze123 geeft actuele informatie over onder andere beroepen van afgestudeerden, de arbeidsmarkt, de aansluiting tussen studie en beroep, salarisgegevens en mogelijke vervolgstappen. Cijfers kunnen veranderen; bekijk daarom altijd de actuele bron.',
        },
      ],
      en: [
        {
          type: 'paragraph',
          text: 'Studiekeuze123 provides current information about subjects including graduate occupations, the labour market, the connection between study and work, salary data and possible next steps. Figures can change, so always check the current source.',
        },
      ],
    },
    section: 'future',
    keywords: [
      'studiekeuze123',
      'arbeidsmarkt',
      'salaris',
      'beroep',
      'toekomst',
    ],
    icon: 'book',
    source: {
      url: 'https://www.studiekeuze123.nl/studies/80040-leisure-management-hbo-associate-degree',
      label: { nl: 'Bekijk Studiekeuze123', en: 'View Studiekeuze123' },
      type: 'study-information',
    },
  },
];

export const firstYearEvents: FirstYearEvent[] = [
  {
    id: 'friesland-pop-pizza-party-2026',
    title: { nl: 'Friesland Pop Pizza Party', en: 'Friesland Pop Pizza Party' },
    startDate: '2026-09-23',
    startTime: '16:00',
    category: { nl: 'Muziek & netwerk', en: 'Music & networking' },
    location: {
      nl: 'Neushoorn Café, Leeuwarden',
      en: 'Neushoorn Café, Leeuwarden',
    },
    sourceUrl: 'https://www.neushoorn.nl/events/pizza-party',
    sourceLabel: { nl: 'Neushoorn', en: 'Neushoorn' },
    status: 'cancelled',
  },
  {
    id: 'museumnacht-frl-2026',
    title: { nl: 'Museumnacht FRL', en: 'Museum Night FRL' },
    startDate: '2026-09-26',
    startTime: '19:00',
    endTime: '23:00',
    category: { nl: 'Cultuur & museum', en: 'Culture & museum' },
    location: {
      nl: 'Fries Museum, Leeuwarden',
      en: 'Fries Museum, Leeuwarden',
    },
    sourceUrl: 'https://www.friesmuseum.nl/activiteiten/museumnacht-2026',
    sourceLabel: { nl: 'Fries Museum', en: 'Fries Museum' },
    status: 'scheduled',
  },
  {
    id: 'let-op-hier-volgt-een-mening-2026',
    title: {
      nl: 'Let op! Hier volgt een mening',
      en: 'Please note! An opinion follows',
    },
    startDate: '2026-09-29',
    startTime: '19:30',
    endTime: '21:00',
    category: { nl: 'Lezing & dialoog', en: 'Lecture & dialogue' },
    location: { nl: 'De Beurs, Leeuwarden', en: 'De Beurs, Leeuwarden' },
    sourceUrl:
      'https://www.nhlstenden.com/evenementen/let-op-hier-volgt-een-mening-over-hoe-we-kunnen-leren-om-in-dialoog-te-komen-met-elkaar',
    sourceLabel: { nl: 'NHL Stenden', en: 'NHL Stenden' },
    status: 'scheduled',
  },
  {
    id: 'weekend-van-de-wetenschap-leeuwarden-2026',
    title: {
      nl: 'Weekend van de Wetenschap — Leeuwarden',
      en: 'Weekend of Science — Leeuwarden',
    },
    startDate: '2026-10-03',
    endDate: '2026-10-04',
    category: { nl: 'Wetenschap', en: 'Science' },
    location: { nl: 'Leeuwarden', en: 'Leeuwarden' },
    sourceUrl: 'https://weekendvandewetenschap.nl/hotspots/leeuwarden/2026/',
    sourceLabel: {
      nl: 'Weekend van de Wetenschap',
      en: 'Weekend of Science',
    },
    status: 'scheduled',
  },
  {
    id: 'heropening-de-harmonie-2026',
    title: { nl: 'Heropening De Harmonie', en: 'De Harmonie reopening' },
    startDate: '2026-10-03',
    endDate: '2026-10-04',
    startTime: '15:00',
    category: { nl: 'Theater & cultuur', en: 'Theatre & culture' },
    location: { nl: 'De Harmonie, Leeuwarden', en: 'De Harmonie, Leeuwarden' },
    sourceUrl: 'https://harmonie.nl/openingsweekend',
    sourceLabel: { nl: 'De Harmonie', en: 'De Harmonie' },
    status: 'scheduled',
  },
  {
    id: 'popronde-leeuwarden-2026',
    title: { nl: 'Popronde Leeuwarden', en: 'Popronde Leeuwarden' },
    startDate: '2026-10-09',
    category: { nl: 'Muziekfestival', en: 'Music festival' },
    location: { nl: 'Binnenstad Leeuwarden', en: 'Leeuwarden city centre' },
    sourceUrl: 'https://popronde.nl/steden/leeuwarden',
    sourceLabel: { nl: 'Popronde', en: 'Popronde' },
    status: 'scheduled',
  },
  {
    id: 'acqua-forte-parade-2026',
    title: { nl: 'Acqua Forte Parade', en: 'Acqua Forte Parade' },
    startDate: '2026-10-09',
    endDate: '2026-10-11',
    category: { nl: 'Watertheater', en: 'Water theatre' },
    location: {
      nl: 'Noordersingel / Prinsentuin, Leeuwarden',
      en: 'Noordersingel / Prinsentuin, Leeuwarden',
    },
    sourceUrl: 'https://visitleeuwarden.com/acqua-forte-parade/',
    sourceLabel: { nl: 'Visit Leeuwarden', en: 'Visit Leeuwarden' },
    status: 'scheduled',
  },
  {
    id: 'the-grave-rave-2026',
    title: { nl: 'The Grave Rave', en: 'The Grave Rave' },
    startDate: '2026-10-24',
    startTime: '22:00',
    category: { nl: 'Muziek', en: 'Music' },
    location: {
      nl: 'Neushoorn Café, Leeuwarden',
      en: 'Neushoorn Café, Leeuwarden',
    },
    sourceUrl: 'https://www.neushoorn.nl/events/the-grave-rave',
    sourceLabel: { nl: 'Neushoorn', en: 'Neushoorn' },
    status: 'cancelled',
  },
  {
    id: 'minormarkt-leeuwarden-2026',
    title: { nl: 'Minormarkt Leeuwarden', en: 'Minor Market Leeuwarden' },
    startDate: '2026-10-27',
    startTime: '10:00',
    endTime: '13:00',
    category: { nl: 'Studie & oriëntatie', en: 'Study & orientation' },
    location: {
      nl: 'NHL Stenden, Rengerslaan 8 & 10',
      en: 'NHL Stenden, Rengerslaan 8 & 10',
    },
    sourceUrl: 'https://www.nhlstenden.com/minormarkt',
    sourceLabel: { nl: 'NHL Stenden', en: 'NHL Stenden' },
    status: 'scheduled',
  },
  {
    id: 'noordelijk-film-festival-2026',
    title: { nl: 'Noordelijk Film Festival', en: 'Noordelijk Film Festival' },
    startDate: '2026-11-04',
    endDate: '2026-11-08',
    category: { nl: 'Filmfestival', en: 'Film festival' },
    location: {
      nl: 'Diverse locaties, Leeuwarden',
      en: 'Various venues, Leeuwarden',
    },
    sourceUrl: 'https://noordelijkfilmfestival.nl',
    sourceLabel: {
      nl: 'Noordelijk Film Festival',
      en: 'Noordelijk Film Festival',
    },
    status: 'scheduled',
  },
  {
    id: 'explore-the-north-2026',
    title: { nl: 'Explore the North', en: 'Explore the North' },
    startDate: '2026-11-20',
    endDate: '2026-11-22',
    category: { nl: 'Festival', en: 'Festival' },
    location: { nl: 'Binnenstad Leeuwarden', en: 'Leeuwarden city centre' },
    sourceUrl: 'https://explorethenorth.nl',
    sourceLabel: { nl: 'Explore the North', en: 'Explore the North' },
    status: 'scheduled',
  },
];

export function localizeFirstYearText(text: LocalizedText, locale: Locale) {
  return text[locale];
}

export function normalizeFirstYearSearch(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function contentBlockText(block: FirstYearContentBlock) {
  return block.type === 'paragraph' ? block.text : block.items.join(' ');
}

export function searchFirstYearInfo(
  query: string,
  locale: Locale,
  section: 'all' | FirstYearSectionId = 'all',
  items = firstYearInfoItems,
) {
  const needle = normalizeFirstYearSearch(query);

  return items.filter((item) => {
    if (section !== 'all' && item.section !== section) return false;
    if (!needle) return true;

    const sectionText = firstYearSections.find(
      (entry) => entry.id === item.section,
    )!.title[locale];
    const haystack = normalizeFirstYearSearch(
      [
        item.title.nl,
        item.title.en,
        sectionText,
        ...item.keywords,
        ...item.content.nl.map(contentBlockText),
        ...item.content.en.map(contentBlockText),
      ].join(' '),
    );
    return haystack.includes(needle);
  });
}

export function getAmsterdamDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Amsterdam',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';
  return `${value('year')}-${value('month')}-${value('day')}`;
}

export function getFirstYearEventState(
  event: FirstYearEvent,
  now = new Date(),
): FirstYearEventState {
  if (event.status === 'cancelled') return 'cancelled';

  const today = getAmsterdamDate(now);
  const endDate = event.endDate ?? event.startDate;
  if (endDate < today) return 'past';
  if (event.startDate <= today) {
    return event.startDate === endDate ? 'today' : 'ongoing';
  }
  return 'upcoming';
}

export function getVisibleFirstYearEvents(
  now = new Date(),
  query = '',
  locale: Locale = 'nl',
  events = firstYearEvents,
) {
  const needle = normalizeFirstYearSearch(query);
  const seen = new Set<string>();

  return events
    .filter(
      (event) =>
        !['past', 'cancelled'].includes(getFirstYearEventState(event, now)),
    )
    .filter((event) => {
      const canonicalKey = event.sourceUrl.toLowerCase();
      if (seen.has(canonicalKey)) return false;
      seen.add(canonicalKey);
      return true;
    })
    .filter((event) => {
      if (!needle) return true;
      const haystack = normalizeFirstYearSearch(
        [
          event.title.nl,
          event.title.en,
          event.category.nl,
          event.category.en,
          event.location?.nl ?? '',
          event.location?.en ?? '',
          event.sourceLabel.nl,
          event.sourceLabel.en,
          ...(event.keywords ?? []),
          firstYearSections.find((section) => section.id === 'nearby-events')!
            .title[locale],
          'evenement event',
        ].join(' '),
      );
      return haystack.includes(needle);
    })
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
}
