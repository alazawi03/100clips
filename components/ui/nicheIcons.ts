import { Baby, Coffee, Dumbbell, Gamepad2, Plane, Shirt, Smartphone, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Niche } from "@/lib/data/types";

export const nicheIcon: Record<Niche, LucideIcon> = {
  beauty: Sparkles,
  food: Coffee,
  fashion: Shirt,
  tech: Smartphone,
  travel: Plane,
  fitness: Dumbbell,
  family: Baby,
  gaming: Gamepad2,
};
