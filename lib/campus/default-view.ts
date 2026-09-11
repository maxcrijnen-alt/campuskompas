import type { CampusData } from './types';

export function defaultCampusFloorId(data: Pick<CampusData, 'floors'>) {
  return (
    data.floors.find(
      (candidate) => candidate.building_id === 'R8' && candidate.level === 0,
    )?.id ??
    data.floors.find((candidate) => candidate.building_id === 'R8')?.id ??
    data.floors[0]?.id ??
    ''
  );
}
