import type { Locale } from './types';
import { normalizeSearch } from '@/lib/routing/normalization';

type LocalizedText = Record<Locale, string>;

export type StudyInfoItem = {
  id: string;
  title: LocalizedText;
  summary: LocalizedText;
  keywords: string[];
  category: LocalizedText;
  sourceTitle: string;
  sourceUrl: string;
};

export const studyInfoItems: StudyInfoItem[] = [
  {
    id: 'student-info',
    title: { nl: 'Student Info', en: 'Student Info' },
    summary: {
      nl: 'Eerste aanspreekpunt voor praktische vragen over je studie, aanmelding, inschrijving, begeleiding, boeken en roosters.',
      en: 'Your first point of contact for practical questions about your programme, application, enrolment, support, books and timetables.',
    },
    keywords: [
      'student info',
      'aanmelden',
      'inschrijven',
      'rooster',
      'ondersteuning',
      'contact',
      'application',
      'enrolment',
      'timetable',
      'support',
    ],
    category: { nl: 'Hulp en contact', en: 'Help and contact' },
    sourceTitle: 'NHL Stenden · Student Info',
    sourceUrl:
      'https://www.nhlstenden.com/studeren-bij-nhl-stenden/student-info',
  },
  {
    id: 'study-start',
    title: { nl: 'Start van je studie', en: 'Starting your studies' },
    summary: {
      nl: 'Bekijk wat je na je aanmelding regelt, hoe je je inschrijving afrondt en waar je informatie over je eerste week, studentenpas en rooster vindt.',
      en: 'See what to arrange after applying, how to complete enrolment and where to find information about your first week, student card and timetable.',
    },
    keywords: [
      'start studie',
      'studystartweek',
      'eerste week',
      'studentenpas',
      'rooster',
      'inschrijving',
      'starting studies',
      'first week',
      'student card',
    ],
    category: { nl: 'Studiestart', en: 'Study start' },
    sourceTitle: 'NHL Stenden · Alles over de start van je studie',
    sourceUrl: 'https://www.nhlstenden.com/startstudie',
  },
  {
    id: 'oer',
    title: {
      nl: 'Onderwijs- en Examenregeling (OER)',
      en: 'Education and Examination Regulations (OER)',
    },
    summary: {
      nl: 'De OER bevat de afspraken voor jouw opleiding over inhoud en opbouw, studiepunten, tentamens, examens en toetsing.',
      en: 'The programme regulations cover structure and content, credits, tests, examinations and assessment rules for your programme.',
    },
    keywords: [
      'oer',
      'regeling',
      'examencommissie',
      'tentamen',
      'toetsing',
      'studiepunten',
      'regulations',
      'exam regulations',
      'assessment',
      'credits',
    ],
    category: { nl: 'Regelingen', en: 'Regulations' },
    sourceTitle: 'NHL Stenden · Rechten en plichten tijdens je studie',
    sourceUrl:
      'https://www.nhlstenden.com/rechten-en-plichten-tijdens-je-studie',
  },
  {
    id: 'rights-duties',
    title: { nl: 'Rechten en plichten', en: 'Rights and responsibilities' },
    summary: {
      nl: 'Vind het studentenstatuut en de officiële regelingen over onder meer in- en uitschrijving, collegegeld, voorzieningen en klachtenprocedures.',
      en: 'Find the student charter and official rules on enrolment, deregistration, tuition fees, facilities and complaints procedures.',
    },
    keywords: [
      'rechten plichten',
      'studentenstatuut',
      'klacht',
      'collegegeld',
      'uitschrijving',
      'rights duties',
      'student charter',
      'complaint',
      'tuition fees',
    ],
    category: { nl: 'Regelingen', en: 'Regulations' },
    sourceTitle: 'NHL Stenden · Rechten en plichten tijdens je studie',
    sourceUrl:
      'https://www.nhlstenden.com/rechten-en-plichten-tijdens-je-studie',
  },
  {
    id: 'exam-board',
    title: { nl: 'Examencommissie', en: 'Examination board' },
    summary: {
      nl: 'De examencommissie hoort bij je opleiding en neemt of borgt beslissingen rond examens en toetsing. Raadpleeg je opleidingsinformatie of Student Info voor de juiste commissie en contactgegevens.',
      en: 'The examination board is linked to your programme and makes or safeguards decisions about examinations and assessment. Check your programme information or Student Info for the correct board and contact details.',
    },
    keywords: [
      'examencommissie',
      'oer',
      'toetsing',
      'tentamen',
      'vrijstelling',
      'exam board',
      'assessment',
      'exemption',
    ],
    category: { nl: 'Examens en toetsing', en: 'Exams and assessment' },
    sourceTitle: 'NHL Stenden · Rechten en plichten tijdens je studie',
    sourceUrl:
      'https://www.nhlstenden.com/rechten-en-plichten-tijdens-je-studie',
  },
  {
    id: 'appeals-board',
    title: {
      nl: 'College van Beroep voor de Examens',
      en: 'Examination Appeals Board',
    },
    summary: {
      nl: 'Dit is niet de examencommissie. Onder voorwaarden kun je hier beroep instellen tegen bepaalde beslissingen van de examencommissie. Controleer altijd de officiële procedure en termijnen.',
      en: 'This is separate from the examination board. Under certain conditions, you can appeal particular examination-board decisions here. Always check the official procedure and deadlines.',
    },
    keywords: [
      'college van beroep examens',
      'cbe',
      'examencommissie',
      'beroep',
      'beslissing',
      'appeal',
      'exam board',
      'complaints desk',
    ],
    category: { nl: 'Beroep en klachten', en: 'Appeals and complaints' },
    sourceTitle: 'NHL Stenden · Klachtenloket',
    sourceUrl: 'https://www.nhlstenden.com/over-nhl-stenden/niet-tevreden',
  },
  {
    id: 'study-catalogue',
    title: { nl: 'Onderwijscatalogus', en: 'Study catalogue' },
    summary: {
      nl: 'Bekijk per opleiding en studiejaar de onderdelen, onderwerpen, werkvormen en toetsing van het onderwijs.',
      en: 'Browse programme components, subjects, teaching methods and assessment by programme and study year.',
    },
    keywords: [
      'onderwijscatalogus',
      'opleiding inhoud',
      'onderdelen',
      'werkvormen',
      'toetsing',
      'study catalogue',
      'programme content',
      'teaching methods',
      'assessment',
    ],
    category: { nl: 'Onderwijs', en: 'Education' },
    sourceTitle: 'NHL Stenden · Onderwijscatalogus',
    sourceUrl: 'https://www.nhlstenden.com/over-nhl-stenden/onderwijscatalogus',
  },
  {
    id: 'campus-tour',
    title: { nl: 'Campus Tour', en: 'Campus Tour' },
    summary: {
      nl: 'Verken tijdens een persoonlijke rondleiding de campus, studieplekken en belangrijke voorzieningen. Bekijk op de officiële pagina wanneer aanmelden mogelijk is.',
      en: 'Explore the campus, study areas and key facilities on a personal tour. Check the official page to see when registration is available.',
    },
    keywords: [
      'campus tour',
      'rondleiding',
      'campus leren kennen',
      'studieplekken',
      'tour',
      'guided tour',
      'study areas',
    ],
    category: { nl: 'Campus', en: 'Campus' },
    sourceTitle: 'NHL Stenden · Campus Tour',
    sourceUrl: 'https://www.nhlstenden.com/hulp-bij-studiekeuze/campustour',
  },
];

export function searchStudyInfo(
  query: string,
  locale: Locale,
  items = studyInfoItems,
) {
  const needle = normalizeSearch(query);
  if (!needle) return items;

  return items
    .map((item, index) => {
      const title = normalizeSearch(item.title[locale]);
      const keywords = item.keywords.map(normalizeSearch);
      const summary = normalizeSearch(item.summary[locale]);
      const category = normalizeSearch(item.category[locale]);
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
                  : summary.includes(needle)
                    ? 5
                    : category.includes(needle)
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
