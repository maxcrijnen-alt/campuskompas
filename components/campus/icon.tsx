import {
  BookOpen,
  Coffee,
  Utensils,
  DoorOpen,
  Info,
  Accessibility,
  Printer,
  Users,
  Heart,
  Bike,
  Car,
  Leaf,
  Map,
  QrCode,
  Smartphone,
  Footprints,
  Sparkles,
  Compass,
} from 'lucide-react';
const icons = {
  book: BookOpen,
  coffee: Coffee,
  food: Utensils,
  door: DoorOpen,
  info: Info,
  access: Accessibility,
  printer: Printer,
  users: Users,
  heart: Heart,
  bike: Bike,
  car: Car,
  leaf: Leaf,
  map: Map,
  qr: QrCode,
  phone: Smartphone,
  stairs: Footprints,
  sparkles: Sparkles,
  compass: Compass,
};
export function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const C = icons[name as keyof typeof icons] ?? Map;
  return <C size={size} aria-hidden="true" strokeWidth={1.8} />;
}
