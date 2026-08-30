import { cn } from "@/lib/utils";
import { iconUrl } from "@/lib/icons";

export function AppIcon({
  name,
  className,
  alt,
}: {
  name: string;
  className?: string;
  alt?: string;
}) {
  return (
    <img
      src={iconUrl(name)}
      alt={alt ?? ""}
      aria-hidden={alt ? undefined : true}
      loading="lazy"
      className={cn("h-10 w-10 select-none object-contain", className)}
      draggable={false}
    />
  );
}
