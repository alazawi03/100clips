import { cn, hueFrom } from "@/lib/cn";

const sizes = {
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
  className?: string;
};

/** Placeholder avatar: the first letter on a tint picked from the id, standing in for a photo. */
export function Avatar({ id, name, size = "md", ring, className }: AvatarProps) {
  const hue = hueFrom(id);
  const face = (
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
