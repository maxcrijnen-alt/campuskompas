import type { Locale } from './types';
import { normalizeSearch } from '@/lib/routing/normalization';

type LocalizedText = { nl: string; en?: string };

export type StudyCategoryId = 'nhl-stenden' | 'education' | 'leisure-events';

export type StudyContentBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: string[] };

export type StudyInfoItem = {
  id: string;
  title: LocalizedText;
  content: {
    nl: [StudyContentBlock, ...StudyContentBlock[]];
    en?: [StudyContentBlock, ...StudyContentBlock[]];
  };
  category: StudyCategoryId;
  keywords?: string[];
  icon: string;
  source?: {
    url: string;
    label: LocalizedText;
    type: 'official' | 'academic' | 'organization' | 'professional-literature';
  };
  awaitingFullProjectText?: boolean;
};

export const studyCategories: Array<{
  id: 'all' | StudyCategoryId;
  label: Record<Locale, string>;
}> = [
  { id: 'all', label: { nl: 'Alles', en: 'All' } },
  {
    id: 'nhl-stenden',
    label: { nl: 'NHL Stenden', en: 'NHL Stenden' },
  },
  { id: 'education', label: { nl: 'Onderwijs', en: 'Education' } },
  {
    id: 'leisure-events',
    label: { nl: 'Leisure & Events', en: 'Leisure & Events' },
  },
];

export const studyInfoItems: StudyInfoItem[] = [
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
    category: 'nhl-stenden',
    keywords: ['hogeschool', 'university', 'praktijkgericht', 'opleiding'],
    icon: 'compass',
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
    category: 'education',
    keywords: ['oer', 'examen', 'examens', 'regels', 'rights', 'regulations'],
    icon: 'book',
    source: {
      url: 'https://www.nhlstenden.com/rechten-en-plichten-tijdens-je-studie',
      label: {
        nl: 'Officiële bron — NHL Stenden',
        en: 'Official source — NHL Stenden',
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
          text: 'De examencommissie zorgt ervoor dat examens en toetsing eerlijk en volgens de regels verlopen. De commissie behandelt onder andere verzoeken van studenten, bijzondere situaties en vragen over examens en studievoortgang.',
        },
      ],
      en: [
        {
          type: 'paragraph',
          text: 'The examination board ensures that examinations and assessment are conducted fairly and according to the rules. Among other things, the board handles student requests, exceptional situations and questions about examinations and study progress.',
        },
      ],
    },
    category: 'education',
    keywords: [
      'examencommissie',
      'examen',
      'toetsing',
      'studievoortgang',
      'examination board',
      'assessment',
    ],
    icon: 'users',
    awaitingFullProjectText: true,
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
    category: 'nhl-stenden',
    keywords: [
      'studiefaciliteiten',
      'bibliotheek',
      'studieplek',
      'computers',
      'study facilities',
      'library',
    ],
    icon: 'book',
  },
  {
    id: 'what-is-leisure',
    title: { nl: 'Wat is Leisure?', en: 'What is Leisure?' },
    content: {
      nl: [
        { type: 'paragraph', text: 'Leisure als vrijetijdsbesteding.' },
        {
          type: 'list',
          items: [
            'De historische ontwikkeling van vrije tijd.',
            'Veranderingen rond industrialisering en werktijden.',
            'De groei van verschillende vrijetijdsactiviteiten.',
            'Ontspanning, plezier en persoonlijke ontwikkeling.',
          ],
        },
      ],
      en: [
        { type: 'paragraph', text: 'Leisure as a way of spending free time.' },
        {
          type: 'list',
          items: [
            'The historical development of free time.',
            'Changes around industrialisation and working hours.',
            'The growth of different leisure activities.',
            'Relaxation, enjoyment and personal development.',
          ],
        },
      ],
    },
    category: 'leisure-events',
    keywords: ['leisure', 'vrije tijd', 'vrijetijdsbesteding', 'free time'],
    icon: 'sparkles',
    source: {
      url: 'https://studenttheses.uu.nl/server/api/core/bitstreams/2009b384-021b-49e0-a466-d4c21e08204d/content',
      label: {
        nl: 'Academische bron — Universiteit Utrecht',
        en: 'Academic source — Utrecht University',
      },
      type: 'academic',
    },
    awaitingFullProjectText: true,
  },
  {
    id: 'function-of-leisure',
    title: {
      nl: 'Wat is de functie van Leisure?',
      en: 'What is the function of Leisure?',
    },
    content: {
      nl: [
        { type: 'paragraph', text: 'Persoonlijke ontwikkeling.' },
        {
          type: 'list',
          items: [
            'Ontdekken van interesses.',
            'Nieuwe ervaringen.',
            'Sociale contacten en relaties.',
            'Ontspanning.',
            'Herstel.',
            'Kwaliteit van leven.',
          ],
        },
      ],
      en: [
        { type: 'paragraph', text: 'Personal development.' },
        {
          type: 'list',
          items: [
            'Discovering interests.',
            'New experiences.',
            'Social contacts and relationships.',
            'Relaxation.',
            'Recovery.',
            'Quality of life.',
          ],
        },
      ],
    },
    category: 'leisure-events',
    keywords: [
      'leisure',
      'vrije tijd',
      'persoonlijke ontwikkeling',
      'sociale contacten',
      'quality of life',
    ],
    icon: 'heart',
    source: {
      url: 'https://www.worldleisure.org/about-us/',
      label: {
        nl: 'World Leisure Organization',
        en: 'World Leisure Organization',
      },
      type: 'organization',
    },
    awaitingFullProjectText: true,
  },
  {
    id: 'events',
    title: { nl: 'Wat zijn evenementen?', en: 'What are events?' },
    content: {
      nl: [
        {
          type: 'paragraph',
          text: 'Een evenement als vooraf georganiseerde en tijdelijke gebeurtenis.',
        },
        {
          type: 'list',
          items: [
            'Een bepaalde doelgroep.',
            'Een bepaald doel.',
            'Verschillende soorten evenementen.',
            'De mogelijkheid dat één evenement onder meerdere categorieën valt.',
          ],
        },
      ],
      en: [
        {
          type: 'paragraph',
          text: 'An event as a pre-organised and temporary occurrence.',
        },
        {
          type: 'list',
          items: [
            'A particular target group.',
            'A particular purpose.',
            'Different types of events.',
            'The possibility that one event falls into several categories.',
          ],
        },
      ],
    },
    category: 'leisure-events',
    keywords: ['evenement', 'evenementen', 'event', 'events', 'doelgroep'],
    icon: 'compass',
    source: {
      url: 'https://www.projectmanagement10edruk.nl/documenten/wat_is_een_evenement.pdf',
      label: {
        nl: 'Vakliteratuur — Projectmanagement / Boom',
        en: 'Professional literature — Project Management / Boom',
      },
      type: 'professional-literature',
    },
    awaitingFullProjectText: true,
  },
];

