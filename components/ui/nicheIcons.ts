import { Baby, Coffee, Dumbbell, Gamepad2, LayoutGrid, Plane, Shirt, Smartphone, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Niche } from "@/lib/data/types";

/** Line art for placeholder clip posters. Category names elsewhere use the emojis in lib/data/emojis.ts. */
export const nicheIcon: Record<Niche, LucideIcon> = {
  general: LayoutGrid,
  beauty: Sparkles,
  food: Coffee,
  fashion: Shirt,
  tech: Smartphone,
  travel: Plane,
  fitness: Dumbbell,
  family: Baby,
  gaming: Gamepad2,
};
