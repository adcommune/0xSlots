import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
        {Icon && <Icon className="size-3" />}
        {label}
      </p>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}