export function localizeStudyText(text: LocalizedText, locale: Locale) {
  return text[locale] ?? text.nl;
}

export function localizeStudyContent(item: StudyInfoItem, locale: Locale) {
  return item.content[locale] ?? item.content.nl;
}

function blockText(block: StudyContentBlock) {
  return block.type === 'paragraph' ? block.text : block.items.join(' ');
}

export function searchStudyInfo(
  query: string,
  locale: Locale,
  category: 'all' | StudyCategoryId = 'all',
  items = studyInfoItems,
) {
  const needle = normalizeSearch(query);
  const categoryLabel = (item: StudyInfoItem) =>
    studyCategories.find((entry) => entry.id === item.category)!.label[locale];

  return items
    .filter((item) => category === 'all' || item.category === category)
    .map((item, index) => {
      if (!needle) return { item, score: 0, index };

      const title = normalizeSearch(localizeStudyText(item.title, locale));
      const keywords = (item.keywords ?? []).map(normalizeSearch);
      const content = [
        ...item.content.nl.map(blockText),
        ...(item.content.en ?? []).map(blockText),
      ]
        .map(normalizeSearch)
        .join(' ');
      const categoryText = normalizeSearch(categoryLabel(item));
      const score =
        title === needle
          ? 0
          : title.startsWith(needle)
            ? 1
            : title.includes(needle)
              ? 2
              : keywords.some(
                    (keyword) =>
                      keyword === needle || keyword.startsWith(needle),
                  )
                ? 3
                : keywords.some((keyword) => keyword.includes(needle))
                  ? 4
                  : content.includes(needle)
                    ? 5
                    : categoryText === needle
                      ? 6
                      : null;
      return score == null ? null : { item, score, index };
    })
    .filter(
      (
        result,
      ): result is { item: StudyInfoItem; score: number; index: number } =>
        result !== null,
    )
    .sort((a, b) => a.score - b.score || a.index - b.index)
    .map(({ item }) => item);
}
