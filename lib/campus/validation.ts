import { z } from 'zod';
export const id = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-zA-Z0-9_-]+$/);
export const bilingual = z.object({
  nl: z.string().min(1).max(4000),
  en: z.string().min(1).max(4000),
});
export const verification = z.enum(['verified', 'needs_review', 'unverified']);
export const gemCategories = [
  'quiet',
  'study',
  'chill',
  'food',
  'coffee',
  'power',
  'view',
  'group',
  'other',
] as const;
export const gemSchema = z
  .object({
    title: z.string().trim().min(5).max(90),
    description: z.string().trim().min(15).max(1200),
    category: z.enum(gemCategories),
    location_id: id,
    website: z.string().max(0),
    started_at: z.number().positive(),
  })
  .strict();
export const photoLimit = 3 * 1024 * 1024;
export function imageType(
  bytes: Uint8Array,
): 'image/png' | 'image/jpeg' | 'image/webp' | null {
  if (bytes.length < 12) return null;
  if ([137, 80, 78, 71, 13, 10, 26, 10].every((b, i) => bytes[i] === b))
    return 'image/png';
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255)
    return 'image/jpeg';
  if (
    new TextDecoder().decode(bytes.slice(0, 4)) === 'RIFF' &&
    new TextDecoder().decode(bytes.slice(8, 12)) === 'WEBP'
  )
    return 'image/webp';
  return null;
}
export const shapeSchema = z
  .object({
    x: z.number().min(0).max(800),
    y: z.number().min(0).max(600),
    width: z.number().positive().max(800),
    height: z.number().positive().max(600),
    label: z.string().max(80).optional(),
    kind: z.enum(['hall', 'room', 'outside']),
  })
  .refine(
    (s) => s.x + s.width <= 800 && s.y + s.height <= 600,
    'Shape exceeds map bounds',
  );
const node = z.object({
  map_x:z.number().min(0).max(100).nullable().optional(),
  map_y:z.number().min(0).max(100).nullable().optional(),
  id,
  building_id: id,
  floor_id: id,
  x: z.number().min(0).max(800),
  y: z.number().min(0).max(600),
  node_type: z.enum([
    'corridor',
    'room_entrance',
    'main_entrance',
    'staircase',
    'elevator',
    'building_connector',
    'outdoor_connector',
    'waypoint',
  ]),
  label: bilingual,
  accessible: z.boolean(),
  accessibility_status: verification,
  verification_status: verification,
});
const edge = z
  .object({
    id,
    from_node_id: id,
    to_node_id: id,
    weight: z.number().positive().max(1000000),
    edge_type: z.enum(['corridor', 'stairs', 'elevator', 'outdoor']),
    accessible: z.boolean(),
    accessibility_status: verification,
    verification_status: verification,
    bidirectional: z.boolean(),
    map_path:z.array(z.tuple([z.number().min(0).max(100),z.number().min(0).max(100)])).min(2).max(500).nullable().optional(),
    source_id:id.nullable().optional(),
  })
  .refine((e) => e.from_node_id !== e.to_node_id, 'Self edges not allowed')
  .refine(
    (e) => e.edge_type !== 'stairs' || !e.accessible,
    'Stairs cannot be accessible',
  );
export const adminSchemas = {
  data_reports:z.object({id:z.uuid(),status:z.enum(['pending','resolved','rejected']),internal_note:z.string().max(4000).default('')}),
  user_feedback:z.object({id:z.uuid()}),
  source_records:z.object({id,title:z.string().min(1).max(200),url:z.url().startsWith('https://'),verified_at:z.iso.date(),verification_status:verification}),
  buildings: z.object({
    id,
    name: z.string().min(2).max(100),
    address: z.string().min(2).max(200),
  }),
  floors: z.object({
    id,
    building_id: id,
    level: z.number().int().min(-10).max(200),
    verification_status: verification,
    geometry: z.array(shapeSchema).max(3000),
  }),
  locations: z.object({
    map_x:z.number().min(0).max(100).nullable().optional(),
    map_y:z.number().min(0).max(100).nullable().optional(),
    source_page:z.number().int().positive().nullable().optional(),
    verification_notes:z.string().max(4000).optional(),
    id,
    name: bilingual,
    description: bilingual,
    building_id: id,
    floor_id: id,
    category_id: id,
    room_code: z.string().max(40).nullable().optional(),
    aliases: z.array(z.string().max(100)).max(50),
    node_id: id.nullable(),
    x: z.number().min(0).max(800),
    y: z.number().min(0).max(600),
    status: z.enum(['pending', 'approved', 'archived']),
    verification_status: verification,
    source_id: id,
    hours_id: id.nullable().optional(),
  }),
  rooms: z.object({
    id,
    code: z.string().min(2).max(40),
    location_id: id,
    public: z.boolean(),
  }),
  route_nodes: node,
  route_edges: edge,
  first_year_tips: z.object({
    id,
    title: bilingual,
    body: bilingual,
    icon: z.string().max(30),
    published: z.boolean(),
  }),
  qr_locations: z.object({
    code: id,
    route_node_id: id,
    label: z.string().min(1).max(100),
    active: z.boolean(),
  }),
  opening_hours: z.object({
    id,
    weekly: z.record(
      z.string().regex(/^[0-6]$/),
      z
        .array(
          z.tuple([
            z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
            z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
          ]),
        )
        .nullable(),
    ),
    exceptions: z.record(
      z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      z
        .array(
          z.tuple([
            z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
            z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
          ]),
        )
        .nullable(),
    ),
    verified_at: z.iso.date(),
    verification_status: verification,
    exceptions_reviewed_through: z.iso.date().nullable(),
    source_url: z.url().startsWith('https://'),
  }),
  hidden_gems: z.object({
    id: z.uuid(),
    title: z.string().min(5).max(90),
    description: z.string().min(15).max(1200),
    category: z.enum(gemCategories),
    location_id: id,
    status: z.enum(['pending', 'approved', 'rejected', 'archived']),
    featured: z.boolean(),
  }),
} as const;
export type AdminTable = keyof typeof adminSchemas;
