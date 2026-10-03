import Image from "next/image";
import { cn, hueFrom } from "@/lib/cn";

const sizes = {
  sm: "size-8 text-[13px]",
  md: "size-10 text-[15px]",
  lg: "size-14 text-[20px]",
  xl: "size-20 text-[28px]",
} as const;

type BrandLogoProps = { id: string; name: string; src?: string; size?: keyof typeof sizes; className?: string };

/**
 * A brand's logo in a rounded square. The logo is optional: without one we show the brand's first letter.
 * Uploaded logos are data URLs, so they skip image optimisation.
 */
export function BrandLogo({ id, name, src, size = "md", className }: BrandLogoProps) {
  const hue = hueFrom(id);
  return (
    <span
      className={cn("relative inline-grid shrink-0 place-items-center overflow-hidden rounded-[var(--radius-md)] border border-border font-medium", sizes[size], className)}
      style={src ? undefined : { backgroundColor: `oklch(0.9 0.05 ${hue})`, color: `oklch(0.38 0.09 ${hue})` }}
    >
      {src ? <Image src={src} alt="" fill unoptimized className="object-cover" /> : <span aria-hidden>{name.trim().charAt(0)}</span>}
    </span>
  );
}
