import { seed } from '@/lib/campus/seed';
import type { CampusData } from '@/lib/campus/types';
import { configured, publicDb } from './supabase';
export async function getCampus(): Promise<{
  data: CampusData;
  connected: boolean;
  unavailable: boolean;
}> {
  if (!configured())
    return { data: seed, connected: false, unavailable: false };
  try {
    const db = publicDb();
    const tables = {
      buildings: 'buildings',
      floors: 'floors',
      locations: 'locations',
      categories: 'location_categories',
      nodes: 'route_nodes',
      edges: 'route_edges',
      tips: 'first_year_tips',
      hours: 'opening_hours',
      sources: 'source_records',
      qr: 'qr_locations',
    };
    const rows = await Promise.all(
      Object.entries(tables).map(async ([key, table]) => {
        const rows:unknown[]=[];
        for(let offset=0;;offset+=500){
          const {data,error}=await db.from(table).select('*').order(table==='qr_locations'?'code':'id').range(offset,offset+499);
          if(error) throw error;
          rows.push(...data);
          if(data.length<500)break;
        }
        return [key, rows] as const;
      }),
    );
    return {
      data: Object.fromEntries(rows) as CampusData,
      connected: true,
      unavailable: false,
    };
  } catch {
    return { data: {buildings:[],floors:[],locations:[],categories:[],nodes:[],edges:[],tips:[],hours:[],sources:[],qr:[]}, connected: false, unavailable: true };
  }
}
