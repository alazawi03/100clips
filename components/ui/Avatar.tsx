import Image from "next/image";
import { cn } from "@/lib/cn";

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
  /** "new": pink story ring (new clips or an active campaign). "seen": border ring. */
  ring?: "new" | "seen";
  /** The creator's photo; without one, the first letter on pink-soft. Uploaded photos skip optimisation. */
  src?: string;
  className?: string;
};

/** The creator's photo, or the first letter on pink-soft (DESIGN.md: Avatar). */
export function Avatar({ name, size = "md", ring, src, className }: AvatarProps) {
  const face = src ? (
    <span role="img" aria-label={name} className={cn("relative inline-block shrink-0 overflow-hidden rounded-full", sizes[size], !ring && className)}>
      <Image src={src} alt="" fill unoptimized className="object-cover" />
    </span>
  ) : (
    <span
      role="img"
      aria-label={name}
      className={cn("inline-grid shrink-0 place-items-center rounded-full bg-brand-soft font-medium leading-none text-brand-on-soft", sizes[size], !ring && className)}
    >
      {name.trim().charAt(0)}
    </span>
  );
  if (!ring) return face;
  return (
    <span className={cn("inline-grid shrink-0 rounded-full p-[2px]", ring === "new" ? "bg-brand" : "bg-border", className)}>
      <span className="grid rounded-full bg-background p-[2px]">{face}</span>
    </span>
  );
}
