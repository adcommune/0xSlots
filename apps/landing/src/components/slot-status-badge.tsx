import { Badge } from "@/components/ui/badge";

export function SlotStatusBadge({
  occupant,
  insolvent,
}: {
  occupant: string | null | undefined;
  insolvent: boolean;
}) {
  const variant = insolvent ? "destructive" : occupant ? "default" : "secondary";
  const label = insolvent ? "INSOLVENT" : occupant ? "OCCUPIED" : "VACANT";

  return (
    <Badge variant={variant} className="text-[10px]">
      {label}
    </Badge>
  );
}
