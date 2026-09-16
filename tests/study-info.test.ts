import { describe, expect, it } from 'vitest';
import { searchStudyInfo, studyInfoItems } from '@/lib/campus/study-info';

describe('study information search', () => {
  it('returns all source-backed topics for an empty query', () => {
    expect(searchStudyInfo('', 'nl')).toHaveLength(8);
    expect(
      studyInfoItems.every((item) => item.sourceUrl.startsWith('https://')),
    ).toBe(true);
  });

  it('ranks the examination board before related regulations and appeals', () => {
    const results = searchStudyInfo('examen commissie', 'nl');
    expect(results[0].id).toBe('exam-board');
    expect(results.map((item) => item.id)).toEqual(
      expect.arrayContaining(['oer', 'appeals-board']),
    );
  });

  it('is case, accent and spacing tolerant', () => {
    expect(searchStudyInfo('ONDERWIJS CATALOGUS', 'nl')[0].id).toBe(
      'study-catalogue',
    );
    expect(searchStudyInfo('responsibilities', 'en')[0].id).toBe(
      'rights-duties',
    );
  });

  it('returns an empty result for an unknown query', () => {
    expect(searchStudyInfo('onvindbareterm123', 'nl')).toEqual([]);
  });
});
