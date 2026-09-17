import { describe, expect, it } from 'vitest';
import {
  searchStudyInfo,
  studyCategories,
  studyInfoItems,
} from '@/lib/campus/about-study';

describe('About the study content', () => {
  it('contains the seven supplied topics in three maintainable categories', () => {
    expect(studyInfoItems.map((item) => item.id)).toEqual([
      'nhl-stenden',
      'oer',
      'exam-board',
      'study-facilities',
      'what-is-leisure',
      'function-of-leisure',
      'events',
    ]);
    expect(studyCategories.map((category) => category.id)).toEqual([
      'all',
      'nhl-stenden',
      'education',
      'leisure-events',
    ]);
  });

  it('keeps complete supplied Dutch prose unchanged', () => {
    expect(studyInfoItems[0].content.nl[0]).toEqual({
      type: 'paragraph',
      text: 'NHL Stenden Hogeschool is een internationale hogeschool met locaties in Nederland en daarbuiten. Studenten kunnen er verschillende opleidingen volgen en krijgen veel aandacht voor praktijkgericht leren. Samenwerken, persoonlijke ontwikkeling en voorbereiding op de beroepspraktijk staan centraal.',
    });
    expect(studyInfoItems[2].content.nl[0]).toEqual({
      type: 'paragraph',
      text: 'De examencommissie zorgt ervoor dat examens en toetsing eerlijk en volgens de regels verlopen. De commissie behandelt onder andere verzoeken van studenten, bijzondere situaties en vragen over examens en studievoortgang.',
    });
  });

  it('marks only incomplete project text and keeps the received Leisure outlines', () => {
    expect(
      studyInfoItems
        .filter((item) => item.awaitingFullProjectText)
        .map((item) => item.id),
    ).toEqual([
      'exam-board',
      'what-is-leisure',
      'function-of-leisure',
      'events',
    ]);
    expect(studyInfoItems[4].content.nl).toContainEqual({
      type: 'paragraph',
      text: 'Leisure als vrijetijdsbesteding.',
    });
  });

  it.each([
    ['leisure', ['what-is-leisure', 'function-of-leisure']],
    ['vrije tijd', ['what-is-leisure', 'function-of-leisure']],
    ['examencommissie', ['exam-board']],
    ['OER', ['oer']],
    ['evenement', ['events']],
    ['Leisure & Events', ['what-is-leisure', 'function-of-leisure', 'events']],
  ])('finds %s in titles, content and keywords', (query, expected) => {
    expect(searchStudyInfo(query, 'nl').map((item) => item.id)).toEqual(
      expected,
    );
  });

  it('finds both relevant education cards for examen', () => {
    expect(searchStudyInfo('examen', 'nl').map((item) => item.id)).toEqual([
      'exam-board',
      'oer',
    ]);
  });

  it('combines category filtering with search and supports English', () => {
    expect(
      searchStudyInfo('', 'nl', 'leisure-events').map((item) => item.id),
    ).toEqual(['what-is-leisure', 'function-of-leisure', 'events']);
    expect(searchStudyInfo('study facilities', 'en')[0].id).toBe(
      'study-facilities',
    );
  });
});
