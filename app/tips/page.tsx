import { CampusApp } from '@/components/campus/app';
import { getCampus } from '@/lib/server/data';
export const dynamic='force-dynamic';
export default async function Page() {
  return <CampusApp {...await getCampus()} view="tips" />;
}
