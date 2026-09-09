import { CampusApp } from '@/components/campus/app';
import { getCampus } from '@/lib/server/data';
export default async function Page({
  params,
}: {
  params: Promise<{ path?: string[] }>;
}) {
  const { path } = await params;
  return <CampusApp {...await getCampus()} initialTarget={path?.[1]} />;
}
