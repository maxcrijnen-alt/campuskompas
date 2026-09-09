/** Manually traced centre lines in the published guide (pages 18–25).
 * Coordinates are percentages of the ORIGINAL page, never the old schematic.
 * These are plan-based previews, not surveyed walking/accessibility data.
 * Only nearby labels can be associated; an association is NOT a doorway.
 * Disconnected wings stay disconnected until a connection is verified.
 */
export type PlanLine = {floor:string; zone:string; points:[number,number][]};
export const planLines:PlanLine[]=[
 {floor:'R8-0',zone:'main',points:[[10,38.8],[25.8,38.8],[29.8,38.8],[29.8,55.5],[29.8,68.8],[35.2,68.8],[35.2,78.5]]},
 {floor:'R8-0',zone:'entrance',points:[[24,55.5],[29.8,55.5]]},
 {floor:'R8-0',zone:'east',points:[[35.2,68.8],[39.5,67.4],[43,70.5],[47,75],[53,77.5],[63,77.5]]},
 {floor:'R8-0',zone:'north',points:[[14,29.2],[25.8,29.2],[25.8,38.8]]},
 {floor:'R8-1',zone:'main',points:[[8,42.7],[25.6,42.7],[25.6,68.8],[35.2,68.8],[35.2,79.5],[44.5,79.5],[44.5,93.8]]},
 {floor:'R8-1',zone:'north',points:[[13.2,42.7],[13.2,28.7],[25.6,28.7],[25.6,42.7]]},
 {floor:'R8-1',zone:'A',points:[[25.6,54],[31.5,54],[33.3,51],[33.3,41.5]]},
 {floor:'R8-2',zone:'main',points:[[8,42.8],[25.5,42.8],[25.5,69.4],[35.5,69.4],[35.5,79.5],[44.5,79.5],[44.5,93.8]]},
 {floor:'R8-2',zone:'A',points:[[25.5,54.8],[30,54.8],[34,54.8],[34,39.5]]},
 {floor:'R8-3',zone:'main',points:[[34.6,68.2],[34.6,71.7],[34.6,76.7],[34.6,81.5]]},
 {floor:'R10-0',zone:'main',points:[[39.4,87.1],[44.5,87.1],[44.5,74.5],[46.5,64],[47,62],[47,58.5],[47,52],[47,46.9]]},
 {floor:'R10-0',zone:'F',points:[[37,46.9],[47,46.9]]},
 {floor:'R10-0',zone:'B',points:[[44.5,74.5],[39,75],[35,75],[34,77.8],[24,77.8],[18,75.7]]},
 {floor:'R10-0',zone:'B',points:[[35,75],[31,65.4],[26,65.4],[26,61],[23,61]]},
 {floor:'R10-0',zone:'C',points:[[47,62],[62,61],[71,61],[78,61],[86,61]]},
 {floor:'R10-0',zone:'C',points:[[71,61],[71,56],[73,52.5],[78,48],[79.5,43]]},
 {floor:'R10-1',zone:'main',points:[[44,85.5],[44,80],[46.4,77.5],[46.4,68],[47,62],[47,57],[47,46.9]]},
 {floor:'R10-1',zone:'F',points:[[34,45.9],[42,44.8],[47,44.3],[47,46.9]]},
 {floor:'R10-1',zone:'B',points:[[44,80],[35.8,80],[35.8,76.7],[22.8,76.7],[16.5,79.2]]},
 {floor:'R10-1',zone:'C',points:[[47,62],[56,61.5],[66,61.5],[77,61.5],[85,61.5]]},
 {floor:'R10-2',zone:'F',points:[[12,48.2],[24,46.5],[34,45.2],[47.5,43.5],[47.5,45.5]]},
 {floor:'R10-2',zone:'G',points:[[47.5,43.5],[63,41.5],[76,39.8],[85,38.5],[87.4,60.3],[90.4,74.2]]},
 {floor:'R10-2',zone:'E',points:[[12,48.2],[10.5,49],[12.7,65],[14.9,84.5],[14.7,86.5]]},
 {floor:'R10-2',zone:'D',points:[[14.7,86.5],[29,87],[44,87.5],[55,88],[65,88.5]]},
 {floor:'R10-2',zone:'B',points:[[14.9,84.5],[15.5,79.8],[34.7,79.8],[44.2,79.8],[45,83.5]]},
 {floor:'R10-2',zone:'C',points:[[44.2,79.8],[44.2,71.5],[51,69.5],[55,64],[61.5,65.5],[65,68]]},
 {floor:'R10-3',zone:'F',points:[[12,49.5],[24,47.9],[34,46.5],[47,44.8],[47,47.3]]},
 {floor:'R10-3',zone:'G',points:[[47,44.8],[63,42.6],[76,40.9],[85.5,39.7],[87.7,61.3],[90.5,74]]},
 {floor:'R10-3',zone:'E',points:[[12,49.5],[10.6,50.5],[13,66.5],[14.9,80.5],[15.5,86.8]]},
 {floor:'R10-3',zone:'D',points:[[15.5,86.8],[28,87.1],[44,87.6],[55,88.1],[66,88.5]]},
];
export const planTransitions = [
 {kind:'elevator' as const,points:[['R8-0',35.2,68.8],['R8-1',35.2,68.8],['R8-2',35.5,69.4],['R8-3',34.6,71.7]] as [string,number,number][]},
 {kind:'stairs' as const,points:[['R10-0',47,46.9],['R10-1',47,46.9],['R10-2',47.5,45.5],['R10-3',47,47.3]] as [string,number,number][]},
];
