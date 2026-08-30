import { motion, AnimatePresence } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type StackedListItem = {
  id: string;
  title: string;
  subtitle?: string;
  meta?: string;
  avatar?: string | null;
  badge?: number;
  accessory?: ReactNode;
};

/**
 * Animated, stacked conversation/notification list.
 * Items animate in with a soft spring and lift on hover/selection.
 */
export function StackedList({
  items,
  activeId,
  onSelect,
  emptyLabel = "Nothing here yet",
  className,
}: {
  items: StackedListItem[];
  activeId?: string | null;
  onSelect?: (id: string) => void;
  emptyLabel?: string;
  className?: string;
}) {
  if (items.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        {emptyLabel}
      </p>
    );
  }

  return (
    <ul className={cn("space-y-1.5", className)}>
      <AnimatePresence initial={false}>
        {items.map((item, index) => (
          <motion.li
            key={item.id}
            layout
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 420, damping: 34, delay: Math.min(index * 0.03, 0.3) }}
          >
            <button
              type="button"
              onClick={() => onSelect?.(item.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-colors",
                activeId === item.id
                  ? "border-primary bg-primary/5"
                  : "border-transparent bg-card hover:border-border",
              )}
            >
              <span className="relative shrink-0">
                {item.avatar ? (
                  <img
                    src={item.avatar}
                    alt=""
                    className="h-12 w-12 rounded-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {item.title.slice(0, 1).toUpperCase()}
                  </span>
                )}
                {item.badge ? (
                  <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                ) : null}
              </span>

              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-semibold">{item.title}</span>
                  {item.meta ? (
                    <span className="shrink-0 text-[11px] text-muted-foreground">{item.meta}</span>
                  ) : null}
                </span>
                {item.subtitle ? (
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                    {item.subtitle}
                  </span>
                ) : null}
              </span>

              {item.accessory}
            </button>
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}
