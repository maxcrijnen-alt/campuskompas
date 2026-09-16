import type { MetadataRoute } from 'next';
import { brand } from '@/lib/campus/brand';
export default function sitemap(): MetadataRoute.Sitemap {
  return ['', '/map', '/gems', '/tips', '/study-info'].map((path) => ({
    url: brand.origin + path,
  }));
}
