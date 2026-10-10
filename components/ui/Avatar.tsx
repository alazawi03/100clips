import Image from "next/image";
import { cn, hueFrom } from "@/lib/cn";

const sizes = {
  "2xs": "size-5 text-[9px]",
  xs: "size-7 text-[11px]",
  sm: "size-8 text-[13px]",
  md: "size-10 text-[15px]",
  lg: "size-14 text-[20px]",
  xl: "size-20 text-[28px]",
} as const;

type AvatarProps = {
  id: string;
  name: string;
  size?: keyof typeof sizes;
  /** "new": gradient story ring (new clips). "seen": border ring. */
  ring?: "new" | "seen";
  /** The creator's photo; without one, the first letter on a tint. Uploaded photos skip optimisation. */
  src?: string;
  className?: string;
};

/** The creator's photo, or the first letter on a tint picked from the id. */
export function Avatar({ id, name, size = "md", ring, src, className }: AvatarProps) {
  const hue = hueFrom(id);
  const face = src ? (
    <span role="img" aria-label={name} className={cn("relative inline-block shrink-0 overflow-hidden rounded-full", sizes[size], !ring && className)}>
      <Image src={src} alt="" fill unoptimized className="object-cover" />
    </span>
  ) : (
    <span
      role="img"
      aria-label={name}
      className={cn("inline-grid shrink-0 place-items-center rounded-full font-medium leading-none", sizes[size], !ring && className)}
      style={{ backgroundColor: `oklch(0.9 0.05 ${hue})`, color: `oklch(0.38 0.09 ${hue})` }}
    >
      {name.trim().charAt(0)}
    </span>
  );
  if (!ring) return face;
  return (
    <span className={cn("inline-grid shrink-0 rounded-full p-[2px]", ring === "new" ? "bg-brand-gradient" : "bg-border", className)}>
      <span className="grid rounded-full bg-card p-[2px]">{face}</span>
    </span>
  );
}
