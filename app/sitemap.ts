import type { MetadataRoute } from 'next';
import { brand } from '@/lib/campus/brand';
export default function sitemap(): MetadataRoute.Sitemap {
  return ['', '/map', '/over-de-studie', '/gems', '/tips'].map((path) => ({
    url: brand.origin + path,
  }));
}
