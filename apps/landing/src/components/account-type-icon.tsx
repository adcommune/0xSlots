import { User, File, Split } from "lucide-react";
import type { AccountType } from "@0xslots/sdk";

const CONFIG: Record<AccountType, { Icon: typeof User; label: string; className?: string }> = {
  EOA: { Icon: User, label: "EOA" },
  CONTRACT: { Icon: File, label: "Contract" },
  SPLIT: { Icon: Split, label: "Split", className: "rotate-90" },
};

export function AccountTypeIcon({
  type,
  className = "h-3.5 w-3.5",
}: {
  type: AccountType;
  className?: string;
}) {
  const { Icon, label, className: iconClassName } = CONFIG[type] ?? CONFIG.EOA;
  return (
    <span title={label}>
      <Icon
        className={`inline-block text-muted-foreground ${className} ${iconClassName ?? ""}`}
      />
    </span>
  );
}
