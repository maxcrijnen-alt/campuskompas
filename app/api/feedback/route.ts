import { saveCommunity } from '@/lib/server/community';
import { failure } from '@/lib/server/http';
export async function POST(request:Request){try{return await saveCommunity(request,'feedback');}catch(error){return failure(error);}}
