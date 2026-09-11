import { amsterdamClock, HOURS_STALE_AFTER_DAYS } from './hours';
import type { Category, Gem, Hours, Location } from './types';

export type HoursAuditReport = {
  approvedLocations: number;
  hoursRelevantFacilities: number;
  locationsWithHours: number;
  verified: number;
  needsReview: number;
  unverified: number;
  physicalOpeningSchedules: number;
  buildingAccessSchedules: number;
  serviceContactSchedules: number;
  sourceTypeCounts: Record<Hours['source_type'], number>;
  invalidProvenance: string[];
  staleVerifiedAt: string[];
  exceptionRecords: number;
  exceptionDates: number;
  semanticallySuspiciousLinks: string[];
  orphanHoursRecords: string[];
  facilitiesWithoutConfirmedHours: string[];
  physicalVerificationOrSourceUpdateNeeded: string[];
  irrelevantLocationsWithoutHoursIgnored: number;
  criticalIssueCount: number;
};

const DAY_MS = 86_400_000;

export function auditOpeningHours(
  input: {
    locations: Location[];
    categories: Category[];
    hours: Hours[];
    gems?: Gem[];
  },
  currentDate = amsterdamClock().date,
): HoursAuditReport {
  const approved = input.locations.filter(
    (location) => location.status === 'approved',
  );
  const categories = new Map(
    input.categories.map((category) => [category.id, category]),
  );
  const hours = new Map(input.hours.map((record) => [record.id, record]));
  const gems = input.gems ?? [];
  const relevant = approved.filter(
    (location) => categories.get(location.category_id)?.hours_relevant === true,
  );
  const linkedIds = new Set([
    ...input.locations.flatMap((location) =>
      location.hours_id ? [location.hours_id] : [],
    ),
    ...gems.flatMap((gem) => (gem.hours_id ? [gem.hours_id] : [])),
  ]);
  const suspicious: string[] = [];

  for (const location of approved) {
    if (!location.hours_id) continue;
    const record = hours.get(location.hours_id);
    if (!record) {
      suspicious.push(
        `${location.id}: missing hours record ${location.hours_id}`,
      );
      continue;
    }
    const relevantToCategory =
      categories.get(location.category_id)?.hours_relevant === true;
    if (!relevantToCategory)
      suspicious.push(
        `${location.id}: hours linked to non-hours category ${location.category_id}`,
      );
    if (
      record.hours_kind === 'building_access' &&
      location.category_id !== 'entrance'
    )
      suspicious.push(
        `${location.id}: building hours linked outside an entrance`,
      );
    if (
      record.hours_kind === 'service_contact' &&
      !['info', 'service', 'reception'].includes(location.category_id)
    )
      suspicious.push(
        `${location.id}: contact hours linked to ${location.category_id}`,
      );
  }

  for (const gem of gems) {
    if (gem.hours_id && !hours.has(gem.hours_id))
      suspicious.push(`${gem.id}: missing hours record ${gem.hours_id}`);
  }

  const now = Date.parse(`${currentDate}T12:00:00Z`);
  const staleVerifiedAt = input.hours
    .filter((record) => {
      if (record.verification_status !== 'verified') return false;
      const verified = Date.parse(`${record.verified_at}T12:00:00Z`);
      return (
        !Number.isFinite(verified) ||
        verified > now ||
        now - verified > HOURS_STALE_AFTER_DAYS * DAY_MS
      );
    })
    .map((record) => record.id);
  const withoutConfirmed = relevant
    .filter((location) => {
      const record = location.hours_id
        ? hours.get(location.hours_id)
        : undefined;
      return !record || record.verification_status !== 'verified';
    })
    .map((location) => location.id)
    .sort();
  const needsReviewGems = gems
    .filter(
      (gem) =>
        gem.status === 'approved' &&
        gem.hours_id &&
        hours.get(gem.hours_id)?.verification_status !== 'verified',
    )
    .map((gem) => `hidden-gem:${gem.title}`);
  const sourceTypes: Hours['source_type'][] = [
    'official_web',
    'physical_signage',
    'staff_confirmation',
    'manual_admin',
  ];
  const invalidProvenance = input.hours.flatMap((record) => {
    const failures: string[] = [];
    if (record.source_description.trim().length < 3)
      failures.push(`${record.id}: source description missing`);
    if (
      record.source_type === 'official_web' &&
      !record.source_url?.startsWith('https://')
    )
      failures.push(`${record.id}: official web source URL missing`);
    if (record.source_url && !record.source_url.startsWith('https://'))
      failures.push(`${record.id}: source URL is not HTTPS`);
    if (
      record.source_type === 'manual_admin' &&
      record.verification_status === 'verified'
    )
      failures.push(`${record.id}: manual admin source marked verified`);
    return failures;
  });
  const orphanHoursRecords = input.hours
    .filter((record) => !linkedIds.has(record.id))
    .map((record) => record.id);

  return {
    approvedLocations: approved.length,
    hoursRelevantFacilities: relevant.length,
    locationsWithHours: relevant.filter((location) =>
      Boolean(location.hours_id),
    ).length,
    verified: input.hours.filter(
      (record) => record.verification_status === 'verified',
    ).length,
    needsReview: input.hours.filter(
      (record) => record.verification_status === 'needs_review',
    ).length,
    unverified: input.hours.filter(
      (record) => record.verification_status === 'unverified',
    ).length,
    physicalOpeningSchedules: input.hours.filter(
      (record) => record.hours_kind === 'physical_opening',
    ).length,
    buildingAccessSchedules: input.hours.filter(
      (record) => record.hours_kind === 'building_access',
    ).length,
    serviceContactSchedules: input.hours.filter(
      (record) => record.hours_kind === 'service_contact',
    ).length,
    sourceTypeCounts: Object.fromEntries(
      sourceTypes.map((sourceType) => [
        sourceType,
        input.hours.filter((record) => record.source_type === sourceType)
          .length,
      ]),
    ) as Record<Hours['source_type'], number>,
    invalidProvenance,
    staleVerifiedAt,
    exceptionRecords: input.hours.filter(
      (record) => Object.keys(record.exceptions).length > 0,
    ).length,
    exceptionDates: input.hours.reduce(
      (count, record) => count + Object.keys(record.exceptions).length,
      0,
    ),
    semanticallySuspiciousLinks: suspicious,
    orphanHoursRecords,
    facilitiesWithoutConfirmedHours: withoutConfirmed,
    physicalVerificationOrSourceUpdateNeeded: [
      ...withoutConfirmed,
      ...needsReviewGems,
    ],
    irrelevantLocationsWithoutHoursIgnored: approved.filter(
      (location) =>
        !categories.get(location.category_id)?.hours_relevant &&
        !location.hours_id,
    ).length,
    criticalIssueCount:
      suspicious.length + invalidProvenance.length + orphanHoursRecords.length,
  };
}
