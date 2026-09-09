export type CampusEvent =
  | 'search'
  | 'search_no_results'
  | 'location_view'
  | 'accessible_route_start'
  | 'tip_view'
  | 'data_report_submit'
  | 'qr_entry'
  | 'route_start'
  | 'route_unavailable'
  | 'route_complete'
  | 'gem_view'
  | 'gem_submit'
  | 'gem_like';
type Tracker = (
  event: CampusEvent,
  properties: Record<string, string | number | boolean>,
) => void;
let tracker: Tracker = () => {};
export function setAnalyticsAdapter(adapter: Tracker) {
  tracker = adapter;
}
export function track(
  event: CampusEvent,
  properties: Record<string, string | number | boolean> = {},
) {
  // Analytics must never break navigation or receive raw search/message contents.
  try {
    tracker(event, properties);
  } catch {
    /* Adapter failures are non-fatal. */
  }
}
