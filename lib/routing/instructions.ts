import type { Locale } from '../campus/types';
import type { Route } from './graph';
export function instructions(route: Route, locale: Locale): string[] {
  const en = locale === 'en',
    steps = [
      en
        ? 'Start at ' + route.nodes[0].label.en
        : 'Start bij ' + route.nodes[0].label.nl,
    ];
  route.edges.forEach((e, i) => {
    const next = route.nodes[i + 1];
    if (e.edge_type === 'outdoor')
      steps.push(
        en
          ? 'Outside connection to ' + next.building_id
          : 'Buitenverbinding naar ' + next.building_id,
      );
    else if (e.edge_type === 'stairs' || e.edge_type === 'elevator')
      steps.push(
        (en
          ? e.edge_type === 'stairs'
            ? 'Stairs'
            : 'Lift'
          : e.edge_type === 'stairs'
            ? 'Trap'
            : 'Lift') +
          (en ? ' to floor ' : ' naar verdieping ') +
          next.floor_id.split('-').at(-1),
      );
    else if (i === route.edges.length - 1)
      steps.push((en ? 'Destination: ' : 'Bestemming: ') + next.label[locale]);
  });
  return steps;
}
