import { z } from 'zod';
import { id } from './validation';
const protection = { website: z.string().max(0), started_at: z.number().positive() };
export const reportSchema = z.object({
  entity_type: z.enum(['location','missing_location']), entity_id: id.nullable(),
  searched_code: z.string().trim().max(100).optional(),
  report_type: z.enum(['wrong_location','missing_room','wrong_hours','facility_gone','other','missing_location']),
  message: z.string().trim().max(1200).default(''), ...protection,
}).strict().refine(v=>v.entity_type==='location'?!!v.entity_id:v.entity_id===null&&v.report_type==='missing_location');
export const feedbackSchema = z.object({ context:z.enum(['search','location','route']), entity_id:id.nullable(), helpful:z.boolean(), message:z.string().trim().max(400).default(''), ...protection }).strict();
